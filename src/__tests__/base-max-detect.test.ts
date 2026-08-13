import { describe, it, expect } from 'vitest';
import { normalizeBaseMax } from '@/lib/scaling-engine';

describe('normalizeBaseMax — named variants', () => {
  it('detects canonical base/max (numbers)', () => {
    expect(normalizeBaseMax({ Max: 75, Base: 25 })).toEqual({ base: 25, max: 75 });
  });

  it('detects base + single sibling key (fallback, with numeric strings)', () => {
    expect(normalizeBaseMax({ Base: '×7', Fogo: '×25' })).toEqual({ base: 7, max: 25 });
  });

  it('detects Base{y} + {y}Max (and reverse order)', () => {
    expect(normalizeBaseMax({ BaseDamage: 25, DamageMax: 75 })).toEqual({ base: 25, max: 75 });
    expect(normalizeBaseMax({ DamageMax: 75, BaseDamage: 25 })).toEqual({ base: 25, max: 75 });
  });

  it('detects prefix/suffix variants (maxDamage / baseDamage)', () => {
    expect(normalizeBaseMax({ baseDamage: 25, maxDamage: 75 })).toEqual({ base: 25, max: 75 });
  });

  it('detects min + maxtier', () => {
    expect(normalizeBaseMax({ min: 1, maxtier: 5 })).toEqual({ base: 1, max: 5 });
  });

  it('detects the full example A nested object', () => {
    const data = { 'Luz': { Critic: 42, Damage: 12 }, 'Fogo Elemental': { Max: 75, Base: 25 } };
    expect(normalizeBaseMax((data as any)['Fogo Elemental'])).toEqual({ base: 25, max: 75 });
  });

  it('detects example B inner object', () => {
    const item = { HP: 89, 'Dano Elemental': { Base: '×7', Fogo: '×25' } };
    expect(normalizeBaseMax((item as any)['Dano Elemental'])).toEqual({ base: 7, max: 25 });
  });

  it('does not false-positive a plain two-stat object without base/max naming', () => {
    expect(normalizeBaseMax({ Critic: 42, Damage: 12 })).toBeNull();
  });

  it('detects base stat + its critical variant sharing the stat name', () => {
    expect(normalizeBaseMax({ Damage: 12, CritDamage: 42 })).toEqual({ base: 12, max: 42 });
    expect(normalizeBaseMax({ chance: 10, critChance: 20 })).toEqual({ base: 10, max: 20 });
    expect(normalizeBaseMax({ Damage: 12, DamageCrit: 42 })).toEqual({ base: 12, max: 42 });
  });

  it('does NOT pair an unrelated stat with a critical variant (no false positives)', () => {
    // health is unrelated to critChance → stem "chance" does not match "health"
    expect(normalizeBaseMax({ health: 100, critChance: 20 })).toBeNull();
  });

  it('does NOT pair the crit shorthand without a shared stat name', () => {
    // "Critic" (critical damage) shares no stem with "Damage" → can't pair safely
    expect(normalizeBaseMax({ Damage: 12, Critic: 42 })).toBeNull();
  });
});
