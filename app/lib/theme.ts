// Colour tokens passed to every screen as `C`.
export type Theme = {
  name: string; bg: string; surface: string; surface2: string;
  border: string; accent: string; accentDim: string;
  text: string; dim: string; muted: string;
  danger: string; success: string;
};

export const GLASS: Theme = {
  name: 'Glass',
  bg: '#EEF1EA',
  surface: 'rgba(255,255,255,0.55)',
  surface2: 'rgba(255,255,255,0.72)',
  border: 'rgba(16,35,26,0.10)',
  accent: '#1E6B43',
  accentDim: 'rgba(30,107,67,0.12)',
  text: '#10231A',
  dim: '#3F5248',
  muted: '#6B7A71',
  danger: '#C2361F',
  success: '#1E6B43',
};
