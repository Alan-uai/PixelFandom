'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function SmoothScroll() {
  useEffect(() => {
    if (ScrollSmoother.get()) return;

    const smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.1,
      smoothTouch: 0.1,
      effects: true,
      normalizeScroll: false,
    });

    ScrollTrigger.refresh();

    return () => {
      smoother.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
