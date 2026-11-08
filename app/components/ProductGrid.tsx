'use client';

import { useRef } from 'react';
import { CAT } from '../lib/products';
import type { Category, Product } from '../lib/products';
import type { Item } from '../lib/types';
import type { Theme } from '../lib/theme';
import { glass } from '../lib/ui';
import Icon from './Icon';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
      {products.map(p => {
        const inList = items.some(i => !i.bought && i.name === p.name);
        const added = justAdded.has(p.id);
        const starred = !!recurring?.[p.name];
        const cfg = CAT[p.category];
        return (
          <div key={p.id} style={{ position: 'relative' }}>
            <button
              type="button" onClick={e => handleTap(p, e.timeStamp)} aria-pressed={inList}
              style={{
                ...glass(18), width: '100%', minHeight: '64px', padding: '12px 8px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                ...(inList || added ? { background: `${cfg.accent}33`, boxShadow: `inset 0 0 0 1.5px ${cfg.accent}` } : {}),
              }}
            >
              {added ? (
                <span className="pop-in" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1E6B43', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3.2} />
                </span>
              ) : (
                <span style={{ fontSize: '13px', color: C.text, textAlign: 'center', lineHeight: 1.3, fontWeight: inList ? 700 : 600, overflowWrap: 'anywhere' }}>
                  {p.name}
                </span>
              )}
              {!added && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.accent, opacity: inList ? 1 : 0.6 }} />}
            </button>
            {onToggleRecurring && (
              <button
                type="button" aria-label={starred ? `Unstar ${p.name}` : `Star ${p.name}`} aria-pressed={starred}
                onClick={e => { e.stopPropagation(); onToggleRecurring(p.name, p.category, p.emoji || ''); }}
                style={{ position: 'absolute', top: '2px', right: '2px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: starred ? '#D9901A' : C.muted, opacity: starred ? 1 : 0.55 }}
              >
                <Icon name={starred ? 'star-fill' : 'star'} size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
