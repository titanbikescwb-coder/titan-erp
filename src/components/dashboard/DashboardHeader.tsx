import { motion } from "motion/react";
import { TrendingUp, Clock, Wallet } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface DashboardHeaderProps {
  currentSession: any;
  navigate: (path: string) => void;
}

const DashboardHeader = ({ currentSession, navigate }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6"
      >
        <div className="w-20 h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
          <TrendingUp className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
            Dashboard
          </h1>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              Centro de Inteligência Titan • Sincronizado
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
          onClick={() => navigate("/caixa")}
          className={cn(
            "h-14 px-8 rounded-2xl shadow-xl transition-all duration-500 font-black uppercase tracking-widest text-xs",
            currentSession
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
              : "bg-titan-primary shadow-titan-primary/20"
          )}
          leftIcon={
            currentSession ? (
              <Clock className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )
          }
        >
          {currentSession ? "Caixa Aberto" : "Abrir Caixa"}
        </Button>
      </motion.div>
    </div>
  );
};

export { DashboardHeader };