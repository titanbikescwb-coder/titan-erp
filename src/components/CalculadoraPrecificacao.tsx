import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  DollarSign,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface PricingResults {
  sellingPrice: number;
  profitAmount: number;
  realMargin: number;
  totalCosts: number;
  isValid: boolean;
  message?: string;
}

export default function CalculadoraPrecificacao() {
  const [mode, setMode] = useState<'percent' | 'markup'>('percent');
  const [cost, setCost] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');
  const [taxes, setTaxes] = useState<string>('');
  const [desiredProfit, setDesiredProfit] = useState<string>('');
  const [markup, setMarkup] = useState<string>('');

  // Calculation Functions
  const calcularPrecoPorPercentual = (custo: number, d: number, i: number, l: number) => {
    const totalPercent = (d + i + l) / 100;
    if (totalPercent >= 1) return 0;
    return custo / (1 - totalPercent);
  };

  const calcularPrecoPorMarkup = (custo: number, mk: number) => {
    return custo * mk;
  };

  const calcularMargemReal = (preco: number, custo: number, d: number, i: number) => {
    if (preco <= 0) return 0;
    // Lucro Real = Preço - Custo - (Preço * Despesas%) - (Preço * Impostos%)
    const lucroReal = preco - custo - (preco * (d / 100)) - (preco * (i / 100));
    return (lucroReal / preco) * 100;
  };

  const results = useMemo((): PricingResults => {
    const c = parseFloat(cost) || 0;
    const d = parseFloat(expenses) || 0;
    const i = parseFloat(taxes) || 0;
    const l = parseFloat(desiredProfit) || 0;
    const mk = parseFloat(markup) || 0;

    let sellingPrice = 0;
    let isValid = true;
    let message = '';

    if (c <= 0) {
      return { sellingPrice: 0, profitAmount: 0, realMargin: 0, totalCosts: 0, isValid: false };
    }

    if (mode === 'markup') {
      if (mk <= 0) return { sellingPrice: 0, profitAmount: 0, realMargin: 0, totalCosts: 0, isValid: false };
      sellingPrice = calcularPrecoPorMarkup(c, mk);
    } else {
      const totalPercent = d + i + l;
      if (totalPercent >= 100) {
        isValid = false;
        message = 'Margem inválida — operação dá prejuízo (Soma % >= 100)';
        sellingPrice = 0;
      } else {
        sellingPrice = calcularPrecoPorPercentual(c, d, i, l);
      }
    }

    const realMargin = calcularMargemReal(sellingPrice, c, d, i);
    const profitAmount = (sellingPrice * realMargin) / 100;
    const totalCosts = c + (sellingPrice * (d / 100)) + (sellingPrice * (i / 100));

    return {
      sellingPrice,
      profitAmount,
      realMargin,
      totalCosts,
      isValid: isValid && sellingPrice > 0,
      message
    };
  }, [mode, cost, expenses, taxes, desiredProfit, markup]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getHealthColor = () => {
    if (!results.isValid) return 'text-red-500';
    if (results.realMargin < 5) return 'text-orange-500';
    if (results.realMargin < 15) return 'text-blue-500';
    return 'text-green-500';
  };

  const getHealthLabel = () => {
    if (!results.isValid) return 'Operação Inválida';
    if (results.realMargin < 0) return 'Prejuízo Real';
    if (results.realMargin < 5) return 'Margem Arriscada';
    if (results.realMargin < 15) return 'Margem Saudável';
    return 'Excelente Lucratividade';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 card-premium p-8 rounded-[40px] border border-titan-border">
        <div className="bg-titan-primary p-4 rounded-2xl text-white shadow-lg shadow-titan-primary/20">
          <Calculator className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">Calculadora de Precificação</h2>
          <p className="text-[10px] text-white font-black uppercase tracking-[0.4em] opacity-40 leading-none">Inteligência de Margens • Titan ERP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs Section */}
        <div className="space-y-8 card-premium p-10 rounded-[40px] border border-titan-border">
          <div className="flex p-1.5 bg-black/40 rounded-[20px] border border-titan-border shadow-inner">
            <Button
              variant={mode === 'percent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('percent')}
              className={cn(
                "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                mode === 'percent' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-white/40 hover:bg-white/5"
              )}
            >
              Modo Percentual
            </Button>
            <Button
              variant={mode === 'markup' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('markup')}
              className={cn(
                "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                mode === 'markup' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-white/40 hover:bg-white/5"
              )}
            >
              Modo Markup
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-1 opacity-40">
                Custo do Produto (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-primary" />
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-16 pr-6 py-4 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-xl font-black text-white transition-all placeholder:text-white/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-1 opacity-40">
                  Despesas Var. (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-4 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-xl font-black text-white transition-all placeholder:text-white/5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-1 opacity-40">
                  Impostos (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input
                    type="number"
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                    placeholder="0"
                    className="w-full pl-16 pr-6 py-4 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-xl font-black text-white transition-all placeholder:text-white/5"
                  />
                </div>
              </div>
            </div>

            {mode === 'percent' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="percent-input"
                className="space-y-4"
              >
                <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-1 opacity-40">
                  Lucro Desejado (%)
                </label>
                <div className="space-y-6">
                  <div className="relative">
                    <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-primary" />
                    <input
                      type="number"
                      value={desiredProfit}
                      onChange={(e) => setDesiredProfit(e.target.value)}
                      placeholder="0"
                      className="w-full pl-16 pr-6 py-4 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-xl font-black text-white transition-all placeholder:text-white/5"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={desiredProfit || 0}
                    onChange={(e) => setDesiredProfit(e.target.value)}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-titan-primary"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="markup-input"
              >
                <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-1 opacity-40">
                  Markup (Multiplicador)
                </label>
                <div className="relative">
                  <ArrowRight className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-primary" />
                  <input
                    type="number"
                    step="0.1"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                    placeholder="Ex: 2.0"
                    className="w-full pl-16 pr-6 py-4 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-xl font-black text-white transition-all placeholder:text-white/5"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex items-start gap-4 p-6 bg-white/5 rounded-[28px] border border-white/5">
            <div className="bg-titan-primary/20 p-2 rounded-xl">
              <Info className="w-5 h-5 text-titan-primary shrink-0" />
            </div>
            <p className="text-[10px] font-bold text-white/50 uppercase leading-relaxed tracking-wider">
              {mode === 'percent' 
                ? "O cálculo por percentual garante que a margem de lucro seja aplicada sobre o preço final de venda, cobrindo todos os custos variáveis."
                : "O markup é um multiplicador simples sobre o custo. Útil para precificação rápida, mas requer cuidado com as despesas variáveis."}
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {!results.isValid && cost ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-premium p-10 rounded-[40px] border border-red-500/20 flex flex-col items-center text-center gap-6 shadow-[0_20px_50px_rgba(239,68,68,0.1)]"
              >
                <div className="bg-red-500/20 p-6 rounded-[28px] text-red-500 border border-red-500/20">
                  <AlertTriangle className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Operação Crítica</h3>
                  <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed px-8">
                    {results.message || "Verifique os parâmetros inseridos para prosseguir com o cálculo."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-premium p-10 rounded-[40px] border border-titan-primary/20 text-white shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-titan-primary/10 to-transparent opacity-50 pointer-events-none" />
                
                <div className="relative z-10 space-y-10">
                  <div>
                    <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.4em]">Preço de Venda Sugerido</span>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-6xl font-black tracking-tighter shadow-sm">
                        {formatCurrency(results.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2 p-6 bg-black/40 rounded-3xl border border-white/5">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest opacity-30">Lucro Bruto</span>
                      <p className={cn("text-2xl font-black tracking-tighter", results.profitAmount >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {formatCurrency(results.profitAmount)}
                      </p>
                    </div>
                    <div className="space-y-2 p-6 bg-black/40 rounded-3xl border border-white/5">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest opacity-30">Margem Líquida</span>
                      <p className={cn("text-2xl font-black tracking-tighter", results.realMargin >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {results.realMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-30">Saúde do Mix</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", getHealthColor())}>
                        {getHealthLabel()}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(results.realMargin, 0) * 2.5, 100)}%` }}
                        className={cn("h-full transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]", 
                          results.realMargin < 5 ? "bg-red-500 shadow-red-500/20" : 
                          results.realMargin < 15 ? "bg-titan-primary shadow-titan-primary/20" : "bg-emerald-500 shadow-emerald-500/20"
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-titan-primary/5 rounded-[28px] border border-titan-primary/10">
                    <BarChart3 className="w-6 h-6 text-titan-primary" />
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Custo Total da Operação</p>
                      <p className="text-lg font-black text-white tracking-tighter">{formatCurrency(results.totalCosts)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scenario Simulator */}
          <div className="card-premium p-8 rounded-[40px] border border-titan-border space-y-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-titan-primary" />
              Memória de Cálculo
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Custo Direto (Líquido)</span>
                <span className="text-sm font-black text-white tracking-tight">{formatCurrency(parseFloat(cost) || 0)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors">Taxas e Encargos</span>
                <span className="text-sm font-black text-white tracking-tight">
                  {results.sellingPrice > 0 
                    ? formatCurrency(results.sellingPrice * ((parseFloat(expenses) || 0) + (parseFloat(taxes) || 0)) / 100)
                    : 'R$ 0,00'}
                </span>
              </div>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center group">
                <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all">Ponto de Equilíbrio</span>
                <span className="text-xl font-black text-titan-primary tracking-tighter">
                  {formatCurrency(calcularPrecoPorPercentual(parseFloat(cost) || 0, parseFloat(expenses) || 0, parseFloat(taxes) || 0, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
