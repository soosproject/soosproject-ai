# The Distributed Governance Runtime (KEE-2/SOOS-DIST)
Layer 0 — Execution Infrastructure (Distributed)
**draft-sato-soos-dist-00**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-dist/) · [SOOS Stack](/drafts/)

---

## The problem

SOOS governance at KEE-1 scale is correct and complete. At national-mandate scale — millions of agent sessions per day, each producing dozens of cryptographically audited actions — it becomes economically unacceptable. A naively implemented SOOS GAR produces hundreds of millions of signed writes per hour, the same fan-out failure pattern that produced near-data-center failure at Microsoft when SharedSignal was deployed at enterprise scale. A government that mandates SOOS compliance must be able to tell regulated operators: the marginal cost of compliance is comparable to the authentication and logging infrastructure you already operate. KEE-2 is the specification that makes that claim true.

---

## Messages to key audiences

### IETF Working Groups

KEE-2 adopts Raft/etcd (D1) and FROST [draft-irtf-cfrg-frost] (D2) as the normative distributed mechanisms for Cedar cluster consensus and threshold signing cluster management. The Session Block GAR (D3) is a new contribution: a Merkle DAG model over agent session blocks that reduces KIA signing operations from event-granularity to block-granularity, achieving approximately two orders of magnitude reduction in signing overhead at enterprise scale. The Catalog Distribution Protocol (D4) is the first IETF specification for fleet-wide propagation of machine-readable AI governance catalogs with coordinated effective-date activation. Open questions: OQ-KEE-03 (session block granularity), OQ-KEE-04 (Merkle DAG anchor interval), OQ-KEE-08 (normative performance wall thresholds). Engagements: RATS WG (KIA attestation at cluster boundary), WIMSE WG (MJWT in cross-cluster ACD inheritance), SCITT (GAR Session Block as SCITT Signed Statement candidate).

### App builders

KEE-2 is invisible to SOOS protocol consumers at the API level. An AEP session, a PEER transaction, or an ACD Record produced by a KEE-2 kernel looks identical to one produced by a KEE-1 kernel. What changes is your operational infrastructure. Five performance walls tell you when you need KEE-2: Cedar throughput >1,000 eval/sec (deploy Cedar cluster); KIA signing >100 ops/sec (deploy FROST cluster); GAR writes >10,000 ALE/sec (deploy Session Block GAR); any multi-kernel fleet with a shared catalog feed (deploy catalog distribution); sub-agent chains >2 levels at scale (deploy ACD session inheritance). If you are below all five walls, KEE-1 is sufficient. W4 (any multi-kernel HA deployment) is the most common trigger even for moderate-scale production.

### Regulators and policy teams

KEE-2 is the mechanism that makes machine-readable AI law work at scale. When a jurisdiction encodes a new AI prohibition in its CAP-RRS catalog [draft-sato-soos-cap-rrs-02] and sets an effective date, KEE-2 D4 (Catalog Distribution Protocol) ensures that every kernel in every regulated operator's fleet receives the update, validates the publisher key threshold signature, and activates the prohibition atomically at midnight on the legal effective date — not approximately, and not as an attestation from the operator. A regulator auditing compliance can request a GAR Merkle inclusion proof for any agent action and verify cryptographically which policy version governed that action at the time it executed. The APPI 7-year retention requirement is built into the tiered GAR storage architecture (Cold tier, Section 5.3).

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I am implementing a KEE-2-compliant SOOS Distributed Governance Runtime. KEE-2 extends KEE-1 [draft-sato-soos-kee-00] with five distributed properties. D1: Cedar cluster consensus via Raft/etcd with atomic Cedar Policy Set version transitions and a Cedar Evaluation Cache keyed by (action_type, context_hash, cap_profile_hash). D2: FROST threshold signing cluster with key ceremony, signer rotation, and quorum failure handling — threshold parameters MUST NOT be dynamically reduced. D3: Session Block GAR with Merkle DAG — one KIA threshold signature per block close, not per ALE; anchor interval ≤60s for government-tier; anchor gap >1.5x interval triggers soos.gar.anchor_gap_detected OTel event. D4: Catalog distribution protocol with 2-of-3 publisher key threshold validation, version monotone counter enforcement, and coordinated two-phase activation at effective_date. D5: ACD session inheritance for sub-agent delegation chains. XPID Cross-Cluster Federation requires XPID Federation Certificates — raw XPID values MUST NOT be accepted without GEC countersignature verification. Performance walls trigger D1–D5 compliance: W1 >1k Cedar eval/sec, W2 >100 KIA sign/sec, W3 >10k ALE/sec, W4 any shared-catalog fleet, W5 delegation chains >2 levels at scale."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `fleet_id` | string (UUID) | Identifies the kernel fleet; declared in GEC Manifest |
| `cap_profile_hash` | string (SHA-256) | Hash of active Cedar Policy Set; cache invalidation key |
| `block_id` | string (UUID) | Session Block identifier; equals OTel trace_id for session |
| `merkle_root` | string (SHA-256) | Merkle root over all ALEs in the Session Block |
| `anchor_interval_seconds` | integer | Configured Merkle DAG anchor interval (RECOMMENDED ≤60 for gov-tier) |
| `effective_date` | string (ISO 8601) | Catalog update activation date; MUST NOT activate before this date |
| `max_propagation_window_seconds` | integer | Maximum allowed catalog propagation delay for Tier 1 updates |
| `xpid_federation_cert` | object | XPID Federation Certificate for cross-cluster XPID verification |

