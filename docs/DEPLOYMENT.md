# Beat Platform — Production Deployment Guide

> **Source of truth:** This guide was generated from the actual codebase (`backend-beat/`, `beat-frontend/`). When documentation and code disagree, trust the code.

---

## Table of contents

1. [Project architecture](#1-project-architecture)
2. [Required cloud services](#2-required-cloud-services)
3. [Infrastructure diagram](#3-infrastructure-diagram)
4. [Environment variables](#4-environment-variables)
5. [Production deployment architecture](#5-production-deployment-architecture)
6. [Free / low-cost deployment architecture](#6-free--low-cost-deployment-architecture)
7. [AWS deployment](#7-aws-deployment)
8. [Oracle Cloud deployment](#8-oracle-cloud-deployment)
9. [Railway deployment](#9-railway-deployment)
10. [Render deployment](#10-render-deployment)
11. [VPS deployment](#11-vps-deployment)
12. [Docker deployment](#12-docker-deployment)
13. [CI/CD](#13-cicd)
14. [Monitoring](#14-monitoring)
15. [Backup strategy](#15-backup-strategy)
16. [Disaster recovery](#16-disaster-recovery)
17. [Deployment checklist](#17-deployment-checklist)
18. [Rollback procedure](#18-rollback-procedure)
19. [Troubleshooting](#19-troubleshooting)
20. [Scaling recommendations](#20-scaling-recommendations)
21. [Search configuration](#21-search-configuration)
22. [Storage configuration](#22-storage-configuration)
23. [Production readiness gaps](#23-production-readiness-gaps)
24. [Deployment roadmap](#24-deployment-roadmap)

---

## 1. Project architecture

Beat is an event ticketing platform delivered as four applications backed by one NestJS API.

| Application | Path | Stack | Dev port | Production runtime |
|-------------|------|-------|----------|-------------------|
| **User** (consumer) | `beat-frontend/apps/user` | Next.js 14 (App Router), React 18, Tailwind | 3004 | **Node.js** (`next start`) — hybrid SSR |
| **Organiser** (dashboard) | `beat-frontend/apps/organiser` | Vite 5 + React 18 SPA | 3001 | **Static files** (CDN / object storage) |
| **Admin** (console) | `beat-frontend/apps/admin` | Vite 5 + React 18 SPA | 3002 | **Static files** |
| **Backend API** | `backend-beat/` | NestJS 11, TypeORM, BullMQ | 3000 | **Long-running Node.js** process |

### Monorepo layout

```
beats/
├── backend-beat/          # NestJS API — npm
└── beat-frontend/         # Nx 20 monorepo — pnpm 9.15.9
    ├── apps/user|organiser|admin
    └── packages/          # @beat/api-client, core, types, ui, utils
```

### Backend internal modules (relevant to deployment)

| Module | Technology | Why it exists |
|--------|------------|---------------|
| Database | TypeORM + PostgreSQL | Users, events, sessions, tickets, permissions |
| Auth | JWT + Passport + phone OTP | Access/refresh tokens; session validation in DB |
| Storage | MinIO client or AWS SDK S3 | Event media uploads (images, video, PDF) |
| Search | OpenSearch **or** PostgreSQL | Event/session discovery with geo filters |
| Queues | BullMQ on Redis | Search index sync + search analytics (trending) |
| Email | Nodemailer (dev) or SendGrid | Admin notifications on event submission |
| SMS | Twilio | OTP delivery (SMS and voice) |

**Important:** BullMQ workers (`SearchSyncProcessor`, `SearchAnalyticsProcessor`) run **inside the same NestJS process**. You do not deploy a separate worker container unless you choose to split processes later.

### Frontend rendering model

| App | Model | Implication |
|-----|-------|-------------|
| User | Hybrid SSR (Next.js App Router) | Requires Node at runtime; `/events` fetches API server-side |
| Organiser | CSR SPA | Build once; serve static HTML/JS |
| Admin | CSR SPA | Build once; serve static HTML/JS |

Auth tokens live in **browser localStorage** (`packages/api-client`). SSR pages cannot access user tokens.

---

## 2. Required cloud services

### Mandatory

| Service | Required? | Why (from code) |
|---------|-----------|-----------------|
| **PostgreSQL + PostGIS** | **Yes** | Migrations create `geography(Point,4326)` columns on `events`, `event_sessions`, `users`. Geo search uses `ST_Distance` / `ST_DWithin`. |
| **Redis** | **Yes** | `BullModule.forRootAsync` in `app.module.ts` connects to Redis. Queues: `search-sync`, `search-analytics`. Trending searches read Redis sorted set `search-analytics:counts`. |
| **Object storage** | **Yes** | `StorageModule` uploads event media on create/update. App starts without storage but uploads fail. |
| **JWT secret** | **Yes** | `JWT_SECRET` — no fallback; auth breaks without it. |
| **HTTPS + DNS** | **Yes** (production) | Browser apps call cross-origin API with credentials (`withCredentials: true`). |

### Optional (feature-dependent)

| Service | Required? | Why |
|---------|-----------|-----|
| **OpenSearch** | **Optional** | Default `SEARCH_PROVIDER=opensearch`. Set `SEARCH_PROVIDER=database` to use PostgreSQL full-text + PostGIS instead. See [Section 21](#21-search-configuration). |
| **Twilio** | **Optional at startup; required for real OTP** | Without credentials, OTP is logged/simulated (`twilio-otp.provider.ts`). |
| **SendGrid** | **Optional** | Default `EMAIL_PROVIDER=devmail` (local SMTP). Production should use `sendgrid`. |
| **CDN** | **Recommended** | Static SPAs + media URLs benefit from edge caching. Not enforced in code. |
| **Docker** | **Optional** | No committed Dockerfile; compose files are dev-only. |
| **Nginx / PM2** | **Optional** | No committed configs; common on VPS. |
| **Separate worker process** | **No** | Processors run in API process. |
| **Cron / scheduler** | **No** | `@nestjs/schedule` is in `package.json` but **not imported anywhere**. |

### Not used (do not provision)

| Service | Status |
|---------|--------|
| MongoDB, MySQL | Not referenced |
| RabbitMQ, SQS | BullMQ uses Redis only |
| In-app Redis cache | `CacheService` is in-memory `Map`, not Redis |
| `@nestjs/terminus` health | Not installed |
| PM2 ecosystem file | Not in repo |

---

## 3. Infrastructure diagram

### Recommended production layout

```
                         ┌─────────────────────────────────────────────┐
                         │           DNS + TLS (ACM / Let's Encrypt)    │
                         │  beats.com  organiser.*  admin.*  api.*      │
                         └──────────────┬──────────────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
  ┌──────▼──────┐              ┌────────▼────────┐            ┌────────▼────────┐
  │ Vercel /    │              │ CDN + static    │            │ Load balancer / │
  │ Railway     │              │ hosting (S3 +   │            │ container host  │
  │ (Next.js)   │              │ CloudFront)     │            │ (NestJS :3000)  │
  │ User app    │              │ Organiser+Admin │            │ Backend API     │
  └─────────────┘              └─────────────────┘            └────────┬────────┘
                                                                         │
                    ┌────────────────────────────────────────────────────┤
                    │                    │              │                │
             ┌──────▼──────┐      ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
             │ PostgreSQL  │      │ Redis       │ │ S3 / R2 / │  │ OpenSearch  │
             │ + PostGIS   │      │ (managed)   │ │ MinIO     │  │ (optional)  │
             └─────────────┘      └─────────────┘ └───────────┘  └─────────────┘
                                                                        │
                                                              Twilio · SendGrid
```

### Minimum viable stack (cost-optimized)

```
Single VPS or Railway
├── NestJS API (includes BullMQ workers)
├── PostgreSQL + PostGIS (managed or on VPS)
├── Redis (managed or Docker)
├── Object storage (MinIO on VPS OR Cloudflare R2 via MinIO provider)
└── SEARCH_PROVIDER=database  (skip OpenSearch)
```

---

## 4. Environment variables

### 4.1 Backend — complete reference

There is **no committed `.env.example`** for the backend. Store production values in your platform's secret manager.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `POSTGRES_HOST` | **Yes** | — | Database host |
| `POSTGRES_PORT` | No | `5432` | Database port |
| `POSTGRES_USER` | **Yes** | — | Database user |
| `POSTGRES_PASSWORD` | **Yes** | — | Database password |
| `POSTGRES_DB` | **Yes** | — | Database name |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `PORT` | No | `3000` | API listen port |
| `NODE_ENV` | No | `development` | Affects MinIO credential defaults |
| `CORS_ORIGINS` | No | `http://localhost:3001,http://localhost:3003,http://localhost:3004` | Comma-separated frontend origins. **Note:** default omits admin port `3002`. |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `REDIS_HOST` | **Yes*** | `localhost` | *Required for queues + trending |
| `REDIS_PORT` | No | `6379` | No password/TLS support in code |
| `SEARCH_PROVIDER` | No | `opensearch` | `database` = PostgreSQL search |
| `OPENSEARCH_NODE` | Conditional | `http://localhost:9200` | Required when using OpenSearch provider |
| `STORAGE_PROVIDER` | No | `minio` | `minio` or `s3` |
| `STORAGE_BUCKET` | No | `beats-events` | Bucket name |
| `STORAGE_MAX_FILE_SIZE_MB` | No | `20` | Upload size limit |
| `MINIO_ENDPOINT` | No | `localhost` | S3-compatible endpoint (MinIO, R2, OCI) |
| `MINIO_PORT` | No | `9000` | Endpoint port |
| `MINIO_USE_SSL` | No | `false` | Set `true` for HTTPS endpoints |
| `MINIO_ACCESS_KEY` | Conditional | `minioadmin` (dev) | Empty in prod if unset |
| `MINIO_SECRET_KEY` | Conditional | `minioadmin` (dev) | Empty in prod if unset |
| `MINIO_PUBLIC_URL_BASE` | No | derived | Public URL prefix for uploaded files |
| `AWS_REGION` | No | `us-east-1` | When `STORAGE_PROVIDER=s3` |
| `AWS_ACCESS_KEY_ID` | Conditional | `''` | Omit if using IAM role |
| `AWS_SECRET_ACCESS_KEY` | Conditional | `''` | Omit if using IAM role |
| `S3_PUBLIC_URL_BASE` | No | auto-generated | Override public media URL |
| `EMAIL_PROVIDER` | No | `devmail` | `sendgrid` for production |
| `SENDGRID_API_KEY` | Conditional | `test_key` | When sendgrid |
| `SENDGRID_FROM_EMAIL` | No | `no-reply@beats-events.com` | Sender address |
| `DEVMAIL_HOST` | No | `localhost` | When devmail |
| `DEVMAIL_PORT` | No | `1025` | When devmail |
| `TWILIO_ACCOUNT_SID` | No | — | SMS/voice OTP |
| `TWILIO_AUTH_TOKEN` | No | — | SMS/voice OTP |
| `TWILIO_PHONE_NUMBER` | No | — | SMS/voice OTP |
| `ACCESS_TOKEN_EXPIRY` | No | `15m` | JWT access token TTL |
| `REFRESH_TOKEN_EXPIRY` | No | `30d` | JWT refresh token TTL |
| `OTP_*` vars | No | various | OTP throttling (see `auth.constants.ts`) |

**Unused in code:** `ADMIN_EMAIL` (if present in local `.env`) — admin emails come from DB users with `ADMIN` role.

### 4.2 Backend — production template

```env
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://beats.com,https://organiser.beats.com,https://admin.beats.com

POSTGRES_HOST=<host>
POSTGRES_PORT=5432
POSTGRES_USER=beats_prod
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=beats_prod

JWT_SECRET=<long-random-secret>

REDIS_HOST=<redis-host>
REDIS_PORT=6379

SEARCH_PROVIDER=database
# OPENSEARCH_NODE=https://your-opensearch:9200

STORAGE_PROVIDER=s3
STORAGE_BUCKET=beats-events-prod
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_URL_BASE=https://beats-events-prod.s3.ap-south-1.amazonaws.com

TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=noreply@beats.com

LOG_LEVEL=info
```

### 4.3 Frontend — build-time variables

These are **embedded at build time**. Changing them requires a rebuild and redeploy.

| App | Variable | Example | Used in code? |
|-----|----------|---------|---------------|
| User | `NEXT_PUBLIC_API_URL` | `https://beat-backend-h3qj.onrender.com` | Yes |
| User | `NEXT_PUBLIC_ORGANISER_URL` | `https://organiser.beats.com` | **No** (in `.env.example` only) |
| Organiser | `VITE_API_URL` | `https://beat-backend-h3qj.onrender.com` | Yes |
| Organiser | `VITE_USER_APP_URL` | `https://beats.com` | Yes — public event links |
| Admin | `VITE_API_URL` | `https://beat-backend-h3qj.onrender.com` | Yes |

Vite apps inject env via `define` in `vite.config.ts` (not `import.meta.env`).

### 4.4 Domain layout

| Subdomain | Application |
|-----------|-------------|
| `beats.com` | User (Next.js) |
| `organiser.beats.com` | Organiser SPA |
| `admin.beats.com` | Admin SPA |
| `api.beats.com` | Backend API |

API prefix: `/api/v1/*` (see `packages/api-client`).

---

## 5. Production deployment architecture

**Best fit:** managed data services + containerized API + CDN for static apps.

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| User app | Vercel, Railway, or Node container | Native Next.js 14 SSR support |
| Organiser + Admin | S3 + CloudFront, Netlify, or Vercel static | Pure static output from Vite |
| API | Docker on ECS Fargate, Railway, Render, or VPS | Long-running Node with secrets |
| Database | RDS, Supabase, Neon (PostGIS), or OCI PostgreSQL | Backups, patching, HA |
| Redis | ElastiCache, Upstash, Redis Cloud, OCI Cache | Queue durability |
| Storage | AWS S3 (prod) | Standard; IAM policies |
| Search | Start with `SEARCH_PROVIDER=database`; add OpenSearch when traffic grows | Saves ~512MB–1GB RAM |
| Secrets | AWS Secrets Manager, Railway/Render env, OCI Vault | Never commit `.env` |
| TLS | ACM (AWS), Let's Encrypt (VPS), platform-managed (Railway/Render) | Required for production |

### Build commands

**Backend** (`backend-beat/`):

```bash
npm ci
npm run build          # → dist/
npm run migration:run  # once per release
npm run start:prod     # node dist/main
```

**Frontend** (`beat-frontend/`):

```bash
corepack enable && corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
pnpm build             # builds user, organiser, admin
```

| App | Output directory | Start command |
|-----|------------------|---------------|
| User | `dist/apps/user` | `pnpm start:user` → `next start -p 3004` |
| Organiser | `dist/apps/organiser` | Static hosting (SPA fallback → `index.html`) |
| Admin | `dist/apps/admin` | Static hosting |

### Post-deploy verification

- [ ] `GET https://api.beats.com/` returns hello string
- [ ] `GET https://api.beats.com/api/docs` loads Swagger (always enabled)
- [ ] `GET https://api.beats.com/search/health` returns 200
- [ ] User app loads events without CORS errors
- [ ] Organiser login + OTP works (Twilio)
- [ ] Media upload succeeds (storage reachable)
- [ ] No `ECONNREFUSED` to Redis in API logs

---

## 6. Free / low-cost deployment architecture

Suitable for staging, MVPs, or early production with minimal spend.

| Component | Free/cheap option | Trade-off |
|-----------|-------------------|-----------|
| API | Railway free tier, Render free tier, or Oracle Always Free VM | Cold starts, limited RAM |
| Database | Neon free (enable PostGIS), Supabase free, or self-hosted Postgres on VPS | Connection limits, no HA |
| Redis | Upstash free tier or Redis in Docker on VPS | Upstash has request limits |
| Storage | Cloudflare R2 (10 GB free) via **MinIO provider** | Requires custom endpoint config |
| Search | `SEARCH_PROVIDER=database` | No synonym analyzer; good enough for MVP |
| User app | Vercel hobby | Bandwidth limits |
| SPAs | Cloudflare Pages, Netlify free | Build minutes limits |
| Email | SendGrid free tier (100/day) | Volume cap |
| SMS | Twilio trial | Verified numbers only |

**Skip OpenSearch** on free tiers — it needs 512MB+ heap and adds operational cost.

---

## 7. AWS deployment

### Service mapping

| Beat component | AWS service |
|----------------|-------------|
| API | ECS Fargate, App Runner, or EC2 + PM2 |
| Database | RDS PostgreSQL + PostGIS extension |
| Redis | ElastiCache for Redis |
| Storage | S3 + optional CloudFront for media |
| Search (optional) | Amazon OpenSearch Service |
| User app | Amplify Hosting or Vercel |
| SPAs | S3 + CloudFront |
| Secrets | Secrets Manager or SSM Parameter Store |
| TLS | ACM certificates on ALB / CloudFront |
| CI/CD | GitHub Actions → ECR → ECS |

### Steps

1. **RDS PostgreSQL:** Create instance, then connect and run `CREATE EXTENSION IF NOT EXISTS postgis;`
2. **ElastiCache Redis:** Same VPC as API; set `REDIS_HOST` to primary endpoint.
3. **S3 bucket:** Create bucket, IAM policy with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`. Set `STORAGE_PROVIDER=s3`.
4. **Deploy API:** Build Docker image (see [Section 12](#12-docker-deployment)), push to ECR, run on ECS with env vars from Section 4.2.
5. **Run migrations:** ECS one-off task or CI step: `npm run migration:run`.
6. **Frontends:** Build with production URLs; deploy user to Amplify/Vercel; sync organiser/admin to S3 + CloudFront with SPA fallback.
7. **DNS:** Route 53 A/ALIAS records for all four subdomains.
8. **CORS:** Set `CORS_ORIGINS` to exact HTTPS origins.

### OpenSearch on AWS (optional)

Set `SEARCH_PROVIDER=opensearch` and `OPENSEARCH_NODE=https://<domain>.region.es.amazonaws.com`.

After first deploy with OpenSearch, backfill index:

```bash
npm run index:events
```

---

## 8. Oracle Cloud deployment

### Service mapping

| Beat component | OCI service |
|----------------|-------------|
| API | Compute Instance, Container Instances, or OKE |
| Database | OCI PostgreSQL (or PostGIS Docker on VM) |
| Redis | OCI Cache with Redis |
| Storage | Oracle Object Storage (S3-compatible API) |
| TLS | OCI Load Balancer + OCI Certificates |
| Container registry | OCIR |

### Storage on OCI

The **`S3Provider` does not support custom endpoints** — it uses standard AWS SDK only.

**Use the MinIO provider** for Oracle Object Storage:

```env
STORAGE_PROVIDER=minio
STORAGE_BUCKET=beats-events-prod
MINIO_ENDPOINT=<namespace>.compat.objectstorage.<region>.oraclecloud.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<customer-secret-key-access>
MINIO_SECRET_KEY=<customer-secret-key-secret>
MINIO_PUBLIC_URL_BASE=https://objectstorage.<region>.oraclecloud.com/n/<namespace>/b/<bucket>/o
```

### Recommended OCI rollout

1. Provision PostgreSQL → enable PostGIS
2. Provision OCI Cache (Redis)
3. Create Object Storage bucket + Customer Secret Key
4. Deploy API on Compute (Node 20) or Container Instance
5. Configure Load Balancer on port 443 → API :3000
6. Set `SEARCH_PROVIDER=database` initially
7. Deploy frontends separately (Vercel/Cloudflare for SPAs)

Minimum compute: **2 OCPU / 4 GB RAM** (8 GB if self-hosting OpenSearch).

---

## 9. Railway deployment

Railway works well for the **API + Redis + optional Postgres** in one project.

### Setup

1. Create Railway project with **PostgreSQL** plugin (enable PostGIS manually via SQL console).
2. Add **Redis** plugin.
3. Deploy `backend-beat/` from GitHub:
   - **Build:** `npm ci && npm run build`
   - **Start:** `npm run start:prod`
   - **Release command:** `npm run migration:run`
4. Set all env vars from Section 4.2.
5. For storage: use Cloudflare R2 or AWS S3 (external — Railway has no native object storage).
6. Deploy user app as separate Railway service:
   - Root: `beat-frontend/apps/user`
   - Build: `cd ../.. && pnpm install && pnpm build:user`
   - Start: `pnpm start:user`
7. Deploy organiser/admin to Cloudflare Pages or Netlify (static).

### Notes

- Set `CORS_ORIGINS` to Railway-generated URLs during staging, then update for custom domain.
- Railway provides `REDIS_URL` but the app expects `REDIS_HOST` + `REDIS_PORT` — parse or set manually.

---

## 10. Render deployment

### Backend (Web Service)

| Setting | Value |
|---------|-------|
| Root directory | `backend-beat` |
| Build | `npm ci && npm run build` |
| Start | `npm run start:prod` |
| Pre-deploy | `npm run migration:run` |

Add **Render Redis** and **Render PostgreSQL** (or external Neon with PostGIS).

### Frontends

| App | Render type |
|-----|-------------|
| User | Web Service (Node) — build Next.js, start with `next start -p $PORT` |
| Organiser | Static Site — publish `beat-frontend/dist/apps/organiser` |
| Admin | Static Site — publish `beat-frontend/dist/apps/admin` |

Set build-time env vars in Render dashboard before build.

---

## 11. VPS deployment

Good for staging, cost-sensitive production, or full control.

### Stack on one machine (minimum 4 GB RAM, 8 GB with OpenSearch)

```
Internet → Nginx (443) → api:3000 | user:3004 | static SPAs
                              ↓
                    postgres | redis | minio | opensearch (optional)
```

### Supporting services

Use existing dev compose for Redis, MinIO, OpenSearch:

```bash
cd backend-beat
docker compose -f docker-compose-local.yml up -d redis minio
# Add opensearch only if SEARCH_PROVIDER=opensearch
```

Add PostgreSQL separately:

```bash
docker run -d --name beats-postgres \
  -e POSTGRES_USER=beats -e POSTGRES_PASSWORD=<secret> -e POSTGRES_DB=beats \
  -p 5432:5432 -v pgdata:/var/lib/postgresql/data \
  postgis/postgis:16-3.4
```

Then enable PostGIS and run migrations.

### Process management

```bash
# Backend
cd backend-beat && npm ci && npm run build && npm run migration:run
pm2 start dist/main.js --name beat-api

# User app
cd beat-frontend && pnpm install && pnpm build:user
pm2 start "pnpm start:user" --name beat-user --cwd apps/user
```

Serve organiser/admin static files via Nginx (`try_files $uri $uri/ /index.html`).

### Sample Nginx (API)

```nginx
server {
    listen 443 ssl http2;
    server_name api.beats.com;

    ssl_certificate     /etc/letsencrypt/live/api.beats.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beats.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
    }
}
```

SPAs include `_redirects` for Netlify-style hosting (`/* /index.html 200`).

---

## 12. Docker deployment

**There is no committed Dockerfile.** Create one for production:

```dockerfile
# backend-beat/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/main"]
```

Also create `backend-beat/.dockerignore`:

```
node_modules
dist
.env
.env.*
coverage
test
*.md
```

Build and run:

```bash
docker build -t beat-api .
docker run -p 3000:3000 --env-file .env.production beat-api
```

Run migrations as a separate one-off container or CI step — **not** in the Dockerfile CMD.

### Dev compose files (not for production)

| File | Services |
|------|----------|
| `docker-compose-local.yml` | MinIO, MailDev, Redis, OpenSearch |
| `docker-compose.dev.yml` | MinIO, Redis only |

Neither includes PostgreSQL or the API.

---

## 13. CI/CD

**No CI/CD exists in the repo.** Recommended GitHub Actions flow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend-beat
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend-beat/package-lock.json
      - run: npm ci
      - run: npm run build
      - run: npm test
      # Deploy step (Docker push, Railway, Render, etc.)
      # Run migrations BEFORE switching traffic:
      # - run: npm run migration:run
      #   env: { POSTGRES_*: ${{ secrets.* }} }

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: beat-frontend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: beat-frontend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_USER_APP_URL: ${{ secrets.USER_APP_URL }}
      # Deploy user → Vercel/Railway
      # Sync dist/apps/organiser and dist/apps/admin → S3/Cloudflare Pages
```

### Rules

1. Run `migration:run` **before** routing traffic to a new API version.
2. Never deploy with `NODE_ENV=development` in production (MinIO keys default to empty).
3. Frontend env vars must be set **at build time**, not runtime (except Next.js server-side reads).

---

## 14. Monitoring

### What exists in code

| Capability | Implementation |
|------------|----------------|
| Structured logging | `nestjs-pino` + `LoggingInterceptor`; redacts passwords/tokens |
| Log level | `LOG_LEVEL` env var |
| Rate limiting | Global 500 req/min (`ThrottlerGuard`) |
| Search health | `GET /search/health` |
| Storage health | Checked at startup only (logged, not HTTP) |

### What to add externally

| Area | Recommendation |
|------|----------------|
| Uptime | Pingdom, Better Uptime, or AWS Route 53 health checks on `/search/health` |
| Logs | CloudWatch, Datadog, or Grafana Loki — ship stdout JSON |
| Errors | Sentry for NestJS + Next.js |
| Metrics | Prometheus + Grafana (CPU, memory, Redis queue depth) |
| Alerts | Redis connection failures, migration failures, 5xx rate |

### Key log patterns to alert on

- `ECONNREFUSED` (Redis, Postgres, OpenSearch)
- `Twilio not configured` (in production)
- `Search provider health check failed`
- BullMQ job retry exhaustion

---

## 15. Backup strategy

| Asset | Method | Frequency |
|-------|--------|-----------|
| PostgreSQL | Managed automated backups (RDS, Supabase, OCI) or `pg_dump` cron | Daily minimum |
| Redis | Ephemeral for queues — **no backup required** for job data; trending data is non-critical |
| Object storage | S3 versioning + cross-region replication (prod) | Continuous |
| Secrets | Secret manager versioning | On change |
| Code | Git tags per release | Every deploy |

### Manual Postgres backup (VPS)

```bash
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -Fc $POSTGRES_DB > beats-$(date +%F).dump
```

Test restores quarterly.

---

## 16. Disaster recovery

| Scenario | RTO target | Procedure |
|----------|------------|-----------|
| API crash | Minutes | PM2/container restart; stateless API |
| Database corruption | Hours | Restore latest RDS/backup snapshot; re-run migrations if needed |
| Redis loss | Minutes | Restart Redis; queues rebuild on next event CRUD; trending resets |
| OpenSearch loss | Hours | Recreate cluster; run `npm run index:events` |
| Storage bucket deletion | Hours | Restore from S3 versioning / backup |
| Region outage | Hours–days | Failover to secondary region (requires pre-planned DNS + DB replica) |

**Database mode search** simplifies DR — no OpenSearch rebuild needed.

---

## 17. Deployment checklist

### Infrastructure

- [ ] PostgreSQL provisioned with PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
- [ ] Redis reachable from API
- [ ] Object storage bucket created with correct permissions
- [ ] TLS certificates for all four domains
- [ ] DNS records configured

### Backend

- [ ] All required env vars set (Section 4.2)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` is strong and unique
- [ ] `CORS_ORIGINS` includes all three frontend URLs (exact match, no trailing slash)
- [ ] `npm run build` succeeds
- [ ] `npm run migration:run` completes without errors
- [ ] API starts and responds on `/` and `/search/health`
- [ ] Twilio configured for production OTP
- [ ] SendGrid configured for production email

### Frontend

- [ ] Built with production `NEXT_PUBLIC_API_URL` / `VITE_*` values
- [ ] User app `next.config.js` `images.remotePatterns` includes your media CDN domain
- [ ] SPA fallback configured for organiser/admin
- [ ] Cross-app link `VITE_USER_APP_URL` points to production user domain

### Security

- [ ] No secrets in git
- [ ] Swagger (`/api/docs`) restricted or accepted as public (currently always on)
- [ ] Rate limiting active (built-in)
- [ ] Upload size limits aligned with reverse proxy (`client_max_body_size 25M`)

---

## 18. Rollback procedure

### API rollback

1. Deploy previous Docker image / git tag.
2. If migrations were run and are **backward-compatible**, no DB action needed.
3. If migrations are **not** reversible, run `npm run migration:revert` (emergency only — test in staging first).
4. Verify `/search/health` and smoke test auth.

### Frontend rollback

1. Redeploy previous build artifact (Vercel instant rollback, S3 version restore, etc.).
2. No database impact.

### Database rollback

```bash
cd backend-beat
npm run migration:revert   # reverts ONE migration
```

Prefer restoring from backup over chained reverts in production.

---

## 19. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ECONNREFUSED 127.0.0.1:6379` | Redis not running | Start Redis or set `REDIS_HOST` |
| CORS error in browser | Origin not in `CORS_ORIGINS` | Add exact `https://` origin |
| API works, frontends fail | Wrong build-time API URL | Rebuild with correct env vars |
| OTP not received | Twilio not configured | Set Twilio env vars |
| OTP works in dev, not prod | Twilio trial / geo permissions | Verify number, enable geo in Twilio console |
| `Access Denied` on upload | Wrong storage credentials | Check MinIO/S3 keys and bucket policy |
| Migration fails on `geography` | PostGIS missing | `CREATE EXTENSION postgis;` |
| Search returns empty (OpenSearch) | Index empty | Run `npm run index:events` |
| OpenSearch errors in logs with `SEARCH_PROVIDER=database` | Both search services instantiate at startup | Harmless log noise; or add lazy-init (code improvement) |
| Next.js images broken | `remotePatterns` missing storage domain | Add hostname to `next.config.js` |
| `Unsupported STORAGE_PROVIDER` | Typo in env | Use `minio` or `s3` only |
| MinIO keys empty in prod | `NODE_ENV` not `production` | Set `NODE_ENV=production` |
| Admin CORS fails locally | Default CORS lists port 3003, admin is 3002 | Add `http://localhost:3002` to `CORS_ORIGINS` |

---

## 20. Scaling recommendations

| Component | When to scale | How |
|-----------|---------------|-----|
| API | CPU > 70% sustained, p95 latency rising | Horizontal: multiple containers behind LB (stateless). BullMQ workers scale with API replicas. |
| PostgreSQL | Connection pool exhaustion (`extra.max: 10` per instance) | Increase RDS size; add PgBouncer; reduce API replicas' pool or increase `max` carefully |
| Redis | Queue backlog growing | Larger Redis instance; monitor BullMQ queue depth |
| OpenSearch | Search latency > 200ms, index > 10GB | Add data nodes; increase heap |
| Search (cost) | Before scaling OpenSearch | Try `SEARCH_PROVIDER=database` first |
| Static SPAs | Global users | CloudFront / Cloudflare CDN |
| Media | High bandwidth | S3 + CloudFront in front of `S3_PUBLIC_URL_BASE` |
| User app | High SSR traffic | Vercel auto-scale or multiple Next.js instances |

**Connection math:** Each API instance holds up to 10 Postgres connections. With 4 API replicas = 40 connections — size RDS accordingly.

---

## 21. Search configuration

### How provider selection works

In `search.module.ts`:

```typescript
const provider = configService.get<string>('SEARCH_PROVIDER') || 'opensearch';
return provider === 'database' ? dbSearchService : openSearchService;
```

| Mode | Env | Infrastructure | Capabilities |
|------|-----|----------------|--------------|
| **OpenSearch** (default) | `SEARCH_PROVIDER=opensearch` | OpenSearch 2.x cluster | Synonym analyzer, `search_as_you_type`, geo queries, async index sync via BullMQ |
| **Database** | `SEARCH_PROVIDER=database` | PostgreSQL only | `to_tsvector`/`to_tsquery` full-text, PostGIS geo (`ST_DWithin`), ILIKE fallback |

### Is OpenSearch mandatory?

**No.** Set `SEARCH_PROVIDER=database` to run without OpenSearch.

Trade-offs of database mode:

| | OpenSearch | Database |
|---|-----------|----------|
| Synonym matching (EDM, standup, etc.) | Yes | No |
| Search-as-you-type relevance | Better | Basic prefix/ILIKE suggestions |
| Index sync jobs | Writes to OpenSearch | No-op (data already in PG) |
| RAM cost | ~512MB–1GB+ | None extra |
| Startup | Connects to OpenSearch | PG only |

### Caveat: OpenSearch still initializes at startup

Both `OpenSearchSearchService` and `DatabaseSearchService` are registered as NestJS providers. Even in database mode, `OpenSearchSearchService.onModuleInit()` attempts index setup and **logs errors** if OpenSearch is unreachable. The app still starts.

### Redis is required in both modes

Trending searches and search analytics use Redis regardless of search provider.

### Backfill OpenSearch index

After switching to OpenSearch or recovering from index loss:

```bash
cd backend-beat
npm run index:events
```

This bootstraps the NestJS context, calls `searchService.setupIndex()`, and bulk-indexes published events.

### Health check

```
GET /search/health
```

Returns 200 when the **active** provider is healthy, 503 otherwise.

---

## 22. Storage configuration

### Provider selection

In `storage.module.ts`: `STORAGE_PROVIDER` → `minio` (default) or `s3`.

### Compatibility matrix

| Backend | `STORAGE_PROVIDER` | Custom endpoint | Production ready? |
|---------|-------------------|-----------------|-------------------|
| **AWS S3** | `s3` | No (standard AWS SDK) | **Yes** — recommended for AWS |
| **MinIO** (self-hosted) | `minio` | `MINIO_ENDPOINT` + `MINIO_PORT` | Yes |
| **Cloudflare R2** | `minio` | `MINIO_ENDPOINT=<accountid>.r2.cloudflarestorage.com`, `MINIO_PORT=443`, `MINIO_USE_SSL=true` | **Yes** — use MinIO provider, not `s3` |
| **Oracle Object Storage** | `minio` | `MINIO_ENDPOINT=<namespace>.compat.objectstorage.<region>.oraclecloud.com` | **Yes** — use MinIO provider |
| **AWS S3 via custom endpoint** | `s3` | **Not supported** | No — extend `S3Provider` or use `minio` |

### AWS S3 example

```env
STORAGE_PROVIDER=s3
STORAGE_BUCKET=beats-events-prod
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_URL_BASE=https://beats-events-prod.s3.ap-south-1.amazonaws.com
```

IAM role on ECS/EC2: omit `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

### Cloudflare R2 example

```env
STORAGE_PROVIDER=minio
STORAGE_BUCKET=beats-events
MINIO_ENDPOINT=<account-id>.r2.cloudflarestorage.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=<r2-access-key-id>
MINIO_SECRET_KEY=<r2-secret-access-key>
MINIO_PUBLIC_URL_BASE=https://media.beats.com
```

Configure a public R2 custom domain or Cloudflare CDN in front of the bucket for `MINIO_PUBLIC_URL_BASE`.

### Upload limits

- Default max file size: `STORAGE_MAX_FILE_SIZE_MB` (default 20)
- Event multi-file upload capped at 10 MB per file in `file-upload.interceptor.ts`
- Reverse proxy should allow ≥ 25 MB (`client_max_body_size`)

### Recommended code improvements (not yet implemented)

1. Add `endpoint` + `forcePathStyle` to `S3Provider` for native S3-compatible support
2. Unify R2/OCI/AWS under one provider with endpoint config
3. Add HTTP health endpoint for storage (currently startup-only)

---

## 23. Production readiness gaps

Verified against source code. Items marked **missing** are not in the repo today.

| Area | Status | Detail |
|------|--------|--------|
| Env validation | **Missing** | No Joi/Zod schema; missing `POSTGRES_*` fails at runtime |
| `.env.example` (backend) | **Missing** | Only frontend apps have examples |
| Dockerfile | **Missing** | Sample in this doc only |
| `.dockerignore` | **Missing** | |
| CI/CD | **Missing** | No `.github/workflows/` |
| Graceful shutdown | **Missing** | No `enableShutdownHooks()` in `main.ts` |
| Security headers | **Missing** | No `helmet` |
| Global health endpoint | **Partial** | `GET /` and `GET /search/health` only; no DB/Redis check |
| Swagger in production | **Always on** | `/api/docs` exposed |
| TypeORM SQL logging | **Always on** | `logging: true` in all environments |
| Node version pin | **Missing** | No `engines` in backend `package.json` |
| Redis auth/TLS | **Missing** | Host/port only |
| `@nestjs/schedule` | **Unused** | Dependency present, no cron jobs |
| Seed command | **N/A** | Seed data in migrations (`SeedPermission*`, `SeedRole*`) |
| Next.js image domains | **Incomplete** | Only `images.unsplash.com`; add production media CDN |
| `NEXT_PUBLIC_ORGANISER_URL` | **Unused** | Documented but not referenced in frontend code |
| CORS default | **Bug** | Default includes port 3003, not admin port 3002 |
| OpenSearch lazy init | **Gap** | OpenSearch service initializes even in database mode |

---

## 24. Deployment roadmap

### Phase 1 — Provision data layer (Day 1)

1. Create PostgreSQL instance (15+).
2. Connect and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Provision managed Redis (or start Redis via Docker for staging).
4. Create object storage bucket (S3, R2, or MinIO).
5. Note all connection strings and credentials in secret manager.

**Exit criteria:** Can connect to Postgres, Redis, and storage from your workstation.

---

### Phase 2 — Configure environment variables (Day 1)

1. Create production env file from [Section 4.2](#42-backend--production-template).
2. Generate strong `JWT_SECRET`.
3. Set `SEARCH_PROVIDER=database` (unless you have OpenSearch ready).
4. Set `STORAGE_PROVIDER` and storage credentials.
5. Set `CORS_ORIGINS` to your planned frontend URLs.
6. Configure Twilio and SendGrid credentials.

**Exit criteria:** Env file validated; no placeholder values remain.

---

### Phase 3 — Deploy backend (Day 2)

1. Choose host (Railway, Render, ECS, VPS).
2. Create Dockerfile (Section 12) or deploy Node directly.
3. Set env vars on the platform.
4. Deploy and confirm process starts.

**Exit criteria:** `GET /` returns response (may error on DB until Phase 4).

---

### Phase 4 — Run migrations (Day 2)

1. Run `npm run migration:run` against production database.
2. Verify 23 migrations applied without PostGIS errors.
3. Confirm seed permissions/categories exist (from seed migrations).

**Exit criteria:** API connects to DB; Swagger loads at `/api/docs`.

---

### Phase 5 — Deploy frontends (Day 2–3)

1. Set build-time env vars:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   VITE_API_URL=https://api.yourdomain.com
   VITE_USER_APP_URL=https://yourdomain.com
   ```
2. `pnpm install --frozen-lockfile && pnpm build`
3. Deploy user app (Node host or Vercel).
4. Deploy organiser + admin static builds with SPA fallback.
5. Update `next.config.js` `images.remotePatterns` for your media CDN domain.

**Exit criteria:** All three apps load in browser.

---

### Phase 6 — Configure CDN (Day 3)

1. Put CloudFront/Cloudflare in front of organiser/admin static assets.
2. Optional: CDN for media bucket (`S3_PUBLIC_URL_BASE` / `MINIO_PUBLIC_URL_BASE`).
3. Enable gzip/brotli compression.

**Exit criteria:** Static assets served from CDN; cache headers present.

---

### Phase 7 — Configure DNS (Day 3)

1. Create A/CNAME records:
   - `api.yourdomain.com` → API host
   - `yourdomain.com` → User app
   - `organiser.yourdomain.com` → Organiser static host
   - `admin.yourdomain.com` → Admin static host
2. Provision TLS certificates (ACM, Let's Encrypt, or platform-managed).
3. Update `CORS_ORIGINS` if URLs changed from staging.

**Exit criteria:** All four URLs serve HTTPS without certificate warnings.

---

### Phase 8 — Smoke testing (Day 4)

1. **Auth:** Request OTP → verify Twilio delivery → login on organiser.
2. **Events:** Create event, upload cover image, submit for review.
3. **Admin:** Log in, approve event.
4. **User app:** Public event listing loads (`/events`).
5. **Search:** Query events; verify results and `/search/health`.
6. **CORS:** No browser console CORS errors on any app.
7. **Email:** Confirm admin notification email on event submission.

**Exit criteria:** End-to-end flow works across all four apps.

---

### Phase 9 — Production verification (Day 4–5)

1. Enable monitoring/uptime checks on `/search/health`.
2. Configure log shipping (stdout → CloudWatch/Datadog).
3. Verify backup schedule on PostgreSQL.
4. Document rollback procedure for the team.
5. Load test API (optional): verify throttling at 500 req/min global limit.
6. (Optional) Switch to OpenSearch:
   - Provision OpenSearch
   - Set `SEARCH_PROVIDER=opensearch`
   - Run `npm run index:events`
   - Compare search quality

**Exit criteria:** Monitoring active, backups scheduled, team has runbook access.

---

## Appendix A — Build reference

| Component | Package manager | Node | Build | Start |
|-----------|----------------|------|-------|-------|
| Backend | npm 10.x | 20.x | `npm run build` | `npm run start:prod` |
| Frontend | pnpm 9.15.9 | 20.x | `pnpm build` | `pnpm start:user` (user only) |

| Script | Purpose |
|--------|---------|
| `npm run migration:run` | Apply DB migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run index:events` | Backfill OpenSearch index |

---

## Appendix B — Validation of previous documentation

Summary of prior `DEPLOYMENT.md` accuracy (code-verified):

| Section | Verdict | Notes |
|---------|---------|-------|
| App stack (Next/Vite/NestJS) | ✓ Correct | |
| Build commands / output dirs | ✓ Correct | |
| PostGIS requirement | ✓ Correct | |
| Redis + BullMQ | ✓ Correct | |
| OpenSearch "required" | ✗ Incorrect | Optional via `SEARCH_PROVIDER=database` |
| Twilio / SendGrid | ✓ Correct | |
| No Dockerfile in repo | ✓ Correct | |
| OCI S3 endpoint limitation | ✓ Correct | Use MinIO provider |
| `ADMIN_EMAIL` env var | ✗ Incorrect | Not used in code |
| `NEXT_PUBLIC_ORGANISER_URL` | ⚠ Needs modification | Documented but unused in frontend |
| CORS default ports | ⚠ Needs modification | Code default omits admin :3002 |
| Health check = Swagger | ⚠ Needs modification | Use `/search/health`; no full health endpoint |
| `@nestjs/schedule` / cron | ➕ Missing | Installed but unused |
| Cloudflare R2 via MinIO | ➕ Missing | Works with MinIO provider |
| BullMQ in-process workers | ➕ Missing | No separate worker deployment |
| Next.js image remotePatterns | ➕ Missing | Must add production media domain |
| Production readiness gaps | ➕ Missing | See Section 23 |

---

For local development setup, see the root [README.md](../README.md).
