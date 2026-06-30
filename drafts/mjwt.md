# Mandate JWT

Layer 0 — Foundation
**draft-sato-soos-mjwt-02**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems execute on behalf of principals. The principal's intent — what the agent is authorised to do, for how long, within what resource limits, at what trust level, and under what data subject consent — must be carried in a machine-readable credential that the kernel can verify, the agent cannot modify, and auditors can reconstruct after the fact.

MJWT defines the Mandate JWT: the signed credential that encodes a principal's authorisation to an agent as a kernel-verifiable token. Not as a session cookie or API key. As a standards-track JWT profile with a defined claim set, a seven-dimensional delegation narrowing model, consent state binding, and an explicit resource envelope — issued by a principal, verified by a kernel, referenced on every governance record produced during execution.

**The design premise:** the mandate is the contract between the principal and the kernel. MJWT is the format that makes that contract machine-readable, cryptographically bound, non-repudiable, and consent-grounded.

---

## Messages to key audiences

### IETF Working Groups

MJWT is directly relevant to two working groups at IETF 126 Vienna.

**WIMSE:** MJWT is a WIMSE workload credential profile. Where WIMSE provides the workload identity foundation (SVIDs, credential lifecycle), MJWT adds the governance layer: Sovereign Object instance binding, Cedar action set ceiling, human principal linkage, and — new in -02 — consent state. WIMSE is the agent's passport; MJWT is the authorisation permit with the terms of the mission written into it.

The `consent_scope` claim introduced in -02 is a new category of claim for workload identity tokens. Existing workload identity tokens assert what the workload may do. `consent_scope` asserts under what legal consent the workload is operating: the data subject's consent reference, purpose codes, governing law citation, and expiry are bound cryptographically to the mandate at issuance. The Cedar policy engine evaluates `consent_scope` fields as execution context on every relevant action. The GAR audit record carries mandatory provenance fields tracing each enforcement decision back to the specific law article that governed it. WIMSE implementations that carry MJWT mandate credentials gain a complete consent governance chain — from principal issuance through kernel enforcement to tamper-evident audit — without additional infrastructure. This positions MJWT as a candidate AI agent governance profile for WIMSE.

**OAuth WG:** MJWT builds directly on RFC 7519 (JWT), RFC 8693 (Token Exchange), and the OIDF-2025-01 threat model. The `cedar_actions` claim corresponds to `authorization_details` in RFC 9396 (Rich Authorization Requests). MJWT tokens MAY be issued through a token exchange flow where the input token is an OAuth access token and the output is a Mandate JWT. MJWT does not replace OAuth; it extends it for the kernel governance use case.

The `AI_AGENT_OPERATION` purpose code in -02 is the first named AI-agent-specific consent purpose in any protocol specification. It addresses the novel consent obligation that arises when an agent acts autonomously on a data subject's behalf — not merely processing their data, but taking actions with legal or operational consequences in their name.

To engage on MJWT: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a mandate credential format means your agents carry authorisation as environment variables, system prompts, or bespoke config objects — none of which are verifiable by a kernel, auditable by a third party, or enforceable as a resource constraint. And none of them carry the consent state that data protection law will increasingly require before an AI agent may process personal data on a user's behalf.

MJWT closes this gap. The MJWT token is what a principal issues to an agent before execution begins. The kernel verifies the token signature at Step 1. Every governance record produced during execution references the `jti` (mandate_id) from the MJWT. The `consent_scope` claim tells the kernel exactly what the data subject consented to, under which law, and until when — without the kernel needing to query an external consent service on every action.

With MJWT: authorisation is explicit, kernel-verified, resource-bounded, consent-grounded, and reconstruction-ready. The `sub_agent_scope` claim means consent scope never inflates across a multi-agent delegation chain without the root principal's explicit intent.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mjwt)

### Risk managers and legal

The `mandate_id` (jti) in the MJWT is the primary audit key for every governance record in GAR. Every HEM escalation, every CAP prohibition trigger, every consent exception activation, every ALE lifecycle event is recorded in GAR with the `mandate_id` from the active MJWT. The full execution history of any agent action is reconstructible from the `mandate_id` alone.

For data protection compliance: the `consent_scope` claim in MJWT-02 binds the agent's data processing authority directly to the data subject's consent record. The `purpose_codes` array aligns with APPI Article 17's purpose specification obligation. The `governing_law` field carries the specific law article (e.g., `APPI:2003:Art17`) so that every CAP enforcement decision is traceable to the legal instrument that governed it. When a regulator asks "under what consent did the agent process this personal data?", the GAR record and the MJWT together provide the complete, tamper-evident answer.

