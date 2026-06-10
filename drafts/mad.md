# Multi-Agent Delegation

Layer 4 — Multi-Agent
**draft-sato-soos-mad-02**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
See [SOOS Stack](/stack) implementation

---

## The problem

When one AI agent delegates a task to another, who is responsible for what the sub-agent does?

This is not a policy question — it is a protocol question. Without a standard for how delegation authority is encoded, attenuated, and revoked across agent chains, multi-agent systems have no governance primitive below the application layer. When something goes wrong, the delegation chain is invisible.

MAD defines the delegation protocol: how authority passes from principal to agent to sub-agent, how each hop narrows the scope, and — critically — what the kernel does when a revocation signal arrives mid-execution with work partially done.

**The design premise:** multi-agent delegation without governed revocation is a power-of-attorney chain with no mechanism to revoke it once work has begun. MAD closes that gap.

---

## Messages to key audiences

### IETF Working Groups

MAD is relevant to the OAUTH, SECEVENT, and GNAP working groups. It profiles RFC 8693 (Token Exchange) and the OpenID Shared Signals Framework CAEP for agentic delegation and session revocation.

The OpenID Foundation acknowledged in April 2026 (arxiv:2604.23280) that revocation across offline-attenuated delegation chains is "largely unsolved." MAD is the IETF draft that solves it at the kernel level: the session revocation model (§3.6), the CAEP agent-session-revoked profile (§3.6.1), and the partial-completion state taxonomy (CLEAN / PARTIAL / UNKNOWN) are the Vienna-ready contributions.

The R-1 through R-7 trigger taxonomy (SA-12, §3.6.4) defines the six canonical revocation triggers plus the DEADLOCK state — a complete classification that no existing draft provides.

To engage on MAD: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building a multi-agent system today, your delegation model is probably implicit — one agent calls another, authority is assumed, and revocation is an application-level concern that most frameworks don't implement. When something goes wrong mid-delegation, determining what each agent was authorised to do and what state execution was in at revocation requires forensic reconstruction.

MAD closes this gap by making delegation an explicit, kernel-verified protocol. Every delegation hop is an MJWT token with a defined scope. The narrowing property (INV-4) is machine-verifiable: each sub-agent's authority is cryptographically bounded by its parent's. Revocation propagates through the delegation tree to all active sub-agents, with completion state classified at each node.

Without MAD: your multi-agent system's authority model is implicit and your revocation model is application-defined. With MAD: delegation is signed, bounded, and revocable with a kernel-verified audit trail.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mad)

### Enterprise architects

MAD is the protocol for multi-agent workflow authorisation in enterprise deployments. The delegation tree maps directly to organisational authority structures: a principal delegates to an orchestrator agent, which delegates to specialist sub-agents, each with a narrowed MJWT scope. The tree is verifiable at any node; the authority of any sub-agent is traceable to its root mandate.

For SOC 2 readiness: MAD's delegation tree and revocation record are the audit evidence for "access controls extend to sub-processes" — a standard SOC 2 requirement that no existing agentic AI framework satisfies at the protocol layer.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MAD (Multi-Agent Delegation, draft-sato-soos-mad-02). MAD defines the delegation tree as a chain of MJWT tokens where each hop MUST narrow scope (INV-4 narrowing property). The revocation model has three layers: authority revocation (delegation grant cancelled), session revocation (active sessions terminated), and partial-completion handling (CLEAN / PARTIAL / UNKNOWN states). When a CAEP agent-session-revoked signal arrives, the kernel must classify completion_state, halt if PARTIAL, and propagate revocation down the delegation tree with a cascade_timeout. The trigger taxonomy (§3.6.4) defines R-1 through R-6 revocation triggers plus R-7 DEADLOCK. The BUDGET_TRANSFER Cedar action (ALE-018) enables cluster resource redistribution between agents."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `delegation_id` | string | Unique identifier for this delegation grant |
| `parent_delegation_id` | string | Reference to parent node in delegation tree |
| `delegation_depth` | integer | Depth in delegation graph at this node |
| `delegated_scope` | object | Narrowed authority granted to sub-agent |
| `completion_state` | enum | CLEAN / PARTIAL / UNKNOWN at revocation point |
| `natural_breakpoint_reached` | boolean | Whether a declared breakpoint was reached before revocation |
| `irreversible_actions_taken` | boolean | Whether any irreversible actions occurred |
| `rollback_available` | boolean | Whether the sub-agent's state can be rolled back |
| `cascade_timeout` | integer | Max seconds for revocation to propagate to all sub-agents |
| `revocation_trigger` | enum | R-1 through R-7 (trigger taxonomy) |

**Minimal Cedar policy example:**

