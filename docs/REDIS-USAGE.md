# Beat Backend — Redis Usage Reference

> Source: `backend-beat/` codebase inspection. Copy-friendly summary for Upstash / deployment planning.

---

## Summary

Redis is used for **BullMQ job queues** AND **direct ioredis reads/writes** for trending searches.

Redis is **NOT** used for general app caching (`CacheService` = in-memory `Map`).

**Production today:** Redis is effectively **required**. Event create/update/delete flows enqueue BullMQ jobs without error handling — API requests can fail if Redis is down.

---

## Connection config

Shared helper: `backend-beat/src/config/redis.configuration.ts` (`buildRedisOptions`).
Used by BullMQ (`app.module.ts`) and `REDIS_CLIENT` (`search.provider.ts`).

### Stop Upstash "max requests limit exceeded" log spam

BullMQ workers poll Redis continuously. On Upstash free tier this burns the 500k monthly request quota, then floods logs with `ReplyError`.

**Immediate fix on Railway:**

```env
BULLMQ_ENABLED=false
REDIS_ENABLED=false
```

Redeploy. Workers stop. API keeps running (search sync / trending become no-ops).

**Long-term:** use Redis without a hard request limit (Railway Redis, Redis Cloud, Docker), then set both back to `true`.

**Do not run BullMQ on Upstash free tier** — polling is incompatible with request-based billing.

### Local (Docker Redis)

```env
BULLMQ_ENABLED=true
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Production (managed Redis with no request cap)

```env
BULLMQ_ENABLED=true
REDIS_ENABLED=true
REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<password>
REDIS_TLS=true
```

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Auth password (omit for local) |
| `REDIS_TLS` | No | — | Set `true` to enable TLS |
| `BULLMQ_ENABLED` | No | `true` | Set `false` to disable queues/workers |
| `REDIS_ENABLED` | No | `true` | Set `false` to skip Redis client |

---

## Two Redis usage paths

| Path | Library | Purpose |
|------|---------|---------|
| BullMQ | `@nestjs/bullmq` | Job queues |
| Direct client | `ioredis` via `REDIS_CLIENT` | Trending search sorted set |

### Direct Redis keys

| Key | Type | Read | Write |
|-----|------|------|-------|
| `search-analytics:counts` | Sorted set | `getTrendingSearches()` | `SearchAnalyticsProcessor` |
| `search-analytics:timestamps` | Hash | — | `SearchAnalyticsProcessor` |

---

## Queues (exactly 2)

Registered in `backend-beat/src/modules/search/search.module.ts`:

| Queue | Processor class | File |
|-------|-----------------|------|
| `search-sync` | `SearchSyncProcessor` | `processors/search-sync.processor.ts` |
| `search-analytics` | `SearchAnalyticsProcessor` | `processors/search-analytics.processor.ts` |

---

## Jobs

### Queue: `search-sync`

| Job name | Payload | What worker does |
|----------|---------|------------------|
| `upsert-event` | `{ eventId }` | Load published event + active sessions from Postgres → `searchService.bulkIndexSessions()` |
| `delete-event` | `{ eventId }` | `searchService.deleteEventDocuments(eventId)` |
| `delete-session` | `{ sessionId }` | `searchService.deleteSession(sessionId)` |

**Enqueued from** `events.service.ts` on:
- `createEvent` → `upsert-event`
- `updateEvent` → `upsert-event`
- `submitEvent` → `upsert-event`
- `softDeleteEvent` → `delete-event`
- `createSession` → `upsert-event`
- `updateSession` → `upsert-event`
- `deleteSession` → `delete-session`
- `reviewEvent` (admin approve/reject) → `upsert-event`
- `cancelEvent` (admin) → `delete-event`

### Queue: `search-analytics`

| Job name | Payload | What worker does |
|----------|---------|------------------|
| `track-search` | `{ query }` | `ZINCRBY search-analytics:counts` + `HSET search-analytics:timestamps` |

**Enqueued from** `events.service.ts` when user searches with a `search` query param (discovery endpoint). Uses `.catch()` — non-blocking.

---

## Workers

- **Yes**, two `@Processor` classes exist.
- **No separate worker process** — workers run inside the same NestJS API process.
- Scaling API replicas = multiple competing queue consumers.

---

## Critical vs optional

| Feature | Critical? | Notes |
|---------|-----------|-------|
| Event/session CRUD (enqueue) | **Yes** | `searchSyncQueue.add()` awaited without `.catch()` |
| OpenSearch index sync | **Yes** if `SEARCH_PROVIDER=opensearch` | Index goes stale if jobs fail |
| OpenSearch index sync | **No-op** if `SEARCH_PROVIDER=database` | Jobs run but index methods are no-ops |
| Search analytics (`track-search`) | **No** | Enqueue has `.catch()` |
| Trending searches API | **No** | Returns `[]` if Redis read fails |
| Auth, uploads, email | **No** | No Redis dependency |

---

## Can the app run without Redis?

| Scenario | Works? |
|----------|--------|
| App startup | Probably (no hard Redis gate at bootstrap) |
| Event create/update/delete | **Likely fails** when enqueueing jobs |
| Search (`SEARCH_PROVIDER=database`) | Yes — queries Postgres |
| Search (`SEARCH_PROVIDER=opensearch`) | Yes if index exists; sync won't run |
| `GET /events/trending-searches` | Yes — returns empty list |
| Auth / OTP / uploads | Yes |

---

## Features that depend on Redis

| Feature | Depends on Redis? |
|---------|-------------------|
| Event create / update / delete | **Yes** (BullMQ enqueue) |
| Session create / update / delete | **Yes** (BullMQ enqueue) |
| Admin review / cancel event | **Yes** (BullMQ enqueue) |
| OpenSearch index sync | **Yes** (BullMQ worker) |
| Search query execution | **No** (Postgres or OpenSearch) |
| Trending searches | **Yes** (direct Redis read) |
| Search analytics tracking | **Yes** (BullMQ + Redis write) |
| Discovery list cache | **No** (in-memory `CacheService`) |
| JWT / OTP / Twilio | **No** |
| S3 / MinIO uploads | **No** |
| SendGrid email | **No** |

---

## Upstash checklist

- [ ] Redis instance provisioned
- [ ] Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS=true`
- [ ] Set `SEARCH_PROVIDER=database` to skip OpenSearch (optional cost save)
- [ ] Verify event create works after Redis is connected
- [ ] Verify `GET /api/v1/events/trending-searches` returns data after searches

---

## Key source files

```
backend-beat/src/config/redis.configuration.ts          # buildRedisOptions (shared)
backend-beat/src/app.module.ts                          # BullModule.forRootAsync
backend-beat/src/modules/search/search.module.ts        # Queue registration
backend-beat/src/modules/search/search.provider.ts      # REDIS_CLIENT
backend-beat/src/modules/search/processors/search-sync.processor.ts
backend-beat/src/modules/search/processors/search-analytics.processor.ts
backend-beat/src/modules/search/services/database-search.service.ts   # trending read
backend-beat/src/modules/search/services/opensearch-search.service.ts
backend-beat/src/modules/events/services/events.service.ts            # job producers
backend-beat/src/providers/cache/cache.service.ts       # NOT Redis (in-memory Map)
```

---

## Env template (local Docker Redis)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
SEARCH_PROVIDER=database
```

## Env template (Upstash)

```env
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>
REDIS_TLS=true
SEARCH_PROVIDER=database
```