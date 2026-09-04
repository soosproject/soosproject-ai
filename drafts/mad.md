# Multi-Agent Delegation

Layer 3 — Governance
**draft-sato-soos-mad-04**
See the full draft protocol at [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
See [SOOS Stack](/stack) implementation

---

## The problem

Multi-agent AI systems produce accountability black holes. Which agent caused which state change? Under whose authority? If the coordinating agent's mandate is revoked, do the specialist agents it spawned also stop? If a specialist attempts to act beyond its scope, can that excess propagate?

Without a delegation governance protocol, these questions are unanswerable at runtime. MAD closes the gap at three layers: authority narrowing (sub-agents can never acquire capabilities their orchestrators don't hold), cascade revocation (one decision stops the entire delegation tree), and governed sub-agent spawning (the tree's creation is itself auditable).

**The design premise:** the accountability chain must be reconstructable from the GEC-signed audit record alone. If it can't be reconstructed, it doesn't count as governance.

---

## What's new in MAD-04

**R-8 (Compromise) — an eighth revocation trigger class.** Surfaced while mapping MAD's own taxonomy onto the Mandate Lifecycle Events (MLE) profile's `reason: compromise` value, which had no R-code counterpart until now. R-8 fires on a suspected or confirmed external attack against a mandate or its credential — a KIA reattestation failure, a CAEP RISC compromise signal, or an operator-reported finding. Unlike every other trigger, R-8 has **no timeout-and-recover mechanism**: the GEC halts immediately, with no natural-breakpoint wait and no `deadlock_timeout`-style auto-recovery window the way R-7 has. That urgency is deliberate, and it creates a new, named attack surface (below).

**A new Security Considerations entry names the tradeoff R-8 creates (§15.12).** Because R-8 revocation is immediate and unconditional, an entity able to inject a *false* detection signal — a spoofed CAEP RISC event, a manipulated KIA reattestation result, a fabricated operator report — can trigger an unconditional, immediately-cascading revocation of a legitimate session and its entire descendant tree, with no bounded-damage recovery window the way R-7's timeout provides. The document now requires independent verification of any `detection_source` signal against the signing authority's own key material before committing an R-8 revocation, and flags repeated operator-reported findings against the same principal as warranting their own investigation — since that's the one detection source with no independent machine verification available at all.

**The BCP14 boilerplate gap from -03, found and fixed.** -03 shipped with a literal bracket placeholder instead of the actual RFC2119/8174 requirement-levels text. -04 reconstructs it from -02's original wording — a genuine drafting defect, not a style change, and one that's easy to miss because a *missing* boilerplate paragraph doesn't look wrong the way a malformed one does.

**Completion State Matrix and Cascade Behavior Matrix updated** with an R-8 row: PARTIAL or UNKNOWN completion (never CLEAN — R-8 is the second trigger, alongside R-7, that structurally cannot resolve clean), full `CASCADE_TO_DESCENDANTS`, human principal reauthorization required.

---

## Messages to key audiences

### IETF Working Groups

MAD's SACR mechanism is directly relevant to the OAUTH WG (sub-mandate issuance via the token exchange pattern, RFC 8693 profile), SECEVENT/SSF (the CAEP profile for agent-session-revoked events in §3.6.2 is the first such profile for AI agent session revocation), and GNAP (the delegation authority model has structural parallels to GNAP delegation chains).

The hub-only constraint (§5) is relevant to the nascent ANML and ACP discussions: it is the normative answer to the question "how do sub-agents coordinate in a SOOS cluster?" — and the answer is: through the kernel-governed hub, not directly.

XPID cross-cluster integration (§6) extends KIA's XPID scheme to the delegation tree case. This is a concrete implementation of the RATS cross-domain correlation primitive within a multi-hop delegation chain — relevant to the RATS WG's ongoing discussion.

R-8's mapping onto the Mandate Lifecycle Events (MLE) `reason: compromise` value is a live cross-draft consistency point: any implementation tracking both MAD's R-code taxonomy and an MLE-based external event feed now has a normative mapping for the compromise case specifically.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-mad/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

**If you handle compromise events, R-8 needs its own code path — you cannot reuse your R-7 (DEADLOCK) handling.** R-7 has a `deadlock_timeout` and an auto-recovery path; R-8 has neither. On detection, the GEC halts the session immediately, cascades to every descendant mandate unconditionally, and requires explicit human principal reauthorization — the operator MUST NOT issue a continuation mandate on R-8 without it, and MUST NOT reuse the compromised credential or anything derived from the same key material.

**Verify your `detection_source` signals, or you've built a denial-of-service switch.** Because R-8 has no recovery window, whatever can inject a convincing compromise report can take down a legitimate session and its whole descendant tree with no bounded blast radius. If you're consuming CAEP RISC signals or KIA reattestation results as R-8 triggers, verify them against the signing authority's own key material — not transport-layer trust. If you're accepting operator-reported compromise findings, treat repeated reports against the same principal or agent as worth investigating in their own right, since there's no independent machine verification for that source at all.

**SACR still changes what you need to build for spawning.** If you're spawning sub-agents today, you're probably doing it by calling a model API with a scoped system prompt — with no kernel record of what scope you granted, no tool-subset invariant check, and no way to revoke the ephemeral identity independently of the session. SACR replaces this with a kernel-witnessed composition event committed to GAR before the sub-agent starts, tool-subset validation at spawn time, `max_spawn_depth` governance, and an ephemeral KIA reference revocable independently of the parent session.

**`hub_only: true` is the default.** Your sub-agents cannot call each other. They call the hub, which calls the kernel. All sub-agent coordination is Cedar-evaluated and GAR-recorded. Direct sub-agent communication needs an explicit `hub_only: false` override with a Cedar PERMIT for the specific communication type.

**R-1 through R-8 are all now fully specified.** Table 1 (completion state per trigger) and Table 2 (cascade behavior per trigger) are the normative references. R-1, R-7, and now R-8 always produce PARTIAL or UNKNOWN, never CLEAN. R-5 is the only trigger where CLEAN is achievable without a natural-breakpoint wait.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/mad)

