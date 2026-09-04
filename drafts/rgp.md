# Resource Governance Protocol (RGP)

Layer 2 — Resource Declaration and Discovery
**draft-sato-soos-rgp-01**
[IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-rgp/) · [SOOS Stack](/drafts/)

---

## The problem

An AI agent can only be held accountable for its resource choices if those resources have declared what they are, at what trust level they have been verified, and whether they are currently available — before the agent acts. Existing capability registries and digital twin standards describe what a resource can do but carry no governance envelope: no trust attestation, no mandate-scope compatibility, no pre-declared fallback structure. An agent that assigns tasks without this layer may select resources that are outside its mandate, below its required trust threshold, or legally incompatible with its compliance obligations — and no audit record will show why.

The design premise: resource assignment is a governance decision, not just a routing decision. RGP makes that governance machine-readable.

---

## What's new in RGP-01

**A new section closes a gap the suite had been quietly depending on without a mechanism.** DAM's Externally Ingested Artifact (EIA) class has always required ingestion to be validated against a resource's current RGP Trust Level and Governance Envelope — but until -01, no RGP section actually specified the request/response protocol at which that validation happens. §11, Resource Data Request, is that missing piece: the checkpoint where an agent submits a resource's raw response to the GEC, and the GEC's validation determines whether, and as what, that content becomes governed data.

**Validation and commit are strictly separated, and the reason is structural, not just cautious.** The GEC runs a full validation pass over an entire batch before minting anything. Nothing is signed, nothing gets a `da_id`, until the whole batch is known good — because this suite's tamper-evidence model has no way to undo an already-signed artifact. Minting some records before knowing the batch is valid would mean "reject the batch" requires unsigning something. Validate-then-commit avoids that problem by construction.

**Duplicate ingestion is now explicitly caught.** A resource's response can arrive twice — a legitimate retry, or an actual replay — and prior to -01 nothing stopped a duplicate from being minted as a second, independent artifact. That's not just redundant: it would present as *independent corroborating data* to FAIP's aggregate intelligence layer when it's the same submission counted twice. §11.3 now checks every record's content hash against existing non-superseded EIAs from the same resource before minting, and rejects a match with its own dedicated event (`ALE-032`, distinct from an ordinary validation failure) so an auditor can tell "this was already ingested" from "this was malformed" without cross-referencing anything else.

**Batches are bounded.** `max_batch_size` (RECOMMENDED default 100) caps how much validation work one request can impose — without it, a resource, malicious or just buggy, could return an arbitrarily large batch and impose unbounded cost on the GEC for a single call.

**Three new GAR event types**: `ALE-030` (`RGP_DATA_INGESTED`), `ALE-031` (`RGP_DATA_INGESTION_REJECTED`), `ALE-032` (`RGP_DUPLICATE_RECORD`).

---

## Messages to key audiences

### IETF Working Groups

RGP is the resource-facing discovery layer for the SOOS governance architecture. It sits between the Mandate JWT (MJWT, mandate scope and budget) and the Agent Execution Protocol (AEP, session execution loop), and is invoked before the Intent Declaration Primitive (IDP) at each session start.

The protocol uses two well-established IETF mechanisms: the well-known URI pattern (RFC 8615) for Stage 1 fingerprint discovery, and JWS signing (RFC 7519 conventions) for Stage 2 full declaration attestation — with Stage 1 queries now normatively requiring TLS 1.3 per its current RFC, 9846. Eight capability classes and four trust levels are defined with IANA registries. RGP now registers eleven GAR ALE types in total (ALE-022 through ALE-032), the last three added in -01 for the Resource Data Request mechanism.

Key architectural decisions: DEC-RGP-02 (well-known URI, consistent with ACD pattern); DEC-RGP-03 (Resource Map SO is session-scoped, not mandate-scoped); DEC-RGP-08 (three-condition autonomous fallback test); DEC-RGP-11 (ATP profile is a domain profile document, not part of RGP).