The `AI_AGENT_OPERATION` purpose code is new legal territory. A data subject who consents under this code is consenting to an agent acting autonomously in their name — not merely processing their data, but taking actions with binding consequences. Organisations deploying MJWT-governed agents under `AI_AGENT_OPERATION` should obtain legal review of whether their current consent forms and privacy notices cover this purpose, particularly in Japan (APPI) and the EU (GDPR Article 22).

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MJWT (Mandate JWT, draft-sato-soos-mjwt-02). This is an IETF JWT profile for agentic AI mandate credentials. The MJWT has standard JWT claims (iss, sub, aud, exp, iat, jti) plus SOOS-specific claims: `cedar_actions` (Cedar action set the agent may request), `human_principal_id` (the human who authorised the mandate), `so_id` (the specific Sovereign Object instance), `mandate_ceiling` (max GEC conformance level), `delegation_chain` (full issuance history), and — new in -02 — `consent_scope` (data subject consent state including purpose_codes, governing_law, jurisdiction, expiry, and sub_agent_scope). The GEC runs a 13-step verification protocol: audience binding first, then algorithm check (reject alg:none), then signature, then revocation, then SO binding, then consent scope validation. The Narrowing Property has seven dimensions — the 7th is consent scope, which MUST NOT expand across delegation hops. `sub_agent_scope` values: INHERIT >= RESTRICT >= NONE; default is RESTRICT."

**Key MJWT-02 claims:**

| Claim | Type | Required | Description |
|---|---|---|---|
| `jti` (= mandate_id) | string | REQUIRED | Unique mandate identifier — primary audit key |
| `iss` | string | REQUIRED | Principal or GEC that issued this mandate |
| `sub` | string | REQUIRED | Agent WIMSE workload identity |
| `aud` | string | REQUIRED | KIA-attested GEC instance ID |
| `exp` | integer | REQUIRED | Unix timestamp of mandate expiry |
| `cedar_actions` | array | REQUIRED | Cedar action identifiers the agent may invoke |
| `human_principal_id` | string | REQUIRED | The human who authorised this mandate |
| `so_id` | string | REQUIRED | Sovereign Object instance UUID v7 |
| `mandate_ceiling` | integer | REQUIRED | 1, 2, or 3 — max GEC conformance level |
| `delegation_chain` | array | REQUIRED (child) | Full mandate issuance history |
| `consent_scope` | object | CONDITIONAL | Data subject consent state — see below |
| `sub_agent_scope` | string | CONDITIONAL | INHERIT \| RESTRICT \| NONE |
| `purpose_code` | array | OPTIONAL | Top-level purpose codes for audit |

**`consent_scope` object fields:**

| Field | Type | Description |
|---|---|---|
| `data_subject_id` | string | Pseudonymized identifier — MUST NOT be directly identifying |
| `consent_reference` | string | URI or token ID pointing to the consent record |
| `purpose_codes` | array | Purpose Code Registry entries (e.g., BOOKING, AI_AGENT_OPERATION) |
| `governing_law` | string | Law citation (e.g., "APPI:2003:Art17") |
| `jurisdiction` | string | ISO 3166-1 alpha-2 |
| `expiry` | string | ISO 8601 consent expiry timestamp |
| `sub_agent_scope` | string | INHERIT \| RESTRICT (default) \| NONE |

**Minimal MJWT-02 example with consent_scope:**

```json
{
  "jti": "019547ab-1234-7abc-8def-000000000001",
  "iss": "hp-001",
  "sub": "wimse:agent:booking-agent-v2",
  "aud": "sha256:a3f8c2d1e4b5...",
  "exp": 1749470400,
  "iat": 1749456000,
  "cedar_actions": ["atp:booking:confirm", "atp:booking:cancel"],
  "human_principal_id": "hp-001",
  "so_id": "019547ab-1234-7abc-8def-000000000099",
  "so_type_id": "atp/booking-object/1.0",
  "mandate_ceiling": 2,
  "consent_scope": {
    "data_subject_id": "ps-hp-001-sha256-truncated",
    "consent_reference": "https://consent.example.jp/records/c-2026-001",
    "consent_timestamp": "2026-06-15T08:00:00Z",
    "consenting_party": "SELF",
    "purpose_codes": ["BOOKING", "AI_AGENT_OPERATION"],
    "data_categories": ["contact", "travel_preference"],
    "jurisdiction": "JP",
    "governing_law": "APPI:2003:Art17",
    "expiry": "2026-08-15T08:00:00Z",
    "sub_agent_scope": "RESTRICT"
  },
  "sub_agent_scope": "RESTRICT",
  "purpose_code": ["BOOKING", "AI_AGENT_OPERATION"]
}
```

### Government and regulators

The MJWT delegation_chain provides the machine-readable authority trail that regulators need to determine who authorised an AI action. For regulated industries where agent actions may have legal consequences — financial trades, medical decisions, procurement — the MJWT provides the non-repudiable record of which principal authorised the action, what scope they granted, and whether the agent acted within that scope.

