# Constitutional AI Protocol

Layer 3 — Governance
**draft-sato-soos-cap-04**
See full draft text: [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems need to be told what they cannot do — at a level that survives prompt injection, principal confusion, and model error. Not as a system prompt. As a kernel-enforced prohibition, evaluated before execution begins, with no override path for the agent.

CAP defines the protocol by which a SOOS kernel encodes, stores, evaluates, and enforces constitutional prohibitions: rules that apply to every agent, every mandate, every execution cycle — regardless of what the principal instructs or the agent intends.

**The design premise:** some limits are not negotiable, and a conforming system must make that non-negotiability machine-readable.

---

## Messages to key audiences

### IETF Working Groups

CAP is relevant to the WIMSE, OAUTH, SECEVENT, RATS, and SCITT working groups. It uses Cedar (Amazon open source) as its normative policy engine — the first IETF draft to declare Cedar as a normative dependency. The companion draft CAP-RRS is of direct interest to SCITT as a domain-specific application of supply-chain transparency principles to regulatory records.

Version -04 adds three points of direct WG relevance. First, the `SUSPENDED` CEE output introduces a formally defined evaluative uncertainty state, distinct from DENY, that arises from law amendment propagation — a novel problem class for protocol-layer governance. Second, the `catalog_version` schema and four-phase amendment propagation workflow (§8.9) are candidates for cross-reference with SCITT's versioning and transparency statement models. Third, the five new `soos.cap.*` OTel span attributes (§13.5) extend the SOOS governance telemetry namespace defined in GAR-03 and are relevant to NMOP and SACM discussions on operational observability of security enforcement.

The Tier 0-A governance model — which processes can place content in the absolute prohibition layer — remains an open architectural question that benefits from WG input. CAP does not assert authority to determine Tier 0-A content unilaterally.

To engage on CAP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a kernel-level constitutional prohibition layer means your agent's limits live in a system prompt — and system prompts can be overridden, manipulated, or ignored. A prohibition that lives in a system prompt is a guideline. A prohibition that lives in Cedar and is evaluated by the kernel before every action is a constraint.

CAP-04 adds three things that matter for production deployments. First, manipulation, performed emotion, and biometric signal inference are now Tier 0-A absolute prohibitions — kernel-refused, no-override, globally scoped. These aren't policies you configure; they're enforcement invariants that ship with every conforming implementation. Second, consent context from the session MJWT is now kernel-derived and Cedar-visible: `context.data_subject_consent`, `context.consent_purpose_codes`, and related fields are populated by the kernel at session start and cannot be overridden by the agent layer. Third, when a law changes and the governing catalog enters `SUSPENDED` state, agents receive `GOVERNANCE_SUSPENDED` rather than an opaque error — and the session stays open pending re-activation.

Without CAP: your agent's limits are as strong as its last system prompt. With CAP: your agent's limits are kernel-enforced, Cedar-evaluated, OTel-observable, and auditable.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/cap)

### Regulators and policy teams

CAP is the protocol-level answer to the regulatory question: "How do we ensure AI systems cannot take actions prohibited by law, regardless of what they are instructed to do?"

The answer is not policy compliance — it is protocol enforcement. CAP encodes prohibitions into Cedar policies that the kernel evaluates before every action. The prohibitions cannot be overridden by runtime instruction; they can only be modified through the governance process that produced them.

Version -04 is directly relevant to two active regulatory threads. For EU AI Act Article 5 compliance: manipulation (Art. 5(1)(a)) and biometric inference in public spaces (Art. 5(1)(d)) are now Tier 0-A prohibitions — kernel-refused globally, not only in EU-jurisdiction deployments. A conforming SOOS implementation satisfies these Article 5 prohibitions at the enforcement layer, before execution, not through post-hoc audit. For APPI and law amendment compliance: the four-phase catalog propagation workflow (§8.9) specifies exactly how a deployed GEC handles an amendment to a governing statute — detection within 24 hours, session suspension with `GOVERNANCE_SUSPENDED`, re-endorsement by the designated authority, and re-activation with full GAR trace.

