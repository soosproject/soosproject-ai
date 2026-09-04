# Sovereign Object

Layer 1 — Core Semantics
**draft-sato-soos-sov-03**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-sov/) · [SOOS Stack](/stack)

---

## The problem

Agentic AI systems act on things. The things they act on — a booking, a contract, a financial account, a disaster response task — need to be represented in a format that the governance kernel can reason about, that Cedar policies can evaluate against, and that the audit record can reference unambiguously after the fact. Without this, authorization says "the agent may perform action X" with no binding to any specific, stateful, traceable resource — and "what did the agent do to that account?" becomes an application-log reconstruction problem, not a governance query.

**The design premise:** the Sovereign Object is to agentic AI what the IP packet is to the internet — the universal primitive that makes ecosystem-scale deployment possible. Every governed action has a subject. SOV is the format that makes that subject machine-readable, kernel-authoritative, and auditable.

---

## What's new in SOV-03

**A real ordering bug, found and fixed.** -02 evaluated Mandate JWT scope verification *last* — after SO Type Cedar policy had already run. That directly contradicted MJWT's own verification protocol, which requires all thirteen of its steps to complete before any Cedar evaluation begins at all. This wasn't theoretical: a Stage 2 test scenario confirmed the trace-level consequence directly — Cedar evaluation ran and returned PERMIT on an MJWT with an invalid signature, even though the overall pipeline still reached the correct final DENY through a later layer. -03 moves Mandate JWT verification to layer 1, ahead of every CAP and Cedar check, so Cedar never evaluates using SO state or IDP intent attributes that assume a principal/mandate relationship the pipeline hasn't actually confirmed yet.

**Mission Plan SO and Mission Status SO are no longer defined here.** -02 normatively defined both as SOV subtypes. AOP independently defines a materially more complete version of the same model — typed dependency edges (SEQUENTIAL, PARALLEL, CONDITIONAL), deadline tracking, critical-path annotation — and states plainly that these are AOP's subtypes. -03 removes the duplicate definition entirely and defers to AOP as sole owner, including AOP's dependency-type vocabulary. The Standing Plan Object (SPO) is unaffected and remains normatively defined here.

**Everything else is editorial currency**: eight stale cross-draft version references — some pointing as far back as `mjwt-02` and `kia-03` against current suite versions — updated throughout.

---

## Messages to key audiences

### IETF Working Groups

SOV defines the governed resource primitive that IDP, HEM, GAR, CAP, and MJWT all assume but none define. It is relevant to DAWN (the SO is the normative binding target for agent authority in multi-workload topologies), WIMSE (SOV provides the object the WIMSE-authenticated workload is authorized to act on), SCITT (SO Event Streams are SCITT-eligible state claims), and SPICE (SO Type declarations are structured resource credential subjects).

The SOV-02 Subtype Model itself (Section 5.5) is unchanged and still normative — SOV-03 only removed *SOV's own duplicate use* of that model for Mission Plan SO / Mission Status SO, in favor of AOP owning those subtypes. The SO Type Registry governance model and SO Type code namespace reservation (`soos/`, `ietf/`) remain proposed for IANA.

For DAWN specifically: SOV's written comment addresses three points — the SO as the normative binding target for agent authorization in multi-workload topologies, the Zone A/Zone B boundary as a portable interoperability surface DAWN routing can use without touching personal data, and the SO Type Registry as an IANA-analogous coordination point. The SPO remains directly relevant to DAWN's orchestration requirements; only the Mission Plan SO's DAG model moved to AOP, not its relevance.

To engage on SOV: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-sov/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your agent's actions have subjects — files, accounts, records, tasks — but those subjects are not represented in a form the governance kernel can reason about. Cedar policies reference entity schemas; HEM triggers reference resource context; GAR records reference resource identifiers. Without a standard resource entity type, governance is generic and imprecise.

SOV closes this gap. Your application resources become governed resources by being registered as Sovereign Objects. The kernel then knows what they are, what state they are in, and what actions are permitted against them.

**If you built against -02's policy evaluation order, check your implementation.** MJWT verification now runs first — before CAP Tier 0, before any Cedar evaluation. If your integration relied on the old layer-5 ordering, Cedar context populated on an unvalidated mandate is exactly the failure mode -03 closes.

**If you registered against Mission Plan SO or Mission Status SO**, those subtypes now live in AOP, not here — same underlying concept, a more complete DAG model, different normative home.

