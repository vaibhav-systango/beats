# Beats

Event ticketing platform monorepo — NestJS API, Next.js consumer app, and Vite dashboards for organisers and admins.

## Project structure

```
beats/
├── backend-beat/              # NestJS API (PostgreSQL + TypeORM)
│   └── docker-compose-local.yml  # MinIO for local object storage
└── beat-frontend/             # Nx monorepo (pnpm)
    ├── apps/
    │   ├── user/       # Next.js — public consumer app (port 3004)
    │   ├── organiser/  # Vite + React — organiser dashboard (port 3001)
    │   └── admin/      # Vite + React — admin console (port 3002)
    └── packages/       # Shared libs (api-client, core, types, ui, utils)
```

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x or later |
| pnpm | 9.x (frontend) |
| npm | 10.x (backend) |
| PostgreSQL | 15+ with **PostGIS** extension |
| Docker | Optional, for PostgreSQL (PostGIS) and MinIO locally |

## Quick start

### 1. Clone the repository

```bash
git clone <repository-url>
cd beats
```

### 2. Start PostgreSQL

The backend uses PostGIS for event location data. Run PostgreSQL with PostGIS via Docker:

```bash
docker run --name beats-postgres \
  -e POSTGRES_USER=beats \
  -e POSTGRES_PASSWORD=beats \
  -e POSTGRES_DB=beats \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

Or use an existing PostgreSQL instance and enable PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Start MinIO (optional)

The backend supports MinIO (local) or S3 (production) for file uploads such as event assets. For local development, start MinIO via Docker Compose:

```bash
cd backend-beat
docker compose -f docker-compose-local.yml up -d
```

MinIO API: **http://localhost:9000**  
MinIO console: **http://localhost:9001** (login: `minioadmin` / `minioadmin`)

Defaults in the backend `.env` (see below) match this setup. Set `STORAGE_PROVIDER=s3` and AWS credentials to use S3 instead.

### 4. Backend setup

```bash
cd backend-beat
npm install
```

Create a `.env` file in `backend-beat/`:

```env
# Server
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:3004

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=beats
POSTGRES_PASSWORD=beats
POSTGRES_DB=beats

# Auth
JWT_SECRET=your-local-jwt-secret-change-in-production

# OTP (Twilio — optional locally; OTP is logged to the API console when unset)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Object storage (defaults match docker-compose-local.yml MinIO)
STORAGE_PROVIDER=minio
STORAGE_BUCKET=beats-events
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

Run database migrations:

```bash
npm run migration:run
```

Start the API in development mode:

```bash
npm run start:dev
```

The API runs at **http://localhost:3000**.  
Swagger docs: **http://localhost:3000/api/docs**

### 5. Frontend setup

```bash
cd beat-frontend
pnpm install
```

Copy environment files for each app:

```bash
cp apps/user/.env.example apps/user/.env
cp apps/organiser/.env.example apps/organiser/.env
cp apps/admin/.env.example apps/admin/.env
```

Default values:

| App | File | Key variables |
|-----|------|---------------|
| User | `apps/user/.env` | `NEXT_PUBLIC_API_URL=http://localhost:3000` |
| Organiser | `apps/organiser/.env` | `VITE_API_URL=http://localhost:3000` |
| Admin | `apps/admin/.env` | `VITE_API_URL=http://localhost:3000` |

Start all frontend apps:

```bash
pnpm dev
```

Or start a single app:

```bash
pnpm dev:user        # http://localhost:3004
pnpm dev:organiser   # http://localhost:3001
pnpm dev:admin       # http://localhost:3002
```

## Local URLs

| Service | URL |
|---------|-----|
| User app | http://localhost:3004 |
| Organiser dashboard | http://localhost:3001 |
| Admin console | http://localhost:3002 |
| Backend API | http://localhost:3000 |
| API docs (Swagger) | http://localhost:3000/api/docs |
| MinIO API | http://localhost:9000 |
| MinIO console | http://localhost:9001 |

## Common commands

### Backend (`backend-beat/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start API with hot reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:generate --name=MigrationName` | Generate a new migration |
| `npm run migration:create --name=MigrationName` | Create an empty migration file |
| `npm run test` | Run unit tests |
| `npm run lint` | Lint source files |

