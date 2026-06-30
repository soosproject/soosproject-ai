# Resource Governance Protocol (RGP)
Layer 2 — Resource Declaration and Discovery
**draft-sato-soos-rgp-00**
[IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-rgp/) · [SOOS Stack](/drafts/)

---

## The problem

An AI agent can only be held accountable for its resource choices if those resources have declared what they are, at what trust level they have been verified, and whether they are currently available — before the agent acts. Existing capability registries and digital twin standards describe what a resource can do but carry no governance envelope: no trust attestation, no mandate-scope compatibility, no pre-declared fallback structure. An agent that assigns tasks without this layer may select resources that are outside its mandate, below its required trust threshold, or legally incompatible with its compliance obligations — and no audit record will show why.

The design premise: resource assignment is a governance decision, not just a routing decision. RGP makes that governance machine-readable.

---

## Messages to key audiences

### IETF Working Groups

RGP is a new individual submission defining the resource-facing discovery layer for the SOOS governance architecture. It sits between the Mandate JWT (MJWT, mandate scope and budget) and the Agent Execution Protocol (AEP, session execution loop), and is invoked before the Intent Declaration Primitive (IDP) at each session start.

The protocol uses two well-established IETF mechanisms: the well-known URI pattern (RFC 8615) for Stage 1 fingerprint discovery, and JSON with JWS signing (RFC 7519 conventions) for Stage 2 full declaration attestation. Eight capability classes and four trust levels are defined with IANA registries. Eight new GAR ALE types (ALE-022 through ALE-029) are registered.

Key architectural decisions locked in DR-RGP-02: DEC-RGP-02 (well-known URI, consistent with ACD pattern); DEC-RGP-03 (Resource Map SO is session-scoped, not mandate-scoped); DEC-RGP-08 (three-condition autonomous fallback test); DEC-RGP-11 (ATP profile is a domain profile document, not part of RGP).

Open questions deferred post-Vienna: OQ-RGP-01 (Stage 1 minimum schema), OQ-RGP-04/05 (probabilistic model capability), OQ-RGP-07 (Reasoning Class registry), OQ-RGP-09 (digital twin field mappings). Vienna engagement planned with Qin Wu (NMOP WG) on OPC UA and ITU-T Y.3090 alignment.

Normative dependencies: KIA-03, MJWT-02, AEP-02, IDP-05, GAR-03, HEM-05, CAP-04, SOV-02, KEE-00. Consumed by: GRP-00.

### App builders

RGP adds a pre-session discovery step to your SOOS-governed agent loop. Before your agent declares intent (IDP) or makes any resource assignment, the GEC queries each candidate resource's `/.well-known/soos-rgp` endpoint and constructs a Resource Map Sovereign Object — the kernel-validated record of what resources are available, at what trust level, and within your mandate budget.

What you implement for each resource you want to expose:

1. A Stage 1 fingerprint endpoint at `/.well-known/soos-rgp` (HTTPS GET, returns `application/soos-rgp-fingerprint+json`) with five required fields: `resource_id`, `capability_class`, `trust_level`, `availability_status`, `valid_until`.

2. A Stage 2 full declaration at a URI carried in `full_declaration_uri` — covering all nine governance dimensions including `compliance_declarations`, `cost_model`, and `output_da_type`.

For TRUST-2 resources, you self-sign the Stage 2 declaration with your KIA-registered keys. For TRUST-1, you obtain attestation from a registered attestation authority (e.g., the ATP supplier registry for CAP-EXP resources).

Your agent code doesn't call RGP directly — the GEC handles discovery and validates the Resource Map SO on your agent's behalf before each assignment operation.

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

### Regulators and policy teams

RGP is the governance layer that makes resource assignment decisions auditable. Every resource queried by a governed AI agent produces a GAR audit record. Every assignment decision — including which resources were excluded and why — is recorded in the Resource Map Sovereign Object and committed to the session's audit log.

For regulators investigating whether a governed AI agent made appropriate resource choices: the GAR ALE-022 (Resource Map Constructed) record shows every resource the agent could have used at session start. ALE-024 records each resource queried. ALE-025 records each resource excluded and the reason. ALE-026 records every fallback activation, including whether it was autonomous or required human escalation and why.

The three-condition fallback test (Section 13.1) is the normative rule that determines when an AI agent may act autonomously versus when it must involve a human operator. Condition 1 (trust level cannot decrease autonomously), Condition 2 (capability class cannot change autonomously), Condition 3 (budget cannot be exceeded autonomously). Any condition failure triggers the Human Escalation Mechanism — a mandatory, logged human decision point.

