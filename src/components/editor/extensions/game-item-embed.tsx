'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { type GameItemEmbedAttrs } from '@/lib/game-data-types'
import { GAME_TABLE_META } from '@/lib/game-table-labels'
import { ICON_MAP } from '@/lib/game-icons'

function GameItemEmbedNodeView(props: ReactNodeViewProps) {
  const { node, deleteNode } = props
  const { table, itemName } = node.attrs as GameItemEmbedAttrs
  const meta = GAME_TABLE_META[table]
  const Icon = meta ? ICON_MAP[meta.icon] : null

  return (
    <NodeViewWrapper>
      <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/30 my-2">
        {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{itemName}</div>
          <div className="text-xs text-muted-foreground">{meta?.label ?? table}</div>
        </div>
        <button
          type="button"
          onClick={() => deleteNode()}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors text-lg leading-none px-1"
          aria-label="Remover"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const GameItemEmbed = Node.create({
  name: 'gameItemEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      table: { default: '' },
      itemId: { default: '' },
      itemName: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-game-item-embed]',
        getAttrs(el) {
          const dom = el as HTMLElement
          return {
            table: dom.getAttribute('data-table') ?? '',
            itemId: dom.getAttribute('data-item-id') ?? '',
            itemName: dom.getAttribute('data-item-name') ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-game-item-embed': '',
        'data-table': HTMLAttributes.table,
        'data-item-id': HTMLAttributes.itemId,
        'data-item-name': HTMLAttributes.itemName,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GameItemEmbedNodeView)
  },
})
