import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Phone, 
  Calendar, 
  Clock, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  Send,
  History,
  Bike
} from 'lucide-react';
import { ServiceOrder, Customer } from '../domain/types';
import { ordemServicoService } from '../services/ordemServicoService';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface RetentionLead {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  lastVisit: Date;
  daysSinceLastVisit: number;
  lastBike: string;
  totalServices: number;
}

export default function MarketingRetencao() {
  const [os, setOs] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(120);

  useEffect(() => {
    const unsubOs = ordemServicoService.getServiceOrders(setOs);
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    
    return () => {
      unsubOs();
      unsubCustomers();
    };
  }, []);

  const retentionLeads: RetentionLead[] = React.useMemo(() => {
    const leads: { [key: string]: RetentionLead } = {};

    os.forEach(order => {
      if (!order.customerId) return;
      
      const orderDate = new Date(order.entryDate);
      
      if (!leads[order.customerId] || orderDate > leads[order.customerId].lastVisit) {
        leads[order.customerId] = {
          customerId: order.customerId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          lastVisit: orderDate,
          daysSinceLastVisit: Math.floor((new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)),
          lastBike: order.bikeDetails || 'Não informado',
          totalServices: os.filter(o => o.customerId === order.customerId).length
        };
      }
    });

    return Object.values(leads).filter(l => l.daysSinceLastVisit >= filterDays).sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
  }, [os, filterDays]);

  const sendReminder = (lead: RetentionLead) => {
    const message = `Olá ${lead.customerName}! Notamos que faz ${lead.daysSinceLastVisit} dias que você não visita a nossa oficina de bicicletas. Sua bicicleta ${lead.lastBike} pode estar precisando de uma revisão preventiva. Vamos agendar um horário?`;
    const encoded = encodeURIComponent(message);
    const phone = lead.customerPhone ? lead.customerPhone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-titan-primary" />
            Marketing de Retenção
          </h1>
          <p className="text-white/40 font-medium">Reconquiste clientes que não visitam a oficina há algum tempo</p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {[60, 90, 120, 180].map(days => (
            <button
              key={days}
              onClick={() => setFilterDays(days)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                filterDays === days 
                  ? "bg-titan-primary text-white shadow-lg shadow-titan-primary/20"
                  : "text-white/40 hover:text-white"
              )}
            >
              {days} Dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="text-2xl font-black text-white">{retentionLeads.length}</h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Clientes Inativos</p>
        </div>
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
            <History className="w-8 h-8 text-amber-400 mb-2" />
            <h3 className="text-2xl font-black text-white">
                {retentionLeads.length > 0 ? Math.floor(retentionLeads.reduce((a, b) => a + b.daysSinceLastVisit, 0) / retentionLeads.length) : 0}
            </h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Média Dias Ausentes</p>
        </div>
        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
            <UserCheck className="w-8 h-8 text-emerald-400 mb-2" />
            <h3 className="text-2xl font-black text-white">12%</h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Taxa de Conversão Prevista</p>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        <AnimatePresence>
          {retentionLeads.map((lead) => (
            <motion.div
              layout
              key={lead.customerId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="break-inside-avoid bg-[#020617] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-titan-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-titan-primary/10 text-titan-primary p-2 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">
                    Ausente há {lead.daysSinceLastVisit} dias
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{lead.customerName}</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1 mb-4">
                <Bike className="w-3 h-3" />
                Última Bike: {lead.lastBike}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-white/20 uppercase mb-1">Última Visita</p>
                    <p className="text-xs font-bold text-white">{lead.lastVisit.toLocaleDateString()}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-white/20 uppercase mb-1">Total Visitas</p>
                    <p className="text-xs font-bold text-white">{lead.totalServices} vezes</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => sendReminder(lead)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest h-11"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-11"
                >
                  Agendar
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {retentionLeads.length === 0 && (
          <div className="col-span-full py-20 text-center card-premium">
            <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white uppercase truncate">Nenhum cliente esquecido!</h3>
            <p className="text-white/40 font-medium">Todos os seus clientes visitaram a oficina nos últimos {filterDays} dias.</p>
          </div>
        )}
      </div>
    </div>
  );
}
