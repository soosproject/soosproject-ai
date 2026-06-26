---
title: Government & Regulators
description: How SOOS supports government AI governance objectives — machine-readable standards that turn regulatory intent into enforceable agent behavior.
---

# Government & regulators

AI agents can read laws and regulations as text and understand what they say. But understanding is not the same as following. For an AI agent to reliably follow a regulation — not just interpret it, but be bound by it at the moment it acts — the regulation needs to be expressed in a form the agent's operating system enforces as a rule.

SOOS provides that system. The **Constitutional Authority Protocol (CAP)** is the mechanism by which laws and regulations become runtime rules that every governed AI agent must follow, with a complete audit record proving it did. Critically, each jurisdiction encodes and enforces its own rules — SOOS does not impose a single global standard. A Japanese AI agent follows Japanese law. A European AI agent follows EU law. An agent operating across borders follows the rules of each jurisdiction it operates in, and can tell you exactly which rules it is following and why.

---

## Three ways AI-governed regulation works in practice

### 1. Helping regulators process and apply rules

A financial regulator receives thousands of filings annually. An AI agent trained on the relevant regulations can pre-screen submissions, flag potential violations, and route edge cases to human reviewers — but only if the regulations it applies are the current, authorized version, and only if its decisions are auditable.

With SOOS, the regulations the agent applies are encoded as Regulation Records — signed by the issuing authority, versioned against the current statute, and automatically suspended if the underlying law changes. Every screening decision the agent makes is logged in a tamper-evident audit record that identifies which specific rule governed each decision. A regulator can review any agent decision, see exactly which provision it applied, and verify that provision was current and authorized at the time.

### 2. Helping organizations follow the law when building AI products

A company building an AI application that handles personal data needs to comply with data protection law. Today, compliance is typically a document — a privacy policy, a data processing agreement — that has no technical connection to what the AI actually does at runtime.

With SOOS, the relevant data protection provisions are encoded as Regulation Records and loaded into the kernel. The kernel evaluates them before every action the agent takes with personal data. If the agent attempts an action that would violate the purpose limitation rule, the kernel blocks it — before the action occurs, not after. The company can demonstrate compliance not by producing a document but by producing an audit record showing every data processing action and the rule that governed it.

### 3. Helping citizens navigate complex regulations

A citizen applying for a disaster relief grant faces a process governed by multiple overlapping regulations across agencies. An AI assistant can guide them through the process — but if that assistant applies the wrong version of a rule, or misreads an interaction between two provisions, the consequences fall on the citizen.

With SOOS, the AI assistant operates under the same Regulation Records that govern the official process. It cannot apply a superseded rule. When two provisions interact or conflict, the interaction is encoded explicitly and the conflict is logged — not silently resolved by the AI's best guess. The citizen gets guidance that is provably consistent with the current, authorized interpretation of the rules.

---

## Jurisdictional sovereignty — every jurisdiction sets its own rules

SOOS is not a single global ruleset. It is a framework in which each jurisdiction establishes, enforces, and owns its own AI rule of law. Three capabilities follow from this.

### 1. Establish your own AI rule of law

A jurisdiction encodes its own laws and regulations as Regulation Records — signed by its own designated authorities, versioned against its own statutory corpus, registered in its own Constitutional Mandate Registry. No other jurisdiction's rules are imposed. No private company decides what the rules are. The jurisdiction controls the encoding, the endorsement authority, and the update process.

This means a national parliament, a regional government, or a sector regulator can establish a legally authoritative, machine-enforceable AI policy framework using existing law — without waiting for international consensus or a new global AI treaty. The rules that govern AI agents in that jurisdiction are the rules that jurisdiction has enacted, expressed with the precision that machine enforcement requires.

### 2. Enforce cross-border compliance — local law applies to foreign AI

When an AI application built in one country operates in another, it operates under the Regulation Records of the jurisdiction it is operating in — not just the rules of its country of origin. A foreign AI agent accessing citizen data in a jurisdiction with a data protection law must follow that jurisdiction's data protection Regulation Records. If it attempts an action that violates the local rule, the kernel blocks it. The violation is logged. The enforcement is not a request or a guideline — it is a runtime rule the agent cannot bypass.

This is a fundamental shift in how cross-border AI compliance works. Today, enforcement of local law against foreign AI applications depends on legal process, jurisdictional reach, and the cooperation of foreign companies. With SOOS, the local rules are embedded in the enforcement layer. An AI agent operating in a jurisdiction is governed by that jurisdiction's Regulation Records from the moment it operates there.

### 3. Ask an AI agent which laws it is following — and get a verifiable answer

In a SOOS-governed system, an AI agent can be asked at any time: which jurisdiction's laws are you following? Which specific provisions apply to what you are doing right now? The agent can answer — not because it has read the law and formed an opinion, but because the kernel maintains a live record of every Regulation Record currently loaded and active.

