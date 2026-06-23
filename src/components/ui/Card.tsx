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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "bg-[#121212] border border-[#2C2C2C] rounded-[24px] p-6 relative group overflow-hidden transition-colors hover:border-[#3a3a3a]",
        className
      )}
      {...props}
    >
      {hoverGlow && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      <div className="relative z-10 flex flex-col h-full">
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
  <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] text-white/50", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex-1", className)}>
    {children}
  </div>
);
