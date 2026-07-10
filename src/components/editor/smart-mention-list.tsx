'use client';

import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { Loader2 } from 'lucide-react';
import type { MentionResult, MentionType } from '@/lib/smart-mention-types';

export interface SmartMentionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SmartMentionListProps {
  items: MentionResult[];
  command: (item: MentionResult) => void;
  query: string;
  mentionType: MentionType;
  loading?: boolean;
}

export const SmartMentionList = forwardRef<SmartMentionListRef, SmartMentionListProps>(
  function SmartMentionList({ items, command, query, mentionType, loading }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command],
    );

    const onKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1));
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0));
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        if (event.key === 'Escape') {
          return true;
        }
        return false;
      },
      [items.length, selectedIndex, selectItem],
    );

    useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    if (loading) {
      return (
        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground min-w-[200px]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="p-3 text-sm text-muted-foreground min-w-[200px]">
          {mentionType === 'link' ? (
            <div className="text-xs text-muted-foreground break-all">
              Link: <span className="text-primary">{query}</span>
            </div>
          ) : (
            <span>
              Nada encontrado para &ldquo;{query}&rdquo;
              {mentionType !== 'user' && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Será linkado automaticamente quando o recurso existir.
                </span>
              )}
            </span>
          )}
        </div>
      );
    }

    const iconMap: Record<string, string> = {
      table: '▦',
      item: '◇',
      article: '📄',
      user: '👤',
      link: '🔗',
    };

    return (
      <div className="min-w-[240px] max-h-[300px] overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
              index === selectedIndex
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            }`}
            onClick={() => selectItem(index)}
          >
            {item.avatarUrl ? (
              <img
                src={item.avatarUrl}
                alt=""
                className="h-6 w-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="shrink-0 text-base">{iconMap[mentionType] || '•'}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{item.label}</div>
              {item.description && (
                <div className="truncate text-xs text-muted-foreground">
                  {item.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  },
);