```cedar
// Enforce narrowing property — sub-agent scope must not exceed parent
forbid (
  principal is Agent,
  action,
  resource
)
when {
  context.delegation_depth > 0 &&
  !context.scope_within_parent_bounds
};

// Permit BUDGET_TRANSFER only between agents in same cluster
permit (
  principal is Agent,
  action == Action::"BudgetTransfer",
  resource is ClusterBudgetPool
)
when {
  context.source_agent_cluster_id == context.target_agent_cluster_id &&
  context.transfer_amount <= context.source_remaining_budget
};
```

### Government and regulators

MAD is the protocol that makes AI delegation chains auditable and revocable — a requirement that emerges wherever regulated processes are delegated to autonomous agents. When a financial institution's AI agent delegates a sub-task to another AI agent, the regulatory question is: was the sub-agent's authority bounded by regulation, and can the institution prove it?

MAD provides both: the narrowing property ensures delegation cannot expand authority beyond what the principal granted; the GAR audit trail records every delegation grant and revocation event with a kernel-signed timestamp.

Relevant regulatory alignment: Japan FSA guidance on AI in financial services (delegation and oversight), EU AI Act Article 14 (human oversight extending to sub-processes), MiFID II (auditability of automated decision chains).

For collaboration on jurisdiction-specific delegation governance requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Multi-agent systems delegate authority implicitly. There is no standard for how delegation scope is bounded at each hop, or what happens to in-flight delegated work when revocation is required.

**Mechanism:** MAD defines delegation as a chain of MJWT tokens with a cryptographically enforced narrowing property. Every delegation hop narrows scope. Revocation propagates through the delegation tree via CAEP signals, with completion state classified at each node (CLEAN / PARTIAL / UNKNOWN) before the revocation is recorded in GAR.

**Output:** A delegation tree that is verifiable at any node, and a revocation record that proves — at the kernel level — what state each sub-agent was in when authority was withdrawn.

**Who verifies it:** Enterprise architects auditing multi-agent authority models, compliance teams demonstrating that sub-agent scope was bounded by regulation, security teams tracing the path of a compromised delegation, and regulators requiring auditability of automated decision chains.

---

## The three-layer revocation model

MAD defines revocation at three layers, each with distinct protocol obligations:

**Authority revocation** — the delegation grant is cancelled. The MJWT token is invalidated. New actions cannot be authorised under this grant. Existing sub-agents are notified via CAEP.

**Session revocation** — active agent sessions executing under the revoked grant are terminated. The kernel classifies completion state at each active node:
- `CLEAN` — no irreversible actions since last natural breakpoint. GEC may complete the current atomic operation then halt.
- `PARTIAL` — irreversible actions taken, execution incomplete. GEC MUST halt immediately, record in GAR, surface to HEM.
- `UNKNOWN` — completion state cannot be determined (e.g., network partition). GEC MUST treat as PARTIAL.

**Partial-completion handling** — the cascade of revocation through a delegation tree, with `cascade_timeout` bounding propagation time. Unreachable nodes default to UNKNOWN at timeout.

---

## The trigger taxonomy — R-1 through R-7

MAD §3.6.4 defines seven canonical revocation triggers:

| Trigger | Condition |
|---|---|
| **R-1** | Principal explicit revocation — operator or user withdraws authority directly |
| **R-2** | Mandate expiry — MJWT token reached its `exp` claim |
| **R-3** | Scope violation — sub-agent attempted action outside delegated scope |
| **R-4** | CAP Tier 0-A violation — constitutional prohibition detected in sub-agent execution |
| **R-5** | Resource exhaustion — budget envelope exceeded |
| **R-6** | CAEP signal received — external session revocation signal from identity provider |
| **R-7** | DEADLOCK — circular delegation dependency with no resolution path |

R-7 DEADLOCK is the edge case that no existing delegation framework addresses: two agents in a cluster where each is waiting for the other's output to proceed, and neither can advance independently. MAD §3.6.4 defines the DEADLOCK state and the kernel's response — escalation to HEM Class 8 before the stall becomes unrecoverable.

---

## Use cases

**Enterprise multi-agent supply chain — authority audit**

A procurement system deploys an orchestrator agent that delegates supplier negotiation to three specialist sub-agents, each authorised for a different product category. A compliance review requires proof that the electronics sub-agent never had authority to negotiate software contracts. MAD's delegation tree — signed MJWT tokens with narrowed scope at each hop — is the audit evidence. The electronics sub-agent's `delegated_scope` is bounded to electronics; any attempt to act outside that scope produces a Cedar DENY recorded in GAR.

**Mid-execution revocation — financial settlement**

