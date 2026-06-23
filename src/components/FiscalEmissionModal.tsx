import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  FileText, 
  Receipt, 
  User, 
  MapPin, 
  ShoppingBag, 
  FileBadge, 
  CheckCircle2, 
  AlertCircle,
  Info 
} from 'lucide-react';
import { 
  FiscalNote, 
  FiscalConfig, 
  Sale, 
  ServiceOrder, 
  FiscalNoteType,
  Address,
  Customer
} from '../domain/types';
import { fiscalService } from '../services/fiscalService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: { origin: 'venda' | 'os', data: any };
  config: FiscalConfig;
}

type Step = 'tipo' | 'dados' | 'itens' | 'fiscal';

export default function FiscalEmissionModal({ isOpen, onClose, record, config }: Props) {
  const [step, setStep] = useState<Step>('tipo');
  const [tipo, setTipo] = useState<FiscalNoteType>(record.origin === 'venda' ? 'nfce' : 'nfe');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>({
    nome: record.data.customerName || '',
    documento: '',
    email: '',
    telefone: '',
    endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: ''
    }
  });

  const [fiscalData, setFiscalData] = useState({
    cfop: '5102',
    naturezaOperacao: 'Venda de mercadoria',
    meioPagamento: record.data.paymentMethod || 'dinheiro',
    observacoes: ''
  });

  useEffect(() => {
    // Try to find full customer data if name is present
    if (record.data.customerName) {
        const q = query(collection(db, 'customers'), where('name', '==', record.data.customerName), limit(1));
        getDocs(q).then(snap => {
            if (!snap.empty) {
                const c = snap.docs[0].data() as Customer;
                setCustomerData({
                    nome: c.name,
                    documento: c.document || '',
                    email: '', // Not in Customer type yet?
                    telefone: c.phone || '',
                    endereco: c.address || customerData.endereco
                });
            }
        });
    }
  }, [record.data.customerName]);

  const handleNext = () => {
    if (step === 'dados') {
      // Basic validation - only block if NF-e or if something was entered
      const docRaw = (customerData.documento || '').replace(/\D/g, '');
      
      if (tipo === 'nfe') {
  if (!docRaw) {
    toast('Informe o CPF ou CNPJ do cliente para emitir a NF-e.');
    return;
  }

  if (docRaw.length !== 11 && docRaw.length !== 14) {
    toast('Informe um CPF ou CNPJ válido (11 ou 14 dígitos).');
    return;
  }
} else if (docRaw && docRaw.length !== 11 && docRaw.length !== 14) {
  // Se for NFC-e e o usuário digitou, o documento deve ser válido
  toast('CPF ou CNPJ inválido (deve ter 11 ou 14 dígitos).');
  return;
}
    
    if (step === 'tipo') setStep('dados');
    else if (step === 'dados') setStep('itens');
    else if (step === 'itens') setStep('fiscal');
  };

  const handlePrev = () => {
    if (step === 'fiscal') setStep('itens');
    else if (step === 'itens') setStep('dados');
    else if (step === 'dados') setStep('tipo');
  };

  const handleEmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const note: Partial<FiscalNote> = {
        tipo,
        origem: record.origin,
        origemId: record.data.id,
        cliente: customerData,
        itens: record.data.items || [],
        total: record.data.totalAmount || 0,
        cfop: fiscalData.cfop,
        naturezaOperacao: fiscalData.naturezaOperacao,
        meioPagamento: fiscalData.meioPagamento,
        observacoes: fiscalData.observacoes
      };

      if (!note.itens?.length) {
  toast('Adicione itens antes de emitir a nota fiscal.');
  setLoading(false);
  return;
}

if (config.modoFiscal === 'producao' && !config.focusApiKey) {
  toast('Configure a API Key da Focus NFe para emitir em produção.');
  setLoading(false);
  return;
}

await fiscalService.emitNote(note);

toast.success('Nota fiscal emitida.');

onClose();

} catch (error: any) {
  console.error("Erro na emissão fiscal:", error);

  toast.error(error.message || 'Erro ao emitir nota fiscal.');

} finally {
  setLoading(false);
}
};

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="card-premium w-full max-w-5xl rounded-[56px] overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,0.8)] border border-titan-border flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[24px] text-white shadow-2xl shadow-indigo-600/30">
              <FileBadge className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">EMISSÃO FISCAL</h3>
                {config.modoFiscal === 'simulacao' && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded-lg tracking-widest border border-amber-500/20 shadow-xl shadow-amber-500/5">Simulação</span>
                )}
              </div>
              <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.4em] opacity-40">
                {record.origin === 'venda' ? 'Venda' : 'OS'} #{record.data.saleNumber || record.data.osNumber} • {formatCurrency(record.data.totalAmount)}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="p-4 h-auto rounded-full bg-white/5 hover:bg-white/10 transition-all group">
            <X className="w-6 h-6 text-titan-text-secondary group-hover:rotate-90 group-hover:text-white transition-all" />
          </Button>
        </div>

        {config.modoFiscal === 'simulacao' && (
          <div className="bg-amber-500/10 px-12 py-4 border-b border-amber-500/20 flex items-center gap-4">
             <Info className="w-5 h-5 text-amber-500" />
             <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
               Ambiente de Simulação Ativado - A nota não será enviada para a SEFAZ
             </p>
          </div>
        )}

        {/* Stepper Progress */}
        <div className="px-12 py-8 border-b border-white/5 flex items-center justify-center gap-4 bg-black/20">
            {[
                { id: 'tipo', label: 'Tipo', icon: FileText },
                { id: 'dados', label: 'Cliente', icon: User },
                { id: 'itens', label: 'Itens', icon: ShoppingBag },
                { id: 'fiscal', label: 'Fiscal', icon: FileBadge }
            ].map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className={cn(
                        "flex items-center gap-4 px-6 py-3 rounded-2xl transition-all duration-500",
                        step === s.id ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30" : "text-titan-text-secondary opacity-40"
                    )}>
                        <s.icon className={cn("w-5 h-5", step === s.id ? "scale-110" : "")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                    </div>
                    {idx < 3 && <div className="w-12 h-px bg-white/5" />}
                </React.Fragment>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-12 py-10 bg-black/10">
          <AnimatePresence mode="wait">
            {step === 'tipo' && (
              <motion.div
                key="tipo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="text-center space-y-3 mb-16">
                    <h4 className="text-3xl font-black text-white uppercase tracking-wider">Qual o destino desta operação?</h4>
                    <p className="text-xs text-titan-text-secondary font-black uppercase tracking-[0.4em] opacity-40">Escolha o modelo de nota fiscal adequado</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                  <Button
                    variant="outline"
                    onClick={() => setTipo('nfce')}
                    className={cn(
                        "p-12 h-auto rounded-[48px] border text-left transition-all relative overflow-hidden group flex flex-col items-start",
                        tipo === 'nfce' ? "border-indigo-600 bg-indigo-600/5 shadow-[0_40px_100px_rgba(79,70,229,0.15)] scale-105" : "border-white/5 bg-black/40 hover:border-indigo-600/50"
                    )}
                  >
                    <div className={cn(
                        "p-6 rounded-[28px] mb-8 inline-block transition-all duration-500 shadow-2xl",
                        tipo === 'nfce' ? "bg-indigo-600 text-white shadow-indigo-600/40" : "bg-white/5 text-titan-text-secondary"
                    )}>
                        <Receipt className="w-10 h-10" />
                    </div>
                    {tipo === 'nfce' && <CheckCircle2 className="w-8 h-8 text-indigo-500 absolute top-10 right-10" />}
                    <h5 className="text-2xl font-black text-white mb-3 uppercase tracking-wider">NFC-E</h5>
                    <p className="text-xs text-titan-text-secondary font-black uppercase tracking-widest leading-relaxed opacity-60">Nota Fiscal do Consumidor Eletrônica. Ideal para vendas diretas no balcão para pessoa física.</p>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setTipo('nfe')}
                    className={cn(
                       "p-12 h-auto rounded-[48px] border text-left transition-all relative overflow-hidden group flex flex-col items-start",
                       tipo === 'nfe' ? "border-indigo-600 bg-indigo-600/5 shadow-[0_40px_100px_rgba(79,70,229,0.15)] scale-105" : "border-white/5 bg-black/40 hover:border-indigo-600/50"
                    )}
                  >
                    <div className={cn(
                        "p-6 rounded-[28px] mb-8 inline-block transition-all duration-500 shadow-2xl",
                        tipo === 'nfe' ? "bg-indigo-600 text-white shadow-indigo-600/40" : "bg-white/5 text-titan-text-secondary"
                    )}>
                        <FileText className="w-10 h-10" />
                    </div>
                    {tipo === 'nfe' && <CheckCircle2 className="w-8 h-8 text-indigo-500 absolute top-10 right-10" />}
                    <h5 className="text-2xl font-black text-white mb-3 uppercase tracking-wider">NF-E</h5>
                    <p className="text-xs text-titan-text-secondary font-black uppercase tracking-widest leading-relaxed opacity-60">Nota Fiscal Eletrônica. Obrigatória para vendas interestaduais, devoluções ou vendas entre empresas.</p>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'dados' && (
              <motion.div
                key="dados"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Nome / Razão Social</label>
                      <input 
                        type="text" 
                        className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none uppercase"
                        value={customerData.nome}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">CPF / CNPJ</label>
                      <input 
                        type="text" 
                        className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-titan-text-secondary/20 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none tracking-widest"
                        value={customerData.documento}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, documento: e.target.value }))}
                      />
                    </div>
                 </div>

                 <div className="bg-black/40 p-10 rounded-[48px] border border-titan-border shadow-inner">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-emerald-600/10 p-4 rounded-2xl text-emerald-500 border border-emerald-500/20">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <h6 className="text-[11px] font-black text-titan-text-secondary uppercase tracking-[0.4em]">Endereço do Destinatário</h6>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">Logradouro</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10"
                                value={customerData.endereco.logradouro}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">Número</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10"
                                value={customerData.endereco.numero}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, numero: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">Bairro</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10"
                                value={customerData.endereco.bairro}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">Cidade</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10"
                                value={customerData.endereco.cidade}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, cidade: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">UF</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 text-center"
                                maxLength={2}
                                value={customerData.endereco.estado}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-titan-text-secondary uppercase tracking-widest ml-4 opacity-40">CEP</label>
                            <input 
                                type="text" className="w-full h-14 bg-black/60 border border-titan-border rounded-2xl px-6 text-[11px] font-black text-white uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 tracking-[0.2em]"
                                value={customerData.endereco.cep}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))}
                            />
                        </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {step === 'itens' && (
              <motion.div
                key="itens"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-black/40 rounded-[40px] overflow-hidden border border-titan-border shadow-inner">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 border-b border-titan-border">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] opacity-40">Item / Descrição</th>
                                <th className="px-10 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] opacity-40 text-center">Qtde</th>
                                <th className="px-10 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] opacity-40 text-right">Unitário</th>
                                <th className="px-10 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] opacity-40 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(record.data.items || []).map((it: any, i: number) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[400px] mb-1">{it.name}</p>
                                        <p className="text-[9px] text-titan-text-secondary font-black uppercase tracking-widest opacity-40">{it.type === 'product' ? 'PRODUTO' : 'SERVIÇO'}</p>
                                    </td>
                                    <td className="px-10 py-6 text-center font-black text-titan-text-secondary">
                                        {it.quantity}
                                    </td>
                                    <td className="px-10 py-6 text-right font-black text-titan-text-secondary">
                                        {formatCurrency(it.unitPrice)}
                                    </td>
                                    <td className="px-10 py-6 text-right font-black text-titan-primary text-base">
                                        {formatCurrency(it.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-titan-primary text-white font-black border-t border-titan-border">
                            <tr>
                                <td colSpan={3} className="px-10 py-8 text-right uppercase tracking-[0.4em] text-[10px] opacity-60 shadow-inner">Total da Nota</td>
                                <td className="px-10 py-8 text-right text-3xl tracking-tighter shadow-inner">{formatCurrency(record.data.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
              </motion.div>
            )}

            {step === 'fiscal' && (
              <motion.div
                key="fiscal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">CFOP Predominante</label>
                        <div className="relative">
                          <select 
                              className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white hover:border-titan-primary transition-all outline-none appearance-none uppercase tracking-widest shadow-inner"
                              value={fiscalData.cfop}
                              onChange={(e) => setFiscalData(prev => ({ ...prev, cfop: e.target.value }))}
                          >
                              <option value="5102">5102 - VENDA DENTRO DO ESTADO</option>
                              <option value="6102">6102 - VENDA FORA DO ESTADO</option>
                              <option value="5405">5405 - VENDA COM SUBSTITUIÇÃO TRIBUTÁRIA</option>
                              <option value="5933">5933 - PRESTAÇÃO DE SERVIÇO</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-titan-text-secondary opacity-40">
                             <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Natureza da Operação</label>
                        <input 
                            type="text" 
                            className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white placeholder:text-white/10 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none uppercase shadow-inner"
                            value={fiscalData.naturezaOperacao}
                            onChange={(e) => setFiscalData(prev => ({ ...prev, naturezaOperacao: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Meio de Pagamento</label>
                        <div className="relative">
                          <select 
                              className="w-full h-16 bg-black/40 border border-titan-border rounded-[24px] px-8 text-sm font-black text-white hover:border-titan-primary transition-all outline-none appearance-none uppercase tracking-widest shadow-inner"
                              value={fiscalData.meioPagamento}
                              onChange={(e) => setFiscalData(prev => ({ ...prev, meioPagamento: e.target.value }))}
                          >
                              <option value="dinheiro">DINHEIRO</option>
                              <option value="cartao_credito">CARTÃO DE CRÉDITO</option>
                              <option value="cartao_debito">CARTÃO DE DÉBITO</option>
                              <option value="pix">PIX</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-titan-text-secondary opacity-40">
                             <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.4em] px-4 opacity-60">Observações Fiscais</label>
                    <textarea 
                        className="w-full bg-black/40 border border-titan-border rounded-[32px] px-8 py-6 text-sm font-black text-white placeholder:text-white/10 focus:ring-4 focus:ring-titan-primary/10 transition-all outline-none min-h-[140px] resize-none uppercase shadow-inner leading-relaxed"
                        placeholder="EX: DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL..."
                        value={fiscalData.observacoes}
                        onChange={(e) => setFiscalData(prev => ({ ...prev, observacoes: e.target.value }))}
                    ></textarea>
                </div>

                <div className="p-8 bg-blue-600/10 rounded-[40px] border border-blue-500/20 flex items-center gap-6 shadow-2xl shadow-blue-500/5">
                    <div className="bg-blue-600/20 p-4 rounded-[20px] text-blue-500 border border-blue-500/20">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1">REVISÃO FINAL DE EMISSÃO</p>
                        <p className="text-xs text-blue-400 font-black uppercase tracking-[0.05em] leading-relaxed opacity-60">Confirme se todos os dados acima estão corretos. Uma nota emitida em ambiente de produção gera obrigações fiscais imediatas perante a SEFAZ.</p>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-12 py-10 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky bottom-0 z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 'tipo' || loading}
            className={cn(
                "h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                step === 'tipo' ? "opacity-0 invisible" : "bg-white/5 text-titan-text-secondary hover:bg-white/10"
            )}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Voltar
          </Button>

          <div className="flex items-center gap-6">
            {step !== 'fiscal' ? (
                <Button
                    onClick={handleNext}
                    className="h-16 px-12 rounded-[24px] bg-titan-primary hover:bg-titan-primary/90 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-titan-primary/20 transition-all hover:scale-105"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                    Próximo Passo
                </Button>
            ) : (
                <Button
                    onClick={handleEmit}
                    loading={loading}
                    className="h-16 px-12 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all hover:scale-105"
                    rightIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                    Confirmar Emissão
                </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
}
