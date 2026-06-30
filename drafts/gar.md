# Governance Audit Record

Layer 3 — Governance
**draft-sato-soos-gar-03**
See full draft text: [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
See [SOOS Stack](/stack) implementation

---

## The problem

When your AI agent does something harmful, can you prove exactly what it decided and why?

GAR is the tamper-evident record that answers that question. Every governance decision a SOOS kernel makes — allow, deny, escalate, suspend — produces a signed GAR entry linked causally to the entry that triggered it. The result is not a log. It is a non-suppressible audit stream that can be queried like a SIEM feed and proves, cryptographically, what the agent decided and why.

Version -03 extends GAR's output into the OTel pipeline. Every Cedar evaluation now emits five or more OTel span attributes in the normative `soos.governance.*` namespace — making governance decisions visible in existing Prometheus, Grafana, and Jaeger stacks without any additional tooling.

**The design premise:** an audit trail that can be suppressed, modified, or reconstructed after the fact is not an audit trail. GAR makes the governance record non-suppressible at the kernel layer — and now makes it observable in real-time through the OTel infrastructure you already have.

---

## Messages to key audiences

### IETF Working Groups

GAR is a domain-specific application of the SCITT architecture, extended with causal ordering semantics for agentic governance events. GAR is the primary candidate for presentation to the SCITT WG at IETF 126 Vienna as an AI governance application — it expands SCITT's applicability without competing with its core software supply chain work.

Version -03 adds material directly relevant to three WGs. For SCITT: the Session Block Merkle anchoring model (§14) is structurally compatible with SCITT's transparent append-only ledger. The Session Block is a signed claim about a governance session — the SOOS analogue of a SCITT Signed Statement. SCITT-compatible transparency statements for Session Block anchors are flagged as OQ-OTEL-03 for post-Vienna specification. For NMOP and SACM: the normative `soos.governance.*` OTel attribute namespace (§13) is the first attempt in an IETF draft to define a semantic convention for AI governance telemetry. The six sub-namespaces cover governance decisions, Cedar policy provenance, ACD handshakes, consent context, mandate scope, and integrity attributes. For ANML: the Verified External Auditor credential and the four new ALE types (ALE-NEW-01 through ALE-NEW-04) expand the agent accountability primitive set.

GAR extends SCITT in one specific dimension: SCITT is artifact-centric. GAR is event-centric. The causal ordering between entries has no equivalent in SCITT's append-only model. GAR declares three SCITT extensions: `causal_parent_id`, `session_sequence_number`, and `governance_decision`.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/) · [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your audit trail is a log — suppressible, modifiable, and insufficient as regulatory evidence. GAR closes this gap at the kernel layer.

Version -03 adds two things that matter for production deployments. First, every Cedar evaluation now emits `soos.governance.*` OTel span attributes — you can ingest governance decisions into your existing Grafana or Datadog stack without any custom tooling. Alert on `soos.governance.decision == "DENY"`, dashboard `soos.cap.tier` distributions, trace consent exceptions via `soos.consent.purpose_codes`. Second, three provenance fields are now mandatory on every CEDAR_PERMIT and CEDAR_DENY record: `cedar_policy_id`, `cap_rrs_control_id`, and `authority_source_uri`. Every governance decision now carries a traceable chain back to the law article that governed it.

Without GAR: your audit trail is as trustworthy as your application. With GAR: your audit trail is as trustworthy as the kernel — and visible in your OTel stack in real-time.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/gar)

### SecOps and compliance auditors

GAR is a SIEM feed for agentic AI governance events. Every governance decision — Cedar PERMIT, Cedar DENY, HEM escalation, session suspension — is a signed, causally-ordered record that can be ingested by any SIEM that accepts OTel or structured event streams.

Version -03 makes the feed richer: the `soos.governance.*` OTel namespace gives you 35+ structured attributes per governance span. Useful alert patterns: `soos.cap.conflict_detected == true` fires on catalog conflicts; `soos.governance.decision == "SUSPENDED"` fires when a law amendment suspends enforcement; `soos.acd.validation_result == "FAIL"` fires on ACD handshake failures. The Session Block Merkle integrity (§14) means you can verify that any segment of the governance feed has not been tampered with — the KIA signature covers the full Session Block, not individual records.

