# Intent Declaration Primitive

Layer 2 — Session Foundation
**draft-sato-soos-idp-05**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-idp/)
See [SOOS Stack](/stack) implementation

---

## What's new in IDP-05

- **intake_endorsement operation (§4.6)** — a GEC service that processes a submitted EOD before session initiation and returns a GEC-signed Endorsed EOD. For Class 3 agents, an endorsed_eod_id in the IDP is now required. An IDP submitted in a Class 3 session without a valid Endorsed EOD is rejected. For Class 2 agents, endorsed_eod_id is recommended and its absence is logged.
- **PD-EOD: Prompt-Derived EOD branch (§4.7)** — an EOD derived by the GEC from a natural-language prompt. Carries `derived: true`. Scope-bounding rule: the PD-EOD MUST NOT declare a target state outside the SO Type's state machine regardless of prompt content. HEM notification required before first external-system touch not covered by the prompt.
- **mandate_reference field (§4.1)** — SPO URI linking each IDP to the governing SO Type definition. GEC performs structural validation: the requested_action must be within the SPO action space; an expired SPO results in IDP_SPO_EXPIRED.
- **Confidence level calibration guidance (§7)** — `CONFIDENCE_MISCALIBRATION_WARNING` trigger: when more than 40% of an agent's high-confidence IDPs receive DENY or HEM_PENDING in a 10-IDP window, the GEC emits a warning and notifies the human principal. The `idp.miscalibration_score` Cedar attribute enables Cedar policies to respond.
- **RETRY_CONTINUATION strengthened (§4.3)** — backward reference to AEP-02 Section 10.4's what_changed requirement. The description field in a RETRY_CONTINUATION IDP must reference specific DENY enrichment fields; generic descriptions generate `RETRY_WHAT_CHANGED_WEAK` in the Event Log.
- **Four new Security Considerations** — prompt injection at intake, EOD scope manipulation, confidence_level inflation attack, COMMITMENT_GAP exploitation.

---

## The problem

Every action an AI agent takes is a decision. Right now, none of those decisions are signed.

IDP defines the primitive that changes this: the **Intent Declaration** — a structured, GEC-signed statement of agent intent, bound to a mandate, issued before execution begins. Without a declared and committed intent, the governance layer has nothing to evaluate against, and the audit layer has no anchor for its records.

**The design premise:** governance without declared intent is retrospective. IDP makes governance prospective — evaluated before the first action, not reconstructed after the last one.

---

## Messages to key audiences

### IETF Working Groups

IDP is relevant to the OAUTH, JOSE, and GNAP working groups. IDP is a profiled JWT — it builds on RFC 7519 (JSON Web Token) to add agentic-specific claims: mandate binding, reasoning mode, session-binding for replay protection, and now EOD endorsement via intake_endorsement.

**IDP-05 Vienna additions:** The intake_endorsement operation fills the gap between GNAP grant issuance and first agent action — a gap that GNAP does not address. The PD-EOD branch (Section 4.7) is the protocol response to the WIMSE WG concern about agents derived from natural-language instructions rather than structured credentials. The mandate_reference SPO URI provides the structural validation link that connects the IDP to the SO Type governance model, enabling cross-draft validation.

To engage on IDP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-idp/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a signed intent declaration means your audit trail starts at the action — not at the decision. When something goes wrong, you can reconstruct what the agent did; you cannot prove what it declared it was trying to do before it started.

**New in IDP-05 — intake_endorsement:** Before your agent's session begins, it submits its EOD to the GEC's intake_endorsement endpoint. The GEC validates the EOD against the mandate and SO Type, checks that the target states exist in the state machine, and returns a signed Endorsed EOD with an endorsed_eod_id. Your agent carries this ID in every subsequent IDP. If the EOD was wrong — out-of-scope target state, expired mandate — you find out before the session starts, not after a mysterious sequence of DENYs.

**New in IDP-05 — PD-EOD:** If your operator issues natural-language instructions rather than structured EODs, the GEC can derive a PD-EOD from the prompt. The scope-bounding rule ensures the derived EOD cannot exceed the SO Type's action space regardless of what the prompt says. derivation_warnings surfaces anything the GEC excluded or constrained.

