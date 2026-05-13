# AGENTS.md — PixelFandom / Eternal Guide

## Project Identity

**Eternal Guide** ("Guia Eterno") — AI assistant for the Roblox game Anime Eternal, now also covering Pixel Blade. Next.js 15 app with Turbopack, Supabase (PostgreSQL), OpenRouter AI, shadcn/ui, Zustand, Framer Motion. Default language: pt-BR.

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
  app/              Next.js App Router pages + API routes
    api/chat/       Streaming chat endpoint (OpenRouter, gpt-3.5-turbo)
  ai/flows/         Server actions for AI workflows (OpenRouter SDK with tool calling)
  supabase/         Supabase client, auth provider, hooks, manual DB types
  components/       React components (chat/, ui/ shadcn, main-nav, etc.)
  lib/              Zustand store, types, utils, OpenRouter client, personas, styles
  context/          AppProvider (wraps SupabaseProvider)
data/pixel-blade/   Static game data JSON files (fallback when Supabase unavailable)
supabase/
  migrations/       SQL migrations (001 pixel_blade tables, 002 seed, 003 app tables, 004 profiles)
  SCHEMA.md         Database schema reference
```

## Key Quirks

- **Layout is `'use client'`** — cannot export `metadata`. Title/description set via `<head>` tags in layout.tsx.
- **`next.config.ts`** has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — build won't fail on TS/ESLint.
- **Two AI paths coexist:**
  - `src/app/api/chat/route.ts` — simple streaming endpoint (OpenRouter REST, gpt-3.5-turbo)
  - `src/lib/openrouter-client.ts` — OpenRouter SDK with model fallback chain (`FALLBACK_CHAIN` env var), tool calling (`getGameData`, `getUpdateLog`), and structured output
- **No generated Supabase types** — `Database` type defined manually in `src/supabase/client.ts` (~570 lines). Must be kept in sync with schema.
- **Static game data fallback** — `data/pixel-blade/*.json` files used as fallback. `src/lib/game-data-context.ts` contains an empty `allGameData` array placeholder (real data loaded from Supabase at runtime).
- **shadcn/ui** — managed via `components.json`, uses `@/components/ui/` alias, lucide icons, default style, CSS variables for theming.
- **Dark theme only** — `globals.css` sets dark-mode CSS variables. No light mode toggle. `:root` block already contains dark values.
- **OpenCode Supabase skills** loaded in `.opencode/skills/`. Reference `skills-lock.json`.

## Important Files

- `docs/ai-rules.md` — strict AI behavior rules (scope constraints, no unsolicited changes)
- `docs/backend.json` — legacy Firestore data model schema (historical reference; actual backend uses Supabase)
- `docs/blueprint.md` — app concept and style guidelines
- `data/pixel-blade/*.json` — static game data for Pixel Blade

## Environment

Required env vars (see `.env`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `FALLBACK_CHAIN` — comma-separated model IDs for fallback
