# Governance Audit Record

Layer 3 — Governance
**draft-sato-soos-gar-07**
See full draft text: [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
See [SOOS Stack](/stack) implementation

---

## The problem

When your AI agent does something harmful, can you prove exactly what it decided and why?

GAR is the tamper-evident record that answers that question. Every governance decision a SOOS kernel makes — allow, deny, escalate, suspend — produces a signed GAR entry linked causally to the entry that triggered it. The result is not a log. It is a non-suppressible audit stream that can be queried like a SIEM feed and proves, cryptographically, what the agent decided and why.

**The design premise:** an audit trail that can be suppressed, modified, or reconstructed after the fact is not an audit trail. GAR makes the governance record non-suppressible at the kernel layer, observable in real-time through the OTel infrastructure you already have, and verifiable by a party with no access to the operator's systems.

---

## Messages to key audiences

### IETF Working Groups

GAR is a domain-specific application of the SCITT architecture, extended with causal ordering semantics for agentic governance events. SCITT is artifact-centric; GAR is event-centric. The causal ordering between entries has no equivalent in SCITT's append-only model. GAR declares three SCITT extensions: `causal_parent_id`, `session_sequence_number`, and `governance_decision`.

Three things in the current revision are of direct WG interest. **The Session Block Merkle construction (§14.3) now follows RFC 9162 Section 2.1.1 verbatim** — domain-separated leaves (`SHA-256(0x00 || JCS(event_delta_record))`), domain-separated internal nodes (`SHA-256(0x01 || left || right)`), and k-split recursion for odd-length levels. This replaced an earlier construction that combined child hashes without domain separation and duplicated the final node of an odd level, which is structurally the same malleability class as CVE-2012-2459. **The `soos.governance.*` OTel namespace (§13)** is, as far as the author is aware, the first attempt in an IETF draft to define a semantic convention for AI governance telemetry, across six sub-namespaces. **The `subject_digest` field (§8.6)** positions a conforming GAR record as an AEP instance under draft-sokolov-rats-aep-composition §3, using the same cross-slot join key as the Agent Accountability Composition.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/) · [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your audit trail is a log — suppressible, modifiable, and insufficient as regulatory evidence. GAR closes this gap at the kernel layer.

Two things matter most for production deployments. First, every Cedar evaluation emits `soos.governance.*` OTel span attributes — you can ingest governance decisions into your existing Grafana or Datadog stack without custom tooling. Alert on `soos.governance.decision == "DENY"`, dashboard `soos.cap.tier` distributions, trace consent exceptions via `soos.consent.purpose_codes`. Second, four provenance fields are mandatory on every Cedar evaluation record: `subject_digest`, `cedar_policy_id`, `cap_rrs_control_id`, and `authority_source_uri`. Every governance decision carries a traceable chain back to the law article that governed it.

One operational requirement worth reading before you deploy: the JWKS endpoint URL that publishes your GEC signing keys **MUST** be bound to the operator through the same out-of-band channel as the rest of your deployment's trust chain (§6.1). It must not be discovered from session-supplied metadata. A JWKS endpoint you learned about from the thing you are trying to verify is not a trust anchor.

Without GAR: your audit trail is as trustworthy as your application. With GAR: your audit trail is as trustworthy as the kernel — and visible in your OTel stack in real-time.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/gar)

### SecOps and compliance auditors

GAR is a SIEM feed for agentic AI governance events. Every governance decision — Cedar PERMIT, Cedar DENY, HEM escalation, session suspension, session revocation — is a signed, causally-ordered record that can be ingested by any SIEM that accepts OTel or structured event streams.

The `soos.governance.*` namespace gives you 35+ structured attributes per governance span. Useful alert patterns: `soos.cap.conflict_detected == true` fires on catalog conflicts; `soos.governance.decision == "SUSPENDED"` fires when a law amendment suspends enforcement; `soos.acd.validation_result == "FAIL"` fires on ACD handshake failures; a gap in the `soos.gar.prev_span_hash` chain fires CRITICAL. Session Block Merkle integrity (§14) means you can verify that any segment of the governance feed has not been tampered with — the KIA signature covers the full Session Block, not individual records.

