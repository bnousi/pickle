'use client';

import { useRef } from 'react';
import { CAT } from '../lib/products';
import type { Category, Product } from '../lib/products';
import type { Item } from '../lib/types';
import type { Theme } from '../lib/theme';

export default function ProductGrid({ products, items, justAdded, onAdd, onRename, recurring, onToggleRecurring, C }: {
  products: (Product & { isCustom?: boolean; emoji?: string })[];
  items: Item[];
  justAdded: Set<string>;
  onAdd: (p: Product & { emoji?: string }) => void;
  onRename?: (p: Product & { isCustom?: boolean; emoji?: string }) => void;
  recurring?: Record<string, { category: Category; emoji: string }>;
  onToggleRecurring?: (name: string, category: Category, emoji: string) => void;
  C: Theme;
}) {
  const lastTap = useRef<{ id: string; time: number; timer: ReturnType<typeof setTimeout> } | null>(null);

  function handleTap(p: Product & { isCustom?: boolean; emoji?: string }, now: number) {
    if (onRename) {
      if (lastTap.current?.id === p.id && now - lastTap.current.time < 350) {
        clearTimeout(lastTap.current.timer);
        lastTap.current = null;
        onRename(p);
        return;
      }
      if (lastTap.current) clearTimeout(lastTap.current.timer);
      const timer = setTimeout(() => { lastTap.current = null; onAdd(p); }, 350);
      lastTap.current = { id: p.id, time: now, timer };
      return;
    }
    onAdd(p);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {products.map(p => {
        const inList = items.some(i => !i.bought && i.name === p.name);
        const added = justAdded.has(p.id);
        const starred = !!recurring?.[p.name];
        const cfg = CAT[p.category];
        return (
          <div key={p.id} style={{ position: 'relative' }}>
            <button onClick={e => handleTap(p, e.timeStamp)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', borderRadius: '12px', border: `1.5px solid ${inList ? cfg.accent : C.border}`, backgroundColor: added ? cfg.bg : inList ? cfg.bg : C.surface, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', minHeight: '52px' }}>
              <span style={{ fontSize: '13px', color: added ? cfg.text : inList ? cfg.text : C.text, textAlign: 'center', lineHeight: 1.35, fontWeight: inList ? '700' : '500' }}>
                {added ? '✓' : p.name}
              </span>
            </button>
            {onToggleRecurring && (
              <button
                onClick={e => { e.stopPropagation(); onToggleRecurring(p.name, p.category, p.emoji || ''); }}
                style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: starred ? '#F97316' : C.muted, fontSize: '11px', padding: '2px', lineHeight: 1, opacity: starred ? 1 : 0.45 }}
              >
                {starred ? '★' : '☆'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
