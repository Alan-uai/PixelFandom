'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import WikiChat from './wiki-chat';

type ChatWidgetProps = {
  tenantSlug: string;
};

export default function ChatWidget({ tenantSlug }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        {open && (
          <div className="absolute bottom-14 right-0 w-80 h-96 bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
              <span className="text-sm font-medium">Assistente da Wiki</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <WikiChat tenantSlug={tenantSlug} compact onClose={() => setOpen(false)} />
            </div>
          </div>
        )}
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
      </div>
    </>
  );
}
