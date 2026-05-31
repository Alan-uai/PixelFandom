'use client';

import { useState } from 'react';

export function TabsBlock({ config }: { config: Record<string, unknown> }) {
  const tabs = (config.tabs as Array<{ label: string; content?: string }>) || [];
  const layout = (config.layout as string) || 'top';
  const [activeIndex, setActiveIndex] = useState(0);

  if (tabs.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Nenhuma aba configurada
      </div>
    );
  }

  const activeTab = tabs[activeIndex];

  const tabButtons = tabs.map((tab, i) => (
    <button
      key={i}
      onClick={() => setActiveIndex(i)}
      className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        i === activeIndex
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {tab.label}
    </button>
  ));

  return (
    <div className={`flex ${layout === 'left' ? 'flex-row gap-4' : 'flex-col gap-4'}`}>
      <div
        className={`flex ${layout === 'left' ? 'flex-col shrink-0' : 'flex-row'} gap-1 ${
          layout === 'left' ? '' : 'border-b border-border pb-1'
        }`}
      >
        {tabButtons}
      </div>
      <div className="flex-1 min-w-0">
        {activeTab?.content ? (
          <p className="text-sm text-muted-foreground">{activeTab.content}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhum conteúdo</p>
        )}
      </div>
    </div>
  );
}
