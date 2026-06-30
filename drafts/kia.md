# Kernel Identity and Attestation

Layer 0 — Foundation
**draft-sato-soos-kia-03**
See the full draft protocol at [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kia/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems act on behalf of principals. There is no standard mechanism for a relying party — or the kernel itself — to verify that the governance kernel signing audit records has not been tampered with, is running the Cedar policy set that was approved, and is the same kernel that was assessed at deployment time.

Without KIA, governance claims are assertions from an unverified system. With KIA, they are attestations from a hardware-rooted, policy-verified kernel with a signed configuration manifest — where every Event Log entry, every HEM decision record, and every Session Audit Record is provably produced by the kernel that was assessed.

**The design premise:** governance enforcement is only meaningful if you can prove the enforcer has not been compromised. KIA is the protocol that makes that proof machine-readable.

---

## What's new in KIA-03

**FROST threshold signing** (§4.1): High-availability GEC deployments can now distribute the signing key across a t-of-n cluster using FROST threshold Schnorr signatures. No single node holds the complete private key. Signatures are Ed25519-compatible and transparent to verifiers. Threshold reduction requires a new key generation ceremony (CONF-KIA-20).

**XPID: Cross-Principal Identifier** (§6): A UUID-v5 derived from the GEC's FROST threshold key fingerprint and the agent's Party Registry entry. Stable, deterministic, non-forgeable without key material. Enables bilateral audit correlation across trust boundaries without a trusted third party. Every GAR governance span carries the XPID as `soos.governance.xpid`.

**XPID cross-instance trust model** (§6.3): Normative procedure for receiving kernels to verify XPID claims from presenting kernels. Known open issue OQ-S-XPID-REV (revocation gap) and three interim mitigations.

**Four new Security Considerations** (§15.8–15.11): FROST nonce reuse risk; XPID revocation gap; CVE-2025-13609 class defense (identity takeover via claimed identifier — structural prevention by XPID derivation); CVE-2026-33697 class defense (attestation channel binding — structural prevention by GEC keypair independence from transport layer).

**RATS WG Vienna note:** KIA-03 is the reference specification for the RATS WG speaking request at IETF 126 (July 18–24, 2026). XPID and CVE-2026-33697 defense are the primary novel contributions.

---

## Messages to key audiences

### IETF Working Groups

KIA-03 brings two novel RATS contributions to Vienna:

**XPID as RATS extension**: The RATS architecture [RFC9334] provides no standard mechanism for correlating Attester-signed artifacts across federation boundaries when the Relying Party domain changes. XPID fills this gap using UUID-v5 derivation from the Attester's identity material — no trusted third party, no coordination protocol, derivable by any party with the GEC Manifest and Party Registry access. KIA-03 proposes this as a concrete extension point for the RATS cross-domain case.

**CVE-2026-33697 class defense**: KIA-03 presents a case study of how hardware-rooted attester identity prevents the attestation relay attack class (Section 15.11). The structural property: when attestation evidence is bound to a durable hardware-backed identity (the GEC keypair) rather than a transport-layer key, relay attacks that extract ephemeral TLS keys cannot forge the attestation. This is offered as a design pattern recommendation for the RATS WG.

For WIMSE: the XPID provides what WIMSE does not yet specify — a mechanism for correlating workload identity claims across independent trust domains where no shared identity provider exists. The XPID uses only the KIA identity infrastructure already present in both kernels.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kia/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

KIA-03 adds two deployment-relevant features:

**FROST for HA deployments**: If you're running SOOS in a multi-region or high-availability configuration where no single node can hold the signing key, FROST (Section 4.1) is now a normative option. Your cluster produces signatures indistinguishable from single-key signatures to external verifiers. Key requirements: per-operation nonce generation (no caching), quorum enforcement (refuse to sign rather than degrade to single-signer), deployment_constraints[] declaration in the GEC Manifest.

**XPID for cross-instance audit**: If you're running multiple GEC instances and need to trace an agent's activity across them — for audit, debugging, or regulatory reporting — the XPID gives you a stable per-agent identifier that's computable by any instance with the GEC Manifest and Party Registry. No cross-instance protocol needed at trace time. Every GAR span carries it automatically.

The XPID revocation gap (OQ-S-XPID-REV) is known: XPID doesn't get invalidated when a mandate is revoked, only the jti does. Mitigation: always check jti against the Revocation Registry (CONF-KIA-23) — don't rely solely on XPID for access control decisions.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/kia)

### Risk managers and legal

KIA-03 adds two properties relevant to risk assessment:

**Threshold key custody**: FROST threshold signing means no single employee, vendor, or hardware failure can compromise the GEC signing key. The key exists only as t-of-n distributed shares. Compromise requires coordinated access to t independent secure elements. This is the AI infrastructure equivalent of multi-signature custody for digital assets.

