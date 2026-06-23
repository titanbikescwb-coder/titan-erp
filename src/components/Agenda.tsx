import { toast } from 'react-hot-toast';
import { AgendaStats } from "./agenda/AgendaStats";
import { AgendaHeader } from "./agenda/AgendaHeader";
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Bike, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Search,
  Filter
} from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  isSameDay, 
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../services/appointmentService';
import { ordemServicoService } from '../services/ordemServicoService';
import { useAuth } from '../hooks/useAuth';
import { Appointment, ServiceOrder } from '../domain/types';
import { Button } from './ui/Button';
import CardPadrao from './ui/CardPadrao';
import {
  PageContainer,
  PageHeader,
  GridPadrao,
  BadgePadrao,
  FilterBar
} from './ui';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const APPOINTMENT_STATUS_COLORS = {
  agendado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  em_atendimento: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  concluido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  faltou: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  cancelado: 'bg-white/5 text-white/40 border-white/10'
};

const OS_STATUS_COLORS = {
  aberto: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  em_andamento: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  finalizado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  entregue: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};


const toDateSafe = (value: any): Date => {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};


export default function Agenda() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newApp, setNewApp] = useState({
    customerId: 'guest',
    bikeId: '',
    customerName: '',
    customerPhone: '',
    bikeDetails: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    serviceDescription: '',
    status: 'agendado' as Appointment['status']
  });

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingAppointment) {
        await appointmentService.update(editingAppointment.id, {
          ...newApp,
       date: parseISO(newApp.date),
} as any);

toast.success('Agendamento atualizado.');
} else {
  await appointmentService.create({
    ...newApp,
    date: parseISO(newApp.date),
    userId: user?.uid || profile?.uid || 'admin',
    createdAt: new Date()
  } as any);

  toast.success('Agendamento criado.');
}
      setIsModalOpen(false);
      setEditingAppointment(null);
      setNewApp({
        customerId: 'guest',
        bikeId: '',
        customerName: '',
        customerPhone: '',
        bikeDetails: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        serviceDescription: '',
        status: 'agendado'
      });
    } catch (error: any) {
      console.error('Error saving appointment:', error);
toast.error(error.message || 'Erro ao salvar agendamento.');
} finally {
      setLoading(false);
    }
  };

  const handleEditClick = (app: Appointment) => {
    const appDate = toDateSafe(app.date);
    setNewApp({
      customerId: app.customerId || 'guest',
      bikeId: app.bikeId || '',
      customerName: app.customerName,
      customerPhone: app.customerPhone || '',
      bikeDetails: app.bikeDetails || '',
      date: format(appDate, 'yyyy-MM-dd'),
      startTime: app.startTime,
      serviceDescription: app.serviceDescription || '',
      status: app.status
    });
    setEditingAppointment(app);
    setIsModalOpen(true);
  };

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to Appointments
    const unsubApp = appointmentService.subscribeAll(user?.uid || profile?.uid || 'admin', (data) => {
      setAppointments(data);
    });

    // Subscribe to Service Orders
    const unsubOS = ordemServicoService.getServiceOrders((data) => {
      setServiceOrders(data);
      setLoading(false);
    });

    return () => {
      unsubApp();
      unsubOS();
    };
  }, [user]);

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.bikeDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.serviceDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm !== '') return matchesSearch;

    const appDate = toDateSafe(app.date);
    const matchesDate = isSameDay(appDate, selectedDate);
    return matchesDate;
  });

  const filteredOS = serviceOrders.filter(os => {
    const matchesSearch = searchTerm === '' || 
      os.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.bikeDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.osNumber.toString().includes(searchTerm) ||
      os.problemDescription.toLowerCase().includes(searchTerm.toLowerCase());

    if (searchTerm !== '') return matchesSearch;

    const entryDate = toDateSafe(os.entryDate);
    const exitDate = os.exitDate ? toDateSafe(os.exitDate) : null;
    
    const matchesEntry = isSameDay(entryDate, selectedDate);
    const matchesExit = exitDate && isSameDay(exitDate, selectedDate);
    return matchesEntry || matchesExit;
  });

  const agendaStats = [
  {
    label: 'Agendamentos Hoje',
    value: appointments.filter(app => {
      const appDate = toDateSafe(app.date);
      return isSameDay(appDate, new Date());
    }).length,
    icon: CalendarIcon,
    variant: 'success'
  },

  {
    label: 'Entradas de OS',
    value: serviceOrders.filter(os =>
      isSameDay(toDateSafe(os.entryDate), new Date())
    ).length,
    icon: Wrench,
    variant: 'finance'
  },

  {
    label: 'Entregas Previstas',
    value: serviceOrders.filter(os =>
      os.exitDate &&
      isSameDay(toDateSafe(os.exitDate), new Date())
    ).length,
    icon: CheckCircle2,
    variant: 'analytics'
  },

  {
    label: 'Taxa de Ocupação',
    value: '85%',
    icon: Clock,
    variant: 'warning'
  }
];
  return (
    <PageContainer>
      <AgendaHeader
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  onOpenModal={() => setIsModalOpen(true)}
/>
          
      <AgendaStats
  agendaStats={agendaStats}
  onResetFilters={() => {
    setSelectedDate(new Date());
    setSearchTerm("");
  }}
/>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="bg-white/5 text-white/40 hover:text-white h-10 w-10 p-0 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="text-center min-w-[200px]">
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">
              {isSameDay(selectedDate, new Date()) ? 'Hoje, ' : ''}
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
              {format(selectedDate, "EEEE", { locale: ptBR })}
            </p>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="bg-white/5 text-white/40 hover:text-white h-10 w-10 p-0 rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedDate(new Date())}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-4",
              isSameDay(selectedDate, new Date()) ? "text-titan-primary bg-titan-primary/10" : "text-white/40 hover:text-white"
            )}
          >
            Hoje
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Coluna de Agendamentos */}
        <div className="flex flex-col bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between backdrop-blur-xl">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Agendamentos ({filteredAppointments.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-5 rounded-[28px] border flex flex-col gap-4 bg-black/20 backdrop-blur-xl hover:border-titan-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(10,132,255,0.08)] cursor-pointer group",
                      APPOINTMENT_STATUS_COLORS[app.status]
                    )}
                    onClick={() => handleEditClick(app)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-tight">{app.customerName}</h4>
                          <div className="flex items-center gap-2 text-[10px] opacity-60 font-bold">
                            <Bike className="w-3 h-3" />
                            {app.bikeDetails || 'Não informada'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black opacity-40">{app.startTime}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-30 mt-0.5">{app.status}</div>
                      </div>
                    </div>
                    
                    {app.serviceDescription && (
                      <p className="text-[10px] font-medium opacity-50 line-clamp-2 px-1">
                        {app.serviceDescription}
                      </p>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/10 py-12">
                  <CalendarIcon className="w-12 h-12 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Nenhum agendamento</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna de Ordens de Serviço */}
        <div className="flex flex-col bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between backdrop-blur-xl">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Wrench className="w-4 h-4 text-titan-primary" />
              Movimentações de Serviço ({filteredOS.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredOS.length > 0 ? (
                filteredOS.map((os) => {
                  const isEntry = isSameDay(toDateSafe(os.entryDate), selectedDate);
                  const isDelivery = os.exitDate && isSameDay(toDateSafe(os.exitDate), selectedDate);

                  return (
                    <motion.div
                      key={os.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "p-5 rounded-[28px] border flex flex-col gap-4 bg-black/20 backdrop-blur-xl hover:border-titan-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(10,132,255,0.08)] cursor-pointer group",
                        OS_STATUS_COLORS[os.status]
                      )}
                      onClick={() => navigate(`/servicos?os=${os.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl bg-white/10",
                            isDelivery ? "text-emerald-400" : "text-sky-400"
                          )}>
                            {isDelivery ? <CheckCircle2 className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm uppercase tracking-tight">{os.customerName}</h4>
                              <span className="text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-full">#{os.osNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] opacity-60 font-bold">
                              <Bike className="w-3 h-3" />
                              {os.bikeDetails || 'Não informada'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-widest text-titan-primary mb-0.5">
                            {isDelivery && isEntry ? 'Entrada & Entrega' : isDelivery ? 'Previsão de Entrega' : 'Entrada de OS'}
                          </div>
                          <div className="text-[8px] font-black uppercase tracking-widest opacity-30">{os.status.replace('_', ' ')}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Status</span>
                            <span className="text-[10px] font-bold uppercase">{os.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Total</span>
                            <span className="text-[10px] font-bold">R$ {os.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg bg-white/5">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/10 py-12">
                  <Wrench className="w-12 h-12 mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Sem serviços para este dia</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0B] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateAppointment} className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                    {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </h2>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingAppointment(null);
                    }}
                    className="text-white/40 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Cliente</label>
                      <input
                        required
                        type="text"
                        value={newApp.customerName}
                        onChange={e => setNewApp({ ...newApp, customerName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">WhatsApp</label>
                      <input
                        type="text"
                        value={newApp.customerPhone}
                        onChange={e => setNewApp({ ...newApp, customerPhone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Bicicleta</label>
                    <input
                      type="text"
                      value={newApp.bikeDetails}
                      onChange={e => setNewApp({ ...newApp, bikeDetails: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                      placeholder="Marca / Modelo"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Data</label>
                      <input
                        required
                        type="date"
                        value={newApp.date}
                        onChange={e => setNewApp({ ...newApp, date: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Horário</label>
                      <input
                        required
                        type="time"
                        value={newApp.startTime}
                        onChange={e => setNewApp({ ...newApp, startTime: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Descrição do Serviço</label>
                    <textarea
                      value={newApp.serviceDescription}
                      onChange={e => setNewApp({ ...newApp, serviceDescription: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all h-24 resize-none"
                      placeholder="O que será feito?"
                    />
                  </div>

                  {editingAppointment && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Status</label>
                      <select
                        value={newApp.status}
                        onChange={e => setNewApp({ ...newApp, status: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all"
                      >
                        <option value="agendado">Agendado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="concluido">Concluído</option>
                        <option value="faltou">Faltou</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingAppointment(null);
                    }}
                    className="flex-1 text-white/40 hover:text-white h-14 rounded-2xl uppercase font-black tracking-widest"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-titan-primary hover:bg-titan-primary/90 text-white h-14 rounded-2xl uppercase font-black tracking-widest shadow-lg shadow-titan-primary/20"
                  >
                    {editingAppointment ? 'Salvar Alterações' : 'Confirmar'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

function Hash({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}
