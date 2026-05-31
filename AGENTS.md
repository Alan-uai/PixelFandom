# PixelFandom — Agent Guide

## Stack
- **Next.js 15** (App Router, Turbopack), React 18, TypeScript 5
- **Supabase** (Postgres, Auth, RLS) — skills auto-loaded via `skills-lock.json`
- **shadcn/ui** (Radix primitives), **Tailwind CSS v3**, **Zustand**, **TipTap**
- **OpenRouter** + **Gemini** (dual LLM provider system — tenant-level hybrid)

## Commands
| Action | Command | Notes |
|--------|---------|-------|
| Dev server | `npm run dev` | Port **9002**, uses Turbopack |
| Build | `npm run build` | Sets `NODE_ENV=production` before `next build` |
| Docker | `docker compose up --build` | Sobe Next.js (9002) |
| Lint | `npm run lint` | `next lint` |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| No tests | — | Playwright in devDeps but no test script configured |

## Build quirks
- `next.config.ts`: `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` — build **will not catch** TS/ESLint errors. Rely on `npm run typecheck` and `npm run lint` separately.
- Recommended order: `lint -> typecheck -> build`
- Dev API proxy: routes under `/api/{token,rag,session,sessions,mood,goals,profile,profiles,settings,agents,wellington}` rewrite to `$PSYCHO_BACKEND_URL` (default `http://localhost:8000`)

## Structure
- `src/app/` route groups: `(marketing)/`, `(wiki)/`, `(dashboard)/` — each with its own layout
- Wiki pages: `/w/[slug]/[[...path]]` (catch-all, tenant-scoped)
- Dashboard: `/dashboard/{new,[slug]/{ai,discord,domains,editor,members,settings}}`
- API: `/api/chat` (provedor híbrido OpenRouter + Gemini), `/api/tenants`
- Auth callback: `/auth/callback`
- `src/supabase/` — Supabase client, typed Database defs, auth provider, hooks
- `supabase/migrations/` — 021→030 sequential SQL migrations
- `data/pixel-blade/` — static game data JSON fallback
- `public/audio-processors/` — worklets de áudio para o sistema de voz
- `api/token.py` — serverless function para gerar tokens Gemini Live API
- `@/*` alias → `src/`

## Multi-tenant
- Middleware (`src/middleware.ts`) looks up custom domains → rewrites to `/w/{slug}`
- Domain cookie `x-tenant-slug` set on main domain (`pixelfandom.vercel.app`)
- Tenant-scoped AI config via `tenants.ai_config` JSONB column
- Roles: `owner > admin > editor > viewer`

## Key env vars
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `FALLBACK_CHAIN` (comma-separated model list)
`PSYCHO_BACKEND_URL` — Python backend URL for dev API proxy (default `http://localhost:8000`)
`VERCEL_API_TOKEN` — Vercel Personal Access Token (domínios customizados)
`VERCEL_PROJECT_ID` — ID do projeto Vercel
`GEMINI_API_KEY` — Google Gemini API key (sistema de voz e chat de texto)

## Safety rules
- **NUNCA** exclua, modifique ou sobrescreva arquivos `.env*`. Eles contêm credenciais de produção.
- Se precisar de uma nova env var, adicione a chave vazia no `.env.example` ou documente neste guia — nunca altere o `.env` existente.

## Config globais do usuário
- `src/context/user-preferences-context.tsx` — `UserPreferences` com `chat_settings`, `voice_settings`, `theme_preset`
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Configurações globais (Chat, Voz, Tema, Mais)
- **Regra:** Configurações avançadas de chat (modelo, temperatura, max_tokens, provider, system prompt) NÃO são editáveis pelo usuário nesta página. Elas são definidas exclusivamente pelo admin da wiki em `tenants.ai_config`. A página de settings globais só expõe Personalidade, Persona, Emoji, Estilo de Resposta e Idioma.

## Important files
- `docs/ai-rules.md` — strict agent behavior rules (Portuguese). Follow when editing code.
- `docs/blueprint.md` — original app concept (legacy reference)
- `docs/backend.json` — legacy Firestore schema (not actively used)
- `supabase/SCHEMA.md` — full DB schema, tables, enums, RLS
- `.env*` in `.gitignore` — must be provided locally

## Installed Tools & Skills
- **RTK** (`rtk-ai/rtk`) — CLI proxy que reduz consumo de tokens em 60-92%. Plugin OpenCode instalado globalmente. Comandos bash são reescritos automaticamente (`git status` → `rtk git status`).
- **Superpowers** (`obra/superpowers`) — Metodologia de desenvolvimento: brainstorming, TDD, code review, subagents, git worktrees. Skills em `.opencode/skills/superpowers/`.
- **ECC** (`affaan-m/ECC`) — 249 skills, 191 agents, 102 commands cross-harness. Skills em `.opencode/skills/ecc/`, agents em `.opencode/agents/`, commands em `.opencode/commands/`.
- **Caveman** (`JuliusBrussee/caveman`) — Compressão de ~75% dos tokens de output. 7 skills em `.agents/skills/caveman*/`.
- **Mem0** (`mem0ai/mem0`) — Camada de memória inteligente. Skills em `.opencode/skills/mem0/` e `.opencode/skills/mem0-cli/`.
- **Baoyu Skills** (`JimLiu/baoyu-skills`) — 22 skills de geração de conteúdo (infográficos, slides, diagramas, tradução, etc.). Em `.agents/skills/baoyu-*/`.
- **UI UX Pro Max** (`nextlevelbuilder/ui-ux-pro-max-skill`) — Design intelligence com 161 regras de UI/UX. Skill em `.opencode/skills/ui-ux-pro-max/`.
- **Scrapling** (`D4Vinci/Scrapling`) — Web scraping com anti-bot bypass. MCP server configurado em `opencode.json`. Skill em `.opencode/skills/scrapling/`.
- **SigNoz** (`SigNoz/signoz`) — Observabilidade open-source (logs, métricas, traces). Docker compose em `docker/signoz/`.

## MCP Servers
- `scrapling` — Web scraping MCP server configurado em `opencode.json`

## Patterns
- **All pages** are `'use client'` (no server components)
- Global state: `AppProvider` wraps `SupabaseProvider` + Zustand chat store
- Game data: fetched from Supabase `game_config` table, falls back to static data
- Dark mode forced: `<html className="dark">` — no theme toggle
- CSS vars define colors (`--primary: 198 100% 65%` = cyan-blue `#4BC5FF`)
