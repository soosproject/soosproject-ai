# Governance Audit Record

Layer 3 — Governance
**draft-sato-soos-gar-02**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
See [SOOS Stack](/stack) implementation

---

## The problem

When your AI agent does something harmful, can you prove exactly what it decided and why?

GAR is the tamper-evident record that answers that question. Every governance decision a SOOS kernel makes — allow, deny, escalate, suspend — produces a signed GAR entry linked causally to the entry that triggered it. The result is not a log. It is a non-suppressible audit stream that can be queried like a SIEM feed and proves, cryptographically, what the agent decided and why.

**The design premise:** an audit trail that can be suppressed, modified, or reconstructed after the fact is not an audit trail. GAR makes the governance record non-suppressible at the kernel layer.

---

## Messages to key audiences

### IETF Working Groups

GAR is a domain-specific application of the SCITT (Supply Chain Integrity, Transparency and Trust) architecture, extended with causal ordering semantics for agentic governance events. GAR is the primary candidate for presentation to the SCITT WG at IETF 126 Vienna as an AI governance application — it expands SCITT's applicability without competing with its core software supply chain work.

GAR extends SCITT in one specific dimension: SCITT is artifact-centric (software bills of materials, firmware attestations). GAR is event-centric. GAR entries are governance decisions, not artifacts. The causal ordering between entries — action B was caused by the outcome of policy evaluation of action A — has no equivalent in SCITT's append-only model. GAR declares three SCITT extensions: `causal_parent_id`, `session_sequence_number`, and `governance_decision`.

To engage on GAR: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-gar/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your audit trail is a log — a sequence of events recorded by the application layer, suppressible by the application, and reconstructable after the fact. When something goes wrong, you can see what happened; you cannot prove that the log wasn't modified, and you cannot reconstruct the causal chain of governance decisions that led to the outcome.

GAR closes this gap by specifying the audit record at the kernel layer. Every governance event is written to GAR before the result is returned to the application. The record is kernel-signed, causally ordered, and SCITT-transparent — it cannot be suppressed by the application layer and cannot be modified without breaking the signature chain.

Without GAR: your audit trail is as trustworthy as your application. With GAR: your audit trail is as trustworthy as the kernel.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/gar)

### SecOps and compliance auditors

GAR is a SIEM feed for agentic AI governance events. Every governance decision — Cedar PERMIT, Cedar DENY, HEM escalation, session suspension — is a signed, causally-ordered record that can be ingested by any SIEM that accepts structured event streams. Post-incident reconstruction of an agent's decision chain is a GAR query, not a log forensics exercise.

For compliance auditors: GAR provides the tamper-evident evidence layer that most AI governance frameworks describe in policy but do not specify at the protocol level. The GAR record is the signed proof that a specific governance decision was made at a specific time for a specific agent action — the artifact that answers the auditor's question rather than the log that supports a reconstruction of it.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS GAR (Governance Audit Record, draft-sato-soos-gar-02). GAR is a SCITT-profile event log for agentic governance decisions. Every governance decision (ALLOW, DENY, ESCALATE, SUSPEND) must be written to GAR before the result is returned. GAR entries have causal ordering via causal_parent_id — each entry links to the entry that caused it. The ALE (Authority Lifecycle Event) registry defines 21 structured event types (ALE-001 through ALE-021) for agent session lifecycle events. Key fields: record_id (MUST on DENY/ESCALATE/SUSPEND), causal_parent_id, session_sequence_number, governance_decision, ale_type. The HEM_LAYER_DISCREPANCY event (§8.2) is GAR-only — audit record when LLM-HEM and SOOS-HEM disagree. GDPR Security Considerations paragraph is in §12."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `record_id` | string | MUST on DENY/ESCALATE/SUSPEND events; unique identifier |
| `causal_parent_id` | string | Reference to the GAR entry that caused this entry |
| `session_sequence_number` | integer | Monotonically increasing per GEC session |
| `governance_decision` | enum | ALLOW / DENY / ESCALATE / SUSPEND |
| `intent_id` | string | Bound Intent Declaration (IDP reference) |
| `cedar_policy_id` | string | Cedar policy that produced this decision |
| `ale_type` | string | ALE event type if this is an Authority Lifecycle Event |
| `kernel_signature` | string | Kernel-signed record — SCITT transparency statement |
| `completion_state` | enum | CLEAN / PARTIAL / UNKNOWN (on session events) |
| `hem_layer_discrepancy` | boolean | True if LLM-HEM and SOOS-HEM disagreed on this cycle |