### Government and regulators

KEE-2 answers the question that every government faces when it considers mandating AI governance: will compliance require additional data centers? The answer, with KEE-2, is no. The marginal cost of SOOS governance at national-mandate scale — millions of agent sessions per day under a mandated CAP-RRS catalog — is comparable to the authentication and audit logging infrastructure that regulated operators already operate.

The Catalog Distribution Protocol (D4) is the machine-level implementation of your regulatory publication process. When the Diet passes a new AI act and your ministry publishes the updated CAP-RRS catalog, D4 ensures that the catalog reaches every deployed kernel in every regulated operator's fleet, that each kernel validates the publisher key threshold before activation, and that activation occurs atomically on the legal effective date. No operator attestation required. The GAR record is the proof.

Emerging AI governance frameworks in multiple jurisdictions require machine-enforced policy propagation with cryptographically verifiable effective-date compliance — KEE-2 D4 is the technical mechanism that satisfies this requirement. We invite engagement from national digital authorities and designated Catalog Authority representatives to define the publisher key holder roles for national deployments.

---

## Core technology

**Problem:** SOOS governance at KEE-1 produces one cryptographic signing operation per Audit Log Event; at national-mandate scale this is economically unacceptable.
**Mechanism:** Session Block GAR reduces signing to one threshold KIA signature per session block; Cedar cluster consensus enables horizontal Cedar evaluation scaling; FROST signing clusters eliminate the single-signer throughput bottleneck.
**Output:** A KEE-2-compliant kernel fleet that governs millions of agent sessions per day with signing overhead comparable to existing authentication infrastructure.
**Who verifies it:** Government auditors verifying regulatory compliance via GAR Merkle inclusion proofs; operators monitoring Cedar cluster health and catalog activation status via OTel soos.governance.* spans.

---

## The five distributed properties

| Property | What it replaces | Scale trigger |
|---|---|---|
| D1 — Cedar Cluster Consensus | Single-node Cedar evaluation | >1,000 Cedar eval/sec |
| D2 — FROST Signing Cluster | Local FROST sidecar | >100 KIA sign/sec |
| D3 — Session Block GAR | Per-ALE sequential signing | >10,000 ALE writes/sec |
| D4 — Catalog Distribution | Manual catalog update | Any multi-kernel fleet |
| D5 — ACD Session Inheritance | Full ACD re-handshake per request | Delegation chains >2 levels |

KEE-2 compliance is additive and per-wall. A deployment may satisfy D3 without D1 if only the GAR write throughput wall has been crossed. Wall-crossing is the trigger; each property is independently deployable.

---

## Use cases

**Enterprise financial services platform — production scale**
A Japan FIEA-regulated AI platform serving 50,000 concurrent agent sessions deploys KEE-2 D2 (FROST cluster: 3-of-5, three availability zones) and D3 (Session Block GAR). KIA signing throughput scales with signing coordinator threads, not agent sessions. GAR signing overhead drops from hundreds of thousands of operations per minute to hundreds per minute. The compliance team verifies from the GEC Manifest that the threshold configuration is exactly as declared; auditors verify from GAR Merkle proofs that every agent action was governed.

