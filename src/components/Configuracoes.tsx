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
  Phone, 
  Mail, 
  Globe,
  Loader2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Key,
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export default function Configuracoes() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [certificate, setCertificate] = useState<DigitalCertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  
  // Form State
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
    productCategories: [] as string[]
  });

  const [newPayment, setNewPayment] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'empresa' | 'pagamentos' | 'certificado'>('empresa');

  // Certificate Form State
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
          address: data.address || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
          paymentMethods: data.paymentMethods || [],
          productCategories: data.productCategories || []
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
      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (type: 'payment' | 'category') => {
    if (type === 'payment' && newPayment.trim()) {
      setFormData(prev => ({ ...prev, paymentMethods: [...prev.paymentMethods, newPayment.trim()] }));
      setNewPayment('');
    } else if (type === 'category' && newCategory.trim()) {
      setFormData(prev => ({ ...prev, productCategories: [...prev.productCategories, newCategory.trim()] }));
      setNewCategory('');
    }
  };

  const removeItem = (type: 'payment' | 'category', index: number) => {
    if (type === 'payment') {
      setFormData(prev => ({ ...prev, paymentMethods: prev.paymentMethods.filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({ ...prev, productCategories: prev.productCategories.filter((_, i) => i !== index) }));
    }
  };

  const handleCertUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile || !certPassword) return;
    
    setCertLoading(true);
    try {
      await certificateService.uploadCertificate(certFile, certPassword);
      alert('Certificado digital configurado com sucesso!');
      setCertFile(null);
      setCertPassword('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 card-premium p-6 shadow-sm">
        <div className="bg-titan-primary p-3 rounded-[8px] text-white shadow-lg shadow-titan-primary/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Painel Titan ERP</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações globais e identidade</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit shadow-inner">
        <Button
          variant={activeTab === 'empresa' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('empresa')}
          className={cn(
            "px-6 py-2.5 rounded-xl h-auto bg-transparent shadow-none font-black uppercase text-[10px] tracking-widest",
            activeTab === 'empresa' 
              ? "bg-white dark:bg-slate-800 text-titan-primary shadow-sm" 
              : "text-slate-400 border-transparent bg-transparent active:bg-slate-200"
          )}
          leftIcon={<Building2 className="w-4 h-4" />}
        >
          Empresa
        </Button>
        <Button
          variant={activeTab === 'pagamentos' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('pagamentos')}
          className={cn(
            "px-6 py-2.5 rounded-xl h-auto bg-transparent shadow-none font-black uppercase text-[10px] tracking-widest",
            activeTab === 'pagamentos' 
              ? "bg-white dark:bg-slate-800 text-titan-primary shadow-sm" 
              : "text-slate-400 border-transparent bg-transparent active:bg-slate-200"
          )}
          leftIcon={<CreditCard className="w-4 h-4" />}
        >
          Pagamentos
        </Button>
        <Button
          variant={activeTab === 'certificado' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('certificado')}
          className={cn(
            "px-6 py-2.5 rounded-xl h-auto bg-transparent shadow-none font-black uppercase text-[10px] tracking-widest relative",
            activeTab === 'certificado' 
              ? "bg-white dark:bg-slate-800 text-titan-primary shadow-sm" 
              : "text-slate-400 border-transparent bg-transparent active:bg-slate-200"
          )}
          leftIcon={<FileText className="w-4 h-4" />}
        >
          Certificado
          {!certificate && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      <div className="space-y-8">
        {activeTab === 'empresa' && (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Company Data */}
            <section className="card-premium p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-between gap-2 uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-titan-primary" />
                  Perfil da Empresa
                </div>
                {!certificate && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('certificado')}
                    className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 h-auto animate-pulse font-black text-[10px] uppercase border border-amber-100"
                  >
                    Ativar NF-e
                  </Button>
                )}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
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
                        className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-pointer flex items-center justify-center active:bg-slate-50"
                      >
                        <Plus className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">URL da Logo</label>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({...formData, logoUrl: ''})}
                        className="text-[10px] text-red-500 h-auto p-0"
                      >
                        Remover Logo
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={formData.logoUrl}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://exemplo.com/logo.png ou upload ao lado"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Razão Social / Nome Fantasia</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-titan-primary outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
                    <MapPin className="w-4 h-4 text-titan-primary" />
                    Localização Comercial
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">CEP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.address.cep}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, address: { ...prev.address, cep: val } }));
                            if (val.length === 8) handleCepLookup(val);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-titan-primary outline-none"
                        />
                        {cepLoading && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-titan-primary animate-spin" />}
                      </div>
                    </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={formData.address.logradouro}
                      onChange={e => setFormData(prev => ({ ...prev, address: { ...prev.address, logradouro: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Número</label>
                    <input
                      type="text"
                      value={formData.address.numero}
                      onChange={e => setFormData(prev => ({ ...prev, address: { ...prev.address, numero: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Bairro</label>
                    <input
                      type="text"
                      value={formData.address.bairro}
                      onChange={e => setFormData(prev => ({ ...prev, address: { ...prev.address, bairro: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Cidade/UF</label>
                    <input
                      type="text"
                      value={`${formData.address.cidade} / ${formData.address.estado}`}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Receipt Settings */}
            <section className="card-premium p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Configurações do Recibo
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Mensagem no Rodapé do Recibo</label>
                  <textarea
                    value={formData.receiptMessage}
                    onChange={e => setFormData({...formData, receiptMessage: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                    placeholder="Ex: Obrigado pela preferência! Volte sempre."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 transition-colors flex-1">
                    <input
                      type="checkbox"
                      checked={formData.showCnpjOnReceipt}
                      onChange={e => setFormData({...formData, showCnpjOnReceipt: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mostrar CNPJ no Recibo</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 transition-colors flex-1">
                    <input
                      type="checkbox"
                      checked={formData.showAddressOnReceipt}
                      onChange={e => setFormData({...formData, showAddressOnReceipt: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Mostrar Endereço no Recibo</span>
                  </label>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                className="px-12 h-14"
                leftIcon={!loading && <Save className="w-5 h-5" />}
              >
                Salvar Dados da Empresa
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'pagamentos' && (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Payment Methods & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="card-premium p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Formas de Pagamento
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPayment}
                      onChange={e => setNewPayment(e.target.value)}
                      placeholder="Nova forma..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <Button 
                      onClick={() => addItem('payment')}
                      className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 p-3 h-auto"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.paymentMethods.map((method, idx) => (
                      <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold">
                        {method}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItem('payment', idx)} 
                          className="p-0 h-auto hover:bg-transparent hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="card-premium p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tags className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Categorias de Produtos
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Nova categoria..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <Button 
                      onClick={() => addItem('category')}
                      className="bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 p-3 h-auto"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.productCategories.map((cat, idx) => (
                      <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-bold">
                        {cat}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItem('category', idx)} 
                          className="p-0 h-auto hover:bg-transparent hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                className="px-12 h-14"
                leftIcon={!loading && <Save className="w-5 h-5" />}
              >
                Salvar Parâmetros
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'certificado' && (
          <section className="card-premium p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Certificado Digital A1
              </h3>
              {certificate && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  certificate.status === 'válido' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  certificate.status === 'expirado' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {certificate.status === 'válido' ? <ShieldCheck className="w-3 h-3" /> : 
                   certificate.status === 'expirado' ? <ShieldX className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {certificate.status}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current Certificate Info */}
              <div className="space-y-4">
                {certificate ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{certificate.subject}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Emissor: {certificate.issuer}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Válido De</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{new Date(certificate.validFrom).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Válido Até</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{new Date(certificate.validTo).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Arquivo</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{certificate.fileName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-600">
                    <ShieldAlert className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Nenhum certificado configurado</p>
                  </div>
                )}
              </div>

              {/* Upload Form */}
              <form onSubmit={handleCertUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Arquivo do Certificado (.pfx, .p12)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={e => setCertFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="cert-upload"
                    />
                    <label 
                      htmlFor="cert-upload"
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer active:bg-slate-50 dark:active:bg-slate-700"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm truncate">{certFile ? certFile.name : 'Selecionar arquivo...'}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Senha do Certificado</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="password"
                      value={certPassword}
                      onChange={e => setCertPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Digite a senha"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={certLoading}
                  disabled={!certFile || !certPassword}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                  leftIcon={!certLoading && <Save className="w-5 h-5" />}
                >
                  Configurar Certificado
                </Button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
