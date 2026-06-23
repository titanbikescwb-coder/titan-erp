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
    <div className="space-y-10 max-w-7xl mx-auto pb-20 px-4 sm:px-0 mt-6 overflow-x-hidden">
      {/* Tab Navigation - Unified pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 card-premium p-8 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-4 rounded-[20px] text-white shadow-2xl shadow-indigo-600/30">
            <FileSignature className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-wider uppercase leading-none mb-2">Fiscal</h2>
            <p className="text-[10px] text-white font-black uppercase tracking-[0.4em] leading-none">NF-e • NFC-e • GESTÃO DE DOCUMENTOS</p>
          </div>
        </div>

        <div className="flex p-1.5 bg-black/40 rounded-[24px] border border-titan-border shadow-inner">
          <Button
            variant={activeTab === 'emissao' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('emissao')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'emissao' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Emissão
          </Button>
          <Button
            variant={activeTab === 'emitidas' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('emitidas')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'emitidas' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
            leftIcon={<History className="w-4 h-4" />}
          >
            Emitidas
          </Button>
          <Button
            variant={activeTab === 'config' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('config')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === 'config' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Ajustes
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
              <div className="p-8 text-center text-titan-text-secondary font-bold uppercase tracking-widest text-[10px] animate-pulse">
                Sincronizando Módulos Fiscais...
              </div>
            ) : !fiscalConfig && (
              <div className="bg-amber-900/10 border border-amber-900/20 p-6 rounded-[32px] flex items-center gap-4">
                <div className="bg-amber-900/20 p-3 rounded-2xl text-amber-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-200 uppercase tracking-tight">Configuração Indispensável</h4>
                  <p className="text-sm text-amber-500/70">Para emitir notas, você precisa preencher seus dados fiscais primeiro.</p>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('config')}
                    className="mt-3 text-[10px] h-auto p-0 text-amber-200 hover:underline flex items-center gap-1 font-bold"
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Ir para configurações
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 bg-black/40 p-6 rounded-[32px] border border-titan-border shadow-inner group">
              <Search className="w-6 h-6 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors ml-2" />
              <input 
                type="text" 
                placeholder="BUSCAR POR CLIENTE OU NÚMERO DA OPERAÇÃO..."
                className="bg-transparent flex-1 outline-none text-[11px] font-black text-white placeholder:text-titan-text-secondary/30 uppercase tracking-[0.2em]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Sales List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-6">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                      <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    VENDAS FINALIZADAS
                  </h4>
                  <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.2em]">{filteredSales.length} REGISTROS</span>
                </div>
                
                <div className="space-y-6">
                  {filteredSales.length === 0 ? (
                    <div className="p-16 bg-black/20 rounded-[40px] border-2 border-dashed border-titan-border text-center flex flex-col items-center gap-4">
                      <Receipt className="w-10 h-10 text-white/20" />
                      <span className="text-[10px] text-white font-black uppercase tracking-[0.4em]">Nenhuma venda pendente</span>
                    </div>
                  ) : (
                    filteredSales.map(sale => (
                      <div key={sale.id} className="card-premium p-8 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="bg-emerald-500/10 p-4 rounded-[20px] text-emerald-500 border border-emerald-500/20">
                              <Receipt className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-white uppercase tracking-tighter text-lg leading-none mb-1">#{sale.saleNumber}</p>
                                <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">
                                  {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase() : 'SEM DATA'}
                                </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-white tracking-tighter leading-none mb-1">{formatCurrency(sale.totalAmount)}</p>
                            <p className="text-[9px] text-titan-primary font-black uppercase tracking-[0.2em]">{sale.paymentMethod.toUpperCase()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">PROMISSÁRIO</p>
                              <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[200px]">{sale.customerName || 'CONSUMIDOR FINAL'}</p>
                            </div>
                            <Button 
                              onClick={() => handleEmitClick('venda', sale)}
                              disabled={!fiscalConfig}
                              className={cn(
                                "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                !fiscalConfig ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                              )}
                              rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                              EMITIR NOTA
                            </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* OS List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-6">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                    <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                      <Wrench className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    ORDENS DE SERVIÇO
                  </h4>
                  <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.2em]">{filteredOS.length} REGISTROS</span>
                </div>
                
                <div className="space-y-6">
                  {filteredOS.length === 0 ? (
                     <div className="p-16 bg-black/20 rounded-[40px] border-2 border-dashed border-titan-border text-center flex flex-col items-center gap-4">
                        <Wrench className="w-10 h-10 text-white/20" />
                        <span className="text-[10px] text-white font-black uppercase tracking-[0.4em]">Nenhuma os finalizada</span>
                     </div>
                  ) : (
                    filteredOS.map(os => (
                      <div key={os.id} className="card-premium p-8 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] group hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-500/10 p-4 rounded-[20px] text-blue-500 border border-blue-500/20">
                              <Wrench className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-white uppercase tracking-tighter text-lg leading-none mb-1">OS #{os.osNumber}</p>
                                <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">
                                  {os.timestamp?.toDate ? os.timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase() : 'SEM DATA'}
                                </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-white tracking-tighter leading-none mb-1">{formatCurrency(os.totalAmount)}</p>
                            <p className="text-[9px] text-titan-primary font-black uppercase tracking-[0.2em]">{os.status?.toUpperCase()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">PROMISSÁRIO</p>
                              <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[200px]">{os.customerName}</p>
                            </div>
                            <Button 
                              onClick={() => handleEmitClick('os', os)}
                              disabled={!fiscalConfig}
                              className={cn(
                                "h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                !fiscalConfig ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20"
                              )}
                              rightIcon={<ArrowRight className="w-4 h-4" />}
                            >
                              EMITIR NOTA
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
