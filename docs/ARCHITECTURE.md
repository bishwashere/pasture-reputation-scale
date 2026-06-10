# Architecture

Reputation Protocol uses a **split architecture** for security and reliability. Agent code never runs on Vercel.

## System diagram

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL — Next.js (Coordinator)                             │
│  • Website + Dashboard UI                                   │
│  • Light API routes (CRUD, auth, validation)                │
│  • Creates evaluation record → dispatches job               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / QStash
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  VPS / Railway / Fly.io — Evaluation Worker                 │
│  • Node.js service (services/evaluation-worker)             │
│  • Receives job → spins Docker container → logs behavior    │
│  • Calls creator's LLM endpoint via isolated proxy          │
│  • Writes results + audit trail to Postgres                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ docker run (per job)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker — Agent Runner (ephemeral, one container per run)   │
│  • Read-only filesystem, memory/CPU limits                  │
│  • Probes creator endpoint, returns JSON result             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ Postgres         │  │ Base (EVM)       │
│ Supabase / Neon  │  │ Staking + events │
└──────────────────┘  └──────────────────┘
```

## Evaluation flow

1. User clicks **Run Practice** or **Run Certification** in the dashboard
2. **Next.js** validates lane limits, creates `Evaluation` row (`QUEUED`), dispatches to worker
3. **Evaluation Worker** picks up job, marks `RUNNING`
4. Worker runs `docker run rep-protocol/agent-runner` with job payload
5. **Agent Runner container** calls the creator's LLM endpoint, logs all interactions
6. Worker persists behavior logs, audit hash, scores → Postgres
7. User refreshes agent page to see results

## Deployment map

| Part | Technology | Where | Purpose |
|------|-----------|-------|---------|
| Website + Dashboard | Next.js + TypeScript | **Vercel** | User interface |
| Light API | Next.js Route Handlers | **Vercel** | CRUD, validation, job dispatch |
| Heavy Evaluation | Node.js + Docker | **Railway / Fly.io / VPS** | Run agents safely |
| Database | PostgreSQL | **Supabase / Neon** | Profiles, results, audits |
| Blockchain | Base (EVM) | On-chain | Staking & creator events |

## Why the split matters

- **Vercel is serverless** — no persistent Docker, no long-running agent processes
- **Agent endpoints are untrusted** — isolation prevents SSRF and code execution on your infra
- **Behavior logging requires a controlled environment** — worker + container per run
- **Same pattern as Cursor, Replit, LangChain sandboxes** — coordinator + worker

## Local development

```bash
# Terminal 1 — infrastructure
docker compose up -d          # Postgres + Evaluation Worker
npm run docker:build-runner   # Build agent-runner image

# Terminal 2 — Next.js coordinator
cp .env.example .env
npm run dev
```

Set in `.env`:
- `EVALUATION_WORKER_URL=http://localhost:8080`
- `WORKER_SECRET=dev-worker-secret`

## Production

1. Deploy Next.js to **Vercel** with `EVALUATION_WORKER_URL` pointing to your worker
2. Deploy **Evaluation Worker** to Railway/Fly/VPS with:
   - `DATABASE_URL` (same Neon/Supabase as Vercel)
   - `SECRETS_ENCRYPTION_KEY` (same as Vercel)
   - `DOCKER_ENABLED=true` + Docker socket access
   - `WORKER_SECRET` (shared with Vercel)
3. Optionally use **QStash** so Vercel dispatches jobs asynchronously with retries
