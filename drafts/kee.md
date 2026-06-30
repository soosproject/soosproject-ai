# Kernel Execution Environment (KEE-1)
Layer 0 — Execution Foundation
**draft-sato-soos-kee-00**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kee/) · [SOOS Stack](/stack)

---

## The problem

Every SOOS draft specifies what the AI governance kernel does — CAP specifies constitutional prohibitions, GAR specifies audit records, KIA specifies signing identity. None of them specifies the environment in which these operations execute.

Without a normative execution environment, an implementer cannot know: whether two kernel instances may share a process, what happens when the Cedar evaluation service crashes, what key protection is required for a government deployment, or how a resource provider validates the kernel's compliance posture before granting access. These are not design details — they are the conditions on which every other SOOS guarantee depends.

The design premise: a governance kernel that fails open is not a governance kernel. KEE-1 defines what it means for SOOS to fail safely, execute correctly, and attest verifiably — at any deployment tier from a developer laptop to a Japanese government disaster response system.

---

## Messages to key audiences

### IETF Working Groups

KEE-1 is the execution layer beneath all other SOOS drafts. Its eight mandatory properties (P1–P8) define the OS-level guarantees that make CAP, GAR, KIA, AEP, ACD, and the rest implementable with verifiable compliance posture. P3 (ACD Four-Check Sequence) is the normative specification that ACD §7.4 references; KEE-1 provides the section numbers that ACD needed to complete its Presentation Protocol. P2 (FROST Threshold Signing) extends KIA-03 Section 4.1 with execution-layer constraints on key generation ceremony, signer rotation, nonce generation, and quorum failure behavior.

KEE-1 defines three conformance levels (L1 Software, L2 Sidecar TEE, L3 Hardware-attested TEE) with a normative conformance matrix mapping all eight properties to each level. The Government Deployment Profile (§8) specifies the multi-party publisher key ceremony and statute reference URI binding as normative content — the first IETF draft to define a jurisdiction-neutral protocol profile for national government AI governance deployments.

Relevant WG engagements: RATS (GEC Manifest as RATS Evidence; L3 hardware attestation chain maps to RATS Endorsement/Attestation Result chain); WIMSE (FROST threshold signing cluster is a workload identity HA pattern); SCITT (WAL tamper evidence in P7 is SCITT-compatible append-only evidence model).

### App builders

KEE-1 tells you exactly what to build. For the TypeScript SOOS SDK and Government Deployment Profile deployments, Section 9 (Linux Reference Implementation Profile) specifies every component: `cedar-policy` Rust crate for P1, TEE sidecar via Intel TDX/AMD SEV for P2, SQLite WAL for L1 GAR or PostgreSQL WAL for L2/L3, `opentelemetry-rust` at 100% sampling for P6, `uuid` Rust crate UUID-v5 for XPID derivation.

The XPID derivation function (Section 10) is a complete normative API with TypeScript and Rust reference implementations: UUID-v5 over the concatenation of two KIA IDs, a timestamp, and two CSPRNG nonces. Side-effect-free, deterministic, no audit log entries.

Section 6 (Cedar Cluster Specification) tells you how to run a multi-node Cedar evaluation cluster with Raft/etcd: what quorum looks like, when to enter DENY-all mode, and how to do atomic policy hot-swap without an evaluation gap. Section 7 (FROST Signing Cluster) tells you the full key generation ceremony and signer rotation procedure.

If you are deploying on government cloud infrastructure (AWS, Google Cloud, or Azure, including their government region variants), Section 9 is deployable without modification. The Government Deployment Profile (Section 8) specifies the three publisher key holder roles, the statute reference URI requirements, and the personal data protection enforcement chain in Cedar.

### Regulators and policy teams

KEE-1 answers the question that makes or breaks AI governance mandates: how do we know the system actually behaves the way it says it does, rather than just claiming to?

