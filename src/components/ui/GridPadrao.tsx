import React from 'react'
import { cn } from '../../lib/utils'

type GridPadraoVariant = 'cards' | 'two' | 'three' | 'auto'

interface GridPadraoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: GridPadraoVariant
}

const variants: Record<GridPadraoVariant, string> = {
  cards: 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4',
  two: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
  three: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4',
  auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
}

const GridPadrao: React.FC<GridPadraoProps> = ({ children, variant = 'cards', className, ...props }) => {
  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

export default GridPadrao
export { GridPadrao }
