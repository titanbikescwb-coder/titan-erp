import React, { useState, useEffect } from 'react';
import { estoqueService } from '../services/estoqueService';
import { servicoService } from '../services/servicoService';
import { Product, ProductMovement, ServiceItem } from '../domain/types';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  Edit3,
  Trash2,
  Barcode,
  Tag,
  Boxes,
  Filter,
  Calculator,
  FileCode,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Wrench,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import CalculadoraPrecificacao from './CalculadoraPrecificacao';
import { Button } from './ui/Button';
import * as ReactWindow from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const FixedSizeList = (ReactWindow as any).FixedSizeList;
const AutoSizerAny = AutoSizer as any;

export default function Estoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');
  const [activeView, setActiveView] = useState<'list' | 'history' | 'services'>('list');
  const [showProductModal, setShowProductModal] = useState<Partial<Product> | null>(null);
  const [showServiceModal, setShowServiceModal] = useState<Partial<ServiceItem> | null>(null);
  const [showMovementModal, setShowMovementModal] = useState<Product | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlProducts, setXmlProducts] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'product' | 'service' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Movement Form
  const [mType, setMType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [mQty, setMQty] = useState('');
  const [mReason, setMReason] = useState('');

  useEffect(() => {
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubMovements = estoqueService.getMovements(null, setMovements);
    const unsubServices = servicoService.getServices(setServices);
    return () => {
      unsubProducts();
      unsubMovements();
      unsubServices();
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode?.includes(searchTerm);
    const matchesFilter = filter === 'all' || p.stock <= p.minStock;
    return matchesSearch && matchesFilter;
  });

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProductModal) return;
    setLoading(true);
    try {
      if (showProductModal.id) {
        const { id, ...data } = showProductModal;
        const updatedData = {
          ...data,
          price: Number(data.price || 0),
          stock: Number(data.stock || 0),
          minStock: Number(data.minStock || 0)
        };
        await estoqueService.updateProduct(id, updatedData);
        alert('Produto atualizado com sucesso!');
      } else {
        const newData = {
          ...showProductModal,
          price: Number(showProductModal.price || 0),
          stock: Number(showProductModal.stock || 0),
          minStock: Number(showProductModal.minStock || 0)
        };
        await estoqueService.addProduct(newData as Omit<Product, 'id'>);
        alert('Produto cadastrado com sucesso!');
      }
      setShowProductModal(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovementModal) return;
    setLoading(true);
    try {
      await estoqueService.addManualMovement(
        showMovementModal.id!,
        showMovementModal.name,
        mType,
        Number(mQty),
        mReason
      );
      setShowMovementModal(null);
      setMQty('');
      setMReason('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showServiceModal) return;
    setLoading(true);
    try {
      if (showServiceModal.id) {
        const { id, ...data } = showServiceModal;
        const updatedData = {
          ...data,
          price: Number(data.price || 0)
        };
        await servicoService.updateService(id, updatedData);
        alert('Serviço atualizado com sucesso!');
      } else {
        const newData = {
          ...showServiceModal,
          price: Number(showServiceModal.price || 0)
        };
        await servicoService.addService(newData as Omit<ServiceItem, 'id'>);
        alert('Serviço cadastrado com sucesso!');
      }
      setShowServiceModal(null);
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      if (deleteConfirm.type === 'product') {
        await estoqueService.deleteProduct(deleteConfirm.id);
      } else {
        await servicoService.deleteService(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlText = event.target?.result as string;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const items = xmlDoc.getElementsByTagName("det");
      const parsedProducts: any[] = [];

      for (let i = 0; i < items.length; i++) {
        const prod = items[i].getElementsByTagName("prod")[0];
        if (prod) {
          const name = prod.getElementsByTagName("xProd")[0]?.textContent || "";
          const sku = prod.getElementsByTagName("cProd")[0]?.textContent || "";
          const barcode = prod.getElementsByTagName("cEAN")[0]?.textContent || "";
          const costPrice = Number(prod.getElementsByTagName("vUnCom")[0]?.textContent || 0);
          const quantity = Number(prod.getElementsByTagName("qCom")[0]?.textContent || 0);

          parsedProducts.push({
            name,
            sku,
            barcode: barcode === "SEM GTIN" ? "" : barcode,
            costPrice,
            stock: quantity,
            price: costPrice * 1.5,
            minStock: 1,
            category: 'Peças',
            selected: true
          });
        }
      }
      setXmlProducts(parsedProducts);
    };
    reader.readAsText(file);
  };

  const handleImportXmlProducts = async () => {
    setLoading(true);
    try {
      const selectedProducts = xmlProducts.filter(p => p.selected);
      for (const p of selectedProducts) {
        const existing = products.find(ep => ep.sku === p.sku);
        if (existing) {
          await estoqueService.addManualMovement(
            existing.id!,
            existing.name,
            'entrada',
            p.stock,
            'Importação XML NFe'
          );
        } else {
          const { selected, ...productData } = p;
          await estoqueService.addProduct(productData);
        }
      }
      setShowXmlModal(false);
      setXmlProducts([]);
      alert('Importação concluída com sucesso!');
    } catch (error: any) {
      alert('Erro na importação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 10MB.');
      return;
    }

    setLoading(true);
    try {
      const img = new Image();
      const reader = new FileReader();
      
      const p = new Promise<string>((resolve) => {
        reader.onload = (event) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // WebP optimization for smaller footprint
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            resolve(dataUrl);
          };
          img.src = event.target?.result as string;
        };
      });
      
      reader.readAsDataURL(file);
      const optimizedUrl = await p;
      setShowProductModal(prev => prev ? { ...prev, imageUrl: optimizedUrl } : null);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-1 sm:px-0">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-premium p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="bg-titan-primary p-3 rounded-[8px] text-white shadow-lg shadow-titan-primary/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Gestão Titan ERP</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Produtos, serviços e movimentos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
            <Button
              variant={activeView === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('list')}
              className={cn(
                "flex-1 h-10 shadow-sm font-black uppercase text-[10px]",
                activeView === 'list' ? "bg-white dark:bg-slate-700 text-titan-primary shadow-lg" : "text-slate-500"
              )}
              leftIcon={<Package className="w-4 h-4" />}
            >
              Produtos
            </Button>
            <Button
              variant={activeView === 'services' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('services')}
              className={cn(
                "flex-1 h-10 shadow-sm font-black uppercase text-[10px]",
                activeView === 'services' ? "bg-white dark:bg-slate-700 text-titan-primary shadow-lg" : "text-slate-500"
              )}
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              Serviços
            </Button>
            <Button
              variant={activeView === 'history' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('history')}
              className={cn(
                "flex-1 h-10 shadow-sm font-black uppercase text-[10px]",
                activeView === 'history' ? "bg-white dark:bg-slate-700 text-titan-primary shadow-lg" : "text-slate-500"
              )}
              leftIcon={<History className="w-4 h-4" />}
            >
              Histórico
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowXmlModal(true)}
              leftIcon={<FileCode className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">Importar XML</span>
              <span className="sm:hidden">XML</span>
            </Button>
            <Button
              onClick={() => {
                if (activeView === 'services') {
                  setShowServiceModal({ name: '', description: '', price: 0 });
                } else {
                  setShowProductModal({ name: '', sku: '', price: 0, costPrice: 0, stock: 0, minStock: 0, category: 'Peças', imageUrl: '' });
                }
              }}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              <span className="hidden sm:inline">Novo {activeView === 'services' ? 'Serviço' : 'Produto'}</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </div>

      {activeView === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={activeView === 'list' ? "Buscar por nome, SKU ou código de barras..." : "Buscar por nome do serviço ou descrição..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            {activeView === 'list' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="all">Todos os Produtos</option>
                  <option value="low_stock">Estoque Baixo</option>
                </select>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {!searchTerm && filter === 'all' ? (
              <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Busque por um Produto</h3>
                <p className="text-slate-500 dark:text-slate-400">Digite o nome, SKU ou use o leitor de código de barras para começar.</p>
              </div>
            ) : searchTerm || filter !== 'all' ? (
               filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <motion.div
                    layout
                    key={product.id}
                    className="card-premium overflow-hidden border border-slate-100 dark:border-slate-800"
                  >
                    <div className="relative h-48 md:h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-titan-primary bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 md:p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-base tracking-tight uppercase">{product.name}</h3>
                          <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-400 dark:text-slate-500 items-center font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3 shrink-0" /> {product.sku}</span>
                            {product.barcode && (
                              <span className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                                <Barcode className="w-3 h-3 shrink-0" /> {product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg md:text-lg font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(product.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Estoque</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xl md:text-xl font-black",
                              product.stock <= product.minStock ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                            )}>
                              {product.stock} un
                            </span>
                            {product.stock <= product.minStock && (
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Mínimo</p>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{product.minStock} un</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => setShowMovementModal(product)}
                          className="flex-1"
                          leftIcon={<Boxes className="w-4 h-4" />}
                        >
                          Movimentar
                        </Button>
                        <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setShowProductModal(product)}
                              className="w-12 h-12 p-0 rounded-2xl"
                            >
                              <Edit3 className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setDeleteConfirm({ id: product.id!, name: product.name, type: 'product' })}
                              className="w-12 h-12 p-0 rounded-2xl"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 py-20 text-center">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum produto encontrado</h3>
                  <p className="text-slate-500 dark:text-slate-400">Verifique os termos da busca ou os filtros aplicados.</p>
                </div>
              )
            ) : (
              <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Busque por um Produto</h3>
                <p className="text-slate-500 dark:text-slate-400">Digite o nome, SKU ou use o leitor de código de barras para começar.</p>
              </div>
            )}
          </div>
        </>
      ) : activeView === 'services' ? (
        <>
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {!searchTerm ? (
              <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Busque por um Serviço</h3>
                <p className="text-slate-500 dark:text-slate-400">Digite o nome do serviço ou descrição para começar.</p>
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <motion.div
                  layout
                  key={service.id}
                  className="card-premium overflow-hidden"
                >
                  <div className="p-5 md:p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base uppercase tracking-tight">{service.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço de Mão de Obra Titan</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowServiceModal(service)}
                          className="p-2.5 h-auto text-slate-400 dark:text-slate-500"
                          leftIcon={<Edit3 className="w-4.5 h-4.5" />}
                        />
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ id: service.id!, type: 'service', name: service.name })}
                          className="p-2.5 h-auto text-slate-400 dark:text-slate-500"
                          leftIcon={<Trash2 className="w-4.5 h-4.5" />}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 uppercase leading-relaxed">{service.description || 'Sem descrição cadastrada.'}</p>
                      <p className="text-2xl font-black text-titan-primary">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum serviço encontrado</h3>
                <p className="text-slate-500 dark:text-slate-400">Verifique os termos da busca.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* History View with Virtualization */
        <div className="card-premium overflow-hidden h-[600px] flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex shrink-0">
            <div className="w-[180px] px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data/Hora</div>
            <div className="flex-1 px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Produto</div>
            <div className="w-[100px] px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tipo</div>
            <div className="w-[80px] px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Qtd</div>
            <div className="w-1/4 px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Motivo</div>
            <div className="w-[150px] px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Usuário</div>
          </div>
          
          <div className="flex-1">
            <AutoSizerAny>
              {({ height, width }: any) => (
                <FixedSizeList
                  height={height}
                  itemCount={movements.length}
                  itemSize={64}
                  width={width}
                  className="custom-scrollbar"
                >
                  {({ index, style }) => {
                    const m = movements[index];
                    return (
                      <div style={style} className="flex items-center border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="w-[180px] px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">{formatDate(m.timestamp)}</div>
                        <div className="flex-1 px-6 py-4">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1">{m.productName}</p>
                        </div>
                        <div className="w-[100px] px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            m.type === 'entrada' ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : 
                            m.type === 'saida' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : 
                            m.type === 'venda' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            {m.type}
                          </span>
                        </div>
                        <div className={cn(
                          "w-[80px] px-6 py-4 text-xs font-black text-right",
                          m.type === 'entrada' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                        </div>
                        <div className="w-1/4 px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase line-clamp-1">{m.reason}</div>
                        <div className="w-[150px] px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase line-clamp-1">{m.userName}</div>
                      </div>
                    );
                  }}
                </FixedSizeList>
              )}
            </AutoSizerAny>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-titan-primary text-white flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
                  <Package className="w-6 h-6" />
                  {showProductModal.id ? 'Ficha Técnica' : 'Cadastrar Item'}
                </h3>
                <Button variant="ghost" onClick={() => setShowProductModal(null)} className="text-white h-auto p-2 hover:bg-white/10">
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      required
                      value={showProductModal.name || ''}
                      onChange={e => setShowProductModal({...showProductModal, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Classe / Categoria do Produto</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={['Câmara', 'Pneu', 'Aro', 'Cubos', 'Raios', 'Quadros', 'Suspensão', 'Freios', 'Transmissão', 'Selim', 'Acessórios', 'Ferramentas', 'Vestuário', 'Lubrificantes'].includes(showProductModal.category || '') ? showProductModal.category : 'Outro'}
                        onChange={e => {
                          const val = e.target.value;
                          if (val !== 'Outro') {
                            setShowProductModal({...showProductModal, category: val});
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Câmara">Câmara</option>
                        <option value="Pneu">Pneu</option>
                        <option value="Aro">Aro</option>
                        <option value="Cubos">Cubos</option>
                        <option value="Raios">Raios</option>
                        <option value="Quadros">Quadros</option>
                        <option value="Suspensão">Suspensão</option>
                        <option value="Freios">Freios</option>
                        <option value="Transmissão">Transmissão</option>
                        <option value="Selim">Selim</option>
                        <option value="Acessórios">Acessórios</option>
                        <option value="Ferramentas">Ferramentas</option>
                        <option value="Vestuário">Vestuário</option>
                        <option value="Lubrificantes">Lubrificantes</option>
                        <option value="Outro">Outro (Digitar)</option>
                      </select>
                      {(!['Câmara', 'Pneu', 'Aro', 'Cubos', 'Raios', 'Quadros', 'Suspensão', 'Freios', 'Transmissão', 'Selim', 'Acessórios', 'Ferramentas', 'Vestuário', 'Lubrificantes'].includes(showProductModal.category || '') || showProductModal.category === 'Outro') && (
                        <input
                          type="text"
                          placeholder="Digite a classe personalizada..."
                          value={showProductModal.category === 'Outro' ? '' : (showProductModal.category || '')}
                          onChange={e => setShowProductModal({...showProductModal, category: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">SKU / Código de Barras (EAN)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={showProductModal.sku || ''}
                        onChange={e => setShowProductModal({...showProductModal, sku: e.target.value, barcode: e.target.value})}
                        placeholder="Digite o código ou escaneie o produto..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic px-1">Este código será usado tanto para o SKU interno quanto para o código de barras (EAN).</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Preço de Custo</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={showProductModal.costPrice || 0}
                      onChange={e => setShowProductModal({...showProductModal, costPrice: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Preço de Venda</label>
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCalculator(true)}
                        className="text-[10px] h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-bold"
                        leftIcon={<Calculator className="w-3 h-3" />}
                      >
                        Calculadora
                      </Button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={showProductModal.price || 0}
                      onChange={e => setShowProductModal({...showProductModal, price: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Estoque Inicial</label>
                    <input
                      type="number"
                      required
                      disabled={!!showProductModal.id}
                      value={showProductModal.stock || 0}
                      onChange={e => setShowProductModal({...showProductModal, stock: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      required
                      value={showProductModal.minStock || 0}
                      onChange={e => setShowProductModal({...showProductModal, minStock: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Foto do Produto</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="product-image-upload"
                          />
                          <label
                            htmlFor="product-image-upload"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 transition-all cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-400"
                          >
                            <Upload className="w-4 h-4" />
                            Enviar do Dispositivo
                          </label>
                        </div>
                      </div>

                      {showProductModal.imageUrl && (
                        <div className="relative w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 group">
                          <img src={showProductModal.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowProductModal({...showProductModal, imageUrl: ''})}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold uppercase rounded-none h-full"
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                  <Button
                    variant="ghost"
                    onClick={() => setShowProductModal(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    Salvar Produto
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showMovementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Boxes className="w-6 h-6" />
                  Movimentar Estoque
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{showMovementModal.name}</p>
              </div>
              <form onSubmit={handleAddMovement} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
                  {(['entrada', 'saida', 'ajuste'] as const).map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={mType === type ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setMType(type)}
                      className={cn(
                        "h-10",
                        mType === type ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm hover:bg-white dark:hover:bg-slate-700" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Quantidade</label>
                  <input
                    type="number"
                    required
                    value={mQty}
                    onChange={e => setMQty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Motivo</label>
                  <textarea
                    required
                    value={mReason}
                    onChange={e => setMReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Compra de fornecedor, Ajuste de inventário..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMovementModal(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    variant="primary"
                    className="flex-1 bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 dark:hover:bg-black shadow-slate-500/20"
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showXmlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileCode className="w-6 h-6" />
                    Entrada de Produtos via XML (NFe)
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Importe produtos e atualize o estoque automaticamente</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => { setShowXmlModal(false); setXmlProducts([]); }} 
                  className="text-white/80 hover:text-white p-2 h-auto"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {xmlProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">Selecione o arquivo XML da Nota Fiscal</p>
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleXmlUpload}
                      className="hidden"
                      id="xml-upload"
                    />
                    <label
                      htmlFor="xml-upload"
                    >
                      <Button as="span" className="cursor-pointer">
                        Selecionar Arquivo
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {xmlProducts.length} produtos encontrados no XML
                      </p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setXmlProducts([])}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline h-auto p-0"
                      >
                        Trocar Arquivo
                      </Button>
                    </div>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Importar</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Produto</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">SKU</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right">Qtd</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase text-right">Custo</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {xmlProducts.map((p, idx) => {
                            const exists = products.some(ep => ep.sku === p.sku);
                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={p.selected}
                                    onChange={e => {
                                      const next = [...xmlProducts];
                                      next[idx].selected = e.target.checked;
                                      setXmlProducts(next);
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{p.sku}</td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">{p.stock}</td>
                                <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">{formatCurrency(p.costPrice)}</td>
                                <td className="px-4 py-3">
                                  {exists ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                      Atualizar
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                      Novo
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                <Button
                  variant="ghost"
                  onClick={() => { setShowXmlModal(false); setXmlProducts([]); }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImportXmlProducts}
                  loading={loading}
                  disabled={xmlProducts.length === 0}
                  className="flex-1"
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Importar Produtos
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="w-6 h-6" />
                  {showServiceModal.id ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowServiceModal(null)} 
                  className="text-white/80 hover:text-white p-2 h-auto"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleSaveService} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Nome do Serviço</label>
                  <input
                    type="text" required
                    value={showServiceModal.name || ''}
                    onChange={e => setShowServiceModal({...showServiceModal, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Revisão Geral, Troca de Pneu..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Preço (Mão de Obra)</label>
                  <input
                    type="number" step="0.01" required
                    value={showServiceModal.price || 0}
                    onChange={e => setShowServiceModal({...showServiceModal, price: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Descrição</label>
                  <textarea
                    value={showServiceModal.description || ''}
                    onChange={e => setShowServiceModal({...showServiceModal, description: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    placeholder="Detalhes do que está incluso no serviço..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowServiceModal(null)}>Cancelar</Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Salvar Serviço
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Excluir {deleteConfirm.type === 'product' ? 'Produto' : 'Serviço'}?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Deseja realmente excluir <strong>{deleteConfirm.name}</strong>? Esta ação não pode ser desfeita.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    loading={loading}
                    className="flex-1"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCalculator && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative"
            >
              <Button 
                variant="ghost"
                onClick={() => setShowCalculator(false)}
                className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 z-10 h-auto"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </Button>
              <CalculadoraPrecificacao />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
