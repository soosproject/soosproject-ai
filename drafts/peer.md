# PEER — Cross-Principal Agent Communication
Layer 6 — Cross-Principal Audit Correlation
**draft-sato-soos-peer-00**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-peer/) · [SOOS Stack](https://soosproject.ai)

---

## The problem

Two AI agents — each operating under a different company's mandate, each governed
by its own enforcement kernel — send a booking request across a trust boundary.
When the transaction completes, each agent produces its own audit record.
Without a shared identifier that both sides independently computed, there is
no way to prove the record on Side A describes the same transaction as the
record on Side B.

Existing SOOS protocols govern agents within one mandate tree.
PEER governs what happens when two independent trees transact with each other.

The design premise: auditability does not stop at the edge of your own GEC.
A cross-principal transaction is only auditable if both sides' records
can be provably linked — and that link must not require trusting either party's
self-report.

---

## Messages to key audiences

### IETF Working Groups

PEER is a problem statement and architecture draft targeting the cross-domain
audit correlation gap identified but left open by
`draft-kuehlewind-audit-architecture-00` (Kühlewind/Birkholz, Ericsson/Fraunhofer,
May 2026). Their draft requires "consistent use of shared identifiers across all
participants" — a condition that cannot hold when participants have independent
mandate roots and independent GECs. PEER fills exactly this gap.

SOOS GAR (`draft-sato-soos-gar-03`) provides normative implementations of
WI-1, WI-4, WI-5, and WI-6 from the Kuehlewind/Birkholz work item list.
PEER addresses their cross-domain open case via the PEER Transaction Record (PTR)
and jointly-derived `ptxn_id`. The `ptxn_id` derivation uses UUID-v5 with both
GECs contributing entropy (nonce), producing a shared identifier through shared
action rather than pre-existing shared infrastructure.

Open normative questions carried to PEER-01 (post-Vienna): dispute resolution
(OQ-PEER-03), minimum disclosure under APPI/GDPR (OQ-PEER-05), full ALE-PEER
schemas (OQ-PEER-07), FAIP interaction (OQ-PEER-08), GAR→SCITT Signed Statement
mapping (OQ-PEER-09).

AIP (`draft-prakash-aip-00`) IBCT is a candidate transport token for the
mutual attestation handshake. PEER and AIP compose; they do not compete.

### App builders

If your agent calls another organization's agent — a booking, a webhook, a
settlement — PEER is the governance layer you add around that call.

What you implement:
1. **Mutual attestation**: present your agent's KIA identity; validate theirs.
2. **Pre-call gates**: run an RGP capability query and, if they're a regulated
   provider, an ACD compliance query before sending your payload.
3. **PTR generation**: your GEC generates a `ptxn_id` after both nonces are
   exchanged. Their GEC countersigns. Both sides store the PTR in their GAR chains.
4. **Nothing else**: PEER does not govern the payload. Your ATP booking request,
   your REST call, your webhook body — unchanged.

The soos-peer crate (KernelSpec v4, Level 4) provides the `ptxn_id` derivation
function and PTR serialization. The GEC handles Steps 1–3 automatically when
an outbound cross-principal AEP session is opened.

Full normative SDK guidance is deferred to PEER-01 post-Vienna. The candidate
PTR schema is stable; begin integration planning now.

### Regulators and policy teams

When an AI agent acts on behalf of one company by calling another company's AI
agent, two separate audit trails are created — one at each company. Without a
protocol-level linkage, a regulator examining a disputed transaction cannot
confirm that Company A's audit record and Company B's audit record describe the
same event.

PEER solves this by requiring both agents to jointly produce a
`ptxn_id` — a transaction identifier that neither agent can forge without the
other's cryptographic participation. Both audit trails include this identifier.
A regulator holding both companies' audit exports can reconstruct the
cross-company transaction by matching `ptxn_id` values.

The responding agent's countersignature provides non-repudiation: once
countersigned, the responding party cannot credibly deny participation.

PEER does not require either company to disclose its internal AI policies to the
other. The PTR contains identities, a timestamp, and a correlation key — not
mandate contents or constitutional configurations.

Relevant regulatory contexts: EU AI Act Article 13 (traceability for high-risk
systems); APPI Article 17 (third-party provision records); financial services
transaction audit requirements.

### Agentic AI and coding assistants

> You are implementing a SOOS PEER exchange for a cross-principal agent
> transaction. The PEER protocol requires three steps before the payload is
> sent: (1) mutual KIA attestation, (2) RGP + ACD pre-call gates, (3) PTR
> generation with jointly-derived ptxn_id. Use the following schema for the
> PTR. The ptxn_id is UUID-v5 derived from: initiating_kia_id ||
> responding_kia_id || initiated_at || initiating_nonce || responding_nonce.
> The responding GEC countersigns the ptxn_id. Both sides store the PTR as
> an ALE-PEER-02 event in their GAR chain. Do not send the payload until
> ALE-PEER-02 is recorded on both sides.

Key PTR schema fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `ptxn_id` | string (UUID-v5) | REQUIRED | Jointly-derived transaction ID |
| `initiating_principal_kia` | string | REQUIRED | Initiating agent KIA identity |
| `responding_principal_kia` | string | REQUIRED | Responding agent KIA identity |
| `initiated_at` | ISO 8601 UTC | REQUIRED | Timestamp of responding nonce receipt |
| `initiating_nonce` | string | REQUIRED | GEC-A entropy contribution |
| `responding_nonce` | string | REQUIRED | GEC-B entropy contribution |
| `responding_gec_countersignature` | string | RECOMMENDED | GEC-B signature over ptxn_id |
| `rgp_resource_id` | string | OPTIONAL | From RGP Stage 1 fingerprint |
| `acd_session_id` | string | CONDITIONAL | Required if responding agent is regulated |
| `transaction_class` | enum | REQUIRED | API_CALL, WEBHOOK, BOOKING_REQUEST, SETTLEMENT, DATA_EXCHANGE |
| `domain_transaction_ref` | string | OPTIONAL | ATP Booking Object ID or equivalent |

ALE-PEER event types: `MUTUAL_ATTESTATION_COMPLETE` · `PTXN_ID_ISSUED` ·
`PEER_TRANSACTION_COMPLETE` · `PEER_ATTESTATION_FAILED`

Depends on: `draft-sato-soos-kia-03`, `draft-sato-soos-aep-02`,
`draft-sato-soos-gar-03`, `draft-sato-soos-rgp-00`, `draft-sato-soos-acd-00`,
`draft-sato-soos-kee-00`

### Government and regulators

Cross-border AI agent transactions — a booking made in Japan, fulfilled by a
supplier in another jurisdiction — produce audit records in two separate legal
environments. PEER provides a jurisdiction-neutral correlation mechanism: the
`ptxn_id` is jointly derived from both agents' identities and does not depend
on any shared government registry, shared identifier space, or bilateral agreement
between regulators.

PEER is designed to be composable with jurisdiction-specific compliance layers.
An ATP Booking Object ID (for travel domain deployments) can be linked to the
`ptxn_id` via the `domain_transaction_ref` field, connecting the SOOS governance
record to the domain-layer business record that regulators already inspect.

For governments considering Law as Code deployment: PEER provides the audit
correlation layer that allows a cross-agency AI transaction to be traced back to
its originating mandate — even when the two agencies operate under different
GEC deployments and different policy configurations.

Founding Period participation and bilateral coordination inquiries:
tom@myauberge.com

---

## Core technology

**Problem:** Two independently-governed AI agents transact across a trust
boundary, producing two separate audit records with no shared identifier.

**Mechanism:** Both agents' GECs complete a mutual attestation handshake,
exchange nonces, and jointly derive a `ptxn_id` that neither can produce
alone — linking both audit chains at the moment of transaction.

**Output:** A PEER Transaction Record (PTR) stored independently in each
agent's GAR chain, containing the `ptxn_id` as a cross-chain correlation key.

**Who verifies it:** Any auditor holding both parties' GAR exports can
reconstruct the cross-principal transaction by matching `ptxn_id` values
and verifying the responding GEC countersignature.

---

## The two-GEC architecture

```
     INITIATING SIDE                    RESPONDING SIDE
       (Agent A / GEC-A)                  (Agent B / GEC-B)

  ┌─────────────────┐                  ┌─────────────────┐
  │ KIA-A identity  │  ←── mutual ──→  │ KIA-B identity  │
  │ Cedar / CAP-A   │    attestation    │ Cedar / CAP-B   │
  │ MJWT root A     │                  │ MJWT root B     │
  └────────┬────────┘                  └────────┬────────┘
           │   RGP + ACD pre-call gates          │
           │   ptxn_id joint derivation          │
           │   Transaction payload ──────────→   │
           │   ←─────────────── Response         │
           ▼                                     ▼
      GAR chain A ←── ptxn_id links ──→ GAR chain B
```

Each GEC governs its own side independently. No shared kernel exists.
The `ptxn_id` is the only artifact that crosses the boundary — and it
is unforgeable by either side acting alone.

---

## Use cases

**Travel booking across two operators**
A travel platform's booking agent (MyAuberge K.K.) sends a produce delivery
request to a farm supplier agent (Ponyhouse Farm). Both are SOOS-governed.
Before the request is sent, both agents complete mutual KIA attestation, the
booking agent runs an RGP capability query and ACD compliance check on the farm
supplier, and both GECs jointly derive a `ptxn_id`. After delivery, a dispute
about whether the order was confirmed produces two conflicting statements — one
from each party. The regulator matches `ptxn_id` "7f3e4a1b-..." in both GAR
exports and reads the countersignature: the farm's GEC confirmed the transaction.
The dispute is resolved without litigation.

**Enterprise procurement with regulated supplier**
An enterprise procurement agent calls an external supplier agent that is an EU
AI Act Article 6 regulated provider. The ACD pre-call gate completes, returning
an `acd_session_id` confirming the supplier's compliance constraints. The PTR
carries the `acd_session_id` as evidence that the pre-call check was performed.
An auditor reviewing the enterprise's GAR chain for AI Act Article 13 compliance
can confirm that every regulated-provider call was gated by an ACD query before
the transaction was initiated.

**Attestation failure path**
A financial settlement agent attempts to call a counterparty agent whose KIA
identity has been revoked following a mandate expiry. The mutual attestation
handshake fails. Both GECs record `ALE-PEER-04` (PEER_ATTESTATION_FAILED).
No payload is transmitted. No `ptxn_id` is generated. The initiating agent's
HEM escalation path is triggered, returning control to the human principal
without completing an unauthorized transaction.

---

## How this builds on existing work

**KIA (draft-sato-soos-kia-03)**: PEER uses KIA persistent identity for both
sides of the mutual attestation handshake. No modification to KIA is required.
KIA-03 provides the identity layer; PEER provides the correlation protocol
above it.

**AEP (draft-sato-soos-aep-02)**: The PTR is carried as session metadata in
the AEP session on each side. AEP governs the session lifecycle; PEER adds
the cross-principal correlation record to the session metadata. The `ptxn_id`
appears in all ALE-PEER entries in the GAR chain.

**GAR (draft-sato-soos-gar-03)**: ALE-PEER-01 through ALE-PEER-04 are
registered as new ALE types in GAR-03. The `ptxn_id` is an
optional-but-recommended field in any GAR ALE entry for transactions involving
an external principal.

---

## Related work

**draft-kuehlewind-audit-architecture-00 (Kühlewind/Birkholz)**: The most
significant IETF work in the distributed agent audit space. PEER directly
addresses the cross-domain gap their architecture acknowledges but does not
fill. SOOS GAR covers WI-1/WI-4/WI-5/WI-6 from their work item list; PEER
covers the cross-domain correlation case.

**draft-prakash-aip-00 (AIP)**: AIP IBCT is a candidate transport token for
the PEER mutual attestation handshake. AIP and PEER compose: AIP at the token
layer, PEER at the session governance and audit layer. The Provenance Paradox
result (arXiv:2603.18043) — showing that self-reported agent quality scores
perform worse than random — is cited in PEER §1 as empirical motivation for
kernel-enforced attestation.

Full specification forthcoming post-Vienna. See DR-PEER-01 and DR-PEER-02
for architecture working session records.

---

## Security

**Key security properties:**
- `ptxn_id` is unforgeable by either party acting alone (requires both nonces)
- Responding GEC countersignature provides non-repudiation for both parties
- Nonce replay is blocked by single-use nonce cache with timeout window
- KIA validation uses exact string matching, preventing homoglyph confusion
- Mutual attestation failure records `ALE-PEER-04` and stops the transaction

**ptxn_id spoofing**: Production of a valid `ptxn_id` requires both GECs'
nonce contributions. An adversary not party to the handshake cannot obtain both
nonces and cannot produce a valid identifier.

**GAR chain forgery**: The countersignature distinguishes genuine entries from
forged ones. A GAR entry claiming transaction completion without a valid
countersignature is detectable by any verifier holding the responding GEC's
public key.

**Formal analysis status**: No formal cryptographic analysis has been performed
on the `ptxn_id` derivation scheme. UUID-v5 is a deterministic, collision-
resistant hash function (SHA-1 based); a full security proof is planned
pre-PEER-01.

---

## SOOS stack context

PEER sits at Layer 6 — Cross-Principal Audit Correlation. It is the only SOOS
draft that spans two independent GEC deployments.

Depends on: KIA-03 · AEP-02 · GAR-03 · RGP-00 · ACD-00 · KEE-00

Depended on by: PEER-01 (post-Vienna) · FAIP-[TBD]

Related drafts: [CAP](https://soosproject.ai/drafts/cap) ·
[MJWT](https://soosproject.ai/drafts/mjwt) ·
[MAD](https://soosproject.ai/drafts/mad) ·
[AEP](https://soosproject.ai/drafts/aep) ·
[GAR](https://soosproject.ai/drafts/gar) ·
[KIA](https://soosproject.ai/drafts/kia) ·
[RGP](https://soosproject.ai/drafts/rgp) ·
[ACD](https://soosproject.ai/drafts/acd)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-specs/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-peer/)
- [DR-PEER-01 architecture record](https://soosproject.ai/drafts/peer) (June 27, 2026)
- [DR-PEER-02 competitive landscape](https://soosproject.ai/drafts/peer) (June 29, 2026)
- Contact: tom@myauberge.com