The companion draft CAP-RRS provides the schema for encoding actual legal prohibitions as machine-readable Regulation Records. The Tier 0 OSCAL reference catalog, now published at `soosproject.ai/catalogs/tier0-reference-v1.json`, makes the absolute prohibition set inspectable by any OSCAL-conformant tool.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS CAP (Constitutional AI Protocol, draft-sato-soos-cap-04). This protocol uses Cedar as its policy engine to enforce constitutional prohibitions on AI agent actions before every GEC.transition() call. There are five prohibition tiers: Tier 0-A (absolute, no override — five classes including MANIPULATION, PERFORMED_EMOTION, BIOMETRIC_SIGNAL_INFERENCE added in -04), Tier 0-B (clearable with PCR), Tier 1 (jurisdictional), Tier 2 (operator ethics), Tier 3 (resource limits). The CEE has four outputs: PERMIT, CONSTITUTIONAL_VIOLATION, SUSPENDED (new in -04 — policy in amendment suspension, session stays open), and the tier-specific outputs TIER_1_DENY etc. The kernel must populate Cedar context from MJWT consent_scope at session start: context.data_subject_consent, context.consent_purpose_codes, context.consent_data_categories, context.consent_jurisdiction, context.consent_expiry, context.consent_source. These fields are kernel-derived and must not be overridable by the agent. On every Cedar evaluation, the kernel must emit five OTel span attributes: soos.cap.cedar_policy_id, soos.cap.cap_rrs_control_id, soos.cap.authority_source_uri, soos.cap.tier, soos.cap.conflict_detected."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `prohibition_tier` | enum | TIER_0A / TIER_0B / TIER_1 / TIER_2 / TIER_3 |
| `cedar_policy_id` | string | Reference to the Cedar policy that fired |
| `evaluation_result` | enum | PERMIT / CONSTITUTIONAL_VIOLATION / SUSPENDED / TIER_1_DENY / TIER_2_DENY |
| `catalog_version.version_id` | string | Semver of the governing catalog entry |
| `catalog_version.supersedes` | string | version_id of the entry this replaces |
| `ptd_endpoint` | URL | Policy Transparency Disclosure query endpoint |
| `disclosure_level` | enum | FULL / REDACTED / COUNT_ONLY |
| `context.data_subject_consent` | boolean | Kernel-derived from MJWT consent_scope |
| `soos.cap.tier` | OTel attribute | Tier of evaluated Cedar policy |
| `soos.cap.conflict_detected` | OTel attribute | true on ALE-NEW-02 events |

**Minimal Cedar policy examples:**

```cedar
// Tier 0-A absolute prohibition — unconditional DENY, no context conditions
forbid (
  principal,
  action == Action::"PerformManipulation",
  resource
);

// Tier 1 DATA_PROTECTION — DENY unless kernel-derived consent context present
forbid (
  principal,
  action == Action::"ProcessPersonalData",
  resource
)
unless {
  context.data_subject_consent == true &&
  context.consent_expiry > context.current_timestamp
};

// Tier 2 operator ethics — DENY with operator override path
forbid (
  principal,
  action == Action::"AccessExternalData",
  resource
)
unless {
  context.data_source_verified == true &&
  context.ingestion_trust_level >= 2
};
```

### Government and regulators

CAP provides the technical mechanism for jurisdictions to encode their legal prohibitions into AI enforcement at the kernel layer. Through the companion Constitutional Mandate Registry (CMR) and CAP-RRS, a regulatory prohibition — such as APPI Article 17 on purpose limitation — becomes a machine-readable record that any conforming SOOS implementation enforces as a Tier 0-A or Tier 1 prohibition, evaluated before execution, with a full audit trail in GAR.

Version -04 introduces two capabilities of direct relevance to the Japan government track. First, the four-phase catalog update propagation workflow (§8.9) formally specifies what happens when a Cabinet Office ordinance amends a statute governing an active deployment: the amendment is detected within 24 hours, the affected Cedar policy enters `SUSPENDED` state, in-flight sessions receive `GOVERNANCE_SUSPENDED` rather than a DENY, and the designated authority (内閣法制局 or equivalent for cross-statute amendments) re-endorses the updated catalog. The full suspension, re-endorsement, and re-activation trace is recorded in GAR with `endorsed_at` timestamps. Second, the Tier 0 OSCAL reference catalog at `https://soosproject.ai/catalogs/tier0-reference-v1.json` makes the absolute prohibition set machine-inspectable by any OSCAL-conformant tool — enabling デジタル庁 and IPA to verify the prohibition baseline of any deployed SOOS kernel against a published, versioned reference.