Open questions deferred post-Vienna: OQ-RGP-01 (Stage 1 minimum schema), OQ-RGP-04/05 (probabilistic model capability), OQ-RGP-07 (Reasoning Class registry), OQ-RGP-09 (digital twin field mappings). Vienna engagement planned with Qin Wu (NMOP WG) on OPC UA and ITU-T Y.3090 alignment.

Normative dependencies: KIA, MJWT, AEP, IDP, GAR, HEM, CAP, SOV, KEE-1, and — new in -01 — DAM, since §11 is the mechanism that turns RGP-validated resource data into DAM's Externally Ingested Artifacts. Consumed by: GRP.

### App builders

RGP adds a pre-session discovery step to your SOOS-governed agent loop. Before your agent declares intent (IDP) or makes any resource assignment, the GEC queries each candidate resource's `/.well-known/soos-rgp` endpoint and constructs a Resource Map Sovereign Object — the kernel-validated record of what resources are available, at what trust level, and within your mandate budget.

What you implement for each resource you want to expose:

1. A Stage 1 fingerprint endpoint at `/.well-known/soos-rgp` (HTTPS/TLS 1.3, returns `application/soos-rgp-fingerprint+json`) with five required fields: `resource_id`, `capability_class`, `trust_level`, `availability_status`, `valid_until`.

2. A Stage 2 full declaration at a URI carried in `full_declaration_uri` — covering all nine governance dimensions including `compliance_declarations`, `cost_model`, and `output_da_type`.

For TRUST-2 resources, you self-sign the Stage 2 declaration with your KIA-registered keys. For TRUST-1, you obtain attestation from a registered attestation authority (e.g., the ATP supplier registry for CAP-EXP resources).

**If your agent actually retrieves and uses data from a resource — not just discovers it — you now have a defined mechanism for that too.** Once a resource is assigned, submit its raw response as a Resource Data Request: an array of records (one to `max_batch_size`), each carrying a content hash rather than the payload itself. The GEC validates the whole batch, then commits every record together as its own DAM artifact — or rejects the whole batch with no partial-acceptance path, since accepting some records and not others would leave the rejected ones unaccounted for in the audit trail with no clean story for why. Submitting the same response twice is safe: the GEC recognizes the duplicate by content hash and rejects it distinctly (`ALE-032`) rather than minting a second copy.

Your agent code doesn't call RGP directly for discovery — the GEC handles that and validates the Resource Map SO on your agent's behalf before each assignment. Resource Data Requests are the one place your agent code does talk to RGP directly: after the network call to the resource happens (outside GEC mediation, like any tool use), you hand the response to the GEC before using its content.

**Key schema fields:**

| Field | Where | Type | Required |
|---|---|---|---|
| `resource_id` | Stage 1 | URI string | REQUIRED |
| `capability_class` | Stage 1 | CAP-COMP \| CAP-STOR \| CAP-NET \| CAP-FAB \| CAP-COMM \| CAP-TXN \| CAP-HUMAN \| CAP-EXP | REQUIRED |
| `trust_level` | Stage 1 | TRUST-0 \| TRUST-1 \| TRUST-2 \| TRUST-3 | REQUIRED |
| `availability_status` | Stage 1 | AVAILABLE \| AT_CAPACITY \| UNAVAILABLE \| MAINTENANCE | REQUIRED |
| `valid_until` | Stage 1 | ISO 8601 datetime | REQUIRED |
| `full_declaration_uri` | Stage 1 | URI | REQUIRED if Stage 2 exists |
| `compliance_declarations` | Stage 2 | Object | REQUIRED |
| `cost_model` | Stage 2 | Object | REQUIRED |
| `output_da_type` | Stage 2 | SO Type string | REQUIRED |
| `attestation_signature` | Stage 2 | JWS string | REQUIRED for TRUST-1 |
| `resource_id` (request) | Resource Data Request | string | REQUIRED — must match a Resource Map SO entry |
| `records[].record_content_hash` | Resource Data Request | SHA-256 | REQUIRED — hash only, not the payload |
| `records[].record_subject_ref` | Resource Data Request | string \| null | OPTIONAL — distinguishes co-arriving records (e.g. travelers in one booking) |

