'use client';

import { useRef } from 'react';
import type { Item } from '../lib/types';
import type { Theme } from '../lib/theme';
import { ACCENT, HAIRLINE } from '../lib/ui';
import Icon from './Icon';

type Props = {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onRename: (item: Item) => void;
  avatarColor: string;
  first?: boolean;
  C: Theme;
};

const stepBtn: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(16,35,26,0.12)',
  backgroundColor: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0, color: '#10231A',
};

// One row inside a category's glass card.
export default function ItemCard({ item, onToggle, onDelete, onChangeQty, onRename, avatarColor, first, C }: Props) {
  const lastTapRef = useRef<{ time: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const qty = parseInt(item.quantity || '1', 10);

  // At quantity 1 the minus button removes the item instead
  function decrease() {
    if (qty <= 1) onDelete(item.id);
    else onChangeQty(item.id, -1);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '60px', borderTop: first ? 'none' : `1px solid ${HAIRLINE}`, opacity: item.bought ? 0.5 : 1 }}>
      <button
        type="button" onClick={() => onToggle(item.id)} aria-pressed={item.bought}
        aria-label={item.bought ? `Unmark ${item.name}` : `Mark ${item.name} as bought`}
        style={{ width: '44px', height: '44px', margin: '0 -9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {item.bought ? (
          <span className="pop-in" style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3.2} />
          </span>
        ) : (
          <span style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.8px solid rgba(16,35,26,0.35)' }} />
        )}
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
          style={{ display: 'block', fontSize: '16px', color: C.text, textDecoration: item.bought ? 'line-through' : 'none', fontWeight: 600, cursor: 'default', overflowWrap: 'anywhere' }}
        >
          {item.name}
        </span>
        {item.notes && <p style={{ fontSize: '13px', color: C.dim, margin: '1px 0 0', lineHeight: 1.4, fontWeight: 500 }}>{item.notes}</p>}
      </div>

      {!item.bought && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button
            type="button" aria-label={qty <= 1 ? `Remove ${item.name}` : 'Less'}
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); decrease(); }}
            onClick={e => { e.stopPropagation(); decrease(); }}
            style={stepBtn}
          ><Icon name="minus" size={14} strokeWidth={2.4} /></button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: C.text, minWidth: '24px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
          <button
            type="button" aria-label="More"
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onChangeQty(item.id, 1); }}
            onClick={e => { e.stopPropagation(); onChangeQty(item.id, 1); }}
            style={stepBtn}
          ><Icon name="plus" size={14} strokeWidth={2.4} /></button>
        </div>
      )}

      {item.addedBy && (
        <span title={`Added by ${item.addedBy}`} style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: C.text, flexShrink: 0 }}>
          {item.addedBy[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}
