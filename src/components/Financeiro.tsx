import { FinanceiroModal } from "./financeiro/FinanceiroModal";
import { FinanceiroTable } from "./financeiro/FinanceiroTable";
import { FinanceiroStats } from "./financeiro/FinanceiroStats";
import { FinanceiroAccounts } from "./financeiro/FinanceiroAccounts";
import { FinanceiroHeader } from "./financeiro/FinanceiroHeader";
import React, { useState, useEffect } from 'react';
import { financeiroService } from '../services/financeiroService';
import { clienteService } from '../services/clienteService';
import { fornecedorService } from '../services/fornecedorService';
import { FinancialEntry, FinancialStatus, BankAccount, Customer, Supplier } from '../domain/types';
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
  RefreshCw,
  User,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import CardPadrao from './ui/CardPadrao';
import { useAuth } from '../hooks/useAuth';
import {
  canAccessModule,
  canDoAction
} from '../lib/permissions';
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
  const { loading: authLoading, profile } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    recurrencePeriod: 'mensal' as 'mensal' | 'semanal' | 'anual',
    customerId: '',
    supplierId: ''
  });

  const [activeAccountFilter, setActiveAccountFilter] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const unsubEntries = financeiroService.getEntries(setEntries);
    const unsubAccounts = financeiroService.getAccounts(setAccounts);
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    const unsubSuppliers = fornecedorService.getSuppliers(setSuppliers);
    loadCashFlow();
    return () => {
      unsubEntries();
      unsubAccounts();
      unsubCustomers();
      unsubSuppliers();
    };
  }, [authLoading]);

  const loadCashFlow = async () => {
    const data = await financeiroService.getCashFlowData(30);
    setCashFlow(data);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, activeAccountFilter]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === newEntry.customerId);
      const selectedSupplier = suppliers.find(s => s.id === newEntry.supplierId);

      const entryData: any = {
  type: newEntry.type,
  amount: Number(newEntry.amount),
  description: newEntry.description,
  category: newEntry.category,
  dueDate: new Date(newEntry.dueDate),
  status: newEntry.status,
  isRecurring: newEntry.isRecurring,
};

if (newEntry.bankAccountId) {
  entryData.bankAccountId = newEntry.bankAccountId;
}

if (newEntry.isRecurring) {
  entryData.recurrencePeriod = newEntry.recurrencePeriod;
}

if (newEntry.customerId) {
  entryData.customerId = newEntry.customerId;
  entryData.customerName = selectedCustomer?.name;
}

if (newEntry.supplierId) {
  entryData.supplierId = newEntry.supplierId;
  entryData.supplierName = selectedSupplier?.name;
}

const entryId = await financeiroService.addEntry(entryData);
      
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
        recurrencePeriod: 'mensal',
        customerId: '',
        supplierId: ''
      });
      loadCashFlow();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar operação.');
    } finally {
      setLoading(false);
    }
  };

const openEntryModal = (
  type: 'receita' | 'despesa',
  status: FinancialStatus = 'pago'
) => {
  setNewEntry({
    ...newEntry,
    type,
    status,
    description: '',
    amount: '',
    customerId: '',
    supplierId: ''
  });

  setShowEntryModal(true);
};

