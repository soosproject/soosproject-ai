# Japan e-LAWS LRI Profile for CAP-RRS
Informational Profile — Japan Jurisdiction
**draft-sato-soos-cap-rrs-jp-00**
[Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap-rrs-jp/) ·
[SOOS Stack](https://soosproject.ai) ·
[CAP-RRS (base specification)](https://soosproject.ai/drafts/cap-rrs)

---

## The problem

Japan's e-LAWS database has made statutory text machine-readable.
The Digital Agency's XML schema gives every Article, Paragraph, and Item a
stable XPath address. The law can be retrieved. It cannot yet be enforced.

The CAP-RRS Regulation Record Specification defines the bridge: a structured
intermediate form between statutory text and the Cedar policy that a governed
AI agent evaluates before every action. The Law Reference Interface (LRI)
links each Cedar policy back to the statute it encodes and the authority that
certified the encoding.

This document specifies how that generic mechanism is applied in Japan:
which e-LAWS fields bind to which LRI fields, which authority endorses which
type of statute, and what happens — automatically — when a statute is amended
or an interpretive ruling supersedes the basis on which a Cedar policy was
certified.

**The positioning:**
> 法令のAXが作るのは「読める法律」です。SOOSが作るのは「守られる法律」です。
>
> Law AX creates laws that can be read. SOOS creates laws that are enforced.

---

## Messages to key audiences

### IETF Working Groups

This is an informational LRI profile document for draft-sato-soos-cap-rrs-02
Section 9. It specifies no new normative mechanisms; all MUST/MUST NOT
requirements are inherited from CAP-RRS-02. The profile's contribution is:

(1) A concrete instantiation of the LRI generic model for a real, published
statutory database (e-LAWS, Japan Ministry of Internal Affairs /
Digital Agency). The XPath addressing conventions in Section 4.2 demonstrate
that the LRI abstract fields (`law_id`, `article_ref`, `version_identifier`,
`amendment_detection_endpoint`) have unambiguous bindings in Japan's actual
legal infrastructure.

(2) Three APPI Chapter IV worked examples (Section 6) providing the first
published mapping from Japanese personal information law to CAP-RRS Regulation
Records.

(3) A Japan-specific treatment of `INTERPRETATION_SUPERSEDED` (Section 8)
covering four interpretive instrument categories unique to Japan's legal
system: Cabinet Orders, 解釈指針, 内閣法制局意見, and court judgments.

(4) The `resolution_basis` field applied to real statutory conflict cases
(OQ-BOSAI-001 §49の11 internal contradiction; OQ-BOSAI-002 dual command
authority) arising from 防災 law analysis.

Open profile questions (JP-OQ-01 through JP-OQ-04) require engagement with
the Digital Agency, 内閣法制局, and 全国知事会. Parallel informational
profiles for EU (ELI binding) and US (USLM binding) are anticipated post-Vienna.

### App builders

If you are building an AI agent governed by Japanese law, this document
specifies how to construct the `authority_source` block in your Regulation
Records.

The three essential lookups before authoring any Japan-jurisdiction Regulation
Record:

1. **法令ID**: query `https://laws.e-gov.go.jp/api/2/lawdata/{law_id}` and
   confirm the law name matches your statute.
2. **article_ref XPath**: use Arabic numerals in @Num attributes
   (Article '17', not '十七'). The XPath must resolve against
   XMLSchemaForJapaneseLaw_v3.xsd.
3. **Designated endorser**: consult the LawType-to-endorser table in Section 5.
   Acts and Cabinet Orders → 内閣法制局.
   Ministerial Ordinances → the responsible ministry's legal unit.

For disaster response use cases (防災), note that §49の11 internal conflicts
require `resolution_basis: "internal_conflict_resolution"` and elevated
内閣法制局 endorsement, not just the standard statute endorser.

The C-Law-ed Code system automates Steps 1–3 and generates the LRI block.
Field `interpretation_endpoint` is auto-populated from the provisional SOOS
registry at `https://clawed.soosproject.com/jp/interpretations/{law_id}/`.

### Regulators and policy teams

This document answers the question the AI臨調 ディスカッションペーパー
(Themes 21 and 22) identifies but does not resolve:

> 「自然言語の法文をコードへ変換する際の解釈確定権限の所在」
> — Who has the authority to determine which code interpretation is authoritative?

The LRI `endorsement` block is the answer: the authority that signs the
`endorsement_claim` JWT is the authority whose interpretation governs.
For Acts and Cabinet Orders, that is 内閣法制局. For Ministerial Ordinances,
the responsible ministry. The signed JWT is an immutable, machine-verifiable
record of that authority's certification.

When an interpretation changes — through a Cabinet Order, 解釈指針, or court
judgment — the Cedar policy **automatically lapses** and no governed AI agent
may act under the affected provision without re-endorsement. The GAR audit
record of any prior action carries the `endorsed_at` timestamp and the
then-current `resolution_basis`, constituting the machine-native 信頼保護
(trust protection) instrument for that action.

This directly addresses Theme 22: 「解釈変更時の遡及効と信頼保護の規律」.

### Agentic AI and coding assistants

> You are constructing a Japan-jurisdiction CAP-RRS Regulation Record using
> the e-LAWS LRI profile (profile URI: https://laws.e-gov.go.jp/lri/v1).
> Complete the `authority_source` block using the following bindings:
> `law_id` = e-LAWS 法令ID (15-char alphanumeric);
> `article_ref` = XPath 1.0 expression against XMLSchemaForJapaneseLaw_v3.xsd
> using @Num with Arabic numerals;
> `version_identifier` = ISO8601 date of most recent amendment EnforcementDate
> from e-LAWS API v2;
> `amendment_detection_endpoint` = https://laws.e-gov.go.jp/api/2/updatelawlists/{date};
> `interpretation_endpoint` = https://clawed.soosproject.com/jp/interpretations/{law_id}/{article_ref};
> `authority_id` from the LawType-to-endorser table in Section 5.1;
> `resolution_basis` from: statute_clear | interpretive_ruling |
> internal_conflict_resolution | cross_statute_coordination.
> If resolution_basis is internal_conflict_resolution, authority_id MUST be
> https://www.clb.go.jp/authority regardless of LawType.

Key XPath patterns:

| Legal unit | XPath |
|---|---|
| Article N | `/Law/LawBody/MainProvision/Article[@Num='N']` |
| Article N, Paragraph M | `.../Article[@Num='N']/Paragraph[@Num='M']` |
| Chapter C, Article N | `.../Chapter[@Num='C']/Article[@Num='N']` |
| Supplementary Provision | `/Law/LawBody/SupplProvision/Article[@Num='N']` |

**Critical**: @Num ALWAYS uses Arabic numerals. `@Num='17'` not `@Num='十七'`.

`resolution_basis` vocabulary:

| Value | Meaning | Required authority |
|---|---|---|
| `statute_clear` | Clear statutory provision | Designated per LawType table |
| `interpretive_ruling` | External interpretive instrument | Designated + `resolution_instrument_id` |
| `internal_conflict_resolution` | Conflict within a statute | 内閣法制局 (elevated, always) |
| `cross_statute_coordination` | Cross-statute coordination rule | Co-endorsement required |

### Government and regulators

This document specifies the technical binding layer that connects Japan's
existing legal infrastructure (e-LAWS, 法令API v2, XMLSchemaForJapaneseLaw v3)
to the SOOS enforcement layer — without requiring changes to the Digital Agency's
systems.

The integration architecture:

```
e-LAWS (デジタル庁)         CAP-RRS LRI Profile (this document)
─────────────────────────────────────────────────────────────────
法令ID          →       law_id
XMLSchema v3 XPath  →   article_ref
最終改正施行日    →   version_identifier
updatelawlists API  →   amendment_detection_endpoint
(future) 解釈API   →   interpretation_endpoint
```

The Digital Agency acts as catalog authority for Japan-jurisdiction Regulation
Records: operating the Constitutional Mandate Registry (CMR) instance,
maintaining the endorsement authority registry, and publishing update
notifications when records are added or versioned.

IPA (情報処理推進機構) acts as co-endorser for technology-layer compliance
records — certifying that the Cedar policy correctly implements the legal
obligation at the AI agent runtime layer.

**For the 防災庁 track**: this document establishes the endorsement model for
disaster response AI governance before 防災庁 begins operations in autumn 2026.
The dual command authority case (防災庁 + 都道府県知事 co-endorsement) and the
§49の11 internal conflict case are documented in Appendix B.

Japan LRI profile registration in the CAP-RRS IANA registry:
`https://laws.e-gov.go.jp/lri/v1`

Founding Period participation and Digital Agency coordination inquiries:
tom@myauberge.com

---

## Core technology

**Problem:** Japan's e-LAWS XML schema makes statutory provisions addressable
but does not define which provisions prohibit or permit AI agent actions, or
who certifies that a Cedar policy correctly encodes a provision.

**Mechanism:** The Japan LRI profile binds the generic LRI fields (from
CAP-RRS §9) to e-LAWS API v2 fields, specifying XPath addressing and
the endorsement authority table that maps each LawType to its designated
certifying authority.

**Output:** A Regulation Record with a fully-populated `authority_source`
block — including a signed endorsement JWT from the designated authority —
that the Constitutional Mandate Registry accepts and the GEC can compile
to an active Cedar policy.

**Who verifies it:** The GAR audit record carries the `endorsed_at` timestamp
and `resolution_basis` for every agent action governed by the Cedar policy.
Regulators, auditors, and courts can verify — from the immutable GAR record —
which version of which statutory provision governed an action at which moment.

---

## The endorsement authority table

| Law tier | e-LAWS LawType | Designated endorser |
|---|---|---|
| Constitution | Constitution | 内閣法制局 |
| Act (法律) | Act | 内閣法制局 |
| Cabinet Order (政令) | CabinetOrder | 内閣法制局 |
| Ministerial Ordinance (省令) | MinisterialOrdinance | 所管省庁 法令担当部局 |
| Prefecture Ordinance (条例) | Misc | 都道府県 法務・法制担当部局 |
| Municipal Rule (規則) | Misc | 市区町村法務担当 + prefecture co-endorsement |

**Elevated authority rule**: when `resolution_basis` is
`internal_conflict_resolution`, 内閣法制局 endorsement is required regardless
of LawType. Resolving a conflict *within* a statute is a constitutional act;
only 内閣法制局 may certify it.

---

## APPI Chapter IV: three worked examples

**APPI Article 17(1) — Prohibition on improper acquisition**
The simplest case: a clear prohibition (`resolution_basis: statute_clear`).
`law_id`: 325AC0000000089. `article_ref`: `/Law/LawBody/MainProvision/
Chapter[@Num='4']/Article[@Num='17']/Paragraph[@Num='1']`.
Endorsed by 内閣法制局 (Act-level provision). Active after endorsement;
lapses automatically on any APPI Chapter 4 amendment.

**APPI Article 24 + 基本法 §49の11 (名簿 sharing in disaster context)**
A cross-statute coordination case (`resolution_basis: cross_statute_coordination`).
The ordinary APPI §24 prohibition on third-party provision is suspended by the
disaster exception in 基本法 §49の11. Cedar policy encodes a CONDITIONAL_PERMIT.
Co-endorsement required: 内閣法制局 (APPI basis) + 防災庁 (名簿共有 authority).
`co_endorsement_quorum: all`.

**APPI Article 24 (個別避難計画 consent asymmetry)**
An internal conflict case (`resolution_basis: internal_conflict_resolution`).
The provision family for individual evacuation plan sharing has a consent
asymmetry that is not formally settled by statute. 内閣法制局 endorsement
required (elevated). On issuance of a Cabinet Order settling the asymmetry,
`resolution_basis` transitions to `interpretive_ruling` and standard endorsement
authority is restored.

---

## Use cases

**Disaster response AI governance (防災庁 track)**
A prefecture deploys a disaster response AI agent that must share evacuation
register data during a declared disaster. Before the agent acts, the GEC
evaluates a Cedar policy encoding the 基本法 §49の11 sharing exception. The
policy's `authority_source` carries co-endorsement from 内閣法制局 and 防災庁.
When the Diet amends 基本法 following a major event, the `amendment_detection_
endpoint` detects the change within 24 hours, `CATALOG_VERSION_CONFLICT` is
raised, the policy suspends, and HEM escalation ensures no agent acts under the
stale rule until re-endorsement is complete.

**Personal information compliance for enterprise AI (APPI)**
An enterprise deploying a Japan-jurisdiction AI agent imports the APPI Chapter
IV Regulation Record package from the Constitutional Mandate Registry. The
GEC compiles the package to Cedar policies — no Cedar is authored by hand.
When the Personal Information Protection Commission issues a 解釈指針 clarifying
Article 24's scope, the `interpretation_endpoint` detects the ruling within
24 hours. `INTERPRETATION_SUPERSEDED` is raised. The GAR record of every
prior agent action carries the `endorsed_at` timestamp of the then-valid
interpretation: machine-native 信頼保護 for the enterprise's compliance audit.

**Cabinet Office Law as Code onboarding**
A government ministry uses C-Law-ed Code to translate ministerial ordinance
provisions into Regulation Records. The system generates the LRI `authority_source`
block automatically from e-LAWS API responses, populates the correct XPath
`article_ref`, and routes the draft to the ministry's legal unit for endorsement.
The endorsed record is published to the Digital Agency CMR instance. The ministry's
AI agents import and activate the compliance package without manual Cedar authoring.

---

## How this builds on existing work

**CAP-RRS-02 (draft-sato-soos-cap-rrs-02)**: This document is entirely downstream
of CAP-RRS-02. The LRI generic model (§9), Statute-Primacy Rule (§10), and
Operational Requirements (§11) in CAP-RRS-02 are the normative base. This
document specifies only the Japan-specific bindings.

**e-LAWS / 法令API v2 (Digital Agency)**: The Digital Agency's infrastructure
is the data source. This document is designed to be invisible at the Digital
Agency layer — the e-LAWS API is queried as-is; no changes to Digital Agency
systems are required for this profile to work.

**CAP-04 (draft-sato-soos-cap-04)**: CAP is the enforcement layer. CAP-RRS
is the corpus management layer. This document is the Japan-jurisdiction corpus
binding. The chain: CAP (enforcement) → CAP-RRS (compilation) → this document
(Japan statutory sources).

---

## Related work

**AI臨調 ディスカッションペーパー (Themes 21 and 22)**: This document directly
addresses the 解釈確定権限 (interpretive authority) question identified in
Theme 22. The `endorsement_claim` JWT is the machine-readable equivalent of
a正文 designation; the `INTERPRETATION_SUPERSEDED` event is the machine-native
解釈変更通知; the GAR record is the 信頼保護 instrument.

**OSCAL**: SOOS CAP-RRS is the first IETF draft to bridge OSCAL-formatted
controls and the IETF enforcement layer. The Japan LRI profile parallels how
OSCAL handles jurisdiction-specific profiles — just as NIST 800-53 and ISO 27001
are OSCAL catalog profiles, the Japan e-LAWS binding, EU ELI binding, and US
USLM binding are LRI profiles of the same underlying mechanism.

---

## Security

**Key security properties:**
- Endorsement claims are signed JWTs; forgery requires the endorsing authority's
  private key
- Amendment detection is cryptographically bound to the e-LAWS HTTPS endpoint;
  response tampering is detectable
- The provisional interpretation registry authenticates responses; transition to
  Digital Agency-operated endpoint removes SOOS from the trust chain
- Endorsing authority URIs are allow-listed; impersonation by similar-domain
  adversaries is blocked at the CMR layer

**Endorsement key compromise**: if 内閣法制局's signing key is compromised,
all Acts and Cabinet Orders endorsed with that key are affected. The CMR MUST
implement 30-day-notice key rotation and GECs MUST maintain pinned key caches.

**Formal analysis status**: the endorsement JWT cryptographic scheme inherits
its security properties from the JWT specification (RFC 7519). No Japan-specific
formal analysis has been performed.

---

## SOOS stack context

This document is an informational profile of CAP-RRS Layer 1. It does not
introduce a new layer in the SOOS stack; it specifies how Layer 1 is instantiated
for Japan.

Profiles this document: CAP-RRS-02 (draft-sato-soos-cap-rrs-02) — specifically
Sections 9, 10, and 11.

Parallel profiles (post-Vienna): EU ELI LRI profile · US USLM LRI profile

Downstream from this profile: every Japan-jurisdiction Regulation Record deployed
in the Constitutional Mandate Registry.

Related drafts: [CAP](https://soosproject.ai/drafts/cap) ·
[CAP-RRS](https://soosproject.ai/drafts/cap-rrs) ·
[GAR](https://soosproject.ai/drafts/gar) ·
[HEM](https://soosproject.ai/drafts/hem)

---

## Contribute

- [File an issue on GitHub](https://github.com/soosproject/soos-specs/issues)
- [IETF Datatracker](https://datatracker.ietf.org/doc/draft-sato-soos-cap-rrs-jp/)
- [DR-CAPRRS-INTERP-01](https://soosproject.ai/drafts/cap-rrs-jp) (June 24, 2026)
- [DR-CAPRRS-INTERP-02](https://soosproject.ai/drafts/cap-rrs-jp) (June 25, 2026)
- Contact: tom@myauberge.com / デジタル庁・内閣府連携: tom@myauberge.com
