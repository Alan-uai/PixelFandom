'use client';

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { createRoot, type Root } from 'react-dom/client';
import type { MentionResult, MentionType } from '@/lib/smart-mention-types';
import { queryTables, queryItems, queryArticles, queryUsers } from '@/lib/smart-mention-queries';
import { SmartMentionList, type SmartMentionListRef } from '../smart-mention-list';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

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
          let dom: HTMLDivElement | null = null;
          let rootInstance: Root | null = null;
          let listRef: SmartMentionListRef | null = null;
          let currentType: MentionType = 'table';

          function fetchAndRender(
            query: string,
            command: (item: MentionResult) => void,
          ) {
            if (!dom) return;
            const parsed = parseQuery(query);
            if (!parsed) { renderList([], false, ''); return; }
            currentType = parsed.type;
            const search = parsed.search;

            (async () => {
              try {
                if (!tenantSlug && currentType !== 'user') {
                  renderList([], false, search);
                  return;
                }
                let results: MentionResult[];
                switch (currentType) {
                  case 'table':
                    results = await queryTables(search, tenantSlug!);
                    break;
                  case 'item':
                    results = await queryItems(search, tenantSlug!);
                    break;
                  case 'article':
                    results = await queryArticles(search, tenantSlug!);
                    break;
                  case 'user':
                    results = await queryUsers(search);
                    break;
                  case 'link':
                    results = search
                      ? [{ id: search, label: search, description: 'URL externa', slug: search }]
                      : [];
                    break;
                }

                const wrappedCommand = (item: MentionResult) => {
                  command(item);
                  renderList(results!, false, search);
                };

                renderList(results!, false, search, wrappedCommand);
              } catch {
                renderList([], false, search);
              }
            })();
          }

          function renderList(
            items: MentionResult[],
            loading: boolean,
            query: string,
            externalCommand?: (item: MentionResult) => void,
          ) {
            if (!dom) return;
            if (!rootInstance) {
              rootInstance = createRoot(dom);
            }

            const handleCommand = externalCommand || ((_item: MentionResult) => {});

            rootInstance.render(
              <SmartMentionList
                ref={(ref) => {
                  listRef = ref;
                }}
                items={items}
                command={handleCommand}
                query={query}
                mentionType={currentType}
                loading={loading}
              />,
            );
          }

          return {
            onStart: (props) => {
              dom = document.createElement('div');
              dom.className =
                'bg-popover text-popover-foreground border rounded-lg shadow-lg z-[9999]';
              document.body.appendChild(dom);

              renderList([], true, props.query || '');

              fetchAndRender(props.query || '', (item) => {
                if (!dom) return;
                const { view } = props.editor;
                const { tr, schema } = view.state;
                const label = item.slug || item.id;
                const textNode = makeTextNode(schema, currentType, label);
                const resolvedRange = props.range;
                if (resolvedRange) {
                  view.dispatch(
                    tr.replaceWith(resolvedRange.from, resolvedRange.to, textNode),
                  );
                }
                view.focus();

                if (rootInstance) {
                  rootInstance.unmount();
                  rootInstance = null;
                }
                if (dom) {
                  dom.remove();
                  dom = null;
                }
              });
            },

            onUpdate: (props) => {
              fetchAndRender(props.query || '', (item) => {
                if (!dom) return;
                const { view } = props.editor;
                const { tr, schema } = view.state;
                const label = item.slug || item.id;
                const textNode = makeTextNode(schema, currentType, label);
                const resolvedRange = props.range;
                if (resolvedRange) {
                  view.dispatch(
                    tr.replaceWith(resolvedRange.from, resolvedRange.to, textNode),
                  );
                }
                view.focus();

                if (rootInstance) {
                  rootInstance.unmount();
                  rootInstance = null;
                }
                if (dom) {
                  dom.remove();
                  dom = null;
                }
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape' && dom) {
                if (rootInstance) {
                  rootInstance.unmount();
                  rootInstance = null;
                }
                dom.remove();
                dom = null;
                return true;
              }

              if (listRef) {
                return listRef.onKeyDown(props.event as unknown as ReactKeyboardEvent);
              }

              return false;
            },

            onExit: (props) => {
              if (dom) {
                if (rootInstance) {
                  rootInstance.unmount();
                  rootInstance = null;
                }
                dom.remove();
                dom = null;
              }
            },
          };
        },
      }),
    ];
  },
});
