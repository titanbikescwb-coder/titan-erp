import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Search,
  Download,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { commissionService } from '../services/commissionService';
import { useAuth } from '../hooks/useAuth';
import { Commission } from '../domain/types';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';
import CardPadrao from './ui/CardPadrao';
import ModalPadrao from './ui/ModalPadrao';
import { format } from 'date-fns';

export default function Comissoes() {
  const { user } = useAuth();

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [payConfirm, setPayConfirm] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsub = commissionService.subscribeAll(user.uid, (data) => {
      setCommissions(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const filteredCommissions = commissions.filter((c) =>
    c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.saleNumber.toString().includes(searchTerm)
  );

  const selectedCommission = commissions.find((c) => c.id === payConfirm);

  const totalPendente = commissions.reduce((sum, c) => sum + c.amount, 0);

  const handlePay = async () => {
    if (!payConfirm) return;

    try {
      setProcessingPayment(true);

      await commissionService.payCommission(payConfirm);

      toast.success('Comissão marcada como paga');
      setPayConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao pagar comissão');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wider uppercase flex items-center gap-3">
            <Users className="w-8 h-8 text-titan-primary" />
            Comissões & Produtividade
          </h1>

          <p className="text-white/40 font-medium">
            Cálculo de comissões para mecânicos e vendedores
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardPadrao
          title="Total Pendente"
          value={totalPendente}
          isCurrency
          icon={Clock}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
        />

        <CardPadrao
          title="Colaboradores ativos"
          value={Array.from(new Set(commissions.map((c) => c.employeeId))).length}
          icon={Users}
          iconColor="text-titan-primary"
          iconBgColor="bg-titan-primary/10"
        />

        <CardPadrao
          title="Média de Comissão"
          value={
            commissions.length > 0
              ? commissions.reduce((acc, c) => acc + c.percentage, 0) / commissions.length
              : 0
          }
          isPercentage
          icon={TrendingUp}
          iconColor="text-titan-primary"
        />
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
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Colaborador
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Ref. Venda/OS
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Data
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Perc.
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Valor
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredCommissions.length > 0 ? (
                filteredCommissions.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">
                        {c.employeeName}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-white/60">
                        #{c.saleNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-white/40 font-bold">
                      {format(c.timestamp.toDate(), 'dd/MM/yy HH:mm')}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-white/40">
                        {c.percentage}%
                      </span>
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
                        onClick={() => setPayConfirm(c.id!)}
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
                    <p className="font-bold uppercase tracking-widest text-[10px]">
                      Nenhuma comissão pendente
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payConfirm && (
        <ModalPadrao
          open={true}
          onClose={() => setPayConfirm(null)}
          title="PAGAR COMISSÃO"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setPayConfirm(null)}
                className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancelar
              </Button>

              <Button
                loading={processingPayment}
                onClick={handlePay}
                className="flex-1 h-14 rounded-2xl bg-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20"
              >
                Confirmar Pagamento
              </Button>
            </>
          }
        >
          <div className="text-center space-y-8 py-6">
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Confirmar Pagamento?
              </h3>

              <p className="text-[11px] text-titan-text-secondary font-black uppercase tracking-[0.2em] leading-relaxed">
                Deseja marcar esta comissão como paga?
              </p>

              {selectedCommission && (
                <div className="inline-flex flex-col gap-1 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white">
                  <span className="text-sm font-black uppercase tracking-widest">
                    {selectedCommission.employeeName}
                  </span>

                  <span className="text-xs font-black text-emerald-500">
                    {formatCurrency(selectedCommission.amount)}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">
                A comissão sairá da lista de pendências
              </p>
            </div>
          </div>
        </ModalPadrao>
      )}
    </div>
  );
}