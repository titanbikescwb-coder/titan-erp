export type AccentColorKey =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'cyan'
  | 'gold';

export const ACCENT_COLORS: Record<
  AccentColorKey,
  {
    label: string;
    primary: string;
    hover: string;
    shadow: string;
  }
> = {
  blue: {
    label: 'Azul',
    primary: '#0A84FF',
    hover: '#0070E0',
    shadow: 'rgba(10,132,255,0.30)',
  },
  green: {
    label: 'Verde',
    primary: '#22C55E',
    hover: '#16A34A',
    shadow: 'rgba(34,197,94,0.30)',
  },
  purple: {
    label: 'Roxo',
    primary: '#8B5CF6',
    hover: '#7C3AED',
    shadow: 'rgba(139,92,246,0.30)',
  },
  orange: {
    label: 'Laranja',
    primary: '#F97316',
    hover: '#EA580C',
    shadow: 'rgba(249,115,22,0.30)',
  },
  red: {
    label: 'Vermelho',
    primary: '#EF4444',
    hover: '#DC2626',
    shadow: 'rgba(239,68,68,0.30)',
  },
  cyan: {
    label: 'Ciano',
    primary: '#06B6D4',
    hover: '#0891B2',
    shadow: 'rgba(6,182,212,0.30)',
  },
  gold: {
    label: 'Dourado',
    primary: '#F59E0B',
    hover: '#D97706',
    shadow: 'rgba(245,158,11,0.30)',
  },
};

export const DEFAULT_ACCENT_COLOR: AccentColorKey = 'blue';