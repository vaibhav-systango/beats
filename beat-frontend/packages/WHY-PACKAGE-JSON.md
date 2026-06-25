# Why Each Shared Package Has Its Own `package.json`

This document explains why `@beat/types`, `@beat/api-client`, `@beat/ui`, and `@beat/utils` each have a separate `package.json`, even though they live inside one repo (`beat-frontend`).

---

## Short answer

Each shared folder is treated as an **independent npm package** inside a **monorepo**. Its `package.json` tells the tooling:

- what the package is called (`@beat/types`)
- what it depends on (axios, react, other `@beat/*` packages)
- where its entry point is (`main` / `types`)
- what scripts it can run on its own (e.g. `lint`)

Without a `package.json` per package, pnpm/Nx/apps would not know how to link, install, or build them cleanly.

---

## How this repo is organized

```
beat-frontend/                    ← root workspace (one git repo)
├── package.json                  ← workspace root scripts & dev tooling
├── pnpm-workspace.yaml           ← declares apps/* and packages/*
├── tsconfig.base.json            ← TypeScript path aliases (@beat/*)
├── apps/
│   ├── user/                     ← Next.js app (has its own package.json)
│   ├── organiser/                ← Vite app (has its own package.json)
│   └── admin/                    ← Vite app (has its own package.json)
└── packages/
    ├── types/                    ← shared package (has its own package.json)
    ├── api-client/
    ├── ui/
    └── utils/
```

There is **one repository**, but **multiple packages**. That pattern is called a **monorepo**.

---

## What `package.json` does for a shared package

| Field | Purpose in this project |
|-------|-------------------------|
| `name` | Unique import name, e.g. `@beat/api-client` |
| `version` | Version label (mostly internal while `private: true`) |
| `private: true` | Package is not published to npm; used only inside this repo |
| `main` / `types` | Entry file for bundlers and TypeScript |
| `dependencies` | Libraries **this package needs** to work |
| `peerDependencies` | Libraries the **consumer app** must provide (e.g. React for UI) |
| `scripts` | Commands Nx/pnpm can run for this package alone |

### Example: organiser app importing a shared package

In `apps/organiser/package.json`:

```json
"dependencies": {
  "@beat/api-client": "workspace:*",
  "@beat/types": "workspace:*"
}
```

`workspace:*` means: *link to the local package in `packages/`, not npm registry*.

pnpm reads each package's `package.json`, wires the dependency graph, and installs everything once at the repo root.

---

## Why not one single `package.json` at the root?

If all shared code lived under root with **no per-package `package.json`**:

| Problem | What goes wrong |
|---------|-----------------|
| No package identity | Apps cannot declare `@beat/api-client` as a dependency |
| Dependency blur | axios, react-query, tailwind helpers would all sit at root — even apps that don't need them |
| No clear boundaries | Easy to create circular imports and tight coupling |
| Tooling confusion | Nx, ESLint, and bundlers lose per-library targets |
| Harder scaling | Adding `packages/payments` later has no standard pattern |

Separate `package.json` files enforce **clear module boundaries** and **explicit dependencies**.

---

## `package.json` vs `project.json` (Nx)

Each shared package has **both**:

| File | Owned by | Role |
|------|----------|------|
| `package.json` | npm / pnpm ecosystem | Name, deps, entry point, npm scripts |
| `project.json` | Nx | Lint/build targets, tags, project graph |

Example from `packages/api-client/project.json`:

- `projectType: "library"` — Nx treats it as a reusable lib
- `tags: ["scope:shared", "type:api"]` — used for lint rules and dependency constraints
- `targets.lint` — `nx lint api-client` runs ESLint on that package only

**`package.json`** = how Node/pnpm see the package.  
**`project.json`** = how Nx sees and orchestrates the package.

---

## Why each of the four packages exists

### `@beat/types`

**Role:** Shared TypeScript types (`Event`, `User`, `ApiError`, pagination shapes).

**Why its own `package.json`:**

