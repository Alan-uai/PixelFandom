## Goal
- Implement local-first caching across all components that fetch data from Supabase/API

## Constraints & Preferences
- Local-first principle: check cache (useRef) → API → save to cache; navigation between states operates on cache only
- Not caching: writes (POST/PUT/DELETE), real-time chat/voice (stale cache breaks UX), hooks with their own cache, context-based state
- Priority order: wiki-facing → page-builder blocks → dashboard pages

## Progress
### Done
- All 3 improvements to CollectionItemView (banner background, icon display, clickable stat cards → comparison modal)
- Created comparison page route at `/w/[slug]/compare/[table]`
- Added comparison display mode toggle in tenant settings
- Removed `IconField` from article editor; added `'icon'` to `iconColumnNames` in game data editor
- `useRef` cache added to: `comments-section.tsx`, `follow-button.tsx`, `vote-buttons.tsx`, `profile-view.tsx`, `wiki-chat.tsx`, `news-feed-block.tsx`, `article-grid-block.tsx`, `template-library.tsx`, `widgets-editor.tsx`, `page-builder/page.tsx`, comparison modal, comparison page
- `useRef` cache added to 8 remaining files: wiki page layout/404/article, wiki footer, leaderboard, marketing profile, marketing homepage, members invitations, analytics, activity
- Left as-is (already adequate): `notification-bell.tsx` (realtime hook), `guild-data-context.tsx` (context state), `page-builder-editor.tsx` (props), all write-heavy files

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- `useRef` for caching over Zustand / React Query — simplest change, zero dependencies, persists across search param transitions in App Router
- `comments-section.tsx`: cache invalidated on articleId change, new comments bypass cache via `cacheRef.current = null`
- `wiki-chat.tsx`: sessions cache invalidated on create, delete, and history-open; chat messages inside a session are not cached (real-time)
- `news-feed-block.tsx` / `article-grid-block.tsx`: cache keyed by `{tenantId}:{tag}`, re-fetches when tag changes
- `template-library.tsx`: cache invalidated on template delete
- `widgets-editor.tsx`: cache keyed by tenantId, once per tenant
- `page-builder/page.tsx`: cache keyed by `{tenantId}:{type}`, re-fetches on page type change
- `guild-data-context.tsx`, `notification-bell.tsx`, `page-builder-editor.tsx` left untouched (context/hook/props already serve as cache)
- Wiki page layout cache keyed by tenant.id (landing) / `404-{tenant.id}` (404); article cache keyed by `{tenant.id}:{articleSlug}`
- Leaderboard cache keyed by activeMetric; analytics by `{slug}:{period}`; activity by tenantId; members by slug; profile by id

## Next Steps
- (all 12 read-only components now cached)

## Critical Context
- 29 files make direct API calls without caching; 20 now have `useRef` cache, 7 identified as write-only/one-shot (not cached), 2 use context/hooks (adequate)
- Lint has pre-existing circular JSON error in `.eslintrc.json` — not caused by changes
- Typecheck passes with zero errors

## Relevant Files
All 20 cached files:
- src/components/comments/comments-section.tsx
- src/components/wiki/follow-button.tsx
- src/components/wiki/vote-buttons.tsx
- src/components/wiki/profile-view.tsx
- src/components/wiki/wiki-chat.tsx
- src/components/page-builder/blocks/news-feed-block.tsx
- src/components/page-builder/blocks/article-grid-block.tsx
- src/components/page-builder/template-library.tsx
- src/components/page-builder/widgets-editor.tsx
- src/app/(dashboard)/dashboard/[slug]/page-builder/page.tsx
- src/components/wiki/comparison-modal.tsx
- src/app/(wiki)/w/[slug]/compare/[table]/page.tsx
- src/app/(wiki)/w/[slug]/[[...path]]/page.tsx
- src/app/(wiki)/layout.tsx
- src/app/leaderboard/page.tsx
- src/app/(marketing)/profile/[id]/page.tsx
- src/app/(marketing)/page.tsx
- src/app/(dashboard)/dashboard/[slug]/members/page.tsx
- src/app/(dashboard)/dashboard/[slug]/analytics/page.tsx
- src/app/(dashboard)/dashboard/[slug]/activity/page.tsx

Write-only/one-shot (not cached): comment-thread.tsx, comment-form.tsx, floating-voice-orb.tsx, import-wizard.tsx, invite/[token]/page.tsx, guild-data-context.tsx, page-builder-editor.tsx
