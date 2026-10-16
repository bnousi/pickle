import type { Category } from './products';

// Sample household used by "Try the demo". Everything lives in the visitor's
// browser only: no household code is created, so nothing is sent to the server.

export const DEMO_USER = 'Alex';
export const DEMO_PARTNER = 'Sam';

type DemoItem = {
  id: string; name: string; quantity: string; notes: string;
  category: Category; emoji: string; bought: boolean;
  addedBy: string; createdAt: number; updatedAt: number;
};

type DemoExpense = {
  id: string; paidBy: string; amount: number; note: string;
  createdAt: number; settledAt?: number; category: Category;
};

const DAY = 24 * 60 * 60 * 1000;

export function buildDemo(now = Date.now()) {
  const u = DEMO_USER;
  const p = DEMO_PARTNER;

  const list: [string, Category, string, string, string, boolean, string][] = [
    // name, category, emoji, quantity, notes, bought, addedBy
    ['Γάλα', 'dairy', '🥛', '2', 'light', false, p],
    ['Αυγά', 'dairy', '🥚', '1', '', false, u],
    ['Φέτα', 'dairy', '🧀', '1', '', true, u],
    ['Ντομάτες', 'produce', '🍅', '1', 'για σαλάτα', false, p],
    ['Αβοκάντο', 'produce', '🥑', '2', '', false, u],
    ['Μήλα', 'produce', '🍎', '1', '', true, p],
    ['Ψωμί', 'bakery', '🍞', '1', 'ολικής', false, u],
    ['Κοτόπουλο φιλέτο', 'meat', '🍗', '1', '', false, p],
    ['Σπαγγέτι', 'pasta', '🍝', '2', '', true, u],
    ['Passata', 'canned', '🥫', '1', '', false, u],
    ['Καφές φίλτρου', 'coffee', '☕', '1', '', false, p],
    ['Υγρό πιάτων', 'cleaning', '🧼', '1', '', false, p],
    ['Χαρτί υγείας', 'hygiene', '🧻', '1', '', true, u],
  ];

  const items: DemoItem[] = list.map(([name, category, emoji, quantity, notes, bought, addedBy], i) => ({
    id: `demo-i${i}`, name, category, emoji, quantity, notes, bought, addedBy,
    createdAt: now - (i + 1) * 3 * 60 * 60 * 1000,
    updatedAt: now - (i + 1) * 3 * 60 * 60 * 1000,
  }));

  const open: [string, number, string, Category, number][] = [
    // paidBy, amount, note, category, days ago
    [u, 42.80, 'Σκλαβενίτης', 'produce', 1],
    [p, 18.35, 'Λαϊκή', 'produce', 3],
    [p, 9.90, 'Φούρνος', 'bakery', 4],
    [u, 27.15, 'Lidl', 'dairy', 6],
    [p, 31.60, 'ΑΒ Βασιλόπουλος', 'cleaning', 9],
    [u, 14.20, 'Κρεοπωλείο', 'meat', 11],
  ];
  const expenses: DemoExpense[] = open.map(([paidBy, amount, note, category, ago], i) => ({
    id: `demo-e${i}`, paidBy, amount, note, category, createdAt: now - ago * DAY,
  }));

  const settledAt = now - 16 * DAY;
  const past: [string, number, string, Category, number][] = [
    [u, 38.40, 'Σκλαβενίτης', 'produce', 19],
    [p, 22.10, 'Lidl', 'snacks', 22],
    [u, 12.60, 'Φαρμακείο', 'hygiene', 25],
    [p, 45.30, 'ΑΒ Βασιλόπουλος', 'home', 28],
  ];
  const settled: DemoExpense[] = past.map(([paidBy, amount, note, category, ago], i) => ({
    id: `demo-h${i}`, paidBy, amount, note, category, createdAt: now - ago * DAY, settledAt,
  }));
  const history = [{
    settledAt,
    total: settled.reduce((s, e) => s + e.amount, 0),
    expenses: settled,
  }];

  return { user: u, partner: p, items, expenses, history, budget: 400 };
}
