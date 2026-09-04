# Agentic Execution Protocol

Layer 2 — Session Foundation
**draft-sato-soos-aep-03**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
See [SOOS Stack](/stack) implementation

---

## What's new in AEP-03

**Step 4a — DAM Lineage and Residency Validation.** Until this revision, the data governance companion specification (DAM) defined a narrowing rule for how a derived artifact's `data_residency` must be computed from its inputs — but AEP, the protocol that actually produces those artifacts, gave no mechanism to apply it. -03 closes that gap: when a Transition Request carries the new optional `da_production` field, the GEC resolves every referenced input artifact, confirms each is in a `VALID` lifecycle state, and computes the resulting artifact's `data_residency` under the narrowing rule — all of this *before* the transition's Event Stream write occurs, and committed under the same signature as that write.

This matters for the same structural reason validate-then-commit matters everywhere else in this suite: nothing is signed until the computation is known-correct. A reference to an artifact that isn't yet `VALID` is rejected outright (`DA_LINEAGE_NOT_VALID`) — because a non-VALID artifact's own residency isn't final yet, and narrowing against a value that could still change would just relocate the problem rather than solve it. An unresolvable reference is rejected as `DA_LINEAGE_UNRESOLVED`. Only once lineage is fully resolved does Step 5 commit the state transition and the artifact's governance metadata together, in one signed write — never as two separately-committed operations where the second could fail after the first already succeeded.

---

## The problem

Autonomous AI agents execute actions in the world. There is no standard for what a governed execution cycle looks like — what checks run before an action, what is recorded during it, and what must happen before the next action begins.

AEP defines the governed execution loop: the protocol that wraps every agent action with identity verification, policy evaluation, audit recording, and escalation detection — making each cycle reproducible, auditable, and safe to deploy at scale. As of -03, that includes actions that produce governed data artifacts, not just actions that transition object state.

**The design premise:** a governed execution loop is not a constraint on what agents can do. It is the precondition for deploying them where it counts.

---

## Messages to key audiences

### IETF Working Groups

AEP is the primary submission for the ACP (Agentic Computing Protocols) BoF at IETF 126 Vienna. It is the protocol that makes the SOOS governance stack operative — the loop that calls IDP, CAP, HEM, KIA, and GAR in the correct sequence on every execution cycle.

AEP profiles GNAP (RFC 9635) for initial grant establishment: GNAP handles the authorisation grant that initiates the governed session; AEP specifies the execution loop that runs within that session. The two compose without overlap.

**AEP-03 adds DAM as a normative dependency.** Step 4a is the concrete enforcement point for DAM's `data_residency` narrowing rule — AEP doesn't define the artifact schema, retention rules, or write-authority model (that's entirely DAM's), but it is now the specification that says *where and how* the rule actually gets computed rather than merely declared. This is directly relevant to any working group discussion of data lineage and provenance in multi-step agentic pipelines.

To engage on AEP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your agent's execution loop is ad hoc — a sequence of LLM calls and tool invocations with governance bolted on externally, if at all. When something goes wrong, you cannot reproduce the exact sequence of checks that ran (or didn't) on a given action.

AEP closes this gap by specifying the execution loop as a protocol. Each cycle: verify identity (with XPID binding), evaluate Cedar policy, check HEM trigger conditions, execute, record in GAR. The loop is reproducible. The record is auditable. Any deviation from the protocol is detectable.

**New in AEP-03 — if your agent's action produces a governed data artifact (an AGA), you now have a defined mechanism to declare it.** Add `da_production` to your Transition Request when the Cedar action is classified under `Action::ProduceAGA`: list the `da_id` values of every direct and contextual input the new artifact derives from. The GEC does the rest — resolving each reference, checking it's `VALID`, and computing the new artifact's residency classification for you. You don't compute the narrowing rule yourself and assert the result; you supply the lineage, and the GEC computes the governance metadata from already-governed data.

