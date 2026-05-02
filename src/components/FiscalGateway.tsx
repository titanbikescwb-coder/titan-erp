import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { 
  Sale, 
  ServiceOrder, 
  FiscalNote, 
  FiscalConfig 
} from '../domain/types';
import { fiscalService } from '../services/fiscalService';
import { createScopedQuery } from '../lib/firebaseUtils';
import { 
  FileSignature, 
  History, 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Receipt, 
  Wrench,
  AlertCircle,
  FileCheck,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import FiscalConfigComponent from './FiscalConfig';
import FiscalNotesList from './FiscalNotesList';
import FiscalEmissionModal from './FiscalEmissionModal';

type FiscalTab = 'emissao' | 'emitidas' | 'config';

export default function FiscalGateway() {
  const [activeTab, setActiveTab] = useState<FiscalTab>('emissao');
  const [finalizedSales, setFinalizedSales] = useState<Sale[]>([]);
  const [finalizedOS, setFinalizedOS] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [isEmissionModalOpen, setIsEmissionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ origin: 'venda' | 'os', data: any } | null>(null);

  useEffect(() => {
    // Load operations that are finalized but might need a note
    const qSales = createScopedQuery(
      collection(db, 'sales'),
      where('status', '==', 'FINALIZADA')
    );

    const qOS = createScopedQuery(
      collection(db, 'serviceOrders'),
      where('status', 'in', ['finalizado', 'entregue'])
    );

    const unsubSales = onSnapshot(qSales, (snap) => {
      const sales = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Sale))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      setFinalizedSales(sales);
    });

    const unsubOS = onSnapshot(qOS, (snap) => {
      const os = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ServiceOrder))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      setFinalizedOS(os);
    });

    // Load Fiscal Config
    fiscalService.getConfig().then(cfg => {
      setFiscalConfig(cfg);
      setConfigLoading(false);
    });

    return () => {
      unsubSales();
      unsubOS();
    };
  }, []);

  const handleEmitClick = (origin: 'venda' | 'os', data: any) => {
    setSelectedRecord({ origin, data });
    setIsEmissionModalOpen(true);
  };

  const filteredSales = finalizedSales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.saleNumber.toString().includes(searchTerm)
  );

  const filteredOS = finalizedOS.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.osNumber.toString().includes(searchTerm)
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 px-4 sm:px-0 mt-6 overflow-x-hidden">
      {/* Tab Navigation - Unified pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Módulo Fiscal</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">NF-e • NFC-e • Gestão Manual</p>
          </div>
        </div>

        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start md:self-center">
          <Button
            variant={activeTab === 'emissao' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('emissao')}
            className={cn(
              "h-10 transition-all font-bold",
              activeTab === 'emissao' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Emissão
          </Button>
          <Button
            variant={activeTab === 'emitidas' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('emitidas')}
            className={cn(
              "h-10 transition-all font-bold",
              activeTab === 'emitidas' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            leftIcon={<History className="w-3.5 h-3.5" />}
          >
            Notas Emitidas
          </Button>
          <Button
            variant={activeTab === 'config' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('config')}
            className={cn(
              "h-10 transition-all font-bold",
              activeTab === 'config' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            Configuração
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'emissao' && (
          <motion.div
            key="emissao"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search & Alerts */}
            {configLoading ? (
              <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                Carregando configurações...
              </div>
            ) : !fiscalConfig && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-[32px] flex items-center gap-4">
                <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-2xl text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">Configuração Indispensável</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">Para emitir notas, você precisa preencher seus dados fiscais primeiro.</p>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('config')}
                    className="mt-3 text-[10px] h-auto p-0 text-amber-900 dark:text-amber-200 hover:underline flex items-center gap-1 font-bold"
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Ir para configurações
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 ml-2" />
              <input 
                type="text" 
                placeholder="Buscar por cliente ou número da operação..."
                className="bg-transparent flex-1 outline-none text-sm font-medium text-slate-600 dark:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sales List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Receipt className="w-3 h-3" />
                    Vendas Finalizadas
                  </h4>
                  <span className="text-[10px] font-black text-slate-400">{filteredSales.length} registros</span>
                </div>
                
                <div className="space-y-3">
                  {filteredSales.length === 0 ? (
                    <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center text-slate-400 font-medium text-sm">
                      Nenhuma venda pendente de nota.
                    </div>
                  ) : (
                    filteredSales.map(sale => (
                      <div key={sale.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-xl text-emerald-600">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">#{sale.saleNumber}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                  {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : 'Sem data'}
                                </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(sale.totalAmount)}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{sale.paymentMethod}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500 uppercase truncate max-w-[200px]">{sale.customerName || 'Consumidor Final'}</p>
                            <Button 
                              size="sm"
                              disabled={!fiscalConfig}
                              onClick={() => handleEmitClick('venda', sale)}
                              title={!fiscalConfig ? "Configure seus dados fiscais primeiro" : "Emitir nota para esta venda"}
                              className="px-5 h-10 shadow-lg shadow-indigo-500/20"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Emitir Nota
                            </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* OS List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wrench className="w-3 h-3" />
                    OS Finalizadas
                  </h4>
                  <span className="text-[10px] font-black text-slate-400">{filteredOS.length} registros</span>
                </div>
                
                <div className="space-y-3">
                  {filteredOS.length === 0 ? (
                     <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center text-slate-400 font-medium text-sm">
                        Nenhuma ordem de serviço pendente.
                     </div>
                  ) : (
                    filteredOS.map(os => (
                      <div key={os.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600">
                              <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">OS #{os.osNumber}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                  {os.timestamp?.toDate ? os.timestamp.toDate().toLocaleDateString() : 'Sem data'}
                                </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(os.totalAmount)}</p>
                            <p className="text-[9px] text-blue-500 font-bold uppercase">{os.status}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500 uppercase truncate max-w-[200px]">{os.customerName}</p>
                            <Button 
                              size="sm"
                              disabled={!fiscalConfig}
                              onClick={() => handleEmitClick('os', os)}
                              title={!fiscalConfig ? "Configure seus dados fiscais primeiro" : "Emitir nota para esta OS"}
                              className="px-5 h-10 shadow-lg shadow-indigo-500/20"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            >
                              Emitir Nota
                            </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'emitidas' && (
          <motion.div
            key="emitidas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FiscalNotesList config={fiscalConfig} />
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FiscalConfigComponent config={fiscalConfig} onSave={setFiscalConfig} />
          </motion.div>
        )}
      </AnimatePresence>

      {isEmissionModalOpen && selectedRecord && (
        <FiscalEmissionModal 
          isOpen={isEmissionModalOpen}
          onClose={() => setIsEmissionModalOpen(false)}
          record={selectedRecord}
          config={fiscalConfig!}
        />
      )}
    </div>
  );
}
