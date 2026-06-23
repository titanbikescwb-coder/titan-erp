import {
  ShoppingCart,
  Receipt as ReceiptIcon,
} from "lucide-react";

import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

interface VendasHeaderProps {
  view: 'pos' | 'history';
  setView: (value: 'pos' | 'history') => void;
}

const VendasHeader = ({
  view,
  setView,
}: VendasHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6"
      >
        <div className="w-20 h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
          <ShoppingCart className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />

          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
            Vendas
          </h1>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />

            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              Terminal de Vendas PDV • Sincronizado
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex gap-2 p-1">
          <Button
            variant={view === 'pos' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('pos')}
            className={cn(
              "h-12 px-6 rounded-2xl transition-all duration-300 text-[10px] uppercase font-black tracking-widest",
              view === 'pos'
                ? "shadow-lg shadow-titan-primary/20"
                : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
            )}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
          >
            PDV / Checkout
          </Button>

          <Button
            variant={view === 'history' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('history')}
            className={cn(
              "h-12 px-6 rounded-2xl transition-all duration-300 text-[10px] uppercase font-black tracking-widest",
              view === 'history'
                ? "shadow-lg shadow-titan-primary/20"
                : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
            )}
            leftIcon={<ReceiptIcon className="w-4 h-4" />}
          >
            Histórico
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export { VendasHeader };