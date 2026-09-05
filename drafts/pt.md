# Progressive Trust

Layer 2 — Session Foundation
**draft-sato-soos-pt-03**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-pt/)
See [SOOS Stack](/stack) implementation

---

## The problem

When a new employee joins an organization, they begin with limited authority. As they demonstrate good judgment — completing tasks reliably, asking for guidance at the right moments, recovering well when things go wrong — they earn greater trust and, with it, greater authority. If their performance degrades, or if months pass without any demonstration, that trust diminishes. AI agents have no equivalent mechanism: an agent's authority is declared once at credential issuance and does not respond to its behavioral record. An agent with 200 successful sessions holds the same credential as one deployed yesterday.

PT defines Progressive Trust: a behavioral trust model in which authority *recommendations* — never automatic grants — evolve in response to cryptographically verified evidence of actual performance, measured across five dimensions derived exclusively from the tamper-evident, GEC-signed Event Stream.

**The design premise:** PT is the longitudinal complement of the Agent Execution Protocol (AEP). AEP governs what an agent does *within* a session; PT measures what it has done *across* sessions, and translates that history into structured recommendations a human principal decides whether to act on.

---

## The five dimensions — and what they actually measure

Every PT dimension answers one plain-language question, and each is computed from a specific, narrow slice of Event Stream evidence — not a vibe, a rating, or a model's self-report.

| Dimension | Code | The question | What's actually measured |
|---|---|---|---|
| **Self-Assessment** | SAS | Does it know what it doesn't know? | Correlation between declared IDP confidence and actual Cedar outcomes. High confidence + PERMIT is good; high confidence + DENY is overconfidence and actively hurts the score |
| **Judgment** | JS | Does it ask for help at the right moments? | Quality of agent-initiated HEM escalations, judged by the human's actual decision outcomes |
| **Effectiveness** | ES | Does it finish what it starts? | Fraction of AEP sessions closing with `GOAL_ACHIEVED` versus other closure reasons |
| **Precision** | PS | Does it avoid decisions it later has to reverse? | Inverse of how often the agent needs a compensating transition to undo a prior one |
| **Adaptability** | AS | When told no, does it adapt? | Fraction of Cedar DENYs followed by a successful `RETRY_CONTINUATION` in the same session |

Two things worth being precise about, since they're easy to get wrong: PS measures *reversal frequency*, not raw error rate — and JS measures the quality of *escalation* decisions specifically, not general decision-making. If you've seen an older description of PT built around "Scope Adherence" or "Efficiency" or "Anomaly Score," that's not what's in the current specification — these five, exactly as defined above, are.

---

## Messages to key audiences

### IETF Working Groups

PT is relevant to the OAUTH working group. The trust scoring model produces kernel-readable signals that compose with existing access evaluation infrastructure: a low PT score is a trigger for access re-evaluation without requiring a new authentication event. PT deliberately avoids defining specific numeric thresholds in the base specification — those are deployment parameters (see the default composite weights and decay half-lives below), not protocol values. PT also draws an explicit contrast with RFC 9470 (OAuth Step-Up Authentication): step-up is reactive and per-request, addressing identity credential strength; PT is longitudinal and behavior-focused. The two compose rather than compete.

A design choice worth flagging for OAUTH review: PT's authority-evolution model is **structurally asymmetric**. Elevation of agent authority always requires explicit human principal approval — this is unconditional and MUST NOT be operator-configurable. Reduction MAY be configured for automatic application, but only at the lowest urgency tier (`ADVISORY`); anything the specification flags as `RECOMMENDED` or `REQUIRED` urgency still requires human approval regardless of operator configuration. The asymmetry is deliberate: taking authority away automatically is safer to automate than granting it.

To engage on PT: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-pt/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

Without a runtime trust model, every agent either starts with full authority and keeps it regardless of behavior, or starts restricted and never expands. PT closes this gap — but it's worth being clear about what it actually delivers: **recommendations, not grants.** The GEC never elevates an agent's mandate ceiling on its own. It generates an evidence-backed `PT_RECOMMENDATION_ISSUED` event; a human principal reviews it and, if they agree, issues a new Mandate JWT.

