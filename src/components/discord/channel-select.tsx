'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGuildData } from './guild-data-context';
import { Hash, Check } from 'lucide-react';

interface ChannelSelectProps {
  channelId: string;
  channelName: string;
  onChange: (channelId: string, channelName: string) => void;
  label: string;
  description?: string;
}

export function ChannelSelect({ channelId, channelName, onChange, label, description }: ChannelSelectProps) {
  const { channels, selectedGuild, loading } = useGuildData();
  const textChannels = channels.filter((c) => c.type === 0);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentName = channelId
    ? textChannels.find((c) => c.id === channelId)?.name ?? ''
    : channelName;

  useEffect(() => {
    setInputValue(currentName);
  }, [currentName]);

  const filtered = textChannels.filter((c) =>
    c.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const selectById = useCallback((id: string) => {
    const ch = textChannels.find((c) => c.id === id);
    if (ch) {
      onChange(id, '');
      setInputValue(ch.name);
    }
    setIsOpen(false);
  }, [textChannels, onChange]);

  const commitText = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      onChange('', '');
      return;
    }
    const match = textChannels.find((c) => c.name === trimmed);
    if (match) {
      onChange(match.id, '');
    } else {
      onChange('', trimmed);
    }
  }, [textChannels, inputValue, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {!selectedGuild ? (
        <p className="text-xs text-muted-foreground">Selecione um servidor primeiro.</p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Carregando canais...</p>
      ) : (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
                setHighlightIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(commitText, 160)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (highlightIndex >= 0 && filtered[highlightIndex]) {
                    selectById(filtered[highlightIndex].id);
                  } else {
                    commitText();
                    (e.target as HTMLInputElement).blur();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder="# canal ou digite para criar"
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  {inputValue.trim()
                    ? 'Nenhum canal existente. O bot criará um novo com esse nome.'
                    : 'Digite para buscar ou criar um canal.'}
                </div>
              ) : (
                filtered.map((ch, i) => (
                  <button
                    key={ch.id}
                    type="button"
                    onMouseDown={() => selectById(ch.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      i === highlightIndex ? 'bg-accent text-accent-foreground' : ''
                    } ${ch.id === channelId ? 'bg-primary/10' : ''}`}
                  >
                    <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{ch.name}</span>
                    {ch.id === channelId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
