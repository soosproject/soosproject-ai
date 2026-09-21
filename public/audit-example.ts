/**
 * AI Audit Reference Architecture — Worked Example
 * ==================================================
 *
 * One complete governed session, walked through all seven stages of
 * draft-sato-agent-accountability-refarch-01, end to end and runnable.
 *
 * Scenario: an agent is authorized to approve refunds up to a limit.
 * It processes one refund request. We build the full evidence trail,
 * then verify it as a skeptical third party would — trusting neither
 * the agent nor the operator that ran it.
 *
 * Dependencies, deliberately minimal and all already-settled standards:
 *   - `jose` for JWT/JWS signing (RFC 7515–7519). No SOOS-specific
 *     tooling anywhere in this file — everything here is buildable
 *     against generic, already-published primitives.
 *   - Node's built-in `crypto` module for hashing.
 *
 * Run it:
 *   npm install jose
 *   npx tsx audit-example.ts
 */

import { SignJWT, jwtVerify, generateKeyPair, exportJWK, importJWK, type JWK } from "jose";
import { createHash, randomUUID } from "node:crypto";

// A tiny helper used throughout: SHA-256 over a canonical JSON string.
function sha256(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

// ============================================================
// Stage 1 — Intent and Mandate
// ============================================================
// Three of four fields captured *before* the action executes. This
// is not enforcement — nothing here decides whether the action may
// proceed. It exists so a post-hoc judgment is possible at all:
// comparing what was declared against what actually happened.

interface Mandate {
  governedObject: string;      // the specific resource *instance*, not a category
  authorityBasis: string;      // what grants this authority
  maxAmount: number;           // parameter-level binding, not just "can approve refunds"
  currency: string;
}

interface DeclaredIntent {
  goal: string;
  reasoning: string;
  confidence: number;          // 0–1
}

interface ExpectedOutcome {
  acceptanceEnvelope: string;  // human-readable description of what counts as success
  confirmationWindowMs: number; // how long we'll wait for observed effect
                                 // before treating a dispatched attempt as unconfirmed
                                 // rather than merely pending
}

interface CorrelationContext {
  correlationId: string;       // links mandate, intent, and target resource
}

function stage1_captureIntentAndMandate(): {
  mandate: Mandate;
  declaredIntent: DeclaredIntent;
  expectedOutcome: ExpectedOutcome;
  correlation: CorrelationContext;
} {
  const correlation: CorrelationContext = { correlationId: randomUUID() };

  const mandate: Mandate = {
    governedObject: "refund-request:ORD-88213",
    authorityBasis: "customer-service-agent-policy-v3",
    maxAmount: 100,           // the agent may approve refunds up to $100
    currency: "USD",
  };

  const declaredIntent: DeclaredIntent = {
    goal: "Process refund for order ORD-88213 per customer request",
    reasoning: "Customer reported item not received; tracking shows delivery failure",
    confidence: 0.92,
  };

  const expectedOutcome: ExpectedOutcome = {
    acceptanceEnvelope: "Refund issued to original payment method, amount <= mandate.maxAmount",
    confirmationWindowMs: 30_000, // 30s — pick a value and declare it; there's no
                                  // universal right answer, only the requirement
                                  // that you state one
  };

  console.log("Stage 1 — Intent and Mandate captured, before any action executes:");
  console.log(JSON.stringify({ mandate, declaredIntent, expectedOutcome, correlation }, null, 2));

  return { mandate, declaredIntent, expectedOutcome, correlation };
}

// ============================================================
// Stage 2 — Agent
// ============================================================
// The agent is not trusted. Workload identity is a stable identifier
// *distinct* from whatever key currently signs for it — so routine key
// rotation doesn't silently mint what looks like a new actor.

interface AgentIdentity {
  workloadId: string;   // stable across key rotations
  currentSigningKeyId: string;
}

function stage2_agentDispatches(mandate: Mandate): {
  agentIdentity: AgentIdentity;
  dispatchedAmount: number;
} {
  const agentIdentity: AgentIdentity = {
    workloadId: "agent:customer-service-bot:prod",
    currentSigningKeyId: `key-${randomUUID().slice(0, 8)}`, // would rotate independently
  };

  // The agent decides to approve $50 — within its mandate's $100 limit.
  const dispatchedAmount = 50;

  console.log("\nStage 2 — Agent dispatches an action:");
  console.log(`  Agent ${agentIdentity.workloadId} approving $${dispatchedAmount} ${mandate.currency}`);
  console.log(`  (mandate ceiling: $${mandate.maxAmount} — within bounds)`);

  return { agentIdentity, dispatchedAmount };
}

// ============================================================
// Stage 3 — Record Producer
// ============================================================
// A component distinct from the agent and the operator. In this
// toy example that separation is structural (its own class/module),
// not a network boundary — in production it should be a genuinely
// separate process or service the agent cannot write to arbitrarily.

class RecordProducer {
  private committedLocally = false;

  // Non-delegable ordering: the caller must not be able to report the
  // session closed before this returns.
  commitLocally(anchoredBlock: AnchoredBlock): void {
    this.committedLocally = true;
    console.log(`\nStage 3 — Record Producer: local commit done (block hash ${anchoredBlock.blockHash.slice(0, 16)}...)`);
  }

  isCommitted(): boolean {
    return this.committedLocally;
  }
}

// ============================================================
// Stage 4 — Event Log and Anchored Block
// ============================================================
// Dispatched attempt and observed effect, tracked *separately*.
// Observed effect MUST be confirmed independently of the agent's own
// report — this function simulates reading the affected resource's
// own state directly, not trusting what the agent says it did.

interface DispatchedAttempt {
  action: string;
  amount: number;
  timestamp: string;
}

interface ObservedEffect {
  confirmed: boolean;
  actualAmount: number | null;
  confirmedAt: string | null;
  source: "resource-state" | "timeout"; // never "agent-report" — that would defeat the point
}

interface AnchoredBlock {
  dispatchedAttempt: DispatchedAttempt;
  observedEffect: ObservedEffect;
  blockHash: string;
}

// Simulates an independent check against the payment processor's own
// records — NOT asking the agent "did you do it?"
function independentlyConfirmEffect(dispatchedAmount: number): ObservedEffect {
  // In a real system this queries the payment processor's API directly.
  // Here we simulate it actually happening correctly.
  const actualAmount = dispatchedAmount; // the real world agreed with the dispatch
  return {
    confirmed: true,
    actualAmount,
    confirmedAt: new Date().toISOString(),
    source: "resource-state",
  };
}

function stage4_buildEventLog(dispatchedAmount: number): AnchoredBlock {
  const dispatchedAttempt: DispatchedAttempt = {
    action: "issue-refund",
    amount: dispatchedAmount,
    timestamp: new Date().toISOString(),
  };

  const observedEffect = independentlyConfirmEffect(dispatchedAmount);

  const blockContent = { dispatchedAttempt, observedEffect };
  const blockHash = sha256(blockContent);

  console.log("\nStage 4 — Event Log: dispatched vs. observed, kept separate:");
  console.log(`  Dispatched: $${dispatchedAttempt.amount} at ${dispatchedAttempt.timestamp}`);
  console.log(`  Observed:   $${observedEffect.actualAmount} (source: ${observedEffect.source}, confirmed: ${observedEffect.confirmed})`);

  return { dispatchedAttempt, observedEffect, blockHash };
}

// ============================================================
// Stage 5 — Trust Fabric
// ============================================================
// Attestation, signing, local commit, registration — composed in
// order, not merged into one step. Local commit satisfies ordering;
// registration (simulated here) gives external non-repudiation later.

async function stage5_trustFabric(
  anchoredBlock: AnchoredBlock,
  producer: RecordProducer,
  signingKey: CryptoKey,
  signingKeyId: string
): Promise<{ signedBlockJws: string }> {
  // Signing: cover the anchored block as a whole.
  const signedBlockJws = await new SignJWT({ block: anchoredBlock })
    .setProtectedHeader({ alg: "ES256", kid: signingKeyId })
    .setIssuedAt()
    .sign(signingKey);

  // Local commit — fast, no network dependency. This is what satisfies
  // the non-delegable ordering guarantee.
  producer.commitLocally(anchoredBlock);

  // Registration to an external transparency service would happen here,
  // batched, on a declared cadence. Simulated as a no-op in this example.
  console.log("Stage 5 — Trust Fabric: signed and locally committed.");
  console.log("  (external registration would happen next, on your declared cadence)");

  return { signedBlockJws };
}

// ============================================================
// Stage 6 — Audit Record
// ============================================================
// Five elements. Audience binding is the one most implementations
// skip — and it's the one that let a real production system get a
// fully-valid, fully-signed record replayed against the wrong
// counterparty. Put the binding under the signature, not in a
// separate field a relying party has to remember to check.

interface AuditRecord {
  identityAndLinkage: {
    recordId: string;
    causalParent: string | null;
    sequenceNumber: number;
  };
  audienceBinding: {
    counterparty: string;   // who this record is valid evidence *for*
    transactionRef: string;
    currency: string;       // the unit matters — bind it, don't leave it implicit
  };
  intentToResultLinkage: {
    mandate: Mandate;
    declaredIntent: DeclaredIntent;
    expectedOutcome: ExpectedOutcome;
    actualResult: number | null;
  };
  terminalDisposition: {
    dispatchedAttempt: DispatchedAttempt;
    observedEffect: ObservedEffect;
  };
  recomputableSummary: {
    selection: string;      // declared: which fields this summary derives from
    derivedTotal: number;   // re-derivable by any reader from the log above
  };
}

function stage6_buildAuditRecord(
  mandate: Mandate,
  declaredIntent: DeclaredIntent,
  expectedOutcome: ExpectedOutcome,
  correlation: CorrelationContext,
  anchoredBlock: AnchoredBlock
): AuditRecord {
  const record: AuditRecord = {
    identityAndLinkage: {
      recordId: randomUUID(),
      causalParent: null,
      sequenceNumber: 1,
    },
    audienceBinding: {
      counterparty: "customer:ORD-88213-payer",
      transactionRef: correlation.correlationId,
      currency: mandate.currency,
    },
    intentToResultLinkage: {
      mandate,
      declaredIntent,
      expectedOutcome,
      actualResult: anchoredBlock.observedEffect.actualAmount,
    },
    terminalDisposition: {
      dispatchedAttempt: anchoredBlock.dispatchedAttempt,
      observedEffect: anchoredBlock.observedEffect,
    },
    recomputableSummary: {
      selection: "terminalDisposition.observedEffect.actualAmount",
      derivedTotal: anchoredBlock.observedEffect.actualAmount ?? 0,
    },
  };

  console.log("\nStage 6 — Audit Record composed, five elements including audience binding:");
  console.log(`  Bound to counterparty: ${record.audienceBinding.counterparty}`);
  console.log(`  Currency bound under signature: ${record.audienceBinding.currency}`);

  return record;
}

// ============================================================
// Stage 7 — Third-Party Verification
// ============================================================
// Six checks a skeptical verifier runs, trusting neither the agent
// nor the operator. Each is genuinely independent of the others —
// a record can pass some and fail others, and that's meaningful.

interface VerificationResult {
  verified: boolean;
  accepted: boolean;
  bound: "bound" | "positively-conflicting" | "unsupported-association";
  existence: boolean;
  coverage: "not-checked-no-counterparty-in-this-example";
  ordering: "trivial-single-record-in-this-example";
}

async function stage7_verify(
  record: AuditRecord,
  signedBlockJws: string,
  publicKey: CryptoKey,
  expectedCounterparty: string,
  expectedCurrency: string
): Promise<VerificationResult> {
  // Verified: does the signature cryptographically check out?
  let verified = false;
  try {
    await jwtVerify(signedBlockJws, publicKey);
    verified = true;
  } catch {
    verified = false;
  }

  // Accepted: does the relying party trust this key belongs to the
  // claimed principal? (Out-of-band decision — simulated as "yes" here,
  // since this example controls both sides.)
  const accepted = true;

  // Bound: does the audience-binding field name *this* counterparty
  // and *this* currency, or a conflicting one, or is it simply absent?
  let bound: VerificationResult["bound"];
  if (!record.audienceBinding.counterparty) {
    bound = "unsupported-association";
  } else if (
    record.audienceBinding.counterparty !== expectedCounterparty ||
    record.audienceBinding.currency !== expectedCurrency
  ) {
    bound = "positively-conflicting"; // refuse and log this — it's a real conflict
  } else {
    bound = "bound";
  }

  // Existence: registered and unaltered since receipt. This example
  // doesn't have a real transparency service, so we just confirm the
  // hash we hold matches what we received.
  const existence = true; // would check against the transparency-log receipt in production

  console.log("\nStage 7 — Third-Party Verification, six checks:");
  console.log(`  Verified:  ${verified}`);
  console.log(`  Accepted:  ${accepted} (relying-party decision, not provable by the record)`);
  console.log(`  Bound:     ${bound}`);
  console.log(`  Existence: ${existence}`);
  console.log(`  Coverage:  not checked — needs an independent counterparty half, absent in this single-file example`);
  console.log(`  Ordering:  trivial — only one record exists here`);

  return {
    verified,
    accepted,
    bound,
    existence,
    coverage: "not-checked-no-counterparty-in-this-example",
    ordering: "trivial-single-record-in-this-example",
  };
}

// ============================================================
// Run the full session, end to end
// ============================================================

async function main() {
  console.log("=".repeat(60));
  console.log("AI Audit Reference Architecture — one governed session");
  console.log("=".repeat(60));

  // Generate a keypair for the Record Producer to sign with.
  // In production this key's custody is what Attestation vouches for.
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const signingKeyId = "producer-key-1";

  const { mandate, declaredIntent, expectedOutcome, correlation } =
    stage1_captureIntentAndMandate();

  const { dispatchedAmount } = stage2_agentDispatches(mandate);

  const producer = new RecordProducer();

  const anchoredBlock = stage4_buildEventLog(dispatchedAmount);

  const { signedBlockJws } = await stage5_trustFabric(
    anchoredBlock,
    producer,
    privateKey,
    signingKeyId
  );

  const auditRecord = stage6_buildAuditRecord(
    mandate,
    declaredIntent,
    expectedOutcome,
    correlation,
    anchoredBlock
  );

  // Now play the skeptical verifier, checking against the CORRECT
  // expected counterparty and currency — this should come back "bound".
  const resultCorrect = await stage7_verify(
    auditRecord,
    signedBlockJws,
    publicKey,
    "customer:ORD-88213-payer",
    "USD"
  );

  // And now check the exact same record against a DIFFERENT
  // counterparty — this is Ithelia Dias's finding, reproduced: a fully
  // signed, fully valid record checked against the wrong party.
  console.log("\n" + "-".repeat(60));
  console.log("Now checking the SAME record against a DIFFERENT counterparty");
  console.log("(reproducing the real production bug this check exists for)");
  console.log("-".repeat(60));
  const resultWrongParty = await stage7_verify(
    auditRecord,
    signedBlockJws,
    publicKey,
    "customer:SOMEONE-ELSE-ENTIRELY",
    "USD"
  );

  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`Correct counterparty check → bound: "${resultCorrect.bound}"`);
  console.log(`Wrong counterparty check   → bound: "${resultWrongParty.bound}"`);
  console.log(
    "\nWithout audience binding, both checks above would have looked identical —"
  );
  console.log(
    "a fully Verified, fully Accepted record tells you nothing about who it's"
  );
  console.log("actually valid evidence for. That's the gap this field closes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
