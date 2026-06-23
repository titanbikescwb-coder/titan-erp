import { toast } from 'react-hot-toast';
import { CaixaStats } from "./caixa/CaixaStats";
import { CaixaHeader } from "./caixa/CaixaHeader";
import React, { useState, useEffect } from 'react';
import { caixaService } from '../services/caixaService';
import { vendaService } from '../services/vendaService';
import { CashSession, CashMovement, Sale } from '../domain/types';
import { 
  Plus, 
  Minus, 
  Lock, 
  Unlock, 
  History, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Wallet,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Check,
  Receipt,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import CardPadrao from './ui/CardPadrao'
import { useAuth } from '../hooks/useAuth';

import {
  canAccessModule,
  canDoAction
} from '../lib/permissions';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Caixa() {
  const { profile } = useAuth();
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState<'suprimento' | 'sangria' | null>(null);
  const [activeFilter, setActiveFilter] = useState<'inicial' | 'entradas' | 'saidas' | 'saldo' | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionTotals, setSessionTotals] = useState<{
    dinheiro: number;
    cartao_credito: number;
    cartao_debito: number;
    pix: number;
  } | null>(null);

  // Form states
  const [initialValue, setInitialValue] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [closeCash, setCloseCash] = useState('');
  const [closeCard, setCloseCard] = useState('');
  const [closePix, setClosePix] = useState('');

  useEffect(() => {
    const unsubSession = caixaService.getCurrentSession(setCurrentSession);
    const unsubHistory = caixaService.getHistory(setHistory);
    const unsubPendingSales = vendaService.getPendingSales(setPendingSales);
    return () => {
      unsubSession();
      unsubHistory();
      unsubPendingSales();
    };
  }, []);

  useEffect(() => {
    if (currentSession?.id) {
      const unsubMovements = caixaService.getMovements(currentSession.id, setMovements);
      return () => unsubMovements();
    } else {
      setMovements([]);
    }
  }, [currentSession?.id]);

  useEffect(() => {
    if (showCloseModal && currentSession?.id) {
      const fetchTotals = async () => {
        const totals = await caixaService.getSessionPaymentTotals(currentSession.id);
        setSessionTotals(totals);
      };
      fetchTotals();
    } else {
      setSessionTotals(null);
    }
  }, [showCloseModal, currentSession?.id]);

  const handleOpenCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await caixaService.openSession(Number(initialValue));
      setShowOpenModal(false);
      setInitialValue('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar operação no caixa.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession?.id || !showMovementModal) return;
    setLoading(true);
    try {
      await caixaService.addMovement(
        currentSession?.id, 
        showMovementModal, 
        Number(movementAmount), 
        movementReason
      );
      setShowMovementModal(null);
      setMovementAmount('');
      setMovementReason('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar operação no caixa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession?.id) return;
    setLoading(true);
    try {
      await caixaService.closeSession(
        currentSession?.id,
        Number(closeCash),
        Number(closeCard),
        Number(closePix)
      );
      setShowCloseModal(false);
      setCloseCash('');
      setCloseCard('');
      setClosePix('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar operação no caixa.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const handleConfirmPayment = async (sale: Sale) => {
    if (!currentSession?.id) {
      toast('Abra o caixa para confirmar pagamentos.');
      return;
    }
    
    console.log('Iniciando confirmação de pagamento:', {
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      cashSessionId: currentSession?.id
    });

    setLoading(true);
    try {
      await vendaService.confirmPayment(sale.id!, currentSession?.id, 'admin');
      console.log('Pagamento confirmado com sucesso!');
      toast.success(`Pagamento da venda #${sale.saleNumber} confirmado.`);
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error(error.message || 'Erro ao confirmar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterToggle = (filter: 'inicial' | 'entradas' | 'saidas' | 'saldo') => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const getChartData = () => {
    if (!activeFilter) {
      // Default: Last sessions
      return history.slice(0, 5).reverse().map(s => ({
        name: new Date(s.closedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: (s.finalValueCash || 0) + (s.finalValueCard || 0) + (s.finalValuePix || 0)
      }));
    }

    if (activeFilter === 'entradas') {
      const data: Record<string, number> = {};
      movements.filter(m => m.type === 'suprimento').forEach(m => {
        data[m.reason] = (data[m.reason] || 0) + m.amount;
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
    }

    if (activeFilter === 'saidas') {
      const data: Record<string, number> = {};
      movements.filter(m => m.type === 'sangria').forEach(m => {
        data[m.reason] = (data[m.reason] || 0) + m.amount;
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
    }

    if (activeFilter === 'saldo') {
      return [
        { name: 'Inicial', value: currentSession?.initialValue || 0 },
        { name: 'Entradas', value: currentSession?.totalMovementsIn || 0 },
        { name: 'Saídas', value: currentSession?.totalMovementsOut || 0 }
      ];
    }

    return history.slice(0, 5).map(s => ({
      name: formatDate(s.openedAt),
      value: s.initialValue
    }));
  };

  const getChartTitle = () => {
    switch(activeFilter) {
      case 'inicial': return 'Histórico de Abertura';
      case 'entradas': return 'Distribuição de Entradas (Suprimentos)';
      case 'saidas': return 'Distribuição de Saídas (Sangrias)';
      case 'saldo': return 'Composição do Saldo Estimado';
      default: return 'Desempenho dos Últimos Caixas';
    }
  };

  const COLORS = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  const filteredMovements = movements.filter(m => {
    if (!activeFilter) return true;
    if (activeFilter === 'entradas') return m.type === 'suprimento';
    if (activeFilter === 'saidas') return m.type === 'sangria';
    return true;
  });

  const calculateExpected = () => {
    if (!currentSession) return 0;
    return currentSession.initialValue + currentSession.totalMovementsIn - currentSession.totalMovementsOut;
  };
if (!canAccessModule(profile, 'caixa')) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-bold text-white">
        Acesso Negado
      </h2>

      <p className="text-white/40 max-w-md">
        Você não possui permissão para acessar o caixa.
      </p>
    </div>
  );
}
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      <CaixaHeader
  currentSession={currentSession}
  setShowOpenModal={setShowOpenModal}
  setShowMovementModal={setShowMovementModal}
  setShowCloseModal={setShowCloseModal}
/>
      {currentSession && (
  <CaixaStats
    currentSession={currentSession}
    calculateExpected={calculateExpected}
    activeFilter={activeFilter}
    handleFilterToggle={handleFilterToggle}
  />
)}
      {/* Dynamic Main Visualization Area */}
      <AnimatePresence mode="wait">
        {activeFilter ? (
          <motion.div
            key="active-visualization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="card-premium p-8 md:p-10 space-y-10">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <PieIcon className="icon-standard icon-active w-7 h-7" />
                    {getChartTitle()}
                  </h3>
                  <p className="text-white/40 font-medium mt-1">Análise volumétrica e estatísticas do terminal</p>
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => setActiveFilter(null)} 
                  className="p-3 bg-white/5 rounded-full text-white/40"
                >
                  <Plus className="icon-standard icon-default w-6 h-6 rotate-45" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeFilter === 'saldo' || activeFilter === 'entradas' || activeFilter === 'saidas' ? (
                      <PieChart>
                        <Pie
                          data={getChartData()}
                          cx="50%" cy="50%"
                          innerRadius={70} outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} radius={8} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', backgroundColor: '#000', color: '#fff' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" className="opacity-5" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#000', color: '#fff' }} />
                        <Bar dataKey="value" fill="#0A84FF" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-6">Detalhamento de Movimentação</h4>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {filteredMovements.map((m) => (
                       <div key={m.id} className="flex items-center justify-between p-5 rounded-xl border border-white/5 bg-black/40 transition-all group">
                         <div className="flex items-center gap-4">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all",
                             m.type === 'suprimento' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                           )}>
                             {m.type === 'suprimento' ? <TrendingUp className="icon-standard icon-active w-6 h-6" /> : <TrendingDown className="icon-standard icon-critical w-6 h-6" />}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-white transition-colors uppercase tracking-tight">{m.reason}</p>
                             <p className="text-[10px] text-white/40 font-bold uppercase">{formatDate(m.timestamp)}</p>
                           </div>
                         </div>
                         <p className={cn("text-lg font-black tracking-tighter", m.type === 'suprimento' ? "text-emerald-500" : "text-red-500")}>
                           {m.type === 'suprimento' ? '+' : '-'}{formatCurrency(m.amount)}
                         </p>
                       </div>
                     ))}
                     {filteredMovements.length === 0 && <p className="text-center py-20 text-slate-400 italic">Sem registros para este filtro.</p>}
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="general-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Pending Sales Section - High priority always visible or in default view */}
            <div className="card-premium overflow-hidden shadow-sm">
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-[20px] flex items-center justify-center">
                    <Receipt className="icon-standard icon-active w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Aguardando Pagamento</h3>
                    <p className="text-xs text-white/40 font-medium">{pendingSales.length} vendas pendentes de conciliação</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {pendingSales.length === 0 ? (
                  <div className="p-12 text-center text-white/20 italic flex flex-col items-center gap-2">
                    <CheckCircle2 className="icon-standard icon-default w-10 h-10 opacity-20" />
                    <p>Tudo em dia! Nenhuma venda pendente.</p>
                  </div>
                ) : (
                  pendingSales.map((sale) => (
                    <div key={sale.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-base font-black text-white uppercase tracking-tight">Venda #{sale.saleNumber} • {sale.customerName}</p>
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                            {sale.paymentMethod.replace('_', ' ')} • Realizado por {sale.userName || 'Sistema'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(sale.totalAmount)}</p>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleConfirmPayment(sale)}
                          loading={loading}
                          disabled={!currentSession}
                          className="px-6 h-12 shadow-emerald-500/20"
                          leftIcon={!loading && <Check className="icon-standard icon-active w-4 h-4" />}
                        >
                          Confirmar
                          disabled={!currentSession || !canDoAction(profile, 'caixa', 'approve')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* History Summary */}
              <div className="card-premium overflow-hidden flex flex-col shadow-sm">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-white uppercase tracking-widest text-xs">Histórico de Sessões</h3>
                  <History className="icon-standard icon-default w-5 h-5" />
                </div>
              <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-white/5 custom-scrollbar">
                  {history.map((s) => (
                    <div key={s.id} className="p-6 flex justify-between items-center border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{formatDate(s.closedAt)}</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{s.userName}</p>
                      </div>
                      <p className="text-lg font-black text-white tracking-tighter">{formatCurrency((s.finalValueCash || 0) + (s.finalValueCard || 0) + (s.finalValuePix || 0))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart Placeholder / Default */}
              <div className="card-premium p-8 rounded-[32px] flex flex-col justify-center items-center text-center text-white relative overflow-hidden group shadow-xl">
                 <div className="absolute inset-0 bg-titan-primary opacity-5 group-hover:opacity-10 transition-opacity" />
                 <BarChart3 className="icon-standard icon-active w-16 h-16 mb-6" />
                 <h3 className="text-2xl font-black mb-2 tracking-tight">Análise de Performance</h3>
                 <p className="text-white/40 max-w-xs mx-auto text-sm uppercase font-black tracking-widest text-[10px]">Selecione os indicadores acima para detalhar o fluxo financeiro do terminal.</p>
                 <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                       <p className="text-[10px] font-black text-titan-primary uppercase tracking-widest mb-1">Média/Sessão</p>
                       <p className="text-xl font-black">R$ 1.250</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                       <p className="text-[10px] font-black text-titan-primary uppercase tracking-widest mb-1">Crescimento</p>
                       <p className="text-xl font-black">+12%</p>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showOpenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className="p-6 border-b border-white/5 bg-titan-primary text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Unlock className="icon-standard icon-active w-6 h-6" />
                  Abertura Titan ERP
                </h3>
              </div>
              <form onSubmit={handleOpenCaixa} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Valor Inicial (Fundo de Caixa)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 icon-standard icon-default group-focus-within:icon-active transition-colors" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={initialValue}
                      onChange={(e) => setInitialValue(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 h-14 bg-white/5 text-white/40 shadow-none border-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1 h-14"
                  >
                    Confirmar Abertura
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showMovementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className={cn(
                "p-6 border-b border-white/5 text-white",
                showMovementModal === 'suprimento' ? "bg-emerald-600" : "bg-red-600"
              )}>
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                  {showMovementModal === 'suprimento' ? <TrendingUp className="icon-standard icon-active w-6 h-6" /> : <TrendingDown className="icon-standard icon-critical w-6 h-6" />}
                  {showMovementModal === 'suprimento' ? 'Suprimento (Entrada)' : 'Sangria (Saída)'}
                </h3>
              </div>
              <form onSubmit={handleAddMovement} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Valor</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 icon-standard icon-default group-focus-within:icon-active transition-colors" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Motivo / Descrição</label>
                  <textarea
                    required
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all resize-none placeholder:text-white/20"
                    placeholder="Ex: Troco inicial, Pagamento de fornecedor..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowMovementModal(null)}
                    className="flex-1 h-14 bg-white/5 text-white/40 shadow-none border-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    variant={showMovementModal === 'suprimento' ? 'success' : 'danger'}
                    className="flex-1 h-14"
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCloseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className="p-6 border-b border-white/5 bg-red-600 text-white">
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                  <Lock className="icon-standard icon-critical w-6 h-6" />
                  Fechamento de Caixa
                </h3>
              </div>
              <form onSubmit={handleCloseCaixa} className="p-6 space-y-4">
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3 mb-4">
                  <AlertCircle className="icon-standard icon-active w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Conferência de Valores</p>
                    <p className="text-[10px] text-white/40 font-medium mt-1 uppercase tracking-widest leading-tight">Informe os valores totais contados fisicamente no caixa.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {sessionTotals && (
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 shadow-inner">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 leading-none">Resumo Consolidado (Vendas Confirmadas)</p>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white/40 uppercase">PIX:</span>
                          <span className="text-xs font-black text-white">{formatCurrency(sessionTotals.pix)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white/40 uppercase">DINHEIRO:</span>
                          <span className="text-xs font-black text-white">{formatCurrency(sessionTotals.dinheiro)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white/40 uppercase">DÉBITO:</span>
                          <span className="text-xs font-black text-white">{formatCurrency(sessionTotals.cartao_debito)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white/40 uppercase">CRÉDITO:</span>
                          <span className="text-xs font-black text-white">{formatCurrency(sessionTotals.cartao_credito)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total em Dinheiro</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={closeCash}
                      onChange={(e) => setCloseCash(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total em Cartão</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={closeCard}
                      onChange={(e) => setCloseCard(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total em PIX</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={closePix}
                      onChange={(e) => setClosePix(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Saldo Esperado (Dinheiro):</span>
                    <span className="text-lg font-black text-white">{formatCurrency(calculateExpected())}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 h-14 bg-white/5 text-white/40 shadow-none border-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    loading={loading}
                    className="flex-1 h-14 bg-red-600 hover:bg-red-700"
                  >
                    Confirmar Fechamento
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
