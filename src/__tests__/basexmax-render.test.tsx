import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} {...rest} />
  ),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

class RO { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', RO);
vi.stubGlobal('IntersectionObserver', RO);
const rafCbs: FrameRequestCallback[] = [];
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { rafCbs.push(cb); return rafCbs.length; });
vi.stubGlobal('cancelAnimationFrame', () => {});

let supabaseMock: any;
vi.mock('@/supabase', () => ({
  get supabase() { return supabaseMock; },
}));

const { ColumnDisplay } = await import('@/lib/column-types/display-factory');
const { BaseXmaxContext, DEFAULT_BASEXMAX } = await import('@/lib/scaling-context');

const val = { 'Fogo Elemental': { base: 25, max: 75 } };

describe('baseXmax per-card slider', () => {
  it('renders slider when context enabled + showPerCardSlider', () => {
    render(
      <BaseXmaxContext.Provider value={{ ...DEFAULT_BASEXMAX, enabled: true, showPerCardSlider: true }}>
        <ColumnDisplay value={val} column="atributos" renderType="baseXmax" />
      </BaseXmaxContext.Provider>,
    );
    const name = screen.queryByText(/Fogo Elemental/i);
    console.log('SLIDER FOGO PRESENT:', !!name);
    console.log('SLIDER HTML:', document.body.innerHTML.slice(0, 800));
    expect(name).toBeTruthy();
  });
});
