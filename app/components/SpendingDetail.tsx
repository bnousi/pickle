'use client';

import { useState } from 'react';
import type { Expense } from '../lib/types';
import type { Theme } from '../lib/theme';
import { MONTHS_EN } from '../lib/content';
import { getExpCatDisplay } from '../lib/format';

export default function SpendingDetail({ allExp, C, now, budget, userName, partnerName, initialMonth }: { allExp: Expense[]; C: Theme; now: Date; budget: number | null; userName: string; partnerName: string; initialMonth?: { year: number; month: number } }) {
  const [dm, setDm] = useState(initialMonth ?? { year: now.getFullYear(), month: now.getMonth() });

  const canNext = dm.year < now.getFullYear() || (dm.year === now.getFullYear() && dm.month < now.getMonth());
  const prevMonth = () => setDm(d => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  const nextMonth = () => { if (canNext) setDm(d => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 }); };

  const monthStart = new Date(dm.year, dm.month, 1).getTime();
  const monthEnd = new Date(dm.year, dm.month + 1, 0, 23, 59, 59, 999).getTime();
  const monthExp = allExp.filter(e => e.createdAt >= monthStart && e.createdAt <= monthEnd);
  const byDay: Record<number, number> = {};
  const byDayUser: Record<number, number> = {};
  const byDayPartner: Record<number, number> = {};
  function rPB(paidBy: string) { return paidBy === 'user' ? userName : paidBy === 'partner' ? (partnerName || '') : paidBy; }
  monthExp.forEach(e => {
    const d = new Date(e.createdAt).getDate();
    byDay[d] = (byDay[d] || 0) + e.amount;
    if (rPB(e.paidBy) === userName) byDayUser[d] = (byDayUser[d] || 0) + e.amount;
    else byDayPartner[d] = (byDayPartner[d] || 0) + e.amount;
  });
  const monthTotal = monthExp.reduce((s, e) => s + e.amount, 0);
  const monthByUser = monthExp.filter(e => rPB(e.paidBy) === userName).reduce((s, e) => s + e.amount, 0);
  const monthByPartner = monthExp.filter(e => rPB(e.paidBy) === (partnerName || '')).reduce((s, e) => s + e.amount, 0);

  const firstDow = (new Date(dm.year, dm.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(dm.year, dm.month + 1, 0).getDate();

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const s = d.getTime();
    const e2 = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const total = allExp.filter(e => e.createdAt >= s && e.createdAt <= e2).reduce((sum, e) => sum + e.amount, 0);
    return { year: d.getFullYear(), month: d.getMonth(), total };
  });
  const maxBar = Math.max(...chartMonths.map(m => m.total), 1);

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WEEK = ['Mo','Tu','We','Th','Fr','Sa','Su'];

  const budgetPct = budget && monthTotal ? Math.min(monthTotal / budget, 1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={prevMonth} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${C.border}`, backgroundColor: C.surface2, color: C.text, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: C.dim, margin: '0 0 2px', letterSpacing: '0.3px' }}>{MONTHS_EN[dm.month]} {dm.year}</p>
          <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '32px', fontWeight: '700', color: C.text, margin: 0, lineHeight: 1 }}>€{monthTotal.toFixed(2)}</p>
          {monthTotal > 0 && (
            <p style={{ fontSize: '12px', color: C.dim, margin: '6px 0 0' }}>
              {userName} €{monthByUser.toFixed(2)} · {partnerName || '...'} €{monthByPartner.toFixed(2)}
            </p>
          )}
          {budget && (
            <p style={{ fontSize: '12px', color: budgetPct >= 1 ? '#FF5050' : C.dim, margin: '4px 0 0', fontWeight: budgetPct >= 1 ? '700' : '400' }}>
              {budgetPct >= 1 ? `over limit by €${(monthTotal - budget).toFixed(2)}` : `€${(budget - monthTotal).toFixed(2)} under limit`}
            </p>
          )}
        </div>
        <button onClick={nextMonth} disabled={!canNext} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${C.border}`, backgroundColor: C.surface2, color: canNext ? C.text : C.muted, fontSize: '18px', cursor: canNext ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>›</button>
      </div>

      {/* Calendar */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
          {WEEK.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: C.dim }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const amt = byDay[day];
            const hasUser = !!byDayUser[day];
            const hasPartner = !!byDayPartner[day];
            const both = hasUser && hasPartner;
            const isToday = dm.year === now.getFullYear() && dm.month === now.getMonth() && day === now.getDate();
            const dotColor = both ? '#9B59D0' : hasUser ? '#1B5FAD' : hasPartner ? '#2D7D46' : null;
            const bgColor = both ? 'rgba(155,89,208,0.13)' : hasUser ? 'rgba(27,95,173,0.13)' : hasPartner ? 'rgba(45,125,70,0.13)' : isToday ? C.surface2 : 'transparent';
            const borderColor = both ? '#9B59D055' : hasUser ? '#1B5FAD55' : hasPartner ? '#2D7D4655' : isToday ? C.border : 'transparent';
            return (
              <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '46px', borderRadius: '10px', backgroundColor: bgColor, border: `1.5px solid ${borderColor}`, padding: '4px 2px', gap: '2px' }}>
                <span style={{ fontSize: '12px', color: dotColor ?? (isToday ? C.text : C.dim), fontWeight: amt || isToday ? '700' : '400', lineHeight: 1 }}>{day}</span>
                {amt && <span style={{ fontSize: '9px', color: dotColor ?? C.dim, fontWeight: '800', lineHeight: 1 }}>€{amt % 1 === 0 ? Math.round(amt) : amt.toFixed(2)}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut chart — category breakdown */}
      {monthExp.length > 0 && (() => {
        const bycat: Record<string, number> = {};
        for (const e of monthExp) {
          const cat = e.category || 'other';
          bycat[cat] = (bycat[cat] || 0) + e.amount;
        }
        const R = 50, cx = 65, cy = 65, strokeW = 20;
        const circ = 2 * Math.PI * R;
        let offsetFrac = 0;
        const slices = Object.entries(bycat)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => {
            const pct = amt / monthTotal;
            const dashLen = pct * circ;
            const dashOffset = -(offsetFrac * circ);
            offsetFrac += pct;
            return { cat, amt, pct, dashLen, dashOffset };
          });

        return (
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: C.dim, margin: '0 0 14px' }}>By category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
                {slices.map(s => (
                  <circle key={s.cat} cx={cx} cy={cy} r={R}
                    fill="none" stroke={getExpCatDisplay(s.cat).accent}
                    strokeWidth={strokeW}
                    strokeDasharray={`${s.dashLen} ${circ - s.dashLen}`}
                    strokeDashoffset={s.dashOffset}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
                  />
                ))}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
                {slices.map(s => {
                  const d = getExpCatDisplay(s.cat);
                  return (
                    <div key={s.cat} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: d.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: C.text, fontWeight: '700', flex: 1 }}>{d.emoji} {d.label}</span>
                      <span style={{ fontSize: '11px', color: C.dim, fontFamily: "var(--font-mono), 'Courier New', monospace" }}>€{s.amt.toFixed(0)}</span>
                      <span style={{ fontSize: '12px', color: C.dim, fontWeight: '600' }}>{Math.round(s.pct * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Monthly bar chart */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: C.dim, margin: '0 0 16px' }}>Last 6 months</p>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          {chartMonths.map(m => {
            const isSel = m.year === dm.year && m.month === dm.month;
            const barH = m.total > 0 ? Math.max(Math.round((m.total / maxBar) * 88), 6) : 0;
            return (
              <div key={`${m.year}-${m.month}`} onClick={() => setDm({ year: m.year, month: m.month })} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <span style={{ fontSize: '9px', color: isSel ? C.accent : C.dim, fontWeight: '700', height: '14px', display: 'flex', alignItems: 'flex-end' }}>
                  {m.total > 0 ? `€${Math.round(m.total)}` : ''}
                </span>
                <div style={{ width: '100%', height: '88px', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${barH}px`, backgroundColor: isSel ? C.accent : C.surface2, borderRadius: '4px 4px 0 0', transition: 'all 0.25s ease' }} />
                </div>
                <span style={{ fontSize: '9px', color: isSel ? C.accent : C.dim, fontWeight: isSel ? '700' : '400' }}>{MONTHS_SHORT[m.month]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ height: '1px', backgroundColor: C.border }} />
      </div>

    </div>
  );
}
