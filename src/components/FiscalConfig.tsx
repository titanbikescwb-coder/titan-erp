import React, { useState } from 'react';
import { FiscalConfig, FiscalRegime, FiscalAmbiente } from '../domain/types';
import { fiscalService } from '../services/fiscalService';
import { 
  Building2, 
  MapPin, 
  FileCheck2, 
  Globe, 
  ShieldCheck, 
  Save, 
  Info,
  Hash,
  MessageCircle,
  Send
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface Props {
  config: FiscalConfig | null;
  onSave: (config: FiscalConfig) => void;
}

export default function FiscalConfigComponent({ config, onSave }: Props) {
  const [formData, setFormData] = useState<Partial<FiscalConfig>>({
    cnpj: '',
    razaoSocial: '',
    ie: '',
    address: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
    regimeTributario: 'simples_nacional',
    ambiente: 'homologacao',
    modoFiscal: 'simulacao',
    proximoNumeroNFe: 1,
    proximoNumeroNFCe: 1,
    serieNFe: 1,
    serieNFCe: 1,
    whatsappMessage: 'Olá! Segue sua nota fiscal № [numero]. Você pode baixar o PDF aqui: [link]',
    contadorEmail: '',
    ...config
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fiscalService.saveConfig(formData);
      const updated = await fiscalService.getConfig();
      if (updated) onSave(updated);
      alert('Configuração fiscal salva com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar configuração.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Simulation Warning Banner */}
      {formData.modoFiscal === 'simulacao' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-6 rounded-[32px] flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-2xl text-amber-600 dark:text-amber-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Modo de Simulação Ativado</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">As notas fiscais geradas neste modo NÃO possuem valor legal e não são enviadas para a SEFAZ.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Modo de Operação Toggle */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                formData.modoFiscal === 'simulacao' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {formData.modoFiscal === 'simulacao' ? <Globe className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Modo de Operação</h3>
                <p className="text-sm text-slate-500 font-medium">Escolha entre simular ou emitir notas reais</p>
              </div>
           </div>

            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
               <Button
                 variant={formData.modoFiscal === 'simulacao' ? 'primary' : 'ghost'}
                 size="sm"
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, modoFiscal: 'simulacao' }))}
                 className={cn(
                   "px-6 transition-all font-bold",
                   formData.modoFiscal === 'simulacao' ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500"
                 )}
               >
                 Simulação
               </Button>
               <Button
                 variant={formData.modoFiscal === 'producao' ? 'primary' : 'ghost'}
                 size="sm"
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, modoFiscal: 'producao' }))}
                 className={cn(
                   "px-6 transition-all font-bold",
                   formData.modoFiscal === 'producao' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500"
                 )}
               >
                 Produção
               </Button>
            </div>
        </div>
        {/* Main Info */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dados da Empresa</h3>
              <p className="text-sm text-slate-500 font-medium">Informações legais para emissão dos documentos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CNPJ</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Razão Social</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="Nome da empresa Ltda"
                value={formData.razaoSocial}
                onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Inscrição Estadual (IE)</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                placeholder="000.000.000.000"
                value={formData.ie}
                onChange={(e) => setFormData(prev => ({ ...prev, ie: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Regime Tributário</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                value={formData.regimeTributario}
                onChange={(e) => setFormData(prev => ({ ...prev, regimeTributario: e.target.value as FiscalRegime }))}
                required
              >
                <option value="simples_nacional">Simples Nacional</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Endereço Fiscal</h3>
              <p className="text-sm text-slate-500 font-medium">Localização registrada na Receita Federal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CEP</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.address?.cep}
                onChange={(e) => handleAddressChange('cep', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Logradouro</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.address?.logradouro}
                onChange={(e) => handleAddressChange('logradouro', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Número</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.address?.numero}
                onChange={(e) => handleAddressChange('numero', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cidade</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.address?.cidade}
                onChange={(e) => handleAddressChange('cidade', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Estado</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                maxLength={2}
                value={formData.address?.estado}
                onChange={(e) => handleAddressChange('estado', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Communication & Accountant Settings */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Comunicação e Contador</h3>
              <p className="text-sm text-slate-500 font-medium">Configuração para envio de notas por WhatsApp e E-mail</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">E-mail do Contador (Envio Mensal)</label>
                <div className="relative">
                  <Send className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    placeholder="email@contador.com.br"
                    value={formData.contadorEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contadorEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mensagem do WhatsApp (Template)</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none h-32 resize-none"
                  placeholder="Olá! Segue sua nota fiscal referente à compra realizada..."
                  value={formData.whatsappMessage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                />
                <p className="text-[9px] text-slate-400 px-2 font-medium">Use [numero] para o número da nota e [link] para o PDF.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration & Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl text-amber-600">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Numeração & Séries</h3>
                  <p className="text-sm text-slate-500 font-medium">Controle de sequência dos documentos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Próxima NF-e</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                      value={formData.proximoNumeroNFe}
                      onChange={(e) => setFormData(prev => ({ ...prev, proximoNumeroNFe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Próxima NFC-e</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                      value={formData.proximoNumeroNFCe}
                      onChange={(e) => setFormData(prev => ({ ...prev, proximoNumeroNFCe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Série NF-e</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                      value={formData.serieNFe}
                      onChange={(e) => setFormData(prev => ({ ...prev, serieNFe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Série NFC-e</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                      value={formData.serieNFCe}
                      onChange={(e) => setFormData(prev => ({ ...prev, serieNFCe: parseInt(e.target.value) }))}
                    />
                  </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl text-indigo-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Focus NFe API</h3>
                    <p className="text-sm text-slate-500 font-medium">Integração para transmissão SEFAZ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">API Token (Focus NFe)</label>
                    <input 
                      type="password" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white transition-all outline-none"
                      placeholder="Cole seu Token aqui..."
                      value={formData.focusApiKey || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, focusApiKey: e.target.value }))}
                    />
                  </div>

                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                    <Button
                        variant={formData.ambiente === 'homologacao' ? 'primary' : 'ghost'}
                        size="sm"
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ambiente: 'homologacao' }))}
                        className={cn(
                            "px-6 transition-all font-bold",
                            formData.ambiente === 'homologacao' ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500"
                        )}
                    >
                        Homologação
                    </Button>
                    <Button
                        variant={formData.ambiente === 'producao' ? 'primary' : 'ghost'}
                        size="sm"
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ambiente: 'producao' }))}
                        className={cn(
                            "px-6 transition-all font-bold",
                            formData.ambiente === 'producao' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500"
                        )}
                    >
                        Produção
                    </Button>
                </div>
              </div>
            </div>
        </div>
    </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-6">
             <Button
               type="submit"
               variant="primary"
               loading={loading}
               className="px-10 h-16 rounded-[32px] tracking-[2px] shadow-xl shadow-indigo-500/20 font-bold"
               leftIcon={!loading ? <Save className="w-4 h-4" /> : undefined}
             >
               {loading ? 'Salvando...' : 'Salvar Configurações'}
             </Button>
        </div>
      </form>
    </div>
  );
}
