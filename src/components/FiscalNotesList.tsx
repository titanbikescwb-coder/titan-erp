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
      alert('Erro ao consultar status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (noteId: string) => {
    const motive = prompt('Por favor, informe a justificativa do cancelamento (mínimo 15 caracteres):');
    if (!motive) return;
    if (motive.length < 15) {
      alert('A justificativa deve ter no mínimo 15 caracteres.');
      return;
    }

    setActionLoading(noteId);
    try {
      await fiscalService.cancelNote(noteId, motive);
      const data = await fiscalService.getNotes();
      setNotes(data);
      alert('Cancelamento solicitado com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao cancelar nota');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShareWhatsApp = (note: FiscalNote) => {
    if (!note.danfe) {
      alert('Nota sem PDF disponível para compartilhamento.');
      return;
    }

    const phone = note.cliente.telefone || '';
    const template = config?.whatsappMessage || "Olá! Segue sua nota fiscal № [numero]. Você pode baixar o PDF aqui: [link]";
    
    let message = template
      .replace('[numero]', note.numeroNota.toString())
      .replace('[link]', note.danfe);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.location.href = whatsappUrl;
  };

  const handleShareEmail = (note: FiscalNote) => {
    if (!note.cliente.email) {
      alert('Cliente não possui e-mail cadastrado.');
      return;
    }
    if (!note.danfe) {
       alert('Nota sem PDF disponível para compartilhamento.');
       return;
    }

    const subject = `Nota Fiscal № ${note.numeroNota} - ${config?.razaoSocial || 'Nossa Empresa'}`;
    const body = `Olá ${note.cliente.nome},\n\nSegue o link para baixar sua nota fiscal eletrônica № ${note.numeroNota}.\n\nVisualizar DANFE: ${note.danfe}\n\nAtenciosamente,\n${config?.razaoSocial || 'Equipe'}`;
    
    window.location.href = `mailto:${note.cliente.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendToContador = () => {
    if (!config?.contadorEmail) {
      alert('E-mail do contador não configurado. Vá em Configurações.');
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou número da nota..."
            className="bg-transparent flex-1 outline-none text-sm font-medium text-slate-600 dark:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <Button
            variant={filterTipo === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilterTipo('all')}
            className={cn(
              "h-10 shadow-sm",
              filterTipo === 'all' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700 font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            Todos
          </Button>
          <Button
            variant={filterTipo === 'nfe' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilterTipo('nfe')}
            className={cn(
              "h-10 shadow-sm",
              filterTipo === 'nfe' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700 font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            NF-e
          </Button>
          <Button
            variant={filterTipo === 'nfce' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilterTipo('nfce')}
            className={cn(
              "h-10 shadow-sm",
              filterTipo === 'nfce' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm hover:bg-white dark:hover:bg-slate-700 font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            NFC-e
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSendToContador}
            variant="success"
            className="h-14 px-6 shadow-lg shadow-emerald-100 dark:shadow-none"
            leftIcon={<Mail className="w-4 h-4" />}
          >
            Contador
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Emissão</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-3">
                       <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando notas...</p>
                     </div>
                   </td>
                </tr>
              ) : filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">
                    Nenhuma nota fiscal encontrada.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note.id} className="transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase",
                             note.tipo === 'nfe' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                           )}>
                             {note.tipo}
                           </div>
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <p className="text-sm font-black text-slate-900 dark:text-white leading-none">№ {note.numeroNota}</p>
                               {note.focusStatus === 'simulado_sucesso' && (
                                 <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[7px] font-black uppercase rounded-[4px] tracking-widest">Simulado</span>
                               )}
                             </div>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Série {note.serie}</p>
                           </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                       <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-none mb-1">
                         {format(note.dataEmissao.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                       </p>
                       <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                         {format(note.dataEmissao.toDate(), "HH:mm", { locale: ptBR })}
                       </p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
                         {note.cliente.nome}
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold tracking-widest truncate max-w-[200px]">
                         {note.cliente.documento}
                       </p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap font-black text-slate-900 dark:text-white">
                      {formatCurrency(note.total)}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col items-center">
                          <div className={cn(
                            "px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                            note.status === 'emitida' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            note.status === 'cancelada' ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                            note.status === 'erro' ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                            "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                          )}>
                            {getStatusIcon(note.status)}
                            {getStatusLabel(note.status)}
                          </div>
                          {note.errorMessage && (
                            <span className="text-[8px] text-red-400 font-bold mt-1 text-center max-w-[120px]">{note.errorMessage}</span>
                          )}
                          {note.chaveAcesso && !note.errorMessage && (
                             <span className="text-[8px] text-slate-400 font-mono mt-1 opacity-60">Chave: {note.chaveAcesso.substring(0, 10)}...</span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 transition-opacity">
                          {/* Refresh Status */}
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefreshStatus(note.id!)}
                            disabled={actionLoading === note.id}
                            className={cn(
                              "p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-indigo-500 transition-all border border-transparent shadow-sm",
                              actionLoading === note.id && "animate-spin"
                            )}
                            title="Sincronizar com SEFAZ"
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                          />

                          {/* WhatsApp */}
                          {note.danfe && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleShareWhatsApp(note)}
                               className="p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-emerald-600 transition-all border border-transparent shadow-sm font-bold"
                               title="Enviar por WhatsApp"
                               leftIcon={<MessageCircle className="w-4 h-4" />}
                             />
                          )}

                          {/* Email Cliente */}
                          {note.danfe && note.cliente.email && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleShareEmail(note)}
                               className="p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-sky-600 transition-all border border-transparent shadow-sm font-bold"
                               title="Enviar por E-mail ao Cliente"
                               leftIcon={<Mail className="w-4 h-4" />}
                             />
                          )}

                          {/* PDF Download */}
                          {note.danfe && (
                             <Button
                               variant="ghost"
                               size="sm"
                               as="a"
                               href={note.danfe} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-blue-500 transition-all border border-transparent shadow-sm flex items-center justify-center font-bold"
                               title="Visualizar DANFE (PDF)"
                               leftIcon={<FileText className="w-4 h-4" />}
                             />
                          )}

                          {/* XML Download */}
                          {note.xml && (
                             <Button
                               variant="ghost"
                               size="sm"
                               as="a"
                               href={`https://api.focusnfe.com.br${note.xml}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-emerald-600 transition-all border border-transparent shadow-sm flex items-center justify-center font-bold"
                               title="Baixar XML"
                               leftIcon={<Download className="w-4 h-4" />}
                             />
                          )}

                          {note.status === 'emitida' && (
                             <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(note.id!)}
                              disabled={actionLoading === note.id}
                              className="p-2.5 h-auto bg-white dark:bg-slate-800 rounded-xl text-red-500 transition-all border border-transparent shadow-sm font-bold" 
                              title="Cancelar Nota"
                              leftIcon={<Ban className="w-4 h-4" />}
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