**Minimal Cedar policy example:**

```cedar
// Require GAR record before result is returned to caller
permit (
  principal is GECKernel,
  action == Action::"ReturnGovernanceResult",
  resource
)
when {
  context.gar_record_written == true &&
  context.record_id_present == true
};
```

### Government and regulators

GAR is the protocol that makes AI governance decisions auditable to regulatory standards. The signed, tamper-evident record of every governance decision — what the agent was allowed to do, what it was denied, what required human escalation — is the evidence layer that regulatory inquiries require.

The GAR §12 Security Considerations paragraph addresses GDPR Article 5(1)(f) (integrity and confidentiality of processing records) and equivalent data protection obligations. The record is kernel-signed; modification after the fact breaks the signature chain and is detectable.

For Japanese regulatory alignment: GAR records are designed to satisfy the APPI requirement for processing records and the FSA's audit trail requirements for AI systems in financial services.

For collaboration on jurisdiction-specific audit record requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agent governance events are logged at the application layer — suppressible, modifiable, and insufficient as regulatory evidence. There is no standard for a tamper-evident, causally-ordered governance event record.

**Mechanism:** GAR defines a kernel-signed, append-only event record with causal ordering. Every governance decision is written to GAR before the result is returned. Each entry carries a `causal_parent_id` linking it to the entry that triggered it. The record is a SCITT transparency statement — independently verifiable.

**Output:** A non-suppressible, causally-ordered, kernel-signed audit stream. Queryable as a SIEM feed. Provable as regulatory evidence. Reconstructable as a complete causal chain for any governance decision made during a governed execution session.

**Who verifies it:** SecOps teams ingesting governance events as a SIEM feed, compliance auditors requiring tamper-evident evidence, regulators requesting proof of governance decisions, and security researchers analysing agentic AI behaviour patterns.

---

## The ALE Event Registry

The Authority Lifecycle Event (ALE) registry defines structured event types for the agent session lifecycle. ALE events are a top-level GAR event category with their own IANA sub-registry (§13.3).

**ALE-001 through ALE-012** — Agent Session Revocation and Recovery lifecycle (COMPLETE, GAR-02 §14a):

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

**ALE-018 through ALE-020** — Cluster resource events (COMPLETE, GAR-02 §8.5):

| ALE | Event | Trigger |
|---|---|---|
| ALE-018 | CLUSTER_BUDGET_TRANSFER | BUDGET_TRANSFER Cedar action executed |
| ALE-019 | CLUSTER_BLOCK_START | CLUSTER_BLOCKED state entered |
| ALE-020 | CLUSTER_BLOCK_END | CLUSTER_BLOCKED state exited |

**Additional ALE types (ALE-013–017, ALE-021)** are defined for post-Vienna workstreams (data architecture, temporal governance, goal scoping).

---

## HEM_LAYER_DISCREPANCY

When LLM-HEM (the model layer) signals that escalation is warranted but SOOS-HEM (the kernel layer) finds no trigger condition, the kernel records `HEM_LAYER_DISCREPANCY` in GAR §8.2. This event is audit-only — it does not halt execution. Over time, patterns of HEM_LAYER_DISCREPANCY events inform model assessment and mandate calibration.

This is a GAR-only event: it does not produce a CAP error code, it does not trigger HEM escalation. Its purpose is to create an observable record of cases where the model and the kernel disagree about whether a situation requires human oversight.

---

## Use cases

**Post-incident reconstruction — financial services**

An agent is found to have made an unauthorised payment. The security operations team queries GAR for the session. The GAR record provides the complete causal chain: the Intent Declaration that initiated the session, the Cedar PERMIT that authorised the payment action, the `causal_parent_id` trace back to the delegation grant, and the `session_sequence_number` confirming this was not a replayed event. The investigation takes minutes, not days. The GAR record is the forensic evidence submitted to the regulator.

**Compliance audit — GDPR Article 22**

