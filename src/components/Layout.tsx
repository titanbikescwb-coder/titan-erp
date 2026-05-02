import { useState } from "react";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [open, setOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "vendas", label: "Vendas" },
    { id: "estoque", label: "Estoque" },
    { id: "caixa", label: "Caixa" },
    { id: "ordem", label: "Ordem Serviço" },
    { id: "orcamentos", label: "Orçamentos" },
    { id: "relatorios", label: "Relatórios" },
    { id: "cadastros", label: "Cadastros" },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white">

      {/* SIDEBAR */}
      <aside className={`
        ${open ? "w-64" : "w-20"}
        transition-all duration-300
        bg-[#121212]
        border-r border-[#2C2C2C]
        flex flex-col p-4
      `}>
        
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-lg">Titan ERP</span>
          <button onClick={() => setOpen(!open)}>
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                text-left px-4 py-3 rounded-xl transition-all
                ${activeTab === item.id
                  ? "bg-[#0A84FF] text-white shadow-lg"
                  : "hover:bg-[#1a1a1a] text-white/70"}
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex flex-col flex-1">

        {/* NAVBAR */}
        <header className="
          h-[70px]
          flex items-center justify-between
          px-6
          bg-[#0A0A0A]/80
          backdrop-blur-xl
          border-b border-[#2C2C2C]
        ">
          <h1 className="font-bold text-lg capitalize">
            {activeTab}
          </h1>
        </header>

        {/* CONTEÚDO REAL */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}