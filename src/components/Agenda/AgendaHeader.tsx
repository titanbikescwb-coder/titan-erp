import {
  Calendar as CalendarIcon,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "../ui/Button";

interface AgendaHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onOpenModal: () => void;
}

const AgendaHeader = ({
  searchTerm,
  setSearchTerm,
  onOpenModal,
}: AgendaHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-white tracking-wider uppercase flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-titan-primary" />
          Agenda / Oficina
        </h1>

        <p className="text-white/40 font-medium tracking-tight">
          Visualize compromissos e movimentações de OS por dia
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />

          <input
            type="text"
            placeholder="Buscar na agenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all w-48"
          />
        </div>

        <Button
          onClick={onOpenModal}
          className="bg-titan-primary hover:bg-titan-primary/90 text-white shadow-lg shadow-titan-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agendar
        </Button>
      </div>
    </div>
  );
};

export { AgendaHeader };