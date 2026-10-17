export const THEMES = {
  dark: {
    name: 'Dark',
    bg: '#0A0A0A', surface: '#141414', surface2: '#1E1E1E',
    border: '#272727', accent: '#C8FF3C', accentDim: 'rgba(200,255,60,0.10)',
    text: '#F0F0F0', dim: '#7A7A7A', muted: '#3A3A3A',
    danger: '#FF5050', success: '#4ADE80',
  },
  neon: {
    name: 'Neon',
    bg: '#09090F', surface: '#13131E', surface2: '#1C1C2E',
    border: '#2A2A44', accent: '#FF2D78', accentDim: 'rgba(255,45,120,0.12)',
    text: '#F0F0FF', dim: '#7070A0', muted: '#2A2A3A',
    danger: '#FF5050', success: '#00F5A0',
  },
  pastel: {
    name: 'Pastel',
    bg: '#FFFDF7', surface: '#FFF0E6', surface2: '#FFE0CC',
    border: '#EDD5C0', accent: '#FF6B9D', accentDim: 'rgba(255,107,157,0.12)',
    text: '#2A1A1A', dim: '#9A7878', muted: '#D8C0B8',
    danger: '#FF5252', success: '#52C97A',
  },
  bold: {
    name: 'Market',
    bg: '#F8F7F2', surface: '#FFFFFF', surface2: '#F0EEE8',
    border: '#E0DDD6', accent: '#1B5FAD', accentDim: 'rgba(27,95,173,0.10)',
    text: '#1A1A18', dim: '#6B6863', muted: '#C4C0B8',
    danger: '#D93025', success: '#2D9B4E',
  },
} as const;

export const SECTION_COLORS = {
  shop:  { bg: '#1B5FAD', text: '#FFFFFF', dim: 'rgba(27,95,173,0.12)' },
  find:  { bg: '#E07820', text: '#FFFFFF', dim: 'rgba(224,120,32,0.12)' },
  split: { bg: '#2D7D46', text: '#FFFFFF', dim: 'rgba(45,125,70,0.12)' },
};

export type ThemeName = keyof typeof THEMES;
export type Theme = {
  name: string; bg: string; surface: string; surface2: string;
  border: string; accent: string; accentDim: string;
  text: string; dim: string; muted: string;
  danger: string; success: string;
};
