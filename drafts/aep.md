# Agentic Execution Protocol

Layer 2 — Session Foundation
**draft-sato-soos-aep-02**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
See [SOOS Stack](/stack) implementation

---

## What's new in AEP-02

- **XPID binding at session open** — the GEC derives the agent's Cross-Principal Identifier from the KIA-verified Party Registry at session initiation. Client-supplied XPIDs are rejected outright. This closes the session fixation gap.
- **STALLED and PLAN_B_ACTIVE session states** — two new normative session states for when an agent cannot make progress without human direction (STALLED) and when the pre-declared Plan B has been activated (PLAN_B_ACTIVE). Both states have full trigger conditions, GAR event log markers, and resume conditions.
- **Expected Outcome Declaration (EOD)** — a pre-session commitment structure where the agent declares its expected outcome, its acceptance envelope for success, and a pre-declared Plan B before the first SENSE delivery. Required for Class 3 agents; recommended for Class 2.
- **RETRY_CONTINUATION strengthened** — the what_changed field is now mandatory in every RETRY_CONTINUATION IDP. The GEC rejects what_changed values that do not reference specific enrichment fields or observable context changes. prior_denial_count is now a Cedar context attribute.
- **AEP-to-OTel mapping (Section 12)** — mandatory span attributes at each AEP phase (SENSE/REASON/PLAN/ACT/OBSERVE) using the soos.aep.* namespace. The OTel layer makes the governed loop observable without replacing the Event Stream as the governance record.
- **Four new Security Considerations** — session fixation, XPID binding integrity, cross-principal scope leakage, STALLED state exploitation.

---

## The problem

Autonomous AI agents execute actions in the world. Right now, there is no standard for what a governed execution cycle looks like — what checks run before an action, what is recorded during it, and what must happen before the next action begins.

AEP defines the governed execution loop: the protocol that wraps every agent action with identity verification, policy evaluation, audit recording, and escalation detection — making each cycle reproducible, auditable, and safe to deploy at scale.

**The design premise:** a governed execution loop is not a constraint on what agents can do. It is the precondition for deploying them where it counts.

---

## Messages to key audiences

### IETF Working Groups

AEP is the primary submission for the ACP (Agentic Computing Protocols) BoF at IETF 126 Vienna. It is the protocol that makes the SOOS governance stack operative — the loop that calls IDP, CAP, HEM, KIA, and GAR in the correct sequence on every execution cycle.

AEP profiles GNAP (RFC 9635) for initial grant establishment: GNAP handles the authorisation grant that initiates the governed session; AEP specifies the execution loop that runs within that session. The two compose without overlap.

**AEP-02 Vienna additions:** XPID binding (Section 5.1) is a direct response to WIMSE WG concerns about workload identity lifecycle in multi-agent sessions. The EOD (Section 6) is the AEP answer to pre-session intent commitment, filling a gap that exists between GNAP grant issuance and first agent action. The STALLED state (Section 5.4) provides the governance bridge between retry exhaustion and human escalation that AEP-01 lacked. The OTel mapping (Section 12) addresses the ACP BoF's observability gap for standards-track agent protocols.

To engage on AEP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your agent's execution loop is ad hoc — a sequence of LLM calls and tool invocations with governance bolted on externally, if at all. When something goes wrong, you cannot reproduce the exact sequence of checks that ran (or didn't) on a given action.

AEP closes this gap by specifying the execution loop as a protocol. Each cycle: verify identity (with XPID binding), evaluate Cedar policy, check HEM trigger conditions, execute, record in GAR. The loop is reproducible. The record is auditable. Any deviation from the protocol is detectable.

**New in AEP-02 — EOD (Expected Outcome Declaration):** Before your agent starts, it commits to what it expects to achieve and what it will do if the primary path is blocked. This gives you the operational equivalent of a pre-flight checklist: if the session deviates from the EOD, the GAR record shows exactly where and why.

**New in AEP-02 — STALLED state:** When your agent gets stuck — not because of a single DENY, but because no viable path to the goal exists — the STALLED state triggers a human notification and surfaces the stall reason and prior DENY chain. You find out that the agent is stuck before it silently exhausts its iteration budget.

**New in AEP-02 — RETRY_CONTINUATION what_changed:** When your agent retries after a denial, it must now declare what changed between the denied attempt and the retry. Generic retries that don't reference the denial's enrichment fields are rejected. This makes retry chains auditable and stops retry loops before they become a governance problem.

Without AEP: your agent's behaviour is correct until it isn't, and you find out after the fact. With AEP: every action is preceded by a verifiable governance cycle, every stall is surfaced to the human principal, and every retry is substantiated.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/aep)

### Platform engineers