For compliance auditors: the three mandatory provenance fields (`cedar_policy_id`, `cap_rrs_control_id`, `authority_source_uri`) on every Cedar evaluation record give you the complete chain from audit event to governing statute. An auditor reviewing a CEDAR_DENY can follow `authority_source_uri` to the exact law article that produced the denial.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS GAR (Governance Audit Record, draft-sato-soos-gar-03). GAR is a SCITT-profile event log for agentic governance decisions. Every governance decision (PERMIT, DENY, ESCALATE, SUSPEND) must be written to GAR before the result is returned. GAR entries have causal ordering via causal_parent_id. The ALE registry defines event types for agent session lifecycle. Version -03 adds: (1) the soos.governance.* OTel attribute namespace — MUST emit on every Cedar evaluation: soos.governance.decision, soos.governance.kernel_id, soos.governance.session_id, soos.governance.cap_profile_id, soos.governance.cap_profile_hash; MUST also emit on PERMIT/DENY: soos.cap.cedar_policy_id, soos.cap.cap_rrs_control_id, soos.cap.authority_source_uri, soos.cap.tier, soos.cap.conflict_detected; compute soos.gar.prev_span_hash in the kernel before emission. (2) Three mandatory provenance fields on every CEDAR_PERMIT and CEDAR_DENY GAR record: cedar_policy_id, cap_rrs_control_id, authority_source_uri. (3) Four new SAR header fields: cap_profile_id, cap_profile_hash, acd_session_id, soos.gar.block_id. (4) The SOOS GAR Processor: filter governance spans → aggregate by session_id into Session Blocks → compute Merkle root → request KIA signature (once per block, not per span) → write to GAR storage → periodically anchor Merkle DAG."

**Key schema fields (new in -03):**

| Field | Type | Description |
|---|---|---|
| `soos.governance.decision` | OTel span attr | `PERMIT` \| `DENY` \| `SUSPENDED` \| `ESCALATE` |
| `soos.governance.kernel_id` | OTel span attr | KIA-derived kernel instance identifier |
| `soos.cap.cedar_policy_id` | OTel span attr | Cedar policy evaluated |
| `soos.cap.authority_source_uri` | OTel span attr | Governing law article URI |
| `soos.cap.conflict_detected` | OTel span attr | true on catalog conflict events |
| `soos.gar.prev_span_hash` | OTel span attr | Hash of preceding span; kernel-computed |
| `soos.gar.block_id` | OTel span attr | Session Block ID (= OTel trace_id) |
| `cedar_policy_id` | GAR record field | REQUIRED on CEDAR_PERMIT/DENY |
| `cap_rrs_control_id` | GAR record field | REQUIRED on CEDAR_PERMIT/DENY |
| `authority_source_uri` | GAR record field | REQUIRED on CEDAR_PERMIT/DENY |
| `cap_profile_hash` | SAR header field | SHA-256 of active Cedar policy set |

### Government and regulators

GAR is the protocol that makes AI governance decisions auditable to regulatory standards. The signed, tamper-evident record of every governance decision — what the agent was allowed to do, what it was denied, what required human escalation — is the evidence layer that regulatory inquiries require.

Version -03 adds two capabilities of direct regulatory interest. First, the mandatory provenance chain: every CEDAR_PERMIT and CEDAR_DENY record now carries `authority_source_uri` — the canonical URI of the governing law article. A Japanese regulator can query `WHERE authority_source_uri LIKE '%第17条%'` and retrieve every agent action governed by APPI Article 17, across every deployed kernel, for any time window, with tamper-evident proof. Second, the four new ALE types cover the law amendment lifecycle: `CATALOG_VERSION_CONFLICT` (ALE-NEW-03) fires when a statutory amendment suspends enforcement; `INTERPRETATION_SUPERSEDED` (ALE-NEW-04) fires when an interpretive ruling changes the authoritative reading without amending the statute. Both events are GAR-auditable and carry the complete provenance chain.

