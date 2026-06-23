export type StatusIntent =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'finance'
  | 'analytics'
  | 'muted'

export const status = {
  default: {
    text: '#FFFFFF',
    background: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    icon: '#FFFFFF'
  },
  primary: {
    text: '#FFFFFF',
    background: 'rgba(59,130,246,0.14)',
    border: 'rgba(59,130,246,0.24)',
    icon: '#3B82F6'
  },
  success: {
    text: '#FFFFFF',
    background: 'rgba(34,197,94,0.14)',
    border: 'rgba(34,197,94,0.24)',
    icon: '#22C55E'
  },
  warning: {
    text: '#FFFFFF',
    background: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.24)',
    icon: '#F59E0B'
  },
  danger: {
    text: '#FFFFFF',
    background: 'rgba(239,68,68,0.14)',
    border: 'rgba(239,68,68,0.24)',
    icon: '#EF4444'
  },
  info: {
    text: '#FFFFFF',
    background: 'rgba(14,165,233,0.14)',
    border: 'rgba(14,165,233,0.24)',
    icon: '#0EA5E9'
  },
  finance: {
    text: '#FFFFFF',
    background: 'rgba(59,130,246,0.14)',
    border: 'rgba(59,130,246,0.24)',
    icon: '#3B82F6'
  },
  analytics: {
    text: '#FFFFFF',
    background: 'rgba(168,85,247,0.14)',
    border: 'rgba(168,85,247,0.24)',
    icon: '#A855F7'
  },
  muted: {
    text: '#A1A1AA',
    background: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
    icon: '#A1A1AA'
  }
} as const

export const businessStatus = {
  ativo: status.success,
  inativo: status.muted,
  pendente: status.warning,
  concluido: status.success,
  cancelado: status.danger,
  pago: status.success,
  aberto: status.primary,
  atrasado: status.danger,
  baixo: status.warning,
  critico: status.danger
} as const