AEP is the protocol for safe deployment of autonomous agents. The governed execution loop is the unit of deployment: each agent action is a cycle, each cycle is governed, each governance event is recorded. The result is a system you can reason about — not because the agent is perfect, but because the protocol ensures that imperfection is bounded, detected, and surfaced before it compounds.

**New in AEP-02 — OTel mapping (Section 12):** The soos.aep.* span attributes give your monitoring pipeline direct visibility into the AEP loop without parsing Event Stream entries. The soos.aep.cp_hash binding between SENSE and ACT spans proves that every ACT was preceded by a valid SENSE. The soos.aep.session_xpid attribute is identical across all spans in a session — a mid-session XPID change is a security event.

**New in AEP-02 — XPID at session open:** The GEC binds the agent's Cross-Principal Identifier at session initiation from the KIA-verified Party Registry. Client-supplied XPIDs are rejected. This means multi-agent deployments where sessions could be spoofed to claim another agent's identity are no longer possible at the protocol level.

The Context Package (AEP §7) is the primary operational instrument: `reasoning_mode`, `session_xpid`, `session_state`, `eod_id`, `resource_envelope`, `delegation_context`. These fields travel with every execution cycle and drive downstream governance decisions.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement the SOOS AEP-02 governed execution loop (draft-sato-soos-aep-02). The loop has five steps: SENSE, REASON, PLAN, ACT, OBSERVE. Before the first SENSE, my Class 3 agent must submit an EOD (Expected Outcome Declaration) declaring the primary expected SO state, an acceptance envelope, and a pre-declared Plan B. At session open, the GEC derives the XPID from the KIA Party Registry — do not supply XPID from the client side. Each ACT must carry eod_id. After any DENY, the next IDP must carry RETRY_CONTINUATION with a what_changed field referencing specific enrichment fields from the DENY response — generic what_changed values are rejected. If the agent accumulates N consecutive DENYs, the session enters STALLED state and I receive a notification. If an EOD Plan B is declared, the GEC can activate PLAN_B_ACTIVE automatically when STALL_PATH_EXHAUSTED. Each AEP phase must emit an OTel span in the soos.aep.* namespace with the mandatory attributes from Section 12.2."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `session_xpid` | string | GEC-bound Cross-Principal Identifier. Derived from KIA at session open. [NEW] |
| `session_state` | enum | ACTIVE / HEM_PENDING / STALLED / PLAN_B_ACTIVE / CLOSED [NEW] |
| `eod_id` | string | UUID of committed Expected Outcome Declaration. [NEW] |
| `cycle_id` | string | Unique identifier for this execution cycle |
| `reasoning_mode` | enum | ROUTINE / PREDICTIVE / DIAGNOSTIC / CHANNEL_DEGRADED / META / COMPENSATING / DELEGATION_AWARE / HEM_INFORMED |
| `plan_b_ref` | string | Required in PLAN_B_ACTIVE state. References EOD plan_b_id. [NEW] |
| `what_changed` | string | Required in RETRY_CONTINUATION. Must reference DENY enrichment fields. [NEW] |
| `prior_denial_count` | integer | Cedar context attribute: total DENYs for this action in this session. [NEW] |
| `governance_result` | enum | PERMIT / DENY / HEM_PENDING / STALLED |
| `gar_record_id` | string | Reference to the GAR entry for this cycle |

**Minimal Cedar policy example — retry depth gate:**

```cedar
// Require HEM escalation when denial depth exceeds threshold
permit (
  principal,
  action == Action::"ExecuteCycle",
  resource
)
when {
  context.time_budget_remaining > 0 &&
  context.intent_valid == true &&
  context.tier_0a_check_passed == true &&
  context.prior_denial_count <= 3
};

// Force HEM after 3 denials on high-risk action class
forbid (
  principal,
  action == Action::"HighRiskTransition",
  resource
)
when {
  context.prior_denial_count > 3
};
```

### Government and regulators

AEP is the protocol that makes "AI accountability" an engineering specification rather than a policy aspiration. Each governed execution cycle produces a verifiable record: what the agent intended, what policy evaluated it, what the result was, and when. Regulators requiring audit trails for automated decisions have, in AEP, a protocol that makes those trails non-suppressible at the kernel layer.

**New in AEP-02:** The Expected Outcome Declaration (EOD) creates a pre-session commitment record. Before any action is taken, the agent has declared what it expects to achieve and what its fallback strategy is. A regulator reviewing a session can compare the session's actual trajectory against the EOD's pre-declared expectations — a form of pre-commitment accountability that no existing agent framework provides.

**New in AEP-02:** The XPID binding requirement closes the agent identity gap. Every session is bound to a verified Party Registry entry; the agent operating in the session cannot substitute another identity. This makes the accountability chain from action to agent provider verifiable and non-repudiable.

