import { Wallet, Receipt, BarChart3 } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface DashboardFinanceProps {
  todayTotal: number;
  monthTotal: number;
  totalPayments: number;
  formatCurrency: (value: number) => string;
}

const DashboardFinance = ({
  todayTotal,
  monthTotal,
  totalPayments,
  formatCurrency,
}: DashboardFinanceProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <StatCard
        title="Caixa Hoje"
        value={formatCurrency(todayTotal)}
        subtitle="Movimentação diária"
        icon={Wallet}
      />

      <StatCard
        title="Faturamento Mensal"
        value={formatCurrency(monthTotal)}
        subtitle="Resultado do mês"
        icon={BarChart3}
      />

      <StatCard
        title="Pagamentos"
        value={formatCurrency(totalPayments)}
        subtitle="Total processado"
        icon={Receipt}
      />
    </div>
  );
};

export { DashboardFinance };