The answer is in the eight properties. P5 (GEC Manifest Immutability) means the kernel's declared compliance configuration cannot drift from its actual running state after initialization — the manifest is hash-locked and verified at every access. P3 (ACD Four-Check Sequence) means a resource provider can verify at API call time that the kernel's manifest is current, its Cedar policies match their committed hash, its identity is not revoked, and the agent XPID is not revoked — before granting access. P7 (WAL Tamper Evidence) means the audit record for any agent action includes a prev_span_hash chain and a Merkle root signed by the kernel — tamper is detectable, not just claimable.

**For Japan Cabinet Office and デジタル庁:** The Government Deployment Profile (Section 8) defines what a government-grade AI kernel deployment requires at the protocol level: L3 hardware attestation, 2-of-3 multi-party publisher key, machine-verifiable statute reference URIs, and personal data protection enforcement chain in Cedar. Appendix A traces the governance audit trail for a government disaster response scenario from statutory text through Cedar policy through ACD Record through GAR — illustrating how the profile applies in practice.

**For FSA (FIEA-governed deployments):** L2 conformance with FROST (2,3) threshold signing satisfies financial services HA requirements without softening key protection. The ACD four-check sequence at every API access gives financial institution gateways the machine-verifiable compliance declaration they need per FSA AI Guidelines.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I am implementing the KEE-1 Kernel Execution Environment from draft-sato-soos-kee-00. KEE-1 defines eight mandatory properties for a SOOS kernel deployment. P1 (Cedar Policy Cluster): Cedar evaluation must be synchronous with agent authorization; policy updates must be atomic hot-swap via tokio::sync::RwLock; one Docker container per kernel instance for isolation. P2 (FROST Threshold Signing): FROST (2,3) default over Ed25519; each signer generates its own CSPRNG nonce per operation; MUST NOT pre-generate or cache nonces; threshold MUST NOT reduce below initial t. P3 (ACD Four-Check Sequence): before issuing an ACD Record, check (1) GEC Manifest currency per KIA-03 §5.4, (2) cedar_policy_hash computed freshly over active Cedar Policy Set, (3) KIA identity not revoked per KIA-03 §8, (4) agent XPID not revoked per KIA-03 §6.5. P4 (Catalog Authority): 2-of-3 publisher key on every CAP Profile update; each follower validates independently before Raft acknowledgement. P5 (GEC Manifest Immutability): SHA-256 hash-locked at init; recompute and verify at every access; mismatch → fail-closed. P6 (OTel Emission): soos.governance.* spans at 100% sampling at every Cedar eval, GAR write, HEM event, ACD handshake, and KIA signing. P7 (WAL Tamper Evidence): prev_span_hash on every ALE; Merkle root + KIA signature at Session Block close; block_id = OTel trace_id. P8 (Revocation Propagation): CAEP/SSF subscription; 30-second propagation timeout; CLEAN/PARTIAL/UNKNOWN completion states; fail-closed on uncertain revocation. XPID derivation: UUID-v5 over 'initiating_KIA_id|responding_KIA_id|initiated_at|initiating_nonce|responding_nonce' using SOOS Namespace UUID."

**Key implementation components:**

| Component | Rust crate / package | Property |
|---|---|---|
| Cedar evaluation | `cedar-policy` | P1 |
| Async runtime | `tokio` | P1, P6 |
| FROST signing | `frost-ed25519` | P2 |
| UUID-v5 / XPID | `uuid` (v5 feature) | §10 |
| GAR storage (L1) | `rusqlite` (WAL mode) | P7 |
| GAR storage (L2+) | `tokio-postgres` | P7 |
| OTel emission | `opentelemetry` | P6 |
| Hash chain | `sha2` | P7 |
| CAEP/SSF | `reqwest` + RFC 9672 | P8 |

**Minimal P3 four-check sequence (TypeScript sketch):**

