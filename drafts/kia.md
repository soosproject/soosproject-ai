# Kernel Identity and Attestation

Layer 0 — Foundation
**draft-sato-soos-kia-06**
See the full draft protocol at [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kia/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems act on behalf of principals. There is no standard mechanism for a relying party — or the kernel itself — to verify that the governance kernel signing audit records has not been tampered with, is running the Cedar policy set that was approved, and is the same kernel that was assessed at deployment time.

Without KIA, governance claims are assertions from an unverified system. With KIA, they are attestations from a hardware-rooted, policy-verified kernel with a signed configuration manifest — where every Event Log entry, every HEM decision record, and every Session Audit Record is provably produced by the kernel that was assessed.

**The design premise:** governance enforcement is only meaningful if you can prove the enforcer has not been compromised. KIA is the protocol that makes that proof machine-readable.

---

## What's new in KIA-06

**GEC Manifest schema fully restored.** A WIMSE-style security review pass found that eight fields present in the original -02 schema — including `attestation_certificate`, the field the CVE-2026-33697 defense (§15.11) already assumed was present — had been silently absent from -03 through -05, despite -03's changelog claiming the schema was "carried forward from -02 in full." All eight are restored in -06; none is removed or renamed. If you built against -03, -04, or -05, check your Manifest schema against the current §5.2 text directly.

**A genuine bootstrapping contradiction, resolved (CONF-KIA-24).** CONF-KIA-18 forbids signing any KIA artifact below FROST quorum. CONF-KIA-19 requires the quorum-failure alert itself to be signed. Read literally, together, those two rules are unsatisfiable. CONF-KIA-24 makes the `KERNEL_AUDIT_ANOMALY` alert a named, narrow exception: sign it with whatever quorum remains, even below threshold, or deliver it unsigned through the out-of-band channel if fewer than two participants survive.

**XPID gets its own namespace UUID.** Versions -03 through -05 derived the XPID using the standard DNS UUID namespace on a name string that wasn't actually a DNS name — a theoretical but avoidable collision surface. -06 mints a dedicated KIA namespace UUID (`447994dc-9ddf-578f-a851-3a77d8f7ae42`) and calls this `xpid_derivation_version: "1.1"`. Implementations SHOULD move to 1.1; a GEC MAY still compute 1.0 for backward-compatible correlation against pre-06 audit history, but MUST declare it as such.

**FROST reference updated to its published RFC.** The normative FROST reference moves from the CFRG working draft to RFC 9591, with nonce-generation citations corrected to the RFC's actual section numbers.

**Two new sections that were overdue.** §15.13 adds the Denial of Service treatment RFC 3552/BCP 72 requires and this document didn't previously have — the quorum-failure refuse-to-sign design creates a real availability/security asymmetry worth naming explicitly (see below). §16 adds a first-ever Privacy Considerations section, because the XPID — deliberately persistent, deliberately cross-context, deliberately third-party-recomputable — is exactly the kind of identifier GDPR Art. 4(1) and APPI linkability analysis exist to address, and it had received no privacy treatment until now.

**OQ-KIA-EVIDENCE-VIS disclosed (from -05).** The Cross-Instance Trust Model verifies an XPID once presented, but has no stated mitigation for a federation participant obtaining structural visibility into Evidence it wasn't meant to appraise. No mitigation is specified yet — disclosed and tracked, resolution deferred to a successor document.

---

## Messages to key audiences

### IETF Working Groups

KIA-06 brings two novel RATS contributions:

**XPID as RATS extension**: The RATS architecture [RFC9334] provides no standard mechanism for correlating Attester-signed artifacts across federation boundaries when the Relying Party domain changes. XPID fills this gap using UUID-v5 derivation from the Attester's identity material — no trusted third party, no coordination protocol, derivable by any party with the GEC Manifest and Party Registry access.

**CVE-2026-33697 class defense**: a case study of how hardware-rooted attester identity prevents the attestation relay attack class (§15.11). The structural property: when attestation evidence is bound to a durable hardware-backed identity (the GEC keypair) rather than a transport-layer key, relay attacks that extract ephemeral TLS keys cannot forge the attestation. This defense text depends on `attestation_certificate` being present in the GEC Manifest — the exact field that was silently missing in -03 through -05, now restored.

For WIMSE: the XPID provides what WIMSE does not yet specify — a mechanism for correlating workload identity claims across independent trust domains where no shared identity provider exists.

To engage: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-kia/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

**Check your Manifest schema against -06, not -03 through -05.** If you implemented against any of those three revisions, you were working from an incomplete schema — `manifest_version`, `manifest_id`, `issued_at`, `soos_conformance_version`, `cedar_policy_set_hashes[]`, `so_type_registry_hash`, `xstate_definition_hashes[]`, and `attestation_certificate` are all normative and all restored in -06.

**FROST for HA deployments**: if you're running SOOS in a multi-region or high-availability configuration where no single node can hold the signing key, FROST (§4.1, now citing published RFC 9591) is a normative option. Key requirements: per-operation nonce generation (no caching), quorum enforcement (refuse to sign rather than degrade to single-signer), `deployment_constraints[]` declaration in the GEC Manifest. One new wrinkle: a quorum-failure alert is now a documented exception that signs with whatever partial quorum remains (CONF-KIA-24) rather than blocking entirely.

**XPID for cross-instance audit**: a stable per-agent identifier computable by any instance with the GEC Manifest and Party Registry, recorded automatically on every GAR span. Move to derivation version 1.1 (§6.2) — the new dedicated namespace UUID closes a theoretical collision surface the 1.0 derivation had.

The XPID revocation gap (OQ-S-XPID-REV) is still known: XPID doesn't get invalidated when a mandate is revoked, only the jti does. Mitigation unchanged: always check jti against the Revocation Registry (CONF-KIA-23) — don't rely solely on XPID for access control decisions.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/kia)

