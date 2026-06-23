import { toast } from 'react-hot-toast';
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
  Send,
  Mail
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
    whatsappMessage: 'Olá! Segue sua nota fiscal N° [numero]. Você pode baixar o PDF aqui: [link]',
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
toast.success('Configuração fiscal salva.');
    } catch (error) {
      console.error(error);
toast.error('Erro ao salvar configuração.');
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
    <div className="space-y-10 pb-16">
      {/* Simulation Warning Banner */}
      {formData.modoFiscal === 'simulacao' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[40px] flex items-center gap-6 shadow-2xl shadow-amber-500/5">
          <div className="bg-amber-500/20 p-4 rounded-2xl text-amber-500">
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-black text-amber-500 uppercase tracking-tight mb-1">MODO DE SIMULAÇÃO ATIVADO</h4>
            <p className="text-xs text-amber-500/60 font-black uppercase tracking-widest leading-relaxed">As notas fiscais geradas neste modo NÃO possuem valor legal e não são enviadas para a SEFAZ.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Modo de Operação Toggle */}
        <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className={cn(
                "p-5 rounded-[24px] transition-all duration-500 shadow-2xl",
                formData.modoFiscal === 'simulacao' ? "bg-amber-500/10 text-amber-500 shadow-amber-500/20" : "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20"
              )}>
                {formData.modoFiscal === 'simulacao' ? <Globe className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">MODO DE OPERAÇÃO</h3>
                <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">DEFINA O AMBIENTE DE TRANSMISSÃO DAS NOTAS</p>
              </div>
           </div>

            <div className="flex p-1.5 bg-black/40 rounded-[24px] border border-titan-border shadow-inner min-w-[300px]">
               <Button
                 variant={formData.modoFiscal === 'simulacao' ? 'primary' : 'ghost'}
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, modoFiscal: 'simulacao' }))}
                 className={cn(
                   "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                   formData.modoFiscal === 'simulacao' ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20" : "text-titan-text-secondary hover:bg-white/5"
                 )}
               >
                 Simulação
               </Button>
               <Button
                 variant={formData.modoFiscal === 'producao' ? 'primary' : 'ghost'}
                 type="button"
                 onClick={() => setFormData(prev => ({ ...prev, modoFiscal: 'producao' }))}
                 className={cn(
                   "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                   formData.modoFiscal === 'producao' ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" : "text-titan-text-secondary hover:bg-white/5"
                 )}
               >
                 Produção
               </Button>
            </div>
        </div>

        {/* Main Info */}
        <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-titan-primary/10 p-5 rounded-[24px] text-titan-primary border border-titan-primary/20 shadow-2xl shadow-titan-primary/10">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">DADOS DA EMPRESA</h3>
              <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">INFORMAÇÕES LEGAIS PARA EMISSÃO</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">CNPJ DO EMISSOR</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none uppercase tracking-widest"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">RAZÃO SOCIAL</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none uppercase tracking-tight"
                placeholder="NOME DA EMPRESA LTDA"
                value={formData.razaoSocial}
                onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">INSCRIÇÃO ESTADUAL (IE)</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none uppercase tracking-widest"
                placeholder="000.000.000.000"
                value={formData.ie}
                onChange={(e) => setFormData(prev => ({ ...prev, ie: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">REGIME TRIBUTÁRIO</label>
              <select 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none appearance-none uppercase tracking-widest"
                value={formData.regimeTributario}
                onChange={(e) => setFormData(prev => ({ ...prev, regimeTributario: e.target.value as FiscalRegime }))}
                required
              >
                <option value="simples_nacional">SIMPLES NACIONAL</option>
                <option value="lucro_presumido">LUCRO PRESUMIDO</option>
                <option value="lucro_real">LUCRO REAL</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-emerald-600/10 p-5 rounded-[24px] text-emerald-500 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">ENDEREÇO FISCAL</h3>
              <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">LOCALIZAÇÃO REGISTRADA NA RECEITA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">CEP</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none tracking-[0.2em]"
                value={formData.address?.cep}
                onChange={(e) => handleAddressChange('cep', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">LOGRADOURO</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none uppercase tracking-tight"
                value={formData.address?.logradouro}
                onChange={(e) => handleAddressChange('logradouro', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">NÚMERO</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none uppercase tracking-widest"
                value={formData.address?.numero}
                onChange={(e) => handleAddressChange('numero', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">CIDADE</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none uppercase tracking-tight"
                value={formData.address?.cidade}
                onChange={(e) => handleAddressChange('cidade', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">UF</label>
              <input 
                type="text" 
                className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none uppercase tracking-widest"
                maxLength={2}
                value={formData.address?.estado}
                onChange={(e) => handleAddressChange('estado', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Communication & Accountant Settings */}
        <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-sky-600/10 p-5 rounded-[24px] text-sky-500 border border-sky-500/20 shadow-2xl shadow-sky-500/10">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">COMUNICAÇÃO E CONTADOR</h3>
              <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">CONFIGURAÇÃO DE ENVIO AUTOMÁTICO</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">E-MAIL DO CONTADOR (RELATÓRIO MENSAL)</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-titan-text-secondary/40" />
                  <input 
                    type="email" 
                    className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] pl-16 pr-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none uppercase tracking-tight"
                    placeholder="EMAIL@CONTADOR.COM.BR"
                    value={formData.contadorEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contadorEmail: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">TEMPLATE WHATSAPP</label>
                <textarea 
                  className="w-full h-32 bg-black/40 border border-titan-border rounded-[32px] px-8 py-6 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none resize-none uppercase leading-relaxed"
                  placeholder="OLÁ! SEGUE SUA NOTA FISCAL N° [numero]..."
                  value={formData.whatsappMessage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                />
                <p className="text-[9px] text-titan-text-secondary/40 px-4 font-black uppercase tracking-[0.1em]">Use [numero] para o número da nota e [link] para o PDF.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration & Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-6 mb-12">
                <div className="bg-amber-600/10 p-5 rounded-[24px] text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                  <Hash className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">NUMERAÇÃO & SÉRIES</h3>
                  <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">CONTROLE DE SEQUÊNCIA SEFAZ</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Nº NF-E</label>
                    <input 
                      type="number" 
                      className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-lg font-black text-white outline-none tracking-widest text-center"
                      value={formData.proximoNumeroNFe}
                      onChange={(e) => setFormData(prev => ({ ...prev, proximoNumeroNFe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px) font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Nº NFC-E</label>
                    <input 
                      type="number" 
                      className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-lg font-black text-white outline-none tracking-widest text-center"
                      value={formData.proximoNumeroNFCe}
                      onChange={(e) => setFormData(prev => ({ ...prev, proximoNumeroNFCe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">SÉRIE NF-E</label>
                    <input 
                      type="number" 
                      className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-lg font-black text-white outline-none tracking-widest text-center"
                      value={formData.serieNFe}
                      onChange={(e) => setFormData(prev => ({ ...prev, serieNFe: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">SÉRIE NFC-E</label>
                    <input 
                      type="number" 
                      className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-lg font-black text-white outline-none tracking-widest text-center"
                      value={formData.serieNFCe}
                      onChange={(e) => setFormData(prev => ({ ...prev, serieNFCe: parseInt(e.target.value) }))}
                    />
                  </div>
              </div>
            </div>

            <div className="card-premium p-10 rounded-[48px] border border-titan-border shadow-[0_40px_100_rgba(0,0,0,0.6)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="bg-titan-primary/10 p-5 rounded-[24px] text-titan-primary border border-titan-primary/20 shadow-2xl shadow-titan-primary/10">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">FOCUS NFE API</h3>
                    <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.3em] opacity-40">INTEGRAÇÃO DE TRANSMISSÃO</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">API TOKEN DE ACESSO</label>
                    <input 
                      type="password" 
                      className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white transition-all outline-none"
                      placeholder="COLE SEV TOKEN AQUI..."
                      value={formData.focusApiKey || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, focusApiKey: e.target.value }))}
                    />
                  </div>

                  <div className="flex p-1.5 bg-black/40 rounded-[24px] border border-titan-border shadow-inner w-fit">
                    <Button
                        variant={formData.ambiente === 'homologacao' ? 'primary' : 'ghost'}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ambiente: 'homologacao' }))}
                        className={cn(
                          "h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.ambiente === 'homologacao' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-titan-text-secondary hover:bg-white/5"
                        )}
                    >
                        Homologação
                    </Button>
                    <Button
                        variant={formData.ambiente === 'producao' ? 'primary' : 'ghost'}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, ambiente: 'producao' }))}
                        className={cn(
                          "h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.ambiente === 'producao' ? "bg-titan-primary text-white shadow-xl shadow-titan-primary/20" : "text-titan-text-secondary hover:bg-white/5"
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
        <div className="flex justify-end pt-10">
             <Button
               type="submit"
               loading={loading}
               className="h-16 px-12 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all hover:scale-105"
               leftIcon={!loading ? <Save className="w-5 h-5" /> : undefined}
             >
               {loading ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÃO FISCAL'}
             </Button>
        </div>
      </form>
    </div>
  );
}