Two behaviours to know about when tuning. **Session close blocks on signature failure** (§14.3): if the KIA signer cannot produce a signature — a FROST quorum failure, for instance — the session close retries rather than proceeding unsigned, and raises a `KERNEL_AUDIT_ANOMALY` alert. An unsigned block is never written. **Sequence-gap alerts are rate-limited** (§6.2): a transient gap from a concurrent-session race is distinguished from a persistent one, because an unthrottled gap alert is itself an alert-fatigue vector an attacker can drive.

For compliance auditors: the four mandatory provenance fields on every Cedar evaluation record give you the complete chain from audit event to governing statute. An auditor reviewing a CEDAR_DENY can follow `authority_source_uri` to the exact law article that produced the denial.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS GAR (Governance Audit Record, draft-sato-soos-gar-07). GAR is a SCITT-profile event log for agentic governance decisions. Every governance decision (PERMIT, DENY, ESCALATE, SUSPEND) must be written to GAR before the result is returned. GAR entries have causal ordering via causal_parent_id, which MUST reference an existing sar_id and is verified by the GEC before commitment — a dangling reference is a KERNEL_AUDIT_ANOMALY, not a silently accepted value. Key requirements: (1) the soos.governance.* OTel attribute namespace — MUST emit on every Cedar evaluation: soos.governance.decision, soos.governance.kernel_id, soos.governance.session_id, soos.governance.cap_profile_id, soos.governance.cap_profile_hash; MUST also emit on PERMIT/DENY: soos.cap.subject_digest, soos.cap.cedar_policy_id, soos.cap.cap_rrs_control_id, soos.cap.authority_source_uri, soos.cap.tier, soos.cap.conflict_detected; compute soos.gar.prev_span_hash in the kernel before emission, never in the OTel pipeline. (2) Four mandatory provenance fields on every Cedar evaluation record: subject_digest, cedar_policy_id, cap_rrs_control_id, authority_source_uri. Do NOT independently re-serialize the governed action to compute subject_digest — if an upstream party already established it, carry that value verbatim. (3) The SOOS GAR Processor: filter governance spans by soos.governance.* presence → aggregate by session_id into Session Blocks → compute Merkle root using RFC 9162 §2.1.1 (leaves SHA-256(0x00 || JCS(record)), internal nodes SHA-256(0x01 || left || right), k-split for odd levels — do NOT duplicate the last node) → request KIA signature once per block, not per span → write to GAR storage → periodically anchor Merkle DAG. (4) Authority Lifecycle Events ALE-001 through ALE-012 for the revocation and recovery chain, with revocation_class R-1 through R-8 defined in MAD §3.6.4. ALE-007 (KIA reattestation) fires for R-8 (Compromise) only and MUST be signed by an external KIA Verification Service, not the GEC being re-attested."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `soos.governance.decision` | OTel span attr | `PERMIT` \| `DENY` \| `SUSPENDED` \| `ESCALATE` |
| `soos.governance.kernel_id` | OTel span attr | KIA-derived kernel instance identifier |
| `soos.cap.subject_digest` | OTel span attr | SHA-256(JCS(action)); cross-slot join key |
| `soos.cap.cedar_policy_id` | OTel span attr | Cedar policy evaluated |
| `soos.cap.authority_source_uri` | OTel span attr | Governing law article URI |
| `soos.cap.conflict_detected` | OTel span attr | true on catalog conflict events |
| `soos.gar.prev_span_hash` | OTel span attr | Hash of preceding span; kernel-computed |
| `soos.gar.block_id` | OTel span attr | Session Block ID (= OTel trace_id) |
| `subject_digest` | GAR record field | REQUIRED on every Cedar evaluation record |
| `cedar_policy_id` | GAR record field | REQUIRED on every Cedar evaluation record |
| `cap_rrs_control_id` | GAR record field | REQUIRED on every Cedar evaluation record |
| `authority_source_uri` | GAR record field | REQUIRED on every Cedar evaluation record |
| `causal_parent_id` | SAR field | MUST reference an existing `sar_id`, GEC-verified |
| `cap_profile_hash` | SAR header field | SHA-256 of active Cedar policy set |

### Government and regulators

GAR is the protocol that makes AI governance decisions auditable to regulatory standards. The signed, tamper-evident record of every governance decision — what the agent was allowed to do, what it was denied, what required human escalation — is the evidence layer that regulatory inquiries require.