### Risk managers and legal

**A new, named liability asymmetry.** R-8's own text is direct about this: an unconditional, no-recovery-window trigger is also an unconditional, no-recovery-window attack surface. Before -04, this tradeoff existed implicitly the moment R-8-style urgency was contemplated; now it's documented, with a specific mitigation (independent signal verification) rather than left for an implementer to discover during an actual incident.

**Three liability gaps MAD-03 already closed, still current:** the spawning audit gap (SACR produces a signed composition record — ALE-SPAWN-01 — before a sub-agent's first action, not just a record of what it later did); the scope inflation gap (§15.9 — the GEC validates tool-subset and Cedar action-subset at SACR issuance against the spawning agent's own verified access, never an agent-supplied claim); and the cascade timing gap (§15.8 — irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution).

For insurance underwriting: the completion state matrix (Table 1) now covers eight trigger classes with a formal PARTIAL / CLEAN / UNKNOWN taxonomy, and the cascade behavior matrix (Table 2) documents which triggers produce selective vs. full cascades. R-1, R-7, and R-8 are the three that can never resolve CLEAN — worth flagging as the highest-severity class for actuarial purposes.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS MAD-04 (Multi-Agent Delegation, draft-sato-soos-mad-04). Revocation trigger classes are R-1 through R-8. R-8 (Compromise) is distinct from every other trigger: it fires on a suspected or confirmed external attack (KIA reattestation failure, CAEP RISC signal, or operator report), halts the session immediately with NO natural-breakpoint wait and NO timeout-based auto-recovery (unlike R-7's deadlock_timeout), cascades unconditionally to every descendant mandate, and requires explicit human principal reauthorization before any continuation mandate — never reuse the compromised credential or anything derived from the same key material. Before committing an R-8 revocation, independently verify the detection_source signal against the signing authority's own key material; do not trust transport-layer authentication alone, since R-8's lack of a recovery window makes a forged detection signal a denial-of-service vector. R-8 completion state is PARTIAL or UNKNOWN, never CLEAN. SACR issuance flow: (1) spawning agent calls gec.spawnSubAgent() with proposed scope; (2) GEC validates tool-subset is a subset of parent tools; (3) GEC validates cedar_action_subset is a subset of parent actions (INV-4); (4) GEC checks max_spawn_depth <= parent_max_spawn_depth - 1; (5) GEC issues ephemeral_kia_ref and derives sub-agent XPID as UUID5(KIA_NS, parent_xpid + ':' + sacr_id); (6) GEC commits ALE-SPAWN-01 to GAR; (7) spawning agent issues Assignment with ephemeral_kia_ref as assigned_agent_id. Hub-only default true: sub-agents MUST NOT send directly to siblings; Cedar action DirectSubAgentComm is blocked for hub_only: true sessions."

**Key SACR schema fields:**

| Field | Type | Description |
|---|---|---|
| `sacr_id` | UUID v4 | Primary key for this composition record |
| `parent_assignment_id` | string | Assignment that authorized this spawn |
| `ephemeral_kia_ref` | UUID v4 | Session-scoped identity; not a persistent Party Registry entry |
| `scope_constraints.tool_subset` | string[] | Tools granted; must be a subset of parent's tool access |
| `scope_constraints.cedar_action_subset` | string[] | Actions granted; must satisfy INV-4 |
| `can_decompose` | boolean | May this sub-agent spawn children? Default: false |
| `max_spawn_depth` | integer | Strictly decrements per recursive level; 0 = leaf |
| `hub_only` | boolean | Default: true. Direct sibling comms prohibited when true |
| `replan_authority` | enum | NONE / BOUNDED / AUTONOMOUS |

**R-8 detection sources and their verification requirement:**

| `detection_source` | Independently verifiable? | Requirement |
|---|---|---|
| `KIA_REATTESTATION_FAILURE` | Yes | MUST verify against signing authority's key material |
| `CAEP_RISC_SIGNAL` | Yes | MUST verify against signing authority's key material |
| `OPERATOR_REPORTED` | No | SHOULD treat repeated reports against the same principal/agent as warranting investigation |

**Sub-agent XPID derivation:**

```typescript
const KIA_XPID_NAMESPACE = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

function deriveSubAgentXPID(parentXpid: string, sacrId: string): string {
  return uuidv5(`${parentXpid}:${sacrId}`, KIA_XPID_NAMESPACE);
}
```

### Government and regulators

MAD's SACR and hub-only constraint are directly relevant to the 防災AX (disaster response AI) use case: in a multi-agency disaster response scenario, a coordinating orchestrator spawns specialist sub-agents under emergency conditions. SACR records every spawning event with the scope granted, the tool access issued, and the spawn depth. The hub-only constraint ensures all inter-agency coordination routes through the kernel-governed hub — producing a single, auditable coordination record.

R-8 is directly relevant to any scenario involving credential compromise under adversarial conditions — a plausible concern in emergency-response and defense-adjacent deployments specifically. The requirement that a human principal must explicitly reauthorize after any R-8 event, and the explicit prohibition on reusing the compromised credential or derived key material, gives regulators a clear, machine-readable checkpoint for compromise-response compliance.

For Law as Code engagement: the R-1 through R-8 trigger taxonomy maps directly to regulatory revocation conditions — each trigger class identifies which human authority must reauthorize continuation, providing a machine-readable governance hook for jurisdiction-specific revocation rules.

For collaboration: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Multi-agent AI systems spawn sub-agents without kernel oversight, create accountability black holes, and cannot reliably cascade revocation — including under adversarial compromise conditions — to all active sessions with a clear record of what happened to each.

**Mechanism:** MAD adds SACR (kernel-witnessed spawning with tool-subset validation), hub-only coordination (all cross-sub-agent traffic through the kernel-governed hub), XPID cross-cluster identity correlation, and full per-trigger revocation specs — including completion state and cascade behavior matrices — for all eight trigger classes, R-1 through R-8.

**Output:** A complete, signed, tamper-evident delegation audit trail from the spawning event (ALE-SPAWN-01) through execution (ALE-013/014/015) to revocation (R-1 through R-8 events, including `COMPROMISE_REVOCATION` for R-8), reconstructable from the GAR record alone.

**Who verifies it:** Operators, auditors, regulators, and the human principals who issued the continuation mandate authority — anyone who needs to prove that the right human authorized each delegation level, that revocation reached every session in the tree, and that a compromise revocation was itself triggered by a genuine signal rather than a forged one.

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
| **R-8** | Compromise | PARTIAL or UNKNOWN, never CLEAN | Full, immediate, no recovery window | Human principal (explicit; no credential reuse) |

---

## Use cases

**Compromise response with signal verification**

A financial services deployment's KIA layer reports a reattestation failure for an orchestrator agent's runtime identity. Before committing an R-8 revocation, the GEC independently verifies the reattestation result against KIA's own signing key material — confirming it wasn't a spoofed signal injected at the transport layer. Verification succeeds; the GEC halts the session immediately, emits `COMPROMISE_REVOCATION` with the detection source, cascades to all descendant mandates unconditionally, and records `CONTINUATION_AWAITING_PRINCIPAL`. No continuation mandate is issued until the human principal explicitly reauthorizes — and the reissued mandate uses entirely new key material, never anything derived from the compromised credential.

**Multi-agency disaster response with SACR governance**

A coordinating orchestrator agent (with max_spawn_depth: 3) spawns a specialist sub-agent during an emergency scenario. The GEC issues the SACR: tool_subset is validated against the orchestrator's authorized tools; cedar_action_subset is validated against INV-4; max_spawn_depth for the specialist is set to 2 (parent's 3 minus 1). The hub-only flag is true by default — all specialist coordination routes through the coordinating hub. ALE-SPAWN-01 is committed before the specialist executes its first action. When the response concludes, ALE-SPAWN-04 retires all ephemeral identities.

