---
title: SOOS Stack
description: How the 12 SOOS IETF drafts compose into a complete infrastructure stack for agentic AI systems.
---

# SOOS stack

The twelve SOOS drafts are not a collection of independent specifications. They are a stack — five layers that compose into a complete infrastructure for agentic AI systems. Each layer depends on the one below it. Each layer produces something the layer above it consumes.

The stack reads bottom-up. Identity and provenance is the foundation. Audit and sovereignty is the output.

---

## The five layers

### Layer 1 — Identity & provenance

*The foundation. Every other layer depends on this one.*

Before an agent can do anything, three things must be established: what it was authorized to do, in what environment it is running, and what happens when it needs to stop.

**IDP — Intent Declaration Profile** specifies the signed record of what an agent was authorized to do, by whom, with what scope, and for how long. Every agent action begins with an IDP. Without a verifiable intent declaration, there is no basis for authorization, audit, or revocation.

**KIA — Kernel Instance Attestation** provides hardware-rooted attestation for the Governed Execution Context — the kernel environment in which the agent runs. KIA produces the canonical instance identifier that binds tokens, mandates, and audit records to a specific, verifiable execution environment. It is the trust anchor for the entire stack. MJWT (Layer 2) cannot be issued without it.

**HEM — Human Escalation Mechanism** specifies when and how an agent must pause execution and transfer control to a human principal. Defines nine observation trigger classes and the dual-layer architecture that separates kernel-enforced escalation from operator-configured thresholds. Human authority is always reachable.

---

### Layer 2 — Execution

*The governed loop. How agents act.*

**AEP — Agentic Execution Protocol** specifies the governed execution loop: Sense, Plan, Act, Record — each phase under kernel supervision, each action gated by authorization, each step producing a tamper-evident record. AEP consumes IDP (the intent declaration) and writes to GAR (the audit record).

**MJWT — Mandate JWT** is the signed, attenuated token that authorizes a specific agent action within a specific execution environment. An MJWT carries a hardware-attested audience claim binding it to a single KIA-attested GEC instance — it cannot be replayed in a different kernel context. The authorization token for a single act.

---

### Layer 3 — Policy

*What agents must never do. Regardless of instruction.*

**CAP — Constitutional AI Prohibitions** defines the prohibition layer — a five-tier hierarchy from absolute kernel-enforced limits (Tier 0-A) through operator-configurable constraints (Tiers 1–3), compiled at runtime into Cedar policy. CAP feeds into MAD (Layer 4): a delegation chain cannot grant authority that CAP prohibits.

**CAP-RRS — CAP Regulation Record Set** encodes jurisdiction-specific legal requirements as machine-readable Regulation Records that compile into CAP policy at agent initialization. APPI, FIEA, EU AI Act, and others. Operators declare their jurisdiction. The kernel enforces it. Compliance as a package import.

---

### Layer 4 — Delegation & trust

*How authority moves through multi-agent systems.*

**MAD — Mandate Delegation** governs how authority flows through delegation chains — and how it stops. Defines the three-layer revocation model, propagation completeness guarantees, and the CAEP/SSF profile for revocation events. When a mandate is revoked, every downstream agent in the chain is notified. Sibling sessions are not affected. MAD writes revocation events to GAR.

**PT — Progressive Trust** defines the behavioral trust accumulation model that governs how an agent's authorized scope expands or contracts over a session. Trust score falls on policy violation, restricting the agent to a constrained scope until restoration criteria are met. Agents earn scope. Authorization reflects track record.

---

### Layer 5 — Audit & sovereignty

*The output layer. What every governed session produces.*

**GAR — Governed Action Record** is the tamper-evident audit trail for every governed agent action, structured as a SCITT application profile. GAR records not just what the agent did, but the full session lifecycle — revocation events, partial completion states, recoveries, delegation-cluster achievability. Built for regulators, auditors, and the agents themselves.

**SOV — Sovereign Object** defines the governed object model — the thing an agent acts upon: a document, a booking, a contract, a financial instruction. SOV specifies the sovereignty rules that determine which agents may act on which objects under which mandate conditions. Objects carry their own governance state.

**FAIP — Federated Aggregation & Inference Privacy** specifies the privacy-preserving aggregation layer for behavioral and reasoning pattern data across agent deployments. Uses Verifiable Distributed Aggregation Functions (VDAF) to produce fleet-level governance signals with cryptographic privacy guarantees. Every governed session ends with a record — FAIP ensures that record cannot leak.

---

## Key normative dependencies

The stack is not loosely coupled. These dependencies are normative — they define the submission and adoption order.

| Dependency | Description |
|---|---|
| KIA → MJWT | MJWT requires the KIA-attested GEC instance identifier as a mandatory `aud` claim. MJWT cannot be issued without KIA §5.2. |
| IDP → AEP | Every AEP execution cycle begins with an IDP. AEP consumes the intent declaration as its authorization input. |
| CAP → MAD | A delegation chain cannot grant authority that CAP prohibits. CAP policy is evaluated before any MAD delegation is accepted. |
| MAD → GAR | Every mandate revocation event writes to GAR. The three-layer revocation model (MAD §3.6) is the normative source for ALE-001–012 event schemas. |
| AEP → GAR | Every AEP execution cycle produces a GAR record. The SENSE, PLAN, ACT, RECORD loop is the primary source of governed action records. |
| KIA → GAR | GAR records carry the KIA-attested GEC instance identifier, binding every audit record to a specific, verifiable execution environment. |

---

## Adoption model

The stack is a composition, not a requirement. Each draft can be adopted independently.

A team building a multi-agent financial system might adopt IDP, MJWT, MAD, and CAP-RRS without implementing the full stack. A team building a regulated healthcare agent might adopt HEM, CAP, and GAR first. A team building a privacy-preserving analytics pipeline might start with FAIP alone.

The stack defines how the pieces fit together when you want the full picture. It does not require that you use all of them.

**Better control means better software. Pick the layer that solves your immediate problem. Add layers as your deployment grows.**

---

*All drafts are published under Apache 2.0. For the complete dependency graph and normative cross-references, see the individual draft pages at [soosproject.ai/drafts](/drafts).*
