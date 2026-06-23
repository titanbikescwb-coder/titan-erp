import { motion } from "motion/react";
import { DollarSign, Building2 } from "lucide-react";
import { Button } from "../ui/Button";

interface FinanceiroHeaderProps {
  onOpenAccountModal: () => void;
}

const FinanceiroHeader = ({ onOpenAccountModal }: FinanceiroHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6"
      >
        <div className="w-20 h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
          <DollarSign className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
            Financeiro
          </h1>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              Fluxo de Caixa & Gestão Ativos • Sincronizado
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
      >
        <Button
          variant="ghost"
          onClick={onOpenAccountModal}
          className="h-14 px-6 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10 text-[10px] uppercase font-black tracking-widest"
          leftIcon={<Building2 className="w-5 h-5" />}
        >
          Gerenciar Contas
        </Button>
      </motion.div>
    </div>
  );
};

export { FinanceiroHeader };