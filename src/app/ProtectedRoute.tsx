import { ReactNode, Suspense } from "react";
import { Navigate } from "react-router-dom";

import Layout from "../components/Layout";
import Login from "../components/Login";
import { useAuth } from "../hooks/useAuth";
import { canAccessModule } from "../lib/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
}

function AppLoading() {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-titan-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center px-4">
      <div className="card-premium rounded-[32px] border border-red-500/20 p-10 max-w-md text-center">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-4">
          Acesso negado
        </h1>

        <p className="text-white/40 text-sm font-bold">
          Você não possui permissão para acessar este módulo.
        </p>
      </div>
    </div>
  );
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

  const hasPermission = !permission || canAccessModule(profile, permission);

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

export { ProtectedRoute, PublicLoginRoute, AppLoading, AccessDenied };