**New in IDP-05 — RETRY_CONTINUATION:** Your agent's retry IDPs must now reference specific fields from the DENY enrichment response. The what_changed_guidance field in the Enriched DENY Response tells the agent exactly which enrichment fields to reference. Generic retry descriptions generate RETRY_WHAT_CHANGED_WEAK in the Event Log.

Without IDP: your audit trail is a log of actions. With IDP: your audit trail is a log of endorsed pre-session commitments, per-transition declared intents, and verified outcomes.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/idp)

### Privacy officers

IDP is the protocol-level mechanism for GDPR Article 5(1)(b) purpose limitation and APPI Article 17 purpose specification. The Intent Declaration is the machine-readable record that the agent declared a specific purpose before acting. Each subsequent action is evaluated against the declared purpose — actions outside the declared scope produce a GAR DENY record before they proceed.

**New in IDP-05 — Endorsed EOD:** The intake_endorsement Endorsed EOD is the pre-session, GEC-signed purpose declaration. Before any action is taken, the GEC has attested that the agent's declared outcome is within the mandate's permitted scope. This is the DPIA documentation artifact for automated processing: the signed pre-commitment, not a policy document.

For GDPR DPIAs: The endorsed_eod_id in every IDP creates an unbroken chain from the pre-session purpose declaration to every individual action record in GAR. Purpose scope violations (deny code IDP_ACTION_OUTSIDE_SPO) are detected at the structural validation step — before Cedar evaluation and before any action executes.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS IDP-05 (draft-sato-soos-idp-05). Before any session begins (Class 3 required, Class 2 recommended), my agent must call the GEC's intake_endorsement operation with the EOD and principal credential. The GEC returns an Endorsed EOD with an endorsed_eod_id. Every IDP submitted during the session must carry this endorsed_eod_id. For natural-language-driven sessions, the GEC can derive a PD-EOD from the prompt (derived: true) — the scope-bounding rule applies; the PD-EOD cannot target states outside the SO Type's state machine. When my agent retries after DENY, the RETRY_CONTINUATION IDP's description must reference specific fields from the DENY enrichment response (the what_changed_guidance in the Enriched DENY Response tells me which ones). If I'm in PLAN_B_ACTIVE state, the IDP must carry plan_b_ref. If my agent's high-confidence declarations are frequently denied, CONFIDENCE_MISCALIBRATION_WARNING fires and the human principal is notified."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `idp_id` | string | UUID v4. Unique per governed object lifetime. |
| `session_id` | string | GEC session identifier — replay protection. |
| `mandate_id` | string | MJWT jti — binds intent to authorization credential. |
| `mandate_reference` | string | SPO URI. Structural validation against SO Type. [NEW] |
| `endorsed_eod_id` | string | UUID of GEC-signed Endorsed EOD. Required for Class 3. [NEW] |
| `eod_id` | string | Original (unendorsed) EOD UUID. Audit chain. [NEW] |
| `plan_b_ref` | string | plan_b_id from EOD. Required in PLAN_B_ACTIVE state. [NEW] |
| `requested_action` | string | Cedar action string. Must be in SPO action space. |
| `reasoning_basis.type` | enum | RULE_BASED / INFERENCE / INSTRUCTION / UNCERTAINTY_REDUCTION / MISSION_STAGE / RETRY_CONTINUATION |
| `reasoning_basis.description` | string | For RETRY_CONTINUATION: must reference specific DENY enrichment fields. [REVISED] |
| `confidence_level` | number | Float 0.0–1.0. Triggers CONFIDENCE_MISCALIBRATION_WARNING if systematically high + denied. [REVISED] |
| `reasoning_mode` | enum | ROUTINE / PREDICTIVE / DIAGNOSTIC / CHANNEL_DEGRADED / META / COMPENSATING / DELEGATION_AWARE / HEM_INFORMED |
| `gec_instance_id` | string | KIA-attested GEC instance — replay protection. Required L2/L3. |

**Minimal Cedar policy example — endorsed EOD gate:**

