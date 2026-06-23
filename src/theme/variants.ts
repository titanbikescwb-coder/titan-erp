import { status, type StatusIntent } from './status'

export type SizeVariant = 'sm' | 'md' | 'lg'
export type SurfaceVariant = 'default' | 'elevated' | 'subtle' | 'flat'

export const sizes = {
  sm: {
    height: '36px',
    padding: '8px 12px',
    fontSize: '12px',
    borderRadius: '10px'
  },
  md: {
    height: '42px',
    padding: '10px 16px',
    fontSize: '14px',
    borderRadius: '12px'
  },
  lg: {
    height: '48px',
    padding: '12px 20px',
    fontSize: '15px',
    borderRadius: '14px'
  }
} as const

export const surfaces = {
  default: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
  },
  elevated: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 14px 40px rgba(0,0,0,0.35)'
  },
  subtle: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'none'
  },
  flat: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'none'
  }
} as const

export const badgeVariants: Record<StatusIntent, string> = {
  default: `background:${status.default.background};color:${status.default.text};border-color:${status.default.border};`,
  primary: `background:${status.primary.background};color:${status.primary.text};border-color:${status.primary.border};`,
  success: `background:${status.success.background};color:${status.success.text};border-color:${status.success.border};`,
  warning: `background:${status.warning.background};color:${status.warning.text};border-color:${status.warning.border};`,
  danger: `background:${status.danger.background};color:${status.danger.text};border-color:${status.danger.border};`,
  info: `background:${status.info.background};color:${status.info.text};border-color:${status.info.border};`,
  finance: `background:${status.finance.background};color:${status.finance.text};border-color:${status.finance.border};`,
  analytics: `background:${status.analytics.background};color:${status.analytics.text};border-color:${status.analytics.border};`,
  muted: `background:${status.muted.background};color:${status.muted.text};border-color:${status.muted.border};`
}