The `consent_scope` claim in MJWT-02 directly addresses the consent obligation for AI agent operation that emerging AI governance frameworks identify as requiring clarification: when an AI agent acts as an autonomous principal on a natural person's behalf, what consent is required, and how should it be recorded? The `AI_AGENT_OPERATION` purpose code is MJWT's answer: a distinct purpose code, carried in a signed JWT, evaluated by the kernel before every relevant action, and recorded in the GAR audit record with the specific legal citation that governed the determination.

For jurisdiction-specific mandate credential requirements or government deployment consultations: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents carry authorisation in formats that are not kernel-verifiable, not consent-grounded, and not auditable by design. There is no standard JWT profile for the mandate credential that governs agent execution.

**Mechanism:** MJWT is a JWT profile. A principal signs the token at issuance, binding the agent identity, the Cedar action scope, the human principal, the data subject consent state, and the delegation ceiling. The kernel verifies the signature and runs a 13-step protocol before accepting the session. Every governance record produced during execution references the jti (mandate_id).

**Output:** A signed JWT — mandate_id, principal identity, agent identity, action scope, consent state, delegation chain — that is the kernel's authority to execute on behalf of the principal. Its expiry, and the expiry of the embedded consent, are the kernel's authority to stop.

**Who verifies it:** Kernels at session establishment, auditors reconstructing execution history, regulators establishing accountability chains, and data protection authorities verifying that processing occurred under valid consent.

---

## The delegation model and Narrowing Property

MJWT enforces a seven-dimensional Narrowing Property across delegation hops. A sub-mandate is always a strict subset of its parent.

| Dimension | Narrowing rule |
|---|---|
| Sovereign Object scope | Child `so_id` MUST match parent |
| Cedar action scope | Child `cedar_actions` MUST be subset of parent |
| Permitted SO states | Child `permitted_states` MUST be subset of parent |
| Permitted lifecycle phases | Child `permitted_phases` MUST be subset of parent |
| Temporal validity | Child `exp` MUST NOT exceed parent `exp` |
| Mandate ceiling | Child `mandate_ceiling` MUST NOT exceed parent |
| **Consent scope** *(new in -02)* | `sub_agent_scope` ordering: INHERIT ≥ RESTRICT ≥ NONE |

The `sub_agent_scope` default is **RESTRICT**: sub-agents do not automatically inherit full consent scope. This prevents accidental consent scope inflation in multi-agent deployments. To grant inheritance, the issuing principal must explicitly set `sub_agent_scope: INHERIT`.

---

## Purpose Code Registry

MJWT-02 introduces the SOOS MJWT Purpose Code Registry (IANA, Specification Required). Initial codes:

| Code | Description | Consent required |
|---|---|---|
| `BOOKING` | Agent booking a service on principal's behalf | No (general operation) |
| `PERSONAL_DATA_PROCESSING` | Agent processing personal data | Yes (APPI Art. 17) |
| `SERVICE_DELIVERY` | Delivering a service to the principal | No |
| `LEGAL_OBLIGATION` | Processing required by law | No (Art. 17 exception) |
| `MARKETING` | Marketing communications | Yes (explicit) |
| `ANALYTICS` | Statistical analysis | Yes (explicit) |
| `THIRD_PARTY_TRANSFER` | Transfer to third party | Yes (APPI Art. 27) |
| `OVERSEAS_TRANSFER` | Transfer to overseas third party | Yes (APPI Art. 28) |
| `AI_AGENT_OPERATION` | Agent acting autonomously on data subject's behalf | Yes (novel purpose) |
| `HUMAN_SUPERVISION` | Processing under active human supervision | Context-dependent |
| `AUDIT_INSPECTION` | Audit or regulatory review access | Authorized Principal |

`AI_AGENT_OPERATION` is the first named AI-agent-specific consent purpose in any protocol specification. It is distinct from `PERSONAL_DATA_PROCESSING` because the data subject is not merely consenting to their data being processed — they are consenting to the agent acting as an autonomous principal in their name.

---

## Use cases

**Personal data processing with APPI compliance — Japan**

A Japanese traveller books through MyAuberge. The operator issues an MJWT with `consent_scope.purpose_codes: [BOOKING, AI_AGENT_OPERATION]`, `governing_law: "APPI:2003:Art17"`, and a 60-day consent expiry. When the booking agent requests a state transition on the Booking Object, the GEC checks `consent_scope.expiry` before Cedar evaluation. If the consent has expired, HEM_CONSENT_REQUIRED fires — the agent is blocked, the human principal is notified, and no action proceeds until fresh consent is confirmed. The GAR record carries the `consent_reference` and the specific law article that triggered the block. A APPI compliance audit can retrieve the complete consent chain from the GAR record alone.

