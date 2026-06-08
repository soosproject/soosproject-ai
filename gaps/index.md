---
title: Gap Analysis
description: 19 governance gaps in the current IETF landscape for agentic AI systems, and the SOOS drafts written to fill them.
---

# Gap analysis

The SOOS draft suite was written gap-first. Before writing a single specification, we surveyed the IETF landscape and identified what was missing specifically for agentic AI systems acting on behalf of humans across consequential objects.

This page documents all 19 gaps we found — what is missing, what the risk is without it, and which SOOS draft addresses it.

The IETF has produced excellent work. SCITT, WIMSE, CAEP, SSF, VDAF, OAuth 2.1, and others provide strong foundations. None of them were designed for autonomous agents acting on contracts, financial instructions, bookings, or medical records. That is not a criticism — it is where the technology went next, faster than anyone anticipated.

---

## Summary table

| # | Gap | Risk without it | Draft |
|---|---|---|---|
| G-01 | No agent intent declaration standard | Agents act without verifiable authorization scope | IDP |
| G-02 | No kernel-level execution attestation | Token binding has no hardware root of trust | KIA |
| G-03 | No human escalation protocol | Agents self-authorize at decision boundaries | HEM |
| G-04 | No governed execution loop standard | No tamper-evident per-step audit trail | AEP |
| G-05 | No attenuated delegation token for agents | Tokens replay across execution environments | MJWT |
| G-06 | No machine-readable prohibition layer | Hard limits require custom enforcement per deployment | CAP |
| G-07 | No jurisdiction-specific regulation encoding | Compliance requires bespoke legal engineering per market | CAP-RRS |
| G-08 | No multi-agent delegation chain standard | Authority passes without attenuation or revocation guarantees | MAD |
| G-09 | No agent session revocation lifecycle | Revocation does not propagate completely through chains | MAD |
| G-10 | No behavioral trust accumulation model | Authorization is static; track record is ignored | PT |
| G-11 | No full agent session audit record | Partial completion, recovery, and achievability are unrecorded | GAR |
| G-12 | No SCITT application profile for agents | Audit records lack tamper-evidence and causal ordering | GAR |
| G-13 | No governed object model | Objects carry no governance state of their own | SOV |
| G-14 | No vCon integration for agent sessions | Conversation records are detached from action audit trails | SOV |
| G-15 | No federated privacy aggregation for agent data | Fleet-level signals require exposing individual session records | FAIP |
| G-16 | No VDAF profile for agent reasoning patterns | Behavioral analytics lack cryptographic privacy guarantees | FAIP |
| G-17 | No CAEP profile for agent revocation events | Revocation signals use ad-hoc formats incompatible with SSF | MAD |
| G-18 | No progressive trust standard for agents | Scope expansion is manual and policy-independent | PT |
| G-19 | No normative anchor for agent session recovery | Recovery from partial mandate revocation is undefined | MAD, GAR |

---

## Identity & provenance gaps

### G-01 — No agent intent declaration standard

**Gap:** No common format exists for recording what an autonomous agent was authorized to do, by whom, with what scope, expiry, and under which principal chain. Every deployment invents its own representation.

**Risk:** Without a verifiable intent declaration, there is no basis for authorization decisions, audit trail construction, or revocation targeting. Agents act with implicit scope that cannot be verified by downstream systems, auditors, or the agents themselves.

**Draft:** [IDP — Intent Declaration Profile](/drafts/idp) defines the signed intent object that must accompany every agent action: mandatory fields for principal, scope, target resource, expiry, and reasoning mode. Model-agnostic by design.

---

### G-02 — No kernel-level execution attestation

**Gap:** No standard exists for hardware-rooted attestation of the execution environment in which an agent runs. Tokens and audit records float free of any specific execution context — they can be replayed or forged in a different environment without detection.

**Risk:** Without kernel attestation, audience binding for delegation tokens is meaningless — there is no verifiable identity for the "audience." Audit records cannot be tied to a specific, verifiable execution environment, making forensic analysis unreliable.

**Draft:** [KIA — Kernel Instance Attestation](/drafts/kia) provides hardware-rooted attestation for the Governed Execution Context. KIA produces the canonical GEC instance identifier used by MJWT for audience binding and by GAR for audit record anchoring.

