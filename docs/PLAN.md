# 6-Step Implementation Plan

Updated roadmap for Pasture Reputation Protocol — baseline tracking, portable identity, and domain-specific reputation layered on the existing two-lane structure.

## Step 1: Foundation & Onboarding

**Status:** Implemented (with identity extension)

| Feature | Status |
|---------|--------|
| Wallet connect + creator registration | Done |
| Staking hooks (Base) | Done |
| Dashboard shell | Done |
| **Agent Identity keypair + DID on creator registration** | Done |

On creator registration the system generates an Ed25519 keypair and `did:key:…` identifier. The private key is encrypted at rest; the public key and DID are stored on the `Creator` record for future portability.

## Step 2: Agent Bundle Management

**Status:** Implemented (with DID + manifest + domains)

| Feature | Status |
|---------|--------|
| Bundle hash + version tracking | Done |
| **Unique Agent DID at creation** | Done (`did:rep:agent:…`) |
| **Version manifest (structured JSON)** | Done |
| **Domain tags at submission** | Done (`coding`, `research`, `automation`, `customer-support`) |

## Step 3: Practice Lane

**Status:** Implemented (baseline tracking)

| Feature | Status |
|---------|--------|
| Practice runs with full feedback | Done |
| Lane limits (40 / 90 days) | Done |
| **Per-run metrics (success, latency, cost, errors)** | Done (`runMetrics`) |
| **Rolling baseline profile on agent** | Done (`baselineProfile`) |

Practice runs update the agent's historical baseline but do not affect public reputation.

## Step 3.5: Behavior Logging

**Status:** Implemented (with domain + signed summary)

| Feature | Status |
|---------|--------|
| Sequence-ordered behavior logs | Done |
| Audit hash + run hash | Done |
| **Domain context on audits** | Done |
| **Signed behavior summary per run** | Done |

## Step 4: Certification Lane

**Status:** Implemented (baseline comparison + portable cert)

| Feature | Status |
|---------|--------|
| Commitment gate + minimal feedback | Done |
| Public failure records | Done |
| **Compare vs agent's own baseline** | Done (`baselineDeviation`) |
| **Deviation metrics in results** | Done |
| **Signed reputation certificate** | Done (`reputationCertificate`) |

## Step 5: Reputation System

**Status:** Implemented (core); on-chain anchoring pending

| Feature | Status |
|---------|--------|
| **Performance Score** | Done |
| **Behavioral Consistency Score** | Done |
| Confidence score | Done (existing) |
| **Domain-specific reputation** | Done (`domainScores`) |
| **Portable signed reputation object** | Done — `GET /api/agents/[id]/reputation` |
| **Faster decay on negative deviation** | Done (`applyDeviationAdjustedDecay`) |
| On-chain reputation hash | Planned |

### Score formula (v1)

```
publicScore = decay(performance × 0.55 + confidence × 0.20 + consistency × 0.25)
```

Negative baseline deviation applies an additional penalty factor on top of time-based decay.

## Step 6: Polish & Testing

**Status:** Partial

| Feature | Status |
|---------|--------|
| Abuse testing (baseline gaming, model-switching) | Planned |
| Portability export/import mock platform test | Planned |
| External SDK / verification docs | Planned (`verifyPayload` in `src/lib/crypto/signing.ts`) |

## Portable reputation API

External platforms can fetch a verifiable reputation object:

```
GET /api/agents/:id/reputation
```

Response includes `reputation` (payload), `signature` (Ed25519), `certHash`, `domainTags`, and `domainScores`.

## Key files

| Area | Path |
|------|------|
| Schema | `prisma/schema.prisma` |
| Identity / DID | `src/lib/crypto/identity.ts` |
| Protocol signing | `src/lib/crypto/signing.ts` |
| Baseline + deviation | `src/lib/reputation/baseline.ts` |
| Scores + portable objects | `src/lib/reputation/scores.ts` |
| Evaluation finalization | `src/lib/evaluations/finalize.ts` |
| Reputation export API | `src/app/api/agents/[id]/reputation/route.ts` |

## Env vars

| Variable | Purpose |
|----------|---------|
| `PROTOCOL_SIGNING_PRIVATE_KEY` | PEM Ed25519 key for signing behavior summaries and reputation objects (prod) |
| `SECRETS_ENCRYPTION_KEY` | Encrypts creator identity keys + API secrets; dev signing key derived from this if `PROTOCOL_SIGNING_PRIVATE_KEY` unset |

## Migration note

After pulling these changes, run:

```bash
npx prisma db push
```

Existing creators re-registering will receive a backfilled identity DID. Existing agents without `agentDid` need re-submission or a one-off backfill script.
