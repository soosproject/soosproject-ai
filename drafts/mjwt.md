# Mandate JWT

Layer 0 — Foundation
**draft-sato-soos-mjwt-05**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems execute on behalf of principals. The principal's intent — what the agent is authorised to do, for how long, within what resource limits, at what trust level, under what data subject consent, and how deep it may delegate — must be carried in a machine-readable credential that the kernel can verify, the agent cannot modify, and auditors can reconstruct after the fact.

MJWT defines the Mandate JWT: the signed credential that encodes a principal's authorisation to an agent as a kernel-verifiable token. Not as a session cookie or API key. As a standards-track JWT profile with a defined claim set, an eight-dimensional delegation narrowing model, consent state binding, a bounded delegation depth, and an explicit resource envelope — issued by a principal, verified by a kernel, referenced on every governance record produced during execution.

**The design premise:** the mandate is the contract between the principal and the kernel. MJWT is the format that makes that contract machine-readable, cryptographically bound, non-repudiable, consent-grounded, and structurally incapable of runaway delegation.

---

## Messages to key audiences

### IETF Working Groups

MJWT is directly relevant to two working groups.

**WIMSE:** MJWT is a WIMSE workload credential profile. Where WIMSE provides the workload identity foundation (SVIDs, credential lifecycle), MJWT adds the governance layer: Sovereign Object instance binding, Cedar action set ceiling, human principal linkage, consent state, and a strictly-decrementing delegation depth ceiling. WIMSE is the agent's passport; MJWT is the authorisation permit with the terms of the mission written into it.

The `consent_scope` claim is a new category of claim for workload identity tokens. Existing workload identity tokens assert what the workload may do. `consent_scope` asserts under what legal consent the workload is operating: the data subject's consent reference, purpose codes, governing law citation, and expiry are bound cryptographically to the mandate at issuance. The Cedar policy engine evaluates `consent_scope` fields as execution context on every relevant action. This positions MJWT as a candidate AI agent governance profile for WIMSE.

**OAuth WG:** MJWT builds directly on RFC 7519 (JWT) and RFC 8693 (Token Exchange). MJWT is explicit that it does **not** use RFC 8693's optional `may_act` claim — the `delegation_chain` claim (adopted from the OAuth Actor Profile) plus issuance-time Narrowing Property enforcement provide an equivalent, arguably stronger guarantee: every hop's authority is cryptographically bound and structurally narrowed at issuance, rather than merely pre-authorized by grant.

To engage on MJWT: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a mandate credential format means your agents carry authorisation as environment variables, system prompts, or bespoke config objects — none of which are verifiable by a kernel, auditable by a third party, or structurally bounded against runaway delegation. And none of them carry the consent state that data protection law will increasingly require before an AI agent may process personal data on a user's behalf.

MJWT closes this gap. The MJWT token is what a principal issues to an agent before execution begins. The kernel runs a 13-step verification protocol before accepting the session, and every governance record produced during execution references the `jti` (mandate_id) from the MJWT.

Two things worth knowing before you deploy. First, **parent-mandate checks are a live re-verification, not a cache lookup**: Step 9 requires the GEC to cryptographically re-verify the parent mandate's current signature validity and revocation status at the moment a child mandate is used — a previously-verified copy is explicitly not sufficient, because a parent's signing key can be compromised or the parent can be revoked after the child was issued. Second, **every mandate now carries a delegation-depth ceiling that strictly decrements at each hop** (`max_delegation_depth`) — a mandate holder with depth 0 cannot issue any child mandate, closing an unbounded-delegation Denial of Service vector that earlier revisions named but didn't structurally close.

With MJWT: authorisation is explicit, kernel-verified, resource-bounded, consent-grounded, depth-bounded, and reconstruction-ready. The `sub_agent_scope` claim means consent scope never inflates across a multi-agent delegation chain without the root principal's explicit intent.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mjwt)

### Risk managers and legal

