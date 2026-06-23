import { toast } from 'react-hot-toast';
import CardPadrao from "../ui/CardPadrao";

interface AgendaStatsProps {
  agendaStats: any[];
  onResetFilters: () => void;
}

const AgendaStats = ({
  agendaStats,
  onResetFilters,
}: AgendaStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {agendaStats.map((card, idx) => (
        <CardPadrao
          key={idx}
          title={card.label}
          value={card.value}
          icon={card.icon}
          variant={card.variant}
          onClick={() => {
            if (card.label !== "Taxa de Ocupação") {
             onResetFilters();
} else {
  toast("Análise de ocupação estará disponível em breve.");
}
          }}
        />
      ))}
    </div>
  );
};

export { AgendaStats };