```typescript
async function acdFourCheckSequence(
  gecManifest: GECManifest,
  activePolicySet: CedarPolicySet,
  kiaIdentity: KIAIdentity,
  agentXPID: string
): Promise<'PASS' | 'FAIL'> {
  // Check 1: Manifest validity
  if (!isManifestCurrent(gecManifest)) return 'FAIL';
  // Check 2: Policy currency
  const liveHash = sha256(canonicalize(activePolicySet));
  if (liveHash !== gecManifest.capProfileHash) return 'FAIL';
  // Check 3: KIA attestation
  if (await revocationRegistry.isRevoked(kiaIdentity.id)) return 'FAIL';
  // Check 4: XPID revocation
  if (await revocationRegistry.isRevoked(agentXPID)) return 'FAIL';
  return 'PASS';
}
```

### Government and regulators

KEE-1 is the protocol that converts AI governance policy into a deployable, auditable, machine-verifiable execution environment. For government bodies considering SOOS adoption or mandating AI governance for regulated AI deployments, KEE-1 answers the question: what does a conformant AI governance kernel actually look like in production?

**For Japan Cabinet Office and デジタル庁:** The Government Deployment Profile (Section 8) defines what a Japanese government-grade AI kernel deployment requires at the protocol level. The 2-of-3 multi-party publisher key ceremony (Section 8.2) ensures no single organization can unilaterally modify constitutional prohibitions. The statute reference URI binding (Section 8.3) creates a machine-verifiable link from every Cedar policy to the statutory provision it implements — including Japan e-Gov URIs at `https://elaws.e-gov.go.jp/` as one conformant example.

The Appendix A worked example (government disaster response, M7.2 earthquake) traces this chain end-to-end: statutory text → statute reference URI → CAP-RRS Tier 1 control → Cedar policy → cap_profile_hash in ACD Record → GAR Session Block → government API access decision. A regulatory auditor can verify this chain without trusting any single system component.

**Founding Period:** SOOS is in its founding period. Governments and regulatory bodies that engage now shape how the Government Deployment Profile is configured for their jurisdiction, which statutory reference URI schemes are recognized, and how multi-party publisher key governance is structured at the national level. Contact: tomsato@myauberge.jp

---

## Core technology

**Problem:** SOOS protocol drafts specify what governance operations produce but not the environment in which they execute — leaving implementers without normative answers on isolation, failure behavior, key protection, and attestation.

**Mechanism:** KEE-1 defines eight mandatory execution properties (P1–P8) covering Cedar evaluation, threshold signing, ACD validation, catalog authority, manifest integrity, observability, tamper evidence, and revocation propagation — with three conformance levels (L1/L2/L3) and a complete Linux reference implementation profile.

**Output:** A conformant SOOS kernel deployment that can be independently verified: its GEC Manifest is hash-locked and attested, its Cedar Policy Set is committed by hash in every ACD Record it issues, and its audit trail is Merkle-chained and KIA-signed at Session Block close.

**Who verifies it:** Resource providers (via P3 ACD four-check sequence at API access time), regulators (via GAR Audit Package with Merkle inclusion proofs), and automated compliance tooling (via P6 OTel emission at 100% sampling rate).

---

## The eight properties

| Property | Concern | Key normative output |
|---|---|---|
| **P1** Cedar Policy Cluster | Synchronous evaluation; atomic hot-swap; Raft/etcd for clusters | No evaluation gap; DENY on service failure |
| **P2** FROST Threshold Signing | (2,3) Ed25519; per-op CSPRNG nonce; threshold immutable | HA signing without single key compromise risk |
| **P3** ACD Four-Check Sequence | Manifest validity + policy currency + KIA attestation + XPID revocation | Validated ACD Record before every resource access |
| **P4** Catalog Authority | 2-of-3 publisher key; key holders designated by deploying authority | No unilateral prohibition change |
| **P5** GEC Manifest Immutability | SHA-256 hash-locked at init; mismatch → fail-closed | Declared posture = actual running posture |
| **P6** OTel Emission | soos.governance.* at 100% sampling at every GEC operation | Complete governance observability pipeline |
| **P7** WAL Tamper Evidence | prev_span_hash chain + Merkle root + KIA signature at block close | Tamper-detectable audit trail |
| **P8** Revocation Propagation | CAEP/SSF; 30-second timeout; CLEAN/PARTIAL/UNKNOWN states | Mandate revocation reaches all kernel instances |