```cedar
// Require endorsed EOD for Class 3 autonomous agents on high-risk SO types
permit (
  principal,
  action == Action::"ExecuteHighRiskTransition",
  resource
)
when {
  context.idp.has_endorsed_eod == true &&
  context.idp.eod_scope_status == "IN_SCOPE" &&
  context.session_id == context.active_session_id &&
  context.agent_miscalibration_active == false
};

// Require HEM after confidence miscalibration is detected
forbid (
  principal,
  action == Action::"ElevatedAuthorityTransition",
  resource
)
when {
  context.agent_miscalibration_active == true
};
```

### Government and regulators

IDP is the protocol that makes purpose limitation enforceable at the kernel layer. A privacy regulator that requires AI systems to act only within declared purposes can point to IDP as the technical mechanism: before any action, the agent declares its purpose in a signed, kernel-verified record. Actions outside that declared purpose are blocked by CAP policy and recorded in GAR.

**New in IDP-05 — Endorsed EOD as Article 9 record:** The intake_endorsement operation produces a GEC-signed document attesting that the agent's pre-session goal declaration is within mandate scope, that the target states exist in the SO Type's state machine, and that the Plan B is structurally valid. This is the EU AI Act Article 9 technical risk management artifact at the pre-session level — a machine-verifiable risk assessment, not a policy document.

**New in IDP-05 — Confidence calibration monitoring:** The CONFIDENCE_MISCALIBRATION_WARNING trigger implements the Article 9 "monitoring throughout the lifecycle" requirement for systematic confidence miscalibration. If an agent's confidence declarations are systematically inconsistent with its outcome record, the GEC detects this within a 10-IDP window and notifies the human principal.

For Japan (APPI Article 17): IDP-05's endorsed_eod_id creates a machine-readable chain from the human principal's purpose authorization (principal_credential in the intake_endorsement request) to every individual action in the session. The APPI purpose specification is the source_prompt or structured EOD; the Endorsed EOD is the GEC's attestation that the session is within that purpose.

For collaboration on jurisdiction-specific intent declaration requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents act on stated intent that is neither signed nor verifiable. When an agent takes a harmful action, there is no proof of what it declared it was trying to accomplish before it started. When it retries a denied action, there is no normative requirement to articulate what changed since the denial. When it declares high confidence and is repeatedly denied, there is no detection mechanism for systematic overconfidence.

**Mechanism:** IDP-05 requires:
1. A GEC-signed Endorsed EOD before the session begins (intake_endorsement).
2. A per-transition IDP carrying the endorsed_eod_id before each action.
3. A what_changed-specific description when retrying after DENY.
4. A CONFIDENCE_MISCALIBRATION_WARNING detection window over the session.

**Output:** A complete audit chain: Endorsed EOD → IDP_SUBMITTED → Cedar evaluation → STATE_TRANSITIONED or CEDAR_DENY_RECORDED → IDP_COMMITMENT_VERIFIED. Every step is GEC-signed. The endorsed_eod_id connects every action record back to the pre-session commitment. At session close, the EOD_OUTCOME (MATCHED, PARTIAL, PLAN_B_MATCHED, UNMATCHED) records whether the session delivered what the agent pre-committed to.

**Who verifies it:** Privacy officers verifying GDPR Article 5(1)(b) purpose limitation, compliance teams demonstrating EU AI Act Article 9 technical risk management, security teams monitoring CONFIDENCE_MISCALIBRATION_WARNING events, and regulators auditing the pre-session commitment chain.

---

## Reasoning mode taxonomy

IDP-05 retains the eight reasoning mode values from IDP-04, now cross-referenced with AEP-02's SENSE trigger types.