Two capabilities are of direct regulatory interest. First, the mandatory provenance chain: every Cedar evaluation record carries `authority_source_uri`, the canonical URI of the governing law article. A Japanese regulator can query on an APPI article and retrieve every agent action governed by it, across every deployed kernel, for any time window, with tamper-evident proof. Second, the constitutional/catalog ALE types cover the full law amendment lifecycle, including resolution: `CATALOG_VERSION_CONFLICT` (ALE-NEW-03) fires when a statutory amendment suspends enforcement, `INTERPRETATION_SUPERSEDED` (ALE-NEW-04) when an interpretive ruling changes the authoritative reading without amending the statute, and ALE-NEW-05 and ALE-NEW-06 record their resolution.

The resolution events matter for a reason that is easy to miss. A resolution is written as a **new** Event Log entry carrying `resolves_event_id`, never as a mutation of the original conflict entry. The suspension and its resolution are two separate, separately-signed records. An append-only log where "resolved" is a field you can flip is not append-only, and a regulator reading it cannot tell what the operator knew and when.

The full chain from human law to bilateral audit record is normatively specified:

```
APPI Article 17 (e-Gov URI)
    ↓ authority_source_uri [mandatory provenance]
CAP-RRS OSCAL control
    ↓ cap_rrs_control_id [mandatory provenance]
Cedar policy in GEC
    ↓ cedar_policy_id [mandatory provenance]
GAR enforcement record (CEDAR_PERMIT or CEDAR_DENY)
    ↓ subject_digest [cross-slot join key]
    ↓ acd_session_id [bilateral correlation]
Resource provider compliance log
    ↓ Merkle inclusion proof [Session Block]
KIA-signed Session Block
```

For collaboration on jurisdiction-specific audit record requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agent governance events are logged at the application layer — suppressible, modifiable, and insufficient as regulatory evidence. There is no standard for a tamper-evident, causally-ordered, OTel-observable governance event record.

**Mechanism:** GAR defines a kernel-signed, append-only event record with causal ordering. Every governance decision is written to GAR before the result is returned. Each entry carries `causal_parent_id` linking it to the triggering entry, verified against an existing record before commitment. Simultaneously, the GEC emits OTel spans with `soos.governance.*` attributes for real-time observability. The SOOS GAR Processor aggregates spans into Session Blocks, computes an RFC 9162 Merkle root, and requests a single KIA signature per block.

**Output:** A non-suppressible, causally-ordered, kernel-signed audit stream — queryable as a SIEM feed, provable as regulatory evidence, and observable in real-time via standard OTel infrastructure. Every Cedar evaluation produces both a GAR record (for audit) and an OTel span (for observability).

**Who verifies it:** SecOps teams ingesting governance events as a SIEM feed, compliance auditors requiring tamper-evident evidence, regulators requesting proof of governance decisions with statutory provenance, and security researchers analysing agentic AI behaviour patterns.

---

## The OTel Governance Semantic Convention

GAR defines the `soos.governance.*` OTel attribute namespace: the normative convention for how SOOS kernels emit governance telemetry into the OpenTelemetry pipeline.

Six sub-namespaces, each targeting a different layer of governance observability:

| Namespace | What it covers | When emitted |
|---|---|---|
| `soos.governance.*` | Core decision + kernel identity | All governance spans |
| `soos.cap.*` | Cedar policy provenance: subject digest, policy ID, OSCAL control, law URI, tier | PERMIT and DENY spans |
| `soos.acd.*` | ACD handshake result and validation layer | ACD session spans |
| `soos.consent.*` | Consent reference, purpose codes, governing law | Consent-governed spans |
| `soos.mandate.*` | Operator identity, delegation depth, resource bound | All governance spans |
| `soos.gar.*` | Session Block ID, Merkle root, KIA signature, prev span hash | All governance spans |

The OTel pipeline is explicitly untrusted. Integrity is rooted in the kernel: `soos.gar.prev_span_hash` is computed by the kernel before any span leaves the kernel boundary. Any modification after emission breaks the hash chain. The SOOS GAR Processor computes a Merkle root over all session spans and requests a KIA signature over that root — one signature per Session Block, not per span.

`CONF-GAR-OTEL-01` and `CONF-GAR-OTEL-02` require the GAR record and the OTel span for the same Cedar evaluation to agree on `authority_source_uri` and `subject_digest` respectively. A mismatch is a detectable inconsistency, not a tolerated divergence.

---

## The ALE Event Registry

