'use client';

import type { CSSProperties, FormEvent } from 'react';
import type { Theme } from '../lib/theme';
import { genCode } from '../lib/format';

type Props = {
  C: Theme;
  inputStyle: CSSProperties;
  labelStyle: CSSProperties;
  name: string;
  code: string;
  onNameChange: (name: string) => void;
  onCodeChange: (code: string) => void;
  onSubmit: (e: FormEvent) => void;
  onDemo: () => void;
};

// First screen: join or create a household, or open the demo.
export default function SetupScreen({ C, inputStyle, labelStyle, name, code, onNameChange, onCodeChange, onSubmit, onDemo }: Props) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Logo */}
      <div style={{ padding: '56px 28px 24px' }}>
        <span style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '22px', fontWeight: '900', color: C.accent, letterSpacing: '-1px', lineHeight: 1 }}>pickle</span>
      </div>

      {/* Form — sits below, blends with the fade */}
      <div style={{ flex: 1, padding: '8px 28px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <p style={{ fontFamily: "var(--font-mono), 'Courier New', monospace", fontSize: '34px', color: C.text, marginBottom: '8px', fontWeight: '700', lineHeight: 1.2 }}>
          don&apos;t forget the bread.
        </p>
        <p style={{ fontSize: '13px', color: C.dim, marginBottom: '32px', letterSpacing: '0.3px' }}>a grocery app for two.</p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Your name</label>
            <input
              type="text" placeholder="e.g. Barbara" value={name}
              onChange={e => onNameChange(e.target.value)} required autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Household code</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. A3BX7K"
                value={code}
                onChange={e => onCodeChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                maxLength={6}
                required
                style={{ ...inputStyle, flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: '700', fontSize: '20px' }}
              />
              <button
                type="button"
                onClick={() => onCodeChange(genCode())}
                style={{ padding: '0 16px', backgroundColor: C.accentDim, border: `1.5px solid ${C.accent}40`, borderRadius: '10px', color: C.accent, cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
                title="Generate new code"
              >↻</button>
            </div>
            <p style={{ fontSize: '12px', color: C.dim, marginTop: '8px', lineHeight: 1.6 }}>
              New? Tap ↻ to generate a code, then share it with your partner.<br />
              Already have one? Type it above.
            </p>
          </div>
          <button type="submit" style={{ marginTop: '10px', width: '100%', padding: '16px', backgroundColor: C.accent, color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.5px' }}>
            Get started
          </button>
          <button type="button" onClick={onDemo} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.5px' }}>
            Try the demo
          </button>
          <p style={{ fontSize: '12px', color: C.dim, margin: '-4px 0 0', textAlign: 'center', lineHeight: 1.6 }}>
            Explore a sample household. Nothing is saved to the server.
          </p>
        </form>
      </div>
    </div>
  );
}
