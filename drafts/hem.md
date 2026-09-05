# Human Escalation Mechanism

Layer 3 — Governance
**draft-sato-soos-hem-07**
See the full draft protocol at [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-hem/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems fail in a specific way: they keep going when they should stop and ask.

HEM defines the protocol by which a SOOS kernel recognises that a governed execution has reached a decision point beyond the agent's authority — and transfers control to a human principal. Not as a policy preference. As a normative requirement, with a defined trigger taxonomy, a class-based escalation model, and an auditable record.

But the second failure mode is subtler: even when the right human is reached, the interaction itself can fail. The options presented can be framed manipulatively. Approval fatigue can cause rubber-stamp sign-offs. An agent's declared reasoning may diverge from its actual action without anyone noticing. Capability limitations may go undisclosed. Consent may be assumed rather than obtained.

**The design premise:** escalation is not a failure mode — it is a capability. And the interaction between kernel and human principal is itself a protocol surface that must be governed.

---

## What's new in HEM-06

*(-07 is an editorial-only revision over -06 — idnits formatting nits, no content changes. Everything below describes -06's content, which -07 carries forward unchanged.)*

The headline change isn't a new feature — it's that HEM-06 is the first version of this document where the baseline it always claimed to have is actually present. HEM-05, as submitted, carried bracket placeholders instead of body text for most of what it claimed to "carry forward from HEM-04": the base Escalation Request format, all six Decision Types, the Transition Prohibition rules, the entire Timeout Model (including the AUTO_APPROVE hard-prohibition), the Event Log base sequence, Privacy Considerations, the EU AI Act Article 14 mapping table, and all seven IANA registries. HEM-06 reconstructs every one of those sections from the actual HEM-04 text, and in doing so caught real bugs that had been sitting invisible inside the placeholders: a self-contradictory description of HRS persistence, a "five decision types" miscount inherited from -04 (HEM has always had six), and two wrong section cross-references.

On top of that restoration, -06 adds genuinely new normative content:

- **Joined-verification requirement (§12.8)**: a resolved HEM decision's own signature covers `hem_id`, `principal_id`, `decision`, and `timestamp` — not the action's arguments or target resource. A party relying on a decision as evidence that a human authorized one *specific* action must now verify that signature together with the kernel's own signature over the escalation request the `hem_id` identifies. This closes a gap where exact-action binding was real but only indirect.
- **Explicit at-most-once enforcement**: a new `HEM_ALREADY_RESOLVED` error code makes replay rejection a named, testable MUST, and corrects an earlier claim that signature verification alone prevented replay — it doesn't; the state machine does.
- **DoS rate-limiting widened**: the original rate-limiting requirement only covered `HEM_AGENT_ESCALATED` (Class 2); HEM-DIV-1 and HEM-PRE-1 had no bound. Two new requirements close that.
- **OQ-HEM-XDOMAIN scope widened**: prompted by external review against `draft-reece-wimse-cross-org-delegation`, this open item now covers both cross-domain state propagation and designation/evidence portability.

HEM-05's own additions — carried forward unchanged — remain: ten **interaction classes** governing the GEC-human interaction surface before, during, and after `HEM_PENDING` events, distinct from the trigger classes that determine *when* escalation fires; **INV-HEM-01 (The Surfacing Obligation)**, a KernelSpec invariant prohibiting suppression of governance-relevant information by any party; the **Human Readiness Score (HRS)**, a kernel-computed composite reflecting a principal's capacity for well-informed, timely, unconflicted decision-making; the normative HEM interface for CAP-05's three Tier 0-A absolute prohibitions (MANIPULATION, PERFORMED_EMOTION, BIOMETRIC_SIGNAL_INFERENCE); and five Security Considerations entries covering the HEM channel attack surface.

---

## Messages to key audiences

### IETF Working Groups

HEM's execution-time human authorization mechanism (HEM-HIGH-1, Section 7.5.1) is a live existence proof for R10 in `draft-reece-wimse-cross-org-delegation-01` — the WIMSE requirement that a delegated authority be able to designate action classes as needing evidence of a decision from an accountable human approver distinct from the executing agent, offline-verifiable, bound to the exact action, and relied upon at most once. HEM-06 grades cleanly against most of R10's clauses and closes two real gaps this revision: exact-action binding is now backed by the joined-verification requirement, and at-most-once reliance is now a named MUST with its own error code rather than an implied property of the state machine.

One clause is honestly still open: whether a HEM-HIGH-1 classification made by one organization's CAP Profile is honored by another organization's kernel when a delegated action crosses that boundary — the cross-organizational case R10 is specifically about. This is the same clause both existing R10 implementations discussed on the WIMSE list (EMILIA, OASNT) also found only partially satisfiable. Tracked as OQ-HEM-XDOMAIN, deferred pending PEER's own cross-principal authorization work.

To engage on HEM: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-hem/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

HEM-04 closed the gap on when to escalate. HEM-06 closes the gap on how to interact when you do — and, as of this revision, actually contains the baseline it always claimed to.

The ten interaction classes translate directly to implementation work:

**HEM-PRE-1/2**: Before any irreversible action, your agent now has a normative protocol for asking the human principal to clarify their intent or confirm the action. This replaces ad-hoc "are you sure?" patterns with a GEC-enforced, auditable, signed interaction.

**HEM-DS-1**: When presenting options during an escalation, you must follow the neutrality requirements — no primacy/recency manipulation, no evaluative language in consequence summaries, no hidden preference shaping. The GEC validates the framing before delivery.

**HEM-LIM-1**: When your agent is operating outside its reliable competence (IDP `reasoning_mode: OUT_OF_DISTRIBUTION`), the GEC is now required to surface that limitation to the human before execution. You cannot proceed silently past a competence boundary.

**HEM-HIGH-1**: Actions in medical, aviation, and nuclear domains now have mandatory human review regardless of Cedar permit. If you're building in those domains, this is your Article 14 compliance mechanism.

**HEM-FAT-1**: If your principal is rubber-stamping approvals — 3-second decision times, identical consecutive choices, no DRR submissions — the GEC detects it and enforces a mandatory rest period. Your audit trail gets a fatigue detection entry. Build your approval UI with this in mind.

**HEM-CONSENT**: Absent or expired MJWT `consent_scope` now routes to a consent escalation class with fail-closed behavior. No implicit consent. No timeout-to-approval. Every consent gap is an explicit event in the audit record.

One thing worth building correctly the first time: if any part of your system relies on a resolved HEM decision as proof that a human authorized a *specific* action, verify the decision's signature together with the kernel's signature over the escalation request it references — the decision signature alone only proves someone approved *an* escalation with that `hem_id`, not which action it was for.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/hem)

### Risk managers and legal

HEM-06 closes five specific liability gaps that HEM-04 left open — and, per the reconstruction above, actually contains the baseline that closes several others that HEM-05's text claimed to but didn't:

**Rubber-stamp approval**: HEM-FAT-1 detects when a human principal's approval pattern indicates inattentive review and enforces a mandatory rest period. The audit record distinguishes genuine oversight from nominal compliance.

**Undisclosed capability limitations**: HEM-LIM-1 creates a normative requirement that capability limitations be surfaced to human principals before execution. An agent that exceeds its competence boundary silently is a conformance violation.

**Manipulation via escalation channel**: Section 18.10 specifies that the HEM channel itself must be governed against cognitive bias exploitation. An agent cannot manipulate the framing of its own escalation request.

**Consent lifecycle**: HEM-CONSENT with APPI Article 17 binding and fail-closed timeout semantics closes the gap between token-level consent claims and runtime consent verification.

**Divergence without disclosure**: HEM-DIV-1 requires that when an agent departs from its declared IDP path, the Deliberation Record is committed to GAR before the human principal is asked to approve the divergent path.

For insurance underwriting of AI-driven processes: the HRS (Section 8) provides a behavioral readiness metric for human oversight principals that can inform actuarial models for human oversight failure risk.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS HEM (Human Escalation Mechanism, draft-sato-soos-hem-07 — an editorial revision of -06 with no content changes). This extends HEM-04 with ten interaction classes. HEM-PRE-1 fires when an action requires pre-execution clarification; HEM-PRE-2 fires when confirmation is required before an irreversible action. HEM-DS-1 governs how option sets must be presented neutrally during escalation. HEM-LIM-1 fires when the agent is OUT_OF_DISTRIBUTION and must surface that limitation before proceeding. HEM-DIV-1 fires when the agent's actual transition request diverges from its declared IDP intent — it requires a Deliberation Record committed to GAR before any human decision. HEM-HIGH-1 fires for actions in Category A domains (MEDICAL, AVIATION, NUCLEAR) — mandatory review, DRR required. HEM-FAT-1 fires when the Human Readiness Score drops below HRS_FATIGUE_FLOOR (default 0.40) with secondary fatigue signals — blocks approvals, enforces 30-minute rest. HEM-EMO-1 is advisory only — no HEM_PENDING, just a notification. HEM-CONSENT fires when MJWT consent_scope is absent or expired for a consent-gated action — fail-closed, APPI Article 17 binding. All ten classes emit GAR ALEs (ALE-030 through ALE-041). INV-HEM-01 requires the GEC to surface all governance-relevant information — suppression by any party is a conformance violation. A resolved HEM decision's signature covers hem_id, principal_id, decision, and timestamp only — verify it jointly with the kernel's signature over the escalation request to bind to a specific action. A decision resubmitted against an already-resolved hem_id MUST be rejected with HEM_ALREADY_RESOLVED."

**Key schema additions in HEM-06:**

| Field | Type | Description |
|---|---|---|
| `interaction_class` | string | HEM interaction class code (e.g., "HEM-PRE-2", "HEM-HIGH-1") |
| `limitation_declaration` | object | HEM-LIM-1: limitation type, IDP confidence level, competence floor |
| `deliberation_record` | object | HEM-DIV-1: declared vs attempted action, option set, prior IDP chain |
| `consent_escalation` | object | HEM-CONSENT: regulatory basis, required/present purpose codes |
| `options_presentation` | object | HEM-DS-1: option array with neutrality certificate |
| `hrs_at_escalation` | number | HRS value at time of escalation (0.0–1.0) |

**HRS default thresholds:**

| Threshold | Default | Effect |
|---|---|---|
| `HRS_FATIGUE_FLOOR` | 0.40 | HEM-FAT-1 fires (with secondary signals) |
| `HRS_EMOTIONAL_ADVISORY_FLOOR` | 0.35 | HEM-EMO-1 advisory fires |
| `HRS_WARNING_THRESHOLD` | 0.55 | GAR warning logged; no action blocked |

**Minimal Cedar policy for HEM-HIGH-1:**

```cedar
// Mandatory human review for medical domain actions
forbid (
  principal,
  action == Action::"AdvanceChemotherapyCycle",
  resource
)
when {
  context.hem_required == true &&
  !context.human_approval_present
};

// Annotation for GEC interaction class routing
@hem_interaction_class("HEM-HIGH-1")
@high_stakes_domain("MEDICAL")
```

### Government and regulators

HEM-06 maps to EU AI Act Article 14 at five distinct points:

- **Article 14(3)(b)** (AI system capabilities and limits): HEM-LIM-1 creates a normative requirement that capability limitations be surfaced before execution.
- **Article 14(3)(d)** (high-risk domain oversight): HEM-HIGH-1 provides the mandatory review mechanism for the medical, aviation, and nuclear domains with a non-operator-configurable domain registry.
- **Article 14(4)(b)** (preventing over-reliance): HEM-FAT-1 detects and blocks rubber-stamp approval patterns.
- **Article 13(1)** (transparency): INV-HEM-01 prohibits suppression of governance-relevant information by any party.
- **Article 14(4)(d)** (deciding not to use output): the `HEM_PENDING` transition prohibition and TERMINATE decision type remain the technical stop capability.

For Japan specifically: HEM-CONSENT provides APPI Article 17 binding for consent-required escalations. HEM-06 was designed with the 防災AX (disaster response AI) use case in view, where consent lifecycle management during crisis response is a live regulatory concern.

For collaboration on jurisdiction-specific interaction class requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents make consequential decisions autonomously, and even when human oversight is invoked, the interaction surface between kernel and human principal is unspecified — leaving room for manipulation, fatigue, undisclosed limitations, and silent divergence.

**Mechanism:** HEM-06 specifies ten normative interaction classes governing the structure, required fields, available decision types, and audit entries for every category of GEC-human interaction. The Human Readiness Score tracks principal capacity continuously. INV-HEM-01 prohibits suppression by any party.

**Output:** A complete, signed, tamper-evident record of every human oversight interaction — not just escalation trigger and decision, but clarification requests, option presentations, limitation disclosures, fatigue detection events, and consent lifecycle events.

**Who verifies it:** Risk managers, compliance teams, regulators, and auditors — anyone who needs to prove that human oversight was substantive, not nominal, at every point in the governance chain.

---

## The escalation trigger class model

| Class | Trigger condition | Kernel response |
|---|---|---|
| **Class 1** | Prohibited action detected — CAP Tier 0-A violation | Immediate halt. No discretion. |
| **Class 2** | Scope boundary — action outside mandate | Halt. Cedar DENY. |
| **Class 3** | Principal conflict — contradictory instructions | Escalation before proceeding. |
| **Class 4** | Irreversible action threshold exceeded | Escalation required. |
| **Class 5** | Uncertainty threshold below mandate floor | Escalation or halt. |
| **Class 6** | Novel context — environment materially different | Escalation. |
| **Class 7** | Time budget exhausted | BUDGET_EXHAUSTED → HEM trigger. |
| **Class 8** | Multi-principal required | HEM_MULTI_PRINCIPAL_REQUIRED. |
| **Class 9** | Operator override | Escalation before action. |
| **Class 10** | Budget exhausted | Hard stop. HEM_PENDING. |

---

## The interaction class model (new in HEM-05, baseline restored in HEM-06)

| Class | Group | Trigger | Blocks execution? | GAR ALE |
|---|---|---|---|---|
| **HEM-PRE-1** | Pre-Action | Clarification needed before execution | Yes | ALE-030/031 |
| **HEM-PRE-2** | Pre-Action | Irreversible action confirmation required | Yes | ALE-032/033 |
| **HEM-DS-1** | Decision Support | Options set in escalation request | Neutrality check | ALE-034/035 |
| **HEM-DS-2** | Decision Support | Principal inactive during HEM_PENDING | No (reminder) | ALE-034/035 |
| **HEM-LIM-1** | Limitation | Agent OUT_OF_DISTRIBUTION | Yes | ALE-036/037 |
| **HEM-DIV-1** | Divergence | IDP commitment gap / PLAN_B_ACTIVE | Divergent path only | ALE-038/039 |
| **HEM-HIGH-1** | High-Stakes | Category A/B domain action | Yes (mandatory) | ALE-040 |
| **HEM-FAT-1** | Fatigue | HRS < 0.40 + secondary signals | Blocks approvals | ALE-034/035 |
| **HEM-EMO-1** | Emotional | HRS emotional_state < 0.35 | No (advisory) | ALE-036 |
| **HEM-CONSENT** | Consent | MJWT consent_scope absent or expired | Yes (fail-closed) | ALE-040/041 |

---

## Use cases

**Medical domain mandatory review — HEM-HIGH-1**

A clinical coordination agent is about to advance a chemotherapy cycle. The action is Cedar-permitted under the current mandate. The SO Type designates the action with `high_stakes_domain: "MEDICAL"`. HEM-HIGH-1 fires. Execution halts. The GEC routes the mandatory review to the oncologist of record — not to a general approval queue. The oncologist reviews the lab context and issues APPROVE_WITH_CONSTRAINTS with a timing window. A DRR with `safety_basis` is required. The GAR record carries ALE-040 with `domain_category: "CATEGORY_A"`. This interaction is Article 14(3)(d) compliance at the protocol level.

**Approval fatigue in enterprise procurement — HEM-FAT-1**

An enterprise procurement agent generates 40 HEM-PRE-2 confirmation requests in 90 minutes. After the 37th approval, the GEC's HRS computation detects that the approver's decision latency has dropped from 45 seconds to under 3 seconds and D2 (Decision Variance) is near 0. The HRS drops below 0.40. HEM-FAT-1 fires. The approval queue is suspended. A fatigue advisory is issued to the approver. A 30-minute mandatory rest period is enforced. ALE-034 (with `fatigue_flag: true`) is committed to GAR. When the rest period expires, ALE-035 is emitted and pending escalations are re-presented.

**Consent renewal for returning guest — HEM-CONSENT**

A hospitality agent operating under MyAuberge K.K.'s ATP booking system attempts to access a returning guest's preference profile. The session MJWT `consent_scope.expiry` is past. HEM-CONSENT fires. The preference data access is blocked. The GEC routes a consent renewal request to the guest through their registered contact channel (LINE Messaging API). The guest renews consent; the GEC updates `consent_scope`; execution resumes. ALE-041 is committed with `resolution: CONSENT_OBTAINED` and `consent_basis: "APPI_ART17_RENEWED"`. If the guest does not respond within the timeout, ALE-041 carries `resolution: TIMEOUT_DENY`. No implicit consent.

---

## How this builds on existing work

**CAP-05 (draft-sato-soos-cap-05)** introduced three Tier 0-A absolute prohibitions: MANIPULATION, PERFORMED_EMOTION, and BIOMETRIC_SIGNAL_INFERENCE. HEM-06 Section 9 specifies the normative HEM interface for each. The key design: MANIPULATION and PERFORMED_EMOTION violations are CEE-refused before HEM fires — there is no HEM decision type that can authorize them. BIOMETRIC_SIGNAL_INFERENCE is consent-gated — absence of consent triggers HEM-CONSENT. Also worth knowing: CAP-05's own Security Considerations disclose a gap on the other side of this same boundary — CAP's MANIPULATION test is a Cedar action_pattern match with no built-in way to catch IDP-content suppression crafted specifically to dodge a HEM interaction class (INV-HEM-01(e)); CAP requires an operator-configured external classifier to close it, and treats that as a genuine open dependency rather than a solved problem.

**MJWT-05 (draft-sato-soos-mjwt-05)** introduced the `consent_scope` claim — the normative basis for HEM-CONSENT. The `consent_scope.expiry` trigger, fail-closed semantics, and APPI Article 17 binding in HEM-CONSENT follow directly from MJWT-05 Section 7.4. HEM-CONSENT is the enforcement surface; MJWT is the credential surface.

**GAR-07 (draft-sato-soos-gar-07)** established the ALE framework and Session Block structure. ALE-030 through ALE-041 (twelve ALE types) are registered in Section 21 of this document. The Deliberation Record for HEM-DIV-1 is committed to GAR before any human principal review — the `soos.gar.prev_span_hash` chain makes post-hoc Deliberation Record fabrication detectable.

---

## Security

**Key security properties:** Every interaction class event is kernel-signed and committed to GAR before the principal is notified. The HRS computation uses only behavioral signals unless biometric consent is present. INV-HEM-01 makes suppression of any governance-relevant information a conformance violation detectable in the audit chain.

**Manipulation via HEM channel (§18.10):** An agent refused a MANIPULATION Tier 0-A action may attempt to manipulate through the escalation request itself — biased option framing, urgency language in consequence summaries. Defense: the GEC validates all option presentations against a prohibited-framing classifier and substitutes kernel-generated neutral content when violations are detected. The substitution is itself audited.

**Decision evidence binding and replay (§12.8, §18.2):** A resolved HEM decision's own signature covers `hem_id`, `principal_id`, `decision`, and `timestamp` — not the action's arguments or target resource directly. Treating that signature alone as proof a human authorized one specific action would be an overclaim; the actual binding runs through `hem_id` as a reference into the separately kernel-signed escalation request, and a relying party MUST verify both signatures jointly. Replay of a resolved decision is prevented by the state machine — a decision resubmitted against an already-resolved `hem_id` is rejected with `HEM_ALREADY_RESOLVED` — not by signature verification alone; an earlier revision's text conflated the two.

**Approval fatigue exploitation (§18.13):** An attacker with Class 2 trigger capability can attempt to force a principal into a mandatory rest period at a tactically inconvenient moment by generating rapid low-stakes escalations. Defense: if more than 40% of the fatigue-inducing escalations came from a single agent session in the last 15 minutes, HEM-FAT-1 generates `FATIGUE_ATTACK_SUSPECTED` rather than enforcing the rest period.

**Denial-of-service via agent-triggerable interaction classes (new in -06):** the original rate-limiting requirement covered only `HEM_AGENT_ESCALATED` (Class 2), predating -05's ten interaction classes. HEM-LIM-1 and HEM-FAT-1 already had effective caps of their own; HEM-DIV-1 and HEM-PRE-1 did not. Two new requirements close this: HEM-DIV-1 firings are rate-limited to 5 per session per rolling 10-minute window, with excess firings queued into a single batched Deliberation Record review; and HEM-PRE-1's "materially distinct goal" test now has a concrete definition (edit-distance or operator-configured semantic-similarity threshold) so a resubmission can't dodge the rate limit by trivially rewording.

**Formal analysis status:** No formal verification of HEM-06 interaction class completeness has been conducted. This is acknowledged as a gap. The R10 grading against `draft-reece-wimse-cross-org-delegation-01` (see IETF Working Groups, above) is the closest thing to external review this mechanism has had to date; broader formal analysis with academic partners remains open.

---

## SOOS stack context

HEM sits at **Level 3 — Governance**, alongside CAP and GAR. It depends on IDP (mandate context and reasoning trace for trigger evaluation), CAP (Class 1 triggers, Tier 0-A prohibition HEM interface), MJWT (consent_scope for HEM-CONSENT), and GAR (every interaction and escalation produces mandatory audit records). It is consumed by AEP (HEM trigger evaluation on every execution cycle), MAD (cluster-level Class 8 triggers), and GRP (RETRY threshold → HEM-PRE-2).

Related drafts: [IDP](/drafts/idp) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [MJWT](/drafts/mjwt) · [AEP](/drafts/aep) · [MAD](/drafts/mad) · [GRP](/drafts/grp)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/hem)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-hem/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