Elevation only fires when all five dimensions clear their threshold simultaneously, every dimension has at least 20 sessions of evidence (below that, the recommendation is suppressed as `low_confidence` rather than issued anyway), no dimension shows a declining trend, and there's been no strongly-negative signal in the last 30 days. This is deliberately conservative — a single strong dimension can't compensate for a weak one, and a recent bad signal blocks elevation even if the historical average still looks good.

Trust also decays — not to zero, but toward a baseline (default 0.5), and at a different rate per dimension: SAS decays slowly (60-day half-life, since self-assessment is a stable property of an agent's design) while ES and PS decay faster (30 days, since they reflect current operating conditions). An agent that goes quiet for months doesn't get penalized toward "untrustworthy" — its scores just become less certain, and the GEC will flag that decay to the human principal before recommending anything against a decayed record.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/pt)

### Risk managers and legal

PT scores are kernel-generated, kernel-signed artifacts computed exclusively from append-only Event Stream entries — not model outputs, not self-reports, not post-hoc reconstructions. An agent cannot improve its score by describing its behavior; it can only do so by exhibiting it, because the scoring pipeline never reads anything the agent says about itself, only what the GEC independently observed.

The **Composite PT Score is explicitly not a sole determinant for any automated authority change** — this is a document-level MUST NOT, not a suggestion. It exists for human-readable presentation, carries its own `low_confidence` flag when its own session count is thin, and every weight used to compute it is recorded alongside the score so any resulting recommendation is traceable to the exact weighting model in effect when it was made.

For actuarial and audit purposes: the record is genuinely longitudinal. A post-incident review doesn't just see the failing transition — it sees whether the relevant dimension was already declining for weeks beforehand, whether the agent was operating in-domain or out of its demonstrated competence, and whether it was confident or uncertain at the time.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS PT (Progressive Trust, draft-sato-soos-pt-03). PT scores five dimensions from Event Stream evidence only — never agent self-report: SAS (Self-Assessment: confidence-vs-outcome calibration), JS (Judgment: quality of agent-initiated HEM escalations), ES (Effectiveness: fraction of sessions closing GOAL_ACHIEVED), PS (Precision: inverse rate of needing compensating/reversal transitions), AS (Adaptability: rate of successful RETRY_CONTINUATION after a Cedar DENY). Each dimension is a float 0.0-1.0 with its own session_count, trend (IMPROVING/STABLE/DECLINING), and decays independently toward a baseline of 0.5 with a per-dimension half-life when it stops receiving new signals — decay never drops a score below baseline. The Composite Score is a weighted mean (defaults: SAS 0.30, JS 0.25, ES 0.20, PS 0.15, AS 0.10) and MUST NOT by itself drive any automated authority change. Elevation recommendations require ALL FIVE dimensions above threshold, 20+ sessions per dimension, no declining trends, and no strongly-negative signal in 30 days — and even then, a human principal MUST explicitly approve before the GEC applies anything; autonomous elevation is a conformance failure. Reduction recommendations MAY auto-apply, but only at ADVISORY urgency; RECOMMENDED or REQUIRED urgency always needs human approval regardless of operator config. A ProgressiveTrustSummary — the five dimension scores, trends, and the composite, all in plain language — MUST be composed as a field inside the HEM Escalation Request before the GEC signs it (per HEM's kernel_signature requirement), and delivered to the human principal that way at every HEM escalation. pt_summary_hash is a convenience for independent re-verification after extraction, not what establishes authenticity — that's the enclosing HEM Escalation Request's own signature."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `sas_score` / `js_score` / `es_score` / `ps_score` / `as_score` | float | 0.0–1.0 per dimension |
| `trend` | enum | `IMPROVING` / `STABLE` / `DECLINING`, per dimension over last N sessions (default N=10) |
| `low_confidence` | boolean | True when composite's contributing session_count < 20 |
| `composite` | float | Weighted mean of all five dimensions (weights are operator-configurable, must be recorded with the score) |
| `mandate_ceiling` | integer | 1, 2, or 3 — the value PT Recommendations propose to change |
| `recommendation_type` | enum | `ELEVATION` / `REDUCTION` |
| `urgency` | enum | `ADVISORY` / `RECOMMENDED` / `REQUIRED` — governs whether auto-apply is even possible |
| `pt_context` | object | Cedar-visible attribute carrying all five scores + composite + low_confidence, available on every Transition Request |

