# Data Artifact Management (DAM)
Layer 4 — Data Governance
**draft-sato-soos-dam-00**
[IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-dam/) · [SOOS Stack](/stack)

::: warning Full specification forthcoming post-Vienna
DAM-00 is an abstract-only placeholder submission establishing the draft identifier. Full normative text (DAM-01) will be submitted after IETF 126 Vienna (July 2026). The DA-Type taxonomy and graph write authority model are architecturally locked; the full section text is in active development.
:::

---

## The problem

Every agentic AI system produces, consumes, and transforms data continuously — but no protocol specifies a unified governance layer for that data. A GAR audit record and a purchase order produced by an agent are both data, but they have completely different write authority, retention obligations, and provenance requirements. Without a typed taxonomy and governance envelope that travels with each artifact, a governed agent system cannot make machine-readable claims about what it produced, under what authority, with what retention obligation, or how that data connects to the audit record.

The design premise: data governance is not a storage problem. It is a provenance, authority, and retention problem — and it must be solved at the protocol layer, not the application layer.

---

## Abstract

This document specifies the Data Artifact Management (DAM) protocol for agentic AI systems governed by the Sovereign Object OS (SOOS) framework. DAM defines a typed taxonomy of data artifacts produced and consumed by AI agents, a governance envelope for each artifact type specifying provenance, access policy, temporal validity, and retention requirements, and the normative interface between agent-generated artifacts and the Governance Audit Record (GAR).

DAM addresses three classes of data in agentic systems: kernel-generated artifacts (IDP event logs, GAR records, AEP session state), agent-generated artifacts (outputs of agent actions), and externally ingested artifacts (data made available by resources). DAM specifies the Data Artifact type (DA-Type) taxonomy referenced in the Resource Governance Protocol (RGP) and the Agent Execution Protocol (AEP).

---

## DA-Type taxonomy (locked)

| Class | What it is | Examples | Write authority |
|---|---|---|---|
| **KGA** — Kernel-Generated Artifact | Produced by GEC kernel as governance record | IDP records, GAR records, AEP session state, SACR objects | Kernel-only |
| **AGA** — Agent-Generated Artifact | Produced by agent as action output | Documents, reports, decisions, itineraries, purchase orders | Agent-write with kernel audit |
| **EIA** — Externally Ingested Artifact | Made available by external resource | API responses, database results, sensor readings, supplier data | External-write with kernel validation |

---

## Graph write authority model (locked)

Three tiers govern who may create, modify, or delete each artifact class:

**Tier 1 — Kernel-only (KGA):** Only the GEC kernel may write KGA artifacts. No agent is granted Cedar `Action::WriteKGA`. Enforced at the TEE boundary per KEE-1 P1. KGA artifacts are `KERNEL_PERMANENT` — never deleted except by legal order with a court-order attestation record in GAR.

**Tier 2 — Agent-write with kernel audit (AGA):** The agent produces AGA artifacts as authorized action outputs. Every AGA production event is logged to GAR by the kernel immediately upon production. The agent cannot suppress or modify the GAR log entry.

**Tier 3 — External-write with kernel validation (EIA):** External resources produce EIA artifacts. The kernel validates each EIA against the active RGP Resource Envelope before permitting agent ingestion. Ingestion is logged to GAR.

---

## Retention requirement vocabulary (locked)

| Class | Meaning |
|---|---|
| `KERNEL_PERMANENT` | GAR records; never deleted except by legal order |
| `SESSION_SCOPED` | Valid for session duration only |
| `OPERATOR_DEFINED` | Operator configures retention period |
| `REGULATORY_MINIMUM` | Minimum period specified by applicable regulatory obligation |

---

## Status

DAM-00 establishes the draft identifier and abstract. Full normative specification (DAM-01) is post-Vienna, scheduled after GAR-03 text authoring.

**Locked in DAM-00:** DA-Type three-class taxonomy (KGA/AGA/EIA), graph write authority model (three tiers), retention requirement vocabulary (four classes), GAR provenance integration architecture.

**Deferred to DAM-01:** DA-Type sub-type registry; Governance Envelope full schema; EIA poisoning defense normative treatment; AGA linkage to EOD target state; Cedar evaluation semantics for artifact access policy.

---

## SOOS stack context

DAM sits at Layer 4 — Data Governance, above GAR and below AEP/RGP. It depends on: GAR (draft-sato-soos-gar-03, provenance chain and Session Block), KEE-1 (draft-sato-soos-kee-00, TEE boundary enforcement for KGA write authority), AEP (draft-sato-soos-aep-02, session context for artifact provenance). It is consumed by: RGP (DA-Type taxonomy for EIA validation), AEP (DA-Type taxonomy for AGA production logging), AOP (AGA linkage to Mission EOD target state, post-DAM-01).

Related drafts: [GAR](/drafts/gar) · [AEP](/drafts/aep) · [RGP](/drafts/rgp) · [KEE-1](/drafts/kee)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-dam/)
- [Full SOOS stack](/stack)
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