RGP Stage 2 compliance_declarations support EU AI Act Article 13 transparency requirements and GDPR Article 25 data-protection-by-design: the agent can only assign a personal-data-handling task to a resource that has declared a compatible data protection framework.

### Agentic AI and coding assistants

> You are implementing a SOOS-governed AI agent that needs to discover and validate resources before assignment. Use the Resource Governance Protocol (RGP, draft-sato-soos-rgp-00).
>
> Before any resource assignment in an AEP session, the GEC must:
> 1. Query `GET /.well-known/soos-rgp` on each candidate resource endpoint (HTTPS only, parallel queries acceptable).
> 2. Parse the Stage 1 fingerprint (`application/soos-rgp-fingerprint+json`). Required fields: `resource_id` (URI), `capability_class` (one of CAP-COMP, CAP-STOR, CAP-NET, CAP-FAB, CAP-COMM, CAP-TXN, CAP-HUMAN, CAP-EXP), `trust_level` (TRUST-0 through TRUST-3), `availability_status` (AVAILABLE/AT_CAPACITY/UNAVAILABLE/MAINTENANCE), `valid_until` (ISO 8601).
> 3. For each resource passing `valid_until` check: screen against mandate constraints (capability class scope, minimum trust level, budget ceiling, compliance declarations).
> 4. For mandate-compatible resources: retrieve Stage 2 full declaration from `full_declaration_uri`. Verify attestation signature for TRUST-1 resources. Downgrade to TRUST-2 and emit ALE-027 if verification fails.
> 5. Construct Resource Map SO with all queried resources (mandate_compatible: true/false). GEC signs SO with KIA keys. Emit ALE-022.
> 6. At assignment: re-validate availability (re-query if stale), confirm within budget, record in Resource Map SO assignment_decisions.
> 7. On primary resource failure: apply three-condition test. If all pass → autonomous fallback (emit ALE-026, autonomous: true). If any fail → trigger HEM (HEM-HIGH-1 for trust fail, HEM-PRE-2 for class fail, HEM-DS-1 for budget fail). Never improvise fallback without EOD pre-declaration.
>
> Key invariant: the agent MUST NOT make a resource assignment without a valid, GEC-signed Resource Map SO entry for that resource. The Resource Map SO does not persist across AEP sessions.

### Government and regulators

RGP provides the machine-readable resource governance layer that operationalizes supply-side compliance requirements in AI agent deployments. For government operators deploying SOOS-governed multi-agent systems: every resource in the deployment — whether a digital service, a physical facility, or an AI model instance — can declare its compliance posture (applicable data protection framework, data residency, regulatory certifications) in a standardized governance envelope that is verified by the GEC before any agent assignment.

The trust level framework (TRUST-0 through TRUST-3) supports tiered assurance requirements: government-grade deployments may require TRUST-1 (independently attested) for transaction-class and human-coordination resources, while permitting TRUST-2 for lower-stakes discovery operations. The CAP profile governs these rules programmatically, not through manual review.

The three-condition fallback test provides a clear legal basis for determining when autonomous agent action is permissible versus when human oversight is required: trust level, capability class, and budget constraints are all mandatory checkpoints, not optional guidelines.

Jurisdictions interested in encoding sector-specific resource attestation requirements (e.g., healthcare facility capacity, financial transaction resource certification) into TRUST-1 attestation authority requirements are invited to engage via the SOOS Project.

---

## Core technology

**Problem:** Governed AI agents need to know what resources can do, at what trust level they have been verified, and whether they are currently available — before any assignment is made — but no existing standard provides a governance envelope for this purpose.

**Mechanism:** RGP defines a two-stage discovery protocol: Stage 1 delivers a lightweight capability fingerprint via a well-known URI; Stage 2 delivers a full governance envelope that the GEC validates against the active mandate before constructing a session-scoped Resource Map Sovereign Object.

**Output:** A KIA-signed Resource Map Sovereign Object recording all discovered resources, their governance state, mandate compatibility, and assignment decisions — committed to the GAR audit log at session start and close.

**Who verifies it:** The GEC validates every resource assignment against the Resource Map SO before permitting the assignment; regulators and auditors inspect the Resource Map SO and its associated ALEs (ALE-022 through ALE-029) to reconstruct the agent's complete resource landscape at any point in a session.

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

## Use cases

**Activity travel supplier discovery — booking agent**
A SOOS-governed booking agent holds a Mandate JWT authorizing CAP-EXP assignments within a defined budget. Before constructing an itinerary, it queries Stage 1 fingerprints from registered ATP suppliers including Ponyhouse Farm (TRUST-1, attested by the ATP supplier registry). The GEC constructs a Resource Map SO with only mandate-compatible, currently-available suppliers. The booking workflow is only initiated against resources in the Resource Map SO — never against unvalidated endpoint claims.