### Risk managers and legal

**A three-revision schema gap, found and closed.** From -03 through -05, this specification's actual GEC Manifest schema silently diverged from its own changelog's claim of full carry-forward — eight fields missing, one of them load-bearing for a documented CVE defense. Nothing in the project's own sprint records shows a decision to drop them; the most likely cause was an authoring pass working from an abbreviated summary table instead of the full prior-version text. It's fixed in -06, and it's disclosed in the changelog rather than folded in silently — worth knowing if you're relying on this specification for a conformance or procurement determination that predates -06.

**Threshold key custody**: FROST threshold signing means no single employee, vendor, or hardware failure can compromise the GEC signing key. The key exists only as t-of-n distributed shares.

**A named availability tradeoff, not just a security one (§15.13, new).** Compromising confidentiality or integrity under FROST requires an attacker to reach t participants. Denying availability requires isolating only n − t + 1 — a meaningfully easier bar that gets *easier*, not harder, as operators choose t closer to n for stronger security margins. This is now explicit in the specification with placement and monitoring recommendations, rather than an implicit tradeoff operators had to infer themselves.

**Structural CVE class defenses**: §15.10 and §15.11 document that the CVE-2025-13609 (identity takeover) and CVE-2026-33697 (attestation relay) classes are structurally prevented by KIA's architecture — with the -06 Manifest-schema restoration, §15.11's defense text and the actual schema now agree.

**New Privacy Considerations (§16).** The XPID is a stable, cross-context, third-party-recomputable identifier by design — the kind of identifier GDPR Art. 4(1) and APPI linkability analysis exist to address. This document now says so directly, names the tradeoff between immutability and rotation, and flags it as unresolved: no rotation mechanism is specified yet.

For audit purposes: the GEC Manifest's `xpid_derivation_version` field lets auditors verify which XPID algorithm version was in use during any session.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS KIA-06 (Kernel Identity and Attestation, draft-sato-soos-kia-06). Use the current §5.2 GEC Manifest schema directly — do not build against a -03, -04, or -05 copy, since those were missing eight normative fields (manifest_version, manifest_id, issued_at, soos_conformance_version, cedar_policy_set_hashes[], so_type_registry_hash, xstate_definition_hashes[], attestation_certificate) that are restored in -06. For FROST: each signing participant must generate a fresh nonce per operation. If the cluster drops below quorum (t participants), refuse to sign any artifact except the KERNEL_AUDIT_ANOMALY alert itself, which signs with whatever partial quorum is available or goes out-of-band unsigned if fewer than two participants remain (CONF-KIA-24) — do not degrade to single-signer for anything else. The threshold parameter t must not be reduced without a new key ceremony. For XPID: use derivation version 1.1 — namespace UUID 447994dc-9ddf-578f-a851-3a77d8f7ae42 (a dedicated KIA namespace, not the reused DNS namespace 1.0 used), name = kernel_keypair_fingerprint + ':' + party_registry_entry_hash. Record in every GAR span as soos.governance.xpid. Never accept client-supplied XPID as authoritative — always recompute from inputs. For federation: always check mandate jti against local Revocation Registry even if XPID is valid (OQ-S-XPID-REV known gap). New conformance requirements: CONF-KIA-16 through CONF-KIA-24."

**Key schema additions in KIA-06:**

