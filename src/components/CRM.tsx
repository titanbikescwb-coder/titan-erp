import React, { useState, useEffect } from 'react';
import { 
  Users,
  Plus,
  Phone,
  DollarSign,
  MoreVertical,
  ChevronRight,
  Target,
  BarChart2,
  Zap
} from 'lucide-react';
import { crmService, Lead, LeadStatus } from '../services/crmService';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';
import CardPadrao from './ui/CardPadrao';
import { motion, AnimatePresence } from 'motion/react';

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'novo', label: 'Novos', color: 'bg-blue-500' },
  { id: 'contato', label: 'Em Contato', color: 'bg-amber-500' },
  { id: 'proposta', label: 'Proposta', color: 'bg-purple-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-emerald-500' },
  { id: 'perdido', label: 'Perdido', color: 'bg-rose-500' }
];

export default function CRM() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = crmService.subscribeAll(user.uid, (data) => {
      setLeads(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const moveLead = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await crmService.updateStatus(leadId, newStatus);
    } catch (error) {
      console.error('Error moving lead:', error);
    }
  };

  const totalPipeline = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const closedLeads = leads.filter((lead) => lead.status === 'fechado').length;
  const conversionRate = leads.length > 0 ? (closedLeads / leads.length) * 100 : 0;
  const averageTicket = leads.length > 0 ? totalPipeline / leads.length : 0;

  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wider uppercase flex items-center gap-3">
            <Target className="w-8 h-8 text-titan-primary" />
            CRM & Funil de Vendas
          </h1>
          <p className="text-white/40 font-medium">Gestão de leads e prospecção ativa</p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-titan-primary hover:bg-titan-primary/90 text-white shadow-lg shadow-titan-primary/20 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <CardPadrao
          title="Total de Oportunidades"
          value={leads.length}
          icon={Users}
          iconColor="text-titan-primary"
          iconBgColor="bg-titan-primary/10"
          onClick={() => toast(`Leads no funil: ${leads.length}`)}
        />
        <CardPadrao
          title="Pipeline Total"
          value={totalPipeline}
          isCurrency
          icon={DollarSign}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
          onClick={() => toast(`Valor total do pipeline: ${formatCurrency(totalPipeline)}`)}
        />
        <CardPadrao
          title="Conversão"
          value={conversionRate}
          isPercentage
          indicator={conversionRate}
          icon={BarChart2}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          onClick={() => toast('Métricas detalhadas estarão disponíveis em breve.')}
        />
        <CardPadrao
          title="Ticket Médio"
          value={averageTicket}
          isCurrency
          icon={Zap}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          onClick={() => toast(`Ticket médio: ${formatCurrency(averageTicket)}`)}
        />
      </div>

      {loading ? (
        <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/5">
          <div className="w-12 h-12 border-4 border-titan-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/40">
            Carregando CRM...
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="grid grid-flow-col auto-cols-[280px] sm:auto-cols-[320px] lg:auto-cols-[340px] gap-4 min-h-[560px]">
            {COLUMNS.map((col) => {
              const colLeads = leads.filter((lead) => lead.status === col.id);
              const colTotal = colLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

              return (
                <div key={col.id} className="w-full flex flex-col gap-4 min-w-0">
                  <div className="flex items-center justify-between px-2 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${col.color} shrink-0`} />
                      <span className="text-xs font-black text-white uppercase tracking-widest truncate">
                        {col.label}
                      </span>
                      <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-black shrink-0">
                        {colLeads.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-white/20 whitespace-nowrap">
                      {formatCurrency(colTotal)}
                    </span>
                  </div>

                  <div className="flex-1 bg-white/5 rounded-2xl p-3 space-y-3 min-h-[500px] border border-white/5 overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {colLeads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          layoutId={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-[#020617] border border-white/5 p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-titan-primary/30 transition-colors group min-w-0"
                        >
                          <div className="flex justify-between items-start gap-3 mb-2 min-w-0">
                            <h3 className="text-sm font-black text-white group-hover:text-titan-primary transition-colors break-words leading-tight min-w-0">
                              {lead.name}
                            </h3>
                            <button className="text-white/20 hover:text-white shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold mb-3 uppercase tracking-wider min-w-0">
                            <span className="flex items-center gap-1 min-w-0">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.phone || 'Sem telefone'}</span>
                            </span>
                          </div>

                          {lead.value && (
                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                              <span className="text-sm font-black text-white tracking-tighter whitespace-nowrap">
                                {formatCurrency(lead.value)}
                              </span>
                              <div className="flex gap-1 shrink-0">
                                {COLUMNS.filter((column) => column.id !== lead.status).slice(0, 2).map((next) => (
                                  <button
                                    key={next.id}
                                    onClick={() => moveLead(lead.id!, next.id)}
                                    className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white transition-colors"
                                    title={`Mover para ${next.label}`}
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {colLeads.length === 0 && (
                      <div className="h-20 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Vazio</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0A0A0B] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                Novo Lead
              </h2>
              <p className="text-sm text-white/40 mb-8">
                O modal de cadastro ainda depende da implementação atual do serviço de CRM.
              </p>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="w-full h-12 rounded-2xl bg-titan-primary text-white font-black uppercase tracking-widest text-[10px]"
              >
                Fechar
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
