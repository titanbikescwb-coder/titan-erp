import AuditoriaPage from "../pages/AuditoriaPage";
import FiscalPage from "../pages/FiscalPage";
import { Routes, Route } from "react-router-dom";

import DashboardPage from "../pages/DashboardPage";
import EstoquePage from "../pages/EstoquePage";
import VendasPage from "../pages/VendasPage";
import CaixaPage from "../pages/CaixaPage";
import OrcamentosPage from "../pages/OrcamentosPage";
import OrdemServicoPage from "../pages/OrdemServicoPage";
import AgendaPage from "../pages/AgendaPage";
import { Navigate } from "react-router-dom";

import {
  ProtectedRoute,
  PublicLoginRoute
} from "./ProtectedRoute";

import Login from "../components/Login";
import CalculadoraPrecificacao from "../components/CalculadoraPrecificacao";
import Cadastros from "../components/Cadastros";
import Financeiro from "../components/Financeiro";
import FiscalGateway from "../components/FiscalGateway";
import Relatorios from "../components/Relatorios";
import Configuracoes from "../components/Configuracoes";
import LogsAuditoria from "../components/LogsAuditoria";
const AppRoutes = () => {
  return (
    <Routes>

      <Route
        path="/login"
        element={<PublicLoginRoute />}
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
        path="/dashboard"
        element={
          <ProtectedRoute permission="dashboard">
            <DashboardPage />
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
        path="/vendas"
        element={
          <ProtectedRoute permission="vendas">
            <VendasPage />
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
        path="/orcamentos"
        element={
          <ProtectedRoute permission="orcamentos">
            <OrcamentosPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ordem-servico"
        element={
          <ProtectedRoute permission="servicos">
            <OrdemServicoPage />
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
        path="/calculadora"
        element={
          <ProtectedRoute permission="calculadora">
            <CalculadoraPrecificacao />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cadastros"
        element={
          <ProtectedRoute permission="cadastros">
            <Cadastros />
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro"
        element={
          <ProtectedRoute permission="financeiro">
            <Financeiro />
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
            <Relatorios />
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute permission="configuracoes">
            <Configuracoes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/auditoria"
        element={
          <ProtectedRoute permission="auditoria">
            <AuditoriaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
};