**Still true from -02 — EOD (Expected Outcome Declaration):** Before your agent starts, it commits to what it expects to achieve and what it will do if the primary path is blocked. This gives you the operational equivalent of a pre-flight checklist: if the session deviates from the EOD, the GAR record shows exactly where and why.

**Still true from -02 — STALLED state:** When your agent gets stuck — not because of a single DENY, but because no viable path to the goal exists — the STALLED state triggers a human notification and surfaces the stall reason and prior DENY chain.

**Still true from -02 — RETRY_CONTINUATION what_changed:** When your agent retries after a denial, it must declare what changed between the denied attempt and the retry. Generic retries that don't reference the denial's enrichment fields are rejected.

Without AEP: your agent's behaviour is correct until it isn't, and you find out after the fact. With AEP: every action is preceded by a verifiable governance cycle, every stall is surfaced to the human principal, every retry is substantiated, and every data artifact your agent produces carries governance metadata computed from data the kernel already trusts.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/aep)

### Platform engineers

AEP is the protocol for safe deployment of autonomous agents. The governed execution loop is the unit of deployment: each agent action is a cycle, each cycle is governed, each governance event is recorded.

**New in AEP-03 — lineage validation is atomic with the transition it belongs to.** Step 4a performs no write of its own; its failure aborts the transition entirely before any signed write occurs. When it succeeds, Step 5 commits the state transition and the AGA's Governance Envelope in the same signed write. If you're monitoring transition latency, expect Step 4a to add resolution-and-computation cost specifically on `da_production`-bearing requests — this is deliberate, since it's replacing what would otherwise be an unenforced, unaudited assumption.

**Still true from -02 — OTel mapping (Section 12):** The soos.aep.* span attributes give your monitoring pipeline direct visibility into the AEP loop without parsing Event Stream entries. The soos.aep.cp_hash binding between SENSE and ACT spans proves that every ACT was preceded by a valid SENSE.

**Still true from -02 — XPID at session open:** The GEC binds the agent's Cross-Principal Identifier at session initiation from the KIA-verified Party Registry. Client-supplied XPIDs are rejected.

The Context Package (AEP §7) is the primary operational instrument: `reasoning_mode`, `session_xpid`, `session_state`, `eod_id`, `resource_envelope`, `delegation_context`. These fields travel with every execution cycle and drive downstream governance decisions.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement the SOOS AEP-03 governed execution loop (draft-sato-soos-aep-03). The loop has five steps: SENSE, REASON, PLAN, ACT, OBSERVE. Before the first SENSE, my Class 3 agent must submit an EOD (Expected Outcome Declaration) declaring the primary expected SO state, an acceptance envelope, and a pre-declared Plan B. At session open, the GEC derives the XPID from the KIA Party Registry — do not supply XPID from the client side. Each ACT must carry eod_id. After any DENY, the next IDP must carry RETRY_CONTINUATION with a what_changed field referencing specific enrichment fields from the DENY response. If a Transition Request's cedar_action is classified under Action::ProduceAGA, the request MUST also carry da_production: an object with derived_from.direct_inputs and derived_from.context_inputs (arrays of da_id values, may be empty) and external_disclosure (disclosed_to_class: NONE | HUMAN_PRINCIPAL | EXTERNAL_THIRD_PARTY). The GEC resolves every direct_inputs and context_inputs reference, rejects with DA_LINEAGE_UNRESOLVED if any reference doesn't resolve, rejects with DA_LINEAGE_NOT_VALID if a direct_inputs artifact isn't yet in VALID lifecycle state, then computes the new artifact's data_residency as at least as restrictive as the most restrictive data_residency among direct_inputs (a null data_residency imposes no additional restriction). This computation happens before the Event Stream write and commits under the same signature as the state transition — one signed write, not two. If the agent accumulates N consecutive DENYs, the session enters STALLED state. Each AEP phase must emit an OTel span in the soos.aep.* namespace with the mandatory attributes from Section 12.2."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `session_xpid` | string | GEC-bound Cross-Principal Identifier. Derived from KIA at session open. |
| `session_state` | enum | ACTIVE / HEM_PENDING / STALLED / PLAN_B_ACTIVE / CLOSED |
| `eod_id` | string | UUID of committed Expected Outcome Declaration. |
| `da_production` | object \| null | NEW in -03. REQUIRED when cedar_action is Action::ProduceAGA; null or absent otherwise. |
| `da_production.derived_from.direct_inputs` | string[] | da_id values this AGA derives directly from (MAY be empty). |
| `da_production.derived_from.context_inputs` | string[] | da_id values consulted as context (MAY be empty). |
| `da_production.external_disclosure.disclosed_to_class` | enum | NONE / HUMAN_PRINCIPAL / EXTERNAL_THIRD_PARTY |
| `plan_b_ref` | string | Required in PLAN_B_ACTIVE state. References EOD plan_b_id. |
| `what_changed` | string | Required in RETRY_CONTINUATION. Must reference DENY enrichment fields. |
| `prior_denial_count` | integer | Cedar context attribute: total DENYs for this action in this session. |
| `gar_record_id` | string | Reference to the GAR entry for this cycle |