| Field | Type | Description |
|---|---|---|
| `xpid_derivation_version` | string | `"1.1"` (current), `"1.0"` (backward-compat only), or `"none"` |
| `attestation_certificate` | object | **Restored in -06** — GEC Attestation Certificate, embedded in full |
| `manifest_version`, `manifest_id`, `issued_at`, `soos_conformance_version`, `cedar_policy_set_hashes[]`, `so_type_registry_hash`, `xstate_definition_hashes[]` | various | **Restored in -06** — all normative since -02, silently absent in -03 through -05 |
| FROST `deployment_constraints[]` entry | string | `"frost:t-of-n:<t>-<n>"` |
| GAR: `soos.governance.xpid` | string (UUID) | XPID in every governance span |

**XPID derivation (version 1.1):**

```typescript
import { v5 as uuidv5 } from 'uuid';

// Dedicated KIA namespace UUID (minted in -06), not the reused DNS namespace
const KIA_XPID_NAMESPACE = '447994dc-9ddf-578f-a851-3a77d8f7ae42';

function deriveXPID(
  kernelKeypairFingerprint: string,  // SHA-256 hex of GEC public key
  partyRegistryEntryHash: string     // SHA-256 hex of canonical Party Registry entry JSON
): string {
  const name = `${kernelKeypairFingerprint}:${partyRegistryEntryHash}`;
  return uuidv5(name, KIA_XPID_NAMESPACE);
}
```

### Government and regulators

**Key custody for high-risk AI**: FROST threshold signing provides multi-party key custody that can be mapped to regulatory requirements for dual control over critical AI infrastructure. For jurisdictions requiring human oversight at the key management layer, the t-of-n signing cluster provides an auditable human-controlled signing quorum — and -06's §15.13 now documents explicitly that the choice of t relative to n is a security/availability tradeoff, not a security-only parameter, which is directly relevant to any procurement or audit standard that evaluates availability alongside integrity.

**Structural CVE defenses with normative analysis**: §15.10 and §15.11 document the specific attack classes that KIA's architecture structurally prevents. As of -06, the underlying schema these defenses depend on has been verified complete — a real gap existed for three revisions where the documented defense assumed a field the schema didn't actually specify.

**A new, explicit Privacy Considerations section (§16)** addresses the linkability properties of a persistent cross-context identifier under GDPR Art. 4(1) and APPI — relevant to any DPIA or privacy conformance review of a KIA-conformant deployment.

For collaboration on jurisdiction-specific attestation requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI governance kernels can be tampered with after deployment, can be impersonated, and can be compromised through attestation channel relay attacks. There is no standard mechanism that prevents all three simultaneously.

**Mechanism:** KIA anchors GEC identity to a hardware-backed keypair (or FROST threshold keypair) that is independent of any transport-layer key. Every signed artifact — Event Log entries, GEC Manifests, HEM decisions — is signed by this durable anchor. The XPID extends this identity to cross-instance federation without a trusted third party.

**Output:** A signed GEC Manifest (kernel identity, Cedar policy hash, PTD endpoint, XPID derivation version, FROST cluster parameters, attestation certificate) that is the kernel's attestation of its own integrity; XPID-correlated GAR audit spans across federation boundaries; and FROST-threshold-signed artifacts that survive individual signing node failures — with a signed or out-of-band alert now guaranteed even when the cluster itself has lost quorum.

**Who verifies it:** Operators, auditors, regulators, federated kernel instances, and RATS Relying Parties — anyone who needs to prove that the governance record was produced by the attested kernel running the assessed configuration.

---

## The CVE differentiators

**CVE-2025-13609 class: Identity takeover via claimed identifier**

The attack: register a new agent with a different TPM device while claiming an existing agent's UUID, overwriting the legitimate agent's identity.

KIA's structural prevention: the XPID is not an asserted value. It is derived deterministically from the GEC's `kernel_keypair_fingerprint` and the agent's Party Registry entry hash. An attacker cannot claim an existing XPID without possessing the original key material or compromising the Party Registry entry. Any XPID presented without matching derivation inputs is immediately detectable. §15.10 documents this with full normative analysis.

**CVE-2026-33697 class: Attestation channel binding relay**

The attack: bind attestation evidence to an ephemeral TLS key rather than a durable identity anchor, enabling an attacker who extracts the ephemeral key to relay the attested session.

KIA's structural prevention: KIA identity is anchored to the GEC keypair in the secure element — independent of any TLS session. Event Log entries are signed by the secure-element-held key, not by any transport key. This defense depends on `attestation_certificate` being present and verified in the GEC Manifest — the field silently missing in -03 through -05 and restored in -06, closing the gap between what §15.11 claimed and what the schema actually specified.

---

## Use cases

**FROST HA deployment across availability zones**