A data protection authority requests evidence that an AI system's automated decisions on credit applications were governed by declared policy. GAR provides the record: every credit decision is a governance event with the Cedar policy ID that produced it, the Intent Declaration it was evaluated against, and the kernel signature that proves the record was not modified after the fact. The GAR record is the Article 22 audit evidence.

**SIEM integration — real-time governance monitoring**

A security operations centre ingests GAR events as a structured SIEM feed. Alert rules fire on: three consecutive HEM escalations in a session (anomalous pattern), `HEM_LAYER_DISCREPANCY` frequency exceeding threshold (model behaviour diverging from kernel expectations), or any ALE-003 (SESSION_HALTED_PARTIAL) event in a regulated workflow. The SIEM treats the GAR stream as it would a firewall log — a real-time signal of governance state.

---

## How this builds on existing work

**SCITT (Supply Chain Integrity, Transparency and Trust, draft-ietf-scitt-architecture-22)** provides the transparency statement model, append-only log semantics, and receipt-based inclusion proofs that GAR inherits. GAR is a domain-specific SCITT application extended with causal ordering for governance events. SCITT handles artifacts; GAR handles governance decisions. The two are complementary, not competing.

**W3C PROV-DM** is the provenance data model that GAR's causal ordering aligns with. Each GAR entry is a PROV-DM Activity; `causal_parent_id` is the PROV-DM `wasInformedBy` relationship. This alignment makes GAR records consumable by PROV-DM-aware audit tooling without transformation.

**SIEM standards (CEF, LEEF, ECS)** are the operational formats that GAR's event schema is designed to map to. GAR does not specify a SIEM output format — it specifies the kernel-layer record; the mapping to SIEM ingestion formats is an implementation concern. The field names and event taxonomy are chosen to make this mapping straightforward.

---

## Related work

**draft-ietf-scitt-architecture-22** — GAR is a SCITT application. The SCITT WG Vienna session is the primary community engagement target for GAR. The positioning: GAR as the AI governance application that demonstrates SCITT's extensibility beyond software supply chain.

**draft-ietf-oauth-security-topics** — GAR's non-suppressibility requirement addresses the audit trail gap in OAuth-based agentic deployments. An OAuth access log is application-layer; GAR is kernel-layer. The distinction matters when the application layer is the entity being governed.

**OpenTelemetry** — operational observability for agentic AI. GAR is governance observability. The two are complementary: OTel captures performance and errors; GAR captures governance decisions and their causal chain. A complete agentic AI observability stack uses both.

---

## Security

**Key security properties:** Every GAR record is kernel-signed before the governance result is returned to the application layer. The application cannot suppress a GAR record for a governance event that has occurred — the record is written before the result is visible to the application. `record_id` is MUST on DENY, ESCALATE, and SUSPEND events — a conforming implementation cannot produce these outcomes without a corresponding GAR record.

**Causal ordering integrity:** The `causal_parent_id` chain is integrity-protected by the kernel signature. A modified entry that breaks the causal chain is detectable. A missing entry in the causal chain (a governance event with no GAR record) is detectable by the monotonically increasing `session_sequence_number`.

**GDPR and data protection:** GAR §12 (Security Considerations) addresses Article 5(1)(f) integrity and confidentiality obligations for processing records. GAR records that contain personal data must be handled according to the data protection requirements of the deployment jurisdiction. The record schema separates governance metadata (always retained) from action payload (subject to data minimisation).

**Session revocation:** When a session is revoked, GAR records the revocation event (ALE-001) before propagating to sub-agents. The revocation record is the authoritative timestamp for all subsequent completion state determinations.

---

## SOOS stack context

GAR sits at **Level 3 — Governance**, alongside HEM and CAP. It is the audit sink for the entire SOOS stack — every governance decision by every other draft produces a GAR record. It depends on KIA (kernel signing credentials) and IDP (Intent Declaration reference for every session record). It is consumed by the compliance, security operations, and regulatory audit layers above the SOOS stack.

Related drafts: [HEM](/drafts/hem) · [CAP](/drafts/cap) · [AEP](/drafts/aep) · [MAD](/drafts/mad) · [IDP](/drafts/idp)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/gar)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-gar/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
