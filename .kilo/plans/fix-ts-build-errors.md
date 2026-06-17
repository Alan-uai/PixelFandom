# Fix TypeScript Build Errors

## Root Cause

1. **Syntax error** in `src/app/(dashboard)/dashboard/[slug]/ai/page.tsx:209-210`
   - `try` has `catch {/* noop */}` on the same line, then a stray `} finally {` appears immediately.
   - TS1005 (line 210) and TS1128 (line 214) are direct consequences.

2. **Syntax error** in `src/lib/game-ui.tsx:4`
   - `'use client';` and `import {` are on separate lines, but line 4 shows `import React from 'react'` *inside* the `{` import block.
   - The parser then fails on line 8 (`} from 'lucide-react';`) because of the broken import.

## Plan

- **A.** Edit `src/app/(dashboard)/dashboard/[slug]/ai/page.tsx`
  - Move `} catch {/* noop */} } finally {` to a single correct block, or remove the broken tail and keep only `} finally {` off the catch line.
- **B.** Edit `src/lib/game-ui.tsx`
  - Remove or relocate `import React from 'react'` so it is a standalone import statement, then keep only `lucide-react` icons inside the `{ }` block.
- **Verify.** Run `npm run typecheck` (must pass with 0 errors before claiming done).
