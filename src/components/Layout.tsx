import { useState } from "react";
import { Menu } from "lucide-react";

export default function Layout({ children }: any) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white">

      {/* SIDEBAR */}
      <aside className={`
        ${open ? "w-64" : "w-20"}
        transition-all duration-300
        bg-[#121212]
        border-r border-[#2C2C2C]
        flex flex-col
        p-4
      `}>
        
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-lg">Titan ERP</span>
          <button onClick={() => setOpen(!open)}>
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <button className="text-left px-4 py-3 rounded-xl hover:bg-[#1a1a1a]">
            Dashboard
          </button>
          <button className="text-left px-4 py-3 rounded-xl hover:bg-[#1a1a1a]">
            Vendas
          </button>
          <button className="text-left px-4 py-3 rounded-xl hover:bg-[#1a1a1a]">
            Estoque
          </button>
          <button className="text-left px-4 py-3 rounded-xl hover:bg-[#1a1a1a]">
            Caixa
          </button>
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
          <h1 className="font-bold text-lg">Painel</h1>
          <div className="text-sm text-white/60">
            Usuário
          </div>
        </header>

        {/* CONTAINER */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}