The `mandate_id` (jti) in the MJWT is the primary audit key for every governance record in GAR. Every HEM escalation, every CAP prohibition trigger, every consent exception activation, every ALE lifecycle event is recorded in GAR with the `mandate_id` from the active MJWT. The full execution history of any agent action is reconstructible from the `mandate_id` alone.

For data protection compliance: the `consent_scope` claim binds the agent's data processing authority directly to the data subject's consent record. The `purpose_codes` array aligns with APPI Article 17's purpose specification obligation. The `governing_law` field carries the specific law article (e.g., `APPI:2003:Art17`) so that every CAP enforcement decision is traceable to the legal instrument that governed it.

One operational point for compliance teams to be aware of: `consent_reference` is a **pointer** to the consent record, not the record itself, and the defense now requires implementations to actually fetch and validate that record at session start rather than trusting the MJWT's expiry timestamp alone — a stored reference correctly recording that consent existed at issuance doesn't guarantee it hasn't since been withdrawn. Implementations must declare an explicit fail-open-with-logging or fail-closed policy for when the consent system is unreachable, and may never silently treat an unreachable consent system as valid consent.

The `AI_AGENT_OPERATION` purpose code is new legal territory. A data subject who consents under this code is consenting to an agent acting autonomously in their name — not merely processing their data, but taking actions with binding consequences. Organisations deploying MJWT-governed agents under `AI_AGENT_OPERATION` should obtain legal review of whether their current consent forms and privacy notices cover this purpose, particularly in Japan (APPI) and the EU (GDPR Article 22).

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MJWT (Mandate JWT, draft-sato-soos-mjwt-05). This is an IETF JWT profile for agentic AI mandate credentials. The MJWT has standard JWT claims (iss, sub, aud, exp, iat, jti) plus SOOS-specific claims: `cedar_actions` (Cedar action set the agent may request), `human_principal_id` (the human who authorised the mandate), `so_id` (the specific Sovereign Object instance), `mandate_ceiling` (max GEC conformance level), `max_delegation_depth` (strictly-decrementing delegation depth ceiling — 0 means no further child mandates), `delegation_chain` (full issuance history), and `consent_scope` (data subject consent state including purpose_codes, governing_law, jurisdiction, expiry, and sub_agent_scope). The GEC runs a 13-step verification protocol in order: (1) audience binding, before signature verification; (2) algorithm check — reject alg:none before any claim is read; (3) Ed25519 signature; (4) temporal validity; (5) revocation; (6) SO instance binding; (7) human principal linkage; (8) mandate ceiling; (9) for child mandates, LIVE re-verification of the parent's current signature and revocation status — a cached copy is not sufficient — then Narrowing Property check; (10) Cedar action scope; (11) state/phase restrictions; (12) mission reference; (13) consent scope validation. The Narrowing Property has eight dimensions — the 7th is consent scope (sub_agent_scope: INHERIT >= RESTRICT >= NONE, default RESTRICT), the 8th is delegation depth (child max_delegation_depth MUST be strictly less than parent's, not merely equal)."

**Key MJWT-05 claims:**

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
| `max_delegation_depth` | integer | REQUIRED | Strictly-decrementing delegation depth ceiling; 0 = leaf |
| `delegation_chain` | array | REQUIRED (child) | Full mandate issuance history |
| `consent_scope` | object | CONDITIONAL | Data subject consent state — see below |
| `sub_agent_scope` | string | CONDITIONAL | INHERIT \| RESTRICT \| NONE |
| `purpose_code` | array | OPTIONAL | Top-level purpose codes for audit |

**`consent_scope` object fields:**

| Field | Type | Description |
|---|---|---|
| `data_subject_id` | string | Pseudonymized identifier — MUST NOT be directly identifying |
| `consent_reference` | string | URI or token ID pointing to the consent record (not the record itself) |
| `purpose_codes` | array | Purpose Code Registry entries (e.g., BOOKING, AI_AGENT_OPERATION) |
| `governing_law` | string | Law citation (e.g., "APPI:2003:Art17") |
| `jurisdiction` | string | ISO 3166-1 alpha-2 |
| `expiry` | string | ISO 8601 consent expiry timestamp |
| `sub_agent_scope` | string | INHERIT \| RESTRICT (default) \| NONE |

