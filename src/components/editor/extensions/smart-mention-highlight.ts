'use client';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const SmartMentionHighlight = Extension.create({
  name: 'smartMentionHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('smartMentionHighlight'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _old) {
            const doc = tr.doc;
            if (!doc) return DecorationSet.empty;

            const decorations: Decoration[] = [];
            const regex = /\$([tia@l])<([^>]+)>/g;

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;

              let match;
              regex.lastIndex = 0;

              while ((match = regex.exec(node.text)) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;
                const type = match[1];
                const slug = match[2];

                const typeClass =
                  type === 't' ? 'mention-table' :
                  type === 'i' ? 'mention-item' :
                  type === 'a' ? 'mention-article' :
                  type === '@' ? 'mention-user' :
                  'mention-link';

                decorations.push(
                  Decoration.inline(from, to, {
                    class: `smart-mention-badge ${typeClass}`,
                    'data-mention-type': type,
                    'data-mention-slug': slug,
                  }),
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
