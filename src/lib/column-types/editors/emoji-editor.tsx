'use client';

import { useState, useRef, useEffect } from 'react';

const EMOJI_LIST = [
  '🔥', '⭐', '💎', '⚔️', '🛡️', '🧪', '📜', '🏆', '👑', '💀',
  '❤️', '💙', '💚', '💛', '💜', '🧡', '🖤', '🤍', '💝', '✨',
  '🌟', '💫', '⚡', '🔥', '💥', '🕊️', '🎯', '🎮', '🎲', '🎭',
  '🗡️', '🏹', '🪄', '🧿', '🔮', '📿', '⚗️', '🔬', '📡', '🔭',
  '🌍', '🌙', '☀️', '⭐', '🌊', '🔥', '🌪️', '❄️', '⛰️', '🏝️',
  '👹', '👺', '🤖', '👾', '🐉', '🐲', '🦅', '🐺', '🦊', '🐱',
  '🍀', '🎄', '🎃', '🎁', '🎉', '🎊', '🎈', '💡', '🔑', '🗝️',
];

interface EmojiEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EmojiEditor({ value, onChange }: EmojiEditorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-8 rounded-lg border bg-background px-2.5 text-sm hover:border-muted-foreground/30 transition-colors"
      >
        <span className="text-lg">{value || '😀'}</span>
        <span className="text-xs text-muted-foreground">{value ? 'Trocar' : 'Selecionar emoji'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 p-2 rounded-xl border bg-popover shadow-lg w-72">
          <div className="grid grid-cols-10 gap-1">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onChange(emoji); setOpen(false); }}
                className={`h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors ${value === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
