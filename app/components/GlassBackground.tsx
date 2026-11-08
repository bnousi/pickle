import type { CSSProperties } from 'react';

// The stickers, blown up and blurred into a soft colour field behind the glass.
const LAYOUTS: Record<'landing' | 'home' | 'app', { src: string; style: CSSProperties }[]> = {
  landing: [
    { src: '/stk-tomato.png', style: { width: '280px', top: '-60px', right: '-80px' } },
    { src: '/stk-kiwi.png', style: { width: '250px', top: '340px', left: '-110px' } },
    { src: '/stk-orange.png', style: { width: '240px', bottom: '80px', right: '-70px' } },
    { src: '/stk-strawberries.png', style: { width: '200px', bottom: '-50px', left: '30px' } },
  ],
  home: [
    { src: '/stk-tomato.png', style: { width: '260px', top: '-40px', right: '-70px' } },
    { src: '/stk-kiwi.png', style: { width: '240px', top: '300px', left: '-90px' } },
    { src: '/stk-orange.png', style: { width: '230px', bottom: '60px', right: '-60px' } },
    { src: '/stk-grapes.png', style: { width: '150px', bottom: '-40px', left: '40px' } },
  ],
  app: [
    { src: '/stk-strawberries.png', style: { width: '250px', top: '120px', right: '-90px' } },
    { src: '/stk-kiwi.png', style: { width: '230px', top: '470px', left: '-100px' } },
    { src: '/stk-bananas.png', style: { width: '230px', bottom: '-30px', right: '-40px' } },
    { src: '/stk-orange.png', style: { width: '180px', top: '-60px', left: '-50px' } },
  ],
};

export default function GlassBackground({ variant = 'app' }: { variant?: keyof typeof LAYOUTS }) {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {LAYOUTS[variant].map((s, i) => (
        <img
          key={s.src} src={s.src} alt=""
          style={{
            position: 'absolute', filter: 'blur(38px) saturate(1.6)', opacity: 0.95, userSelect: 'none',
            animation: `drift ${12 + i * 2}s ease-in-out infinite ${i % 2 ? 'reverse' : ''}`,
            ...s.style,
          }}
        />
      ))}
    </div>
  );
}
