import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ShieldCheck,
  Search,
  UserCircle,
  Clock,
  Activity,
  Monitor,
  RefreshCw,
  FileText,
  Filter
} from 'lucide-react';

import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action?: string;
  module?: string;
  details?: string;
  metadata?: any;
  createdAt?: any;
  timestamp?: any;
  deviceInfo?: string;
  platform?: string;
  sessionType?: string;
}

const formatDate = (value: any) => {
  try {
    if (!value) return '—';

    const date = value?.toDate ? value.toDate() : new Date(value);

    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
};

export default function LogsAuditoria() {
  const { isAdmin } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('todos');

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'logs'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as AuditLog[];

        setLogs(data);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar logs:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const modules = useMemo(() => {
    const unique = new Set<string>();

    logs.forEach((log) => {
      if (log.module) unique.add(log.module);
    });

    return Array.from(unique).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return logs.filter((log) => {
      const matchesModule =
        moduleFilter === 'todos' || log.module === moduleFilter;

      const text = [
        log.userName,
        log.userEmail,
        log.action,
        log.module,
        log.details,
        log.platform,
        log.sessionType
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || text.includes(term);

      return matchesModule && matchesSearch;
    });
  }, [logs, searchTerm, moduleFilter]);

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card-premium rounded-[36px] border border-red-500/20 p-10 max-w-md text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
            Acesso Restrito
          </h1>

          <p className="text-white/40 text-sm font-bold leading-relaxed">
            A auditoria do sistema é exclusiva para administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
            <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
              Auditoria
            </h1>

            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
                Logs Operacionais • Segurança • Rastreabilidade
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">
              Registros
            </p>
            <p className="text-lg font-black text-white leading-none mt-1">
              {filteredLogs.length}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setModuleFilter('todos');
            }}
            className="h-12 px-5 rounded-2xl bg-titan-primary text-white text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
          <input
            type="text"
            placeholder="FILTRAR POR OPERADOR, AÇÃO, MÓDULO OU DETALHES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 rounded-[24px] border border-titan-border bg-black/40 text-white focus:ring-4 focus:ring-titan-primary/10 outline-none transition-all uppercase text-[11px] font-black tracking-[0.25em] placeholder:text-titan-text-secondary/50 shadow-inner"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-text-secondary" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full pl-14 pr-8 py-6 rounded-[24px] border border-titan-border bg-black/40 text-white focus:ring-4 focus:ring-titan-primary/10 outline-none transition-all text-[11px] font-black uppercase tracking-[0.2em] appearance-none"
          >
            <option value="todos">Todos os módulos</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-premium rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden">
        {loading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-5">
            <div className="w-12 h-12 rounded-full border-4 border-titan-primary border-t-transparent animate-spin" />
            <p className="text-[10px] text-white font-black uppercase tracking-[0.35em]">
              Carregando auditoria...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-28 flex flex-col items-center justify-center gap-5 text-center px-6">
            <FileText className="w-14 h-14 text-white/20" />
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              Nenhum log encontrado
            </h3>
            <p className="text-white/40 text-sm font-bold max-w-md">
              Faça ações no sistema ou ajuste os filtros para visualizar registros de auditoria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log) => {
              const dateValue = log.createdAt || log.timestamp;

              return (
                <div
                  key={log.id}
                  className="p-6 md:p-8 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex items-start gap-5 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-titan-primary/10 border border-titan-primary/20 flex items-center justify-center shrink-0">
                        <Activity className="w-7 h-7 text-titan-primary" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {log.action || 'Ação registrada'}
                          </h3>

                          <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-titan-primary uppercase tracking-[0.2em]">
                            {log.module || 'Sistema'}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-white/50 leading-relaxed break-words">
                          {log.details || 'Sem detalhes adicionais.'}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-5">
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/35 uppercase tracking-[0.18em]">
                            <UserCircle className="w-4 h-4 text-titan-primary" />
                            {log.userName || log.userEmail || 'Operador'}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-black text-white/35 uppercase tracking-[0.18em]">
                            <Clock className="w-4 h-4 text-titan-primary" />
                            {formatDate(dateValue)}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-black text-white/35 uppercase tracking-[0.18em]">
                            <Monitor className="w-4 h-4 text-titan-primary" />
                            {log.platform || 'Plataforma não identificada'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:text-right shrink-0">
                      <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em] mb-2">
                        Sessão
                      </p>
                      <span
                        className={cn(
                          "inline-flex px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                          log.sessionType === 'authenticated'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {log.sessionType || 'authenticated'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