**Minimal `da_production` example — a Transition Request producing a derived artifact:**

```json
{
  "mandate_jwt": "<compact-serialized MJWT>",
  "cedar_action": "atp:booking:summarize_itinerary",
  "idp": { "...": "..." },
  "da_production": {
    "derived_from": {
      "direct_inputs": ["da-7f3a...booking", "da-91cc...weather"],
      "context_inputs": ["da-4b21...preferences"]
    },
    "external_disclosure": {
      "disclosed_to_class": "HUMAN_PRINCIPAL",
      "disclosed_at": "2026-09-04T10:15:00Z"
    }
  }
}
```

### Government and regulators

AEP is the protocol that makes "AI accountability" an engineering specification rather than a policy aspiration. Each governed execution cycle produces a verifiable record: what the agent intended, what policy evaluated it, what the result was, and when.

**New in AEP-03:** when an agent's action produces derived data — a summary, an aggregation, a synthesized recommendation — the lineage from that data back to its governed sources is now computed by the kernel, not merely claimed by the agent. A regulator investigating a decision based on derived data can trace exactly which upstream artifacts it came from, and confirm the residency classification that applied at the time was computed correctly from data already known to be valid — not asserted by the same agent whose output is under review.

**From -02, still current:** The Expected Outcome Declaration (EOD) creates a pre-session commitment record; a regulator reviewing a session can compare its actual trajectory against pre-declared expectations. The XPID binding requirement makes the accountability chain from action to agent provider verifiable and non-repudiable.

Relevant regulatory alignment: EU AI Act Article 12 (record-keeping for high-risk AI), EU AI Act Article 9 (technical risk management), NIST AI RMF (MEASURE 2.5).

For collaboration on jurisdiction-specific execution governance requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Agentic AI systems execute sequences of actions with no standard for what governance checks run between them — and, until -03, no defined mechanism for how a governed action that produces new data actually gets that data's governance metadata computed correctly rather than merely asserted.

**Mechanism:** AEP defines the execution cycle as a protocol. At session open, the GEC binds the agent's XPID from the KIA Party Registry and records the submitted EOD. Each cycle runs a fixed sequence: IDP validation → CAP Tier 0-A pre-check → XPID consistency check → full Cedar policy evaluation → state machine validation → **DAM lineage and residency validation, when applicable** → action execution → GAR record. The sequence is normative; skipping any step produces a non-conforming implementation.

**Output:** A GAR record for every cycle — governance decision, Cedar result, HEM evaluation outcome, XPID binding, EOD outcome, and, for data-producing actions, the resolved lineage and computed residency of the resulting artifact — that proves the governed loop ran correctly on every action.