### Frontend (`beat-frontend/`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start user, organiser, and admin apps |
| `pnpm dev:user` | Start user app only |
| `pnpm dev:organiser` | Start organiser app only |
| `pnpm dev:admin` | Start admin app only |
| `pnpm build` | Build all apps |
| `pnpm build:user` | Build user app only |
| `pnpm start:user` | Run production build of user app |
| `pnpm preview:organiser` | Preview organiser production build |
| `pnpm preview:admin` | Preview admin production build |
| `pnpm lint` | Lint all projects |
| `pnpm format` | Format code with Prettier |

## Environment variables reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default: `3000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `POSTGRES_HOST` | Yes | Database host |
| `POSTGRES_PORT` | No | Database port (default: `5432`) |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for signing JWT access tokens |
| `TWILIO_ACCOUNT_SID` | No* | Twilio account SID for OTP delivery |
| `TWILIO_AUTH_TOKEN` | No* | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No* | Twilio sender phone number |
| `STORAGE_PROVIDER` | No | `minio` (default) or `s3` |
| `STORAGE_BUCKET` | No | Bucket name (default: `beats-events`) |
| `STORAGE_MAX_FILE_SIZE_MB` | No | Max upload size in MB (default: `20`) |
| `MINIO_ENDPOINT` | No* | MinIO host (default: `localhost`) |
| `MINIO_PORT` | No | MinIO port (default: `9000`) |
| `MINIO_ACCESS_KEY` | No* | MinIO access key (default: `minioadmin` in dev) |
| `MINIO_SECRET_KEY` | No* | MinIO secret key (default: `minioadmin` in dev) |
| `MINIO_USE_SSL` | No | Set to `true` for HTTPS (default: `false`) |
| `MINIO_PUBLIC_URL_BASE` | No | Public base URL for uploaded files |
| `AWS_REGION` | No** | AWS region when `STORAGE_PROVIDER=s3` |
| `AWS_ACCESS_KEY_ID` | No** | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | No** | AWS secret key for S3 |
| `S3_PUBLIC_URL_BASE` | No | Public base URL for S3 objects |
| `LOG_LEVEL` | No | Pino log level (default: `info`) |

\*Twilio is optional for local dev — without it, OTP codes are written to the API console log. Required for real SMS/voice delivery in production.

\*\*Required when `STORAGE_PROVIDER=s3`.

Optional OTP tuning (defaults are fine for local dev):

- `OTP_BLOCK_DURATION_MS`, `OTP_VALIDITY_DURATION_MS`, `OTP_THROTTLE_DURATION_MS`
- `MAX_OTP_ATTEMPTS`, `MAX_OTP_GUESSES`, `OTP_LENGTH`
- `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`

### Frontend

| App | Variable | Description |
|-----|----------|-------------|
| User | `NEXT_PUBLIC_API_URL` | Backend API base URL |
| User | `NEXT_PUBLIC_ORGANISER_URL` | Organiser app URL |
| Organiser | `VITE_API_URL` | Backend API base URL |
| Organiser | `VITE_USER_APP_URL` | User app URL |
| Admin | `VITE_API_URL` | Backend API base URL |

## Troubleshooting

### Frontend cannot reach the API

- Confirm the backend is running and `PORT` matches `NEXT_PUBLIC_API_URL` / `VITE_API_URL`.
- Check `CORS_ORIGINS` includes every frontend origin (`http://localhost:3001`, `http://localhost:3002`, `http://localhost:3004`). Set it explicitly in `.env` — the built-in fallback omits the admin port.

### Migration fails on `geography` type

PostgreSQL must have PostGIS installed. Use the `postgis/postgis` Docker image or run `CREATE EXTENSION postgis;` on your database.

### `pnpm install` fails

The frontend monorepo pins `pnpm@9.15.9`. Install it globally:

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

### OTP / login not working

- **Local dev without Twilio:** Leave Twilio vars empty. After calling `POST /auth/send-otp`, check the API console for a log line like `Simulated SMS OTP 123456 to +91...` and use that code in `POST /auth/verify-otp`.
- **Production / real SMS:** Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in `backend-beat/.env`.

### File uploads fail or storage health check warns

Ensure MinIO is running (`docker compose -f docker-compose-local.yml up -d` in `backend-beat/`) and that `MINIO_*` values match the container credentials. The backend auto-creates the `beats-events` bucket on first use.

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | NestJS 11, TypeORM, PostgreSQL, PostGIS, JWT, Twilio, Pino, MinIO/S3 |
| User app | Next.js 14, React 18, Tailwind CSS |
| Dashboards | Vite, React 18, React Router, TanStack Query, Zustand |
| Monorepo | Nx, pnpm workspaces |
| Shared | TypeScript, shared API client and UI packages |
