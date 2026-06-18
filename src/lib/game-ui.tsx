'use client';

import React from 'react';
import {
  Sword, Shield, Zap, Flame, Snowflake, Skull, Ghost,
  Globe, Droplets, Gem, ScrollText, Pickaxe,
} from 'lucide-react';

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  legendary: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  vaulted: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export const RARITY_GRAD: Record<string, string> = {
  common: 'from-gray-600 to-gray-500',
  rare: 'from-blue-600 to-blue-500',
  epic: 'from-purple-600 to-purple-500',
  legendary: 'from-orange-600 to-orange-500',
  vaulted: 'from-red-600 to-red-500',
};

export const TIER_LABEL: Record<string, string> = { s_plus: 'S+', s: 'S', a: 'A', b: 'B', c: 'C', d: 'D' };

export const TIER_COL: Record<string, string> = {
  s_plus: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  s: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  a: 'text-green-400 bg-green-500/10 border-green-500/30',
  b: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  c: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  d: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

export function elementClass(v: string): string {
  const m: Record<string, string> = {
    fire: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    flame: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    frost: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    ice: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    poison: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
    dark: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    ghost: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    void: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    earth: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    lightning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    thunder: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };
  const vv = v.toLowerCase().trim();
  for (const [k, c] of Object.entries(m)) if (vv.includes(k)) return c;
  return 'text-muted-foreground bg-muted/50 border-border';
}

export function elIcon(el: string): React.ReactNode {
  const e = el.toLowerCase();
  if (e.includes('fire') || e.includes('flame')) return <Flame className="h-3 w-3" />;
  if (e.includes('frost') || e.includes('ice')) return <Snowflake className="h-3 w-3" />;
  if (e.includes('poison') || e.includes('venom')) return <Droplets className="h-3 w-3" />;
  if (e.includes('dark') || e.includes('shadow') || e.includes('ghost')) return <Skull className="h-3 w-3" />;
  if (e.includes('void')) return <Ghost className="h-3 w-3" />;
  if (e.includes('earth') || e.includes('rock')) return <Globe className="h-3 w-3" />;
  if (e.includes('lightning') || e.includes('thunder')) return <Zap className="h-3 w-3" />;
  return <Zap className="h-3 w-3" />;
}

export function effectColor(v: string): string {
  const s = v.toLowerCase();
  if (['buff', 'boost', 'bonus', 'heal', 'shield', 'recovery', 'haste', 'strength', 'regeneration'].some((w) => s.includes(w))) return 'text-emerald-500';
  if (['debuff', 'curse', 'stun', 'slow', 'bleed', 'weaken', 'cursed', 'vulnerable'].some((w) => s.includes(w))) return 'text-red-500';
  if (['fire', 'flame', 'burn', 'inferno', 'molten'].some((w) => s.includes(w))) return 'text-orange-500';
  if (['frost', 'ice', 'freeze', 'cold', 'chill'].some((w) => s.includes(w))) return 'text-cyan-500';
  if (['poison', 'venom', 'toxic', 'acid'].some((w) => s.includes(w))) return 'text-lime-500';
  if (['lightning', 'thunder', 'shock', 'electr', 'spark', 'static'].some((w) => s.includes(w))) return 'text-yellow-500';
  if (['dark', 'shadow', 'ghost', 'void', 'soul', 'necro'].some((w) => s.includes(w))) return 'text-purple-500';
  if (['earth', 'rock', 'stone', 'crystal'].some((w) => s.includes(w))) return 'text-amber-600';
  return '';
}

export const COLL_ICON: Record<string, React.ReactNode> = {
  weapons: <Sword className="h-5 w-5" />,
  armors: <Shield className="h-5 w-5" />,
  rings: <Gem className="h-5 w-5" />,
  potions: <Droplets className="h-5 w-5" />,
  upgrades: <Zap className="h-5 w-5" />,
  enemies: <Skull className="h-5 w-5" />,
  bosses: <Skull className="h-5 w-5" />,
  codes: <ScrollText className="h-5 w-5" />,
  'crafting-recipes': <Pickaxe className="h-5 w-5" />,
  worlds: <Globe className="h-5 w-5" />,
  update_logs: <ScrollText className="h-5 w-5" />,
};
