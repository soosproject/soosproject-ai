---
title: Security Review — SOOS Project
meta-description: A four-part security review process for IETF Internet-Drafts — built for SOOS, sharpened on a live WIMSE Working Group thread, free for anyone to use.
---

# WIMSE Security Review

Every SOOS draft goes through the same process before we call a revision done: a structured,
four-part security review built specifically for IETF Internet-Drafts. It grew out of reviewing our
own 21-draft suite, and it's been sharpened further by running it against work outside SOOS entirely —
most recently a live WIMSE Working Group Call for Adoption thread.

This page explains what it is and why it exists. The process and the living checklist themselves are
on the next page.

[Read the process (v0.3)](/security/wimse)

---

## Why we built this

A standard security pass over an IETF draft is one read: check the text against RFC 3552's six
categories, look for the obvious holes. That catches a lot. It's also structurally blind to a few
specific things:

- **A genuinely new mechanism has no existing checklist entry to catch it against.** A checklist built
  from patterns already seen can't catch a pattern nobody's named yet.
- **A normative reference's own obligations get missed**, because nobody treats the reference as
  load-bearing until something breaks against it.
- **Two sections of the same draft — sometimes both new in the same revision — quietly contradict each
  other**, and neither one reads as wrong in isolation.
- **A described mechanism doesn't actually behave the way the text says it does**, and nobody finds out
  until an implementer builds it.

We kept hitting all four while reviewing our own drafts, so the process has four matching parts: a
reference-obligation pass that runs before a single mechanism is even named, a base-spec lens that
checks a mechanism against what it inherits rather than against what a checklist happens to list, a
structural checklist grown from real findings across dozens of drafts, and a self-testing stage that
builds small, adversarial sample code and actually runs it.

Across every full-coverage pass run so far, the single most common *headline* finding hasn't been an
exotic vulnerability — it's been two pieces of a draft's own text that can't both be true, caught only
because something was deliberately checked against something else instead of read in isolation. That's
the finding a five-minute skim misses almost every time.

The process has also been tested outside SOOS: run against a live WIMSE Working Group Call for
Adoption thread (`draft-klrc-aiagent-auth`, AIMS), it independently surfaced two base-spec-level gaps —
a missing actor-chain attribution claim and underspecified access-token claim semantics — that other
reviewers on the list also found, independently, by hand. That convergence is exactly the kind of
signal that tells us a checklist item is real, not a false positive.

---

## Why it's part of SOOS

SOOS is standards infrastructure for making agentic AI accountable — intent declarations, delegation
chains, audit records, human escalation. Checking whether the standards that govern agents are
themselves sound is the same kind of work, one layer up. We built this because we needed it for our
own drafts, not because we set out to publish a methodology.

It's here, in public, because everything else on this site follows the same rule: publish what we
build, and let anyone use it. The process itself isn't SOOS-specific — it's a plain checklist and a
plain method, aimed at any IETF Internet-Draft that defines a security-relevant mechanism.

---

## How to use it

The process page has everything needed to actually run it, including ready-to-paste prompts for every
stage:

1. **Step 0 — Reference Inventory.** Pull every normative reference before naming a single mechanism,
   and check each one's own obligations.
2. **Stage 0 — Base-Spec Lens.** For each mechanism your draft defines, name its base RFC and check
   the draft against *that spec's own* obligations directly, not against a generic checklist.
3. **Part 3 — the checklist.** A living list of concrete, gradable items, organized by category, grown
   from real findings across every draft it's been run against.
4. **Stage 1 — LLM-assisted scan.** A structured pass against the RFC 3552 taxonomy and known CVE/CWE
   classes, aimed specifically at whatever Step 0, Stage 0, or the checklist left open.
5. **Stage 2 — self-testing.** Small sample code and adversarial scenarios, run for real against that
   code, not just reasoned about from the text.
6. **Reporting findings.** A three-tier format — recommendation, background, detailed reasoning — so a
   finding is readable in one sentence and verifiable in full, without forcing every reader through
   both.

Start with the checklist even if nothing else. It's the fastest, cheapest part of the process, and
it's what tells you where the rest of the process actually needs to point.

---

## Where this stands

This is a working document, not a finished standard. It grows every time it finds something new — the
current checklist items and base-spec table rows are attributed to the specific drafts and reviewers
that surfaced them, on purpose, so the provenance stays visible rather than getting smoothed away.
Sections marked as open questions are genuinely open; we'd rather say so than imply coverage we don't
have.

Comments, corrections, and contributed findings are welcome — on the WIMSE mailing list, or directly
against [the SOOS repository](https://github.com/soosproject).
