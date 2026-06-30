# Multi-Agent Delegation

Layer 3 — Governance
**draft-sato-soos-mad-03**
See the full draft protocol at [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
See [SOOS Stack](/stack) implementation

---

## The problem

Multi-agent AI systems produce accountability black holes. Which agent caused which state change? Under whose authority? If the coordinating agent's mandate is revoked, do the specialist agents it spawned also stop? If a specialist attempts to act beyond its scope, can that excess propagate?

Without a delegation governance protocol, these questions are unanswerable at runtime. MAD closes the gap at three layers: authority narrowing (sub-agents can never acquire capabilities their orchestrators don't hold), cascade revocation (one decision stops the entire delegation tree), and — new in MAD-03 — governed sub-agent spawning (the tree's creation is itself auditable).

**The design premise:** the accountability chain must be reconstructable from the GEC-signed audit record alone. If it can't be reconstructed, it doesn't count as governance.

---

## What's new in MAD-03

**SACR: Sub-Agent Composition Record** (§4): the kernel-governed primitive for sub-agent spawning. MAD-02 fully specified what a sub-agent could do once it existed — but not how it came into existence. SACR closes this: every spawning event is kernel-witnessed, tool-subset-validated, spawn-depth-governed, and GAR-recorded before the sub-agent begins execution. The `assigned_agent_id` in an Assignment now normatively resolves to either a persistent Party Registry identity (Mechanism A) or a SACR-issued ephemeral KIA reference (Mechanism B).

**Hub-Only Constraint** (§5): sub-agents spawned from a hub MUST NOT communicate directly with each other. All coordination routes through the hub orchestrator. This is the only model consistent with kernel-governed state (DEC-PLAN-13) and the horizontal non-contamination property (INV-17). Direct sub-agent communication is available only via explicit hub_only override with Cedar PERMIT.

**XPID Cross-Cluster Integration** (§6): sub-agent XPIDs are derived from the parent XPID + sacr_id using KIA-03's UUID-v5 scheme. Cross-cluster federation can verify sub-agent identity chains without a trusted third party.

**Full R-1 through R-7 normative specifications** (§7): MAD-02 introduced the revocation trigger taxonomy but lacked per-trigger normative depth. MAD-03 adds complete completion state matrices (Table 1) and cascade behavior matrices (Table 2) for all seven triggers.

**Four new Security Considerations** (§15.8–15.11): cascade revocation timing attack; sub-agent scope inflation; XPID cross-cluster spoofing; partial completion race condition.

---

## Messages to key audiences

### IETF Working Groups

MAD-03's SACR mechanism is directly relevant to the OAUTH WG (sub-mandate issuance via the token exchange pattern, RFC 8693 profile), SECEVENT/SSF (the CAEP profile for agent-session-revoked events in §3.6.2 is the first such profile for AI agent session revocation), and GNAP (the delegation authority model has structural parallels to GNAP delegation chains).

The hub-only constraint (§5) is relevant to the nascent ANML and ACP discussions: it is the normative answer to the question "how do sub-agents coordinate in a SOOS cluster?" — and the answer is: through the kernel-governed hub, not directly.

XPID cross-cluster integration (§6) extends the KIA-03 XPID scheme to the delegation tree case. This is a concrete implementation of the RATS cross-domain correlation primitive within a multi-hop delegation chain — relevant to the RATS WG Vienna discussion.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

**SACR changes what you need to build.** If you're spawning sub-agents today, you're probably doing it by calling a model API with a scoped system prompt — with no kernel record of what scope you granted, no tool-subset invariant check, and no way to revoke the ephemeral identity independently of the session. SACR replaces this with:

- A kernel-witnessed composition event committed to GAR before the sub-agent starts
- Tool-subset validation at spawn time (the GEC checks your granted tools against your own tool access — you can't grant what you don't have)
- max_spawn_depth governance (prevents unbounded recursive spawning)
- An ephemeral KIA reference that can be revoked independently of the parent session

**hub_only: true is the default.** Your sub-agents cannot call each other. They call the hub, which calls the kernel. This means all sub-agent coordination is Cedar-evaluated and GAR-recorded. If you need direct sub-agent communication for latency reasons, you need an explicit hub_only: false override with a Cedar PERMIT for the specific communication type.

**R-1 through R-7 are now fully specified.** If you're implementing session revocation, Table 1 (completion state per trigger) and Table 2 (cascade behavior per trigger) are the normative references. R-1 and R-7 always produce PARTIAL, never CLEAN. R-3 produces UNKNOWN (treated as PARTIAL by INV-15). R-5 is the only trigger where CLEAN is achievable without natural breakpoint wait.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mad)

### Risk managers and legal

MAD-03 addresses three specific liability gaps from MAD-02:

**The spawning audit gap**: Before MAD-03, there was no kernel record of a sub-agent being created — only records of what it did. SACR produces a signed, tamper-evident composition record (ALE-SPAWN-01) before the sub-agent executes its first action. Post-incident reconstruction now includes the full spawning chain.

**The scope inflation gap**: Section 15.9 documents that a malicious spawning agent cannot inflate the scope it grants to sub-agents — the GEC atomically validates tool-subset and Cedar action-subset at SACR issuance time against the spawning agent's own verified scope. Agent-supplied scope claims are untrusted.

**The cascade timing gap**: Section 15.8 documents the cascade revocation timing attack and specifies that irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution. This closes the window between CASCADE_TO_DESCENDANTS authority revocation and session termination signal delivery.

For insurance underwriting: the completion state matrix (Table 1) provides a formal taxonomy of PARTIAL vs. CLEAN vs. UNKNOWN outcomes per revocation trigger. The cascade behavior matrix (Table 2) documents which triggers produce selective vs. full cascades. These are actuarially useful primitives for AI liability models.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MAD-03 (Multi-Agent Delegation, draft-sato-soos-mad-03). New in -03: Sub-Agent Composition Record (SACR), hub-only constraint, XPID cross-cluster integration, and full R-1 through R-7 revocation specs. SACR issuance flow: (1) spawning agent calls gec.spawnSubAgent() with proposed scope; (2) GEC validates tool-subset ⊆ parent tools; (3) GEC validates cedar_action_subset ⊆ parent actions (INV-4); (4) GEC checks max_spawn_depth ≤ parent_max_spawn_depth - 1; (5) GEC issues ephemeral_kia_ref and derives sub-agent XPID as UUID5(KIA_NS, parent_xpid + ':' + sacr_id); (6) GEC commits ALE-SPAWN-01 to GAR; (7) spawning agent issues Assignment with ephemeral_kia_ref as assigned_agent_id. Hub-only: default true — sub-agents MUST NOT send directly to siblings; Cedar action DirectSubAgentComm is blocked for hub_only: true sessions. R-1 completion = PARTIAL always; R-3 completion = UNKNOWN always (= PARTIAL per INV-15); R-7 completion = UNKNOWN always. See Table 1 for full completion matrix."

**Key SACR schema fields:**

| Field | Type | Description |
|---|---|---|
| `sacr_id` | UUID v4 | Primary key for this composition record |
| `parent_assignment_id` | string | Assignment that authorized this spawn |
| `ephemeral_kia_ref` | UUID v4 | Session-scoped identity; not a persistent Party Registry entry |
| `scope_constraints.tool_subset` | array | Tools granted; must be ⊆ parent's tool access |
| `scope_constraints.cedar_action_subset` | array | Actions granted; must satisfy INV-4 |
| `can_decompose` | boolean | May this sub-agent spawn children? Default: false |
| `max_spawn_depth` | integer | Strictly decrements per recursive level; 0 = leaf |
| `hub_only` | boolean | Default: true. Direct sibling comms prohibited when true |
| `replan_authority` | enum | NONE / BOUNDED / AUTONOMOUS |

**Sub-agent XPID derivation:**

```typescript
const KIA_XPID_NAMESPACE = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

function deriveSubAgentXPID(parentXpid: string, sacrId: string): string {
  return uuidv5(`${parentXpid}:${sacrId}`, KIA_XPID_NAMESPACE);
}
```

### Government and regulators

MAD-03's SACR and hub-only constraint are directly relevant to the 防災AX (disaster response AI) use case:

In a multi-agency disaster response scenario, a PM Office orchestrator spawns Coast Guard and SDF sub-agents under emergency conditions. SACR records every spawning event with the scope granted, the tool access issued, and the spawn depth. The hub-only constraint ensures all inter-agency coordination routes through the kernel-governed hub — producing a single, auditable coordination record. If any sub-agent's mandate is revoked (e.g., an R-1 CAP Tier 0-A violation is detected), the cascade behavior matrix (Table 2) defines precisely which other agents are affected.

For Law as Code engagement: the R-1 through R-7 trigger taxonomy maps directly to regulatory revocation conditions — each trigger class identifies which human authority must reauthorize continuation, providing a machine-readable governance hook for jurisdiction-specific revocation rules.

For collaboration: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Multi-agent AI systems spawn sub-agents without kernel oversight, create accountability black holes, and cannot reliably cascade revocation to all active sessions with a clear record of what happened to each.

**Mechanism:** MAD-03 adds SACR (kernel-witnessed spawning with tool-subset validation), hub-only coordination (all cross-sub-agent traffic through the kernel-governed hub), XPID cross-cluster identity correlation, and full per-trigger revocation specs including completion state and cascade behavior matrices.

**Output:** A complete, signed, tamper-evident delegation audit trail from the spawning event (ALE-SPAWN-01) through execution (ALE-013/014/015) to revocation (R-1 through R-7 events), reconstructable from the GAR record alone.

**Who verifies it:** Operators, auditors, regulators, and the human principals who issued the continuation mandate authority — anyone who needs to prove that the right human authorized each delegation level and that revocation reached every session in the tree.

---

## The SACR lifecycle

| Step | Actor | Action | GAR Record |
|---|---|---|---|
| **1 — Spawn request** | Spawning agent | Calls gec.spawnSubAgent() with scope proposal | — |
| **2 — Tool-subset check** | GEC | Validates tool_subset ⊆ parent tools | ALE-SPAWN-03 on violation |
| **3 — Cedar action check** | GEC | Validates cedar_action_subset ⊆ parent (INV-4) | MANDATE_NARROWING_VIOLATION on violation |
| **4 — Depth check** | GEC | Validates max_spawn_depth ≤ parent - 1 | ALE-SPAWN-02 on violation |
| **5 — Identity issuance** | GEC | Issues ephemeral_kia_ref; derives sub-agent XPID | — |
| **6 — SACR commit** | GEC | Signs SACR; commits ALE-SPAWN-01 | ALE-SPAWN-01 |
| **7 — Assignment** | Spawning agent | Issues Assignment with ephemeral_kia_ref as assigned_agent_id | ALE-013 |
| **8 — Execution** | Sub-agent | Executes under Assignment; hub-only enforced | Per-action events |
| **9 — Session close** | Sub-agent / GEC | Session closes; ephemeral_kia_ref retired | ALE-SPAWN-04 |

---

## The revocation trigger model

| Trigger | Condition | Completion | Cascade | Continuation authority |
|---|---|---|---|---|
| **R-1** | CAP Tier 0-A violation | PARTIAL always | Full | Human principal |
| **R-2** | Out-of-scope action | CLEAN (pre-exec) / PARTIAL | Full | Human principal |
| **R-3** | Non-response to signal | UNKNOWN (= PARTIAL) | Selective | Operator + notification |
| **R-4** | Irreversible threshold | CLEAN (pre) / PARTIAL | Full | Human principal |
| **R-5** | Scheduled rotation | CLEAN (at breakpoint) | None | Operator |
| **R-6** | Operator override | CLEAN / PARTIAL | Per scope | Operator + notification |
| **R-7** | DEADLOCK | UNKNOWN (= PARTIAL) | All participating | Human principal |

---

## Use cases

**Multi-agency disaster response with SACR governance**

A PM Office orchestrator agent (with max_spawn_depth: 3) spawns a Coast Guard sub-agent during a Fukushima scenario. The GEC issues the SACR: tool_subset is validated against the orchestrator's authorized tools; cedar_action_subset is validated against INV-4; max_spawn_depth for the Coast Guard agent is set to 2 (parent's 3 minus 1). The hub-only flag is true by default. All Coast Guard coordination with SDF sub-agents routes through the PM Office hub. ALE-SPAWN-01 is committed before Coast Guard executes its first action. When the response concludes, ALE-SPAWN-04 retires all ephemeral identities.

