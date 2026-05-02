import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  DollarSign, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Target,
  Funnel
} from 'lucide-react';
import { crmService, Lead, LeadStatus } from '../services/crmService';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

const COLUMNS: { id: LeadStatus, label: string, color: string }[] = [
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
    if (!user) return;
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

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Target className="w-8 h-8 text-titan-primary" />
            CRM & Funil de Vendas
          </h1>
          <p className="text-white/40 font-medium">Gestão de leads e prospecção ativa</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-titan-primary hover:bg-titan-primary/90 text-white shadow-lg shadow-titan-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter(l => l.status === col.id);
            const colTotal = colLeads.reduce((sum, l) => sum + (l.value || 0), 0);

            return (
              <div key={col.id} className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-black text-white uppercase tracking-widest">{col.label}</span>
                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full font-black">
                      {colLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20">{formatCurrency(colTotal)}</span>
                </div>

                <div className="flex-1 bg-white/5 rounded-2xl p-3 space-y-3 min-h-[500px]">
                  <AnimatePresence>
                    {colLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layoutId={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#020617] border border-white/5 p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:border-titan-primary/30 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-black text-white group-hover:text-titan-primary transition-colors">{lead.name}</h3>
                          <button className="text-white/20 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold mb-3 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </span>
                        </div>

                        {lead.value && (
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-sm font-black text-white tracking-tighter">
                              {formatCurrency(lead.value)}
                            </span>
                            <div className="flex gap-1">
                              {COLUMNS.filter(c => c.id !== lead.status).slice(0, 2).map(next => (
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
                      <span className="text-[10px] font-black text-white/5 uppercase tracking-widest">Vazio</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
