'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import type { Theme } from '../lib/theme';
import { genCode } from '../lib/format';
import { ACCENT, btnPrimary, glass, iconBtn } from '../lib/ui';
import GlassBackground from './GlassBackground';
import Icon, { type IconName } from './Icon';

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

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'One shared list', text: 'Both phones stay in sync while you shop.' },
  { icon: 'pie', title: 'Fair split', text: 'Log who paid and see who owes whom.' },
  { icon: 'camera', title: 'Scan receipts', text: 'Snap a receipt, every item gets logged.' },
  { icon: 'sparkle', title: 'Spending insights', text: 'Budget, calendar and monthly trends.' },
];

// First screen: try the demo, or create / join a household.
export default function SetupScreen({ C, inputStyle, labelStyle, name, code, onNameChange, onCodeChange, onSubmit, onDemo }: Props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <GlassBackground variant="landing" />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px 20px 48px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '7px', margin: 0, color: C.text }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: ACCENT }} />pickle
        </p>

        <h1 className="slide-up" style={{ margin: '56px 0 0', fontSize: '44px', lineHeight: 1.02, fontWeight: 700, letterSpacing: '-1.8px', color: C.text }}>
          don&apos;t forget<br />the bread.
        </h1>
        <p className="slide-up" style={{ margin: '14px 0 0', fontSize: '17px', lineHeight: 1.45, fontWeight: 500, color: C.dim, maxWidth: '320px' }}>
          A grocery list and expense splitter for two people sharing a home.
        </p>

        <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="slide-up" style={{ ...glass(22), padding: '14px', animationDelay: `${i * 60}ms` }}>
              <span style={{ width: '34px', height: '34px', borderRadius: '11px', background: 'rgba(30,107,67,0.12)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={18} />
              </span>
              <p style={{ margin: '10px 0 2px', fontSize: '14px', fontWeight: 700, color: C.text }}>{f.title}</p>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.45, fontWeight: 500, color: C.dim }}>{f.text}</p>
            </div>
          ))}
        </div>

        <button type="button" onClick={onDemo} style={{ ...btnPrimary, marginTop: '24px', minHeight: '58px', fontSize: '16px', justifyContent: 'space-between', padding: '0 8px 0 24px' }}>
          Try the demo
          <span style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={20} strokeWidth={2.4} />
          </span>
        </button>
        <p style={{ fontSize: '13px', color: C.dim, margin: '10px 0 0', textAlign: 'center', fontWeight: 500 }}>
          A sample household with real-looking data. Nothing is saved.
        </p>

        {/* Real households */}
        <div style={{ ...glass(24), marginTop: '22px', padding: formOpen ? '18px' : '0' }}>
          {!formOpen ? (
            <button type="button" onClick={() => setFormOpen(true)} aria-expanded={false} style={{ width: '100%', minHeight: '60px', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit', color: C.text }}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Start your household</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: C.dim }}>Create one, or join with a code</span>
              </span>
              <Icon name="chevron-down" size={18} />
            </button>
          ) : (
            <form onSubmit={onSubmit} className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '17px', fontWeight: 700, color: C.text, margin: 0 }}>Start your household</p>
              <div>
                <label htmlFor="setup-name" style={labelStyle}>Your name</label>
                <input
                  id="setup-name" type="text" placeholder="e.g. Barbara" value={name}
                  onChange={e => onNameChange(e.target.value)} required autoFocus
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="setup-code" style={labelStyle}>Household code</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="setup-code" type="text" placeholder="A3BX7K" value={code}
                    onChange={e => onCodeChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    maxLength={6} required
                    style={{ ...inputStyle, flex: 1, textAlign: 'center', letterSpacing: '5px', fontWeight: 700, fontSize: '20px' }}
                  />
                  <button type="button" onClick={() => onCodeChange(genCode())} aria-label="Generate a new code" title="Generate a new code" style={{ ...iconBtn, width: '50px', height: '50px' }}>
                    <Icon name="refresh" size={20} />
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: C.dim, marginTop: '8px', lineHeight: 1.6, fontWeight: 500 }}>
                  New here? Generate a code and share it with your partner. Already have one? Type it in.
                </p>
              </div>
              <button type="submit" style={btnPrimary}>Get started</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
