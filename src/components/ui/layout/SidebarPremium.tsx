import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Wallet,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Vendas",
    icon: ShoppingCart,
    path: "/vendas",
  },
  {
    label: "Estoque",
    icon: Package,
    path: "/estoque",
  },
  {
    label: "Ordem de Serviço",
    icon: Wrench,
    path: "/ordem-servico",
  },
  {
    label: "Caixa",
    icon: Wallet,
    path: "/caixa",
  },
  {
    label: "Cadastros",
    icon: Users,
    path: "/cadastros",
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    path: "/agenda",
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    path: "/relatorios",
  },
  {
    label: "Configurações",
    icon: Settings,
    path: "/configuracoes",
  },
];

const SidebarPremium = () => {
  return (
    <aside className="w-72 min-h-screen bg-[#0A0A0A] border-r border-[#2C2C2C] p-5">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-white tracking-tight">
          TITAN ERP
        </h1>

        <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] mt-2">
          Premium Edition
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-4
                px-4 py-3 rounded-2xl
                transition-all duration-300
                border
                ${
                  isActive
                    ? "bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg shadow-blue-500/20"
                    : "border-transparent text-zinc-400 hover:bg-[#121212] hover:text-white"
                }
              `
              }
            >
              <Icon className="w-5 h-5" />

              <span className="font-semibold text-sm">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarPremium;