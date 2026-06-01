'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { type TierlistAttrs } from '@/lib/game-data-types'

const TIER_COLORS: Record<string, string> = {
  S: 'bg-red-500/20 text-red-400 border-red-500/30',
  A: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  B: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  C: 'bg-green-500/20 text-green-400 border-green-500/30',
  D: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  F: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function parseTiers(raw: unknown): TierlistAttrs['tiers'] {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as TierlistAttrs['tiers']
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) return raw as TierlistAttrs['tiers']
  return []
}

function TierlistBlockNodeView(props: ReactNodeViewProps) {
  const { node, deleteNode } = props
  const attrs = node.attrs as unknown as {
    table: string
    title: string
    tiers: unknown
  }
  const tiers = parseTiers(attrs.tiers)

  return (
    <NodeViewWrapper>
      <div className="border rounded-lg overflow-hidden my-2">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <span className="font-semibold text-sm truncate">{attrs.title || 'Tierlist'}</span>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none px-1"
            aria-label="Remover"
          >
            ×
          </button>
        </div>
        <div className="p-2 space-y-1">
          {tiers.map((tier) => {
            const colors = TIER_COLORS[tier.label] ?? TIER_COLORS.F
            const count = tier.itemIds.length
            return (
              <div
                key={tier.label}
                className={`flex items-center gap-3 px-3 py-1.5 rounded border ${colors}`}
              >
                <span className="font-bold text-sm w-6 text-center shrink-0">
                  {tier.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const TierlistBlock = Node.create({
  name: 'tierlistBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      table: { default: '' },
      title: { default: '' },
      tiers: { default: '[]' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-tierlist-block]',
        getAttrs(el) {
          const dom = el as HTMLElement
          return {
            table: dom.getAttribute('data-table') ?? '',
            title: dom.getAttribute('data-title') ?? '',
            tiers: dom.getAttribute('data-tiers') ?? '[]',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-tierlist-block': '',
        'data-table': HTMLAttributes.table,
        'data-title': HTMLAttributes.title,
        'data-tiers': HTMLAttributes.tiers,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TierlistBlockNodeView)
  },
})
