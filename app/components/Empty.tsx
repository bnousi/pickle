'use client';

import type { Theme } from '../lib/theme';

export default function Empty({ title, sub, C }: { title: string; sub: string; C: Theme }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px 40px' }}>
      <p style={{ fontSize: '19px', color: C.text, margin: '0 0 8px', fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</p>
      <p style={{ fontSize: '14px', color: C.dim, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line', fontWeight: 500 }}>{sub}</p>
    </div>
  );
}
