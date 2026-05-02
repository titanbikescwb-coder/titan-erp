import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<React.AllHTMLAttributes<HTMLElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: any;
}

export const Button = React.forwardRef<any, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, as: Component = 'button', ...props }, ref) => {
    const variants = {
      primary: "bg-[#0A84FF] text-white hover:bg-[#0070E0] font-semibold shadow-lg shadow-[#0A84FF]/20 active:shadow-none hover:scale-[1.02]",
      secondary: "bg-[#2C2C2C] text-white hover:bg-[#3C3C3C] font-semibold hover:scale-[1.02]",
      success: "bg-[#30D158] text-white hover:bg-[#28B44A] font-semibold hover:scale-[1.02]",
      danger: "bg-[#FF453A] text-white hover:bg-[#E03E34] font-semibold hover:scale-[1.02]",
      outline: "bg-transparent border border-[#2C2C2C] text-white hover:border-white/20 hover:bg-white/5 font-semibold hover:scale-[1.02]",
      ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5 font-semibold",
    };

    const sizes = {
      sm: "h-10 px-5 text-[11px] rounded-xl",
      md: "h-12 px-7 text-[13px] rounded-2xl",
      lg: "h-16 px-10 text-[15px] rounded-3xl",
    };

    return (
      <Component
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex items-center">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
      </Component>
    );
  }
);

Button.displayName = 'Button';