The **Standing Plan Object (SPO)** is unchanged: declarative operational plans that govern agents at plan scope rather than instance scope, with its own Cedar bundle reference, CAP-RRS catalog reference, and IDP structural validation integration. For event stream observability, SOV defines OpenTelemetry span attributes that map directly to your existing tracing infrastructure.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/sov)

### Regulators and policy teams

The Sovereign Object is the resource identifier that appears in every GAR audit record. When an auditor asks "what did the agent do to that account?" the answer is a query against GAR filtered by `so_id`. The full action history — every Cedar evaluation, every escalation, every state transition — is associated with that `so_id`.

For legal discovery and incident response: the `so_id` is the primary resource audit key, complementing the `mandate_id` (MJWT) as the primary authority audit key. Together they allow a complete reconstruction of any agent action: who authorized it (`mandate_id`) and what it was done to (`so_id`). -03's evaluation-order fix means that reconstruction is now sound at the trace level too — a discovery request can no longer surface a Cedar PERMIT that was evaluated before the acting agent's mandate was actually confirmed valid.

For regulated industries and disaster response governance: the Standing Plan Object (SPO) makes the operational plan itself a Sovereign Object — with its own audit record, its own Cedar-governed activation and revocation, and its own CAP-RRS constitutional constraint profile. A regulator can inspect the complete governance record for an entire operational episode by querying the SPO `so_id`.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS SOV-03 (Sovereign Object, draft-sato-soos-sov-03). This is an IETF protocol that defines the kernel-managed resource entity for the SOOS governance stack. A Sovereign Object has five layers: Identity (so_id UUID v7, so_type_id, human_principal_id, gec_id), State (current_state, current_phase, state_entered_at), Event Stream (append-only, GEC-signed, prior_event_id causal chain, soos.governance.kernel_id on every entry), Typed Graph (materialized view), and Attachment Index (Zone B content refs). Zone A MUST NOT contain personal data (INV-ZA-1). All transitions are GEC-mediated — no agent writes Zone A directly. The Cedar policy evaluation order is, IN THIS ORDER: (1) Mandate JWT verification, full 13-step protocol — a failure here is immediate DENY before any Cedar evaluation runs at all; (2) CAP Tier 0 constitutional prohibitions; (3) CAP Tier 1 jurisdictional prohibitions; (4) SPO scope constraint enforcement, if an active SPO governs the request; (5) SO Type Cedar policy (parent then subtype for SOV-02 subtypes — a parent DENY MUST NOT be overridden by subtype policy). Do NOT evaluate Cedar before MJWT verification completes — that was -02's bug, fixed in -03. The SOV-02 Subtype Model (Section 5.5) is normative; the only currently-registered SOOS subtype under it is the Standing Plan Object (soos/standing-plan-object/1.0) with scope_constraints, cedar_bundle_ref, cap_rrs_catalog_ref, idp_validation_ref. Mission Plan SO and Mission Status SO are NOT defined here — they are AOP subtypes (draft-sato-soos-aop), with a different, more complete DAG dependency model. Event Stream entries carry soos.governance.kernel_id and SHOULD be exported as OpenTelemetry spans with attribute prefix soos.so.* and soos.event.*."

**Cedar policy evaluation order (SOV-03, normative sequence):**

| Layer | Check | Failure behavior |
|---|---|---|
| 1 | Mandate JWT verification (13 steps, full MJWT protocol) | Immediate DENY, before any Cedar evaluation |
| 2 | CAP Tier 0 (constitutional) prohibitions | Immediate DENY |
| 3 | CAP Tier 1 (jurisdictional) prohibitions | DENY |
| 4 | SPO scope constraint enforcement (if active SPO governs) | Immediate DENY, before Cedar evaluation |
| 5 | SO Type Cedar policy (parent then subtype) | Parent DENY cannot be overridden by subtype |

**Key schema fields — SO Instance:**

| Field | Type | Layer | Description |
|---|---|---|---|
| `so_id` | UUID v7 | Identity | Globally unique, immutable SO identifier |
| `so_type_id` | string | Identity | Registered SO Type (e.g. `atp/booking-object/1.0`) |
| `human_principal_id` | string | Identity | Authority holder over this SO |
| `gec_id` | string | Identity | GEC currently governing this SO |
| `current_state` | string | State | Current state machine position |
| `current_phase` | string | State | ACTIVE / OPERATIONALLY_COMPLETE / ARCHIVED / ... |
| `prior_event_id` | UUID v7 | Event Stream | Causal predecessor entry; null only for SO_CREATED |
| `soos.governance.kernel_id` | string | Event Stream | GEC identity binding for every entry |