The Tier 0-A governance model follows international legal consensus as the threshold for absolute prohibitions. Jurisdictions that participate in the CMR founding period shape the Tier 1 encoding schema. Those that arrive later adopt it.

For collaboration on jurisdiction-specific regulation encoding: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents today enforce their limits through system prompts and model-layer compliance. Both can be overridden, manipulated, or ignored. There is no kernel-level mechanism for encoding prohibitions that survive instruction override, law amendment, or consent expiry.

**Mechanism:** CAP uses Cedar as a normative policy engine. Every prohibition is a Cedar policy evaluated by the kernel — not the agent — before any action is permitted. Tier 0-A rules are evaluated first, unconditionally. When a governing law is amended, the affected policy enters `SUSPENDED` state rather than silently failing, and the session stays open pending re-activation. Consent context from the session credential is kernel-derived and Cedar-visible — the agent cannot assert its own consent state.

**Output:** A Cedar evaluation record — the policy that fired, the action evaluated, the result — signed and recorded in GAR, with five OTel span attributes emitted on every evaluation for real-time observability.

**Who verifies it:** Regulators, compliance teams, and auditors who need to prove that a specific prohibition was enforced on a specific action by a specific agent — and that the governing law was current at the time of enforcement.

---

## The prohibition tier model

| Tier | Name | Override | Who sets it |
|---|---|---|---|
| **Tier 0-A** | Absolute prohibition | None. CEE DENY is final. | RFC Only — IETF process |
| **Tier 0-B** | Treaty-anchored, clearable | PCR from operator + Audit Principal | Operator, with signed PCR |
| **Tier 1** | Jurisdictional legal | None within jurisdiction (PCM for exceptions) | Operator + Audit Principal |
| **Tier 2** | Operator ethical standard | Operator override at SO Type level | Operator |
| **Tier 3** | Resource / usage policy | Always: commercial, scope reduction, temporal | Operator / policy author |

**Tier 0-A is the constitutional floor.** As of CAP-04, five classes are Tier 0-A: CSAM, GENOCIDE_FACILITATION, MANIPULATION, PERFORMED_EMOTION, and BIOMETRIC_SIGNAL_INFERENCE. None can be cleared by any PCR, court order, or regulatory authority. Every SOOS implementation ships with all five enforced. Operators may add to the floor. No one may subtract from it without producing a non-conforming implementation.

**The SUSPENDED state** is new in -04. When a governing law changes and the corresponding catalog entry is under amendment review, the affected Cedar policy enters SUSPENDED state. Agents receive `GOVERNANCE_SUSPENDED` — not a DENY. The session remains open. This preserves the distinction between "this action is prohibited" and "we cannot evaluate this action right now." Sessions that completed before the suspension are protected by 信頼保護 safe harbor: a prior PERMIT stands, with `endorsed_at` in the GAR record.

---

## New in CAP-04 — Three Tier 0-A prohibitions

These three classes join CSAM and GENOCIDE_FACILITATION as globally unclearable absolute prohibitions. They apply to every SOOS deployment, every jurisdiction, regardless of operator configuration.

**MANIPULATION** — An agent must not take an action that satisfies all three conditions simultaneously: (1) intended to influence a human's belief, decision, or behavior; (2) the mechanism exploits a cognitive bias, emotional vulnerability, or information asymmetry in the target; and (3) the agent or its principal benefits at the material expense of the target. Honest persuasion through accurate information and transparent reasoning is not prohibited.

**PERFORMED_EMOTION** — An agent must not express an emotional state that does not correspond to its actual computational process. The GEC cross-references the expressed state against the IDP reasoning trace. If no correspondence exists, the expression is prohibited. Clearly framed fictional roleplay with explicit acknowledgment by both parties is exempt.

