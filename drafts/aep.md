# Agentic Execution Protocol

Layer 2 — Session Foundation
**draft-sato-soos-aep-01**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
See [SOOS Stack](/stack) implementation

---

## The problem

Autonomous AI agents execute actions in the world. Right now, there is no standard for what a governed execution cycle looks like — what checks run before an action, what is recorded during it, and what must happen before the next action begins.

AEP defines the governed execution loop: the protocol that wraps every agent action with identity verification, policy evaluation, audit recording, and escalation detection — making each cycle reproducible, auditable, and safe to deploy at scale.

**The design premise:** a governed execution loop is not a constraint on what agents can do. It is the precondition for deploying them where it counts.

---

## Messages to key audiences

### IETF Working Groups

AEP is the primary submission for the ACP (Agentic Computing Protocols) BoF at IETF 126 Vienna. It is the protocol that makes the SOOS governance stack operative — the loop that calls IDP, CAP, HEM, and GAR in the correct sequence on every execution cycle.

AEP profiles GNAP (RFC 9635) for initial grant establishment: GNAP handles the authorisation grant that initiates the governed session; AEP specifies the execution loop that runs within that session. The two compose without overlap.

The reasoning mode taxonomy (DR-AEP-RMT-01, eight modes) is a Vienna-ready addition: it provides structured, Cedar-evaluable classification of agent cognitive mode, filling a gap that no existing IETF draft addresses.

To engage on AEP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-aep/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your agent's execution loop is ad hoc — a sequence of LLM calls and tool invocations with governance bolted on externally, if at all. When something goes wrong, you cannot reproduce the exact sequence of checks that ran (or didn't) on a given action.

AEP closes this gap by specifying the execution loop as a protocol. Each cycle: verify identity, evaluate Cedar policy, check HEM trigger conditions, execute, record in GAR. The loop is reproducible. The record is auditable. Any deviation from the protocol is detectable.

Without AEP: your agent's behaviour is correct until it isn't, and you find out after the fact. With AEP: every action is preceded by a verifiable governance cycle, and the record proves it.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/aep)

### Platform engineers

AEP is the protocol for safe deployment of autonomous agents. The governed execution loop is the unit of deployment: each agent action is a cycle, each cycle is governed, each governance event is recorded. The result is a system you can reason about — not because the agent is perfect, but because the protocol ensures that imperfection is bounded, detected, and surfaced before it compounds.

The Context Package (AEP §6) is the primary operational instrument: `reasoning_mode`, `time_budget_remaining`, `resource_envelope`, `delegation_context`. These fields travel with every execution cycle and drive downstream governance decisions. Platform engineers instrumenting SOOS deployments operate primarily at the Context Package level.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement the SOOS AEP governed execution loop (draft-sato-soos-aep-01). Each cycle must: (1) verify the active Intent Declaration (IDP) is valid and session-bound, (2) run the CAP Tier 0-A pre-check via Cedar, (3) evaluate HEM trigger conditions across all nine classes, (4) execute the action if all checks pass, (5) record the governance event in GAR before proceeding to the next cycle. The Context Package must include reasoning_mode (8-value enum), time_budget_remaining (decremented each cycle), and resource_envelope. When time_budget_remaining reaches zero, emit HEM_BUDGET_EXHAUSTED before any further action. The loop also handles the BUDGET_TRANSFER Cedar action for cluster resource redistribution (ALE-018)."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `cycle_id` | string | Unique identifier for this execution cycle |
| `session_id` | string | Active governed session reference |
| `intent_id` | string | Bound Intent Declaration (IDP reference) |
| `reasoning_mode` | enum | DIRECT / CHAIN / TREE / REFLEXIVE / DELEGATED / COLLABORATIVE / EXTENDED / CONSTRAINED |
| `time_budget_remaining` | integer | Seconds remaining in mandate; decremented each cycle |
| `resource_envelope` | object | Compute / memory / network / storage budgets |
| `delegation_context` | object | Active delegation chain reference (MAD) |
| `cluster_context` | object | Cluster membership and budget pool (multi-agent) |
| `governance_result` | enum | PROCEED / DENY / ESCALATE / SUSPEND |
| `gar_record_id` | string | Reference to the GAR entry for this cycle |

**Minimal Cedar policy example:**

```cedar
// Permit execution only when budget and policy checks pass
permit (
  principal,
  action == Action::"ExecuteCycle",
  resource
)
when {
  context.time_budget_remaining > 0 &&
  context.intent_valid == true &&
  context.tier_0a_check_passed == true
};
```

### Government and regulators

AEP is the protocol that makes "AI accountability" an engineering specification rather than a policy aspiration. Each governed execution cycle produces a verifiable record: what the agent intended, what policy evaluated it, what the result was, and when. Regulators requiring audit trails for automated decisions have, in AEP, a protocol that makes those trails non-suppressible at the kernel layer.

Relevant regulatory alignment: EU AI Act Article 12 (record-keeping for high-risk AI), Japan AI Promotion Act (accountability requirements), NIST AI RMF (MEASURE 2.5 — AI system outputs are monitored).

For collaboration on jurisdiction-specific execution governance requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Agentic AI systems execute sequences of actions with no standard for what governance checks run between them. Post-hoc audit is possible; pre-action governance is not standardised.

**Mechanism:** AEP defines the execution cycle as a protocol. Each cycle runs a fixed sequence: IDP validation → CAP Tier 0-A pre-check → full Cedar policy evaluation → HEM trigger evaluation → action execution → GAR record. The sequence is normative; skipping any step produces a non-conforming implementation.

