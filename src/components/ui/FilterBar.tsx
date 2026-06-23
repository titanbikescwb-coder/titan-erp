import React from 'react'
import { cn } from '../../lib/utils'

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  actions?: React.ReactNode
}

const FilterBar: React.FC<FilterBarProps> = ({ children, actions, className, ...props }) => {
  return (
    <section
      className={cn('rounded-[20px] border border-white/10 bg-white/[0.03] p-3 sm:p-4', className)}
      {...props}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {children}
      </div>

      {actions && (
        <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          {actions}
        </div>
      )}
    </section>
  )
}

export default FilterBar
export { FilterBar }
