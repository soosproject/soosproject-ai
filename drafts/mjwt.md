# Mandate JWT

Layer 0 — Foundation
**draft-sato-soos-mjwt-01**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems execute on behalf of principals. The principal's intent — what the agent is authorised to do, for how long, within what resource limits, at what trust level — must be carried in a machine-readable credential that the kernel can verify, the agent cannot modify, and auditors can reconstruct after the fact.

MJWT defines the Mandate JWT: the signed credential that encodes a principal's authorisation to an agent as a kernel-verifiable token. Not as a session cookie or API key. As a standards-track JWT profile with a defined claim set, a normative delegation chain model, and an explicit resource envelope — issued by a principal, verified by a kernel, referenced on every governance record produced during execution.

**The design premise:** the mandate is the contract between the principal and the kernel. MJWT is the format that makes that contract machine-readable, cryptographically bound, and non-repudiable.

---

## Messages to key audiences

### IETF Working Groups

MJWT is directly relevant to the OAUTH working group. It is a JWT profile — it builds on RFC 7519 (JWT), RFC 8693 (Token Exchange), and the OIDF-2025-01 threat model for agentic AI delegation. MJWT introduces claims that are not present in existing JWT profiles: `mandate_scope`, `resource_envelope`, `trust_floor`, `goal_scope`, and the `delegation_chain` array for attenuated delegation.

MJWT is also relevant to the WIMSE working group. The delegation_chain claim encodes the principal hierarchy in a format that WIMSE workload identity specifications can reference when evaluating cross-workload delegation authority.

The relationship between MJWT and OAuth 2.0 token exchange (RFC 8693) is explicitly defined: MJWT tokens MAY be issued through a token exchange flow where the subject token is an OAuth access token and the requested token is a Mandate JWT. MJWT does not replace OAuth; it extends it for the kernel governance use case.

To engage on MJWT: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a mandate credential format means your agents carry authorisation as environment variables, system prompts, or bespoke config objects — none of which are verifiable by a kernel, auditable by a third party, or enforceable as a resource constraint.

MJWT closes this gap by specifying the JWT profile for agent mandates. The MJWT token is what a principal issues to an agent before execution begins. The kernel verifies the token signature before accepting the session. Every governance record produced during execution references the mandate_id from the MJWT. At the end of the session, the full execution can be reconstructed from the mandate_id alone.

Without MJWT: authorisation is implicit and unverifiable. With MJWT: authorisation is explicit, kernel-verified, resource-bounded, and reconstruction-ready.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mjwt)

### Risk managers and legal

The mandate_id in the MJWT is the primary audit key for every governance record in GAR. Every HEM escalation, every CAP prohibition trigger, every PT trust state transition, every ALE lifecycle event is recorded in GAR with the mandate_id from the active MJWT. This means the full execution history of any agent action is reconstructible from the mandate_id — without requiring session logs, application-layer records, or agent-reported data.

For legal non-repudiation: the MJWT is signed by the principal at issuance. The signature cannot be modified after issuance. The delegation_chain claim records every principal in the authority chain. If an agent action is disputed, the MJWT provides the cryptographic proof of what the principal authorised — and the GAR records prove what the agent actually did.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MJWT (Mandate JWT, draft-sato-soos-mjwt-01). This is an IETF JWT profile for agentic AI mandate credentials. The MJWT has standard JWT claims (iss, sub, aud, exp, iat, jti) plus SOOS-specific claims: mandate_scope (Cedar action set), resource_envelope (compute/memory/storage/network/duration limits), trust_floor (minimum PT score for continued execution), goal_scope (optional high-level goal binding), and delegation_chain (array of prior MJWTs in an attenuated delegation). The kernel verifies MJWT signature before accepting any agent session. mandate_id (= jti) is referenced on every GAR record."

**Key MJWT claims:**

| Claim | Type | Description |
|---|---|---|
| `jti` (= mandate_id) | string | Unique mandate identifier — primary audit key |
| `iss` | string | Principal that issued this mandate |
| `sub` | string | Agent identity (KIA gec_id or agent identifier) |
| `aud` | string | GEC instance this mandate is bound to |
| `exp` | integer | Unix timestamp of mandate expiry |
| `mandate_scope` | array | Cedar action identifiers the agent is authorised to invoke |
| `trust_floor` | float | Minimum PT composite score for continued execution |
| `goal_scope` | string | Optional: high-level goal this mandate is intended to achieve |
| `resource_envelope` | object | Resource limits (see below) |
| `delegation_chain` | array | Prior MJWT jti values in attenuation chain (if delegated) |
| `pt_weights` | object | Per-dimension scoring weights for PT engine |