**Key schema fields — Standing Plan Object (additional Zone A):**

| Field | Type | Description |
|---|---|---|
| `plan_name` | string | Human-readable plan name |
| `scope_constraints` | object | Geographic, SO type, agent role, temporal, delegation depth |
| `cedar_bundle_ref` | URI | Content-addressed Cedar policy bundle for plan execution |
| `cap_rrs_catalog_ref` | URI | CAP-RRS profile active for this plan |
| `idp_validation_ref` | URI | IDP structural validation schema for all plan IDPs |
| `activation_at` | ISO 8601 | Set when SPO transitions to ACTIVE |

**Minimal SPO scope_constraints example:**

```json
{
  "geographic_scope": [
    { "jurisdiction": "JP", "sub_jurisdiction": "JP-01" }
  ],
  "so_type_scope": ["soos/disaster-event/1.0", "soos/shelter-resource/1.0"],
  "agent_role_scope": ["disaster_response_coordinator", "logistics_agent"],
  "temporal_scope": {
    "not_before": "2026-07-07T00:00:00Z",
    "not_after": "2026-08-07T00:00:00Z"
  },
  "max_delegation_depth": 3
}
```

**OTel span naming:**  `soos.so.<event_type>` — e.g. `soos.so.state_transitioned`, `soos.so.hem_triggered`

### Government and regulators

The Sovereign Object is the technical primitive that makes "who did what to which resource" a query answerable from the governance record rather than reconstructed from application logs. For regulated industries — finance, healthcare, legal, emergency management — where specific resources are subject to specific regulatory constraints, the SO type and zone designation make those constraints Cedar-evaluable and GAR-auditable.

The Standing Plan Object directly addresses a gap in disaster response governance: the operational plan itself has no standardized machine-readable representation. An SPO instance carries the plan's scope, the Cedar authority bundle, and the constitutional constraint profile as a first-class Sovereign Object with its own audit trail. Every agent action under the plan references the SPO `so_id`; every HEM escalation is bound to the plan; the complete governance record for an emergency response episode is retrievable by a single `so_id` query.

For jurisdiction-specific SO Type registry requirements and government engagement on SPO implementation: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI governance protocols produce audit records, Cedar evaluations, and escalation events — but the resource those actions target is represented differently in every application, making governance generic rather than resource-specific.

**Mechanism:** SOV defines the Sovereign Object schema and lifecycle: application resources are registered as SO Instances of a declared SO Type; the GEC maintains Zone A state authoritatively via a GEC-signed, causally ordered Event Stream; Cedar policies are written against the SO entity schema; every governance record references `so_id`. Mandate JWT verification is now the first gate in the evaluation pipeline, ahead of every Cedar check.

**Output:** A kernel-managed, tamper-evident resource entity — `so_id`, `so_type_id`, five-layer structure, Event Stream with `soos.governance.kernel_id` on every entry — that is the subject of every governed action, scoped by an optional Standing Plan Object for plan-level governance.

**Who verifies it:** Auditors and compliance teams who query GAR by `so_id` to reconstruct agent history on a specific resource; regulators who verify resource-specific constraints were enforced; external verifiers who replay the SCITT-submitted Event Stream to detect tampering.

---

## SO Type system and subtypes

The SO Type Registry is the extensible catalog of governed resource types. Every SO Instance is an instance of a registered SO Type; the SO Type defines the state machine, Zone A schema, Cedar policy set, and attachment types.

The **Subtype Model** (Section 5.5, unchanged since -02): a registered SO Type may extend a parent type, inheriting its state machine and Cedar prohibitions, while adding subtype-specific Zone A fields and transitions. A parent DENY cannot be overridden by a subtype policy.

Normative SOOS subtypes registered here:

| SO Type ID | Description | Parent |
|---|---|---|
| `soos/standing-plan-object/1.0` | Declarative operational plan governing agent scope, Cedar authority, and CAP-RRS profile | root |

**Mission Plan SO (`soos/mission-plan/1.0`) and Mission Status SO (`soos/mission-status/1.0`) are no longer registered here** — as of -03, AOP is their sole normative owner, using this same Subtype Model with a materially more complete DAG dependency vocabulary (SEQUENTIAL, PARALLEL, CONDITIONAL edges, deadline tracking, critical-path annotation).

