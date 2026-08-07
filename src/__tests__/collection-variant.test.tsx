import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// rAF control para os contadores/scramble chegarem ao valor final
const rafCbs: FrameRequestCallback[] = [];
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  rafCbs.push(cb);
  return rafCbs.length;
});
vi.stubGlobal('cancelAnimationFrame', () => {});
const flushRaf = () => {
  const now = performance.now() + 2000;
  const cbs = rafCbs.splice(0);
  for (const cb of cbs) cb(now);
};

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
vi.stubGlobal('IntersectionObserver', ResizeObserverStub);

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} {...rest} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const base = {
  id: 'id-v3',
  slug: 'exemplo-de-itens-v3',
  name: 'Exemplo de Itens v3',
  rarity: 'legendary',
  tier: 's',
  damage_min: 100,
  damage_max: 150,
};
const rowV1 = { ...base, id: 'id-v1', slug: 'exemplo-de-itens-v1', name: 'Exemplo de Itens v1', damage_min: 10, damage_max: 20 };
const rowV2 = { ...base, id: 'id-v2', slug: 'exemplo-de-itens-v2', name: 'Exemplo de Itens v2', damage_min: 500, damage_max: 720 };

const variantList = [
  { id: 'x-v1', item_id: 'id-v1', item_slug: 'exemplo-de-itens-v1', variant_label: 'v1', variant_order: 1 },
  { id: 'x-v2', item_id: 'id-v2', item_slug: 'exemplo-de-itens-v2', variant_label: 'v2', variant_order: 2 },
];

let supabaseMock: any;

vi.mock('@/supabase', () => ({
  get supabase() {
    return supabaseMock;
  },
}));

function makeSupabase() {
  const rpc = vi.fn(() => Promise.resolve({ data: variantList, error: null }));
  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        in: () => Promise.resolve({ data: [rowV1, rowV2], error: null }),
        maybeSingle: () => Promise.resolve({ data: rowV2, error: null }),
      }),
    }),
  }));
  return { rpc, from };
}

describe('CollectionItemView variant switch animations', () => {
  it('applies 3D transition, beam and updates content when selecting a variant chip', async () => {
    supabaseMock = makeSupabase();
    const { default: CollectionItemView } = await import('@/components/wiki/collection-item-view');

    const { container } = render(
      <CollectionItemView
        data={base}
        tenantId="ten-a"
        tenantSlug="exemplo"
        sourceTable="example_table_1"
        comparisonMode="modal"
        schema={undefined}
        columnTypes={{ damage_min: 'numeric', damage_max: 'numeric' }}
      />,
    );

    const chip = await screen.findByText('v2');
    expect(chip).toBeTruthy();

    fireEvent.click(chip);

    // 1) Cabeçalho: beam presente e wrapper com transição 3D
    const beam = await waitFor(() => document.querySelector('.variant-beam-ltr, .variant-beam-rtl'));
    expect(beam).toBeTruthy();
    const wrapper = beam?.closest('.variant-3d-transition');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain('variant-3d-flip-in');

    // 2) Conteúdo: wrapper com expand + novo nome no h1
    expect(container.querySelector('.variant-content-expand')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Exemplo de Itens v2')).toBeInTheDocument();
    });

    // 3) Colunas: contadores/scramble animam até o novo valor (500)
    await waitFor(() => flushRaf());
    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    // 4) Componentes animados das colunas presentes (classe de animação do VariantAnimatedValue)
    const animated = container.querySelectorAll('[class*="animate-"]');
    expect(animated.length).toBeGreaterThan(0);
  }, 20000);
});