**Emergency capacity coordination — government deployment**
A government emergency management agency's multi-agent system discovers available shelter capacity across municipal facilities during a declared emergency. Each facility exposes an RGP Stage 1 fingerprint with current `availability_status`. The master agent's Resource Map SO reflects live capacity state. When a facility reaches capacity mid-session, the three-condition test determines whether the agent may reroute autonomously or must escalate to a human operator — with every decision recorded in GAR.

**Enterprise supplier compliance — procurement agent**
A procurement agent queries API suppliers (CAP-NET) before initiating a sourcing workflow. Suppliers at TRUST-3 are excluded from active assignment candidates by the deployment's CAP profile. Suppliers at TRUST-2 are permitted for discovery but not transaction initiation. The Resource Map SO records the compliance basis for every assignment decision — satisfying audit requirements without manual review of system logs.

---

## How this builds on existing work

**KIA (draft-sato-soos-kia-03)** KIA provides the signing key material used by the GEC to sign the Resource Map Sovereign Object at construction. RGP depends on KIA for all signature operations including attestation verification for TRUST-2 self-signed declarations.

**MJWT (draft-sato-soos-mjwt-02)** The Resource Envelope in the Mandate JWT defines three constraints that bound Resource Map SO construction: capability class scope, minimum trust level (via CAP profile), and budget ceiling. RGP cannot construct a valid Resource Map SO without an active MJWT.

**AEP (draft-sato-soos-aep-02)** RGP discovery is a pre-PLAN step in the AEP session loop. The Resource Map SO is constructed at AEP session open and closed at session close. The fallback pre-declaration requirement ties directly to AEP's Expected Outcome Declaration (EOD): fallback candidates must be named in the EOD before session start.

---

## Related work

**ACD (draft-sato-soos-acd-00)** ACD and RGP are complementary, not overlapping. ACD discloses the agent's compliance posture to a resource provider (the agent presents its credentials). RGP discloses the resource's capability and governance state to the agent (the resource presents its credentials). Both protocols may be exercised in sequence at the start of a governed interaction. Neither is a prerequisite for the other.

**Existing digital twin standards (AAS, WoT, OPC UA, DTDL)** These standards provide rich capability descriptions but no governance envelope. RGP-Physical (Section 12) is a governance overlay for each — resources using these standards can satisfy RGP Stage 2 requirements via the relevant binding profile without modifying their existing digital twin implementation.

RGP is the first specification to combine capability class declaration, trust level attestation, mandate-scope validation, and session-scoped assignment tracking with a normative fallback boundary rule for governed AI agent resource discovery.

---

## Security

**Key security properties:**
- Stage 1 fingerprints for TRUST-1 resources carry attestation authority signatures verified by the GEC before any Resource Map SO entry is created.
- The Resource Map SO is KIA-signed at construction; the GEC re-verifies the signature before every assignment operation.
- Fallback candidates must be pre-declared in the AEP Expected Outcome Declaration; runtime fallback improvisation is prohibited.
- Attestation downgrade (ALE-027) is recorded whenever signature verification fails, creating an auditable record of trust level changes.

**Fallback boundary bypass:** The coordinated attack (primary resource spoofed as unavailable + malicious fallback pre-positioned) is mitigated by requiring EOD pre-declaration of fallback candidates, fresh Stage 1 re-query at activation, and mandatory three-condition re-evaluation against the current MJWT. Runtime fallback resources not in the EOD cannot be autonomously activated.

**Formal analysis status:** The three-condition fallback test (DEC-RGP-08) has been reviewed in architectural working sessions (DR-RGP-02). Formal verification of the condition logic is not yet performed. Post-Vienna work.

---

## SOOS stack context

RGP sits at Level 2 — the Session Layer — alongside IDP. It depends on: KIA (Level 0), SOV (Level 1), MJWT (Level 2, mandate authority), AEP (session lifecycle), CAP (CAP profile for trust-level rules), GAR (ALE recording), HEM (fallback escalation). It is consumed by: GRP (adopts DEC-RGP-08 as FALLBACK boundary rule). RGP precedes IDP in the execution sequence: mandate-compatible resource confirmation must occur before intent declaration.

Related drafts: [AEP](/drafts/aep) · [IDP](/drafts/idp) · [GRP](/drafts/grp) · [HEM](/drafts/hem) · [GAR](/drafts/gar) · [ACD](/drafts/acd)

---

## Contribute

- [File an issue on GitHub](https://github.com/soos-project/soos-spec/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-rgp/)
- [SOOS Project](https://soosproject.ai)
- Contact: tom@myauberge.jp