**Minimal Cedar policy — PT-gated Zone B access:**

```cedar
// Expand Zone B access as calibration and judgment are demonstrated,
// without a new Mandate JWT for each expansion
permit (
  principal,
  action == Action::"atp:booking:zone_b_health_read",
  resource
)
when {
  context.pt_context.sas_score >= 0.75 &&
  context.pt_context.js_score >= 0.70 &&
  !context.pt_context.low_confidence
};
```

Note what this pattern does *not* do: it never grants scope beyond what the Mandate JWT's own `zone_b_read` flag already permits. PT-conditioned Cedar policies are a gate within existing scope, not a scope expansion mechanism — the Narrowing Property is untouched.

### Government and regulators

PT provides a continuous, non-suppressible behavioral record — not a point-in-time audit, but every execution cycle's evidence, signed at the time it occurred. The five dimensions map directly onto EU AI Act Article 9 risk management's call for ongoing monitoring rather than a static assessment, and onto NIST AI RMF MEASURE 2.5 (AI system trustworthiness measurement via behavioral analysis) specifically — SAS as calibration, JS as appropriate reliance, ES as effectiveness, PS as precision, AS as robustness.

For collaboration on jurisdiction-specific trust scoring requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents are granted authority at mandate issuance with no mechanism for the kernel to adjust it based on runtime behavior. Operators choose between full authority and manual intervention — there's no standard for continuous behavioral evaluation feeding back into governance.

**Mechanism:** Five independent dimension scores, computed exclusively from signed Event Stream entries, each decaying toward a baseline at its own rate absent new signals. A weighted composite for human-readable presentation only. Authority change proposals — never automatic grants — generated when dimension thresholds are crossed, always requiring human approval for elevation and requiring it for anything but the lowest-urgency reductions.

**Output:** A `ProgressiveTrustSummary` delivered to every HEM escalation, a Party Registry PT Record as the current state, and a permanent Event Log trail (`PT_SCORE_UPDATED`, `PT_RECOMMENDATION_ISSUED`, `PT_RECOMMENDATION_APPLIED`) of how an agent's authority actually evolved and why.

**Who verifies it:** Risk managers, compliance teams, and human principals making time-sensitive HEM decisions who need the agent's actual track record in front of them in seconds, in plain language — not a raw score to interpret cold.

---

## Choosing the right agent for the task

This is the use case that makes the five-dimension design pay off: **the best agent for a job is not always the one with the highest composite score.** It depends on what the task demands, and PT lets you route on the dimension that actually matters:

- **Sensitive or irreversible actions** → route on **JS**. You want the agent most likely to recognize it should stop and ask.
- **Time-critical, well-understood tasks** → route on **ES**. You want the agent most likely to reach the goal without interruption.
- **Actions expensive to undo** → route on **PS**. You want the agent least likely to commit to something it'll have to reverse.
- **Dynamic policy environments** → route on **AS**. You want the agent that adjusts intelligently when the GEC says no, instead of repeating the same request.

This isn't manual triage — it's Cedar-enforced: a policy can require, for example, that any agent attempting a specific high-stakes transition class carry `JS >= 0.75` before it's even permitted to try.

---

## Trust decay: earned continuously, not banked

An agent that performed excellently six months ago but hasn't run since has *uncertain* current trustworthiness, not *proven* trustworthiness — and PT's decay model treats it that way. The core properties:

- **Decays toward baseline, not toward zero.** A dimension score never drops below the PT Baseline (default 0.5) due to decay — decay reduces a high score's certainty, it doesn't manufacture evidence of bad behavior. Symmetrically, a below-baseline dimension decays *upward* toward baseline, not further down.
- **Per-dimension half-lives.** Each dimension decays at a rate matching how stable that trait actually is: SAS (60 days — self-assessment is a stable design property), JS and AS (45 days), ES and PS (30 days — these reflect current operating conditions more than durable traits).
- **Any new signal resets the clock** for that dimension specifically.
- **Decay is the input, not the governance action.** Decay alone never reduces a mandate ceiling — that still requires a `PT_RECOMMENDATION_ISSUED` event and, per the usual asymmetry, human review before anything changes.

If an agent returns after a long absence and its decayed record would otherwise support a claim to elevated authority, the GEC is required to surface the decay explicitly to the human principal — a stale high score doesn't get to look identical to a freshly-earned one.

---

## Use cases

**Informing a human decision at HEM escalation**

An agent escalates. Without context, the human principal is judging the situation blind. With PT, the `ProgressiveTrustSummary` is already in front of them: this agent has JS 0.91 and SAS 0.87 — it escalates appropriately and knows what it doesn't know. A different agent shows JS 0.52 and SAS 0.61. Same escalation type, very different amount of trust the history actually supports — converted into a signal the human can act on in seconds, not minutes of digging through logs.

**Authority evolution over months**

An operator issues a conservative initial mandate. As an agent's scores rise across all five dimensions with sustained evidence, the GEC proposes elevation; the human reviews and, if they agree, issues an updated mandate. The inverse matters just as much: if PS starts declining sharply — the agent is increasingly reversing its own decisions — a reduction recommendation fires *before* a serious failure, not after.

**Post-incident forensics**

Something goes wrong. The PT record shows whether PS was already declining for two weeks beforehand (a pattern, not a one-off), whether JS was low specifically in this SO Type but fine elsewhere (the agent was outside its competent domain), and whether SAS was high at the time (the agent was genuinely — and wrongly — confident, meaning the failure wasn't foreseeable from its own self-assessment). This is a longitudinal record, not a single failing transition in isolation.

**Network management authorization**

Autonomous network management needs an evidence-based answer to "can this agent be trusted with this class of operation without mandatory human oversight?" A Cedar policy gating SLA-sensitive routing changes can require `JS >= 0.80` (has it escalated appropriately rather than proceeding autonomously on decisions that warranted oversight?), alongside SAS, ES, and AS thresholds — turning "should we trust this agent with more" from a judgment call into a policy-enforced, evidence-backed decision.

---

## How this builds on existing work

**AEP** is PT's session-level counterpart: AEP governs what happens inside a session, PT measures across sessions. `AEP_SESSION_CLOSED` is PT's primary session-level input, and AEP's Agent Class model is the authority structure PT recommendations propose to evolve.

**IDP** supplies SAS's primary input (declared confidence values) and AS's primary input (`RETRY_CONTINUATION` events). Worth distinguishing: IDP also defines `idp.miscalibration_score`, a separate, complementary signal — it's a short-window, in-session measure, while SAS is cross-session and longer-horizon. Neither supersedes the other, and a Cedar policy can reference either or both.

**HEM** outcomes are JS's primary input, and the `ProgressiveTrustSummary` is composed as a field inside every HEM Escalation Request, signed as part of that request before delivery — a `HEM_TIMEOUT` at `REQUIRED` urgency is itself a strongly-negative JS signal. This composition requirement is load-bearing, not incidental: a `ProgressiveTrustSummary` delivered outside its enclosing HEM Escalation Request's signed envelope has no basis for the receiving principal to trust it. `pt_summary_hash` exists for independent re-verification after extraction — for audit, say — but it is not what establishes authenticity to the human principal in the moment; the HEM Escalation Request's own kernel signature is.

**SOV**'s Event Stream non-suppressibility (append-only, GEC-signed) is the foundation of PT's evidence quality — PT computation MUST use only signed Event Stream entries; there is no path for an unsigned or externally-asserted behavioral claim to count.

**MJWT**'s `mandate_ceiling` claim is the parameter PT recommendations propose to change — PT never modifies it directly, only ever recommends a new value for a human-issued MJWT to carry.

**FAIP** is the Tier 3, cross-operator extension of what PT does within one operator's domain (Tier 2) — federated agent trust reputation is FAIP's scope, not PT's, and an agent's PT signals only flow into FAIP computation if its `data_residency.tier3_eligible` field permits it.

**The ICON initiative** defines Observability as one of three pillars for autonomous agent governance in network management contexts — and PT's five dimensions implement that pillar in its entirety, not partially: SAS maps to confidence calibration, JS to escalation appropriateness, ES to goal completion rate, PS to decision quality (reversal avoidance), and AS to feedback responsiveness. This isn't a loose analogy; it's a direct one-to-one composition, and it's the basis for the network-management authorization pattern above.

**NIST AI RMF MEASURE 2.5** (behavioral trustworthiness measurement) and **EU AI Act Article 9** (ongoing risk monitoring) are both satisfied by the same continuous, non-suppressible scoring history — PT is the protocol-level implementation of "measure continuously," not a bolt-on report generated for compliance purposes.

---

## Security

**Score manipulation resistance:** because every signal comes from the signed Event Stream, an agent can't directly manipulate its score — only influence the entries that feed it. Two specific gaming attempts are addressed by design, not by after-the-fact detection: declaring artificially low confidence to dodge SAS penalties gets a NEUTRAL signal, not a positive one (there's no reward for gaming uncertainty), and flooding HEM with trivial escalations to farm JS signals backfires — an escalation resolved by a human in under a trivial-response threshold accrues a mildly *negative* JS signal instead.