**National AI mandate activation — Japan**
The Diet enacts a new AI prohibition effective 1 January. The national Catalog Authority (National Digital Authority + National Cybersecurity Authority + operator representative, 2-of-3 publisher key) publishes the updated CAP-RRS catalog via D4. Every kernel in every regulated operator's fleet validates the publisher key signature, acknowledges receipt in Phase 1, and activates atomically at midnight in Phase 2. At 12:01am, no agent in any fleet has executed the newly prohibited action. Auditors verify this from GAR records with Merkle inclusion proofs.

**Disaster response multi-region cluster — MyAuberge / Ponyhouse Farm ATP**
The ATP Foundation reference implementation deploys a three-region SOOS kernel cluster (Tokyo/Osaka/Nagoya) for disaster response coordination. The Master AI in Tokyo authorizes a Nagoya Local AI via a PEER transaction [draft-sato-soos-peer-00]. KEE-2 Section 6 (XPID Cross-Cluster Federation) governs how the Nagoya cluster verifies the XPID without having observed the PEER handshake. D5 (ACD Session Inheritance) allows the Local AI to act under the Master AI's delegation without a full ACD re-handshake on every resource request, reducing latency in time-critical disaster response operations.

---

## How this builds on existing work

**Raft/etcd** provides the Cedar Policy Set coordination mechanism for D1. KEE-2 profiles Raft for the specific requirement of atomic Cedar Policy Set version transitions with SOOS-specific failure handling: stale-policy-window timeout, CEDAR_DENY-all mode on quorum loss, and the split-brain detection OTel event (soos.governance.cedar.split_brain).

**FROST [draft-irtf-cfrg-frost]** is the REQUIRED threshold signing scheme for D2. KEE-2 does not redefine FROST; it specifies the cluster management layer that FROST does not: distributed key generation ceremony, signer rotation, quorum failure handling, and the nonce reuse detection requirement.

**CAP-RRS [draft-sato-soos-cap-rrs-02]** is the catalog format that D4 distributes. KEE-2 does not define what a catalog contains; it defines how a catalog reaches the kernel fleet and how fleet-wide atomic activation is achieved.

---

## Security

**Key security properties:** Cross-cluster XPID values MUST be verified via XPID Federation Certificates with GEC countersignatures. Merkle DAG anchor suppression detection is mandatory via independent watchdog. Catalog updates require 2-of-3 publisher key threshold before any kernel activates. FROST threshold parameters MUST NOT be dynamically reduced. Cross-region Cedar policy version divergence is bounded by the coordinated activation protocol and the cap_profile_hash routing requirement.

**Anchor suppression attack:** An adversary who suppresses Merkle DAG anchoring creates a window for undetectable GAR tampering. Defense: independent watchdog with separate anchor signing key; anchor gap >1.5x interval triggers soos.gar.anchor_gap_detected; gap >3x interval triggers CEDAR_DENY-all.

**Catalog poisoning attack:** A malicious catalog update that removes a Tier 1 prohibition would weaken national-mandate enforcement fleet-wide. Defense: 2-of-3 publisher key threshold enforced at every kernel before activation; version monotone counter prevents rollback; TLS 1.3 mutual authentication on the distribution channel.

**Formal analysis status:** FROST security proofs are established [draft-irtf-cfrg-frost]. Raft safety and liveness properties are established [Ongaro 2014]. The Merkle DAG tamper-evidence model and the coordinated activation protocol have not received formal analysis as of this draft version.

---

## SOOS stack context

KEE-2 sits at Layer 0 — Distributed Execution Infrastructure. It extends KEE-1 [draft-sato-soos-kee-00] with five distributed properties. It depends on: CAP-04, CAP-RRS-02, GAR-03, KIA-03, AEP-02, ACD-00, PEER-00. It is consumed by: all SOOS protocol layers when deployed at scale. Related drafts: [KEE-1](/drafts/kee) · [GAR](/drafts/gar) · [KIA](/drafts/kia) · [PEER](/drafts/peer) · [CAP-RRS](/drafts/cap-rrs).

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-dist/)
- [KEE-1 (single-node foundation)](/drafts/kee)
- [PEER (cross-cluster transactions)](/drafts/peer)
- Contact: tom@myauberge.jp
