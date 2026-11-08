'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CAT, CAT_ORDER, PRODUCTS } from './lib/products';
import type { Category, Product } from './lib/products';
import type { Item, Expense, HistoryGroup, CustomProduct, Tab } from './lib/types';
import { GLASS } from './lib/theme';
import { MONTHS_EN, SUPERMARKETS, SHOP_DONE_MSGS } from './lib/content';
import { genId, fmtDate, getExpCatDisplay, monthTotals, resolveExpCat } from './lib/format';
import {
  ACCENT, HAIRLINE, PARTNER_TINT, USER_TINT,
  bigNumberInput, btnDanger, btnPrimary, btnSecondary, choiceStyle, glass, glassStrong,
  iconBtn, inputStyle, labelStyle, numeral, pillStyle, sectionTitle,
} from './lib/ui';
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
import GlassBackground from './components/GlassBackground';
import TabBar from './components/TabBar';
import Icon from './components/Icon';

const C = GLASS;

export default function App() {
  const [ready, setReady] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [tab, setTab] = useState<Tab>('shop');
  const [showHome, setShowHome] = useState(true);

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
    const code = localStorage.getItem('dnk-code');
    // Hydrate from localStorage after mount (not available during SSR)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (u) { setUserName(u); setPartnerName(p || ''); setIsSetup(false); }
    if (it) setItems(JSON.parse(it));
    if (ex) setExpenses(JSON.parse(ex));
    if (cp) setCustomProducts(JSON.parse(cp));
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
  // (re-run once the main screen is mounted: the header doesn't exist on Home/setup)
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    setHeaderHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [showHome, isSetup, ready]);

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
    localStorage.setItem('dnk-recurring', JSON.stringify(d.recurring));
    setUserName(d.user); setPartnerName(d.partner);
    setItems(d.items); setExpenses(d.expenses); setHistory(d.history);
    setBudget(d.budget); setRecurring(d.recurring); setBuyCounts({});
    setTab('shop'); setShowHome(true);
    setHouseholdCode('');
    setIsDemo(true);
    setIsSetup(false);
  }

  function exitDemo() {
    clearLocalData();
    localStorage.setItem('pickle-rename-seen', '1');
    setItems([]); setExpenses([]); setHistory([]); setBudget(null);
    setRecurring({}); setBuyCounts({});
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
    <HomeScreen
      C={C} userName={userName} partnerName={partnerName}
      toBuy={toBuy} boughtCount={bought.length}
      monthTotal={monthTotals(allExp, now).thisMonth} budget={budget} balance={balance}
      onOpen={goTo} banner={demoBanner}
    />
  );

  const avatarFor = (name: string) => name === userName ? USER_TINT : name === partnerName ? PARTNER_TINT : 'rgba(16,35,26,0.08)';
  const partnerLabel = partnerName || '...';

  const titles: Record<Tab, { title: string; sub: string }> = {
    shop: {
      title: 'List',
      sub: toBuy.length === 0 ? 'Nothing to buy right now' : `${toBuy.length} to buy · ${bought.length} in the basket`,
    },
    find: { title: 'Find', sub: `${allProducts.length} products · tap to add, double-tap to edit` },
    split: { title: 'Split', sub: `${MONTHS_EN[now.getMonth()]} · ${userName} & ${partnerLabel}` },
  };

  const tabAction = tab === 'shop'
    ? { label: 'Add an item', icon: 'plus' as const, onClick: () => setFormOpen(true) }
    : tab === 'find'
      ? { label: 'Add a product to the catalog', icon: 'plus' as const, onClick: () => setAddCatalogOpen(true) }
      : { label: receiptLoading ? 'Reading receipt…' : 'Scan a receipt', icon: 'camera' as const, onClick: () => receiptInputRef.current?.click(), busy: receiptLoading };

  const textBtn: React.CSSProperties = { height: '32px', padding: '0 12px', borderRadius: '999px', backgroundColor: 'rgba(16,35,26,0.07)', fontSize: '12px', fontWeight: 700, color: C.text, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 };
  const stepBtn: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(16,35,26,0.12)', backgroundColor: 'rgba(255,255,255,0.75)', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
  const catDot = (color: string, size = 8) => <span style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />;

  function whoPaid(value: string, onChange: (v: string) => void) {
    return (
      <div>
        <span style={labelStyle}>Who paid?</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          {(['user', 'partner'] as const).map(who => (
            <button key={who} type="button" onClick={() => onChange(who)} aria-pressed={value === who} style={choiceStyle(value === who)}>
              {who === 'user' ? userName : partnerLabel}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function categoryPicker(value: Category, onChange: (c: Category) => void, wrap = true) {
    return (
      <div>
        <span style={labelStyle}>Category</span>
        <div className="no-scrollbar" style={wrap ? { display: 'flex', flexWrap: 'wrap', gap: '6px' } : { display: 'flex', gap: '6px', overflowX: 'auto', margin: '0 -20px', padding: '2px 20px 4px' }}>
          {CAT_ORDER.map(cat => (
            <Chip key={cat} C={C} label={CAT[cat].label} selected={value === cat} onClick={() => onChange(cat)} accent={CAT[cat].accent} />
          ))}
        </div>
      </div>
    );
  }

  function storePicker(value: string, onChange: (v: string) => void, id: string) {
    return (
      <div>
        <label htmlFor={id} style={labelStyle}>Store</label>
        <input id={id} type="text" placeholder="AB, Sklavenitis, Lidl…" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {SUPERMARKETS.map(sm => (
            <Chip key={sm} C={C} label={sm} selected={value === sm} onClick={() => onChange(sm)} />
          ))}
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '120px', position: 'relative' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <GlassBackground variant="app" />
      {demoBanner}

      {/* Title */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 22px 10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <button type="button" onClick={() => setShowHome(true)} aria-label="Back to home" style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '32px', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.4px', color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: ACCENT }} />pickle
          </button>
          <h1 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1.4px', lineHeight: 1.05, margin: '6px 0 0', color: C.text }}>{titles[tab].title}</h1>
          <p style={{ fontSize: '14px', fontWeight: 500, color: C.dim, margin: '4px 0 0' }}>{titles[tab].sub}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {notifStatus === 'default' && householdCode && (
            <button type="button" onClick={enableNotifications} aria-label="Enable notifications" title="Enable notifications" style={iconBtn}>
              <Icon name="bell" size={18} />
            </button>
          )}
          {tab === 'shop' && toBuy.length > 0 && (
            <>
              <button type="button" onClick={shareList} aria-label="Share the list" title="Share the list" style={iconBtn}>
                <Icon name="share" size={18} />
              </button>
              <button type="button" onClick={() => setShopMode(true)} aria-label="Shopping mode" title="Shopping mode" style={{ ...iconBtn, background: C.text, color: '#FFFFFF', border: 'none' }}>
                <Icon name="cart" size={19} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sticky bar: search + category chips on Find */}
      <header ref={headerRef} style={{ position: 'sticky', top: 0, zIndex: 20, ...(tab === 'find' ? { padding: '10px 16px 8px', background: 'rgba(238,241,234,0.78)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' } : {}) }}>
        {tab === 'find' && (() => {
          const activeCat: Category | 'all' = filterCat !== 'all' ? filterCat : (search.trim().length < 2 && scrolledCat) || 'all';
          return (
            <>
              <label style={{ ...glass(999), height: '50px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="search" size={18} color={C.dim} strokeWidth={2.2} />
                <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search all products</span>
                <input
                  type="text" placeholder="Search all products…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: '16px', fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Clear search" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16,35,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Icon name="close" size={14} />
                  </button>
                )}
              </label>
              <div ref={chipBarRef} className="no-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 0 2px' }}>
                <Chip C={C} label="All" selected={activeCat === 'all'} onClick={() => setFilterCat('all')} />
                {CAT_ORDER.map(c => (
                  <Chip key={c} C={C} label={CAT[c].label} selected={activeCat === c} onClick={() => setFilterCat(c)} accent={CAT[c].accent} />
                ))}
              </div>
            </>
          );
        })()}
      </header>

      <main style={{ position: 'relative', zIndex: 1, padding: '0 16px' }}>
        {renameNotice && (
          <div className="slide-up" style={{ ...glass(24), marginTop: '8px', padding: '18px' }}>
            <p style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>We&apos;re pickle now</p>
            <p style={{ fontSize: '14px', color: C.dim, margin: '0 0 10px', lineHeight: 1.5, fontWeight: 500 }}>
              To update the name and icon on your home screen, remove the app and add it again:
            </p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 10px', lineHeight: 1.5 }}>
              {renameNotice === 'ios' ? 'Safari → Share ↑ → Add to Home Screen' : 'Chrome → ⋮ menu → Add to Home screen'}
            </p>
            {householdCode && (
              <p style={{ fontSize: '13px', color: C.dim, margin: '0 0 14px', fontWeight: 500 }}>
                Your household code: <strong style={{ color: C.text, letterSpacing: '1px' }}>{householdCode}</strong>
              </p>
            )}
            <button
              type="button"
              onClick={() => { localStorage.setItem('pickle-rename-seen', '1'); setRenameNotice(null); }}
              style={{ ...btnPrimary, width: 'auto', minHeight: '42px', fontSize: '14px' }}
            >
              Got it
            </button>
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div>
            {/* Pending extras banner */}
            {pendingExtraActive && (
              <div className="slide-up" style={{ ...glass(22), marginTop: '8px', padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Bought something extra?</p>
                  <p style={{ fontSize: '13px', color: C.dim, margin: 0, fontWeight: 500 }}>Something that wasn&apos;t on the list</p>
                </div>
                <button type="button" onClick={() => setPendingExtraOpen(true)} style={{ ...btnPrimary, width: 'auto', minHeight: '40px', fontSize: '13px', padding: '0 16px' }}>
                  Add it
                </button>
              </div>
            )}

            {/* Buy again */}
            {buyAgain.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px 8px' }}>
                  <p style={sectionTitle}>Buy again</p>
                  <button type="button" onClick={() => setBuyAgainOpen(true)} style={{ fontSize: '13px', fontWeight: 700, color: ACCENT, cursor: 'pointer', fontFamily: 'inherit', minHeight: '32px' }}>See all</button>
                </div>
                <div ref={buyAgainRef} className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 6px' }}>
                  {buyAgain.map(({ name, category, emoji }) => {
                    const inList = items.some(i => !i.bought && i.name === name);
                    return (
                      <button key={name} type="button" disabled={inList} onClick={() => {
                        if (inList) return;
                        const newItem: Item = { id: genId(), name, quantity: '1', notes: '', category, emoji, bought: false, addedBy: userName, createdAt: Date.now(), updatedAt: Date.now() };
                        setItems(prev => [newItem, ...prev]);
                        syncOp('item', 'upsert', newItem);
                      }} style={{ ...pillStyle(false), ...(inList ? { background: 'rgba(30,107,67,0.12)', color: ACCENT, boxShadow: 'none', border: '1px solid rgba(30,107,67,0.30)', cursor: 'default' } : {}) }}>
                        <Icon name={inList ? 'check' : 'plus'} size={14} strokeWidth={2.6} />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(grouped).length === 0 ? (
              <div className="slide-up" style={{ ...glass(28), marginTop: '14px', padding: '12px 12px 28px', textAlign: 'center' }}>
                <img src="/image1.jpeg" alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', objectPosition: 'center', display: 'block', borderRadius: '20px' }} />
                <p style={{ fontSize: '19px', color: C.text, margin: '20px 0 6px', fontWeight: 700, letterSpacing: '-0.3px' }}>Your list is empty</p>
                <p style={{ fontSize: '14px', color: C.dim, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>Tap + to add an item, or browse Find for ideas.</p>
              </div>
            ) : (
              CAT_ORDER.filter(c => grouped[c]).map(cat => (
                <section key={cat} style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {catDot(CAT[cat].accent)}
                      <h2 style={sectionTitle}>{CAT[cat].label}</h2>
                      <span style={{ fontSize: '13px', color: C.dim, fontWeight: 500 }}>{grouped[cat]!.length}</span>
                    </div>
                    <button type="button" onClick={() => setConfirmDelete({ type: 'category', cat, count: grouped[cat]!.length })} style={textBtn}>
                      Clear
                    </button>
                  </div>
                  <div style={{ ...glass(22), padding: '0 14px' }}>
                    {grouped[cat]!.map((item, i) => (
                      <ItemCard
                        key={item.id} item={item} first={i === 0}
                        onToggle={toggleBought}
                        onDelete={id => setConfirmDelete({ type: 'item', id, name: item.name })}
                        onChangeQty={changeQty}
                        onRename={it => openRename(it.id, it.name, 'item', it.category, it.emoji)}
                        avatarColor={avatarFor(item.addedBy)} C={C}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            {bought.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button" aria-expanded={boughtExpanded}
                  onClick={() => {
                    const next = !boughtExpanded;
                    setBoughtExpanded(next);
                    if (next && bought.length > 0) {
                      const mostRecentTs = Math.max(...bought.map(i => i.updatedAt ?? i.createdAt));
                      setExpandedDates(new Set([new Date(mostRecentTs).toDateString()]));
                    }
                  }}
                  style={{ ...glass(18), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', color: C.text }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3.2} />
                    </span>
                    In the basket · {bought.length}
                  </span>
                  <Icon name="chevron-down" size={18} style={{ transform: boughtExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      {groups.map(group => {
                        const isOpen = expandedDates.has(group.key);
                        const toggleDate = () => setExpandedDates(prev => {
                          const next = new Set(prev);
                          if (next.has(group.key)) next.delete(group.key); else next.add(group.key);
                          return next;
                        });
                        const matchExp = expenses.find(ex => new Date(ex.createdAt).toDateString() === group.key);
                        return (
                          <div key={group.key} className="slide-up" style={{ ...glass(20), overflow: 'hidden' }}>
                            <button type="button" onClick={toggleDate} aria-expanded={isOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit', color: C.text, textAlign: 'left' }}>
                              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{group.label}</span>
                                {matchExp && (
                                  <span style={{ fontSize: '12px', color: C.dim, fontWeight: 500 }}>
                                    {[matchExp.note, `€${matchExp.amount.toFixed(2)}`, resolvePaidBy(matchExp.paidBy) || matchExp.paidBy].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontSize: '12px', color: C.dim, fontWeight: 600 }}>
                                {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                                <Icon name="chevron-down" size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                              </span>
                            </button>
                            {isOpen && (
                              <div style={{ padding: '0 16px' }}>
                                {group.items.map(item => (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '48px', borderTop: `1px solid ${HAIRLINE}` }}>
                                    <button type="button" onClick={() => toggleBought(item.id)} aria-label={`Put ${item.name} back on the list`} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: CAT[item.category].accent, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3.2} />
                                    </button>
                                    <span style={{ flex: 1, minWidth: 0, fontSize: '14px', color: C.dim, textDecoration: 'line-through', fontWeight: 600 }}>
                                      {item.name}
                                      {item.quantity && item.quantity !== '1' && <span style={{ textDecoration: 'none', marginLeft: '6px' }}>×{item.quantity}</span>}
                                    </span>
                                    {item.addedBy && <span style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>{item.addedBy}</span>}
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
          <div style={{ paddingTop: '10px' }}>
            {filterCat === 'all' && search.length < 2 ? (
              CAT_ORDER.map(cat => {
                const prods = PRODUCTS.filter(p => p.category === cat);
                const custom = customProducts.filter(cp => cp.category === cat);
                const allInCat = [
                  ...prods,
                  ...custom.map(cp => ({ ...cp, emoji: '', isCustom: true as const })),
                ];
                return (
                  <section key={cat} ref={el => { if (el) catSectionRefs.current.set(cat, el); else catSectionRefs.current.delete(cat); }} style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 6px 10px' }}>
                      {catDot(CAT[cat].accent)}
                      <h2 style={sectionTitle}>{CAT[cat].label}</h2>
                    </div>
                    <ProductGrid products={allInCat} items={items} justAdded={justAdded} onAdd={addFromCatalog} onRename={p => p.isCustom ? openRename(p.id, p.name, 'custom') : openRename(p.id, p.name, 'new', p.category, p.emoji)} recurring={recurring} onToggleRecurring={toggleRecurring} C={C} />
                  </section>
                );
              })
            ) : catalogProducts.length === 0 ? (
              <Empty C={C} title="No results" sub="Try a different search, or tap + to add it yourself" />
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
      </main>

      <TabBar tab={tab} onTab={setTab} action={tabAction} />

      {/* Shopping mode overlay */}
      {shopMode && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: C.bg, zIndex: 150, overflowY: 'auto', paddingBottom: '60px' }}>
          <GlassBackground variant="app" />
          <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', background: 'rgba(238,241,234,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div>
              <p style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.8px', color: C.text, margin: 0 }}>Shopping mode</p>
              <p style={{ fontSize: '14px', color: C.dim, margin: '2px 0 0', fontWeight: 500 }}>
                {toBuy.length === 0 ? 'All done!' : `${toBuy.length} item${toBuy.length === 1 ? '' : 's'} left`}
              </p>
            </div>
            <button type="button" onClick={() => setShopMode(false)} aria-label="Close shopping mode" style={iconBtn}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <div style={{ position: 'relative', zIndex: 1, padding: '8px 16px' }}>
            {toBuy.length === 0 ? (
              <Empty C={C} title="All done!" sub="Everything's been checked off." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {CAT_ORDER.flatMap(c => toBuy.filter(i => i.category === c)).map(item => (
                  <button key={item.id} type="button" onClick={() => toggleBought(item.id)} style={{ ...glass(20), display: 'flex', alignItems: 'center', gap: '16px', width: '100%', minHeight: '68px', padding: '14px 18px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: C.text }}>
                    <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid rgba(16,35,26,0.35)', flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '18px', fontWeight: 700 }}>{item.name}</span>
                      {(item.quantity && item.quantity !== '1') || item.notes ? (
                        <span style={{ display: 'block', fontSize: '13px', color: C.dim, marginTop: '2px', fontWeight: 500 }}>
                          {item.quantity && item.quantity !== '1' ? `×${item.quantity}` : ''}{item.notes ? (item.quantity && item.quantity !== '1' ? ' · ' : '') + item.notes : ''}
                        </span>
                      ) : null}
                    </span>
                    {catDot(CAT[item.category].accent, 10)}
                  </button>
                ))}
              </div>
            )}
            {bought.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <p style={{ ...sectionTitle, padding: '0 6px 8px' }}>In the basket · {bought.length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {bought.map(item => (
                    <button key={item.id} type="button" onClick={() => toggleBought(item.id)} style={{ ...glass(18), display: 'flex', alignItems: 'center', gap: '16px', width: '100%', minHeight: '56px', padding: '12px 18px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: 0.6 }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3.2} />
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: C.dim, textDecoration: 'line-through' }}>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add item drawer */}
      {formOpen && (
        <Drawer C={C} onClose={() => setFormOpen(false)} title="Add to list">
          <form onSubmit={addCustomItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text" aria-label="Item name"
                  placeholder="Feta, Spaghetti, Shampoo…"
                  value={formName}
                  onChange={e => { setSuggestionPicked(false); setFormName(e.target.value); }}
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                {formName.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button type="button" aria-label="Less" onClick={() => setFormQty(String(Math.max(1, parseInt(formQty || '1') - 1)))} style={stepBtn}><Icon name="minus" size={14} strokeWidth={2.4} /></button>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: C.text, minWidth: '22px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{formQty || '1'}</span>
                    <button type="button" aria-label="More" onClick={() => setFormQty(String(parseInt(formQty || '1') + 1))} style={stepBtn}><Icon name="plus" size={14} strokeWidth={2.4} /></button>
                  </div>
                )}
              </div>
              {/* Suggestions */}
              {!suggestionPicked && suggestions.length > 0 && (
                <div style={{ ...glass(16), marginTop: '8px', overflow: 'hidden' }}>
                  {suggestions.map((s, i) => (
                    <button key={s.id} type="button" onClick={() => pickSuggestion(s)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '48px', padding: '0 16px', borderTop: i > 0 ? `1px solid ${HAIRLINE}` : 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px', fontWeight: 600, color: C.text, textAlign: 'left' }}>
                      <span style={{ flex: 1 }}>{s.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.dim, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {catDot(CAT[s.category].accent, 7)}{CAT[s.category].label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {categoryPicker(formCat, setFormCat, false)}

            {/* Notes + submit — appear once name is filled */}
            {formName.length > 0 && (
              <>
                <textarea
                  aria-label="Note"
                  placeholder="Note (optional): organic, near the entrance…"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
                />
                <button type="submit" style={btnPrimary}>Add to list</button>
              </>
            )}
          </form>
        </Drawer>
      )}

      {/* Buy again — See all drawer */}
      {buyAgainOpen && (
        <Drawer C={C} onClose={() => setBuyAgainOpen(false)} title="Buy again">
          <div style={{ ...glass(20), padding: '0 16px' }}>
            {buyAgain.map(({ name, category, emoji }, i) => {
              const inList = items.some(it => !it.bought && it.name === name);
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '60px', borderTop: i > 0 ? `1px solid ${HAIRLINE}` : 'none' }}>
                  {catDot(CAT[category].accent, 10)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', color: C.text, margin: 0, fontWeight: 700 }}>{name}</p>
                    <p style={{ fontSize: '12px', color: C.dim, margin: '1px 0 0', fontWeight: 500 }}>{CAT[category].label}</p>
                  </div>
                  <button type="button" disabled={inList} onClick={() => {
                    if (!inList) {
                      const newItem: Item = { id: genId(), name, quantity: '1', notes: '', category, emoji, bought: false, addedBy: userName, createdAt: Date.now(), updatedAt: Date.now() };
                      setItems(prev => [newItem, ...prev]);
                      syncOp('item', 'upsert', newItem);
                    }
                    setBuyAgainOpen(false);
                  }} style={{ ...textBtn, height: '36px', padding: '0 14px', ...(inList ? { backgroundColor: 'rgba(30,107,67,0.12)', color: ACCENT, cursor: 'default' } : { backgroundColor: C.text, color: '#FFFFFF' }) }}>
                    {inList ? 'In list' : '+ Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </Drawer>
      )}

      {/* Add to catalog drawer */}
      {addCatalogOpen && (
        <Drawer C={C} onClose={() => setAddCatalogOpen(false)} title="Add to catalog">
          <form onSubmit={saveCustomProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: C.dim, marginTop: '-10px', fontWeight: 500 }}>
              Save a product so it always appears in your catalog.
            </p>
            <div>
              <label htmlFor="cp-name" style={labelStyle}>Product name</label>
              <input id="cp-name" type="text" placeholder="e.g. Κυδωνόπαστο" value={cpName} onChange={e => setCpName(e.target.value)} autoFocus style={inputStyle} required />
            </div>
            {categoryPicker(cpCat, setCpCat)}
            <button type="submit" style={btnPrimary}>Save to catalog</button>
          </form>
        </Drawer>
      )}

      {/* Shop done — send to split */}
      {shopDoneOpen && (
        <Drawer C={C} onClose={() => setShopDoneOpen(false)} title="All done!">
          <form onSubmit={addShopExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '22px', fontWeight: 600, color: C.text, marginTop: '-10px', lineHeight: 1.35, letterSpacing: '-0.4px' }}>
              {shopDoneMsg}
            </p>
            {whoPaid(shopPaidBy, setShopPaidBy)}
            <div>
              <label htmlFor="shop-amount" style={labelStyle}>Amount (€)</label>
              <input id="shop-amount" type="text" inputMode="decimal" placeholder="0.00" value={shopAmount} onChange={e => setShopAmount(e.target.value.replace(',', '.'))} autoFocus style={bigNumberInput} required />
            </div>
            {storePicker(shopSupermarket, setShopSupermarket, 'shop-store')}
            <button type="submit" style={{ ...btnPrimary, backgroundColor: ACCENT }}>
              Send to Split <Icon name="arrow-right" size={18} strokeWidth={2.4} />
            </button>
          </form>
        </Drawer>
      )}

      {/* Rename drawer */}
      {renameTarget && (
        <Drawer C={C} onClose={() => setRenameTarget(null)} title="Edit item">
          <form onSubmit={saveRename} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="rename-name" style={labelStyle}>Name</label>
              <input id="rename-name" type="text" value={renameName} onChange={e => setRenameName(e.target.value)} autoFocus required style={{ ...inputStyle, fontSize: '18px', fontWeight: 600 }} />
            </div>
            {categoryPicker(renameCat, setRenameCat)}
            <button type="submit" style={btnPrimary}>Save</button>
            <button type="button" onClick={deleteFromRename} style={btnDanger}>Delete</button>
          </form>
        </Drawer>
      )}

      {/* Pending extras drawer */}
      {pendingExtraOpen && (
        <Drawer C={C} onClose={() => setPendingExtraOpen(false)} title="Extra purchases">
          <form onSubmit={addPendingExtra} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: C.dim, marginTop: '-10px', fontWeight: 500 }}>
              Bought something that wasn&apos;t on the list? Log it here.
            </p>
            <div>
              <label htmlFor="extra-items" style={labelStyle}>What did you buy? <span style={{ color: C.muted, fontWeight: 500 }}>(optional)</span></label>
              <input id="extra-items" type="text" placeholder="e.g. chocolate, candles…" value={pendingExtraItems} onChange={e => setPendingExtraItems(e.target.value)} style={inputStyle} autoFocus />
            </div>
            <div>
              <label htmlFor="extra-amount" style={labelStyle}>Amount (€)</label>
              <input id="extra-amount" type="text" inputMode="decimal" placeholder="0.00" value={pendingExtraAmount} onChange={e => setPendingExtraAmount(e.target.value.replace(',', '.'))} required style={bigNumberInput} />
            </div>
            <button type="submit" style={btnPrimary}>Add to Split</button>
            <button type="button" onClick={dismissPendingExtra} style={btnSecondary}>Nothing extra</button>
          </form>
        </Drawer>
      )}

      {/* Spending detail drawer */}
      {spendingOpen && (
        <Drawer C={C} onClose={() => { setSpendingOpen(false); setRecapMonth(undefined); }} title="Spending">
          <SpendingDetail allExp={allExp} C={C} now={now} budget={budget} userName={userName} partnerName={partnerName} initialMonth={recapMonth} />
        </Drawer>
      )}

      {/* Budget drawer */}
      {budgetOpen && (
        <Drawer C={C} onClose={() => setBudgetOpen(false)} title="Monthly limit">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: C.dim, margin: '-10px 0 0', lineHeight: 1.6, fontWeight: 500 }}>
              How much the household wants to spend in {MONTHS_EN[now.getMonth()]}.
            </p>
            <input
              type="text" inputMode="decimal" placeholder="e.g. 300" aria-label="Monthly limit in euros"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value.replace(',', '.'))} autoFocus
              style={{ ...bigNumberInput, fontSize: '40px' }}
            />
            <button
              type="button"
              onClick={() => { const v = parseFloat(budgetInput); if (!isNaN(v) && v > 0) { setBudget(v); setBudgetOpen(false); } }}
              style={btnPrimary}
            >
              Save
            </button>
            {budget && (
              <button type="button" onClick={() => { setBudget(null); setBudgetOpen(false); }} style={btnSecondary}>
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
            {whoPaid(expensePaidBy, setExpensePaidBy)}
            <div>
              <label htmlFor="exp-amount" style={labelStyle}>Amount (€)</label>
              <input id="exp-amount" type="text" inputMode="decimal" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value.replace(',', '.'))} autoFocus style={bigNumberInput} required />
            </div>
            {categoryPicker(expenseCat, setExpenseCat, false)}
            {storePicker(expenseNote, setExpenseNote, 'exp-store')}
            <div>
              <label htmlFor="exp-date" style={labelStyle}>Date</label>
              <input id="exp-date" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} required />
            </div>
            <button type="submit" style={btnPrimary}>Save</button>
          </form>
        </Drawer>
      )}

      {editExpense && (() => {
        const expDateKey = new Date(editExpense.createdAt).toDateString();
        const drawerItems = bought.filter(it => new Date(it.updatedAt ?? it.createdAt).toDateString() === expDateKey);
        return (
        <Drawer C={C} onClose={() => setEditExpense(null)} title="Edit purchase">
          {drawerItems.length > 0 && (
            <div style={{ ...glass(18), marginBottom: '16px', padding: '12px 14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.dim, marginBottom: '8px' }}>Items bought</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {drawerItems.map(it => (
                  <span key={it.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: C.text, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '999px', padding: '4px 10px' }}>
                    {catDot(CAT[it.category].accent, 7)}{it.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={saveEditExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {whoPaid(editPaidBy, setEditPaidBy)}
            <div>
              <label htmlFor="edit-amount" style={labelStyle}>Amount (€)</label>
              <input id="edit-amount" type="text" inputMode="decimal" placeholder="0.00" value={editAmount} onChange={e => setEditAmount(e.target.value.replace(',', '.'))} autoFocus style={bigNumberInput} required />
            </div>
            {categoryPicker(editCat, setEditCat, false)}
            {storePicker(editNote, setEditNote, 'edit-store')}
            <div>
              <label htmlFor="edit-date" style={labelStyle}>Date</label>
              <input id="edit-date" type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' }} required />
            </div>
            <button type="submit" style={btnPrimary}>Save changes</button>
            <button type="button" onClick={() => deleteExpenseById(editExpense.id)} style={btnDanger}>Delete</button>
          </form>
        </Drawer>
        );
      })()}

      {/* Receipt review */}
      {receiptData && (
        <div className="fade-in" onClick={() => setReceiptData(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(16,35,26,0.32)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div role="dialog" aria-modal="true" aria-label="Review receipt" className="sheet-up" onClick={e => e.stopPropagation()} style={{ ...glassStrong('28px 28px 0 0'), width: '100%', maxWidth: '430px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderBottom: 'none' }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${HAIRLINE}`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.4px' }}>
                  <Icon name="receipt" size={20} /> {receiptData.store || 'Receipt'}
                </p>
                <p style={{ fontSize: '13px', color: C.dim, margin: '2px 0 0', fontWeight: 500 }}>
                  {receiptData.items.filter(i => i.checked).length} of {receiptData.items.length} items selected
                </p>
              </div>
              <p style={{ ...numeral, fontSize: '30px', color: C.text, margin: 0 }}>
                €{receiptData.items.filter(i => i.checked).reduce((s, i) => s + i.price, 0).toFixed(2)}
              </p>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
              {receiptData.items.map((item, idx) => {
                const d = getExpCatDisplay(item.category);
                return (
                  <button
                    key={idx} type="button" aria-pressed={item.checked}
                    onClick={() => setReceiptData(prev => prev ? { ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it) } : null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '52px', padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: item.checked ? 1 : 0.45 }}
                  >
                    {item.checked ? (
                      <span className="pop-in" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3.2} />
                      </span>
                    ) : (
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.8px solid rgba(16,35,26,0.35)', flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: C.text, fontWeight: 600, lineHeight: 1.3 }}>{item.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.dim, fontWeight: 500 }}>{catDot(d.accent, 7)}{d.label}</span>
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>€{item.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '14px 20px calc(28px + env(safe-area-inset-bottom))', borderTop: `1px solid ${HAIRLINE}`, flexShrink: 0, display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={confirmReceipt}
                disabled={receiptData.items.filter(i => i.checked).length === 0}
                style={{ ...btnPrimary, flex: 1, opacity: receiptData.items.filter(i => i.checked).length === 0 ? 0.4 : 1 }}
              >
                Add {receiptData.items.filter(i => i.checked).length} expenses
              </button>
              <button type="button" onClick={() => setReceiptData(null)} style={{ ...btnSecondary, width: 'auto' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fade-in" onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(16,35,26,0.32)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 calc(32px + env(safe-area-inset-bottom))' }}>
          <div role="alertdialog" aria-modal="true" className="sheet-up" onClick={e => e.stopPropagation()} style={{ ...glassStrong(28), padding: '22px 18px 18px', width: '100%', maxWidth: '398px', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '17px', fontWeight: 700, color: C.text, textAlign: 'center', lineHeight: 1.4, margin: '0 0 6px' }}>
              {confirmDelete.type === 'item'
                ? `Remove "${confirmDelete.name}" from the list?`
                : `Remove all ${confirmDelete.count} item${confirmDelete.count === 1 ? '' : 's'} in ${CAT[confirmDelete.cat].label}?`}
            </p>
            <button
              type="button"
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
              style={{ ...btnPrimary, backgroundColor: C.danger }}
            >
              Remove
            </button>
            <button type="button" onClick={() => setConfirmDelete(null)} style={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
