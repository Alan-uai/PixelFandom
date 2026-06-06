-- ============================================================
-- Seed V5: Immortality Incremental — Historical Update Logs
-- Run AFTER seed_immortality_incremental_v4.sql
-- Adiciona registros de atualizações passadas que estavam
-- faltando no seed v4.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'immortality-incremental';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant immortality-incremental não encontrado. Execute o seed base primeiro.';
  END IF;

  -- ============================================================
  -- Historical Update Logs (pre-World 4)
  -- ============================================================
  INSERT INTO update_logs (tenant_id, title, content, is_hotfix) VALUES

  -- 1) RELEASE
  (v_tenant_id, 'RELEASE',
   '# RELEASE

## Hotfixes

- Changed the interaction reward of following me on roblox to instead playing the game for 3 hours due to a roblox change. rewards remain the same. if you already claimed the following reward, you should still have the task verified.
- Removed myself from the leaderboards, forgot to do this sooner
- Leaderboards now correctly show all 50 spots, it only went down to 48 before because of a ui issue.
- Formatted the chance on realm board to read in standard notation for high numbers
- Patched rare bug where auto-reconnecting opens up the template of bloodlines gui
- Fixed Qilin and Dragon not boosting karma through their stat boost
- Probably some other stuff idk i forgot
- Use code ''HOTFIX'' for x1 each potion',
   false),

  -- 2) World 2, Part 1
  (v_tenant_id, 'World 2, Part 1',
   '# World 2, Part 1

## Content

- New world, realm 135 requirement to enter
- 60 new realms
- CURRENTLY 2 layers in the world, Stars and Nebula, along with 2 new marks to open and 3 upgrade boards.
- New beast leaderboard
- New beast milestones board
- F2P leaderboards for top realm, top qi, and top beast
- The beast stage selector now tells you your current chance for a beast core drop per kill
- VFX toggle
- Autoroll (breakthrough) toggle
- Some other qol and, i forgot
- 3 New Codes: "UPDATE2", "MEMBERS", and "DurpJade"
- I missed some things in this update, so it''s only a part 1. part 2 either tomorrow or sunday.',
   false),

  -- 3) World 2, Part 2
  (v_tenant_id, 'World 2, Part 2',
   '# World 2, Part 2

## Content

- New layer, upgrade board, and mark: Quasar
- 3 New upgrades on the Nebula upgrade board
- 3 New karma milestones
- Solar Body Tempering, Realm 170 requirement, should assist W2 newcomers
- Made both the Mark of Stars and Mark of Nebula slightly easier to progress.
- Revamped Beast Milestone rewards, aiding early players with a star boost at stage 50, a nebula boost at 75, and another remnant boost at 100
- New Beast Milestone for stage 125
- Potions can now be paused by clicking their icon in the bottom left gui

## Bug Fixes

- World 2 is now better optimized on lower end devices
- Potions no longer use their time when offline
- Potentially fixed auto-reconnect not working for some players

## Codes

| Código | Recompensa |
|--------|------------|
| PART2 | x10 Tickets, x2 of each potion |
| DELAY | TBD when I get back home |',
   false),

  -- 4) World 3, Part 1
  (v_tenant_id, 'World 3, Part 1',
   '# World 3, Part 1

## Content

- World 3, Underworld, is now partially out, with realm requirement 240 to enter.
- First layer of Underworld, Miasma. An active layer where points are gained through clicking a button. Comes with upgrade board (5+ Upgrades), and a mark.
- Cultivation Manuals, a subsystem obtainable when entering the underworld. Test your luck to gain strong boosts
- Warp System, a free teleport system for players so u dont have to walk all over the place to the portals
- Spectral Body Tempering, a new tempering level with realm requirement 250
- Stage 110 and onwards of the beast hunt now hold Greater Bears, which drop Greater Beast Cores at a low rate (NO CURRENT USE, SYSTEM WILL COME IN WITH PART 2 ON FRIDAY)

## Bug Fixes

- Auto-reconnect should (hopefully) be working as intended
- Patched some visual mismatches regarding the beast milestone board
- Fixed some rounding issues
- Should have fixed bug where resetting breaks mark and bloodline guis

## Codes

| Código | Recompensa |
|--------|------------|
| PART1 | 5 Tickets, 5 of each potion |
| 50KGROUP | 10 of each potion |
| EXTRACODE | 10 Jade, 5 of each potion |',
   false),

  -- 5) World 3, Part 2
  (v_tenant_id, 'World 3, Part 2',
   '# World 3, Part 2

## Content

- Layer 2 of the Underworld is now out, Ash.
- Spirit Roots available to roll in the Underworld, near the Mark of Miasma. Use greater beast cores to roll for them. Lesser beast cores can also be converted to greater ones at a 100:1 rate.
- New beast stage milestone for stage 150
- Added one more level of cultivation manuals
- Dreadflame Body Tempering, a new tempering level with realm requirement 275
- In one of the marks, theres a secret rollable 👀
- Added another milestone (the one near spawn) for playtime
- Each body tempering level now comes with an aura surrounding you
- Buffed the speed of auto rolling bloodlines (and now spirit roots)
- Some other small tweaks

## Bug Fixes

- The freezing when joining the game and entering new worlds that some players have reported should be patched
- Bug where resetting breaks marks gui and bloodlines gui is fixed
- Fixed bug where one could move around while practicing for quasar

## Codes

| Código | Recompensa |
|--------|------------|
| 1MVISITS | X10 each potion, x5 jade |
| 5KCCU | x5 each potion, x10 tickets |
| ASH | x3 each potion |
| HYPE | x5 tickets |

## Hotfix

- Added a toggle for mark announcements in options
- Fixed beast remnant gain past stage 120
- Fixed realm and beast leaderboards
- Visual bug on miasma upgrades fixed
- Ash reset no longer takes away the upgrade that doubles beast remnant damage upgrade
- Quasar cant move bug fixed
- Anomalous spirit root ash gain fix
- Use code HOTFIXING — x10 Tickets, x3 of each potion',
   false),

  -- 6) MINI UPDATE
  (v_tenant_id, 'Mini Update',
   '# Mini Update

## Content

- 1 New Beast Milestone level
- 1 New Body Tempering level
- 1 New secret rollable in one of the marks 👀
- Mark reward system, while opening marks, theres a low chance of receiving any of the following: any of the 4 potions, a ticket, or 1 jade
- Moved the auto miasma upgrade to the miasma upgrade board instead of the ash upgrade board for mobile and console players
- All in all, should make W3 progression a little more streamlined in preparation for Saturdays content update

## Bug Fixes

- Potential fix to the board disappearing some players have scarcely reported, let me know if you still experience it

## Codes

| Código | Recompensa |
|--------|------------|
| 100KFAV | 10 of each potion, 5 tickets |
| MINI | 3 of each potion, 5 Jade |
| 100KGROUP | 10 of each potion |

## Hotfix

- New secret mark made x5 less rare in new servers
- Code: NERF — 5 jade
- If your current ash gain was higher than it should''ve been, it''ll be lowered upon rejoin
- Beast stage 150 milestone went from x5 miasma, x3 ash → x10 miasma, x6 ash
- Beast stage 175''s ash reward specifically went from x15 ash → x45 ash',
   false)

  ON CONFLICT (tenant_id, title) DO UPDATE SET
    content = EXCLUDED.content,
    is_hotfix = EXCLUDED.is_hotfix,
    updated_at = now();

  RAISE NOTICE 'Seed V5 concluído: 6 registros históricos de update logs adicionados.';

END $$;

COMMIT;
