# Human Escalation Mechanism

Layer 3 — Governance
**draft-sato-soos-hem-04**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-hem/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems fail in a specific way: they keep going when they should stop and ask.

HEM defines the protocol by which a SOOS kernel recognises that a governed execution has reached a decision point beyond the agent's authority — and transfers control to a human principal. Not as a policy preference. As a normative requirement, with a defined trigger taxonomy, a class-based escalation model, and an auditable record.

**The design premise:** escalation is not a failure mode. It is a capability. A system that knows when to stop is more deployable than one that doesn't.

---

## Messages to key audiences

### IETF Working Groups

HEM is relevant to the ALLDISPATCH, OAUTH, and SECEVENT working groups. The escalation record format composes with CAEP (Continuous Access Evaluation Protocol): HEM Class 5 maps to a CAEP `session-revoked` delivery trigger. The out-of-band channel specification intentionally defers to existing notification infrastructure rather than competing with it.

The J-AISI AI Incident Response System (AI-IRS, January 2026) operates at the organisational level — defining incident categories and human response workflows. HEM operates at the protocol level, producing the machine-readable escalation record that AI-IRS workflows consume. The composition model: AI-IRS defines the human response policy; HEM records the kernel-level trigger; GAR provides the tamper-evident audit trail.

To engage on HEM: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-hem/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a governed escalation protocol means your agent continues executing past the point where it should have asked a human. The result is irreversible actions taken without authorisation, at a cost you discover after the fact.

HEM closes this gap by specifying the kernel-level mechanism that halts execution when a class trigger fires — before the action is taken — and routes the decision to the right human through an authenticated, independent channel.

Without HEM: your agent executes until it finishes or crashes. With HEM: your agent stops precisely when human judgment is required, with a signed record of why.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/hem)

### Risk managers and legal

EU AI Act Article 14 requires meaningful human oversight for high-risk AI systems. HEM is the protocol-level mechanism that makes Article 14 compliance machine-verifiable rather than policy-dependent. Each escalation event is a signed, timestamped record of the kernel transferring control to a human — exactly the audit evidence that a post-incident review or regulatory inquiry requires.

For insurance underwriting of AI-driven processes: HEM provides the actuarial primitive that doesn't currently exist — a bounded, auditable record of every point at which human judgment was invoked during an automated workflow.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS HEM (Human Escalation Mechanism, draft-sato-soos-hem-04). This is an IETF protocol that defines nine escalation classes for agentic AI systems. When a class trigger fires, the kernel must halt execution, emit a signed escalation event, notify the human principal through an out-of-band channel, and record the event in GAR before proceeding. Class 1 (CAP Tier 0-A violation) and Class 2 (scope boundary) require immediate halt with no discretion. Class 7 is BUDGET_EXHAUSTED — fires when time_budget_remaining reaches zero. All nine classes produce GAR audit records."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `escalation_class` | enum 1–9 | Which trigger condition fired |
| `trigger_condition` | string | Machine-readable trigger description |
| `so_id` | string | Sovereign Object identifier |
| `session_id` | string | Active session at point of escalation |
| `mandate_id` | string | MJWT mandate reference |
| `time_budget_remaining` | integer | Seconds remaining when trigger fired (Class 7) |
| `completion_state` | enum | CLEAN / PARTIAL / UNKNOWN at point of halt |
| `out_of_band_ref` | string | Reference to the notification sent to principal |

**Minimal Cedar policy example:**

```cedar
// Require escalation before any irreversible financial action
forbid (
  principal,
  action == Action::"ExecutePayment",
  resource
)
unless {
  context.escalation_class == 4 &&
  context.human_approval_received == true
};
```

### Government and regulators

HEM is the protocol that makes "human in the loop" a technical specification rather than a policy statement. When a regulator requires that certain AI decisions involve human review, HEM provides the machine-readable enforcement mechanism: the kernel cannot proceed past a Class trigger without first routing to a human principal and recording the interaction.

Relevant regulatory alignment: EU AI Act Article 14 (human oversight), Japan AI Promotion Act (oversight requirements for high-risk AI), NIST AI RMF (GOVERN 1.7 — human oversight).

For collaboration on jurisdiction-specific escalation requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents make consequential decisions autonomously. There is no standard for when an agent must stop and involve a human, or how that handoff is recorded.

**Mechanism:** HEM defines nine escalation classes with specific trigger conditions. The kernel evaluates all nine classes on every execution cycle. When a class condition is met, execution halts, an escalation event is signed and recorded in GAR, and the human principal is notified through an authenticated out-of-band channel.

**Output:** A signed, tamper-evident escalation record — class, trigger condition, completion state at halt, notification reference — that proves the human was involved before the action proceeded.

**Who verifies it:** Risk managers, compliance teams, regulators, and auditors — anyone who needs to prove that human oversight occurred at the right point, not reconstructed from logs after the fact.

---

## The escalation class model

| Class | Trigger condition | Kernel response |
|---|---|---|
| **Class 1** | Prohibited action detected — CAP Tier 0-A violation | Immediate halt. No discretion. |
| **Class 2** | Scope boundary — action outside mandate | Halt. Cedar DENY. |
| **Class 3** | Principal conflict — contradictory instructions | Escalation before proceeding. |
| **Class 4** | Irreversible action threshold exceeded | Escalation required. |
| **Class 5** | Uncertainty threshold below mandate floor | Escalation or halt. |
| **Class 6** | Novel context — environment materially different from mandate assumptions | Escalation. |
| **Class 7** | Time budget exhausted — `time_budget_remaining` reaches zero | BUDGET_EXHAUSTED → HEM trigger. |
| **Class 8** | Multi-principal required — cluster governance requires sign-off | HEM_MULTI_PRINCIPAL_REQUIRED. |
| **Class 9** | Operator override — action designated as requiring escalation | Escalation before action. |

