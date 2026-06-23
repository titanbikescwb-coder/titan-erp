import React, { useState, useEffect } from 'react';
import { saasFinanceiroService } from '../services/saasFinanceiroService';
import { SaaS_Venda, SaaS_Caixa, UserProfile } from '../domain/types';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  User as UserIcon,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface FinanceiroSaaSProps {
  targetUser?: UserProfile | null;
  onBack?: () => void;
}

export default function FinanceiroSaaS({ targetUser, onBack }: FinanceiroSaaSProps) {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<SaaS_Venda[]>([]);
  const [caixa, setCaixa] = useState<SaaS_Caixa[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = targetUser?.uid || user?.uid;
  const isViewingOther = !!targetUser;

  useEffect(() => {
    if (!effectiveUserId) return;

    setLoading(true);
    const unsubVendas = saasFinanceiroService.getVendas(effectiveUserId, (data) => {
      setVendas(data);
    });

    const unsubCaixa = saasFinanceiroService.getCaixa(effectiveUserId, (data) => {
      setCaixa(data);
      setLoading(false);
    });

    return () => {
      unsubVendas();
      unsubCaixa();
    };
  }, [effectiveUserId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalVendido = vendas
    .filter(v => v.status === 'finalizado')
    .reduce((sum, v) => sum + v.total, 0);

  const saldoCaixa = caixa.reduce((sum, entry) => {
    return entry.type === 'entrada' ? sum + entry.value : sum - entry.value;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 h-auto rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isViewingOther ? `Financeiro: ${targetUser.name}` : 'Meu Financeiro'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isViewingOther ? `Visualizando dados de ${targetUser.email}` : 'Acompanhe suas vendas e movimentações de caixa'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Hoje</span>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="p-2 h-10 w-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
          >
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Vendido</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalVendido)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <ArrowUpRight className="w-3 h-3" />
            <span>{vendas.length} vendas realizadas</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo em Caixa</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(saldoCaixa)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>Movimentações ativas</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Geral</span>
          </div>
          <p className="text-3xl font-black">Sistema Global</p>
          <p className="mt-2 text-xs font-bold text-white/80">Dados unificados</p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Vendas Recentes
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimas 10</span>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {vendas.slice(0, 10).map((venda) => (
                <div key={venda.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Venda #{venda.id?.slice(-4)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {venda.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(venda.total)}</p>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                      venda.status === 'finalizado' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {venda.status}
                    </span>
                  </div>
                </div>
              ))}
              {vendas.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-sm">Nenhuma venda encontrada.</div>
              )}
            </div>
          </div>
        </div>

        {/* Caixa Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Movimentações de Caixa
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Histórico</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {caixa.slice(0, 10).map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-xl",
                      entry.type === 'entrada' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {entry.type === 'entrada' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{entry.origin}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.date?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black",
                      entry.type === 'entrada' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {entry.type === 'entrada' ? '+' : '-'} {formatCurrency(entry.value)}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.type}</span>
                  </div>
                </div>
              ))}
              {caixa.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic text-sm">Nenhuma movimentação encontrada.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
