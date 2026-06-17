# Fix JSX Syntax Errors in game-table-listing.tsx

## Root Cause
Lines 555 and 561 contain truncated className strings with literal `[...]` placeholders that were never replaced, causing JSX parsing failures:
- Line 555: `bg-back[...]` — incomplete tailwind class, missing closing backtick
- Line 561: `backdrop-[...]` — incomplete tailwind class, missing closing backtick

## Fix
Replace the truncated class strings with valid Tailwind classes consistent with line 566:

1. **Line 555** (`rarity` badge):
   - Old: `...bg-back[...]`
   - New: `...bg-background/80 backdrop-blur-sm`

2. **Line 561** (`tier` badge):
   - Old: `...backdrop-[...]`
   - New: `...backdrop-blur-sm`

Both badges will then use the same pattern as the `element` badge on line 566.

## Verification
Run `npm run typecheck` and `npm run build` to confirm errors are resolved.
