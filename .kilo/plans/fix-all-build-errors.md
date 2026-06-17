# Plan: Fix All Build Errors in PixelFandom

## Summary
Build fails with 180 errors (all from ESLint, not TypeScript — `tsc --noEmit` passes cleanly). Errors span 61 files. Grouped by fixability:

| Category | Count | Strategy |
|---|---|---|
| `'React' is not defined` (no-undef) | 73 | Add `import React` to files using JSX without it, or update globals in eslint config |
| `Empty block statement` (no-empty) | 48 | Replace empty `{}` blocks with comments or no-op |
| `Cannot create components during render` | 24 | Move component resolution outside JSX (use `useMemo` or resolve once) |
| `Cannot access refs during render` | 9 | Move ref reads/writes into `useEffect` |
| `"` unescaped entities | 6 | Replace `"` with `&quot;` or `&ldquo;`/`&rdquo;` |
| `Compilation Skipped: Existing memoization` | 4 | Remove manual `useMemo`/`useCallback` wrappers around components |
| `useTransform called conditionally` | 4 | Ensure hooks are called unconditionally |
| `Unexpected lexical declaration in case block` | 3 | Wrap in `if` blocks or extract to functions |
| Misc (display-name, children props, prop-types, etc.) | 8 | Targeted fixes per file |

---

## Step 1: Fix `'React' is not defined` (73 errors)

**Affected files (partial list):**
`dashboard-layout-client.tsx`, `layout.tsx` (dashboard, marketing, wiki), `editor/layout.tsx`, `editor/page.tsx`, `new/page.tsx`, `suggest/page.tsx`, `hub-link.tsx`, `marketing/animated-features.tsx`, `marketing/nav-strip.tsx`, `page-builder/blocks/article-feed-block.tsx`, `page-builder/blocks/contact-form-block.tsx`, `page-builder/blocks/error-actions-block.tsx`, `page-builder/blocks/error-feedback-block.tsx`, `comment-form.tsx`, `game-item-selector.tsx`, `typing-animation.tsx`, `wiki-card.tsx`, `chat-widget.tsx`, `collection-item-view.tsx`, `block-styles.tsx`, `game-ui.tsx`, `table-icons.tsx`, `render-cards.tsx`, `render-hibrido.tsx`, `render-tabela.tsx`, `streaming-accordion.tsx`, `wiki-chat.tsx`, `wiki-content.tsx`, `wiki-grid.tsx`, `wiki-sidebar.tsx`, `vercel-domains.ts`, `mediaUtils.ts`

**Fix:** Add `import React from 'react'` to the top of each file that uses JSX but lacks the import.  
**Alternative:** Update `eslint.config.mjs` globals to include `React: true`, but explicit imports are safer since the project uses `react/react-in-jsx-scope: 'off'` for modern JSX transform compatibility — many files simply forgot the import.

---

## Step 2: Fix `Empty block statement` (48 errors)

**Affected files (partial list):**
`voice/wakeWord.ts`, `dashboard/[slug]/ai/page.tsx`, `marketing/profile/[id]/page.tsx`, `wiki/wiki-chat.tsx`, `lib/translate.ts`, `editor/page.tsx`, `marketing/page.tsx`, `api/chat/route.ts`, `api/notifications/route.ts`, `api/translate/route.ts`, `auth/callback/route.ts`, `comments/comments-section.tsx`, `gamification/badge-celebration.tsx`, `user-preferences-context.tsx`, `feedback-sounds.ts`, `api/analytics/route.ts`, `discord/channel-select.tsx`, `middleware.ts`

**Fix:** Replace `{}` with `{/* noop */}` or remove the empty handler entirely if safe.

---

## Step 3: Fix `Cannot create components during render` (24 errors)

**Primary file:** `src/components/editor/tiptap-editor.tsx` (22 occurrences)  
**Others:** `src/lib/table-icons.tsx`, `src/components/ui/table-icon-picker.tsx`

**Fix:** Wrap component-resolution logic in `useMemo` so it is not recreated on every render.  
Example in `table-icon-picker.tsx`:
```tsx
const CurrentIcon = useMemo(() => resolveTableIcon(value), [value]);
```
Same pattern for `tiptap-editor.tsx` — wrap all `const X = (...)` JSX-component assignments in `useMemo`.

---

## Step 4: Fix `Cannot access refs during render` (9 errors)

**Affected files:** `hooks/use-orbital-animation.ts` (8 occurrences), `hooks/use-cached-data.ts`

**Fix for `use-orbital-animation.ts`:** Move the initialization block (lines 105–123) into a `useEffect(() => { ... }, [count])`.  
**Fix for `use-cached-data.ts`:** The `fetcherRef.current = fetcher` assignment at line 20 is a standard pattern — suppress with `// eslint-disable-next-line react-hooks/refs` or move into `useEffect`.

---

## Step 5: Fix `"` unescaped entities (6 errors)

**Affected files:** `marketing/slider-demo/page.tsx`, `dashboard/[slug]/editor/[articleId]/page.tsx`

**Fix:** Replace literal `"` and `"` in JSX text with `&quot;` or HTML entities.

---

## Step 6: Fix `Compilation Skipped: Existing memoization could not be preserved` (4 errors)

**Affected files:** `components/wiki/wiki-content.tsx`, `components/discord/channel-select.tsx`, `dashboard/[slug]/domains/page.tsx`

**Fix:** Remove manual `useMemo`/`useCallback` wrappers around components that the React Compiler already handles, or add `// eslint-disable-next-line react-hooks/preserve-manual-memoization`.

---

## Step 7: Fix `useTransform called conditionally` (4 errors)

**Affected file:** `components/marketing/hero-section.tsx`

**Fix:** Ensure `useTransform` is called at the top level of the component, not inside a conditional block.

---

## Step 8: Fix `Unexpected lexical declaration in case block` (3 errors)

**Affected file:** `components/wiki/wiki-content.tsx`

**Fix:** Wrap `const/let/function` declarations inside case blocks with `{ /* block */ }` or extract to helper functions.

---

## Step 9: Fix misc errors (8 errors)

| File | Error | Fix |
|---|---|---|
| `chat/chat-bubble.tsx` | missing display-name | Add `displayName` static property |
| `page-builder/block-renderer.tsx` | children as props | Nest children instead of passing as prop |
| `ui/toast.tsx` | missing className prop validation | Add `className?: string` to props interface |
| `wiki/render-tabela.tsx` | conditional useMemo | Move useMemo to top level |
| `wiki/streaming-accordion.tsx` | unnecessary escape `\/` | Remove backslash from regex |
| `hooks/use-data-access.ts` | non-literal deps array | Use inline array literal |
| `lib/vercel-domains.ts` | `RequestInit` not defined | Add DOM lib or use `RequestInfo` |
| `lib/voice/mediaUtils.ts` | `MediaTrackConstraints` not defined | Add DOM lib to tsconfig or import type |

---

## Execution Order

1. Start with Step 3 (`tiptap-editor.tsx`) — highest single-file impact (22 errors)
2. Step 2 (empty blocks) — simplest, most mechanical fixes
3. Step 1 (`React` not defined) — broad but repetitive
4. Steps 4–9 in parallel where possible

## Verification

After all fixes: `npm run build` should pass without errors (warnings are acceptable).
