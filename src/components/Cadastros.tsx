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
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import CustomerHistory from './CustomerHistory';
import Bicicletas from './Bicicletas';

type Tab = 'clientes' | 'fornecedores' | 'funcionarios' | 'bicicletas';

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
  const { isAdmin: isSystemAdmin } = useAuth();
  const isClient = type === 'clientes';
  const isSupplier = type === 'fornecedores';
  const isEmployee = type === 'funcionarios';

  const getTitle = () => {
    const prefix = data.id ? 'Editar' : 'Novo';
    if (isClient) return `${prefix} Cliente`;
    if (isSupplier) return `${prefix} Fornecedor`;
    return `${prefix} Funcionário`;
  };

  const getIcon = () => {
    if (isClient) return <Users className="w-6 h-6" />;
    if (isSupplier) return <Truck className="w-6 h-6" />;
    return <Briefcase className="w-6 h-6" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-titan-primary text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
            {getIcon()}
            {getTitle()}
          </h3>
          <Button 
            variant="ghost"
            onClick={onClose} 
            className="p-1 h-auto text-white active:bg-white/20 rounded-full"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </Button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {isSupplier ? 'Razão Social / Nome Fantasia' : 'Nome do Registro'}
            </label>
            <input
              type="text" required
              value={data.name || ''}
              onChange={e => updateData({ name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-titan-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Telefone</label>
              <input
                type="text"
                value={data.phone || ''}
                onChange={e => updateData({ phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                {isEmployee ? 'Cargo' : (isClient || isSupplier ? 'CPF / CNPJ' : 'Documento')}
              </label>
              {isEmployee ? (
                <select
                  required
                  value={data.position || ''}
                  onChange={e => updateData({ position: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Selecione...</option>
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Email Field - Shown for all types now */}
          {(isClient || isSupplier || isEmployee) && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">E-mail</label>
              <input
                type="email"
                required={isEmployee}
                value={data.email || ''}
                onChange={e => updateData({ email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          {isEmployee && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={cn("w-5 h-5", data.isAdmin ? "text-blue-600" : "text-slate-400")} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Acesso Administrador</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateData({ isAdmin: !data.isAdmin, active: true })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    data.isAdmin ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    data.isAdmin ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              {!data.isAdmin && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    {data.active ? <Unlock className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-red-600" />}
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Acesso Ativo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateData({ active: !data.active })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      data.active ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      data.active ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              )}

              {!data.isAdmin && (
                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Permissões Adicionais</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'crm', label: 'CRM' },
                      { id: 'pos-venda', label: 'Pós-Venda' },
                      { id: 'financeiro', label: 'Financeiro' },
                      { id: 'comissoes', label: 'Comissões' },
                      { id: 'dre', label: 'DRE' },
                      { id: 'fiscal', label: 'Fiscal' },
                      { id: 'relatorios', label: 'Relatórios' },
                      { id: 'configuracoes', label: 'Ajustes' },
                    ].map(perm => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => {
                          const current = data.permissions || [];
                          const next = current.includes(perm.id) 
                            ? current.filter((p: string) => p !== perm.id)
                            : [...current, perm.id];
                          updateData({ permissions: next });
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all",
                          data.permissions?.includes(perm.id)
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                            : "bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        )}
                      >
                        {data.permissions?.includes(perm.id) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        {perm.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Common Address Section */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Endereço
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={data.address?.cep || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const currentAddr = data.address || emptyAddress;
                        updateData({ address: {...currentAddr, cep: val} });
                        if (val.length === 8) handleCepLookup(val, (addr) => updateData({ address: addr }), currentAddr);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {cepLoading && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Número</label>
                  <input
                    type="text"
                    value={data.address?.numero || ''}
                    onChange={e => updateData({ address: {...(data.address || emptyAddress), numero: e.target.value} })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Logradouro</label>
                <input
                  type="text"
                  value={data.address?.logradouro || ''}
                  onChange={e => updateData({ address: {...(data.address || emptyAddress), logradouro: e.target.value} })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Bairro</label>
                  <input
                    type="text"
                    value={data.address?.bairro || ''}
                    onChange={e => updateData({ address: {...(data.address || emptyAddress), bairro: e.target.value} })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Cidade/UF</label>
                  <input
                    type="text"
                    value={`${data.address?.cidade || ''}${data.address?.cidade && data.address?.estado ? ' / ' : ''}${data.address?.estado || ''}`}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none text-slate-500 dark:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {isSupplier && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Observações / Histórico</label>
              <textarea
                value={data.notes || ''}
                onChange={e => updateData({ notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3 pt-6 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 shrink-0">
            <Button 
              type="button" 
              variant="ghost"
              onClick={onClose} 
              className="flex-1 h-14"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="success"
              loading={loading}
              disabled={!data.name} 
              className="flex-1 h-14 shadow-xl"
            >
              Salvar Registro
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function Cadastros() {
  const { isAdmin } = useAuth();
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
      alert(error.message);
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
      alert(error.message);
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
      alert(error.message);
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
      if (type === 'funcionarios') await funcionarioService.deleteEmployee(id);
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    if (activeTab === 'clientes') return customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.document.includes(searchTerm));
    if (activeTab === 'fornecedores') return suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.document.includes(searchTerm));
    return employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.position.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const emptyAddress: Address = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' };

  const handleUpdateData = (newData: any) => {
    if (activeTab === 'clientes') setShowCustomerModal(prev => prev ? { ...prev, ...newData } : null);
    if (activeTab === 'fornecedores') setShowSupplierModal(prev => prev ? { ...prev, ...newData } : null);
    if (activeTab === 'funcionarios') setShowEmployeeModal(prev => prev ? { ...prev, ...newData } : null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-premium p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-titan-primary p-3 rounded-[8px] text-white shadow-lg shadow-titan-primary/20">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Registros Titan ERP</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerencie clientes, fornecedores e equipe</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-96">
          {/* Row 1: Clientes e Fornecedores */}
          <div className="flex gap-2">
            {[
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'outline'}
                onClick={() => { setActiveTab(tab.id as Tab); setSearchTerm(''); }}
                className={cn(
                  "flex-1 h-11",
                  activeTab !== tab.id ? "border-slate-200 dark:border-slate-700 text-slate-400 bg-transparent active:bg-slate-50 shadow-none" : "bg-white dark:bg-slate-800 text-titan-primary shadow-sm"
                )}
                leftIcon={<tab.icon className="w-4 h-4" />}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Row 2: Equipe, Bicicletas e Novo */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'funcionarios' ? 'primary' : 'outline'}
              onClick={() => { setActiveTab('funcionarios'); setSearchTerm(''); }}
              className={cn(
                "flex-1 h-11 shadow-none px-2",
                activeTab !== 'funcionarios' ? "border-slate-200 dark:border-slate-700 text-slate-400 bg-transparent active:bg-slate-50" : "bg-white dark:bg-slate-800 text-titan-primary"
              )}
              leftIcon={<Briefcase className="w-4 h-4" />}
            >
              Equipe
            </Button>
            <Button
              variant={activeTab === 'bicicletas' ? 'primary' : 'outline'}
              onClick={() => { setActiveTab('bicicletas'); setSearchTerm(''); }}
              className={cn(
                "flex-1 h-11 shadow-none px-2",
                activeTab !== 'bicicletas' ? "border-slate-200 dark:border-slate-700 text-slate-400 bg-transparent active:bg-slate-50" : "bg-white dark:bg-slate-800 text-titan-primary"
              )}
              leftIcon={<Bike className="w-4 h-4" />}
            >
              Bicicletas
            </Button>
            {activeTab !== 'bicicletas' && (
              <Button
                variant="primary"
                onClick={() => {
                  if (activeTab === 'clientes') setShowCustomerModal({ name: '', email: '', phone: '', document: '', address: emptyAddress });
                  if (activeTab === 'fornecedores') setShowSupplierModal({ name: '', phone: '', email: '', document: '', address: emptyAddress });
                  if (activeTab === 'funcionarios') setShowEmployeeModal({ name: '', email: '', phone: '', position: '', address: emptyAddress });
                }}
                className="flex-none h-11 w-11 p-0 bg-emerald-600 active:bg-emerald-700 shadow-emerald-500/20"
              >
                <Plus className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'bicicletas' ? (
        <Bicicletas />
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={`Buscar em ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-titan-primary outline-none transition-colors uppercase text-[10px] font-black tracking-widest placeholder:text-slate-400"
            />
          </div>

          {/* Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredData().map((item: any) => (
              <motion.div
                layout
                key={item.id}
                className="card-premium overflow-hidden shadow-sm"
              >
                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white transition-colors text-base uppercase tracking-tight flex items-center gap-2">
                        {item.name}
                        {item.isAdmin && <Shield className="w-4 h-4 text-blue-600" />}
                      </h3>
                      <div className="flex items-center gap-2">
                        {!item.active && <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[8px] font-black uppercase rounded tracking-widest">Inativo</span>}
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {activeTab === 'funcionarios' ? item.position : item.document}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {activeTab === 'clientes' && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistoryForCustomer(item)}
                          className="p-2.5 h-auto text-slate-400"
                          title="Histórico de Compras"
                        >
                          <History className="w-4.5 h-4.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (activeTab === 'clientes') setShowCustomerModal(item);
                          if (activeTab === 'fornecedores') setShowSupplierModal(item);
                          if (activeTab === 'funcionarios') setShowEmployeeModal(item);
                        }}
                        className="p-2.5 h-auto text-slate-400"
                      >
                        <Edit3 className="w-4.5 h-4.5" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ id: item.id, type: activeTab, name: item.name })}
                        className="p-2.5 h-auto text-slate-400"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    {item.phone && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        <Phone className="w-4 h-4 text-titan-primary/50" />
                        {item.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      <Mail className="w-4 h-4 text-titan-primary/50" />
                      {item.email || '—'}
                    </div>
                    {item.address && (
                      <div className="flex items-start gap-2 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-4 h-4 text-titan-primary/50 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {item.address.logradouro}, {item.address.numero}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col border border-white/20 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      Histórico
                    </h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {showHistoryForCustomer.name}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowHistoryForCustomer(null)} 
                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-700 flex items-center justify-center shadow-sm"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <CustomerHistory 
                  customerId={showHistoryForCustomer.id!} 
                  onClose={() => setShowHistoryForCustomer(null)} 
                />
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>? 
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 h-14"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    loading={loading}
                    onClick={handleDelete}
                    className="flex-1 h-14"
                  >
                    Sim, Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