| Mode | SENSE trigger that preceded REASON | What the IDP is directing at |
|---|---|---|
| `ROUTINE` | STATE_CHANGE (no anomaly) | Next planned SO state transition |
| `PREDICTIVE` | PROXIMITY_EVENT (threshold approaching) | Preemptive action; confidence SHOULD be STANDARD or lower |
| `DIAGNOSTIC` | Anomalous SO state | Cause investigation + compensating action |
| `CHANNEL_DEGRADED` | Any (input delivery faulted) | Fallback or HEM; confidence MUST be UNCERTAIN (0.0–0.59) |
| `META` | Pattern across iterations | Process proposal to human principal; hem_urgency MUST be RECOMMENDED or REQUIRED |
| `COMPENSATING` | DENY in prior OBSERVE | Alternate path to goal; reasoning_basis MUST be RETRY_CONTINUATION |
| `DELEGATION_AWARE` | DELEGATION_EVENT or CLUSTER_STATUS_CHANGE | Revised plan for changed delegation topology |
| `HEM_INFORMED` | HEM_RESOLUTION | Constrained action under human decision; decision_id MUST be cited |

---

## intake_endorsement: the pre-session gate

The intake_endorsement operation is the bridge between GNAP grant issuance and the first AEP SENSE delivery. The agent or operator submits:
- The EOD (primary outcome, acceptance envelope, Plan B if any).
- The Root Mandate JWT for the session.
- A principal credential recognized by the GEC's Party Registry.

The GEC validates:
- The EOD schema.
- The Mandate JWT (MJWT verification).
- That the primary_outcome.target_state exists in the SO Type's state machine.
- That the plan_b.plan_b_target_state (if present) exists in the SO Type's state machine.
- The scope_status (IN_SCOPE, PARTIAL_SCOPE, OUT_OF_SCOPE).

The GEC returns a GEC-signed Endorsed EOD with endorsed_eod_id. The GEC records the Endorsed EOD in the Event Stream as ENDORSED_EOD. The agent carries endorsed_eod_id in every IDP for the session.

If the EOD is out of scope, the agent sees scope_status: OUT_OF_SCOPE and can revise before the session begins — not after a series of DENYs reveals the scope mismatch at execution time.

---

## Cross-context replay protection

A signed Intent Declaration created in one context must not be reusable in another. IDP-05 retains and extends IDP-04's three protections:

**Endorsed EOD binding [NEW]** — the endorsed_eod_id in the IDP is validated against the Event Log ENDORSED_EOD entry. An endorsed_eod_id that was not produced by this GEC instance for this session's Mandate JWT results in IDP_ENDORSED_EOD_INVALID.

**Mandate binding** — the IDP is bound to the MJWT mandate. A replayed declaration fails mandate validation if the mandate has expired or the action is outside scope. The mandate_reference SPO URI [NEW] adds a structural validation layer: the requested_action must be in the SPO's action space.

**Session anchor** — the IDP is anchored to the current AEP session via session_id. An IDP from session A cannot authorise an action in session B. Mismatched session_id produces IDP_SESSION_MISMATCH.

---

## Use cases

**EU AI Act Article 9 compliance — high-risk financial agent**

A bank deploys a Class 3 autonomous agent to review loan applications. Before the first SENSE delivery, the agent's operator calls intake_endorsement with an EOD declaring "primary outcome: all applications reviewed and classified" and a Plan B of "flag unreviewed applications for manual review." The GEC validates the Endorsed EOD — target states exist in the Loan Application SO Type state machine, all actions are within mandate scope — and returns endorsed_eod_id. Every subsequent IDP carries this endorsed_eod_id. At session close, the EOD_OUTCOME: MATCHED is the Article 9 technical risk management record. The bank's compliance team has the full chain: pre-session commitment → per-transition declarations → GEC-verified outcomes.

**Natural-language-driven research agent — PD-EOD branch**

A research operator gives a natural-language instruction: "Find all regulatory filings from 2026 about AI governance." The GEC's intake_endorsement operation derives a PD-EOD (derived: true) from the prompt: primary_outcome.target_state = "RESEARCH_COMPLETE", scope = regulatory filing SO Type. The scope-bounding rule prevents the PD-EOD from including an implicit "and summarize them in a public post" that was not in the SO Type's permitted actions. derivation_warnings flags the exclusion. The operator acknowledges, and the session begins within the bounded scope.

**Systematic retry governance — CONFIDENCE_MISCALIBRATION_WARNING**

