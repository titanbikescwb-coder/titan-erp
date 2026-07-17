import { applyAccentColor } from './theme/themeManager';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Inicializa a cor padrão do sistema
applyAccentColor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#121212',
            color: '#FFFFFF',
            border: '1px solid #2C2C2C',
            borderRadius: '16px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </ErrorBoundary>
  </StrictMode>,
);