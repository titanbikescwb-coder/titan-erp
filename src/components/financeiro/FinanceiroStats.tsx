import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import CardPadrao from "../ui/CardPadrao";
import { FinancialStatus } from "../../domain/types";

type FinanceiroFilter =
  | "receita_pago"
  | "despesa_pago"
  | "receita_pendente"
  | "despesa_pendente";

type EntryType = "receita" | "despesa";

interface FinanceiroStatsProps {
  totals: {
    receita: number;
    despesa: number;
    aReceber: number;
    aPagar: number;
  };
  activeFilter: FinanceiroFilter | null;
  onFilterToggle: (filter: FinanceiroFilter) => void;
  onOpenEntryModal: (type: EntryType, status: FinancialStatus) => void;
}

const cards = [
  {
    id: "receita_pago" as const,
    label: "Receitas",
    subtitle: "Pagas",
    valueKey: "receita" as const,
    icon: TrendingUp,
    variant: "success" as const,
    type: "receita" as const,
    status: "pago" as const,
  },
  {
    id: "despesa_pago" as const,
    label: "Despesas",
    subtitle: "Pagas",
    valueKey: "despesa" as const,
    icon: TrendingDown,
    variant: "warning" as const,
    type: "despesa" as const,
    status: "pago" as const,
  },
  {
    id: "receita_pendente" as const,
    label: "A Receber",
    subtitle: "Previsto",
    valueKey: "aReceber" as const,
    icon: ArrowUpRight,
    variant: "finance" as const,
    type: "receita" as const,
    status: "pendente" as const,
  },
  {
    id: "despesa_pendente" as const,
    label: "A Pagar",
    subtitle: "Pendências",
    valueKey: "aPagar" as const,
    icon: ArrowDownRight,
    variant: "analytics" as const,
    type: "despesa" as const,
    status: "pendente" as const,
  },
];

const FinanceiroStats = ({
  totals,
  activeFilter,
  onFilterToggle,
  onOpenEntryModal,
}: FinanceiroStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.id} className="relative">
          <CardPadrao
            title={card.label}
            value={totals[card.valueKey]}
            subValue={card.subtitle}
            icon={card.icon}
            variant={card.variant}
            isCurrency
            onClick={() => onFilterToggle(card.id)}
            active={activeFilter === card.id}
          />

        </div>
      ))}
    </div>
  );
};

export { FinanceiroStats };