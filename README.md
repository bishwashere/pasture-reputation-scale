# Reputation Protocol

Independent, trustworthy evaluation for AI agents — hard to fake, costly to maintain.

## Architecture (split deployment)

| Layer | Runs on | Role |
|-------|---------|------|
| **Next.js** | Vercel | UI + light API + job coordinator |
| **Evaluation Worker** | Railway / Fly.io / VPS | Docker orchestration + agent execution |
| **Agent Runner** | Ephemeral Docker container | Isolated probe of creator's LLM endpoint |
| **PostgreSQL** | Supabase / Neon | Data + audit logs |
| **Base** | On-chain | Staking & creator events |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full flow diagram.

## Quick start (local)

```bash
# 1. Infrastructure
docker compose up -d
npm run docker:build-runner

# 2. Database
cp .env.example .env
npm install
npx prisma migrate dev --name init

# 3. Coordinator (Next.js)
npm run dev

# Worker runs via docker-compose on :8080
# Next.js dispatches jobs to EVALUATION_WORKER_URL
```

## Key env vars

| Variable | Set on | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Vercel + Worker | Postgres connection |
| `EVALUATION_WORKER_URL` | Vercel | Worker base URL |
| `WORKER_SECRET` | Vercel + Worker | Auth between coordinator and worker |
| `SECRETS_ENCRYPTION_KEY` | Vercel + Worker | Encrypt creator API keys |
| `DOCKER_ENABLED` | Worker only | Spin up agent-runner containers |
| `QSTASH_TOKEN` | Vercel | Async job dispatch in production |

## Project structure

```
src/                          # Next.js coordinator (Vercel)
services/evaluation-worker/   # Heavy evaluation service (VPS/Railway)
docker/agent-runner/          # Ephemeral container image per run
prisma/                       # Shared database schema
contracts/                    # Base EVM staking contracts
```

## Evaluation lanes

| Lane | Cost | Limit (90 days) | Runs on |
|------|------|-----------------|---------|
| Practice | $6/run | 40 | Evaluation Worker + Docker |
| Certification | — | 2 | Evaluation Worker + Docker |

**Vercel never executes agent code.**