The Authority Lifecycle Event (ALE) registry defines structured event types for the agent session lifecycle. ALE events are a top-level GAR event category with their own IANA sub-registry, classified as SA (single-agent lifecycle), MA (multi-agent topology), RG (resource governance), or CA (constitutional/catalog).

**ALE-001 through ALE-008 — single-agent revocation and recovery (§12.3–12.10):**

| ALE | Event | Trigger |
|---|---|---|
| ALE-001 | `ALE_SESSION_REVOKED` | Revocation trigger closes the session with `MANDATE_REVOKED`; causal chain root |
| ALE-002 | `ALE_AUTHORITY_SUSPENDED` | Authority suspended without full revocation; second chain root |
| ALE-003 | `ALE_PARTIAL_STATE_RECORDED` | Completion state is PARTIAL or UNKNOWN at halt |
| ALE-004 | `ALE_RECOVERY_INITIATED` | Recovery begins; carries `mandate_hold: true` |
| ALE-005 | `ALE_PARTIAL_STATE_DISPOSITION` | Partial state resolved, rolled back, or accepted |
| ALE-006 | `ALE_CREDENTIAL_RESTORED` | Compromised or expired credential rotated |
| ALE-007 | `ALE_KIA_REATTESTATION_COMPLETED` | R-8 only; externally signed |
| ALE-008 | `ALE_AUTHORITY_RESTORED` | All recovery conditions met; lifts `mandate_hold` |

**ALE-009 through ALE-012 — multi-agent topology (§12.11–12.14):**

| ALE | Event | Trigger |
|---|---|---|
| ALE-009 | `ALE_DELEGATION_CHILD_REVOKED` | A delegated child session is revoked |
| ALE-010 | `ALE_CLUSTER_PARTIAL_REVOCATION` | Part of an SO Cluster revoked, part continuing |
| ALE-011 | `ALE_SIBLING_REVOCATION_NOTICE` | Sibling sessions notified of a revocation |
| ALE-012 | `ALE_DELEGATION_TREE_RECOVERY_INITIATED` | Recovery started across a delegation tree |

**ALE-018 through ALE-020 — resource governance (§8.5):** `ALE_CLUSTER_BUDGET_TRANSFER`, `ALE_CLUSTER_BLOCK_START`, `ALE_CLUSTER_BLOCK_END`.

**ALE-NEW-01 through ALE-NEW-06 — constitutional and catalog events (§12.15–12.20):**

| ALE | Event | Trigger |
|---|---|---|
| ALE-NEW-01 | `CAP_CONSENT_EXCEPTION_ACTIVATED` | Cedar consent exception evaluated PERMIT |
| ALE-NEW-02 | `CAP_CATALOG_CONFLICT_DETECTED` | Conflict detected at catalog load time |
| ALE-NEW-03 | `CATALOG_VERSION_CONFLICT` | Statutory amendment detected posterior to `endorsed_at` |
| ALE-NEW-04 | `INTERPRETATION_SUPERSEDED` | Interpretive ruling supersedes the endorsement basis |
| ALE-NEW-05 | `CATALOG_VERSION_CONFLICT_RESOLVED` | Re-endorsement or human override resolves ALE-NEW-03 |
| ALE-NEW-06 | `INTERPRETATION_SUPERSEDED_RESOLVED` | Re-endorsement resolves ALE-NEW-04 |

ALE-NEW-03 through ALE-NEW-06 are the GAR-side audit records for the CAP-RRS Statute-Primacy Rule. CAP-RRS owns the normative schemas; GAR registers the event types and specifies the GAR-side requirements — including that a resolution is always a new entry carrying `resolves_event_id`, never an in-place mutation of the conflict it resolves.

**Revocation trigger classes.** `ALE_SESSION_REVOKED` carries `revocation_class`, one of R-1 through R-8, defined in MAD §3.6.4. R-8 (Compromise) is the class for a mandate or credential believed compromised by external attack, and it carries a structural consequence: ALE entries arising from R-8 revocations **MUST** be signed by an external KIA Verification Service, not by the GEC instance under attestation. A compromised kernel cannot self-attest its own recovery.

---

## The Session Block — Merkle integrity for governance spans

The Session Block is the unit of Merkle-protected integrity in GAR. Each governed session produces one Session Block.

