# Agent Orchestration Protocol (AOP)

Layer 7 — Mission Orchestration
**draft-sato-soos-aop-02**
[IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aop/) · [SOOS Stack](/stack)

---

## The problem

Existing AI agent frameworks can spawn sub-agents. None of them govern the spawn. There is no pre-commitment to what the sub-agent is supposed to achieve, no kernel-enforced scope narrowing at delegation time, no auditable record of who authorized what at each tier of a multi-agent hierarchy. When a multi-agent mission fails — or succeeds in ways nobody intended — there is no governance record that lets an investigator reconstruct what was planned, what was authorized, and where the two diverged.

The design premise: an orchestrated AI system that cannot be audited at the mission level is not governed. AOP makes mission-level governance as normative as per-action governance.

---

## What's new since -00

**The document body is now complete.** -00 shipped with placeholders across the Expected Outcome Declaration, Mission Plan SO, Mission Status SO, Assignment Primitive, Re-planning Authority, AOP-to-GAR Integration, Five-Phase Planning Intelligence Model, and Reference Scenario sections — and those placeholders disagreed with each other on a basic question: does Sub-Goal EOD endorsement happen before or after SACR issuance? -01 resolved this normatively: **after** — Sub-Goal EOD endorsement is gated on SACR existence, since the SACR is what establishes the sub-agent's scope in the first place, and an EOD can't meaningfully commit to an outcome for a sub-agent whose bounds aren't yet fixed.

**A new Denial of Service section (§15.6), because -00 and -01 didn't have one.** RFC 3552 and BCP 72 require it explicitly. AOP has three volumetric attack surfaces that are each individually spec-conformant and still capable of resource exhaustion through repetition or breadth alone: an orchestrating agent can declare an arbitrarily large single-level Sub-Goal DAG with no documented node-count ceiling; a sub-goal that flaps between AT_RISK and not-AT_RISK can force unbounded re-planning evaluation cycles; and a compromised orchestrator can flood `gec.spawnSubAgent()` calls that are each individually within its `max_spawn_depth` bound. None of these is normatively capped in this revision — implementations SHOULD apply deployment-specific rate limits until normative limits are specified.

**A document-structure ordering defect fixed.** -00's Open Issues section was mis-sequenced — it appeared after IANA Considerations instead of before Security Considerations, which meant a reader following the document in order would hit "open issues" after the normative content that resolved some of them.

**Reference-list gaps closed.** Two normatively cited documents (KIA, CAP-RRS) were cited throughout the body but never actually defined in the reference list. Ten companion-draft citations in the Related Work discussion used one-off versioned reference keys that matched no defined entry anywhere in the document.

**Mission Plan SO / Mission Status SO ownership confirmed as AOP's.** These two subtypes are defined normatively here, not by SOV — SOV's own -03 revision removed an earlier duplicate definition once this document's ownership was confirmed. If you're looking for the DAG dependency-type vocabulary (SEQUENTIAL, PARALLEL, CONDITIONAL) or the AT_RISK live-state model, this is the normative source.

---

## Messages to key audiences

### IETF Working Groups

AOP is the highest-layer normative protocol in the SOOS stack. It integrates MAD (Sub-Agent Composition Record / SACR, hub-only constraint, revocation), AEP (per-agent session governance), IDP (Expected Outcome Declaration intake_endorsement and PD-EOD path), GAR (mission lifecycle ALE types ALE-042 through ALE-055), and HEM (re-planning escalation). AOP defines fourteen new ALE types and three new media type registrations (Mission Plan SO, Assignment Primitive, AOP Cedar actions).

AOP takes a deliberately narrow position relative to adjacent multi-agent orchestration and delegation-chain work. On delegation-chain authority specifically, AOP doesn't re-argue its position relative to drafts like ztip, pedigree, or oauth-chain-delegation — that analysis belongs to MAD's own Related Work section (every AOP spawn goes through the same `gec.spawnSubAgent()` MAD governs) and applies here by reference. On DAG-based orchestration generally, AOP doesn't claim DAG task decomposition itself as novel — that's common practice. Its contribution is the governance layer around it: re-planning authority is a declared, mandate-bound property fixed in the SACR *before* a sub-agent is ever spawned, not an adaptive routing decision made at runtime.