**Minimal MJWT-05 example with consent_scope and delegation depth:**

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
  "max_delegation_depth": 2,
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

The MJWT delegation_chain provides the machine-readable authority trail that regulators need to determine who authorised an AI action. For regulated industries where agent actions may have legal consequences — financial trades, medical decisions, procurement — the MJWT provides the non-repudiable record of which principal authorised the action, what scope they granted, whether the agent acted within that scope, and how many delegation hops separate the acting agent from the authorising principal.

The `consent_scope` claim directly addresses the consent obligation for AI agent operation that emerging AI governance frameworks identify as requiring clarification: when an AI agent acts as an autonomous principal on a natural person's behalf, what consent is required, and how should it be recorded? The `AI_AGENT_OPERATION` purpose code is MJWT's answer: a distinct purpose code, carried in a signed JWT, evaluated by the kernel before every relevant action, and recorded in the GAR audit record with the specific legal citation that governed the determination.

For jurisdiction-specific mandate credential requirements or government deployment consultations: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents carry authorisation in formats that are not kernel-verifiable, not consent-grounded, not structurally bounded against runaway delegation, and not auditable by design. There is no standard JWT profile for the mandate credential that governs agent execution.

**Mechanism:** MJWT is a JWT profile. A principal signs the token at issuance, binding the agent identity, the Cedar action scope, the human principal, the data subject consent state, the delegation depth ceiling, and the delegation ceiling. The kernel verifies the signature and runs a 13-step protocol before accepting the session — including, for child mandates, a live re-verification of the parent mandate's current validity rather than trusting a cached copy. Every governance record produced during execution references the jti (mandate_id).

**Output:** A signed JWT — mandate_id, principal identity, agent identity, action scope, consent state, delegation chain, delegation depth — that is the kernel's authority to execute on behalf of the principal. Its expiry, and the expiry of the embedded consent, are the kernel's authority to stop.

**Who verifies it:** Kernels at session establishment, auditors reconstructing execution history, regulators establishing accountability chains, and data protection authorities verifying that processing occurred under valid consent.

---

## The delegation model and Narrowing Property

MJWT enforces an eight-dimensional Narrowing Property across delegation hops. A sub-mandate is always a strict subset of its parent.

| Dimension | Narrowing rule |
|---|---|
| Sovereign Object scope | Child `so_id` MUST match parent |
| Cedar action scope | Child `cedar_actions` MUST be subset of parent |
| Permitted SO states | Child `permitted_states` MUST be subset of parent |
| Permitted lifecycle phases | Child `permitted_phases` MUST be subset of parent |
| Temporal validity | Child `exp` MUST NOT exceed parent `exp` |
| Mandate ceiling | Child `mandate_ceiling` MUST NOT exceed parent |
| Consent scope | `sub_agent_scope` ordering: INHERIT ≥ RESTRICT ≥ NONE |
| **Delegation depth** *(8th dimension)* | Child `max_delegation_depth` MUST be **strictly less than** parent's — equality is itself a violation |

The `sub_agent_scope` default is **RESTRICT**: sub-agents do not automatically inherit full consent scope. This prevents accidental consent scope inflation in multi-agent deployments. To grant inheritance, the issuing principal must explicitly set `sub_agent_scope: INHERIT`.

The delegation-depth dimension is unlike the other seven: it doesn't just cap inheritance, it forces the ceiling downward at every hop. A mandate holder whose `max_delegation_depth` is 0 cannot issue any child mandate — attempting to do so returns a dedicated deny code at issuance. This bounds both token size (which otherwise grows linearly with `delegation_chain` depth) and per-verification signature cost by construction, rather than leaving depth-limiting to deployment-specific operational policy.

