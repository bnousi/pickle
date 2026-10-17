'use client';

import type { Theme } from '../lib/theme';

export default function Drawer({ onClose, title, children, C }: { onClose: () => void; title: string; children: React.ReactNode; C: Theme }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: C.surface, borderRadius: '24px 24px 0 0', padding: '8px 0 0', width: '100%', maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <div style={{ width: '36px', height: '4px', backgroundColor: C.border, borderRadius: '2px', margin: '0 auto 16px' }} />
        <div style={{ padding: '0 20px 52px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '20px', color: C.text, fontWeight: '700', margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ width: '32px', height: '32px', fontSize: '20px', color: C.text, border: `1px solid ${C.border}`, backgroundColor: C.surface2, borderRadius: '8px', cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
