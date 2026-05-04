# AGENTS.md

## Project Overview

Two separate projects with independent `.git` directories:
- **PixelFandom** (root): Next.js 15 wiki for "Anime Eternal" game (Roblox)
- **PixelBot** (`PixelBot/`): Discord bot for the same game

## Commands

### PixelFandom (root)
```bash
npm run dev         # Next.js dev server on port 9002 (uses Turbopack)
npm run build      # Production build (ignores TS/ESLint errors intentionally)
npm run lint       # Next.js lint
npm run typecheck  # tsc --noEmit
```

### PixelBot
```bash
cd PixelBot && npm install
cd PixelBot && node --watch src/index.js   # Dev mode
cd PixelBot && npm start                   # Production via pm2
```

## Architecture Notes

- **Next.js build ignores errors**: `ignoreBuildErrors: false` and `ignoreDuringBuilds: false` in `next.config.ts` aren't intentional
- **PixelBot is plain Node.js** (ES modules)
- **Auth**: Discord (`src/auth`)
- **Database**: Supabase (`supabase/migrations/`, `src/supabase/`)
- **AI features**: OpenRouter SDK (`src/ai/flows/`)
- **Game data**: Static files in `src/lib/world-*-data.ts` + Supabase for dynamic content
- **PixelBot structure**: `commands/`, `events/`, `loaders/`, `services/`, `jobs/`, `ai/`, `utils/`
- **Deprecated**: `PixelBot/src/deploy-commands.js` is discontinued (deploy logic moved to main bot)

## Environment Setup

- Root: copy `.env.local.example` → `.env.local`
- PixelBot: copy `PixelBot/.env.example` → `PixelBot/.env`
- Required: Discord token, client ID, guild ID, Supabase credentials, OpenRouter API key

## Database

Supabase migrations in `supabase/migrations/`. Push with:
```bash
npx supabase db push
```
Schema reference: `supabase/SCHEMA.md` (18 tables for game data)

## Git Workflow

- **PixelFandom remote**: `https://github.com/Alan-uai/PixelFandom`
- **PixelBot remote**: `https://github.com/Alan-uai/PixelBot`
- Each project has its own `.git` directory (PixelBot's is nested)