**Resource envelope fields:**

| Field | Type | Description |
|---|---|---|
| `max_compute_units` | integer | Maximum compute units for this mandate |
| `max_memory_bytes` | integer | Maximum memory allocation |
| `max_storage_bytes` | integer | Maximum storage write |
| `max_network_egress_bytes` | integer | Maximum outbound network traffic |
| `max_duration_seconds` | integer | Maximum wall-clock duration |

**Minimal MJWT example:**

```json
{
  "jti": "mandate-a1b2c3d4",
  "iss": "principal:tom-sato@myauberge.jp",
  "sub": "agent:procurement-agent-7",
  "aud": "gec-prod-7f3a2c",
  "exp": 1749470400,
  "iat": 1749456000,
  "mandate_scope": ["Action::ReadSupplierData", "Action::DraftPurchaseOrder"],
  "trust_floor": 0.6,
  "goal_scope": "Identify three qualified suppliers for Q3 procurement",
  "resource_envelope": {
    "max_compute_units": 10000,
    "max_memory_bytes": 536870912,
    "max_duration_seconds": 14400
  },
  "delegation_chain": []
}
```

### Government and regulators

The MJWT delegation_chain claim provides the machine-readable authority trail that regulators need to determine who authorised an AI action. For regulated industries where agent actions may have legal consequences — financial trades, medical decisions, legal filings — the MJWT provides the non-repudiable record of which principal authorised the action, what scope they granted, and whether the agent acted within that scope.

For AI liability frameworks: MJWT establishes the jurisdictional principle of principal accountability. The iss claim identifies who issued the mandate; the delegation_chain identifies who that principal received authority from. Liability traces back through the chain to the human principal who initiated it.

For collaboration on jurisdiction-specific mandate credential requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents carry authorisation in formats that are not kernel-verifiable, not resource-bounded, and not auditable by design. There is no standard JWT profile for the mandate credential that governs agent execution.

**Mechanism:** MJWT is a JWT profile. A principal signs the token at issuance, binding the agent identity, the Cedar action scope, the resource envelope, and the PT trust floor. The kernel verifies the signature before accepting the session. Every governance record produced during execution references the jti (mandate_id). The MJWT is the thread that connects every GAR record back to the principal who authorised the execution.

**Output:** A signed JWT — mandate_id, principal identity, agent identity, action scope, resource limits, trust floor, delegation chain — that is the kernel's authority to execute on behalf of the principal. Its expiry is the kernel's authority to stop.

**Who verifies it:** Kernels at session establishment, auditors reconstructing execution history, regulators establishing accountability chains, and relying parties evaluating whether an agent action was within the scope that its principal authorised.

---

## The delegation model

MJWT supports attenuated delegation: a principal may issue a mandate to an agent that itself issues a sub-mandate to a sub-agent. Each delegation step MUST NOT expand scope — it may only attenuate (restrict) the scope of the delegating mandate.

| Property | Requirement |
|---|---|
| Scope attenuation | Sub-mandate Cedar action set MUST be a subset of parent mandate action set |
| Resource attenuation | Sub-mandate resource envelope MUST NOT exceed parent resource envelope |
| Expiry | Sub-mandate expiry MUST NOT exceed parent mandate expiry |
| Trust floor | Sub-mandate trust_floor MUST NOT be lower than parent mandate trust_floor |
| Chain recording | Each delegation appends the parent jti to delegation_chain |

A kernel that receives an MJWT with a non-empty delegation_chain MUST verify the full chain before accepting the session. A chain that violates the attenuation requirement is invalid; the session is rejected.

---

## Use cases

**Resource-bounded autonomous procurement**

A principal issues an MJWT for a procurement agent: `max_duration_seconds: 14400` (4-hour window), `max_compute_units: 10000`, `mandate_scope: [ReadSupplierData, DraftPurchaseOrder]`. The kernel loads the resource envelope. When the agent approaches the compute limit, the PT resource efficiency dimension score begins declining. When `max_duration_seconds` expires, the mandate expires — the kernel rejects further Cedar evaluations. Nothing continues past the authorised window.

