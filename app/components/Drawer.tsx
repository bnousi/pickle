'use client';

import type { Theme } from '../lib/theme';
import { glassStrong, iconBtn } from '../lib/ui';
import Icon from './Icon';

export default function Drawer({ onClose, title, children, C }: { onClose: () => void; title: string; children: React.ReactNode; C: Theme }) {
  return (
    <div
      className="fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(16,35,26,0.32)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title || undefined} className="sheet-up"
        style={{ ...glassStrong('28px 28px 0 0'), padding: '10px 0 0', width: '100%', maxWidth: '430px', maxHeight: '92vh', overflowY: 'auto', borderBottom: 'none' }}
      >
        <div style={{ width: '40px', height: '5px', backgroundColor: 'rgba(16,35,26,0.18)', borderRadius: '3px', margin: '0 auto 14px' }} />
        <div style={{ padding: '0 20px calc(40px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: title ? '22px' : '8px', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', color: C.text, fontWeight: 700, letterSpacing: '-0.6px', margin: 0 }}>{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" style={{ ...iconBtn, width: '38px', height: '38px' }}>
              <Icon name="close" size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
