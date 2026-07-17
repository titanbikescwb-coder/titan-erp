import {
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  type AccentColorKey,
} from './accentColors';

export const applyAccentColor = (colorKey?: string) => {
  const safeKey = colorKey && colorKey in ACCENT_COLORS
    ? (colorKey as AccentColorKey)
    : DEFAULT_ACCENT_COLOR;

  const color = ACCENT_COLORS[safeKey];

  document.documentElement.style.setProperty('--color-titan-primary', color.primary);
  document.documentElement.style.setProperty('--color-titan-primary-hover', color.hover);
  document.documentElement.style.setProperty('--titan-primary-shadow', color.shadow);

  return safeKey;
};