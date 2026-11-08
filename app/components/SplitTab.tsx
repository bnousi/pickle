'use client';

import { useState, type ChangeEvent, type RefObject } from 'react';
import type { Expense, HistoryGroup, Item } from '../lib/types';
import type { Theme } from '../lib/theme';
import { MONTHS_EN } from '../lib/content';
import { fmtDate, getExpCatDisplay, monthTotals } from '../lib/format';
import { ACCENT, HAIRLINE, INK, PARTNER_TINT, USER_TINT, avatarTint, btnPrimary, btnSecondary, glass, numeral } from '../lib/ui';
import Empty from './Empty';
import Icon from './Icon';

type Props = {
  C: Theme;
  expenses: Expense[];
  history: HistoryGroup[];
  bought: Item[];
  budget: number | null;
  userName: string;
  partnerName: string;
  totalByUser: number;
  totalByPartner: number;
  balance: number;
  resolvePaidBy: (paidBy: string) => string;
  settleConfirm: boolean;
  receiptLoading: boolean;
  receiptInputRef: RefObject<HTMLInputElement | null>;
  onOpenSpending: () => void;
  onEditBudget: () => void;
  onNewExpense: () => void;
  onReceiptImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onSettle: () => void;
  onEditExpense: (exp: Expense) => void;
};