The primary WG engagement targets are WIMSE (workload identity for SACR-issued ephemeral credentials) and SCITT (mission Session Block as a transparent governance artifact). The three-tier orchestration model and CONDITIONAL dependency type with HEM_RESOLVED condition are novel contributions not addressed by existing agent orchestration frameworks.

### App builders

AOP changes how you build multi-agent systems. Without AOP, sub-agent spawning is an application-layer operation: you call a framework API, get a sub-agent, and hope the scoping is right. With AOP, every spawn goes through the GEC: the GEC issues a SACR (scope-narrowing enforced at kernel level), the GEC endorses the Sub-Goal EOD *after* that SACR exists (never before), and the GEC records ALE-043 and ALE-044 before the sub-agent's first action.

What you build: a Mission Plan SO constructor (the DAG of sub-goals with SEQUENTIAL, PARALLEL, and CONDITIONAL edges); an EOD submission flow for mission-level and sub-goal-level commitments, sequenced correctly relative to SACR issuance; a Mission Status SO monitor that handles AT_RISK signals and feeds your re-planning logic; and an Assignment Primitive receiver on the sub-agent side.

**If you're deploying this in production, budget your own rate limits.** AOP doesn't yet specify normative caps on Sub-Goal DAG size, re-planning evaluation frequency, or spawn call rate — §15.6 names all three as open volumetric risks. Until a future revision adds normative limits, set your own: a maximum DAG node count per Mission Plan SO, a minimum interval between re-planning evaluations for the same plan, and a maximum spawn rate per orchestrating session.

The five-phase planning intelligence model (§12) is the integration point for surfacing RETRY_PATTERN_LIBRARY data to your orchestrator. The `replan_authority` field in each SACR is the single configuration value that determines how much autonomy each tier of your hierarchy has.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/aop)

### Regulators and policy teams

When a multi-agent AI system takes a consequential action — re-routing evacuees, committing procurement budget, changing a medical workflow — the question regulators need to answer is: who authorized this, under what constraints, and what was the audit record? AOP provides the governance structure that makes that question answerable. The Mission Plan SO is the pre-declared plan. The Mission Status SO is the execution record. The GAR mission lifecycle record (ALE-042 through ALE-055) is the audit artifact. Every re-planning decision is recorded with the authority basis that permitted it: BOUNDED (pre-authorized in the EOD), or ESCALATED (HEM resolution by a human).

The EU AI Act Article 22 obligation for traceability in automated decision chains is satisfied by the AOP Session Block: a single Merkle-signed artifact that an auditor can verify covers the complete mission lifecycle without gaps. Emerging AI governance frameworks in multiple jurisdictions identify multi-agent traceability as a priority requirement; AOP is designed to satisfy it. Disaster management regulatory frameworks in multiple jurisdictions require complete, auditable records of automated decision-making in emergency response systems — the MISSION_OPEN through MISSION_CLOSE lifecycle record is designed to satisfy this directly.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I am implementing the Agent Orchestration Protocol (AOP) from draft-sato-soos-aop-02. AOP governs multi-agent mission decomposition in a SOOS-governed system. The key constructs are: (1) Mission Plan SO — a Sovereign Object encoding a sub-goal DAG with SEQUENTIAL, PARALLEL, and CONDITIONAL dependency types, defined normatively by AOP (not SOV); (2) Mission Status SO — live execution state maintained exclusively by the GEC; (3) Assignment Primitive — the governed handoff from orchestrator to sub-agent, requiring an Endorsed Sub-Goal EOD and a committed SACR. Every sub-agent spawn goes through gec.spawnSubAgent() which issues a SACR per the MAD draft's Section 4. CRITICAL ORDERING: Sub-Goal EOD endorsement MUST happen AFTER SACR issuance, gated on SACR existence — never before, since the SACR establishes the scope the EOD commits against. Endorsement goes through IDP intake_endorsement. Re-planning authority is declared in the SACR as NONE | BOUNDED | AUTONOMOUS. AT_RISK detection fires on five conditions (deadline exceeded, STALLED, AGENT_DECLARED, CASCADE, RESOURCE_EXHAUSTION) and emits ALE-048 with optional RETRY_PATTERN_LIBRARY suggestions — but a self-declared AGENT_SELF_DECLARED risk claim authorizes nothing by itself; it only triggers an evaluation that still requires Cedar PERMIT to produce any state change. Mission lifecycle audit events are ALE-042 (MISSION_OPEN) through ALE-055 (MISSION_CLOSE). No normative rate limits exist yet for Sub-Goal DAG size, re-planning evaluation frequency, or spawn call rate — apply your own deployment-specific limits. Help me implement the Mission Plan SO constructor and the Assignment Primitive issuance flow, sequenced correctly relative to SACR issuance."

