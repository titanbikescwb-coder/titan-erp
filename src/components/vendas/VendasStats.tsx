import {
  Receipt as ReceiptIcon,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

import CardPadrao from "../ui/CardPadrao";

interface VendasStatsProps {
  vendasStats: any[];
  setView: (value: 'pos' | 'history') => void;
}

const VendasStats = ({
  vendasStats,
  setView,
}: VendasStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {vendasStats.map((card, idx) => (
        <CardPadrao
          key={idx}
          title={card.label}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          onClick={() => {
            if (
              card.label === 'Vendas Hoje' ||
              card.label === 'Faturamento Hoje'
            ) {
              setView('history');
            }
          }}
        />
      ))}
    </div>
  );
};

export { VendasStats };