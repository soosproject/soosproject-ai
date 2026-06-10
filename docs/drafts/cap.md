# Constitutional Authority Protocol

Layer 3 — Governance
**draft-sato-soos-cap-03**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems need to be told what they cannot do — at a level that survives prompt injection, principal confusion, and model error. Not as a system prompt. As a kernel-enforced prohibition, evaluated before execution begins, with no override path for the agent.

CAP defines the protocol by which a SOOS kernel encodes, stores, evaluates, and enforces constitutional prohibitions: rules that apply to every agent, every mandate, every execution cycle — regardless of what the principal instructs or the agent intends.

**The design premise:** some limits are not negotiable, and a conforming system must make that non-negotiability machine-readable.

---

## Messages to key audiences

### IETF Working Groups

CAP is relevant to the OAUTH, SECEVENT, and SACM working groups. It uses Cedar (Amazon open source) as its normative policy engine — the first IETF draft to declare Cedar as a normative dependency. CAP-RRS (the companion regulation record schema) is of direct interest to the SCITT working group as a domain-specific application of supply-chain transparency principles applied to regulatory records.

The Tier 0-A governance model (which jurisdictions and treaty processes can place content in the absolute prohibition layer) is an open architectural question that benefits from working group input. CAP does not assert authority to determine Tier 0-A content unilaterally — it specifies the governance process by which content enters that tier.

To engage on CAP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a kernel-level constitutional prohibition layer means your agent's limits live in a system prompt — and system prompts can be overridden, manipulated, or ignored. A prohibition that lives in a system prompt is a guideline. A prohibition that lives in Cedar and is evaluated by the kernel before every action is a constraint.

CAP closes this gap by specifying the protocol for encoding, storing, and enforcing prohibitions at the kernel layer. The agent cannot override a Tier 0-A prohibition by any instruction, because the prohibition is evaluated by the kernel before the agent's action is permitted — not by the agent evaluating its own compliance.

Without CAP: your agent's limits are as strong as its last system prompt. With CAP: your agent's limits are kernel-enforced, Cedar-evaluated, and auditable.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/cap)

### Regulators and policy teams

CAP is the protocol-level answer to the regulatory question: "How do we ensure AI systems cannot take actions prohibited by law, regardless of what they are instructed to do?"

The answer is not policy compliance — it is protocol enforcement. CAP encodes prohibitions into Cedar policies that the kernel evaluates before every action. The prohibitions cannot be overridden by runtime instruction; they can only be modified through the governance process that produced them.

The companion draft CAP-RRS provides the schema for encoding actual legal prohibitions as machine-readable Regulation Records. Japan's APPI Article 17 and FIEA Article 38 are provided as worked examples. Founding jurisdiction participation in the Constitutional Mandate Registry (CMR) shapes the canonical encoding of law into AI enforcement for that jurisdiction.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS CAP (Constitutional Authority Protocol, draft-sato-soos-cap-03). This protocol uses Cedar as its policy engine to enforce constitutional prohibitions on AI agent actions. There are four prohibition tiers: Tier 0-A (absolute, no override), Tier 0-B (operator-locked), Tier 1 (principal-delegated), Tier 2 (soft constraint, contextual). The kernel MUST evaluate Tier 0-A rules before any other Cedar evaluation — this is the pre-check. CAP-03 also includes a Policy Transparency Disclosure (PTD) framework with a ptd_endpoint in the GEC Manifest and four disclosure levels: FULL, SUMMARY, REDACTED, COUNT_ONLY."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `prohibition_tier` | enum | TIER_0A / TIER_0B / TIER_1 / TIER_2 / TIER_3 |
| `cedar_policy_id` | string | Reference to the Cedar policy that fired |
| `action_class` | string | The action type evaluated |
| `evaluation_result` | enum | CEDAR_PERMIT / CEDAR_DENY |
| `ptd_endpoint` | URL | Policy Transparency Disclosure query endpoint |
| `disclosure_level` | enum | FULL / SUMMARY / REDACTED / COUNT_ONLY |
| `policy_count_by_tier` | object | Number of active policies per tier |
| `regulatory_record_id` | string | CAP-RRS record ID if prohibition derives from regulation |

**Minimal Cedar policy examples:**

