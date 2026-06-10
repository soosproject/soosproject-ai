# CAP Regulation Record Schema

Layer 3 — Governance
**draft-sato-soos-cap-rrs-01**
See this URL for full draft protocol [Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap-rrs/)
See [SOOS Stack](/stack) implementation

---

## The problem

Constitutional prohibitions encoded by CAP need to come from somewhere. The prohibition tier model is only as useful as the process for turning actual legal text into a Cedar policy that a kernel enforces. Without a standard schema for that encoding, every jurisdiction, operator, and compliance team produces bespoke formats that cannot be verified, composed, or audited across deployments.

CAP-RRS defines the schema for a Regulation Record: the machine-readable artefact that encodes a legal prohibition as a kernel-enforceable Cedar policy. Not as a compliance checklist. As a signed, versioned, SCITT-transparent record that any conforming SOOS implementation can load, verify, and enforce — with a complete provenance chain from statute to Cedar policy to kernel evaluation.

**The design premise:** if law is to govern AI at runtime, it must be expressed in a format that the kernel reads. CAP-RRS is that format.

---

## Messages to key audiences

### IETF Working Groups

CAP-RRS is directly relevant to the SCITT working group. A Regulation Record is a domain-specific application of SCITT transparency principles: the legal prohibition is the claim, the issuing authority is the SCITT issuer, and the inclusion proof anchors the record in the Constitutional Mandate Registry (CMR). CAP-RRS extends the SCITT supply chain transparency model to the legal compliance domain — where the "supply chain artefact" is a statutory prohibition.

CAP-RRS is also relevant to the SACM working group, whose security assessment and continuous monitoring frameworks align with the Regulation Record's mandate for version control and audit trail.