---

## Dual-layer architecture

HEM-04 distinguishes two escalation layers operating in parallel on every governed execution.

**LLM-HEM** is the model layer. The underlying language model may signal that a decision requires human involvement — uncertainty markers, refusals, hedged outputs. These signals are real. They are also unobservable at the kernel level. The SOOS-HEM layer cannot inspect model internals; it can only observe outputs and execution context. SOOS names this the **Unobservability Principle**.

**SOOS-HEM** is the kernel layer. It implements a deterministic, auditable escalation engine, evaluating trigger conditions against the current Sovereign Object state, the active mandate, and the Cedar policy set. When a class condition is met, the kernel halts — regardless of what the model layer signals.

The critical case: a model that says "I'm not sure" cannot escalate a governed execution. Only the kernel can. This prevents model-layer prompt injection from forcing escalations and ensures governance decisions are made by the governed layer, not the governed thing.

When the layers disagree — LLM-HEM signals escalation but SOOS-HEM finds no trigger — the kernel records `HEM_LAYER_DISCREPANCY` in GAR. Audit-only; execution continues. Pattern analysis of these events informs model assessment and mandate calibration over time.

---

## Use cases

**EU AI Act Article 14 compliance — financial services**

A bank deploys an agent to evaluate loan applications. Article 14 requires human oversight for high-risk AI decisions. HEM provides the mechanism: applications that exceed a risk threshold or involve novel context (Class 6) trigger mandatory human review before any decision is recorded. The GAR escalation record is the Article 14 audit evidence — signed, timestamped, linked to the specific mandate and Sovereign Object.

**Time-bounded autonomous workflows**

A supply chain agent is given a 4-hour mandate to negotiate and confirm shipping contracts. At hour 3.5, `time_budget_remaining` reaches zero mid-negotiation. Class 7 fires. The kernel halts, records completion_state PARTIAL (contracts under negotiation, none confirmed), and routes to the human operator through the out-of-band channel. The operator can extend the budget with a new Cedar authorisation or take over the negotiation directly. Nothing is lost; nothing proceeds without sign-off.

**Multi-agent principal conflict**

Two agents in a cluster receive contradictory instructions from different principals — one instructed to cancel an order, one instructed to fulfil it. Class 3 fires on both. Neither agent proceeds. HEM_MULTI_PRINCIPAL_REQUIRED routes to a human arbitrator. The GAR record captures both instruction chains, the conflict detection, and the resolution authority.

---

## How this builds on existing work

**CAEP (Continuous Access Evaluation Protocol)** defines signals for session-level access revocation events. It specifies what to signal; it does not specify what the governance kernel does when that signal arrives during active agentic execution. HEM specifies the kernel-side response — halt, classify completion state, notify, record — that CAEP signals trigger.

**EU AI Act Article 14** requires human oversight for high-risk AI systems. It is a policy requirement. HEM is the protocol-level implementation: a machine-verifiable, auditable mechanism for satisfying Article 14 at the kernel layer rather than the policy layer.

**J-AISI AI-IRS (Japan AI Incident Response System)** defines organisational incident categories and human response workflows. AI-IRS operates at the process layer; HEM operates at the protocol layer. HEM produces the signed escalation record that AI-IRS incident workflows consume as their primary evidence artifact.

---

## Related work

**draft-klrc-aiagent-auth-00** specifies CAEP signal delivery for agentic sessions. HEM specifies what the governance kernel does upon receiving a CAEP signal — the two drafts compose directly. KLRC-aiagent-auth is the signal layer; HEM is the response layer.

**draft-ietf-secevent-subject-identifiers** — HEM escalation records reference subject identifiers for the escalating agent. HEM uses the SECEVENT subject identifier format for agent identity in escalation events.

The OpenID Foundation acknowledges in arxiv:2604.23280 (April 2026) that revocation across offline-attenuated delegation chains is "largely unsolved." HEM addresses the kernel-side response when a revocation signal arrives during active execution — complementing the identity and revocation signal work in the OAUTH and SECEVENT WGs.

---

## Security

**Key security properties:** Every escalation event is kernel-signed and recorded in GAR before the principal is notified. The out-of-band channel is independent of the agent's execution context — a compromised agent cannot suppress an escalation notification. Class 1 and Class 2 triggers cannot be overridden by any principal instruction at runtime.

**LLM-layer prompt injection:** Because SOOS-HEM triggers are evaluated by the kernel (not the model), prompt injection attacks that attempt to suppress escalation by manipulating model output are ineffective against kernel-layer trigger conditions. A model told to "never escalate" will still trigger SOOS-HEM Class 1 when a CAP Tier 0-A violation is detected.

**Formal analysis status:** No formal verification of HEM trigger completeness has been conducted. This is acknowledged as a gap. Collaboration with academic partners for formal analysis is planned post-Vienna.

**Session revocation:** When an agent session is revoked — by operator action, CAEP signal, or CAP constitutional violation — HEM protocol obligations are superseded by the MAD session revocation procedure. Implementations MUST NOT continue HEM-governed execution after receiving a session revocation signal.

---

## SOOS stack context

HEM sits at **Level 3 — Governance**, alongside CAP and GAR. It depends on IDP (mandate context for trigger evaluation), CAP (Class 1 triggers are CAP Tier 0-A violations), and GAR (every escalation produces a mandatory audit record). It is consumed by AEP (HEM trigger evaluation on every execution cycle) and MAD (cluster-level Class 8 triggers).

Related drafts: [IDP](/drafts/idp) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [AEP](/drafts/aep) · [MAD](/drafts/mad)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/hem)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-hem/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