The full chain from human law to bilateral audit record is now normatively specified:

```
APPI Article 17 (e-Gov URI)
    ↓ authority_source_uri [mandatory provenance]
CAP-RRS OSCAL control
    ↓ cap_rrs_control_id [mandatory provenance]
Cedar policy in GEC
    ↓ cedar_policy_id [mandatory provenance]
GAR enforcement record (CEDAR_PERMIT or CEDAR_DENY)
    ↓ acd_session_id [bilateral correlation]
Resource provider compliance log
    ↓ Merkle inclusion proof [Session Block]
KIA-signed Session Block
```

For collaboration on jurisdiction-specific audit record requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agent governance events are logged at the application layer — suppressible, modifiable, and insufficient as regulatory evidence. There is no standard for a tamper-evident, causally-ordered, OTel-observable governance event record.

**Mechanism:** GAR defines a kernel-signed, append-only event record with causal ordering. Every governance decision is written to GAR before the result is returned. Each entry carries `causal_parent_id` linking it to the triggering entry. Simultaneously, the GEC emits OTel spans with `soos.governance.*` attributes for real-time observability. The SOOS GAR Processor aggregates spans into Session Blocks, computes Merkle roots, and requests a single KIA signature per block.

**Output:** A non-suppressible, causally-ordered, kernel-signed audit stream — queryable as a SIEM feed, provable as regulatory evidence, and observable in real-time via standard OTel infrastructure. Every Cedar evaluation produces both a GAR record (for audit) and an OTel span (for observability).

**Who verifies it:** SecOps teams ingesting governance events as a SIEM feed, compliance auditors requiring tamper-evident evidence, regulators requesting proof of governance decisions with statutory provenance, and security researchers analysing agentic AI behaviour patterns.

---

## New in GAR-03 — OTel Governance Semantic Convention

Version -03 defines the `soos.governance.*` OTel attribute namespace: the normative convention for how SOOS kernels emit governance telemetry into the OpenTelemetry pipeline.

Six sub-namespaces, each targeting a different layer of governance observability:

| Namespace | What it covers | When emitted |
|---|---|---|
| `soos.governance.*` | Core decision + kernel identity | All governance spans |
| `soos.cap.*` | Cedar policy provenance: policy ID, OSCAL control, law URI, tier | PERMIT and DENY spans |
| `soos.acd.*` | ACD handshake result and validation layer | ACD session spans |
| `soos.consent.*` | Consent reference, purpose codes, governing law | Consent-governed spans |
| `soos.mandate.*` | Operator identity, delegation depth, resource bound | All governance spans |
| `soos.gar.*` | Session Block ID, Merkle root, KIA signature, prev span hash | All governance spans |

The OTel pipeline is explicitly untrusted. Integrity is rooted in the kernel: `soos.gar.prev_span_hash` is computed by the kernel before any span leaves the kernel boundary. Any modification after emission breaks the hash chain. The SOOS GAR Processor computes a Merkle root over all session spans and requests a KIA signature over that root — one signature per Session Block, not per span.

---

## The ALE Event Registry

The Authority Lifecycle Event (ALE) registry defines structured event types for the agent session lifecycle. ALE events are a top-level GAR event category with their own IANA sub-registry.

**ALE-001 through ALE-012** — Agent Session Revocation and Recovery lifecycle (GAR-02 §12):