All eight are REQUIRED at all conformance levels.

---

## Conformance levels

| Level | Key protection | Attestation | Typical context |
|---|---|---|---|
| **L1** Software | OS keystore | None | Development, PoC |
| **L2** Sidecar | TEE (TDX / SEV / TrustZone) | TEE attestation report in GEC Manifest | Production single-tenant; enterprise HA |
| **L3** TEE/Hardware | TEE + hardware attestation chain | Chain to deployment authority | Government; regulated multi-tenant |

The Government Deployment Profile requires L3.

---

## Use cases

**Government disaster response — Japan government L3 deployment**
A SOOS-governed disaster response AI deploys on government cloud infrastructure with CAP Profile "disaster-response-gov-v1.0" signed by the National Digital Authority + National Cybersecurity Authority + operator (P4, 2-of-3 per Section 8.2). The Master AI attempts to auto-classify a M7.2 seismic event as maximum crisis (GOLD). Cedar evaluation returns DENY (Tier 0-B: automatic GOLD classification without human confirmation is prohibited). HEM-001 escalates to the duty officer. The duty officer approves. Cedar re-evaluates with human_approval present: PERMIT. GAR Session Block records the full chain with FROST (2,3) Merkle signature. The four-check ACD sequence (P3) succeeds at the government API gateway, and the statute reference URI traces from the active Cedar policy back to the applicable statutory text (Section 8.3).

**Enterprise HA cluster — FIEA-governed financial services (L2)**
A financial firm deploying SOOS-governed trading agents uses FROST (2,3) with three Intel TDX sidecar signers on physically separate hosts (P2). Each signer generates its own CSPRNG nonce per signing operation; nonces are never pre-generated or cached. When one signer node goes offline for maintenance, the remaining two continue producing valid KIA signatures. When the node returns, it rejoins without a new key generation ceremony. The FSA compliance team verifies the FROST configuration in the GEC Manifest (`"frost:t-of-n:2-3"`) and confirms from the ACD Record four-check output that all four checks passed for each API access during the inspection period.

**Developer PoC — single-node L1 deployment**
A developer at a Japanese enterprise AI company runs the full SOOS kernel on her development laptop: one Docker container per kernel instance (P1), `cedar-policy` Rust crate in-process (P1), OS keystore for KIA key (L1 acceptable), SQLite WAL for GAR writes (P7), NTP via systemd-timesyncd (P3 Check 1), and UUID-v5 XPID derivation via `uuid` npm package (§10). The L1 deployment is fully KEE-1 conformant for development purposes. Her ACD Records declare `conformance_level: "KEE1-L1"` so regulated resource providers can reject them — by design, before she moves to L2 for production.

---

## How this builds on existing work

**KIA (draft-sato-soos-kia-03)** is KEE-1's closest dependency. The GEC Manifest that P5 hash-locks is defined in KIA-03 §5. The FROST threshold signing that P2 specifies extends KIA-03 §4.1 with execution-layer constraints. The Revocation Registry that P3 Check 3 and P8 reference is defined in KIA-03 §8. KEE-1 does not respecify KIA internals; it specifies which KIA properties a compliant execution environment must enforce and how.