This answer is not a language model's best guess. It is drawn directly from the kernel's active policy set. Each Regulation Record in that set identifies the jurisdiction, the law, the article, the version, and the endorsing authority. The answer is auditable: the same information that the agent reports is in the audit record for every action it takes.

For a regulator asking an AI application "which rules are you following in our jurisdiction?" — this is the first time that question has a technically verifiable answer.

---

## For law makers — what SOOS makes possible

### Enabling existing law to be AI-enforceable with clarity and accuracy

Most existing laws were written for human readers and human administrators. Making them AI-enforceable requires a translation step — converting natural language provisions into precise rules an AI kernel can evaluate. SOOS provides the schema for that translation: the Regulation Record captures both the rule and its provenance, and the endorsement signature records who made the translation and certified its accuracy.

This is not automatic — legal judgment is required. But SOOS makes the translation artifact machine-readable, versioned, and auditable. The question "which rule did the AI follow?" becomes answerable from the record, not a matter of reconstruction.

### Gap and conflict analysis before problems arise

When regulations are encoded as Regulation Records, the structure of the rules becomes machine-analyzable. Gaps — situations a regulation does not address — and conflicts — provisions that produce contradictory rules for the same situation — can be identified systematically before they surface as no-action letters, court challenges, or enforcement failures.

This is analysis that currently requires senior legal staff working through hypotheticals manually. AI-assisted gap and conflict analysis, applied to machine-readable Regulation Records, can surface these issues at the drafting stage — before a law is enacted, not after it has been in force for years.

### Intelligent analysis of proposed legislation

When a new law is proposed, its effects are rarely limited to what the text says. Interactions with existing statutes, economic impacts, compliance burdens on affected industries — these require analysis that draws on information far beyond the bill itself.

SOOS provides the framework for feeding a proposed act, existing related statutes, economic impact reports, and compliance cost estimates into an AI system that can analyze their interactions coherently — because the existing rules are already encoded as Regulation Records and the proposed rules can be encoded the same way. The analysis is grounded in the actual structure of the legal corpus, not in a language model's general understanding of what the law probably says.

---

## Steps for regulators — getting started

The path from existing regulations to AI-enforceable Regulation Records has five steps. Each step can be taken incrementally — you do not need to encode all regulations at once.

**Step 1 — Identify the provisions to encode**

Start with a specific, bounded set of provisions: a single act, a chapter, or the provisions most frequently applied in enforcement decisions. The goal of the first encoding is to learn the process, not to achieve full coverage immediately. Provisions with clear, determinate meaning are easier to start with than provisions that require significant interpretive judgment.

**Step 2 — Encode each provision as a Cedar policy**

Each provision is translated into a Cedar policy — a precise, executable rule that the kernel evaluates before every relevant agent action. This translation requires legal judgment: what does the provision require or prohibit, under what conditions, with what exceptions? The Cedar policy captures that judgment in a form a machine can evaluate. (See the technical guide below for more on Cedar.)

**Step 3 — Package each policy as a Regulation Record**

The Cedar policy is packaged in a Regulation Record that carries: the statute citation, the URI of the canonical law text, the version of the statute the policy was certified against, the endorsement timestamp, and the identity of the endorsing authority. The Regulation Record is signed by the endorsing authority. This signature is the machine-readable assertion that the Cedar policy correctly represents the statute.

**Step 4 — Register the Regulation Record in the Constitutional Mandate Registry**

The signed Regulation Record is registered in the Constitutional Mandate Registry (CMR) — a transparency log that makes Regulation Records discoverable and verifiable across deployments. Registration produces a cryptographic inclusion proof: evidence that the record was published at a specific time by the claimed authority. Any conforming SOOS implementation can verify a Regulation Record against the CMR.

**Step 5 — Monitor and maintain**

Regulation Records monitor their own statutory basis. The Law Reference Interface (LRI) in each record carries an endpoint that is polled automatically every 24 hours. When the underlying statute is amended, the record detects the change, suspends the Cedar policy, logs a conflict event, and escalates to a human reviewer. The regulator receives notification; no agent can act under the affected provision until the record is re-endorsed against the new statutory text.

The same monitoring applies to interpretive changes — court judgments, binding guidance, administrative rulings — that change the meaning of a provision without changing its text. The audit record distinguishes statutory amendment from interpretive change and routes each to the appropriate endorsing authority.

---

## Technical guide

This section explains the underlying technologies for readers who want to understand how the system works.

### Cedar — the policy language

Cedar is an open-source policy language developed by Amazon and released publicly. It is designed to express authorization rules precisely and evaluate them efficiently. A Cedar policy is a logical rule: it specifies what action is permitted or forbidden, under what conditions, and with what exceptions.

Example — a purpose limitation rule in Cedar:

