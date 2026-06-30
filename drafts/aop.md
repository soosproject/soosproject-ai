# Agent Orchestration Protocol (AOP)
Layer 7 — Mission Orchestration
**draft-sato-soos-aop-00**
[IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aop/) · [SOOS Stack](/stack)

---

## The problem

Existing AI agent frameworks can spawn sub-agents. None of them govern the spawn. There is no pre-commitment to what the sub-agent is supposed to achieve, no kernel-enforced scope narrowing at delegation time, no auditable record of who authorized what at each tier of a multi-agent hierarchy. When a multi-agent mission fails — or succeeds in ways nobody intended — there is no governance record that lets an investigator reconstruct what was planned, what was authorized, and where the two diverged.

The design premise: an orchestrated AI system that cannot be audited at the mission level is not governed. AOP makes mission-level governance as normative as per-action governance.

---

## Messages to key audiences

### IETF Working Groups

AOP is the highest-layer normative protocol in the SOOS stack. It integrates MAD (Sub-Agent Composition Record / SACR, hub-only constraint, revocation), AEP (per-agent session governance), IDP (Expected Outcome Declaration intake_endorsement and PD-EOD path), GAR (mission lifecycle ALE types ALE-042 through ALE-055), and HEM (re-planning escalation). AOP defines fourteen new ALE types and three new media type registrations (Mission Plan SO, Assignment Primitive, AOP Cedar actions). The primary WG engagement targets are WIMSE (workload identity for SACR-issued ephemeral credentials) and SCITT (mission Session Block as a transparent governance artifact). Open issue OQ-AOP-01 (Cedar action namespace coordination with CAP-RRS) is flagged for pre-Vienna resolution. The three-tier orchestration model and CONDITIONAL dependency type with HEM_RESOLVED condition are novel contributions not addressed by existing agent orchestration frameworks.

### App builders

AOP changes how you build multi-agent systems. Without AOP, sub-agent spawning is an application-layer operation: you call a framework API, get a sub-agent, and hope the scoping is right. With AOP, every spawn goes through the GEC: the GEC issues a SACR (scope-narrowing enforced at kernel level), the GEC endorses the Sub-Goal EOD (pre-commitment enforced before execution), and the GEC records ALE-043 and ALE-044 before the sub-agent's first action. What you build: a Mission Plan SO constructor (the DAG of sub-goals with SEQUENTIAL, PARALLEL, and CONDITIONAL edges); an EOD submission flow for mission-level and sub-goal-level commitments; a Mission Status SO monitor that handles AT_RISK signals and feeds your re-planning logic; and an Assignment Primitive receiver on the sub-agent side. The five-phase planning intelligence model (Section 12) is the integration point for surfacing RETRY_PATTERN_LIBRARY data to your orchestrator. The `replan_authority` field in each SACR is the single configuration value that determines how much autonomy each tier of your hierarchy has.

### Regulators and policy teams

When a multi-agent AI system takes a consequential action — re-routing evacuees, committing procurement budget, changing a medical workflow — the question regulators need to answer is: who authorized this, under what constraints, and what was the audit record? AOP provides the governance structure that makes that question answerable. The Mission Plan SO is the pre-declared plan. The Mission Status SO is the execution record. The GAR mission lifecycle record (ALE-042 through ALE-055) is the audit artifact. Every re-planning decision is recorded with the authority basis that permitted it: BOUNDED (pre-authorized in the EOD), or ESCALATED (HEM resolution by a human). The EU AI Act Article 22 obligation for traceability in automated decision chains is satisfied by the AOP Session Block: a single Merkle-signed artifact that an auditor can verify covers the complete mission lifecycle without gaps. Emerging AI governance frameworks in multiple jurisdictions identify multi-agent traceability as a priority requirement; AOP is designed to satisfy it.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I am implementing the Agent Orchestration Protocol (AOP) from draft-sato-soos-aop-00. AOP governs multi-agent mission decomposition in a SOOS-governed system. The key constructs are: (1) Mission Plan SO — a Sovereign Object encoding a sub-goal DAG with SEQUENTIAL, PARALLEL, and CONDITIONAL dependency types; (2) Mission Status SO — live execution state maintained exclusively by the GEC; (3) Assignment Primitive — the governed handoff from orchestrator to sub-agent, requiring an Endorsed Sub-Goal EOD and a committed SACR. Every sub-agent spawn goes through gec.spawnSubAgent() which issues a SACR per draft-sato-soos-mad-03 Section 4. Sub-Goal EODs must be submitted after SACR issuance (CONF-AOP-EOD-08) and endorsed via IDP intake_endorsement (draft-sato-soos-idp-05 Section 4.6) before the Assignment Primitive is issued. Re-planning authority is declared in the SACR as NONE | BOUNDED | AUTONOMOUS. AT_RISK detection fires on five conditions (deadline exceeded, STALLED, AGENT_DECLARED, CASCADE, RESOURCE_EXHAUSTION) and emits ALE-048 with optional RETRY_PATTERN_LIBRARY suggestions. Mission lifecycle audit events are ALE-042 (MISSION_OPEN) through ALE-055 (MISSION_CLOSE). Help me implement the Mission Plan SO constructor and the Assignment Primitive issuance flow."

