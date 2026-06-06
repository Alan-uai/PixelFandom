-- Migration 062: Allow public (non-member) read access to tenant_game_tables
-- This is needed so visitors can see the game tables catalog on wiki pages
-- without being logged in or being a tenant member.

CREATE POLICY "public_select_tgt" ON tenant_game_tables
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_public = true)
  );
