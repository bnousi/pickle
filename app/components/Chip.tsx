'use client';

import type { Theme } from '../lib/theme';

export default function Chip({ label, selected, onClick, accent, C }: { label: string; selected: boolean; onClick: () => void; accent?: string; C: Theme }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${selected ? (accent || C.accent) : C.border}`, backgroundColor: selected ? (accent ? `${accent}4D` : C.accentDim) : C.surface2, color: selected ? (accent || C.accent) : C.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: selected ? '700' : '500', whiteSpace: 'nowrap', transition: 'all 0.12s', flexShrink: 0 }}>
      {label}
    </button>
  );
}