---

### G-03 — No human escalation protocol

**Gap:** No standard exists for how an autonomous agent pauses execution and transfers control to a human principal when it reaches a decision boundary, detects a policy conflict, or encounters a situation outside its authorized scope.

**Risk:** Agents either fail silently (continuing incorrectly) or fail noisily (crashing with no transfer path). Neither is acceptable for consequential operations. Without a standard escalation protocol, human oversight is not reliably reachable even when the agent correctly identifies the need for it.

**Draft:** [HEM — Human Escalation Mechanism](/drafts/hem) defines nine observation trigger classes, the dual-layer architecture separating kernel-enforced from operator-configured thresholds, and the normative escalation handoff sequence.

---

## Execution gaps

### G-04 — No governed execution loop standard

**Gap:** No standard specifies how an autonomous agent cycles through sense, plan, act, and record phases under kernel supervision — with authorization gating at each phase transition and tamper-evident recording of every step.

**Risk:** Agent execution is a black box. Actions cannot be traced to specific authorization inputs. Debugging failures requires reconstruction from logs that were not designed for forensic use. Compliance attestation is impossible.

**Draft:** [AEP — Agentic Execution Protocol](/drafts/aep) specifies the governed execution loop with mandatory authorization gates and per-step audit record production. Every AEP execution cycle produces a GAR record.

---

### G-05 — No attenuated delegation token for agents

**Gap:** Existing JWT profiles (RFC 9068, WIMSE) do not address the specific requirements of agent delegation: attenuation of scope across a chain, audience binding to a hardware-attested execution environment, and blocking of issuance when an agent is in a recovery state.

**Risk:** Delegation tokens can be replayed in different execution environments. There is no standard mechanism to bind a token to a specific kernel instance, enabling credential theft and replay attacks that existing audience validation cannot detect.

**Draft:** [MJWT — Mandate JWT](/drafts/mjwt) extends JWT with mandatory KIA-attested audience binding, attenuation semantics, and the `AGENT_IN_RECOVERY` blocking condition. Built on RFC 9068 and the OIDF delegation token architecture.

---

## Policy gaps

### G-06 — No machine-readable prohibition layer

**Gap:** No standard exists for encoding what an autonomous agent must never do, regardless of instruction — expressed as machine-readable policy that compiles to an enforcement layer rather than natural language guidelines.

**Risk:** Hard behavioral limits are implemented as ad-hoc guardrails at the application layer, duplicated per deployment, inconsistently maintained, and not verifiable by external auditors or regulators. There is no standard basis for certifying that a governed agent cannot perform a prohibited action.

**Draft:** [CAP — Constitutional AI Prohibitions](/drafts/cap) defines a five-tier prohibition hierarchy compiled at runtime into Cedar policy. Tier 0-A prohibitions are absolute and kernel-enforced. Tiers 1–3 are operator-configurable within declared jurisdiction.

---

### G-07 — No jurisdiction-specific regulation encoding

**Gap:** No standard exists for encoding jurisdiction-specific legal requirements — data protection law, financial regulation, healthcare mandates — as machine-readable records that compile automatically into agent policy at initialization.

**Risk:** Compliance with applicable law requires bespoke legal engineering for every market. Operators must maintain jurisdiction-specific policy sets manually, creating audit exposure and increasing the cost of multi-market deployment to the point where it is prohibitive for most organizations.

**Draft:** [CAP-RRS — CAP Regulation Record Set](/drafts/cap-rrs) defines the Regulation Record format for jurisdiction-specific legal requirements. Includes normative examples for Japan's APPI (Article 17) and FIEA (Article 38), with EU AI Act and US framework examples in the registry.

---

## Delegation & trust gaps

### G-08 — No multi-agent delegation chain standard

**Gap:** No standard exists for how authority passes through a chain of agents — with normative attenuation (child cannot exceed parent scope), revocation propagation, and completeness guarantees that ensure every agent in a chain is notified when authority is withdrawn.

**Risk:** Multi-agent systems pass authority informally. A compromised sub-agent can claim authority it was never granted. When a top-level mandate is revoked, downstream agents may continue operating indefinitely — with no standard mechanism to reach them.

