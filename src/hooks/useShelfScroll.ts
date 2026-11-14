'use client';

import { useEffect, useRef } from 'react';

const FADE_PX = 120;
const PIN_PX = 132;

// Writes styles straight to the nodes so a scroll never re-renders the shelf.
export function useShelfScroll() {
  const heroRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      const progress = Math.min(Math.max(window.scrollY / FADE_PX, 0), 1);
      const hero = heroRef.current;
      const chips = chipsRef.current;
      if (hero) {
        hero.style.opacity = String(1 - 0.6 * progress);
        hero.style.transform = `scale(${1 - 0.04 * progress})`;
      }
      if (chips) chips.style.boxShadow = window.scrollY >= PIN_PX ? '0 2px 8px rgba(0,0,0,0.05)' : 'none';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { heroRef, chipsRef };
}
