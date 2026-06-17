import type { ReactNode } from 'react';

export interface PanelProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  tenantId?: string;
}

export type PanelComponent = (props: PanelProps) => ReactNode;
