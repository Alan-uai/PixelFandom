-- Migration 094: Make public.slugify() accent-aware
--
-- The previous implementation dropped accented characters entirely
-- (e.g. "guia de progressão" -> "guia-de-progress-o"). This version
-- transliterates common Latin accents before stripping non-ASCII,
-- so the same input becomes "guia-de-progressao", matching the
-- client-side slug generation in src/lib/slugify.ts.

CREATE OR REPLACE FUNCTION public.slugify(text)
 RETURNS text
 LANGUAGE sql IMMUTABLE SET search_path = 'public'
AS $function$
  SELECT lower(regexp_replace(regexp_replace(translate(lower($1), 'áàâãäéèêëíìîïóòõöúùûüçñýÿ', 'aaaaaeeeeiiiiooooouuuucnyy'), '[^a-z0-9]+', '-', 'g'), '^-|-$', 'g'));
$function$;
