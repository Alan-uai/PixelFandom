import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';

// Controlado frame a frame para provar que a animação passa por estados
// intermediários (não pula direto ao valor final).
const rafCbs: FrameRequestCallback[] = [];
let now = 0;
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  rafCbs.push(cb);
  return rafCbs.length;
});
vi.stubGlobal('cancelAnimationFrame', () => {});
vi.stubGlobal('performance', { now: () => now });

const flushOne = (deltaMs: number) => {
  now += deltaMs;
  const cbs = rafCbs.splice(0);
  for (const cb of cbs) act(() => cb(now));
};

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
vi.stubGlobal('IntersectionObserver', ResizeObserverStub);

afterEach(() => {
  rafCbs.length = 0;
  now = 0;
});

describe('VariantAnimatedValue transition frames', () => {
  it('counter percorre valores intermediários antes de chegar ao destino', async () => {
    const { VariantAnimatedValue } = await import('@/components/wiki/variant-animated-value');

    const { rerender } = render(
      <VariantAnimatedValue value={100} renderType="number" trigger={0} />,
    );

    rerender(<VariantAnimatedValue value={500} renderType="number" trigger={1} />);

    // após o primeiro frame (t ~0) ainda deve estar em 100 (valor de partida)
    flushOne(0);
    expect(screen.getByText('100')).toBeInTheDocument();

    // ~50% da duração: deve estar num valor intermediário, não em 500
    flushOne(200);
    const midway = screen.getByText(/^[1-4]\d\d$|^5\d\d$|^\d\d\d$|^\d+$/);
    expect(midway.textContent).toBeTruthy();
    expect(midway.textContent).not.toBe('500');
    expect(Number(midway.textContent)).toBeGreaterThan(100);
    expect(Number(midway.textContent)).toBeLessThan(500);

    // termina em 500
    flushOne(300);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('scramble percorre glifos antes de revelar o texto final', async () => {
    const { VariantAnimatedValue } = await import('@/components/wiki/variant-animated-value');

    const { rerender } = render(
      <VariantAnimatedValue value="alpha" renderType="text" trigger={0} />,
    );

    rerender(<VariantAnimatedValue value="omega" renderType="text" trigger={1} />);

    // primeiro frame (t=0): glifos aleatórios, nem alpha nem omega
    flushOne(0);
    const g0 = screen.getByText(/^.{5}$/);
    expect(g0.textContent).not.toBe('alpha');
    expect(g0.textContent).not.toBe('omega');

    // meio da animação: texto parcialmente revelado, ainda não é "omega"
    flushOne(200);
    const mid = screen.getByText(/^.{5}$/);
    expect(mid.textContent).not.toBe('omega');

    // fim: revela o texto novo
    flushOne(300);
    expect(screen.getByText('omega')).toBeInTheDocument();
  });

  it('renderType "integer" (registry) usa contador, não flip', async () => {
    const { VariantAnimatedValue } = await import('@/components/wiki/variant-animated-value');

    const { rerender } = render(
      <VariantAnimatedValue value={10} renderType="integer" trigger={0} />,
    );

    rerender(<VariantAnimatedValue value={40} renderType="integer" trigger={1} />);

    // ~50% da duração: deve estar num valor intermediário
    flushOne(200);
    const midway = screen.getByText(/^\d+$/);
    expect(midway.textContent).toBeTruthy();
    expect(midway.textContent).not.toBe('40');
    expect(Number(midway.textContent)).toBeGreaterThan(10);
    expect(Number(midway.textContent)).toBeLessThan(40);

    // termina em 40
    flushOne(300);
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('animações desativadas pela preferência pulam direto ao valor final', async () => {
    const { VariantAnimatedValue } = await import('@/components/wiki/variant-animated-value');
    const { UserPreferencesContext, DEFAULT_PREFERENCES } = await import('@/context/user-preferences-context');

    const prefs = {
      ...DEFAULT_PREFERENCES,
      animations: { enabled: false, dashboard: true, wiki: true },
    };
    const ctxValue = {
      preferences: prefs,
      updatePreference: () => {},
      updatePreferences: () => {},
      synced: true,
      saving: false,
      prefersReducedMotion: false,
    };

    const { rerender } = render(
      <UserPreferencesContext.Provider value={ctxValue}>
        <VariantAnimatedValue value={100} renderType="number" trigger={0} />
      </UserPreferencesContext.Provider>,
    );

    rerender(
      <UserPreferencesContext.Provider value={ctxValue}>
        <VariantAnimatedValue value={500} renderType="number" trigger={1} />
      </UserPreferencesContext.Provider>,
    );

    // Sem animação: no meio da "duração" já deve estar no valor final
    flushOne(200);
    expect(screen.getByText('500')).toBeInTheDocument();
    flushOne(300);
    expect(screen.getByText('500')).toBeInTheDocument();
  });
});
