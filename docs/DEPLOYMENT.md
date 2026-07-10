# Beat Platform — Deployment Guide

This document describes the **recommended way to deploy** the full Beat stack in production:

| App | Stack | Default dev port |
|-----|--------|------------------|
| **User** | Next.js 14 | 3004 |
| **Organiser** | Vite + React (SPA) | 3001 |
| **Admin** | Vite + React (SPA) | 3002 |
| **Backend API** | NestJS 11 | 3000 |

For **Oracle Cloud (OCI)** backend deployment, see [Section 7](#7-deployment-option-c--oracle-cloud-infrastructure-oci).

Supporting services required by the backend:

| Service | Purpose |
|---------|---------|
| **PostgreSQL + PostGIS** | Primary database (events, users, tickets) |
| **Redis** | BullMQ job queues + search analytics cache |
| **Object storage** | MinIO (dev/staging) or **AWS S3** (production) |
| **OpenSearch** | Event search indexing |
| **Twilio** | OTP SMS/voice (production) |
| **SendGrid** (optional) | Transactional email |

---

## 1. Recommended production architecture

For a real production deployment, use **managed services for data** and **containers + CDN for apps**. This is the most reliable and maintainable setup.

```
                         ┌─────────────────────────────────────────┐
                         │              CDN / DNS                  │
                         │  beats.com          api.beats.com       │
                         │  organiser.beats.com admin.beats.com    │
                         └───────────┬─────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
   ┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼───────┐
   │  Vercel /   │           │ CloudFront +  │          │  ALB /        │
   │  Node host  │           │ S3 (static)   │          │  Railway /    │
   │  (User app) │           │ Organiser +   │          │  ECS / VPS    │
   │  Next.js    │           │ Admin SPAs    │          │  NestJS API   │
   └─────────────┘           └───────────────┘          └───────┬───────┘
                                                                 │
                    ┌────────────────────────────────────────────┼────────────┐
                    │                                            │            │
             ┌──────▼──────┐  ┌──────────┐  ┌──────────┐  ┌───────▼──────┐  ┌──▼────────┐
             │ RDS /       │  │ ElastiCache│ │ AWS S3   │  │ OpenSearch │  │ Twilio /  │
             │ Supabase    │  │ / Upstash  │ │          │  │ Service    │  │ SendGrid  │
             │ PostgreSQL  │  │ Redis      │ │ uploads  │  │            │  │           │
             │ + PostGIS   │  │            │ │          │  │            │  │           │
             └─────────────┘  └────────────┘  └──────────┘  └────────────┘  └───────────┘
```

### Why this layout

| Component | Recommendation | Reason |
|-----------|----------------|--------|
| User app (Next.js) | **Vercel**, Railway, or a Node container | SSR + API routes; Vercel is the simplest fit for Next.js |
| Organiser + Admin (Vite) | **Static hosting** (S3 + CloudFront, Netlify, Vercel static) | Build output is plain HTML/JS/CSS — no Node server needed |
| Backend API | **Docker container** on ECS Fargate, Railway, Render, or a VPS | Long-running Node process with env secrets |
| PostgreSQL | **Managed** (RDS, Supabase, Neon with PostGIS) | Backups, HA, patching |
| Redis | **Managed** (ElastiCache, Upstash, Redis Cloud) | Queues must survive restarts |
| File uploads | **AWS S3** in production | MinIO is fine locally; S3 is standard in prod |
| OpenSearch | **AWS OpenSearch** or self-hosted container | Required for search features |

---

## 2. Domain and URL layout

Use separate subdomains in production:

| Subdomain | Serves |
|-----------|--------|
| `https://beats.com` | User app (public) |
| `https://organiser.beats.com` | Organiser dashboard |
| `https://admin.beats.com` | Admin console |
| `https://api.beats.com` | Backend API |

Set backend CORS to allow all three frontend origins:

```env
CORS_ORIGINS=https://beats.com,https://organiser.beats.com,https://admin.beats.com
```

---

## 3. Build commands

Run these **before** deploying. CI should run the same steps.

### 3.1 Backend (`backend-beat/`)

```bash
cd backend-beat
npm ci
npm run build
# Output: dist/
```

Production start:

```bash
npm run start:prod
# Runs: node dist/main
```

Run migrations **once per release** (before or during deploy):

```bash
npm run migration:run
```

### 3.2 Frontend (`beat-frontend/`)

Requires **pnpm 9.x** (pinned in `package.json`):

```bash
cd beat-frontend
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
```

Build all three apps:

```bash
pnpm build
# Equivalent to:
# pnpm build:user
# pnpm build:organiser
# pnpm build:admin
```

Build outputs:

| App | Output directory |
|-----|------------------|
| User | `beat-frontend/dist/apps/user` (Next.js `.next` build) |
| Organiser | `beat-frontend/dist/apps/organiser` (static `index.html` + assets) |
| Admin | `beat-frontend/dist/apps/admin` (static `index.html` + assets) |

User app production server:

```bash
cd beat-frontend/apps/user
pnpm start
# next start -p 3004
```

Preview Vite SPAs locally after build:

```bash
pnpm preview:organiser
pnpm preview:admin
```

---

## 4. Environment variables

### 4.1 Backend — production `.env`

Store these in your platform secret manager (AWS Secrets Manager, Railway variables, etc.). **Never commit production secrets to git.**

```env
# Server
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://beats.com,https://organiser.beats.com,https://admin.beats.com

# Database (managed PostgreSQL with PostGIS)
POSTGRES_HOST=your-db-host.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_USER=beats_prod
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=beats_prod

# Auth
JWT_SECRET=<long-random-secret>

# Redis (managed)
REDIS_HOST=your-redis.cache.amazonaws.com
REDIS_PORT=6379

# OpenSearch
OPENSEARCH_NODE=https://your-opensearch-domain.region.es.amazonaws.com

# Object storage — use S3 in production
STORAGE_PROVIDER=s3
STORAGE_BUCKET=beats-events-prod
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_URL_BASE=https://beats-events-prod.s3.ap-south-1.amazonaws.com

# OTP (Twilio — required for real SMS in production)
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Email (optional)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=noreply@beats.com

# Logging
LOG_LEVEL=info
```

**S3 bucket policy:** ensure the IAM user/role used by the backend has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the bucket. Make uploaded media publicly readable (or serve via CloudFront) if the user app displays cover images by URL.

### 4.2 User app — build-time env

Set in Vercel / CI before `pnpm build:user`:

```env
NEXT_PUBLIC_API_URL=https://api.beats.com
NEXT_PUBLIC_ORGANISER_URL=https://organiser.beats.com
```

### 4.3 Organiser app — build-time env

Vite bakes these into the bundle at **build time**:

```env
VITE_API_URL=https://api.beats.com
VITE_USER_APP_URL=https://beats.com
```

### 4.4 Admin app — build-time env

```env
VITE_API_URL=https://api.beats.com
```

> **Important:** `VITE_*` and `NEXT_PUBLIC_*` variables are embedded at build time. If you change API URL, you must **rebuild and redeploy** the frontend — restarting the server alone is not enough for Vite apps.

---

## 5. Deployment option A — Recommended (managed + containers)

Best for production traffic, team ownership, and growth.

### Step 1 — Provision infrastructure

1. **PostgreSQL** with PostGIS extension enabled.
2. **Redis** instance (same VPC/region as API if possible).
3. **S3 bucket** for event media uploads.
4. **OpenSearch** domain (or a single-node OpenSearch container on a private network for smaller deployments).
5. **TLS certificates** (ACM on AWS, or Let's Encrypt).

### Step 2 — Deploy backend API

**Example: Docker on ECS / Railway / Render**

1. Build a Docker image from `backend-beat/` (see [Section 8](#8-sample-dockerfile-backend)).
2. Set all env vars from [Section 4.1](#41-backend--production-env).
3. Expose port `3000` behind HTTPS (`api.beats.com`).
4. Run migrations on deploy:

   ```bash
   npm run migration:run
   ```

5. Health check: `GET https://api.beats.com/api/docs` (Swagger) or a dedicated `/health` endpoint if you add one.

### Step 3 — Deploy User app (Next.js)

**Vercel (simplest):**

1. Connect repo, set root directory to `beat-frontend/apps/user`.
2. Build command: `cd ../.. && pnpm install && pnpm build:user` (or use Nx from monorepo root).
3. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ORGANISER_URL` in Vercel env.
4. Point `beats.com` DNS to Vercel.

**Alternative:** run `next start` in a Node container with the same env vars.

### Step 4 — Deploy Organiser + Admin (static SPAs)

1. Build with production `VITE_API_URL`:

   ```bash
   VITE_API_URL=https://api.beats.com pnpm build:organiser
   VITE_API_URL=https://api.beats.com pnpm build:admin
   ```

2. Upload `dist/apps/organiser` and `dist/apps/admin` to static hosting:
   - **S3 + CloudFront** (configure SPA fallback: all routes → `index.html`)
   - **Netlify** / **Vercel** (static site mode)

3. Map DNS:
   - `organiser.beats.com` → organiser bucket/distribution
   - `admin.beats.com` → admin bucket/distribution

### Step 5 — Post-deploy checks

- [ ] `https://api.beats.com/api/docs` loads Swagger
- [ ] User app loads events from API (no CORS errors in browser console)
- [ ] Organiser login + OTP flow works (Twilio configured)
- [ ] Cover image upload succeeds (S3 credentials + bucket policy)
- [ ] Redis connected (no `ECONNREFUSED 6379` in API logs)
- [ ] OpenSearch connected (search endpoints respond)

---

## 6. Deployment option B — Single VPS (Docker Compose)

Good for **staging**, **early production**, or **cost-sensitive** deployments. Run everything on one server (e.g. 4 GB RAM minimum).

### 6.1 Stack on one machine

```
Internet
   │
   ▼
┌──────────────────────────────────────┐
│  Nginx (443) + Let's Encrypt         │
│  beats.com / organiser / admin / api │
└──────────────┬───────────────────────┘
               │
    ┌──────────┼──────────┬─────────────┐
    ▼          ▼          ▼             ▼
 user:3004  organiser   admin      api:3000
 (Next)     (static)    (static)   (NestJS)
               │
    ┌──────────┼──────────┬─────────────┐
    ▼          ▼          ▼             ▼
 postgres   redis      minio/s3    opensearch
```

### 6.2 Start supporting services

The repo already includes `backend-beat/docker-compose-local.yml` with MinIO, Redis, OpenSearch, and MailDev. For production on a VPS, add PostgreSQL and run:

```bash
cd backend-beat
docker compose -f docker-compose-local.yml up -d redis minio opensearch
```

Use a managed PostgreSQL or add a `postgres` service with the `postgis/postgis` image.

### 6.3 Build and run apps on the server

```bash
# Backend
cd backend-beat && npm ci && npm run build && npm run migration:run
NODE_ENV=production npm run start:prod &

# Frontend
cd beat-frontend && pnpm install && pnpm build
cd apps/user && pnpm start &

# Serve organiser + admin static files via nginx (see Section 9)
```

### 6.4 When to move off Option B

Move to Option A when you need:

- Auto-scaling API under load
- Managed DB backups / failover
- Separate staging and production environments
- CDN for global users

---

## 7. Deployment option C — Oracle Cloud Infrastructure (OCI)

Use this when deploying the **backend API** on Oracle Cloud. The NestJS app (`backend-beat/`) requires PostgreSQL with PostGIS, Redis, object storage, and optional OpenSearch.

### 7.1 Recommended OCI architecture

```
Internet
   │
   ▼
OCI Load Balancer (HTTPS, api.yourdomain.com)
   │
   ▼
Compute Instance (Ubuntu) — NestJS API :3000
   │
   ├── OCI PostgreSQL (with PostGIS)
   ├── OCI Cache with Redis
   ├── Oracle Object Storage (media uploads)
   └── OpenSearch on VM (optional) OR SEARCH_PROVIDER=database
```

### 7.2 Oracle service mapping

| Beat component | Oracle service |
|----------------|----------------|
| API | **Compute Instance** (or **Container Instance** / **OKE** later) |
| Database | **OCI PostgreSQL** (or PostgreSQL + PostGIS on a VM) |
| Redis | **OCI Cache with Redis** |
| File uploads | **Oracle Object Storage** (S3-compatible API) |
| HTTPS / routing | **OCI Load Balancer** + **OCI Certificates** |
| DNS | **OCI DNS** (or your registrar) |

### 7.3 Backend dependencies

| Service | Required? | Used for |
|---------|-----------|----------|
| PostgreSQL + PostGIS | Yes | Primary DB; `geography` columns for location search |
| Redis | Yes | BullMQ job queues (search sync, analytics) |
| Object storage | Yes | Event media uploads (`STORAGE_PROVIDER=minio` or `s3`) |
| OpenSearch | Optional | Event search; set `SEARCH_PROVIDER=database` to skip |
| Twilio | Yes (prod) | SMS OTP |
| SendGrid | Optional | Transactional email |

> **Note:** There is no committed `Dockerfile` in the repo yet — see [Section 8](#8-sample-dockerfile-backend) for a sample, or run Node directly on a Compute instance.

### 7.4 Phase 1 — Provision Oracle resources

#### Step 1: Create a VCN

In the OCI Console:

1. Create a **VCN** with public and private subnets.
2. Open security rules for:
   - **443** — load balancer
   - **22** — SSH to compute (restrict to your IP)
   - Internal access from the API VM → PostgreSQL, Redis, Object Storage

#### Step 2: Create PostgreSQL (with PostGIS)

1. Provision **OCI PostgreSQL** (or run `postgis/postgis` on a VM).
2. Create database and user (e.g. `beats_prod`).
3. After the DB is ready, connect and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

PostGIS is **required** — migrations use `geography(Point,4326)`.

#### Step 3: Create Redis

1. Provision **OCI Cache with Redis**.
2. Note the host and port (usually `6379`).

#### Step 4: Create Object Storage bucket

1. Create a bucket (e.g. `beats-events-prod`).
2. Create an **S3-compatible API key** (Customer Secret Key).
3. Note the namespace, region, and bucket name.

**Important:** The current `S3Provider` uses standard AWS S3 configuration only and does **not** set a custom Oracle endpoint. For Oracle Object Storage you can either:

- **Short term:** run MinIO on the same VM (`STORAGE_PROVIDER=minio`), or
- **Production:** extend `S3Provider` to support Oracle's S3-compatible endpoint:
  `https://<namespace>.compat.objectstorage.<region>.oraclecloud.com`

Until that change is made, uploads via `STORAGE_PROVIDER=s3` to Oracle Object Storage may fail.

#### Step 5: Create Compute Instance

Recommended minimum:

| Resource | Value |
|----------|-------|
| Shape | 2 OCPU / 4 GB RAM (8 GB if running OpenSearch on the same VM) |
| OS | Ubuntu 22.04+ |
| Network | Public IP or load-balancer-only access |

### 7.5 Phase 2 — Production environment variables

Create `backend-beat/.env.production` on the server. **Never commit production secrets to git.**

```env
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://your-user-app.com,https://organiser.yourdomain.com,https://admin.yourdomain.com

# PostgreSQL
POSTGRES_HOST=<oci-postgres-host>
POSTGRES_PORT=5432
POSTGRES_USER=beats_prod
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=beats_prod

# Auth
JWT_SECRET=<long-random-secret>

# Redis
REDIS_HOST=<oci-redis-host>
REDIS_PORT=6379

# Search — start without OpenSearch
SEARCH_PROVIDER=database
# OPENSEARCH_NODE=http://<opensearch-host>:9200

# Storage — use MinIO on VM until Oracle Object Storage endpoint is configured
STORAGE_PROVIDER=minio
STORAGE_BUCKET=beats-events
STORAGE_MAX_FILE_SIZE_MB=20
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<minio-user>
MINIO_SECRET_KEY=<minio-password>
MINIO_PUBLIC_URL_BASE=https://media.yourdomain.com

# OTP
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

LOG_LEVEL=info
```

When Oracle Object Storage is wired into `S3Provider`, switch to:

```env
STORAGE_PROVIDER=s3
STORAGE_BUCKET=beats-events-prod
AWS_REGION=<oci-region>
AWS_ACCESS_KEY_ID=<customer-secret-key-access>
AWS_SECRET_ACCESS_KEY=<customer-secret-key-secret>
S3_PUBLIC_URL_BASE=https://<namespace>.compat.objectstorage.<region>.oraclecloud.com/<bucket>
```

### 7.6 Phase 3 — Deploy the API on Compute

SSH into the VM:

```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Clone repo
git clone <your-repo-url> beats
cd beats/backend-beat

# Install and build
npm ci
npm run build

# Run DB migrations (once per release)
cp .env.production .env
npm run migration:run

# Start API
npm run start:prod
```

Use **PM2** or **systemd** so the process restarts on reboot:

```bash
sudo npm install -g pm2
pm2 start dist/main.js --name beat-api
pm2 save
pm2 startup
```

### 7.7 Phase 4 — Supporting services (if not fully managed)

On the same VM (or a separate VM), start Redis and MinIO via Docker:

```bash
cd backend-beat
docker compose -f docker-compose-local.yml up -d redis minio
# Add opensearch only if SEARCH_PROVIDER=opensearch
```

For production, prefer **OCI Cache with Redis** over Docker Redis.

### 7.8 Phase 5 — HTTPS with OCI Load Balancer

1. Create an **OCI Load Balancer**.
2. Add a backend set pointing to the compute instance on port `3000`.
3. Add a listener on **443** with a TLS certificate.
4. Point DNS: `api.yourdomain.com` → load balancer IP.
5. Allow uploads up to 25 MB (media files).

Verify:

- `GET https://api.yourdomain.com/` — API hello response
- `GET https://api.yourdomain.com/api/docs` — Swagger UI

### 7.9 Docker deploy on OCI (recommended)

Build and push to **OCI Container Registry (OCIR)**:

```bash
docker build -t beat-api .
docker tag beat-api <region>.ocir.io/<tenancy>/beat-api:latest
docker push <region>.ocir.io/<tenancy>/beat-api:latest
```

Deploy the image on **Compute + Docker**, **OCI Container Instances**, or **OKE** with the env vars from [Section 7.5](#75-phase-2--production-environment-variables).

### 7.10 Post-deploy checklist

- [ ] `npm run migration:run` completed without PostGIS errors
- [ ] API starts and connects to PostgreSQL
- [ ] Redis connected (no `ECONNREFUSED 6379` in logs)
- [ ] Login / OTP works (Twilio configured)
- [ ] Media upload works (storage reachable from API)
- [ ] CORS allows your frontend origins
- [ ] Search works (`SEARCH_PROVIDER=database` or OpenSearch running)

### 7.11 OCI-specific risks

| Risk | Mitigation |
|------|------------|
| Media upload fails | Ensure MinIO or Oracle Object Storage is running and reachable |
| Migrations fail on `geography` | Enable PostGIS on PostgreSQL |
| Oracle Object Storage + `STORAGE_PROVIDER=s3` | Extend `S3Provider` with custom endpoint, or use MinIO initially |
| Secrets in git | Use OCI Vault or instance env vars; never deploy with local `.env` |
| CORS errors | Set `CORS_ORIGINS` to exact production frontend URLs |

### 7.12 Suggested OCI rollout order

1. Provision PostgreSQL (+ PostGIS) and Redis.
2. Set up storage (MinIO first, then Oracle Object Storage).
3. Deploy backend API → run migrations → verify Swagger.
4. Configure load balancer + domain.
5. Smoke-test auth, event create, and media upload.
6. Add OpenSearch later if needed (`SEARCH_PROVIDER=opensearch`).

---

## 8. Sample Dockerfile (backend)

Create `backend-beat/Dockerfile` if you deploy with Docker:

```dockerfile
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
CMD ["node", "dist/main"]
```

Build and run:

```bash
docker build -t beat-api .
docker run -p 3000:3000 --env-file .env.production beat-api
```

---

## 9. Sample Nginx config (VPS / self-hosted)

```nginx
# api.beats.com → NestJS
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
        client_max_body_size 25M;  # event media uploads
    }
}

# organiser.beats.com → static SPA
server {
    listen 443 ssl http2;
    server_name organiser.beats.com;

    ssl_certificate     /etc/letsencrypt/live/organiser.beats.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/organiser.beats.com/privkey.pem;

    root /var/www/beat/organiser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# admin.beats.com → static SPA (same pattern as organiser)
# beats.com → proxy to Next.js on 3004
```

---

## 10. CI/CD pipeline (recommended)

Use GitHub Actions (or GitLab CI) with this flow:

```yaml
# High-level stages — adapt to your host (Vercel, ECS, VPS)

on:
  push:
    branches: [main]

jobs:
  backend:
    steps:
      - npm ci && npm run build && npm run test
      - docker build & push  # or deploy to Railway/Render
      - run migrations on target environment

  frontend:
    steps:
      - pnpm install --frozen-lockfile
      - pnpm build
      - deploy user → Vercel
      - deploy organiser/admin static → S3 sync
```

**Rules:**

1. Run `migration:run` on backend deploy **before** switching traffic to the new API version.
2. Build frontends with **production** `VITE_*` / `NEXT_PUBLIC_*` values in CI secrets.
3. Never deploy with `NODE_ENV=development` in production (MinIO credentials default to empty otherwise).

---

## 11. Database migrations

Always run migrations as part of deployment:

```bash
cd backend-beat
npm run migration:run
```

Rollback (emergency only):

```bash
npm run migration:revert
```

PostgreSQL **must** have PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 12. Storage: MinIO vs S3

| Environment | `STORAGE_PROVIDER` | Notes |
|-------------|-------------------|--------|
| Local dev | `minio` | Use `docker-compose-local.yml` |
| Staging VPS | `minio` or `s3` | MinIO OK on same server |
| Production (AWS) | **`s3`** | Durable, CDN-friendly, IAM policies |
| Production (OCI) | **`s3`** or **`minio`** | Oracle Object Storage is S3-compatible; custom endpoint may be required in `S3Provider` |

If you see `Access Denied` on upload in dev, verify `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` match the MinIO container (`minioadmin` / `minioadmin` in local compose).

---

## 13. Common production failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ECONNREFUSED 127.0.0.1:6379` | Redis not running | Start Redis or set `REDIS_HOST` to managed instance |
| `Access Denied` on image upload | Wrong MinIO/S3 credentials or bucket policy | Fix IAM / MinIO user permissions |
| CORS error in browser | Frontend origin not in `CORS_ORIGINS` | Add exact `https://` origin, no trailing slash |
| API works locally, frontends fail | Wrong build-time API URL | Rebuild with correct `VITE_API_URL` / `NEXT_PUBLIC_API_URL` |
| OTP not received | Twilio not configured | Set Twilio env vars; check Twilio console logs |
| Search errors | OpenSearch down | Start OpenSearch or set `OPENSEARCH_NODE` |
| Migration fails on `geography` | PostGIS missing | Enable PostGIS extension on database |

---

## 14. Minimum server sizing (Option B / OCI)

| Resource | Minimum |
|----------|---------|
| VPS RAM | 4 GB (8 GB recommended with OpenSearch) |
| CPU | 2 vCPU |
| Disk | 40 GB SSD (+ object storage for media) |

OpenSearch alone needs ~512 MB–1 GB heap (`OPENSEARCH_JAVA_OPTS` in compose).

---

## 15. Quick reference — local vs production

| | Local | Production |
|---|-------|------------|
| User URL | http://localhost:3004 | https://beats.com |
| Organiser URL | http://localhost:3001 | https://organiser.beats.com |
| Admin URL | http://localhost:3002 | https://admin.beats.com |
| API URL | http://localhost:3000 | https://api.beats.com |
| Storage | MinIO (docker) | AWS S3 |
| Redis | Docker | Managed Redis |
| DB | Local PostgreSQL | RDS / Supabase / OCI PostgreSQL |

---

## 16. Suggested rollout order

1. Provision PostgreSQL (+ PostGIS), Redis, S3, OpenSearch.
2. Deploy **backend API** → run migrations → verify Swagger.
3. Deploy **admin** (smallest audience) → smoke test.
4. Deploy **organiser** → test event create, media upload, submit.
5. Deploy **user** app → test public event listing and auth.
6. Configure monitoring (API logs, DB connections, S3 errors, Redis health).

---

For local development setup, see the root [README.md](../README.md).