const handleUpdateStatus = async (
  entry: FinancialEntry,
  status: FinancialStatus
) => {
  try {
    await financeiroService.updateEntryStatus(
      entry.id!,
      status
    );

    if (
      entry.status !== 'pago' &&
      status === 'pago' &&
      entry.bankAccountId
    ) {
      await financeiroService.updateAccountBalance(
        entry.bankAccountId,
        entry.amount,
        entry.type
      );
    }

    loadCashFlow();
  } catch (error: any) {
    toast.error(error.message || 'Erro ao processar operação.');
  }
};
  
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || e.type === filterType;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchesAccount = !activeAccountFilter || e.bankAccountId === activeAccountFilter;
    return matchesSearch && matchesType && matchesStatus && matchesAccount;
  });

  // ...

  const handleAccountFilterToggle = (accountId: string) => {
    if (activeAccountFilter === accountId) {
      setActiveAccountFilter(null);
    } else {
      setActiveAccountFilter(accountId);
    }
  };

  // ...

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
      iconInactive: "bg-emerald-500/10 text-emerald-500",
      indicator: "bg-white"
    },
    red: {
      active: "bg-red-600 border-red-500 ring-red-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-red-500/10 text-red-500",
      indicator: "bg-white"
    },
    blue: {
      active: "bg-blue-600 border-blue-500 ring-blue-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-blue-500/10 text-blue-500",
      indicator: "bg-white"
    },
    amber: {
      active: "bg-amber-600 border-amber-500 ring-amber-500/10",
      iconContainer: "bg-white/20 text-white shadow-lg",
      iconInactive: "bg-amber-500/10 text-amber-500",
      indicator: "bg-white"
    }
  };
  if (!canAccessModule(profile, 'financeiro')) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-bold text-white">
        Acesso Negado
      </h2>

      <p className="text-white/40 max-w-md">
        Você não possui permissão para acessar o financeiro.
      </p>
    </div>
  );
}

  return (
  <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
    <FinanceiroHeader
  onOpenAccountModal={() => setShowAccountModal(true)}
/>

      {/* Bank Accounts Section */}
      <FinanceiroAccounts
  accounts={accounts}
  activeAccountFilter={activeAccountFilter}
  onToggleAccountFilter={handleAccountFilterToggle}
/>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <Button
    onClick={() => openEntryModal("receita", "pago")}
    className="h-14 rounded-2xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest"
  >
    + Receita
  </Button>

  <Button
    onClick={() => openEntryModal("despesa", "pago")}
    className="h-14 rounded-2xl bg-red-600 text-[10px] font-black uppercase tracking-widest"
  >
    + Despesa
  </Button>

  <Button
    onClick={() => openEntryModal("receita", "pendente")}
    className="h-14 rounded-2xl bg-blue-600 text-[10px] font-black uppercase tracking-widest"
  >
    + A Receber
  </Button>

  <Button
    onClick={() => openEntryModal("despesa", "pendente")}
    className="h-14 rounded-2xl bg-amber-600 text-[10px] font-black uppercase tracking-widest"
  >
    + A Pagar
  </Button>
</div>

     <FinanceiroStats
  totals={totals}
  activeFilter={activeFilter}
  onFilterToggle={handleFilterToggle}
  onOpenEntryModal={openEntryModal}
/>

      {/* Dynamic Main Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter || 'general'}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="space-y-8"
        >
          <Card className="min-h-[500px] border-titan-border p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 border-b border-titan-border pb-10">
               <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4 uppercase mb-2">
                    {getChartTitle()}
                  </h3>
                  <p className="text-titan-text-secondary text-[11px] font-black uppercase tracking-[0.3em]">Módulo de Governança Financeira • Tempo Real</p>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="FILTRAR REGISTROS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3.5 bg-black/30 border-titan-border rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-titan-primary/10 transition-all w-64 placeholder:text-titan-text-secondary/30"
                    />
                  </div>
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-titan-border">
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] pl-3 border-none ring-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="all" className="bg-[#0A0A0A] text-white">TODAS</option>
                      <option value="receita" className="bg-[#0A0A0A] text-white">RECEITAS</option>
                      <option value="despesa" className="bg-[#0A0A0A] text-white">DESPESAS</option>
                    </select>
                    <div className="w-px h-4 bg-titan-border self-center mx-3" />
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-transparent text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] pr-3 border-none ring-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="all" className="bg-[#0A0A0A] text-white">STATUS</option>
                      <option value="pendente" className="bg-[#0A0A0A] text-white">PENDENTE</option>
                      <option value="pago" className="bg-[#0A0A0A] text-white">PAGO</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="h-[380px] w-full bg-black/40 rounded-[40px] p-10 border border-titan-border mb-12 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                {activeFilter ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.2)'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0A0A0A', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="total" fill="#0A84FF" radius={[12, 12, 0, 0]} barSize={45} />
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
                    <Area type="monotone" dataKey="saldo" stroke="#0A84FF" strokeWidth={5} fillOpacity={1} fill="url(#colorSaldo)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            <FinanceiroTable
  entries={currentEntries}
  formatDate={formatDate}
  formatCurrency={formatCurrency}
  onUpdateStatus={handleUpdateStatus}
  onDeleteEntry={async (entryId) => {
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    toast.error('Lançamento não encontrado.');
    return;
  }

  if (entry.status === 'pago') {
    toast.error('Não é permitido excluir lançamentos já liquidados.');
    return;
  }

  if (!canDoAction(profile, 'financeiro', 'delete')) {
    toast.error('Sem permissão para excluir lançamentos financeiros.');
    return;
  }

  await financeiroService.deleteEntry(entryId);
  toast.success('Lançamento excluído com sucesso.');
  loadCashFlow();
}}
/>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between p-8 bg-black/20 rounded-[32px] border border-titan-border">
                <span className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em]">
                  Página {currentPage} de {totalPages} • {filteredEntries.length} Registros Cloud
                </span>
                <div className="flex gap-4">
                  <Button 
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="rounded-2xl bg-white/5 w-12 h-12 p-0 border border-titan-border"
                  >
                    <Plus className="w-5 h-5 rotate-180" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="rounded-2xl bg-white/5 w-12 h-12 p-0 border border-titan-border"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className="p-8 border-b border-titan-border bg-titan-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Building2 className="w-7 h-7" />
                  Configurar Conta
                </h3>
                <Button 
                  variant="ghost"
                  onClick={() => setShowAccountModal(false)} 
                  className="p-1 h-auto text-white hover:bg-white/20 rounded-full"
                >
                  <Plus className="w-7 h-7 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleAddAccount} className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Identificação da Conta</label>
                  <input
                    type="text" required
                    value={newAccount.name}
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                    className="w-full"
                    placeholder="Ex: CAIXA INTERNO, BANCO ITAU..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Modalidade Operacional</label>
                  <select
                    value={newAccount.type}
                    onChange={e => setNewAccount({...newAccount, type: e.target.value as any})}
                    className="w-full"
                  >
                    <option value="corrente" className="bg-[#0A0A0A] text-white">CONTA CORRENTE</option>
                    <option value="poupanca" className="bg-[#0A0A0A] text-white">CONTA POUPANÇA</option>
                    <option value="caixa_loja" className="bg-[#0A0A0A] text-white">CAIXA DA LOJA</option>
                    <option value="investimento" className="bg-[#0A0A0A] text-white">CARTEIRA DE INVESTIMENTO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Saldo Inicial (BRL)</label>
                  <input
                    type="number" step="0.01" required
                    value={newAccount.initialBalance}
                    onChange={e => setNewAccount({...newAccount, initialBalance: e.target.value})}
                    className="w-full"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setShowAccountModal(false)} 
                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    CANCELAR
                  </Button>
                  <Button 
                    type="submit" 
                    loading={loading}
                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                  >
                    CRIAR CONTA
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-[96vw] max-w-[1400px] h-[88vh] overflow-hidden border border-titan-border flex flex-col"
            >
              <div className="px-10 py-6 border-b border-titan-border bg-titan-primary text-white flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Plus className="w-7 h-7" />
                  Novo Lançamento
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowEntryModal(false)}
                  className="p-1 h-auto text-white hover:bg-white/20 rounded-full"
                >
                  <Plus className="w-7 h-7 rotate-45" />
                </Button>
              </div>

              <form onSubmit={handleAddEntry} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
                <div className="max-w-2xl mx-auto flex p-1.5 bg-black/40 rounded-[22px] border border-titan-border shadow-inner">
                  <Button
                    type="button"
                    onClick={() => setNewEntry({...newEntry, type: 'receita'})}
                    className={cn(
                      "flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-none",
                      newEntry.type === 'receita' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" : "text-white/40 hover:bg-white/5"
                    )}
                  >
                    Receita
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setNewEntry({...newEntry, type: 'despesa'})}
                    className={cn(
                      "flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-none",
                      newEntry.type === 'despesa' ? "bg-red-600 text-white shadow-xl shadow-red-600/20" : "text-white/40 hover:bg-white/5"
                    )}
                  >
                    Despesa
                  </Button>
                </div>

                <div className="rounded-[36px] border border-titan-border bg-black/20 p-8 shadow-inner space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Descrição</label>
                    <input
                      type="text" required
                      value={newEntry.description}
                      onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                      placeholder="Ex: Aluguel, Compra de Peças, Recebimento de Cliente..."
                      className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all placeholder:text-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {newEntry.type === 'receita' ? (
                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Cliente (Opcional)</label>
                        <select
                          value={newEntry.customerId}
                          onChange={e => setNewEntry({...newEntry, customerId: e.target.value})}
                          className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                        >
                          <option value="" className="bg-[#0A0A0A] text-white">Selecione um cliente...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id} className="bg-black text-white">{c.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Fornecedor (Opcional)</label>
                        <select
                          value={newEntry.supplierId}
                          onChange={e => setNewEntry({...newEntry, supplierId: e.target.value})}
                          className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                        >
                          <option value="" className="bg-[#0A0A0A] text-white">Selecione um fornecedor...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id} className="bg-black text-white">{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Categoria</label>
                      <input
                        type="text" required
                        value={newEntry.category}
                        onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                        placeholder="Ex: Operacional"
                        className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Valor</label>
                      <input
                        type="number" step="0.01" required
                        value={newEntry.amount}
                        onChange={e => setNewEntry({...newEntry, amount: e.target.value})}
                        placeholder="0,00"
                        className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all placeholder:text-white/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Vencimento</label>
                      <input
                        type="date" required
                        value={newEntry.dueDate}
                        onChange={e => setNewEntry({...newEntry, dueDate: e.target.value})}
                        className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Status</label>
                      <select
                        value={newEntry.status}
                        onChange={e => setNewEntry({...newEntry, status: e.target.value as FinancialStatus})}
                        className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                      >
                        <option value="pendente" className="bg-black text-white">PENDENTE</option>
                        <option value="pago" className="bg-black text-white">LIQUIDADO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Recorrência</label>
                      <select
                        value={newEntry.isRecurring ? newEntry.recurrencePeriod : 'nao'}
                        onChange={e => {
                          const value = e.target.value;
                          setNewEntry({
                            ...newEntry,
                            isRecurring: value !== 'nao',
                            recurrencePeriod: value === 'nao' ? newEntry.recurrencePeriod : value as any
                          });
                        }}
                        className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                      >
                        <option value="nao" className="bg-black text-white">NÃO RECORRENTE</option>
                        <option value="semanal" className="bg-black text-white">SEMANALMENTE</option>
                        <option value="mensal" className="bg-black text-white">MENSALMENTE</option>
                        <option value="anual" className="bg-black text-white">ANUALMENTE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">Conta Bancária / Destino</label>
                    <select
                      value={newEntry.bankAccountId}
                      onChange={e => setNewEntry({...newEntry, bankAccountId: e.target.value})}
                      className="w-full px-6 py-5 bg-black/40 border border-titan-border rounded-2xl focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 outline-none text-[12px] font-black uppercase tracking-widest text-white transition-all"
                    >
                      <option value="" className="bg-[#0A0A0A] text-white">Selecione uma conta...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-black text-white">{acc.name} ({formatCurrency(acc.currentBalance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-titan-border pt-6 pb-1 flex flex-col sm:flex-row justify-end gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEntryModal(false)}
                    className="h-16 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest sm:min-w-[200px]"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="h-16 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20 sm:min-w-[260px]"
                  >
                    SALVAR LANÇAMENTO
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
