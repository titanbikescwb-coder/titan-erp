import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search, 
  Calendar,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { commissionService } from '../services/commissionService';
import { useAuth } from '../hooks/useAuth';
import { Commission } from '../domain/types';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Comissoes() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = commissionService.subscribeAll(user.uid, (data) => {
      setCommissions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredCommissions = commissions.filter(c => 
    c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.saleNumber.toString().includes(searchTerm)
  );

  const totalPendente = commissions.reduce((sum, c) => sum + c.amount, 0);

  const handlePay = async (id: string) => {
    if (confirm('Marcar esta comissão como paga?')) {
      try {
        await commissionService.payCommission(id);
      } catch (error) {
        console.error('Error paying commission:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Users className="w-8 h-8 text-titan-primary" />
            Comissões & Produtividade
          </h1>
          <p className="text-white/40 font-medium">Cálculo de comissões para mecânicos e vendedores</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none">Total Pendente</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            {formatCurrency(totalPendente)}
          </p>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-titan-primary" />
            <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-none">Colaboradores ativos</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            {Array.from(new Set(commissions.map(c => c.employeeId))).length}
          </p>
        </div>
        <div className="card-premium p-6 flex flex-col justify-center">
          <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">Média de Comissão</span>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            {commissions.length > 0 ? `${(commissions.reduce((acc, c) => acc + c.percentage, 0) / commissions.length).toFixed(1)}%` : '0%'}
          </p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Buscar por colaborador ou número da venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Ref. Venda/OS</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Perc.</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCommissions.length > 0 ? (
                filteredCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{c.employeeName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-white/60">#{c.saleNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 font-bold">
                      {format(c.timestamp.toDate(), 'dd/MM/yy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-white/40">{c.percentage}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-emerald-500">
                        {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-amber-500 tracking-widest">
                       Pendente
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePay(c.id!)}
                        className="text-white/40 hover:text-emerald-500"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Pagar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/20">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Nenhuma comissão pendente</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
