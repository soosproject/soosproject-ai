# Intent Declaration Primitive

Layer 2 — Session Foundation
**draft-sato-soos-idp-04**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-idp/)
See [SOOS Stack](/stack) implementation

---

## The problem

Every action an AI agent takes is a decision. Right now, none of those decisions are signed.

IDP defines the primitive that changes this: the **Intent Declaration** — a signed, structured statement of agent intent, bound to a mandate, issued before execution begins. Without a declared and signed intent, the governance layer has nothing to evaluate prohibitions against, and the audit layer has no anchor for its records.

**The design premise:** governance without declared intent is retrospective. IDP makes governance prospective — evaluated before the first action, not reconstructed after the last one.

---

## Messages to key audiences

### IETF Working Groups

IDP is relevant to the OAUTH, JOSE, and GNAP working groups. IDP is a profiled JWT — it builds on RFC 7519 (JSON Web Token) and RFC 9449 (DPoP) to add agentic-specific claims: mandate binding, context fingerprinting, reasoning mode, and cross-context replay protection.

The cross-context replay threat model (SA-04) is the primary security addition for Vienna review: a signed IDP proves intent was declared, not that the current execution context matches the context in which intent was declared. The session-binding claims (`session_id`, `gec_instance_id`, `action_sequence_number`) are IDP's mitigation for this class of attack.

To engage on IDP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-idp/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a signed intent declaration means your audit trail starts at the action — not at the decision. When something goes wrong, you can reconstruct what the agent did; you cannot prove what it declared it was trying to do before it started.

IDP closes this gap by requiring a signed, kernel-verified intent declaration before any governed execution begins. The declaration binds the agent's stated goal to its mandate, its identity, and its execution context. If the execution deviates from the declared intent, the deviation is detectable in GAR.

Without IDP: your audit trail is a log of actions. With IDP: your audit trail is a log of declared intents, each of which the actions are then evaluated against.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/idp)

### Privacy officers

IDP is the protocol-level mechanism for GDPR Article 5(1)(b) purpose limitation and APPI Article 17 purpose specification. The Intent Declaration is the machine-readable record that the agent declared a specific purpose before acting. Each subsequent action is evaluated against the declared purpose — actions outside the declared scope produce a GAR DENY record before they proceed.

For GDPR Data Protection Impact Assessments: IDP provides the "documented purpose limitation" evidence that DPIAs require for high-risk automated processing. The signed Intent Declaration is that documentation — produced at the kernel layer, not in a policy document.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS IDP (Intent Declaration Primitive, draft-sato-soos-idp-04). This produces a signed JWT-based Intent Declaration before any governed agent execution. The declaration must include: mandate binding (MJWT reference), goal declaration (typed, Cedar-evaluable), context package (reasoning_mode from 8-value taxonomy, time_budget_remaining, resource envelope), scope boundary, and session-binding claims (session_id, gec_instance_id, action_sequence_number). The kernel signs the declaration using KIA-attested credentials. Cross-context replay attacks are mitigated by verifying session_id matches the current active session. Mismatched session_id MUST be rejected with IDP-E007 and recorded in GAR."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `intent_id` | string | Unique identifier for this Intent Declaration |
| `mandate_id` | string | MJWT mandate reference — binds intent to authority |
| `goal_type` | string | Typed goal class (Cedar-evaluable) |
| `goal_scope` | object | Declared scope boundaries for this execution |
| `reasoning_mode` | enum | One of 8 declared modes (DIRECT, CHAIN, TREE, REFLEXIVE, DELEGATED, COLLABORATIVE, EXTENDED, CONSTRAINED) |
| `time_budget_remaining` | integer | Budget in seconds at declaration time |
| `session_id` | string | GEC session identifier — replay protection |
| `gec_instance_id` | string | KIA-attested GEC instance — replay protection |
| `action_sequence_number` | integer | Monotonically increasing per session |
| `kernel_signature` | string | KIA-attested signature over the full declaration |

**Minimal Cedar policy example:**

```cedar
// Permit execution only when intent declaration is present and session matches
permit (
  principal,
  action == Action::"ExecuteGovernedAction",
  resource
)
when {
  context.intent_declared == true &&
  context.session_id == context.active_session_id &&
  context.intent_not_expired == true
};
```

### Government and regulators

