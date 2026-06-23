import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalPadraoProps {
  open: boolean;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  className?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[1500px] w-[96vw] h-[90vh]",
};

const ModalPadrao: React.FC<ModalPadraoProps> = ({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
  size = "xl",
  showCloseButton = true,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-4">
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full overflow-hidden rounded-[36px]",
              "border border-white/10 bg-[#0A0A0B]",
              "shadow-[0_40px_120px_rgba(0,0,0,0.75)]",
              "flex max-h-[95vh] flex-col",
              sizeClasses[size],
              className
            )}
          >
            {(title || description || showCloseButton) && (
              <div className="shrink-0 border-b border-white/5 bg-gradient-to-r from-white/[0.04] to-transparent px-6 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {title && (
                      <h2 className="truncate text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                        {title}
                      </h2>
                    )}

                    {description && (
                      <p className="mt-2 max-w-3xl text-sm font-semibold text-white/35">
                        {description}
                      </p>
                    )}
                  </div>

                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
                      aria-label="Fechar modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-white/5 bg-black/40 px-6 py-5 backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {footer}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalPadrao;
export { ModalPadrao };