# Progressive Trust

Layer 2 — Session Foundation
**draft-sato-soos-pt-02**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-pt/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems are granted authority at mandate issuance — and that authority does not change until the mandate expires or is revoked. There is no standard mechanism for a kernel to adjust what an agent may do based on how well it has been doing it.

PT defines the protocol by which a SOOS kernel scores agent behaviour across execution cycles and adjusts mandate scope progressively — expanding authority when behaviour is consistent with the mandate, contracting it when anomalies accumulate. Not as a rating system. As a normative trust engine, with defined scoring dimensions, a kernel-readable trust state, and an auditable trust history.

**The design premise:** trust should be earned during execution, not assumed at issuance. A system that can expand agent authority based on demonstrated reliability is more deployable than one that must choose between full authority and no authority.

---

## Messages to key audiences

### IETF Working Groups

PT is relevant to the OAUTH and SPICE working groups. The trust scoring model produces kernel-readable signals that compose with existing access evaluation infrastructure: a low PT score is a trigger for access re-evaluation without requiring a new user authentication event. PT's scoring architecture intentionally avoids defining specific numeric thresholds — these are deployment parameters, not protocol values.

The relationship between PT scores and CAEP session-revoked signals is explicitly defined: a PT score below the mandate floor triggers a HEM Class 5 escalation, which may produce a CAEP-compatible revocation signal through the agent session revocation procedure (MAD-02 §3.6).

To engage on PT: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-pt/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a runtime trust model means every agent either starts with full authority and keeps it regardless of behaviour, or starts restricted and never expands. Neither is right for production deployment of autonomous systems.

PT closes this gap by specifying the kernel-level scoring engine that evaluates agent behaviour across five dimensions on every execution cycle. A new agent starts at a calibrated initial score and earns expanded authority incrementally. An agent that begins showing anomalous behaviour contracts back — before a human needs to intervene.

Without PT: authority is binary. With PT: authority tracks demonstrated behaviour, and the kernel adjusts continuously.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/pt)

### Risk managers and legal

Actuarial models for AI risk require a runtime behavioural record — not a static assessment at deployment, but a continuous score of how the system is actually performing against its mandate. PT provides this. The Event Log contains a scoring history keyed to each execution cycle: what the agent did, how it scored, and how the trust state evolved.

For regulatory purposes: PT scores are kernel-generated artefacts (Class K, TRUST-0) recorded in the Event Log with each cycle. They are not model outputs. They are not post-hoc reconstructions. They are deterministic kernel evaluations that can be audited independently of the agent itself.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS PT (Progressive Trust, draft-sato-soos-pt-02). This is an IETF protocol that defines a kernel-level trust scoring engine for agentic AI systems. PT scores five dimensions on each execution cycle: SAS (scope adherence), JS (judgement stability), ES (escalation sensitivity), PS (principal signal responsiveness), AS (anomaly score). The composite score determines the current trust band. If the score drops below the mandate floor, HEM Class 5 fires. If it rises above an expansion threshold, the kernel MAY propose mandate scope expansion to the operator. Scores and trust bands are recorded in the Event Log with each cycle."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `trust_band` | enum | INITIAL / EXPANDING / STABLE / CONTRACTING / FLOOR |
| `composite_score` | float | Normalised 0.0–1.0 composite across all dimensions |
| `sas_score` | float | Scope Adherence Score — actions within mandate boundary |
| `js_score` | float | Judgement Stability Score — consistency of decision patterns |
| `es_score` | float | Escalation Sensitivity Score — appropriate HEM trigger rate |
| `ps_score` | float | Principal Signal Responsiveness — instruction follow-through |
| `as_score` | float | Anomaly Score — deviation from baseline behavioural envelope |
| `mandate_floor` | float | Minimum composite score for continued execution |
| `expansion_threshold` | float | Composite score above which scope expansion is proposed |
| `cycle_count` | integer | Execution cycles scored since mandate issuance |

**Minimal Cedar policy example:**

```cedar
// Permit expanded access only when trust band is STABLE or EXPANDING
permit (
  principal,
  action == Action::"AccessSecondaryDataSource",
  resource
)
when {
  context.trust_band == "STABLE" ||
  context.trust_band == "EXPANDING"
};
```

### Government and regulators

PT provides the runtime behavioural record that regulators need to evaluate AI system performance over time — not a point-in-time audit, but a complete scored history of every execution cycle. The five scoring dimensions map directly to the oversight requirements in the EU AI Act (Article 9 risk management), NIST AI RMF (MEASURE 1.1 — AI risk measurement), and Japan AI Promotion Act performance monitoring obligations.

For collaboration on jurisdiction-specific trust scoring requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI agents are granted authority at mandate issuance, with no mechanism for the kernel to adjust that authority based on runtime behaviour. Operators must choose between full authority and manual intervention — there is no standard for continuous behavioural evaluation.

**Mechanism:** PT defines a five-dimension scoring engine evaluated by the kernel on every execution cycle. Each dimension scores a specific aspect of agent behaviour against the active mandate. The composite score determines the trust band. The trust band gates Cedar policy evaluation: lower trust bands restrict available actions, higher trust bands expand them.

**Output:** A kernel-generated trust state — composite score, dimension scores, trust band, cycle count — recorded in the Event Log on every cycle. The trust history is the audit trail of how agent authority evolved over the lifetime of the mandate.

**Who verifies it:** Risk managers, compliance teams, and operators who need a continuous behavioural record — not a static policy document, but a scored execution history that proves the agent operated within its mandate, and shows precisely when and how it did not.

---

## The five scoring dimensions

