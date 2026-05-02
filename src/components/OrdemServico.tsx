import React, { useState, useEffect } from 'react';
import { ordemServicoService } from '../services/ordemServicoService';
import { estoqueService } from '../services/estoqueService';
import { caixaService } from '../services/caixaService';
import { clienteService } from '../services/clienteService';
import { configuracaoService } from '../services/configuracaoService';
import { Product, ServiceItem, SaleItem, ServiceOrder, CashSession, Customer, CompanySettings } from '../domain/types';
import { 
  Plus, 
  Search, 
  Wrench, 
  User, 
  Bike, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Play, 
  Package, 
  ShoppingCart,
  Trash2,
  ArrowRightLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  FileDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdemServico() {
  const [activeView, setActiveView] = useState<'list' | 'kanban' | 'new' | 'edit'>('list');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // New OS State
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [bikeDetails, setBikeDetails] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [checklist, setChecklist] = useState<{[key: string]: boolean}>({
    'Corrente/Relação': false,
    'Freios/Pastilhas': false,
    'Câmbios/Regulagem': false,
    'Pneus/Presão': false,
    'Suspensão/Trava': false,
    'Rodas/Alinhamento': false,
    'Quadro/Limpeza': false,
  });
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitDate, setExitDate] = useState('');
  
  // Edit OS State
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editBikeDetails, setEditBikeDetails] = useState('');
  const [editProblemDescription, setEditProblemDescription] = useState('');
  const [editEntryDate, setEditEntryDate] = useState('');
  const [editExitDate, setEditExitDate] = useState('');
  const [editStatus, setEditStatus] = useState<ServiceOrder['status']>('aberto');
  const [editChecklist, setEditChecklist] = useState<{[key: string]: boolean}>({});
  
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemType, setItemType] = useState<'product' | 'service'>('service');
  const [loading, setLoading] = useState(false);

  // Conversion State
  const [convertingOS, setConvertingOS] = useState<ServiceOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');

  useEffect(() => {
    const unsubOrders = ordemServicoService.getServiceOrders(setOrders);
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubServices = estoqueService.getServices(setServices);
    const unsubCustomers = clienteService.getCustomers(setCustomers);
    const unsubCash = caixaService.getCurrentSession(setCashSession);
    const unsubSettings = configuracaoService.getSettings(setSettings);

    return () => {
      unsubOrders();
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

  const handleCreateOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ordemServicoService.createOS(
        customerName, 
        bikeDetails, 
        problemDescription,
        entryDate,
        exitDate,
        customerPhone,
        cart,
        selectedCustomerId,
        checklist
      );
      setCustomerName('');
      setCustomerPhone('');
      setBikeDetails('');
      setProblemDescription('');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setExitDate('');
      setCart([]);
      setActiveView('list');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOSInfo = async () => {
    if (!editingOS) return;
    setLoading(true);
    try {
      await ordemServicoService.updateOS(editingOS.id!, {
        customerName: editCustomerName,
        customerId: selectedCustomerId,
        customerPhone: editCustomerPhone,
        bikeDetails: editBikeDetails,
        problemDescription: editProblemDescription,
        entryDate: editEntryDate,
        exitDate: editExitDate,
        status: editStatus,
        checklist: editChecklist
      });
      // Also update items separately if needed, but here we just update info
      await ordemServicoService.updateItems(editingOS.id!, cart);

      // If status changed to finalizado via dropdown, trigger conversion
      if (editStatus === 'finalizado' && editingOS.status !== 'finalizado' && editingOS.status !== 'entregue') {
        if (!cashSession) {
          alert('OS salva como finalizada, mas não pôde ser enviada ao caixa porque o caixa está fechado.');
        } else {
          await ordemServicoService.convertToSale(
            { ...editingOS, items: cart, customerName: editCustomerName, status: editStatus }, // Use latest info including status
            'dinheiro',
            cashSession.id!,
            'admin'
          );
          alert('OS salva e enviada ao caixa para cobrança.');
        }
      }
      
      setActiveView('list');
      setEditingOS(null);
      setCart([]);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (os: ServiceOrder) => {
    const doc = new jsPDF();
    const margin = 15; // Reduzido de 20 para 15 para ganhar espaço
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 15; // Reduzido de 20 para 15

    const centerX = pageWidth / 2;
    const rightX = pageWidth - margin;
    const contentWidth = pageWidth - (margin * 2);

    // Helper for Section Titles
    const drawSectionTitle = (title: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // Reduzido de 9 para 8
      doc.setTextColor(51, 65, 85);
      doc.text(title, margin, y);
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 1.5, rightX, y + 1.5);
      return y + 8; // Reduzido de 12 para 8
    };

    // --- 1. PREMIUM HEADER (COMPACT) ---
    if (settings?.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', margin, currentY, 18, 18); // Reduzido de 25 para 18
      } catch (e) {
        console.error('Error adding logo:', e);
      }
    }

    // Company Branding (Right Aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16); // Reduzido de 20 para 16
    doc.setTextColor(15, 23, 42);
    doc.text(settings?.name || 'Titan ERP', rightX, currentY + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5); // Reduzido de 8.5 para 7.5
    doc.setTextColor(100, 116, 139);
    
    const companyAddress = settings?.address 
      ? `${settings.address.logradouro}, ${settings.address.numero} - ${settings.address.bairro}, ${settings.address.cidade}/${settings.address.estado}`
      : 'Endereço não configurado';
    
    doc.text(companyAddress, rightX, currentY + 10, { align: 'right' });
    doc.text(`Fone: ${settings?.phone || '—'}  |  CNPJ: ${settings?.cnpj || '—'}`, rightX, currentY + 14, { align: 'right' });

    currentY += 25; // Reduzido de 35 para 25
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY, rightX, currentY);
    currentY += 10; // Reduzido de 15 para 10

    // --- 2. MAIN TITLE ---
    doc.setFontSize(16); // Reduzido de 22 para 16
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`ORDEM DE SERVIÇO #${os.osNumber}`, centerX, currentY, { align: 'center' });
    
    currentY += 10; // Reduzido de 15 para 10

    // --- 3. STATUS CARD (COMPACT) ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD'); // Reduzido de 18 para 14

    const cardY = currentY + 9; // Ajustado de 11 para 9
    doc.setFontSize(7); // Reduzido de 8 para 7
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('STATUS', margin + 10, cardY - 3);
    doc.setFontSize(9); // Reduzido de 10 para 9
    doc.setTextColor(37, 99, 235);
    doc.text(os.status.toUpperCase(), margin + 10, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('DATA ENTRADA', centerX - 25, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(os.entryDate, centerX - 25, cardY + 2);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PREVISÃO SAÍDA', rightX - 45, cardY - 3);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(os.exitDate || '—', rightX - 10, cardY + 2, { align: 'right' });

    currentY += 22; // Reduzido de 35 para 22

    // --- 4. SECTIONS (CLIENTE / EQUIPAMENTO) ---
    currentY = drawSectionTitle('DADOS DO CLIENTE', currentY);
    
    doc.setFontSize(8.5); // Reduzido de 10 para 8.5
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Nome:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(os.customerName, margin + 12, currentY);

    if (os.customerPhone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Telefone:', centerX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(os.customerPhone, centerX + 15, currentY);
    }

    currentY += 10; // Reduzido de 15 para 10
    currentY = drawSectionTitle('DADOS DO EQUIPAMENTO', currentY);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Bicicleta:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(os.bikeDetails || 'Não informado', margin + 18, currentY);

    currentY += 6; // Reduzido de 8 para 6
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição do Problema:', margin, currentY);
    currentY += 5; // Reduzido de 6 para 5
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const problemLines = doc.splitTextToSize(os.problemDescription, contentWidth);
    doc.text(problemLines, margin, currentY);
    
    currentY += (problemLines.length * 4.5) + 8; // Multiplicador reduzido de 6 para 4.5

    // --- 5. PREMIUM TABLE (COMPACT) ---
    const tableData = os.items.map(item => [
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
      styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica' }, // Reduzido de 8.5/4 para 7.5/2.5
      headStyles: { 
        fillColor: [248, 250, 252], 
        textColor: [51, 65, 85], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [226, 232, 240]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center', cellWidth: 15 }, // Reduzido de 20 para 15
        2: { halign: 'right', cellWidth: 30 }, // Reduzido de 35 para 30
        3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' } // Reduzido de 35 para 30
      },
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    // Helper to check for space before elements that shouldn't be split
    const checkSpace = (needed: number) => {
      const footerLimit = 280; // Aumentado de 275 para 280 para usar o máximo da folha
      if (currentY + needed > footerLimit) {
        doc.addPage();
        currentY = 15;
      }
    };

    currentY += 8; // Reduzido de 12 para 8

    // --- 6. TOTAL DESTACADO (COMPACT) ---
    checkSpace(20);
    const totalBoxWidth = 50; // Reduzido de 60 para 50
    const totalBoxHeight = 16; // Reduzido de 22 para 16
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(rightX - totalBoxWidth, currentY, totalBoxWidth, totalBoxHeight, 2, 2, 'FD');

    doc.setFontSize(7); // Reduzido de 8 para 7
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL GERAL', rightX - 25, currentY + 6, { align: 'center' });
    
    doc.setFontSize(12); // Reduzido de 16 para 12
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(os.totalAmount), rightX - 25, currentY + 12, { align: 'center' });

    currentY += 22; // Reduzido de 35 para 22

    // --- 7. AVISO LEGAL PROFISSIONAL (COMPACT) ---
    const legalNotice = "Aviso Legal: Após 90 dias da data de conclusão do serviço, conforme Art. 1.275 do Código Civil Brasileiro, o produto não retirado poderá ser considerado abandonado, permitindo que o estabelecimento dê a destinação que julgar adequada para o ressarcimento de custos de mão de obra e peças aplicadas.";
    const legalMaxWidth = contentWidth - 10;
    const legalLines = doc.splitTextToSize(legalNotice, legalMaxWidth);
    const legalBoxHeight = (legalLines.length * 3.5) + 6; // Multiplicador reduzido de 4 para 3.5

    checkSpace(legalBoxHeight + 5);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, legalBoxHeight, 2, 2, 'F');
    doc.setFontSize(6.5); // Reduzido de 7.5 para 6.5
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(legalLines, centerX, currentY + 5.5, { align: 'center' });

    currentY += legalBoxHeight + 18; // Reduzido de 25 para 18

    // --- 8. ASSINATURAS PREMIUM (COMPACT) ---
    checkSpace(12);
    const sigWidth = 65; // Reduzido de 75 para 65
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    
    // Line Company
    doc.line(margin + 5, currentY, margin + sigWidth, currentY);
    doc.setFontSize(7.5); // Reduzido de 8.5 para 7.5
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(settings?.name || 'EMPRESA', margin + (sigWidth / 2) + 5, currentY + 5, { align: 'center' });
    
    // Line Customer
    doc.line(rightX - sigWidth - 5, currentY, rightX - 5, currentY);
    doc.text('CLIENTE', rightX - (sigWidth / 2) - 5, currentY + 5, { align: 'center' });

    // --- 9. DISCRETE FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6); // Reduzido de 7 para 6
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const footerText = `Gerado em ${new Date().toLocaleString('pt-BR')}  |  Página ${i} de ${pageCount}`;
      doc.text(footerText, centerX, 292, { align: 'center' }); // Posicionado mais baixo (292)
    }

    doc.save(`OS_ULTRA_COMPACT_${os.osNumber}_${os.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  const sendWhatsApp = (os: ServiceOrder) => {
    const message = `Olá ${os.customerName}, sua Ordem de Serviço #${os.osNumber} foi atualizada.\n\n` +
      `Status: ${os.status.toUpperCase()}\n` +
      `Bicicleta: ${os.bikeDetails}\n` +
      `Total: ${formatCurrency(os.totalAmount)}\n\n` +
      `Obrigado pela preferência!`;
    
    const encodedMessage = encodeURIComponent(message);
    const phone = os.customerPhone ? os.customerPhone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleFinishAndConvert = async (os: ServiceOrder) => {
    if (!cashSession) {
      alert('O caixa precisa estar aberto para finalizar e enviar a OS para cobrança.');
      return;
    }
    
    if (os.items.length === 0) {
      alert('Adicione pelo menos um item à OS antes de finalizar.');
      return;
    }

    setLoading(true);
    try {
      // 1. Mark as finished first
      await ordemServicoService.updateStatus(os.id!, 'finalizado');
      
      // 2. Convert to sale (it will be PENDING in cashier)
      // Pass the updated os object or update the status manually to pass the check
      await ordemServicoService.convertToSale(
        { ...os, status: 'finalizado' }, 
        'dinheiro', // Default, cashier will confirm actual method
        cashSession.id!,
        'admin'
      );
      
      alert(`OS #${os.osNumber} finalizada e enviada ao caixa com sucesso!`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusInfo = (status: ServiceOrder['status']) => {
    switch (status) {
      case 'aberto': return { label: 'Aberto', color: 'bg-blue-100 text-blue-600', icon: AlertCircle };
      case 'em_andamento': return { label: 'Em Andamento', color: 'bg-amber-100 text-amber-600', icon: Play };
      case 'finalizado': return { label: 'Enviado ao Caixa', color: 'bg-green-100 text-green-600', icon: CheckCircle2 };
      case 'entregue': return { label: 'Finalizado/Pago', color: 'bg-slate-100 text-slate-600', icon: Package };
      default: return { label: status, color: 'bg-slate-100 text-slate-600', icon: Clock };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderKanbanView = () => {
    const statuses: ServiceOrder['status'][] = ['aberto', 'em_andamento', 'finalizado', 'entregue'];
    const columns = statuses.map(status => ({
      status,
      orders: orders.filter(o => o.status === status)
    }));

    return (
      <div className="flex gap-8 overflow-x-auto pb-10 h-[calc(100vh-280px)] min-h-[700px] scrollbar-hide">
        {columns.map((col, idx) => {
          const statusInfo = getStatusInfo(col.status);
          return (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={col.status} 
              className="flex-1 min-w-[320px] flex flex-col gap-6"
            >
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_12px]",
                    col.status === 'aberto' ? 'bg-blue-500 shadow-blue-500/50' : 
                    col.status === 'em_andamento' ? 'bg-amber-500 shadow-amber-500/50' : 
                    'bg-emerald-500 shadow-emerald-500/50'
                  )} />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/40">{statusInfo.label}</h3>
                </div>
                <span className="text-[11px] font-black bg-white/5 text-white/40 px-3 py-1 rounded-full border border-white/5">
                  {col.orders.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 p-4 bg-white/[0.02] rounded-[32px] border border-white/5 overflow-y-auto custom-scrollbar group/column">
                {col.orders.map((os, oIdx) => (
                  <Card
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx * 0.1) + (oIdx * 0.05) }}
                    key={os.id}
                    onClick={() => {
                      setEditingOS(os);
                      setCart(os.items);
                      setEditCustomerName(os.customerName);
                      setSelectedCustomerId(os.customerId);
                      setEditCustomerPhone(os.customerPhone || '');
                      setEditBikeDetails(os.bikeDetails || '');
                      setEditProblemDescription(os.problemDescription);
                      setEditEntryDate(os.entryDate);
                      setEditExitDate(os.exitDate || '');
                      setEditStatus(os.status);
                      setEditChecklist(os.checklist || {
                        'Corrente/Relação': false,
                        'Freios/Pastilhas': false,
                        'Câmbios/Regulagem': false,
                        'Pneus/Pressão': false,
                        'Suspensão/Trava': false,
                        'Rodas/Alinhamento': false,
                        'Quadro/Limpeza': false,
                      });
                      setActiveView('edit');
                    }}
                    className="p-6 cursor-pointer border-white/5 hover:border-titan-primary/50 transition-all shadow-xl bg-titan-background-sec hover:bg-titan-background-sec/80 flex flex-col gap-4 overflow-visible"
                    hoverGlow
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.1em] bg-titan-primary/10 px-2 py-1 rounded-lg border border-titan-primary/20">#{os.osNumber}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {os.entryDate}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[16px] font-black text-white uppercase tracking-tight mb-1 truncate font-sans">{os.customerName}</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-titan-primary" />
                        <span className="text-[11px] text-white/40 font-black uppercase tracking-widest truncate">{os.bikeDetails}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                      <span className="text-lg font-black text-white tracking-tighter">{formatCurrency(os.totalAmount)}</span>
                      <div className="flex gap-2">
                        {os.status === 'aberto' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); ordemServicoService.updateStatus(os.id!, 'em_andamento'); }}
                            className="rounded-xl px-4 h-10 text-[9px]"
                          >
                            Iniciar
                          </Button>
                        )}
                        {os.status === 'em_andamento' && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleFinishAndConvert(os); }}
                            className="rounded-xl px-4 h-10 text-[9px]"
                          >
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {col.orders.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 transition-opacity group-hover/column:opacity-40">
                    <Package className="w-12 h-12 mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sem Registros</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-12 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-titan-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-titan-primary/30 ring-4 ring-white/5">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1 tracking-tight uppercase">
              Oficina
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-titan-primary rounded-full shadow-[0_0_10px_#0A84FF] animate-pulse" />
              <p className="text-white/40 font-black uppercase tracking-[0.25em] text-[10px]">
                Gestão de Ordens de Serviço • Sincronizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 bg-titan-background-sec/50 p-2 rounded-[28px] border border-white/5 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex gap-1 p-1">
            {[
              { id: 'list', label: 'Lista', icon: ClipboardList },
              { id: 'kanban', label: 'Painel', icon: Filter },
              { id: 'new', label: 'Novo', icon: Plus },
            ].map((view) => (
              <Button
                key={view.id}
                variant={activeView === view.id ? 'primary' : 'ghost'}
                onClick={() => {
                  setActiveView(view.id as any);
                  setCart([]);
                  setEditingOS(null);
                }}
                className={cn(
                  "rounded-2xl transition-all duration-300",
                  activeView === view.id ? "shadow-lg shadow-titan-primary/20" : "bg-transparent hover:bg-white/5"
                )}
              >
                <view.icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline font-black uppercase text-[10px] tracking-widest">{view.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'kanban' ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderKanbanView()}
          </motion.div>
        ) : activeView === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden border-white/5 p-0 bg-titan-background-sec/50 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">OS</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Cliente</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Bicicleta</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Entrada</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Total</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders
                      .sort((a, b) => (b.osNumber || 0) - (a.osNumber || 0))
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((os, idx) => {
                      const status = getStatusInfo(os.status);
                      return (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          key={os.id}
                          onClick={() => {
                            setEditingOS(os);
                            setCart(os.items);
                            setEditCustomerName(os.customerName);
                            setSelectedCustomerId(os.customerId);
                            setEditCustomerPhone(os.customerPhone || '');
                            setEditBikeDetails(os.bikeDetails || '');
                            setEditProblemDescription(os.problemDescription);
                            setEditEntryDate(os.entryDate);
                            setEditExitDate(os.exitDate || '');
                            setEditStatus(os.status);
                            setEditChecklist(os.checklist || {
                              'Corrente/Relação': false,
                              'Freios/Pastilhas': false,
                              'Câmbios/Regulagem': false,
                              'Pneus/Pressão': false,
                              'Suspensão/Trava': false,
                              'Rodas/Alinhamento': false,
                              'Quadro/Limpeza': false,
                            });
                            setActiveView('edit');
                          }}
                          className="group cursor-pointer hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-8 py-5">
                            <span className="text-[15px] font-black text-titan-primary tracking-tight">#{os.osNumber}</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 ring-1 ring-white/10">
                                <User className="w-5 h-5" />
                              </div>
                              <span className="text-[15px] font-black text-white uppercase tracking-tight">{os.customerName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-black text-white/70 uppercase tracking-tight flex items-center gap-2">
                                <Bike className="w-4 h-4 text-titan-primary" />
                                {os.bikeDetails}
                              </span>
                              <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1 line-clamp-1 truncate max-w-[200px]">{os.problemDescription}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-white/40 whitespace-nowrap">{os.entryDate}</td>
                          <td className="px-8 py-5">
                            <span className="text-lg font-black text-white tracking-tighter">{formatCurrency(os.totalAmount)}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                              os.status === 'aberto' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              os.status === 'em_andamento' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              os.status === 'finalizado' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-white/5 text-white/40"
                            )}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => generatePDF(os)}
                                className="w-10 h-10 p-0 rounded-xl bg-white/5 text-white/40 hover:text-white"
                              >
                                <FileDown className="w-5 h-5" />
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm"
                                onClick={() => sendWhatsApp(os)}
                                className="w-10 h-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </Button>
                              {os.status === 'aberto' && (
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => ordemServicoService.updateStatus(os.id!, 'em_andamento')}
                                  className="w-10 h-10 p-0 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                >
                                  <Play className="w-5 h-5" />
                                </Button>
                              )}
                              {os.status === 'em_andamento' && (
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFinishAndConvert(os)}
                                  className="w-10 h-10 p-0 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {orders.length > itemsPerPage && (
              <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[24px] border border-white/5">
                <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">
                  Página {currentPage} de {Math.ceil(orders.length / itemsPerPage)} • Total {orders.length} ordens
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border-white/5 hover:bg-white/5"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(orders.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                    className="rounded-xl border-white/5 hover:bg-white/5"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ) : activeView === 'new' ? (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* New OS Form Info */}
            <div className="card-premium p-6 space-y-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-tighter">
                <Plus className="w-6 h-6 text-titan-primary" />
                Abrir Nova Ordem de Serviço
              </h3>
              <form id="new-os-form" onSubmit={handleCreateOS} className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Nome do Cliente</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setCustomerSearchTerm(e.target.value);
                        setShowCustomerSearch(true);
                      }}
                      onFocus={() => setShowCustomerSearch(true)}
                      onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-titan-primary outline-none transition-all"
                      placeholder="Ex: João Silva"
                    />
                    {showCustomerSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <Button
                              key={customer.id}
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setCustomerName(customer.name);
                                setSelectedCustomerId(customer.id);
                                setCustomerPhone(customer.phone);
                                setCustomerSearchTerm('');
                                setShowCustomerSearch(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col border-b border-slate-100 dark:border-slate-800 last:border-0 h-auto items-start rounded-none"
                            >
                              <span className="font-bold text-slate-900 dark:text-white">{customer.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</span>
                            </Button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            Nenhum cliente sincronizado.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Data de Entrada</label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={e => setEntryDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Previsão de Saída</label>
                    <input
                      type="date"
                      value={exitDate}
                      onChange={e => setExitDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Bicicleta (Marca/Modelo/Cor)</label>
                    <input
                      type="text"
                      required
                      value={bikeDetails}
                      onChange={e => setBikeDetails(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="Ex: Specialized Rockhopper Preta"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-titan-primary" />
                    Checklist de Entrada (Vistoria)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(checklist).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setChecklist(prev => ({ ...prev, [key]: !value }))}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                          value 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                          value ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                        )}>
                          {value && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[10px] font-bold uppercase truncate">{key}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Descrição do Problema</label>
                  <textarea
                    required
                    value={problemDescription}
                    onChange={e => setProblemDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="Descreva o que precisa ser feito..."
                    rows={2}
                  />
                </div>
              </form>
            </div>

            {/* Item Search Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-orange-600" />
                Adicionar Peças e Serviços
              </h3>
              <div className="flex items-center gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Button
                  variant={itemType === 'service' ? 'primary' : 'ghost'}
                  onClick={() => setItemType('service')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                    itemType === 'service' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Serviços
                </Button>
                <Button
                  variant={itemType === 'product' ? 'primary' : 'ghost'}
                  onClick={() => setItemType('product')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                    itemType === 'product' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Peças
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={`Buscar ${itemType === 'product' ? 'peças' : 'serviços'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {!searchTerm ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Pesquise para adicionar {itemType === 'product' ? 'uma peça' : 'um serviço'}
                    </p>
                  </div>
                ) : (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                  .length > 0 ? (
                  (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(item => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => addToCart(item, itemType)}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-all text-left group h-auto w-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            itemType === 'product' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                          )}>
                             {itemType === 'product' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">{item.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {itemType === 'product' ? `Estoque: ${(item as any).stock}` : 'Serviço'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900 dark:text-white">{formatCurrency(item.price)}</span>
                          <Plus className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                        </div>
                      </Button>
                    ))
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    Nenhum(a) {itemType === 'product' ? 'peça' : 'serviço'} encontrado(a)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 lg:sticky lg:top-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Itens da OS
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={`${item.type}-${item.itemId}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group transition-all">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.itemId, item.type)}
                        className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-1 h-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8 italic">Nenhum item adicionado</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(total)}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    form="new-os-form"
                    loading={loading}
                    disabled={loading}
                    className="w-full h-14 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    leftIcon={!loading && <CheckCircle2 className="w-5 h-5" />}
                  >
                    {loading ? "Abrindo OS..." : "Abrir Ordem de Serviço"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setActiveView('list');
                      setCart([]);
                    }}
                    className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Edit OS View - Adding Items & Editing Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* OS Info Editor */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-orange-600" />
                Informações da OS #{editingOS?.osNumber}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cliente</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={e => setEditCustomerName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editCustomerPhone}
                    onChange={e => setEditCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Entrada</label>
                  <input
                    type="date"
                    value={editEntryDate}
                    onChange={e => setEditEntryDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Previsão Saída</label>
                  <input
                    type="date"
                    value={editExitDate}
                    onChange={e => setEditExitDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bicicleta</label>
                    <input
                      type="text"
                      value={editBikeDetails}
                      onChange={e => setEditBikeDetails(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-titan-primary" />
                    Checklist de Entrada
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(editChecklist).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditChecklist(prev => ({ ...prev, [key]: !value }))}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-lg border transition-all text-left",
                          value 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                          value ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                        )}>
                          {value && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-[9px] font-bold uppercase truncate">{key}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Problema</label>
                  <textarea
                    value={editProblemDescription}
                    onChange={e => setEditProblemDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="finalizado">Finalizado/Enviado ao Caixa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Button
                  variant={itemType === 'service' ? 'primary' : 'ghost'}
                  onClick={() => setItemType('service')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                    itemType === 'service' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Serviços
                </Button>
                <Button
                  variant={itemType === 'product' ? 'primary' : 'ghost'}
                  onClick={() => setItemType('product')}
                  className={cn(
                    "flex-1 py-2 h-auto rounded-lg text-sm font-bold transition-all",
                    itemType === 'product' ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm hover:bg-white" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Peças
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={`Buscar ${itemType === 'product' ? 'peças' : 'serviços'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {searchTerm ? (
                  (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                  .length > 0 ? (
                  (itemType === 'product' 
                    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm))
                    : services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(item => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => addToCart(item, itemType)}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-all text-left group h-auto w-full"
                      >
                         <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            itemType === 'product' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                          )}>
                             {itemType === 'product' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 uppercase text-xs tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                               {itemType === 'product' ? `Estoque: ${(item as any).stock}` : 'Serviço • Oficina'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(item.price)}</span>
                          <Plus className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                        </div>
                      </Button>
                    ))
                ) : (
                  <div className="md:col-span-2 py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Nenhum(a) {itemType === 'product' ? 'peça' : 'serviço'} encontrado(a)</p>
                  </div>
                )
              ) : (
                <div className="md:col-span-2 py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Pesquise para adicionar {itemType === 'product' ? 'uma peça' : 'um serviço'}
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  OS #{editingOS?.osNumber}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{editingOS?.customerName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{editingOS?.bikeDetails}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Peças e Serviços
                </h3>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={`${item.type}-${item.itemId}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.itemId, item.type)}
                        className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1 h-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8 italic">Nenhum item adicionado</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total da OS</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(total)}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (editingOS) generatePDF({ ...editingOS, items: cart, totalAmount: total });
                      }}
                      className="flex-1 h-14"
                      leftIcon={<FileDown className="w-4 h-4" />}
                    >
                      Gerar PDF
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setActiveView('list');
                        setEditingOS(null);
                        setCart([]);
                      }}
                      className="flex-1 h-14"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateOSInfo}
                      loading={loading}
                      className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 shadow-orange-500/20"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
  );
}
