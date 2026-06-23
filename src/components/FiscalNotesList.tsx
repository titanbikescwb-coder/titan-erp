import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { FiscalNote, FiscalConfig } from '../domain/types';
import { fiscalService } from '../services/fiscalService';
import { 
  History, 
  Search, 
  Filter, 
  FileCheck, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  Ban,
  MoreVertical,
  RefreshCw,
  FileText,
  MessageCircle,
  Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  config: FiscalConfig | null;
}

export default function FiscalNotesList({ config }: Props) {
  const [notes, setNotes] = useState<FiscalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'nfe' | 'nfce'>('all');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await fiscalService.getNotes();
      setNotes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async (noteId: string) => {
    setActionLoading(noteId);
    try {
      await fiscalService.checkStatus(noteId);
      // Refresh local list
      const data = await fiscalService.getNotes();
      setNotes(data);
    } catch (error) {
  toast.error('Erro ao consultar status.');
} finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (noteId: string) => {
    const motive = prompt('Por favor, informe a justificativa do cancelamento (mínimo 15 caracteres):');
    if (!motive) return;
    if (motive.length < 15) {
     toast('A justificativa deve ter pelo menos 15 caracteres.');
return;
}

    setActionLoading(noteId);
    try {
      await fiscalService.cancelNote(noteId, motive);
      const data = await fiscalService.getNotes();
      setNotes(data);
      toast.success('Cancelamento da nota solicitado.');
    } catch (error: any) {
  toast.error(error.message || 'Erro ao cancelar nota.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShareWhatsApp = (note: FiscalNote) => {
    if (!note.danfe) {
  toast('PDF da nota não está disponível para compartilhamento.');
  return;
}

    const phone = note.cliente.telefone || '';
    const template = config?.whatsappMessage || "Olá! Segue sua nota fiscal número [numero]. Você pode baixar o PDF aqui: [link]";
    
    let message = template
      .replace('[numero]', note.numeroNota.toString())
      .replace('[link]', note.danfe);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.location.href = whatsappUrl;
  };

  const handleShareEmail = (note: FiscalNote) => {
  if (!note.cliente.email) {
    toast('Cliente não possui e-mail cadastrado.');
    return;
  }

  if (!note.danfe) {
    toast('PDF da nota não está disponível para compartilhamento.');
    return;
  }
    const subject = `Nota Fiscal N° ${note.numeroNota} - ${config?.razaoSocial || 'Nossa Empresa'}`;
    const body = `Olá ${note.cliente.nome},\n\nSegue o link para baixar sua nota fiscal eletrônica N° ${note.numeroNota}.\n\nVisualizar DANFE: ${note.danfe}\n\nAtenciosamente,\n${config?.razaoSocial || 'Equipe'}`;
    
    window.location.href = `mailto:${note.cliente.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendToContador = () => {
    if (!config?.contadorEmail) {
  toast('Configure o e-mail do contador em Configurações.');
  return;
}

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthName = lastMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const subject = `Relatório Fiscal - ${monthName}`;
    const body = `Olá,\n\nSegue o link para acesso ao dashboard de notas fiscais emitidas no período de ${monthName}.\n\nTotal de Notas: ${notes.length}\nValor Total: ${formatCurrency(notes.reduce((acc, n) => acc + n.total, 0))}\n\nPor favor, acesse o sistema para baixar os XMLs necessários.`;
    
    const mailtoUrl = `mailto:${config.contadorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.numeroNota.toString().includes(searchTerm);
    const matchesTipo = filterTipo === 'all' || n.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const getStatusIcon = (status: FiscalNote['status']) => {
    switch (status) {
      case 'emitida': return <FileCheck className="w-4 h-4 text-emerald-500" />;
      case 'cancelada': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pendente': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'erro': return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: FiscalNote['status']) => {
    switch (status) {
      case 'emitida': return 'Autorizada';
      case 'cancelada': return 'Cancelada';
      case 'pendente': return 'Processando';
      case 'erro': return 'Rejeitada';
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 flex items-center gap-4 bg-black/40 p-6 rounded-[32px] border border-titan-border shadow-inner group">
          <Search className="w-6 h-6 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors ml-2" />
          <input 
            type="text" 
            placeholder="BUSCAR POR CLIENTE OU NÚMERO DA NOTA..."
            className="bg-transparent flex-1 outline-none text-[11px] font-black text-white placeholder:text-titan-text-secondary/30 uppercase tracking-[0.2em]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex p-1.5 bg-black/40 rounded-[24px] border border-titan-border shadow-inner">
          <Button
            variant={filterTipo === 'all' ? 'primary' : 'ghost'}
            onClick={() => setFilterTipo('all')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filterTipo === 'all' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filterTipo === 'nfe' ? 'primary' : 'ghost'}
            onClick={() => setFilterTipo('nfe')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filterTipo === 'nfe' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
          >
            NF-e
          </Button>
          <Button
            variant={filterTipo === 'nfce' ? 'primary' : 'ghost'}
            onClick={() => setFilterTipo('nfce')}
            className={cn(
              "flex-1 h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filterTipo === 'nfce' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-titan-text-secondary hover:bg-white/5"
            )}
          >
            NFC-e
          </Button>
        </div>

        <Button
          onClick={handleSendToContador}
          className="h-14 px-8 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20"
          leftIcon={<Mail className="w-4 h-4" />}
        >
          Contador
        </Button>
      </div>

      <div className="card-premium rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-titan-border">
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">Nota</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">Emissão</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">Valor</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em] text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center gap-4">
                       <div className="w-10 h-10 border-4 border-titan-primary border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Sincronizando notas...</p>
                     </div>
                   </td>
                </tr>
              ) : filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="w-12 h-12 text-white/20" />
                      <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Nenhuma nota fiscal encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note.id} className="transition-all duration-300 hover:bg-white/[0.02] group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase border",
                             note.tipo === 'nfe' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                           )}>
                             {note.tipo}
                           </div>
                           <div>
                             <div className="flex items-center gap-3 mb-1">
                               <p className="text-base font-black text-white leading-none tracking-tight">N° {note.numeroNota}</p>
                               {note.focusStatus === 'simulado_sucesso' && (
                                 <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase rounded-md tracking-widest shadow-xl shadow-amber-500/10">Simulado</span>
                               )}
                             </div>
                             <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">SÉRIE {note.serie}</p>
                           </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                       <p className="text-sm font-black text-white leading-none mb-1 uppercase tracking-tight">
                         {format(note.dataEmissao.toDate(), "dd 'DE' MMM", { locale: ptBR })}
                       </p>
                       <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">
                         {format(note.dataEmissao.toDate(), "HH:mm", { locale: ptBR })}
                       </p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px] mb-1">
                         {note.cliente.nome}
                       </p>
                       <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] truncate max-w-[200px]">
                         {note.cliente.documento}
                       </p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap font-black text-white text-lg tracking-tighter">
                      {formatCurrency(note.total)}
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col items-center">
                          <div className={cn(
                            "px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all",
                            note.status === 'emitida' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            note.status === 'cancelada' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            note.status === 'erro' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>
                            {getStatusIcon(note.status)}
                            {getStatusLabel(note.status)}
                          </div>
                          {note.errorMessage && (
                            <span className="text-[8px] text-red-400 font-bold mt-2 text-center max-w-[140px] uppercase tracking-tight leading-tight">{note.errorMessage}</span>
                          )}
                          {note.chaveAcesso && !note.errorMessage && (
                             <span className="text-[8px] text-white font-mono mt-2 opacity-30 uppercase tracking-widest">Chave: {note.chaveAcesso.substring(0, 10)}...</span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-end gap-3">
                          {/* Refresh Status */}
                          <Button 
                            variant="ghost"
                            onClick={() => handleRefreshStatus(note.id!)}
                            disabled={actionLoading === note.id}
                            className={cn(
                              "w-12 h-12 bg-black/40 rounded-xl text-titan-primary transition-all border border-titan-border shadow-2xl hover:scale-110",
                              actionLoading === note.id && "animate-spin"
                            )}
                            title="Sincronizar com SEFAZ"
                            leftIcon={<RefreshCw className="w-5 h-5" />}
                          />

                          {/* XML Download */}
                          {note.xml && (
                             <Button
                               variant="ghost"
                               as="a"
                               href={`https://api.focusnfe.com.br${note.xml}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="w-12 h-12 bg-black/40 rounded-xl text-emerald-500 transition-all border border-titan-border shadow-2xl hover:scale-110"
                               title="Baixar XML"
                               leftIcon={<Download className="w-5 h-5" />}
                             />
                          )}

                          {/* PDF Download */}
                          {note.danfe && (
                             <Button
                               variant="ghost"
                               as="a"
                               href={note.danfe} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="w-12 h-12 bg-black/40 rounded-xl text-titan-primary transition-all border border-titan-border shadow-2xl hover:scale-110"
                               title="Visualizar DANFE (PDF)"
                               leftIcon={<FileText className="w-5 h-5" />}
                             />
                          )}

                          {/* WhatsApp */}
                          {note.danfe && (
                             <Button
                               variant="ghost"
                               onClick={() => handleShareWhatsApp(note)}
                               className="w-12 h-12 bg-black/40 rounded-xl text-emerald-500 transition-all border border-titan-border shadow-2xl hover:scale-110"
                               title="Enviar por WhatsApp"
                               leftIcon={<MessageCircle className="w-5 h-5" />}
                             />
                          )}

                          {note.status === 'emitida' && (
                             <Button 
                              variant="ghost"
                              onClick={() => handleCancel(note.id!)}
                              disabled={actionLoading === note.id}
                              className="w-12 h-12 bg-black/40 rounded-xl text-red-500 transition-all border border-titan-border shadow-2xl hover:scale-110" 
                              title="Cancelar Nota"
                              leftIcon={<Ban className="w-5 h-5" />}
                             />
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
