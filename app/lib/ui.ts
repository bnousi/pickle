import type { CSSProperties } from 'react';

// Shared building blocks for the frosted-glass look.

export const INK = '#10231A';
export const DIM = '#3F5248';
export const ACCENT = '#1E6B43';
export const DANGER = '#C2361F';
export const HAIRLINE = 'rgba(16,35,26,0.08)';
export const USER_TINT = '#CFE6FF';
export const PARTNER_TINT = '#FFE3A3';

const BLUR = 'blur(28px) saturate(170%)';

export function glass(radius: number | string = 24): CSSProperties {
  return {
    background: 'rgba(255,255,255,0.52)',
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 10px 36px rgba(16,35,26,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: radius,
  };
}

// Denser glass for sheets and overlays that sit above other glass.
export function glassStrong(radius: number | string = 28): CSSProperties {
  return {
    background: 'rgba(246,248,243,0.86)',
    backdropFilter: 'blur(36px) saturate(180%)',
    WebkitBackdropFilter: 'blur(36px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 -8px 40px rgba(16,35,26,0.14)',
    borderRadius: radius,
  };
}

const btnBase: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  minHeight: '50px', padding: '0 20px', borderRadius: '999px',
  fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  border: 'none', transition: 'transform 0.12s ease, opacity 0.15s',
};

export const btnPrimary: CSSProperties = { ...btnBase, width: '100%', background: INK, color: '#FFFFFF' };
export const btnSecondary: CSSProperties = { ...btnBase, width: '100%', ...glass(999), color: INK };
export const btnDanger: CSSProperties = { ...btnBase, width: '100%', background: 'rgba(194,54,31,0.10)', color: DANGER, border: '1px solid rgba(194,54,31,0.30)' };

export const iconBtn: CSSProperties = {
  ...glass('50%'), width: '44px', height: '44px', padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: INK,
};

export const inputStyle: CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: '14px',
  border: '1px solid rgba(16,35,26,0.12)', background: 'rgba(255,255,255,0.75)',
  fontSize: '16px', fontWeight: 500, color: INK, fontFamily: 'inherit',
};

export const bigNumberInput: CSSProperties = {
  ...inputStyle, fontSize: '34px', fontWeight: 300, textAlign: 'center',
  letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums',
};

export const labelStyle: CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600, color: DIM, marginBottom: '8px',
};

export const sectionTitle: CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: INK, margin: 0,
};

// Large light numerals for money and counts.
export const numeral: CSSProperties = {
  fontWeight: 300, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05,
};

export function avatarTint(name: string, userName: string): string {
  return name === userName ? USER_TINT : PARTNER_TINT;
}

export function choiceStyle(selected: boolean): CSSProperties {
  return {
    minHeight: '48px', padding: '0 14px', borderRadius: '14px', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '15px', fontWeight: 700,
    border: selected ? `1.5px solid ${ACCENT}` : '1px solid rgba(16,35,26,0.12)',
    background: selected ? 'rgba(30,107,67,0.12)' : 'rgba(255,255,255,0.6)',
    color: selected ? ACCENT : INK,
    transition: 'all 0.15s',
  };
}

export function pillStyle(selected: boolean, color?: string): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0,
    height: '36px', padding: '0 14px', borderRadius: '999px', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap',
    border: selected ? '1px solid transparent' : '1px solid rgba(255,255,255,0.75)',
    background: selected ? (color ? `${color}2E` : INK) : 'rgba(255,255,255,0.55)',
    color: selected && !color ? '#FFFFFF' : INK,
    boxShadow: selected && color ? `inset 0 0 0 1.5px ${color}` : '0 4px 14px rgba(16,35,26,0.06)',
    transition: 'all 0.15s',
  };
}