**Key schema fields:**

| Field | Type | Where | Description |
|---|---|---|---|
| `mission_plan_id` | string (UUID v7) | Mission Plan SO | GEC-assigned at MISSION_OPEN |
| `sub_goals` | array | Mission Plan SO | Sub-goal nodes; each has `state`, `sacr_id`, `endorsed_eod_id` |
| `edges` | array | Mission Plan SO | DAG edges; `dependency_type`: SEQUENTIAL \| PARALLEL \| CONDITIONAL |
| `replan_authority` | string | SACR / Sub-goal node | NONE \| BOUNDED \| AUTONOMOUS |
| `mission_context` | object | Sub-Goal EOD | `mission_plan_so_id` + `sub_goal_id` + `parent_endorsed_eod_id` |
| `assignment_id` | string (UUID v7) | Assignment Primitive | GEC-assigned; links SACR to Sub-Goal EOD |
| `hub_routing_id` | string | Assignment Primitive | GEC token for hub-only upward communication |
| `at_risk_reason` | string | ALE-048 | DEADLINE_EXCEEDED \| STALLED \| AGENT_DECLARED \| CASCADE \| RESOURCE_EXHAUSTION |

**Minimal Cedar example — DeclareMission action:**
```cedar
permit(
  principal is SoosAgent,
  action == Action::"DeclareMission",
  resource is MissionPlanSO
) when {
  principal.mandate_scope_type == "MISSION_ORCHESTRATOR" &&
  principal.mjwt_valid == true &&
  resource.so_type in principal.authorized_so_types
};
```

### Government and regulators

