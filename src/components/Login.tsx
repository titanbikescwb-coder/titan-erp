import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/Button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("ERRO LOGIN GOOGLE:", err);
      if (err.message === 'Usuário não cadastrado') {
        setError("Usuário não cadastrado no sistema. Entre em contato com o administrador.");
      } else {
        setError("Falha ao autenticar com Google. Verifique se os popups estão permitidos.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else if (authMode === 'register') {
        await registerWithEmail(email, password, name);
      } else if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess("E-mail de recuperação enviado com sucesso!");
        setAuthMode('login');
      }
    } catch (err: any) {
      console.error("ERRO LOGIN EMAIL/SENHA:", err);
      if (err.message === 'Usuário não cadastrado') {
        setError("Usuário não cadastrado no sistema. Entre em contato com o administrador.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("O método de Login por E-mail está DESATIVADO.");
      } else if (err.code === 'auth/invalid-email') {
        setError("O formato do e-mail é inválido.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso");
      } else {
        setError("Erro na autenticação: " + (err.message || "Tente novamente."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-background flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative elements - Apple Style Glass Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-titan-primary/20 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] opacity-30" />

      <div className="max-w-[440px] w-full relative z-10 transition-all duration-700">
        <div className="card-premium p-8 sm:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-titan-border">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-titan-primary to-blue-600 rounded-[28px] shadow-[0_15px_35px_rgba(10,132,255,0.3)] mb-8">
              <LogIn className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">
              Titan ERP
            </h1>
            <p className="text-titan-text-secondary font-black uppercase text-[10px] tracking-[0.3em]">
              Sincronização de Alto Nível
            </p>
          </div>

            {error && (
              <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[24px] text-red-400 text-sm font-bold flex items-center gap-4 animate-shake">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] text-emerald-400 text-sm font-bold flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {success}
              </div>
            )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {authMode === 'register' && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.25em] ml-1">
                  Nome do Operador
                </label>
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-titan-background border border-titan-border focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 rounded-[24px] text-white outline-none transition-all placeholder:text-titan-text-secondary/30 font-bold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.25em] ml-1">
                Acesso Cloud / E-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
                <input
  type="email"
  required
  autoCapitalize="none"
  autoCorrect="off"
  spellCheck={false}
  placeholder="exemplo@titan.com"
  value={email}
  onChange={(e) => setEmail(e.target.value.toLowerCase())}
  className="w-full pl-14 pr-6 py-5 bg-titan-background border border-titan-border focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 rounded-[24px] text-white outline-none transition-all placeholder:text-titan-text-secondary/30 font-medium normal-case lowercase"
/>
                              </div>
            </div>

            {authMode !== 'forgot' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.25em]">
                    Chave de Acesso
                  </label>
                  {authMode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[9px] font-black text-titan-primary hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Recuperar Chave
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
                  <input
  type={showPassword ? 'text' : 'password'}
  required
  autoCapitalize="none"
  autoCorrect="off"
  spellCheck={false}
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full pl-14 pr-14 py-5 bg-titan-background border border-titan-border focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 rounded-[24px] text-white font-mono outline-none transition-all placeholder:text-titan-text-secondary/30 font-medium normal-case"
/>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-titan-text-secondary hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full h-16 shadow-[0_15px_35px_rgba(10,132,255,0.3)] mt-4"
            >
              {authMode === 'login' ? 'Autenticar Sessão' : 
               authMode === 'register' ? 'Gerar Acesso' : 'Sincronizar E-mail'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-titan-border/50"></div>
            </div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] bg-titan-background-sec px-6 text-titan-text-secondary/40 whitespace-nowrap">
              Social Auth Gate
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-16 bg-white/5 border-titan-border rounded-[24px] text-white font-black uppercase tracking-[0.2em] text-[10px]"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5 mr-3"
              referrerPolicy="no-referrer"
            />
            Login com Google Cloud
          </Button>

          
          </div>

        <p className="mt-12 text-center text-[10px] font-black text-titan-text-secondary/30 uppercase tracking-[0.4em]">
          Titan ERP • Secure Access Layer • 2026
        </p>
      </div>
    </div>
  );
}