A financial services operator runs SOOS across three cloud availability zones. No single AZ can hold the complete signing key. A 2-of-3 FROST signing cluster distributes one secret share per AZ. Normal operation: any two AZs sign collaboratively. Single AZ failure: the remaining two AZs meet quorum and continue signing. Two AZ failure: quorum lost, signing halts for every artifact except the `KERNEL_AUDIT_ANOMALY` alert itself, which signs with whatever partial quorum remains or goes out-of-band unsigned. No signing degradation to single-signer mode for anything else.

**Cross-instance audit correlation: disaster response**

During a disaster response operation, a monitoring agent (running on a prefectural SOOS kernel) and an execution agent (running on a municipal SOOS kernel) both govern the same relief coordination workflow. Both kernels derive the agent's XPID (version 1.1) from their respective GEC Manifests and the agent's Party Registry entry. Both GAR records carry `soos.governance.xpid` with the same value. A regulator reconstructing the incident timeline can correlate both audit chains using the XPID — without either kernel exposing its full Session Audit Record to the other.

**Post-incident integrity verification with CVE defense evidence**

Following an unexpected agent action, a security team needs to prove that the governance kernel was not compromised via attestation relay. §15.11 provides the normative analysis: every Event Log entry is signed by the secure-element-held GEC keypair, not by any transport key. The audit team presents the GAR session record and the GEC Manifest, including its now-verified-complete `attestation_certificate` field. Any relay attack that substituted a transport key for the GEC key would produce signatures that fail verification against the manifest.

---

## How this builds on existing work

**RFC 9334 (RATS Architecture)** defines the general model for remote attestation. KIA extends the RATS model with XPID as a cross-domain Attester identity correlation primitive, and the CVE-2026-33697 defense analysis as a concrete RATS attester architecture case study.

**RFC 9591 (FROST)** — the published Two-Round Threshold Schnorr Signatures RFC, now the normative reference in place of the earlier CFRG working draft. KIA profiles FROST for the GEC keypair case: nonce generation requirements, quorum failure behavior, and GEC Manifest declaration format.

**RFC 9562 (UUIDs)** — Section 6.5's guidance to mint a dedicated namespace UUID for new applications, rather than reusing a predefined namespace for an unrelated purpose, is what motivated -06's move from the reused DNS namespace to KIA's own dedicated XPID namespace.

**GAR-07 (draft-sato-soos-gar)** established the OTel semantic convention and Session Block architecture. KIA's XPID is recorded as `soos.governance.xpid` in every GAR governance span, enabling cross-session and cross-instance audit correlation using the existing GAR infrastructure.

---

## Security

**Key security properties:** GEC keypair is hardware-rooted and transport-independent. FROST threshold signing distributes key material across t-of-n secure elements. XPID is derivation-based and non-forgeable without key material. INV-9 signs every Event Log entry. Attestation relay attacks of the CVE-2026-33697 class are structurally prevented — and the GEC Manifest schema this depends on is now verified complete after the -06 restoration.

**FROST nonce reuse (§15.8):** Critical security failure in FROST — nonce reuse exposes secret shares. Defense: per-operation nonce generation (CONF-KIA-16, CONF-KIA-17), nonce state must never be checkpointed or persisted.

**Denial of Service via quorum isolation (§15.13, new):** the same refuse-to-sign design that protects integrity creates an availability asymmetry — compromising confidentiality/integrity needs t compromised participants, denying availability needs only n − t + 1 isolated ones, and that gap widens as t approaches n for stronger security margins. Not a flaw in the refuse-rather-than-degrade design — silently degrading would trade a detectable availability failure for an undetectable integrity one — but operators MUST account for it in signing cluster topology, participant placement, and monitoring.

**XPID revocation gap (§15.9/§6.4):** Known open issue OQ-S-XPID-REV. Mitigation: always check jti against the Revocation Registry independently of XPID (CONF-KIA-23).

**Evidence visibility to unintended verifiers (§15.12/§6.6, disclosed in -05):** the Cross-Instance Trust Model has no stated mitigation for a federation participant obtaining structural visibility into Evidence it isn't authorized to appraise. Tracked as OQ-KIA-EVIDENCE-VIS; no mitigation specified yet.

**XPID linkability (§16, new):** the XPID's deliberate persistence and cross-context recomputability is exactly the shape of identifier GDPR Art. 4(1) and APPI linkability analysis address. Anyone who can observe `soos.governance.xpid` across two or more GAR spans — including, per the Evidence-visibility gap above, an unintended verifier — can correlate that agent's activity for the lifetime of the Party Registry entry. No rotation mechanism is specified yet; resolution deferred alongside the other two open issues.

**Formal analysis status:** No formal verification of the FROST integration or XPID derivation security properties has been conducted. Formal analysis with RATS WG academic partners remains planned.

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