| ALE | Event | Trigger |
|---|---|---|
| ALE-001 | SESSION_REVOCATION_INITIATED | Revocation signal received |
| ALE-002 | SESSION_HALTED_CLEAN | CLEAN completion state at halt |
| ALE-003 | SESSION_HALTED_PARTIAL | PARTIAL completion state at halt |
| ALE-004 | SESSION_HALTED_UNKNOWN | UNKNOWN completion state at halt |
| ALE-005 | SESSION_COMPLETE | Session completed successfully |
| ALE-006 | REVOCATION_PROPAGATED | Revocation sent to sub-agent |
| ALE-007 | REVOCATION_ACKNOWLEDGED | Sub-agent confirmed revocation |
| ALE-008 | REVOCATION_TIMEOUT | Sub-agent unreachable within cascade_timeout |
| ALE-009 | SESSION_RESUMED | Session resumed after CLEAN halt |
| ALE-010 | SESSION_ABANDONED | Session abandoned (PARTIAL, no recovery) |
| ALE-011 | RECOVERY_INITIATED | Recovery procedure started |
| ALE-012 | RECOVERY_COMPLETE | Recovery procedure completed |

**ALE-018 through ALE-020** — Cluster resource events (GAR-02 §8.5):

| ALE | Event | Trigger |
|---|---|---|
| ALE-018 | CLUSTER_BUDGET_TRANSFER | BUDGET_TRANSFER Cedar action executed |
| ALE-019 | CLUSTER_BLOCK_START | CLUSTER_BLOCKED state entered |
| ALE-020 | CLUSTER_BLOCK_END | CLUSTER_BLOCKED state exited |

**New in GAR-03 — ALE-NEW-01 through ALE-NEW-04** (Constitutional/Catalog events):

| ALE | Event | Trigger |
|---|---|---|
| ALE-NEW-01 | CAP_CONSENT_EXCEPTION_ACTIVATED | Cedar consent exception evaluated PERMIT |
| ALE-NEW-02 | CAP_CATALOG_CONFLICT_DETECTED | Conflict detected at catalog load time |
| ALE-NEW-03 | CATALOG_VERSION_CONFLICT | Statutory amendment detected posterior to endorsed_at |
| ALE-NEW-04 | INTERPRETATION_SUPERSEDED | Interpretive ruling supersedes endorsement basis |

ALE-NEW-03 and ALE-NEW-04 are the GAR-side audit records for the CAP-RRS Statute-Primacy Rule. When a law changes, the suspension is recorded in GAR with the full provenance chain — law article, amendment date, delta in days, HEM escalation ID, and resolution when re-endorsed.

---

## The Session Block — Merkle integrity for governance spans

The Session Block is the unit of Merkle-protected integrity in GAR-03. Each governed session produces one Session Block.

Construction: the SOOS GAR Processor filters governance spans from the OTel pipeline by `soos.governance.*` presence, aggregates them by `soos.governance.session_id`, and computes a SHA-256 Merkle root over all event delta records. The GEC then signs the Merkle root with the KIA Governance Identity Keypair — once per block, not per span. The signed block is written to GAR tiered storage.

Tamper detection has two independent layers: the `soos.gar.prev_span_hash` chain detects span modification or deletion within a session; the Merkle root and KIA signature detect any modification of the aggregated block.

A regulator verifying audit integrity needs only the signed Session Block and the published KIA attestation chain — no access to the OTel backend, the GEC infrastructure, or the operator's systems.

---

## Use cases

**Japan regulator — APPI Article 17 query**

A Personal Information Protection Commission inspector queries GAR for all agent actions governed by APPI Article 17 across a financial services deployment. The query: `WHERE authority_source_uri = "https://elaws.e-gov.go.jp/document?lawid=415AC0000000057#..."`. GAR returns every CEDAR_PERMIT and CEDAR_DENY on that article, with `cap_rrs_control_id` linking to the Regulation Record and `soos.gar.block_id` linking to the signed Session Block for tamper-evident verification. The inspector verifies the KIA signature on three Session Blocks. The audit takes an hour, not a week.

**SecOps team — real-time governance monitoring**

A security operations centre ingests `soos.governance.*` OTel spans into Grafana. Dashboard panels: cedar evaluation decision distribution, SUSPENDED events by session (indicating law amendment activity), CAP tier distribution (Tier 0-A events are anomalies), ACD validation failures. Alert rule: `soos.cap.conflict_detected == true` fires on catalog conflicts; `soos.gar.prev_span_hash` chain gap fires CRITICAL. The governance feed is treated like a firewall log — a real-time signal of governance state.