**Who verifies it:** Platform engineers auditing agent deployments, compliance teams demonstrating Article 12 record-keeping, security operations teams monitoring soos.aep.* OTel spans, data governance teams tracing artifact lineage, and regulators requiring pre-session commitment accountability.

---

## The five session states

A session is always in one of five states:

**ACTIVE** — the normal execution state. The agent runs the SENSE-REASON-PLAN-ACT-OBSERVE loop. The GEC accepts Transition Requests.

**HEM_PENDING** — the session has escalated to a human principal for a decision on a specific action. The agent cannot submit ACT until the human principal responds.

**STALLED** — the agent cannot make progress without human direction. No single action triggered HEM; the session as a whole has hit a progress boundary. Stall reasons: STALL_DENY_THRESHOLD, STALL_PATH_EXHAUSTED, STALL_PLAN_B_BLOCKED, STALL_ITERATION_LIMIT.

**PLAN_B_ACTIVE** — the pre-declared EOD Plan B has been activated. Every IDP must carry plan_b_ref. The session closes with PLAN_B_ACHIEVED if the Plan B target is reached.

**CLOSED** — the session has terminated on any path. AEP_SESSION_CLOSED is written; the GAR generates a Session Audit Record.

---

## DAM Lineage and Residency Validation (Step 4a)