IDP is the protocol that makes purpose limitation enforceable at the kernel layer. A privacy regulator that requires AI systems to act only within declared purposes can point to IDP as the technical mechanism: before any action, the agent declares its purpose in a signed, kernel-verified record. Actions outside that declared purpose are blocked by CAP policy and recorded in GAR.

For Japan (APPI Article 17 — purpose specification): IDP provides the machine-readable purpose declaration that APPI requires, in a format that is auditable and verifiable by the Personal Information Protection Commission.

For GDPR (Article 5(1)(b) — purpose limitation): IDP's signed declaration and the GAR audit trail of purpose-compliant actions is the technical evidence layer for Data Protection Authority inquiries.

For collaboration on jurisdiction-specific intent declaration requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents act on stated intent that is neither signed nor verifiable. When an agent takes a harmful action, there is no proof of what it declared it was trying to accomplish before it started — only a record of what it did.

**Mechanism:** IDP requires a signed, structured Intent Declaration before any governed execution begins. The declaration binds the agent's goal to its mandate (MJWT), its identity (KIA attestation), and its execution context (reasoning mode, time budget, session ID). The kernel signs the declaration; any deviation from declared scope is detectable.

**Output:** A signed, mandate-bound Intent Declaration that is the root record for every governance event in the session. Every CAP evaluation, every HEM escalation, every GAR audit record in the session references the originating Intent Declaration.

**Who verifies it:** Privacy officers verifying purpose limitation compliance, compliance teams auditing agent behaviour against declared intent, security teams detecting cross-context replay attacks, and regulators requiring documented purpose specification.

---

## Reasoning mode taxonomy

IDP-04 formalises the reasoning mode field — a declaration of the cognitive mode the agent is operating in at time of intent declaration. Eight modes are defined:

| Mode | Description | Governance implications |
|---|---|---|
| `DIRECT` | Single-step execution, no multi-turn reasoning | Simplest CAP evaluation path |
| `CHAIN` | Sequential chain-of-thought, each step depends on last | Each step re-evaluated by kernel |
| `TREE` | Branching reasoning, multiple paths in parallel | CAP evaluation must cover all branches |
| `REFLEXIVE` | Self-evaluation loop before acting | Kernel waits for self-assessment output |
| `DELEGATED` | Sub-task delegated to another agent (MAD active) | MAD delegation chain verification required |
| `COLLABORATIVE` | Multi-agent joint reasoning, no single controlling agent | HEM_MULTI_PRINCIPAL_REQUIRED may apply |
| `EXTENDED` | Long-horizon reasoning across multiple sessions | Cross-session replay protections active |
| `CONSTRAINED` | Reasoning explicitly limited by operator policy | Verifiable against Cedar policy set |

The declared mode travels with the intent through the full execution lifecycle. Execution behaviour inconsistent with the declared mode is a governance anomaly recorded in GAR.

---

## Cross-context replay protection

A signed Intent Declaration created in one context must not be reusable in another. IDP-04 defines three normative protections:

**Mandate binding** — the Intent Declaration is cryptographically bound to the MJWT mandate. A replayed declaration fails mandate validation if the mandate has expired or the action is outside scope.

**Context fingerprint** — the Context Package includes a fingerprint of the execution environment at declaration time. A changed environment produces a fingerprint mismatch, recorded in GAR.

**Session anchor** — the Intent Declaration is anchored to the current SO session via `session_id`. An intent declared in session A cannot authorise an action in session B. Mismatched `session_id` MUST be rejected with IDP-E007 (SESSION_MISMATCH) and recorded in GAR.

---

## Use cases

**GDPR purpose limitation audit — healthcare AI**

A hospital deploys an agent to assist with patient record lookup for treatment planning. IDP requires the agent to declare its purpose — "treatment planning record access" — in a signed declaration before any record access begins. A subsequent attempt to access records for insurance billing purposes fails CAP evaluation (outside declared scope) and is recorded in GAR. The Data Protection Officer has a complete, machine-verifiable audit trail of declared purpose and all scope boundary violations.

**Multi-session extended research agent**

A research agent is given a mandate to conduct literature review across multiple sessions over several days. EXTENDED reasoning mode is declared in each session's Intent Declaration. Cross-session replay protections are active — an intent declaration from session 1 cannot be reused to authorise actions in session 4 without a new declaration bound to the current session's `session_id`. The GAR record for each session references its originating IDP, providing a coherent multi-session audit trail.

