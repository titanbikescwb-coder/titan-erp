import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Caixa from './components/Caixa';
import Vendas from './components/Vendas';
import Estoque from './components/Estoque';
import Orcamentos from './components/Orcamentos';
import OrdemServico from './components/OrdemServico';
import Cadastros from './components/Cadastros';
import Dashboard from './components/Dashboard';
import Configuracoes from './components/Configuracoes';
import Relatorios from './components/Relatorios';
import Financeiro from './components/Financeiro';
import Compras from './components/Compras';
import Agenda from './components/Agenda';
import FiscalGateway from './components/FiscalGateway';
import CalculadoraPrecificacao from './components/CalculadoraPrecificacao';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/caixa" element={<Layout><Caixa /></Layout>} />
              <Route path="/vendas" element={<Layout><Vendas /></Layout>} />
              <Route path="/orcamentos" element={<Layout><Orcamentos /></Layout>} />
              <Route path="/servicos" element={<Layout><OrdemServico /></Layout>} />
              <Route path="/estoque" element={<Layout><Estoque /></Layout>} />
              <Route path="/compras" element={<Layout><Compras /></Layout>} />
              <Route path="/calculadora" element={<Layout><CalculadoraPrecificacao /></Layout>} />
              <Route path="/cadastros" element={<Layout><Cadastros /></Layout>} />
              <Route path="/financeiro" element={<Layout><Financeiro /></Layout>} />
              <Route path="/agenda" element={<Layout><Agenda /></Layout>} />
              <Route path="/fiscal/*" element={<Layout><FiscalGateway /></Layout>} />
              <Route path="/relatorios" element={<Layout><Relatorios /></Layout>} />
              <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
