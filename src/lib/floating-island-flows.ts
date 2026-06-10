import type { SlotFlowId, FloatingIslandPosition } from '@/components/page-builder/types';

export interface SlotFlowDef {
  id: SlotFlowId;
  label: string;
  description: string;
  getSlots(count: number): FloatingIslandPosition[];
}

export const SLOT_FLOWS: SlotFlowDef[] = [
  {
    id: 'current',
    label: 'Atual',
    description: 'Centraliza na primeira, expande para os lados conforme necessário',
    getSlots(count) {
      if (count === 1) return ['center'];
      if (count === 2) return ['left', 'right'];
      return ['left', 'center', 'right'];
    },
  },
  {
    id: 'leftPriority',
    label: 'Prioridade Esquerda',
    description: 'Sempre começa pela esquerda',
    getSlots(count) {
      if (count === 1) return ['left'];
      if (count === 2) return ['left', 'center'];
      return ['left', 'center', 'right'];
    },
  },
  {
    id: 'rightPriority',
    label: 'Prioridade Direita',
    description: 'Sempre começa pela direita',
    getSlots(count) {
      if (count === 1) return ['right'];
      if (count === 2) return ['center', 'right'];
      return ['left', 'center', 'right'];
    },
  },
  {
    id: 'centerFirst',
    label: 'Centro Primeiro',
    description: 'Centro sempre preenchido primeiro',
    getSlots(count) {
      if (count === 1) return ['center'];
      if (count === 2) return ['center', 'left'];
      return ['left', 'center', 'right'];
    },
  },
  {
    id: 'centerAlways',
    label: 'Centro Sempre',
    description: 'Centro mantido em toda configuração',
    getSlots(count) {
      if (count === 1) return ['center'];
      if (count === 2) return ['center', 'right'];
      return ['center', 'left', 'right'];
    },
  },
  {
    id: 'sidesFirst',
    label: 'Laterais Primeiro',
    description: 'Antes de ocupar o centro, preenche as laterais',
    getSlots(count) {
      if (count === 1) return ['left'];
      if (count === 2) return ['left', 'right'];
      return ['left', 'center', 'right'];
    },
  },
  {
    id: 'fillRight',
    label: 'Preencher Direita',
    description: 'Acumula da direita para a esquerda',
    getSlots(count) {
      if (count === 1) return ['right'];
      if (count === 2) return ['right', 'left'];
      return ['right', 'left', 'center'];
    },
  },
  {
    id: 'centerSpread',
    label: 'Espalhar Centro',
    description: 'Centro é a âncora, espalha para direita depois esquerda',
    getSlots(count) {
      if (count === 1) return ['center'];
      if (count === 2) return ['center', 'right'];
      return ['left', 'center', 'right'];
    },
  },
];

export function getSlotFlowDef(id: SlotFlowId): SlotFlowDef {
  return SLOT_FLOWS.find((f) => f.id === id) || SLOT_FLOWS[0];
}