**Multi-agent delegation with consent scope attenuation**

An orchestrator agent holds a root mandate with `sub_agent_scope: RESTRICT` and `purpose_codes: [BOOKING, AI_AGENT_OPERATION]`. It issues sub-mandates to three specialised agents: a weather monitor, a payment processor, and a customer communications agent. The weather monitor receives `sub_agent_scope: NONE` — it needs no personal data access. The payment processor receives `purpose_codes: [SERVICE_DELIVERY]` and `sub_agent_scope: NONE`. The communications agent receives `purpose_codes: [BOOKING]` and `sub_agent_scope: NONE`. No sub-agent inherits the `AI_AGENT_OPERATION` purpose. If any sub-agent attempts to issue a grandchild mandate with `sub_agent_scope: INHERIT`, the GEC rejects it with MJWT_SUB_AGENT_SCOPE_ESCALATION.

**Post-incident reconstruction**

Following an unexpected agent action, an auditor queries GAR for all records with `mandate_id: 019547ab-...`. The query returns the complete execution history. The MJWT is retrieved from audit storage: it shows the principal who issued the mandate, the cedar_actions granted, the consent_scope with `governing_law: "APPI:2003:Art17"`, and the full delegation_chain. The auditor can determine in minutes whether the action was within the authorised scope and whether valid consent was in place at the time of each action.

---

## How this builds on existing work

**RFC 7519 (JWT)** is the base specification. MJWT is a JWT profile — standard header and signature structures, SOOS-specific claims in the payload, and defined verification requirements. No new wire format.

**RFC 8693 (Token Exchange)** defines the OAuth token exchange flow. MJWT tokens MAY be obtained through a token exchange where the input is an OAuth access token and the output is a Mandate JWT. MJWT extends Token Exchange with the seven-dimensional Narrowing Property and governance binding.

**WIMSE (Workload Identity in Multi-System Environments)** provides the workload identity foundation. MJWT profiles WIMSE credentials with SO-scoped governance claims and the consent_scope extension. WIMSE is the passport; MJWT is the authorisation permit.

---

## Related work

**OIDF-2025-01 (OpenID Foundation private_key_jwt vulnerability)** — MJWT's audience binding design (Step 1, before signature verification) and the MJWT_ALG_INVALID deny code directly address the class of attack this disclosure identified. MJWT also defends against the PlainJWT bypass class demonstrated by CVE-2026-29000, which showed that a JWT pipeline that accepts unsigned tokens exposes all governance-critical claims to attacker manipulation.

**McGuinness Actor Profile and Mission Bound Authorization** — the `delegation_chain` claim is adopted from the Actor Profile without modification. The `mission_ref` claim bridges to Mission Bound Authorization. These are complementary layers, not competing designs.

---

## Security

**Key security properties:**

- The MJWT signature MUST use Ed25519. Unsigned tokens (alg: none) MUST be rejected at Step 2, before any claim is processed.
- The `aud` claim is verified at Step 1, before signature verification, preventing cross-GEC replay and timing side-channels.
- The Narrowing Property — enforced at both mandate issuance and verification — prevents any sub-agent from exceeding the authority of the root human principal on any of seven dimensions.
- Consent scope is fail-closed: an absent or expired `consent_scope` triggers HEM_CONSENT_REQUIRED. No implicit consent is ever inferred.
- The `sub_agent_scope: RESTRICT` default prevents consent scope inflation at every delegation step without explicit principal action.

**CVE-2026-29000 class (PlainJWT bypass):** MJWT defends against algorithm confusion attacks by: (a) making algorithm verification Step 2 (before signature verification), (b) defining MJWT_ALG_INVALID as a distinct deny code and GAR audit event, and (c) specifying that MJWT MUST be signed with Ed25519 — no other algorithm is accepted. Implementations MUST test their JWT parsing pipeline against unsigned token inputs.

**Formal analysis status:** The delegation narrowing model and consent scope narrowing invariant have not been formally verified. Formal analysis of the seven-dimensional Narrowing Property against the multi-agent attacker model is planned for the post-Vienna review period.

---

## SOOS stack context

MJWT sits at **Level 0 — Foundation**, alongside KIA. It is issued before session establishment and verified before any Cedar evaluation occurs. It is consumed by every other SOOS draft: the `mandate_id` (jti) is referenced on every GAR record, every HEM escalation, every CAP evaluation, and every ALE lifecycle event. MAD's delegation model depends on MJWT's delegation_chain for multi-agent authority chains. The consent_scope claim in -02 populates Cedar context fields that CAP-04 policies evaluate for the CAP_CONSENT_EXCEPTION_ACTIVATED ALE.

Related drafts: [KIA](/drafts/kia) · [IDP](/drafts/idp) · [MAD](/drafts/mad) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [HEM](/drafts/hem)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mjwt)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
