'use client';

import { type ReactNode } from 'react';
import { CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { change: number } | null;
  trendLabelUp?: string;
  trendLabelDown?: string;
  trendLabelSame?: string;
}

export function MetricCard({ label, value, icon, trend, trendLabelUp, trendLabelDown, trendLabelSame }: MetricCardProps) {
  return (
    <WeldingCard>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-2xl font-bold">{value}</span>
        </div>
        {trend && (
          <TrendBadge
            change={trend.change}
            labelUp={trendLabelUp}
            labelDown={trendLabelDown}
            labelSame={trendLabelSame}
          />
        )}
      </CardContent>
    </WeldingCard>
  );
}

function TrendBadge({ change, labelUp, labelDown, labelSame }: {
  change: number;
  labelUp?: string;
  labelDown?: string;
  labelSame?: string;
}) {
  if (change === 0) {
    return (
      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>{labelSame || 'No change'}</span>
      </div>
    );
  }

  const isUp = change > 0;
  return (
    <div className={cn('flex items-center gap-1 mt-1 text-xs', isUp ? 'text-emerald-400' : 'text-red-400')}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>
        {isUp
          ? (labelUp || 'Up {change}%').replace('{change}', String(Math.abs(change)))
          : (labelDown || 'Down {change}%').replace('{change}', String(Math.abs(change)))
        }
      </span>
    </div>
  );
}
