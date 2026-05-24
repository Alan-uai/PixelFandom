'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, GripVertical } from 'lucide-react';
import WikiChat from './wiki-chat';

const LS_VISIBLE = 'pixelfandom:chat-visible';
const LS_POSITION = 'pixelfandom:chat-position';

type ChatWidgetProps = {
  tenantSlug: string;
  isChatPage?: boolean;
};

type Position = {
  x: number;
  y: number;
};

function loadPosition(): Position | null {
  try {
    const raw = localStorage.getItem(LS_POSITION);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePosition(pos: Position) {
  localStorage.setItem(LS_POSITION, JSON.stringify(pos));
}

function loadVisible(): boolean {
  try {
    const raw = localStorage.getItem(LS_VISIBLE);
    if (raw !== null) return raw === 'true';
  } catch {}
  return true;
}

function saveVisible(v: boolean) {
  localStorage.setItem(LS_VISIBLE, String(v));
}

export default function ChatWidget({ tenantSlug, isChatPage }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(loadVisible);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState<Position | null>(loadPosition);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    saveVisible(visible);
  }, [visible]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    }, 2000);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    setPos({ x: newX, y: newY });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dragging) {
      setDragging(false);
      if (pos) savePosition(pos);
    }
    isLongPressing.current = false;
  }, [dragging, pos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isLongPressing.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setDragging(true);
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    }, 2000);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.current.x;
    const newY = touch.clientY - dragOffset.current.y;
    setPos({ x: newX, y: newY });
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dragging) {
      setDragging(false);
      if (pos) savePosition(pos);
    }
    isLongPressing.current = false;
  }, [dragging, pos]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  if (isChatPage || !visible) return null;

  const style: React.CSSProperties = pos
    ? {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 40,
        cursor: dragging ? 'grabbing' : 'pointer',
      }
    : {
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 40,
        cursor: dragging ? 'grabbing' : 'pointer',
      };

  return (
    <div style={style} className="flex flex-col items-end">
      {dragging && (
        <div className="mb-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium animate-pulse">
          Arraste para reposicionar
        </div>
      )}

      {open && !dragging && (
        <div className="absolute bottom-14 right-0 w-80 h-96 bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <span className="text-sm font-medium">Assistente da Wiki</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVisible(false)}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Ocultar ícone flutuante"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <WikiChat tenantSlug={tenantSlug} compact onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      <button
        ref={btnRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!isLongPressing.current && !dragging) setOpen(!open);
        }}
        className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          dragging
            ? 'ring-2 ring-primary ring-offset-2 scale-110 bg-primary text-primary-foreground'
            : open
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