**Draft:** [MAD — Mandate Delegation](/drafts/mad) defines the delegation chain model, attenuation rules, and three-layer revocation lifecycle. Propagation completeness is normative: every agent in the chain must receive revocation notification.

---

### G-09 — No agent session revocation lifecycle

**Gap:** CAEP and SSF define event streaming for credential revocation, but do not address the specific lifecycle of an agent session under revocation: partial completion handling, AGENT_IN_RECOVERY state, UNKNOWN completion disposition, and achievability assessment.

**Risk:** When an agent session is revoked mid-execution, there is no standard for what state the session enters, how partial work is recorded, or what triggers recovery. Revocation leaves agents in undefined states that cannot be audited or remediated consistently.

**Draft:** [MAD §3.6](/drafts/mad) defines the full agent session revocation and recovery lifecycle, including the R-1 through R-6 trigger taxonomy, the three-layer revocation model, AGENT_IN_RECOVERY blocking, and the CAEP/SSF profile for revocation events.

---

### G-10 — No behavioral trust accumulation model

**Gap:** No standard exists for accumulating a trust score across an agent session based on demonstrated compliance, and using that score to govern scope expansion or restriction dynamically during execution.

**Risk:** Authorization is binary and static. An agent either has access or it does not, regardless of how it has behaved in the current session. There is no standard mechanism for restricting scope after detected anomalies or expanding scope after demonstrated reliability.

**Draft:** [PT — Progressive Trust](/drafts/pt) defines the behavioral trust accumulation model, trust score thresholds, CONSTRAINED scope conditions, and the normative restoration criteria for scope re-expansion after a trust event.

---

### G-18 — No progressive trust standard for agents

**Gap:** Existing trust frameworks (NIST SP 800-63, OpenID RISC) address user identity trust, not agent behavioral trust. There is no standard for how trust accrues or decays across a governed agent session based on demonstrated compliance with its mandate.

**Risk:** Agent deployments cannot implement consistent, verifiable behavioral trust without custom solutions. Cross-organization trust assessments of agent behavior are impossible without a shared standard.

**Draft:** [PT — Progressive Trust](/drafts/pt) addresses this directly. The PT model is agent-specific — it is designed for the governed execution context, not for user identity management.

---

## Audit & record gaps

### G-11 — No full agent session audit record

**Gap:** Existing audit standards (SCITT, RFC 3161) address document timestamping and supply chain transparency. None address the full lifecycle of an agent session: partial completion states, revocation disposition, recovery gates, delegation-cluster achievability, and causal ordering of actions within a session.

**Risk:** Agent session failures cannot be fully audited. The information needed to determine what an agent did, why it stopped, what state it left resources in, and whether its goal was achievable is not recorded in a standard format. Regulatory investigation and forensic analysis require reconstruction from disparate logs.

**Draft:** [GAR — Governed Action Record](/drafts/gar) defines the full agent session audit record as a SCITT application profile. GAR records include ALE (Agent Lifecycle Events) categories covering session open, revocation, partial completion, recovery, and achievability state transitions.

---

### G-12 — No SCITT application profile for agents

**Gap:** SCITT (RFC 9052/9053) provides the transparency log infrastructure. No application profile exists that maps SCITT's notary, issuer, and append-only log model to the specific requirements of agent action records.

**Risk:** Agent audit records are stored in ad-hoc formats that cannot be verified against a SCITT transparency log. Cross-organization audit verification is impossible. The tamper-evidence guarantees of SCITT are not applied to agent behavior.

**Draft:** [GAR](/drafts/gar) is structured as a SCITT application profile. Every GAR record is a SCITT claim with a defined issuer (the GEC kernel), notary model, and append-only log semantics.

---

## Sovereignty & privacy gaps

### G-13 — No governed object model

**Gap:** No standard exists for the objects that agents act upon — documents, bookings, contracts, financial instructions — that would allow those objects to carry their own governance state: which agents may act on them, under which mandate conditions, and what audit trail they require.

**Risk:** Objects are passive data. There is no standard mechanism for an object to refuse an agent action that violates its governance rules, or to record what agents have acted on it and under what authority. Data sovereignty is unenforceable at the object level.

