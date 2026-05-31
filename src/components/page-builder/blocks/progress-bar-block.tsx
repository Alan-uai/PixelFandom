'use client';

export function ProgressBarBlock({ config }: { config: Record<string, unknown> }) {
  const items = (config.items as Array<{
    label: string;
    value: number;
    color?: string;
  }>) || [];

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        items.map((item, i) => {
          const clamped = Math.max(0, Math.min(100, item.value));
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{Math.round(clamped)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${clamped}%`,
                    ...(item.color ? { backgroundColor: item.color } : {}),
                  }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Adicione barras de progresso nas configurações
        </p>
      )}
    </div>
  );
}