The `soos/` namespace is reserved for SOOS-defined types; `ietf/` is reserved for IETF Standards Track types. Third-party types register under their own prefix.

---

## Zone A and Zone B

**Zone A — kernel-authoritative:** The GEC maintains the authoritative state of Zone A. No application may write Zone A fields without a Cedar PERMIT evaluated by the GEC. Zone A MUST NOT contain personal data (INV-ZA-1): it holds only identifiers, state references, and policy-relevant metadata.

**Zone B — attached periphery:** Application-managed content referenced from Zone A via a signed Attachment Index. The GEC verifies Zone B integrity on every access via content hash. Zone B contains personal data and other sensitive content; it is irreversibly erased at Cryptographic Erasure while Zone A and the Event Stream are retained for audit.

**Why this matters for compliance:** Zone B Cryptographic Erasure (destroying encryption keys, not deleting records) satisfies GDPR Article 17 and APPI Article 19 erasure obligations while preserving the complete audit trail that regulators may require under separate retention law.

---

## Use cases

**Disaster response activation — Standing Plan Object**

Hokkaido Prefecture activates its standing earthquake response plan following an M7.2 event. The activation creates an SPO instance with `so_type_id` `soos/standing-plan-object/1.0`. The SPO Zone A carries the governing scope (JP-01, 30-day temporal window), the Cedar bundle activating disaster exception authorities, and the CAP-RRS profile enabling push-type relief payment initiation. Every agent action in the response references the SPO `so_id`; every HEM escalation is bound to the SPO; the complete episode governance record is retrievable by SPO `so_id` long after the response concludes.

**Multi-agent orchestration — now via AOP's Mission Plan SO**

A logistics operator running a multi-agent supply chain mission — procurement, routing, customs, delivery, confirmation agents in dependency order — registers that orchestration as an AOP Mission Plan SO, not a SOV-defined one. AOP's DAG model (typed SEQUENTIAL/PARALLEL/CONDITIONAL edges, deadline tracking, critical-path annotation) is materially more complete than SOV-02's had been. The SO Type system and Subtype Model that make this possible are still defined here; the specific subtype and its event types are owned by AOP.

**Booking governance at MyAuberge — ATP Booking Object**

At MyAuberge K.K. (Chino, Nagano), each guest booking is an `atp/booking-object/1.0` Sovereign Object with eleven states (INQUIRY through COMPLETED) tracking the full journey lifecycle. When a booking enters BOOKING_SUSPENDED — a cross-cutting state that overlays any other state during disruption — all agent transitions are prohibited until the human principal resolves the suspension via HEM. After the journey completes, the SO transitions to OPERATIONALLY_COMPLETE and eventually to CRYPTOGRAPHICALLY_ERASED, destroying traveller personal data while preserving the governance record.

---

## How this builds on existing work

**Cedar (Amazon Web Services / Cedar Policy Language)** provides the policy evaluation semantics that SOV's authorization layer depends on. SOV profiles Cedar for governed resource access: SO Type declarations declare Cedar policy sets; the GEC evaluates Cedar against SO Instance state attributes exposed via the `so.*` context namespace, only after Mandate JWT verification has completed.

**SCITT (draft-ietf-scitt-architecture)** provides the transparency model for SO Event Stream anchoring. Every Event Stream entry is submitted to a SCITT transparency log (mandatory at Level 3 conformance), giving external verifiers a tamper-evident record of SO state transitions without requiring access to the GEC itself. SOV is event-centric where SCITT is artifact-centric; the SO Event Stream is the natural SCITT claim subject for governance-event transparency.

**WIMSE (draft-ietf-wimse-arch)** establishes workload identity for multi-system environments but does not define what workloads are authorized to act on. SOV provides that binding target. WIMSE credentials authenticate the agent; the MJWT (scoped to an SO Instance, and now verified before any Cedar evaluation touches that instance) authorizes what the authenticated agent may do to it.

**AOP (draft-sato-soos-aop)** is the sole normative owner of the Mission Plan SO and Mission Status SO subtypes, built on the Subtype Model this document defines. AOP's Mission Plan SO DAG enforcement coordinates with MAD for multi-agent sub-goal assignment; HEM escalation triggered by Mission Plan SO failures is specified in AOP, not here.

---

## Related work

**draft-ietf-oauth-resource-metadata** specifies resource server metadata describing server capabilities. SOV's SO Type Registry is complementary: where OAuth resource metadata describes server capabilities, the SO Type Registry describes governance properties of resource types — their state machines, Cedar policy sets, and lifecycle rules.

