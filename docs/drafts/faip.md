# Federated Agent Intelligence Protocol

Layer 4 — Multi-Agent
**draft-sato-soos-faip-01**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-faip/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems produce behavioural data that would be valuable to the broader ecosystem — reasoning pattern distributions, escalation frequencies, trust score trajectories — but that data cannot be shared without exposing sensitive execution details, principal identities, or proprietary operational parameters.

FAIP defines the protocol by which a SOOS kernel exports governed execution data for aggregation across deployments without exposing the individual records that produced it. Not as telemetry. As a federated, privacy-preserving aggregation protocol using VDAFs (Verifiable Distributed Aggregation Functions), with a k-anonymity floor, a kernel-controlled export gate, and a signed eligibility manifest.

**The design premise:** collective intelligence about agentic AI behaviour is a public good. FAIP is the protocol that makes that intelligence computable without making individual execution records observable.

---

## Messages to key audiences

### IETF Working Groups

FAIP is directly relevant to the PEARG (Privacy Enhancements and Assessments Research Group) and the PRIO/VDAF work in CFRG. FAIP profiles draft-irtf-cfrg-vdaf for the agentic AI kernel use case: the measurements are execution statistics (escalation rates, trust score distributions, action class frequencies), the aggregation function is PRIO3 or Poplar1 depending on data type, and the k-anonymity floor (k≥50) is a normative requirement rather than an implementation recommendation.

The FAIP kernel interface — which governs which Event Log entries are eligible for export — is designed to compose with the SCITT transparency model: an aggregation result MAY be anchored in a SCITT transparency log to provide public verifiability of the aggregate without exposing individual records.

To engage on FAIP: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-faip/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, the absence of a privacy-preserving aggregation protocol means you face a binary choice: share nothing (and lose access to ecosystem intelligence), or share everything (and expose sensitive execution records to third parties).

FAIP closes this gap by specifying the kernel-level export gate and VDAF aggregation protocol that allows your deployment to contribute to — and benefit from — cross-deployment intelligence without exposing individual execution records. Your kernel controls what is eligible for export. The VDAF ensures that the aggregation result is computable without any party seeing individual measurements. The k≥50 floor ensures no contribution is identifiable.

Without FAIP: intelligence is either private or exposed. With FAIP: intelligence is aggregated, privacy-preserved, and verifiable.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/faip)

### Risk managers and legal

FAIP is the protocol mechanism for satisfying the data minimisation requirements of GDPR Article 5 and Japan APPI Article 19 in the context of AI system monitoring. Individual execution records — which contain principal identity, mandate scope, and operational context — stay within the kernel perimeter. Only aggregate statistics, computed through a VDAF with a k-anonymity floor, leave the deployment.

For compliance teams: the FAIP eligibility manifest is the kernel's signed declaration of what categories of data are exported, to which aggregation authorities, under what privacy parameters. It is the DPIA-equivalent artefact for agentic AI telemetry — a machine-readable data protection impact record produced by the kernel itself.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS FAIP (Federated Agent Intelligence Protocol, draft-sato-soos-faip-01). This is an IETF protocol that defines a privacy-preserving aggregation interface for SOOS kernel execution statistics. FAIP uses VDAFs (specifically PRIO3 for numerical data) from draft-irtf-cfrg-vdaf. The kernel exports only eligible Event Log entries (defined by the FAIP eligibility manifest) and enforces a k-anonymity floor of k≥50. HPKE is used for key management. The aggregation result does NOT expose individual records. Three eligible event categories: escalation events (HEM), trust state transitions (PT), and action class frequency distributions (AEP)."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `eligibility_manifest_id` | string | Identifier for the FAIP eligibility manifest |
| `export_categories` | array | Which event categories are eligible for export |
| `k_floor` | integer | k-anonymity floor (normative minimum: 50) |
| `vdaf_type` | enum | PRIO3 / POPLAR1 |
| `aggregation_authority` | string | Identity of the VDAF aggregation server |
| `hpke_public_key` | string | HPKE public key for measurement encryption |
| `export_window` | object | Time window for aggregation batch |
| `retroactive_withdrawal` | boolean | Whether measurements can be withdrawn post-contribution |