**Output:** A GAR record for every cycle — governance decision, Cedar result, HEM evaluation outcome, resource consumption, timing — that proves the governed loop ran correctly on every action.

**Who verifies it:** Platform engineers auditing agent deployments, compliance teams demonstrating Article 12 record-keeping, security operations teams detecting anomalous governance patterns, and regulators requiring verifiable accountability records.

---

## The Context Package

The Context Package is the data structure that travels with every AEP execution cycle. It is the primary instrument through which governance decisions are made:

**`reasoning_mode`** — the declared cognitive mode of the agent (eight values, from IDP). Drives downstream governance: TREE mode requires CAP evaluation across all branches; DELEGATED mode activates MAD verification; EXTENDED mode activates cross-session replay protection.

**`time_budget_remaining`** — decremented by the kernel on each cycle. When it reaches zero, `HEM_BUDGET_EXHAUSTED` fires before any further action. Budget extensions require new Cedar authorisation.

**`resource_envelope`** — compute, memory, network egress, and storage budgets. Resource violations are governance events recorded in GAR.

**`delegation_context`** — active delegation chain reference. Present when the agent is executing under a MAD delegation grant, not a direct principal mandate.

**`cluster_context`** — cluster membership and shared budget pool reference. Present in multi-agent deployments. Enables `BUDGET_TRANSFER` (ALE-018) and `CLUSTER_BLOCKED` state handling.

---

## Use cases

**Safe deployment of a financial reconciliation agent**

A bank deploys an agent to reconcile daily transactions. AEP's governed execution loop means that every reconciliation action — every database write, every exception flag — is preceded by a Cedar policy evaluation and an HEM trigger check. When the agent encounters an anomalous transaction that exceeds its mandate scope, HEM Class 2 fires before any write occurs. The GAR record is the bank's compliance evidence that the agent never acted outside its governed scope.

**Multi-session research agent with budget governance**

A research agent is given a 10-hour mandate across multiple sessions. AEP's `time_budget_remaining` field is decremented on each cycle across all sessions. When the agent approaches budget exhaustion mid-session, the `HEM_BUDGET_EXHAUSTED` trigger fires. The principal can review progress, extend the budget with a new Cedar authorisation, or close the session with the PARTIAL completion state recorded. No session silently runs over budget.

**Cluster execution with resource redistribution**

Three agents are executing in a cluster with a shared compute budget. Agent B completes its sub-task early with compute to spare. AEP's `BUDGET_TRANSFER` Cedar action (ALE-018) allows the cluster to redistribute B's remaining budget to Agent C, which is near exhaustion. The transfer is recorded in GAR (ALE-018), Cedar-authorised, and reflected in all three agents' `cluster_context` before the next cycle.

---

## How this builds on existing work

**GNAP (RFC 9635)** handles the authorisation grant that establishes a governed session — what the agent is permitted to do, issued by the authorisation server before execution begins. AEP specifies what happens inside that session: the execution loop that runs within the GNAP-granted authorisation. GNAP is the door; AEP is the governed corridor behind it.

**Cedar (Amazon open source)** is the policy engine that AEP's Tier 0-A pre-check and full policy evaluation call. AEP specifies the calling sequence and the mapping from Cedar evaluation results to governance outcomes (CEDAR_PERMIT → PROCEED, CEDAR_DENY → DENY or ESCALATE depending on tier).

**W3C PROV-DM** provides the provenance data model that AEP's execution records align with. Each AEP cycle record is a PROV-DM Activity; each agent action is a PROV-DM Entity use/generation pair. This alignment means AEP records can be consumed by PROV-DM-aware audit tooling without transformation.

---

## Related work

**draft-ietf-oauth-security-topics** — AEP's cycle-level authorisation model extends the OAuth security considerations for long-lived, multi-action agent sessions. The per-cycle Cedar evaluation is the AEP answer to the session management security gap in OAuth-based agent deployments.

**LangChain / LangGraph / Vercel AI SDK** — these frameworks implement agent execution loops at the application layer. AEP is the protocol-layer complement: it specifies the governance events that application-layer frameworks should emit, not how they implement their execution logic.

No existing IETF draft specifies a governed execution loop for agentic AI systems. AEP is a first-mover position in a space the ACP BoF is actively defining.

---

## Security

**Key security properties:** The AEP execution loop is non-bypassable at the protocol level. A conforming implementation cannot execute an action without first running the CAP Tier 0-A pre-check and evaluating HEM trigger conditions. Every cycle produces a GAR record before the result is returned.

**Budget exhaustion attacks:** An adversary who can delay a governed agent may attempt to exhaust its time budget to force `HEM_BUDGET_EXHAUSTED` and stall execution. AEP's mitigation is the `cascade_timeout` — a normative floor on revocation propagation timing that bounds the stall window.

**Delegation context integrity:** When `delegation_context` is present, AEP requires that the delegation chain be verified against MAD before the cycle proceeds. A spoofed delegation context that is not MAD-verifiable produces a DENY before execution.

**Session revocation:** When a session revocation signal is received, the AEP loop MUST halt after the current atomic operation completes (CLEAN state) or immediately (PARTIAL state). Implementations MUST NOT begin a new cycle after receiving a revocation signal.

---

## SOOS stack context

AEP sits at **Level 2 — Session Foundation**, the operational heart of the SOOS stack. It depends on IDP (Intent Declaration validation per cycle), CAP (Tier 0-A pre-check and Cedar evaluation), HEM (trigger evaluation per cycle), GAR (record every cycle), and MAD (delegation context verification). It is the protocol that makes the governance stack operative.

Related drafts: [IDP](/drafts/idp) · [HEM](/drafts/hem) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [MAD](/drafts/mad)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/aep)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-aep/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
