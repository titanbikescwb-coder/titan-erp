import {
  TrendingUp,
  ShoppingCart,
  Package,
  Wrench,
} from "lucide-react";

import { StatCard } from "../ui/StatCard";

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        title="Faturamento"
        value="R$ 12.450"
        subtitle="Últimos 30 dias"
        icon={TrendingUp}
      />

      <StatCard
        title="Vendas"
        value="154"
        subtitle="Pedidos finalizados"
        icon={ShoppingCart}
      />

      <StatCard
        title="Produtos"
        value="892"
        subtitle="Itens cadastrados"
        icon={Package}
      />

      <StatCard
        title="Ordens de Serviço"
        value="28"
        subtitle="OS em andamento"
        icon={Wrench}
      />
    </div>
  );
};

export { DashboardStats };