import {
  History,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";

import CardPadrao from "../ui/CardPadrao";

type CaixaFilter = "inicial" | "entradas" | "saidas" | "saldo";

interface CaixaStatsProps {
  currentSession: any;
  calculateExpected: () => number;
  activeFilter: CaixaFilter | null;
  handleFilterToggle: (filter: CaixaFilter) => void;
}

const CaixaStats = ({
  currentSession,
  calculateExpected,
  activeFilter,
  handleFilterToggle,
}: CaixaStatsProps) => {
  const cards = [
    {
      id: "inicial" as const,
      label: "Fundo Inicial",
      value: currentSession?.initialValue || 0,
      icon: History,
      variant: "default" as const,
    },
    {
      id: "entradas" as const,
      label: "Suprimentos",
      value: currentSession?.totalMovementsIn || 0,
      icon: TrendingUp,
      variant: "success" as const,
    },
    {
      id: "saidas" as const,
      label: "Sangrias",
      value: currentSession?.totalMovementsOut || 0,
      icon: TrendingDown,
      variant: "warning" as const,
    },
    {
      id: "saldo" as const,
      label: "Saldo Estimado",
      value: calculateExpected(),
      icon: Wallet,
      variant: "finance" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <CardPadrao
          key={card.id}
          title={card.label}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          isCurrency
          onClick={() => handleFilterToggle(card.id)}
          active={activeFilter === card.id}
        />
      ))}
    </div>
  );
};

export { CaixaStats };