**Cascade revocation with completion state tracking**

A financial services orchestrator agent has spawned 5 specialist sub-agents for a multi-supplier payment workflow. During execution, the orchestrator's mandate triggers R-2 (scope boundary — it attempted an action outside its Cedar action set). The GEC detects this at Cedar DENY (Step 1) before execution. Completion state is CLEAN. CASCADE_TO_DESCENDANTS fires: all 5 specialist mandates are added to the Revocation Registry atomically. All 5 ALE-SPAWN-04 events are emitted with completion_state: CLEAN. Human principal reauthorization is required before continuation. GAR carries the full SACR chain for each specialist.

**XPID cross-cluster reconstruction**

A receiving GEC instance receives a governance event from a sub-agent operating in a different GEC trust domain. The event carries soos.governance.xpid. The receiving GEC requests the SACR from the originating GEC's SACR Registry via the federation channel, obtains the parent_xpid, recomputes the expected XPID as UUID5(KIA_NS, parent_xpid + ':' + sacr_id), and verifies it matches. A regulator later reconstructs the full delegation chain from the root orchestrator through every sub-agent level using only the XPID chain and the GAR records from both GEC instances.

---

## How this builds on existing work

**KIA (draft-sato-soos-kia)** introduced the XPID primitive for cross-instance agent identity correlation. MAD extends XPID into the delegation tree: sub-agent XPIDs chain from parent XPID + sacr_id, providing a cryptographically traceable lineage from the root orchestrator to any leaf sub-agent across GEC boundaries. R-8's `KIA_REATTESTATION_FAILURE` detection source is a direct KIA integration point.