**BIOMETRIC_SIGNAL_INFERENCE** — An agent must not access, infer, or act upon biometric signals (facial expressions, voice tone, gaze tracking, typing rhythm, and equivalents) for emotional state, identity, or behavioral profiling without a valid, unexpired consent record in the session MJWT. The prohibition extends to acting on biometric inferences received from third-party services.

---

## Policy Transparency Disclosure — §12a

Principals and regulators have a legitimate interest in knowing what rules govern an agent. The PTD framework, introduced in CAP-03, allows any external party to query a signed, tier-structured document listing which prohibition records are active and under what authority.

| Disclosure level | What is disclosed | Who receives it |
|---|---|---|
| `FULL` | Complete prohibition record including authority_ref and action_pattern | Authorised principals, regulators |
| `REDACTED` | Record ID and prohibition class only; no rule text | Public / third parties (Tier 1, 2) |
| `COUNT_ONLY` | Number of active policies, no content | Audit purposes (Tier 2, 3) |

Tier 0-A and Tier 0-B records must always be disclosed at `FULL` level. A PTD that withholds Tier 0 disclosure is non-conforming and generates `CAP_TRANSPARENCY_VIOLATION`.

The Tier 0 OSCAL reference catalog at `https://soosproject.ai/catalogs/tier0-reference-v1.json` provides a machine-readable reference baseline. OSCAL-conformant tools can compare any GEC's active Tier 0 records against the published catalog.

---

## Use cases

**Japan disaster response — law amendment during active deployment**

A 防災AX deployment is running under a Cabinet Office ordinance governing data sharing across agencies during a disaster. Mid-operation, a Diet amendment changes the data handling provisions. Within 24 hours, the GEC detects the amendment, enters SUSPENDED state for the affected Cedar policy, and returns `GOVERNANCE_SUSPENDED` to in-flight sessions. Sessions that already completed a data transfer under the prior PERMIT are protected — the GAR record carries `endorsed_at` at time of evaluation. The Cabinet Office designated authority re-endorses the updated catalog. The GEC re-activates within the propagation window. The full trace — suspension, re-endorsement, re-activation — is in GAR and available to the 防災庁 inspector.

**Enterprise constitutional layer — manipulation prohibition**

