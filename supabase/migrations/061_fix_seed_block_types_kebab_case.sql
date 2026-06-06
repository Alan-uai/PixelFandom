-- Fix block type names in seed data for immortality-incremental
-- The seed used underscore (featured_list, rich_text) but the codebase expects kebab-case (featured-list, rich-text)

UPDATE tenant_pages
SET layout = REPLACE(REPLACE(
  layout::text,
  '"type": "featured_list"',
  '"type": "featured-list"'
), '"type": "rich_text"', '"type": "rich-text"')::jsonb
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'immortality-incremental')
  AND page_type = 'landing';
