import React, { useState, useEffect } from 'react';
import { vendaService } from '../services/vendaService';
import { estoqueService } from '../services/estoqueService';
import { caixaService } from '../services/caixaService';
import { clienteService } from '../services/clienteService';
import { configuracaoService } from '../services/configuracaoService';
import { soundService } from '../services/audioService';
import { useShortcuts } from '../hooks/useShortcuts';
import { useAuth } from '../hooks/useAuth';
import * as ReactWindow from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const FixedSizeList = (ReactWindow as any).FixedSizeList;
const AutoSizerAny = AutoSizer as any;
import { Product, ServiceItem, SaleItem, Sale, CashSession, PaymentMethod, Customer, CompanySettings } from '../domain/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Wrench,
  CreditCard,
  Banknote,
  QrCode,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt as ReceiptIcon,
  MessageCircle,
  FileDown,
  Printer,
  FileText,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export default function Vendas() {
  const { profile } = useAuth();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [payments, setPayments] = useState<{ method: PaymentMethod, amount: number }[]>([]);
  const [showMultiPayment, setShowMultiPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'services'>('all');
  const [view, setView] = useState<'pos' | 'history'>('pos');
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{ saleNumber: number, total: number } | null>(null);

  // Keyboard Shortcuts (Modo Quiosque)
  useShortcuts({
    'F1': () => {
      setActiveTab(prev => {
        if (prev === 'all') return 'products';
        if (prev === 'products') return 'services';
        return 'all';
      });
      soundService.playClick();
    },
    'F2': () => searchInputRef.current?.focus(),
    'F4': () => {
      if (cart.length > 0) {
        setShowMultiPayment(prev => !prev);
        soundService.playClick();
      }
    },
    'F10': () => {
      if (cart.length > 0 && customerName && !loading) {
        handleFinalizeSale();
      }
    },
    'Escape': () => {
      setSearchTerm('');
      setShowCustomerSearch(false);
      setShowConfirmation(null);
      soundService.playClick();
    }
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 30;
  const historyItemsPerPage = 20;

  useEffect(() => {
    estoqueService.seedData(); // Seed initial data if empty
    const unsubSession = caixaService.getCurrentSession(setCurrentSession);
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubServices = estoqueService.getServices(setServices);
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    const unsubRecentSales = vendaService.getRecentSales(setRecentSales);
    const unsubSettings = configuracaoService.getSettings(setSettings);

    return () => {
      unsubSession();
      unsubProducts();
      unsubServices();
      unsubCustomers();
      unsubRecentSales();
      unsubSettings();
    };
  }, []);

  const addToCart = (item: Product | ServiceItem, type: 'product' | 'service') => {
    soundService.playClick();
    const existing = cart.find(i => i.itemId === item.id && i.type === type);
    if (existing) {
      setCart(cart.map(i => 
        (i.itemId === item.id && i.type === type) 
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
          : i
      ));
    } else {
      setCart([...cart, {
        itemId: item.id!,
        name: item.name,
        type,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        costPrice: type === 'product' ? (item as Product).costPrice || 0 : 0
      }]);
    }
  };

  const removeFromCart = (itemId: string, type: 'product' | 'service') => {
    setCart(cart.filter(i => !(i.itemId === itemId && i.type === type)));
  };

  const updateQuantity = (itemId: string, type: 'product' | 'service', delta: number) => {
    setCart(cart.map(i => {
      if (i.itemId === itemId && i.type === type) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleFinalizeSale = async () => {
    if (!currentSession) return;
    if (cart.length === 0) return;
    if (!customerName) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    // Validation for multi-payment
    if (showMultiPayment) {
      const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(paymentsTotal - total) > 0.01) {
        alert(`O total dos pagamentos (${formatCurrency(paymentsTotal)}) deve ser igual ao total da venda (${formatCurrency(total)}).`);
        return;
      }
    }

    setLoading(true);
    try {
      const finalPayments = showMultiPayment ? payments : [{ method: paymentMethod, amount: total }];
      
      console.log('Iniciando finalização de venda:', {
        customerName,
        paymentMethod,
        itemsCount: cart.length,
        sessionId: currentSession.id,
        finalPayments
      });

      const { saleNumber } = await vendaService.processSale(
        customerName,
        cart,
        paymentMethod,
        currentSession.id!,
        selectedCustomer?.id,
        profile?.role || 'admin',
        true, // forcePending = true, so it appears in the cashier
        saleNotes,
        finalPayments
      );

      console.log('Venda finalizada com sucesso:', { saleNumber });
      soundService.playSuccess();
      setShowConfirmation({ saleNumber, total });
      setCart([]);
      setCustomerName('');
      setSaleNotes('');
      setSelectedCustomer(null);
      setPayments([]);
      setShowMultiPayment(false);
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = (method: PaymentMethod) => {
    const remaining = total - payments.reduce((sum, p) => sum + p.amount, 0);
    if (remaining <= 0) return;

    setPayments([...payments, { method, amount: parseFloat(remaining.toFixed(2)) }]);
  };

  const removePaymentMethod = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePaymentAmount = (index: number, amount: string) => {
    const val = parseFloat(amount) || 0;
    const newPayments = [...payments];
    newPayments[index].amount = val;
    setPayments(newPayments);
  };

  const searchLower = searchTerm.toLowerCase();
  
  const filteredProducts = products.filter(p => 
    !searchTerm || (
      p.name.toLowerCase().includes(searchLower) || 
      p.sku.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      p.barcode?.includes(searchTerm)
    )
  ).map(p => ({ ...p, itemType: 'product' as const }));

  const filteredServices = services.filter(s => 
    !searchTerm || (
      s.name.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower)
    )
  ).map(s => ({ ...s, itemType: 'service' as const }));

  const allFilteredItems = [...filteredProducts, ...filteredServices].sort((a, b) => {
    if (searchTerm) {
      const aStarts = a.name.toLowerCase().startsWith(searchLower);
      const bStarts = b.name.toLowerCase().startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  const displayItems = activeTab === 'all' 
    ? allFilteredItems 
    : (activeTab === 'products' ? filteredProducts : filteredServices);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone?.includes(customerSearchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const paginatedItems = displayItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const generateSalePDF = (sale: Sale) => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const rightX = pageWidth - margin;
    const centerX = pageWidth / 2;
    let currentY = 15;

    // --- 1. PREMIUM HEADER ---
    if (settings?.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', margin, currentY, 18, 18);
      } catch (e) {
        console.error('Error adding logo:', e);
      }
    }

    // Company Branding (Right Aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(settings?.name || 'Titan ERP', rightX, currentY + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    
    const companyAddress = settings?.address 
      ? `${settings.address.logradouro}, ${settings.address.numero} - ${settings.address.bairro}, ${settings.address.cidade}/${settings.address.estado}`
      : 'Endereço não configurado';
    
    doc.text(companyAddress, rightX, currentY + 10, { align: 'right' });
    doc.text(`Fone: ${settings?.phone || '—'}  |  CNPJ: ${settings?.cnpj || '—'}`, rightX, currentY + 14, { align: 'right' });

    currentY += 25;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY, rightX, currentY);
    currentY += 10;

    // --- 2. MAIN TITLE ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`RECIBO DE VENDA #${sale.saleNumber}`, centerX, currentY, { align: 'center' });
    
    currentY += 10;

    // --- Observations (if any) ---
    if (sale.notes) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text(`Obs: ${sale.notes}`, centerX, currentY, { align: 'center' });
      currentY += 8;
    }

    // --- 3. SALE INFO ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 14, 2, 2, 'FD');

    const cardY = currentY + 9;
    doc.setFontSize(7);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DATA', margin + 10, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const dateStr = sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString('pt-BR') : new Date(sale.timestamp).toLocaleDateString('pt-BR');
    doc.text(dateStr, margin + 10, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CLIENTE', centerX - 25, cardY - 3);
    doc.setFontSize(9);
    doc.text(sale.customerName, centerX - 25, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PAGAMENTO', rightX - 45, cardY - 3);
    doc.setFontSize(9);
    const paymentText = sale.payments && sale.payments.length > 1 
      ? `VARIADO (${sale.payments.length})` 
      : sale.paymentMethod.replace('_', ' ').toUpperCase();
    doc.text(paymentText, rightX - 10, cardY + 2, { align: 'right' });

    currentY += 22;

    // --- If Split Payment, add breakdown ---
    if (sale.payments && sale.payments.length > 1) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DETALHAMENTO DO PAGAMENTO:', margin, currentY - 2);
      
      const paymentDetails = sale.payments.map(p => `${p.method.replace('_', ' ').toUpperCase()}: ${formatCurrency(p.amount)}`).join('  |  ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(paymentDetails, margin, currentY + 2);
      currentY += 8;
    }

    // --- 4. ITEMS TABLE ---
    const tableData = sale.items.map(item => [
      item.name,
      item.quantity,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice)
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['DESCRIÇÃO DO PRODUTO / SERVIÇO', 'QTD', 'UNITÁRIO', 'TOTAL']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { 
        fillColor: [248, 250, 252], 
        textColor: [51, 65, 85], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    currentY += 10;

    // --- 5. TOTAL ---
    const totalBoxWidth = 50;
    const totalBoxHeight = 16;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightX - totalBoxWidth, currentY, totalBoxWidth, totalBoxHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL GERAL', rightX - 25, currentY + 6, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(sale.totalAmount), rightX - 25, currentY + 12, { align: 'center' });

    // --- 6. FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const footerText = `Gerado em ${new Date().toLocaleString('pt-BR')}  |  Venda #${sale.saleNumber}`;
      doc.text(footerText, centerX, 285, { align: 'center' });
    }

    doc.save(`Venda_${sale.saleNumber}_${sale.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  const sendSaleWhatsApp = (sale: Sale) => {
    const itemsList = sale.items.map(item => `- ${item.name} (${item.quantity}x): ${formatCurrency(item.totalPrice)}`).join('\n');
    const paymentInfo = sale.payments && sale.payments.length > 1
      ? sale.payments.map(p => `${p.method.replace('_', ' ').toUpperCase()}: ${formatCurrency(p.amount)}`).join(', ')
      : sale.paymentMethod.replace('_', ' ').toUpperCase();
      
    const message = `Olá ${sale.customerName}, aqui está o resumo da sua compra #${sale.saleNumber} na ${settings?.name || 'nossa loja'}:\n\n` +
      `Itens:\n${itemsList}\n\n` +
      `Total: ${formatCurrency(sale.totalAmount)}\n` +
      `Forma de Pagamento: ${paymentInfo}\n\n` +
      `Obrigado pela preferência!`;
    
    const encodedMessage = encodeURIComponent(message);
    const observations = sale.notes ? `\n\nObservações: ${sale.notes}` : '';
    const fullMessage = message + observations;
    const encodedFullMessage = encodeURIComponent(fullMessage);
    // Find customer phone if exists
    const customer = customers.find(c => c.id === sale.customerId || c.name === sale.customerName);
    const phone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodedFullMessage}`, '_blank');
  };

  if (!currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Caixa Fechado</h2>
        <p className="text-white/40 max-w-md">
          Você precisa abrir o caixa antes de realizar qualquer venda. 
          Vá para o módulo de Caixa para iniciar uma nova sessão.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-12 pb-24">
      {/* Header & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Terminal de Vendas</h2>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Controle de Operações em Tempo Real</p>
        </motion.div>

        <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-[24px] backdrop-blur-md border border-white/5 self-start md:self-center shadow-2xl">
          <Button
            variant={view === 'pos' ? 'primary' : 'ghost'}
            onClick={() => setView('pos')}
            className={cn(
              "px-8 h-12 rounded-[20px] font-black uppercase text-[11px] tracking-widest",
              view === 'pos' ? "shadow-[0_10px_25px_rgba(10,132,255,0.4)]" : "text-white/40 hover:text-white"
            )}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
          >
            PDV / Checkout
          </Button>
          <Button
            variant={view === 'history' ? 'primary' : 'ghost'}
            onClick={() => setView('history')}
            className={cn(
              "px-8 h-12 rounded-[20px] font-black uppercase text-[11px] tracking-widest",
              view === 'history' ? "shadow-[0_10px_25px_rgba(10,132,255,0.4)]" : "text-white/40 hover:text-white"
            )}
            leftIcon={<ReceiptIcon className="w-4 h-4" />}
          >
            Histórico
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'pos' ? (
          <motion.div 
            key="pos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* Selection Area (Left) */}
            <div className="lg:col-span-7 space-y-8">
              <Card className="p-2 border-white/10 shadow-2xl overflow-visible">
                <div className="flex flex-col md:flex-row items-stretch gap-4 p-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-titan-primary transition-colors" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Pesquisar estoque/serviços... [F2]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-14 pl-14 pr-6 rounded-[20px] border border-white/5 bg-white/5 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20 font-medium"
                    />
                  </div>
                  <div className="flex bg-white/5 p-1.5 rounded-[20px] border border-white/5">
                    <Button
                      variant={activeTab === 'all' ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab('all')}
                      className={cn(
                        "px-6 h-11 rounded-[16px] font-black uppercase text-[10px] tracking-widest transition-all",
                        activeTab === 'all' ? "shadow-lg" : "text-white/40 hover:text-white"
                      )}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={activeTab === 'products' ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab('products')}
                      className={cn(
                        "px-6 h-11 rounded-[16px] font-black uppercase text-[10px] tracking-widest transition-all",
                        activeTab === 'products' ? "shadow-lg" : "text-white/40 hover:text-white"
                      )}
                    >
                      Produtos
                    </Button>
                    <Button
                      variant={activeTab === 'services' ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab('services')}
                      className={cn(
                        "px-6 h-11 rounded-[16px] font-black uppercase text-[10px] tracking-widest transition-all",
                        activeTab === 'services' ? "shadow-lg" : "text-white/40 hover:text-white"
                      )}
                    >
                      Serviços
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="min-h-[500px]">
                {searchTerm ? (
                  displayItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedItems.map((item, idx) => {
                        const isProduct = item.itemType === 'product';
                        const outOfStock = isProduct && (item as Product).stock <= 0;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            key={`${item.itemType}-${item.id}`}
                          >
                            <Card 
                              onClick={() => !outOfStock && addToCart(item as any, item.itemType)}
                              className={cn(
                                "group cursor-pointer hover:border-titan-primary/50 hover:bg-white/[0.03] transition-all relative overflow-hidden active:scale-95 h-full",
                                outOfStock && "opacity-40 grayscale cursor-not-allowed"
                              )}
                            >
                              <CardContent className="p-6 flex items-center gap-5 h-full">
                                <div className={cn(
                                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                  isProduct ? "bg-titan-primary/10 text-titan-primary shadow-[0_0_20px_rgba(10,132,255,0.1)]" : "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                )}>
                                  {isProduct ? <Package className="w-8 h-8" /> : <Wrench className="w-8 h-8" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-[15px] text-white truncate uppercase tracking-tight leading-loose mb-1">{item.name}</h4>
                                  <div className="flex items-center gap-3">
                                    {isProduct ? (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                        (item as Product).stock < 5 ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                                      )}>
                                        Estoque: {(item as Product).stock}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Serviço Oficina</span>
                                    )}
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">#{item.id?.substring(0,6)}</span>
                                  </div>
                                </div>
                                <div className="text-right pl-4">
                                  <p className="text-xl font-black text-white tracking-tighter leading-none mb-1">{formatCurrency(item.price)}</p>
                                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ml-auto group-hover:bg-titan-primary group-hover:text-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-[40px] border border-white/5 border-dashed">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Search className="w-8 h-8 text-white/20" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Nenhum Registro</h4>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Tente refinar sua busca</p>
                    </div>
                  )
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-[40px] border border-white/5 border-dashed">
                      <div className="w-20 h-20 rounded-full bg-titan-primary/10 flex items-center justify-center mb-6">
                        <Search className="w-8 h-8 text-titan-primary" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Pronto para Operar</h4>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Inicie a busca por um item ou serviço</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Area (Right) */}
            <div className="lg:col-span-5 space-y-8">
              <Card className="flex flex-col h-full border-titan-primary/10 shadow-2xl overflow-visible relative">
                <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">Checkout Titan</CardTitle>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Sessão Ativa: {currentSession.id.substring(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 bg-titan-primary/10 text-titan-primary rounded-2xl flex items-center justify-center font-black">
                      {cart.length}
                    </span>
                  </div>
                </CardHeader>

                <div className="p-8 space-y-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-titan-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Identificar Cliente"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCustomerSearchTerm(e.target.value);
                        setShowCustomerSearch(true);
                      }}
                      onFocus={() => setShowCustomerSearch(true)}
                      onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                      className="w-full h-14 pl-14 pr-6 rounded-[20px] border border-white/5 bg-white/5 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all placeholder:text-white/20 font-medium"
                    />
                    <AnimatePresence>
                      {showCustomerSearch && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-3 bg-titan-background-sec border border-white/10 rounded-[28px] shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                        >
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer, i) => (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  setCustomerName(customer.name);
                                  setSelectedCustomer(customer);
                                  setCustomerSearchTerm('');
                                  setShowCustomerSearch(false);
                                }}
                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition-colors"
                              >
                                <div className="w-10 h-10 bg-titan-primary/10 rounded-full flex items-center justify-center text-titan-primary">
                                  <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-black text-white uppercase text-[13px] tracking-tight">{customer.name}</p>
                                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{customer.phone || 'Nenhum contato'}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white/10" />
                              </button>
                            ))
                          ) : (
                            <div className="px-8 py-6 text-center">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Nenhum cliente sincronizado</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative group">
                    <FileText className="absolute left-5 top-5 w-5 h-5 text-white/20 group-focus-within:text-titan-primary transition-colors" />
                    <textarea
                      placeholder="Observações do Pedido..."
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      rows={2}
                      className="w-full h-24 pl-14 pr-6 py-4 rounded-[20px] border border-white/5 bg-white/5 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all resize-none text-[13px] placeholder:text-white/20 font-medium whitespace-pre-wrap overscroll-contain"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 max-h-[400px] custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {cart.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-48 text-white/10 bg-white/[0.01] rounded-[32px] border border-white/5 border-dashed"
                      >
                        <ShoppingCart className="w-10 h-10 mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Carrinho Vazio</p>
                      </motion.div>
                    ) : (
                      cart.map((item, idx) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.05 }}
                          key={`${item.type}-${item.itemId}`}
                          className="p-5 bg-white/5 rounded-[24px] border border-white/5 group hover:bg-white/[0.08] transition-all"
                        >
                          <div className="flex items-center justify-between gap-4 mb-3">
                             <div className="flex-1 min-w-0">
                               <p className="text-[14px] font-black text-white uppercase tracking-tight truncate leading-tight">{item.name}</p>
                               <p className="text-[10px] font-black text-titan-primary uppercase tracking-widest mt-1">#{item.itemId.substring(0,6)} • {item.type === 'service' ? 'Serviço' : 'Mercadoria'}</p>
                             </div>
                             <p className="text-lg font-black text-white tracking-tighter shrink-0">{formatCurrency(item.totalPrice)}</p>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-[14px] border border-white/5">
                                <Button 
                                  variant="ghost"
                                  size="sm" 
                                  onClick={() => updateQuantity(item.itemId, item.type, -1)}
                                  className="w-8 h-8 p-0 rounded-[10px] bg-white/5 text-white/40 hover:text-white"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </Button>
                                <span className="w-10 text-center text-[13px] font-black text-white">{item.quantity}</span>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.itemId, item.type, 1)}
                                  className="w-8 h-8 p-0 rounded-[10px] bg-white/5 text-white/40 hover:text-white"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.itemId, item.type)}
                                className="text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                             >
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-8 bg-white/[0.03] border-t border-white/10 rounded-b-[28px] space-y-8">
                  {!showMultiPayment ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Selecione o Pagamento</span>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { if(cart.length > 0) setShowMultiPayment(true); }}
                            className="text-[10px] font-black uppercase tracking-widest text-titan-primary h-auto p-0 hover:bg-transparent transition-all"
                         >
                           Múltiplas formas →
                         </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { id: 'dinheiro', icon: Banknote, label: 'Dinheiro', color: 'bg-emerald-500' },
                          { id: 'cartao_credito', icon: CreditCard, label: 'Crédito', color: 'bg-titan-primary' },
                          { id: 'cartao_debito', icon: Wallet, label: 'Débito', color: 'bg-blue-600' },
                          { id: 'pix', icon: QrCode, label: 'PIX', color: 'bg-titan-secondary' },
                        ].map(method => (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-3 p-4 rounded-[20px] transition-all border outline-none",
                              paymentMethod === method.id 
                                ? `${method.color} border-transparent shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] scale-105` 
                                : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                            )}
                          >
                            <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-white" : "text-white/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", paymentMethod === method.id ? "text-white" : "text-white/40")}>
                              {method.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Composição de Pagamento</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setShowMultiPayment(false); setPayments([]); }}
                          className="text-[10px] font-black uppercase tracking-widest text-red-400 h-auto p-0"
                        >
                          Cancelar
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {payments.map((p, i) => (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="px-3 py-1.5 bg-titan-primary/20 text-titan-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
                               {p.method.replace('_', ' ')}
                            </div>
                            <input
                              type="number"
                              value={p.amount}
                              onChange={(e) => updatePaymentAmount(i, e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-right font-black text-lg focus:ring-0 w-full outline-none"
                            />
                            <Button variant="ghost" size="sm" onClick={() => removePaymentMethod(i)} className="text-red-500/40 hover:text-red-500 p-2">
                               <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'].map((method) => (
                          <Button
                            key={method}
                            variant="ghost"
                            size="sm"
                            onClick={() => addPaymentMethod(method as PaymentMethod)}
                            className="bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest h-10"
                          >
                            + {method.split('_')[0]}
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Total Pago</span>
                         <span className={cn(
                           "text-xl font-black tracking-tighter",
                           Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - total) < 0.01 ? "text-emerald-400" : "text-white"
                         )}>
                            {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                         </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Subtotal</span>
                       <span className="text-lg font-bold text-white/60 tracking-tight">{formatCurrency(total)}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={loading || cart.length === 0 || !customerName || (showMultiPayment && Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - total) > 0.01)}
                      onClick={handleFinalizeSale}
                      className="w-full h-18 rounded-[24px] text-[15px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(10,132,255,0.3)] bg-gradient-to-r from-titan-primary to-blue-600 border-none"
                    >
                      {loading ? 'Processando...' : `Finalizar Transação • ${formatCurrency(total)}`}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          /* History View - Premium Refactor */
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <Card className="p-8 ring-1 ring-titan-primary/20">
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Vendas Totais {new Date().toLocaleDateString()}</p>
                  <p className="text-4xl font-black text-white tracking-tighter mb-4">{recentSales.filter(s => {
                    const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
                    return date.toDateString() === new Date().toDateString();
                  }).length}</p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-titan-primary w-full" />
                  </div>
               </Card>
               <Card className="p-8">
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Receita Bruta (Hoje)</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter mb-4">
                    {formatCurrency(recentSales.filter(s => {
                      const date = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
                      return date.toDateString() === new Date().toDateString();
                    }).reduce((sum, s) => sum + s.totalAmount, 0))}
                  </p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" />
                  </div>
               </Card>
               <Card className="p-8">
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Tickets Médios</p>
                  <p className="text-4xl font-black text-titan-secondary tracking-tighter mb-4">
                    {formatCurrency(recentSales.length > 0 ? recentSales.reduce((sum, s) => sum + s.totalAmount, 0) / recentSales.length : 0)}
                  </p>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-titan-secondary w-full" />
                  </div>
               </Card>
            </div>

            <Card className="overflow-hidden shadow-2xl">
              <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                 <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white">Log de Transações</CardTitle>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Registros Oficiais do Terminal</p>
                    </div>
                 </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest">ID</th>
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest">Cliente</th>
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest">Data & Hora</th>
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest">Método</th>
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest text-right">Valor Final</th>
                      <th className="px-8 py-5 text-[11px] font-black text-white/20 uppercase tracking-widest text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentSales.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage).map((sale) => (
                      <tr key={sale.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                           <span className="text-[12px] font-black text-titan-primary">#{sale.saleNumber}</span>
                        </td>
                        <td className="px-8 py-6">
                           <p className="font-black text-white uppercase text-[14px] truncate max-w-[200px] leading-none mb-1">{sale.customerName}</p>
                           <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Operador: {sale.userName || 'Admin'}</p>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-[13px] font-medium text-white/60">
                             {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleString('pt-BR') : new Date(sale.timestamp).toLocaleString('pt-BR')}
                           </p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-titan-primary" />
                             <span className="text-[11px] font-black text-white/40 uppercase tracking-wider">{sale.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-[16px] font-black text-white tracking-tighter">{formatCurrency(sale.totalAmount)}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2">
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => generateSalePDF(sale)}
                                className="w-10 h-10 p-0 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-titan-primary transition-all"
                             >
                               <FileDown className="w-4 h-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => sendSaleWhatsApp(sale)}
                                className="w-10 h-10 p-0 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-emerald-600 transition-all"
                             >
                               <MessageCircle className="w-4 h-4" />
                             </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                 <p className="text-[11px] font-black text-white/20 uppercase tracking-widest font-mono">Página {historyPage} de {Math.ceil(recentSales.length / historyItemsPerPage)}</p>
                 <div className="flex gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      className="rounded-xl bg-white/5 h-10 w-10 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setHistoryPage(p => p + 1)}
                      className="rounded-xl bg-white/5 h-10 w-10 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                 </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal - Premium Refactor */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] backdrop-blur-3xl bg-black/80">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
            >
              <Card className="w-full max-w-md p-10 text-center border-titan-primary/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Venda Sincronizada</h3>
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-10">Pedido #{showConfirmation.saleNumber} Processado</p>
                
                <div className="bg-white/5 rounded-3xl p-8 mb-10 border border-white/5">
                   <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Valor Pago</p>
                   <p className="text-5xl font-black text-white tracking-tighter">{formatCurrency(showConfirmation.total)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      const sale = recentSales.find(s => s.saleNumber === showConfirmation.saleNumber);
                      if (sale) generateSalePDF(sale);
                      setShowConfirmation(null);
                    }}
                    className="h-16 rounded-2xl font-black uppercase text-[11px] tracking-widest"
                    leftIcon={<Printer className="w-4 h-4" />}
                  >
                    Imprimir Recibo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(null)}
                    className="h-16 rounded-2xl font-black uppercase text-[11px] tracking-widest border-white/10 hover:bg-white/5"
                  >
                    Novo Pedido
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
