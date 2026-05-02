import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
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
          alert('Para NF-e, o documento do cliente é obrigatório.');
          return;
        }
        if (docRaw.length !== 11 && docRaw.length !== 14) {
          alert('Por favor, informe um CPF ou CNPJ válido (11 ou 14 dígitos).');
          return;
        }
      } else if (docRaw && docRaw.length !== 11 && docRaw.length !== 14) {
        // If NFC-e but user typed something, it must be valid
        alert('O CPF/CNPJ digitado não é válido (deve ter 11 ou 14 dígitos).');
        return;
      }
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
        alert('Não é possível emitir nota sem itens.');
        setLoading(false);
        return;
      }

      if (config.modoFiscal === 'producao' && !config.focusApiKey) {
        alert('API Key da Focus NFe não configurada para modo produção.');
        setLoading(false);
        return;
      }

      await fiscalService.emitNote(note);
      alert('Nota fiscal emitida com sucesso!');
      onClose();
    } catch (error: any) {
      console.error("Erro na emissão fiscal:", error);
      alert(error.message || 'Erro ao emitir nota.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white">
              <FileBadge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Emissão de Nota Fiscal</h3>
                {config.modoFiscal === 'simulacao' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-md tracking-widest border border-amber-200">Simulação</span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{record.origin === 'venda' ? 'Venda' : 'OS'} #{record.data.saleNumber || record.data.osNumber} • {formatCurrency(record.data.totalAmount)}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="p-3 h-auto rounded-full group">
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
          </Button>
        </div>

        {config.modoFiscal === 'simulacao' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 px-10 py-3 border-b border-amber-100 dark:border-amber-800/50 flex items-center gap-3">
             <Info className="w-4 h-4 text-amber-600" />
             <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">
               Ambiente de Simulação Ativado - A nota não será enviada para a SEFAZ
             </p>
          </div>
        )}

        {/* Stepper Progress */}
        <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
            {[
                { id: 'tipo', label: 'Tipo', icon: FileText },
                { id: 'dados', label: 'Cliente', icon: User },
                { id: 'itens', label: 'Itens', icon: ShoppingBag },
                { id: 'fiscal', label: 'Fiscal', icon: FileBadge }
            ].map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                        step === s.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "text-slate-400"
                    )}>
                        <s.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                    {idx < 3 && <div className="w-8 h-px bg-slate-100 dark:bg-slate-800" />}
                </React.Fragment>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            {step === 'tipo' && (
              <motion.div
                key="tipo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-10">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">Qual o destino desta operação?</h4>
                    <p className="text-slate-500 font-medium">Escolha o modelo de nota fiscal adequado</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button
                    variant="outline"
                    onClick={() => setTipo('nfce')}
                    className={cn(
                        "p-10 h-auto rounded-[40px] border text-left transition-all relative overflow-hidden group flex flex-col items-start",
                        tipo === 'nfce' ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-xl shadow-indigo-500/10" : "border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                    )}
                  >
                    <div className={cn(
                        "p-4 rounded-3xl mb-6 inline-block transition-all",
                        tipo === 'nfce' ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                        <Receipt className="w-8 h-8" />
                    </div>
                    {tipo === 'nfce' && <CheckCircle2 className="w-6 h-6 text-indigo-600 absolute top-8 right-8" />}
                    <h5 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">NFC-e</h5>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Nota Fiscal do Consumidor Eletrônica. Ideal para vendas diretas no balcão para pessoa física.</p>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setTipo('nfe')}
                    className={cn(
                       "p-10 h-auto rounded-[40px] border text-left transition-all relative overflow-hidden group flex flex-col items-start",
                       tipo === 'nfe' ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-xl shadow-indigo-500/10" : "border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                    )}
                  >
                    <div className={cn(
                        "p-4 rounded-3xl mb-6 inline-block transition-all",
                        tipo === 'nfe' ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    )}>
                        <FileText className="w-8 h-8" />
                    </div>
                    {tipo === 'nfe' && <CheckCircle2 className="w-6 h-6 text-indigo-600 absolute top-8 right-8" />}
                    <h5 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">NF-e</h5>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Nota Fiscal Eletrônica. Obrigatória para vendas interestaduais, devoluções ou vendas entre empresas.</p>
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
                className="space-y-8"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome / Razão Social</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={customerData.nome}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CPF / CNPJ</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={customerData.documento}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, documento: e.target.value }))}
                      />
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço do Destinatário</h6>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Logradouro</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
                                value={customerData.endereco.logradouro}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Número</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
                                value={customerData.endereco.numero}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, numero: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Bairro</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
                                value={customerData.endereco.bairro}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Cidade</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
                                value={customerData.endereco.cidade}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, cidade: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">UF</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
                                maxLength={2}
                                value={customerData.endereco.estado}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">CEP</label>
                            <input 
                                type="text" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold"
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
                className="space-y-6"
              >
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qtde</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Unitário</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(record.data.items || []).map((it: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[300px]">{it.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{it.type === 'product' ? 'Produto' : 'Serviço'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-400">
                                        {it.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-400">
                                        {formatCurrency(it.unitPrice)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-indigo-600">
                                        {formatCurrency(it.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-indigo-600 text-white font-black">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-widest text-xs opacity-70">Total da Nota</td>
                                <td className="px-6 py-4 text-right text-xl tracking-tighter">{formatCurrency(record.data.totalAmount)}</td>
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
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CFOP Predominante</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none"
                            value={fiscalData.cfop}
                            onChange={(e) => setFiscalData(prev => ({ ...prev, cfop: e.target.value }))}
                        >
                            <option value="5102">5102 - Venda dentro do estado</option>
                            <option value="6102">6102 - Venda fora do estado</option>
                            <option value="5405">5405 - Venda com substituição tributária</option>
                            <option value="5933">5933 - Prestação de Serviço</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Natureza da Operação</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                            value={fiscalData.naturezaOperacao}
                            onChange={(e) => setFiscalData(prev => ({ ...prev, naturezaOperacao: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Meio de Pagamento</label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none"
                            value={fiscalData.meioPagamento}
                            onChange={(e) => setFiscalData(prev => ({ ...prev, meioPagamento: e.target.value }))}
                        >
                            <option value="dinheiro">Dinheiro</option>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="cartao_debito">Cartão de Débito</option>
                            <option value="pix">PIX</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Observações Fiscais</label>
                    <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl px-6 py-4 text-sm font-bold outline-none min-h-[120px]"
                        placeholder="Ex: Documento emitido por ME ou EPP optante pelo Simples Nacional..."
                        value={fiscalData.observacoes}
                        onChange={(e) => setFiscalData(prev => ({ ...prev, observacoes: e.target.value }))}
                    ></textarea>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest leading-none mb-1">Revisão Final</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Confirme se todos os dados acima estão corretos. Uma nota emitida em ambiente de produção gera obrigações fiscais.</p>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-md sticky bottom-0 z-10">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 'tipo' || loading}
            className={cn(
                "px-6 py-3 rounded-2xl",
                step === 'tipo' ? "opacity-0 invisible" : ""
            )}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            {step !== 'fiscal' ? (
                <Button
                    onClick={handleNext}
                    variant="primary"
                    className="px-8 h-14 shadow-lg shadow-slate-200 dark:shadow-none"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                    Próximo Passo
                </Button>
            ) : (
                <Button
                    onClick={handleEmit}
                    variant="primary"
                    loading={loading}
                    className="px-12 h-16 rounded-[32px] tracking-[2px] shadow-xl shadow-indigo-500/20"
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
}