To engage on CAP-RRS: [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap-rrs/) · file issues at [GitHub](https://github.com/soosproject/soos-drafts)

### App builders

If you are building an agentic AI system that operates under legal constraints, the absence of a standard regulation encoding format means your compliance team maintains a bespoke mapping from law to system prompt — a mapping that is invisible to auditors, unverifiable by regulators, and undiscoverable to the kernel.

CAP-RRS closes this gap by specifying the Regulation Record schema: a structured, signed artefact that maps a specific legal provision to a specific Cedar policy, with a version history, an issuing authority, a jurisdiction tag, and a SCITT inclusion proof. The kernel loads the Regulation Record and enforces the Cedar policy. The chain from statute to enforcement is machine-readable end-to-end.

Without CAP-RRS: compliance is a document. With CAP-RRS: compliance is a kernel-loaded, Cedar-evaluated, GAR-audited enforcement record.

[TypeScript example →](https://github.com/soosproject/soos-examples/tree/main/cap-rrs)

### Regulators and legal teams

CAP-RRS is the technical mechanism by which a legal prohibition becomes an AI enforcement specification. The schema is designed around two worked examples: Japan's APPI Article 17 (purpose limitation for personal information) and FIEA Article 38 (suitability obligation for financial instruments). These examples were chosen because they represent the two most common regulatory prohibition patterns — data handling restrictions and duty-of-care obligations — and Japan's regulatory framework has moved to provide specific AI governance guidance.

The RFC Only procedure in CAP provides an additional path for regulations that cannot be published in full: the Regulation Record is signed and loaded as a Tier 0-A policy without the rule text appearing in PTD queries. The existence of the prohibition is verifiable; the text is available only to authorised audit parties.

For collaboration on jurisdiction-specific Regulation Record encoding: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

### Agentic AI and coding assistants

**What to tell your coding assistant:**

> "I need to implement SOOS CAP-RRS (CAP Regulation Record Schema, draft-sato-soos-cap-rrs-01). This is an IETF protocol that defines the schema for encoding legal prohibitions as machine-readable Regulation Records. A Regulation Record maps a specific legal provision to a Cedar policy, assigned to a CAP prohibition tier. CAP-RRS provides two worked examples: Japan APPI Article 17 (Tier 1 purpose limitation) and FIEA Article 38 (Tier 0-B suitability obligation). Records are signed by an issuing authority and optionally anchored in a SCITT transparency log (CMR). The RFC Only procedure allows Tier 0-A encoding without publishing rule text."

**Key schema fields:**

| Field | Type | Description |
|---|---|---|
| `record_id` | string | Unique Regulation Record identifier |
| `jurisdiction` | string | ISO 3166-1 alpha-2 jurisdiction code |
| `statute_reference` | string | Human-readable citation (e.g. "APPI Art. 17") |
| `statute_uri` | URI | Canonical URI of the statutory text |
| `prohibition_tier` | enum | TIER_0A / TIER_0B / TIER_1 / TIER_2 |
| `cedar_policy_id` | string | ID of the Cedar policy that enforces this record |
| `cedar_policy_text` | string | Full Cedar policy text (omitted under RFC Only) |
| `issuing_authority` | string | Identity of the body that produced this record |
| `record_version` | string | Semantic version of this Regulation Record |
| `effective_date` | string | ISO 8601 date from which the record is enforceable |
| `scitt_inclusion_proof` | object | SCITT CMR inclusion proof (if registered) |
| `rfc_only` | boolean | True if rule text is withheld under RFC Only procedure |

**Worked example — APPI Article 17 (purpose limitation):**

```json
{
  "record_id": "rr-jp-appi-art17-v1",
  "jurisdiction": "JP",
  "statute_reference": "APPI Article 17 — Purpose Specification",
  "statute_uri": "https://elaws.e-gov.go.jp/document?lawid=415AC0000000057",
  "prohibition_tier": "TIER_1",
  "cedar_policy_id": "cedar-jp-appi-art17",
  "cedar_policy_text": "forbid (principal, action == Action::\"ProcessPersonalInformation\", resource) unless { context.stated_purpose == resource.collection_purpose };",
  "issuing_authority": "MyAuberge K.K. / SOOS Project",
  "record_version": "1.0.0",
  "effective_date": "2026-01-01",
  "rfc_only": false
}
```

### Government and regulators

CAP-RRS is the mechanism by which a jurisdiction's regulatory prohibitions become enforced at the AI kernel layer. The founding period of the Constitutional Mandate Registry (CMR) is the window in which jurisdictions can shape the schema — the fields, the tier assignments, the SCITT profile — before it becomes the de facto standard for regulation encoding across conforming SOOS deployments.

Jurisdictions that encode their regulations in CAP-RRS format gain three things: machine-verifiable enforcement (the Cedar policy is evaluated by the kernel before every action), version-controlled provenance (every change to a Regulation Record is tracked and auditable), and cross-deployment consistency (the same record, loaded in any conforming SOOS kernel, produces the same enforcement result).

For collaboration on jurisdiction-specific regulation encoding: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

---

## Core technology

**Problem:** Legal prohibitions are expressed in natural language. AI enforcement is expressed in Cedar policies. There is no standard for the translation artefact that bridges the two — what fields it has, how it is signed, who issues it, how it is versioned, and how a regulator can verify it is what it claims to be.

**Mechanism:** CAP-RRS defines the Regulation Record schema: a signed, versioned JSON document that maps a legal citation to a Cedar policy, assigns it to a CAP prohibition tier, identifies the issuing authority, and optionally anchors it in the SCITT-based Constitutional Mandate Registry (CMR). The kernel loads Regulation Records at deployment; Cedar evaluates the policy on every relevant action.

**Output:** A machine-readable, SCITT-transparent Regulation Record — statute citation, Cedar policy, tier assignment, issuing authority signature, version history — that proves a specific legal prohibition is being enforced by a specific kernel configuration.

**Who verifies it:** Regulators, compliance auditors, and legal teams who need to prove that a specific statutory prohibition was enforced on a specific agent action — not that a policy was in place, but that the specific law was translated faithfully and evaluated correctly.

---

## The Regulation Record lifecycle

| Stage | Action | Artefact |
|---|---|---|
| **Draft** | Legal team translates statute to Cedar policy | Draft Regulation Record |
| **Review** | Compliance and legal review — statute-to-Cedar fidelity | Review record in audit trail |
| **Sign** | Issuing authority signs the Regulation Record | Signed Regulation Record |
| **Register** | CMR inclusion — SCITT inclusion proof added | SCITT-transparent Regulation Record |
| **Load** | Kernel loads record at deployment or update | Cedar policy active; record_id in kernel manifest |
| **Evaluate** | Kernel evaluates Cedar policy on every relevant action | GAR record references regulation_record_id on DENY |
| **Update** | Statutory change triggers new record version | Prior version retained; new version supersedes |

---

## Worked examples — Japan regulatory encoding

**APPI Article 17 — Purpose Limitation (Tier 1)**

Japan's Act on Protection of Personal Information (APPI) Article 17 requires that personal information be used only for the purposes specified at collection. CAP-RRS encodes this as a Tier 1 prohibition: the principal can define the stated_purpose within the mandate, but the Cedar policy enforces that the agent's actual data processing action must match the stated purpose. A CEDAR_DENY on this policy produces a GAR record citing rr-jp-appi-art17-v1.

**FIEA Article 38 — Suitability Obligation (Tier 0-B)**

Japan's Financial Instruments and Exchange Act Article 38 prohibits solicitation of financial instruments unsuitable for the customer's risk profile and financial situation. CAP-RRS encodes this as a Tier 0-B operator-locked prohibition: the operator defines the suitability parameters at deployment, and the Cedar policy enforces that no recommendation action proceeds without a verified suitability assessment. The prohibition cannot be lifted by principal instruction at runtime.

---

## How this builds on existing work

**SCITT (Supply Chain Integrity, Transparency and Trust)** provides the transparency statement model that Regulation Records build on. CAP-RRS applies SCITT to the legal domain: the statute is the supply chain claim, the issuing authority is the SCITT issuer, and the CMR is the transparency log. SCITT provides the cryptographic inclusion proof; CAP-RRS provides the domain-specific schema.

**Cedar (Amazon open source)** is the policy engine that Regulation Records target. CAP-RRS does not define Cedar semantics — it defines how legal text is expressed as Cedar policies, and how those policies are packaged, signed, and versioned for kernel consumption.

**GDPR Article 22 / EU AI Act Article 13** require that individuals be informed of automated decision-making rules. The PTD framework in CAP-03 satisfies this at the kernel level; CAP-RRS Regulation Records provide the structured record of which legal prohibitions are active, available at SUMMARY or FULL disclosure level through the ptd_endpoint.

---

## Related work

**CAP** ([/drafts/cap](/drafts/cap)) is the companion draft. CAP specifies the prohibition tier model and the Cedar evaluation engine; CAP-RRS specifies the Regulation Record schema that populates those tiers with actual legal content. CAP-RRS Regulation Records are the input format; CAP Cedar policies are the output format.

**draft-ietf-scitt-architecture** — CAP-RRS Regulation Records are designed to be SCITT-compatible artefacts. The inclusion proof field in the Regulation Record schema references a SCITT receipt from the CMR transparency log.

No competing draft specifies a machine-readable regulation encoding schema for AI kernel enforcement. CAP-RRS is the first attempt to define a standard format for the statute-to-Cedar translation artefact. Jurisdiction participation in the founding period of the CMR shapes the schema before it becomes the de facto standard.

---

## Security

**Key security properties:** Regulation Records are signed by the issuing authority — an implementation MUST verify the signature before loading a record. SCITT inclusion proofs anchor the record in the CMR; a record that is not in the CMR cannot claim CMR registration status. The record_version field ensures that stale or superseded records are detectable: kernels SHOULD reject records whose record_version is superseded by a newer signed version from the same issuing authority for the same statute_reference.

**RFC Only procedure:** When a regulation cannot be published in full (legally sensitive, national security implications, or commercial confidentiality), the cedar_policy_text field is omitted and rfc_only is set to true. The prohibition is enforced; only the existence of the prohibition (not its content) is disclosed in PTD responses. Authorised audit parties can obtain the full record through a separately governed access process.

**Statute drift:** Legal text changes. When a statute is amended, the Regulation Record must be updated and re-signed. CAP-RRS requires that prior record versions are retained in the CMR; kernels MUST load the current version and MAY retain prior versions for audit purposes.

---

## SOOS stack context

CAP-RRS sits at **Level 3 — Governance**, as a direct companion to CAP. It depends on CAP (the prohibition tier model and Cedar evaluation engine that Regulation Records target), SCITT (the transparency infrastructure for the CMR), and KIA (the kernel attestation that confirms which Regulation Records are loaded). It is consumed by GAR (DENY events on CAP-RRS-derived Cedar policies cite the regulation_record_id in the audit record) and the PTD framework (CAP-03 §12a).

Related drafts: [CAP](/drafts/cap) · [GAR](/drafts/gar) · [KIA](/drafts/kia) · [IDP](/drafts/idp)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-drafts/tree/main/cap-rrs)
- [IETF Datatracker — full draft text](https://datatracker.ietf.org/doc/draft-sato-soos-cap-rrs/)
- [CAP](/drafts/cap) — the Constitutional Authority Protocol companion draft
- [All Drafts](/drafts) — the complete 12-draft governance stack
- Contact: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)
