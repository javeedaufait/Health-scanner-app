export const colors = {
  primary: '#059669', // Emerald 600
  primaryDark: '#064e3b', // Emerald 900
  primaryLight: '#34d399', // Emerald 400
  accent: '#10b981', // Emerald 500
  secondary: '#0284c7', // Sky 600

  // Decision Status Colors
  good: '#10b981', // Green
  goodBg: '#ecfdf5',
  goodBorder: '#a7f3d0',
  goodText: '#065f46',

  caution: '#f59e0b', // Amber
  cautionBg: '#fffbeb',
  cautionBorder: '#fde68a',
  cautionText: '#92400e',

  notGood: '#ef4444', // Red / Rose
  notGoodBg: '#fef2f2',
  notGoodBorder: '#fecaca',
  notGoodText: '#991b1b',

  // Backgrounds & Surfaces
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceMuted: '#f1f5f9',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',

  // Typography
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textLight: '#ffffff',

  // Borders & Dividers
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderFocus: '#059669',

  // System
  error: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  info: '#2563eb',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  tag: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
};
