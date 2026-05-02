import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Calendar, 
  User, 
  Hash,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { bikeService } from '../services/bikeService';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../hooks/useAuth';
import { Bike as BikeType, Customer } from '../domain/types';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

const BIKE_TYPES = ['MTB', 'Speed', 'Urbana', 'E-Bike', 'Infantil', 'Outra'];

export default function Bicicletas() {
  const { user } = useAuth();
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Partial<BikeType> | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubV = bikeService.subscribeAll(user.uid, (data) => {
      setBikes(data);
      setLoading(false);
    });
    const unsubC = clienteService.getCustomers(setCustomers);
    return () => {
      unsubV();
      unsubC();
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBike || !user) return;

    setSaveLoading(true);
    try {
      const bikeData = {
        ...editingBike,
        uid: user.uid,
        serialNumber: editingBike.serialNumber?.toUpperCase(),
      } as BikeType;

      if (editingBike.id) {
        await bikeService.update(editingBike.id, bikeData);
      } else {
        await bikeService.create(bikeData);
      }
      setIsModalOpen(false);
      setEditingBike(null);
    } catch (error) {
      console.error('Error saving bike:', error);
      alert('Erro ao salvar bicicleta');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredBikes = bikes.filter(v => 
    v.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <Bike className="w-7 h-7 text-titan-primary" />
            Frota de Bicicletas
          </h2>
          <p className="text-slate-400 font-medium text-sm">Gerencie as bicicletas vinculadas aos seus clientes</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBike({ brand: '', model: '', serialNumber: '', customerId: '', customerName: '', type: 'MTB' });
            setIsModalOpen(true);
          }}
          className="bg-titan-primary hover:bg-titan-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Bicicleta
        </Button>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por série, modelo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº de Série</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bicicleta</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietário</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBikes.length > 0 ? (
                filteredBikes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 w-fit">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase">{v.serialNumber || 'SEM SÉRIE'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{v.brand} {v.model}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">{v.type || 'N/A'} • {v.color || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-sm text-slate-500 font-medium">{v.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingBike(v);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-titan-primary"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Bike className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Nenhuma bicicleta cadastrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bicicleta */}
      <AnimatePresence>
        {isModalOpen && editingBike && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-titan-primary text-white">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Bike className="w-6 h-6" />
                  {editingBike.id ? 'Editar Bicicleta' : 'Nova Bicicleta'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proprietário</label>
                  <select
                    required
                    value={editingBike.customerId || ''}
                    onChange={(e) => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setEditingBike({ 
                        ...editingBike, 
                        customerId: e.target.value,
                        customerName: cust?.name || ''
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nº de Série / Quadro</label>
                    <input
                      type="text"
                      placeholder="Ex: XYZ12345"
                      value={editingBike.serialNumber || ''}
                      onChange={(e) => setEditingBike({ ...editingBike, serialNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-bold tracking-widest uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marca</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Specialized"
                      value={editingBike.brand || ''}
                      onChange={(e) => setEditingBike({ ...editingBike, brand: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modelo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Rockhopper"
                      value={editingBike.model || ''}
                      onChange={(e) => setEditingBike({ ...editingBike, model: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                    <select
                      required
                      value={editingBike.type || 'MTB'}
                      onChange={(e) => setEditingBike({ ...editingBike, type: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium text-xs"
                    >
                      {BIKE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ano</label>
                    <input
                      type="text"
                      placeholder="Ex: 2023"
                      value={editingBike.year || ''}
                      onChange={(e) => setEditingBike({ ...editingBike, year: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cor</label>
                    <input
                      type="text"
                      placeholder="Ex: Preta"
                      value={editingBike.color || ''}
                      onChange={(e) => setEditingBike({ ...editingBike, color: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-titan-primary transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saveLoading}
                    className="flex-1"
                  >
                    {editingBike.id ? 'Salvar Alterações' : 'Cadastrar Bicicleta'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
