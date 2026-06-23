import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";

import CardPadrao from "../ui/CardPadrao";

interface EstoqueStatsProps {
  estoqueStats: any[];
  filter: string;
  setActiveView: (value: any) => void;
  setFilter: (value: any) => void;
  setSearchTerm: (value: string) => void;
}

const EstoqueStats = ({
  estoqueStats,
  filter,
  setActiveView,
  setFilter,
  setSearchTerm,
}: EstoqueStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {estoqueStats.map((card, idx) => (
        <CardPadrao
          key={idx}
          title={card.label}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          onClick={() => {
            if (card.label === 'Total de Itens') {
              setActiveView('list');
              setFilter('all');
              setSearchTerm('');
            }

            if (card.label === 'Alerta Reposição') {
              setActiveView('list');
              setFilter('low_stock');
              setSearchTerm('');
            }
          }}
          active={
            (card.label === 'Total de Itens' && filter === 'all') ||
            (card.label === 'Alerta Reposição' && filter === 'low_stock')
          }
        />
      ))}
    </div>
  );
};

export { EstoqueStats };