'use client';

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import type { MentionResult, MentionType } from '@/lib/smart-mention-types';
import { queryTables, queryItems, queryArticles, queryUsers } from '@/lib/smart-mention-queries';

export interface SuggestionState {
  active: boolean;
  type: MentionType | null;
  search: string;
}

function parseQuery(query: string): { type: MentionType; search: string } | null {
  const match = query.match(/^([tia@l])<([^>]*)/);
  if (!match) return null;

  const typeMap: Record<string, MentionType> = {
    t: 'table',
    i: 'item',
    a: 'article',
    '@': 'user',
    l: 'link',
  };

  return {
    type: typeMap[match[1]] || 'table',
    search: match[2],
  };
}

function getTenantSlug(): string | null {
  try {
    const parts = window.location.pathname.split('/');
    const dashIdx = parts.indexOf('dashboard');
    if (dashIdx !== -1 && parts[dashIdx + 1]) return parts[dashIdx + 1];
    const wikiIdx = parts.indexOf('w');
    if (wikiIdx !== -1 && parts[wikiIdx + 1]) return parts[wikiIdx + 1];
  } catch {
    return null;
  }
  return null;
}

const SmartMentionPluginKey = new PluginKey('smartMention');

function getTypeChar(type: MentionType): string {
  switch (type) {
    case 'user': return '@';
    case 'table': return 't';
    case 'item': return 'i';
    case 'article': return 'a';
    case 'link': return 'l';
  }
}

function makeTextNode(schema: any, type: MentionType, label: string) {
  return schema.text('$' + getTypeChar(type) + '<' + label + '>');
}

export const SmartMention = Extension.create({
  name: 'smartMention',

  addOptions() {
    return {
      onSuggestionChange: null as ((state: SuggestionState) => void) | null,
    };
  },

  addProseMirrorPlugins() {
    const tenantSlug = getTenantSlug();

    return [
      Suggestion({
        editor: this.editor,
        char: '$',
        pluginKey: SmartMentionPluginKey,
        allowSpaces: false,
        startOfLine: false,

        items: async ({ query }): Promise<MentionResult[]> => {
          if (!query) return [];
          const parsed = parseQuery(query);
          if (!parsed) return [];
          if (!tenantSlug && parsed.type !== 'user') return [];

          switch (parsed.type) {
            case 'table':
              return queryTables(parsed.search, tenantSlug!);
            case 'item':
              return queryItems(parsed.search, tenantSlug!);
            case 'article':
              return queryArticles(parsed.search, tenantSlug!);
            case 'user':
              return queryUsers(parsed.search);
            case 'link':
              return parsed.search
                ? [{ id: parsed.search, label: parsed.search, description: 'URL externa', slug: parsed.search }]
                : [];
          }
        },

        render: () => {
          return {
            onStart: (props) => {
              const parsed = parseQuery(props.query || '');
              this.options.onSuggestionChange?.({
                active: true,
                type: parsed?.type ?? null,
                search: parsed?.search ?? props.query || '',
              });
            },

            onUpdate: (props) => {
              const parsed = parseQuery(props.query || '');
              this.options.onSuggestionChange?.({
                active: true,
                type: parsed?.type ?? null,
                search: parsed?.search ?? props.query || '',
              });
            },

            onExit: () => {
              this.options.onSuggestionChange?.({
                active: false,
                type: null,
                search: '',
              });
            },
          };
        },
      }),
    ];
  },
});