An agent repeatedly declares 0.92 confidence and submits Transition Requests for a Cedar-gated action. The Cedar policy requires prior_denial_count < 3 for this action. After 3 DENYs, the action is gated. The agent's confidence_level remains 0.92 despite repeated denial. After 10 IDPs with 5 DENYs on high-confidence declarations, CONFIDENCE_MISCALIBRATION_WARNING fires. The human principal is notified via HEM with the miscalibration ratio. The Cedar context attribute `agent_miscalibration_active: true` is applied, triggering an additional Cedar policy that requires HEM escalation for elevated-authority transitions from this agent for the remainder of the session.

---

## How this builds on existing work

**AEP-02 (draft-sato-soos-aep-02)** introduced the EOD as an AEP-layer concept. IDP-05 provides the IDP-layer counterpart: the intake_endorsement operation that produces the Endorsed EOD the AEP EOD references, and the endorsed_eod_id field that binds every IDP to the pre-session commitment. AEP-02 and IDP-05 are designed together; an endorsed_eod_id from IDP-05 is the same artifact referenced by AEP-02's EOD lifecycle.

**GNAP (RFC 9635)** establishes the grant before the session. intake_endorsement operates in the window between GNAP grant issuance and first SENSE delivery. GNAP does not address EOD endorsement; IDP-05 fills that gap.

**W3C PROV-DM** provides the provenance data model. The ENDORSED_EOD Event Log entry is a PROV-DM Agent declaration. The IDP_SUBMITTED entries are PROV-DM Activity records. The IDP_COMMITMENT_VERIFIED entries close the provenance loop: the declared intent (Entity) was used to generate the action (Activity) and the GEC confirmed the match.

---

## Security

**Prompt injection at intake [NEW]:** An adversary who can influence the source_prompt of a PD-EOD may attempt to inject scope-expanding instructions. The scope-bounding rule (Section 4.7.2) is the primary mitigation: the PD-EOD MUST NOT declare a target state outside the SO Type's state machine regardless of prompt content. derivation_warnings surfaces excluded content for human principal review.

**EOD scope manipulation [NEW]:** The Endorsed EOD is GEC-signed; modification in transit invalidates the signature. IDP validation checks the Event Log ENDORSED_EOD entry, not the agent-supplied Endorsed EOD — a fabricated endorsed_eod_id that does not match the Event Log is rejected with IDP_ENDORSED_EOD_INVALID.

**Confidence inflation attack [NEW]:** Systematic high-confidence declarations followed by DENYs are detected by the CONFIDENCE_MISCALIBRATION_WARNING trigger within a 10-IDP window. Cedar policies SHOULD combine confidence_level with agent_miscalibration_active and PT score; confidence alone MUST NOT be the basis for elevated-privilege permits.

**COMMITMENT_GAP exploitation [NEW]:** Wildcard requested_action values (e.g., "atp:booking:*") are not valid Cedar action strings and MUST be rejected with IDP_MALFORMED. PARTIAL_MATCH patterns above a frequency threshold generate KERNEL_AUDIT_ANOMALY alerts.

**Cross-context replay:** session_id binding (IDP-04) plus endorsed_eod_id binding (IDP-05) create two independent cross-context barriers. A replayed IDP from a different session fails both session_id validation and endorsed_eod_id Event Log verification.

---

## SOOS stack context

IDP sits at **Level 2 — Session Foundation**, below the governance layer (HEM, CAP, GAR) but above the foundation layer (KIA, SOV).

IDP-05 depends on KIA (signing credentials, Party Registry for principal_credential validation in intake_endorsement), MJWT (mandate binding), SOV (session boundary and state machine — SO Type state machine used in SPO structural validation), and AEP-02 (EOD structure, endorsed_eod_id lifecycle, plan_b_ref in PLAN_B_ACTIVE state).

It is consumed by CAP (Cedar evaluates intent against prohibitions), HEM (CONFIDENCE_MISCALIBRATION_WARNING and PD-EOD external-system touch notifications route via HEM), GAR (Intent Declaration and Endorsed EOD are the audit roots for every session), and PT (confidence calibration is a Precision Score behavioral dimension).

Related drafts: [AEP](/drafts/aep) · [HEM](/drafts/hem) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [MJWT](/drafts/mjwt) · [KIA](/drafts/kia)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/idp)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-idp/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