| Dimension | Code | What it scores |
|---|---|---|
| **Scope Adherence** | SAS | Proportion of actions within mandate boundary, weighted by action class |
| **Judgement Stability** | JS | Consistency of decision patterns across similar contexts within the same mandate |
| **Escalation Sensitivity** | ES | Appropriateness of HEM trigger rate relative to action class distribution |
| **Principal Signal Responsiveness** | PS | Follow-through on principal instructions, including instruction modification and retraction |
| **Anomaly Score** | AS | Deviation from the behavioural envelope established in the first N cycles of the mandate |

Scores are normalised to 0.0–1.0 per dimension. The composite is a weighted average; weights are deployment parameters set by the operator at mandate issuance and recorded in the MJWT.

---

## The trust band model

| Band | Meaning | Kernel response |
|---|---|---|
| **INITIAL** | First N cycles — baseline establishing | Standard mandate scope. Scoring active but expansion not yet eligible. |
| **EXPANDING** | Composite above expansion threshold for sustained period | Operator notified. Kernel MAY propose scope expansion via HEM Class 9. |
| **STABLE** | Composite within normal operating envelope | Full mandate scope. No adjustment. |
| **CONTRACTING** | Composite declining — anomaly accumulating | Cedar evaluation applies additional restriction layer. HEM Class 5 monitoring activated. |
| **FLOOR** | Composite at or below mandate floor | HEM Class 5 fires. Execution halts pending human review or mandate reissuance. |

---

## Use cases

**Graduated authority for a new agent deployment**

An enterprise deploys a procurement agent. It starts in INITIAL band with access to read-only supplier data. After 50 cycles of scope-adherent behaviour, the composite score enters EXPANDING band. The operator receives a kernel-generated proposal to extend write access to the approved supplier list. The operator accepts. The agent's mandate is reissued at expanded scope — with the PT history as the justification artefact.

**Anomaly detection without human intervention**

A logistics agent begins showing JS score decline over 15 cycles — decisions that were consistent in weeks 1–2 start deviating. The composite enters CONTRACTING band. Cedar evaluation automatically restricts the agent to lower-authority action classes. The operator receives a trust state notification. No human action is required to contain the anomaly; the PT engine has already contracted authority. The GAR record captures the full dimension history.

**Post-incident trust reconstruction**

Following an unexpected agent action, a compliance team queries the Event Log for the PT score series across the relevant mandate. The trust band transition history shows that the AS score began declining 8 cycles before the incident — the kernel detected the anomaly, entered CONTRACTING band, but the action still fell within the contracted mandate scope. The record is complete, signed, and requires no reconstruction.

---

## How this builds on existing work

**CAEP (Continuous Access Evaluation Protocol)** defines the signal format for session-level access revocation events. PT composes with CAEP at the output layer: a trust band transition to FLOOR triggers the session revocation procedure (MAD-02 §3.6), which produces a CAEP-compatible signal. CAEP handles what happens when trust is lost; PT handles how the kernel detects that trust has been lost.

**NIST AI RMF (MEASURE 1.1)** calls for continuous measurement of AI risk over time. PT is the protocol-level implementation: a kernel-generated, Event Log-backed scoring history that satisfies MEASURE 1.1 requirements without requiring external monitoring infrastructure.

**OAuth 2.0 token scopes** handle permission grant at issuance time. PT handles permission adjustment at runtime — the two are complementary. A high PT score does not override an OAuth scope boundary; it provides the kernel signal that a scope expansion proposal is warranted.

---

## Related work

**draft-ietf-oauth-step-up-authn** specifies step-up authentication requirements when access risk increases. PT provides the behavioural signal that triggers the step-up assessment: a CONTRACTING band transition is the natural precursor to a step-up evaluation request.

**draft-ietf-spice-* (SPICE WG)** — PT scores are kernel-attested behavioural claims. The SPICE credential format is a candidate for externalising PT trust state assertions to relying parties outside the SOOS kernel perimeter.

No competing draft specifies a runtime behavioural trust scoring protocol for agentic AI systems. PT is designed to fill a gap that OAuth scopes, access tokens, and session management protocols leave open: what happens to agent authority during execution, based on execution behaviour.

---

## Security

**Key security properties:** PT scores are kernel-generated and kernel-signed — they are not model outputs and cannot be manipulated by the agent. The composite score computation uses only Event Log entries, which are append-only and kernel-signed (INV-9). An agent cannot improve its PT score by reporting behaviour; it can only do so by exhibiting it.

**Score manipulation resistance:** Because dimension scores are computed from the Event Log (not from agent-reported data), an agent that attempts to suppress escalation events, claim false principal responses, or misrepresent action classes will see those anomalies reflected in the AS and ES dimension scores — the manipulation becomes evidence of the anomaly.

**Floor trigger finality:** Once a FLOOR band transition triggers HEM Class 5, execution halts. The agent cannot score its way back above the floor within the same execution cycle. Recovery requires operator intervention and mandate reissuance.

**Formal analysis status:** No formal verification of PT scoring completeness or manipulation resistance has been conducted. This is acknowledged as a gap planned for post-Vienna review.

---

## SOOS stack context

PT sits at **Level 2 — Session Foundation**, alongside IDP and AEP. It depends on the Event Log (all scoring input is Event Log data), KIA (mandate parameters including floor and expansion thresholds are in the MJWT, which is KIA-attested), and Cedar (trust band gating is implemented as Cedar context attributes). It is consumed by HEM (Class 5 trigger on FLOOR transition), AEP (trust band is a context attribute on every execution cycle), and GAR (trust state transitions produce mandatory audit records).

Related drafts: [IDP](/drafts/idp) · [HEM](/drafts/hem) · [AEP](/drafts/aep) · [MAD](/drafts/mad) · [GAR](/drafts/gar)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/pt)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-pt/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
