import {
  Package,
  Plus,
} from "lucide-react";

import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

interface EstoqueHeaderProps {
  activeView: string;
  setActiveView: (value: any) => void;
  setProductModalTab: (value: any) => void;
  setShowProductModal: (value: any) => void;
  canCreate: boolean;
}

const EstoqueHeader = ({
  activeView,
  setActiveView,
  setProductModalTab,
  setShowProductModal,
  canCreate,
}: EstoqueHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 sm:gap-6"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
          <Package className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-500" />

          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
            Estoque
          </h1>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />

            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
              Gestão de Ativos & Serviços • Sincronizado
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="flex flex-wrap gap-1 p-1">
          {[
            { id: 'list', label: 'Produtos', icon: Package },
          ].map((v) => (
            <Button
              key={v.id}
              variant={activeView === v.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(v.id)}
              className={cn(
                "h-12 px-6 rounded-2xl transition-all duration-300 text-[10px] uppercase font-black tracking-widest",
                activeView === v.id
                  ? "shadow-lg shadow-titan-primary/20"
                  : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
              )}
              leftIcon={<v.icon className="w-4 h-4" />}
            >
              {v.label}
            </Button>
          ))}
        </div>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <Button
          disabled={!canCreate}
          onClick={() => {
            setProductModalTab('geral');

            setShowProductModal({
              name: '',
              sku: '',
              price: 0,
              costPrice: 0,
              stock: 0,
              minStock: 0,
              category: 'Peças',
              imageUrl: '',
              itemType: 'product'
            });
          }}
          className="h-14 px-6 sm:px-8 rounded-2xl bg-titan-primary shadow-xl shadow-titan-primary/20 font-black uppercase tracking-widest text-[10px] w-full sm:w-auto"
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Adicionar Item
        </Button>
      </motion.div>
    </div>
  );
};

export { EstoqueHeader };