| Stage | What happens |
|---|---|
| Trigger | `da_production` present on the Transition Request (required when cedar_action is Action::ProduceAGA) |
| Resolve | Every da_id in `direct_inputs` and `context_inputs` resolved against existing artifacts |
| Reject — unresolvable | Any reference that doesn't resolve → DENY, `DA_LINEAGE_UNRESOLVED` |
| Validate lifecycle | Every `direct_inputs` artifact confirmed in `VALID` lifecycle state |
| Reject — not valid | A direct_inputs artifact not yet VALID → DENY, `DA_LINEAGE_NOT_VALID` (its own residency isn't final yet) |
| Compute | New artifact's `data_residency` = at least as restrictive as the most restrictive among `direct_inputs` (null imposes no restriction) |
| Commit (Step 5) | State transition + AGA Governance Envelope committed together, one signed write |

Step 4a performs no write of its own — its failure aborts the transition before any signed write for it has occurred. This is the enforcement point for DAM's narrowing rule: not a declaration the agent's `da_production` makes true by asserting it, but a computation the GEC performs from already-governed, already-VALID data.

---

## The Expected Outcome Declaration (EOD)

The EOD is the pre-session commitment structure AEP introduced in -02, unchanged in -03. Before the first SENSE delivery, the agent submits an EOD declaring:

- **Primary outcome** — the target SO state the agent expects to reach, with a confidence score.
- **Acceptance envelope** — the conditions that constitute success.
- **Plan B** — the fallback target state and the conditions under which Plan B may activate, pre-committed before the session starts.

The EOD is immutable after submission. The GEC records it as EOD_COMMITTED and carries eod_id in every AEP_SENSE_DELIVERED entry for the life of the session. At session close, the GEC evaluates the session's final state against the EOD's acceptance_envelope and records EOD_OUTCOME (MATCHED, PARTIAL, PLAN_B_MATCHED, UNMATCHED) in AEP_SESSION_CLOSED.

---

## Use cases

**A summarization action with governed lineage**

A travel-planning agent's action produces a trip summary derived from a booking confirmation and a weather forecast, consulting the traveler's stated preferences as context. The Transition Request carries `da_production` with `direct_inputs: [booking_da_id, weather_da_id]` and `context_inputs: [preferences_da_id]`. The GEC resolves all three, confirms the booking and weather artifacts are VALID, and computes the summary's data_residency as at least as restrictive as whichever of the two direct inputs carries the tighter classification. The summary artifact and the state transition that produced it commit together, in one signed write. A later audit can trace the summary back through its declared lineage to the exact governed artifacts it was built from.

**Safe deployment of a financial reconciliation agent**

A bank deploys an agent to reconcile daily transactions. Before the first SENSE delivery, the agent submits an EOD declaring its expected outcome and Plan B. AEP's XPID binding ensures the reconciliation agent's Party Registry entry is verified at session open. When the agent encounters an anomalous transaction that exhausts its retry capacity, the STALLED state fires before budget exhaustion, the human principal receives the stall notification, and activates Plan B. The EOD_OUTCOME at session close records PLAN_B_MATCHED.

**Multi-agent deployment with XPID verification**

Three agents from different providers are executing in a cluster on a shared SO Cluster. XPID binding at session open ties each agent to its KIA-verified Party Registry entry. At Step 1a of the GEC execution sequence, every ACT is checked for XPID consistency — a mismatch terminates the session immediately.

---

## How this builds on existing work

**GNAP (RFC 9635)** handles the authorisation grant that establishes a governed session. AEP specifies what happens inside that session. GNAP is the door; AEP is the governed corridor behind it.

**Cedar (Amazon open source)** is the policy engine that AEP's XPID consistency check and full policy evaluation call. `prior_denial_count` and `last_deny_code` are Cedar context attributes, enabling policies to gate on retry depth.

**DAM (draft-sato-soos-dam), new dependency in -03** defines the AGA schema, retention rules, and write-authority model that Step 4a enforces. AEP doesn't own any of that — its contribution is the submission mechanism (`da_production`) and the enforcement point at which DAM's data_residency narrowing rule is actually computed rather than merely declared.

**OpenTelemetry (OTel)** is the operational observability layer. The soos.aep.* namespace is a sub-namespace of the soos.governance.* namespace defined in GAR.

---

## Security

**Key security properties:** The AEP execution loop is non-bypassable at the protocol level. A conforming implementation cannot execute an action without first running the CAP Tier 0-A pre-check, evaluating HEM trigger conditions, and passing the XPID consistency check. Every cycle produces a GAR record before the result is returned.

**Lineage validation is atomic with the write it governs (new in -03):** no da_id is minted and no signature is produced during Step 4a validation — a request that fails lineage or residency checks leaves no trace beyond the rejection itself. This closes the same class of gap the suite has fixed elsewhere: minting governance metadata before knowing whether the underlying computation is valid would mean an already-signed artifact might need to be undone, which this suite's tamper-evidence model does not support.

**Session fixation:** An adversary who supplies a client-side XPID at session initiation could cause the GEC to associate the session with a different agent's Party Registry record. The GEC MUST derive XPID from the KIA-verified Party Registry; client-supplied XPIDs are rejected outright.

**XPID binding integrity:** Step 1a of the GEC execution sequence verifies XPID consistency at every ACT. A mismatch terminates the session immediately and is recorded in GAR as a critical security event.

**STALLED state exploitation:** An adversary who can induce artificial DENYs may attempt to drive an agent into STALLED state as a denial-of-service. The stall notification includes the prior DENY chain; the GEC SHOULD log stall-inducing DENY patterns inconsistent with the SO Type state machine.

**Session revocation:** When a session revocation signal is received, the AEP loop MUST halt after the current atomic operation completes (CLEAN state) or immediately (PARTIAL state).

---

## SOOS stack context

AEP sits at **Level 2 — Session Foundation**, the operational heart of the SOOS stack. It depends on IDP (Intent Declaration per cycle), CAP (Tier 0-A pre-check), HEM (trigger evaluation), GAR (record every cycle), KIA (XPID derivation at session open), MAD (delegation context verification), and — new in -03 — DAM (lineage and residency validation at Step 4a). It is the protocol that makes the governance stack operative.

Related drafts: [IDP](/drafts/idp) · [HEM](/drafts/hem) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [KIA](/drafts/kia) · [MAD](/drafts/mad) · [DAM](/drafts/dam)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/aep)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