**Key schema fields:**

| Field | Type | Where | Description |
|---|---|---|---|
| `mission_plan_id` | string (UUID v7) | Mission Plan SO | GEC-assigned at MISSION_OPEN |
| `nodes` | object[] | Mission Plan SO | Sub-goal nodes; each has `state`, `sacr_id`, `endorsed_eod_id` |
| `edges` | object[] | Mission Plan SO | DAG edges; `dependency_type`: SEQUENTIAL \| PARALLEL \| CONDITIONAL |
| `replan_authority` | string | SACR / Sub-goal node | NONE \| BOUNDED \| AUTONOMOUS |
| `mission_context` | object | Sub-Goal EOD | `mission_plan_so_id` + `sub_goal_id` + `parent_endorsed_eod_id` — REQUIRED on every Sub-Goal EOD |
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

AOP provides the protocol layer that makes AI-governed operations legible to oversight bodies. In a deployment context where AI agents coordinate across agencies or jurisdictions, the Mission Plan SO is the pre-declared plan that supervisory authorities can review before mission execution. The re-planning authority model (NONE / BOUNDED / AUTONOMOUS) gives deployers a precise vocabulary for declaring to regulators which decisions the AI may make autonomously and which require human authorization.

The E-EOD path requires explicit acknowledgment by the Mission Principal before the GEC issues intake_endorsement — this is the machine-readable equivalent of a duty officer signing an operations order. The GAR mission Session Block provides the post-mission audit record required by emergency management recordkeeping frameworks and AI accountability mandates.

