import React from 'react'
import { status, type StatusIntent } from '../../theme/status'
import { cn } from '../../lib/utils'

type BadgePadraoSize = 'sm' | 'md'

interface BadgePadraoProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: StatusIntent
  size?: BadgePadraoSize
  dot?: boolean
}

const sizeClasses: Record<BadgePadraoSize, string> = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-[11px]'
}

const BadgePadrao: React.FC<BadgePadraoProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  style,
  ...props
}) => {
  const current = status[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-bold uppercase tracking-[0.12em] whitespace-nowrap',
        sizeClasses[size],
        className
      )}
      style={{
        background: current.background,
        borderColor: current.border,
        color: current.text,
        ...style
      }}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: current.icon }}
        />
      )}
      {children}
    </span>
  )
}

export default BadgePadrao
export { BadgePadrao }
