import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  Timestamp, 
  orderBy, 
  limit,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { 
  Sale, 
  ServiceOrder, 
  Budget, 
  CashSession, 
  FinancialEntry,
  BankAccount 
} from '../domain/types';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Wrench, 
  FileText, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  BarChart as BarChartIcon,
  ChevronRight,
  Receipt,
  X,
  Package as Box,
  Scissors
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useTheme } from '../hooks/useTheme';
import { caixaService } from '../services/caixaService';
import { createScopedQuery } from '../lib/firebaseUtils';
import { useDashboardStats, useActiveOrders } from '../hooks/useDashboardData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { user, isAdmin, profile, loading: authLoading } = useAuth();

  const hasFinanceiro = isAdmin || profile?.permissions?.includes('financeiro');
  const hasRelatorios = isAdmin || profile?.permissions?.includes('relatorios');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activeOSData, isLoading: osLoading } = useActiveOrders();

  const [activeBudgets, setActiveBudgets] = useState<Budget[]>([]);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [recentFinancial, setRecentFinancial] = useState<FinancialEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeFilter, setActiveFilter] = useState<'vendas_hoje' | 'vendas_mes' | 'vendas_servico' | 'servicos_aberto' | 'servicos_andamento' | 'caixa' | 'orcamentos' | 'atividades' | 'dre' | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Active Budgets (aberto)
    const qBudgets = createScopedQuery(
      collection(db, 'budgets'), 
      where('status', '==', 'aberto')
    );
    const unsubBudgets = onSnapshot(qBudgets, (snap) => {
      const budgets = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Budget))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA; // desc
        });
      setActiveBudgets(budgets);
    });

    // Current Cash Session
    const unsubCash = caixaService.getCurrentSession((session) => {
      setCurrentSession(session);
    });

    // Recent Financial Entries
    const qFin = createScopedQuery(
      collection(db, 'financialEntries'),
      limit(20)
    );
    const unsubFin = onSnapshot(qFin, (snap) => {
      const entries = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FinancialEntry))
        .sort((a, b) => {
          const dA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
          const dB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
          return dB - dA;
        });
      setRecentFinancial(entries.slice(0, 5));
    });

    // Bank Accounts
    const qAccounts = createScopedQuery(
      collection(db, 'bankAccounts')
    );
    const unsubAccounts = onSnapshot(qAccounts, (snap) => {
      const accList = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BankAccount))
        .sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        });
      setAccounts(accList);
    });

    return () => {
      unsubBudgets();
      unsubCash();
      unsubFin();
      unsubAccounts();
    };
  }, []);

  const todayTotal = stats?.todayTotal || 0;
  const monthTotal = stats?.monthTotal || 0;
  const monthServiceTotal = stats?.monthServiceTotal || 0;
  const todaySales = stats?.todaySales || [];
  const monthSales = stats?.monthSales || [];
  const activeOS = activeOSData || [];

  const osAberto = activeOS.filter(os => os.status === 'aberto');
  const osAndamento = activeOS.filter(os => os.status === 'em_andamento');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleFilterToggle = (filter: 'vendas_hoje' | 'vendas_mes' | 'vendas_servico' | 'servicos_aberto' | 'servicos_andamento' | 'caixa' | 'orcamentos' | 'atividades') => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  // Mock data for chart (in a real app, this would come from a service)
  const salesData = [
    { name: 'Seg', total: 2400 },
    { name: 'Ter', total: 1398 },
    { name: 'Qua', total: 9800 },
    { name: 'Qui', total: 3908 },
    { name: 'Sex', total: 4800 },
    { name: 'Sab', total: 3800 },
    { name: 'Dom', total: 4300 },
  ];

  // Helper for generating chart data based on active filter
  const getChartData = () => {
    switch(activeFilter) {
      case 'vendas_hoje':
        // Mock hourly distribution for today
        return [
          { name: '08h', total: todayTotal * 0.1 },
          { name: '10h', total: todayTotal * 0.2 },
          { name: '12h', total: todayTotal * 0.15 },
          { name: '14h', total: todayTotal * 0.25 },
          { name: '16h', total: todayTotal * 0.2 },
          { name: '18h', total: todayTotal * 0.1 },
        ];
      case 'vendas_mes':
        // Simulated daily total for the month
        return [
          { name: 'Sem 1', total: monthTotal * 0.2 },
          { name: 'Sem 2', total: monthTotal * 0.3 },
          { name: 'Sem 3', total: monthTotal * 0.25 },
          { name: 'Sem 4', total: monthTotal * 0.25 },
        ];
      case 'vendas_servico':
        return [
          { name: 'Sem 1', total: monthServiceTotal * 0.15 },
          { name: 'Sem 2', total: monthServiceTotal * 0.35 },
          { name: 'Sem 3', total: monthServiceTotal * 0.20 },
          { name: 'Sem 4', total: monthServiceTotal * 0.30 },
        ];
      case 'servicos_aberto':
      case 'servicos_andamento':
        return [
          { name: 'Bike', total: activeOS.length * 0.4 },
          { name: 'Peças', total: activeOS.length * 0.3 },
          { name: 'Acess.', total: activeOS.length * 0.3 },
        ];
      case 'orcamentos':
        return [
          { name: 'Até R$500', total: activeBudgets.filter(b => b.totalAmount <= 500).length },
          { name: 'Até R$2k', total: activeBudgets.filter(b => b.totalAmount > 500 && b.totalAmount <= 2000).length },
          { name: 'R$2k+', total: activeBudgets.filter(b => b.totalAmount > 2000).length },
        ];
      case 'atividades':
        return [
          { name: 'Receitas', total: recentFinancial.filter(f => f.type === 'receita').length },
          { name: 'Despesas', total: recentFinancial.filter(f => f.type === 'despesa').length },
        ];
      case 'caixa':
        return [
            { name: 'Entradas', total: currentSession?.totalMovementsIn || 0 },
            { name: 'Saídas', total: currentSession?.totalMovementsOut || 0 },
        ];
      default:
        return salesData;
    }
  };

  const chartData = getChartData();
  const getChartTitle = () => {
    switch(activeFilter) {
      case 'vendas_hoje': return 'Vendas por Horário (Simulado)';
      case 'vendas_mes': return 'Desempenho no Mês';
      case 'vendas_servico': return 'Desempenho de Serviços (Mês)';
      case 'servicos_aberto': return 'Novos Serviços por Categoria';
      case 'servicos_andamento': return 'Serviços em Execução';
      case 'orcamentos': return 'Distribuição de Valores';
      case 'atividades': return 'Tipo de Atividade (Recentes)';
      case 'caixa': return 'Fluxo da Sessão Atual';
      default: return 'Desempenho Semanal';
    }
  };

  const serviceSales = monthSales.filter(sale => 
    sale.items.some(item => item.type === 'service')
  );

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-12 pb-24">
      {/* Premium Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-titan-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-4 ring-white/5 overflow-hidden">
             <BarChartIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1 tracking-tight">
              Olá, {user?.displayName?.split(' ')[0] || 'Gestor'}
            </h1>
            <div className="flex items-center gap-2">
              <span className={cn("inline-block w-2.5 h-2.5 rounded-full shadow-[0_0_10px]", currentSession ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50")} />
              <p className="text-white/40 font-black uppercase tracking-[0.25em] text-[10px]">
                Terminal Titan v3.0 • {currentSession ? 'Caixa Operacional' : 'Caixa Encerrado'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-titan-background-sec/50 p-2 rounded-[28px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          {currentSession ? (
            <Button 
              variant="success"
              size="md"
              onClick={() => navigate('/caixa')}
              className="rounded-2xl"
            >
              <Wallet className="w-4 h-4 mr-2" /> Sessão Ativa
            </Button>
          ) : (
            <Button 
              variant="danger"
              size="md"
              onClick={() => navigate('/caixa')}
              className="rounded-2xl"
            >
              <AlertCircle className="w-4 h-4 mr-2" /> Abrir Caixa
            </Button>
          )}
          <Button 
            variant="ghost"
            size="md"
            onClick={() => navigate('/relatorios')}
            className="rounded-2xl bg-white/5"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          onClick={() => handleFilterToggle('vendas_hoje')}
          className={cn(
            "cursor-pointer",
            activeFilter === 'vendas_hoje' && "border-titan-primary/50 bg-titan-primary/10"
          )}
        >
          <CardHeader>
            <CardTitle>Vendas Hoje</CardTitle>
            <div className="w-10 h-10 bg-titan-primary/20 rounded-2xl flex items-center justify-center text-titan-primary">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">{formatCurrency(todayTotal)}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{todaySales.length} Pedidos</span>
              <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleFilterToggle('vendas_mes')}
          className={cn(
            "cursor-pointer",
            activeFilter === 'vendas_mes' && "border-titan-primary/50 bg-titan-primary/10"
          )}
        >
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">{formatCurrency(monthTotal)}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Performace 92%</span>
              <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[80%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleFilterToggle('vendas_servico')}
          className={cn(
            "cursor-pointer",
            activeFilter === 'vendas_servico' && "border-titan-primary/50 bg-titan-primary/10"
          )}
        >
          <CardHeader>
            <CardTitle>Faturamento Oficina</CardTitle>
            <div className="w-10 h-10 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">{formatCurrency(monthServiceTotal)}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Meta: 12k</span>
              <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[45%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => handleFilterToggle('servicos_andamento')}
          className={cn(
            "cursor-pointer",
            activeFilter === 'servicos_andamento' && "border-titan-primary/50 bg-titan-primary/10"
          )}
        >
          <CardHeader>
            <CardTitle>Jobs Ativos</CardTitle>
            <div className="w-10 h-10 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-white tracking-tighter mb-2">{activeOS.length}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">{osAndamento.length} Operando</span>
              <div className="flex gap-1">
                <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/30" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Area - Interactive Pattern */}
      <AnimatePresence mode="wait">
        {activeFilter ? (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="space-y-8"
          >
            <Card className="min-h-[600px] border-titan-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <CardHeader className="mb-10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-titan-primary/10 rounded-2xl text-titan-primary">
                    {activeFilter === 'orcamentos' && <FileText className="w-8 h-8" />}
                    {['vendas_hoje', 'vendas_mes'].includes(activeFilter) && <ShoppingCart className="w-8 h-8" />}
                    {['servicos_aberto', 'servicos_andamento', 'vendas_servico'].includes(activeFilter) && <Wrench className="w-8 h-8" />}
                    {activeFilter === 'caixa' && <Wallet className="w-8 h-8" />}
                    {activeFilter === 'atividades' && <AlertCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                      {activeFilter === 'orcamentos' ? 'Explorar Orçamentos' :
                       activeFilter === 'vendas_hoje' ? 'Fluxo de Vendas (Hoje)' :
                       activeFilter === 'vendas_mes' ? 'Inteligência Mensal' :
                       activeFilter === 'servicos_aberto' ? 'Ordens Pendentes' :
                       activeFilter === 'atividades' ? 'Log de Atividades' :
                       activeFilter === 'caixa' ? 'Controle de Caixa' :
                       activeFilter === 'vendas_servico' ? 'Performance Oficina' : ''}
                    </h3>
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">Análise Dinâmica de Dados • Tempo Real</p>
                  </div>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter(null)}
                  className="rounded-full bg-white/5 w-12 h-12 p-0"
                >
                  <X className="w-6 h-6" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-12">
                <div className="h-[350px] w-full bg-white/5 rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-titan-primary rounded-full" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Atual</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    {['vendas_hoje', 'vendas_mes', 'vendas_servico'].includes(activeFilter) ? (
                      <AreaChart data={activeFilter === 'vendas_hoje' 
                        ? todaySales.map(v => ({ name: new Date(v.timestamp).getHours() + 'h', value: v.totalAmount }))
                        : monthSales.slice(-12).map(v => ({ name: new Date(v.timestamp).getDate() + '/' + (new Date(v.timestamp).getMonth() + 1), value: v.totalAmount }))
                      }>
                        <defs>
                          <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(255,255,255,0.2)'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(255,255,255,0.2)'}} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#121212', color: '#fff', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="value" stroke="#0A84FF" strokeWidth={4} fillOpacity={1} fill="url(#glow)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={activeFilter === 'orcamentos' 
                        ? activeBudgets.slice(-6).map(o => ({ name: o.customerName.split(' ')[0], value: o.totalAmount }))
                        : activeFilter === 'atividades'
                          ? recentFinancial.slice(0, 10).map((m, i) => ({ name: 'Ativ ' + (i+1), value: m.amount }))
                          : (osAberto.length > 0 ? osAberto : osAndamento).slice(-6).map(ow => ({ name: ow.customerName.split(' ')[0], value: ow.totalAmount }))
                      }>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(255,255,255,0.2)'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: 'rgba(255,255,255,0.2)'}} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#121212', color: '#fff' }} />
                        <Bar dataKey="value" fill="#0A84FF" radius={[12, 12, 0, 0]} barSize={40} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  {activeFilter === 'orcamentos' && activeBudgets.slice(0, 10).map((budget, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors group">
                       <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center"><FileText className="w-7 h-7" /></div>
                        <div>
                          <p className="font-black text-[15px] text-white tracking-tight leading-none mb-1.5 uppercase">{budget.customerName}</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Budget #{budget.budgetNumber} • Global Access</p>
                        </div>
                      </div>
                      <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(budget.totalAmount)}</p>
                    </motion.div>
                  ))}

                  {['vendas_hoje', 'vendas_mes', 'vendas_servico'].includes(activeFilter) && 
                    (activeFilter === 'vendas_servico' ? serviceSales : (activeFilter === 'vendas_hoje' ? todaySales : monthSales)).slice(0, 12).map((sale, idx) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"><Receipt className="w-7 h-7" /></div>
                          <div>
                            <p className="font-black text-[15px] text-white tracking-tight leading-none mb-1.5 uppercase">{sale.customerName || 'Consumidor Final'}</p>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Pedido #{sale.saleNumber} • {sale.paymentMethod.toUpperCase()}</p>
                          </div>
                        </div>
                        <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(sale.totalAmount)}</p>
                      </motion.div>
                    ))
                  }

                  {['servicos_aberto', 'servicos_andamento'].includes(activeFilter) && (activeFilter === 'servicos_andamento' ? osAndamento : osAberto).slice(0, 10).map((os, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors group">
                       <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><Wrench className="w-7 h-7" /></div>
                        <div>
                          <p className="font-black text-[15px] text-white tracking-tight leading-none mb-1.5 uppercase">{os.customerName}</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{os.bikeDetails} • Módulo OS</p>
                        </div>
                      </div>
                      <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(os.totalAmount)}</p>
                    </motion.div>
                  ))}

                  {activeFilter === 'caixa' && currentSession && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-full">
                      <div className="p-8 bg-emerald-600 rounded-[32px] shadow-2xl shadow-emerald-900/20 flex flex-col justify-between h-48 group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-20"><ArrowUpRight className="w-20 h-20" /></div>
                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 z-10">Entradas / Recebimentos</p>
                         <p className="text-4xl font-black text-white tracking-tighter z-10">{formatCurrency(currentSession.totalMovementsIn || 0)}</p>
                      </div>
                      <div className="p-8 bg-red-600 rounded-[32px] shadow-2xl shadow-red-900/20 flex flex-col justify-between h-48 group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-20"><ArrowDownRight className="w-20 h-20" /></div>
                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 z-10">Saídas / Sangrias</p>
                         <p className="text-4xl font-black text-white tracking-tighter z-10">{formatCurrency(currentSession.totalMovementsOut || 0)}</p>
                      </div>
                      <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] shadow-2xl flex flex-col justify-between h-48 group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet className="w-20 h-20" /></div>
                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 z-10">Saldo Operacional</p>
                         <p className="text-4xl font-black text-titan-primary tracking-tighter z-10">
                            {formatCurrency(currentSession.initialValue + (currentSession.totalMovementsIn || 0) - (currentSession.totalMovementsOut || 0))}
                         </p>
                      </div>
                    </div>
                  )}

                  {activeFilter === 'atividades' && recentFinancial.slice(0, 12).map((m, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/5 transition-all group">
                       <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          m.type === 'receita' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {m.type === 'receita' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-[14px] text-white uppercase tracking-tight leading-none mb-1.5">{m.description}</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{new Date(m.date.toDate ? m.date.toDate() : m.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className={cn("text-lg font-black tracking-tighter", m.type === 'receita' ? "text-emerald-400" : "text-red-400")}>{formatCurrency(m.amount)}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Initial View - Premium Bento Insights */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {/* Main Intelligence Card */}
            <Card className="md:col-span-3 lg:col-span-2 row-span-2 overflow-hidden flex flex-col p-10">
               <div className="mb-12">
                 <div className="w-16 h-16 bg-titan-primary/10 rounded-3xl flex items-center justify-center text-titan-primary mb-8 ring-1 ring-titan-primary/20">
                   <BarChartIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">Terminal de Inteligência Titan Cloud</h3>
                 <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Sua visão operacional sincronizada em tempo real.</p>
               </div>

               <div className="flex-1 min-h-[300px] w-full mt-auto relative">
                 <div className="absolute inset-0 flex items-end">
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={salesData}>
                        <Area type="monotone" dataKey="total" stroke="#0A84FF" strokeWidth={3} fill="rgba(10,132,255,0.1)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="relative mt-8 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">ROI Projetado</p>
                      <p className="text-3xl font-black text-white tracking-tighter">42.5%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Churn Rate</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">0.8%</p>
                    </div>
                 </div>
               </div>
            </Card>

            {/* Financial Quick Card */}
            <Card className="md:col-span-1 lg:col-span-2 space-y-8 flex flex-col bg-gradient-to-br from-titan-background-sec to-black">
               <CardHeader>
                 <CardTitle>Contas e Liquidez</CardTitle>
                 <Wallet className="w-5 h-5 text-titan-primary/40" />
               </CardHeader>
               <CardContent className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-2">
                       {formatCurrency(accounts.reduce((acc, a) => acc + a.currentBalance, 0))}
                    </p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Soma dos Saldos Bancários</p>
                  </div>
                  <div className="flex gap-2 pt-6">
                    {accounts.slice(0, 4).map((acc, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-titan-primary" />
                        <span className="text-[10px] font-black text-white/40 uppercase whitespace-nowrap">{acc.name}</span>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>

            {/* DRE Mini Card */}
            <Card className="md:col-span-2 bg-[#166534] border-emerald-500/20 group hover:bg-[#14532d] transition-colors relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <BarChartIcon className="w-40 h-40 text-white" />
               </div>
               <CardHeader>
                 <CardTitle className="text-white/60">Lucro Estimado (DRE)</CardTitle>
                 <ArrowUpRight className="w-6 h-6 text-emerald-300" />
               </CardHeader>
               <CardContent>
                 <p className="text-4xl font-black text-white tracking-tighter mb-4">
                   {formatCurrency((monthTotal + monthServiceTotal) * 0.42)}
                 </p>
                 <Button 
                   variant="ghost" 
                   onClick={() => navigate('/relatorios')}
                   className="p-0 h-auto text-[11px] font-black uppercase tracking-widest text-emerald-300 hover:text-white"
                 >
                   Análise Completa →
                 </Button>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
