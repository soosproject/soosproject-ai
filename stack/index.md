---
title: SOOS Stack
description: How the 19 SOOS protocols compose into a complete infrastructure stack for agentic AI systems.
---

# SOOS stack

The nineteen SOOS drafts are not a collection of independent specifications. They are a stack — five layers that compose into a complete infrastructure for agentic AI systems. Each layer depends on the one below it. Each layer produces something the layer above it consumes.

The stack reads bottom-up. Execution infrastructure is the foundation. Governance protocols are the output.

---

## The five layers

### Layer 0 — Execution Infrastructure

*The trust anchor. Everything else runs on this.*

**KEE-1 — Kernel Execution Environment** defines the eight properties (P1–P8) that every SOOS Governance Execution Controller must satisfy: TEE boundary enforcement, FROST threshold signing, XPID derivation, Cedar evaluation, WAL tamper evidence, CAEP revocation propagation, Merkle session block integrity, and audit non-suppressibility. KEE-1 is the deployment compliance specification — it defines what it means for a kernel to be a SOOS kernel.

**KEE-2/DIST — Distributed Governance Runtime** *(Class B, post-Vienna)* extends KEE-1 with five distributed properties for national-mandate scale: Cedar cluster consensus via Raft/etcd (D1), FROST signing cluster management (D2), Session Block GAR with Merkle DAG reducing signing overhead by ~100× (D3), catalog distribution protocol with coordinated effective-date activation (D4), and ACD session inheritance for delegation chains (D5).

---

### Layer 1 — Identity & Execution

*The foundation. Every other layer depends on this one.*

**KIA — Kernel Identity and Attestation** provides hardware-rooted attestation for the GEC — three-level hierarchy (L1 software / L2 sidecar / L3 TEE), FROST threshold signing for HA deployments, and XPID (Cross-Principal Identifier) for cross-instance federation audit correlation. KIA is the trust anchor for the entire stack. Every signed artifact in SOOS traces to a KIA-attested keypair.

**SOV — Sovereign Object** defines the governed object model — the universal binding target for agent authority. Every MJWT is scoped to a Sovereign Object instance. Every GEC-mediated state transition acts on an SO. Authorization in SOOS is object-level, not API-level.

**MJWT — Mandate JWT** is the signed credential establishing an agent's authority ceiling for a session. Extends JWT with SO-scoped claims (so_id, state_constraint, session_limit), consent_scope binding, seven-dimensional narrowing property for delegation chains, and algorithm integrity enforcement. The agent cannot mint its own permissions.

**IDP — Intent Declaration Primitive** defines the structured pre-action commitment an agent submits before each execution. Intake_endorsement produces a GEC-signed Endorsed EOD before session start. PD-EOD derives governed EODs from natural-language prompts. Every agent action is traceable to a committed, tamper-evident intent record.

**HEM — Human Escalation Mechanism** specifies when and how an agent escalates to a human principal — ten interaction classes (HEM-PRE-1/2, HEM-DS-1/2, HEM-LIM-1, HEM-DIV-1, HEM-HIGH-1, HEM-FAT-1, HEM-EMO-1, HEM-CONSENT), Human Readiness Score for fatigue detection, and INV-HEM-01 (The Surfacing Obligation). Human authority is always reachable.

**AEP — Agent Execution Protocol** specifies the governed execution loop: SENSE, REASON, PLAN, ACT, OBSERVE. XPID binding at session open, Expected Outcome Declaration pre-commitment, STALLED and PLAN_B_ACTIVE states, RETRY_CONTINUATION with substantiation requirement, and OTel soos.aep.* mapping for real-time observability.

---

### Layer 2 — Delegation & Audit

*How authority moves and how actions are recorded.*

**MAD — Multi-Agent Delegation** governs how authority passes through delegation chains and what happens when revocation arrives mid-execution. Version -03 adds the Sub-Agent Composition Record (SACR) for kernel-governed sub-agent spawning, hub-only topology constraint, XPID cross-cluster chaining, and full normative R-1 through R-7 revocation trigger specifications with completion state matrices.

**GAR — Governance Audit Record** defines the complete tamper-evident audit record: Session Block with Merkle root and KIA threshold signature, SOOS Governance Semantic Convention (soos.governance.* OTel namespace), mandatory provenance fields on every Cedar evaluation record, and SCITT transparency log anchoring. GAR is what makes the governance record inspectable by regulators without GEC access.

---

### Layer 3 — Policy, Trust & Privacy

*What agents must never do. What they must earn.*

**CAP — Constitutional AI Protocol** places a constitutional layer above all principal authority. Three-tier prohibition model: Tier 0-A (absolute, kernel-enforced — MANIPULATION, PERFORMED_EMOTION, BIOMETRIC_SIGNAL_INFERENCE), Tier 0-B (treaty-anchored), Tier 1 (jurisdiction-specific law), Tier 2 (operator ethics). Cedar compilation from machine-readable Regulation Records.

