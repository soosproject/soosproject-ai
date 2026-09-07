# Governed Remediation Protocol (GRP)
Layer 4 — Remediation Governance
**draft-sato-soos-grp-02**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-grp/) · [SOOS Stack](/drafts/)

---

## The problem

When an AI agent hits a failure — a resource goes offline, a policy prohibition fires, a session stalls — the question of what the agent does next is a governance question, not an implementation detail. An agent that retries indefinitely drains its mandate budget without authorization. An agent that silently switches to a lower-trust resource takes an action its principal never approved. An agent that gives up without notifying anyone leaves a broken commitment chain with no audit record. Without a normative specification of governed failure response, every agent deployment builds its own — inconsistently, unauditably, unsafely.

The design premise: remediation capability is a kernel primitive. What an agent does when things go wrong must be governed by the same policy infrastructure that governs what it does when things go right.

---

## Messages to key audiences

### IETF Working Groups

GRP is a coordination draft: it introduces no new cryptographic or identity primitives. It specifies the governed coordination of existing SOOS mechanisms — the fallback boundary rule from RGP (DEC-RGP-08, adopted verbatim from draft-sato-soos-rgp-02 §14.1), the escalation protocol from HEM, the audit obligations from GAR, and the session state machine from AEP. The key normative contributions are the publisher identity model for change event ingestion (three publisher types: P-TYPE-1 SOOS principal, P-TYPE-2 EPR-registered external, P-TYPE-3 well-known URI), the five trigger-type-to-action-class mapping table, and three mechanisms new in this revision: artifact-level impact refinement (§9.4), a transitive walk of DAM's `derived_from` lineage graph that scopes a `CONTENT_CORRECTION` change event to the specific artifacts actually built from the corrected data rather than treating an entire resource as uniformly affected; Remediation Outcome Verification (§11.7), which checks a completed FALLBACK or RETRY against the session's own EOD rather than accepting a clean mechanical success record at face value; and a change-event replay defense (§16.6). GRP defines ALE-064 through ALE-070 (seven new GAR ALE types; ALE-066 is renamed in this revision from `GRP_FALLBACK_ACTIVATED` to `GRP_MEDIATED_FALLBACK_ACTIVATED`, removing a near-duplicate name collision with RGP's own `ALE-026`; ALE-070, `GRP_REMEDIATION_VERIFIED`, is new). Three OQs remain deferred: OQ-GRP-02 (CAS schema detail), OQ-GRP-03 (cross-cluster multi-hop query interface), OQ-GRP-06 (change event format as standalone draft).

### App builders

Your agents will fail. Resources go offline. APIs return 503. Cedar will DENY something mid-session. GRP is the specification that tells your kernel what to do in each case — deterministically, auditably, with human approval where it matters. Four things to implement for GRP conformance: (1) register your change event publishers (EPR for external sources, well-known URI trust anchors for P-TYPE-3 sources like GitHub Security Advisories or npm); (2) configure retry policy in your MJWT mandate (max retries, backoff, HEM class on ceiling); (3) pre-declare fallback resources in the IDP EOD before session start; (4) expose rollback endpoints for reversible actions. The RETRY ceiling, DEC-RGP-08 evaluation, and HEM routing are all kernel-enforced — your agent can't bypass them.

Optionally: if a change event publisher can identify the specific artifact its correction supersedes (`affected_da_id` on a `CONTENT_CORRECTION` event), GRP automatically scopes remediation review to the artifacts actually built from that data — direct or transitively downstream, through as many intermediate artifacts as the derivation chain has — instead of treating your entire resource as uniformly affected by the correction.

### Regulators and policy teams

GRP provides the machine-readable record of every remediation decision an AI agent makes when execution encounters a failure. The complete chain — the triggering condition, every retry attempt, the three-condition autonomous fallback test result, any human escalation event, and the final resolution or abandonment — is reconstructable from the GAR audit log alone. This is the audit infrastructure that supports EU AI Act Article 14 (human oversight) and Article 17 (quality management / incident examination) for high-risk AI systems. A regulator can query the GAR for a session ID and retrieve the complete remediation lifecycle without relying on the deployer's own reporting.

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I am implementing the SOOS Governed Remediation Protocol (GRP), draft-sato-soos-grp-02. GRP specifies four action classes for kernel-level failure response in SOOS-governed agentic AI systems: FALLBACK (autonomous resource substitution, subject to DEC-RGP-08 three-condition test), RETRY (bounded by MJWT mandate retry_policy, exponential backoff, HEM-PRE-2 on ceiling), ESCALATE (routes to HEM with class determined by failing condition), and ROLLBACK (reversible action undo with rollback_nonce for replay prevention, triggers HEM-HIGH-1 post-completion). Five trigger types: GRP-T1 (Cedar DENY), GRP-T2 (RGP resource failure), GRP-T3 (AEP STALLED/ERROR), GRP-T4 (MAD mandate boundary), GRP-T5 (consent absent). Change events require publisher verification: P-TYPE-1 (KIA signature), P-TYPE-2 (EPR-registered key), P-TYPE-3 (well-known URI trust anchor); the GEC must also reject a change event whose (publisher_id, event_id) pair was already admitted earlier in the same session, since session_nonce alone is fixed for the session's duration and can't distinguish a fresh event from a replay of one already processed. change_class includes CONTENT_CORRECTION (a publisher amending previously-provided data, distinct from RESOURCE_STATE) — when a CONTENT_CORRECTION event carries affected_da_id (the da_id of the corrected artifact), the GEC must additionally walk DAM's derived_from.direct_inputs graph transitively (direct children, then their children, and so on, bounded to 20 hops by default) to scope remediation to the artifacts actually built from the corrected data rather than the whole resource. After a FALLBACK or RETRY completes, the GEC must additionally check the result against the session's own EOD and record ALE-070 (GRP_REMEDIATION_VERIFIED) with an outcome of MATCHED, PARTIAL, PLAN_B_MATCHED, or UNMATCHED (AEP's own vocabulary) — a mechanically successful action is not the same as a verified one; UNMATCHED forces ESCALATE at HEM-HIGH-1. ALE-064 through ALE-070 are the seven GRP audit log entry types; ALE-066 (fired on FALLBACK activation) is GRP_MEDIATED_FALLBACK_ACTIVATED, named to avoid colliding with RGP's own ALE-026 for the same underlying decision — a GEC mediating a fallback under GRP must record it as ALE-064/066 here, not RGP's ALE-026. DEC-RGP-08 is adopted verbatim from draft-sato-soos-rgp-02 §14.1. Implement against the draft at https://soosproject.ai/drafts/grp."

**Key schema fields (Change Event):**

| Field | Type | Description |
|---|---|---|
| `event_id` | String | Globally unique within publisher's stream |
| `publisher_type` | Enum | P-TYPE-1 / P-TYPE-2 / P-TYPE-3 |
| `publisher_signature` | String | JWS compact serialization over payload |
| `session_nonce` | String | GEC-provided session nonce; mismatch = reject |
| `change_class` | Enum | RESOURCE_STATE / DEPENDENCY_UPDATE / POLICY_UPDATE / MANDATE_CONDITION / CONTENT_CORRECTION |
| `affected_component` | String | resource_id from Resource Map SO |
| `affected_da_id` | String | Optional; REQUIRED for CONTENT_CORRECTION when the publisher can identify the corrected artifact; enables §9.4 artifact-level refinement |
| `change_severity` | Enum | LOW / MEDIUM / HIGH / CRITICAL |

**DEC-RGP-08 evaluation (Cedar example):**

```cedar
permit(
  principal is SOOS::GEC,
  action == SOOS::Action::"AutonomousFallback",
  resource is SOOS::FallbackCandidate
) when {
  resource.trust_level >= resource.primary_trust_level &&
  resource.capability_class == resource.sub_goal_required_class &&
  resource.cost_model + context.prior_commitments <=
    context.mandate_budget
};
```

### Government and regulators

GRP operationalizes the human oversight requirement that AI governance frameworks mandate but do not specify at the protocol level. Every GRP ESCALATE action routes to a designated human principal through HEM before the agent proceeds. Every autonomous action — RETRY within ceiling, FALLBACK passing DEC-RGP-08 — is recorded in the GAR with the condition-by-condition evaluation result. The audit trail is not produced by the agent; it is produced by the kernel, making it tamper-evident and not subject to agent override. For government deployments with emergency response use cases, GRP's autonomous FALLBACK path (when DEC-RGP-08 conditions pass) enables continuity of operations without human delay, while the HEM escalation path ensures that trust-level-reducing decisions never happen without principal authorization.

---

## Core technology

**Problem:** AI agents have no normative specification for what to do when execution encounters a failure — every deployment builds ad hoc remediation logic that is ungoverned, unauditable, and bypasses the principal sovereignty the mandate was designed to protect.

**Mechanism:** GRP classifies every failure condition into one of five trigger types, evaluates the applicable action class and autonomous authority boundary (including DEC-RGP-08 for FALLBACK and the RETRY ceiling from the MJWT mandate), executes autonomous actions where authorized, and routes all other decisions to a human principal through HEM.

**Output:** A complete GAR audit chain (ALE-064 through ALE-070) recording every step of the remediation lifecycle — trigger, attempts, condition evaluations, outcome verification, human decisions, and final resolution or abandonment — reconstructable from a single GAR session query.

**Who verifies it:** Regulators and deployment operators query the GAR record for the session. The chain is tamper-evident via KEE-1 P7 (WAL prev_span_hash + Merkle root). The GEC, not the agent, produces the record.

---

## The four action classes

| Action Class | Autonomous Condition | HEM Triggered When |
|---|---|---|
| **FALLBACK** | All three DEC-RGP-08 conditions pass (trust ≥ primary; capability class covered; budget within mandate) | Any condition fails → class-specific HEM (HEM-HIGH-1 / HEM-PRE-2 / HEM-DS-1) |
| **RETRY** | Within MJWT mandate retry ceiling; exponential backoff enforced | Ceiling reached → HEM-PRE-2 |
| **ESCALATE** | Always permitted; routes to HEM | This IS the escalation — HEM class from Section 10.2 |
| **ROLLBACK** | GEC evaluates rollback endpoint availability; rollback_nonce prevents replay | Post-completion → HEM-HIGH-1 for human review |

The ordering principle: RETRY → FALLBACK → ESCALATE (least to most disruptive). GRP-T1 (Cedar DENY) skips RETRY directly to FALLBACK or ESCALATE. GRP-T4 and GRP-T5 permit only ESCALATE.

**Remediation Outcome Verification (§11.7):** FALLBACK and RETRY can each complete with a clean mechanical success record while the outcome the session actually needed still wasn't delivered — the resource substitution went through, but not the actual goal. New in -02, the GEC checks the completed action's result against the session's own EOD and records ALE-070 (`GRP_REMEDIATION_VERIFIED`) with an outcome of MATCHED, PARTIAL, PLAN_B_MATCHED, or UNMATCHED — reusing AEP's own vocabulary so the mid-session check is directly comparable to the session's eventual outcome. UNMATCHED forces ESCALATE at HEM-HIGH-1; PARTIAL escalates at HEM-PRE-2 unless the mandate's `remediation_policy` explicitly permits it. ROLLBACK and ESCALATE are out of scope — ROLLBACK already forces human review, and ESCALATE already is the human decision.

---

## Publisher identity model

Change events are the primary external input to GRP. An ungoverned change event pipeline is an attack vector: a spoofed change event triggers real remediation actions. GRP defines three publisher types:

**P-TYPE-1 (SOOS Principal)** — highest trust. Signed with GEC KIA key. Appropriate for SOOS kernel-to-kernel signaling.

**P-TYPE-2 (EPR-Registered External)** — trust-on-first-registration. Signed with asymmetric key registered in the kernel-managed External Publisher Registry. Appropriate for vulnerability feeds and compliance status services.

**P-TYPE-3 (Well-Known URI)** — discovery-based trust. Publisher exposes `/.well-known/soos-grp-publisher` with signing keys and validity window, analogous to OIDC discovery. Appropriate for GitHub Security Advisories, npm, PyPI, and other upstream open source publishers.

Every change event carries a `session_nonce` generated by the GEC. Nonce mismatch = immediate rejection, no remediation action taken.

`session_nonce` is fixed for the session's duration, so it can't by itself catch a replayed event — a previously-admitted, validly-signed event resent within the same session. The GEC additionally tracks every `(publisher_id, event_id)` pair it admits and rejects a repeat outright, before it re-enters impact assessment or triggers any action class a second time.

---

## Use cases

**ATP booking agent — horse trek unavailability (Ponyhouse Farm)**
A guest requests a horse trek at MyAuberge K.K. The booking agent's GEC receives a GRP-T2 trigger: the horse trek is AT_CAPACITY. The GEC evaluates DEC-RGP-08 for the pre-declared fallback (farm walk, same supplier, TRUST-1). All three conditions pass. The GEC autonomously activates the farm walk fallback and emits ALE-066 with the three-condition results. The booking continues without operator involvement. If condition 2 fails (strict sub-type matching in the mandate), HEM-PRE-2 routes to the operator for confirmation.

**Enterprise procurement — retry ceiling and authorized fallback**
A procurement agent's primary supplier API returns 503 for the third time. RETRY ceiling reached. GRP triggers HEM-PRE-2: the principal receives the retry failure context and three options (wait, activate fallback, terminate). The principal authorizes the fallback supplier. DEC-RGP-08 evaluates the fallback: all three conditions pass. The GEC activates the fallback under HEM authorization. ALE-066 records the HEM decision reference alongside the DEC-RGP-08 results.

**Emergency response — cross-cluster route failure**
A governed emergency response system receives a GRP-T2 signal affecting the primary evacuation route resource. The alternate route passes DEC-RGP-08 (same trust, same capability class, within mandate budget). Autonomous FALLBACK activates in under one second. ALE-066 provides the post-incident auditors with the complete decision record. For a change event that propagates across clusters: each receiving GEC independently verifies the originating GEC's SACR propagation authority before acting on the signal.

**Supplier correction — artifact-level impact refinement**
A supplier issues a `CONTENT_CORRECTION` change event amending a previously-confirmed booking record, carrying `affected_da_id` for the corrected Externally Ingested Artifact. Rather than treating every artifact associated with that supplier's resource as impacted, the GEC walks DAM's `derived_from` graph: the itinerary document built directly from the correction is in scope, and so is a summary report built from that itinerary — two hops downstream — even though the report's own `derived_from` never mentions the original correction directly. A booking confirmation built from an *earlier, unrelated* record at the same supplier is correctly excluded. The remediation review reaches every artifact actually built from the corrected data, not just its immediate children.

---

## How this builds on existing work

**RGP (draft-sato-soos-rgp-02)** RGP defines the resource discovery and availability model that generates GRP's primary trigger signals, and defines DEC-RGP-08 (the three-condition autonomous fallback test) in §14.1. GRP adopts DEC-RGP-08 verbatim — GRP implementors must treat RGP §14.1 as the authoritative source for the fallback boundary rule. When GRP mediates a fallback that RGP also governs, GRP's own ALE-064/ALE-066 are the authoritative GAR record for that event — RGP's ALE-026 applies only when RGP evaluates a fallback directly, with no GRP layer involved, so the same decision is never double-recorded under both.

**DAM (draft-sato-soos-dam-01)** DAM's `derived_from` field — recorded for privacy propagation and poisoning-trace purposes independent of GRP — is what GRP's artifact-level impact refinement (§9.4) queries, transitively, to scope a `CONTENT_CORRECTION` event to the specific artifacts built from the corrected data. This is additive to, not a replacement for, GRP's Resource Map SO dependency scoping.

**HEM (draft-sato-soos-hem-07)** HEM defines the human escalation lifecycle: the escalation request structure, designation chain, and six human decision types. GRP is the source of remediation-context escalation requests to HEM; HEM processes them. GRP specifies which HEM interaction class (HEM-HIGH-1, HEM-PRE-2, HEM-DS-1, HEM-LIM-1, HEM-CONSENT) is triggered for each failing condition.

**GAR (draft-sato-soos-gar-08)** GAR is the tamper-evident audit record that consumes GRP's seven new ALE types (ALE-064 through ALE-070). The chain-traceability requirement — the resolution ALE must carry a reference to the initiating trigger ALE — is the design rule that makes single-query remediation chain reconstruction possible for regulators.

---

## Related work

No existing automated remediation system (Dependabot, Renovate, CSAF consumers, GitHub Security Advisories) combines: (1) a governance layer binding remediation to mandate authority, (2) publisher identity verification for change event ingestion, (3) a normative human escalation boundary for actions that exceed autonomous scope, and (4) a complete tamper-evident audit trail. GRP is the first protocol specification to address all four together.

CSAF (Common Security Advisory Format) defines the change event content format; it does not specify the governed response. A CSAF advisory feed is a valid P-TYPE-3 publisher in a GRP deployment.

---

## Security

Key security properties: publisher verification is mandatory before any change event triggers remediation; DEC-RGP-08 is evaluated by the GEC, not self-certified by the agent; the RETRY ceiling prevents budget exhaustion attacks; rollback_nonce prevents ROLLBACK replay; cross-cluster propagation requires SACR pre-authorization independent of the trigger event.

**Spoofed change event injection:** session_nonce binding + publisher signature verification + ALE-064 on rejection. Residual: KIA revocation bounds compromised-credential exposure.

**Remediation loop exploitation:** RETRY ceiling from MJWT mandate + exponential backoff + HEM-PRE-2 on ceiling. Residual: mandate issuer integrity governed by KIA.

**Change event replay:** an adversary or a network retransmission re-sends a previously-admitted, validly-signed change event within the same session — `session_nonce` is fixed for the session's duration and can't by itself catch this. Defense: the GEC tracks every `(publisher_id, event_id)` pair admitted this session and rejects a repeat as ALE-064 (`duplicate_event_id`) before it re-enters impact assessment or triggers any action a second time, avoiding a phantom duplicate GAR record and — for ESCALATE — a duplicate HEM request to the human principal for a condition already resolved. Residual: a compromised publisher signing key can mint change events with fresh `event_id` values indefinitely; same residual risk as spoofed injection above.

**GRP authority bypass:** DEC-RGP-08 evaluated by GEC, Cedar-enforced; missing ALE = conformance violation + ROLLBACK trigger. Residual: KEE-1 P5/P2 govern GEC integrity.

Formal analysis status: no formal verification has been conducted on this version. Security properties are asserted based on architectural analysis.

---

## SOOS stack context

GRP sits at the coordination layer above RGP and AEP, and below HEM. It depends on: RGP (DEC-RGP-08, Resource Map SO, ALE-025 trigger), DAM (`derived_from` lineage graph for artifact-level impact refinement, §9.4), AEP (session states, EOD fallback pre-declaration, EOD outcome vocabulary reused by §11.7), HEM (all escalation routing), CAP (Cedar DENY trigger, SUSPENDED state), MAD (mandate scope validation, SACR propagation authority), GAR (ALE-064–070), IDP (EOD, P-TYPE-1 publisher registration), KIA (P-TYPE-1 verification, GEC integrity), SOV (EPR as SO instance), MJWT (retry_policy, remediation_policy, Resource Envelope), KEE-1 (GEC integrity P5/P2).

GRP is consumed by: no current SOOS drafts depend on GRP downstream. GRP closes the stack — it is the terminal protocol for session failure response.

Related drafts: [RGP](/drafts/rgp) · [DAM](/drafts/dam) · [HEM](/drafts/hem) · [AEP](/drafts/aep) · [GAR](/drafts/gar) · [CAP](/drafts/cap) · [MAD](/drafts/mad)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-grp/)
- [SOOS Project](https://soosproject.ai)
- Contact: tomsato@myauberge.jp