```cedar
// Tier 0-A absolute prohibition — no conditions, unconditional DENY
forbid (
  principal,
  action == Action::"ExecuteProhibitedAction",
  resource
);

// Tier 2 soft constraint — DENY unless context conditions met
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

CAP provides the technical mechanism for jurisdictions to encode their legal prohibitions into AI enforcement at the kernel layer. Through the companion Constitutional Mandate Registry (CMR) and CAP-RRS, a regulatory prohibition — such as APPI Article 17 on purpose limitation, or FIEA Article 38 on suitability — becomes a machine-readable record that any conforming SOOS implementation enforces as a Tier 0-A or Tier 1 prohibition.

The Tier 0-A governance model follows two principles: international legal consensus as the threshold for absolute prohibitions (the Rome Statute model — 124 state parties, ICC jurisdiction, established since 2002), and a Foundation governance process for additions. Jurisdictions that participate in the founding period of the CMR shape the schema. Those that arrive later adopt it.

For collaboration on jurisdiction-specific regulation encoding: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents today enforce their limits through system prompts and model-layer compliance. Both can be overridden, manipulated, or ignored. There is no kernel-level mechanism for encoding prohibitions that survive instruction override.

**Mechanism:** CAP uses Cedar as a normative policy engine. Every prohibition is a Cedar policy evaluated by the kernel — not the agent — before any action is permitted. Tier 0-A rules are evaluated first, unconditionally, before any other Cedar evaluation. DENY on a Tier 0-A rule halts execution immediately and fires a HEM Class 1 escalation.

**Output:** A Cedar evaluation record — the policy that fired, the action that was evaluated, the result — signed and recorded in GAR. The GAR record is the proof that constitutional enforcement occurred.

**Who verifies it:** Regulators, compliance teams, and auditors who need to prove that a specific prohibition was enforced on a specific action by a specific agent — not that a policy was in place, but that it was evaluated and applied.

---

## The prohibition tier model

| Tier | Name | Override | Who sets it |
|---|---|---|---|
| **Tier 0-A** | Absolute prohibition | None. Cedar DENY is final. | CMR governance process (international legal consensus threshold) |
| **Tier 0-B** | Operator-locked prohibition | Operator only, via new Cedar policy. | Operator at deployment |
| **Tier 1** | Principal-delegated restriction | Principal can modify within Tier 0 limits. | Principal |
| **Tier 2** | Soft constraint | Contextual Cedar evaluation. | Policy author |
| **Tier 3** | Advisory | GAR record only. Execution continues. | Operator / policy author |

**Tier 0-A is the constitutional floor.** A Tier 0-A prohibition cannot be lifted by any principal instruction, any mandate, or any runtime context. Every SOOS implementation ships with a Tier 0-A baseline. Operators may add to it. No one may subtract from it without producing a non-conforming implementation.

---

## Policy Transparency Disclosure — §12a

Principals and regulators have a legitimate interest in knowing what rules govern an agent. CAP-03 introduces the Policy Transparency Disclosure (PTD) framework.

| Disclosure level | What is disclosed | Who receives it |
|---|---|---|
| `FULL` | Complete Cedar policy set, human-readable | Authorised principals |
| `SUMMARY` | Policy count per tier, categories | Principals, regulators |
| `REDACTED` | Tier 0-A existence confirmed; no rule text | Public / third parties |
| `COUNT_ONLY` | Number of active policies, no content | Audit purposes |

The `ptd_endpoint` in the GEC Manifest (KIA-01) provides the discovery URL for PTD queries. GAR records `CAP_TRANSPARENCY_VIOLATION` when a PTD query is rejected without a conforming reason. PTD is designed to satisfy EU AI Act Article 13, GDPR Article 22, and equivalent transparency obligations without requiring publication of the full policy set.

---

## Use cases

**National AI Act encoding — jurisdiction deployment**

A government agency requires that AI systems deployed in its jurisdiction cannot recommend actions prohibited under national financial regulation. Using CAP and CAP-RRS, the prohibiting statute is encoded as a Tier 0-A or Tier 1 Regulation Record. Every conforming SOOS deployment in that jurisdiction enforces the prohibition at the kernel layer. The PTD framework allows the regulator to verify which prohibitions are active — at SUMMARY level — without exposing the full policy set.

**Enterprise constitutional layer for autonomous agents**

An enterprise deploys 40 agents across its supply chain, finance, and HR operations. The CISO defines a Tier 0-B operator policy: no agent may access external data sources outside the approved vendor list. This policy is loaded into Cedar at deployment. The agents cannot override it by instruction — it is kernel-evaluated before every external data access. The GAR record of every CEDAR_DENY on this policy is available for SOC audit.

**RFC Only regulatory prohibition**

A financial regulator requires that an AI system not make investment recommendations that are unsuitable for the customer profile — but the regulatory interpretation is legally sensitive and cannot be published. Using the RFC Only procedure, the prohibition is encoded as a signed Regulation Record and loaded as a Tier 0-A policy without the rule text appearing in any PTD query. The PTD `REDACTED` response confirms the prohibition exists; the rule text is available only to authorised audit parties.

---

## How this builds on existing work

**Cedar (Amazon open source)** is the policy engine CAP uses as its normative dependency. Cedar provides the evaluation semantics, the `forbid`/`permit` model, and the entity schema system. CAP profiles Cedar for agentic AI governance: it defines which Cedar action types map to which prohibition tiers, and how Cedar evaluation results map to SOOS governance outcomes (CEDAR_PERMIT / CEDAR_DENY → HEM class triggers → GAR records).

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency statement model that CAP-RRS Regulation Records build on. A Regulation Record is a SCITT-transparent artifact: it has a signed claim, an issuer, and an inclusion proof. CAP-RRS extends this for legal records rather than software artifacts.

**Rome Statute / international treaty process** is the governance model for Tier 0-A content: prohibitions enter the absolute tier only when they reflect international legal consensus through recognised multilateral treaty processes. This is not a SOOS claim — it is a reference to the process that already governs what humanity has collectively decided is always prohibited.

---

## Related work

**CAP-RRS** ([/drafts/cap-rrs](/drafts/cap-rrs)) is the companion regulation record schema. CAP specifies the prohibition tier model and the Cedar policy engine; CAP-RRS specifies the format for encoding actual statutes and regulations as machine-readable Regulation Records. The two drafts are designed as a pair.

**draft-ietf-oauth-security-topics** — CAP's Tier 0-A governance model addresses the "who decides what is prohibited" question. The OAuth security topics discussion of authorization server trust hierarchies is the closest existing framing; CAP extends it to the constitutional prohibition domain.

No competing draft exists that specifies a tiered constitutional prohibition model for agentic AI systems at the kernel layer. CAP-RRS is the first draft to specify a machine-readable Regulation Record format. This is an explicit first-mover position.

---

## Security

**Key security properties:** Tier 0-A prohibitions are evaluated before any other Cedar evaluation — they cannot be bypassed by policy ordering. The Cedar policy set is hash-verified at attestation time (KIA); a policy set that has been modified since attestation is detectable. Every CEDAR_DENY on a Tier 0-A or Tier 0-B prohibition is recorded in GAR before the result is returned to the caller.

**Tier 0-A governance legitimacy:** Who decides what enters Tier 0-A? CAP addresses this explicitly. Content enters Tier 0-A only when it reflects a prohibition that has achieved formal international legal consensus through recognised multilateral treaty processes. Proposed additions are reviewed through the Constitutional Mandate Registry governance process, requiring documented international legal basis, public comment period, multi-stakeholder review, and version-controlled CMR publication.

**Prompt injection:** Because CAP prohibitions are evaluated by the kernel (Cedar evaluator), not the agent (model), prompt injection attacks that attempt to override prohibitions by manipulating model output are ineffective against Tier 0-A enforcement. The agent cannot instruct the kernel to skip its own Cedar evaluation.

**Formal analysis status:** No formal verification of Cedar policy completeness for agentic governance use cases has been conducted. This is acknowledged as a gap. Cedar's formal verification tooling is a candidate for future work.

**Session revocation:** When an agent session is revoked, all pending CAP evaluations are cancelled. Implementations MUST NOT return CEDAR_PERMIT results for actions evaluated after a session revocation signal is received.

---

## SOOS stack context

CAP sits at **Level 3 — Governance**, alongside HEM and GAR. It depends on IDP (principal identity and mandate context for Cedar evaluation), KIA (Cedar policy hash in GEC Manifest attestation), and Cedar (the policy engine itself). It is consumed by HEM (Class 1 triggers are CAP Tier 0-A DENY events), GAR (every DENY produces a mandatory audit record), and AEP (the CAP Tier 0-A pre-check runs before every execution cycle).

Related drafts: [CAP-RRS](/drafts/cap-rrs) · [HEM](/drafts/hem) · [IDP](/drafts/idp) · [GAR](/drafts/gar) · [KIA](/drafts/kia)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/cap)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-cap/)
- [CAP-RRS](/drafts/cap-rrs) — the Regulation Record Schema companion draft
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