// Split tab: this month's spending, who owes whom, the open purchases and past settlements.
export default function SplitTab({
  C, expenses, history, bought, budget, userName, partnerName,
  totalByUser, totalByPartner, balance, resolvePaidBy,
  settleConfirm, receiptLoading, receiptInputRef,
  onOpenSpending, onEditBudget, onNewExpense, onReceiptImage, onSettle, onEditExpense,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const now = new Date();
  const allExp = [...expenses, ...history.flatMap(g => g.expenses)];
  const { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, diffPct: monthDiffPct, lastMonthIndex } = monthTotals(allExp, now);
  const budgetPct = budget ? Math.min(thisMonthTotal / budget, 1) : 0;
  const budgetColor = budgetPct >= 0.9 ? C.danger : budgetPct >= 0.7 ? '#C98A12' : ACCENT;
  const openTotal = totalByUser + totalByPartner;
  const userShare = openTotal > 0 ? (totalByUser / openTotal) * 100 : 50;
  const partner = partnerName || '...';

  return (
    <div style={{ paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Spending card */}
      <div
        role="button" tabIndex={0} aria-label="Open spending details" onClick={() => onOpenSpending()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenSpending(); } }}
        className="slide-up"
        style={{ ...glass(28), padding: '18px 20px 20px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: C.dim, margin: 0 }}>Spent in {MONTHS_EN[now.getMonth()]}</p>
          <button type="button" onClick={e => { e.stopPropagation(); onEditBudget(); }} style={{ height: '30px', padding: '0 12px', borderRadius: '999px', backgroundColor: 'rgba(16,35,26,0.07)', fontSize: '12px', fontWeight: 700, color: INK, cursor: 'pointer', fontFamily: 'inherit' }}>
            {budget ? 'Edit limit' : '+ Set limit'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
          <span style={{ ...numeral, fontSize: '46px', color: C.text }}>€{thisMonthTotal.toFixed(2)}</span>
          {budget && <span style={{ fontSize: '14px', fontWeight: 600, color: C.dim }}>of €{budget.toFixed(0)}</span>}
        </div>

        {monthDiffPct !== null && thisMonthTotal === 0 && (
          <p style={{ fontSize: '13px', color: C.dim, fontWeight: 500, margin: '8px 0 0' }}>
            Nothing logged yet · {MONTHS_EN[lastMonthIndex]}: €{lastMonthTotal.toFixed(0)}
          </p>
        )}
        {monthDiffPct !== null && thisMonthTotal > 0 && (
          <p style={{ fontSize: '13px', fontWeight: 600, margin: '8px 0 0', color: C.dim }}>
            <span style={{ fontWeight: 700, color: monthDiffPct <= 0 ? ACCENT : C.danger }}>{monthDiffPct <= 0 ? '↓' : '↑'} {Math.abs(monthDiffPct)}%</span>
            {' '}vs {MONTHS_EN[lastMonthIndex]} · €{lastMonthTotal.toFixed(0)}
          </p>
        )}

        {budget && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '8px', backgroundColor: 'rgba(16,35,26,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(budgetPct * 100, 100)}%`, backgroundColor: budgetColor, borderRadius: '999px', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: '12px', margin: '8px 0 0', color: budgetPct >= 1 ? C.danger : C.dim, fontWeight: budgetPct >= 1 ? 700 : 500 }}>
              {budgetPct >= 1 ? `Over by €${(thisMonthTotal - budget).toFixed(2)}` : `€${(budget - thisMonthTotal).toFixed(2)} left this month`}
            </p>
          </div>
        )}
        <p style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, margin: '14px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Calendar, categories and trends <Icon name="chevron-right" size={14} strokeWidth={2.4} />
        </p>
      </div>

      {/* Balance card */}
      <div className="slide-up" style={{ ...glass(28), padding: '18px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {Math.abs(balance) < 0.01 ? (
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.dim, margin: 0 }}>Balance</p>
              <p style={{ ...numeral, fontSize: '34px', color: C.text, margin: '4px 0 2px' }}>All settled up</p>
              <p style={{ fontSize: '13px', color: C.dim, fontWeight: 500 }}>Nobody owes anything</p>
            </div>
          ) : (
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: C.dim, margin: 0 }}>
                {balance > 0 ? `${partner} owes you` : `You owe ${partner}`}
              </p>
              <p style={{ ...numeral, fontSize: '46px', margin: '2px 0 0', color: balance > 0 ? ACCENT : C.danger }}>
                €{Math.abs(balance).toFixed(2)}
              </p>
            </div>
          )}
          {expenses.length > 0 && (
              <button type="button" onClick={onSettle} style={{ ...btnPrimary, width: 'auto', minHeight: '44px', padding: '0 18px', fontSize: '14px', flexShrink: 0, backgroundColor: settleConfirm ? C.danger : INK }}>
                {settleConfirm ? 'Sure?' : 'Settle up'}
              </button>
          )}
        </div>

        {openTotal > 0 && (
          <>
            <div style={{ marginTop: '16px', height: '10px', display: 'flex', gap: '3px' }}>
              <div style={{ width: `${userShare}%`, backgroundColor: '#5AA9E6', borderRadius: '999px', transition: 'width 0.5s ease' }} />
              <div style={{ flex: 1, backgroundColor: '#E9B23C', borderRadius: '999px' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: C.text }}>
              <span>{userName} paid €{totalByUser.toFixed(2)}</span>
              <span>{partner} paid €{totalByPartner.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
        <button type="button" onClick={() => onNewExpense()} style={btnPrimary}>
          <Icon name="plus" size={18} strokeWidth={2.4} /> Purchase
        </button>
        <button type="button" onClick={() => receiptInputRef.current?.click()} disabled={receiptLoading} style={{ ...btnSecondary, opacity: receiptLoading ? 0.6 : 1, cursor: receiptLoading ? 'progress' : 'pointer' }}>
          <Icon name="camera" size={18} /> {receiptLoading ? 'Reading…' : 'Scan receipt'}
        </button>
        <input ref={receiptInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onReceiptImage} />
      </div>

      {/* Open purchases */}
      {expenses.length === 0 ? (
        <Empty C={C} title="No purchases yet" sub={'Add a purchase or scan a receipt\nto start tracking who paid what'} />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 6px 8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0 }}>Open purchases</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: C.dim, margin: 0 }}>{expenses.length}</p>
          </div>
          <div style={{ ...glass(24), padding: '0 16px' }}>
            {expenses.map((exp, i) => {
              const name = resolvePaidBy(exp.paidBy) || exp.paidBy;
              const expDateKey = new Date(exp.createdAt).toDateString();
              const tripItems = bought.filter(it => new Date(it.updatedAt ?? it.createdAt).toDateString() === expDateKey);
              const cat = getExpCatDisplay(exp.category);
              return (
                <button key={exp.id} type="button" onClick={() => onEditExpense(exp)} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left', padding: '12px 0', borderTop: i > 0 ? `1px solid ${HAIRLINE}` : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: avatarTint(name, userName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: INK, flexShrink: 0 }}>
                    {name[0]?.toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note || cat.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: C.dim }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cat.accent, flexShrink: 0 }} />
                      {cat.label} · {fmtDate(exp.createdAt)}
                    </span>
                    {tripItems.length > 0 && (
                      <span style={{ fontSize: '12px', color: C.muted, marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tripItems.slice(0, 6).map(it => it.name).join(', ')}{tripItems.length > 6 ? ` +${tripItems.length - 6}` : ''}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>€{exp.amount.toFixed(2)}</span>
                </button>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0 16px', borderTop: `1px solid ${HAIRLINE}` }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>Total</span>
              <span style={{ ...numeral, fontSize: '24px', color: C.text }}>€{openTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <button
            type="button" onClick={() => setHistoryOpen(v => !v)} aria-expanded={historyOpen}
            style={{ ...glass(18), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>
              History · {history.length} {history.length === 1 ? 'settlement' : 'settlements'}
            </span>
            <Icon name="chevron-down" size={18} style={{ transform: historyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {historyOpen && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map(group => (
                <div key={group.settledAt} className="slide-up" style={{ ...glass(20), padding: '0 16px' }}>
                  <div style={{ padding: '12px 0', borderBottom: `1px solid ${HAIRLINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>Settled {fmtDate(group.settledAt)}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>€{group.total.toFixed(2)}</span>
                  </div>
                  {group.expenses.map((exp, i) => {
                    const name = resolvePaidBy(exp.paidBy) || exp.paidBy;
                    return (
                      <div key={exp.id} style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '12px', borderTop: i > 0 ? `1px solid ${HAIRLINE}` : 'none' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: name === userName ? USER_TINT : PARTNER_TINT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: INK, flexShrink: 0 }}>
                          {name[0]?.toUpperCase()}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.note || name}
                          <span style={{ fontWeight: 500, color: C.dim }}> · {fmtDate(exp.createdAt)}</span>
                        </span>
                        <span style={{ fontSize: '14px', color: C.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>€{exp.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