**Post-incident reconstruction — consent exception audit**

An agent is found to have accessed personal data in a category beyond its stated purpose. The audit query targets `ALE-NEW-01` (CAP_CONSENT_EXCEPTION_ACTIVATED) for the session. Each consent exception record carries `purpose_codes_active`, `data_category_accessed`, `consent_expiry`, and `governing_law`. The investigation establishes which consent exceptions fired, whether the consent was valid at evaluation time, and whether the data category accessed was within the consented scope. The `endorsed_at` field confirms which version of the APPI Regulation Record governed the evaluation.

---

## How this builds on existing work

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency statement model, append-only log semantics, and receipt-based inclusion proofs that GAR inherits. The Session Block Merkle anchoring model (§14) is architecturally compatible with SCITT's transparent append-only ledger — Session Block anchors are candidates for SCITT Signed Statement submission (OQ-OTEL-03, post-Vienna).

**OpenTelemetry** is the governance observability transport for GAR-03. The `soos.governance.*` namespace is a SOOS-specific OTel semantic convention, following the same naming pattern as OpenTelemetry's existing semantic conventions for HTTP, databases, and messaging. Governance telemetry and operational telemetry can flow through the same OTel pipeline to the same backend.

**W3C PROV-DM** is the provenance data model that GAR's causal ordering aligns with. Each GAR entry is a PROV-DM Activity; `causal_parent_id` is the PROV-DM `wasInformedBy` relationship.

---

## Related work

**draft-ietf-scitt-architecture-22** — GAR is a SCITT application. The SCITT WG Vienna session is the primary community engagement target. Session Block Merkle anchors are the -03 SCITT contribution.

**OpenTelemetry Semantic Conventions** — the `soos.governance.*` namespace follows OTel naming conventions and is designed to coexist with `http.*`, `db.*`, and `messaging.*` namespaces in mixed-workload OTel pipelines.

**NIST AI RMF** — GAR implements the Map and Measure functions. Map: the ALE taxonomy maps the authority lifecycle. Measure: the SAR and mandatory provenance fields provide measurable, auditable session records at the action level.

---

## Security

**Key security properties:** Every GAR record is kernel-signed before the governance result is returned. `record_id` is MUST on DENY, ESCALATE, and SUSPEND events. The three mandatory provenance fields (§8.6) create an unbroken chain from audit event to governing law article.

**OTel pipeline is untrusted:** `soos.gar.prev_span_hash` is computed by the kernel before emission. Namespace collisions (non-kernel processes emitting `soos.governance.*` attributes) are detected by the GAR Processor via OTel resource attribute validation. Span suppression is detected by hash chain gaps.

**CVE-2026-50141 class defense:** The GEC MUST NOT accept agent-supplied identity claims for `kernel_id`, `soos.governance.kernel_id`, or `xpid` fields. These MUST be derived from the KIA attestation chain, not from agent-supplied metadata.

**Session Block Merkle integrity:** Any span modification changes the Merkle leaf, changes the Merkle root, invalidates the KIA signature. Two independent layers (span hash chain + Merkle/KIA) require an attacker to compromise both independently.

---

## SOOS stack context

GAR sits at **Level 3 — Governance**, alongside HEM and CAP. It is the audit sink for the entire SOOS stack — every governance decision by every other draft produces a GAR record. It depends on KIA (Governance Identity Keypair for Session Block signing), IDP (Intent Declaration reference for every session record), and CAP-RRS (CATALOG_VERSION_CONFLICT and INTERPRETATION_SUPERSEDED event types owned by CAP-RRS). It is consumed by the compliance, security operations, and regulatory audit layers above the SOOS stack.

Related drafts: [HEM](/drafts/hem) · [CAP](/drafts/cap) · [CAP-RRS](/drafts/cap-rrs) · [AEP](/drafts/aep) · [MAD](/drafts/mad) · [IDP](/drafts/idp)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/gar)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
