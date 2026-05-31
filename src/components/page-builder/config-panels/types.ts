import type { ReactNode } from 'react';

export interface PanelProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export type PanelComponent = (props: PanelProps) => ReactNode;