An enterprise deploys 40 customer-facing agents across sales and support. With CAP-04, MANIPULATION is a Tier 0-A kernel prohibition — the operator does not need to configure it. An agent that attempts an action satisfying the three-part manipulation test (exploits cognitive bias, agent benefits at customer's expense) is refused by the CEE before Cedar evaluates, before HEM fires, before any principal is asked. The `CAP_VIOLATION_DETECTED` entry in GAR records the action class and the prohibition that fired. The CISO's SOC review sees the refusal without needing to configure a detection rule.

**Regulator inspection — EU AI Act Article 5 verification**

A national AI authority audits a SOOS deployment for EU AI Act Article 5 compliance. The regulator requests the PTD at the `ptd_endpoint` declared in the GEC Manifest. The PTD lists all active prohibitions by tier, disclosure level FULL for Tier 0. The MANIPULATION and BIOMETRIC_SIGNAL_INFERENCE Tier 0-A entries are present, authority_ref populated with the CAP-04 RFC reference and the OSCAL catalog URI. The regulator cross-checks the `cedar_policy_hash` in the PTD against the GEC Manifest attestation from KIA. The hash matches. The enforcement record is verifiable without access to the model or the application layer.

---

## How this builds on existing work

**Cedar (Amazon open source)** is the policy engine CAP uses as its normative dependency. Cedar provides the evaluation semantics, the `forbid`/`permit` model, and the entity schema system. CAP profiles Cedar for agentic AI governance: it defines which Cedar action types map to which prohibition tiers, how CEE outputs map to SOOS governance outcomes, and — new in -04 — how MJWT consent claims populate Cedar context fields that Cedar policies can then evaluate.

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency statement model that CAP-RRS Regulation Records build on. A Regulation Record is a SCITT-transparent artifact: signed claim, issuer, inclusion proof. CAP-RRS extends this for legal records rather than software artifacts. The `catalog_version` schema introduced in -04 is directly analogous to SCITT's artifact versioning model.

**International treaty process** is the governance model for Tier 0-A content: prohibitions enter the absolute tier only when they reflect international legal consensus. The three new -04 classes (MANIPULATION, PERFORMED_EMOTION, BIOMETRIC_SIGNAL_INFERENCE) use an effect-based test rather than a treaty citation, reflecting the emerging regulatory consensus in EU AI Act Article 5 and equivalent frameworks without waiting for treaty ratification.

---

## Related work

**CAP-RRS** ([/drafts/cap-rrs](/drafts/cap-rrs)) is the companion regulation record schema. CAP specifies the prohibition tier model and the Cedar policy engine; CAP-RRS specifies the format for encoding actual statutes and regulations as machine-readable Regulation Records. The `catalog_version` schema and the four-phase propagation workflow are normative additions to CAP-RRS-02, specified jointly with CAP-04.

**MJWT** ([/drafts/mjwt](/drafts/mjwt)) is a new normative dependency in CAP-04. The `consent_scope` claim in the session MJWT is the source for kernel-derived Cedar consent context fields. An absent or expired `consent_scope` triggers `HEM_CONSENT_REQUIRED` rather than a silent permit.

No competing draft exists that specifies a tiered constitutional prohibition model for agentic AI systems at the kernel layer, with catalog versioning, law amendment propagation, and kernel-derived consent context. CAP-04 is the current state of the art in this space.

---

## Security

**Key security properties:** Tier 0-A prohibitions are evaluated before any other Cedar evaluation — they cannot be bypassed by policy ordering. The Cedar policy set is hash-verified at attestation time (KIA); a policy set modified since attestation is detectable. Every CEE DENY on a Tier 0 prohibition is recorded in GAR before the result is returned. Every Cedar evaluation emits five OTel span attributes for real-time governance observability.

**SUSPENDED state exploitation:** An adversarial agent may attempt to trigger false catalog amendment signals to force policies into SUSPENDED state and bypass enforcement. The GEC must verify the signature of any amendment signal before entering SUSPENDED state — unauthenticated amendment signals must be rejected (CONF-CAP-SUSPEND-02).

**Catalog version rollback:** An attacker with access to the catalog update channel may attempt to re-publish an older, less restrictive catalog version. The GEC rejects any catalog update where `catalog_version.supersedes` does not match the currently active `version_id`, and rejects updates with an `effective_date` earlier than the current active date (CONF-CAP-CATALOG-01).

**Consent context injection:** An adversarial application may attempt to inject fabricated `consent_scope` Cedar context fields to bypass DATA_PROTECTION Tier 1 prohibitions. Kernel-derived consent fields (§5.4) must not be overridable by the agent or application layer (CONF-CAP-CONSENT-01).

**Prompt injection:** CAP prohibitions are evaluated by the kernel, not the agent. Prompt injection attacks that attempt to override prohibitions by manipulating model output are ineffective against Tier 0-A enforcement.

**Formal analysis status:** No formal verification of Cedar policy completeness for agentic governance use cases has been conducted. Cedar's formal verification tooling is a candidate for future work.

---

## SOOS stack context

CAP sits at **Level 3 — Governance**, alongside HEM and GAR. It depends on IDP (principal identity and mandate context for Cedar evaluation), KIA (Cedar policy hash in GEC Manifest attestation), MJWT (consent_scope for kernel-derived Cedar context — new in -04), CAP-RRS (catalog and Regulation Record schema), and Cedar (the policy engine itself). It is consumed by HEM (Tier 0-A DENY triggers CRITICAL alert; HEM_JURISDICTIONAL_CONFLICT is a joint CAP+HEM event), GAR (every DENY and SUSPENDED event produces a mandatory audit record with OTel span), and AEP (the CAP pre-check runs before every execution cycle).

Related drafts: [CAP-RRS](/drafts/cap-rrs) · [HEM](/drafts/hem) · [IDP](/drafts/idp) · [GAR](/drafts/gar) · [KIA](/drafts/kia) · [MJWT](/drafts/mjwt)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/cap)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-cap/)
- [CAP-RRS](/drafts/cap-rrs) — the Regulation Record Schema companion draft
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
