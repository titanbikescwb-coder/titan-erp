import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  LogIn, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
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
        setError("O método de Login por E-mail está DESATIVADO no seu Console do Firebase. Por favor, ative 'E-mail/senha' em Authentication > Sign-in Method no projeto titan-erp-98180.");
      } else if (err.code === 'auth/invalid-email') {
        setError("O formato do e-mail é inválido.");
      } else if (err.code === 'auth/user-disabled') {
        setError("Este usuário foi desativado pelo administrador.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres");
      } else {
        setError("Erro na autenticação: " + (err.message || "Tente novamente."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-titan-primary to-titan-secondary flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[440px] w-full relative">
        <div className="card-premium bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(30,58,138,0.25)]">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-titan-primary to-titan-secondary rounded-2xl shadow-lg shadow-titan-primary/20 mb-6">
              <LogIn className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              Titan ERP
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Controle total do seu negócio.
            </p>
          </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-red-800 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {success}
              </div>
            )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-titan-primary transition-colors">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-titan-primary/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Endereço de E-mail
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-titan-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-titan-primary/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                    Senha de Acesso
                  </label>
                  {authMode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-black text-titan-secondary hover:text-titan-primary uppercase tracking-widest"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer appearance-none w-5 h-5 border-2 border-slate-200 dark:border-slate-800 rounded-lg checked:bg-titan-secondary checked:border-titan-secondary transition-all"
                    />
                    <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                    Lembrar de mim
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full h-14 shadow-xl"
            >
              {authMode === 'login' ? 'Entrar no Sistema' : 
               authMode === 'register' ? 'Criar minha Conta' : 'Recuperar Senha'}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] bg-white dark:bg-slate-900 px-4 text-slate-400">
              Ou continue com
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px]"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5 mr-3"
              referrerPolicy="no-referrer"
            />
            Login com Google
          </Button>

          <div className="mt-8 text-center">
            {authMode === 'login' ? (
              <p className="text-sm font-medium text-slate-500">
                Novo por aqui?{' '}
                <button 
                  onClick={() => setAuthMode('register')}
                  className="text-titan-secondary font-black hover:underline ml-1"
                >
                  Crie sua conta agora
                </button>
              </p>
            ) : (
              <button 
                onClick={() => setAuthMode('login')}
                className="text-sm font-black text-titan-secondary hover:underline"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">
          Titan ERP © 2026 • Inteligência em Gestão
        </p>
      </div>
    </div>
  );
}
