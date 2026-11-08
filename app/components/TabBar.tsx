'use client';

import type { Tab } from '../lib/types';
import { ACCENT, INK, glass } from '../lib/ui';
import Icon, { type IconName } from './Icon';

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'shop', label: 'List', icon: 'list' },
  { key: 'find', label: 'Find', icon: 'search' },
  { key: 'split', label: 'Split', icon: 'pie' },
];

type Action = { label: string; icon: IconName; onClick: () => void; busy?: boolean };

// Floating glass tab bar with a round action button that changes per tab.
export default function TabBar({ tab, onTab, action }: { tab: Tab; onTab: (t: Tab) => void; action?: Action }) {
  return (
    <nav aria-label="Sections" style={{ position: 'fixed', bottom: 'calc(18px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', padding: '0 16px', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 100 }}>
      <div style={{ ...glass(999), flex: 1, height: '64px', padding: '6px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key} type="button" onClick={() => onTab(t.key)} aria-current={active ? 'page' : undefined}
              style={{ borderRadius: '999px', background: active ? 'rgba(30,107,67,0.14)' : 'transparent', color: active ? ACCENT : INK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: active ? 700 : 600, transition: 'background 0.2s, color 0.2s' }}
            >
              <Icon name={t.icon} size={20} />
              {t.label}
            </button>
          );
        })}
      </div>
      {action && (
        <button
          type="button" onClick={action.onClick} aria-label={action.label} title={action.label} disabled={action.busy}
          style={{ ...glass('50%'), width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: action.busy ? 'progress' : 'pointer', color: INK, opacity: action.busy ? 0.6 : 1 }}
        >
          <Icon name={action.icon} size={24} strokeWidth={2.2} />
        </button>
      )}
    </nav>
  );
}
