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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useShortcuts({
    '1': (e?: any) => { if (e?.altKey) { navigate('/'); soundService.playClick(); } },
    '2': (e?: any) => { if (e?.altKey) { navigate('/vendas'); soundService.playClick(); } },
    '3': (e?: any) => { if (e?.altKey) { navigate('/orcamentos'); soundService.playClick(); } },
    '4': (e?: any) => { if (e?.altKey) { navigate('/servicos'); soundService.playClick(); } },
    '5': (e?: any) => { if (e?.altKey) { navigate('/estoque'); soundService.playClick(); } },
    '6': (e?: any) => { if (e?.altKey) { navigate('/cadastros'); soundService.playClick(); } },
    '7': (e?: any) => { if (e?.altKey) { navigate('/financeiro'); soundService.playClick(); } },
    '8': (e?: any) => { if (e?.altKey) { navigate('/relatorios'); soundService.playClick(); } },
    '9': (e?: any) => { if (e?.altKey) { navigate('/configuracoes'); soundService.playClick(); } },
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
      <div className="flex flex-col h-full bg-titan-background-sec/80 backdrop-blur-xl text-white/70">
        
        {/* Topo */}
        <div className="p-8 flex items-center gap-4 sticky top-0 z-10 bg-titan-background-sec/60 backdrop-blur-xl">
          <div className="w-12 h-12 bg-titan-primary rounded-2xl flex items-center justify-center shadow-xl shadow-titan-primary/20 overflow-hidden">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Bike className="text-white w-7 h-7" />
            )}
          </div>

          <div>
            <span className="block font-black text-xl tracking-tight text-white leading-none">
              Titan
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-titan-primary">
              Pro ERP
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobileMenu}
            className="lg:hidden ml-auto p-2 text-white/40 hover:text-white bg-white/5 rounded-xl h-auto"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-8 px-6 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[12px] font-bold transition-all group relative",
                    isActive
                      ? "bg-titan-primary text-white shadow-lg shadow-titan-primary/20"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-white/40 group-hover:text-white"
                  )}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-8 bg-black/30 backdrop-blur-xl">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start gap-4 px-5 py-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[12px] font-bold uppercase tracking-widest">
              Sair do Sistema
            </span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-titan-background overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-[300px] bg-titan-background-sec/80 backdrop-blur-2xl flex-col shrink-0 z-20 shadow-xl shadow-black/40">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-titan-background-sec/90 backdrop-blur-2xl z-50 lg:hidden flex flex-col shadow-2xl shadow-black/60"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-titan-background">
        
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-6 lg:px-12 bg-titan-background/60 backdrop-blur-2xl z-30 sticky top-0 shadow-md shadow-black/20">
          
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 -ml-3 text-white bg-white/5 rounded-2xl h-auto"
            >
              <Menu className="w-6 h-6" />
            </Button>

            <h2 className="text-[13px] font-black text-white uppercase tracking-[0.25em] opacity-40">
              Módulo / {NAV_ITEMS.find(item => location.pathname === item.path)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl">
              <div className="w-2 h-2 bg-titan-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-titan-primary">
                Online
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-white">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-[9px] text-white/40">
                  Master
                </p>
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-titan-primary to-blue-600 rounded-2xl flex items-center justify-center text-white font-black">
                {user?.displayName?.charAt(0) ||
                  user?.email?.charAt(0).toUpperCase() ||
                  'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo interno */}
        <div className="flex-1 overflow-y-auto w-full pb-32">
          <div className="max-w-[1400px] mx-auto min-h-full py-8 md:py-12">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}