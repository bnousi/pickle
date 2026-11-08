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

// One month of a typical household: [day of the cycle, who paid, amount, store, category]
const CYCLE: [number, 'u' | 'p', number, string, Category][] = [
  [2, 'u', 46.30, 'Σκλαβενίτης', 'produce'],
  [4, 'p', 17.80, 'Λαϊκή', 'produce'],
  [6, 'p', 8.40, 'Φούρνος', 'bakery'],
  [9, 'u', 31.25, 'Lidl', 'dairy'],
  [11, 'p', 24.90, 'Κρεοπωλείο', 'meat'],
  [14, 'u', 52.10, 'ΑΒ Βασιλόπουλος', 'cleaning'],
  [17, 'p', 21.60, 'Λαϊκή', 'produce'],
  [19, 'u', 13.70, 'Φαρμακείο', 'hygiene'],
  [22, 'p', 38.45, 'Σκλαβενίτης', 'snacks'],
  [25, 'u', 19.90, 'Μασούτης', 'coffee'],
  [27, 'p', 9.60, 'Φούρνος', 'bakery'],
];

// Month-to-month variation, most recent settlement first
const CYCLE_SCALE = [1.04, 1.16, 0.92, 1.22, 1.07, 0.88];

export function buildDemo(now = Date.now()) {
  const u = DEMO_USER;
  const p = DEMO_PARTNER;

  const list: [string, Category, string, string, string, boolean, string][] = [
    // name, category, emoji, quantity, notes, bought, addedBy
    ['Γάλα', 'dairy', '🥛', '2', 'light', false, p],
    ['Αυγά', 'dairy', '🥚', '1', '', false, u],
    ['Φέτα', 'dairy', '🧀', '1', '', true, u],
    ['Γιαούρτι', 'dairy', '🥣', '2', '', true, p],
    ['Ντομάτες', 'produce', '🍅', '1', 'για σαλάτα', false, p],
    ['Αβοκάντο', 'produce', '🥑', '2', '', false, u],
    ['Μήλα', 'produce', '🍎', '1', '', true, p],
    ['Μπανάνες', 'produce', '🍌', '1', '', true, u],
    ['Ψωμί', 'bakery', '🍞', '1', 'ολικής', false, u],
    ['Κοτόπουλο φιλέτο', 'meat', '🍗', '1', '', false, p],
    ['Σπαγγέτι', 'pasta', '🍝', '2', '', true, u],
    ['Passata', 'canned', '🥫', '1', '', false, u],
    ['Ελαιόλαδο', 'oils', '🫒', '1', '', true, p],
    ['Καφές φίλτρου', 'coffee', '☕', '1', '', false, p],
    ['Υγρό πιάτων', 'cleaning', '🧼', '1', '', false, p],
    ['Χαρτί υγείας', 'hygiene', '🧻', '1', '', true, u],
  ];

  // Items still to buy were added over the last day or two; bought ones were
  // checked off during yesterday's trip, so they show under that purchase.
  const items: DemoItem[] = list.map(([name, category, emoji, quantity, notes, bought, addedBy], i) => {
    const createdAt = now - (i + 1) * 2 * 60 * 60 * 1000;
    return {
      id: `demo-i${i}`, name, category, emoji, quantity, notes, bought, addedBy,
      createdAt: bought ? now - DAY - (i + 1) * 60 * 60 * 1000 : createdAt,
      updatedAt: bought ? now - DAY : createdAt,
    };
  });

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

  // Six past settlements, roughly one a month, each covering the 30 days before it
  const history = CYCLE_SCALE.map((scale, k) => {
    const settledAt = now - (16 + 30 * k) * DAY;
    const groupExpenses: DemoExpense[] = CYCLE.map(([day, who, amount, note, category], j) => ({
      id: `demo-h${k}-${j}`,
      paidBy: who === 'u' ? u : p,
      amount: Math.round(amount * scale * (1 + ((j * 7 + k * 3) % 5 - 2) * 0.04) * 100) / 100,
      note, category,
      createdAt: settledAt - (30 - day) * DAY,
      settledAt,
    })).sort((a, b) => b.createdAt - a.createdAt);
    return {
      settledAt,
      total: groupExpenses.reduce((s, e) => s + e.amount, 0),
      expenses: groupExpenses,
    };
  });

  // Starred as "buy again"
  const recurring: Record<string, { category: Category; emoji: string }> = {
    'Φέτα': { category: 'dairy', emoji: '🧀' },
    'Γιαούρτι': { category: 'dairy', emoji: '🥣' },
  };

  return { user: u, partner: p, items, expenses, history, budget: 400, recurring };
}