**Structural CVE class defenses**: Two documented CVE classes are now explicitly prevented by the KIA architecture with normative analysis. Section 15.10 documents that the CVE-2025-13609 class (identity takeover via claimed identifier) is structurally prevented by XPID derivation. Section 15.11 documents that the CVE-2026-33697 class (attestation channel binding relay attack) is structurally prevented by GEC keypair independence from transport-layer keys. These sections are written to support post-incident analysis and insurance underwriting.

For audit purposes: the GEC Manifest now includes `xpid_derivation_version` — auditors can verify which XPID algorithm version was in use during any session using the GEC Manifest timestamped at that session.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS KIA-03 (Kernel Identity and Attestation, draft-sato-soos-kia-03). This extends KIA-02 with FROST threshold signing and XPID. For FROST: each signing participant must generate a fresh nonce per operation (no pre-generation, no caching). If the cluster drops below quorum (t participants), refuse to sign and emit KERNEL_AUDIT_ANOMALY — do not degrade to single-signer. The threshold parameter t must not be reduced without a new key ceremony. For XPID: derive it as UUID5('6ba7b814-9dad-11d1-80b4-00c04fd430c8', kernel_keypair_fingerprint + ':' + party_registry_entry_hash). Record in every GAR span as soos.governance.xpid. Never accept client-supplied XPID as authoritative — always recompute from inputs. For federation: always check mandate jti against local Revocation Registry even if XPID is valid (OQ-S-XPID-REV known gap). New conformance requirements: CONF-KIA-16 through CONF-KIA-23."

**Key schema additions in KIA-03:**

| Field | Type | Description |
|---|---|---|
| `xpid_derivation_version` | string | XPID algorithm version; "1.0" or "none" |
| FROST deployment_constraints entry | string | "frost:t-of-n:\<t\>-\<n\>" |
| GAR: `soos.governance.xpid` | string (UUID) | XPID in every governance span |

**XPID derivation (version 1.0):**

```typescript
import { v5 as uuidv5 } from 'uuid';
import { createHash } from 'crypto';

const KIA_XPID_NAMESPACE = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

function deriveXPID(
  kernelKeypairFingerprint: string,  // SHA-256 hex of GEC public key
  partyRegistryEntryHash: string     // SHA-256 hex of canonical Party Registry entry JSON
): string {
  const name = `${kernelKeypairFingerprint}:${partyRegistryEntryHash}`;
  return uuidv5(name, KIA_XPID_NAMESPACE);
}
```

### Government and regulators

KIA-03 adds two regulatory-relevant properties:

**Key custody for high-risk AI**: FROST threshold signing provides multi-party key custody that can be mapped to regulatory requirements for dual control over critical AI infrastructure. For jurisdictions requiring human oversight at the key management layer (Japan AI Promotion Act; EU AI Act Article 9 risk management), the t-of-n signing cluster provides an auditable human-controlled signing quorum.

**Structural CVE defenses with normative analysis**: KIA-03 is the first SOOS draft to include explicit CVE class defense analysis (Sections 15.10 and 15.11). For government procurement and conformance testing: these sections document the specific attack classes that KIA's architecture structurally prevents, enabling procurement officers to verify that a KIA-conformant implementation addresses known AI infrastructure attack vectors.

For collaboration on jurisdiction-specific attestation requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI governance kernels can be tampered with after deployment, can be impersonated, and can be compromised through attestation channel relay attacks. There is no standard mechanism that prevents all three simultaneously.

**Mechanism:** KIA anchors GEC identity to a hardware-backed keypair (or FROST threshold keypair) that is independent of any transport-layer key. Every signed artifact — Event Log entries, GEC Manifests, HEM decisions — is signed by this durable anchor. The XPID extends this identity to cross-instance federation without a trusted third party.

**Output:** A signed GEC Manifest (kernel identity, Cedar policy hash, PTD endpoint, XPID derivation version, FROST cluster parameters) that is the kernel's attestation of its own integrity; XPID-correlated GAR audit spans across federation boundaries; and FROST-threshold-signed artifacts that survive individual signing node failures.

**Who verifies it:** Operators, auditors, regulators, federated kernel instances, and RATS Relying Parties — anyone who needs to prove that the governance record was produced by the attested kernel running the assessed configuration.

---

## The CVE differentiators

**CVE-2025-13609 class: Identity takeover via claimed identifier**

The attack: register a new agent with a different TPM device while claiming an existing agent's UUID, overwriting the legitimate agent's identity.

KIA's structural prevention: the XPID is not an asserted value. It is derived deterministically from the GEC's FROST threshold key fingerprint and the agent's Party Registry entry hash. An attacker cannot claim an existing XPID without possessing the original FROST key shares or compromising the Party Registry entry. Any XPID presented without matching derivation inputs is immediately detectable. Section 15.10 documents this with full normative analysis.

**CVE-2026-33697 class: Attestation channel binding relay**