**CAP-RRS — CAP Regulation Record Schema** is the compiler that translates human-readable legal obligations into Cedar security policies. Defines the Regulation Record format, the Law Reference Interface (LRI) for statute-direct policy authoring, INTERPRETATION_SUPERSEDED event type for legal change propagation, and the Constitutional Mandate Registry — a package manager for law.

**CAP-RRS-JP — Japan e-LAWS LRI Profile** *(Class B)* profiles the LRI mechanism for Japan's e-LAWS database, specifying XPath addressing conventions, endorsement authority table, APPI Chapter IV worked examples, and the e-Gov catalog publication workflow with Digital Agency and IPA.

**PT — Progressive Trust** defines behavioral trust accumulation — five scoring dimensions (SAS, JS, ES, PS, AS) encoded into signed policy tokens. Agents earn scope based on their actual track record. Trust score falls on policy violation, restricting authorization to constrained scope until restoration criteria are met.

**FAIP — Federated Agent Intelligence Protocol** specifies privacy-preserving aggregation of behavioral signals across operator domains using k-anonymity and Verifiable Distributed Aggregation Functions (VDAFs). Fleet-level governance signals with cryptographic privacy guarantees — no operator sees raw session data from any other.

---

### Layer 4 — Governance Protocols

*The operational governance surface.*

**ACD — Agent Compliance Disclosure** defines the pre-session compliance handshake: a two-layer KIA-signed ACD Record carrying jurisdiction, regulatory regime, CAP profile ID (Layer 1) and prohibition tier summary, consent scope (Layer 2). Resource providers can gate access on ACD presentation without accessing the agent's full GAR audit chain.

**PEER — Cross-Principal Agent Communication** governs transactions between two AI agents operating under independent mandate roots. PEER Transaction Record (PTR) and ptxn_id (jointly-derived Cross-Principal Transaction ID) link two independent GAR audit chains at the moment of a cross-principal transaction. Addresses the Provenance Paradox: honor-system self-certification fails adversarially.

**RGP — Resource Governance Protocol** enables pre-session governed resource discovery: two-stage discovery (Stage 1 well-known URI fingerprint, Stage 2 full governance envelope), eight capability classes, four trust levels, Resource Map Sovereign Object, and DEC-RGP-08 (three-condition autonomous fallback test). Authorization precedes assignment.

**GRP — Governed Remediation Protocol** specifies the normative failure response set: FALLBACK (DEC-RGP-08), RETRY (MJWT ceiling), ESCALATE (HEM routing), ROLLBACK (reversible undo). Three publisher types for change event ingestion. Six new GAR ALE types (ALE-064–069). Every failure decision is governed, auditable, and reconstructable from a single GAR query.

**AOP — Agent Orchestration Protocol** governs multi-agent mission decomposition: Mission Plan SO (pre-declared sub-goal DAG), Mission Status SO (live execution state), Assignment Primitive (SACR-backed kernel handoff), three re-planning authority levels (NONE/BOUNDED/AUTONOMOUS), and 14 mission lifecycle ALE types (ALE-042–055). AOP is the highest-layer protocol in the suite.

**DAM — Data Artifact Management** specifies the data governance layer: KGA (Kernel-Generated Artifact, kernel-only write), AGA (Agent-Generated Artifact, agent-write with kernel audit), EIA (Externally Ingested Artifact, external-write with kernel validation). Three-tier write authority model and normative interface between artifact production and the GAR provenance chain.

---

## Key normative dependencies

| Dependency | Description |
|---|---|
| KEE-1 → all | Every SOOS draft requires a KEE-1 compliant GEC as the execution environment |
| KIA → MJWT | MJWT aud claim MUST equal KIA kernel_keypair_fingerprint |
| KIA → GAR | Every GAR Session Block KIA-signed; XPID in every governance span |
| IDP → AEP | Every AEP execution cycle begins with an IDP pre-commitment |
| CAP → MAD | Delegation cannot grant authority CAP prohibits at any tier |
| MAD → GAR | R-1 through R-7 revocation events write to GAR (ALE-009–016) |
| RGP → GRP | GRP adopts DEC-RGP-08 verbatim; RGP Resource Map SO is GRP's primary trigger source |
| AEP → AOP | Every AOP sub-agent runs its own AEP session |
| MAD → AOP | Every AOP Assignment Primitive backed by a SACR (MAD §4) |
| KEE-1 → KEE-2 | KEE-2 is additive to KEE-1; all P1–P8 properties remain normative |

---

## Adoption model

The stack is a composition, not a requirement. Each draft can be adopted independently.

A team building a multi-agent financial system might adopt IDP, MJWT, MAD, and CAP-RRS without implementing the full stack. A team building a regulated healthcare agent might adopt HEM, CAP, and GAR first. A team building a cross-principal marketplace might start with PEER and ACD.

The stack defines how the pieces fit together when you want the full picture. It does not require that you use all of them.

**Better control means better software. Pick the layer that solves your immediate problem. Add layers as your deployment grows.**

---

*All drafts are published under Apache 2.0. For the complete dependency graph and normative cross-references, see the individual draft pages at [soosproject.ai/drafts](/drafts).*