### Regulators and policy teams

RGP is the governance layer that makes resource assignment decisions auditable. Every resource queried by a governed AI agent produces a GAR audit record. Every assignment decision — including which resources were excluded and why — is recorded in the Resource Map Sovereign Object and committed to the session's audit log. As of -01, so is every point at which resource-sourced data actually entered the system: `ALE-030` for a successful ingestion, `ALE-031` for a rejection, and `ALE-032` specifically when the rejection was a duplicate — letting an investigator distinguish "this data was never valid" from "this data was already recorded" without extra cross-referencing.

For regulators investigating whether a governed AI agent made appropriate resource choices: `ALE-022` shows every resource the agent could have used at session start; `ALE-024` records each resource queried; `ALE-025` records each resource excluded and why; `ALE-026` records every fallback activation, autonomous or escalated.

The three-condition fallback test (§14.1) is the normative rule for autonomous versus human-involved action: trust level cannot decrease autonomously, capability class cannot change autonomously, budget cannot be exceeded autonomously. Any failure triggers the Human Escalation Mechanism — a mandatory, logged human decision point.

RGP Stage 2 `compliance_declarations` support EU AI Act Article 13 transparency requirements and GDPR Article 25 / APPI data-protection-by-design: the agent can only assign a personal-data-handling task to a resource that has declared a compatible data protection framework.

### Agentic AI and coding assistants

> You are implementing a SOOS-governed AI agent that needs to discover and validate resources before assignment, and to validate data once it retrieves it. Use the Resource Governance Protocol (RGP, draft-sato-soos-rgp-01).
>
> Discovery, before any resource assignment in an AEP session:
> 1. Query `GET /.well-known/soos-rgp` on each candidate resource endpoint (TLS 1.3, parallel queries acceptable).
> 2. Parse the Stage 1 fingerprint. Required fields: `resource_id`, `capability_class`, `trust_level`, `availability_status`, `valid_until`.
> 3. For each resource passing `valid_until` check: screen against mandate constraints (capability class scope, minimum trust level, budget ceiling, compliance declarations).
> 4. For mandate-compatible resources: retrieve Stage 2 full declaration. Verify attestation signature for TRUST-1 resources. Downgrade to TRUST-2 and emit ALE-027 if verification fails.
> 5. Construct Resource Map SO with all queried resources. GEC signs with KIA keys. Emit ALE-022.
> 6. At assignment: re-validate availability, confirm within budget, record in Resource Map SO assignment_decisions.
> 7. On primary resource failure: apply the three-condition test (trust parity, capability coverage, budget). All pass → autonomous fallback (ALE-026, autonomous: true). Any fail → trigger HEM (HEM-HIGH-1 trust, HEM-PRE-2 class, HEM-DS-1 budget). Never improvise fallback without EOD pre-declaration.
>
> Data ingestion, once a resource has actually returned data (NEW in -01):
> 8. Submit a Resource Data Request: resource_id (must match a Resource Map SO entry), request_id (UUID v7), an array of one to max_batch_size records, each carrying record_content_hash (SHA-256 of the raw content, not the content itself).
> 9. The GEC runs validation in FULL before any commit: (a) resource_id and batch size check, (b) re-verify current Trust Level/Governance Envelope — not the cached Stage 1/2 value, (c) every record is well-formed and record_subject_ref is unique in the batch, (d) every record's content hash is checked against existing non-superseded EIAs from the same resource — a match means duplicate, reject as ALE-032, not ALE-031.
> 10. Only if the ENTIRE batch passes validation does the GEC mint EIAs and commit — one da_id per record, one ALE-030 for the whole batch. If any record fails, nothing is minted; emit ALE-031 (or ALE-032 for duplicates) and resubmit a corrected request. There is no partial-batch acceptance.
>
> Key invariant: the agent MUST NOT make a resource assignment without a valid, GEC-signed Resource Map SO entry for that resource, and MUST NOT act on resource-sourced data before it has been validated and committed via a Resource Data Request. The Resource Map SO does not persist across AEP sessions.