**Draft:** [SOV — Sovereign Object](/drafts/sov) defines the governed object model. SOV specifies object sovereignty rules, mandate binding conditions, and the composition interface with vCon conversation records.

---

### G-14 — No vCon integration for agent sessions

**Gap:** vCon (draft-ietf-vcon-vcon-container) defines a container format for conversation records. No standard integration exists between vCon conversation records and agent action audit trails — they are maintained separately, making it impossible to correlate what was said with what the agent subsequently did.

**Risk:** For agents that operate based on human conversation (booking agents, advisory agents, support agents), the conversation record and the action record are disconnected. Disputes about what the agent was instructed to do cannot be resolved by reference to a combined record.

**Draft:** [SOV §3.2](/drafts/sov) defines the composition interface between SOV sovereign objects and vCon conversation records, enabling a single correlated record of conversation and action.

---

### G-15 — No federated privacy aggregation for agent data

**Gap:** Every governed agent session produces a behavioral record. No standard exists for aggregating signals across those records — for fleet-level governance, anomaly detection, and model improvement — without exposing individual session data.

**Risk:** Operators face a binary choice: expose individual session records to extract fleet-level signals (privacy violation), or forgo fleet-level governance entirely (operational blindness). Neither is acceptable at enterprise scale.

**Draft:** [FAIP — Federated Aggregation & Inference Privacy](/drafts/faip) specifies the privacy-preserving aggregation layer using VDAF. Fleet-level signals are produced with cryptographic privacy guarantees. Individual session records are never exposed.

---

### G-16 — No VDAF profile for agent reasoning patterns

**Gap:** VDAF (draft-irtf-cfrg-vdaf) defines the Verifiable Distributed Aggregation Function framework. No application profile exists for agent reasoning pattern data — the specific measurement types, aggregation functions, and differential privacy parameters required for behavioral analytics across governed agent fleets.

**Risk:** Organizations building privacy-preserving analytics on agent behavior must design their own VDAF application profiles, with no standard basis for interoperability, independent verification, or regulatory audit.

**Draft:** [FAIP §6.3](/drafts/faip) defines the normative VDAF profile for agent reasoning pattern data, including the Prio3/Poplar1 algorithm selection criteria, differential privacy composition parameters, and the three normative properties: verifiability, distributed computation, and DP composability.

---

### G-17 — No CAEP profile for agent revocation events

**Gap:** CAEP (Continuous Access Evaluation Protocol) defines the event format for credential and session revocation signals. No profile exists for the specific revocation events generated by agent mandate revocation — which have different semantics, propagation requirements, and state transitions than user session revocation.

**Risk:** Agent revocation events are transmitted in ad-hoc formats incompatible with CAEP receivers. SSF infrastructure built for user session management cannot be reused for agent mandate management, requiring parallel infrastructure investment.

**Draft:** [MAD §3.6.2](/drafts/mad) defines the normative CAEP/SSF profile for agent revocation events, mapping the R-1 through R-6 trigger taxonomy to CAEP event types and defining the propagation semantics for each.

---

### G-19 — No normative anchor for agent session recovery

**Gap:** When an agent session is revoked mid-execution, the recovery path — from AGENT_IN_RECOVERY state through mandate_hold clearance to resumed or terminated execution — is undefined. There is no standard for what triggers recovery, what authorization is required to clear a hold, or how partial completion state is preserved and reported.

**Risk:** Recovery from partial revocation is ad-hoc. Different implementations make different choices about what constitutes a recoverable state, what authority is needed to resume, and how to record the gap between revocation and recovery. Cross-system recovery is impossible without a shared standard.

**Draft:** [MAD §3.6.3 and GAR](/drafts/mad) together define the recovery lifecycle. MAD §3.6.3 specifies the recovery gate conditions and mandate_hold semantics. GAR defines the completion_state recording requirements (INV-15, INV-16) that apply to every revocation-terminated session.

---

*All 19 gaps were identified before any SOOS draft was written. The specifications were written to address the gaps, not the other way around. For the full normative cross-references, see the individual draft pages at [soosproject.ai/drafts](/drafts).*