**Eligible event categories (normative):**

| Category | Source | Data type | VDAF |
|---|---|---|---|
| Escalation frequency | HEM | Numerical (count per class) | PRIO3 |
| Trust score distribution | PT | Numerical (composite score histogram) | PRIO3 |
| Action class frequency | AEP | Categorical (action class counts) | Poplar1 (TBD — OQ-FAIP-2) |
| Reasoning mode distribution | AEP | Categorical (8-mode histogram) | Poplar1 (TBD — OQ-FAIP-2) |

**FAIP eligibility manifest example:**

```json
{
  "eligibility_manifest_id": "faip-manifest-v1",
  "export_categories": ["escalation_frequency", "trust_score_distribution"],
  "k_floor": 50,
  "vdaf_type": "PRIO3",
  "aggregation_authority": "https://aggregator.soos-faip.example",
  "export_window": {
    "duration_seconds": 86400,
    "start_offset": "session_start"
  },
  "retroactive_withdrawal": false
}
```

### Government and regulators

FAIP is the technical mechanism for enabling AI system monitoring at population scale without creating a surveillance infrastructure over individual AI deployments. Regulatory bodies that require aggregate statistics on AI system behaviour — escalation rates in high-risk applications, trust score distributions across licensed deployments, action class frequencies in regulated domains — can receive FAIP aggregates without requiring access to individual execution records.

For AI governance bodies: FAIP aggregates are verifiable (VDAF ensures the aggregate is correctly computed) and attributable (the aggregation authority holds the signed eligibility manifest). They provide the population-level intelligence that informs evidence-based AI regulation without the privacy costs of individual record collection.

For collaboration on jurisdiction-specific FAIP aggregation requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Execution statistics from agentic AI deployments would improve the broader ecosystem — but sharing them exposes sensitive operational data. There is no standard for computing aggregate intelligence from governed executions without exposing individual records.

**Mechanism:** FAIP profiles draft-irtf-cfrg-vdaf (PRIO3/Poplar1) for kernel execution statistics. The kernel evaluates the eligibility manifest to determine which Event Log entries are eligible for contribution. Eligible entries are encoded as VDAF measurements and encrypted with HPKE to the aggregation authority's public key. The aggregation authority computes the aggregate using the VDAF protocol — no individual measurement is ever decrypted by the aggregation authority. The k≥50 floor ensures no contribution set is small enough to be re-identified.

**Output:** A VDAF-computed aggregate — escalation frequency distributions, trust score histograms, action class frequencies — that is verifiably correct and individually private. The eligibility manifest is the kernel's signed record of what was contributed and under what privacy parameters.

**Who verifies it:** Research communities, regulatory bodies, and standards organisations who need population-level intelligence about agentic AI system behaviour — without requiring access to any individual deployment's execution records.

---

## The k-anonymity floor

The k≥50 floor is a normative requirement, not a recommendation. An aggregation batch that would include fewer than 50 distinct kernel contributions MUST NOT be computed — the batch is rejected and no aggregate is produced.

This floor is designed to prevent two attacks:
- **Re-identification by subtraction:** an adversary who controls 49 of 50 contributions can compute the 50th. k≥50 with a normative floor prevents adversarially small batches.
- **Operator inference from aggregate:** an aggregation authority that sees only one contribution per operator could infer operational details from the aggregate. k≥50 ensures the aggregate reflects a population, not an individual deployment.

Implementations MUST enforce the k floor locally before contributing to an aggregation batch — the kernel does not rely on the aggregation authority to enforce this requirement.

---

## Use cases

**Cross-deployment escalation rate benchmarking**

Ten enterprise deployments of SOOS-governed agents contribute HEM escalation frequency distributions to a FAIP aggregation. The VDAF computes the population-level escalation rate per class across all ten deployments. Each enterprise sees where their escalation profile sits relative to the population distribution — without any enterprise seeing another's individual records. Risk managers use the benchmark to calibrate their mandate trust floors.

**Standards body AI behaviour monitoring**