**Cascade revocation with completion state tracking**

A financial services orchestrator agent has spawned 5 specialist sub-agents for a multi-supplier payment workflow. During execution, the orchestrator's mandate triggers R-2 (scope boundary — it attempted an action outside its Cedar action set). The GEC detects this at Cedar DENY (Step 1) before execution. Completion state is CLEAN. CASCADE_TO_DESCENDANTS fires: all 5 specialist mandates are added to the Revocation Registry atomically. All 5 ALE-SPAWN-04 events are emitted with completion_state: CLEAN. Human principal reauthorization is required before continuation. GAR carries the full SACR chain for each specialist.

**XPID cross-cluster reconstruction**

A receiving GEC instance receives a governance event from a sub-agent operating in a different GEC trust domain. The event carries soos.governance.xpid. The receiving GEC requests the SACR from the originating GEC's SACR Registry via the federation channel, obtains the parent_xpid, recomputes the expected XPID as UUID5(KIA_NS, parent_xpid + ':' + sacr_id), and verifies it matches. A regulator later reconstructs the full delegation chain from the root orchestrator through every sub-agent level using only the XPID chain and the GAR records from both GEC instances.

---

## How this builds on existing work

**KIA-03 (draft-sato-soos-kia-03)** introduced the XPID primitive for cross-instance agent identity correlation. MAD-03 extends XPID into the delegation tree: sub-agent XPIDs chain from parent XPID + sacr_id, providing a cryptographically traceable lineage from the root orchestrator to any leaf sub-agent across GEC boundaries.

