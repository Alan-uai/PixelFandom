# AGENTS.md — PixelFandom / Multi-Tenant Wiki Platform

## Project Identity

**PixelFandom** — Multi-tenant wiki platform (like Fandom/Notion/GitBook). Next.js 15 App Router, Supabase (PostgreSQL), TipTap editor, OpenRouter AI, shadcn/ui, Zustand, Framer Motion. Default language: pt-BR (UI), English (code).

Each user creates their own wiki with custom domains, Discord integration, and per-wiki AI assistant.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with **Turbopack on port 9002** |
| `npm run build` | Production build (`NODE_ENV=production`) — ignores TS & ESLint errors |
| `npm run lint` | `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

No test command configured (Playwright is a dep but unused).

## Architecture

```
src/
  app/                Next.js App Router
    (marketing)/      Hub & landing pages
    (dashboard)/      Wiki management (settings, members, domains, collections)
    (wiki)/           Public wiki view ([[...slug]])
    api/              API routes (chat, tenants, domains)
  ai/flows/           Server actions for AI workflows
  supabase/           Supabase client, auth provider, hooks, manual DB types
  components/         React components (chat/, ui/ shadcn, dashboard/)
  lib/                Zustand store, types, utils, openrouter, tenant utils
  context/            AppProvider
data/pixel-blade/     Static game data JSON files (fallback)
supabase/
  migrations/         SQL migrations (001-004 legacy, 005-007 multi-tenant)
  SCHEMA.md           Database schema reference
```

## Route Groups

| Route | Purpose |
|---|---|
| `/` | Hub — landing page + grid of public wikis |
| `/dashboard` | User's wikis list + create new |
| `/dashboard/[slug]/settings` | Wiki config (name, theme, logo) |
| `/dashboard/[slug]/domains` | Domain management (Vercel API) |
| `/dashboard/[slug]/members` | Member roles management |
| `/dashboard/[slug]/ai` | Per-wiki AI assistant config |
| `/dashboard/[slug]/collections` | Custom collections (schemas + data) |
| `/dashboard/[slug]/editor/[id]` | TipTap article editor |
| `/w/[slug]/[...path]` | Public wiki page view |
| `/api/chat` | Chat endpoint (tenant-aware via header) |

## Database (Supabase)

### Multi-Tenant Tables (migrations 005-007)
- `tenants` — wiki spaces (slug, custom_domain, theme, ai_config)
- `tenant_members` — user roles per wiki (owner, admin, editor, viewer)
- `discord_guilds` — Discord server to tenant mapping
- `custom_collections` — flexible per-wiki data schemas
- `collection_items` — JSONB data rows in collections

### Existing Tables (with tenant_id added)
- `wiki_articles` — articles with TipTap content
- `content_suggestions` — user-submitted suggestions
- `negative_feedback` — AI feedback reports
- `saved_answers` — user-saved chat responses

### Game Data (Pixel Blade seed tenant)
- 9 collections: weapons, armors, rings, potions, upgrades, worlds, enemies, bosses, codes
- Seeded via migration 007 from existing SQL tables into `custom_collections`/`collection_items`
- Pixel Blade tenant ID: `00000000-0000-0000-0000-000000000001`

## Key Quirks

- **Layout is `'use client'`** — cannot export `metadata`. Title/description set via `<head>` tags in layout.tsx. Each route group has its own layout.
- **`next.config.ts`** has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`.
- **Two AI paths coexist:**
  - `src/app/api/chat/route.ts` — simple streaming endpoint
  - `src/lib/openrouter-client.ts` — OpenRouter SDK with fallback chain, tool calling, structured output
- **No generated Supabase types** — `Database` type defined manually in `src/supabase/client.ts`. Must be kept in sync with schema.
- **Middleware** (`src/middleware.ts`) detects hostname, routes to correct tenant.
- **shadcn/ui** — managed via `components.json`, uses `@/components/ui/` alias.
- **Dark theme only** — `globals.css` sets dark-mode CSS variables.

## Important Files

- `src/lib/tenant.ts` — server actions for tenant lookup, caching, member checks
- `docs/ai-rules.md` — strict AI behavior rules
- `docs/blueprint.md` — brand guidelines
- `data/pixel-blade/*.json` — static game data for Pixel Blade

## Environment

Required env vars (see `.env`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `FALLBACK_CHAIN` — comma-separated model IDs for fallback
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`
- `VERCEL_API_TOKEN` (for custom domain API)
