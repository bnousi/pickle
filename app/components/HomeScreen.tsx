'use client';

import type { ReactNode } from 'react';
import type { Theme } from '../lib/theme';
import type { Item, Tab } from '../lib/types';
import { DAYS } from '../lib/content';
import { ACCENT, INK, PARTNER_TINT, USER_TINT, glass, numeral } from '../lib/ui';
import GlassBackground from './GlassBackground';
import Icon from './Icon';

type Props = {
  C: Theme;
  userName: string;
  partnerName: string;
  toBuy: Item[];
  boughtCount: number;
  monthTotal: number;
  budget: number | null;
  balance: number;
  onOpen: (tab: Tab) => void;
  banner?: ReactNode;
};

function greeting(h: number) {
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

// Landing screen once the household is set up: today at a glance.
export default function HomeScreen({ C, userName, partnerName, toBuy, boughtCount, monthTotal, budget, balance, onOpen, banner }: Props) {
  const now = new Date();
  const today = DAYS[now.getDay()];
  const total = toBuy.length + boughtCount;
  const progress = total > 0 ? boughtCount / total : 0;
  const preview = toBuy.slice(0, 4).map(i => i.name).join(', ');
  const latest = [...toBuy].sort((a, b) => b.createdAt - a.createdAt)[0];
  const budgetPct = budget ? Math.min(monthTotal / budget, 1) : 0;
  const partner = partnerName || 'your partner';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '40px' }}>
      <GlassBackground variant="home" />
      {banner}

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 18px 0' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 4px' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.6px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: C.text }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: ACCENT }} />pickle
            </p>
            <p style={{ marginTop: '22px', fontSize: '14px', fontWeight: 500, color: C.dim }}>
              {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: '36px', lineHeight: 1.08, fontWeight: 700, letterSpacing: '-1.2px', color: C.text }}>
              {greeting(now.getHours())},<br />{userName}.
            </h1>
          </div>
          <div style={{ ...glass(999), padding: '4px', display: 'flex' }} aria-label={`${userName} and ${partner}`}>
            <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: USER_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: INK }}>{userName[0]?.toUpperCase()}</span>
            {partnerName && <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: PARTNER_TINT, marginLeft: '-8px', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: INK }}>{partnerName[0]?.toUpperCase()}</span>}
          </div>
        </div>

        {/* Shopping list */}
        <button type="button" onClick={() => onOpen('shop')} className="slide-up" style={{ ...glass(30), width: '100%', marginTop: '26px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: C.text }}>
          <span style={{ position: 'relative', width: '108px', height: '108px', flexShrink: 0 }}>
            <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true">
              <circle cx="54" cy="54" r={RING_R} fill="none" stroke="rgba(16,35,26,0.10)" strokeWidth="10" />
              <circle cx="54" cy="54" r={RING_R} fill="none" stroke={ACCENT} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${progress * RING_C} ${RING_C}`} transform="rotate(-90 54 54)"
                style={{ animation: 'draw-ring 0.9s ease-out', opacity: progress > 0 ? 1 : 0 }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ ...numeral, fontSize: '36px' }}>{toBuy.length}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: C.dim }}>to buy</span>
            </span>
          </span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: C.dim }}>Shopping list</span>
            <span style={{ marginTop: '6px', fontSize: '16px', fontWeight: 600, lineHeight: 1.4 }}>
              {toBuy.length === 0 ? 'Nothing on the list yet.' : preview}
              {toBuy.length > 4 && <span style={{ color: C.dim, fontWeight: 500 }}> +{toBuy.length - 4}</span>}
            </span>
            <span style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: ACCENT }}>
              {toBuy.length === 0 ? 'Add something' : 'Start shopping'} <Icon name="arrow-right" size={14} strokeWidth={2.6} />
            </span>
          </span>
        </button>

        {/* Money widgets */}
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <button type="button" onClick={() => onOpen('split')} className="slide-up" style={{ ...glass(26), padding: '16px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: C.text }}>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.dim }}>This month</span>
            <span style={{ ...numeral, display: 'block', marginTop: '8px', fontSize: '32px' }}>€{Math.round(monthTotal)}</span>
            {budget ? (
              <>
                <span style={{ display: 'block', marginTop: '12px', height: '6px', borderRadius: '999px', background: 'rgba(16,35,26,0.10)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${budgetPct * 100}%`, height: '100%', borderRadius: '999px', background: budgetPct >= 0.9 ? C.danger : ACCENT }} />
                </span>
                <span style={{ display: 'block', marginTop: '8px', fontSize: '12px', fontWeight: 500, color: C.dim }}>
                  {monthTotal > budget ? `€${Math.round(monthTotal - budget)} over €${Math.round(budget)}` : `€${Math.round(budget - monthTotal)} left of €${Math.round(budget)}`}
                </span>
              </>
            ) : (
              <span style={{ display: 'block', marginTop: '12px', fontSize: '12px', fontWeight: 500, color: C.dim }}>No monthly limit set</span>
            )}
          </button>
          <button type="button" onClick={() => onOpen('split')} className="slide-up" style={{ ...glass(26), padding: '16px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: C.text }}>
            {Math.abs(balance) < 0.01 ? (
              <>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.dim }}>Balance</span>
                <span style={{ ...numeral, display: 'block', marginTop: '8px', fontSize: '26px' }}>All square</span>
                <span style={{ display: 'block', marginTop: '12px', fontSize: '12px', fontWeight: 500, color: C.dim }}>Nobody owes anything</span>
              </>
            ) : (
              <>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.dim }}>{balance > 0 ? `${partner} owes you` : `You owe ${partner}`}</span>
                <span style={{ ...numeral, display: 'block', marginTop: '8px', fontSize: '32px', color: balance > 0 ? ACCENT : C.danger }}>€{Math.abs(balance).toFixed(2)}</span>
                <span style={{ display: 'inline-flex', marginTop: '12px', height: '30px', padding: '0 12px', alignItems: 'center', borderRadius: '999px', background: INK, color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>Settle up</span>
              </>
            )}
          </button>
        </div>

        {/* Song of the day */}
        <div className="slide-up" style={{ ...glass(26), marginTop: '14px', padding: '18px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: C.dim, margin: 0 }}>
            <Icon name="music" size={14} /> Today&apos;s soundtrack
          </p>
          <p style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.3px', lineHeight: 1.35, margin: '8px 0 14px', color: C.text }}>{today.msg}</p>
          <a href={today.spotify} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 14px', borderRadius: '999px', background: INK, color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
            {today.song} — {today.artist}
          </a>
        </div>

        {/* Latest activity */}
        {latest && (
          <div className="slide-up" style={{ ...glass(22), marginTop: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(30,107,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>
              <Icon name="bell" size={18} />
            </span>
            <p style={{ fontSize: '14px', lineHeight: 1.35, margin: 0, color: C.text, fontWeight: 500 }}>
              <b style={{ fontWeight: 700 }}>{latest.addedBy === userName ? 'You' : latest.addedBy || 'Someone'}</b> added {latest.name}
              <span style={{ color: C.dim }}> · {timeAgo(latest.createdAt)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
