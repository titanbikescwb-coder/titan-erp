import React, { useState, useEffect } from 'react';
import { financeiroService } from '../services/financeiroService';
import { FinancialEntry, FinancialStatus, BankAccount } from '../domain/types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  PieChart,
  BarChart3,
  CreditCard,
  Building2,
  Wallet2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useAuth } from '../hooks/useAuth';
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
  Legend
} from 'recharts';

export default function Financeiro() {
  const { loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'receita_pago' | 'despesa_pago' | 'receita_pendente' | 'despesa_pendente' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterStatus, setFilterStatus] = useState<FinancialStatus | 'all'>('all');
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // New Account Form
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'corrente' as 'corrente' | 'poupanca' | 'caixa_loja' | 'investimento',
    initialBalance: '',
  });

  // Updated Entry Form
  const [newEntry, setNewEntry] = useState({
    type: 'receita' as 'receita' | 'despesa',
    amount: '',
    description: '',
    category: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pendente' as FinancialStatus,
    bankAccountId: '',
    isRecurring: false,
    recurrencePeriod: 'mensal' as 'mensal' | 'semanal' | 'anual'
  });

  useEffect(() => {
    if (authLoading) return;
    const unsubEntries = financeiroService.getEntries(setEntries);
    const unsubAccounts = financeiroService.getAccounts(setAccounts);
    loadCashFlow();
    return () => {
      unsubEntries();
      unsubAccounts();
    };
  }, [authLoading]);

  const loadCashFlow = async () => {
    const data = await financeiroService.getCashFlowData(30);
    setCashFlow(data);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const entryId = await financeiroService.addEntry({
        type: newEntry.type,
        amount: Number(newEntry.amount),
        description: newEntry.description,
        category: newEntry.category,
        dueDate: new Date(newEntry.dueDate),
        status: newEntry.status,
        bankAccountId: newEntry.bankAccountId || undefined,
        isRecurring: newEntry.isRecurring,
        recurrencePeriod: newEntry.isRecurring ? newEntry.recurrencePeriod : undefined
      });
      
      // If it's already paid, update the bank balance
      if (newEntry.status === 'pago' && newEntry.bankAccountId) {
        await financeiroService.updateAccountBalance(newEntry.bankAccountId, Number(newEntry.amount), newEntry.type);
      }

      setShowEntryModal(false);
      setNewEntry({
        type: 'receita',
        amount: '',
        description: '',
        category: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pendente',
        bankAccountId: '',
        isRecurring: false,
        recurrencePeriod: 'mensal'
      });
      loadCashFlow();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await financeiroService.addAccount({
        name: newAccount.name,
        type: newAccount.type,
        initialBalance: Number(newAccount.initialBalance),
        active: true
      });
      setShowAccountModal(false);
      setNewAccount({
        name: '',
        type: 'corrente',
        initialBalance: '',
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (entry: FinancialEntry, status: FinancialStatus) => {
    try {
      await financeiroService.updateEntryStatus(entry.id!, status);
      
      // Update account balance if going to paid
      if (status === 'pago' && entry.bankAccountId) {
        await financeiroService.updateAccountBalance(entry.bankAccountId, entry.amount, entry.type);
      }
      
      loadCashFlow();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const handleFilterToggle = (filter: 'receita_pago' | 'despesa_pago' | 'receita_pendente' | 'despesa_pendente') => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      setFilterType('all');
      setFilterStatus('all');
    } else {
      setActiveFilter(filter);
      const [type, status] = filter.split('_');
      setFilterType(type as any);
      setFilterStatus(status as any);
    }
  };

  const getChartData = () => {
    if (!activeFilter) return cashFlow;

    // Generate specific data for the selected category
    // For receivers/payables, we can show them by category
    const categoryData: Record<string, number> = {};
    const filtered = entries.filter(e => {
      const [type, status] = activeFilter.split('_');
      return e.type === type && e.status === status;
    });

    filtered.forEach(e => {
      categoryData[e.category] = (categoryData[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryData).map(([name, total]) => ({ name, total }));
  };

  const getChartTitle = () => {
    switch(activeFilter) {
      case 'receita_pago': return 'Distribuição de Receitas por Categoria';
      case 'despesa_pago': return 'Distribuição de Despesas por Categoria';
      case 'receita_pendente': return 'A Receber por Categoria';
      case 'despesa_pendente': return 'A Pagar por Categoria';
      default: return 'Evolução do Fluxo de Caixa';
    }
  };

  const chartData = getChartData();

  const handleQuickFilter = (type: 'receita' | 'despesa', status: FinancialStatus | 'all') => {
    if (filterType === type && filterStatus === status) {
      setFilterType('all');
      setFilterStatus('all');
    } else {
      setFilterType(type);
      setFilterStatus(status as any);
    }
  };

  const totals = entries.reduce((acc, e) => {
    if (e.status === 'pago') {
      if (e.type === 'receita') acc.receita += e.amount;
      else acc.despesa += e.amount;
    } else if (e.status === 'pendente') {
      if (e.type === 'receita') acc.aReceber += e.amount;
      else acc.aPagar += e.amount;
    }
    return acc;
  }, { receita: 0, despesa: 0, aReceber: 0, aPagar: 0 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  };

  const cardStyles = {
    green: {
      active: "bg-emerald-600 border-emerald-500 ring-emerald-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
      indicator: "bg-white"
    },
    red: {
      active: "bg-red-600 border-red-500 ring-red-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-red-100 dark:bg-red-900/30 text-red-600",
      indicator: "bg-white"
    },
    blue: {
      active: "bg-blue-600 border-blue-500 ring-blue-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
      indicator: "bg-white"
    },
    amber: {
      active: "bg-amber-600 border-amber-500 ring-amber-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
      indicator: "bg-white"
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-12 pb-24">
      {/* Interactive Unified Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-titan-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-4 ring-white/5">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1 tracking-tight uppercase">
              Financeiro
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-titan-primary rounded-full shadow-[0_0_10px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.25em] text-[10px]">
                Fluxo de Caixa Inteligente • Sincronizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-titan-background-sec/50 p-2 rounded-[28px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          <Button
            variant="ghost"
            onClick={() => setShowAccountModal(true)}
            className="rounded-2xl bg-white/5"
          >
            <Building2 className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Nova Conta</span>
          </Button>
          <Button
            onClick={() => setShowEntryModal(true)}
            className="rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-2" /> Novo Lançamento
          </Button>
        </motion.div>
      </div>

      {/* Bank Accounts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accounts.map((acc, idx) => (
          <Card 
            key={acc.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 border-white/5 hover:border-titan-primary/30 group"
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-xl",
                acc.type === 'caixa_loja' ? "bg-amber-500/10 text-amber-500" :
                acc.type === 'investimento' ? "bg-purple-500/10 text-purple-500" :
                "bg-titan-primary/10 text-titan-primary"
              )}>
                {acc.type === 'caixa_loja' ? <Wallet2 className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ativo</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{acc.name}</p>
              <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(acc.currentBalance)}</p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
               <CreditCard className="w-24 h-24 rotate-12" />
            </div>
          </Card>
        ))}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'receita_pago', label: 'Receitas', subtitle: 'Pagas', value: totals.receita, icon: TrendingUp, color: '#30D158' },
          { id: 'despesa_pago', label: 'Despesas', subtitle: 'Pagas', value: totals.despesa, icon: TrendingDown, color: '#FF453A' },
          { id: 'receita_pendente', label: 'A Receber', subtitle: 'Futuro', value: totals.aReceber, icon: ArrowUpRight, color: '#0A84FF' },
          { id: 'despesa_pendente', label: 'A Pagar', subtitle: 'Atrasado', value: totals.aPagar, icon: ArrowDownRight, color: '#EAB308' },
        ].map((card, idx) => (
          <Card 
            key={card.id}
            onClick={() => handleFilterToggle(card.id as any)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + (idx * 0.1) }}
            className={cn(
              "p-8 cursor-pointer border-white/5 transition-all duration-500",
              activeFilter === card.id ? "bg-titan-primary shadow-2xl shadow-titan-primary/20 scale-105" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center justify-between mb-8">
              <div className={cn(
                "p-4 rounded-2xl",
                activeFilter === card.id ? "bg-white/20 text-white" : "bg-white/5"
              )} style={{ color: activeFilter === card.id ? '#fff' : card.color }}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", activeFilter === card.id ? "text-white/60" : "text-white/20")}>
                  {card.subtitle}
                </span>
              </div>
            </div>
            <div>
               <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-1.5", activeFilter === card.id ? "text-white/70" : "text-white/40")}>
                 {card.label}
               </p>
               <p className={cn("text-2xl md:text-3xl font-black tracking-tighter", activeFilter === card.id ? "text-white" : "text-white")}>
                 {formatCurrency(card.value)}
               </p>
            </div>
            {activeFilter === card.id && (
              <motion.div layoutId="active-indicator" className="absolute bottom-0 left-0 right-0 h-1.5 bg-white shadow-[0_-4px_10px_rgba(255,255,255,0.3)]" />
            )}
          </Card>
        ))}
      </div>

      {/* Dynamic Main Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter || 'general'}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="space-y-8"
        >
          <Card className="min-h-[500px] border-white/5 p-10 bg-gradient-to-br from-titan-background-sec to-black">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
               <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4 uppercase mb-2">
                    {getChartTitle()}
                  </h3>
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">Inteligência Financeira • Vista Panorâmica</p>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-titan-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white/5 border-white/10 rounded-2xl text-sm font-bold uppercase tracking-tight focus:ring-4 focus:ring-titan-primary/10 transition-all w-64"
                    />
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest pl-3 border-none ring-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Todas</option>
                      <option value="receita">Receitas</option>
                      <option value="despesa">Despesas</option>
                    </select>
                    <div className="w-px h-4 bg-white/10 self-center mx-2" />
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest pr-3 border-none ring-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Status</option>
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="h-[350px] w-full bg-white/[0.02] rounded-[32px] p-8 border border-white/5 mb-12">
              <ResponsiveContainer width="100%" height="100%">
                {activeFilter ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0A0A0A', color: '#fff' }} />
                    <Bar dataKey="total" fill="#0A84FF" radius={[12, 12, 0, 0]} barSize={40} />
                  </BarChart>
                ) : (
                  <AreaChart data={cashFlow}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0A0A0A', color: '#fff' }} />
                    <Area type="monotone" dataKey="saldo" stroke="#0A84FF" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left order-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Data</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Descrição</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Valor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentEntries.map((entry, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={entry.id} 
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-5 text-sm font-bold text-white/40 whitespace-nowrap">{formatDate(entry.dueDate)}</td>
                      <td className="px-8 py-5">
                        <p className="text-[15px] font-black text-white uppercase tracking-tight leading-none mb-2 group-hover:text-titan-primary transition-colors font-sans">
                          {entry.description}
                        </p>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{entry.category}</span>
                      </td>
                      <td className={cn(
                        "px-8 py-5 text-lg font-black text-right tracking-tighter",
                        entry.type === 'receita' ? "text-[#30D158]" : "text-[#FF453A]"
                      )}>
                        {entry.type === 'receita' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          entry.status === 'pago' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {entry.status === 'pendente' && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(entry, 'pago')}
                              className="w-10 h-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => financeiroService.deleteEntry(entry.id!)}
                            className="w-10 h-10 p-0 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between p-6 bg-white/[0.02] rounded-[24px] border border-white/5">
                <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">
                  Página {currentPage} de {totalPages} • Total {filteredEntries.length} itens
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="rounded-xl border-white/5 hover:bg-white/5"
                  >
                    <Plus className="w-5 h-5 rotate-180" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="rounded-xl border-white/5 hover:bg-white/5"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Modal Nova Conta */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-titan-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                  <Building2 className="w-6 h-6" />
                  Nova Conta Bancária
                </h3>
                <Button 
                  variant="ghost"
                  onClick={() => setShowAccountModal(false)} 
                  className="p-1 h-auto text-white hover:bg-white/20 rounded-full"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Nome da Conta</label>
                  <input
                    type="text" required
                    value={newAccount.name}
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Caixa Geral, Banco Inter..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Tipo de Conta</label>
                  <select
                    value={newAccount.type}
                    onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Conta Poupança</option>
                    <option value="caixa_loja">Caixa Interno (Loja)</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Saldo Inicial</label>
                  <input
                    type="number" step="0.01" required
                    value={newAccount.initialBalance}
                    onChange={e => setNewAccount({...newAccount, initialBalance: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setShowAccountModal(false)} 
                    className="flex-1 h-14"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading}
                    className="flex-1 h-14 bg-titan-primary shadow-titan-primary/20 text-[10px] font-black uppercase tracking-widest"
                  >
                    Criar Conta
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Entry Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-titan-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                  <Plus className="w-6 h-6" />
                  Novo Lançamento
                </h3>
                <Button 
                  variant="ghost"
                  onClick={() => setShowEntryModal(false)} 
                  className="p-1 h-auto text-white hover:bg-white/20 rounded-full"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleAddEntry} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <Button
                    type="button"
                    variant={newEntry.type === 'receita' ? 'primary' : 'ghost'}
                    onClick={() => setNewEntry({...newEntry, type: 'receita'})}
                    className={cn(
                      "flex-1 py-1 px-4 text-xs font-bold uppercase transition-all rounded-lg h-auto bg-transparent shadow-none",
                      newEntry.type === 'receita' ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={newEntry.type === 'despesa' ? 'primary' : 'ghost'}
                    onClick={() => setNewEntry({...newEntry, type: 'despesa'})}
                    className={cn(
                      "flex-1 py-1 px-4 text-xs font-bold uppercase transition-all rounded-lg h-auto bg-transparent shadow-none",
                      newEntry.type === 'despesa' ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    Despesa
                  </Button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Descrição</label>
                  <input
                    type="text" required
                    value={newEntry.description}
                    onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Aluguel, Compra de Peças..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Valor</label>
                    <input
                      type="number" step="0.01" required
                      value={newEntry.amount}
                      onChange={e => setNewEntry({...newEntry, amount: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Vencimento</label>
                    <input
                      type="date" required
                      value={newEntry.dueDate}
                      onChange={e => setNewEntry({...newEntry, dueDate: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Conta Bancária / Destino</label>
                  <select
                    value={newEntry.bankAccountId}
                    onChange={e => setNewEntry({...newEntry, bankAccountId: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione uma conta...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Categoria</label>
                    <input
                      type="text" required
                      value={newEntry.category}
                      onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: Operacional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={newEntry.status}
                      onChange={e => setNewEntry({...newEntry, status: e.target.value as FinancialStatus})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Já Pago/Recebido</option>
                    </select>
                  </div>
                </div>

                {/* Recurrence Pattern - Passo 3 */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={cn(
                      "w-10 h-6 rounded-full relative transition-colors",
                      newEntry.isRecurring ? "bg-titan-primary" : "bg-slate-200 dark:bg-slate-700"
                    )}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={newEntry.isRecurring}
                        onChange={e => setNewEntry({...newEntry, isRecurring: e.target.checked})}
                      />
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        newEntry.isRecurring ? "translate-x-4" : ""
                      )} />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Lançamento Recorrente</span>
                  </label>
                  
                  {newEntry.isRecurring && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex gap-2">
                        {['semanal', 'mensal', 'anual'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewEntry({...newEntry, recurrencePeriod: p as any})}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              newEntry.recurrencePeriod === p 
                                ? "bg-titan-primary text-white shadow-sm" 
                                : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">O sistema irá gerar lançamentos automáticos a cada período selecionado.</p>
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setShowEntryModal(false)} 
                    className="flex-1 h-14"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading}
                    className="flex-1 h-14 bg-titan-primary hover:bg-titan-primary/90 shadow-titan-primary/20 text-[10px] font-black uppercase tracking-widest"
                  >
                    Salvar Lançamento
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
