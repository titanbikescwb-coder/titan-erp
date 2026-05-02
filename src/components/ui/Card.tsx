import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

export const Card = ({ children, className, hoverGlow = true, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "card-premium p-6 overflow-hidden relative group",
        hoverGlow && "hover:shadow-[0_0_40px_rgba(10,132,255,0.05)]",
        className
      )}
      {...props}
    >
      {hoverGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-titan-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("mb-6 flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h3 className={cn("text-[13px] font-black uppercase tracking-[0.2em] text-white/40", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex-1", className)}>
    {children}
  </div>
);
