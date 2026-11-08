'use client';

import type { Theme } from '../lib/theme';
import { pillStyle } from '../lib/ui';

// `C` stays in the signature so every caller keeps working.
export default function Chip({ label, selected, onClick, accent }: { label: string; selected: boolean; onClick: () => void; accent?: string; C?: Theme }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={pillStyle(selected, accent)}>
      {accent && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />}
      {label}
    </button>
  );
}