**Multi-agent delegation chain**

A principal issues an MJWT to an orchestrator agent. The orchestrator issues sub-mandates to three specialised sub-agents — each with a subset of the orchestrator's scope and a proportional fraction of the resource envelope. Each sub-mandate's delegation_chain contains the orchestrator's jti. The kernel for each sub-agent verifies the full chain. If any link in the chain has been revoked (Revocation Registry), all sub-agent sessions are rejected.

**Post-incident mandate reconstruction**

Following an unexpected agent action, an auditor queries GAR for all records with mandate_id `mandate-a1b2c3d4`. The query returns the complete execution history: every Cedar evaluation, every HEM escalation, every PT trust state transition, every ALE lifecycle event. The MJWT for that mandate_id is retrieved from the audit store: it shows the principal who issued the mandate, the scope that was granted, and the resource envelope. The auditor can determine within minutes whether the action was within the authorised scope.

---

## How this builds on existing work

**RFC 7519 (JWT)** is the base specification. MJWT is a profile of JWT — it uses standard JWT header and signature structures, adds SOOS-specific claims in the payload, and defines the verification requirements for kernel implementations.

**RFC 8693 (Token Exchange)** defines the OAuth token exchange flow. MJWT tokens MAY be obtained through a token exchange where the input token is an OAuth access token and the output is a Mandate JWT. This allows MJWT to compose with existing OAuth infrastructure without replacing it.

**OIDF-2025-01 (OpenID Foundation agentic AI threat model)** identifies the key attack vectors in agentic AI delegation: confused deputy, scope creep, orphaned delegation, and principal confusion. MJWT's attenuation requirement directly addresses scope creep; the delegation_chain addresses orphaned delegation; the aud claim bound to the specific GEC addresses confused deputy.

---

## Related work

**draft-ietf-oauth-security-topics** — MJWT's attenuation requirement addresses the scope creep attack vector documented in the OAuth security topics. MJWT implements "audience-restricted, scope-attenuated delegation" as a normative requirement, not a security recommendation.

**WIMSE (Workload Identity in Multi-System Environments)** — the delegation_chain in MJWT is designed to interoperate with WIMSE workload identity chains. A WIMSE SVID MAY reference a MJWT mandate_id to assert governance context for workload-to-workload calls.

**OpenAI Workload Identity Federation** — WIF handles the credential at the access layer; MJWT handles the mandate at the governance layer. They are complementary: a WIF credential may be the authentication mechanism through which a principal presents itself to issue an MJWT.

---

## Security

**Key security properties:** The MJWT signature is required — unsigned tokens MUST be rejected by conforming kernels. The aud claim MUST be bound to the specific GEC instance, preventing mandate replay across kernels. The delegation_chain is immutable after issuance — any attempt to modify the chain is detectable by signature verification.

**Mandate expiry is final:** When `exp` is reached, the kernel MUST reject Cedar evaluations for the expired mandate. There is no grace period. Agents that require extended execution must receive a new MJWT from their principal before expiry — the kernel cannot extend a mandate autonomously.

**Resource envelope enforcement:** The resource_envelope fields are normative constraints enforced by the kernel, not advisory limits for the agent. An agent that exceeds `max_compute_units` receives CEDAR_DENY. The GAR record documents the resource violation.

**Formal analysis status:** The delegation attenuation model has not been formally verified. The attack vectors from OIDF-2025-01 are addressed by design; formal analysis of the attenuation chain is planned for post-Vienna review.

---

## SOOS stack context

MJWT sits at **Level 0 — Foundation**, alongside KIA. It is issued before session establishment and verified before any Cedar evaluation occurs. It is consumed by every other SOOS draft: the mandate_id (jti) is referenced on every GAR record, every HEM escalation, every PT score cycle, and every ALE lifecycle event. MAD's delegation model depends on MJWT's delegation_chain for multi-agent authority chains. PT uses the trust_floor and pt_weights claims as scoring parameters.

Related drafts: [KIA](/drafts/kia) · [IDP](/drafts/idp) · [MAD](/drafts/mad) · [PT](/drafts/pt) · [GAR](/drafts/gar)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mjwt)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