- Zero runtime dependencies — safest layer to import from anywhere
- `api-client`, `ui`, and all apps can depend on types without pulling axios or React
- Prevents apps from duplicating the same interfaces

```json
{
  "name": "@beat/types",
  "dependencies": {}
}
```

---

### `@beat/api-client`

**Role:** HTTP layer — axios instance, API services, React Query hooks.

**Why its own `package.json`:**

- Declares **its own** deps: `axios`, `@tanstack/react-query`, `react`
- Declares dependency on `@beat/types` via `workspace:*`
- User app can import `fetchEvents` without organiser-only code
- Keeps all API integration in one place (constants, services, query keys)

```json
{
  "name": "@beat/api-client",
  "dependencies": {
    "@beat/types": "workspace:*",
    "axios": "^1.7.0",
    "@tanstack/react-query": "^5.62.0",
    "react": "^18.3.0"
  }
}
```

---

### `@beat/ui`

**Role:** Shared UI components (`Button`, `Card`, etc.) and styling helpers (`cn`).

**Why its own `package.json`:**

- UI-specific deps (`clsx`, `tailwind-merge`, `class-variance-authority`) stay out of `types` and `utils`
- `peerDependencies` on `react` / `react-dom` — the **app** owns React version; UI does not bundle its own copy
- All three apps get the same look and components

```json
{
  "name": "@beat/ui",
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

### `@beat/utils`

**Role:** Pure helper functions (e.g. date formatting) with no UI or network code.

**Why its own `package.json`:**

- Lightweight — no extra dependencies today
- Safe to import from server components, client components, and other packages
- Can grow (validation, currency formatting) without touching `ui` or `api-client`

```json
{
  "name": "@beat/utils",
  "dependencies": {}
}
```

---

## How imports work (two mechanisms)

### 1. pnpm workspace linking (`package.json`)

Apps list `@beat/*` in `dependencies`. pnpm symlinks `packages/*` into `node_modules`.

### 2. TypeScript path aliases (`tsconfig.base.json`)

```json
"paths": {
  "@beat/ui": ["packages/ui/src/index.ts"],
  "@beat/types": ["packages/types/src/index.ts"],
  "@beat/utils": ["packages/utils/src/index.ts"],
  "@beat/api-client": ["packages/api-client/src/index.ts"]
}
```

This gives fast editor navigation and type-checking without building dist files during development.

---

## Dependency flow (recommended direction)

```
apps (user, organiser, admin)
        │
        ├──► @beat/ui ──────► @beat/types (optional)
        ├──► @beat/api-client ──► @beat/types
        ├──► @beat/utils
        └──► @beat/types

@beat/types  ←  no dependencies on other @beat packages (foundation layer)
```

Rules this enables:

- **types** never imports from **api-client** or **ui**
- **utils** stays framework-agnostic
- **api-client** owns network + data-fetching deps
- **ui** owns presentation deps

Each `package.json` makes that graph **explicit and enforceable**.

---

## What if we removed `package.json` from packages?

You would lose:

1. **Workspace linking** — `import from '@beat/types'` would break unless you hand-maintain aliases everywhere
2. **Per-package dependencies** — everything would leak to the root
3. **Nx project boundaries** — harder to lint/test one library in isolation
4. **Clear ownership** — no standard place to document what each module is for

You would essentially have a flat `src/` folder with path aliases only — workable for tiny projects, but harder to maintain as Beat grows across three apps.

---

## Summary

| Package | One-line reason for `package.json` |
|---------|-------------------------------------|
| `@beat/types` | Shared contracts; zero deps; imported everywhere |
| `@beat/api-client` | Owns axios/React Query; depends on types |
| `@beat/ui` | Owns React UI deps; shared components across apps |
| `@beat/utils` | Owns pure helpers; kept separate from UI and API |

**`package.json` per package = each shared module is a first-class, named, versioned unit with its own dependency list**, linked together by pnpm workspaces and orchestrated by Nx — even though everything ships from one repository.