Relevant regulatory alignment: EU AI Act Article 12 (record-keeping for high-risk AI), EU AI Act Article 9 (technical risk management — EOD is a pre-session risk management artifact), Japan AI Promotion Act (accountability requirements), NIST AI RMF (MEASURE 2.5 — AI system outputs are monitored; the OTel mapping is the observability implementation).

For collaboration on jurisdiction-specific execution governance requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Agentic AI systems execute sequences of actions with no standard for what governance checks run between them. Post-hoc audit is possible; pre-action governance is not standardised. Agents that get stuck retry silently until budget exhaustion. Agents from different providers can substitute identities in multi-agent sessions. No pre-session commitment exists against which the session's actual trajectory can be audited.

**Mechanism:** AEP defines the execution cycle as a protocol. At session open, the GEC binds the agent's XPID from the KIA Party Registry and records the submitted EOD. Each cycle runs a fixed sequence: IDP validation → CAP Tier 0-A pre-check → XPID consistency check → full Cedar policy evaluation → HEM trigger evaluation → action execution → GAR record. The sequence is normative; skipping any step produces a non-conforming implementation. When the agent cannot make progress, the STALLED state surfaces this to the human principal before budget exhaustion.

**Output:** A GAR record for every cycle — governance decision, Cedar result, HEM evaluation outcome, resource consumption, timing, XPID binding, EOD outcome — that proves the governed loop ran correctly on every action. At session close, the EOD_OUTCOME field records whether the session's actual trajectory matched, partially matched, or deviated from the pre-declared EOD.

**Who verifies it:** Platform engineers auditing agent deployments, compliance teams demonstrating Article 12 record-keeping, security operations teams monitoring soos.aep.* OTel spans for XPID anomalies and retry patterns, and regulators requiring pre-session commitment accountability.

---

## The five session states

AEP-02 formalises the session state model. A session is always in one of five states:

**ACTIVE** — the normal execution state. The agent runs the SENSE-REASON-PLAN-ACT-OBSERVE loop. The GEC accepts Transition Requests.

**HEM_PENDING** — the session has escalated to a human principal for a decision on a specific action. The agent cannot submit ACT until the human principal responds. This is not an error; it is a governance checkpoint.

**STALLED** — the agent cannot make progress without human direction. No single action triggered HEM; the session as a whole has hit a progress boundary. The GEC notifies the human principal, surfaces the stall reason, and waits for direction. Stall reasons: STALL_DENY_THRESHOLD (too many consecutive DENYs), STALL_PATH_EXHAUSTED (no viable path to goal), STALL_PLAN_B_BLOCKED (Plan B also exhausted), STALL_ITERATION_LIMIT.

**PLAN_B_ACTIVE** — the pre-declared EOD Plan B has been activated. The agent now executes toward the Plan B target state. Every IDP must carry plan_b_ref. The session closes with PLAN_B_ACHIEVED if the Plan B target is reached.

**CLOSED** — the session has terminated on any path. AEP_SESSION_CLOSED is written; the GAR generates a Session Audit Record.

---

## The Expected Outcome Declaration (EOD)

The EOD is the pre-session commitment structure that AEP-02 introduces. Before the first SENSE delivery, the agent submits an EOD declaring:

- **Primary outcome** — the target SO state the agent expects to reach, with a confidence score.
- **Acceptance envelope** — the conditions that constitute success. What must be true in the SO Zone A for the session to be considered GOAL_ACHIEVED.
- **Plan B** — the fallback target state and the conditions under which Plan B may activate. The agent pre-commits to Plan B before the session starts; this is not improvised at runtime.

The EOD is immutable after submission. The GEC records it as EOD_COMMITTED and carries eod_id in every AEP_SENSE_DELIVERED entry for the life of the session. At session close, the GEC evaluates the session's final state against the EOD's acceptance_envelope and records EOD_OUTCOME (MATCHED, PARTIAL, PLAN_B_MATCHED, UNMATCHED) in AEP_SESSION_CLOSED.

A session that deviates from its EOD is not necessarily non-conforming — it may have activated Plan B correctly. The EOD makes the distinction auditable.

---

## Use cases

**Safe deployment of a financial reconciliation agent**

A bank deploys an agent to reconcile daily transactions. Before the first SENSE delivery, the agent submits an EOD declaring its expected outcome (all transactions reconciled with zero variance) and Plan B (flag unreconciled items for manual review if auto-reconciliation fails after 5 iterations). AEP-02's XPID binding ensures the reconciliation agent's Party Registry entry is verified at session open; no other agent can claim this session's identity. When the agent encounters an anomalous transaction that exhausts its retry capacity, the STALLED state fires before budget exhaustion, the human principal receives the stall notification with the prior DENY chain, and activates Plan B. The EOD_OUTCOME at session close records PLAN_B_MATCHED. The bank's compliance evidence covers the full lifecycle: pre-session commitment, execution, stall, Plan B activation, and outcome.