Verification of the Narrowing Property is a live check, not a cache lookup. Before checking any of the eight dimensions against a parent mandate, the GEC MUST cryptographically re-verify that the parent's signature is still valid and that the parent has not since been revoked — a stored, previously-verified copy of the parent is explicitly insufficient. This closes a "parent-swap" class of attack: a delegation chain that correctly recorded a parent's issuance doesn't guarantee that parent is still valid at the moment a child mandate is actually used.

---

## Purpose Code Registry

MJWT defines the SOOS MJWT Purpose Code Registry (IANA, Specification Required, registered under the "SOOS Protocol Parameters" group with Designated Expert Guidance). Initial codes:

| Code | Description | Consent required |
|---|---|---|
| `BOOKING` | Agent booking a service on principal's behalf | No (general operation) |
| `PERSONAL_DATA_PROCESSING` | Agent processing personal data | Yes (APPI Art. 17) |
| `SERVICE_DELIVERY` | Delivering a service to the principal | No |
| `LEGAL_OBLIGATION` | Processing required by law | No (Art. 17 exception) |
| `LEGITIMATE_INTEREST` | Processing based on legitimate interest | No (Art. 17 exception) |
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

A Japanese traveller books through MyAuberge. The operator issues an MJWT with `consent_scope.purpose_codes: [BOOKING, AI_AGENT_OPERATION]`, `governing_law: "APPI:2003:Art17"`, and a 60-day consent expiry. When the booking agent requests a state transition on the Booking Object, the GEC checks `consent_scope.expiry` before Cedar evaluation, and fetches the live consent record via `consent_reference` rather than trusting the expiry field alone. If the consent has expired or been withdrawn, HEM_CONSENT_REQUIRED fires — the agent is blocked, the human principal is notified, and no action proceeds until fresh consent is confirmed. The GAR record carries the `consent_reference` and the specific law article that triggered the block.

**Multi-agent delegation with consent scope and depth attenuation**

An orchestrator agent holds a root mandate with `sub_agent_scope: RESTRICT`, `max_delegation_depth: 2`, and `purpose_codes: [BOOKING, AI_AGENT_OPERATION]`. It issues sub-mandates to three specialised agents: a weather monitor, a payment processor, and a customer communications agent — each receiving `max_delegation_depth: 1`. The weather monitor receives `sub_agent_scope: NONE`; it needs no personal data access, and with `max_delegation_depth: 1` it may issue at most one further hop of child mandates before hitting the floor. No sub-agent inherits the `AI_AGENT_OPERATION` purpose. If any sub-agent attempts to issue a grandchild mandate with `sub_agent_scope: INHERIT`, or with a `max_delegation_depth` equal to (not just greater than) its own, the GEC rejects it.

**Post-incident reconstruction**

Following an unexpected agent action, an auditor queries GAR for all records with `mandate_id: 019547ab-...`. The query returns the complete execution history. The MJWT is retrieved from audit storage: it shows the principal who issued the mandate, the cedar_actions granted, the consent_scope with `governing_law: "APPI:2003:Art17"`, the full delegation_chain, and the delegation depth remaining at each hop. The auditor can determine in minutes whether the action was within the authorised scope, whether valid consent was in place, and how far the acting agent sat from the root principal.

---

## How this builds on existing work

**RFC 7519 (JWT)** is the base specification. MJWT is a JWT profile — standard header and signature structures, SOOS-specific claims in the payload, and defined verification requirements. No new wire format.

**RFC 8693 (Token Exchange)** defines the OAuth token exchange flow; MJWT issuance is a token exchange in this sense. MJWT deliberately does not use RFC 8693's optional `may_act` claim — `delegation_chain` plus issuance-time Narrowing Property enforcement provides the equivalent guarantee structurally rather than by grant.

**WIMSE (Workload Identity in Multi-System Environments)** provides the workload identity foundation. MJWT profiles WIMSE credentials with SO-scoped governance claims and the consent_scope extension. WIMSE is the passport; MJWT is the authorisation permit.

**RFC 3552 / BCP 72** frames the delegation-depth-as-DoS-mitigation argument: an unbounded delegation chain is a cheap, amplifying denial-of-service vector, and `max_delegation_depth` closes it by construction rather than by operational policy.

