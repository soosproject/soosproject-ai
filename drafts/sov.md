# Sovereign Object

Layer 1 — Core Semantics
**draft-sato-soos-sov-01**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-sov/)
See [SOOS Stack](/stack) implementation

---

## The problem

Agentic AI systems act on things. The things they act on — a document, a financial account, a customer record, a contract — need to be represented in a format that the governance kernel can reason about, that Cedar policies can evaluate against, and that the audit record can reference unambiguously after the fact.

SOV defines the Sovereign Object: the kernel-managed resource entity that is the subject of every governed action in a SOOS deployment. Not as an application-layer data model. As a protocol-level entity type with a defined lifecycle, a kernel-enforced state machine, and a Cedar-readable schema — the unit of governance that makes the SOOS stack's policies, escalations, and audit records coherent.

**The design premise:** the Sovereign Object is to agentic AI what the IP packet is to the internet — the universal primitive that makes ecosystem-scale deployment possible. Every governed action has a subject. SOV is the format that makes that subject machine-readable, kernel-authoritative, and auditable.

---

## Messages to key audiences

### IETF Working Groups

SOV is foundational to the SOOS stack but is not a profile of an existing IETF standard — it defines a new entity type. It is relevant to the SPICE working group (credentials about resources), the SCITT working group (transparency for resource state claims), and the OAUTH working group (resource indicators in token requests).

The SOV state machine (INV-13: Zone A must be kernel-authoritative) is the boundary between kernel-governed and application-governed resource state. IETF working groups that address resource representation, access control, or audit should note that SOV provides the governance-layer resource abstraction that those protocols can reference without needing to define it themselves.

To engage on SOV: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-sov/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system today, your agent's actions have subjects — files, accounts, records, services — but those subjects are not represented in a form that the governance kernel can reason about. Cedar policies reference entity schemas; HEM triggers reference resource context; GAR records reference resource identifiers. Without a standard resource entity type, governance is generic and imprecise.

SOV closes this gap by specifying the Sovereign Object schema: the entity type that Cedar evaluates, that HEM classifies actions against, and that GAR references in every audit record. Your application resources become governed resources by being registered as Sovereign Objects. The kernel then knows what they are, what state they are in, and what actions are permitted against them.

Without SOV: governance is abstract. With SOV: governance is resource-specific, state-aware, and Cedar-evaluable.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/sov)

### Risk managers and legal

The Sovereign Object is the resource identifier that appears in every GAR audit record. When an auditor asks "what did the agent do to that account?" the answer is a query against GAR filtered by so_id — the Sovereign Object identifier for that account. The full action history, every Cedar evaluation, every escalation, every state transition, is associated with that so_id.

For legal discovery and incident response: the so_id is the primary resource audit key, complementing the mandate_id (MJWT) as the primary authority audit key. Together they allow a complete reconstruction of any agent action: who authorised it (mandate_id) and what it was done to (so_id).

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS SOV (Sovereign Object, draft-sato-soos-sov-01). This is an IETF protocol that defines the kernel-managed resource entity for the SOOS governance stack. A Sovereign Object has: an so_id (unique identifier), an so_type (from the SO Type Registry), a zone (A = kernel-authoritative, B = application-authoritative), a state (from the SO state machine), and a Cedar entity schema. INV-13 requires that Zone A objects MUST have kernel-authoritative state — no application can write Zone A state without a Cedar PERMIT. The SO state machine defines four states: ACTIVE, SUSPENDED, REVOKED, ARCHIVED."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `so_id` | string | Unique Sovereign Object identifier |
| `so_type` | string | SO type from the SO Type Registry |
| `zone` | enum | ZONE_A (kernel-authoritative) / ZONE_B (application-authoritative) |
| `state` | enum | ACTIVE / SUSPENDED / REVOKED / ARCHIVED |
| `principal_id` | string | Principal that owns this Sovereign Object |
| `mandate_id` | string | MJWT jti of the mandate under which the SO was created |
| `gec_id` | string | GEC instance that maintains this SO |
| `created_at` | integer | Unix timestamp of SO creation |
| `state_updated_at` | integer | Unix timestamp of last state transition |
| `cedar_entity_type` | string | Cedar entity type this SO maps to |
| `so_metadata` | object | Application-defined metadata (Zone B only) |

**SO state machine:**