**Multi-session research agent with retry governance**

A research agent is given a 10-hour mandate to gather and synthesise documents. After several consecutive DENYs on a specific data source access action (the Cedar policy was narrower than expected), the session enters STALLED (stall reason: STALL_DENY_THRESHOLD). The stall notification surfaces the prior DENY chain to the operator. The operator issues a STALL_DIRECTION of REDIRECT_GOAL with an updated goal state. The session resumes with STALL_RESOLVED trigger; the agent queries the Transition Graph (mandatory after STALL_RESOLVED) and continues. The OTel spans show the full timeline: DENYs accumulating, STALLED entry, STALL_RESOLVED, and subsequent progress.

**Multi-agent deployment with XPID verification**

Three agents from different providers are executing in a cluster on a shared SO Cluster. AEP-02's XPID binding at session open ensures each agent is tied to its KIA-verified Party Registry entry. At Step 1a of the GEC execution sequence, every ACT is checked for XPID consistency — a Mandate JWT that does not match the session's bound XPID is rejected immediately and the session is terminated. Security monitoring on soos.aep.session_xpid OTel attributes (OTel-CONF-03) alerts on any mid-session XPID change before it becomes an exploitation attempt.

---

## How this builds on existing work

**GNAP (RFC 9635)** handles the authorisation grant that establishes a governed session — what the agent is permitted to do, issued by the authorisation server before execution begins. AEP specifies what happens inside that session: the execution loop that runs within the GNAP-granted authorisation. GNAP is the door; AEP is the governed corridor behind it.

**Cedar (Amazon open source)** is the policy engine that AEP's XPID consistency check and full policy evaluation call. AEP-02 adds prior_denial_count and last_deny_code as Cedar context attributes, enabling Cedar policies to gate on retry depth — a capability not present in AEP-01.

**W3C PROV-DM** provides the provenance data model that AEP's execution records align with. Each AEP cycle record is a PROV-DM Activity; each agent action is a PROV-DM Entity use/generation pair. The EOD_COMMITTED entry at session open provides a pre-session PROV-DM Agent declaration.

**OpenTelemetry (OTel)** is integrated in AEP-02 as the operational observability layer. The soos.aep.* namespace is a sub-namespace of the soos.governance.* namespace defined in GAR. The OTel spans complement, not replace, the Event Stream.

---

## Security

**Key security properties:** The AEP execution loop is non-bypassable at the protocol level. A conforming implementation cannot execute an action without first running the CAP Tier 0-A pre-check, evaluating HEM trigger conditions, and passing the XPID consistency check. Every cycle produces a GAR record before the result is returned.

**Session fixation [NEW]:** An adversary who supplies a client-side XPID at session initiation could cause the GEC to associate the session with a different agent's Party Registry record. CONF-AEP-12 prohibits client-supplied XPIDs; the GEC MUST derive XPID from the KIA-verified Party Registry. Implementations MUST audit INVALID_XPID_CLAIM rejections as potential session fixation attempts.

**XPID binding integrity [NEW]:** Step 1a of the GEC execution sequence verifies XPID consistency at every ACT. An XPID_MISMATCH terminates the session immediately and is recorded in GAR as a critical security event. OTel-CONF-03 requires monitoring systems to alert on any mid-session XPID change.

**Cross-principal scope leakage [NEW]:** In multi-agent deployments, XPID binding prevents an agent from claiming another provider's Cedar residual. Cedar policies SHOULD be scoped to the XPID.

**STALLED state exploitation [NEW]:** An adversary who can induce artificial DENYs may attempt to drive an agent into STALLED state as a denial-of-service. The stall notification includes the prior DENY chain; the GEC SHOULD log stall-inducing DENY patterns that are inconsistent with the SO Type state machine.

**Budget exhaustion attacks:** An adversary who can delay a governed agent may attempt to exhaust its iteration budget. AEP-02's STALLED state and STALL_DENY_THRESHOLD bound the retry depth before mandatory human review, limiting the effectiveness of exhaustion attacks.

**Session revocation:** When a session revocation signal is received, the AEP loop MUST halt after the current atomic operation completes (CLEAN state) or immediately (PARTIAL state). Implementations MUST NOT begin a new cycle after receiving a revocation signal.

---

## SOOS stack context

AEP sits at **Level 2 — Session Foundation**, the operational heart of the SOOS stack. It depends on IDP (Intent Declaration per cycle), CAP (Tier 0-A pre-check), HEM (trigger evaluation), GAR (record every cycle), KIA (XPID derivation at session open), and MAD (delegation context verification). It is the protocol that makes the governance stack operative.

Related drafts: [IDP](/drafts/idp) · [HEM](/drafts/hem) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [KIA](/drafts/kia) · [MAD](/drafts/mad)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/aep)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