### Government and regulators

RGP provides the machine-readable resource governance layer that operationalizes supply-side compliance requirements in AI agent deployments. For government operators deploying SOOS-governed multi-agent systems: every resource in the deployment — whether a digital service, a physical facility, or an AI model instance — can declare its compliance posture in a standardized governance envelope that is verified by the GEC before any agent assignment, and any data that resource returns is now validated and recorded through a defined ingestion checkpoint before an agent can act on it.

The trust level framework (TRUST-0 through TRUST-3) supports tiered assurance requirements: government-grade deployments may require TRUST-1 (independently attested) for transaction-class and human-coordination resources, while permitting TRUST-2 for lower-stakes discovery operations.

The three-condition fallback test provides a clear legal basis for determining when autonomous agent action is permissible versus when human oversight is required. Jurisdictions interested in encoding sector-specific resource attestation requirements into TRUST-1 attestation authority requirements are invited to engage via the SOOS Project.

---

## Core technology

**Problem:** Governed AI agents need to know what resources can do, at what trust level they have been verified, and whether they are currently available — and, once they act, need a governed way to bring that resource's data into the system — but no existing standard provides a governance envelope for either.

**Mechanism:** RGP defines a two-stage discovery protocol (Stage 1 lightweight fingerprint, Stage 2 full governance envelope) that the GEC validates against the active mandate before constructing a session-scoped Resource Map Sovereign Object. A third mechanism, the Resource Data Request, validates resource-sourced data in a full-batch validate-then-commit pass before it becomes governed data.

**Output:** A KIA-signed Resource Map Sovereign Object recording all discovered resources, their governance state, mandate compatibility, and assignment decisions; and, per Resource Data Request, one or more DAM Externally Ingested Artifacts with independent retention and audit history — all committed to the GAR audit log.

**Who verifies it:** The GEC validates every resource assignment and every data ingestion against the Resource Map SO before permitting it; regulators and auditors inspect the Resource Map SO and its associated ALEs (ALE-022 through ALE-032) to reconstruct the agent's complete resource landscape and data provenance at any point in a session.

---

## Capability class model

RGP defines eight registered capability classes. Every resource declares exactly one primary class.

| Class | Scope |
|---|---|
| CAP-COMP | Computational resources: processors, inference endpoints, cloud functions |
| CAP-STOR | Storage resources: databases, filesystems, object stores, vector stores |
| CAP-NET | Network resources: APIs, webhooks, messaging queues, streaming endpoints |
| CAP-FAB | Fabrication resources: physical manufacturing, 3D printing, robotics |
| CAP-COMM | Communications resources: notification channels, alert systems |
| CAP-TXN | Transaction resources: payment systems, contract execution, settlement |
| CAP-HUMAN | Human-in-the-loop resources: expert queues, review workflows, approval |
| CAP-EXP | Experiential resources: hospitality, activity tourism, bookable experiences |

New classes are added by IETF consensus. Deployment-specific sub-classes use the `CAP-[CLASS]-[OPERATOR-TOKEN]` convention.

---

## The three-condition fallback test

When a primary resource is unavailable, the agent may only activate a fallback autonomously if all three conditions pass:

| Condition | Rule | HEM class if fails |
|---|---|---|
| 1 — Trust level | Fallback trust_level ≥ primary trust_level | HEM-HIGH-1 |
| 2 — Capability class | Fallback capability_class covers the sub-goal | HEM-PRE-2 |
| 3 — Budget | Fallback cost stays within MJWT Resource Envelope | HEM-DS-1 |

