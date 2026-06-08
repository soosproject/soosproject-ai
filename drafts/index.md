---
title: SOOS Draft Suite
description: All 12 SOOS IETF Internet-Drafts, organised by stack layer. Each draft stands alone and can be adopted independently.
---

# SOOS draft suite

Twelve interdependent IETF Internet-Drafts specifying what agentic AI systems need to operate reliably at scale. Each draft addresses a distinct layer. Each stands alone and can be adopted independently. **Apache 2.0. No commercial version.**

| | | |
|---|---|---|
| **12** Active drafts | **5** Stack layers | **IETF 126** Vienna, July 2026 |

---

## Design philosophy

*Drafts that stand alone and work together.*

The SOOS draft suite fills gaps the IETF community needed filled. Each draft is useful on its own. All twelve are stronger together. Neither fact cancels the other.

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

## Identity & provenance

| Draft | Title | What it does |
|---|---|---|
| [IDP](/drafts/idp) | Intent Declaration Profile | Signed, verifiable record of what an agent was authorized to do and by whom |
| [KIA](/drafts/kia) | Kernel Instance Attestation | Hardware-rooted identity for the execution environment — the trust anchor for the stack |
| [HEM](/drafts/hem) | Human Escalation Mechanism | When and how an agent must pause and transfer control to a human principal |

## Execution

| Draft | Title | What it does |
|---|---|---|
| [AEP](/drafts/aep) | Agentic Execution Protocol | The governed execution loop: Sense, Plan, Act, Record — under kernel supervision |
| [MJWT](/drafts/mjwt) | Mandate JWT | Signed, attenuated token binding a specific action to a specific execution environment |

## Policy

| Draft | Title | What it does |
|---|---|---|
| [CAP](/drafts/cap) | Constitutional AI Prohibitions | Hard behavioral limits on governed agents, regardless of instruction |
| [CAP-RRS](/drafts/cap-rrs) | CAP Regulation Record Set | Jurisdiction-specific legal requirements as machine-readable policy — a package import, not a Cedar authoring problem |

## Delegation & trust

| Draft | Title | What it does |
|---|---|---|
| [MAD](/drafts/mad) | Mandate Delegation | How authority flows through multi-agent chains — and how revocation propagates completely |
| [PT](/drafts/pt) | Progressive Trust | Agents earn scope — behavioral trust accumulation that governs session-level authorization |

## Audit & record

| Draft | Title | What it does |
|---|---|---|
| [GAR](/drafts/gar) | Governed Action Record | Tamper-evident audit trail for every agent action — built for regulators, auditors, and agents themselves |

## Sovereignty & privacy

| Draft | Title | What it does |
|---|---|---|
| [SOV](/drafts/sov) | Sovereign Object | The thing an agent acts upon — document, booking, contract, financial instruction — carries its own governance state |
| [FAIP](/drafts/faip) | Federated Aggregation & Inference Privacy | Every governed session ends with a record — FAIP ensures that record cannot leak |

---

All drafts are published under Apache 2.0. Source files and conformance test suites are available at [github.com/soosproject](https://github.com/soosproject). For the full stack architecture, see [/stack](/stack). For the IETF gap analysis, see [/gaps](/gaps).
