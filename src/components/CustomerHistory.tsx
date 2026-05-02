import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Sale, ServiceOrder, Customer } from '../domain/types';
import { 
  ShoppingBag, 
  Wrench, 
  TrendingUp, 
  Calendar, 
  Filter, 
  ChevronRight,
  Search,
  DollarSign,
  ClipboardList,
  Loader2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { createScopedQuery } from '../lib/firebaseUtils';

interface CustomerHistoryProps {
  customerId: string;
  onClose: () => void;
}

type HistoryTab = 'all' | 'sales' | 'os' | 'budgets';

export default function CustomerHistory({ customerId, onClose }: CustomerHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch Sales
    const salesQuery = createScopedQuery(
      collection(db, 'sales'),
      where('customerId', '==', customerId)
    );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      setSales(salesData);
    });

    // Fetch Service Orders
    const osQuery = createScopedQuery(
      collection(db, 'serviceOrders'),
      where('customerId', '==', customerId)
    );

    const unsubOS = onSnapshot(osQuery, (snapshot) => {
      const osData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      setOrders(osData);
    });

    // Fetch Budgets
    const budgetQuery = createScopedQuery(
      collection(db, 'budgets'),
      where('customerId', '==', customerId)
    );

    const unsubBudgets = onSnapshot(budgetQuery, (snapshot) => {
      const budgetData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Budget))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      setBudgets(budgetData);
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubOS();
      unsubBudgets();
    };
  }, [customerId]);

  const filteredHistory = [
    ...sales.map(s => ({ ...s, historyType: 'sale' as const })),
    ...orders.map(o => ({ ...o, historyType: 'os' as const })),
    ...budgets.map(b => ({ ...b, historyType: 'budget' as const }))
  ].sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
    return dateB.getTime() - dateA.getTime();
  }).filter(item => {
    // Filter by type
    if (activeTab === 'sales' && item.historyType !== 'sale') return false;
    if (activeTab === 'os' && item.historyType !== 'os') return false;
    if (activeTab === 'budgets' && item.historyType !== 'budget') return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = (item.saleNumber || item.osNumber || item.budgetNumber)?.toString().includes(searchTerm);
      const matchesItem = item.items?.some((i: any) => i.name.toLowerCase().includes(searchLower));
      const matchesDetails = item.vehicleDetails?.toLowerCase().includes(searchLower);
      if (!matchesId && !matchesItem && !matchesDetails) return false;
    }

    // Filter by date
    if (dateRange.start || dateRange.end) {
      const itemDate = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(0);
      if (dateRange.start && itemDate < new Date(dateRange.start)) return false;
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }
    }

    return true;
  });

  const totalSpent = sales
    .filter(s => s.status !== 'CANCELADA')
    .reduce((sum, s) => sum + s.totalAmount, 0) + 
    orders
    .filter(o => o.status === 'entregue' || o.status === 'finalizado')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const purchaseCount = sales.length + orders.length;
  const averageTicket = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gasto</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(totalSpent)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transações</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{purchaseCount} Atendimentos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-purple-500/30 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(averageTicket)}</p>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por item, serviço ou número da transação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-titan-primary/20 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(['all', 'sales', 'os', 'budgets'] as const).map(tab => (
              <Button 
                key={tab}
                variant={activeTab === tab ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 px-4 py-2 transition-all font-black text-[9px] uppercase tracking-widest whitespace-nowrap",
                  activeTab === tab ? "bg-white dark:bg-slate-700 text-titan-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab === 'all' ? 'Tudo' : tab === 'sales' ? 'Vendas' : tab === 'os' ? 'Serviços' : 'Orçamentos'}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="px-2 py-1.5 text-[9px] font-black uppercase rounded-xl border-none bg-transparent dark:text-white" 
            />
            <span className="text-[9px] font-black text-slate-300 uppercase">/</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="px-2 py-1.5 text-[9px] font-black uppercase rounded-xl border-none bg-transparent dark:text-white" 
            />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="w-8 h-8 text-titan-primary animate-spin mb-4" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Histórico...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <ClipboardList className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma transação encontrada</p>
          </div>
        ) : (
          filteredHistory.map((item: any) => {
            const isExpanded = expandedItem === item.id;
            const type = item.historyType;
            
            return (
              <div 
                key={item.id} 
                className={cn(
                  "group bg-white dark:bg-slate-900 rounded-3xl border transition-all cursor-pointer overflow-hidden",
                  isExpanded ? "border-titan-primary ring-1 ring-titan-primary/10 shadow-xl" : "border-slate-100 dark:border-slate-800 hover:border-titan-primary/30"
                )}
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              >
                <div className="p-5 flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    type === 'sale' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : 
                    type === 'os' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600" :
                    "bg-slate-50 dark:bg-slate-800/50 text-slate-500"
                  )}>
                    {type === 'sale' ? <ShoppingBag className="w-7 h-7" /> : 
                     type === 'os' ? <Wrench className="w-7 h-7" /> : 
                     <FileText className="w-7 h-7" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-black uppercase text-titan-primary italic">
                        {type === 'sale' ? `Venda #${item.saleNumber}` : 
                         type === 'os' ? `OS #${item.osNumber}` : 
                         `Orçamento #${item.budgetNumber}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">•</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {item.timestamp?.toDate ? format(item.timestamp.toDate(), "dd MMM yyyy", { locale: ptBR }) : 'Data Indisponível'}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase truncate tracking-tight text-base leading-none">
                      {type === 'sale' ? `${item.items?.length || 0} PRODUTOS` : 
                       type === 'os' ? item.bikeDetails || 'SERVIÇO OFICINA' : 
                       `${item.items?.length || 0} ITENS EM COTAÇÃO`}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">{formatCurrency(item.totalAmount)}</p>
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest",
                      (item.status === 'FINALIZADA' || item.status === 'entregue' || item.status === 'finalizado') ? "bg-emerald-500/10 text-emerald-500" :
                      (item.status === 'CANCELADA' || item.status === 'recusado') ? "bg-rose-500/10 text-rose-500" : 
                      "bg-amber-500/10 text-amber-500"
                    )}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden"
                    >
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Itens / Descrição</h5>
                            <div className="space-y-2">
                              {item.items?.map((prod: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                      {prod.quantity}x
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">{prod.name}</span>
                                  </div>
                                  <span className="font-black text-slate-900 dark:text-white">{formatCurrency(prod.totalPrice)}</span>
                                </div>
                              ))}
                              {type === 'os' && item.problemDescription && (
                                <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Relato do Problema</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">"{item.problemDescription}"</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informações Detalhadas</h5>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Atendente</span>
                                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase">{item.userName || '—'}</span>
                              </div>
                              {item.paymentMethod && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Pagamento</span>
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase">{item.paymentMethod.replace('_', ' ')}</span>
                                </div>
                              )}
                              {item.validUntil && (
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Validade</span>
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase">
                                    Até {item.validUntil?.toDate ? format(item.validUntil.toDate(), "dd/MM/yyyy") : '—'}
                                  </span>
                                </div>
                              )}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-[10px] font-black text-titan-primary uppercase">Total Bruto</span>
                                <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(item.totalAmount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