**HEM-05 (draft-sato-soos-hem-05)** added HEM-PRE-2 (pre-action confirmation for irreversible actions). MAD-03's cascade timing attack defense (Section 15.8) normatively references HEM-PRE-2: irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution, closing the cascade window for that action class.

**GAR-03 (draft-sato-soos-gar-03)** established the ALE framework. ALE-SPAWN-01 through ALE-SPAWN-04 are registered in MAD-03's IANA section and are recorded in the GAR governance span alongside the existing ALE-013 through ALE-016 delegation topology events.

---

## Security

**Key security properties:** INV-4 (Narrowing Property) is enforced at both SACR issuance time and mandate issuance time. SACR issuance is atomic: tool-subset, Cedar action-subset, and spawn-depth validation complete before any ephemeral identity is issued. The hub-only constraint prevents ungoverned inter-sub-agent communication. XPID chain verification requires the full SACR chain from a GEC-signed SACR Registry.

**Scope inflation (§15.9):** the GEC validates scope against the spawning agent's verified current access (from Revocation Registry + active mandate JWT), not from an agent-supplied claim. Tool-subset and Cedar action-subset checks are atomic with SACR issuance.

**Cascade timing (§15.8):** irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution. cascade_timeout MUST NOT exceed 30 seconds for single-region clusters.

**Formal analysis status:** No formal verification of SACR issuance atomicity or cascade revocation completeness has been conducted. Post-Vienna.

---

## SOOS stack context

MAD sits at **Level 3 — Governance**, coordinating across AEP (per-agent execution loop), SOV (governed object lifecycle), MJWT (delegation credentials including the consent_scope claim from MJWT-02), HEM (human oversight at delegation hops and SACR spawning), GAR (full delegation audit record including ALE-SPAWN events), CAP (prohibition floor at every delegation level), and KIA (XPID derivation for sub-agent identity and ephemeral KIA references).

Related drafts: [AEP](/drafts/aep) · [SOV](/drafts/sov) · [MJWT](/drafts/mjwt) · [HEM](/drafts/hem) · [GAR](/drafts/gar) · [CAP](/drafts/cap) · [KIA](/drafts/kia)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mad)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