**W3C PROV-DM (Provenance Data Model)** provides the data provenance vocabulary that SOV's Event Stream history aligns with. An SO's state transition sequence is a W3C PROV-DM activity chain: each state change is an activity, each SO state is an entity, and the GEC is the agent.

**OpenTelemetry** is the observability bridge. SOV defines OTel span attributes (`soos.so.*`, `soos.event.*`) and span naming (`soos.so.<event_type>`) that map Event Stream entries to standard trace spans. OTel export does not substitute for SCITT submission; it enables integration with existing monitoring infrastructure.

SOV is the first IETF draft to specify a kernel-managed resource entity type for agentic AI governance. The SO Type Registry is the first attempt to define a standard taxonomy of governed resource types with IANA registration. There is no competing draft at this level of specificity.

---

## Security

**Key security properties:** Zone A kernel-authority (INV-ZA-1) prevents personal data exposure in the audit record; GEC-signed append-only Event Stream with `prior_event_id` causal chaining prevents history rewriting; SCITT transparency log submission enables external tamper detection independent of the GEC; Mandate JWT verification now gates every other check, so Cedar never evaluates against SO state or IDP intent attributes populated on an unconfirmed principal/mandate relationship; stale `state_constraint` defense requires Event Stream head read under lock before Mandate JWT validation.

**Evaluation-order defect, closed:** -02's Cedar evaluation ran with Mandate JWT verification last, at layer 5. A confirmed test trace showed Cedar reaching PERMIT against an MJWT with an invalid signature, before the pipeline's later layer caught it and produced the correct final DENY — a real gap between "the system's final answer was right" and "every intermediate evaluation was sound." -03 makes MJWT verification layer 1: any signature, revocation, or scope failure now produces DENY before Cedar ever runs.

**SO state manipulation:** An adversary with application-layer access attempts to overwrite `current_state` directly in the state store, bypassing Cedar evaluation. Defense: the GEC is the sole writer of Zone A fields; the GEC verifies state consistency by comparing cached state against the Event Stream head on every Transition Request. Residual risk requires SCITT external verification.

**Event Stream tampering:** An adversary attempts to delete, modify, or reorder committed Event Stream entries to alter the SO history. Defense: GEC signatures on every entry plus `prior_event_id` chain integrity; broken chains trigger immediate `INTEGRITY_VIOLATION`; SCITT submission is performed by an independent process to prevent single-point suppression.

**SO Type spoofing:** An adversary claims a more permissive `so_type_id` in the Transition Request. Defense: the GEC resolves SO Type and Cedar policy exclusively from the SO Instance's Event Stream-committed Identity Layer, never from the Transition Request. Cedar policy set content is hash-verified against the value committed at `SO_CREATED`.

**Stale `state_constraint` exploitation:** An adversary times a Transition Request to exploit a GEC state cache that has not yet reflected a recent state transition, presenting a Mandate JWT whose `state_constraint` is no longer valid. Defense: the GEC acquires a read lock on the Event Stream before reading `current_state` for Mandate JWT validation and holds the lock through commit or deny.

**Formal analysis status:** INV-ZA-1 and the causal Event Stream chain are the key invariants requiring formal verification. Cedar policy set completeness — ensuring no gap that would allow Zone A writes without PERMIT — is the primary gap.

---

## SOOS stack context

SOV sits at **Level 1 — Core Semantics**, the foundation layer of the SOOS stack. It depends on KIA for GEC signing key attestation via `soos.governance.kernel_id`, and on Cedar for policy evaluation semantics. It is consumed by every other SOOS draft: IDP (governed object target), HEM (escalation bound to SO Instance), GAR (audit records keyed by `so_id`), CAP (prohibitions evaluated at SO level, and now confirmed to run only after MJWT verification), MJWT (authority bound to SO Instance, verified before any other layer), MAD (cluster governance over shared SOs), AOP (Mission Plan SO / Mission Status SO built on SOV's Subtype Model), AEP (execution cycle targets SO Instance), FAIP (analytics over Zone A Event Stream data). The SPO is consumed by GRP (Governed Remediation Protocol) for plan-scope remediation governance.

Related drafts: [KIA](/drafts/kia) · [IDP](/drafts/idp) · [MJWT](/drafts/mjwt) · [CAP](/drafts/cap) · [HEM](/drafts/hem) · [GAR](/drafts/gar) · [MAD](/drafts/mad) · [AOP](/drafts/aop)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/sov)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-sov/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
