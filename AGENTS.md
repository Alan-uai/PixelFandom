# PixelFandom — Agent Guide

## Stack
- **Next.js 15** (App Router, Turbopack), React 18, TypeScript 5
- **Supabase** (Postgres, Auth, RLS) — skills auto-loaded via `skills-lock.json`
- **shadcn/ui** (Radix primitives), **Tailwind CSS v3**, **Zustand**, **TipTap**
- **OpenRouter** (AI chat with model fallback chain)

## Commands
| Action | Command | Notes |
|--------|---------|-------|
| Dev server | `npm run dev` | Port **9002**, uses Turbopack |
| Build | `npm run build` | Sets `NODE_ENV=production` before `next build` |
| Lint | `npm run lint` | `next lint` |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| No tests | — | Playwright in devDeps but no test script configured |

## Build quirks
- `next.config.ts`: `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — build **will not catch** TS/ESLint errors. Rely on `npm run typecheck` and `npm run lint` separately.
- Recommended order: `lint -> typecheck -> build`

## Structure
- `src/app/` route groups: `(marketing)/`, `(wiki)/`, `(dashboard)/` — each with its own layout
- Wiki pages: `/w/[slug]/[[...path]]` (catch-all, tenant-scoped)
- Dashboard: `/dashboard/[slug]/{ai, collections, domains, editor, members, settings}/`
- API: `/api/chat` (OpenRouter streaming), `/api/tenants`
- Auth callback: `/auth/callback`
- `src/supabase/` — Supabase client, typed Database defs, auth provider, hooks
- `supabase/migrations/` — 001→007 sequential SQL migrations
- `data/pixel-blade/` — static game data JSON fallback
- `@/*` alias → `src/`

## Multi-tenant
- Middleware (`src/middleware.ts`) looks up custom domains → rewrites to `/w/{slug}`
- Domain cookie `x-tenant-slug` set on main domain (`pixelfandom.vercel.app`)
- Tenant-scoped AI config via `tenants.ai_config` JSONB column
- Roles: `owner > admin > editor > viewer`

## Key env vars
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `FALLBACK_CHAIN` (comma-separated model list)
`VERCEL_API_TOKEN` — Vercel Personal Access Token (domínios customizados)
`VERCEL_PROJECT_ID` — ID do projeto Vercel

## Important files
- `docs/ai-rules.md` — strict agent behavior rules (Portuguese). Follow when editing code.
- `docs/blueprint.md` — original app concept (legacy reference)
- `docs/backend.json` — legacy Firestore schema (not actively used)
- `supabase/SCHEMA.md` — full DB schema, tables, enums, RLS
- `.env*` in `.gitignore` — must be provided locally

## Patterns
- **All pages** are `'use client'` (no server components)
- Global state: `AppProvider` wraps `SupabaseProvider` + Zustand chat store
- Game data: fetched from Supabase `game_config` table, falls back to static data
- Dark mode forced: `<html className="dark">` — no theme toggle
- CSS vars define colors (`--primary: 198 100% 65%` = cyan-blue `#4BC5FF`)