AOP provides the protocol layer that makes AI-governed operations legible to oversight bodies. In a deployment context where AI agents coordinate across agencies or jurisdictions, the Mission Plan SO is the pre-declared plan that supervisory authorities can review before mission execution. The re-planning authority model (NONE / BOUNDED / AUTONOMOUS) gives deployers a precise vocabulary for declaring to regulators which decisions the AI may make autonomously and which require human authorization. The E-EOD path requires explicit acknowledgment by the Mission Principal before the GEC issues intake_endorsement — this is the machine-readable equivalent of a duty officer signing an operations order. The GAR mission Session Block provides the post-mission audit record required by emergency management recordkeeping frameworks and AI accountability mandates. Organizations deploying SOOS-governed multi-agent systems and interested in the AOP governance model are invited to contact the author via [soosproject.ai](https://soosproject.ai) to discuss conformance profiles and jurisdiction-specific deployment considerations.

---

## Core technology

**Problem:** Multi-agent AI systems delegate tasks across sub-agents with no kernel-enforced scope narrowing, no pre-commitment record, and no auditable mission lifecycle.

**Mechanism:** AOP governs mission decomposition through three kernel-enforced constructs: a Mission Plan SO (the pre-declared sub-goal DAG), an Assignment Primitive (the SACR-backed governed handoff), and a Mission Status SO (the GEC-maintained live execution record).

**Output:** A complete, Merkle-signed GAR Session Block covering the full mission lifecycle — from MISSION_OPEN (ALE-042) to MISSION_CLOSE (ALE-055) — with every spawn, assignment, re-plan, and AT_RISK event recorded with its authority basis.

**Who verifies it:** Audit Principals (regulators, compliance teams, incident investigators) who use the Session Block to verify that every sub-agent operated within its authorized scope and every deviation was pre-authorized or escalated to a human.

---

## The orchestration governance model

| Construct | What it governs | Authority |
|---|---|---|
| Mission-Level EOD | The full mission outcome pre-commitment | Mission Principal (E-EOD) or GEC derivation (PD-EOD) |
| Mission Plan SO | The sub-goal DAG structure | GEC creates; orchestrator proposes |
| SACR | Each sub-agent spawn | GEC enforces scope narrowing |
| Sub-Goal EOD | Each sub-goal outcome pre-commitment | Endorsed by GEC after SACR |
| Assignment Primitive | The governed task handoff | GEC issues; sub-agent verifies signature |
| Mission Status SO | Live execution state | GEC exclusively; no agent write access |
| Re-planning authority | What the orchestrator may do autonomously | NONE \| BOUNDED \| AUTONOMOUS, declared in SACR |

The central property: every decision in a multi-agent mission — spawn, assign, re-plan, escalate — has a kernel-signed record with the authority basis that permitted it. No decision is invisible to the audit record.

---

## Re-planning authority levels

| Level | What is permitted | What requires HEM escalation |
|---|---|---|
| NONE | Execute as declared | Any deviation |
| BOUNDED | Pre-declared Plan B activation; agent substitution; timeline adjustment within declared bounds | New sub-goals; scope changes; primary outcome changes |
| AUTONOMOUS | Add sub-goals; change sub-goal scope; replan within mission EOD bounds | Primary outcome change; root mandate scope breach |

BOUNDED is the recommended default for production deployments. It gives orchestrators enough autonomy to handle predictable failure modes (via pre-declared Plan B in the EOD) while keeping consequential decisions in the human-escalation path.

---

## Use cases

**Emergency management response — three-tier orchestration**
A regional incident commander activates a governed AI response system after a major earthquake. The Master AI receives a MissionDeclaration and submits an E-EOD (explicit, signed by the incident commander) covering three district evacuation sub-goals. The GEC endorses the EOD, creates the Mission Plan SO with PARALLEL routing sub-goals and SEQUENTIAL shelter sub-goals, and issues SACRs for three Local AI agents. When District 2's road data becomes unavailable, the Simulation AI signals AT_RISK. The District 2 Local AI's BOUNDED re-plan activates the pre-declared static routing Plan B (SPO hash verified by GEC). ALE-052 records the re-plan. At mission close, the Session Block covers 22 ALE events — every spawn, every sub-goal outcome, and the one re-plan decision — in a single Merkle-signed artifact.

**Travel booking orchestration — MyAuberge ATP reference implementation**
A guest submits a natural-language booking request to the MyAuberge ATP booking agent. The agent constructs a PD-EOD (derived from the prompt, `derived: true`) scoped to SO Type ATP_TRAVEL_ITINERARY. The GEC endorses the PD-EOD and creates a Mission Plan SO: three PARALLEL sub-goals (accommodation, activities, dining) and one CONDITIONAL sub-goal (transport, gated on accommodation GOAL_ACHIEVED). SACRs are issued for Ponyhouse Farm availability, regional dining, and accommodation sub-agents. The transport sub-agent Assignment is held by the CONDITIONAL gate until accommodation closes. This is the ATP reference implementation of AOP: three-party governed orchestration across supplier, orchestrator, and guest mandate.

**Enterprise procurement — mandatory human checkpoint**
A procurement orchestration agent is authorized to collect quotes across three suppliers in parallel and issue a purchase order. The Mission Plan SO encodes a CONDITIONAL dependency with condition_type HEM_RESOLVED on the selection sub-goal: if any quote exceeds the approval threshold, Cedar DENYs autonomous selection and REPLAN_ESCALATED fires, surfacing the decision to the finance officer via HEM. The finance officer's HEM resolution (NEW_EOD or CONTINUE) is recorded as ALE-054. No selection happens without either pre-authorized Cedar PERMIT or explicit human resolution — and either path is auditable.

---

## How this builds on existing work

**MAD (draft-sato-soos-mad-03)** provides the Sub-Agent Composition Record (SACR) as the kernel-governed spawn record. AOP uses MAD Section 4 (SACR schema and 7-step issuance procedure) for every Assignment Primitive. The hub-only constraint (MAD Section 5) governs all inter-agent communication within an AOP mission. AOP adds the mission-level coordination structure above the per-spawn governance that MAD provides.

**IDP (draft-sato-soos-idp-05)** provides the intake_endorsement operation (Section 4.6) and the PD-EOD path (Section 4.7) that AOP uses for both Mission-Level and Sub-Goal EODs. The mandate_reference field (IDP Section 4.1) links each Sub-Goal EOD to the Mission Plan SO via the mission_context extension. AOP specifies when E-EOD vs PD-EOD is required (Section 6.3/6.4) in the multi-agent context.

**GAR (draft-sato-soos-gar-03)** provides the audit record infrastructure and Session Block mechanism that AOP's mission lifecycle relies on. AOP defines fourteen new ALE types (ALE-042 through ALE-055) registered with GAR. The Session Block at mission close (Section 11.2) is the Merkle-signed artifact that makes AOP missions independently auditable.

---

## Security

**Key security properties:** Every sub-agent spawn is kernel-witnessed and scope-narrowing enforced (GEC rejects any spawn request where scope_constraints exceed the parent's SACR). The Mission Status SO is GEC-exclusive (Cedar DENY on Action::WriteMissionStatus for all agents). Every Assignment Primitive must reference a committed SACR (CONF-AOP-AUDIT-01). SPO integrity is hash-locked at intake_endorsement and re-verified at Plan B activation (CONF-AOP-SEC-10). Sub-Goal EOD scope is verified against SACR scope_constraints before endorsement (CONF-AOP-SEC-07 through -09).

**Hub compromise blast radius:** A compromised orchestrating agent cannot issue Assignment Primitives outside the committed Mission Plan SO DAG (GEC rejects sub_goal_id references not in the committed plan). The blast radius of hub compromise is bounded by the Mission Plan SO scope and the GEC's scope-narrowing enforcement.

**Recursive spawn depth bypass:** The SACR's sacr_signature covers max_spawn_depth and can_decompose. A sub-agent cannot present a modified SACR without invalidating the GEC Ed25519 signature. The GEC enforces max_spawn_depth strictly at each spawn request.

**Formal analysis status:** AOP-00 has not undergone formal verification. The CONF-AOP-SEC series (12 conformance requirements) and the CONF-AOP-GAR series (3 audit completeness requirements) define the normative security properties. Formal analysis of the SACR issuance and EOD endorsement flows is planned post-Vienna.

---

## SOOS stack context

AOP sits at Layer 7 — Mission Orchestration, the highest layer in the SOOS governance stack. It depends on: MAD (draft-sato-soos-mad-03), AEP (draft-sato-soos-aep-02), IDP (draft-sato-soos-idp-05), GAR (draft-sato-soos-gar-03), HEM (draft-sato-soos-hem-05), CAP (draft-sato-soos-cap-04), CAP-RRS (draft-sato-soos-cap-rrs-02), KEE-1 (draft-sato-soos-kee-00), SOV (draft-sato-soos-sov-02), MJWT (draft-sato-soos-mjwt-02), KIA (draft-sato-soos-kia-03). It is consumed by: no current SOOS draft depends on AOP (it is the highest layer). FAIP (draft-sato-soos-faip-00) may reference AOP for federated multi-agent mission governance in a future revision.

Related drafts: [MAD](/drafts/mad) · [AEP](/drafts/aep) · [IDP](/drafts/idp) · [GAR](/drafts/gar) · [HEM](/drafts/hem) · [KEE-1](/drafts/kee)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aop/)
- [Full SOOS stack](/stack)
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