Construction: the SOOS GAR Processor filters governance spans from the OTel pipeline by `soos.governance.*` presence, aggregates them by `soos.governance.session_id`, and computes a Merkle root over the event delta records using the RFC 9162 §2.1.1 Merkle Tree Hash. Leaves are `SHA-256(0x00 || JCS(event_delta_record))`; internal nodes are `SHA-256(0x01 || left || right)`; odd-length levels split at k, the largest power of two strictly less than n, rather than duplicating the final node. The domain separation and the k-split shape are both load-bearing — the earlier undifferentiated construction was open to the same malleability class as CVE-2012-2459.

The GEC then signs the Merkle root with the KIA Governance Identity Keypair — once per block, not per span. FROST threshold signing is RECOMMENDED for clustered high-availability deployments, but is not required for correctness: the same keypair over the same root gives an equivalent guarantee either way. If the signer cannot produce a signature at all, close blocks and retries; an unsigned block is never written.

Tamper detection has two independent layers: the `soos.gar.prev_span_hash` chain detects span modification or deletion within a session; the Merkle root and KIA signature detect any modification of the aggregated block.

A regulator verifying audit integrity needs only the signed Session Block and the published KIA attestation chain — no access to the OTel backend, the GEC infrastructure, or the operator's systems.

---

## Use cases

**Japan regulator — APPI Article 17 query**

A Personal Information Protection Commission inspector queries GAR for all agent actions governed by APPI Article 17 across a financial services deployment, filtering on the e-Gov `authority_source_uri`. GAR returns every CEDAR_PERMIT and CEDAR_DENY on that article, with `cap_rrs_control_id` linking to the Regulation Record and `soos.gar.block_id` linking to the signed Session Block for tamper-evident verification. The inspector verifies the KIA signature on three Session Blocks. The audit takes an hour, not a week.

**SecOps team — real-time governance monitoring**

A security operations centre ingests `soos.governance.*` OTel spans into Grafana. Dashboard panels: Cedar evaluation decision distribution, SUSPENDED events by session (indicating law amendment activity), CAP tier distribution (Tier 0-A events are anomalies), ACD validation failures. Alert rules: `soos.cap.conflict_detected == true` fires on catalog conflicts; a `soos.gar.prev_span_hash` chain gap fires CRITICAL. The governance feed is treated like a firewall log — a real-time signal of governance state.

**Post-incident reconstruction — consent exception audit**

An agent is found to have accessed personal data in a category beyond its stated purpose. The audit query targets ALE-NEW-01 (`CAP_CONSENT_EXCEPTION_ACTIVATED`) for the session. Each consent exception record carries `purpose_codes_active`, `data_category_accessed`, `consent_expiry`, and `governing_law`. The investigation establishes which consent exceptions fired, whether the consent was valid at evaluation time, and whether the data category accessed was within the consented scope. The `endorsed_at` field confirms which version of the APPI Regulation Record governed the evaluation.

**Cross-slot reconciliation — one action, two accountability records**

An authorization decision produced by a CAN-slot authorizer and the GAR record of the same governed action are joined on `subject_digest`. Because GAR carries the upstream serialization verbatim rather than re-deriving it, the two records join. Had each side serialized the action independently, both would validate under their own profile and neither party would be told the join had silently failed — the failure mode set out in draft-hillier-scitt-arp Appendix D.

---

## How this builds on existing work

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency statement model, append-only log semantics, and receipt-based inclusion proofs that GAR inherits. The Session Block Merkle anchoring model (§14) is architecturally compatible with SCITT's transparent append-only ledger — Session Block anchors are candidates for SCITT Signed Statement submission (OQ-OTEL-03).

**RFC 9162 (Certificate Transparency 2.0)** supplies the Merkle Tree Hash construction GAR uses verbatim, including domain separation and the k-split recursion for odd-length levels.

**RFC 8785 (JSON Canonicalization Scheme)** is the canonical serialization underlying both Merkle leaf computation and the `subject_digest` join key. GAR carries a deliberate normative downref to it: no substitute canonicalization scheme would produce the same interoperable digest.

**OpenTelemetry** is the governance observability transport. The `soos.governance.*` namespace is a SOOS-specific OTel semantic convention, following the same naming pattern as OpenTelemetry's existing conventions for HTTP, databases, and messaging. Governance telemetry and operational telemetry can flow through the same pipeline to the same backend.

