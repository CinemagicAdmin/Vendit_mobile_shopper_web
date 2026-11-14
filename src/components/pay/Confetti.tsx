import type { CSSProperties } from 'react';

const COLORS = ['#55C1C3', '#3EBB52', '#F4B400', '#F75454', '#2D9295', '#7B6CF6'];
const SHAPES = [
  { width: 7, height: 12, borderRadius: 2 },
  { width: 6, height: 6, borderRadius: 3 },
  { width: 10, height: 4, borderRadius: 2 },
];
const PIECES = 32;

function piece(index: number): CSSProperties {
  const angle = (index / PIECES) * 2 * Math.PI + (index % 3) * 0.12;
  const reach = 120 + (index % 4) * 22;
  const shape = SHAPES[index % SHAPES.length];
  const flight: Record<string, string> = {
    '--dx': `${Math.round(Math.cos(angle) * reach)}px`,
    '--dy': `${Math.round(Math.sin(angle) * reach)}px`,
    '--rot': `${(index % 2 ? 1 : -1) * (200 + index * 17)}deg`,
    '--delay': `${300 + 50 * (index % 3)}ms`,
    '--dur': `${1000 + (index % 5) * 140}ms`,
  };
  return { ...shape, background: COLORS[index % COLORS.length], ...flight } as CSSProperties;
}

const STYLES = Array.from({ length: PIECES }, (_, index) => piece(index));

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {STYLES.map((style, index) => (
        <span key={index} className="vt-confetti" style={style} />
      ))}
    </div>
  );
}