| State | Meaning | Permitted transitions |
|---|---|---|
| **ACTIVE** | Normal governed operation | → SUSPENDED, → REVOKED |
| **SUSPENDED** | Temporarily halted — HEM escalation or PT FLOOR | → ACTIVE (on operator approval), → REVOKED |
| **REVOKED** | Permanently terminated — CAP Tier 0-A violation or operator action | → ARCHIVED |
| **ARCHIVED** | Immutable. Audit record retained. | (terminal) |

**Minimal SO registration example:**

```json
{
  "so_id": "so-procurement-account-7f3a",
  "so_type": "FinancialAccount",
  "zone": "ZONE_A",
  "state": "ACTIVE",
  "principal_id": "principal:tom-sato@myauberge.jp",
  "mandate_id": "mandate-a1b2c3d4",
  "gec_id": "gec-prod-7f3a2c",
  "created_at": 1749456000,
  "cedar_entity_type": "FinancialAccount"
}
```

### Government and regulators

The Sovereign Object is the technical primitive that makes "who did what to which resource" a query answerable from the governance record rather than reconstructed from application logs. For regulated industries — finance, healthcare, legal — where specific resources are subject to specific regulatory constraints, the SO type and zone designation make those constraints Cedar-evaluable and GAR-auditable.

For AI liability frameworks: the so_id establishes the resource subject of an AI action at the kernel level. Combined with the mandate_id, it provides the two coordinates — authority and subject — that a liability determination requires.

For collaboration on jurisdiction-specific SO type registry requirements: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** AI governance protocols produce audit records, Cedar evaluations, and escalation events — but the resource those actions target is represented differently in every application. There is no standard kernel-level resource entity type that Cedar can evaluate, GAR can reference, and HEM can classify actions against.

**Mechanism:** SOV defines the Sovereign Object schema and the SO state machine. Application resources are registered as Sovereign Objects at mandate issuance or first access. The kernel maintains Zone A state authoritatively — no Zone A state write occurs without a Cedar PERMIT (INV-13). Cedar policies are written against the SO entity schema. Every governance record references the so_id.

**Output:** A kernel-managed resource entity — so_id, so_type, zone, state, Cedar entity schema — that is the subject of every governed action. The SO state machine ensures that resource state is kernel-authoritative for Zone A objects. The SO Type Registry provides the extensible taxonomy of resource types.

**Who verifies it:** Auditors and compliance teams who need to reconstruct an agent's complete action history on a specific resource, regulators who need to verify that resource-specific constraints were enforced, and operators who need to know the current state of resources under active agent mandates.

---

## Zone A and Zone B

SOV distinguishes two zones of resource governance authority.

**Zone A — kernel-authoritative:** The kernel maintains the authoritative state of Zone A Sovereign Objects. No application may write Zone A state without a Cedar PERMIT evaluated by the kernel. Zone A is the home of resources with regulatory significance, high-value resources, or resources where state integrity is critical: financial accounts, identity records, legally binding documents, medical records.

**Zone B — application-authoritative:** The application maintains the authoritative state of Zone B Sovereign Objects. The kernel governs actions against Zone B objects but does not maintain their state directly. Zone B is appropriate for resources where application-layer state management is standard practice and kernel-level state authority would be impractical: files, messages, derived data, temporary artefacts.

**INV-13:** Zone A MUST be kernel-authoritative. An implementation that allows application-layer writes to Zone A state without a Cedar PERMIT is non-conforming.

---

## The SO Type Registry

SOV defines an extensible SO Type Registry — a catalogue of named resource types, each with a Cedar entity schema, a default zone assignment, and an audit record format.

Initial registry entries:

| SO Type | Default Zone | Description |
|---|---|---|
| `FinancialAccount` | ZONE_A | Bank account, investment account, payment instrument |
| `IdentityRecord` | ZONE_A | Identity credential, KYC record, authentication profile |
| `LegalDocument` | ZONE_A | Contract, regulatory filing, legally binding record |
| `MedicalRecord` | ZONE_A | Clinical record, prescription, diagnostic result |
| `DataArtifact` | ZONE_B | File, dataset, derived output |
| `Message` | ZONE_B | Email, notification, communication record |
| `ComputeResource` | ZONE_B | Cloud instance, container, compute allocation |
| `ExternalService` | ZONE_B | Third-party API endpoint, external data source |

Operators may extend the registry with deployment-specific SO types. Extensions MUST include a Cedar entity schema and a zone designation; they SHOULD be registered with the IANA SO Type sub-registry.

