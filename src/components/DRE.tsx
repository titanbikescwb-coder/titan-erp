import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  Calendar,
  AlertCircle,
  HelpCircle,
  Download,
  FileText,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { vendaService } from '../services/vendaService';
import { financeiroService } from '../services/financeiroService';
import { Sale, FinancialEntry } from '../domain/types';

interface DREData {
  receitaBruta: number;
  custoProdutos: number;
  impostos: number;
  lucroBruto: number;
  despesasFixas: number;
  despesasVariaveis: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
}

export default function DRE() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<FinancialEntry[]>([]);
  
  const [data, setData] = useState<DREData>({
    receitaBruta: 0,
    custoProdutos: 0,
    impostos: 0,
    lucroBruto: 0,
    despesasFixas: 0,
    despesasVariaveis: 0,
    lucroLiquido: 0,
    margemBruta: 0,
    margemLiquida: 0
  });

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);

    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const unsubSales = vendaService.getSalesByDateRange(start, end, (data) => {
      setSales(data.filter(s => s.status === 'FINALIZADA'));
    });

    const unsubExpenses = financeiroService.getEntriesByDateRange(start, end, (data) => {
      setExpenses(data.filter(e => e.type === 'despesa' && e.status === 'pago'));
    });

    return () => {
      unsubSales();
      unsubExpenses();
    };
  }, [selectedMonth, user, profile, authLoading]);

  useEffect(() => {
    let receitaTotal = 0;
    let custoTotal = 0;

    sales.forEach(sale => {
      receitaTotal += sale.totalAmount;
      const items = sale.items || [];
      items.forEach((item: any) => {
        if (item.type === 'product') {
          const cost = item.costPrice || (item.unitPrice * 0.6);
          custoTotal += cost * item.quantity;
        }
      });
    });

    let despesasFixas = 0;
    let despesasVariaveis = 0;

    expenses.forEach(exp => {
      const category = exp.category?.toLowerCase() || '';
      if (category.includes('aluguel') || 
          category.includes('salário') || 
          category.includes('condomínio') ||
          category.includes('pro-labore')) {
        despesasFixas += exp.amount;
      } else {
        despesasVariaveis += exp.amount;
      }
    });

    const impostos = receitaTotal * 0.06;
    const lucroBruto = receitaTotal - custoTotal - impostos;
    const lucroLiquido = lucroBruto - despesasFixas - despesasVariaveis;
    const margemBruta = receitaTotal > 0 ? (lucroBruto / receitaTotal) * 100 : 0;
    const margemLiquida = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

    setData({
      receitaBruta: receitaTotal,
      custoProdutos: custoTotal,
      impostos,
      lucroBruto,
      despesasFixas,
      despesasVariaveis,
      lucroLiquido,
      margemBruta,
      margemLiquida
    });
    
    setLoading(false);
  }, [sales, expenses]);

  const ItemDRE = ({ label, value, type = 'normal', indent = false, info = '' }: { 
    label: string, 
    value: number, 
    type?: 'normal' | 'add' | 'sub' | 'total',
    indent?: boolean,
    info?: string
  }) => (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center justify-between py-4 border-b border-white/5 transition-colors hover:bg-white/[0.02] px-4 -mx-4 rounded-xl",
        indent ? 'pl-10' : '',
        type === 'total' && "bg-white/[0.03] my-2"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(
          "text-sm tracking-tight",
          type === 'total' ? 'font-black text-white' : 'font-bold text-white/40'
        )}>
          {label}
        </span>
        {info && (
          <div className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-white/20 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-[#121212] border border-white/10 rounded-2xl text-[11px] text-white/70 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl backdrop-blur-xl">
              {info}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {type === 'sub' && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">saída</span>}
        {type === 'add' && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">entrada</span>}
        <span className={cn(
          "text-[15px] font-black tracking-tighter tabular-nums",
          type === 'total' ? 'text-white text-lg' : 
          type === 'sub' ? 'text-rose-500/80' : 'text-white/80'
        )}>
          {formatCurrency(value)}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-10 px-4 md:px-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-titan-primary/10 rounded-[18px] flex items-center justify-center text-titan-primary shadow-lg shadow-titan-primary/10">
               <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              DRE Gerencial
            </h1>
          </div>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] pl-1">Análise de Performance Operacional</p>
        </motion.div>

        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-[24px] border border-white/5 self-start md:self-center">
          <select 
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
            className="bg-transparent border-none rounded-xl px-4 py-2 text-white font-black text-xs md:text-sm uppercase tracking-widest focus:ring-0 cursor-pointer"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
              const d = subMonths(new Date(), i);
              return (
                <option key={i} value={format(d, 'yyyy-MM')} className="bg-[#0A0A0A] text-white">
                  {format(d, 'MMMM yyyy', { locale: ptBR })}
                </option>
              );
            })}
          </select>
          <Button variant="ghost" className="rounded-full w-10 h-10 p-0 text-white/40 hover:text-white hover:bg-white/10">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverGlow className="p-8 border-titan-primary/10 bg-white/[0.02]">
          <CardTitle className="mb-4">Margem Líquida</CardTitle>
          <div className="flex items-end justify-between">
            <p className={cn(
              "text-4xl font-black tracking-tighter leading-none transition-colors",
              data.margemLiquida >= 20 ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {data.margemLiquida.toFixed(1)}%
            </p>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              data.margemLiquida >= 15 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            )}>
              {data.margemLiquida >= 15 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(data.margemLiquida, 100)}%` }}
               className={cn(
                 "h-full transition-all",
                 data.margemLiquida >= 20 ? 'bg-emerald-500' : 'bg-amber-500'
               )} 
             />
          </div>
        </Card>

        <Card hoverGlow className="p-8 border-white/5 bg-white/[0.02]">
          <CardTitle className="mb-4">Lucro Real (Líquido)</CardTitle>
          <p className="text-4xl font-black text-white tracking-tighter leading-none mb-1">
            {formatCurrency(data.lucroLiquido)}
          </p>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Resultado Final</p>
        </Card>

        <Card hoverGlow className="md:col-span-2 p-8 border-white/5 bg-white/[0.02] flex flex-row items-center justify-between gap-6">
          <div className="space-y-3">
             <CardTitle>Eficiência de Gastos</CardTitle>
             <p className="text-[15px] text-white/60 font-bold leading-tight">
               Seu custo fixo consome <span className="text-white font-black">{((data.despesasFixas / data.receitaBruta) * 100 || 0).toFixed(1)}%</span> da receita operacional bruta.
             </p>
             <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-titan-primary border border-white/10 tracking-widest">Contas Fixas</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-rose-400 border border-white/10 tracking-widest">Variáveis</span>
             </div>
          </div>
          <div className="w-20 h-20 rounded-full border-[10px] border-white/5 border-t-titan-primary rotate-45 flex-shrink-0" />
        </Card>
      </div>

      {/* Main DRE Structure */}
      <Card className="max-w-4xl mx-auto overflow-hidden shadow-2xl border-white/10">
        <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-[14px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
             </div>
             <div>
                <CardTitle className="text-white/80">Estrutura de Resultados</CardTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Conforme Princípios de Contabilidade</p>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-10 space-y-2">
          <ItemDRE label="1. RECEITA BRUTA DE VENDAS" value={data.receitaBruta} type="total" info="Total faturado no PDV e Ordens de Serviço no mês selecionado." />
          
          <ItemDRE label="Deduções e Impostos" value={data.impostos} type="sub" indent info="Impostos estimados (Simples Nacional) e cancelamentos." />
          <ItemDRE label="(-) Custos de Mercadorias (CMV)" value={data.custoProdutos} type="sub" indent info="Preço de custo dos itens que saíram do estoque." />
          
          <div className="h-4" />
          <ItemDRE label="2. LUCRO BRUTO" value={data.lucroBruto} type="total" info="Sobra financeira após pagar o fornecedor e o governo." />
          
          <ItemDRE label="Despesas Fixas" value={data.despesasFixas} type="sub" indent info="Gastos recorrentes: Aluguel, Pro-labore, Internet, etc." />
          <ItemDRE label="Despesas Variáveis / Outras" value={data.despesasVariaveis} type="sub" indent info="Marketing, Manutenções pontuais, Taxas de Cartão." />
          
          <div className="h-10" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative p-8 rounded-[32px] border overflow-hidden",
              data.lucroLiquido >= 0 
                ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_20px_50px_rgba(16,185,129,0.1)]" 
                : "bg-rose-500/10 border-rose-500/20 shadow-[0_20px_50px_rgba(244,63,94,0.1)]"
            )}
          >
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-titan-primary/5 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] block">Performance do Exercício</span>
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Lucro Líquido</h3>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/20">Valor real disponível em caixa</p>
              </div>
              <div className="text-center md:text-right">
                <p className={cn(
                  "text-5xl font-black tracking-tight mb-2 drop-shadow-2xl tabular-nums",
                  data.lucroLiquido >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {formatCurrency(data.lucroLiquido)}
                </p>
                <div className="flex items-center justify-center md:justify-end gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    MARGEM {data.margemLiquida.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>

        <div className="p-8 bg-amber-500/[0.03] border-t border-white/5 flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
             <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed mt-1">
            * Este demonstrativo é consolidado a partir de lançamentos confirmados e baixados. Valores de custos são baseados no histórico de entradas de estoque. Recomenda-se conciliação bancária semanal.
          </p>
        </div>
      </Card>
    </div>
  );
}
