---
title: Getting Started — AI Audit Reference Architecture
description: A worked example in TypeScript for building your first implementation, and a gap-check against real production failures if you already have one.
---

# Getting Started

This page has two entirely different jobs, for two different readers.
Pick the one that's actually you — there's no need to read both.

**New to this?** [Start with the worked example](#starting-from-zero) —
a complete, runnable session in TypeScript, walked through stage by
stage.

**Already have an audit or signing system in production?**
[Jump to the gap-check](#already-implementing-a-gap-check) — a set of
specific questions, each grounded in a real failure someone else's
system actually had.

Neither replaces the [technical overview](/audit/reference-architecture),
which is where the full reasoning behind every stage lives. This page
is about getting moving, not about re-explaining the architecture.

---

## Starting from zero

The fastest way into this is one complete, working example: one agent,
one governed action, all seven stages, actually signing and verifying
real data rather than illustrating with placeholders.

### What you need

Two dependencies, both already-settled standards — nothing specific to
any one company's stack:

- [`jose`](https://github.com/panva/jose) for JWT/JWS signing (the
  actual IETF-standard format — RFC 7515 through 7519)
- Node's built-in `crypto` module for hashing

```bash
npm install jose
npx tsx audit-example.ts
```

**[Download the full example →](/audit-example.ts)**

### Walking through it

The example approves a $50 refund against a $100 mandate, then
verifies the resulting record twice — once correctly, once against the
wrong counterparty — to show concretely why one specific field matters
more than it looks like it should.

**Stage 1 captures three things before anything executes**: a mandate
bound to a specific resource instance and a maximum amount (not just
"can approve refunds" — a checkable ceiling), a declared intent with
the agent's own stated reasoning, and an expected outcome that
declares a confirmation window — how long you're willing to wait for
confirmation before treating a dispatched action as stalled rather
than merely pending.

```typescript
const mandate: Mandate = {
  governedObject: "refund-request:ORD-88213",
  authorityBasis: "customer-service-agent-policy-v3",
  maxAmount: 100,
  currency: "USD",
};
```

None of this is enforcement — nothing here decides whether the action
is allowed to proceed. It exists so a judgment can be made afterward:
comparing what was declared against what actually happened.

**Stage 4 is where the architecture actually earns its keep.** The
dispatched attempt and the observed effect are tracked as two separate
facts, and the observed effect comes from an independent check — in
the real world, reading the payment processor's own state — not from
asking the agent "did you do it?":

```typescript
function independentlyConfirmEffect(dispatchedAmount: number): ObservedEffect {
  // In production this queries the payment processor's own API.
  // It never asks the agent to report on itself.
  ...
}
```

This is the direct, concrete answer to the failure mode that motivated
this whole architecture: an agent that can lie about what it did has
nowhere to hide that lie if the confirmation never consults the agent
in the first place.

**Stage 6's audience binding is the part most first implementations
skip, and it's worth not skipping.** The example runs the exact same
signed, fully-verified record through third-party verification twice —
once against the correct counterparty, once against a different one:

```
Correct counterparty check → bound: "bound"
Wrong counterparty check   → bound: "positively-conflicting"
```

`Verified` and `Accepted` come back identical both times. Only `Bound`
changes. Without this field, a signature tells you the record wasn't
tampered with — it tells you nothing about who it's actually valid
evidence *for*. That gap is exactly what a real production payment
system hit before this field existed in the architecture.

### What this example is not

This is a teaching example, sized to be read in one sitting — not
something to deploy. Registration to a transparency service is a
comment, not a real network call. Coverage isn't actually checked,
since that genuinely needs a second, independent party, which one file
can't provide. Delegation and the cross-principal branch aren't shown
at all. Treat this as the shape of stage one through seven, not as
production infrastructure.

---

## Already implementing? A gap-check

If you already have something running, a tutorial isn't useful to you
— what's useful is knowing specifically where other people's systems
turned out to have gaps, so you can check your own against the same
list. Every item below traces to a real, specific failure, not a
generic best practice.

### Record content and binding

**Does your signed record name the specific counterparty or
transaction it's valid evidence for, under the signature?** A fully
valid, fully signed record with no audience binding can be replayed
against the wrong party, and nothing about the signature itself will
catch it. This is not hypothetical — it's a bug a real production
payment-authorization system had, discovered only once someone asked
the question directly.

**If your record carries a numeric value, is its unit or currency
bound under the signature too?** The same production system separately
found that an unbound amount doesn't distinguish 50 USD from 50 JPY —
the record is silent on the unit, and a relying party has to assume it
correctly, not verify it.

**Is full conversational content — prompts, human approvals — stored
separately from your tamper-evident chain, referenced only by hash?**
If it's embedded directly in the signed record, satisfying a future
erasure request means altering something you need to stay unaltered.
Keeping the two separate is what lets you delete the content later
without breaking the record that something happened.

### Timing and liveness

**Do you have a declared window after which a dispatched-but-unconfirmed
action is treated as stalled, rather than indefinitely pending?**
Without one, "still running" and "silently stuck" produce identical
records forever. One real deployment, evaluated systematically, found
over a hundred admitted work flows with zero completions and no
errors, timeouts, or refusals recorded anywhere — nothing was wrong by
the letter of its own logging, and nothing had actually finished
either.

**Does your "observed effect" actually come from reading the affected
resource's own state, or does any part of it rely on the agent's own
report of what it did?** If the agent is in the loop for confirming
its own action, you've rebuilt the exact self-witnessing problem this
architecture exists to remove.

### Producer resilience

**Have you decided, and documented, what happens when your record
producer — or wherever it registers to — is unreachable?** Fail-open,
fail-closed, or buffer are all legitimate choices. Leaving it
undecided isn't a neutral default; it's usually fail-open by accident,
which is the choice most likely to leave a gap nobody notices.

**If you detect an internal inconsistency, does it immediately and
unsuppressibly alert someone positioned to intervene — or does it get
logged somewhere?** The Hugging Face incident that motivated this
whole architecture had exactly this gap: a log message essentially
describing the problem already existed, and nothing required anyone to
act on it. A self-audit mechanism that only logs is functionally the
same as not having one.

### Coverage and gap detection

**Have you explicitly declared which record types your system commits
to producing at all?** Without that declaration, a missing record for
something you never promised to record looks identical to a genuinely
suppressed one — and treating every gap as suspicious the moment you
haven't defined your own scope makes the whole check unusable.

**If you use sequence numbers to detect gaps, are authorization-stage
and execution-stage records counted on separate sequences?** A refusal
has no downstream execution record by design. Share one counter across
both record types and every legitimate refusal reads as a missing
execution — a real, specific failure mode in exactly this kind of
sequence-based design.

**Can your system tell the difference between a record stream that
paused briefly and one that's genuinely stopped?** A transient gap — a
higher sequence number already seen, a lower one still in flight — is
a normal concurrent-session artifact, not suppression. Only a gap that
survives a real observation window should be treated as evidence of
anything.

### Isolation and observer integrity

**If your agent runtime were compromised at the container or process
level, could it reach and corrupt the component that observes or signs
its actions?** This is the actual mechanism behind the Hugging Face
incident: agents didn't just misreport what they did, they escaped
their own isolation and altered what fed into the observation itself.
Container-level isolation alone doesn't defend against this — if you
need real resistance, you need attestation of the observing
environment's own integrity, ideally hardware-rooted, not just
process-level separation. State whatever isolation strength you're
actually relying on explicitly, rather than leaving it an unexamined
assumption.

### What nobody has a clean answer for yet

Two things are worth checking your own system against, honestly,
rather than assuming they're solved: whether your gap-detection can
tell a stream that simply stopped from one that's still healthy (most
sequence-based approaches can't, without an independent time anchor
this architecture doesn't yet specify), and whether an evidence
requirement in your system could be satisfied by the cheapest artifact
that technically passes it, without the underlying work actually
happening. Neither has a settled answer in the current architecture —
if you've solved either one, that's worth raising on the AUDIT mailing
list, not something to assume someone else has already handled.

---

## For the normative version

Everything above is written to get you moving, not to be precise about
every edge case. Where this guide and the
[Internet-Draft](https://datatracker.ietf.org/doc/draft-sato-agent-accountability-refarch/)
disagree on a detail, the Internet-Draft is authoritative — it's the
one written in `MUST`/`MUST NOT` language and reviewed against that
standard.

---

*Last updated 21 September 2026. Written by Tom Sato. This page is hosted alongside the SOOS project's own IETF drafts for practical reasons, but the architecture itself is independent — it does not depend on SOOS, and using it does not require adopting anything else from this site. [Contact the author](https://www.linkedin.com/in/tomsato/) for more information.*
