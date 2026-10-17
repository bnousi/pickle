'use client';

import { Fragment, useState, type ChangeEvent, type RefObject } from 'react';
import type { Expense, HistoryGroup, Item } from '../lib/types';
import type { Theme } from '../lib/theme';
import { MONTHS_EN } from '../lib/content';
import { fmtDate, getExpCatDisplay } from '../lib/format';
import Empty from './Empty';

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

  // Month-over-month numbers include already settled purchases
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const allExp = [...expenses, ...history.flatMap(g => g.expenses)];
  const thisMonthTotal = allExp.filter(e => e.createdAt >= monthStart).reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = allExp.filter(e => e.createdAt >= lastMonthStart && e.createdAt < monthStart).reduce((s, e) => s + e.amount, 0);
  const monthDiffPct = lastMonthTotal > 0 ? Math.round((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : null;
  const budgetPct = budget ? Math.min(thisMonthTotal / budget, 1) : 0;
  const budgetColor = budgetPct >= 0.9 ? '#FF5050' : budgetPct >= 0.7 ? '#F59E0B' : '#4ADE80';

  return (
    <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Spending card */}
      <div role="button" tabIndex={0} onClick={() => onOpenSpending()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenSpending(); } }} style={{ width: '100%', textAlign: 'left', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px 22px', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: C.text, margin: 0 }}>Spending</p>
          <button onClick={e => { e.stopPropagation(); onEditBudget(); }} style={{ fontSize: '11px', color: C.text, backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
            {budget ? 'Edit limit' : '+ Set limit'}
          </button>
        </div>

        <p style={{ fontSize: '12px', color: C.text, fontWeight: '600', margin: '0 0 2px', letterSpacing: '0.3px' }}>{MONTHS_EN[now.getMonth()]} {now.getFullYear()}</p>
        <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '40px', fontWeight: '700', color: C.text, margin: 0, lineHeight: 1 }}>
          €{thisMonthTotal.toFixed(2)}
        </p>

        {monthDiffPct !== null && thisMonthTotal === 0 && (
          <p style={{ fontSize: '12px', color: C.dim, fontWeight: '600', margin: '10px 0 0' }}>
            Nothing logged yet · {MONTHS_EN[lastMonthDate.getMonth()]}: €{lastMonthTotal.toFixed(0)}
          </p>
        )}
        {monthDiffPct !== null && thisMonthTotal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: monthDiffPct <= 0 ? C.success : C.danger }}>
              {monthDiffPct <= 0 ? '↓' : '↑'} {Math.abs(monthDiffPct)}%
            </span>
            <span style={{ fontSize: '12px', color: C.text, fontWeight: '600' }}>vs {MONTHS_EN[lastMonthDate.getMonth()]} · €{lastMonthTotal.toFixed(0)}</span>
          </div>
        )}

        {budget && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '10px', backgroundColor: C.surface2, borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${Math.min(budgetPct * 100, 100)}%`, backgroundColor: budgetColor, borderRadius: '5px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: budgetPct >= 1 ? C.danger : C.dim, fontWeight: budgetPct >= 1 ? '700' : '400' }}>
                {budgetPct >= 1 ? `Over by €${(thisMonthTotal - budget).toFixed(2)}` : `€${(budget - thisMonthTotal).toFixed(2)} left`}
              </span>
              <span style={{ fontSize: '12px', color: C.text, fontWeight: '600' }}>limit €{budget.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Balance card */}
      <div style={{ borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <div style={{ background: 'linear-gradient(135deg, #1B5FAD, #1A4F99)', padding: '28px 24px 20px' }}>
          {Math.abs(balance) < 0.01 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '22px', color: '#FFFFFF', margin: '0 0 6px', fontWeight: '700' }}>All settled up</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>Nobody owes anything</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: '700' }}>
                {balance > 0 ? `${partnerName || '...'} owes you` : `You owe ${partnerName || '...'}`}
              </p>
              <div style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '52px', fontWeight: '700', color: balance > 0 ? '#7FFFA8' : '#FFB3AE', lineHeight: 1 }}>
                €{Math.abs(balance).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Breakdown bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', backgroundColor: C.surface }}>
          {[
            { label: userName, amount: totalByUser },
            { label: partnerName || '...', amount: totalByPartner },
          ].map((person, i) => (
            <Fragment key={i}>
              {i === 1 && <div key="div" style={{ backgroundColor: C.border }} />}
              <div key={person.label} style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: C.text, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '900' }}>{person.label}</div>
                <div style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '20px', color: C.accent, fontWeight: '700' }}>€{person.amount.toFixed(2)}</div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onNewExpense()} style={{ flex: 1, padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', letterSpacing: '0.5px' }}>
          + New
        </button>
        <button
          onClick={() => receiptInputRef.current?.click()}
          disabled={receiptLoading}
          style={{ flex: 1, padding: '14px', backgroundColor: C.surface2, color: receiptLoading ? C.dim : C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', cursor: receiptLoading ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: '700' }}
        >
          {receiptLoading ? '⏳ Reading…' : '📷 Scan'}
        </button>
        <input ref={receiptInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onReceiptImage} />
        {expenses.length > 0 && (
          <button onClick={onSettle} style={{ flex: 1, padding: '14px', backgroundColor: settleConfirm ? C.danger : C.surface2, color: settleConfirm ? '#fff' : C.text, border: `1px solid ${settleConfirm ? C.danger : C.border}`, borderRadius: '12px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', transition: 'all 0.2s' }}>
            {settleConfirm ? 'Sure?' : 'Settle up'}
          </button>
        )}
      </div>

      {/* Expenses — receipt style */}
      {expenses.length === 0 ? (
        <Empty C={C} title="No expenses yet" sub={'Add a purchase to start\ntracking who paid what'} />
      ) : (
        <div style={{ backgroundColor: '#FEFEF8', border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          {/* Receipt header */}
          <div style={{ textAlign: 'center', padding: '18px 16px 14px', borderBottom: '1.5px dashed #C4C0B8' }}>
            <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '5px', color: '#1A1A18', fontFamily: "var(--font-mono), 'Courier New', monospace", marginBottom: '2px' }}>PICKLE</div>
            <div style={{ fontSize: '9px', color: '#6B6863', letterSpacing: '3px', fontFamily: "var(--font-mono), 'Courier New', monospace", marginBottom: '4px' }}>PURCHASE LOG</div>
            <div style={{ fontSize: '9px', color: '#C4C0B8', fontFamily: "var(--font-mono), 'Courier New', monospace" }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>

          {/* Expense rows */}
          {expenses.map((exp, i) => {
            const name = resolvePaidBy(exp.paidBy) || exp.paidBy;
            const expDateKey = new Date(exp.createdAt).toDateString();
            const tripItems = bought.filter(it => new Date(it.updatedAt ?? it.createdAt).toDateString() === expDateKey);
            return (
              <button key={exp.id} onClick={() => onEditExpense(exp)} style={{ display: 'block', width: '100%', textAlign: 'left', backgroundColor: 'transparent', border: 'none', padding: '12px 18px', borderBottom: i < expenses.length - 1 ? '1px dashed #C4C0B8' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A18', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "var(--font-mono), 'Courier New', monospace", flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.category ? getExpCatDisplay(exp.category).emoji + ' ' : ''}{name}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#1A1A18', fontFamily: "var(--font-mono), 'Courier New', monospace", flexShrink: 0 }}>
                    €{exp.amount.toFixed(2)}
                  </span>
                </div>
                {exp.note && <div style={{ fontSize: '10px', color: '#3A3A36', fontWeight: '700', marginTop: '2px', fontFamily: "var(--font-mono), 'Courier New', monospace" }}>{exp.note}</div>}
                {tripItems.length > 0 && (
                  <div style={{ fontSize: '9px', color: '#4A4A44', marginTop: '3px', fontFamily: "var(--font-mono), 'Courier New', monospace", lineHeight: 1.5 }}>
                    {tripItems.slice(0, 6).map(it => it.name).join(', ')}{tripItems.length > 6 ? ` +${tripItems.length - 6}` : ''}
                  </div>
                )}
                <div style={{ fontSize: '9px', color: '#6B6863', fontWeight: '600', marginTop: '2px', fontFamily: "var(--font-mono), 'Courier New', monospace" }}>{fmtDate(exp.createdAt)}</div>
              </button>
            );
          })}

          {/* Total + breakdown + balance */}
          <div style={{ padding: '14px 18px 18px', borderTop: '2px dashed #C4C0B8', backgroundColor: '#F8F7F2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '3px', color: '#1A1A18', fontFamily: "var(--font-mono), 'Courier New', monospace" }}>TOTAL</span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#1A1A18', fontFamily: "var(--font-mono), 'Courier New', monospace" }}>€{expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed #C4C0B8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {[
                { label: userName.toUpperCase(), amount: totalByUser },
                { label: (partnerName || '...').toUpperCase(), amount: totalByPartner },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#1A1A18', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace", letterSpacing: '1px' }}>{p.label}</span>
                  <span style={{ fontSize: '11px', color: '#1A1A18', fontFamily: "var(--font-mono), 'Courier New', monospace", fontWeight: '700' }}>€{p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {Math.abs(balance) > 0.01 && (
              <div style={{ borderTop: '2px dashed #C4C0B8', paddingTop: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', fontFamily: "var(--font-mono), 'Courier New', monospace", color: balance > 0 ? '#2D7D46' : '#D93025' }}>
                  {balance > 0
                    ? `${(partnerName || '...').toUpperCase()} OWES YOU €${Math.abs(balance).toFixed(2)}`
                    : `YOU OWE ${(partnerName || '...').toUpperCase()} €${Math.abs(balance).toFixed(2)}`}
                </span>
              </div>
            )}

            {/* Decorative barcode */}
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center', gap: '2px', opacity: 0.15 }}>
              {Array.from({ length: 32 }, (_, i) => (
                <div key={i} style={{ width: i % 4 === 0 ? '3px' : '1px', height: '22px', backgroundColor: '#1A1A18', borderRadius: '1px' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setHistoryOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: '12px', fontWeight: '900', color: C.text, letterSpacing: '1px', textTransform: 'uppercase' }}>
              History ({history.length} {history.length === 1 ? 'settlement' : 'settlements'})
            </span>
            <span style={{ fontSize: '16px', color: C.muted, transform: historyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>˅</span>
          </button>
          {historyOpen && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map(group => (
                <div key={group.settledAt} style={{ backgroundColor: C.surface, borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, letterSpacing: '0.5px' }}>
                      {fmtDate(group.settledAt)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '15px', fontWeight: '700', color: C.text }}>
                      €{group.total.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.expenses.map((exp, i) => {
                      const name = resolvePaidBy(exp.paidBy) || exp.paidBy;
                      return (
                        <div key={exp.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < group.expenses.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: C.dim, flexShrink: 0 }}>
                            {name[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '13px', color: C.text, fontWeight: '800' }}>{name}</span>
                            {exp.note && <span style={{ fontSize: '12px', color: C.dim, marginLeft: '8px' }}>{exp.note}</span>}
                          </div>
                          <span style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '14px', color: C.text, fontWeight: '700' }}>
                            €{exp.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
