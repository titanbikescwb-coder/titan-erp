import { 
  ACCENT_COLORS, 
  type AccentColorKey 
} from '../theme/accentColors';

import { applyAccentColor } from '../theme/themeManager';
import { toast } from 'react-hot-toast';
import backupService from '../services/backupService';
import React, { useState, useEffect } from 'react';
import { configuracaoService } from '../services/configuracaoService';
import { certificateService } from '../services/certificateService';
import { CompanySettings, Address, DigitalCertificate } from '../domain/types';
import {
  Settings,
  Building2,
  CreditCard,
  Tags,
  Save,
  Image as ImageIcon,
  Plus,
  X,
  MapPin,
  Loader2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Key,
  Upload,
  Palette
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export default function Configuracoes() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [certificate, setCertificate] = useState<DigitalCertificate | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const handleExportBackup = async () => {
    setBackupLoading(true);

    try {
      await backupService.exportBackup();
      toast.success('Backup exportado.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    logoUrl: '',
    receiptMessage: '',
    showCnpjOnReceipt: true,
    showAddressOnReceipt: true,
    address: {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: ''
    } as Address,
    paymentMethods: [] as string[],
    productCategories: [] as string[],
appearance: {
  accentColor: 'blue' as AccentColorKey,
  theme: 'dark' as const,
  borderRadius: 'modern' as const,
  compactMode: false
}
  });

  const [newPayment, setNewPayment] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<
  'empresa' | 'pagamentos' | 'certificado' | 'personalizacao'
>('empresa');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');

  useEffect(() => {
    const unsubSettings = configuracaoService.getSettings((data) => {
      if (data) {
        setSettings(data);
        setFormData({
          name: data.name || '',
          cnpj: data.cnpj || '',
          phone: data.phone || '',
          email: data.email || '',
          logoUrl: data.logoUrl || '',
          receiptMessage: data.receiptMessage || '',
          showCnpjOnReceipt: data.showCnpjOnReceipt ?? true,
          showAddressOnReceipt: data.showAddressOnReceipt ?? true,
          address: data.address || {
            cep: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: ''
          },
          paymentMethods: data.paymentMethods || [],
          productCategories: data.productCategories || [],

appearance: data.appearance || {
  accentColor: 'blue',
  theme: 'dark',
  borderRadius: 'modern',
  compactMode: false
}
        });
      }
    });

    const unsubCert = certificateService.getCertificate((data) => {
      setCertificate(data);
    });

    return () => {
      unsubSettings();
      unsubCert();
    };
  }, []);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            cep: data.cep,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await configuracaoService.saveSettings(formData);
      toast.success('Configurações salvas.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type: 'payment' | 'category') => {
    if (type === 'payment' && newPayment.trim()) {
      setFormData(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, newPayment.trim()]
      }));
      setNewPayment('');
    } else if (type === 'category' && newCategory.trim()) {
      setFormData(prev => ({
        ...prev,
        productCategories: [...prev.productCategories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeItem = (type: 'payment' | 'category', index: number) => {
    if (type === 'payment') {
      setFormData(prev => ({
        ...prev,
        paymentMethods: prev.paymentMethods.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        productCategories: prev.productCategories.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCertUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certFile || !certPassword) return;

    setCertLoading(true);

    try {
      await certificateService.uploadCertificate(certFile, certPassword);
      toast.success('Certificado digital configurado.');
      setCertFile(null);
      setCertPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao configurar certificado digital.');
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="w-20 h-20 bg-titan-primary rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-8 ring-white/5 relative overflow-hidden group">
            <Settings className="w-10 h-10 group-hover:rotate-90 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>

          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
              Configurações
            </h1>

            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
                Painel Administrativo & Identidade • Sincronizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {[
              { id: 'empresa', label: 'Empresa', icon: Building2 },
              { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
              { id: 'certificado', label: 'Certificado', icon: FileText },
              { id: 'personalizacao', label: 'Personalização', icon: Palette },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-8 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest relative",
                  activeTab === tab.id ? "" : "text-white/40 hover:text-white"
                )}
                leftIcon={<tab.icon className="w-4 h-4" />}
              >
                {tab.label}
                {tab.id === 'certificado' && !certificate && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                )}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="space-y-8">
        {activeTab === 'pagamentos' && (
          <form onSubmit={handleSave} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="bg-emerald-600/20 p-4 rounded-[20px] text-emerald-400 border border-emerald-600/30">
                    <CreditCard className="icon-standard icon-active w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      Formas de Pagamento
                    </h3>
                    <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-40">
                      Gestão de recebíveis
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newPayment}
                      onChange={e => setNewPayment(e.target.value)}
                      placeholder="NOVA FORMA..."
                      className="flex-1 px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-white/10"
                    />
                    <Button
                      type="button"
                      onClick={() => addItem('payment')}
                      className="bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 w-14 h-14 rounded-2xl p-0 flex items-center justify-center transition-all active:scale-90"
                    >
                      <Plus className="icon-standard icon-active w-6 h-6 text-white" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {formData.paymentMethods.map((method, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-2.5 bg-black/40 border border-titan-border rounded-xl group hover:border-emerald-500/30 transition-all">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {method}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem('payment', idx)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X className="icon-standard icon-default w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="bg-purple-600/20 p-4 rounded-[20px] text-purple-400 border border-purple-600/30">
                    <Tags className="icon-standard icon-active w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      Categorias
                    </h3>
                    <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-40">
                      Classificação de estoque
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="NOVA CATEGORIA..."
                      className="flex-1 px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 placeholder:text-white/10"
                    />
                    <Button
                      type="button"
                      onClick={() => addItem('category')}
                      className="bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-500/20 w-14 h-14 rounded-2xl p-0 flex items-center justify-center transition-all active:scale-90"
                    >
                      <Plus className="icon-standard icon-active w-6 h-6 text-white" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {formData.productCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-2.5 bg-black/40 border border-titan-border rounded-xl group hover:border-purple-500/30 transition-all">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {cat}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem('category', idx)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X className="icon-standard icon-default w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-end pt-10">
              <Button
                type="submit"
                loading={loading}
                className="h-20 px-16 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 transition-all active:scale-95"
                leftIcon={!loading && <Save className="icon-standard icon-active w-6 h-6" />}
              >
                Salvar Parâmetros Globais
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'empresa' && (
          <form onSubmit={handleSave} className="space-y-10">
            <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-10">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600/20 p-4 rounded-[20px] text-indigo-400 border border-indigo-600/30">
                    <Building2 className="icon-standard icon-active w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      Perfil da Empresa
                    </h3>
                    <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-40">
                      Dados cadastrais e fiscais
                    </p>
                  </div>
                </div>

                {!certificate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('certificado')}
                    className="bg-amber-500/10 text-amber-500 h-10 px-6 rounded-xl animate-pulse font-black text-[10px] uppercase border border-amber-500/20 shadow-lg shadow-amber-500/5"
                  >
                    Ativar NF-e
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 flex flex-col md:flex-row items-start md:items-center gap-10 bg-black/20 p-8 rounded-[32px] border border-titan-border shadow-inner">
                  <div className="relative group self-center md:self-auto">
                    <div className="w-32 h-32 rounded-[28px] bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain p-4"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="icon-standard icon-default w-10 h-10" />
                      )}
                    </div>

                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];

                          if (file) {
                            const reader = new FileReader();

                            reader.onloadend = () => {
                              setFormData({ ...formData, logoUrl: reader.result as string });
                            };

                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="logo-upload"
                      />

                      <label
                        htmlFor="logo-upload"
                        className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/30 text-white cursor-pointer hover:bg-indigo-500 transition-colors"
                      >
                        <Plus className="icon-standard icon-default w-5 h-5" />
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                        URL da Logo
                      </label>

                      {formData.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, logoUrl: '' })}
                          className="text-[10px] text-red-400 font-bold h-auto p-0 hover:bg-transparent uppercase tracking-widest"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={formData.logoUrl}
                      onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-white/10"
                      placeholder="HTTPS://EXEMPLO.COM/LOGO.PNG OU UPLOAD..."
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                    Razão Social / Nome Fantasia
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                    Telefone Comercial
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="md:col-span-2 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-indigo-600/10 p-3 rounded-xl border border-indigo-600/20">
                      <MapPin className="icon-standard icon-active w-5 h-5" />
                    </div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                      LOCALIZAÇÃO COMERCIAL
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                        CEP / POSTAL
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={formData.address.cep}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              address: { ...prev.address, cep: val }
                            }));

                            if (val.replace(/\D/g, '').length === 8) {
                              handleCepLookup(val);
                            }
                          }}
                          className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                          placeholder="00000-000"
                        />

                        {cepLoading && (
                          <Loader2 className="absolute right-4 top-4 w-4 h-4 text-indigo-500 animate-spin" />
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                        Logradouro / Avenida
                      </label>
                      <input
                        type="text"
                        value={formData.address.logradouro}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, logradouro: e.target.value }
                        }))}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.address.numero}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, numero: e.target.value }
                        }))}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.address.bairro}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, bairro: e.target.value }
                        }))}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                        Cidade / Estado
                      </label>
                      <input
                        type="text"
                        value={`${formData.address.cidade} / ${formData.address.estado}`}
                        readOnly
                        className="w-full px-6 py-4 rounded-2xl bg-black/20 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-10">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="bg-indigo-600/20 p-4 rounded-[20px] text-indigo-400 border border-indigo-600/30">
                  <FileText className="icon-standard icon-active w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                    Recibo & Visual
                  </h3>
                  <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-40">
                    Identidade visual e automações
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 block">
                    Mensagem Personalizada de Rodapé
                  </label>
                  <textarea
                    value={formData.receiptMessage}
                    onChange={e => setFormData({ ...formData, receiptMessage: e.target.value })}
                    className="w-full px-6 py-5 rounded-[32px] bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 min-h-[120px] resize-none"
                    placeholder="EX: OBRIGADO PELA PREFERÊNCIA! VOLTE SEMPRE."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="flex items-center justify-between p-6 rounded-3xl bg-black/20 border border-titan-border hover:bg-black/30 transition-all cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                        CNPJ no Recibo
                      </span>
                      <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">
                        Exibir em cabeçalho
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.showCnpjOnReceipt}
                      onChange={e => setFormData({ ...formData, showCnpjOnReceipt: e.target.checked })}
                      className="w-6 h-6 rounded-lg bg-black text-indigo-600 border-white/20 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-6 rounded-3xl bg-black/20 border border-titan-border hover:bg-black/30 transition-all cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                        Endereço no Recibo
                      </span>
                      <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">
                        Exibir em rodapé
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.showAddressOnReceipt}
                      onChange={e => setFormData({ ...formData, showAddressOnReceipt: e.target.checked })}
                      className="w-6 h-6 rounded-lg bg-black text-indigo-600 border-white/20 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10">
              <Button
                type="button"
                loading={backupLoading}
                onClick={handleExportBackup}
                className="h-20 px-10 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-600/30 transition-all active:scale-95"
              >
                Exportar Backup
              </Button>

              <Button
                type="submit"
                loading={loading}
                className="h-20 px-16 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 transition-all active:scale-95"
                leftIcon={!loading && <Save className="w-6 h-6" />}
              >
                Salvar Painel Administrativo
              </Button>
            </div>
          </form>
        )}
{activeTab === 'personalizacao' && (
  <form onSubmit={handleSave} className="space-y-10">

    <section className="
      card-premium
      p-10
      rounded-[40px]
      border border-titan-border
      shadow-[0_40px_100px_rgba(0,0,0,0.6)]
      space-y-10
    ">

      <div className="flex items-center gap-4 pb-6 border-b border-white/5">

        <div className="
          bg-titan-primary/20
          p-4
          rounded-[20px]
          text-titan-primary
          border border-titan-primary/30
        ">
          <Palette className="w-6 h-6" />
        </div>

        <div>
          <h3 className="
            text-xl
            font-black
            text-white
            uppercase
          ">
            Identidade Visual
          </h3>

          <p className="
            text-[10px]
            text-white/40
            font-black
            uppercase
            tracking-[0.2em]
          ">
            Personalize a aparência do Titan ERP
          </p>
        </div>

      </div>


      {/* CORES */}
      <div>

        <h4 className="
          text-sm
          text-white
          font-black
          uppercase
          tracking-widest
          mb-6
        ">
          Cor principal
        </h4>


        <div className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-5
        ">

          {Object.entries(ACCENT_COLORS).map(([key, color]) => (

            <button
              key={key}
              type="button"

              onClick={() => {

                const accent =
                  key as AccentColorKey;

                setFormData(prev => ({
                  ...prev,
                  appearance:{
                    ...prev.appearance,
                    accentColor: accent
                  }
                }));

                applyAccentColor(accent);

              }}

              className={cn(
                `
                h-24
                rounded-[28px]
                border
                flex
                flex-col
                items-center
                justify-center
                gap-3
                bg-black/30
                transition-all
                hover:scale-105
                `,
                formData.appearance.accentColor === key
                  ? "border-white"
                  : "border-white/10"
              )}

            >

              <span
                className="
                w-8
                h-8
                rounded-full
                "
                style={{
                  background: color.primary
                }}
              />

              <span className="
                text-xs
                text-white
                font-bold
              ">
                {color.label}
              </span>


            </button>

          ))}

        </div>

      </div>


      {/* PREVIEW */}

      <div className="
        bg-black/30
        border border-white/10
        rounded-[32px]
        p-8
        space-y-5
      ">

        <p className="
          text-white
          font-black
          uppercase
        ">
          Preview
        </p>


        <button
          type="button"
          className="
          px-8
          py-4
          rounded-2xl
          bg-titan-primary
          text-white
          font-bold
          "
        >
          Botão Titan
        </button>


        <div className="
          p-5
          rounded-3xl
          border
          border-titan-primary
        ">

          <p className="text-white">
            Card usando sua cor
          </p>

        </div>

      </div>


      <div className="flex justify-end">

        <Button
          type="submit"
          loading={loading}
          className="
          h-16
          px-12
          rounded-[28px]
          bg-titan-primary
          text-white
          "
        >

          Salvar Personalização

        </Button>

      </div>


    </section>

  </form>
)}
        {activeTab === 'certificado' && (
          <div className="space-y-10">
            {certificate ? (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-[28px] flex items-center justify-center border-2",
                        certificate.status === 'válido'
                          ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                          : "bg-red-600/20 border-red-500/30 text-red-500"
                      )}
                    >
                      {certificate.status === 'válido' ? (
                        <ShieldCheck className="w-10 h-10" />
                      ) : (
                        <ShieldAlert className="w-10 h-10" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
                        Certificado {certificate.status === 'válido' ? 'Ativo' : 'Expirado/Inválido'}
                      </h3>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] truncate max-w-xs md:max-w-md">
                        {certificate.subject}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 bg-black/20 p-6 rounded-3xl border border-white/5">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      Validade
                    </span>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-black text-white">
                        {new Date(certificate.validFrom).toLocaleDateString()}
                      </p>
                      <div className="w-4 h-px bg-white/10" />
                      <p className="text-sm font-black text-white">
                        {new Date(certificate.validTo).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 p-8 bg-white/5 rounded-[32px] border border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-titan-primary" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Emissor
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">
                      {certificate.issuer}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Save className="w-4 h-4 text-titan-primary" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Última atualização
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">
                      {certificate.updatedAt?.toDate
                        ? certificate.updatedAt.toDate().toLocaleString()
                        : 'Recém carregado'} por {certificate.updatedBy}
                    </p>
                  </div>
                </div>
              </motion.section>
            ) : (
              <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] text-center space-y-6">
                <div className="w-24 h-24 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-[32px] flex items-center justify-center mx-auto text-amber-500">
                  <ShieldX className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Nenhum Certificado Configurado
                  </h3>
                  <p className="text-sm text-white/40 font-medium max-w-md mx-auto mt-2">
                    Para emitir Notas Fiscais de Serviço (NF-e/NFS-e), você precisa carregar um certificado digital A1 (.p12 ou .pfx).
                  </p>
                </div>
              </section>
            )}

            <section className="card-premium p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-10">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="bg-titan-primary/20 p-4 rounded-[20px] text-titan-primary border border-titan-primary/30">
                  <Upload className="icon-standard icon-active w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                    {certificate ? 'Atualizar Certificado' : 'Carregar Certificado A1'}
                  </h3>
                  <p className="text-[9px] text-white font-black uppercase tracking-[0.2em] opacity-40">
                    Extensão .p12 ou .pfx
                  </p>
                </div>
              </div>

              <form onSubmit={handleCertUpload} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-1 block">
                      Arquivo do Certificado
                    </label>

                    <div className="relative group">
                      <input
                        type="file"
                        accept=".p12,.pfx"
                        onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cert-file-upload"
                      />

                      <label
                        htmlFor="cert-file-upload"
                        className={cn(
                          "flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-black/40 border border-titan-border cursor-pointer transition-all hover:bg-black/60",
                          certFile ? "border-titan-primary" : "border-white/10"
                        )}
                      >
                        <div className="bg-white/5 p-2 rounded-lg">
                          <FileText className={cn("w-5 h-5", certFile ? "text-titan-primary" : "text-white/20")} />
                        </div>
                        <span className={cn("text-[11px] font-black uppercase tracking-widest", certFile ? "text-white" : "text-white/20")}>
                          {certFile ? certFile.name : 'SELECIONAR ARQUIVO...'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-1 block">
                      Senha do Certificado
                    </label>

                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2">
                        <Key className="w-5 h-5 text-white/20 group-focus-within:text-titan-primary transition-colors" />
                      </div>

                      <input
                        type="password"
                        value={certPassword}
                        onChange={e => setCertPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-16 pr-6 py-4 rounded-2xl bg-black/40 border border-titan-border text-white text-[11px] font-black uppercase tracking-[0.15em] outline-none focus:border-titan-primary focus:ring-4 focus:ring-titan-primary/10 placeholder:text-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    loading={certLoading}
                    disabled={!certFile || !certPassword}
                    className="h-16 px-12 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] bg-titan-primary hover:bg-titan-primary/90 text-white shadow-xl shadow-titan-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    leftIcon={!certLoading && <ShieldCheck className="w-5 h-5" />}
                  >
                    {certificate ? 'Substituir Certificado' : 'Validar e Configurar'}
                  </Button>
                </div>
              </form>

              <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Segurança & Criptografia
                  </span>
                </div>
                <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                  Sua senha é criptografada (AES-256) antes de ser salva no banco de dados.
                  O arquivo é armazenado em ambiente seguro e utilizado apenas para comunicação com os servidores da SEFAZ durante a emissão de notas.
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}