An AI governance standards body requires quarterly statistics on HEM Class 1 trigger rates across regulated deployments. Participating kernels contribute to a FAIP batch during the reporting window. The aggregation authority produces a VDAF-verified aggregate. The standards body publishes the aggregate as evidence-based input to the standards revision process — without holding any individual deployment's execution records.

**Retroactive withdrawal scenario**

A deployment discovers post-contribution that a subset of exported measurements included data from a session that should have been excluded. FAIP-01 defines the retroactive withdrawal protocol as a successor document scope item (OQ-FAIP-3). In the interim, implementations MUST set `retroactive_withdrawal: false` in the eligibility manifest if they cannot guarantee withdrawal capability.

---

## How this builds on existing work

**draft-irtf-cfrg-vdaf (VDAF)** defines the Verifiable Distributed Aggregation Function framework — the cryptographic primitive that FAIP builds on. FAIP is a profile of VDAF for the agentic AI kernel use case, specifying the measurement types, the aggregation functions, and the minimum privacy parameters.

**HPKE (RFC 9180)** is the key management mechanism for VDAF measurement encryption. FAIP requires HPKE for encrypting individual measurements before they leave the kernel perimeter — the aggregation authority's public key is the only key used for encryption; decryption occurs only as part of the VDAF aggregation protocol.

**GDPR Article 5 (data minimisation)** and **Japan APPI Article 19 (third-party provision restriction)** both require that data exported to third parties is minimised and purpose-limited. FAIP's eligibility manifest is the machine-readable record of what is exported, to whom, and under what privacy parameters — satisfying data minimisation requirements by design.

---

## Related work

**draft-irtf-cfrg-vdaf** is FAIP's normative VDAF dependency. FAIP tracks the current draft; OQ-BUILD-06 records the version alignment requirement before Phase 5 of the Rust implementation.

**PEARG (Privacy Enhancements and Assessments Research Group)** — FAIP is designed for PEARG review before the July 11 submission deadline. OQ-FAIP-1 tracks the PEARG contact requirement. PEARG guidance on the Prio3 vs. Poplar1 selection for categorical data (OQ-FAIP-2) is the primary open architectural question.

**draft-irtf-cfrg-hpke (RFC 9180)** — FAIP uses HPKE for measurement key management. RFC 9180 is FAIP's normative HPKE dependency.

---

## Security

**Key security properties:** No individual VDAF measurement is decrypted by the aggregation authority — the VDAF protocol guarantees this by construction. The eligibility manifest is kernel-signed; a manifest that has been modified after signing is detectable. The k≥50 floor is enforced locally by the kernel; the kernel MUST NOT contribute to a batch that would not meet the floor even if the aggregation authority requests it.

**Eligibility gate:** The kernel's eligibility evaluation runs against the active Cedar policy set and the Event Log. An entry that is not in the eligibility manifest MUST NOT be exported — the kernel does not rely on the aggregation authority to gate ineligible entries. This prevents an aggregation authority from requesting data that the principal has not authorised for export.

**Retroactive withdrawal (OQ-FAIP-3):** The protocol for withdrawing contributed measurements after aggregation is a successor document scope item. Implementations that cannot guarantee withdrawal capability MUST declare `retroactive_withdrawal: false` and ensure the contributing principal understands that contributions are permanent.

**Formal analysis status:** The VDAF-based privacy guarantee is inherited from draft-irtf-cfrg-vdaf, which has undergone CFRG review. FAIP's eligibility gate and k-floor enforcement are SOOS-specific additions that have not been formally verified. PEARG review is the planned mechanism for addressing this gap before Vienna.

---

## SOOS stack context

FAIP sits at **Level 4 — Multi-Agent**, alongside MAD and Memory. It depends on the Event Log (the source of all eligible measurements), KIA (the eligibility manifest is GEC-signed), and CAP (Cedar governs which event categories are eligible for export). It is consumed by aggregation infrastructure external to the kernel. GAR records the FAIP export events — what was contributed, to which aggregation authority, under which eligibility manifest — as Class K artefacts.

Related drafts: [GAR](/drafts/gar) · [KIA](/drafts/kia) · [AEP](/drafts/aep) · [HEM](/drafts/hem) · [PT](/drafts/pt)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/faip)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-faip/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
