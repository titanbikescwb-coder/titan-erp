import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      let errorMessage = 'Ocorreu um erro inesperado.';
      let details = null;

      try {
        const errorMsg = this.state.error?.message || '';
        if (errorMsg.includes('offline') || errorMsg.includes('unavailable')) {
          errorMessage = 'O sistema não conseguiu se conectar ao banco de dados. Verifique sua conexão com a internet ou se o projeto Firebase já foi provisionado.';
        } else {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Erro de Permissão: Falha ao ${parsed.operationType} em ${parsed.path}`;
            details = (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono overflow-auto max-h-40">
                <pre>{JSON.stringify(parsed, null, 2)}</pre>
              </div>
            );
          }
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ops! Algo deu errado</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {errorMessage}
            </p>
            
            {details}

            <Button
              onClick={handleReset}
              className="mt-8 w-full"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Recarregar Sistema
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function handleReset() {
  window.location.reload();
}
