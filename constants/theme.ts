/**
 * Linear Knowledge Reader — Warm neutral theme
 * Soft background, readable text, muted accent.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1c1917',
    background: '#fafaf9',
    tint: '#78716c',
    icon: '#78716c',
    tabIconDefault: '#a8a29e',
    tabIconSelected: '#57534e',
    primaryText: '#1c1917',
    secondaryText: '#78716c',
    accent: '#2563eb',
    card: '#f5f5f4',
    divider: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#e7e5e4',
    background: '#1c1917',
    tint: '#a8a29e',
    icon: '#a8a29e',
    tabIconDefault: '#78716c',
    tabIconSelected: '#e7e5e4',
    primaryText: '#e7e5e4',
    secondaryText: '#a8a29e',
    accent: '#60a5fa',
    card: '#292524',
    divider: 'rgba(255,255,255,0.08)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
