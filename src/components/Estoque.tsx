import { toast } from 'react-hot-toast';
import { EstoqueStats } from "./estoque/EstoqueStats";
import { EstoqueHeader } from "./estoque/EstoqueHeader";
import React, { useState, useEffect } from 'react';
import { estoqueService } from '../services/estoqueService';
import { servicoService } from '../services/servicoService';
import { productClassService } from '../services/productClassService';
import { Product, ServiceItem } from '../domain/types';
import { ProductClass } from '../domain/productClass';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  DollarSign,
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
import CardPadrao from './ui/CardPadrao';
import { PageContainer } from './ui';
import { useAuth } from '../hooks/useAuth';
import { canAccessModule, canDoAction } from '../lib/permissions';

const FixedSizeList = (ReactWindow as any).FixedSizeList;
const AutoSizerAny = AutoSizer as any;

export default function Estoque() {
  const { profile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');
  const [activeView, setActiveView] = useState<'list'>('list');
  const [showProductModal, setShowProductModal] = useState<Partial<Product> | null>(null);
  const [productModalTab, setProductModalTab] = useState<'geral' | 'codigos' | 'financeiro' | 'estoque' | 'imagem'>('geral');
  const [showServiceModal, setShowServiceModal] = useState<Partial<ServiceItem> | null>(null);
  const [showMovementModal, setShowMovementModal] = useState<Product | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlProducts, setXmlProducts] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, type: 'product' | 'service' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [productClasses, setProductClasses] = useState<ProductClass[]>([]);

  // Movement Form
  const [mType, setMType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [mQty, setMQty] = useState('');
  const [mReason, setMReason] = useState('');

  useEffect(() => {
    if (showMovementModal && mType === 'ajuste') {
      setMQty(showMovementModal.stock.toString());
    } else {
      setMQty('');
    }
  }, [mType, showMovementModal]);

  useEffect(() => {
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubServices = servicoService.getServices(setServices);
    
    // Seed and fetch product classes
    const loadClasses = async () => {
      await productClassService.seedClasses();
      const classes = await productClassService.getClasses();
      setProductClasses(classes);
    };
    loadClasses();

    return () => {
      unsubProducts();
      unsubServices();
    };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.productCode?.toString() || '').includes(searchTerm) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.barcode?.includes(searchTerm);
    const matchesFilter = filter === 'all' || p.stock <= p.minStock;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => (a.productCode || 0) - (b.productCode || 0));

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProductModal) return;

    const isEditing = !!showProductModal.id;

    if (isEditing && !canDoAction(profile, 'estoque', 'edit')) {
  toast.error('Você não tem permissão para editar produtos.');
  return;
}

    if (!isEditing && !canDoAction(profile, 'estoque', 'create')) {
  toast.error('Você não tem permissão para criar produtos.');
  return;
}

    setLoading(true);
    try {
      let finalData = {
        ...showProductModal,
        price: Number(showProductModal.price || 0),
        stock: Number(showProductModal.stock || 0),
        minStock: Number(showProductModal.minStock || 0),
        productCode: showProductModal.productCode ? Number(showProductModal.productCode) : undefined
      };

      // Generate product code only if it doesn't have one and a class is selected
      if (!finalData.productCode && showProductModal.classId) {
        console.log('Generating code for class:', showProductModal.classId);
        const nextCode = await productClassService.generateProductCode(showProductModal.classId);
        const selectedClass = productClasses.find(c => c.id === showProductModal.classId);
        
        finalData = {
          ...finalData,
          productCode: nextCode,
          sku: nextCode.toString(), // Use the generated code as SKU as well
          category: selectedClass?.nome || showProductModal.category || 'Outro'
        };
      } else if (finalData.productCode) {
        // Ensure SKU matches productCode if provided manually
        finalData.sku = finalData.productCode.toString();
      }

      if (showProductModal.id) {
        const { id, ...dataToUpdate } = finalData;
        await estoqueService.updateProduct(id as string, dataToUpdate);
        
        // If product has a class and a code was manually changed, try to sync the sequence
        if (finalData.productCode && showProductModal.classId) {
          await productClassService.syncLastCode(showProductModal.classId, finalData.productCode);
        }
        
        toast.success('Produto atualizado com sucesso!');
      } else {
        await estoqueService.addProduct(finalData as Omit<Product, 'id'>);
        
        // If code was entered manually (not generated), sync the sequence
        // Note: if it was generated, generateProductCode already updated it.
        if (showProductModal.productCode && showProductModal.classId) {
          await productClassService.syncLastCode(showProductModal.classId, Number(showProductModal.productCode));
        }
        
        toast.success('Produto cadastrado.');
      }
      setShowProductModal(null);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.message || 'Erro ao processar operação.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovementModal) return;

    if (!canDoAction(profile, 'estoque', 'edit')) {
      toast.error('Sem permissão para movimentar estoque.');
      return;
    }

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
      toast.error(error.message || 'Erro ao processar operação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showServiceModal) return;

    const isEditing = !!showServiceModal.id;

    if (isEditing && !canDoAction(profile, 'estoque', 'edit')) {
      toast.error('Sem permissão para editar serviços.');
      return;
    }

    if (!isEditing && !canDoAction(profile, 'estoque', 'create')) {
      toast.error('Sem permissão para criar serviços.');
      return;
    }

    setLoading(true);
    try {
      if (showServiceModal.id) {
        const { id, ...data } = showServiceModal;
        const updatedData = {
          ...data,
          price: Number(data.price || 0)
        };
        await servicoService.updateService(id, updatedData);
        toast.success('Serviço atualizado.');
      } else {
        const newData = {
          ...showServiceModal,
          price: Number(showServiceModal.price || 0)
        };
        await servicoService.addService(newData as Omit<ServiceItem, 'id'>);
        toast.success('Serviço cadastrado.');
      }
      setShowServiceModal(null);
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      toast.error(error.message || 'Erro ao salvar serviço.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    if (!canDoAction(profile, 'estoque', 'delete')) {
      toast.error('Sem permissão para excluir itens do estoque.');
      return;
    }

    setLoading(true);
    try {
      if (deleteConfirm.type === 'product') {
        await estoqueService.deleteProduct(deleteConfirm.id);
      } else {
        await servicoService.deleteService(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (error: any) {
  toast.error(error.message || 'Erro ao processar operação no estoque.');
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
      toast.success('Importação concluída.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('Imagem muito grande. Escolha um arquivo de até 10 MB.');
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

  const estoqueStats = [
  { 
    id: 'total',
    label: 'Total de Itens', 
    value: products.reduce((acc, p) => acc + p.stock, 0),
    icon: Package,
    variant: 'analytics'
  },

  { 
    id: 'reposicao',
    label: 'Alerta Reposição', 
    value: products.filter(p => p.stock <= p.minStock).length,
    icon: AlertTriangle,
    variant: 'warning'
  },

  { 
    id: 'venda',
    label: 'Valor de Venda', 
    value: formatCurrency(
      products.reduce((acc, p) => acc + (p.price * p.stock), 0)
    ),
    icon: TrendingUp,
    variant: 'success'
  },

  { 
    id: 'custo',
    label: 'Valor de Custo', 
    value: formatCurrency(
      products.reduce((acc, p) => acc + ((p.costPrice || 0) * p.stock), 0)
    ),
    icon: DollarSign,
    variant: 'finance'
  }
];

  if (!canAccessModule(profile, 'estoque')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-white">
          Acesso Negado
        </h2>

        <p className="text-white/40 max-w-md">
          Você não possui permissão para acessar o estoque.
        </p>
      </div>
    );
  }

  return (
    <PageContainer className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      
      <EstoqueHeader
  activeView={activeView}
  setActiveView={setActiveView}
  setProductModalTab={setProductModalTab}
  setShowProductModal={setShowProductModal}
  canCreate={canDoAction(profile, 'estoque', 'create')}
/>
      <EstoqueStats
  estoqueStats={estoqueStats}
  filter={filter}
  setActiveView={setActiveView}
  setFilter={setFilter}
  setSearchTerm={setSearchTerm}
/>

      {activeView === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 icon-standard icon-default group-focus-within:icon-active transition-colors" />
              <input
                type="text"
                placeholder="PESQUISAR ITEM, SKU OU EAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-14 pr-6 rounded-xl bg-white/[0.02] border border-white/5 text-white placeholder:text-white/20 focus:ring-2 focus:ring-titan-primary outline-none transition-all font-medium text-sm flex items-center"
              />
            </div>
            {activeView === 'list' && (
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 h-12 px-6 rounded-xl shadow-xl">
                <Filter className="icon-standard icon-active w-4 h-4" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest outline-none cursor-pointer flex-1"
                >
                  <option value="all" className="bg-black text-white">ESTOQUE COMPLETO</option>
                  <option value="low_stock" className="bg-black text-white">ALERTA REPOSIÇÃO</option>
                </select>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {!searchTerm && filter === 'all' ? (
              <div className="md:col-span-2 lg:col-span-3 py-24 text-center card-premium rounded-[40px] border border-titan-border border-dashed shadow-2xl">
                <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="icon-standard icon-default w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">AGUARDANDO CONSULTA</h3>
                <p className="text-titan-text-secondary font-black uppercase text-[10px] tracking-[0.3em] mt-3">Utilize os filtros ou digite o identificador do produto</p>
              </div>
            ) : searchTerm || filter !== 'all' ? (
               filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <motion.div
                    layout
                    key={product.id}
                    className="card-premium rounded-[40px] overflow-hidden border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] group hover:scale-[1.02] transition-all duration-500"
                  >
                    <div className="relative h-64 bg-black/40 flex items-center justify-center overflow-hidden border-b border-titan-border">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="icon-standard icon-default w-16 h-16 text-white/10" />
                      )}
                      <div className="absolute top-6 left-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-titan-primary bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-titan-primary/20 shadow-2xl">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 md:p-10 space-y-8">
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 p-6 rounded-[32px] bg-black/30 border border-white/5">
                        <div className="space-y-2 min-w-0">
                          <h3 className="font-black text-white line-clamp-2 text-xl tracking-tighter uppercase leading-[0.9]">{product.name}</h3>
                          <div className="flex flex-wrap gap-x-3 text-[10px] text-titan-text-secondary items-center font-black uppercase tracking-widest opacity-60">
                        <span className="flex items-center gap-1.5">
                              <Tag className="icon-standard icon-active w-3.5 h-3.5 shrink-0" /> 
                              {product.productCode ? `#${product.productCode}` : product.sku}
                            </span>
                            {product.barcode && product.barcode !== product.sku && (
                              <span className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                                <Barcode className="icon-standard icon-active w-3.5 h-3.5 shrink-0" /> {product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(product.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-black/40 rounded-[32px] border border-titan-border shadow-inner">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-titan-text-secondary uppercase tracking-widest opacity-60">DISPONÍVEL</p>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-3xl font-black tracking-tighter",
                              product.stock <= product.minStock ? "text-red-500" : "text-white"
                            )}>
                              {product.stock}
                            </span>
                            <span className="text-[10px] font-black text-titan-text-secondary uppercase">UNIDADES</span>
                            {product.stock <= product.minStock && (
                              <AlertTriangle className="icon-standard icon-critical w-6 h-6 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-black text-titan-text-secondary uppercase tracking-widest opacity-60">MÍNIMO CRÍTICO</p>
                          <p className="text-xl font-black text-white tracking-tighter">{product.minStock} UN</p>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <Button
                          disabled={
                            !canDoAction(profile, 'estoque', 'edit')
                          }
                          onClick={() => setShowMovementModal(product)}
                          className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                          leftIcon={<Boxes className="icon-standard icon-active w-5 h-5 font-black" />}
                        >
                          MOVIMENTAR
                        </Button>
                        <div className="flex gap-3">
                            <Button
                              variant="secondary"
                              disabled={
                                !canDoAction(profile, 'estoque', 'edit')
                              }
                              onClick={() => {
                                setProductModalTab('geral');
                                setShowProductModal(product);
                              }}
                              className="w-16 h-16 p-0 rounded-[24px] bg-white/5 border border-titan-border group-hover:bg-white/10 transition-colors"
                            >
                              <Edit3 className="icon-standard icon-default w-6 h-6" />
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={
                                !canDoAction(profile, 'estoque', 'delete')
                              }
                              onClick={() => setDeleteConfirm({ id: product.id!, name: product.name, type: 'product' })}
                              className="w-16 h-16 p-0 rounded-[24px] bg-white/5 border border-titan-border hover:bg-red-500/10 group-hover:border-red-500/20 transition-all"
                            >
                              <Trash2 className="icon-standard icon-critical w-6 h-6" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 lg:col-span-3 py-24 text-center">
                  <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="icon-standard icon-default w-10 h-10 opacity-30" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">NENHUM RESULTADO</h3>
                  <p className="text-titan-text-secondary font-black uppercase text-[10px] tracking-[0.3em] mt-3">Ajuste os parâmetros da busca ou adicione novos itens</p>
                </div>
              )
            ) : (
              <div className="md:col-span-2 lg:col-span-3 py-24 text-center card-premium rounded-[40px] border border-titan-border border-dashed shadow-2xl">
                <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="icon-standard icon-default w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">AGUARDANDO CONSULTA</h3>
                <p className="text-titan-text-secondary font-black uppercase text-[10px] tracking-[0.3em] mt-3">Utilize os filtros ou digite o identificador do produto</p>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Modals */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-6xl overflow-hidden max-h-[92vh] flex flex-col border border-titan-border"
            >
              <div className="p-8 border-b border-titan-border bg-titan-primary text-white flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Package className="icon-standard icon-active w-7 h-7 font-black" />
                  {showProductModal.id ? 'ESPECIFICAÇÕES TÉCNICAS' : 'NOVO ITEM DE INVENTÁRIO'}
                </h3>
                <Button variant="ghost" onClick={() => setShowProductModal(null)} className="text-white h-auto p-2 hover:bg-white/10 rounded-full">
                  <Plus className="icon-standard icon-default w-7 h-7 rotate-45" />
                </Button>
              </div>
              <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-10 pt-6 border-b border-white/5">
                  <div className="flex gap-2 overflow-x-auto pb-4">
                    {[
                      { id: 'geral', label: 'Geral' },
                      { id: 'codigos', label: 'Códigos' },
                      { id: 'financeiro', label: 'Financeiro' },
                      { id: 'estoque', label: 'Estoque' },
                      { id: 'imagem', label: 'Imagem' },
                    ].map((tab) => (
                      <Button
                        key={tab.id}
                        type="button"
                        variant={productModalTab === tab.id ? 'primary' : 'ghost'}
                        onClick={() => setProductModalTab(tab.id as any)}
                        className={cn(
                          "h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                          productModalTab === tab.id
                            ? "bg-titan-primary shadow-xl shadow-titan-primary/20"
                            : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
                  {productModalTab === 'geral' && (
                    <div className="space-y-8">
                      <div>
  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
    DENOMINAÇÃO DO PRODUTO
  </label>

  <input
    type="text"
    required
    value={showProductModal.name || ''}
    onChange={e =>
      setShowProductModal({
        ...showProductModal,
        name: e.target.value
      })
    }
    className="w-full font-black uppercase text-sm"
    placeholder="NOME COMERCIAL..."
  />
</div>

<div>
  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
    TIPO DO ITEM
  </label>

  <div className="grid grid-cols-2 gap-4">
    <Button
      type="button"
      variant={(showProductModal as any).itemType !== 'service' ? 'primary' : 'ghost'}
      onClick={() =>
        setShowProductModal({
          ...showProductModal,
          itemType: 'product'
        } as any)
      }
      className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest"
    >
      Produto
    </Button>

    <Button
      type="button"
      variant={(showProductModal as any).itemType === 'service' ? 'primary' : 'ghost'}
      onClick={() =>
        setShowProductModal({
          ...showProductModal,
          itemType: 'service',
          stock: 0,
          minStock: 0
        } as any)
      }
      className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest"
    >
      Serviço
    </Button>
  </div>
</div>

                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                          CLASSIFICAÇÃO OPERACIONAL (GERA CÓDIGO AUTOMÁTICO)
                        </label>
                        <select
                          value={showProductModal.classId || ''}
                          onChange={e => {
                            const classId = e.target.value;
                            const selectedClass = productClasses.find(c => c.id === classId);
                            setShowProductModal({
                              ...showProductModal,
                              classId,
                              category: selectedClass?.nome || ''
                            });
                          }}
                          className="w-full"
                          required={!showProductModal.id}
                        >
                          <option value="">SELECIONE UMA CLASSE...</option>
                          {productClasses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nome} ({c.codigoInicial}-{c.codigoFinal})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {productModalTab === 'codigos' && (
                    <div className="bg-black/40 p-8 rounded-[32px] border border-titan-border shadow-inner">
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-4 ml-1">
                        {showProductModal.productCode ? `CÓDIGO OFICIAL: #${showProductModal.productCode}` : 'CÓDIGO DO SISTEMA'}
                      </label>
                      <div className="relative group">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 icon-standard icon-default group-focus-within:icon-active transition-colors" />
                        <input
                          type="text"
                          value={showProductModal.productCode || showProductModal.sku || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) {
                              setShowProductModal({
                                ...showProductModal,
                                productCode: val ? Number(val) : undefined,
                                sku: val
                              });
                            } else {
                              setShowProductModal({...showProductModal, sku: val});
                            }
                          }}
                          placeholder={showProductModal.classId ? "GERADO AUTOMATICAMENTE OU DIGITE..." : "CÓDIGO PRINCIPAL..."}
                          className="w-full pl-14 pr-6 font-mono font-black border-white/10"
                        />
                      </div>

                      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 ml-1">
                            EAN-13 (OPCIONAL)
                          </label>
                          <input
                            type="text"
                            value={showProductModal.barcode || ''}
                            onChange={e => setShowProductModal({...showProductModal, barcode: e.target.value})}
                            placeholder="SCANNER..."
                            className="w-full text-sm py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 ml-1">
                            CÓD. FORNECEDOR
                          </label>
                          <input
                            type="text"
                            value={(showProductModal as any).supplierCode || ''}
                            onChange={e => setShowProductModal({...showProductModal, supplierCode: e.target.value} as any)}
                            placeholder="REF..."
                            className="w-full text-sm py-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {productModalTab === 'financeiro' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                          VALOR DE AQUISIÇÃO (CUSTO)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={showProductModal.costPrice || 0}
                          onChange={e => setShowProductModal({...showProductModal, costPrice: Number(e.target.value)})}
                          className="w-full font-black text-lg"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3 ml-1">
                          <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em]">
                            VALOR DE REVENDA
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCalculator(true)}
                            className="text-[9px] h-auto p-0 text-titan-primary hover:text-white flex items-center gap-2 font-black uppercase tracking-widest transition-colors"
                            leftIcon={<Calculator className="icon-standard icon-active w-4 h-4" />}
                          >
                            MARGEM DE LUCRO
                          </Button>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={showProductModal.price || 0}
                          onChange={e => setShowProductModal({...showProductModal, price: Number(e.target.value)})}
                          className="w-full font-black text-lg text-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {productModalTab === 'estoque' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                          VOLUMETRIA ATUAL
                        </label>
                        <input
                          type="number"
                          required
                          value={showProductModal.stock || 0}
                          onChange={e => setShowProductModal({...showProductModal, stock: Number(e.target.value)})}
                          className="w-full font-black text-lg disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                          PATAMAR MÍNIMO (CRÍTICO)
                        </label>
                        <input
                          type="number"
                          required
                          value={showProductModal.minStock || 0}
                          onChange={e => setShowProductModal({...showProductModal, minStock: Number(e.target.value)})}
                          className="w-full font-black text-lg text-red-500"
                        />
                      </div>
                    </div>
                  )}

                  {productModalTab === 'imagem' && (
                    <div>
                      <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-4 ml-1">
                        DOCUMENTAÇÃO VISUAL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
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
                              className="flex flex-col items-center justify-center gap-4 w-full py-10 rounded-[32px] border-2 border-dashed border-titan-border hover:border-titan-primary/50 transition-all cursor-pointer bg-black/20 group"
                            >
                              <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-titan-primary/10 transition-colors">
                                <Upload className="icon-standard icon-default group-hover:icon-active w-8 h-8" />
                              </div>
                              <span className="text-[10px] font-black text-titan-text-secondary group-hover:text-white uppercase tracking-widest">
                                CARREGAR ASSET VISUAL
                              </span>
                            </label>
                          </div>
                        </div>

                        {showProductModal.imageUrl && (
                          <div className="relative w-40 h-40 rounded-[32px] border border-titan-border overflow-hidden shrink-0 group shadow-2xl">
                            <img
                              src={showProductModal.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowProductModal({...showProductModal, imageUrl: ''})}
                              className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-none h-full w-full backdrop-blur-sm"
                            >
                              REMOVER ASSET
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-10 border-t border-titan-border flex gap-4 shrink-0 bg-black/40">
                  <Button
                    variant="ghost"
                    onClick={() => setShowProductModal(null)}
                    className="flex-1 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest"
                  >
                    CANCELAR OPERAÇÃO
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={
                      showProductModal.id
                        ? !canDoAction(profile, 'estoque', 'edit')
                        : !canDoAction(profile, 'estoque', 'create')
                    }
                    className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                  >
                    EFETIVAR CADASTRO
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showMovementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className="p-10 border-b border-titan-border bg-black/40 text-white">
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                  <Boxes className="icon-standard icon-active w-8 h-8 font-black" />
                  MOVIMENTAR ESTOQUE
                </h3>
                <p className="text-[10px] text-titan-text-secondary mt-3 font-black uppercase tracking-[0.3em] opacity-60 truncate">{showMovementModal.name}</p>
              </div>
              <form onSubmit={handleAddMovement} className="p-10 space-y-8">
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-[24px] border border-titan-border shadow-inner">
                  {(['entrada', 'saida', 'ajuste'] as const).map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={mType === type ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setMType(type)}
                      className={cn(
                        "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        mType === type ? "bg-titan-primary text-white shadow-xl" : "text-titan-text-secondary"
                      )}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">
                    {mType === 'ajuste' ? 'VOLUMETRIA FINAL' : 'VOLUMETRIA DO DELTA'}
                  </label>
                  <input
                    type="number"
                    required
                    value={mQty}
                    onChange={e => setMQty(e.target.value)}
                    className="w-full font-black text-xl text-center"
                    placeholder="0"
                  />
                  {mType === 'ajuste' && (
                    <p className="text-[10px] text-white/40 mt-3 text-center uppercase font-black tracking-widest">
                      O estoque atual será substituído por este valor
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">JUSTIFICATIVA OPERACIONAL</label>
                  <textarea
                    required
                    value={mReason}
                    onChange={e => setMReason(e.target.value)}
                    className="w-full font-bold uppercase text-xs"
                    placeholder="EX: COMPRA DE FORNECEDOR, AJUSTE DE INVENTÁRIO..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowMovementModal(null)}
                    className="flex-1 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                  >
                    CONFIRMAR
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showXmlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-titan-border"
            >
              <div className="p-10 border-b border-titan-border bg-black/40 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                    <FileCode className="icon-standard icon-active w-8 h-8 font-black" />
                    EXTRATOR DE NFe (XML)
                  </h3>
                  <p className="text-[10px] text-titan-text-secondary mt-2 font-black uppercase tracking-[0.3em] opacity-60">Sincronização em massa de inventário via nota fiscal</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => { setShowXmlModal(false); setXmlProducts([]); }} 
                  className="text-white h-auto p-2 hover:bg-white/10 rounded-full"
                >
                  <Plus className="icon-standard icon-default w-8 h-8 rotate-45" />
                </Button>
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                {xmlProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-titan-border rounded-[40px] bg-black/20 group hover:border-titan-primary/50 transition-all duration-500">
                    <div className="bg-white/5 p-8 rounded-[32px] mb-8 group-hover:bg-titan-primary/10 transition-colors">
                      <Upload className="icon-standard icon-default group-hover:icon-active w-16 h-16" />
                    </div>
                    <p className="text-white font-black uppercase text-sm tracking-widest mb-6">LOCALIZE O ARQUIVO XML DA NOTA FISCAL</p>
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
                      <Button as="span" className="cursor-pointer h-16 rounded-2xl px-10 text-[10px] font-black uppercase tracking-widest bg-titan-primary shadow-2xl shadow-titan-primary/20">
                        SELECIONAR ARQUIVO
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between bg-black/40 p-6 rounded-[32px] border border-titan-border">
                      <p className="text-xs font-black text-white uppercase tracking-widest">
                        {xmlProducts.length} <span className="text-titan-text-secondary opacity-60">ITENS DETECTADOS NO MANIFESTO</span>
                      </p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => setXmlProducts([])}
                        className="text-[9px] font-black text-titan-primary uppercase tracking-widest hover:text-white transition-colors h-auto p-0"
                      >
                        REPROCESSAR OUTRA NF
                      </Button>
                    </div>
                    <div className="border border-titan-border rounded-[32px] overflow-hidden bg-black/20 shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/60 border-b border-titan-border">
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest">SEL</th>
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest">DESCRIÇÃO DO ITEM</th>
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest">SKU ORIGEM</th>
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest text-right">VOL</th>
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest text-right">UNIT. (CUSTO)</th>
                            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-widest">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {xmlProducts.map((p, idx) => {
                            const exists = products.some(ep => ep.sku === p.sku);
                            return (
                              <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                <td className="px-8 py-6">
                                  <input
                                    type="checkbox"
                                    checked={p.selected}
                                    onChange={e => {
                                      const next = [...xmlProducts];
                                      next[idx].selected = e.target.checked;
                                      setXmlProducts(next);
                                    }}
                                    className="w-5 h-5 accent-titan-primary rounded-lg cursor-pointer"
                                  />
                                </td>
                                <td className="px-8 py-6">
                                  <p className="text-xs font-black text-white uppercase line-clamp-1 group-hover:text-titan-primary transition-colors">{p.name}</p>
                                </td>
                                <td className="px-8 py-6 text-[10px] font-mono text-titan-text-secondary font-black">{p.sku}</td>
                                <td className="px-8 py-6 text-sm font-black text-right text-white">{p.stock}</td>
                                <td className="px-8 py-6 text-sm font-black text-right text-emerald-500">{formatCurrency(p.costPrice)}</td>
                                <td className="px-8 py-6">
                                  {exists ? (
                                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
                                      ATUALIZAR
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                                      NOVO REGISTRO
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

              <div className="p-10 border-t border-titan-border flex gap-4 bg-black/40">
                <Button
                  variant="ghost"
                  onClick={() => { setShowXmlModal(false); setXmlProducts([]); }}
                  className="flex-1 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest"
                >
                  CANCELAR
                </Button>
                <Button
                  onClick={handleImportXmlProducts}
                  loading={loading}
                  disabled={xmlProducts.length === 0 || !canDoAction(profile, 'estoque', 'create')}
                  className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                  leftIcon={<CheckCircle2 className="icon-standard icon-active w-5 h-5" />}
                >
                  EFETUAR IMPORTAÇÃO
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden border border-titan-border"
            >
              <div className="p-10 border-b border-titan-border bg-titan-primary text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                    <Wrench className="icon-standard icon-active w-8 h-8 font-black" />
                    {showServiceModal.id ? 'ATUALIZAR SERVIÇO' : 'NOVO SERVIÇO'}
                  </h3>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowServiceModal(null)} 
                    className="text-white h-auto p-2 hover:bg-white/10 rounded-full"
                  >
                    <Plus className="icon-standard icon-default w-8 h-8 rotate-45" />
                  </Button>
              </div>
              <form onSubmit={handleSaveService} className="p-10 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">DENOMINAÇÃO DO SERVIÇO</label>
                  <input
                    type="text" required
                    value={showServiceModal.name || ''}
                    onChange={e => setShowServiceModal({...showServiceModal, name: e.target.value})}
                    className="w-full font-black uppercase text-sm"
                    placeholder="EX: REVISÃO COMPLETA, SANGRIA..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">VALOR DA MÃO DE OBRA (BRL)</label>
                  <input
                    type="number" step="0.01" required
                    value={showServiceModal.price || 0}
                    onChange={e => setShowServiceModal({...showServiceModal, price: Number(e.target.value)})}
                    className="w-full font-black text-xl text-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em] mb-3 ml-1">DETALHAMENTO TÉCNICO</label>
                  <textarea
                    value={showServiceModal.description || ''}
                    onChange={e => setShowServiceModal({...showServiceModal, description: e.target.value})}
                    className="w-full font-bold uppercase text-xs"
                    rows={4}
                    placeholder="DESCREVA O QUE COMPÕE ESTE SERVIÇO..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" className="flex-1 h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest" onClick={() => setShowServiceModal(null)}>CANCELAR</Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={
                      showServiceModal.id
                        ? !canDoAction(profile, 'estoque', 'edit')
                        : !canDoAction(profile, 'estoque', 'create')
                    }
                    className="flex-1 h-16 rounded-[24px] bg-titan-primary text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-titan-primary/20"
                  >
                    SALVAR SERVIÇO
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden border border-titan-border"
            >
              <div className="p-10 text-center space-y-8">
                <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.2)] border border-red-500/20">
                  <Trash2 className="icon-standard icon-critical w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">REMOVER MÓDULO?</h3>
                  <p className="text-[10px] text-titan-text-secondary font-black uppercase tracking-[0.2em] mt-4 leading-relaxed line-clamp-3">
                    REALMENTE DESEJA DELETAR <span className="text-white bg-white/5 px-2 py-1 rounded-md">{deleteConfirm.name}</span> DO SISTEMA? ESTA OPERAÇÃO É IRREVERSÍVEL.
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    loading={loading}
                    className="flex-1 h-16 rounded-2xl bg-red-600 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-600/20"
                  >
                    CONFIRMAR
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showCalculator && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative border border-titan-border"
            >
              <Button 
                variant="ghost"
                onClick={() => setShowCalculator(false)}
                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white z-20 h-auto transition-all"
              >
                <Plus className="icon-standard icon-default w-8 h-8 rotate-45" />
              </Button>
              <CalculadoraPrecificacao />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