The attack: bind attestation evidence to an ephemeral TLS key rather than a durable identity anchor, enabling an attacker who extracts the ephemeral key to relay the attested session.

KIA's structural prevention: KIA identity is anchored to the GEC keypair in the secure element — independent of any TLS session. Event Log entries are signed by the secure-element-held key, not by any transport key. An attacker who intercepts a TLS session cannot forge the kernel_signature because they don't have the GEC keypair. In FROST deployments, they would need t-of-n secret shares. Section 15.11 documents this as a RATS WG case study.

---

## Use cases

**FROST HA deployment across availability zones**

A financial services operator runs SOOS across three cloud availability zones. No single AZ can hold the complete signing key. A 2-of-3 FROST signing cluster distributes one secret share per AZ. Normal operation: any two AZs sign collaboratively. Single AZ failure: the remaining two AZs meet quorum and continue signing. Two AZ failure: quorum lost, signing halts, KERNEL_AUDIT_ANOMALY fired. No signing degradation to single-signer mode. External verifiers see standard Ed25519 signatures.

**Cross-instance audit correlation: disaster response AX**

During a disaster response operation, a monitoring agent (running on a prefectural SOOS kernel) and an execution agent (running on a municipal SOOS kernel) both govern the same relief coordination workflow. Both kernels derive the agent's XPID from their respective GEC Manifests and the agent's Party Registry entry. Both GAR records carry `soos.governance.xpid` with the same value. A regulator reconstructing the incident timeline can correlate both audit chains using the XPID — without either kernel exposing its full Session Audit Record to the other.

**Post-incident integrity verification with CVE defense evidence**

Following an unexpected agent action, a security team needs to prove that the governance kernel was not compromised via attestation relay. KIA-03's Section 15.11 provides the normative analysis: every Event Log entry is signed by the secure-element-held GEC keypair, not by any transport key. The audit team presents the GAR session record (carrying `soos.gar.block_signature` over the Merkle root) and the GEC Manifest (carrying `kernel_keypair_fingerprint`). Any relay attack that substituted a transport key for the GEC key would produce signatures that fail verification against the manifest.

---

## How this builds on existing work

**RFC 9334 (RATS Architecture)** defines the general model for remote attestation. KIA-03 extends the RATS model with two contributions: XPID as a cross-domain Attester identity correlation primitive (addressing the gap where RATS provides no mechanism for this), and the CVE-2026-33697 defense analysis as a concrete RATS attester architecture case study.

**FROST (draft-irtf-cfrg-frost)** defines flexible round-optimized Schnorr threshold signatures. KIA-03 profiles FROST for the GEC keypair case, specifying the nonce generation requirements, quorum failure behavior, and GEC Manifest declaration format that a KIA-conformant FROST deployment must satisfy.

**GAR-03 (draft-sato-soos-gar-03)** established the OTel semantic convention and Session Block architecture. KIA-03's XPID is recorded as `soos.governance.xpid` in every GAR governance span, enabling cross-session and cross-instance audit correlation using the existing GAR infrastructure.

---

## Security

**Key security properties:** GEC keypair is hardware-rooted and transport-independent. FROST threshold signing distributes key material across t-of-n secure elements. XPID is derivation-based and non-forgeable without key material. INV-9 signs every Event Log entry. Attestation relay attacks of the CVE-2026-33697 class are structurally prevented.

**FROST nonce reuse (§15.8):** Critical security failure in FROST — nonce reuse exposes secret shares. Defense: per-operation nonce generation (CONF-KIA-16, CONF-KIA-17), nonce state must never be checkpointed or persisted. Hardware RNG health monitoring recommended.

**XPID revocation gap (§15.9):** Known open issue OQ-S-XPID-REV. Mitigation: always check jti against Revocation Registry independently of XPID. CAEP propagation subscription for near-real-time revocation signals. GEC Manifest staleness limits bound the exploitation window.

**Formal analysis status:** No formal verification of the FROST integration or XPID derivation security properties has been conducted. Formal analysis with RATS WG academic partners is planned post-Vienna.

---

## SOOS stack context

KIA sits at **Level 0 — Foundation**, the base layer of the SOOS stack. It depends on hardware attestation infrastructure (TPM, TEE, or FROST signing cluster) and the RATS architecture (RFC 9334). Every other SOOS draft depends on KIA: GAR records kernel identity on every entry; HEM decision records are KIA-signed; MJWT aud claims bind to `kernel_keypair_fingerprint`; CAP Violation Records are KIA-signed; the XPID is recorded in every GAR governance span.

Related drafts: [GAR](/drafts/gar) · [CAP](/drafts/cap) · [HEM](/drafts/hem) · [MJWT](/drafts/mjwt) · [MAD](/drafts/mad) · [SOV](/drafts/sov)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/kia)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-kia/)
- [All Drafts](/drafts) — the complete SOOS governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
