import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  FileText, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight,
  Filter,
  Package,
  Calendar,
  MoreHorizontal,
  PackageCheck,
  FileCode,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { fornecedorService } from '../services/fornecedorService';
import { estoqueService } from '../services/estoqueService';
import { useAuth } from '../hooks/useAuth';
import { PurchaseOrder, Supplier, Product, PurchaseItem } from '../domain/types';
import { formatCurrency, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Compras() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // New Order Form State
  const [newOrderSupplierId, setNewOrderSupplierId] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<PurchaseItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = purchaseService.subscribeAll(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    const unsubSuppliers = fornecedorService.getSuppliers(setSuppliers);
    const unsubProducts = estoqueService.getProducts(setProducts);

    return () => {
      unsub();
      unsubSuppliers();
      unsubProducts();
    };
  }, [user]);

  const totalNewOrder = newOrderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const filteredOrders = orders.filter(order => 
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.purchaseNumber.toString().includes(searchTerm)
  );

  const filteredProducts = products.filter(p => 
    !productSearchTerm || 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'recebido':
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Recebido</span>;
      case 'pendente':
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">Pendente</span>;
      case 'cancelado':
        return <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest">Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-500/10 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">Rascunho</span>;
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrderSupplierId) {
      alert('Selecione um fornecedor.');
      return;
    }
    if (newOrderItems.length === 0) {
      alert('Adicione pelo menos um item.');
      return;
    }

    setIsSaving(true);
    try {
      const supplier = suppliers.find(s => s.id === newOrderSupplierId);
      const purchaseNumber = orders.length > 0 ? Math.max(...orders.map(o => o.purchaseNumber || 0)) + 1 : 1;

      const orderData: Omit<PurchaseOrder, 'id'> = {
        purchaseNumber,
        supplierId: newOrderSupplierId,
        supplierName: supplier?.name || 'Fornecedor Desconhecido',
        items: newOrderItems,
        totalAmount: totalNewOrder,
        status: 'pendente',
        userId: user!.uid,
        userName: profile?.name || user?.displayName || 'Usuário',
        createdAt: new Date()
      };

      await purchaseService.create(orderData);
      setIsModalOpen(false);
      setNewOrderSupplierId('');
      setNewOrderItems([]);
      setProductSearchTerm('');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erro ao criar pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceive = async (order: PurchaseOrder) => {
    if (confirm('Deseja confirmar o recebimento desta compra? O estoque será atualizado automaticamente.')) {
      try {
        await purchaseService.receiveOrder(order, user!.uid, profile?.name || user?.displayName || 'Usuário');
      } catch (error) {
        console.error('Error receiving order:', error);
        alert('Erro ao receber pedido.');
      }
    }
  };

  const addProductToOrder = (product: Product) => {
    const existing = newOrderItems.find(i => i.productId === product.id);
    if (existing) {
      setNewOrderItems(newOrderItems.map(i => 
        i.productId === product.id 
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.costPrice }
          : i
      ));
    } else {
      setNewOrderItems([...newOrderItems, {
        productId: product.id!,
        name: product.name,
        quantity: 1,
        costPrice: product.costPrice || 0,
        totalPrice: product.costPrice || 0
      }]);
    }
  };

  const removeProductFromOrder = (productId: string) => {
    setNewOrderItems(newOrderItems.filter(i => i.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setNewOrderItems(newOrderItems.map(i => 
      i.productId === productId 
        ? { ...i, quantity, totalPrice: quantity * i.costPrice }
        : i
    ));
  };

  const simulateXMLImport = () => {
    alert('Simulando leitura de nota fiscal XML... \n\nFornecedor: BICICLO PARTS LTDA\nProdutos Identificados: 2\nValor Total: R$ 1.250,00');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3 font-sans">
            <ShoppingBag className="w-8 h-8 text-titan-primary" />
            Gestão de Compras
          </h1>
          <p className="text-white/40 font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Controle de suprimentos • Sincronizado</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={simulateXMLImport}
            className="text-white border-white/10 hover:bg-white/5 h-12 px-6 rounded-xl"
          >
            <FileCode className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Importar XML</span>
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-titan-primary hover:bg-titan-primary/90 text-white shadow-lg shadow-titan-primary/20 h-12 px-6 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Novo Pedido</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Pendentes</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            {orders.filter(o => o.status === 'pendente').length}
          </p>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-2">
            <PackageCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Recebidos</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            {orders.filter(o => o.status === 'recebido').length}
          </p>
        </div>
        <div className="md:col-span-2 card-premium p-6 flex flex-col justify-center">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Sugestão de Compra</span>
          <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[11px] tracking-tight">
            <AlertTriangle className="w-4 h-4" />
            Ver {products.filter(p => p.stock <= p.minStock).length} itens abaixo do estoque mínimo
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-white/5 space-y-4 bg-white/[0.02]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Buscar por fornecedor ou número do pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Pedido</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Fornecedor</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Itens</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest">Valor Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-titan-primary tracking-tight">#{order.purchaseNumber}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase truncate max-w-[200px]">{order.supplierName}</span>
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">
                           {order.createdAt ? format(order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-2 py-1 bg-white/5 text-white/40 rounded-lg text-[10px] font-black">{order.items.length}</span>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-black text-white tracking-tighter">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="w-10 h-10 p-0 rounded-xl bg-white/5 text-white/40 hover:text-white"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {order.status === 'pendente' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReceive(order)}
                            className="w-10 h-10 p-0 rounded-xl bg-white/5 text-white/40 hover:text-emerald-500"
                          >
                            <PackageCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Nenhum pedido de compra encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-titan-background border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Novo Pedido de Compra</h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Abastecimento de estoque</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Selection Side */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-titan-primary uppercase tracking-widest flex items-center gap-2">
                        <Truck className="w-4 h-4 ml-1" />
                        1. Selecionar Fornecedor
                      </h3>
                      <select
                        value={newOrderSupplierId}
                        onChange={(e) => setNewOrderSupplierId(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-bold uppercase text-xs"
                      >
                        <option value="">Escolha um fornecedor...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} - {s.document}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-titan-primary uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-4 h-4 ml-1" />
                        2. Adicionar Produtos
                      </h3>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          placeholder="Pesquisar estoque..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {productSearchTerm ? (
                          filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                              <div 
                                key={product.id}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-titan-primary/30 hover:bg-white/[0.08] transition-all cursor-pointer group"
                                onClick={() => addProductToOrder(product)}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-black text-white uppercase truncate">{product.name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{product.sku}</span>
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em]",
                                      product.stock <= product.minStock ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                      Estoque: {product.stock}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right pl-4">
                                  <span className="text-sm font-black text-white tracking-tight">{formatCurrency(product.costPrice || 0)}</span>
                                  <Plus className="w-4 h-4 text-white/20 group-hover:text-titan-primary ml-auto mt-1 transition-colors" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-white/20">
                              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum produto encontrado</p>
                            </div>
                          )
                        ) : (
                          <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Digite para buscar produtos</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Side */}
                  <div className="space-y-6">
                    <div className="bg-white/5 rounded-[32px] p-8 border border-white/5 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Resumo do Pedido</h3>
                        <span className="px-3 py-1 bg-titan-primary/10 text-titan-primary text-[10px] font-black uppercase rounded-full border border-titan-primary/20">
                          {newOrderItems.length} Itens
                        </span>
                      </div>

                      <div className="flex-1 space-y-4 overflow-y-auto pr-2 mb-8 custom-scrollbar min-h-[300px]">
                        {newOrderItems.map(item => (
                          <div key={item.productId} className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl group transition-all hover:bg-white/[0.08]">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white uppercase truncate">{item.name}</p>
                              </div>
                              <button 
                                onClick={() => removeProductFromOrder(item.productId)}
                                className="text-white/20 hover:text-rose-500 transition-colors p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1">
                                <button 
                                  onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all font-black"
                                >-</button>
                                <span className="w-8 text-center text-xs font-black text-white font-sans">{item.quantity}</span>
                                <button 
                                  onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all font-black"
                                >+</button>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-white/40 font-black uppercase tracking-widest mb-1">Custo Total</p>
                                <p className="text-sm font-black text-white tracking-tight">{formatCurrency(item.totalPrice)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {newOrderItems.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                            <ShoppingBag className="w-12 h-12 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Nenhum produto adicionado</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-8 border-t border-white/5 space-y-6">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-white/40 uppercase tracking-widest">Total do Pedido</span>
                          <span className="text-4xl font-black text-white tracking-tighter">{formatCurrency(totalNewOrder)}</span>
                        </div>
                        <Button
                          onClick={handleCreateOrder}
                          loading={isSaving}
                          disabled={isSaving || newOrderItems.length === 0 || !newOrderSupplierId}
                          className="w-full h-16 bg-titan-primary hover:bg-titan-primary/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-titan-primary/20 flex items-center justify-center gap-3"
                        >
                          <Plus className="w-5 h-5" />
                          Salvar Pedido Pendente
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-titan-background border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-titan-primary/10 flex items-center justify-center text-titan-primary">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Pedido #{selectedOrder.purchaseNumber}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-titan-primary animate-pulse" />
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Detalhes da Compra</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6 bg-white/5 rounded-2xl p-6 border border-white/5 shadow-inner">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Fornecedor</p>
                    <p className="text-lg font-black text-white uppercase tracking-tight leading-none">{selectedOrder.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                       <Package className="w-3.5 h-3.5" />
                       Itens Identificados
                    </h3>
                    <span className="px-3 py-1 bg-white/5 text-white/40 text-[9px] font-black uppercase rounded-full">
                      {selectedOrder.items.length} PRODUTOS
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white uppercase truncate">{item.name}</p>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Qtd: {item.quantity} x {formatCurrency(item.costPrice)}</p>
                        </div>
                        <span className="text-sm font-black text-white tracking-tight">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Geral do Pedido</p>
                    <p className="text-3xl font-black text-titan-primary tracking-tighter leading-none">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    {selectedOrder.status === 'pendente' && (
                      <Button
                        onClick={() => {
                          handleReceive(selectedOrder);
                          setSelectedOrder(null);
                        }}
                        className="flex-1 sm:flex-initial h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-2"
                      >
                        <PackageCheck className="w-5 h-5" />
                        Confirmar Recebimento
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 sm:flex-initial h-14 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl px-8 font-black uppercase tracking-widest"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

