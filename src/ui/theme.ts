import { TextStyle } from 'react-native';

/**
 * Design system — sober, refined, inspired by Apple Music's dark UI.
 * Pure-black canvas, layered neutral greys, a single warm-red accent used
 * sparingly for primary actions, and a clean iOS-style type scale.
 */
export const colors = {
  bg: '#000000',
  // Layered surfaces (iOS system greys, dark).
  surface: '#141416',
  surfaceAlt: '#1c1c1e',
  surfaceHigh: '#2c2c2e',
  // Hairline separators / borders.
  border: 'rgba(255,255,255,0.08)',
  separator: 'rgba(255,255,255,0.12)',
  // Text.
  text: '#ffffff',
  textMuted: '#98989f',
  textFaint: '#636366',
  // Accent — Apple Music red.
  accent: '#fc3c44',
  accentSoft: 'rgba(252,60,68,0.16)',
  danger: '#ff453a',
  success: '#30d158',
  // On-accent foreground.
  onAccent: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

/** iOS-flavoured type scale. Spread a token into a Text style. */
export const type: Record<
  'largeTitle' | 'title' | 'title3' | 'headline' | 'body' | 'callout' | 'subhead' | 'footnote' | 'caption',
  TextStyle
> = {
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: 0.36, color: colors.text },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0.3, color: colors.text },
  title3: { fontSize: 20, fontWeight: '700', color: colors.text },
  headline: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, fontWeight: '400', color: colors.text },
  callout: { fontSize: 16, fontWeight: '600', color: colors.text },
  subhead: { fontSize: 15, fontWeight: '400', color: colors.textMuted },
  footnote: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
};
