import SidebarPremium from "./ui/layout/SidebarPremium";
import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CompanySettings } from '../domain/types';
import { NAV_ITEMS } from '../domain/constants';
import { Bike, Menu, X, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { configuracaoService } from '../services/configuracaoService';
import { soundService } from '../services/audioService';
import { useShortcuts } from '../hooks/useShortcuts';
import { Button } from './ui/Button';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  const allowedItems = !profile || isAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter(item => profile.permissions?.includes(item.id));

  useShortcuts({
    '1': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/')) { navigate('/'); soundService.playClick(); } },
    '2': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/vendas')) { navigate('/vendas'); soundService.playClick(); } },
    '3': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/orcamentos')) { navigate('/orcamentos'); soundService.playClick(); } },
    '4': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/servicos')) { navigate('/servicos'); soundService.playClick(); } },
    '5': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/estoque')) { navigate('/estoque'); soundService.playClick(); } },
    '6': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/cadastros')) { navigate('/cadastros'); soundService.playClick(); } },
    '7': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/financeiro')) { navigate('/financeiro'); soundService.playClick(); } },
    '8': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/relatorios')) { navigate('/relatorios'); soundService.playClick(); } },
    '9': (e?: any) => { if (e?.altKey && allowedItems.some(i => i.path === '/configuracoes')) { navigate('/configuracoes'); soundService.playClick(); } },
  });

  useEffect(() => {
    const activeItem = NAV_ITEMS.find(item => item.path === location.pathname);
    if (activeItem) {
      document.title = `${activeItem.label} | Titan ERP`;
    } else if (location.pathname === '/') {
      document.title = 'Dashboard | Titan ERP';
    }
  }, [location.pathname]);

  useEffect(() => {
    const unsub = configuracaoService.getSettings(setSettings);
    return () => unsub();
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-titan-background-sec text-titan-text-secondary">
        <div className="p-6 flex items-center gap-3 sticky top-0 z-10 bg-titan-background-sec/80 backdrop-blur-sm">
          <div className="w-10 h-10 bg-titan-primary rounded-xl flex items-center justify-center shadow-xl shadow-titan-primary/20 overflow-hidden border border-white/10 shrink-0">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Bike className="text-white w-7 h-7" />
            )}
          </div>

          <div>
            <span className="block font-black text-xl tracking-tight text-white leading-none">Titan</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-titan-primary">Pro ERP</span>
          </div>

          <Button variant="ghost" size="sm" onClick={closeMobileMenu} className="lg:hidden ml-auto p-2 text-white/40 hover:text-white bg-white/5 rounded-xl h-auto">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {allowedItems.map((item, index) => {
            const showSeparator = ['financeiro', 'relatorios', 'configuracoes'].includes(item.id) && index > 0;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.id}>
                {showSeparator && <div className="mx-2 my-6" />}

                <NavLink
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[12px] font-bold tracking-tight transition-all group relative overflow-hidden",
                    isActive ? "bg-titan-primary text-white shadow-lg shadow-titan-primary/20" : "text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-white group-hover:text-white")} />
                  {item.label}
                  {isActive && <motion.div layoutId="sidebarActiveGlow" className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 blur-md" />}
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="p-6 bg-black/40">
          <Button onClick={logout} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 mr-4" />
            Sair do Sistema
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-titan-background overflow-hidden selection:bg-titan-primary selection:text-white">
      <aside className="hidden lg:flex w-[240px] bg-titan-background-sec flex-col shrink-0 z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMobileMenu} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-titan-background-sec z-50 lg:hidden flex flex-col shadow-2xl">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-titan-background">
        <header className="h-[72px] flex items-center justify-between px-6 lg:px-12 bg-titan-background/70 backdrop-blur-md z-30 sticky top-0">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 -ml-3 text-white bg-white/5 rounded-2xl h-auto">
              <Menu className="w-6 h-6" />
            </Button>

            <div>
              <h2 className="text-[13px] font-black text-white uppercase tracking-[0.25em]">
                Módulo / {NAV_ITEMS.find(item => location.pathname === item.path)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl">
              <div className="w-2 h-2 bg-titan-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(10,132,255,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-titan-primary">Servidor Cloud Estável</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black uppercase text-white tracking-widest leading-none mb-1">
                  {user?.displayName || profile?.name || user?.email || 'Admin'}
                </p>
                <p className="text-[9px] font-bold text-white uppercase tracking-widest">
                  {isAdmin ? 'Master Cloud Access' : 'Acesso Operacional'}
                </p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-titan-primary to-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-titan-primary/20 border border-white/20">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full pb-40 lg:pb-32 bg-titan-background custom-scrollbar">
          <div className="max-w-[1400px] mx-auto min-h-full py-8 md:py-12">
            {children}
          </div>
        </div>

        <nav className="lg:hidden fixed bottom-8 left-6 right-6 h-20 bg-titan-background-sec/90 backdrop-blur-md rounded-[32px] px-6 flex items-center justify-around z-40 shadow-2xl">
          {allowedItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.id} to={item.path} className={cn("flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative flex-1", isActive ? "text-titan-primary" : "text-white")}>
                <item.icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-125 -translate-y-1")} />
                {isActive && <motion.div layoutId="activeTabMobileGlow" className="absolute -top-10 w-12 h-12 bg-titan-primary/20 blur-xl rounded-full" />}
                {isActive && <motion.div layoutId="activeTabMobileBar" className="absolute -bottom-1 w-6 h-1 bg-titan-primary rounded-full shadow-[0_0_10px_rgba(10,132,255,0.8)]" />}
              </NavLink>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