A settlement agent delegates confirmation to a sub-agent mid-settlement. The principal revokes authority after discovering a data error. The revocation signal reaches the sub-agent during an active write operation. MAD classifies `completion_state: PARTIAL` (the write is irreversible, the settlement is incomplete), halts execution, records the state in GAR, and routes to HEM for human review. The principal receives a complete record of what was settled and what was not — before any recovery action is taken.

**Cascade revocation across a fan-out topology**

An orchestrator delegates to twelve specialist agents in parallel. A CAP Tier 0-A violation is detected in agent 7. R-4 fires. Revocation propagates through the delegation tree to all twelve agents within the `cascade_timeout` window. Agents 1–6 and 8–12 complete their current atomic operations (CLEAN state) and halt. Agent 7 halts immediately (PARTIAL state). All thirteen revocation events are recorded in GAR with timestamps, creating a complete cascade revocation audit trail.

---

## How this builds on existing work

**RFC 8693 (OAuth 2.0 Token Exchange)** is the token exchange standard MAD profiles for delegation. MAD inherits RFC 8693's token exchange security properties and adds the INV-4 narrowing property: each delegation hop MUST narrow, never expand, the authority encoded in the parent token. RFC 8693 defines how to exchange tokens; MAD defines what the governance kernel does with the delegated token at execution time.

**CAEP (Continuous Access Evaluation Protocol)** defines the `session-revoked` event type and delivery semantics. MAD profiles CAEP for agentic delegation: the `agent-session-revoked` event extends CAEP's `session-revoked` with delegation-specific fields (`delegation_depth`, `completion_state`, `natural_breakpoint_reached`). CAEP provides the signal; MAD specifies the kernel-side response.

**OpenID Foundation (arxiv:2604.23280, April 2026)** acknowledges that revocation across offline-attenuated delegation chains is "largely unsolved." MAD is the IETF-track solution: the session revocation model, completion state taxonomy, and cascade timeout are the protocol-level answer to the gap the OpenID Foundation identified.

---

## Related work

**draft-singla-agent-identity-protocol, draft-aip-agent-identity-protocol, ZeroID** — these drafts address agent identity: what credentials an agent holds and how it authenticates. MAD is the governance enforcement layer that operates after identity is established. These drafts answer "who is the agent?"; MAD answers "what is the agent authorised to do, and what happens when that authority is revoked during execution?"

**draft-ietf-oauth-security-topics** — MAD's MJWT token chain addresses the delegation security considerations in OAuth security topics, specifically the cross-authorization-server replay risk in multi-hop delegation. INV-4 (narrowing property) is the structural mitigation.

**WIMSE (Workload Identity in Multi-Service Environments)** — WIMSE establishes workload-side identity for service-to-service authentication. MAD is the delegation governance complement: WIMSE establishes what identity the delegating agent presents; MAD governs what authority it can pass and how revocation propagates.

---

## Security

**Key security properties:** The narrowing property (INV-4) is cryptographically enforced — a sub-agent cannot claim authority broader than its parent's MJWT scope. Revocation propagates through the delegation tree with a bounded `cascade_timeout`; unreachable nodes default to UNKNOWN (treated as PARTIAL). Every delegation grant and revocation event is recorded in GAR.

**Delegation graph completeness:** A cascade revocation that does not reach all sub-agents in a fan-out topology leaves ungoverned agents active. MAD's mitigation: `cascade_timeout` sets a normative floor on propagation time; unreachable nodes default to UNKNOWN state (treated as PARTIAL) at timeout. The `cascade_timeout` floor vs. recommendation is an open question (OQ-REC-02) targeted for the MAD-02 manifest session.

**DEADLOCK state:** Circular delegation dependencies can produce a state where no agent can advance without input from another that is also waiting. R-7 triggers HEM Class 8 (multi-principal required) before the DEADLOCK becomes unrecoverable. The kernel records the DEADLOCK state in GAR before escalating.

**Session revocation:** Implementations MUST propagate revocation to all active sub-agents within `cascade_timeout`. After `cascade_timeout`, unreachable nodes MUST be treated as UNKNOWN (PARTIAL). MUST NOT begin new delegation hops after receiving a revocation signal for the parent grant.

---

## SOOS stack context

MAD sits at **Level 4 — Multi-Agent**, the highest layer of the SOOS dependency model. It depends on MJWT (delegation token format and narrowing property), IDP (sub-agent intent declarations bound to parent delegation), CAP (scope boundary enforcement across the delegation tree), GAR (delegation and revocation event recording), and AEP (execution loop carries `delegation_context` per cycle).

Related drafts: [MJWT](/drafts/mjwt) · [AEP](/drafts/aep) · [GAR](/drafts/gar) · [HEM](/drafts/hem) · [CAP](/drafts/cap)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mad)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