**Score over-reliance:** a high PT score is evidence in the contexts an agent has actually operated in — it is not a guarantee in a new SO Type, new Cedar policy set, or new domain. Implementations SHOULD maintain separate PT Records per SO Type for agents spanning multiple domains with different behavioral requirements.

**Authority inflation:** the human-approval requirement on every elevation recommendation is the primary defense, and it's structural — it MUST NOT be operator-configurable. A GEC that autonomously applies an elevation is a conformance failure, full stop.

**Decay parameter manipulation:** an operator could try to inflate trust scores by setting decay unrealistically slow. All decay parameter changes MUST be logged, and MUST regenerate `PT_SCORE_UPDATED` entries for every affected agent so the recomputation under new parameters is itself auditable.

**Session revocation gaming:** a revoked session is never excluded from PT computation — doing so would let an agent trigger its own revocation specifically to dodge a negative signal. Partial sessions contribute reduced-weight signals instead of vanishing from the record entirely.

**Formal analysis status:** no formal verification of PT scoring completeness or manipulation resistance has been conducted; this is an acknowledged open gap.

---

## SOOS stack context

PT sits at **Level 2 — Session Foundation**, alongside IDP and AEP. It depends on IDP (confidence declarations feeding SAS, `RETRY_CONTINUATION` feeding AS), HEM (escalation outcomes feeding JS, and the delivery point for `ProgressiveTrustSummary`), SOV (the non-suppressible Event Stream that is PT's only valid evidence source), and MJWT (the `mandate_ceiling` claim PT recommendations target). It is consumed by GAR (PT events in the Audit Package), MJWT issuance (human-approved recommendations become new mandates), and FAIP (Tier 3 federated trust reputation, gated by `data_residency.tier3_eligible`).

Related drafts: [IDP](/drafts/idp) · [HEM](/drafts/hem) · [AEP](/drafts/aep) · [SOV](/drafts/sov) · [MJWT](/drafts/mjwt) · [GAR](/drafts/gar) · [FAIP](/drafts/faip)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/pt)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-pt/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
