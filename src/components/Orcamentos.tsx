import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { orcamentoService } from '../services/orcamentoService';
import { estoqueService } from '../services/estoqueService';
import { caixaService } from '../services/caixaService';
import { clienteService } from '../services/clienteService';
import { configuracaoService } from '../services/configuracaoService';
import { Product, ServiceItem, SaleItem, Budget, CashSession, Customer, CompanySettings } from '../domain/types';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  User, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Clock, 
  XCircle,
  ArrowRightLeft,
  Calendar,
  Filter,
  AlertTriangle,
  FileDown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Wrench,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import CardPadrao from './ui/CardPadrao';
import { Card } from './ui/Card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Orcamentos() {
  const [activeView, setActiveView] = useState<'list' | 'new'>('list');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  // New Budget State
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [loading, setLoading] = useState(false);
  const [validityDays, setValidityDays] = useState(7);
  const [activeFilter, setActiveFilter] = useState<'aberto' | 'aprovado' | 'convertido' | null>(null);

  // Conversion State
  const [convertingBudget, setConvertingBudget] = useState<Budget | null>(null);
  const [conversionType, setConversionType] = useState<'venda' | 'os'>('venda');
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');
  const [bikeDetails, setBikeDetails] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  useEffect(() => {
    const unsubBudgets = orcamentoService.getBudgets(setBudgets);
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubServices = estoqueService.getServices(setServices);
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    const unsubCash = caixaService.getCurrentSession(setCashSession);
    const unsubSettings = configuracaoService.getSettings(setSettings);

    return () => {
      unsubBudgets();
      unsubProducts();
      unsubServices();
      unsubCustomers();
      unsubCash();
      unsubSettings();
    };
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone?.includes(customerSearchTerm)
  );

  const addToCart = (item: Product | ServiceItem, type: 'product' | 'service') => {
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
        totalPrice: item.price
      }]);
    }
  };

  const removeFromCart = (itemId: string, type: 'product' | 'service') => {
    setCart(cart.filter(i => !(i.itemId === itemId && i.type === type)));
  };

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleCreateBudget = async () => {
    if (!customerName || cart.length === 0) return;
    setLoading(true);
    try {
      await orcamentoService.createBudget(customerName, cart, validityDays, selectedCustomerId);
      setCustomerName('');
      setSelectedCustomerId(undefined);
      setCart([]);
      setActiveView('list');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!convertingBudget) return;
    
    if (conversionType === 'venda' && !cashSession) {
      toast('Abra o caixa para converter este orçamento em venda.');
      return;
    }

    if (conversionType === 'os' && (!bikeDetails || !problemDescription)) {
      toast('Preencha os dados da bicicleta e o problema para criar a OS.');
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando conversão de orçamento:', { 
        id: convertingBudget.id, 
        type: conversionType,
        itemsCount: convertingBudget.items?.length 
      });

      if (conversionType === 'venda') {
        const result = await orcamentoService.convertToSale(
          convertingBudget, 
          paymentMethod, 
          cashSession!.id!,
          'admin'
        );
        console.log('Conversão para venda concluída:', result);
        toast.success(`Venda #${result.saleNumber} criada com sucesso.`);
      } else {
        const result = await orcamentoService.convertToOS(
          convertingBudget, 
          bikeDetails, 
          problemDescription
        );
        console.log('Conversão para OS concluída:', result);
        toast.success('Ordem de Serviço criada.');
      }
      
      setConvertingBudget(null);
      setBikeDetails('');
      setProblemDescription('');
      setActiveView('list');
    } catch (error: any) {
      console.error('Erro ao converter orçamento:', error);
      toast.error(error.message || 'Erro ao converter orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status: Budget['status']) => {
    switch (status) {
      case 'aberto': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'aprovado': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'recusado': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'convertido': return 'bg-white/5 text-white/40 border border-white/10';
      default: return 'bg-white/5 text-white/40 border border-white/10';
    }
  };

  const generatePDF = (budget: Budget) => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const rightX = pageWidth - margin;
    const centerX = pageWidth / 2;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 15;

    // Helper for Section Titles
    const drawSectionTitle = (title: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(title, margin, y);
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 1.5, rightX, y + 1.5);
      return y + 8;
    };

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
    doc.text(`ORÇAMENTO #${budget.budgetNumber}`, centerX, currentY, { align: 'center' });
    
    currentY += 10;

    // --- 3. STATUS CARD ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

    const cardY = currentY + 9;
    doc.setFontSize(7);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('STATUS', margin + 10, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(79, 70, 229); // Indigo for budgets
    doc.text(budget.status.toUpperCase(), margin + 10, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('DATA EMISSÃO', centerX - 25, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const dateStr = budget.timestamp?.toDate ? budget.timestamp.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    doc.text(dateStr, centerX - 25, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('VALIDADE', rightX - 45, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const validStr = budget.validUntil?.toDate ? budget.validUntil.toDate().toLocaleDateString('pt-BR') : 'N/A';
    doc.text(validStr, rightX - 10, cardY + 2, { align: 'right' });

    currentY += 22;

    // --- 4. SECTIONS (CLIENTE) ---
    currentY = drawSectionTitle('DADOS DO CLIENTE', currentY);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Nome:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.customerName, margin + 12, currentY);

    // Find customer phone
    const customer = customers.find(c => c.id === budget.customerId || c.name === budget.customerName);
    if (customer?.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Telefone:', centerX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(customer.phone, centerX + 15, currentY);
    }

    currentY += 10;

    // --- 5. ITEMS TABLE ---
    const tableData = budget.items.map(item => [
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
      styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica' },
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

    // --- 6. TOTAL DESTACADO ---
    const totalBoxWidth = 50;
    const totalBoxHeight = 16;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightX - totalBoxWidth, currentY, totalBoxWidth, totalBoxHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL ORÇAMENTO', rightX - 25, currentY + 6, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(budget.totalAmount), rightX - 25, currentY + 12, { align: 'center' });

    currentY += 22;

    // --- 7. DISCRETE FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const footerText = `Gerado em ${new Date().toLocaleString('pt-BR')}  |  Página ${i} de ${pageCount}  |  Orçamento #${budget.budgetNumber}`;
      doc.text(footerText, centerX, 288, { align: 'center' });
    }

    doc.save(`Orcamento_${budget.budgetNumber}_${budget.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  const sendWhatsApp = (budget: Budget) => {
    const itemsList = budget.items.map(item => `- ${item.name} (${item.quantity}x): ${formatCurrency(item.totalPrice)}`).join('\n');
    const validStr = budget.validUntil?.toDate ? budget.validUntil.toDate().toLocaleDateString('pt-BR') : 'N/A';
    
    const message = `Olá ${budget.customerName}, aqui está o orçamento #${budget.budgetNumber} da ${settings?.name || 'nossa loja'}:\n\n` +
      `Resumo dos Itens:\n${itemsList}\n\n` +
      `Total: ${formatCurrency(budget.totalAmount)}\n` +
      `Validade: ${validStr}\n\n` +
      `Estamos à disposição para qualquer dúvida!`;
    
    const encodedMessage = encodeURIComponent(message);
    const customer = customers.find(c => c.id === budget.customerId || c.name === budget.customerName);
    const phone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleFilterToggle = (filter: 'aberto' | 'aprovado' | 'convertido') => {
    setActiveFilter(activeFilter === filter ? null : filter);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const orcamentoStats = [
  { 
    id: 'aberto',
    label: 'Orçamentos em Aberto', 
    value: budgets.filter(b => b.status === 'aberto').length,
    icon: Clock,
    variant: 'analytics' as const
  },

  { 
    id: 'aprovado',
    label: 'Propostas Aprovadas', 
    value: budgets.filter(
      b => b.status === 'aprovado' || b.status === 'convertido'
    ).length,
    icon: CheckCircle2,
    variant: 'success' as const
  },

  { 
    id: 'convertido',
    label: 'Taxa de Conversão', 
    value: `${
      budgets.length > 0
        ? (
            budgets.filter(b => b.status === 'convertido').length /
            budgets.length *
            100
          ).toFixed(0)
        : 0
    }%`,
    icon: TrendingUp,
    variant: 'warning' as const
  },

  { 
    id: 'total',
    label: 'Total em Propostas', 
    value: formatCurrency(
      budgets
        .filter(b => b.status === 'aberto')
        .reduce((acc, b) => acc + b.totalAmount, 0)
    ),
    icon: DollarSign,
    variant: 'finance' as const
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
            <FileText className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-wider uppercase">
              Orçamentos
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-titan-primary rounded-full shadow-[0_0_15px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
                Gestão de Orçamentos & Prospecção • Sincronizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-black/40 p-3 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex gap-2 p-1">
            <Button
              variant={activeView === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('list')}
              className={cn(
                "h-12 px-8 rounded-2xl transition-all duration-300 text-[10px] uppercase font-black tracking-widest",
                activeView === 'list' ? "shadow-lg shadow-titan-primary/20" : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              Lista
            </Button>
            <Button
              variant={activeView === 'new' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('new')}
              className={cn(
                "h-12 px-8 rounded-2xl transition-all duration-300 text-[10px] uppercase font-black tracking-widest",
                activeView === 'new' ? "shadow-lg shadow-titan-primary/20" : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              Novo Atendimento
            </Button>
          </div>
        </motion.div>
      </div>

      {/* SUMMARY CARDS */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
  {orcamentoStats.map((card) => (
    <CardPadrao
      key={card.id}
      title={card.label}
      value={card.value}
      icon={card.icon}
      variant={card.variant}
      onClick={() => card.id !== 'total' && handleFilterToggle(card.id as any)}
    />
  ))}
</div>

      {activeView === 'list' ? (
        <div className="space-y-6">
          <div className="card-premium p-6 border border-white/5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="Buscar orçamentos por cliente ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-titan-primary/50 transition-all font-medium text-white placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="card-premium overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Orçamento</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Validade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Itens</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Total</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {budgets
                    .filter(b => {
                      const matchesSearch = !searchTerm || 
                        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        b.budgetNumber?.toString().includes(searchTerm);
                      
                      const matchesFilter = !activeFilter || 
                        (activeFilter === 'aprovado' ? (b.status === 'aprovado' || b.status === 'convertido') : b.status === activeFilter);
                      
                      return matchesSearch && matchesFilter;
                    })
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(budget => (
                    <tr 
                      key={budget.id}
                      onClick={() => setSelectedBudget(budget)}
                      className="cursor-pointer active:bg-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-titan-primary">#{budget.budgetNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-white/80">{budget.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/40">
                          <Calendar className="w-3.5 h-3.5" />
                          {budget.validUntil?.toDate ? budget.validUntil.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white/40 px-2 py-1 bg-white/5 rounded-lg">
                          {budget.items.length} itens
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-white">{formatCurrency(budget.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase", getStatusColor(budget.status))}>
                          {budget.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => generatePDF(budget)}
                            className="p-2 h-auto"
                            title="Gerar PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => sendWhatsApp(budget)}
                            className="p-2 h-auto text-green-600"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          {(budget.status === 'aberto' || budget.status === 'aprovado') && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setConvertingBudget(budget);
                                setConversionType('venda');
                                setBikeDetails('');
                                setProblemDescription('');
                              }}
                              className="p-2 h-auto text-indigo-600"
                              title="Converter em Venda/OS"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {budgets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                          <FileText className="w-8 h-8 text-white/10" />
                        </div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Nenhum Orçamento</h4>
                        <p className="text-sm text-white/40 font-medium">Inicie uma nova proposta para que ela apareça aqui.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {budgets.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-4 py-6 card-premium border border-white/5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-2xl h-auto bg-white/5 border-white/10"
              >
                <ChevronLeft className="w-5 h-5 text-white/40" />
              </Button>
              
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Página</span>
                <span className="text-sm font-black text-titan-primary leading-none">{currentPage}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">de</span>
                <span className="text-sm font-black text-white/80 leading-none">{Math.ceil(budgets.length / itemsPerPage)}</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(budgets.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(budgets.length / itemsPerPage)}
                className="p-2.5 rounded-2xl h-auto bg-white/5 border-white/10"
              >
                <ChevronRight className="w-5 h-5 text-white/40" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* New Budget Form - Reusing Vendas UI logic */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6 space-y-4 border border-white/5">
              <div className="flex items-center gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                <Button
                  variant={itemType === 'product' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setItemType('product')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg transition-all",
                    itemType === 'product' ? "bg-titan-primary text-white shadow-sm" : "text-white/40 bg-transparent"
                  )}
                >
                  Produtos
                </Button>
                <Button
                  variant={itemType === 'service' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setItemType('service')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg transition-all",
                    itemType === 'service' ? "bg-titan-primary text-white shadow-sm" : "text-white/40 bg-transparent"
                  )}
                >
                  Serviços
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  placeholder={`Buscar ${itemType === 'product' ? 'produtos' : 'serviços'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all uppercase text-[10px] font-black tracking-widest placeholder:text-white/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {searchTerm ? (
                  (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.productCode?.toString().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase())))
                  .length > 0 ? (
                  (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.productCode?.toString().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(item => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => addToCart(item, itemType)}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/5 text-left h-auto w-full active:bg-white/5 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            itemType === 'product' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                          )}>
                             {itemType === 'product' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white uppercase text-xs">
                              {itemType === 'product' && (item as any).productCode ? `#${(item as any).productCode} - ` : ''}{item.name}
                            </p>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                              {itemType === 'product' ? `Estoque: ${(item as any).stock}` : 'Serviço • Oficina'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-white">{formatCurrency(item.price)}</span>
                          <Plus className="w-5 h-5 text-white/10" />
                        </div>
                      </Button>
                    ))
                ) : (
                  <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/40 font-medium">
                      Nenhum {itemType === 'product' ? 'produto' : 'serviço'} encontrado
                    </p>
                  </div>
                )
              ) : (
                <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/40 font-medium">
                      Pesquise para adicionar um {itemType === 'product' ? 'produto' : 'serviço'}
                    </p>
                  </div>
              )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-premium p-6 space-y-6 border border-white/5">
              <div className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-titan-primary" />
                  Dados do Cliente
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar ou digitar nome..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setCustomerSearchTerm(e.target.value);
                      setShowCustomerSearch(true);
                    }}
                    onFocus={() => setShowCustomerSearch(true)}
                    onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all"
                  />
                  {showCustomerSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/5 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <Button
                            key={customer.id}
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setCustomerName(customer.name);
                              setSelectedCustomerId(customer.id);
                              setCustomerSearchTerm('');
                              setShowCustomerSearch(false);
                            }}
                            className="w-full px-4 py-3 text-left flex flex-col border-b border-white/5 last:border-0 h-auto items-start rounded-none hover:bg-white/5"
                          >
                            <span className="font-bold text-white">{customer.name}</span>
                            <span className="text-xs text-white/40">{customer.phone}</span>
                          </Button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-white/20">
                          Nenhum cliente sincronizado.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-1">Validade (Dias)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-titan-primary" />
                  Itens do Orçamento
                </h3>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={`${item.type}-${item.itemId}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{item.name}</p>
                        <p className="text-xs text-white/40">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.itemId, item.type)}
                        className="text-white/20 hover:text-red-500 p-1 h-auto transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-center text-sm text-white/10 py-8 italic font-bold uppercase tracking-widest text-[10px]">Carrinho vazio</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-white/40 font-medium">Total do Orçamento</span>
                  <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
                </div>
                <Button
                  onClick={handleCreateBudget}
                  loading={loading}
                  disabled={!customerName || cart.length === 0}
                  className="w-full h-14 shadow-xl shadow-titan-primary/20"
                >
                  Gerar Orçamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Detail Modal */}
      <AnimatePresence>
        {selectedBudget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-2xl overflow-hidden border border-white/5"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="bg-titan-primary p-2 rounded-xl text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Orçamento #{selectedBudget.budgetNumber}</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Detalhes da Proposta</p>
                  </div>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBudget(null)}
                  className="p-2 h-auto hover:bg-white/5 rounded-full"
                >
                  <X className="w-6 h-6 text-white/20" />
                </Button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Cliente</p>
                    <p className="font-bold text-white truncate">{selectedBudget.customerName}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Data</p>
                    <p className="font-bold text-white truncate">
                      {selectedBudget.timestamp?.toDate ? selectedBudget.timestamp.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Validade</p>
                    <p className="font-bold text-white truncate">
                      {selectedBudget.validUntil?.toDate ? selectedBudget.validUntil.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Status</p>
                    <span className={cn(
                      "flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest justify-center",
                      getStatusColor(selectedBudget.status)
                    )}>
                      {selectedBudget.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1">Itens do Orçamento</h4>
                  <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                          <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase">Item</th>
                          <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase text-center">Qtd</th>
                          <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase text-right">Unitário</th>
                          <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {selectedBudget.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-white/80">{item.name}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-center text-white">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-white/40 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm font-black text-white text-right">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col items-end pt-4 border-t border-white/10">
                  <div className="flex items-baseline gap-4">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Total Geral</span>
                    <span className="text-2xl font-black text-titan-primary">{formatCurrency(selectedBudget.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-wrap justify-center sm:justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => generatePDF(selectedBudget)}
                  className="flex-1 sm:flex-none h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest"
                  leftIcon={<FileDown className="w-4 h-4" />}
                >
                  PDF Proposta
                </Button>
                <Button
                  variant="success"
                  onClick={() => sendWhatsApp(selectedBudget)}
                  className="flex-1 sm:flex-none h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  WhatsApp
                </Button>
                {selectedBudget.status === 'aberto' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="danger"
                      onClick={() => { orcamentoService.updateStatus(selectedBudget.id!, 'recusado'); setSelectedBudget(null); }}
                      className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-500/20"
                    >
                      Recusar
                    </Button>
                    <Button 
                      variant="success"
                      onClick={() => { orcamentoService.updateStatus(selectedBudget.id!, 'aprovado'); setSelectedBudget(null); }}
                      className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Aprovar
                    </Button>
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={() => setSelectedBudget(null)}
                  className="w-full sm:w-auto px-10 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conversion Modal */}
      <AnimatePresence>
        {convertingBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-premium rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden border border-white/5"
            >
              <div className="p-6 border-b border-white/5 bg-titan-primary text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ArrowRightLeft className="w-6 h-6" />
                  Converter Orçamento
                </h3>
                <p className="text-xs text-white/80 mt-1">Orçamento #{convertingBudget.budgetNumber} - {convertingBudget.customerName}</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                  <Button
                    variant={conversionType === 'venda' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setConversionType('venda')}
                    className={cn(
                      "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                      conversionType === 'venda' ? "bg-titan-primary text-white shadow-sm" : "text-white/40"
                    )}
                  >
                    Venda Direta
                  </Button>
                  <Button
                    variant={conversionType === 'os' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setConversionType('os')}
                    className={cn(
                      "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                      conversionType === 'os' ? "bg-titan-primary text-white shadow-sm" : "text-white/40"
                    )}
                  >
                    Ordem de Serviço
                  </Button>
                </div>

                {conversionType === 'venda' ? (
                  !cashSession ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-200">
                        O caixa precisa estar aberto para converter orçamentos em vendas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-white/40 uppercase">Forma de Pagamento</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'dinheiro', label: 'Dinheiro' },
                          { id: 'cartao_credito', label: 'C. Crédito' },
                          { id: 'cartao_debito', label: 'C. Débito' },
                          { id: 'pix', label: 'PIX' }
                        ].map(method => (
                          <Button
                            key={method.id}
                            variant={paymentMethod === method.id ? 'primary' : 'ghost'}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={cn(
                              "py-3 px-4 h-auto rounded-xl border-2 font-bold text-sm transition-all",
                              paymentMethod === method.id 
                                ? "border-titan-primary bg-titan-primary/10 text-white" 
                                : "bg-black/40 border-white/5 text-white/40 hover:border-white/10"
                            )}
                          >
                            {method.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase mb-1">Detalhes da Bicicleta</label>
                      <input
                        type="text"
                        placeholder="Ex: Specialized Rockhopper - Vermelha"
                        value={bikeDetails}
                        onChange={(e) => setBikeDetails(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase mb-1">Descrição do Problema</label>
                      <textarea
                        placeholder="Descreva o que precisa ser feito..."
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/5 bg-black/40 text-white focus:ring-2 focus:ring-titan-primary outline-none h-24 resize-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setConvertingBudget(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConvert}
                    loading={loading}
                    disabled={conversionType === 'venda' && !cashSession}
                    className="flex-1"
                  >
                    {conversionType === 'venda' ? 'Finalizar Venda' : 'Gerar OS'}
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
