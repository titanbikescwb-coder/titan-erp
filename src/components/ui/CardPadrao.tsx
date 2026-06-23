import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

type CardVariant = "default" | "success" | "warning" | "finance" | "analytics";

interface CardPadraoProps extends HTMLMotionProps<"div"> {
  title?: string;
  value?: string | number;
  subValue?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  indicator?: number;
  indicatorColor?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  active?: boolean;
  loading?: boolean;
  variant?: CardVariant;
}

const variantMap: Record<CardVariant, {
  border: string;
  glow: string;
  iconBg: string;
  iconText: string;
  accent: string;
}> = {
  default: {
    border: "border-white/10",
    glow: "hover:shadow-white/5",
    iconBg: "bg-white/5",
    iconText: "text-white/60",
    accent: "bg-white/30",
  },
  success: {
    border: "border-emerald-500/20",
    glow: "hover:shadow-emerald-500/10",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    accent: "bg-emerald-400",
  },
  warning: {
    border: "border-amber-500/20",
    glow: "hover:shadow-amber-500/10",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    accent: "bg-amber-400",
  },
  finance: {
    border: "border-blue-500/20",
    glow: "hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
    accent: "bg-blue-400",
  },
  analytics: {
    border: "border-purple-500/20",
    glow: "hover:shadow-purple-500/10",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    accent: "bg-purple-400",
  },
};

const formatValue = (
  value: string | number | undefined,
  isCurrency?: boolean,
  isPercentage?: boolean
) => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string") return value;

  if (isCurrency) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  if (isPercentage) {
    return `${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const CardPadrao = ({
  title,
  value,
  subValue,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  indicator,
  indicatorColor,
  isCurrency,
  isPercentage,
  className,
  onClick,
  children,
  active = false,
  loading = false,
  variant = "default",
  ...props
}: CardPadraoProps) => {
  const styles = variantMap[variant];
  const finalSubValue = subValue ?? subtitle;

  return (
    <motion.div
      whileHover={onClick ? { y: -3 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-[#121212]/90 p-6",
        "min-h-[140px] w-full",
        "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        "transition-all duration-300",
        "backdrop-blur-xl",
        onClick && "cursor-pointer",
        active
          ? "border-[#0A84FF] ring-2 ring-[#0A84FF]/20 shadow-[#0A84FF]/10"
          : styles.border,
        styles.glow,
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-70" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
        {loading ? (
          <div className="flex h-full min-h-[92px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A84FF] border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {title && (
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    {title}
                  </p>
                )}

                {value !== undefined && (
                  <h3 className="mt-4 text-3xl font-black tracking-tight text-white">
                    {formatValue(value, isCurrency, isPercentage)}
                  </h3>
                )}

                {finalSubValue && (
                  <p className="mt-2 line-clamp-2 text-xs font-bold text-white/35">
                    {finalSubValue}
                  </p>
                )}
              </div>

              {Icon && (
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10",
                    iconBgColor || styles.iconBg
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      iconColor || styles.iconText
                    )}
                    strokeWidth={2.4}
                  />
                </div>
              )}
            </div>

            {indicator !== undefined && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    indicatorColor || styles.accent
                  )}
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                  {indicator}
                </span>
              </div>
            )}

            {children}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CardPadrao;