All three conditions are evaluated against fresh Stage 1 fingerprint data at activation time. This rule (DEC-RGP-08) is adopted verbatim by the Governed Remediation Protocol (GRP) as its FALLBACK action class normative boundary.

---

## The Resource Data Request validation sequence

| Step | Phase | What happens |
|---|---|---|
| 1 | Validation | Verify resource_id matches a Resource Map SO entry and batch ≤ max_batch_size |
| 2 | Validation | Re-verify current Trust Level / Governance Envelope — not the cached discovery value |
| 3 | Validation | Every record well-formed; record_subject_ref unique across the batch |
| 4 | Validation | Every record's content hash checked against existing EIAs — duplicate detection |
| 5 | Commit (only if 1-4 pass for the whole batch) | Mint one EIA per record; classifier_evaluated set per DAM's poisoning defense |
| 6 | Commit | Emit ALE-030 once for the batch, carrying every minted da_id |
| 7 | Rejection (if 1-3 failed) | No commit; emit ALE-031 |
| 7' | Rejection (if 4 failed — duplicate) | No commit; emit ALE-032 instead of ALE-031 |

No da_id is minted and nothing is signed until the full batch passes every check — a rejection is a true no-op on DAM/GAR state, since there is nothing yet to undo.

---

## Use cases

**Activity travel supplier discovery — booking agent**

A SOOS-governed booking agent holds a Mandate JWT authorizing CAP-EXP assignments within a defined budget. Before constructing an itinerary, it queries Stage 1 fingerprints from registered ATP suppliers including Ponyhouse Farm (TRUST-1, attested by the ATP supplier registry). The GEC constructs a Resource Map SO with only mandate-compatible, currently-available suppliers. The booking workflow is only initiated against resources in the Resource Map SO — never against unvalidated endpoint claims.

**A five-record booking confirmation, ingested once**

The booking agent's assigned supplier returns a single confirmation response covering five family members traveling together. The agent submits one Resource Data Request with five records, each carrying its own content hash and a `record_subject_ref` distinguishing which traveler it belongs to. The GEC validates the resource's current trust level once — not five times — since all five records share the same origin. All five pass; the GEC mints five independent EIAs and emits one `ALE-030` carrying all five da_ids. If the agent's network layer retries and resubmits the identical response, the GEC recognizes each record's content hash as already ingested and rejects the resubmission with `ALE-032`, leaving the original five EIAs as the sole record.

**Emergency capacity coordination — government deployment**

A government emergency management agency's multi-agent system discovers available shelter capacity across municipal facilities during a declared emergency. Each facility exposes an RGP Stage 1 fingerprint with current `availability_status`. The master agent's Resource Map SO reflects live capacity state. When a facility reaches capacity mid-session, the three-condition test determines whether the agent may reroute autonomously or must escalate to a human operator — with every decision recorded in GAR.

**Enterprise supplier compliance — procurement agent**

A procurement agent queries API suppliers (CAP-NET) before initiating a sourcing workflow. Suppliers at TRUST-3 are excluded from active assignment candidates by the deployment's CAP profile. Suppliers at TRUST-2 are permitted for discovery but not transaction initiation. The Resource Map SO records the compliance basis for every assignment decision — satisfying audit requirements without manual review of system logs.

---

## How this builds on existing work

**KIA (draft-sato-soos-kia)** provides the signing key material used by the GEC to sign the Resource Map Sovereign Object at construction. RGP depends on KIA for all signature operations including attestation verification for TRUST-2 self-signed declarations.

**MJWT (draft-sato-soos-mjwt)** The Resource Envelope in the Mandate JWT defines the constraints that bound Resource Map SO construction: capability class scope, minimum trust level, and budget ceiling. RGP cannot construct a valid Resource Map SO without an active MJWT.

**AEP (draft-sato-soos-aep)** RGP discovery is a pre-PLAN step in the AEP session loop. The Resource Map SO is constructed at AEP session open and closed at session close. The fallback pre-declaration requirement ties directly to AEP's Expected Outcome Declaration (EOD): fallback candidates must be named in the EOD before session start.

