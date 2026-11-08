'use client';

import { useState } from 'react';
import type { Expense } from '../lib/types';
import type { Theme } from '../lib/theme';
import { MONTHS_EN } from '../lib/content';
import { getExpCatDisplay } from '../lib/format';
import { ACCENT, glass, iconBtn, numeral } from '../lib/ui';
import Icon from './Icon';

const USER_COLOR = '#2F7FC1';
const PARTNER_COLOR = '#B7790F';
const BOTH_COLOR = '#7A63D1';

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
  const card = { ...glass(24), padding: '16px' };
  const heading: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="button" onClick={prevMonth} aria-label="Previous month" style={iconBtn}><Icon name="chevron-left" size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: C.dim, margin: 0, fontWeight: 600 }}>{MONTHS_EN[dm.month]} {dm.year}</p>
          <p style={{ ...numeral, fontSize: '44px', color: C.text, margin: '2px 0 0' }}>€{monthTotal.toFixed(2)}</p>
          {monthTotal > 0 && (
            <p style={{ fontSize: '12px', color: C.dim, margin: '6px 0 0', fontWeight: 500 }}>
              {userName} €{monthByUser.toFixed(2)} · {partnerName || '...'} €{monthByPartner.toFixed(2)}
            </p>
          )}
          {budget && (
            <p style={{ fontSize: '12px', color: budgetPct >= 1 ? C.danger : C.dim, margin: '4px 0 0', fontWeight: budgetPct >= 1 ? 700 : 500 }}>
              {budgetPct >= 1 ? `Over the limit by €${(monthTotal - budget).toFixed(2)}` : `€${(budget - monthTotal).toFixed(2)} under the limit`}
            </p>
          )}
        </div>
        <button type="button" onClick={nextMonth} disabled={!canNext} aria-label="Next month" style={{ ...iconBtn, opacity: canNext ? 1 : 0.35, cursor: canNext ? 'pointer' : 'default' }}><Icon name="chevron-right" size={18} /></button>
      </div>

      {/* Donut chart — category breakdown */}
      {monthExp.length > 0 && (() => {
        const bycat: Record<string, number> = {};
        for (const e of monthExp) {
          const cat = e.category || 'other';
          bycat[cat] = (bycat[cat] || 0) + e.amount;
        }
        const R = 54, cx = 70, cy = 70, strokeW = 16;
        const circ = 2 * Math.PI * R;
        const entries = Object.entries(bycat).sort((a, b) => b[1] - a[1]);
        const gap = entries.length > 1 ? 4 : 0;
        let offsetFrac = 0;
        const slices = entries.map(([cat, amt]) => {
          const pct = amt / monthTotal;
          const dashLen = Math.max(pct * circ - gap, 0.5);
          const dashOffset = -(offsetFrac * circ);
          offsetFrac += pct;
          return { cat, amt, pct, dashLen, dashOffset };
        });

        return (
          <div style={card}>
            <p style={heading}>By category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Spending by category, €${monthTotal.toFixed(0)}`} style={{ flexShrink: 0 }}>
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(16,35,26,0.07)" strokeWidth={strokeW} />
                {slices.map(s => (
                  <circle key={s.cat} cx={cx} cy={cy} r={R}
                    fill="none" stroke={getExpCatDisplay(s.cat).accent}
                    strokeWidth={strokeW} strokeLinecap={gap ? 'round' : 'butt'}
                    strokeDasharray={`${s.dashLen} ${circ - s.dashLen}`}
                    strokeDashoffset={s.dashOffset}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.5s ease' }}
                  />
                ))}
                <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '20px', fontWeight: 300, fill: C.text, fontFamily: 'inherit' }}>€{Math.round(monthTotal)}</text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, minWidth: 0 }}>
                {slices.slice(0, 7).map(s => {
                  const d = getExpCatDisplay(s.cat);
                  return (
                    <div key={s.cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: C.text, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                      <span style={{ fontSize: '13px', color: C.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€{s.amt.toFixed(0)}</span>
                      <span style={{ fontSize: '12px', color: C.dim, fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>{Math.round(s.pct * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Calendar */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px' }}>
          <p style={{ ...heading, margin: 0 }}>Calendar</p>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: 600, color: C.dim }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: USER_COLOR }} />{userName}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: PARTNER_COLOR }} />{partnerName || '...'}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', marginBottom: '6px' }}>
          {WEEK.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: C.dim }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const amt = byDay[day];
            const hasUser = !!byDayUser[day];
            const hasPartner = !!byDayPartner[day];
            const both = hasUser && hasPartner;
            const isToday = dm.year === now.getFullYear() && dm.month === now.getMonth() && day === now.getDate();
            const dotColor = both ? BOTH_COLOR : hasUser ? USER_COLOR : hasPartner ? PARTNER_COLOR : null;
            return (
              <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '44px', borderRadius: '12px', backgroundColor: dotColor ? `${dotColor}1F` : isToday ? 'rgba(255,255,255,0.8)' : 'transparent', boxShadow: isToday ? `inset 0 0 0 1.5px ${ACCENT}` : 'none', padding: '4px 1px', gap: '2px' }}>
                <span style={{ fontSize: '12px', color: dotColor ?? (isToday ? C.text : C.dim), fontWeight: amt || isToday ? 700 : 500, lineHeight: 1 }}>{day}</span>
                {amt && <span style={{ fontSize: '9px', color: dotColor ?? C.dim, fontWeight: 700, lineHeight: 1 }}>€{amt % 1 === 0 ? Math.round(amt) : amt.toFixed(0)}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly bar chart */}
      <div style={card}>
        <p style={heading}>Last 6 months</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          {chartMonths.map(m => {
            const isSel = m.year === dm.year && m.month === dm.month;
            const barH = m.total > 0 ? Math.max(Math.round((m.total / maxBar) * 96), 6) : 0;
            return (
              <button type="button" key={`${m.year}-${m.month}`} onClick={() => setDm({ year: m.year, month: m.month })} aria-pressed={isSel} aria-label={`${MONTHS_EN[m.month]}: €${Math.round(m.total)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                <span style={{ fontSize: '10px', color: isSel ? ACCENT : C.dim, fontWeight: 700, height: '14px', display: 'flex', alignItems: 'flex-end' }}>
                  {m.total > 0 ? `€${Math.round(m.total)}` : ''}
                </span>
                <span style={{ width: '100%', height: '96px', display: 'flex', alignItems: 'flex-end' }}>
                  <span style={{ width: '100%', height: `${barH}px`, backgroundColor: isSel ? ACCENT : 'rgba(30,107,67,0.22)', borderRadius: '10px', transition: 'all 0.25s ease' }} />
                </span>
                <span style={{ fontSize: '11px', color: isSel ? ACCENT : C.dim, fontWeight: isSel ? 700 : 500 }}>{MONTHS_SHORT[m.month]}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
