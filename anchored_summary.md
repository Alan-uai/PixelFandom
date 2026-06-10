# Sessão: Modos de Exibição + Inline Items + 3D + Timeout

## Goal
Transform Wiki Chat with 6 display modes (acordeao, texto_puro, tabela, cards, hibrido, auto), clickable inline items/columns, complex 3D typing animation, 3D like/dislike feedback, 120s timeout with elapsed UI.

## Done
- `src/lib/response-styles.ts`: added `displayModes`, `DisplayMode`, `displayModeGroups`, `tabela` in `SECTION_META`
- `src/lib/chat-utils.ts`: added `buildDisplayModePrompt(displayMode?)`
- `src/app/api/chat/route.ts`: increased timeouts 60→120s, added displayMode cascade + system prompt injection
- `src/context/user-preferences-context.tsx`: added `display_mode` to `ChatSettings`, default `'acordeao'`
- `src/components/wiki/wiki-chat.tsx`: full refactor — switches renderer per displayMode, inline item/compare click via `window.__onItemClick/__onCompareClick`, global `<Settings>` icon link, typing animation during streaming, elapsed time + "still processing" indicator, AbortController timeout, inline item/compare view mode
- `src/components/wiki/render-texto-puro.tsx`: micromark renderer with item/compare link syntax
- `src/components/wiki/render-tabela.tsx`: section-based table renderer with headers+rows + markdown table fallback
- `src/components/wiki/render-cards.tsx`: card grid renderer with collapsible sections, per-type colors, staggered animation
- `src/components/wiki/render-hibrido.tsx`: hybrid renderer (compact/expandable/list/table sections by type)
- `src/components/wiki/typing-animation.tsx`: 3D canvas particles + orbiting dots + glow ring animation
- `src/components/chat/message-feedback.tsx`: added canvas-based 3D particle burst on like/dislike click
- `src/app/(marketing)/settings/page.tsx`: added displayMode SelectCard
- `src/app/(wiki)/w/[slug]/ai/page.tsx`: added displayMode SelectCard with layer badges
- `src/lib/voice/tools.ts`: added `navigateToItem` voice tool (table+slug)
- `src/components/wiki/streaming-accordion.tsx`: exported `processWikiLinks` for reuse
- Typecheck passes clean

## Pending (nothing blocked)
- Player test would verify full flow end-to-end
- Build passes (next.config ignores TS/ESLint)