**DAM (draft-sato-soos-dam), new dependency in -01** RGP's Resource Data Request is the mechanism by which RGP-validated resource data becomes a DAM Externally Ingested Artifact. RGP doesn't define EIA's own schema, retention rules, or write-authority model — that's entirely DAM's — RGP defines only the checkpoint at which validation happens before DAM takes over.

**FAIP** benefits directly from the duplicate-detection fix in §11.3: without it, a resource replaying a response would present as independent corroborating data to FAIP's aggregate intelligence layer, when it's actually the same submission counted twice.

---

## Related work

**ACD** ACD and RGP are complementary, not overlapping. ACD discloses the agent's compliance posture to a resource provider. RGP discloses the resource's capability and governance state to the agent. Both may be exercised in sequence at the start of a governed interaction; neither is a prerequisite for the other.

**Existing digital twin standards (AAS, WoT, OPC UA, DTDL)** provide rich capability descriptions but no governance envelope. RGP-Physical (§13) is a governance overlay for each — resources using these standards can satisfy RGP Stage 2 requirements via the relevant binding profile without modifying their existing digital twin implementation.

**Windley's observation that agent capability declarations answer "what" but not "when"** a resource can act motivates treating Availability Status and the Staleness Bound as a first-class governance dimension in RGP, rather than an implementation detail left to the resource.

RGP is the first specification to combine capability class declaration, trust level attestation, mandate-scope validation, session-scoped assignment tracking, a normative fallback boundary rule, and — as of -01 — a governed data-ingestion checkpoint, for AI agent resource discovery and use.

---

## Security

**Key security properties:** Stage 1 fingerprints for TRUST-1 resources carry attestation authority signatures verified by the GEC before any Resource Map SO entry is created. The Resource Map SO is KIA-signed at construction; the GEC re-verifies before every assignment. Fallback candidates must be pre-declared in the AEP EOD; runtime improvisation is prohibited. Attestation downgrade (ALE-027) is recorded whenever signature verification fails.

**Resource Data Request integrity (new in -01):** validation runs to completion over an entire batch before any commit — no da_id is minted and no signature produced until the whole batch is known valid, since this suite's tamper-evidence model provides no way to undo an already-signed artifact. Duplicate submissions (retries, replays) are detected by content hash against existing non-superseded EIAs and rejected distinctly (ALE-032) rather than minted as a second, independently-auditable copy. `max_batch_size` bounds the per-request validation cost a single resource interaction can impose on the GEC.

**Fallback boundary bypass:** the coordinated attack (primary resource spoofed as unavailable + malicious fallback pre-positioned) is mitigated by requiring EOD pre-declaration of fallback candidates, fresh Stage 1 re-query at activation, and mandatory three-condition re-evaluation against the current MJWT.

**Formal analysis status:** The three-condition fallback test (DEC-RGP-08) has been reviewed in architectural working sessions. Formal verification of the condition logic, and of the Resource Data Request validate-then-commit sequence, has not yet been performed.

---

## SOOS stack context

RGP sits at Level 2 — the Session Layer — alongside IDP. It depends on KIA, SOV, MJWT, AEP, CAP, GAR, HEM, and — new in -01 — DAM, since Resource Data Request is DAM's EIA ingestion mechanism. It is consumed by GRP (adopts DEC-RGP-08 as its FALLBACK boundary rule). RGP precedes IDP in the execution sequence: mandate-compatible resource confirmation must occur before intent declaration.

Related drafts: [AEP](/drafts/aep) · [IDP](/drafts/idp) · [GRP](/drafts/grp) · [HEM](/drafts/hem) · [GAR](/drafts/gar) · [DAM](/drafts/dam) · [ACD](/drafts/acd)

---

## Contribute

- [File an issue on GitHub](https://github.com/soos-project/soos-spec/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-rgp/)
- [SOOS Project](https://soosproject.ai)
- Contact: tom@myauberge.jp
