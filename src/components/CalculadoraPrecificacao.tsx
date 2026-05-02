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
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100 dark:shadow-none">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Calculadora de Precificação</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Defina preços estratégicos baseados em custos e margens reais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs Section */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Button
              variant={mode === 'percent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('percent')}
              className={cn(
                "flex-1 h-10 shadow-sm",
                mode === 'percent' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Modo Percentual
            </Button>
            <Button
              variant={mode === 'markup' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('markup')}
              className={cn(
                "flex-1 h-10 shadow-sm",
                mode === 'markup' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              Modo Markup
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Custo do Produto (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Despesas Var. (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Impostos (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>

            {mode === 'percent' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="percent-input"
              >
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Lucro Desejado (%)
                </label>
                <div className="space-y-4">
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="number"
                      value={desiredProfit}
                      onChange={(e) => setDesiredProfit(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={desiredProfit || 0}
                    onChange={(e) => setDesiredProfit(e.target.value)}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key="markup-input"
              >
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Markup (Multiplicador)
                </label>
                <div className="relative">
                  <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                    placeholder="Ex: 2.0"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="pt-4 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              {mode === 'percent' 
                ? "O cálculo por percentual garante que a margem de lucro seja aplicada sobre o preço final de venda, cobrindo todos os custos variáveis."
                : "O markup é um multiplicador simples sobre o custo. Útil para precificação rápida, mas requer cuidado com as despesas variáveis."}
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!results.isValid && cost ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 p-6 rounded-3xl flex flex-col items-center text-center gap-3"
              >
                <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-2xl text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-red-900 dark:text-red-100">Atenção!</h3>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {results.message || "Preencha os campos corretamente para calcular o preço."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative z-10 space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Preço de Venda Sugerido</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-5xl font-black tracking-tighter">
                        {formatCurrency(results.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lucro Real (R$)</span>
                      <p className={cn("text-xl font-black", results.profitAmount >= 0 ? "text-green-400" : "text-red-400")}>
                        {formatCurrency(results.profitAmount)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Margem Real (%)</span>
                      <p className={cn("text-xl font-black", results.realMargin >= 0 ? "text-green-400" : "text-red-400")}>
                        {results.realMargin.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">Saúde da Precificação</span>
                      <span className={cn("text-xs font-black uppercase tracking-wider", getHealthColor())}>
                        {getHealthLabel()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(results.realMargin, 0) * 2.5, 100)}%` }}
                        className={cn("h-full transition-all duration-1000", 
                          results.realMargin < 5 ? "bg-red-500" : 
                          results.realMargin < 15 ? "bg-blue-500" : "bg-green-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Custos + Despesas</p>
                      <p className="text-sm font-bold text-slate-200">{formatCurrency(results.totalCosts)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scenario Simulator */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Entenda o Cálculo
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Custo Direto (Peça/Produto)</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(parseFloat(cost) || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Despesas + Impostos (Variáveis)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {results.sellingPrice > 0 
                    ? formatCurrency(results.sellingPrice * ((parseFloat(expenses) || 0) + (parseFloat(taxes) || 0)) / 100)
                    : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white font-bold">Ponto de Equilíbrio (Zero Lucro)</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
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
