---
title: WIMSE Security Review Process — v0.3
meta-description: The WIMSE Security Review process and living checklist, v0.3 — Step 0 through Stage 2, a growing Part 3 checklist, and a three-tier format for reporting findings.
---

# WIMSE Security Review Process for draft authors — Version 0.3

*[← Why we built this](/security)*

**Initial author:** Tom Sato (tomsato@myauberge.jp)

*Please add your name as you contribute to this document.*

*This document is a live document for community self-help to offer easy guidance for security review
for WIMSE and WIMSE-adjacent drafts.*

*Initial author wrote from own experience and guidance from domain experts and practitioners. Since
many parts of this document came from hearing from experts without actual use of tools and reviews,
there are sections in this document that require substantial additional detail. Feedback, edits, and
contributions are welcome and expected.*

*See the note below and the "how to contribute" guidance throughout.*

**What's new in 0.3:** cross-checked against a 13-draft pass across the SOOS suite itself, rather than
a single WIMSE-list thread — GAR-05, IDP-05, KIA-05, HEM-05, MAD-03, DAM-01 §7, GRP-01 §9.4, RGP-01
§11, FAIP-02, PEER-01, AOP-01, DIST-01, and the DAM/RGP/GRP/AEP cluster interdependency review. Stage 0's
worked-examples table gains four rows (RFC 6962 Merkle audit path, RFC 9591 FROST, RFC 8785 JCS
canonicalization, RFC 9562 UUIDv5 namespace/serialization). Part 3's checklist gains seven items across
Sections B, C, D, E, and F. Stage 1 gains an emphasized note on same-revision/cross-section consistency
checking, after a Direct Conflict between two pieces of a draft's own text turned out to be the single
most common *headline* finding — not a minor item, the top-ranked one — across nearly every
full-coverage pass run in this project so far. See "Validated so far" under Stage 0 and the new
Contributed-items entry under Part 3 for exactly which draft surfaced what.

**What's new in 0.2:** a new Step 0 (Reference Inventory) now runs even before Stage 0 — pull the
draft's full Normative References list (plus any Informative reference relied on as if normative) and
check each one's own obligations before naming any mechanism at all. This closes a real blind spot:
Stage 0 is mechanism-first, so it can't catch an obligation that isn't tied to a mechanism you thought
to name. Stage 0's worked-examples table gains two rows (RFC 9068, RFC 8693) found missing exactly
this way. Part 3's checklist gains eleven items across Sections A, B, D, and F, plus a new Section H
(Non-HTTP & Local Transports) — all cross-checked against a real, live multi-party review (the
draft-klrc-aiagent-auth-03 / AIMS WIMSE Call for Adoption thread) rather than sourced from a single
draft in isolation. This is the first time this document's checklist has been validated against a
public WG thread as a whole, not just individual drafts — see "Validated so far" under Stage 0 and the
new Contributed-items entry under Part 3 for exactly who found what. Part 1 also gains a closing
"Reporting Findings" section — a three-tier output structure (Recommendation / Background / Detailed
reasoning) for writing up findings, since full Stage 0–2 depth in every list post or issue is more than
most readers need up front.

**What's new in 0.1:** a new Stage 0 (Base-Spec Lens) runs ahead of everything else in Part 0's order —
it addresses a structural gap in v0, where every stage was retrospective (built from patterns already
seen in specific drafts) and couldn't by construction catch a genuinely new class of gap. Stage 0 is
generative instead: name the base RFC/BCP/registry each mechanism profiles, and check the draft against
that spec's own obligations directly. It's been run against three real drafts so far, each time finding
something the checklist-only pass — and, in two cases, independent expert reviews on the WIMSE list —
had missed (see "Validated so far" under Stage 0). Part 3's Denial of Service section also now opens
with a note on RFC 3552/BCP 72's status as Best Current Practice, after DoS turned up silent, sometimes
not even self-flagged as an open issue, across most drafts reviewed so far.

## About this document

This document has four parts: a process for authors drafting new work (Step 0, Stage 0, Stages 1–2,
and how to report findings), a summary of what's specific to writing inside WIMSE — including the tools
relevant to this kind of review, and how they apply to a WIMSE draft specifically — and a living
checklist that's meant to grow.

A fifth part — what to do with *already-published* drafts that may need a fresh security check-up —
is intentionally not included in this version. That's a real question, but it touches IETF process
(proposing corrections to already-adopted text) differently enough from guidance for new drafts that
it deserves its own discussion before it's built out here.

**Contents:** About this document · Part 0: Suggested order of review operations · Part 1: Security
Review Process for Authors Drafting New Work (Step 0, Stage 0, Stage 1, Stage 2, Reporting Findings) ·
Part 2: WIMSE Specifics, including Tools relevant to WIMSE security review · Part 3: WIMSE Security
Checklist (v0.3)

---

# Part 0 — Suggested Order of Review Operations

This document reads Part 1 → Part 2 → Part 3, but the reading order and the *doing* order aren't the
same thing. In practice:

1. **Run Step 0 (Reference Inventory) first**, before anything else, including Stage 0. Pull the
   draft's complete Normative References list, plus any Informative reference the text leans on as
   though it were normative, and check each one's own obligations. This needs no mechanism
   identification at all, which is exactly why it goes first — some obligations belong to the document
   as a whole, not to any single mechanism you'd think to name.
2. **Run Stage 0 (Base-Spec Lens) next**, before anything WIMSE-specific. Name every base RFC, BCP,
   or registry each mechanism in your draft profiles or instantiates, and pull in that base spec's own
   inherited obligations — Step 0's findings are a head start on which base specs matter.
3. **Skim Part 2 (WIMSE Specifics)** for the charter scope, exclusions, and known live tensions —
   just enough context to recognize them later, not a close read yet.
4. **Run the checklist (Part 3) next**, per mechanism. It's broad, fast, and ready-made — the
   easiest real action a newbie author can take, and it surfaces exactly where the gaps are.
5. **Run Stage 1 next**, aimed specifically at whatever Step 0, Stage 0, or the checklist marked
   Silent, Contradicted, or left mostly N/A. This is the deeper, custom pass — most valuable once you
   already know where to point it.
6. **Run Stage 2 last**, once you have real findings from the earlier stages to build synthetic
   scenarios against.

Read Part 1 before Part 3 if you want the full reasoning behind the process first; jump straight to
Part 3 if you just want to start — but don't skip Step 0 or Stage 0 even then, since between them
they're what a single checklist pass structurally can't give you. When you write up findings from any
stage, see "Reporting Findings" at the end of Part 1 for a format that doesn't require dumping full
Stage 0–2 depth into every message.

---

# Part 1 — Security Review Process for Authors Drafting New Work

## Step 0 — Reference Inventory

*Working draft — runs before Stage 0, added in v0.2 after cross-checking this document against a real
WG Call for Adoption thread surfaced two Stage-0-shaped gaps that neither Stage 0 nor Part 3 caught,
because both were tied to a normative reference nobody had named as a "base spec" for a specific
mechanism.*

### What this step is for

Stage 0 is mechanism-first: you name a mechanism, then go find its base spec. That works well once a
mechanism has been named — but it structurally can't catch an obligation that isn't tied to any
mechanism you thought to name in the first place. A reference cited for one purpose can carry an
obligation on documents that compose with it generally, not just on implementers of the reference
itself; and a document can cite something *informatively* while actually depending on it
*normatively*, which is its own distinct finding, not a wording nitpick.

### The process

1. **Pull the draft's complete Normative References list**, plus any Informative reference the text
   leans on as though it were normative — read the actual citing sentences, not just the reference
   list, to catch this mismatch.
2. **For each reference, skim its own MUST/SHOULD-level obligations and its own Security
   Considerations** — not a summary, the actual text, same discipline as Stage 0.
3. **Note anything that imposes a requirement on documents that compose with it**, not only on direct
   implementers of the reference. A base RFC's own profile-writing guidance (an "if you build on this,
   you must..." clause) is exactly the kind of thing that's easy to miss when you're reading the
   reference for one specific mechanism and not for its own sake.
4. **Route findings two ways:** anything that ties to a single mechanism you can name, feed into
   Stage 0 as a head start. Anything that's a whole-document principle — doesn't reduce to one
   mechanism — log as a standalone Step 0 finding; don't force it into a mechanism bucket it doesn't
   fit.
5. **Flag any citing-informatively-but-relying-normatively mismatch explicitly** as its own finding,
   separate from whatever gap the underlying reference obligation represents.

### Worked example

