export const Colors = {
  // Core Palette
  navy: '#1B2A4A',
  navyDark: '#0F1C36',
  navyLight: '#243556',
  navyMid: '#1E3160',

  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDark: '#A8872E',

  surface: '#F7F8FC',
  surfaceCard: '#FFFFFF',
  border: '#E4E9F2',

  textPrimary: '#0F1C36',
  textSecondary: '#5A6A8A',
  textMuted: '#9AA3B8',
  textWhite: '#FFFFFF',

  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',

  // Gradient stops
  gradientStart: '#0F1C36',
  gradientMid: '#1B2A4A',
  gradientEnd: '#243556',
};

export type ColorKey = keyof typeof Colors;
