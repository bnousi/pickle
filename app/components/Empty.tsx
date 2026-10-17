'use client';

import type { Theme } from '../lib/theme';

export default function Empty({ title, sub, C }: { title: string; sub: string; C: Theme }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 24px 40px' }}>
      <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '18px', color: C.text, margin: '0 0 10px', fontWeight: '700' }}>{title}</p>
      <p style={{ fontSize: '14px', color: C.dim, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{sub}</p>
    </div>
  );
}
