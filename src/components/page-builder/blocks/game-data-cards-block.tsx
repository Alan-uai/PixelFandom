'use client';

import { useParams } from 'next/navigation';
import type { GameDataCardsConfig } from '../types';
import GameDataCardsComponent from '@/components/wiki/game-data-cards';

export function GameDataCardsBlock({ config, tenantId }: { config: GameDataCardsConfig; tenantId?: string; basePath?: string }) {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  if (!tenantId) return null;

  return <GameDataCardsComponent slug={slug} tenantId={tenantId} title={config.title} />;
}