---

## Related work

**OIDF-2025-01 (OpenID Foundation private_key_jwt vulnerability)** — MJWT's audience binding design (Step 1, before signature verification) directly addresses the class of attack this disclosure identified.

**CVE-2026-29000 (pac4j-jwt PlainJWT bypass, CVSS 10.0)** — demonstrated that a JWT pipeline accepting unsigned tokens exposes every governance-critical claim to attacker manipulation. MJWT's Step 2 algorithm check (before any claim is read) and the dedicated `MJWT_ALG_INVALID` deny code are the direct defense.

**McGuinness Actor Profile and Mission Bound Authorization** — the `delegation_chain` claim is adopted from the Actor Profile without modification. The `mission_ref` claim bridges to Mission Bound Authorization. These are complementary layers, not competing designs.

**draft-rampalli-pedigree** — names the "parent-swap" attack class that motivates MJWT's live parent re-verification requirement (Verification Step 9).

**draft-schrock-human-authorization-binding / draft-schrock-ep-authority-introduction** — MJWT explicitly does not bootstrap a human principal's own root-of-trust; it assumes that problem is solved externally. This is a community-wide open problem, not an MJWT-specific gap, and these drafts propose one candidate approach (a signed, hash-chained, transparency-logged authority document).

---

## Security

**Key security properties:**

- The MJWT signature MUST use Ed25519. Unsigned tokens (alg: none) MUST be rejected at Step 2, before any claim is processed.
- The `aud` claim is verified at Step 1, before signature verification, preventing cross-GEC replay and timing side-channels.
- The Narrowing Property — enforced at both mandate issuance and verification, across eight dimensions — prevents any sub-agent from exceeding the authority of the root human principal, and prevents unbounded delegation depth.
- Parent-mandate validity is re-verified live at every use, not read from a cache — closing the "parent-swap" attack class.
- Consent scope is fail-closed: an absent or expired `consent_scope` triggers HEM_CONSENT_REQUIRED. No implicit consent is ever inferred. Consent records are now fetched and validated live rather than trusted from the token's expiry field alone.
- The `sub_agent_scope: RESTRICT` default prevents consent scope inflation at every delegation step without explicit principal action.

**CVE-2026-29000 class (PlainJWT bypass):** MJWT defends against algorithm confusion attacks by: (a) making algorithm verification Step 2 (before signature verification), (b) defining MJWT_ALG_INVALID as a distinct deny code and GAR audit event, and (c) specifying that MJWT MUST be signed with Ed25519 — no other algorithm is accepted. Implementations MUST test their JWT parsing pipeline against unsigned token inputs.

**Human principal root-of-trust bootstrapping is explicitly out of scope.** MJWT specifies how a `human_principal_id` is bound into a Root Mandate and preserved through delegation. It does not specify how that human principal's own standing as a legitimate root of authority is established in the first place — that is assumed to be solved externally.

**Formal analysis status:** The delegation narrowing model and consent scope narrowing invariant have not been formally verified. Formal analysis of the eight-dimensional Narrowing Property against the multi-agent attacker model remains planned work.

---

## SOOS stack context

MJWT sits at **Level 0 — Foundation**, alongside KIA. It is issued before session establishment and verified before any Cedar evaluation occurs. It is consumed by every other SOOS draft: the `mandate_id` (jti) is referenced on every GAR record, every HEM escalation, every CAP evaluation, and every ALE lifecycle event. MAD's delegation model depends on MJWT's delegation_chain for multi-agent authority chains, and MJWT's Revocation Registry is the same registry KIA defines — not a second, parallel store. The consent_scope claim populates Cedar context fields that CAP-04 policies evaluate for the CAP_CONSENT_EXCEPTION_ACTIVATED ALE.

Related drafts: [KIA](/drafts/kia) · [IDP](/drafts/idp) · [MAD](/drafts/mad) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [HEM](/drafts/hem) · [SOV](/drafts/sov)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mjwt)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mjwt/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