**HEM (draft-sato-soos-hem)** added HEM-PRE-2 (pre-action confirmation for irreversible actions). MAD's cascade timing attack defense (Section 15.8) normatively references HEM-PRE-2: irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution, closing the cascade window for that action class. HEM_TIER0_OBSERVED (HEM Class 6) is the escalation class R-8 shares with R-1.

**GAR (draft-sato-soos-gar)** established the ALE framework. ALE-SPAWN-01 through ALE-SPAWN-04 are registered in MAD's IANA section and are recorded in the GAR governance span alongside the existing ALE-013 through ALE-016 delegation topology events and the new `COMPROMISE_REVOCATION` event.

**Mandate Lifecycle Events (MLE)**, a SOOS-adjacent companion profile, uses a `reason: compromise` value that had no corresponding R-code in MAD before -04. R-8 closes that mapping gap.

---

## Security

**Key security properties:** INV-4 (Narrowing Property) is enforced at both SACR issuance time and mandate issuance time. SACR issuance is atomic: tool-subset, Cedar action-subset, and spawn-depth validation complete before any ephemeral identity is issued. The hub-only constraint prevents ungoverned inter-sub-agent communication. XPID chain verification requires the full SACR chain from a GEC-signed SACR Registry.

**Compromise report false-positive as a denial-of-service vector (§15.12, new):** R-8's immediate, unconditional, no-recovery-window revocation is deliberate given the threat model — but it means a forged `detection_source` signal is also an immediate, unconditional, no-recovery-window attack. Implementations MUST independently verify `CAEP_RISC_SIGNAL` and `KIA_REATTESTATION_FAILURE` detection sources against the signing authority's own key material rather than transport-layer trust. `OPERATOR_REPORTED` findings have no independent machine verification path at all; operators SHOULD treat repeated reports against the same principal or agent as warranting their own investigation.

**Scope inflation (§15.9):** the GEC validates scope against the spawning agent's verified current access (from Revocation Registry + active mandate JWT), not from an agent-supplied claim. Tool-subset and Cedar action-subset checks are atomic with SACR issuance.

**Cascade timing (§15.8):** irreversible actions require a Revocation Registry check via HEM-PRE-2 before execution. cascade_timeout MUST NOT exceed 30 seconds for single-region clusters.

**Formal analysis status:** No formal verification of SACR issuance atomicity, cascade revocation completeness, or R-8's signal-verification requirement has been conducted.

---

## SOOS stack context

MAD sits at **Level 3 — Governance**, coordinating across AEP (per-agent execution loop), SOV (governed object lifecycle), MJWT (delegation credentials including the consent_scope claim), HEM (human oversight at delegation hops, SACR spawning, and R-8 escalation), GAR (full delegation audit record including ALE-SPAWN events and COMPROMISE_REVOCATION), CAP (prohibition floor at every delegation level), and KIA (XPID derivation for sub-agent identity, ephemeral KIA references, and R-8 reattestation-failure detection).

Related drafts: [AEP](/drafts/aep) · [SOV](/drafts/sov) · [MJWT](/drafts/mjwt) · [HEM](/drafts/hem) · [GAR](/drafts/gar) · [CAP](/drafts/cap) · [KIA](/drafts/kia)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/mad)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-mad/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
