# Agent Identity Done Right: Authorization, Attestation, and Revocation for Agentic AI
## Most agent identity frameworks answer one question. SOOS answers six.

A human walks up to a bank teller. The teller asks for ID. The human shows a passport — government-issued, cryptographically difficult to forge, traceable to a real person who can be held accountable.

An AI agent walks up to a bank API. The system asks who it is. The agent presents... an OAuth token. The token says what scopes the agent was granted. It does not say who authorized those scopes, what the agent is prohibited from doing regardless of its scopes, whether the governance system running the agent is actually enforcing anything, or what happens when this agent spawns three more agents to complete the task.

The identity infrastructure the industry has was built for users and static software clients. It answers *who is calling* and *what they were granted*. That was sufficient when the caller was a human with a job title and a legal identity.

It is not sufficient when the caller is an autonomous system that can act at machine speed, on behalf of a person who may no longer be present, under instructions that may be ambiguous, across systems that have never interacted before.

SOOS answers the identity question completely — not by extending OAuth, but by specifying a governed identity chain that starts with the human and ends with a tamper-evident proof of every action the agent took.

---

## The five questions a system needs answered

When an AI agent shows up, five questions matter. SOOS specifies a normative answer to each.

---

### "Who sent you?"

**Answer: IDP — the Intent Declaration Primitive**

Before any action, the agent must present a signed Intent Declaration: what it intends to do, on behalf of which human principal, within which Sovereign Object instance, and within which time bounds.

This is not a capability claim ("I can do X"). It is a provenance record ("I was authorized to do X by principal Y, under mandate Z, signed at time T"). The kernel validates it before the agent acts. No valid IDP means no action — the gate is closed before any resource is touched.

