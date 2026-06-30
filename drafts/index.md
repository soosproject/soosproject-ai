---
title: SOOS Draft Suite
description: All 19 SOOS IETF Internet-Drafts, organised by stack layer. Each draft stands alone and can be adopted independently.
---

# SOOS draft suite

Nineteen interdependent protocol specifications (17 IETF Standards Track + 2 self-published) defining what agentic AI systems need to operate reliably at scale. Each draft addresses a distinct layer. Each stands alone and can be adopted independently. **Apache 2.0. No commercial version.**

| | | |
|---|---|---|
| **17** Class A (Datatracker) | **2** Class B (self-published) | **IETF 126** Vienna, July 2026 |

---

## Design philosophy

*Drafts that stand alone and work together.*

The SOOS draft suite fills gaps the IETF community needed filled. Each draft is useful on its own. All nineteen are stronger together. Neither fact cancels the other.

**01 — Each draft is self-contained**
No draft requires SOOS or the kernel to be useful. Every specification can be adopted independently — at the application layer, in existing systems, alongside other IETF standards. The stack is an option, not a prerequisite.

**02 — Gaps first, not stack first**
These drafts were written gap-first. We surveyed the IETF landscape, identified what was missing for agentic AI systems, and wrote specifications to fill exactly those gaps — not to promote a framework.

**03 — Core technology, not invented wheels**
Every draft builds on what already exists — JWT, SCITT, VDAF, CAEP, SSF, Cedar. Where a proven technology fits the problem, we use it. Where the gap is real, we specify new behavior as narrowly as possible.

**04 — Performance, not just compliance**
Governance is a byproduct of good engineering, not a tax on it. The specifications in this suite improve what agents can do, not just what they are permitted to do.

**05 — Human authority is never delegated away**
Every agent acts under a mandate that traces to a human principal. Revocation is immediate, propagation is complete, and human authority always remains reachable.

**06 — Law and regulation are machine-readable inputs**
Compliance with applicable law is a configuration, not a consulting engagement. Operators declare their jurisdiction. The system enforces it.

**07 — Enterprise-grade privacy and security**
Hardware-attested execution environments, audience-bound tokens, verifiable differential privacy. The baseline, not add-ons.

**08 — This work is a human-AI collaboration**
The protocol architecture, standards strategy, gap analysis, and governing design decisions are the work of the human authors. The drafting and text production were done in close partnership with AI. We say this plainly because transparency about how this work was made is part of what the work argues for.

**09 — Open source, unconditionally**
All drafts, schemas, conformance test suites, and reference implementations are published under Apache 2.0. There is no commercial version.

---

## Layer 0 — Execution Infrastructure

| Draft | Title | What it does |
|---|---|---|
| [KEE-1](/drafts/kee) | Kernel Execution Environment | Eight properties (P1–P8) every GEC must satisfy: TEE boundary, FROST signing, XPID derivation, Cedar evaluation, WAL tamper evidence, CAEP revocation, Merkle session blocks, audit non-suppressibility |
| [KEE-2/DIST](/drafts/kee2) *(Class B)* | Distributed Governance Runtime | Five distributed properties (D1–D5) enabling SOOS at national-mandate scale: Cedar cluster consensus, FROST signing cluster, Session Block GAR, catalog distribution, ACD session inheritance |

## Layer 1 — Identity & Execution

