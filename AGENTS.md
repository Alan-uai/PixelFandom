# AGENTS.md

## Project Overview

This repo contains two projects:
- **PixelFandom** (root): Next.js 15 site for Pixel Wizard World wiki
- **PixelBot** (`/PixelBot`): Discord bot

## Commands

### Site (PixelFandom)
```bash
npm run dev         # Dev server on port 9002
npm run build      # Production build (ignores TS/ESLint errors - see next.config.ts)
npm run lint      # Lint
npm run typecheck # TypeScript check
```

### Discord Bot (PixelBot)
```bash
cd PixelBot && npm run dev    # Dev with --watch
cd PixelBot && npm start     # Production with pm2
```

## Database

Supabase migrations in `supabase/migrations/`. Run with:
```bash
npx supabase db push
```

## Architecture Notes

- Next.js uses TypeScript with `ignoreBuildErrors: true` in next.config.ts
- Auth via Firebase (see `src/firebase/`)
- AI flows via OpenRouter SDK in `src/ai/flows/`
- Bot uses pm2 for production process management

## Git Workflow

- PixelFandom remote: `https://github.com/Alan-uai/PixelFandom`
- PixelBot remote: `https://github.com/Alan-uai/PixelBot`
- Each project has its own .git directory (nested in PixelBot/)