---

## Use cases

**Financial agent with Zone A account governance**

A financial services firm registers customer accounts as `FinancialAccount` Zone A Sovereign Objects at agent mandate issuance. Every agent action against an account — read, write, transfer initiation, recommendation — is Cedar-evaluated against the SO entity schema. The GAR record for each action references the so_id. The account audit trail is complete, kernel-authoritative, and queryable by so_id.

**Document management agent with lifecycle tracking**

A legal firm deploys an agent to draft and review contracts. Contracts are registered as `LegalDocument` Zone A Sovereign Objects. The SO state machine tracks each document: ACTIVE during drafting, SUSPENDED while under human review (HEM escalation), back to ACTIVE on approval, ARCHIVED after execution. The state history is kernel-maintained; the application cannot advance a document to the next stage without a Cedar PERMIT.

**Multi-resource action audit**

An agent action touches three Sovereign Objects: reads from a `DataArtifact` (Zone B), writes to a `FinancialAccount` (Zone A), sends a `Message` (Zone B). GAR records three entries — one per so_id. The Zone A write entry records the Cedar PERMIT that authorised the write. The audit is resource-granular: the compliance team can query the account's complete action history independently of the agent's complete mandate history.

---

## How this builds on existing work

**RFC 8707 (Resource Indicators for OAuth)** defines the `resource` parameter for OAuth token requests, identifying the target resource a token is requested for. SOV's so_id is designed to be usable as a resource indicator in MJWT token exchange requests — the resource being governed is identified at the mandate level, not only at the action level.

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency model for resource state claims. A Zone A state transition MAY be anchored in a SCITT transparency log by operators who require third-party verification of kernel-authoritative state claims.

**W3C PROV-DM (Provenance Data Model)** provides the data provenance vocabulary that SOV's Zone A state history aligns with. An SO's state transition sequence is a W3C PROV-DM activity chain: each state change is an activity, each SO state is an entity, and the kernel is the agent that produced the state.

---

## Related work

**draft-ietf-oauth-resource-metadata** specifies resource server metadata. SOV's SO Type Registry is a complementary resource taxonomy — where OAuth resource metadata describes server capabilities, the SO Type Registry describes governance properties of resource types.

**draft-ietf-scitt-architecture** — Zone A state transitions are SCITT-eligible claims. The SO state machine output is a natural SCITT claim subject.

SOV is the first IETF draft to specify a kernel-managed resource entity type for agentic AI governance. The SO Type Registry is the first attempt to define a standard taxonomy of governed resource types. There is no competing draft at this level of specificity.

---

## Security

**Key security properties:** INV-13 (Zone A kernel-authoritative) is enforced by the kernel, not the application. An application that bypasses the kernel to write Zone A state directly produces a non-conforming state — detectable by comparing application state against the kernel's authoritative record. Every Zone A state transition is signed by the kernel and recorded in GAR.

**State machine finality:** REVOKED and ARCHIVED are terminal states. A Sovereign Object in REVOKED state cannot be returned to ACTIVE by any principal instruction — it can only be ARCHIVED. An ARCHIVED object's state is immutable; its audit record is permanent.

**SO identifier collision resistance:** so_id MUST be a collision-resistant identifier (UUID v4 or equivalent). Implementations MUST reject mandate sessions that reference an so_id already associated with a different principal's Zone A object in the same kernel.

**Formal analysis status:** INV-13 is the key invariant requiring formal verification. Its enforcement depends on the completeness of the Cedar policy set — a Cedar policy that has a gap allowing Zone A writes without PERMIT would violate INV-13. The CAP formal analysis gap (noted in CAP) applies equally here.

---

## SOOS stack context

SOV sits at **Level 1 — Core Semantics**, alongside Cedar. It is the resource layer on which Cedar evaluations, HEM trigger classifications, PT scoring, and GAR records all depend. Every other SOOS draft that references a resource references it by so_id. MAD's delegation model references SO ownership in delegation scope; AEP's execution cycle includes SO state in Cedar evaluation context; GAR's audit records reference so_id as the resource coordinate on every entry.

Related drafts: [KIA](/drafts/kia) · [CAP](/drafts/cap) · [GAR](/drafts/gar) · [IDP](/drafts/idp) · [MJWT](/drafts/mjwt)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/sov)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-sov/)
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