Organizations deploying SOOS-governed multi-agent systems and interested in the AOP governance model are invited to contact the author via [soosproject.ai](https://soosproject.ai) to discuss conformance profiles and jurisdiction-specific deployment considerations.

---

## Core technology

**Problem:** Multi-agent AI systems delegate tasks across sub-agents with no kernel-enforced scope narrowing, no pre-commitment record, and no auditable mission lifecycle.

**Mechanism:** AOP governs mission decomposition through three kernel-enforced constructs: a Mission Plan SO (the pre-declared sub-goal DAG), an Assignment Primitive (the SACR-backed governed handoff, with EOD endorsement strictly sequenced after SACR issuance), and a Mission Status SO (the GEC-maintained live execution record).

**Output:** A complete, Merkle-signed GAR Session Block covering the full mission lifecycle — from MISSION_OPEN (ALE-042) to MISSION_CLOSE (ALE-055) — with every spawn, assignment, re-plan, and AT_RISK event recorded with its authority basis.

**Who verifies it:** Audit Principals (regulators, compliance teams, incident investigators) who use the Session Block to verify that every sub-agent operated within its authorized scope and every deviation was pre-authorized or escalated to a human.

---

## The orchestration governance model

| Construct | What it governs | Authority |
|---|---|---|
| Mission-Level EOD | The full mission outcome pre-commitment | Mission Principal (E-EOD) or GEC derivation (PD-EOD) |
| Mission Plan SO | The sub-goal DAG structure | GEC creates; orchestrator proposes |
| SACR | Each sub-agent spawn | GEC enforces scope narrowing |
| Sub-Goal EOD | Each sub-goal outcome pre-commitment | Endorsed by GEC — strictly *after* the sub-goal's SACR exists |
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

A self-declared AT_RISK claim (`AGENT_SELF_DECLARED`) never bypasses this table on its own — even from a sub-agent, it only triggers a re-planning *evaluation*. The evaluation still needs a Cedar PERMIT to produce a BOUNDED activation, an AUTONOMOUS change, or an escalation; absent that, the mission stays AT_RISK with no action taken.

---

## Use cases

**Emergency management response — three-tier orchestration**

A regional incident commander activates a governed AI response system after a major earthquake. The Master AI receives a MissionDeclaration and submits an E-EOD (explicit, signed by the incident commander) covering three district evacuation sub-goals. The GEC endorses the EOD, creates the Mission Plan SO with PARALLEL routing sub-goals and SEQUENTIAL shelter sub-goals, and issues SACRs for three Local AI agents — with each Local AI's own Sub-Goal EOD endorsed only after its SACR is committed. When District 2's road data becomes unavailable, the Simulation AI signals AT_RISK. The District 2 Local AI's BOUNDED re-plan activates the pre-declared static routing Plan B (SPO hash verified by GEC). ALE-052 records the re-plan. At mission close, the Session Block covers 22 ALE events — every spawn, every sub-goal outcome, and the one re-plan decision — in a single Merkle-signed artifact.

**Travel booking orchestration — MyAuberge ATP reference implementation**

A guest submits a natural-language booking request to the MyAuberge ATP booking agent. The agent constructs a PD-EOD (derived from the prompt, `derived: true`) scoped to SO Type ATP_TRAVEL_ITINERARY. The GEC endorses the PD-EOD and creates a Mission Plan SO: three PARALLEL sub-goals (accommodation, activities, dining) and one CONDITIONAL sub-goal (transport, gated on accommodation GOAL_ACHIEVED). SACRs are issued for Ponyhouse Farm availability, regional dining, and accommodation sub-agents. The transport sub-agent Assignment is held by the CONDITIONAL gate until accommodation closes. This is the ATP reference implementation of AOP: three-party governed orchestration across supplier, orchestrator, and guest mandate.

**Enterprise procurement — mandatory human checkpoint**

A procurement orchestration agent is authorized to collect quotes across three suppliers in parallel and issue a purchase order. The Mission Plan SO encodes a CONDITIONAL dependency with condition_type HEM_RESOLVED on the selection sub-goal: if any quote exceeds the approval threshold, Cedar DENYs autonomous selection and REPLAN_ESCALATED fires, surfacing the decision to the finance officer via HEM. The finance officer's HEM resolution (NEW_EOD or CONTINUE) is recorded as ALE-054. No selection happens without either pre-authorized Cedar PERMIT or explicit human resolution — and either path is auditable.

**A false risk claim that goes nowhere**

A compromised sub-agent with `replan_authority: NONE` — the least-trusted tier — submits a `GOAL_AT_RISK_DECLARED` claim for a sub-goal that isn't actually at risk, hoping to force its parent into an unnecessary re-planning cycle or mask an unrelated problem. The GEC records the claim (it's the one AT_RISK trigger that isn't independently verifiable) and runs the evaluation Section 10 requires for every consequential outcome. No Cedar PERMIT exists for this fabricated condition, so nothing executes: the mission stays AT_RISK with `evaluation_outcome: NO_ACTION_REQUIRED`. The false claim cost evaluation cycles and left an unverified claim in GAR, but produced no state change — a residual risk the specification names explicitly rather than claims to fully close.

---

## How this builds on existing work

**MAD (draft-sato-soos-mad)** provides the Sub-Agent Composition Record (SACR) as the kernel-governed spawn record. AOP uses MAD Section 4 (SACR schema and 7-step issuance procedure) for every Assignment Primitive. The hub-only constraint (MAD Section 5) governs all inter-agent communication within an AOP mission. AOP does not re-argue delegation-chain-authority questions relative to drafts like ztip or pedigree — that analysis is MAD's, and applies to every AOP spawn by reference.

**IDP (draft-sato-soos-idp)** provides the intake_endorsement operation (Section 4.6) and the PD-EOD path (Section 4.7) that AOP uses for both Mission-Level and Sub-Goal EODs. AOP's own contribution is not new EOD content — it's binding an Endorsed EOD to Mission Plan SO structure, and, for Sub-Goal EODs specifically, resolving the sequencing question relative to SACR issuance (after, not before).

**GAR (draft-sato-soos-gar)** provides the audit record infrastructure and Session Block mechanism that AOP's mission lifecycle relies on. AOP defines fourteen new ALE types (ALE-042 through ALE-055) registered with GAR. The Session Block at mission close is the Merkle-signed artifact that makes AOP missions independently auditable.

**SOV (draft-sato-soos-sov)** defines the Standing Plan Object (SPO) that AOP's BOUNDED re-planning references as a pre-authorized Plan B. Mission Plan SO and Mission Status SO are AOP subtypes, not SOV subtypes — SOV-03 removed its own earlier duplicate definition of both once AOP's ownership was confirmed.

**RGP (draft-sato-soos-rgp, informative)** feeds Assignment Primitive construction via resource discovery. AOP consumes RGP's output but does not depend on it normatively.

AOP takes a narrow, explicit position on adjacent orchestration work: DAG-based multi-agent task decomposition (as in agent-gw's semantic routing, or industry Planner/Executor/Replanner architectures) is common, well-understood practice, and AOP doesn't claim novelty there. Its contribution is making re-planning authority a declared, mandate-bound, pre-spawn property rather than an adaptive runtime routing decision, and making AT_RISK an audited state tied to named trigger conditions rather than a reliability signal feeding a routing policy.

---

## Security

**Key security properties:** Every sub-agent spawn is kernel-witnessed and scope-narrowing enforced (GEC rejects any spawn request where scope_constraints exceed the parent's SACR). The Mission Status SO is GEC-exclusive (Cedar DENY on Action::WriteMissionStatus for all agents). Every Assignment Primitive must reference a committed SACR (CONF-AOP-AUDIT-01). SPO integrity is hash-locked at intake_endorsement and re-verified at Plan B activation (CONF-AOP-SEC-10). Sub-Goal EOD scope is verified against SACR scope_constraints before endorsement (CONF-AOP-SEC-07 through -09).

**Denial of Service (§15.6, new):** three volumetric attack surfaces are not yet normatively bounded — unbounded Sub-Goal DAG fan-out and size, unbounded AT_RISK-triggered re-planning loops, and depth-respecting spawn flooding (a compromised orchestrator issuing valid, individually-conformant `gec.spawnSubAgent()` calls faster than downstream MAD, KIA, or GAR capacity can absorb). Each respects every per-request bound this document defines and is still capable of resource exhaustion through repetition or breadth alone. Implementations SHOULD apply their own deployment-specific rate limits until normative limits exist.

**False self-declared risk claims (§15.5):** a compromised sub-agent's `AGENT_SELF_DECLARED` AT_RISK claim can trigger a re-planning evaluation but cannot itself force any state change — the same Cedar gate applies uniformly regardless of trigger source. The residual risk is volumetric, not authorizational: nothing yet bounds how many times the same sub-goal can emit this claim, which overlaps with the DoS concern above.

**Hub compromise blast radius:** A compromised orchestrating agent cannot issue Assignment Primitives outside the committed Mission Plan SO DAG (GEC rejects sub_goal_id references not in the committed plan). The blast radius of hub compromise is bounded by the Mission Plan SO scope and the GEC's scope-narrowing enforcement.

**Recursive spawn depth bypass:** The SACR's sacr_signature covers max_spawn_depth and can_decompose. A sub-agent cannot present a modified SACR without invalidating the GEC Ed25519 signature. The GEC enforces max_spawn_depth strictly at each spawn request.

**Formal analysis status:** No formal verification has been conducted. The CONF-AOP-SEC series (13 conformance requirements) and the CONF-AOP-GAR series define the normative security properties. Formal analysis of the SACR issuance and EOD endorsement flows remains planned.

---

## SOOS stack context

AOP sits at Layer 7 — Mission Orchestration, the highest layer in the SOOS governance stack. It depends on MAD, AEP, IDP, GAR, HEM, CAP, CAP-RRS, KEE-1, SOV, MJWT, and KIA, plus RGP informatively for resource discovery. No current SOOS draft depends on AOP — it is the highest layer. FAIP may in a future revision reference AOP for federated multi-agent mission governance.

Related drafts: [MAD](/drafts/mad) · [AEP](/drafts/aep) · [IDP](/drafts/idp) · [GAR](/drafts/gar) · [HEM](/drafts/hem) · [SOV](/drafts/sov) · [KEE-1](/drafts/kee) · [RGP](/drafts/rgp)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aop/)
- [Full SOOS stack](/stack)
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
