import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: any;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, as: Component = 'button', ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-[#0A84FF] to-[#0070E0] text-white shadow-[0_4px_20px_rgba(10,132,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(10,132,255,0.5)] active:scale-[0.97]",
      secondary: "bg-[#121212] border border-[#2C2C2C] text-white hover:border-[#0A84FF] hover:-translate-y-0.5 active:scale-[0.97]",
      success: "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.97]",
      danger: "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.97]",
      outline: "bg-transparent border border-[#2C2C2C] text-white hover:border-[#0A84FF] hover:bg-[#0A84FF]/5 active:scale-[0.97]",
      ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5 active:scale-[0.97]",
    };

    const sizes = {
      sm: "px-4 py-2 text-[11px] rounded-[12px]",
      md: "px-6 py-3 text-[13px] rounded-[14px]",
      lg: "px-10 py-5 text-[16px] rounded-[16px]",
    };

    return (
      <Component
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          leftIcon && <span className="flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
      </Component>
    );
  }
);

Button.displayName = 'Button';
