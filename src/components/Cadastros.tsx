import React, { useState, useEffect } from 'react';
import { clienteService } from '../services/clienteService';
import { fornecedorService } from '../services/fornecedorService';
import { funcionarioService } from '../services/funcionarioService';
import { Customer, Supplier, Employee, Address } from '../domain/types';
import { 
  Users, 
  Truck, 
  UserCircle, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  Briefcase,
  Mail,
  Loader2,
  History,
  X,
  Bike,
  Shield,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { canDoAction } from '../lib/permissions';
import CardPadrao from './ui/CardPadrao';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import CustomerHistory from './CustomerHistory';
import ModalPadrao from './ui/ModalPadrao';

type Tab = 'clientes' | 'fornecedores' | 'funcionarios';

const emptyAddress: Address = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' };

interface UnifiedModalProps {
  type: Tab;
  data: any;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  updateData: (newData: any) => void;
  cepLoading: boolean;
  loading: boolean;
  handleCepLookup: (cep: string, setAddress: (addr: Address) => void, currentAddr: Address) => Promise<void>;
}

const UnifiedModal = ({ 
  type, 
  data, 
  onClose, 
  onSave,
  updateData,
  cepLoading,
  loading,
  handleCepLookup
}: UnifiedModalProps) => {
  const { isAdmin: isSystemAdmin, profile } = useAuth();
  const isClient = type === 'clientes';
  const isSupplier = type === 'fornecedores';
  const isEmployee = type === 'funcionarios';

  const getTitle = () => {
    const prefix = data.id ? 'EDITAR' : 'NOVO';
    if (isClient) return `${prefix} CLIENTE`;
    if (isSupplier) return `${prefix} FORNECEDOR`;
    return `${prefix} FUNCIONÁRIO`;
  };


  return (
    <ModalPadrao
      open={true}
      onClose={onClose}
      title={getTitle()}
      className="max-w-5xl"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest"
          >
            CANCELAR
          </Button>

          <Button
            type="submit"
            form="cadastro-unified-form"
            variant="primary"
            loading={loading}
            disabled={
              !data.name ||
              (
                isEmployee &&
                !canDoAction(
                  profile,
                  'cadastros',
                  data.id ? 'edit' : 'create'
                )
              )
            }
            className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
          >
            SALVAR REGISTRO
          </Button>
        </>
      }
    >
      <form id="cadastro-unified-form" onSubmit={onSave} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
              {isSupplier ? 'RAZÃO SOCIAL / DENOMINAÇÃO FANTASIA' : 'IDENTIFICAÇÃO NOMINAL'}
            </label>
            <input
              type="text" required
              value={data.name || ''}
              onChange={e => updateData({ name: e.target.value })}
              className="w-full font-black uppercase text-sm"
              placeholder="DIGITE O NOME..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">TELEFONE / CONTATO</label>
              <input
                type="text"
                value={data.phone || ''}
                onChange={e => updateData({ phone: e.target.value })}
                className="w-full font-black text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                {isEmployee ? 'FUNÇÃO' : (isClient || isSupplier ? 'CPF / CNPJ' : 'DOCUMENTAÇÃO')}
              </label>
              {isEmployee ? (
                <select
                  required
                  value={data.position || ''}
                  onChange={e => updateData({ position: e.target.value })}
                  className="w-full"
                >
                  <option value="">SELECIONE...</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Mecânico">Mecânico</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Administrador">Administrador</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={data.document || ''}
                  onChange={e => updateData({ document: e.target.value })}
                  className="w-full font-black text-sm"
                  placeholder="000.000.000-00"
                />
              )}
            </div>
          </div>

          {(isClient || isSupplier || isEmployee) && (
            <div>
              <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">ENDEREÇO ELETRÔNICO (E-MAIL)</label>
              <input
                type="email"
                required={isEmployee}
                value={data.email || ''}
                onChange={e => updateData({ email: e.target.value })}
                className="w-full font-black text-sm"
                placeholder="EXEMPLO@EMAIL.COM.BR"
              />
            </div>
          )}

          {isEmployee && (
            <div className="space-y-6 p-8 bg-black/40 rounded-[32px] border border-titan-border shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-6 h-6", data.isAdmin ? "text-titan-primary" : "text-titan-text-secondary")} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">PRIVILÉGIOS ADMINISTRATIVOS</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateData({ isAdmin: !data.isAdmin, active: true })}
                  className={cn(
                    "w-14 h-7 rounded-full transition-all relative p-1 shadow-sm",
                    data.isAdmin ? "bg-titan-primary" : "bg-white/10 border border-white/5"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full transition-all shadow-md",
                    data.isAdmin ? "translate-x-7" : "translate-x-0"
                  )} />
                </button>
              </div>

              {!data.isAdmin && (
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                    {data.active ? <Unlock className="w-6 h-6 text-emerald-500" /> : <Lock className="w-6 h-6 text-red-500" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">STATUS DA CREDENCIAL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateData({ active: !data.active })}
                    className={cn(
                      "w-14 h-7 rounded-full transition-all relative p-1 shadow-sm",
                      data.active ? "bg-emerald-500" : "bg-white/10 border border-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 bg-white rounded-full transition-all shadow-md",
                      data.active ? "translate-x-7" : "translate-x-0"
                    )} />
                  </button>
                </div>
              )}

              {!data.isAdmin && (
                <div className="pt-4">
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-6">
  MATRIZ DE PERMISSÕES OPERACIONAIS
</label>

<div className="space-y-5">
  {[
    { id: 'vendas', label: 'Vendas' },
    { id: 'orcamentos', label: 'Orçamentos' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'cadastros', label: 'Cadastros' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'configuracoes', label: 'Ajustes' },
  ].map((module) => {
    const moduleEnabled = data.permissions?.includes(module.id);
    const actions = ['view', 'create', 'edit', 'delete'] as const;

    return (
      <div
        key={module.id}
        className="p-5 rounded-3xl bg-white/5 border border-titan-border space-y-4"
      >
        <button
          type="button"
          onClick={() => {
            const current = data.permissions || [];
            const enabled = current.includes(module.id);

            const nextPermissions = enabled
              ? current.filter((p: string) => p !== module.id)
              : [...current, module.id];

            updateData({
              permissions: nextPermissions,
              permissionsActions: {
                ...(data.permissionsActions || {}),
                [module.id]: enabled
                  ? {}
                  : {
                      view: true,
                      create: true,
                      edit: true,
                      delete: false
                    }
              }
            });
          }}
          className={cn(
            "w-full flex items-center justify-between gap-4",
            moduleEnabled ? "text-titan-primary" : "text-white/40"
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">
            {module.label}
          </span>

          {moduleEnabled ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        {moduleEnabled && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            {actions.map((action) => {
              const checked =
                data.permissionsActions?.[module.id]?.[action] === true;

              const label =
                action === 'view'
                  ? 'Ver'
                  : action === 'create'
                  ? 'Criar'
                  : action === 'edit'
                  ? 'Editar'
                  : 'Excluir';

              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    updateData({
                      permissionsActions: {
                        ...(data.permissionsActions || {}),
                        [module.id]: {
                          ...(data.permissionsActions?.[module.id] || {}),
                          [action]: !checked
                        }
                      }
                    });
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-[0.18em] transition-all",
                    checked
                      ? "bg-titan-primary/20 border-titan-primary text-titan-primary"
                      : "bg-black/20 border-white/5 text-white/30"
                  )}
                >
                  {label}
                  {checked ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</div>
                </div>
              )}
            </div>
          )}

          {/* Common Address Section */}
          <div className="border-t border-titan-border pt-8">
            <h4 className="font-black text-white text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <div className="bg-titan-primary/20 p-2 rounded-xl">
                <MapPin className="w-5 h-5 text-titan-primary" />
              </div>
              DADOS LOGÍSTICOS
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">CÓDIGO POSTAL (CEP)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={data.address?.cep || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const currentAddr = data.address || emptyAddress;
                        updateData({ address: {...currentAddr, cep: val} });
                        if (val.length === 8) handleCepLookup(val, (addr) => updateData({ address: addr }), currentAddr);
                      }}
                      className="w-full font-black text-sm"
                      placeholder="00000-000"
                    />
                    {cepLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-titan-primary animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">NÚMERO</label>
                  <input
                    type="text"
                    value={data.address?.numero || ''}
                    onChange={e => updateData({ address: {...(data.address || emptyAddress), numero: e.target.value} })}
                    className="w-full font-black text-sm"
                    placeholder="S/N"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">LOGRADOURO / VIA</label>
                <input
                  type="text"
                  value={data.address?.logradouro || ''}
                  onChange={e => updateData({ address: {...(data.address || emptyAddress), logradouro: e.target.value} })}
                  className="w-full font-black uppercase text-sm"
                  placeholder="EX: AV. PAULISTA, RUA DAS FLORES..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">BAIRRO</label>
                  <input
                    type="text"
                    value={data.address?.bairro || ''}
                    onChange={e => updateData({ address: {...(data.address || emptyAddress), bairro: e.target.value} })}
                    className="w-full font-black uppercase text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">CIDADE / UNIDADE FEDERATIVA</label>
                  <input
                    type="text"
                    value={`${data.address?.cidade || ''}${data.address?.cidade && data.address?.estado ? ' / ' : ''}${data.address?.estado || ''}`}
                    readOnly
                    className="w-full opacity-50 cursor-not-allowed font-black uppercase text-sm bg-black/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {isSupplier && (
            <div className="pt-8 border-t border-titan-border">
              <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">MEMORANDO OPERACIONAL</label>
              <textarea
                value={data.notes || ''}
                onChange={e => updateData({ notes: e.target.value })}
                className="w-full font-bold uppercase text-xs"
                rows={4}
                placeholder="REGISTRE OBSERVAÇÕES RELEVANTES SOBRE ESTE FORNECEDOR..."
              />
            </div>
          )}
      </form>
    </ModalPadrao>
  );
};

export default function Cadastros() {
  const { isAdmin, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState<Partial<Customer> | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState<Partial<Supplier> | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState<Partial<Employee> | null>(null);
  const [showHistoryForCustomer, setShowHistoryForCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: Tab, name: string } | null>(null);

  useEffect(() => {
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    const unsubSuppliers = fornecedorService.getSuppliers(setSuppliers);
    const unsubEmployees = funcionarioService.getEmployees(setEmployees);

    return () => {
      unsubCustomers();
      unsubSuppliers();
      unsubEmployees();
    };
  }, []);

  const handleCepLookup = async (cep: string, setAddress: (addr: Address) => void, currentAddr: Address) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setAddress({
          ...currentAddr,
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCustomerModal) return;
    setLoading(true);
    try {
      if (showCustomerModal.id) {
        const { id, ...dataToUpdate } = showCustomerModal;
        await clienteService.updateCustomer(id!, dataToUpdate);
      } else {
        await clienteService.addCustomer(showCustomerModal as Omit<Customer, 'id' | 'createdAt'>);
      }
      setShowCustomerModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSupplierModal) return;
    setLoading(true);
    try {
      if (showSupplierModal.id) {
        const { id, ...dataToUpdate } = showSupplierModal;
        await fornecedorService.updateSupplier(id!, dataToUpdate);
      } else {
        await fornecedorService.addSupplier(showSupplierModal as Omit<Supplier, 'id' | 'createdAt'>);
      }
      setShowSupplierModal(null);
     } catch (error: any) {
  toast.error(error.message || 'Erro ao processar operação.');
} finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEmployeeModal) return;
    setLoading(true);
    try {
      if (showEmployeeModal.id) {
        const { id, ...dataToUpdate } = showEmployeeModal;
        await funcionarioService.updateEmployee(id!, dataToUpdate);
      } else {
        await funcionarioService.addEmployee({
          ...showEmployeeModal,
          active: true
        } as Omit<Employee, 'id' | 'createdAt'>);
      }
      setShowEmployeeModal(null);
    } catch (error: any) {
  toast.error(error.message || 'Erro ao processar operação.');
} finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const { id, type } = deleteConfirm;
      if (type === 'clientes') await clienteService.deleteCustomer(id);
      if (type === 'fornecedores') await fornecedorService.deleteSupplier(id);
      if (type === 'funcionarios') {
        if (!isAdmin) return;

        await funcionarioService.deleteEmployee(id);
      }
     setDeleteConfirm(null);
} catch (error: any) {
  toast.error(error.message || 'Erro ao processar operação.');
} finally {
  setLoading(false);
}
  };

  const filteredData = () => {
    if (activeTab === 'clientes') return customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.document.includes(searchTerm));
    if (activeTab === 'fornecedores') return suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.document.includes(searchTerm));
    if (activeTab === 'funcionarios' && !isAdmin) return [];
    return employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.position.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const emptyAddress: Address = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' };

  const handleUpdateData = (newData: any) => {
    if (activeTab === 'clientes') setShowCustomerModal(prev => prev ? { ...prev, ...newData } : null);
    if (activeTab === 'fornecedores') setShowSupplierModal(prev => prev ? { ...prev, ...newData } : null);
    if (activeTab === 'funcionarios') setShowEmployeeModal(prev => prev ? { ...prev, ...newData } : null);
  };

  const cadastroStats = [
  { 
    id: 'clientes',
    label: 'Total Clientes', 
    value: customers.length,
    icon: Users,
    variant: 'analytics'
  },

  { 
    id: 'fornecedores',
    label: 'Fornecedores', 
    value: suppliers.length,
    icon: Truck,
    variant: 'warning'
  },

  { 
    id: 'equipe',
    label: 'Equipe Ativa', 
    value: employees.filter(e => e.active).length,
    icon: Briefcase,
    variant: 'success'
  },

  { 
    id: 'novos',
    label: 'Clientes Novos (Mês)', 
    value: customers.filter(c => {
      const date = c.createdAt?.toDate
        ? c.createdAt.toDate()
        : new Date();

      return (
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear()
      );
    }).length,
    icon: TrendingUp,
    variant: 'finance'
  }
];

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
            <UserCircle className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
              Clientes/Prod
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
                Gestão Integrada de Entidades • Sincronizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              {[
                { id: 'clientes', label: 'Clientes', icon: Users },
                { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
                ...(isAdmin ? [{ id: 'funcionarios', label: 'Equipe', icon: Briefcase }] : []),
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'ghost'}
                  onClick={() => { setActiveTab(tab.id as Tab); setSearchTerm(''); }}
                  className={cn(
                    "px-6 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest",
                    activeTab === tab.id ? "" : "text-white/40 hover:text-white"
                  )}
                  leftIcon={<tab.icon className="w-3.5 h-3.5" />}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => {
                if (activeTab === 'clientes') setShowCustomerModal({ name: '', email: '', phone: '', document: '', address: emptyAddress });
                if (activeTab === 'fornecedores') setShowSupplierModal({ name: '', phone: '', email: '', document: '', address: emptyAddress });
                if (activeTab === 'funcionarios') {
                  if (!isAdmin) return;

                  setShowEmployeeModal({ name: '', email: '', phone: '', position: '', address: emptyAddress });
                }
              }}
              className="h-12 w-12 rounded-2xl bg-titan-primary shadow-xl shadow-titan-primary/20 p-0 flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(isAdmin ? cadastroStats : cadastroStats.filter(card => card.id !== 'equipe')).map((card, idx) => (
          <CardPadrao
  key={idx}
  title={card.label}
  value={card.value}
  icon={card.icon}
  variant={card.variant}
            onClick={() => {
              if (card.label === 'Total Clientes' || card.label === 'Clientes Novos (Mês)') {
                setActiveTab('clientes');
                setSearchTerm('');
              }
              if (card.label === 'Fornecedores') {
                setActiveTab('fornecedores');
                setSearchTerm('');
              }
              if (card.label === 'Equipe Ativa') {
                if (!isAdmin) return;

                setActiveTab('funcionarios');
                setSearchTerm('');
              }
            }}
            active={
              (activeTab === 'clientes' && (card.label === 'Total Clientes' || card.label === 'Clientes Novos (Mês)')) ||
              (activeTab === 'fornecedores' && card.label === 'Fornecedores') ||
              (activeTab === 'funcionarios' && card.label === 'Equipe Ativa')
            }
          />
        ))}
      </div>

      <>
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-titan-text-secondary group-focus-within:text-titan-primary transition-colors" />
          <input
            type="text"
            placeholder={`FILTRAR EM ${activeTab.toUpperCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 rounded-[24px] border border-titan-border bg-black/40 text-white focus:ring-4 focus:ring-titan-primary/10 outline-none transition-all uppercase text-[11px] font-black tracking-[0.3em] placeholder:text-titan-text-secondary/50 shadow-inner"
          />
        </div>

          {/* Grid List */}
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 md:gap-10">
            {filteredData().map((item: any) => (
              <motion.div
                layout
                key={item.id}
                className="card-premium rounded-[40px] overflow-hidden border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="p-8 md:p-10 space-y-8">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 min-w-0">
                      <h3 className="font-black text-white text-xl uppercase tracking-tighter leading-tight flex items-center gap-3">
                        {item.name}
                        {item.isAdmin && (
                          <div className="bg-titan-primary/10 p-1.5 rounded-lg border border-titan-primary/20">
                            <Shield className="w-4 h-4 text-titan-primary" />
                          </div>
                        )}
                      </h3>
                      <div className="flex items-center gap-3">
                        {!item.active && (
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-lg border border-red-500/20 tracking-widest shadow-sm">
                            INATIVO
                          </span>
                        )}
                        <p className="text-[10px] font-black text-titan-primary uppercase tracking-[0.2em] opacity-80">
                          {activeTab === 'funcionarios' ? `CARGO: ${item.position}` : `DOC: ${item.document || 'N/A'}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {activeTab === 'clientes' && (
                        <Button 
                          variant="secondary"
                          onClick={() => setShowHistoryForCustomer(item)}
                          className="w-11 h-11 p-0 rounded-2xl bg-white/5 border border-titan-border hover:bg-white/10 transition-colors"
                          title="Histórico de Compras"
                        >
                          <History className="w-5 h-5 text-white" />
                        </Button>
                      )}
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          if (activeTab === 'clientes') setShowCustomerModal(item);
                          if (activeTab === 'fornecedores') setShowSupplierModal(item);
                          if (activeTab === 'funcionarios') {
                            if (!isAdmin) return;

                            setShowEmployeeModal(item);
                          }
                        }}
                        className="w-11 h-11 p-0 rounded-2xl bg-white/5 border border-titan-border hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-5 h-5 text-white" />
                      </Button>
                      <Button 
  variant="secondary"
  disabled={
    activeTab === 'funcionarios' &&
    !canDoAction(profile, 'cadastros', 'delete')
  }
  onClick={() => setDeleteConfirm({ id: item.id, type: activeTab, name: item.name })}
  className="w-11 h-11 p-0 rounded-2xl bg-white/5 border border-titan-border hover:bg-red-500/10 transition-colors"
>
                        <Trash2 className="w-5 h-5 text-red-500/70" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-5 p-8 bg-black/40 rounded-[32px] border border-titan-border shadow-inner">
                    {item.phone && (
                      <div className="flex items-center gap-4 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] opacity-80">
                        <div className="bg-white/5 p-2 rounded-xl">
                          <Phone className="w-4 h-4 text-titan-primary" />
                        </div>
                        {item.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] opacity-80">
                      <div className="bg-white/5 p-2 rounded-xl">
                        <Mail className="w-4 h-4 text-titan-primary" />
                      </div>
                      {item.email || '— — — — —'}
                    </div>
                    {item.address && (
                      <div className="flex items-start gap-4 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] opacity-80">
                        <div className="bg-white/5 p-2 rounded-xl shrink-0">
                          <MapPin className="w-4 h-4 text-titan-primary" />
                        </div>
                        <span className="line-clamp-2 leading-relaxed">
                          {item.address.logradouro}, {item.address.numero}<br/>
                          {item.address.bairro} — {item.address.cidade}/{item.address.estado}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>

      {/* Modals */}
      <AnimatePresence>
        {showCustomerModal && (
          <UnifiedModal 
            type="clientes" 
            data={showCustomerModal} 
            onClose={() => setShowCustomerModal(null)} 
            onSave={handleSaveCustomer}
            updateData={handleUpdateData}
            cepLoading={cepLoading}
            loading={loading}
            handleCepLookup={handleCepLookup}
          />
        )}

        {showSupplierModal && (
          <UnifiedModal 
            type="fornecedores" 
            data={showSupplierModal} 
            onClose={() => setShowSupplierModal(null)} 
            onSave={handleSaveSupplier}
            updateData={handleUpdateData}
            cepLoading={cepLoading}
            loading={loading}
            handleCepLookup={handleCepLookup}
          />
        )}

        {showEmployeeModal && (
          <UnifiedModal 
            type="funcionarios" 
            data={showEmployeeModal} 
            onClose={() => setShowEmployeeModal(null)} 
            onSave={handleSaveEmployee}
            updateData={handleUpdateData}
            cepLoading={cepLoading}
            loading={loading}
            handleCepLookup={handleCepLookup}
          />
        )}

        {showHistoryForCustomer && (
  <ModalPadrao
    open={true}
    onClose={() => setShowHistoryForCustomer(null)}
    title="HISTÓRICO TRANSACIONAL"
  >
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 rounded-[28px] border border-white/5 bg-black/30">
        <div className="w-16 h-16 rounded-[24px] bg-titan-primary flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30">
          <History className="w-8 h-8" />
        </div>

        <div>
          <p className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] opacity-60">
            Auditoria de Negócios
          </p>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight">
            {showHistoryForCustomer.name}
          </h3>
        </div>
      </div>

      <CustomerHistory
        customerId={showHistoryForCustomer.id!}
        onClose={() => setShowHistoryForCustomer(null)}
      />
    </div>
  </ModalPadrao>
)}

        {deleteConfirm && (
  <ModalPadrao
    open={true}
    onClose={() => setDeleteConfirm(null)}
    title="REMOVER REGISTRO"
    footer={
      <>
        <Button
          variant="ghost"
          onClick={() => setDeleteConfirm(null)}
          className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest"
        >
          CANCELAR
        </Button>

        <Button
          variant="danger"
          loading={loading}
          onClick={handleDelete}
          className="flex-1 h-14 rounded-2xl bg-red-600 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-600/20"
        >
          CONFIRMAR EXCLUSÃO
        </Button>
      </>
    }
  >
    <div className="text-center space-y-8 py-6">

      <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.2)] border border-red-500/20">
        <Trash2 className="w-10 h-10" />
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
          REMOVER REGISTRO?
        </h3>

        <p className="text-[11px] text-titan-text-secondary font-black uppercase tracking-[0.2em] leading-relaxed">
          REALMENTE DESEJA EXCLUIR
        </p>

        <div className="inline-flex px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-widest">
          {deleteConfirm.name}
        </div>

        <p className="text-[10px] text-red-400/70 font-black uppercase tracking-[0.2em]">
                    ESTA AÇÃO É IRREVERSÍVEL
        </p>
      </div>
    </div>
  </ModalPadrao>
)}
      </AnimatePresence>
    </div>
  );
}