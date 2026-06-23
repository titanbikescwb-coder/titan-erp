import { DashboardFinance } from "./dashboard/DashboardFinance";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardStats } from "./dashboard/DashboardStats";
import { StatCard } from "./ui/StatCard";
import { PageContainer } from "./ui/PageContainer";
import { PageHeader } from "./ui/PageHeader";
import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import {
  Budget,
  CashSession,
  FinancialEntry,
  BankAccount
} from '../domain/types';

import {
  TrendingUp,
  ShoppingCart,
  Package,
  Wrench,
  FileText,
  Wallet,
  AlertCircle,
  BarChart as BarChartIcon,
  Receipt,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import CardPadrao from './ui/CardPadrao';

import { useTheme } from '../hooks/useTheme';
import { caixaService } from '../services/caixaService';
import { createScopedQuery } from '../lib/firebaseUtils';
import { useDashboardStats, useActiveOrders } from '../hooks/useDashboardData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isAdmin, profile, loading: authLoading } = useAuth();

  const { data: stats } = useDashboardStats();
  const { data: activeOSData } = useActiveOrders();

  const [activeBudgets, setActiveBudgets] = useState<Budget[]>([]);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [recentFinancial, setRecentFinancial] = useState<FinancialEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const unsubBudgets = onSnapshot(
      createScopedQuery(collection(db, 'budgets'), where('status', '==', 'aberto')),
      snap => setActiveBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget)))
    );

    const unsubCash = caixaService.getCurrentSession(setCurrentSession);

    const unsubFin = onSnapshot(
      createScopedQuery(collection(db, 'financialEntries'), limit(5)),
      snap => setRecentFinancial(snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry)))
    );

    const unsubAccounts = onSnapshot(
      createScopedQuery(collection(db, 'bankAccounts')),
      snap => setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount)))
    );

    return () => {
      unsubBudgets();
      unsubCash();
      unsubFin();
      unsubAccounts();
    };
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const todayTotal = stats?.todayTotal || 0;
  const monthTotal = stats?.monthTotal || 0;
  const todayCount = stats?.todayCount || 0;
  const monthCount = stats?.monthCount || 0;

  // Calculate payment methods for today
  const todayPayments = {
    pix: stats?.todaySales?.reduce((acc, s) => acc + (s.payments?.filter(p => p.method === 'pix').reduce((a, b) => a + b.amount, 0) || (s.paymentMethod === 'pix' ? s.totalAmount : 0)), 0) || 0,
    cartao: stats?.todaySales?.reduce((acc, s) => acc + (s.payments?.filter(p => ['cartao_credito', 'cartao_debito'].includes(p.method)).reduce((a, b) => a + b.amount, 0) || (['cartao_credito', 'cartao_debito'].includes(s.paymentMethod || '') ? s.totalAmount : 0)), 0) || 0,
    dinheiro: stats?.todaySales?.reduce((acc, s) => acc + (s.payments?.filter(p => p.method === 'dinheiro').reduce((a, b) => a + b.amount, 0) || (s.paymentMethod === 'dinheiro' ? s.totalAmount : 0)), 0) || 0,
  };

  const totalPayments = todayPayments.pix + todayPayments.cartao + todayPayments.dinheiro || 1;

  if (authLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-titan-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-titan-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

    return (
  <PageContainer className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
    <DashboardHeader
  currentSession={currentSession}
  navigate={navigate}
/>

{/* STATS GRID */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {[
    { 
      label: 'Monitor de Caixa', 
      value: todayTotal, 
      subValue: currentSession
        ? `Aberto: ${formatCurrency(currentSession.initialValue)}`
        : 'Caixa Fechado',
      icon: Wallet,
      isCurrency: true,
      variant: 'finance'
    },

    { 
      label: 'Desempenho no Mês', 
      value: monthTotal, 
      subValue: `${monthCount} operações este mês`,
      icon: BarChartIcon,
      isCurrency: true,
      variant: 'analytics'
    },

    { 
      label: 'Pagamentos Hoje', 
      value: totalPayments, 
      subValue: `Total processado em todos os meios`,
      icon: Receipt,
      isCurrency: true,
      variant: 'success'
    },

    { 
      label: 'Fluxo de Serviços', 
      value: activeOSData?.length || 0,
      subValue: `${activeBudgets.length} orçamentos ativos`,
      icon: Wrench,
      isCurrency: false,
      variant: 'warning'
    },

  ].map((card, idx) => (
    <CardPadrao
      key={idx}
      title={card.label}
      value={card.value}
      subValue={card.subValue}
      icon={card.icon}
      variant={card.variant}
      isCurrency={card.isCurrency}
      onClick={() => {
        if (card.label === 'Monitor de Caixa') navigate('/caixa');
        if (card.label === 'Desempenho no Mês') navigate('/relatorios');
        if (card.label === 'Pagamentos Hoje') navigate('/vendas');
        if (card.label === 'Fluxo de Serviços') navigate('/ordem-servico');
      }}
    />
  ))}
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RECENT ACTIVITIES */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <CardPadrao 
            className="p-0 overflow-hidden"
            onClick={() => navigate('/financeiro')}
            variant="finance"
          >
            <div className="px-10 py-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <h4 className="text-xl text-white font-black uppercase tracking-tight">Atividades Financeiras</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Sincronização em tempo real das movimentações</p>
              </div>
              <Receipt className="w-6 h-6 text-white/20" />
            </div>
            <div className="divide-y divide-white/5">
              {recentFinancial.length === 0 ? (
                <div className="p-20 text-center text-white/10 italic flex flex-col items-center">
                  <Receipt className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação identificada</p>
                </div>
              ) : (
                recentFinancial.map((item, i) => (
                  <div 
                    key={i} 
                    className="px-10 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center",
                         item.type === 'receita' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {item.type === 'receita' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-white uppercase tracking-tight mb-1">{item.description}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                          {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-xl font-black tracking-tighter",
                      item.type === 'receita' ? "text-emerald-500" : "text-red-500"
                    )}>
                      {item.type === 'receita' ? '+' : '-'}{formatCurrency(item.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardPadrao>
        </div>

        {/* SECONDARY INFO */}
        <div className="lg:col-span-4 space-y-8">
           <CardPadrao 
             className="p-8 group relative overflow-hidden"
             onClick={() => navigate('/configuracoes')}
             variant="analytics"
           >
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-titan-primary/10 text-titan-primary rounded-2xl flex items-center justify-center">
                 <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="text-md font-black text-white uppercase tracking-tight">Status Operacional</h4>
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Monitoramento do Sistema</p>
               </div>
             </div>
             
             <div className="space-y-4">
               <div className="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:border-titan-primary/20 transition-all">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Conexão Backend</p>
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                   <p className="text-sm font-bold text-white">Excelente</p>
                 </div>
               </div>
               <div className="p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:border-titan-primary/20 transition-all">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Cloud Synchro</p>
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                   <p className="text-sm font-bold text-white">Ativo (12ms)</p>
                 </div>
               </div>
             </div>
           </CardPadrao>
        </div>
            </div>
    </PageContainer>
  );
}