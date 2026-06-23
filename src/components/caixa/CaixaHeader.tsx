import {
  Lock,
  Unlock,
  Plus,
  Minus,
} from "lucide-react";

import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

interface CaixaHeaderProps {
  currentSession: any;
  setShowOpenModal: (value: boolean) => void;
  setShowMovementModal: (value: 'suprimento' | 'sangria' | null) => void;
  setShowCloseModal: (value: boolean) => void;
}

const CaixaHeader = ({
  currentSession,
  setShowOpenModal,
  setShowMovementModal,
  setShowCloseModal,
}: CaixaHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-6"
      >
        <div
          className={cn(
            "w-20 h-20 rounded-[32px] flex items-center justify-center text-white shadow-2xl ring-8 ring-white/5 relative overflow-hidden group transition-all duration-500",
            currentSession
              ? "bg-emerald-600 shadow-emerald-500/30"
              : "bg-red-600 shadow-red-500/30"
          )}
        >
          {currentSession ? (
            <Unlock className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <Lock className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
          )}

          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
            Caixa
          </h1>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-3 h-3 rounded-full animate-pulse shadow-[0_0_15px]",
                currentSession
                  ? "bg-emerald-500 shadow-emerald-500"
                  : "bg-red-500 shadow-red-500"
              )}
            />

            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              {currentSession
                ? `Operador: ${currentSession.userName} • Sessão #${currentSession?.id.substring(0, 8)}`
                : "Sincronização Titan • Efetue a abertura para operar"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
      >
        {!currentSession ? (
          <Button
            onClick={() => setShowOpenModal(true)}
            className="h-14 px-8 rounded-2xl shadow-xl bg-titan-primary"
            leftIcon={<Plus className="w-6 h-6" />}
          >
            Abrir Sessão
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="h-14 px-6 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              onClick={() => setShowMovementModal('suprimento')}
              leftIcon={<Plus className="w-5 h-5 text-emerald-500" />}
            >
              Suprimento
            </Button>

            <Button
              variant="ghost"
              className="h-14 px-6 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
              onClick={() => setShowMovementModal('sangria')}
              leftIcon={<Minus className="w-5 h-5 text-red-500" />}
            >
              Sangria
            </Button>

            <Button
              variant="primary"
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
              onClick={() => setShowCloseModal(true)}
              leftIcon={<Lock className="w-5 h-5" />}
            >
              Encerrar
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export { CaixaHeader };