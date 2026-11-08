import { CAT, type Category } from './products';

export function genId() { return Math.random().toString(36).slice(2, 10); }
export function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// This month vs last month, counting settled purchases too.
export function monthTotals(allExp: { amount: number; createdAt: number }[], now: Date) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = lastMonthDate.getTime();
  const thisMonth = allExp.filter(e => e.createdAt >= monthStart).reduce((s, e) => s + e.amount, 0);
  const lastMonth = allExp.filter(e => e.createdAt >= lastMonthStart && e.createdAt < monthStart).reduce((s, e) => s + e.amount, 0);
  const diffPct = lastMonth > 0 ? Math.round((thisMonth - lastMonth) / lastMonth * 100) : null;
  return { thisMonth, lastMonth, diffPct, lastMonthIndex: lastMonthDate.getMonth() };
}

// Expenses saved before the category list was expanded use the old keys below.

const LEGACY_CAT_DISPLAY: Record<string, { label: string; emoji: string; accent: string; bg: string }> = {
  supermarket: { label: 'Supermarket', emoji: '🛒', accent: '#4CAF50', bg: 'rgba(76,175,80,0.30)' },
  restaurant:  { label: 'Food & Drink', emoji: '🍽️', accent: '#FF9800', bg: 'rgba(255,152,0,0.30)' },
  home:        { label: 'Home & Bills', emoji: '🏠', accent: '#2196F3', bg: 'rgba(33,150,243,0.30)' },
  personal:    { label: 'Health',       emoji: '💊', accent: '#E91E63', bg: 'rgba(233,30,99,0.30)' },
  other:       { label: 'Other',        emoji: '📦', accent: '#9E9E9E', bg: 'rgba(158,158,158,0.30)' },
};
export function getExpCatDisplay(cat: string | undefined) {
  const key = cat || 'other';
  if (key in CAT) {
    const c = CAT[key as Category];
    return { label: c.label, emoji: c.emoji, accent: c.accent, bg: c.bg };
  }
  return LEGACY_CAT_DISPLAY[key] ?? LEGACY_CAT_DISPLAY['other'];
}
export function resolveExpCat(cat: string | undefined): Category {
  if (!cat) return 'produce';
  if (cat in CAT) return cat as Category;
  const legacy: Record<string, Category> = { supermarket: 'produce', restaurant: 'snacks', home: 'home', personal: 'hygiene', other: 'produce' };
  return legacy[cat] ?? 'produce';
}