**Delegated sub-agent scope verification**

A parent agent delegates a sub-task to a child agent using MAD. The child agent produces its own Intent Declaration, bound to the delegation grant rather than the original mandate. The child's declared scope is verified against the MAD narrowing property — the child cannot declare a scope broader than the parent's. If it does, the declaration fails KIA signature verification and GAR records the attempted scope expansion.

---

## How this builds on existing work

**RFC 7519 (JSON Web Token)** defines the JWT format and claims model. IDP is a profiled JWT — it inherits JWT's signing, verification, and claims semantics, and adds agentic-specific claims: mandate binding, context fingerprinting, reasoning mode, and session-binding for replay protection.

**RFC 9449 (DPoP — Demonstrating Proof of Possession)** provides the proof-of-possession pattern that IDP's kernel signature builds on. The IDP signature proves that the declaring agent holds the KIA-attested key at the moment of declaration — not just that it knows the key.

**GDPR Article 5(1)(b) and APPI Article 17** establish the legal obligation for purpose specification and limitation in automated processing. IDP is the technical protocol that makes these obligations machine-verifiable at the kernel layer rather than policy-document-dependent.

**GNAP (RFC 9635)** addresses initial grant establishment between agents and authorisation servers. IDP is the intent-side complement: GNAP establishes what the agent is authorised to do; IDP is the agent's signed declaration of what it intends to do within that authorisation.

---

## Related work

**draft-singla-agent-identity-protocol** and related agent identity drafts address the identity layer for agentic systems — what credentials the agent holds. IDP is the intent layer that operates after identity is established: the agent's signed declaration of purpose and scope, bound to its verified identity.

**WIMSE (Workload Identity in Multi-Service Environments)** addresses workload-side identity for service-to-service authentication. IDP builds on WIMSE identity by binding the Intent Declaration to the KIA-attested GEC instance identifier — the governance-kernel-side proof that the declaring entity is the governed kernel, not an impersonator.

**OpenID Foundation (arxiv:2604.23280, April 2026)** acknowledges that cross-context replay in attenuated delegation chains is "largely unsolved." IDP's session-binding claims and context fingerprint are the kernel-layer mitigation for this class of attack as it applies to intent declarations in agentic execution.

---

## Security

**Key security properties:** The Intent Declaration is kernel-signed using KIA-attested credentials. A declaration signed by an entity that is not the current GEC instance fails KIA verification. Session-binding claims prevent cross-context replay. The kernel records the Intent Declaration in GAR as the first event of every governed execution session — the audit trail cannot exist without it.

**Cross-context replay:** The primary security addition in IDP-04. A valid Intent Declaration from session A cannot authorise actions in session B. `session_id` must match the current active session; mismatches produce IDP-E007 and a GAR record.

**Mandate expiry:** The Intent Declaration is bound to an MJWT mandate with a defined expiry. Declarations presented after mandate expiry fail validation. The MJWT narrowing property (INV-4) ensures that delegated intents cannot declare broader scope than the parent mandate permits.

**Open question (OQ-HEM-DLA-03):** Should IDP include a boolean `uncertainty_declared` field, allowing the agent to formally declare that it is operating at or near its confidence threshold? This would provide a structured bridge between LLM-HEM (model-layer signals) and SOOS-HEM (kernel-layer Class 5 trigger evaluation). Resolution is deferred to a future IDP manifest session.

**Session revocation:** When a session is revoked, the associated Intent Declaration is invalidated. Implementations MUST NOT accept Intent Declarations from revoked sessions for new action authorisations.

---

## SOOS stack context

IDP sits at **Level 2 — Session Foundation**, below the governance layer (HEM, CAP, GAR) but above the foundation layer (KIA, SOV). The intent must be established and signed before the governance layer can evaluate it.

IDP depends on KIA (signing credentials), MJWT (mandate binding), and SOV (session boundary and state machine). It is consumed by CAP (Cedar evaluates intent against prohibitions), HEM (scope boundary breach is a Class 2 trigger), GAR (Intent Declaration is the audit root for every session), AEP (governed execution loop begins with intent declaration), and MAD (delegation creates a child intent chain).

Related drafts: [HEM](/drafts/hem) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [MJWT](/drafts/mjwt) · [KIA](/drafts/kia)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/idp)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-idp/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