```cedar
forbid (
  principal,
  action == Action::"ProcessPersonalData",
  resource
)
unless {
  context.stated_purpose == resource.collection_purpose
};
```

This rule forbids any agent from processing personal data unless the stated purpose of the processing matches the purpose for which the data was collected. The kernel evaluates this rule before every relevant agent action. If the condition is not met, the action is blocked.

Cedar is precise, auditable, and formally analyzable. Unlike a natural language policy, a Cedar policy means exactly one thing and can be tested against specific scenarios before deployment.

### XML and law publication systems — the source layer

Laws are published by governments in structured digital formats. Japan's e-LAWS system publishes every statute in XML format using a standard schema. The European Union uses the European Legislation Identifier (ELI). The United States uses the United States Legislative Markup (USLM) format.

These XML schemas define the structure of a law — its chapters, articles, paragraphs, and items — in a machine-readable hierarchy. The Law Reference Interface (LRI) in a SOOS Regulation Record maps to these structures: it identifies which specific article and paragraph of which specific law the Cedar policy was derived from, and provides an endpoint that can be queried to detect when that article changes.

XML at this layer does not make law machine-enforceable. It makes law machine-readable — a necessary input for the encoding step, but not enforcement itself.

### OSCAL — the control framework layer

OSCAL (Open Security Controls Assessment Language) is a set of data formats developed by NIST, the US National Institute of Standards and Technology, for expressing regulatory and security control frameworks in machine-readable form. OSCAL is used by organizations worldwide to represent frameworks like NIST 800-53, ISO 27001, and the EU AI Act's requirements as structured catalogs of controls.

CAP-RRS Regulation Records are compatible with OSCAL catalogs: a Regulation Record can be generated from an OSCAL control, carrying the control ID as a provenance field. Organizations that have already mapped their regulatory obligations to an OSCAL control catalog can use that mapping as the starting point for encoding Regulation Records.

OSCAL makes regulations machine-readable as control frameworks. CAP-RRS makes them machine-enforceable as runtime kernel rules. OSCAL is the catalog layer; CAP-RRS is the enforcement layer.

### SCITT — the transparency layer

SCITT (Supply Chain Integrity, Transparency and Trust) is an IETF standard for transparency logs — cryptographic registries that record when a specific document was published by a specific authority. The Constitutional Mandate Registry (CMR) is a SCITT-based transparency log for Regulation Records.

When a Regulation Record is registered in the CMR, it receives a cryptographic inclusion proof: evidence that the record existed, in its current form, at a specific time, published by the claimed authority. This proof is verifiable by anyone and cannot be forged or backdated. It provides the same "who published what, when" guarantee that certificate transparency logs provide for website security certificates — applied here to law enforcement rules.

### The full chain

```
Statute (e-LAWS / ELI / USLM)
        ↓  Law Reference Interface (LRI)
OSCAL control catalog
        ↓  CAP-RRS encoding
Cedar policy in a signed Regulation Record
        ↓  CMR registration (SCITT inclusion proof)
Kernel enforcement (CAP evaluation engine)
        ↓  Every relevant agent action
GAR audit record
  — which Cedar policy was evaluated
  — which Regulation Record it came from
  — which law article governed the decision
```

Every link in this chain is machine-readable, signed, and auditable. A regulator can start from any audit record and trace back to the specific law article that governed the agent action — and verify that the chain has not been tampered with at any step.

---

## Who is responsible

Every agent action in a SOOS-governed system traces to a human principal — the person or organization that authorized the action. The chain of authorization is signed, time-stamped, and recorded. When something goes wrong, the responsible party is identifiable from the record.

Autonomous does not mean anonymous. SOOS makes agent accountability technically enforceable, not just a policy aspiration.

---

## Open and free to use

SOOS is published as open IETF Internet-Drafts under a free, permissive licence. Any government, regulator, or organization can read, implement, and build on SOOS at no cost. No vendor controls the standard. Implementations can be independently verified against the published specification.

Governments and regulators can adopt SOOS as a reference standard for procurement, certification, or regulatory guidance without any dependency on a private company.

---

## Engage

For government and regulatory enquiries, collaboration on jurisdiction-specific Regulation Record encoding, or Law as Code implementation: [tomsato@myauberge.jp](mailto:tomsato@myauberge.jp)

Raise technical questions at the [soosproject GitHub](https://github.com/soosproject/soos-drafts).

Review the full specifications at [soosproject.ai/drafts](/drafts). The drafts most relevant to government audiences: [CAP-RRS](/drafts/cap-rrs) — Regulation Record schema · [CAP](/drafts/cap) — Constitutional AI Prohibitions · [GAR](/drafts/gar) — Governed Action Record.

*All SOOS specifications are published as IETF Internet-Drafts under Apache 2.0 — free to use, implement, and build upon.*
