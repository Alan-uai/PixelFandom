ALTER TABLE tenant_game_tables
ADD COLUMN display_format text NOT NULL DEFAULT 'grid'
CHECK (display_format IN ('grid', 'list', 'carousel', 'carousel_infinite'));

ALTER TABLE tenant_game_tables
ADD COLUMN columns_count integer NOT NULL DEFAULT 4
CHECK (columns_count BETWEEN 2 AND 5);
