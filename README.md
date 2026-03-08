# oho.chat Clone

Omnichannel chat aggregation platform.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + React 19 + Turbopack |
| API | tRPC 11 (type-safe, end-to-end) |
| Database | PostgreSQL 16 + Prisma |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Styling | Tailwind CSS v4 |
| State | Zustand + TanStack Query |
| Monorepo | Bun + Turborepo |
| Code Quality | Biome (lint + format) |

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy environment config
cp .env.example .env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 4. Push database schema
bun run db:push

# 5. Seed database (optional)
bun run db:seed

# 6. Start dev server
bun run dev
```

App runs at **http://localhost:3000**

## Project Structure

```
oho-clone/
├── apps/web/              # Next.js frontend + API routes
│   ├── src/app/           # App Router pages
│   ├── src/components/    # React components
│   ├── src/lib/           # Utilities (tRPC client, socket)
│   └── src/stores/        # Zustand stores
├── packages/api/          # tRPC routers + business logic
│   ├── src/routers/       # conversation, contact, inbox, message, user
│   └── src/libs/          # auth, redis
├── packages/db/           # Prisma schema + seed
│   └── prisma/schema.prisma
├── infra/                 # Docker, PostgreSQL init
├── scripts/               # Health check, utilities
└── .github/workflows/     # CI/CD pipeline
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run check` | Type check + Biome lint |
| `bun run format` | Auto-fix with Biome |
| `bun run db:push` | Push Prisma schema to DB |
| `bun run db:seed` | Seed database |
| `bun run db:studio` | Open Prisma Studio |
| `bun run docker:up` | Start infra (PG, Redis, MinIO) |
| `bun run docker:down` | Stop infra |
| `./scripts/health-check.sh` | Check all services |

## Infrastructure

```bash
# Start all services
docker compose up -d

# Check health
./scripts/health-check.sh

# View logs
docker compose logs -f

# Stop
docker compose down
```

| Service | Port | Console |
|---|---|---|
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| MinIO API | 9000 | http://localhost:9001 |
| App | 3000 | http://localhost:3000 |

## Git Workflow

Each Oracle works on their own branch:

```
main              ← production, protected
dev/lead-dev      ← lead developer
dev/frontend      ← frontend oracle
dev/backend       ← backend oracle
dev/devops        ← devops oracle
dev/qa            ← qa oracle
```

All changes go through PR → lead-dev reviews → merge to main.

## CI/CD

GitHub Actions pipeline runs on push/PR to main:
1. **Check** — Biome lint + TypeScript type check
2. **Test** — Run tests with PostgreSQL + Redis services
3. **Build & Push** — Docker image → GitHub Container Registry