**GAR (draft-sato-soos-gar-03)** defines the audit architecture that P6 and P7 support at the execution layer. The `soos.governance.*` OTel attribute namespace in P6 is the GAR-03 §13 Governance Semantic Convention. The prev_span_hash chain and Session Block Merkle root in P7 are the execution-layer realization of GAR-03's tamper-evidence requirements. The SOOS GAR Processor (GAR-03 §14) consumes the OTel spans that P6 mandates.

**ACD (draft-sato-soos-acd-00)** depends on KEE-1 P3 for its normative Presentation Protocol (ACD §7.4). The four-check sequence — manifest validity, policy currency, KIA attestation, revocation status — is specified here and referenced there. This is the dependency that required KEE-1 Session 1 to be complete before ACD Session 2 could proceed.

---

## Related work

**RATS (RFC 9334)** defines the architecture for remote attestation. The GEC Manifest is RATS Evidence. KEE-1 L3 requires a hardware attestation chain from TEE to deployment authority — this is the RATS Endorsement/Attestation Result chain applied to SOOS kernel deployment. KEE-1 does not respecify RATS; it specifies that L3 deployments MUST satisfy the RATS Attester requirements referenced in KIA-03 §11.

**Certificate Transparency (RFC 6962)** is the structural analogy for KEE-1 P7's Merkle-based tamper evidence. Parallel write streams, periodic Merkle anchoring, Merkle inclusion proofs for regulatory audit — KEE-1 applies this pattern to AI governance audit records. A regulator requesting proof that a specific agent action was logged receives a Merkle inclusion proof, not a full chain traversal.

No current IETF or NIST specification defines OS-level execution properties for AI governance kernels at the protocol layer. KEE-1 is the first.

---

## Security

**Key security properties:** P1 ensures no cross-instance key, policy, or mandate bleed. P2 FROST (2,3) ensures no single TEE compromise yields a valid signature. P5 hash-locking ensures the declared compliance configuration matches the running kernel. P3 four-check sequence at every ACD handshake ensures resource providers can verify all four before granting access. P8 fail-closed ensures uncertain revocation status defaults to deny.

**Raft leader compromise** (§12.1): each cluster follower independently validates 2-of-3 publisher signatures before acknowledging any Raft proposal — regardless of which authority holds the keys. A compromised leader cannot inject a malicious policy update without valid publisher signatures.

**FROST nonce reuse** (§12.2): each signer generates its own nonce per-operation via CSPRNG per [I-D.irtf-cfrg-frost] §5; nonces are never centrally generated or cached. Reuse would enable private key reconstruction.

**Cedar split-brain** (§12.5): minority partition nodes enter CEDAR_DENY-all immediately on leader-heartbeat timeout. Governance never degrades to stale-policy evaluation.

**Formal analysis status:** KEE-1-00 has not undergone formal security analysis. The FROST nonce requirements follow [I-D.irtf-cfrg-frost]. Formal analysis planned post-Vienna.

---

## SOOS stack context

KEE-1 sits at Layer 0 — Execution Foundation. It has no SOOS dependencies; all other SOOS drafts depend on it. It is consumed by every SOOS draft that specifies a runtime operation: CAP (draft-sato-soos-cap-04), GAR (draft-sato-soos-gar-03), KIA (draft-sato-soos-kia-03), AEP (draft-sato-soos-aep-02), ACD (draft-sato-soos-acd-00), MJWT (draft-sato-soos-mjwt-02), HEM (draft-sato-soos-hem-05), MAD (draft-sato-soos-mad-03), IDP (draft-sato-soos-idp-05), SOV (draft-sato-soos-sov-02). Scale extensions: [KEE-2/SOOS-DIST](/drafts/kee2). Related drafts: [KIA](/drafts/kia) · [GAR](/drafts/gar) · [ACD](/drafts/acd) · [CAP](/drafts/cap)


---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-spec/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kee/)
- Related drafts: [KIA](/drafts/kia) · [GAR](/drafts/gar) · [ACD](/drafts/acd) · [CAP](/drafts/cap)

- Contact: tomsato@myauberge.jp