| Draft | Title | What it does |
|---|---|---|
| [KIA](/drafts/kia) | Kernel Identity and Attestation | Hardware-rooted identity for the GEC — three-level attestation hierarchy (L1/L2/L3), FROST threshold signing, XPID cross-principal correlation |
| [SOV](/drafts/sov) | Sovereign Object | The universal binding target for agent authority — causally ordered, policy-governed, stateful, with tamper-evident event stream |
| [MJWT](/drafts/mjwt) | Mandate JWT | Signed credential establishing agent authority ceiling — SO-scoped claims, consent_scope, seven-dimensional narrowing property |
| [IDP](/drafts/idp) | Intent Declaration Primitive | Cryptographically committed pre-action declaration — intake_endorsement, PD-EOD, confidence calibration, RETRY_CONTINUATION |
| [HEM](/drafts/hem) | Human Escalation Mechanism | When and how an agent escalates to a human — ten interaction classes, Human Readiness Score, INV-HEM-01 Surfacing Obligation |
| [AEP](/drafts/aep) | Agent Execution Protocol | The governed execution loop: SENSE, REASON, PLAN, ACT, OBSERVE — XPID binding, EOD, STALLED state, OTel mapping |

## Layer 2 — Delegation & Audit

| Draft | Title | What it does |
|---|---|---|
| [MAD](/drafts/mad) | Multi-Agent Delegation | Kernel-enforced delegation and cluster governance — SACR, hub-only constraint, XPID chaining, R-1 through R-7 revocation triggers |
| [GAR](/drafts/gar) | Governance Audit Record | Complete tamper-evident audit record — Session Block, OTel soos.governance.* namespace, mandatory provenance fields, SCITT anchoring |

## Layer 3 — Policy, Trust & Privacy

| Draft | Title | What it does |
|---|---|---|
| [CAP](/drafts/cap) | Constitutional AI Protocol | Three-tier prohibition model (Tier 0/1/2) — Cedar enforcement, ten interaction classes, MANIPULATION/PERFORMED_EMOTION/BIOMETRIC prohibitions |
| [CAP-RRS](/drafts/cap-rrs) | CAP Regulation Record Schema | Regulation-to-Cedar compiler — Regulation Record format, Constitutional Mandate Registry, LRI mechanism, INTERPRETATION_SUPERSEDED |
| [CAP-RRS-JP](/drafts/cap-rrs-jp) *(Class B)* | Japan e-LAWS LRI Profile | Japan-specific LRI binding — e-LAWS database, XMLSchemaForJapaneseLaw v3, APPI worked examples, endorsement authority table |
| [PT](/drafts/pt) | Progressive Trust | Behavioral trust accumulation — five scoring dimensions, signed policy tokens, session-level authorization scope expansion |
| [FAIP](/drafts/faip) | Federated Agent Intelligence Protocol | Privacy-preserving signal aggregation — k-anonymity, VDAFs, cross-operator behavioral intelligence without raw data exposure |

## Layer 4 — Governance Protocols

| Draft | Title | What it does |
|---|---|---|
| [ACD](/drafts/acd) | Agent Compliance Disclosure | Pre-session compliance handshake — two-layer ACD Record, jurisdiction/regulatory regime, KIA-signed, GAR-anchored |
| [PEER](/drafts/peer) | Cross-Principal Agent Communication | Cross-principal transaction governance — PEER Transaction Record, ptxn_id, mutual attestation handshake, cross-GAR audit correlation |
| [RGP](/drafts/rgp) | Resource Governance Protocol | Pre-session resource discovery — two-stage discovery, eight capability classes, four trust levels, DEC-RGP-08 autonomous fallback test |
| [GRP](/drafts/grp) | Governed Remediation Protocol | Normative failure response — FALLBACK/RETRY/ESCALATE/ROLLBACK action classes, publisher identity model, ALE-064 through ALE-069 |
| [AOP](/drafts/aop) | Agent Orchestration Protocol | Multi-agent mission governance — Mission Plan SO, Mission Status SO, Assignment Primitive, 14 mission lifecycle ALEs |
| [DAM](/drafts/dam) | Data Artifact Management | Data governance layer — KGA/AGA/EIA taxonomy, three-tier write authority model, GAR provenance interface |

---

All drafts are published under Apache 2.0. Source files are available at [github.com/soosproject](https://github.com/soosproject). For the full stack architecture, see [/stack](/stack). For the IETF gap analysis, see [/gaps](/gaps).