The IDP is the machine-readable answer to the question that the [OpenID Foundation's agent identity whitepaper](https://arxiv.org/abs/2510.25819) identifies as unsolved: how do you establish the scope of delegated authority when the instruction arrives as unstructured natural language? The IDP is where that scope stops being a language interpretation problem and becomes a cryptographically verifiable fact.

→ [draft-sato-soos-idp](https://soosproject.ai/drafts/idp)

---

### "What are you allowed to do?"

**Answer: MJWT — the Mandate JWT**

The IDP establishes intent. The MJWT establishes the ceiling — the maximum authority this agent may exercise in this session. Three properties make it different from any existing credential:

**The agent cannot mint its own permissions.** The MJWT is signed by the human principal or their operator before the session begins. An agent that encounters a situation requiring more authority must escalate through HEM — it cannot self-issue an expanded mandate.

**The mandate is bound to a specific kernel instance.** The MJWT `aud` claim is a KIA-derived kernel instance identifier. This token cannot be replayed in a different execution environment. If stolen, it is useless elsewhere.

**The narrowing property is a cryptographic invariant.** When this agent delegates to a sub-agent, the child mandate is always a strict subset of the parent. Sub-agents cannot accumulate authority across delegation steps. The delegation tree can only narrow, never widen. This is the SOOS answer to what the OpenID Foundation paper calls *"recursive delegation without clear scope attenuation mechanisms"* — SOOS doesn't recommend attenuation, it makes violation impossible by construction.

→ [draft-sato-soos-mjwt](https://soosproject.ai/drafts/mjwt)

---

### "Who is actually governing you?"

**Answer: KIA — Kernel Identity Attestation**

This is the question no existing identity framework answers — and it is the most important one.

OAuth identifies the client. SPIFFE identifies the workload. Neither identifies the *governor*: the kernel that sits between the human's mandate and the agent's action, evaluating every step against a constitutional prohibition layer before it executes.

Without kernel identity, a resource provider cannot verify that the governance system the agent claims to be running under is actually running, actually enforcing, and actually the system it claims to be. A malicious process can impersonate a governance kernel. A misconfigured deployment can claim compliance it does not have.

KIA closes this gap with three components:

- **The GEC Identity Key (GIK)** — a keypair generated inside the kernel at initialization, never exported, used to sign all GAR audit records
- **A three-level attestation hierarchy** — L1 software attestation, L2 sidecar attestation, L3 hardware TEE (TPM / SGX / TrustZone)
- **The Attestation Manifest** — a signed document binding the kernel's identity to its configuration, its active CAP policy set, and its compliance profile hash

The canonical SOOS distinction: **WIMSE identifies the workload. KIA identifies the governor.**

Verifying the KIA attestation chain means you are not trusting the agent — you are trusting a cryptographically attested governance kernel whose policy set is known and whose every action is signed with a key that has never left that kernel's boundary.

→ [draft-sato-soos-kia](https://soosproject.ai/drafts/kia)

---

### "What are you prohibited from doing — regardless of what you were told?"

**Answer: CAP — the Constitutional AI Protocol**

Identity is not just about who you are and what you were granted. It is also about what you cannot do no matter who grants it.

Every SOOS-governed agent runs against a three-tier Cedar prohibition model loaded into the governance kernel at session start:

- **Tier 0-A** — absolute prohibitions derived from near-universal treaty consensus. No operator, deployer, or human principal can authorize these. No agent identity, no matter how credentialed, unlocks them.
- **Tier 0-B** — qualified absolute prohibitions, configurable only by formal regulatory clearance
- **Tier 1** — jurisdiction-specific legal requirements (APPI, GDPR, EU AI Act, financial regulations)
- **Tier 2** — operator ethical policies

When a resource provider verifies a SOOS agent's identity, they receive the CAP profile hash as part of the KIA attestation. They can independently verify which Cedar policies are running. They do not have to trust the agent's word about what it will or won't do — they can verify it from the policy set.

This is what makes SOOS identity materially different from any access-control-based approach: the prohibition layer is part of the identity claim, not separate from it.

→ [draft-sato-soos-cap](https://soosproject.ai/drafts/cap)

---

### "Can you prove all of this to me — right now, without prior relationship?"

**Answer: ACD — Agent Compliance Disclosure**

When a SOOS-governed agent approaches a resource provider for the first time, it can present an ACD Record on demand: a three-layer compliance disclosure that the resource provider can verify independently.

- **Layer 1 — Identity** — KIA-attested kernel identity, operator identity, jurisdiction
- **Layer 2 — Constitutional compliance** — active CAP profile hash; Cedar policy set fingerprint; tier-structured prohibition summary. The resource provider verifies this against the published policy set — no trust in the agent required.
- **Layer 3 — Session scope** — MJWT-derived authority ceiling for this session; delegation depth; resource bounds

The `acd_session_id` in the ACD Record becomes the bilateral correlation key — it appears in both the agent's GAR audit log and the resource provider's own compliance records. If there is ever a dispute about what the agent did, both sides have independently maintained records that can be correlated without relying on either party's unilateral account.

→ [soosproject.ai/drafts/acd](https://soosproject.ai/drafts/acd) *(outline complete — authoring post-Vienna)*

---

### "What happens when the answer to any of these questions changes?"

**Answer: MAD Agent Session Revocation**

Identity is not a one-time check at session start. An agent's authority can become invalid mid-session — the human principal withdraws consent, the operator terminates the deployment, the kernel detects a governance violation, or a parent agent is revoked and the cascade propagates to all its children.

SOOS specifies seven revocation trigger classes in MAD, each with a defined authority for who may initiate it and a normative completion state:

| Trigger | Condition | Continuation authority |
|---|---|---|
| R-1 | Human principal revocation | Human principal required |
| R-2 | Operator revocation | Operator with principal notification |
| R-3 | Kernel governance violation | Kernel (automatic) |
| R-4 | GEC compromise detected | Human principal required |
| R-5 | Mandate expiry | Automatic — no action needed |
| R-6 | Cascade from parent agent revocation | Inherits from parent trigger |
| R-7 | DEADLOCK — cluster coordinator detects unresolvable state | Kernel (automatic, with deadlock_timeout) |

Every revocation produces one of three completion states — **CLEAN** (all actions completed or rolled back within mandate), **PARTIAL** (some actions completed, state recorded), or **UNKNOWN** (kernel could not determine completion state). UNKNOWN is always treated as PARTIAL for audit purposes. A revoked session can never produce a false "clean completion" record.

**The CAEP connection.** When an agent's authority is revoked, resource providers that are already in an active session with that agent need to know immediately — they cannot wait for a token to expire. SOOS GAR produces CAEP-compatible Shared Signals Framework events on every R-1 through R-7 trigger. A resource provider subscribed to the agent's SSF stream receives a signed revocation event carrying the trigger class, the completion state, and the `acd_session_id` that correlates back to the bilateral audit record.

This is direct complementarity with Atul Tulshibagwale's CAEP work at CrowdStrike. CAEP specifies how to propagate continuous access evaluation signals. SOOS specifies what governance events trigger those signals and what state they carry. The two specifications work together at the interface between agent governance and resource provider security.

The narrowing property applies to revocation too: when a parent agent is revoked (R-1, R-2, R-4), all child mandates issued under it are automatically revoked in cascade (R-6). A delegation tree cannot survive the revocation of its root.

→ [draft-sato-soos-mad](https://soosproject.ai/drafts/mad)

---

## The complete identity chain

```
Human principal
  │
  ├─ signs MJWT ──────────────────────── "here is the authority ceiling"
  │
  └─ agent presents IDP ───────────────── "here is what I was told to do"
       │
       └─ kernel validates both
            │
            ├─ Cedar evaluates CAP ──────── "here is what is constitutionally forbidden"
            │
            ├─ kernel signs GAR records ─── "here is tamper-evident proof of every action"
            │
            ├─ kernel presents ACD ─────── "here is cryptographic proof of all of the above
            │    │                          to any resource provider, on demand"
            │    └─ resource provider verifies KIA attestation chain
            │         └─ "I trust the governor, not just the agent"
            │
            └─ revocation (R-1 through R-7)
                 │
                 ├─ kernel records CLEAN / PARTIAL / UNKNOWN completion in GAR
                 │
                 └─ CAEP/SSF event propagates to all active resource providers
                      └─ "authority withdrawn — here is the state at termination"
```

At no point does the agent have the ability to expand its own authority, bypass the constitutional layer, produce a false audit record, or impersonate a different governance context. The chain is enforced by the kernel, not by the agent's compliance.

---

## How this compares to existing approaches

| | OAuth 2.1 | SPIFFE | CrowdStrike Continuous Identity | SOOS |
|---|---|---|---|---|
| Identifies the caller | ✅ | ✅ | ✅ | ✅ |
| Identifies who authorized the call | ❌ | ❌ | Partial | ✅ IDP |
| Identifies the governor | ❌ | ❌ | ❌ | ✅ KIA |
| Cryptographic authority ceiling | ❌ | ❌ | ❌ | ✅ MJWT |
| Constitutional prohibition layer | ❌ | ❌ | ❌ | ✅ CAP |
| Cryptographic narrowing on sub-agents | ❌ | ❌ | ❌ | ✅ MAD |
| Mid-session revocation with defined completion states | ❌ | ❌ | Partial | ✅ MAD + CAEP |
| Revocation cascade to child agents | ❌ | ❌ | ❌ | ✅ MAD R-6 |
| Tamper-evident audit to regulator | ❌ | ❌ | ❌ | ✅ GAR |
| Provable to unknown resource provider | ❌ | ❌ | Partial | ✅ ACD |
| Traces action to specific law article | ❌ | ❌ | ❌ | ✅ CAP-RRS + GAR |

Existing approaches extend **authorization** into the agent context. SOOS provides **constitutional governance** — a layer above authorization that cannot be overridden by any party in the chain, enforced at runtime, and provable on demand to any third party.

---

## For IETF participants

SOOS builds on and complements the identity standards the community is already working on. It is not a replacement for any of them.

**WIMSE** is the workload identity substrate SOOS builds on. MJWT is a WIMSE workload credential profile with SOOS governance claims. KIA sits above WIMSE: WIMSE identifies what is running; KIA identifies what is governing.

**RFC 8693 Token Exchange** — MJWT delegation follows RFC 8693 Actor Profile semantics with the additional narrowing invariant.

**CAEP / SSF** — GAR produces CAEP-compatible events for revocation propagation. Atul Tulshibagwale's CAEP work is a direct complement to SOOS's audit chain.

**SCITT** — GAR's Merkle anchoring is structurally aligned with SCITT's transparent ledger model.

The OpenID Foundation's October 2025 whitepaper ([arXiv:2510.25819](https://arxiv.org/abs/2510.25819)) correctly identifies the problems: auditability gap, scalable consent, recursive delegation, trustworthy autonomy. SOOS is the runtime layer that closes them. Several of the whitepaper's authors are part of the Vienna engagement — we see this as a collaborative relationship, not a competitive one.

---

## For app builders

```json
// What a SOOS-governed agent presents when a resource asks "who are you?"
{
  "idp": {
    "intent": "retrieve_guest_booking",
    "principal_id": "guest-uuid-123",
    "so_id": "myauberge-ponyhouse-booking-so",
    "authorized_at": "2026-07-01T09:00:00Z",
    "session_limit": "2026-07-01T12:00:00Z"
  },
  "mjwt": {
    "iss": "myauberge-operator",
    "sub": "booking-agent-v2",
    "aud": "kia:gec-instance-a1b2c3",
    "scope": "read:booking write:confirmation",
    "delegation_depth": 0,
    "resource_bound": "SMALL"
  },
  "kia_attestation": {
    "level": "L2",
    "cap_profile_id": "myauberge-appi-profile-v1",
    "cap_profile_hash": "sha256:abc123...",
    "gik_fingerprint": "sha256:def456..."
  }
}
```

Three checks, all independently verifiable:
1. MJWT is operator-signed and not expired
2. MJWT `aud` matches the KIA-attested kernel instance — this token cannot run in a different kernel
3. `cap_profile_hash` matches the published policy set — you know exactly what Cedar policies govern this agent

No prior relationship with this agent required. No trust in the agent's word required.

---

## For government and regulators

The identity question for regulators is not just "who is this agent" — it is "can you prove what it did, under whose authority, governed by which law?"

SOOS answers that question with a complete chain: every agent action in a SOOS-governed session produces a GAR record that carries the KIA-signed Merkle root, the `authority_source_uri` pointing to the specific law article on e-Gov, and the `cap_rrs_control_id` identifying the exact OSCAL control that governed the action.

A regulator querying for "every agent action governed by APPI Article 28 in the last six months" gets a complete, tamper-evident, independently verifiable answer. The chain from the human's original authorization to the specific law that governed every subsequent action is unbroken and auditable.

Agent identity in SOOS is not a credential. It is a provenance chain.

→ [soosproject.ai/government](https://soosproject.ai/government) · [draft-sato-soos-cap-rrs](https://soosproject.ai/drafts/cap-rrs)

---

## The drafts behind this page

| Draft | Role in agent identity | Status |
|---|---|---|
| [IDP](https://soosproject.ai/drafts/idp) | "Who sent you?" — signed intent before every action | Datatracker |
| [MJWT](https://soosproject.ai/drafts/mjwt) | "What are you allowed to do?" — principal-signed mandate ceiling | Datatracker |
| [KIA](https://soosproject.ai/drafts/kia) | "Who governs you?" — kernel attestation chain | Datatracker |
| [CAP](https://soosproject.ai/drafts/cap) | "What are you prohibited from doing?" — constitutional layer | Datatracker |
| [ACD](https://soosproject.ai/drafts/acd) | "Can you prove it?" — compliance disclosure on demand | Outline complete; post-Vienna |
| [MAD](https://soosproject.ai/drafts/mad) | "What happens when it changes?" — revocation (R-1–R-7), cascade, CAEP propagation; narrowing on sub-agents | Datatracker |
| [GAR](https://soosproject.ai/drafts/gar) | Tamper-evident proof of every action and every revocation event | Datatracker |

---

## Contribute

SOOS is an open IETF individual submission suite. All drafts are on [Datatracker](https://datatracker.ietf.org/doc/search/?name=draft-sato-soos&activedrafts=on). The agent identity architecture is being discussed in WIMSE, RATS, and the OpenID Foundation AI Identity Community Group.

IETF 126 Vienna, July 18–24, 2026, is the next engagement point.

[GitHub](https://github.com/soosproject/soosproject-ai) · [All drafts](https://soosproject.ai/drafts) · [SOOS stack](https://soosproject.ai/stack)