**W3C PROV-DM** is the provenance data model that GAR's causal ordering aligns with. Each GAR entry is a PROV-DM Activity; `causal_parent_id` is the PROV-DM `wasInformedBy` relationship.

---

## Related work

**draft-ietf-scitt-architecture-22** — GAR is a SCITT application; Session Block Merkle anchors are the SCITT-facing contribution.

**draft-mih-sato-agent-accountability-composition** — GAR's `subject_digest` is the shared cross-slot join key defined there, letting independently-produced accountability records be reconciled across slots.

**draft-sokolov-rats-aep-composition-04** — a conforming GAR record satisfies §3's covered-action-and-outcome property, making it an AEP instance.

**draft-hillier-scitt-arp-03** — cited for the general statement of the re-serialization failure mode and for the empty-tree rejection-at-the-verifier rationale. GAR deliberately declined to adopt ARP's authority-reference and receipt-payload digest fields natively: they belong to ARP's own reconciliation admission process, and a GAR record's existing KIA signature and event delta record already supply what a consuming process would derive them from.

**NIST AI RMF** — GAR implements the Map and Measure functions. Map: the ALE taxonomy maps the authority lifecycle. Measure: the SAR and mandatory provenance fields provide measurable, auditable session records at the action level.

---

## Security

**Key security properties:** Every GAR record is kernel-signed before the governance result is returned. `record_id` is MUST on DENY, ESCALATE, and SUSPEND events. The four mandatory provenance fields (§8.6) create an unbroken chain from audit event to governing law article.

**JWKS trust-anchor bootstrap (§6.1):** the JWKS endpoint URL MUST be bound to the operator out-of-band, through the same channel as the deployment's broader trust chain — never discovered from session-supplied metadata.

**Key compromise is disclosed, not rewritten (§15):** on compromise, the GEC rotates keys immediately and writes a new `GEC_KEY_COMPROMISE_DISCLOSED` Event Log entry naming the compromised key and the compromise window. Artifacts signed during that window become suspect-but-not-invalidated historical record. They are **not** re-signed — re-signing an already-committed artifact would mean rewriting it, which contradicts the append-only property GAR requires everywhere else. Operators MUST also publish a routine rotation policy, and the JWKS endpoint MUST retain superseded-but-uncompromised keys for at least the SAR retention period.

**Compromised-but-signing GEC — stated residual risk (§15):** against a GEC compromised without key extraction, Level 1 and Level 2 non-suppressibility is probabilistic, not guaranteed. Such a GEC can emit well-formed, correctly-signed, false records. The R-8 external-signing carve-out addresses exactly one event type; it does not generalize. At Level 3, RATS hardware attestation is the actual mitigation. Implementations MUST NOT represent Level 1/2 conformance as providing non-suppressibility against this threat class.

**OTel pipeline is untrusted:** `soos.gar.prev_span_hash` is computed by the kernel before emission. Namespace collisions (non-kernel processes emitting `soos.governance.*` attributes) are detected by the GAR Processor via OTel resource attribute validation. Span suppression is detected by hash chain gaps.

**CVE-2026-50141 class defense:** the GEC MUST NOT accept agent-supplied identity claims for `kernel_id`, `soos.governance.kernel_id`, or `xpid`. These MUST be derived from the KIA attestation chain, not from agent-supplied metadata.

**Session Block Merkle integrity:** any span modification changes the Merkle leaf, changes the Merkle root, invalidates the KIA signature. Two independent layers require an attacker to compromise both.

---

## SOOS stack context

GAR sits at **Level 3 — Governance**, alongside HEM and CAP. It is the audit sink for the entire SOOS stack — every governance decision by every other draft produces a GAR record. It depends on KIA (Governance Identity Keypair for Session Block signing, attestation chain, FROST threshold signing), IDP (Intent Declaration reference for every session record), MAD (revocation trigger class taxonomy R-1 through R-8, session revocation semantics), CAP-RRS (the constitutional/catalog event schemas GAR registers), and ACD (`acd_session_id` bilateral correlation). It is consumed by the compliance, security operations, and regulatory audit layers above the SOOS stack.

Related drafts: [HEM](/drafts/hem) · [CAP](/drafts/cap) · [CAP-RRS](/drafts/cap-rrs) · [AEP](/drafts/aep) · [MAD](/drafts/mad) · [IDP](/drafts/idp) · [KIA](/drafts/kia) · [ACD](/drafts/acd)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/gar)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
