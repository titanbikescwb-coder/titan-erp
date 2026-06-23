import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Wrench, 
  Package, 
  DollarSign, 
  BarChart3, 
  Settings,
  Receipt,
  UserCircle,
  PieChart,
  Calendar,
  FileSignature,
  ShieldCheck
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'agenda', label: 'Agenda / Oficina', icon: Calendar, path: '/agenda' },
  { id: 'caixa', label: 'Caixa', icon: ShoppingCart, path: '/caixa' },
  { id: 'vendas', label: 'Vendas', icon: Receipt, path: '/vendas' },
  { id: 'orcamentos', label: 'Orçamentos', icon: FileText, path: '/orcamentos' },
  { id: 'servicos', label: 'Serviços / OS', icon: Wrench, path: '/servicos' },
  { id: 'estoque', label: 'Estoque', icon: Package, path: '/estoque' },
  { id: 'cadastros', label: 'Clientes/Prod', icon: UserCircle, path: '/cadastros' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
  { id: 'fiscal', label: 'Fiscal', icon: FileSignature, path: '/fiscal' },
  { id: 'relatorios', label: 'Relatórios', icon: PieChart, path: '/relatorios' },
  { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck, path: '/auditoria' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
];
