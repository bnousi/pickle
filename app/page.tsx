'use client';

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { CAT, CAT_ORDER, PRODUCTS } from './lib/products';
import type { Category, Product } from './lib/products';
import type { Item, Expense, HistoryGroup, CustomProduct, Tab } from './lib/types';
import { THEMES, SECTION_COLORS } from './lib/theme';
import type { ThemeName } from './lib/theme';
import { MONTHS_EN, SUPERMARKETS, SHOP_DONE_MSGS } from './lib/content';
import { genId, fmtDate, getExpCatDisplay, resolveExpCat } from './lib/format';
import { buildDemo } from './lib/demo';
import ItemCard from './components/ItemCard';
import ProductGrid from './components/ProductGrid';
import Chip from './components/Chip';
import Drawer from './components/Drawer';
import SpendingDetail from './components/SpendingDetail';
import Empty from './components/Empty';
import SetupScreen from './components/SetupScreen';
import HomeScreen from './components/HomeScreen';
import DemoBanner from './components/DemoBanner';
import SplitTab from './components/SplitTab';

// Faded stickers fixed behind the main screens
const BACKGROUND_STICKERS: { src: string; style: React.CSSProperties }[] = [
  { src: '/stk-jello.png', style: { top: '22%', left: '-10px', width: '90px', opacity: 0.2, transform: 'rotate(-10deg)' } },
  { src: '/stk-super-special.png', style: { top: '34%', right: '-8px', width: '90px', opacity: 0.2, transform: 'rotate(-16deg)' } },
  { src: '/stk-pie.png', style: { top: '58%', right: '-12px', width: '108px', opacity: 0.2, transform: 'rotate(12deg)' } },
  { src: '/stk-dragonfruit.png', style: { top: '72%', left: '-8px', width: '96px', opacity: 0.2, transform: 'rotate(-18deg)' } },
  { src: '/stk-japanese-burst.png', style: { bottom: '4%', right: '-10px', width: '100px', opacity: 0.2, transform: 'rotate(10deg)' } },
  { src: '/stk-big-sale.png', style: { bottom: '4%', left: '-8px', width: '90px', opacity: 0.2, transform: 'rotate(-14deg)' } },
  { src: '/stk-grapes.png', style: { top: '42%', left: '58%', width: '82px', opacity: 0.2, transform: 'rotate(-12deg)' } },
  { src: '/stk-tomatoes-vine.png', style: { top: '55%', left: '28%', width: '84px', opacity: 0.2, transform: 'rotate(16deg)' } },
  { src: '/stk-pineapple.png', style: { top: '66%', left: '55%', height: '86px', width: 'auto', opacity: 0.2, transform: 'rotate(-8deg)' } },
  { src: '/stk-soymilk.png', style: { top: '78%', left: '35%', width: '76px', opacity: 0.2, transform: 'rotate(12deg)' } },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [tab, setTab] = useState<Tab>('shop');
  const [showHome, setShowHome] = useState(true);
  const [themeName, setThemeName] = useState<ThemeName>('bold');

  const [items, setItems] = useState<Item[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([]);

  // Shop: add item form
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formNotes, setFormNotes] = useState('');
  const [formCat, setFormCat] = useState<Category>('produce');
  const [formEmoji, setFormEmoji] = useState('');
  const [suggestionPicked, setSuggestionPicked] = useState(false);
  const [boughtExpanded, setBoughtExpanded] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Find: catalog
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  const [addCatalogOpen, setAddCatalogOpen] = useState(false);
  const [cpName, setCpName] = useState('');
  const [cpCat, setCpCat] = useState<Category>('produce');

  // Split: expenses
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expensePaidBy, setExpensePaidBy] = useState<string>('user');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPaidBy, setEditPaidBy] = useState<string>('user');
  const [editDate, setEditDate] = useState('');
  const [expenseCat, setExpenseCat] = useState<Category>('produce');
  const [editCat, setEditCat] = useState<Category>('produce');
  const [renameCat, setRenameCat] = useState<Category>('produce');
  const [shopMode, setShopMode] = useState(false);

  // Receipt scanner
  type ReceiptItem = { name: string; price: number; category: string; checked: boolean };
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<{ store: string | null; total: number; items: ReceiptItem[] } | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'item'; id: string; name: string } | { type: 'category'; cat: Category; count: number } | null>(null);

  // Shop done prompt
  const [shopDoneOpen, setShopDoneOpen] = useState(false);
  const [renameNotice, setRenameNotice] = useState<'ios' | 'android' | null>(null);
  const [shopDoneMsg, setShopDoneMsg] = useState('');
  const [shopAmount, setShopAmount] = useState('');
  const [shopPaidBy, setShopPaidBy] = useState<string>('user');
  const [shopSupermarket, setShopSupermarket] = useState('');
  const shopDoneInitialized = useRef(false);
  const prevBoughtCount = useRef(0);

  // Sync
  const [householdCode, setHouseholdCode] = useState('');
  const isPulling = useRef(false);

  // History
  const [history, setHistory] = useState<HistoryGroup[]>([]);

  // Buy again
  const [recurring, setRecurring] = useState<Record<string, { category: Category; emoji: string }>>({});
  const [buyCounts, setBuyCounts] = useState<Record<string, number>>({});

  // Pending extras
  const [pendingExtraActive, setPendingExtraActive] = useState(false);
  const [pendingExtraOpen, setPendingExtraOpen] = useState(false);
  const [pendingExtraItems, setPendingExtraItems] = useState('');
  const [pendingExtraAmount, setPendingExtraAmount] = useState('');

  // Rename
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: 'item' | 'custom' | 'new'; category?: Category; emoji?: string } | null>(null);
  const [renameName, setRenameName] = useState('');

  // Hidden products (built-ins the user has deleted from catalog)
  const [hiddenProducts, setHiddenProducts] = useState<Set<string>>(new Set());

  // Monthly budget
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [recapMonth, setRecapMonth] = useState<{ year: number; month: number } | undefined>();

  // Swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeBlocked = useRef(false);
  const chipBarRef = useRef<HTMLDivElement>(null);
  const buyAgainRef = useRef<HTMLDivElement>(null);
  const [buyAgainOpen, setBuyAgainOpen] = useState(false);

  // Find: scroll spy
  const [scrolledCat, setScrolledCat] = useState<Category | null>(null);
  const [headerHeight, setHeaderHeight] = useState(110);
  const headerRef = useRef<HTMLElement>(null);
  const catSectionRefs = useRef<Map<string, Element>>(new Map());

  // Stable ref for userName (avoids stale closure in poll)
  const userNameRef = useRef(userName);

  // Setup
  const [setupUser, setSetupUser] = useState('');
  const [setupCode, setSetupCode] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('dnk-user');
    const p = localStorage.getItem('dnk-partner');
    const it = localStorage.getItem('dnk-items');
    const ex = localStorage.getItem('dnk-expenses');
    const cp = localStorage.getItem('dnk-custom-products');
    const th = localStorage.getItem('dnk-theme') as ThemeName | null;
    const code = localStorage.getItem('dnk-code');
    // Hydrate from localStorage after mount (not available during SSR)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (u) { setUserName(u); setPartnerName(p || ''); setIsSetup(false); }
    if (it) setItems(JSON.parse(it));
    if (ex) setExpenses(JSON.parse(ex));
    if (cp) setCustomProducts(JSON.parse(cp));
    if (th && th in THEMES) setThemeName(th);
    if (code) setHouseholdCode(code);
    if (localStorage.getItem('pickle-demo') === '1') {
      setIsDemo(true);
      const dh = localStorage.getItem('pickle-demo-history');
      if (dh) setHistory(JSON.parse(dh));
    }
    // One-time notice for people who set the app up under its old name:
    // home screen icons/names are fixed at install time, so they must re-add it
    if (!localStorage.getItem('pickle-rename-seen')) {
      if (u) setRenameNotice(/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android');
      else localStorage.setItem('pickle-rename-seen', '1');
    }
    const pe = localStorage.getItem('dnk-pending-extra');
    if (pe === 'true') setPendingExtraActive(true);
    const hp = localStorage.getItem('dnk-hidden-products');
    if (hp) setHiddenProducts(new Set(JSON.parse(hp)));
    const bg = localStorage.getItem('dnk-budget');
    if (bg) setBudget(Number(bg));
    const rc = localStorage.getItem('dnk-recurring');
    if (rc) setRecurring(JSON.parse(rc));
    const bc = localStorage.getItem('dnk-buy-counts');
    if (bc) setBuyCounts(JSON.parse(bc));
    setReady(true);
    // Opened from monthly recap notification
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('open') === 'recap') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      setRecapMonth({ year: lastMonth.getFullYear(), month: lastMonth.getMonth() });
      setTab('split');
      setShowHome(false);
      setSpendingOpen(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => { userNameRef.current = userName; }, [userName]);

  // Register service worker + check notification permission
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    if ('Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  // Measure header height so sticky chips bar knows where to stop
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    setHeaderHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll spy: highlight the category chip of the section currently in view
  useEffect(() => {
    if (tab !== 'find' || filterCat !== 'all' || search.trim().length >= 2) return;
    const offset = headerHeight + 56;
    function onScroll() {
      let active: Category | null = null;
      catSectionRefs.current.forEach((el, cat) => {
        if (el.getBoundingClientRect().top <= offset) active = cat as Category;
      });
      setScrolledCat(active);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [tab, filterCat, search, headerHeight]);

  useEffect(() => {
    localStorage.setItem('dnk-theme', themeName);
  }, [themeName]);

  useEffect(() => {
    if (ready && !isSetup) localStorage.setItem('dnk-items', JSON.stringify(items));
  }, [items, ready, isSetup]);

  useEffect(() => {
    if (ready && !isSetup) localStorage.setItem('dnk-expenses', JSON.stringify(expenses));
  }, [expenses, ready, isSetup]);

  useEffect(() => {
    if (ready) localStorage.setItem('dnk-custom-products', JSON.stringify(customProducts));
  }, [customProducts, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem('dnk-hidden-products', JSON.stringify([...hiddenProducts]));
  }, [hiddenProducts, ready]);

  useEffect(() => {
    if (!ready) return;
    if (budget !== null) localStorage.setItem('dnk-budget', String(budget));
    else localStorage.removeItem('dnk-budget');
  }, [budget, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem('dnk-recurring', JSON.stringify(recurring));
  }, [recurring, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem('dnk-buy-counts', JSON.stringify(buyCounts));
  }, [buyCounts, ready]);

  // Register current user in members table on every load (idempotent — ON CONFLICT DO NOTHING)
  useEffect(() => {
    if (!householdCode || !userName || !ready) return;
    fetch(`/api/sync?code=${householdCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'member', action: 'upsert', data: { name: userName } }),
    }).catch(() => {});
  }, [householdCode, userName, ready]);

  useEffect(() => {
    if (!householdCode || !ready || isSetup) return;
    async function pull() {
      isPulling.current = true;
      try {
        const r = await fetch(`/api/sync?code=${householdCode}`);
        if (r.status === 403) {
          // Household was closed: drop every local trace and start over
          for (const k of Object.keys(localStorage)) {
            if (k.startsWith('dnk-') || k.startsWith('pickle-')) localStorage.removeItem(k);
          }
          window.location.reload();
          return;
        }
        if (!r.ok) return;
        const data = await r.json();
        setItems(data.items);
        setExpenses(data.expenses);
        setCustomProducts(data.customProducts);
        if (data.history) setHistory(data.history);
        // Pick up a rename of this device's user (e.g. a member renamed server-side)
        const renamedTo = data.renames?.[userNameRef.current];
        if (renamedTo) {
          userNameRef.current = renamedTo;
          setUserName(renamedTo);
          localStorage.setItem('dnk-user', renamedTo);
        }
        if (data.members) {
          const other = (data.members as string[]).find(m => m !== userNameRef.current);
          if (other) {
            setPartnerName(other);
            localStorage.setItem('dnk-partner', other);
          }
        }
      } catch {}
      isPulling.current = false;
    }
    pull();
    const interval = setInterval(pull, 3000);
    return () => clearInterval(interval);
  }, [householdCode, ready, isSetup]);

  useEffect(() => {
    if (!ready) return;
    const boughtLen = items.filter(i => i.bought).length;
    if (!shopDoneInitialized.current) {
      shopDoneInitialized.current = true;
      prevBoughtCount.current = boughtLen;
      return;
    }
    const toBuyLen = items.filter(i => !i.bought).length;
    if (boughtLen > prevBoughtCount.current && toBuyLen === 0 && boughtLen > 0) {
      setShopDoneMsg(SHOP_DONE_MSGS[Math.floor(Math.random() * SHOP_DONE_MSGS.length)]);
      setShopDoneOpen(true);
    }
    prevBoughtCount.current = boughtLen;
  }, [items, ready]);

  const suggestions = useMemo(() => {
    if (formName.length < 1) return [];
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = normalize(formName);
    const all: Product[] = [
      ...PRODUCTS,
      ...customProducts.map(cp => ({ ...cp, emoji: '' })),
    ];
    return all.filter(p => normalize(p.name).includes(q)).slice(0, 6);
  }, [formName, customProducts]);

  const C = THEMES[themeName];
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    border: `1.5px solid ${C.border}`, borderRadius: '10px',
    fontSize: '15px', backgroundColor: C.surface2,
    color: C.text, fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', letterSpacing: '1.5px',
    textTransform: 'uppercase', color: C.dim,
    marginBottom: '6px', fontWeight: '700',
  };

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeBlocked.current = (chipBarRef.current?.contains(e.target as Node) ?? false) || (buyAgainRef.current?.contains(e.target as Node) ?? false);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (swipeBlocked.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
      const tabs: Tab[] = ['shop', 'find', 'split'];
      const idx = tabs.indexOf(tab);
      if (dx < 0 && idx < tabs.length - 1) setTab(tabs[idx + 1]);
      if (dx > 0 && idx > 0) setTab(tabs[idx - 1]);
    }
  }

  function addPendingExtra(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(pendingExtraAmount);
    if (isNaN(amt) || amt <= 0) return;
    const exp: Expense = {
      id: genId(), paidBy: userName,
      amount: amt, note: pendingExtraItems.trim() || 'Extra purchases',
      createdAt: Date.now(), category: 'produce',
    };
    setExpenses(prev => [exp, ...prev]);
    syncOp('expense', 'upsert', exp);
    setPendingExtraActive(false);
    setPendingExtraOpen(false);
    setPendingExtraItems('');
    setPendingExtraAmount('');
    localStorage.removeItem('dnk-pending-extra');
  }

  function dismissPendingExtra() {
    setPendingExtraActive(false);
    setPendingExtraOpen(false);
    setPendingExtraItems('');
    setPendingExtraAmount('');
    localStorage.removeItem('dnk-pending-extra');
  }

  async function syncOp(type: string, action: string, data: unknown) {
    if (!householdCode) return;
    try {
      await fetch(`/api/sync?code=${householdCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, data }),
      });
    } catch {}
  }

  // Setup
  async function completeSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setupUser.trim() || setupCode.length !== 6) return;
    const code = setupCode.toUpperCase();
    try {
      await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: setupUser.trim() }),
      });
    } catch {}
    // The partner's name arrives with the first sync, once they join with the same code
    const u = setupUser.trim();
    localStorage.setItem('dnk-user', u);
    localStorage.setItem('dnk-partner', '');
    localStorage.setItem('dnk-code', code);
    setUserName(u); setPartnerName('');
    setHouseholdCode(code);
    setIsSetup(false);
  }

  // Demo
  // Local-only sample household: no household code, so nothing is synced.
  function clearLocalData() {
    for (const k of Object.keys(localStorage)) {
      if ((k.startsWith('dnk-') || k.startsWith('pickle-')) && k !== 'dnk-theme') localStorage.removeItem(k);
    }
  }

  function startDemo() {
    const d = buildDemo();
    clearLocalData();
    localStorage.setItem('pickle-rename-seen', '1');
    localStorage.setItem('pickle-demo', '1');
    localStorage.setItem('pickle-demo-history', JSON.stringify(d.history));
    localStorage.setItem('dnk-user', d.user);
    localStorage.setItem('dnk-partner', d.partner);
    localStorage.setItem('dnk-items', JSON.stringify(d.items));
    localStorage.setItem('dnk-expenses', JSON.stringify(d.expenses));
    localStorage.setItem('dnk-budget', String(d.budget));
    setUserName(d.user); setPartnerName(d.partner);
    setItems(d.items); setExpenses(d.expenses); setHistory(d.history);
    setBudget(d.budget);
    setHouseholdCode('');
    setIsDemo(true);
    setIsSetup(false);
  }

  function exitDemo() {
    clearLocalData();
    localStorage.setItem('pickle-rename-seen', '1');
    setItems([]); setExpenses([]); setHistory([]); setBudget(null);
    setUserName(''); setPartnerName('');
    setIsDemo(false);
    setIsSetup(true);
  }

  // Shop
  function addCustomItem(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    const newItem: Item = {
      id: genId(), name: formName.trim(),
      quantity: formQty, notes: formNotes.trim(),
      category: formCat, emoji: formEmoji,
      bought: false, addedBy: userName,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
    syncOp('item', 'upsert', newItem);
    setFormName(''); setFormQty('1'); setFormNotes('');
    setFormCat('produce'); setFormEmoji('');
    setSuggestionPicked(false); setFormOpen(false);
  }

  function pickSuggestion(p: Product) {
    setSuggestionPicked(true);
    setFormName(p.name); setFormCat(p.category); setFormEmoji(p.emoji || '');
  }

  function addFromCatalog(product: Product & { emoji?: string }) {
    const existing = items.find(i => !i.bought && i.name === product.name);
    if (existing) {
      setItems(prev => prev.filter(i => i.id !== existing.id));
      syncOp('item', 'delete', { id: existing.id });
      setJustAdded(prev => { const s = new Set(prev); s.delete(product.id); return s; });
      return;
    }
    const newItem: Item = {
      id: genId(), name: product.name,
      quantity: '1', notes: '',
      category: product.category, emoji: product.emoji || '',
      bought: false, addedBy: userName,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setItems(prev => [newItem, ...prev]);
    syncOp('item', 'upsert', newItem);
    setJustAdded(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setJustAdded(prev => { const s = new Set(prev); s.delete(product.id); return s; });
    }, 1400);
  }

  function toggleBought(id: string) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, bought: !i.bought, updatedAt: Date.now() };
      syncOp('item', 'upsert', updated);
      if (!i.bought) {
        setBuyCounts(prev => {
          const newCount = (prev[i.name] || 0) + 1;
          if (newCount >= 3) {
            setRecurring(r => ({ ...r, [i.name]: { category: i.category, emoji: i.emoji } }));
          }
          return { ...prev, [i.name]: newCount };
        });
      }
      return updated;
    }));
  }

  function toggleRecurring(name: string, category: Category, emoji: string) {
    setRecurring(prev => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = { category, emoji };
      return next;
    });
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    syncOp('item', 'delete', { id });
  }

  function changeQty(id: string, delta: number) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const curr = parseInt(i.quantity || '1', 10);
      const next = Math.max(1, curr + delta);
      const updated = { ...i, quantity: String(next), updatedAt: Date.now() };
      syncOp('item', 'upsert', updated);
      return updated;
    }));
  }

  async function enableNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const permission = await Notification.requestPermission();
    setNotifStatus(permission as 'default' | 'granted' | 'denied');
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BE-gB42elJ0804pmr9wHZk1I9ayM0zIHNTaWkTbK-j3OqQwt0_jDTWW3k2SSJFd9_59vgVi-Q2kWpKXgOrlS89g',
    });
    await fetch(`/api/push?code=${householdCode}&user=${encodeURIComponent(userName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription: sub.toJSON() }),
    });
  }

  function shareList() {
    const lines: string[] = [`🛒 Shopping List\n`];
    for (const cat of CAT_ORDER) {
      const g = grouped[cat];
      if (!g || g.length === 0) continue;
      lines.push(`${CAT[cat].label}:`);
      for (const item of g) {
        const qty = item.quantity && item.quantity !== '1' ? ` ×${item.quantity}` : '';
        const note = item.notes ? ` (${item.notes})` : '';
        lines.push(`• ${item.name}${qty}${note}`);
      }
      lines.push('');
    }
    const text = lines.join('\n').trim();
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Shopping List', text }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!')).catch(() => {});
    }
  }

  // Custom products
  function saveCustomProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!cpName.trim()) return;
    const np: CustomProduct = { id: genId(), name: cpName.trim(), category: cpCat };
    setCustomProducts(prev => [np, ...prev]);
    syncOp('custom_product', 'upsert', np);
    addFromCatalog({ ...np, emoji: '' });
    setCpName(''); setCpCat('produce'); setAddCatalogOpen(false);
  }

  function deleteCustomProduct(id: string) {
    setCustomProducts(prev => prev.filter(cp => cp.id !== id));
    syncOp('custom_product', 'delete', { id });
  }

  function openRename(id: string, name: string, type: 'item' | 'custom' | 'new', category?: Category, emoji?: string) {
    setRenameTarget({ id, name, type, category, emoji });
    setRenameName(name);
    if (category) setRenameCat(category);
  }

  function saveRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameName.trim()) return;
    const newName = renameName.trim();
    if (renameTarget.type === 'item') {
      setItems(prev => prev.map(i => {
        if (i.id !== renameTarget.id) return i;
        const updated = { ...i, name: newName, category: renameCat, updatedAt: Date.now() };
        syncOp('item', 'upsert', updated);
        return updated;
      }));
    } else if (renameTarget.type === 'custom') {
      setCustomProducts(prev => prev.map(cp => {
        if (cp.id !== renameTarget.id) return cp;
        const updated = { ...cp, name: newName, category: renameCat };
        syncOp('custom_product', 'delete', { id: cp.id });
        syncOp('custom_product', 'upsert', updated);
        return updated;
      }));
    } else {
      setHiddenProducts(prev => new Set([...prev, renameTarget.id]));
      const np: CustomProduct = { id: genId(), name: newName, category: renameCat };
      setCustomProducts(prev => [np, ...prev]);
      syncOp('custom_product', 'upsert', np);
    }
    setRenameTarget(null);
    setRenameName('');
  }

  function deleteFromRename() {
    if (!renameTarget) return;
    if (renameTarget.type === 'custom') {
      deleteCustomProduct(renameTarget.id);
    } else {
      setHiddenProducts(prev => new Set([...prev, renameTarget.id]));
    }
    setRenameTarget(null);
    setRenameName('');
  }

  // Expenses
  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return;
    const createdAt = new Date(expenseDate + 'T12:00:00').getTime();
    const exp: Expense = {
      id: genId(), paidBy: expensePaidBy === 'user' ? userName : (partnerName || 'partner'),
      amount: amt, note: expenseNote.trim(),
      createdAt, category: expenseCat,
    };
    setExpenses(prev => [exp, ...prev]);
    syncOp('expense', 'upsert', exp);
    setExpenseAmount(''); setExpenseNote('');
    setExpensePaidBy('user');
    setExpenseCat('produce');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseOpen(false);
  }

  function openEditExpense(exp: Expense) {
    setEditExpense(exp);
    setEditAmount(exp.amount.toFixed(2));
    setEditNote(exp.note);
    const resolved = exp.paidBy === 'user' || exp.paidBy === userName ? 'user' : 'partner';
    setEditPaidBy(resolved);
    setEditDate(new Date(exp.createdAt).toISOString().split('T')[0]);
    setEditCat(resolveExpCat(exp.category));
  }

  function saveEditExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!editExpense) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) return;
    const createdAt = new Date(editDate + 'T12:00:00').getTime();
    const updated: Expense = { ...editExpense, paidBy: editPaidBy === 'user' ? userName : (partnerName || 'partner'), amount: amt, note: editNote.trim(), createdAt, category: editCat };
    setExpenses(prev => prev.map(ex => ex.id === updated.id ? updated : ex));
    syncOp('expense', 'upsert', updated);
    setEditExpense(null);
  }

  function deleteExpenseById(id: string) {
    setExpenses(prev => prev.filter(ex => ex.id !== id));
    syncOp('expense', 'delete', { id });
    setEditExpense(null);
  }

  function addShopExpense(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(shopAmount);
    if (isNaN(amt) || amt <= 0) return;
    const exp: Expense = {
      id: genId(), paidBy: shopPaidBy === 'user' ? userName : (partnerName || 'partner'),
      amount: amt, note: shopSupermarket.trim(),
      createdAt: Date.now(), category: 'produce',
    };
    setExpenses(prev => [exp, ...prev]);
    syncOp('expense', 'upsert', exp);
    setShopAmount(''); setShopSupermarket('');
    setShopDoneOpen(false);
    setTab('split');
    setPendingExtraActive(true);
    localStorage.setItem('dnk-pending-extra', 'true');
  }

  function settleUp() {
    if (settleConfirm) {
      const ts = Date.now();
      setExpenses([]);
      syncOp('expense', 'settle_all', { settledAt: ts });
      setSettleConfirm(false);
    } else {
      setSettleConfirm(true);
      setTimeout(() => setSettleConfirm(false), 3500);
    }
  }

  // Receipt scanner
  function resizeImage(file: File, maxPx: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function handleReceiptImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptLoading(true);
    try {
      const base64 = await resizeImage(file, 1600);
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const data = await res.json() as { store?: string | null; total?: number; items?: { name: string; price: number; category: string }[]; error?: string };
      if (data.error || !data.items) throw new Error(data.error || 'no items');
      setReceiptData({
        store: data.store ?? null,
        total: data.total ?? 0,
        items: data.items.map(i => ({ ...i, checked: true })),
      });
    } catch {
      alert('Could not read receipt. Make sure the photo is clear and try again.');
    } finally {
      setReceiptLoading(false);
      e.target.value = '';
    }
  }

  function confirmReceipt() {
    if (!receiptData) return;
    const now = Date.now();
    const checked = receiptData.items.filter(i => i.checked);
    for (const item of checked) {
      const cat = item.category in CAT ? item.category as Category : resolveExpCat(item.category);
      const exp: Expense = {
        id: genId(), paidBy: userName,
        amount: item.price, note: item.name,
        createdAt: now, category: cat,
      };
      setExpenses(prev => [exp, ...prev]);
      syncOp('expense', 'upsert', exp);
    }
    setReceiptData(null);
  }

  // Derived
  if (!ready) return null;

  const toBuy = items.filter(i => !i.bought);
  const bought = items.filter(i => i.bought);
  // Starred first, then previously bought items — one entry per name
  const buyAgain = [
    ...Object.entries(recurring).map(([name, info]) => ({ name, category: info.category, emoji: info.emoji, starred: true })),
    ...bought.filter(i => !recurring[i.name]).map(i => ({ name: i.name, category: i.category, emoji: i.emoji, starred: false })),
  ].filter((b, idx, arr) => arr.findIndex(x => x.name === b.name) === idx);

  const grouped: Partial<Record<Category, Item[]>> = {};
  for (const c of CAT_ORDER) {
    const g = toBuy.filter(i => i.category === c);
    if (g.length) grouped[c] = g;
  }

  // Resolve legacy 'user'/'partner' values to actual names
  function resolvePaidBy(paidBy: string): string {
    if (paidBy === 'user') return userName;
    if (paidBy === 'partner') return partnerName || '';
    return paidBy;
  }

  const totalByUser = expenses.filter(e => resolvePaidBy(e.paidBy) === userName).reduce((s, e) => s + e.amount, 0);
  const totalByPartner = expenses.filter(e => resolvePaidBy(e.paidBy) === (partnerName || '')).reduce((s, e) => s + e.amount, 0);
  const balance = (totalByUser - totalByPartner) / 2;

  const now = new Date();
  const allExp = [...expenses, ...history.flatMap(g => g.expenses)];

  const allProducts: (Product & { isCustom?: boolean })[] = [
    ...PRODUCTS.filter(p => !hiddenProducts.has(p.id)),
    ...customProducts.map(cp => ({ ...cp, emoji: '', isCustom: true as const })),
  ];

  const catalogProducts = (() => {
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      return allProducts.filter(p => p.name.toLowerCase().includes(q));
    }
    return filterCat === 'all' ? allProducts : allProducts.filter(p => p.category === filterCat);
  })();

  if (isSetup) return (
    <SetupScreen
      C={C} inputStyle={inputStyle} labelStyle={labelStyle}
      name={setupUser} code={setupCode}
      onNameChange={setSetupUser} onCodeChange={setSetupCode}
      onSubmit={completeSetup} onDemo={startDemo}
    />
  );

  function goTo(t: Tab) { setTab(t); setShowHome(false); }

  const demoBanner = isDemo ? <DemoBanner onExit={exitDemo} /> : null;

  if (showHome) return (
    <HomeScreen C={C} itemCount={toBuy.length} onOpen={() => goTo('shop')} banner={demoBanner} />
  );

  // Main app
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, paddingBottom: '32px', position: 'relative', zIndex: 0 }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {demoBanner}
      <style>{`
        @keyframes pulse-fab { 0%,100% { box-shadow: 0 4px 20px rgba(27,95,173,0.45); } 50% { box-shadow: 0 4px 32px rgba(27,95,173,0.75); } }
        @keyframes slide-up { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
        .slide-up { animation: slide-up 0.3s ease forwards; }
        @keyframes bag-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
      `}</style>

      {BACKGROUND_STICKERS.map(st => (
        <img key={st.src} src={st.src} alt="" style={{ position: 'fixed', pointerEvents: 'none', userSelect: 'none', ...st.style }} />
      ))}

      {/* Header */}
      <header ref={headerRef} style={{ backgroundColor: C.bg, padding: '18px 20px 0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <button onClick={() => setShowHome(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '20px', fontWeight: '900', color: C.accent, letterSpacing: '-0.5px', lineHeight: 1 }}>
              pickle
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {notifStatus === 'default' && householdCode && (
                <button
                  onClick={enableNotifications}
                  title="Enable notifications"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', fontSize: '16px', lineHeight: 1, color: C.text }}
                >🔔</button>
              )}
              <div style={{ fontSize: '12px', color: C.dim, fontWeight: '600', letterSpacing: '0.5px' }}>
                {tab === 'split' && Math.abs(balance) > 0.01 ? (
                  <span style={{ color: balance > 0 ? C.success : C.danger, fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '16px', fontWeight: '700' }}>
                    {balance > 0 ? '+' : ''}€{Math.abs(balance).toFixed(2)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs — segmented control */}
          <div style={{ display: 'flex', gap: '4px', padding: '4px', margin: '2px 0 10px', backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: '14px' }}>
            {([
              { key: 'shop',  label: 'List',  icon: '🛒' },
              { key: 'find',  label: 'Find',  icon: '🔍' },
              { key: 'split', label: 'Split', icon: '💸' },
            ] as { key: Tab; label: string; icon: string }[]).map(t => {
              const sc = SECTION_COLORS[t.key as keyof typeof SECTION_COLORS];
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={active} style={{
                  flex: 1, padding: '10px 6px', border: 'none', borderRadius: '10px',
                  backgroundColor: active ? sc.bg : 'transparent',
                  color: active ? sc.text : C.dim,
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: '800', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: active ? `0 2px 8px ${sc.bg}40` : 'none',
                  transition: 'background-color 0.15s, color 0.15s',
                }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category chips — inside sticky header, only on Find tab */}
          {tab === 'find' && (() => {
            const activeCat: Category | 'all' = filterCat !== 'all' ? filterCat : (search.trim().length < 2 && scrolledCat) || 'all';
            return (
              <div ref={chipBarRef} style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0 4px', scrollbarWidth: 'none' }}>
                <Chip C={C} label="All" selected={activeCat === 'all'} onClick={() => setFilterCat('all')} />
                {CAT_ORDER.map(c => (
                  <Chip key={c} C={C} label={CAT[c].label} selected={activeCat === c} onClick={() => setFilterCat(c)} accent={CAT[c].accent} />
                ))}
              </div>
            );
          })()}
        </div>
      </header>

      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '0 16px' }}>
        {renameNotice && (
          <div style={{ marginTop: '12px', backgroundColor: C.surface, border: `1.5px solid ${C.accent}`, borderRadius: '16px', padding: '16px 18px' }}>
            <p style={{ fontSize: '16px', fontWeight: '800', color: C.text, margin: '0 0 6px' }}>We&apos;re pickle now 🥒</p>
            <p style={{ fontSize: '13px', color: C.dim, margin: '0 0 10px', lineHeight: 1.5 }}>
              To update the name and icon on your home screen, remove the app and add it again:
            </p>
            <p style={{ fontSize: '13px', fontWeight: '700', color: C.text, margin: '0 0 10px', lineHeight: 1.5 }}>
              {renameNotice === 'ios' ? 'Safari → Share ↑ → Add to Home Screen' : 'Chrome → ⋮ menu → Add to Home screen'}
            </p>
            {householdCode && (
              <p style={{ fontSize: '12px', color: C.dim, margin: '0 0 12px' }}>
                Your household code: <strong style={{ color: C.text, letterSpacing: '1px' }}>{householdCode}</strong>
              </p>
            )}
            <button
              onClick={() => { localStorage.setItem('pickle-rename-seen', '1'); setRenameNotice(null); }}
              style={{ padding: '10px 16px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Got it
            </button>
          </div>
        )}

        {/* Shopping mode overlay */}
        {shopMode && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: C.bg, zIndex: 150, overflowY: 'auto', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', position: 'sticky', top: 0, backgroundColor: C.bg, zIndex: 2, borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: C.dim, margin: 0 }}>Shopping mode</p>
                <p style={{ fontSize: '13px', color: C.text, margin: '2px 0 0', fontWeight: '600' }}>
                  {toBuy.length === 0 ? 'All done!' : `${toBuy.length} item${toBuy.length === 1 ? '' : 's'} left`}
                </p>
              </div>
              <button onClick={() => setShopMode(false)} style={{ width: '36px', height: '36px', backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '50%', fontSize: '20px', fontWeight: '400', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
                ×
              </button>
            </div>
            <div style={{ padding: '8px 16px' }}>
              {toBuy.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '22px', fontWeight: '700', color: C.text, margin: '0 0 8px' }}>All done!</p>
                  <p style={{ fontSize: '14px', color: C.dim }}>Everything&apos;s been checked off.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                  {CAT_ORDER.flatMap(c => toBuy.filter(i => i.category === c)).map(item => (
                    <button key={item.id} onClick={() => toggleBought(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '16px 18px', backgroundColor: C.surface, border: `1.5px solid ${C.border}`, borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2.5px solid ${C.muted}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '17px', fontWeight: '700', color: C.text, margin: 0 }}>{item.name}</p>
                        {(item.quantity && item.quantity !== '1') || item.notes ? (
                          <p style={{ fontSize: '12px', color: C.dim, margin: '2px 0 0' }}>
                            {item.quantity && item.quantity !== '1' ? `×${item.quantity}` : ''}{item.notes ? (item.quantity && item.quantity !== '1' ? ' · ' : '') + item.notes : ''}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {bought.length > 0 && (
                <div style={{ marginTop: '28px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: C.dim, margin: '0 0 8px', paddingLeft: '4px' }}>Done ({bought.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.5 }}>
                    {bought.map(item => (
                      <button key={item.id} onClick={() => toggleBought(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '14px 18px', backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2.5px solid ${C.muted}`, backgroundColor: C.muted, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7.5L8 2.5" stroke={C.bg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: C.dim, margin: 0, textDecoration: 'line-through' }}>{item.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div style={{ paddingTop: '8px' }}>

            {/* Pending extras banner */}
            {pendingExtraActive && (
              <div style={{ margin: '12px 0', padding: '14px 16px', backgroundColor: C.surface, border: `1.5px solid ${C.accent}60`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: C.text, margin: '0 0 2px' }}>Bought something extra?</p>
                  <p style={{ fontSize: '11px', color: C.dim, margin: 0 }}>Something off the list — pending</p>
                </div>
                <button onClick={() => setPendingExtraOpen(true)} style={{ padding: '8px 14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Add it
                </button>
              </div>
            )}

            {/* Buy again box */}
            {(() => {
              if (buyAgain.length === 0) return null;
              return (
                <div style={{ margin: '12px 0', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: C.dim, margin: 0 }}>Buy again</p>
                    <button onClick={() => setBuyAgainOpen(true)} style={{ fontSize: '12px', color: C.accent, background: C.accentDim, border: `1px solid ${C.accent}40`, borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', padding: '3px 10px' }}>See all</button>
                  </div>
                  <div ref={buyAgainRef} style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {buyAgain.map(({ name, category, emoji }) => {
                      const inList = items.some(i => !i.bought && i.name === name);
                      return (
                        <button key={name} onClick={() => {
                          if (inList) return;
                          const newItem: Item = { id: genId(), name, quantity: '1', notes: '', category, emoji, bought: false, addedBy: userName, createdAt: Date.now(), updatedAt: Date.now() };
                          setItems(prev => [newItem, ...prev]);
                          syncOp('item', 'upsert', newItem);
                        }} style={{ padding: '7px 13px', borderRadius: '20px', flexShrink: 0, border: `1.5px solid ${inList ? '#F97316' : C.border}`, backgroundColor: inList ? '#F9731620' : C.surface2, color: inList ? '#F97316' : C.text, fontSize: '13px', fontWeight: inList ? '700' : '400', cursor: inList ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {Object.keys(grouped).length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 24px 40px', position: 'relative' }}>
                <img src="/stk-jello.png" alt="" style={{ position: 'absolute', top: '24px', right: '10px', width: '60px', transform: 'rotate(15deg)', pointerEvents: 'none', userSelect: 'none' }} />
                <img src="/stk-tangerines.png" alt="" style={{ position: 'absolute', top: '28px', left: '10px', width: '50px', transform: 'rotate(-10deg)', pointerEvents: 'none', userSelect: 'none' }} />
                <div style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
                  <img src="/image1.jpeg" alt="" style={{ width: '100%', height: '220px', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                </div>
                <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '18px', color: C.text, margin: '0 0 8px', fontWeight: '700' }}>your shopping list is empty</p>
                <p style={{ fontSize: '13px', color: C.dim, margin: 0, lineHeight: 1.6, textAlign: 'center' }}>tap + to add an item or browse Find for ideas</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '-6px' }}>
                  <button onClick={() => setShopMode(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: SECTION_COLORS.shop.bg, border: 'none', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.3px' }}>
                    <span>🛒</span><span>Shopping mode</span>
                  </button>
                  <button onClick={shareList} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', color: C.dim, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.3px' }}>
                    <span>↑</span><span>Share</span>
                  </button>
                </div>
                {CAT_ORDER.filter(c => grouped[c]).map((cat, i) => (
                  <div key={cat} style={{ marginTop: i === 0 ? '20px' : '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingLeft: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: CAT[cat].accent }}>
                          {CAT[cat].label}
                        </span>
                        <span style={{ fontSize: '12px', color: C.dim, fontWeight: '600' }}>{grouped[cat]!.length}</span>
                      </div>
                      <button
                        onClick={() => setConfirmDelete({ type: 'category', cat, count: grouped[cat]!.length })}
                        style={{ height: '28px', padding: '0 10px', fontSize: '12px', color: C.dim, backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: `2px solid ${CAT[cat].accent}30` }}>
                      {grouped[cat]!.map(item => (
                        <ItemCard key={item.id} item={item} onToggle={toggleBought} onDelete={id => setConfirmDelete({ type: 'item', id, name: item.name })} onChangeQty={changeQty} onRename={i => openRename(i.id, i.name, 'item', i.category, i.emoji)} addedByColor={item.addedBy === userName ? '#1B5FAD' : item.addedBy === partnerName ? '#2D7D46' : '#C4C0B8'} C={C} />
                      ))}
                    </div>
                  </div>
                ))}

              </>
            )}
            {bought.length > 0 && (
              <div style={{ marginTop: '32px', marginBottom: '16px' }}>
                <button
                  onClick={() => {
                    const next = !boughtExpanded;
                    setBoughtExpanded(next);
                    if (next && bought.length > 0) {
                      const mostRecentTs = Math.max(...bought.map(i => i.updatedAt ?? i.createdAt));
                      setExpandedDates(new Set([new Date(mostRecentTs).toDateString()]));
                    }
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: C.surface, borderRadius: '12px', border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: C.dim, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Done ({bought.length})
                  </span>
                  <span style={{ fontSize: '16px', color: C.muted, transform: boughtExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>˅</span>
                </button>
                {boughtExpanded && (() => {
                  const groupMap: Record<string, { ts: number; items: Item[] }> = {};
                  for (const item of bought) {
                    const ts = item.updatedAt ?? item.createdAt;
                    const key = new Date(ts).toDateString();
                    if (!groupMap[key]) groupMap[key] = { ts, items: [] };
                    if (ts > groupMap[key].ts) groupMap[key].ts = ts;
                    groupMap[key].items.push(item);
                  }
                  const groups = Object.entries(groupMap)
                    .map(([key, g]) => ({ key, ts: g.ts, label: fmtDate(g.ts), items: g.items }))
                    .sort((a, b) => b.ts - a.ts);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {groups.map(group => {
                        const isOpen = expandedDates.has(group.key);
                        const toggleDate = () => setExpandedDates(prev => {
                          const next = new Set(prev);
                          if (next.has(group.key)) next.delete(group.key); else next.add(group.key);
                          return next;
                        });
                        const matchExp = expenses.find(ex => new Date(ex.createdAt).toDateString() === group.key);
                        return (
                          <div key={group.key}>
                            <button onClick={toggleDate} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: C.surface2, borderRadius: isOpen ? '12px 12px 0 0' : '12px', border: `1px solid ${C.border}`, borderBottom: isOpen ? 'none' : `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{group.label}</span>
                                {matchExp && (
                                  <span style={{ fontSize: '11px', color: C.dim, fontWeight: '600' }}>
                                    {[matchExp.note, `€${matchExp.amount.toFixed(2)}`, resolvePaidBy(matchExp.paidBy) || matchExp.paidBy].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: C.muted }}>{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                                <span style={{ fontSize: '14px', color: C.muted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>˅</span>
                              </div>
                            </button>
                            {isOpen && (
                              <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                                {group.items.map((item, idx) => (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', backgroundColor: C.surface, borderTop: idx > 0 ? `1px solid ${C.border}` : 'none', opacity: 0.7 }}>
                                    <button onClick={() => toggleBought(item.id)} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${CAT[item.category].accent}`, backgroundColor: CAT[item.category].accent, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7.5L8 2.5" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: '14px', color: C.dim, textDecoration: 'line-through', fontWeight: '700' }}>{item.name}</span>
                                      {item.quantity && item.quantity !== '1' && <span style={{ color: C.muted, fontSize: '12px', marginLeft: '6px' }}>×{item.quantity}</span>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                      {item.addedBy && <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>{item.addedBy}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Find */}
        {tab === 'find' && (
          <div style={{ paddingTop: '16px' }}>
            {/* Search row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Search all products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => setAddCatalogOpen(true)}
                style={{ padding: '0 16px', backgroundColor: C.accentDim, border: `1.5px solid ${C.accent}40`, borderRadius: '10px', color: C.accent, fontSize: '20px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                title="Add custom product"
              >
                +
              </button>
            </div>

            {/* Product grid */}
            {filterCat === 'all' && search.length < 2 ? (
              CAT_ORDER.map(cat => {
                const prods = PRODUCTS.filter(p => p.category === cat);
                const custom = customProducts.filter(cp => cp.category === cat);
                const allInCat = [
                  ...prods,
                  ...custom.map(cp => ({ ...cp, emoji: '', isCustom: true as const })),
                ];
                return (
                  <div key={cat} ref={el => { if (el) catSectionRefs.current.set(cat, el); else catSectionRefs.current.delete(cat); }} style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: CAT[cat].accent, marginBottom: '10px' }}>
                      {CAT[cat].label}
                    </div>
                    <ProductGrid products={allInCat} items={items} justAdded={justAdded} onAdd={addFromCatalog} onRename={p => p.isCustom ? openRename(p.id, p.name, 'custom') : openRename(p.id, p.name, 'new', p.category, p.emoji)} recurring={recurring} onToggleRecurring={toggleRecurring} C={C} />
                  </div>
                );
              })
            ) : catalogProducts.length === 0 ? (
              <Empty C={C} title="No results" sub="Try a different search or add it yourself" />
            ) : (
              <ProductGrid products={catalogProducts} items={items} justAdded={justAdded} onAdd={addFromCatalog} onRename={p => p.isCustom ? openRename(p.id, p.name, 'custom') : openRename(p.id, p.name, 'new', p.category, p.emoji)} recurring={recurring} onToggleRecurring={toggleRecurring} C={C} />
            )}
          </div>
        )}

        {/* Split */}
        {tab === 'split' && (
          <SplitTab
            C={C} expenses={expenses} history={history} bought={bought} budget={budget}
            userName={userName} partnerName={partnerName}
            totalByUser={totalByUser} totalByPartner={totalByPartner} balance={balance}
            resolvePaidBy={resolvePaidBy}
            settleConfirm={settleConfirm} receiptLoading={receiptLoading} receiptInputRef={receiptInputRef}
            onOpenSpending={() => setSpendingOpen(true)}
            onEditBudget={() => { setBudgetInput(budget ? String(budget) : ''); setBudgetOpen(true); }}
            onNewExpense={() => setExpenseOpen(true)}
            onReceiptImage={handleReceiptImage}
            onSettle={settleUp}
            onEditExpense={openEditExpense}
          />
        )}
      </div>

      {/* FAB */}
      {tab === 'shop' && !formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          style={{ position: 'fixed', bottom: '28px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: SECTION_COLORS.shop.bg, color: '#FFFFFF', border: 'none', fontSize: '28px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, fontWeight: '900', animation: 'pulse-fab 2.5s ease-in-out infinite' }}
        >+</button>
      )}

      {/* Add item drawer */}
      {formOpen && (
        <Drawer C={C} onClose={() => setFormOpen(false)} title="Add to list">
          <form onSubmit={addCustomItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Name input + inline qty controls */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Feta, Spaghetti, Shampoo…"
                  value={formName}
                  onChange={e => { setSuggestionPicked(false); setFormName(e.target.value); }}
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                {formName.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => setFormQty(String(Math.max(1, parseInt(formQty || '1') - 1)))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.surface2, color: C.text, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}>−</button>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: C.text, minWidth: '22px', textAlign: 'center' }}>{formQty || '1'}</span>
                    <button type="button" onClick={() => setFormQty(String(parseInt(formQty || '1') + 1))} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.surface2, color: C.text, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}>+</button>
                  </div>
                )}
              </div>
              {/* Suggestions */}
              {!suggestionPicked && suggestions.length > 0 && (
                <div style={{ marginTop: '6px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  {suggestions.map((s, i) => (
                    <button key={s.id} type="button" onClick={() => pickSuggestion(s)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 14px', border: 'none', borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none', backgroundColor: C.surface2, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', color: C.text, textAlign: 'left' }}>
                      <span style={{ flex: 1 }}>{s.name}</span>
                      <span style={{ fontSize: '10px', color: CAT[s.category].text, backgroundColor: CAT[s.category].bg, padding: '3px 8px', borderRadius: '20px', fontWeight: '700', whiteSpace: 'nowrap', border: `1px solid ${CAT[s.category].accent}40` }}>
                        {CAT[s.category].label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: C.dim, margin: '0 0 8px' }}>Category</p>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', margin: '0 -20px', padding: '0 20px 2px', scrollbarWidth: 'none' }}>
                {CAT_ORDER.map(cat => (
                  <Chip key={cat} C={C} label={CAT[cat].label} selected={formCat === cat} onClick={() => setFormCat(cat)} accent={CAT[cat].accent} />
                ))}
              </div>
            </div>

            {/* Notes + submit — appear once name is filled */}
            {formName.length > 0 && (
              <>
                <textarea
                  placeholder="Note (optional) — organic, near the entrance…"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
                />
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900' }}>
                  Add to list
                </button>
              </>
            )}
          </form>
        </Drawer>
      )}

      {/* Add to catalog drawer */}
      {/* Buy again — See all drawer */}
      {buyAgainOpen && (() => {
        return (
          <Drawer C={C} onClose={() => setBuyAgainOpen(false)} title="Buy again">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {buyAgain.map(({ name, category, emoji }) => {
                const inList = items.some(i => !i.bought && i.name === name);
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: C.surface2, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', color: C.text, margin: 0, fontWeight: '700' }}>{name}</p>
                      <p style={{ fontSize: '11px', color: C.dim, margin: '2px 0 0' }}>{CAT[category].label}</p>
                    </div>
                    <button onClick={() => {
                      if (!inList) {
                        const newItem: Item = { id: genId(), name, quantity: '1', notes: '', category, emoji, bought: false, addedBy: userName, createdAt: Date.now(), updatedAt: Date.now() };
                        setItems(prev => [newItem, ...prev]);
                        syncOp('item', 'upsert', newItem);
                      }
                      setBuyAgainOpen(false);
                    }} style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${inList ? '#F97316' : C.accent}`, backgroundColor: inList ? '#F9731620' : C.accentDim, color: inList ? '#F97316' : C.accent, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                      {inList ? 'In list' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Drawer>
        );
      })()}

      {addCatalogOpen && (
        <Drawer C={C} onClose={() => setAddCatalogOpen(false)} title="Add to catalog">
          <form onSubmit={saveCustomProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: C.dim, marginTop: '-8px' }}>
              Save a product so it always appears in your catalog.
            </p>
            <div>
              <label style={labelStyle}>Product name</label>
              <input type="text" placeholder="e.g. Κυδωνόπαστο" value={cpName} onChange={e => setCpName(e.target.value)} autoFocus style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CAT_ORDER.map(cat => (
                  <button key={cat} type="button" onClick={() => setCpCat(cat)} style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${cpCat === cat ? CAT[cat].accent : C.border}`, backgroundColor: cpCat === cat ? CAT[cat].bg : C.surface2, color: cpCat === cat ? CAT[cat].text : C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: cpCat === cat ? '700' : '500', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                    {CAT[cat].label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', marginTop: '4px' }}>
              Save to catalog
            </button>
          </form>
        </Drawer>
      )}

      {/* Shop done — send to split */}
      {shopDoneOpen && (
        <Drawer C={C} onClose={() => setShopDoneOpen(false)} title="All done! 🛒">
          <form onSubmit={addShopExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '22px', fontWeight: '700', color: C.text, marginTop: '-12px', lineHeight: 1.4 }}>
              {shopDoneMsg}
            </p>
            <div>
              <label style={labelStyle}>Who paid?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['user', 'partner'] as const).map(who => (
                  <button key={who} type="button" onClick={() => setShopPaidBy(who)} style={{ padding: '14px', border: `2px solid ${shopPaidBy === who ? C.accent : C.border}`, borderRadius: '12px', backgroundColor: shopPaidBy === who ? C.accentDim : 'transparent', color: shopPaidBy === who ? C.accent : C.dim, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', transition: 'all 0.15s' }}>
                    {who === 'user' ? userName : partnerName || '...'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Amount (€)</label>
              <input type="text" inputMode="decimal" placeholder="0.00" value={shopAmount} onChange={e => setShopAmount(e.target.value.replace(',', '.'))} autoFocus style={{ ...inputStyle, fontSize: '28px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace" }} required />
            </div>
            <div>
              <label style={labelStyle}>Supermarket</label>
              <input type="text" placeholder="AB, Sklavenitis, Lidl…" value={shopSupermarket} onChange={e => setShopSupermarket(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {SUPERMARKETS.map(sm => (
                  <button key={sm} type="button" onClick={() => setShopSupermarket(sm)} style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${shopSupermarket === sm ? C.accent : C.border}`, backgroundColor: shopSupermarket === sm ? C.accentDim : 'transparent', color: shopSupermarket === sm ? C.accent : C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>{sm}</button>
                ))}
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: SECTION_COLORS.split.bg, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', marginTop: '4px' }}>
              Send to Split →
            </button>
          </form>
        </Drawer>
      )}

      {/* Rename drawer */}
      {renameTarget && (
        <Drawer C={C} onClose={() => setRenameTarget(null)} title="Edit item">
          <form onSubmit={saveRename} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={renameName} onChange={e => setRenameName(e.target.value)} autoFocus required style={{ ...inputStyle, fontSize: '18px', fontWeight: '600' }} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CAT_ORDER.map(cat => (
                  <button key={cat} type="button" onClick={() => setRenameCat(cat)} style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${renameCat === cat ? CAT[cat].accent : C.border}`, backgroundColor: renameCat === cat ? CAT[cat].bg : C.surface2, color: renameCat === cat ? CAT[cat].text : C.text, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: renameCat === cat ? '700' : '400', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                    {CAT[cat].label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900' }}>
              Save
            </button>
            <button type="button" onClick={deleteFromRename} style={{ width: '100%', padding: '14px', backgroundColor: `${C.danger}15`, color: C.danger, border: `1.5px solid ${C.danger}50`, borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
              Delete
            </button>
          </form>
        </Drawer>
      )}

      {/* Pending extras drawer */}
      {pendingExtraOpen && (
        <Drawer C={C} onClose={() => setPendingExtraOpen(false)} title="Extra purchases">
          <form onSubmit={addPendingExtra} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: C.dim, marginTop: '-8px' }}>
              Bought something not on the list? Log it here.
            </p>
            <div>
              <label style={labelStyle}>What did you buy? <span style={{ color: C.muted, fontWeight: '400', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span></label>
              <input type="text" placeholder="e.g. chocolate, candles..." value={pendingExtraItems} onChange={e => setPendingExtraItems(e.target.value)} style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Amount (€)</label>
              <input type="text" inputMode="decimal" placeholder="0.00" value={pendingExtraAmount} onChange={e => setPendingExtraAmount(e.target.value.replace(',', '.'))} required style={{ ...inputStyle, fontSize: '28px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace" }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', marginTop: '4px' }}>
              Add to Split
            </button>
            <button type="button" onClick={dismissPendingExtra} style={{ width: '100%', padding: '12px', backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
              Nothing extra
            </button>
          </form>
        </Drawer>
      )}

      {/* Spending detail drawer */}
      {spendingOpen && (
        <Drawer C={C} onClose={() => { setSpendingOpen(false); setRecapMonth(undefined); }} title="">
          <SpendingDetail allExp={allExp} C={C} now={now} budget={budget} userName={userName} partnerName={partnerName} initialMonth={recapMonth} />
        </Drawer>
      )}

      {/* Budget drawer */}
      {budgetOpen && (
        <Drawer C={C} onClose={() => setBudgetOpen(false)} title="">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: C.dim, margin: '0 0 6px' }}>Spending limit · {MONTHS_EN[now.getMonth()]}</p>
              <p style={{ fontSize: '13px', color: C.dim, margin: 0, lineHeight: 1.6 }}>Monthly spending limit for {MONTHS_EN[now.getMonth()]}.</p>
            </div>
            <input
              type="text" inputMode="decimal" placeholder="e.g. 300"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value.replace(',', '.'))} autoFocus
              style={{ ...inputStyle, fontSize: '32px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace" }}
            />
            <button
              onClick={() => { const v = parseFloat(budgetInput); if (!isNaN(v) && v > 0) { setBudget(v); setBudgetOpen(false); } }}
              style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900' }}
            >
              Save
            </button>
            {budget && (
              <button
                onClick={() => { setBudget(null); setBudgetOpen(false); }}
                style={{ width: '100%', padding: '12px', backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
              >
                Remove limit
              </button>
            )}
          </div>
        </Drawer>
      )}

      {/* Add expense drawer */}
      {expenseOpen && (
        <Drawer C={C} onClose={() => { setExpenseOpen(false); setExpenseDate(new Date().toISOString().split('T')[0]); }} title="New purchase">
          <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Who paid?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['user', 'partner'] as const).map(who => (
                  <button key={who} type="button" onClick={() => setExpensePaidBy(who)} style={{ padding: '14px', border: `2px solid ${expensePaidBy === who ? C.accent : C.border}`, borderRadius: '12px', backgroundColor: expensePaidBy === who ? C.accentDim : 'transparent', color: expensePaidBy === who ? C.accent : C.dim, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', transition: 'all 0.15s' }}>
                    {who === 'user' ? userName : partnerName || '...'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Amount (€)</label>
              <input type="text" inputMode="decimal" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value.replace(',', '.'))} autoFocus style={{ ...inputStyle, fontSize: '28px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace" }} required />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {CAT_ORDER.map(cat => {
                  const cc = CAT[cat];
                  return (
                    <button key={cat} type="button" onClick={() => setExpenseCat(cat)} style={{ padding: '7px 12px', borderRadius: '20px', border: `1.5px solid ${expenseCat === cat ? cc.accent : C.border}`, backgroundColor: expenseCat === cat ? cc.bg : C.surface2, color: expenseCat === cat ? cc.accent : C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: expenseCat === cat ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span>{cc.emoji}</span><span>{cc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Note</label>
              <input type="text" placeholder="AB, Sklavenitis, Lidl…" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {SUPERMARKETS.map(sm => (
                  <button key={sm} type="button" onClick={() => setExpenseNote(sm)} style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${expenseNote === sm ? C.accent : C.border}`, backgroundColor: expenseNote === sm ? C.accentDim : 'transparent', color: expenseNote === sm ? C.accent : C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>{sm}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} required />
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', marginTop: '4px' }}>
              Save
            </button>
          </form>
        </Drawer>
      )}

      {editExpense && (() => {
        const expDateKey = new Date(editExpense.createdAt).toDateString();
        const drawerItems = bought.filter(it => new Date(it.updatedAt ?? it.createdAt).toDateString() === expDateKey);
        return (
        <Drawer C={C} onClose={() => setEditExpense(null)} title="Edit purchase">
          {drawerItems.length > 0 && (
            <div style={{ marginBottom: '4px', padding: '12px 14px', backgroundColor: C.surface2, borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.dim, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Items bought</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {drawerItems.map(it => (
                  <span key={it.id} style={{ fontSize: '12px', color: C.text, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '3px 8px' }}>
                    {it.emoji} {it.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={saveEditExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Who paid?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['user', 'partner'] as const).map(who => (
                  <button key={who} type="button" onClick={() => setEditPaidBy(who)} style={{ padding: '14px', border: `2px solid ${editPaidBy === who ? C.accent : C.border}`, borderRadius: '12px', backgroundColor: editPaidBy === who ? C.accentDim : 'transparent', color: editPaidBy === who ? C.accent : C.dim, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', transition: 'all 0.15s' }}>
                    {who === 'user' ? userName : partnerName || '...'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Amount (€)</label>
              <input type="text" inputMode="decimal" placeholder="0.00" value={editAmount} onChange={e => setEditAmount(e.target.value.replace(',', '.'))} autoFocus style={{ ...inputStyle, fontSize: '28px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono), 'Courier New', monospace" }} required />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {CAT_ORDER.map(cat => {
                  const cc = CAT[cat];
                  return (
                    <button key={cat} type="button" onClick={() => setEditCat(cat)} style={{ padding: '7px 12px', borderRadius: '20px', border: `1.5px solid ${editCat === cat ? cc.accent : C.border}`, backgroundColor: editCat === cat ? cc.bg : C.surface2, color: editCat === cat ? cc.accent : C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: editCat === cat ? '700' : '500', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span>{cc.emoji}</span><span>{cc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Note</label>
              <input type="text" placeholder="AB, Sklavenitis, Lidl…" value={editNote} onChange={e => setEditNote(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {SUPERMARKETS.map(sm => (
                  <button key={sm} type="button" onClick={() => setEditNote(sm)} style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${editNote === sm ? C.accent : C.border}`, backgroundColor: editNote === sm ? C.accentDim : 'transparent', color: editNote === sm ? C.accent : C.dim, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>{sm}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} required />
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '900', marginTop: '4px' }}>
              Save changes
            </button>
            <button type="button" onClick={() => deleteExpenseById(editExpense.id)} style={{ width: '100%', padding: '12px', backgroundColor: `${C.danger}15`, color: C.danger, border: `1px solid ${C.danger}60`, borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
              Delete
            </button>
          </form>
        </Drawer>
        );
      })()}

      {/* Receipt review drawer */}
      {receiptData && (
        <div onClick={() => setReceiptData(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: C.bg, borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: C.text, margin: 0 }}>
                    📷 {receiptData.store || 'Receipt'}
                  </p>
                  <p style={{ fontSize: '12px', color: C.dim, margin: '2px 0 0' }}>
                    {receiptData.items.filter(i => i.checked).length} of {receiptData.items.length} items selected
                  </p>
                </div>
                <p style={{ fontSize: '22px', fontWeight: '900', color: C.text, margin: 0, fontFamily: "var(--font-mono), 'Courier New', monospace" }}>
                  €{receiptData.items.filter(i => i.checked).reduce((s, i) => s + i.price, 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Items list */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {receiptData.items.map((item, idx) => {
                const d = getExpCatDisplay(item.category);
                return (
                  <div
                    key={idx}
                    onClick={() => setReceiptData(prev => prev ? { ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it) } : null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', opacity: item.checked ? 1 : 0.4 }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${item.checked ? d.accent : C.border}`, backgroundColor: item.checked ? d.accent : C.surface2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.checked && <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '13px', color: C.text, flex: 1, lineHeight: 1.3 }}>{d.emoji} {item.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: C.text, fontFamily: "var(--font-mono), 'Courier New', monospace", flexShrink: 0 }}>€{item.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px 32px', borderTop: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', gap: '10px' }}>
              <button
                onClick={confirmReceipt}
                disabled={receiptData.items.filter(i => i.checked).length === 0}
                style={{ flex: 1, padding: '16px', backgroundColor: C.accent, color: '#000', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Add {receiptData.items.filter(i => i.checked).length} expenses
              </button>
              <button onClick={() => setReceiptData(null)} style={{ padding: '16px 20px', backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 40px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: C.surface, borderRadius: '20px', padding: '24px 20px 20px', width: '100%', maxWidth: '420px', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '15px', fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 1.4 }}>
              {confirmDelete.type === 'item'
                ? `Remove "${confirmDelete.name}" from the list?`
                : `Remove all ${confirmDelete.count} item${confirmDelete.count === 1 ? '' : 's'} in ${CAT[confirmDelete.cat].label}?`}
            </p>
            <button
              onClick={() => {
                if (confirmDelete.type === 'item') {
                  deleteItem(confirmDelete.id);
                } else {
                  const ids = grouped[confirmDelete.cat]!.map(i => i.id);
                  setItems(prev => prev.filter(i => !ids.includes(i.id)));
                  ids.forEach(id => syncOp('item', 'delete', { id }));
                }
                setConfirmDelete(null);
              }}
              style={{ width: '100%', padding: '14px', backgroundColor: C.danger, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Remove
            </button>
            <button onClick={() => setConfirmDelete(null)} style={{ width: '100%', padding: '12px', backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
