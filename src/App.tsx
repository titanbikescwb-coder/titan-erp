import { Toaster } from "react-hot-toast";
import CalculadoraPage from "./pages/CalculadoraPage";
import FiscalPage from "./pages/FiscalPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import CadastrosPage from "./pages/CadastrosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import CaixaPage from "./pages/CaixaPage";
import AgendaPage from "./pages/AgendaPage";
import OrdemServicoPage from "./pages/OrdemServicoPage";
import OrcamentosPage from "./pages/OrcamentosPage";
import VendasPage from "./pages/VendasPage";
import EstoquePage from "./pages/EstoquePage";
import DashboardPage from "./pages/DashboardPage";
import '../styles/theme.css';
import '../styles/components.css';
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './components/Login';
import { canAccessModule } from './lib/permissions';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLoading() {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-full border-4 border-titan-primary border-t-transparent animate-spin" />
        <div className="text-center">
          <p className="text-white text-sm font-black uppercase tracking-[0.3em]">
            Carregando Titan ERP
          </p>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.25em] mt-2">
            Sincronizando módulo
          </p>
        </div>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card-premium rounded-[36px] border border-red-500/20 p-10 max-w-md text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-4xl font-black">!</span>
        </div>

        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
          Acesso Negado
        </h1>

        <p className="text-white/40 text-sm font-bold leading-relaxed">
          Seu usuário não possui permissão para acessar este módulo.
          Fale com o administrador do sistema.
        </p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.active === false) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center px-4">
        <div className="card-premium rounded-[32px] border border-red-500/20 p-10 max-w-md text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
            Usuário inativo
          </h1>
          <p className="text-white/40 text-sm font-bold">
            Seu acesso foi desativado. Fale com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  const hasPermission =
  !permission ||
  canAccessModule(profile, permission);

  return (
    <Layout>
      <Suspense fallback={<AppLoading />}>
        {hasPermission ? children : <AccessDenied />}
      </Suspense>
    </Layout>
  );
}

function PublicLoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function LegacyRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicLoginRoute />} />
        <Route
  path="/auditoria"
  element={
    <ProtectedRoute permission="auditoria">
      <AuditoriaPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/"
  element={
    <ProtectedRoute permission="dashboard">
      <DashboardPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/caixa"
  element={
    <ProtectedRoute permission="caixa">
      <CaixaPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/vendas"
  element={
    <ProtectedRoute permission="vendas">
      <VendasPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/orcamentos"
  element={
    <ProtectedRoute permission="orcamentos">
      <OrcamentosPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/servicos"
  element={
    <ProtectedRoute permission="servicos">
      <OrdemServicoPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/estoque"
  element={
    <ProtectedRoute permission="estoque">
      <EstoquePage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/calculadora"
  element={
    <ProtectedRoute permission="calculadora">
      <CalculadoraPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/cadastros"
  element={
    <ProtectedRoute permission="cadastros">
      <CadastrosPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/financeiro"
  element={
    <ProtectedRoute permission="financeiro">
      <FinanceiroPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/agenda"
  element={
    <ProtectedRoute permission="agenda">
      <AgendaPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/fiscal/*"
  element={
    <ProtectedRoute permission="fiscal">
      <FiscalPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/relatorios"
  element={
    <ProtectedRoute permission="relatorios">
      <RelatoriosPage />
    </ProtectedRoute>
  }
/>
        <Route
  path="/configuracoes"
  element={
    <ProtectedRoute permission="configuracoes">
      <ConfiguracoesPage />
    </ProtectedRoute>
  }
/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <div className="app-bg min-h-screen">
            <LegacyRoutes />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}