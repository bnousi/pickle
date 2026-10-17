'use client';

import { useRef } from 'react';
import { CAT } from '../lib/products';
import type { Item } from '../lib/types';
import type { Theme } from '../lib/theme';

export default function ItemCard({ item, onToggle, onDelete, onChangeQty, onRename, addedByColor, C }: { item: Item; onToggle: (id: string) => void; onDelete: (id: string) => void; onChangeQty: (id: string, delta: number) => void; onRename: (item: Item) => void; addedByColor: string; C: Theme }) {
  const cfg = CAT[item.category];
  const lastTapRef = useRef<{ time: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const qty = parseInt(item.quantity || '1', 10);

  // At quantity 1 the minus button removes the item instead
  function decrease() {
    if (qty <= 1) onDelete(item.id);
    else onChangeQty(item.id, -1);
  }

  return (
    <div style={{ background: `linear-gradient(${cfg.bg}, ${cfg.bg}), ${C.surface}`, borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', border: `1.5px solid ${cfg.accent}60`, borderLeft: `4px solid ${addedByColor}`, opacity: item.bought ? 0.45 : 1, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
      <button onClick={() => onToggle(item.id)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${item.bought ? cfg.accent : C.border}`, backgroundColor: item.bought ? cfg.accent : C.surface2, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
        {item.bought && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7.5L8 2.5" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          onClick={e => {
            e.stopPropagation();
            if (item.bought) return;
            const now2 = Date.now();
            if (lastTapRef.current && now2 - lastTapRef.current.time < 380) {
              clearTimeout(lastTapRef.current.timer);
              lastTapRef.current = null;
              onRename(item);
              return;
            }
            if (lastTapRef.current) clearTimeout(lastTapRef.current.timer);
            const timer = setTimeout(() => { lastTapRef.current = null; }, 380);
            lastTapRef.current = { time: now2, timer };
          }}
          style={{ fontSize: '15px', color: C.text, textDecoration: item.bought ? 'line-through' : 'none', fontWeight: '700', cursor: 'default' }}
        >
          {item.name}
        </span>
        {item.notes && <p style={{ fontSize: '12px', color: C.dim, margin: '3px 0 0', lineHeight: 1.4 }}>{item.notes}</p>}
      </div>

      {!item.bought && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); decrease(); }}
            onClick={e => { e.stopPropagation(); decrease(); }}
            style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${C.danger}60`, backgroundColor: C.surface2, color: C.danger, fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}
          >−</button>
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.dim, minWidth: '18px', textAlign: 'center' }}>{qty}</span>
          <button
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onChangeQty(item.id, 1); }}
            onClick={e => { e.stopPropagation(); onChangeQty(item.id, 1); }}
            style={{ width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${C.danger}60`, backgroundColor: C.surface2, color: C.danger, fontSize: '17px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}
          >+</button>
        </div>
      )}
    </div>
  );
}