Checking draft-klrc-aiagent-auth-03 (AIMS) against its own WIMSE Call for Adoption thread turned up
two findings this way. Two independent list reviewers (Dmitry Izumskiy, and separately Kieran Sweeney
building on Karthik Rampalli's point) hand-found that the draft's multi-hop delegation chains never
discuss RFC 8693's `act` claim — the standard mechanism for actor-chain attribution. A third reviewer
(Songbo Bu) hand-found that the draft's `sub`/`client_id` semantics don't state which principal they
represent when a resource owner isn't involved, which is exactly what RFC 9068 requires a profile to
state. Both are Step 0 findings: RFC 8693 and RFC 9068 are both normatively referenced by the draft,
but neither had been checked against its own obligations, because delegation-chain attribution and
access-token claim semantics hadn't been named as "mechanisms" in the Stage 0 sense. Feeding them back
into Stage 0's worked-examples table (below) means the next draft reviewed against this document
catches both mechanically, rather than needing a room full of hand-reviewers to notice by hand again.

### Suggested Prompt

```
I'm running a Step 0 reference inventory of an IETF Internet-Draft, before naming any mechanisms.

1. List every Normative Reference in the draft, plus any Informative reference the body text relies
   on as though it were normative (quote the citing sentence for each of these).

2. For each Normative Reference, and each Informative-but-relied-on-normatively reference: summarize
   its own MUST/SHOULD-level obligations and its own Security Considerations, focused specifically on
   anything that constrains a document that composes with or profiles it (not just direct
   implementers of the reference itself).

3. For each obligation found, state whether the draft under review addresses it, is silent, or
   contradicts it. Note explicitly which findings tie to a single nameable mechanism (hand these to
   Stage 0) versus which are whole-document principles that don't reduce to one mechanism.

4. Flag separately: any reference cited as Informative that the draft's actual normative behavior
   depends on as though it were Normative.

Draft: [paste or attach]
```

## Stage 0 — Base-Spec Lens

*Working draft — Stage 0 of the WIMSE Security Review process, run after Step 0 and before everything
else.*

### What this stage is for

Part 3's checklist and Stage 1's deep-dive are both built by harvesting concerns that surfaced when
someone actually read a specific WIMSE-adjacent draft — they're good at catching *recurrences* of
patterns this document's contributors have already seen once. They're structurally unable to catch a
genuinely new class of gap in a mechanism type nobody's flagged before, because that class doesn't
exist in the checklist until someone notices it and adds it.

Stage 0 fills that gap with a generative step instead of a fixed list: name every base RFC, BCP, or
registry your mechanism profiles, extends, or instantiates, and check the draft against *that spec's
own* normative obligations — not against WIMSE's checklist, and not against known attack classes, but
against what the base spec itself already requires of anything built on top of it. A new URI scheme
inherits RFC 3986's comparison rules and RFC 7595's registration requirements the moment it's defined,
whether or not anyone in this community has ever thought about canonicalization before. This stage
exists to make that inheritance visible on purpose, rather than by accident.

### The process

1. **List your mechanisms**, same as Part 3 asks — the thing that gets validated, the thing that
   proves an identity, the thing that grants access, the thing that revokes something.
2. **For each mechanism, name what it's a profile or instance of.** Not "this uses JWTs" but
   specifically which RFC(s) define the base mechanism: RFC 7523 for a JWT-bearer grant, RFC 3986 +
   RFC 7595 for a custom URI scheme, RFC 5280 for an X.509 profile, and so on. If you're not sure,
   search for it rather than guessing — citing the wrong base spec is worse than citing none.
3. **Open that base spec's own normative text**, not a summary of it. Look specifically for: MUST/MAY
   distinctions your draft has silently narrowed or widened without saying so; named mitigations the
   base spec discusses as optional that your draft's threat model actually requires; comparison,
   canonicalization, or equivalence rules the base spec defines that your draft's artifact inherits;
   and extensibility points (claim namespaces, registries, algorithm negotiation) the base spec expects
   a profile to say something about.
4. **Check the draft against those obligations specifically**, using the same Addressed / Silent /
   Contradicted / N/A marking as Part 3. A finding here doesn't need to map onto any of Part 3's
   categories A–H to be worth writing down — it stands on its own, sourced directly from the base spec.
5. **Feed anything Silent or Contradicted into Stage 1** for the deeper pass, same as checklist
   findings would be.

### Worked examples — mechanism type to base-spec obligation class

| Mechanism type | Base spec(s) | Obligation class worth checking |
|---|---|---|
| Custom URI scheme | RFC 3986 §6.2, RFC 7595 | Comparison/canonicalization (case, percent-encoding, dot-segments), scheme registration completeness (ABNF, ownership); RFC 7595 §3.7's mandatory scheme-specific security analysis — including whether an FQDN-shaped component could be mistaken for a resolvable network locator |
| X.509 certificate profile | RFC 5280, RFC 6125 / RFC 9525 | Path-validation ordering (which cert field selects the trust anchor, and when), EKU binding strictness, service-identity matching; whether Name Constraints (§4.2.1.10) are available as a structural mitigation for cross-domain trust-anchor mis-binding, not just a relying-party-logic fix |
| JWT-bearer authorization grant | RFC 7521, RFC 7523, RFC 7519, RFC 8725 (JWT BCP) | Replay/single-use handling of `jti` (RFC 7523 §3 makes this MAY at the base-spec level — a profile with a real threat model often needs to make it a MUST rather than silently inheriting the base spec's optionality), algorithm confusion, audience restriction |
| Claim/property vocabulary reusing common claim names | RFC 7519 §4.3, RFC 9068 | Name collision-resistance is necessary but not sufficient — a claim name reused across two *different* profile types (e.g., an authorization-grant JWT and an access-token JWT both using `groups`) can still collide semantically even when each name is individually well-formed |
| OAuth grant type / AS extension | RFC 6749, RFC 8414, RFC 9700 (OAuth Security BCP) | Metadata advertisement completeness, mix-up and downgrade resistance |
| Federation / trust-domain claim | whatever governs domain ownership in that space | Ownership verification versus mere naming convention |
| Attestation / Evidence format | RATS Architecture (RFC 9334) | Evidence-visibility scoping, freshness, appraisal-policy binding |
| JWT access token profile | RFC 9068 | `sub`/`client_id` claim semantics differ depending on whether a resource owner is involved in the flow — a profile must state which principal each claim represents in its own specific delegation shape, not assume RFC 9068's generic semantics carry over unchanged |
| Token exchange / actor chaining | RFC 8693 | The `act` claim is the standard mechanism for expressing an actor chain across delegation hops; a draft that chains multiple hops must either use it or explicitly state what equivalent chain-attribution mechanism replaces it |
| Merkle tree / transparency-log construction | RFC 6962 §2.1 (tree hash), §2.1.2 (audit path) | If the draft defines a scope-limited or partial-access verifier role, does it provide an inclusion-proof/audit-path mechanism, or does verification require the full data structure regardless of the verifier's declared scope? |
| Threshold / multi-party signing (t-of-n) | RFC 9591 (FROST) | Is compromise treated as one undifferentiated event, or does the draft distinguish sub-threshold share compromise — which the scheme is designed to tolerate — from full key compromise, and state its DKG-vs-trusted-dealer trust assumptions? |
| Canonical JSON serialization feeding a hash/signature | RFC 8785 (JCS) | Is every field entering canonicalization constrained to the ECMAScript-safe-integer range (or equivalent), given JCS numbers serialize via ECMAScript `Number::toString`? |
| Deterministic name-based identifier (UUIDv5) | RFC 9562 §5.5, §6.5 | Does the draft name a dedicated namespace UUID (not reused from an unrelated standard namespace) and specify the exact byte-serialization of concatenated name inputs — verified against the draft's own worked example, not just described in prose? |

This table is a starting point for pattern-matching, not a closed list — if your mechanism doesn't fit
a row, that's the signal to add one, not to skip the stage.

### Validated so far

Four test runs against real WIMSE-adjacent material, each producing at least one finding that Part 3's
checklist alone hadn't surfaced — and, in three of the four, independent expert reviews on the
wimse@ietf.org list (which arrived at similar conclusions by hand, without using this document) hadn't
either:

- **draft-carleton-workload-authz-grant-00:** RFC 7523 §3 makes `jti`-based replay tracking a MAY at
  the base-spec level. The draft already exceeds that structurally (`jti` is REQUIRED, not optional) —
  but never states that the Authorization Server actually enforces single-use over the assertion's
  validity window. Turned a generic "bearer-assertion theft" TODO item into one concrete, gradeable
  sentence.
- **draft-ietf-wimse-mutual-tls-02:** RFC 5280's Name Constraints extension (§4.2.1.10) is a structural
  mitigation for exactly the trust-anchor mis-binding class an independent list reviewer caught by
  hand in relying-party logic — the draft cites RFC 5280 throughout but never mentions Name Constraints
  as an available, complementary certificate-layer fix.
- **draft-ietf-wimse-identifier-03:** RFC 7595 §3.7 requires a scheme-specific security analysis; the
  draft's own recommendation that trust domains be FQDN-shaped is exactly the condition under which a
  URI scheme has historically been mistaken for a resolvable network locator, and the document never
  states either way whether that's intended.
- **draft-klrc-aiagent-auth-03 (AIMS), checked retroactively against its own WIMSE Call for Adoption
  thread:** two Step-0-shaped findings — RFC 8693's `act` claim missing for multi-hop actor
  attribution, and RFC 9068's `sub`/`client_id` principal-semantics requirement — were both found
  independently, by hand, by list reviewers (Dmitry Izumskiy; Kieran Sweeney building on Karthik
  Rampalli; Songbo Bu) rather than by this document's process. That gap is exactly what prompted adding
  Step 0 and these two base-spec rows in v0.2.
- **draft-sato-soos-gar-05:** two Stage-0-shaped findings from the same pass — a Merkle audit-path gap
  (RFC 6962 §2.1.2) directly in tension with a Security Considerations MUST elsewhere in the same
  document, and a FROST/RFC 9591 finding where Security Considerations treats "key compromise" as one
  undifferentiated event despite the base spec's explicit sub-threshold-vs-full-compromise distinction.
  Prompted the RFC 6962 and RFC 9591 table rows above.
- **draft-sato-soos-kia-05, draft-sato-soos-mad-03, draft-sato-soos-peer-01:** the same UUIDv5 base-spec
  obligation (RFC 9562 §6.5's namespace-separation guidance) found missing three times independently —
  first as a reused standard namespace (KIA), then propagated unchanged into a dependent draft via a
  shared constant (MAD), then as a fully unspecified derivation with no namespace UUID and no
  byte-serialization at all, breaking a normative cross-verification MUST that two independent
  implementations can't actually satisfy (PEER-01). Confirms this is a systemic pattern worth checking
  mechanically on every new draft, not a one-off, and prompted the dedicated UUIDv5 table row above.

### What Stage 0 is not

It's not a replacement for Part 3 — WIMSE-specific patterns (trust-domain semantics, the architecture
draft's own threat categories, agent-specific delegation questions) live in the checklist because
they're not derivable from any single base spec. Stage 0 and Part 3 are complementary passes over the
same draft, not alternatives.

### Suggested Prompt

```
I'm running a Stage 0 base-spec review of an IETF Internet-Draft before doing anything WIMSE-specific.

For each mechanism in the attached draft (the thing that validates, authenticates, grants, or revokes
something):

1. Name it precisely — not "uses JWTs" but which specific base RFC(s) or registries it profiles,
   extends, or instantiates. If you're not certain, say so explicitly rather than guessing, and note
   what you'd need to look up to be sure.

2. For each base spec you named, identify what it obligates a profile or extension to address —
   focus specifically on: MUST/MAY distinctions the draft may have silently narrowed or widened;
   named mitigations the base spec treats as optional but this draft's own threat model may require;
   comparison, canonicalization, or equivalence rules the artifact inherits; and extensibility points
   (claim namespaces, registries, algorithm negotiation) the base spec expects a profile to address.

3. Check the draft's actual text against each obligation. Mark each as Addressed, Silent,
   Contradicted, or N/A, with a section citation for Addressed/Contradicted findings.

4. Don't limit findings to anything resembling a generic WIMSE checklist — a finding sourced directly
   from a base spec's own normative text stands on its own, even if it doesn't fit a familiar category.

5. Flag explicitly anywhere you're inferring a base spec's requirements from general knowledge rather
   than the spec's actual text, so I know where to double-check citations before using this externally.

Draft: [paste or attach]
```

## Stage 1 — LLM-Assisted Draft Scan

*Working draft — Stage 1 of the WIMSE Security Review process. Component 1 (process for authors drafting new work).*

### What this stage is for

Run this for whatever Step 0, Stage 0, or the checklist (Part 3) left **Silent** or **Contradicted**,
and for any mechanism novel enough that most checklist items came back N/A. The earlier stages give a
broad, fast, ready-made first pass; Stage 1 is the deeper, custom follow-up for the specific gaps they
surfaced — not a second generic pass over the whole draft. A generic "is this secure?" prompt produces
a generic answer regardless of stage; what makes this stage worth the extra effort is aiming it
precisely at what's already known to be unresolved.

### The process

1. **Start from the mechanisms you already named for the checklist**, narrowed to whichever ones came
   back with **Silent** or **Contradicted** items, or enough N/As to suggest the checklist doesn't
   have good coverage for it yet. If you're using this stage without having run the checklist first,
   name your draft's 3–5 novel mechanisms now — whatever your draft introduces that isn't just
   composing existing, already-reviewed primitives. Everything below is scoped to that list, not the
   whole document.

2. **Build the scan checklist from two sources, not one:**
   - **A structural taxonomy** — RFC 3552 / BCP 72's category set (confidentiality, data integrity,
     peer entity authentication, non-repudiation, unauthorized/inappropriate usage, denial of
     service) is old enough to be uncontroversial and complete enough to catch category-level
     omissions — "this draft never discusses DoS at all" is a real, common, catchable gap.

     **This isn't optional extra scrutiny — it's already the requirement.** RFC 3552/BCP 72's status
     as Best Current Practice means the IETF has already decided every RFC's Security Considerations
     section is expected to address these six categories, DoS included. A draft silent on DoS hasn't
     merely left a gap under-covered; it hasn't met a two-decade-old standing bar for what "Security
     Considerations" is supposed to mean. Worth naming this plainly, because in practice DoS tends to
     get treated as an operational/availability concern separate from "real" security (confidentiality,
     authentication, integrity) rather than one of RFC 3552's own six co-equal categories — which may
     be exactly why it's the single most consistently silent category across drafts this checklist has
     been run against so far.
   - **Known CVE classes relevant to your mechanism type** — not a generic CVE database dump.
     Delegation/token mechanisms should be checked against token-forgery and scope-narrowing
     classes; anything touching attestation or channel binding should be checked against relay
     and evidence-binding classes; anything issuing or verifying signed identifiers should be
     checked against signature-bypass classes (`alg:none` and equivalents).

3. **Run the scan per mechanism, not once over the whole draft.** Ask, for each of your 3–5 named
   mechanisms: which of the taxonomy categories apply to this mechanism specifically, and does the
   draft's current text address each one — with normative language, or is it silent?

4. **Record every finding as one of three outcomes:**
   - **Addressed** — normative text already covers this category/class adequately.
   - **Silent** — the draft says nothing here. This is a candidate for Stage 2 (does the gap actually
     matter once you try to exploit it?) or straight to Security Considerations text if it's obviously
     load-bearing.
   - **Contradicted** — the draft's own text disagrees with itself once checked against this category.
     This is the fastest, cheapest class of bug to find at Stage 1, because it doesn't require running
     any code — just careful, structured re-reading.

5. **Treat "Silent" findings as Stage 1's real output**, not a failure of the scan. The goal isn't a
   clean pass — it's an honest list of what hasn't been checked yet, to hand to Stage 2.

### A note on same-revision and cross-section consistency

*Added in v0.3.* Across every full-coverage pass run against this project's own drafts so far, the
single most common **headline** finding — not a minor item, the top-ranked one — has been a Direct
Conflict between two pieces of the draft's own text: two normative sections that can't both be
implemented literally, two framings of the same mechanism implying different failure semantics, or a
fix added in one section that quietly makes another section's own requirement unreachable. This holds
whether the two sections are both new in the same revision or one predates it — the common thread is
that neither was checked against the other, only against the taxonomy or against pre-existing text in
isolation. If Stage 1 does nothing else, it should still include a deliberate pairwise pass: for every
section touched or added, name every *other* section that references the same mechanism, field, or
artifact type, and check them directly against each other — not just against RFC 3552 categories or
CVE/CWE classes. This costs nothing beyond attention and has outperformed every other class of finding
in this project by a wide margin.

### Worked examples, from our own drafts

- **A caught-early Contradicted finding** — running a structural checklist derived from another
  author's security-guidelines draft against a set of WIMSE-adjacent WG documents, rather than
  building the taxonomy from scratch, caught a real citation-drift bug: one document's security
  considerations referenced a section number in a second document that had since been renumbered.
  Small, but exactly the class of thing a Stage 1 pass exists to catch before it reaches implementers.
- **The honest starting point** — before any CVE-based scanning had been done at all, the plain
  answer to "have we checked this against known vulnerability classes" was no. That gap, once named,
  is what actually produced the first real Stage 1 pass — the admission came before the fix, not
  after.
- **What a targeted scan finds that a generic one won't** — scanning specifically for attestation/
  channel-binding relay-attack classes (rather than "security issues" broadly) is what surfaced the
  CVE-2026-33697-class finding; scanning specifically for identity-takeover classes surfaced the
  CVE-2025-13609-class finding. Neither would have come up from a single undifferentiated "review
  this draft for security problems" pass.

### What Stage 1 is not

It's not proof of security — an LLM scan against a checklist can miss anything the checklist doesn't
name, and it can't tell you whether a mechanism that passes every category is still exploitable in
combination with another draft's mechanism (that's a **Tension**-class finding, and Stage 1 working
per-draft in isolation generally won't surface it — flag cross-draft composition explicitly as a
known blind spot of this stage). Stage 1's job is to make sure the obvious, nameable gaps get found
before code is written, cheaply, so Stage 2's more expensive synthetic-scenario effort isn't spent
rediscovering things a checklist could have caught.

### Suggested Prompt

Run once per named mechanism, not once for the whole draft:

```
You are performing a Stage 1 security scan of one mechanism from an IETF Internet-Draft, against
two sources: (1) the RFC 3552 taxonomy — confidentiality, data integrity, peer entity
authentication, non-repudiation, unauthorized/inappropriate usage, denial of service — and (2)
vulnerability classes relevant to this specific mechanism type (name the type: e.g., token
issuance/verification, delegation, attestation/channel binding, revocation).

Mechanism name and draft text: [paste the specific section]

For each applicable RFC 3552 category and each relevant CVE/CWE class you're aware of for this
mechanism type, state: does the draft's current text address this with normative language, is it
silent, or does it contradict itself? Cite the specific text for any "addressed" finding. Do not
mark a category N/A without stating why it doesn't apply to this specific mechanism — "this seems
fine" is not a reason.
```

Cross-check the LLM's CVE/CWE recall against a real search rather than trusting it from memory — model
knowledge of recent CVEs is uneven and the whole point of this stage is catching real, current classes,
not whatever the model happens to remember.


## Stage 2 — Self-Testing (Sample Code + Synthetic Scenarios)

*Working draft — Stage 2 of the WIMSE Security Review process. Component 1 (process for authors drafting new work).*

### What Stage 1 doesn't catch

Stage 1's LLM-assisted scan checks what your draft's text *says*. It won't catch what happens when
the mechanism actually runs — a scan can read a delegation-narrowing rule and conclude it looks
sound without ever discovering that two of its own clauses contradict each other under a specific
input. Stage 2 exists to find that gap by building the thing and trying to break it, at small scale,
before anyone else does.

You do not need a full reference implementation. You need working code for the 3–5 mechanisms your
draft actually introduces — the parts nobody else has built yet — plus a way to throw both normal
and hostile input at them.

### The process

1. **Isolate the novel mechanisms.** Pull the 3–5 things your draft does that aren't just composition
   of existing, already-reviewed building blocks. Security review effort should concentrate here, not
   spread evenly across the whole draft.

2. **Build minimal sample code** for each — enough to exercise the mechanism's actual logic, not a
   full product.

3. **Generate synthetic scenarios in two sets:**
   - **Happy-path** — normal use, confirms the mechanism does what the draft claims.
   - **Edge / adversarial** — deliberately hostile or boundary input, one scenario per plausible
     attack against the mechanism. Ground these in a real threat framework rather than guessing —
     mapping candidate attacks against MITRE ATT&CK before writing scenarios gives the adversarial
     set actual coverage instead of whatever comes to mind first.

4. **Run every scenario against the real code.** Not a thought experiment — actually execute it and
   record the outcome. This step is where real bugs get found; a scenario that only exists on paper
   can't surprise you.

5. **Classify every divergence** between what the draft says should happen and what the code actually
   does, using three categories:

   | Category | What it means | Where it's fixed |
   |---|---|---|
   | **Direct Conflict** | The draft's own text contradicts itself — two clauses, or the prose and the schema, disagree | Draft text — pick the correct one, fix both sides |
   | **Tension** | The mechanism is internally consistent, but conflicts or interacts unsafely with another WIMSE-adjacent draft or spec it composes with | Draft's Related Work / Security Considerations — state the interaction explicitly, resolve or flag it |
   | **Gap Not Yet Written** | A scenario reaches a state the draft simply never addresses | Draft text — either specify the behavior, or honestly flag it as a known open issue rather than leaving it silent |

6. **For anything that looks like a code problem rather than a draft problem**, run the three-question
   test before touching the draft:
   - Is the normative text actually silent, or just hard to read? If the answer's in there, it's an
     implementation fix, not a draft gap.
   - Would two reasonable implementers reach different conclusions from the same text? If yes, that's
     a **Tension**- or **Gap**-class issue, not a code bug.
   - Does the code have to decide something the draft never addresses at all? That's a **Gap**.

7. **Write the honest result into Security Considerations.** Fixed issues get normative language.
   Known-but-unresolved gaps get flagged explicitly as open issues — don't paper over them. Reviewers
   trust a draft more, not less, for naming what it doesn't yet solve.

### Worked examples, from our own drafts

- **Direct Conflict** — an early IDP draft's §7.2 had its miscalibration ratio direction inverted
  between the prose description and the JSON schema comment. A synthetic edge-case log caught it
  immediately once run against real code; a text-only read had missed it.
- **Gap Not Yet Written, handled honestly** — KIA's XPID revocation gap was found this way and wasn't
  silently fixed or hidden — it went into the draft as a named open issue with interim mitigations,
  which is the right outcome when Stage 2 finds something too large to resolve on the spot.
- **A known incomplete pass** — MJWT never got a full Stage 2 pass after an initial CVE-driven finding
  (an `alg:none` signature-bypass class issue). That's flagged here deliberately: Stage 2 is a
  discipline you can start and not finish, and an honest process document should say so rather than
  imply every draft that uses it comes out fully covered.

### What Stage 2 is not

It is not a formal verification exercise (that's further along the rigor spectrum — see Stage 3), and
it is not a substitute for Stage 1's structural scan. A draft that's never had its text checked
against known attack classes will produce sample code that faithfully implements an insecure design;
Stage 2 only tells you the code matches the draft, not that the draft itself is sound. Do Stage 1 first.

### Suggested Prompt

Use to generate the adversarial half of your scenario set (write the happy-path half by hand — an LLM
adds less value there):

```
You are generating adversarial test scenarios for one mechanism from an IETF Internet-Draft, to be
run against real sample code, not just reasoned about. Ground every scenario in a specific MITRE
ATT&CK technique or a real CVE/CWE class relevant to this mechanism type — don't invent generic
"attacker tries to break it" scenarios with no concrete grounding.

Mechanism name and draft text: [paste the specific section]

For each scenario, state: the specific technique/CVE class it's based on, the exact malformed or
hostile input, and the expected correct behavior per the draft's normative text (what should the
code do — reject, and with what specific error/deny code, if the draft defines one). If the draft
doesn't specify what should happen for a scenario you generate, say so explicitly — that's a
candidate Gap Not Yet Written finding, not something to guess an answer for.
```

Every scenario this produces still has to actually run against real code — the prompt only replaces
the brainstorming step, not the execution or the classification of what the run reveals.

## Reporting Findings — Output Format

*Added in v0.2. Applies to write-ups from any stage — Step 0, Stage 0, Stage 1, or Stage 2 — not a
fifth stage of its own.*

### Why this exists

A full write-up of a real finding — CWE/CVE grounding, Stage 2 code, exact clause citations, the
Silent-vs-Contradicted reasoning — is valuable, but dumping all of it into a mailing-list post or a
GitHub issue asks a chair or reviewer to read a research report to find out what you're actually
asking them to change. Structure the write-up in three tiers instead, and let the reader choose how
deep to go.

### The three tiers

1. **Recommendation** — one or two sentences. The concrete ask, in normative language if possible
   ("§X MUST NOT..." reads better than "it might be worth considering whether..."). This is the only
   part that has to be read for the finding to register.
2. **Background** — one paragraph. Which mechanism, which category (a checklist section, an RFC 3552
   taxonomy category, a CWE class, a Step 0 base-spec obligation), and why it matters — enough that
   someone unfamiliar with the specific mechanism understands the stakes without already knowing the
   draft in depth.
3. **Detailed reasoning** — link out, or attach only if asked. The CWE/CVE precedent, the Stage 2 code
   and scenario results, the exact clause citations, the Silent-vs-Contradicted classification
   reasoning. This is where the real evidentiary weight lives, but it doesn't need to sit inline in a
   list post to do its job — a link to a published write-up (or an offer to share code) carries the
   same weight with far less reading required up front.

### Worked example

**Recommendation:** §10.4.3 onward-delegation (a further hop, or a §10.4.2 self-request) MUST NOT
exceed the scope of the inbound token, verifiable by the AS rather than the invoked Agent's
cooperation.

**Background:** nothing in §10.4.3 ties an invoked Agent's own follow-on authorization requests back
to the scope it was invoked with — a confused-deputy pattern (CWE-441), with an unbounded-recursion
variant since §4 allows a Tool endpoint to itself be another Agent and §10.4.3 sets no depth ceiling.

**Detailed reasoning:** [link] — a working implementation of §10.4.1/§10.4.2 exactly as specified,
confirming a `calendar:read`→`account:delete` escalation and a 100,000-hop recursion with zero
rejections; CVE-2026-27124 (FastMCP OAuthProxy) as a live precedent.

Same underlying finding, three sentences to register it instead of a full technical report — and the
depth is still there, one click away, for anyone who wants to verify it.


---

# Part 2 — WIMSE Specifics: What Authors Need to Understand

*Working draft — Component 3 of the WIMSE Security Review process. Grounding for Stages 1 and 2.*

### Why this section exists

Stage 1's taxonomy (RFC 3552) and CVE-class checks are generic — they apply to any protocol. This
section is the opposite: it's what's specific to *writing inside WIMSE* — what the charter actually
commits the working group to, what it deliberately excludes, and which live, unresolved tensions the
working group has already surfaced. A checklist alone won't tell you any of this; it's about where
WIMSE sits, not what's insecure in the abstract.

### What WIMSE's charter actually scopes — and the angle to watch for each

The charter's Program of Work has five items. Each carries its own security angle worth knowing
before you draft into it.

**1. WIMSE architecture** (Informational) — defines common terminology, workload attestation and
identity, a threat model, and a set of architectural components and compositions, illustrated through
2-3 example scenarios.
*Angle:* this document's threat model is the foundation everything else is measured against. If your
draft's own threat model diverges from it — assumes a stronger or weaker attacker, or a component
composition not covered by the reference scenarios — that divergence needs to be stated explicitly,
not left implicit. A reviewer will check your draft against this baseline whether you reference it or
not.

The architecture document's own Security Considerations (as of -08) names six categories worth
checking your draft against directly, since these are the WG's own stated threat model, not an
outside taxonomy: Traffic Interception (TLS protection is only guaranteed between adjacent hops, not
end-to-end, since it's routinely terminated at gateways/proxies along the path), Information
Disclosure (bearer tokens and PII leaking into application logs, separate from network interception),
Workload Identity Binding to Tokens (binding a token to a specific workload identity as the mitigation
for stolen-token blast radius), Credential Theft (bearer credentials named as more vulnerable than
key-bound ones; key rotation and revocation-on-suspected-compromise are named requirements),
Authentication and Authorization (the document's own words: successful authentication must never be
treated as implicit authorization — this is the WG's authoritative statement of the same gap discussed
below under "authorization stops at the token boundary"), and Workload Compromise (a compromised
workload being used as a pivot point against the rest of the system; least privilege as the named
mitigation).

If your draft governs agentic AI specifically, the architecture document already has a directly
relevant section — §3.4.11, "AI and ML-Based Intermediaries" — framing agentic AI as a special case of
delegated workloads, and stating close to normatively that autonomous actions must be distinguished
from delegated ones via separate identities or token scopes, and that each hop in an AI-to-AI
delegation chain must explicitly re-scope and re-bind the security context to prevent authority
silently extending beyond what was granted. If your draft's delegation model already does this, cite
this section specifically — it turns "we independently arrived at a similar design" into "we conform
to WIMSE's own stated requirement for this case," which is a stronger claim.

**2. Securing service-to-service traffic** (Proposed Standard) — a JOSE-based WIMSE token protecting a
chain of HTTP/REST calls, within and across trust domains, with cryptographic binding to the caller's
identity and, *optionally*, binding to the transaction. Token context may include user identity,
platform attestation, and SBOM artifacts.
*Angle:* transaction binding is explicitly optional in the charter text, not guaranteed — a draft that
assumes every WIMSE token is transaction-bound is assuming more than the base spec promises. Also
worth noting precisely: WIMSE tokens can *carry* SBOM-derived context, but defining or verifying SBOM
itself is out of charter (see exclusions below) — don't let your draft's security story quietly depend
on SBOM verification WIMSE was never chartered to provide.

**3. Token issuance** (Proposed Standard) — local issuance of WIMSE tokens by an issuer operating with
*limited authority* — the workload itself, or another nearby workload.
*Angle:* "limited authority" is the load-bearing phrase, and the charter doesn't itself define the
ceiling. A draft relying on local issuance needs to state explicitly what bounds that issuer's
authority — an unstated or unenforced ceiling is exactly the shape of an issuer-laundering attack
(a presenter effectively promoting its own key to issuer status by relabeling the artifact — the same
class EMILIA's Tamarin work names directly as `no_issuer_laundering`).

**4. Token exchange** (Proposed Standard) — exchanging an incoming token for a workload-specific WIMSE
token at a security boundary, based on RFC 8693, with a defined set of claim-mapping profiles between
formats.
*Angle:* exchange at a security boundary is precisely where delegation-chain attacks live. RFC 8693
has a known chain-splicing risk — a malicious actor inserting itself into a delegation chain during
exchange — serious enough that at least one WIMSE-adjacent draft (`draft-mw-oauth-actor-chain`) exists
specifically to attack it with cryptographic chain validation. Any draft defining or relying on token
exchange should address this class directly, not assume RFC 8693's base mechanism already handles it.

**5. Operational experience documentation** (Informational or BCP) — recommendations based on existing
token-distribution practice.
*Angle:* lower formal rigor track (not Proposed Standard) doesn't mean lower security stakes — a BCP
can quietly bless an already-widespread but insecure pattern precisely because it's documenting
practice rather than proposing new normative text. Apply the same Stage 1/2 discipline here as you
would to a PS-track draft.

### What's explicitly out of scope — and why that matters for your Security Considerations

The charter excludes, by name: static software identities and provenance (including SBOM), personal
identities, deployment chains, and supply chain management. These aren't oversights — they're
deliberate boundary decisions.
*Angle:* if your draft's security argument quietly leans on any of these — assuming a
supply-chain-verified deployment pipeline, or treating personal-identity binding as something WIMSE
itself guarantees — that's an out-of-charter assumption riding along inside your draft. Name the
dependency explicitly and point to whatever *does* cover it (if anything does), rather than letting a
reviewer discover the assumption on their own.

### The working groups your draft is probably touching

The charter names these directly as WIMSE's declared collaboration partners — not a loose
association, but a stated dependency structure:

- **OAuth / GNAP** — token issuance and delegation semantics generally.
- **SCIM** — identity provisioning, where relevant to workload lifecycle.
- **SCITT** — if your draft produces any kind of audit or transparency record, check whether it
  should be expressed as a SCITT Signed Statement rather than a bespoke log format.
- **RATS** — if your draft touches attestation at all, even indirectly, the binding question — does
  evidence cryptographically bind to a trusted key, and at what layer — is the single most contested,
  actively-disputed technical question in adjacent WGs right now. Don't cite any binding-level
  comparison as settled without checking its current status first.
- **CNCF SPIFFE/SPIRE** — the reference open-source implementation most WIMSE work is measured
  against. If your draft's identity model can't be explained in terms of "how does this differ from a
  SPIFFE SVID," expect that question at review.
- **OpenID Foundation** — named as a formal liaison; relevant if your draft's token or identity model
  overlaps OIDC-adjacent work.

### Known live tensions — worth knowing before you draft into them

- **Authorization stops at the token boundary — and this is a pattern, not a single gap.** The WIMSE
  leadership's own consolidating framework for agent authentication and authorization is publicly,
  explicitly incomplete exactly here — its Security Considerations section has been described by
  outside reviewers as effectively a placeholder for the authorization-after-token-issuance question.
  It is not alone: at least one other WG-track document (the Mutual TLS credential-transport draft) has
  a Security Considerations section that is, at the time of writing, a literal placeholder rather than
  analysis. Treat an incomplete Security Considerations section as a live, recurring condition in this
  space, not a one-off you can assume gets fixed elsewhere before you need to rely on it.
- **Two legitimate, competing design philosophies exist for key material, and your draft should state
  which one it follows.** Some WIMSE-adjacent attestation work deliberately uses ephemeral, per-ceremony
  keys, on the reasoning that a compromise then only affects a single attestation ("ceremony
  isolation"). Other designs deliberately use long-lived, hardware-anchored keys, treating durability
  and hardware backing as the stronger property and using threshold signing schemes to bound the
  blast radius of key compromise instead. Neither is wrong, and a reviewer familiar with both schools
  will ask which one you picked and why if your draft doesn't say so itself.
- **Evidence visible to the wrong verifier is its own risk, separate from binding.** In multi-verifier
  or federated attestation topologies, a "lead" or intermediate verifier can end up with structural
  visibility into Evidence it isn't actually authorized to appraise, even when the binding itself is
  sound. If your draft has any multi-party or cross-instance verification model, check explicitly
  whether every party that can see a piece of Evidence is also a party entitled to see it — encrypting
  Evidence to the specific intended verifier's key, rather than sharing it with every participant in
  the topology, is the known mitigation.
- **Delegation-depth narrowing has no defined ceiling.** Several parallel drafts solve token
  acquisition and transaction-scoped replay but do not yet define narrowing across delegation depth,
  or an operator-level ceiling independent of any single grant. If your draft assumes narrowing is
  handled elsewhere, name which draft you're relying on — don't assume it's solved.
- **Attestation binding is unsettled, not proven.** Claims that one binding approach is "formally
  proven superior" to another are currently disputed by credentialed independent reviewers on
  technical grounds. Check current status before citing any comparison as settled.
- **The mid-execution human-in-the-loop gap is named but unresolved.** Existing approval flows (e.g.,
  CIBA) are client-initiated and don't naturally fit an agent-initiated escalation mid-execution. If
  your draft assumes a human can be brought in cleanly partway through a flow, check whether the
  mechanism you're relying on for that actually exists yet. Three independent AIMS-03 Call for
  Adoption reviewers (Chris Hood, Dmitry Izumskiy, morganLR) hit this same gap by hand, which is why
  it's now also a standing Part 3 checklist item (Section B) rather than only a narrative note here.
- **Observability stops at reactive, event-driven security-posture signals.** The existing
  signal-sharing substrate (SSF/CAEP/RISC) covers point-in-time state-change events; it does not
  provide federated behavioral audit across trust domains. If your draft's security story depends on
  cross-operator visibility into an agent's behavior over time, that capability doesn't currently
  exist in the standardized stack.
- **RFC 8693 chain-splicing remains a live concern at token exchange.** Not fully closed by the base
  spec — treat it as an open attack class at any security boundary your draft defines an exchange for.
- **RATS-unaware relying parties exist downstream, and your draft may reach them.** Not every system
  your draft's identity eventually reaches understands attestation at all. If your draft assumes
  universal attestation-awareness downstream, state that assumption explicitly rather than leaving it
  implicit.
- **Offline/asynchronous access to a user-owned resource, without a long-lived refresh token, has no
  settled answer yet.** A workload acting on a user-owned resource while that user is absent and not
  signed in is a real, actively-discussed open problem — the obvious OAuth answer (a long-lived refresh
  token) is exactly what people are trying to avoid, and the newer ID-JAG-flow alternative runs back
  into needing a refresh token of its own, undermining the reason to use it. There is currently no
  agreed encoding for "this workload may act on behalf of this user, for this resource, even while they
  are not signed in." If your draft assumes this problem is already solved by some other mechanism,
  check that assumption directly rather than treating it as settled plumbing.

*This list is a starting point, not exhaustive — it reflects tensions discussed recently. If you know
of others the working group has surfaced earlier that aren't captured here, please add them.*

- **Evidence sufficiency has no defined answer.** The standards landscape now produces many distinct
  signed artifacts about an agent's action — identity credentials, delegation tokens, transaction
  tokens, attestation results, policy permits, human-authorization receipts, post-execution records,
  transparency-log receipts — but no specification defines when a *combination* of these is sufficient
  to rely on for a consequential decision (releasing funds, honoring a trade, satisfying an auditor).
  If your draft's security story depends on other mechanisms also being present, say so explicitly
  rather than implying your artifact alone is sufficient.
- **Human-authorization root-of-trust bootstrapping is itself an open, actively-discussed problem, not
  a solved prerequisite.** Drafts naming a human principal as the root of a delegation or mandate chain
  tend to assume that principal's own authority is simply given. Current WIMSE-adjacent work treats
  this as a real design question — proposals include a signed, hash-chained, transparency-logged
  authority document with graded acceptance (an un-pinned issuer never receives full trust;
  high-consequence actions require a pinned anchor). If your draft names a human principal as an
  authority root, check whether it says anything about how that root's own authority is established
  and verified, or simply assumes it.

### Precise threat-class vocabulary worth adopting

A few WIMSE-adjacent drafts have named attack classes precisely enough that reusing their terms,
rather than re-describing the same thing in your own words, makes your draft easier to cross-reference
and review:

- **Parent-swap** — an attack where a delegation chain's *recorded* entries look valid, but the parent
  credential they point to has itself been swapped, compromised, or is no longer what it claims to be.
  An append-only chain of signed issuance entries, by itself, does not catch this — it records history
  faithfully but doesn't re-verify that history is still true. The defense is re-verifying the parent
  credential's own current signature and status at every use, not only at issuance. If your draft has a
  delegation chain, check explicitly whether verification re-checks the parent at every hop or only
  trusts the recorded chain.
- **Stolen Credential Portability** — a stolen key or token being usable from an environment or
  jurisdiction it was never intended for, distinct from the credential simply being stolen. Relevant to
  any draft where an agent, key, or credential might reasonably move across trust or jurisdictional
  boundaries.
- **Transitive consent** — whether authority (or, in a data-protection context, consent) granted at
  one delegation hop propagates automatically to further hops, or must be explicitly re-granted or is
  blocked by default. Worth stating explicitly which default your draft uses, and why.
- **"The presenter controls the graph"** — a framing for any mechanism where the party presenting
  evidence also assembles or controls what evidence gets shown. Every defense your draft specifies
  needs to hold under the assumption that the presenter is exactly as adversarial as any other network
  participant, not implicitly cooperative because it's also the one submitting the evidence.
- **Claim portability across contexts** — a claim that is valid and meaningful in the context it was
  issued for (a token, a receipt, an attestation result) does not automatically retain that meaning
  when copied into a different artifact — a gateway envelope, an audit record, a delegated session.
  If your draft has any claim that gets carried into a second artifact type, check whether the binding
  and freshness properties that made it trustworthy in the first place actually travel with it, or get
  silently dropped in the copy.

### Tools relevant to WIMSE security review

What each tool actually does, and how it applies to a WIMSE-adjacent protocol draft specifically —
not a generic catalog. Entries vary in provenance: some come from people in this community who've
used a given tool directly on adjacent work, others are included because they're well-established in
the wider security-protocol-verification literature rather than from direct use. The note just below
explains that distinction in more detail. If you have real experience with any of these — for or
against, on a WIMSE draft or something adjacent — please contribute it; that's worth more to the next
author than anything written here secondhand.

#### A note before the list

Not every entry below reflects direct, hands-on experience from this document's contributors — some
come from people in this community who have used a given tool directly on adjacent work, others are
included because they're well-established in the wider security-protocol-verification literature.
Where a description leans on secondhand knowledge rather than direct use, that's worth treating as
provisional rather than authoritative. If you have real experience with any of these — for or against,
on a WIMSE draft or something adjacent — please contribute it, and note what you actually did (which
draft, which property you checked, what the tool found). That's worth more to the next author than a
description written without direct experience behind it, however carefully researched.

#### Formal protocol verification tools

**ProVerif**
Symbolic model checker for cryptographic protocols. You describe the protocol and the properties you
want (secrecy, authentication/correspondence, some equivalence properties) in Prolog-derived syntax;
ProVerif either proves the property holds for an unbounded number of sessions or produces an attack
trace showing exactly how it fails. Strongest for confidentiality and correspondence properties;
weaker for showing protocols are *equivalent* under swapped values than tools built for that.
*Applies to WIMSE drafts that:* define a message exchange or handshake where you want to claim "an
attacker on the network cannot learn X" or "if the responder accepts, the initiator really sent this" —
i.e., most token issuance, attestation, or credential-exchange mechanisms.

**Tamarin Prover**
Symbolic theorem prover, similar goals to ProVerif but built around multiset rewriting rules and
supports unbounded verification with a full Dolev-Yao attacker (network control, no cryptanalysis).
Has both a fully automated mode and an interactive mode for manually guiding proofs where automation
stalls. Distinctive strength: modeling a multi-step *composed* protocol as a single system rather than
verifying each piece in isolation and assuming the pieces compose safely — and supporting deliberately
weakened "control" models to confirm the tool would catch a known-bad variant, which is strong evidence
the main proof isn't vacuous.
*Applies to WIMSE drafts that:* chain several steps together (challenge → evidence → binding →
consumption, or similar) where the actual risk is in how the steps compose, not in any single step
alone — delegation chains and multi-party approval flows are a natural fit.

**Scyther**
Automated falsification and unbounded verification tool with a GUI, using its own protocol
description language (SPDL). Generally faster to get initial results from than Tamarin for
straightforward protocols, though less flexible for protocols with complex algebraic properties.
*Applies to WIMSE drafts that:* are early-stage and benefit from a fast first pass to catch obvious
issues before investing in a heavier Tamarin/ProVerif model.

**CryptoVerif**
Works in the *computational* model rather than the purely symbolic one — it reasons about actual
cryptographic assumptions (e.g., a signature scheme is unforgeable with some bounded probability)
rather than treating cryptography as a perfect black box. This makes its guarantees closer to what a
working cryptographer means by "secure," at the cost of being harder to use and slower to get results
from.
*Applies to WIMSE drafts that:* make a specific claim about cryptographic strength (not just protocol
logic) — for example, a novel key-derivation scheme where the question is whether the derivation
itself is sound, not just whether the surrounding protocol logic is.

**AVISPA / AVANTSSAR**
Automated validation platform using its own specification language (HLPSL), with a GUI, aimed at
making protocol verification accessible without deep formal-methods background.
*Applies to WIMSE drafts that:* need a lower-barrier-to-entry first formal check, particularly useful
for an author without prior formal-methods experience who wants a sanity check before engaging a
Tamarin/ProVerif specialist.

**Verifpal**
A symbolic verifier designed explicitly for readability and a gentler learning curve than Tamarin or
ProVerif, at some cost to expressiveness. Has been used for real-world protocol analysis (e.g., the
Matrix messaging protocol's cryptographic suite).
*Applies to WIMSE drafts that:* are being modeled by an author new to formal verification — a
reasonable first tool to learn on before attempting Tamarin or ProVerif on the same draft.

**TLA+**
A model checker for system *state* and temporal/relational properties — not cryptography specifically.
You specify states, transitions, and invariants that must hold across all reachable states; TLA+
exhaustively checks (within bounds you set) whether any reachable state violates an invariant.
*Applies to WIMSE drafts that:* define a stateful process — a session lifecycle, a revocation state
machine, a multi-party approval quorum — where the risk is reaching an unintended state, not a
cryptographic break specifically.

**Alloy**
A relational model finder: you declare facts (constraints that must always hold) and assertions
(properties you want to check), and Alloy searches for a counterexample within a bounded scope. Good
at catching structural/relational design flaws — e.g., "can two different principals ever be assigned
the same identifier" — that are easy to miss by inspection.
*Applies to WIMSE drafts that:* define a data model or relationship structure (identifier schemes,
delegation trees, registry structures) where the concern is a structural flaw in the relationships
themselves, not the protocol's message flow.

#### Adjacent, non-formal-verification tooling

**MITRE ATT&CK**
Not a verification tool — a structured, continuously updated taxonomy of real-world adversary tactics
and techniques, organized by attack phase. Used to *ground* threat-scenario generation in documented
real-world behavior rather than ad hoc guessing about what an attacker might try.
*Applies to WIMSE drafts that:* are entering Stage 2 (synthetic scenario generation) and need a
structured way to generate adversarial test cases — map your draft's attack surface against relevant
ATT&CK techniques before writing scenarios, rather than starting from a blank page.

**CVE/CWE databases**
Public records of specific, previously discovered vulnerabilities (CVE) and weakness classes (CWE).
Not protocol-specific — searching by the vulnerability class relevant to your mechanism (e.g., identity
takeover, signature bypass, relay attacks) surfaces real precedent for what to check.
*Applies to WIMSE drafts that:* are entering Stage 1 (LLM-assisted scan) — the scan should be checked
against CVE/CWE classes matching your draft's specific novel mechanisms, not run generically.

**Synthetic scenario corpora (happy-path + adversarial)**
Not a third-party tool — a discipline of generating structured test logs (normal use and hostile/edge
cases) and running them against real sample code, rather than reviewing text alone.
*Applies to WIMSE drafts that:* have any working sample code at all — this is the core of Stage 2 and
applies regardless of which formal tool, if any, is also used.

#### How to contribute to this list

Add a new tool, correct or expand an existing entry, or add real experience applying one of these to
a WIMSE-adjacent draft. The most valuable contribution is concrete: what you modeled, what the tool
found (or didn't), and what that meant for the draft text.

---

### The default: over-explain rather than under-explain

Name the adjacent working group your mechanism touches. Name the specific contested question if
you're relying on one side of it. Say so plainly if a security property is inherited from another
draft rather than provided by yours. None of this costs you credibility — all of it saves a reviewer
from having to reconstruct context you already had.

### Suggested Prompt

Run once, early, before Stage 1 — this surfaces hidden dependencies on WIMSE's charter and
adjacent-WG territory, not vulnerabilities directly:

```
You are checking an IETF Internet-Draft for undeclared dependencies on WIMSE's charter scope and
known adjacent-WG territory. Given the draft text and the WIMSE-specifics summary below, identify:
(1) any place the draft assumes a property WIMSE's charter explicitly excludes (SBOM/software
provenance, personal identity, deployment chains, supply chain management), (2) any place the draft
relies on a WIMSE Program-of-Work item's optional feature (e.g., transaction binding) as though it
were guaranteed, (3) any of the listed known live tensions the draft's mechanism touches without
naming it, and (4) any adjacent working group (OAuth, RATS, SCITT, SPIFFE) the draft's mechanism
clearly composes with but doesn't cite.

[Paste this WIMSE-specifics section]

[Paste draft text]
```

Not a substitute for Stage 1 — its job is making sure the Stage 1 scan doesn't run against a draft
that's silently assuming something WIMSE was never chartered to provide.


---

# Part 3 — WIMSE Security Checklist (v0.3)

*Working draft — Component 4 of the WIMSE Security Review process. A living checklist, meant to grow
as more authors contribute items from their own drafts' findings. This is a starting point, not a
complete or authoritative list.*

### How to use this checklist

Start here — this is the recommended first action for any draft, before Stage 1 (after Step 0 and
Stage 0). Name your draft's 3–5 novel mechanisms first (the parts that aren't just composition of
existing, already-reviewed building blocks), then run this checklist once per mechanism, not once over
the whole draft. For each item, mark one of: **Addressed** (normative text covers it) / **Silent**
(draft says nothing) / **Contradicted** (draft disagrees with itself) / **N/A** (item doesn't apply to
this mechanism — say why). Add new items at the bottom under "Contributed items" with your name and the
finding that prompted it — don't renumber or reorganize existing sections when contributing; that's a
v1+ editorial task, not a per-contribution one.

What you do with the result: **Addressed** items need nothing further right now. **Silent** and
**Contradicted** items are exactly what Stage 1 exists for — take those specific gaps to Stage 1's
deeper, custom scan rather than starting Stage 1 from a blank page. If a mechanism is novel enough
that most of this checklist reads N/A, that's the clearest signal Stage 1 is where the real work
needs to happen for that mechanism.

### A. Identity & Authentication

- [ ] Is the workload's identity cryptographically bound to something durable (a key), not just to a
      transport-layer artifact that ends when the connection does?
- [ ] If your mechanism issues or verifies a signed token/credential, is signature algorithm
      confusion explicitly precluded (no implicit trust in an attacker-supplied `alg` field)?
- [ ] Does the draft state what happens when identity verification fails partway through a multi-step
      exchange, not just at the final step?
- [ ] Is the trust-domain / issuer / cryptographic-trust-anchor binding communicated and verified via
      a secure out-of-band channel, rather than assumed or left to the reader to figure out?
- [ ] Is trust-anchor lifetime and rotation considered together with leaf-credential lifetime? (A
      compromised anchor can validate forged credentials for as long as the anchor itself is trusted,
      regardless of how short-lived the leaf credentials are.)
- [ ] Does the draft state its key-material philosophy explicitly — ephemeral, per-ceremony keys
      versus long-lived, hardware-anchored keys — and why, rather than leaving the choice implicit?
- [ ] Does the draft clearly distinguish the logical agent, the live running instance, the
      workload/WIMSE identifier, the OAuth client registration, the delegating principal, and the
      invoked resource as separate security principals — not treating any two as interchangeable?
- [ ] If credential/token lifetime is used as a mitigation for compromise or posture drift, does the
      draft name the external detection-and-revocation (or re-attestation) dependency this actually
      requires — or does short lifetime alone stand in for current validity?
- [ ] Where the draft requires proof-of-possession or key-bound credentials for one artifact type, are
      OAuth access/bearer tokens held to the same standard (DPoP/mTLS, RFC 8705) — or does bearer-token
      use elsewhere quietly reintroduce a risk the draft otherwise defends against?
- [ ] For artifacts with long retention or regulatory-record requirements, does the draft support
      signature/algorithm agility, or does it hard-bind to one algorithm family that may need
      replacing within the record's required lifetime?

### B. Delegation & Authorization

- [ ] If your mechanism supports delegation, is scope narrowing enforced at every hop, or only at
      the root grant?
- [ ] Is there a ceiling on delegated authority that's independent of any single grant in the chain
      (an operator- or root-level maximum), or can depth alone erode it?
- [ ] Can a delegate present evidence of authority that's broader than what it actually received,
      and would a verifier catch that?
- [ ] Does verification re-check a parent credential's own current signature and status at every use,
      or does it only trust a previously-recorded chain entry? (An append-only delegation chain that
      records history faithfully can still miss a "parent-swap" — the parent it points to no longer
      being what it claims — unless the parent itself is re-verified live, not just referenced.)
- [ ] Does authority or consent propagate to further delegation hops by default, or must it be
      explicitly re-granted at each hop? State which, and why.
- [ ] For agentic/AI drafts specifically: are autonomous actions (not attributable to an upstream
      principal) distinguished from delegated ones via separate identities or token scopes, and is
      security context explicitly re-scoped and re-bound at every AI-to-AI hop? (WIMSE architecture
      §3.4.11 states this close to normatively for agentic intermediaries.)
- [ ] Does the draft address establishing authorization/trust between parties with no pre-existing
      relationship (first contact between unrelated organizations), or does it assume authorization-
      server trust anchors are always pre-arranged?
- [ ] Does the draft assume a human approver can be brought into an in-progress, agent-initiated flow
      using client-initiated mechanisms (e.g., CIBA), which don't naturally support mid-execution
      escalation — or does it name what actually supports that case?
- [ ] If any part of the draft's authorization request is derived by translating a higher-level
      natural-language mission or intent (via an LLM or similar), does Security Considerations name
      this translation step as an attack surface distinct from credential handling — and if human
      confirmation is used as a control, is the approval cryptographically bound to a digest of what
      was actually rendered to the approver, not just a reference to a grant object that could point
      to something else?
- [ ] Does every path that can reveal information about a resource under an access_policy/authorization
      gate — not just the primary read path, but also search, existence checks, relevance scoring, or
      indexing — enforce that same gate at query time? A secondary path that only checks it before a
      *follow-up* read can still leak a resource's existence, match strength, or matched field to a
      principal who lacks read access to the resource itself.
- [ ] When a verification step checks a value that can legitimately change over time (a signing key, a
      revocation status, a scope), does the draft state explicitly whether the check applies to the
      state as of the original event (the key that actually produced the signature) or the current
      state at verification time — and is that choice the one that actually makes the check meaningful?

### C. Attestation & Evidence Binding (if applicable)

- [ ] Does evidence cryptographically bind to a trusted, durable key — not just to session-derived
      or transport-layer material?
- [ ] Can evidence captured in one session be replayed or relayed into a different session and still
      verify successfully? If so, is that explicitly acceptable, or a gap?
- [ ] Is the claim that your binding approach is superior to an alternative checked against the
      *current* state of any related dispute, not an earlier, possibly-superseded position?
- [ ] In any multi-verifier or federated topology, is Evidence visible only to the specific verifier
      it's intended for, or does every party in the topology see it regardless of whether they're
      entitled to appraise it?
- [ ] Does the draft address "Stolen Credential Portability" — a key or credential stolen and used
      from an environment or jurisdiction it was never intended for — as distinct from ordinary theft?
- [ ] If a multi-step procedure appends and signs an artifact before every check across the whole unit
      (a transition, a batch) is known to pass, does any documented abort/reject path require un-writing
      or invalidating that already-signed, append-only entry? An abort path that assumes an
      already-completed signed write can be treated as if it never happened needs a validate-first,
      commit-last restructuring instead — signing should be the last, unconditional step once every
      check has already passed, not a step whose completion a later step can retroactively deny.

### D. Denial of Service

**Before the items below: this section isn't optional extra scrutiny — it's already the requirement.**
RFC 3552/BCP 72's status as Best Current Practice means the IETF has already decided every RFC's
Security Considerations section is expected to address these categories, DoS included. A draft silent
on DoS hasn't merely left a gap under-covered; it hasn't met a two-decade-old standing bar for what
"Security Considerations" is supposed to mean. Worth naming this plainly, because in practice DoS tends
to get treated as an operational/availability concern separate from "real" security (confidentiality,
authentication, integrity) rather than one of RFC 3552's own six co-equal categories — which may be
exactly why it's the single most consistently silent category across drafts this checklist has been
run against.

- [ ] Does the draft say anything about DoS at all? (A silent Security Considerations section on
      this category is itself a finding, per RFC 3552. Note: this is a known gap across the WIMSE
      ecosystem generally, including the reference architecture document itself — not a reason to
      skip the check, but useful context for how surprised to be by a "Silent" result here.)
- [ ] Are expensive checks (signature verification, policy evaluation) ordered *after* cheap
      structural checks (depth limits, size limits), so an attacker can't force expensive work with
      trivially malformed input?
- [ ] Even where a transport-layer secure channel (e.g., TLS) is required, is the credential still
      visible in the clear at any intermediary/middlebox hop — and if so, is capture-and-replay by
      that intermediary addressed?
- [ ] Is there a ceiling on delegation or invocation recursion depth that is enforced independent of
      any single hop's own local validity check? (An attacker who can satisfy each hop's own
      condition should still be bounded by a depth or budget ceiling — the same class already named
      in draft-rampalli-pedigree-00 and confirmed exploitable to 100,000 hops with zero rejections in
      draft-klrc-aiagent-auth-03.)
- [ ] Does every authorization/verification path require live contact with the issuing party or an
      introspection callback, or is there a path for a verifier that cannot reach the issuing side to
      reach a decision from carried, signed material alone?
- [ ] Does a failure-reporting, alerting, or recovery mechanism itself depend on the exact resource or
      capability that the failure condition it reports removes (e.g., a signed alert about the current
      inability to sign, a recovery credential issued by the system being recovered)? If so, state
      explicitly how the report is produced under that condition — a narrow, named exception to the
      otherwise-universal requirement, or an alternate unsigned/out-of-band path.
- [ ] For any threshold/quorum-based signing or decision mechanism (t-of-n), does the draft discuss the
      availability asymmetry this creates — breaking confidentiality/integrity requires compromising t
      participants, but breaking availability requires only isolating or disabling n−t+1 — especially as
      deployments choose t closer to n for stronger security?

### E. Cross-Draft Composition

- [ ] Does your mechanism assume another WIMSE-adjacent draft or spec provides a property (binding,
      revocation, narrowing) that it doesn't actually guarantee yet? Name the dependency explicitly.
- [ ] If your draft's security property could be undermined by how it composes with another draft
      (not a flaw in either alone), is that interaction named in Related Work / Security
      Considerations?
- [ ] Does the draft claim or imply your mechanism alone is sufficient for a consequential decision,
      when in practice it's one of several artifacts (identity, delegation, attestation, human
      authorization, audit) that would need to be combined? State what your mechanism does and doesn't
      cover on its own.
- [ ] If any claim from your mechanism can be copied into a different artifact type (a receipt, an
      audit record, a gateway envelope), do its binding and freshness properties travel with it, or
      can they be silently dropped in the copy? (This is the same question as "is an inherited
      property stated plainly" in section F, viewed from the composing draft's side rather than the
      source draft's side — check both directions.)
- [ ] Does the mechanism avoid claiming to increase trust or replace initial/platform provisioning
      through an exchange or delegation step alone? (Exchanging or delegating a credential should
      never produce more trust than existed at the start of the exchange.)
- [ ] If your draft extends another draft's object or schema with new fields, does the extended draft
      declare itself extensible (a named extension point, or documented unknown-field handling) — or
      is the extension unilateral and unacknowledged on the other side, which is fine today but becomes
      a real interop question the moment two independent extensions collide?

### F. Honesty About Gaps

- [ ] Every known-but-unresolved issue found during Stage 1 or Stage 2 is named explicitly in
      Security Considerations, not omitted because it isn't fixed yet.
- [ ] Every defense in the draft is checked against the assumption that the party presenting evidence
      is exactly as adversarial as any other network participant — not implicitly trusted because it's
      also the one submitting the evidence ("the presenter controls the graph").
- [ ] If your draft names a human principal as a root of authority, does it say anything about how
      that root's own authority is established and verified — or does it simply assume it?
- [ ] Does any identity- or action-binding mechanism in the draft create linkability across actions,
      sessions, deployments, or administrative boundaries that isn't stated as a Privacy Consideration?
- [ ] If the draft requires reconstructing an execution or delegation chain that spans organizational
      or trust boundaries, does it name a mechanism for composing records held by different, mutually
      untrusting parties — or does it assume a single party can always assemble the full chain?
- [ ] When a specific defense (rate-limiting, calibration/miscalibration tracking, external-signing for
      self-attestation, live re-verification) is added for one trigger or instance of a threat class, is
      it extended consistently to every other trigger or artifact of the same class already in the
      draft — or does the defense cover only the specific instance that originally prompted it?

### G. Multi-Credential / Heterogeneous Presentation (if applicable)

Relevant if your mechanism is ever presented alongside other credentials or artifacts in the same
request, rather than always verified alone.

- [ ] Is the presented set of credentials/artifacts tamper-evidently bound together (e.g., a signed
      digest over the enumerated set plus the request), so a relying party can distinguish "this
      credential was never presented" from "this credential was stripped by an on-path party"?
- [ ] If verifier determination for any credential type is dynamic/discovered rather than fixed, is
      the discovered verifier authenticated against trust anchors appropriate to its specific class,
      not merely at the transport layer?
- [ ] If any verification or decision function is delegated to a party other than the relying party,
      is that party's output itself bound to the specific request (to resist replay), and is it treated
      as an attack target in its own right?
- [ ] Does the draft explicitly prohibit collapsing an "indeterminate" verification result (e.g.,
      verifier unreachable) into "valid"? This is named as the most likely failure mode in
      multi-credential systems, and the consequences scale with the risk of the request being
      authorized.

### H. Non-HTTP & Local Transports

*New in v0.2 — a large share of current agent-to-tool traffic is local process-to-process (MCP over
stdio being the obvious case), and every mechanism above that assumes HTTP-layer signaling silently
excludes it unless the draft says otherwise.*

- [ ] Does the draft's security model (transport- or application-layer signatures, protected-resource
      metadata discovery, OAuth flows) assume HTTP end-to-end, or does it address non-HTTP/local
      transports where those mechanisms don't apply? Either scope non-HTTP transport out explicitly,
      or say what replaces the missing mechanisms.

### Contributed items

*This section grows as authors run the checklist against real drafts and add what they find. Format:
item, contributor, one-line source of the finding.*

- Out-of-band trust-anchor binding; trust-anchor lifetime vs. leaf lifetime; intermediary-visible token
  replay risk — sourced from `draft-ietf-wimse-workload-creds` (Campbell et al., WGLC-stage).
- Parent-swap and the limits of append-only delegation chains; transitive-consent default — sourced
  from `draft-rampalli-pedigree` (Rampalli), reviewed at the IETF 126 Vienna WIMSE session.
- Ephemeral vs. durable key philosophy as a stated design choice — sourced from comparing
  `draft-ritz-eca` (ephemeral, per-ceremony) against KIA-03's long-lived, hardware-anchored + FROST
  threshold approach.
- Evidence visibility restricted to the intended verifier in multi-verifier topologies — sourced from
  `draft-ritz-seat-proxies`.
- "Stolen Credential Portability" as a named threat class — sourced from
  `draft-mw-wimse-transitive-attestation`.
- AI/ML intermediary delegation requirements (autonomous vs. delegated distinction, per-hop
  re-scoping) — sourced directly from `draft-ietf-wimse-arch` §3.4.11.
- A second WG-track draft with a placeholder Security Considerations section
  (`draft-ietf-wimse-mutual-tls`) — noted as evidence this is a pattern, not a single-draft gap.
- Evidence sufficiency (no spec defines when a combination of artifacts is enough to rely on),
  "the presenter controls the graph," and human-authorization root-of-trust bootstrapping — sourced
  from `draft-schrock-ep-action-evidence-graph` and `draft-schrock-human-authorization-binding` /
  `draft-schrock-ep-authority-introduction` ([[iman-schrock]]).
- Claim portability across contexts (binding/freshness not automatically preserved when a claim is
  copied into a different artifact type) and linkability as a distinct privacy consideration — sourced
  from `draft-bu-agentproto-security-principal-binding`.
- "Credential exchange cannot increase trust" / "cannot replace initial or platform provisioning" —
  sourced from `draft-schwenkschuster-wimse-credential-exchange`.
- TLS Exporter-based session binding as a named mitigation for bearer-token replay in multi-hop
  agentic workflows — sourced from `draft-mw-oauth-tls-session-bound-tokens`.
- Credential-set tamper-evidence, verifier-misrouting, delegated-function replay risk, and
  indeterminate-collapsed-to-valid as a named failure mode — sourced from
  `draft-jiang-wimse-heterogeneous-credential` (Jiang et al., Huawei).
- Offline/asynchronous access to user-owned resources without a long-lived refresh token as an open,
  unsolved problem — sourced from Paul Carleton's WIMSE session discussion slides (not a draft).
- **[v0.2 batch] Ten items added to Sections A, B, D, F, plus new Section H — cross-checked against
  the `draft-klrc-aiagent-auth-03` (AIMS) WIMSE Call for Adoption thread, Aug 2026, rather than sourced
  from a single draft in isolation:** principal disambiguation (Songbo Bu, Chris Hood, Dmitry
  Izumskiy — 3 independent hits); time-bound-credential-vs-currently-valid (Kunal Ghosh, Thi
  Nguyen-Huu — 2 independent angles, compromise vs. posture drift); sender-constraining consistency
  and the non-HTTP/local-transport gap (Dmitry Izumskiy); signature/algorithm agility for
  long-retention artifacts (Amin Hasbini); no-prior-federation trust establishment (Chris Hood,
  morganLR); mid-execution human-in-the-loop, promoted from the Known Live Tensions narrative note
  above (Chris Hood, Dmitry Izumskiy, morganLR — 3 independent); mission/intent-injection with
  rendered-disclosure binding for human confirmation (Ariel Ravicovich, Tom Sato, Dmitry Izumskiy,
  Arun Thallapelly — 4 independent, converging over two weeks — the single most-corroborated item in
  this batch); unbounded delegation/recursion depth (Tom Sato's AIMS-03 Stage 2 test, cf.
  `draft-rampalli-pedigree-00`); verification-under-disconnection and cross-org audit composability
  (morganLR, the latter also raised independently by Karthik Rampalli and Songbo Bu).
- **[v0.3 batch] Seven items added to Sections B, C, D, E, and F, plus four new Stage 0 table rows —
  cross-checked against a 13-draft pass across the SOOS suite itself, rather than a single external
  thread:** `draft-sato-soos-gar-05`, `-idp-05`, `-kia-05`, `-hem-05`, `-mad-03`, `draft-sato-soos-dam-01`
  §7, `-grp-01` §9.4, `-rgp-01` §11, `-faip-02`, `-peer-01`, `-aop-01`, `-dist-01`, and the DAM/RGP/GRP/
  AEP cluster interdependency review. Existence-oracle / access-gate bypass at query time, found
  identically and independently in the same drafting session in both `draft-sato-soos-dam-01` §7.7 and
  `draft-sato-soos-faip-02` §3.5; validate-then-commit / phantom rollback for append-only writes, found
  independently in both `draft-sato-soos-aep-03` §9.2 and `draft-sato-soos-rgp-01` §11.3 in the same
  cluster review — the sharpest and most generalizable finding in this batch; temporal-referent
  ambiguity in verification (`draft-sato-soos-dist-01`'s Check(3), contrasted against `-rgp-01`'s own
  positive example of the same class); asymmetric mitigation coverage, now the single most-repeated
  pattern across both this batch and the earlier AIMS batch combined — five independent instances
  (`-idp-05`, `-hem-05`, `-gar-05`, `-aop-01`, `-dist-01`); self-reporting/bootstrap-paradox
  failure-reporting mechanisms (`-gar-05`'s R-3 pattern, `-kia-05`'s CONF-KIA-18/19); threshold/quorum
  availability asymmetry (`-kia-05`); unilateral cross-draft schema extension without an acknowledged
  extension point (`-aop-01` extending `-idp-05` and `-aep-02`). This pass also prompted the new
  same-revision/cross-section consistency note in Stage 1, after a Direct Conflict between two pieces
  of a draft's own text was the single most common headline finding across nearly every full-coverage
  pass run in this project so far (`-gar-05`, `-idp-05`, `-hem-05`, `-mad-03`, `-dist-01`, `-aop-01`,
  and both cluster-review findings).

### Suggested Prompt

Paste your draft's text (or the section covering one novel mechanism) along with the checklist above:

```
You are reviewing an IETF Internet-Draft for security completeness against the checklist below.
For each item, classify the draft's coverage as one of: Addressed (quote or cite the specific
normative text that covers it), Silent (the draft says nothing relevant — state this plainly,
don't infer coverage that isn't there), or Contradicted (quote the two places that disagree).
Do not assume an item is covered because it seems like good design — only mark Addressed if you can
point to actual text. Work through the checklist in order; don't skip items because they seem
unlikely to apply — mark those N/A with a one-line reason instead of omitting them.

[Paste checklist here]

[Paste draft text here]
```

Verify every "Addressed" citation actually says what the summary claims (LLM scans over-credit vague
language as coverage more often than they under-credit it), and treat every "Silent" result as real
work to do next — either write the missing text or add it to your draft's list of known open issues.


---
