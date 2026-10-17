'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from '../lib/theme';
import { DAYS } from '../lib/content';

// Edge stickers first (drawn above the card), then the faded ones in the background.
const STICKERS: { src: string; style: CSSProperties }[] = [
  { src: '/stk-strawberries.png', style: { top: '2%', left: '-38px', width: '116px', transform: 'rotate(-122deg)', zIndex: 2 } },
  { src: '/stk-duck.png', style: { top: '4%', right: '-22px', width: '96px', transform: 'rotate(12deg)', zIndex: 2 } },
  { src: '/stk-pineapple.png', style: { top: '20%', right: '1%', height: '90px', width: 'auto', transform: 'rotate(-6deg)', zIndex: 2 } },
  { src: '/stk-star.png', style: { top: '38%', right: '9%', width: '58px', transform: 'rotate(-10deg)', zIndex: 3 } },
  { src: '/stk-japanese-burst.png', style: { top: '52%', left: '1%', width: '72px', transform: 'rotate(-8deg)', zIndex: 2 } },
  { src: '/stk-tomatoes-vine.png', style: { top: '50%', right: '-38px', width: '96px', transform: 'rotate(-40deg)', zIndex: 2 } },
  { src: '/stk-grapes.png', style: { top: '73%', left: '-6px', width: '70px', transform: 'rotate(-11deg)', zIndex: 0 } },
  { src: '/stk-del-monte.png', style: { top: '12%', left: '18%', width: '70px', opacity: 0.40, transform: 'rotate(-14deg)', zIndex: 0 } },
  { src: '/stk-super-special.png', style: { top: '8%', right: '22%', width: '72px', opacity: 0.38, transform: 'rotate(20deg)', zIndex: 0 } },
  { src: '/stk-jello.png', style: { top: '28%', left: '12%', width: '68px', opacity: 0.36, transform: 'rotate(10deg)', zIndex: 0 } },
  { src: '/stk-pie.png', style: { top: '32%', right: '14%', width: '82px', opacity: 0.38, transform: 'rotate(-18deg)', zIndex: 0 } },
  { src: '/stk-ohoh-apple.png', style: { top: '48%', left: '30%', width: '66px', opacity: 0.36, transform: 'rotate(12deg)', zIndex: 0 } },
  { src: '/stk-orange.png', style: { top: '44%', right: '20%', width: '62px', opacity: 0.36, transform: 'rotate(-8deg)', zIndex: 0 } },
  { src: '/stk-dragonfruit.png', style: { top: '60%', left: '22%', width: '76px', opacity: 0.38, transform: 'rotate(16deg)', zIndex: 0 } },
  { src: '/stk-soymilk.png', style: { top: '62%', right: '16%', width: '66px', opacity: 0.36, transform: 'rotate(-12deg)', zIndex: 0 } },
  { src: '/stk-big-sale.png', style: { top: '77%', left: '40%', width: '74px', opacity: 0.38, transform: 'rotate(8deg)', zIndex: 0 } },
  { src: '/stk-cool.png', style: { top: '82%', right: '24%', width: '78px', opacity: 0.36, transform: 'rotate(-16deg)', zIndex: 0 } },
];

type Props = {
  C: Theme;
  itemCount: number;
  onOpen: () => void;
  banner?: ReactNode;
};

// Landing screen with the message of the day; tapping anywhere opens the list.
export default function HomeScreen({ C, itemCount, onOpen, banner }: Props) {
  const today = DAYS[new Date().getDay()];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F2', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {banner}

      {STICKERS.map(s => (
        <img key={s.src} src={s.src} alt="" style={{ position: 'absolute', pointerEvents: 'none', userSelect: 'none', ...s.style }} />
      ))}

      {/* Whole page is tappable */}
      <div onClick={onOpen} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: '52px 24px 48px' }}>

        {/* Center section — logo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>

          {/* Logo */}
          <span style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '52px', fontWeight: '900', color: '#E91E8C', letterSpacing: '-2px', lineHeight: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
            pickle
          </span>

        </div>

        {/* Daily message card — bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '24px', padding: '28px 24px 24px', border: '1px solid rgba(224,221,214,0.8)' }}>
            <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '20px', color: C.text, margin: '0 0 16px', fontWeight: '700', lineHeight: 1.35 }}>
              {today.msg}
            </p>
            <a href={today.spotify} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', backgroundColor: '#1DB954', borderRadius: '20px', textDecoration: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'white', letterSpacing: '0.3px' }}>{today.song} — {today.artist}</span>
            </a>
          </div>

          {/* Bottom hint */}
          {itemCount === 0 ? (
            <p style={{ fontSize: '12px', color: C.dim, margin: 0, textAlign: 'center', letterSpacing: '0.5px', fontWeight: '600' }}>
              tap anywhere to start
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'center', backgroundColor: '#FFD600', borderRadius: '20px', padding: '10px 22px', boxShadow: '0 3px 12px rgba(255,214,0,0.4)', cursor: 'pointer', gap: '3px' }}>
              <span style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '13px', fontWeight: '900', color: '#1A1A00' }}>
                {itemCount} item{itemCount === 1 ? '' : 's'} on the list
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#1A1A00', opacity: 0.65, letterSpacing: '0.8px', textTransform: 'uppercase' }}>tap to go</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
