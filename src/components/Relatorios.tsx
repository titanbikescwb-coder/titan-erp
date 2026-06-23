import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Wrench, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  FileText,
  AlertCircle,
  MessageCircle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import CardPadrao from './ui/CardPadrao';
import { PageContainer } from './ui';
import { vendaService } from '../services/vendaService';
import { ordemServicoService } from '../services/ordemServicoService';
import { estoqueService } from '../services/estoqueService';
import { financeiroService } from '../services/financeiroService';
import { Sale, ServiceOrder, Product, FinancialEntry, CompanySettings } from '../domain/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { configuracaoService } from '../services/configuracaoService';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Relatorios() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'faturamento' | 'servicos' | 'estoque' | 'ticket'>('faturamento');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubOrders = ordemServicoService.getServiceOrders(setOrders);
    const unsubProducts = estoqueService.getProducts(setProducts);
    const unsubFin = financeiroService.getEntries(setFinancialEntries);
    const unsubSettings = configuracaoService.getSettings(setSettings);

    return () => {
      unsubOrders();
      unsubProducts();
      unsubFin();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Add 1 day to end date to ensure the full day is included in the range
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    const unsubSales = vendaService.getSalesByDateRange(start, end, (data) => {
      setSales(data);
      setLoading(false);
    }, (err) => {
      console.error("Relatorios Error:", err);
      setError("Erro ao carregar dados do relatório. Tente novamente em instantes.");
      setLoading(false);
    });

    return () => unsubSales();
  }, [startDate, endDate]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }, []);

  const totalSales = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [sales]);

  const ticketMedio = useMemo(() => {
    return sales.length > 0 ? totalSales / sales.length : 0;
  }, [sales.length, totalSales]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'entregue').length;
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Data Processing for Charts
  const getSalesByDay = useCallback(() => {
    const days: Record<string, number> = {};
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const limit = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Safety check for very large ranges
    const maxDays = limit > 93 ? 93 : limit;

    for (let i = 0; i < maxDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days[d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })] = 0;
    }

    sales.forEach(sale => {
      const date = sale.timestamp?.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (days[dateStr] !== undefined) {
        if (activeFilter === 'faturamento') {
          days[dateStr] += sale.totalAmount;
        } else if (activeFilter === 'ticket') {
          // Temporarily store count in ticket mode to calculate avg later, 
          // but for simple bar chart we'll just show totals or count
          days[dateStr] += sale.totalAmount; 
        } else if (activeFilter === 'servicos') {
          const serviceVal = sale.items
            ?.filter(i => i.type === 'service')
            .reduce((sum, i) => sum + i.totalPrice, 0) || 0;
          days[dateStr] += serviceVal;
        }
      }
    });

    if (activeFilter === 'ticket') {
      // For ticket, we might want to show the average, but since we are showing bars by day, 
      // let's stick to totals or count. Let's do daily total for consistency.
    }

    return Object.entries(days).map(([name, total]) => ({ name, total }));
  }, [activeFilter, endDate, sales, startDate]);

  const getMainChartTitle = useCallback(() => {
    switch(activeFilter) {
      case 'faturamento': return 'Evolução de Vendas (Total)';
      case 'servicos': return 'Evolução de Mão de Obra';
      case 'estoque': return 'Movimentação de Itens';
      case 'ticket': return 'Volume de Vendas Diário';
      default: return 'Evolução de Vendas';
    }
  }, [activeFilter]);

  const getSalesByPayment = useCallback(() => {
    const methods: Record<string, number> = {
      'dinheiro': 0,
      'cartao_credito': 0,
      'cartao_debito': 0,
      'pix': 0
    };

    sales.forEach(sale => {
      if (methods[sale.paymentMethod] !== undefined) {
        methods[sale.paymentMethod] += sale.totalAmount;
      }
    });

    const labels: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'C. Crédito',
      'cartao_debito': 'C. Débito',
      'pix': 'PIX'
    };

    return Object.entries(methods).map(([name, value]) => ({ 
      name: labels[name] || name, 
      value 
    })).filter(item => item.value > 0);
  }, [sales]);

  const getOSStatusData = useCallback(() => {
    const statusCount: Record<string, number> = {
      'aberto': 0,
      'em_andamento': 0,
      'finalizado': 0,
      'entregue': 0
    };

    orders.forEach(os => {
      if (statusCount[os.status] !== undefined) {
        statusCount[os.status]++;
      }
    });

    const labels: Record<string, string> = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'finalizado': 'Finalizado',
      'entregue': 'Entregue'
    };

    return Object.entries(statusCount).map(([name, value]) => ({ 
      name: labels[name] || name, 
      value 
    }));
  }, [orders]);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const companyName = settings?.name || 'Titan ERP';
    
    // Header
    doc.setFontSize(20);
    doc.text(companyName, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    if (settings?.cnpj && settings.showCnpjOnReceipt) {
      doc.text(`CNPJ: ${settings.cnpj}`, 105, 22, { align: 'center' });
    }
    
    doc.setFontSize(14);
    doc.text('Relatório de Desempenho', 105, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 15, 42);
    doc.text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`, 15, 48);

    // Summary
    doc.setFontSize(12);
    doc.text(`Resumo do Período:`, 15, 60);
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${formatCurrency(totalSales)}`, 15, 68);
    doc.text(`Ordens de Serviço Ativas: ${activeOrdersCount}`, 15, 74);
    doc.text(`Produtos com Estoque Baixo: ${lowStockProducts.length}`, 15, 80);

    // Sales Table
    doc.setFontSize(12);
    doc.text('Vendas Recentes', 15, 95);
    autoTable(doc, {
      startY: 100,
      head: [['Nº', 'Cliente', 'Data', 'Total', 'Pagamento']],
      body: sales.slice(0, 20).map(s => [
        s.saleNumber,
        s.customerName,
        s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString() : new Date(s.timestamp).toLocaleDateString(),
        formatCurrency(s.totalAmount),
        s.paymentMethod
      ]),
      theme: 'striped',
      headStyles: { fillColor: '#3b82f6' }
    });

    if (settings?.receiptMessage) {
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(8);
      doc.text(settings.receiptMessage, 105, finalY + 20, { align: 'center' });
    }

    doc.save(`relatorio_${companyName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  }, [activeOrdersCount, endDate, formatCurrency, lowStockProducts.length, sales, settings, startDate, totalSales]);

  const exportToExcel = useCallback(() => {
    const companyName = settings?.name || 'Titan ERP';
    
    // Prepare data
    const salesData = sales.map(s => ({
      'Venda Nº': s.saleNumber,
      'Cliente': s.customerName,
      'Data': s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString() : new Date(s.timestamp).toLocaleDateString(),
      'Total (R$)': s.totalAmount,
      'Forma de Pagamento': s.paymentMethod,
      'Status': s.status
    }));

    const ws = XLSX.utils.json_to_sheet(salesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    
    // Add Summary sheet
    const summaryData = [
      ['Resumo do Relatório'],
      ['Empresa', companyName],
      ['Data de Geração', new Date().toLocaleDateString()],
      ['Período', `${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`],
      [''],
      ['Total de Vendas', totalSales],
      ['Quantidade de Vendas', sales.length],
      ['Ticket Médio', ticketMedio]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    XLSX.writeFile(wb, `relatorio_${companyName.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  }, [endDate, sales, settings, startDate, ticketMedio, totalSales]);

  const exportToWhatsApp = useCallback(() => {
    const companyName = settings?.name || 'Titan ERP';
    
    const message = `*Relatório de Desempenho - ${companyName}*\n\n` +
      `📅 *Período:* ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}\n` +
      `💰 *Faturamento:* ${formatCurrency(totalSales)}\n` +
      `📦 *Vendas Realizadas:* ${sales.length}\n` +
      `🛠️ *OS Ativas:* ${activeOrdersCount}\n` +
      `⚠️ *Estoque Baixo:* ${lowStockProducts.length} itens\n\n` +
      `_Gerado em: ${new Date().toLocaleString()}_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }, [activeOrdersCount, endDate, formatCurrency, lowStockProducts.length, sales.length, settings, startDate, totalSales]);

  return (
    <PageContainer className="max-w-7xl mx-auto space-y-8 pb-20 mt-6 px-4 sm:px-0">
      {/* Header - Standardized with Configuracoes pattern */}
      <div className="flex items-center gap-6 card-premium p-8 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="bg-blue-600 p-4 rounded-[20px] text-white shadow-2xl shadow-blue-600/30">
          <BarChart3 className="w-8 h-8 whitespace-nowrap" />
        </div>
        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-wider leading-none mb-2">Relatórios</h2>
            <p className="text-[10px] text-white font-black uppercase tracking-[0.4em] leading-none">Desempenho • Análise de Dados</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Minimal Date Controls */}
            <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-titan-border shadow-inner">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-widest px-3 py-1.5 outline-none text-white cursor-pointer"
              />
              <div className="w-px h-4 bg-white/10 mx-1" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-widest px-3 py-1.5 outline-none text-white cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="secondary"
                size="sm"
                onClick={exportToPDF}
                title="Exportar PDF"
                className="w-12 h-12 rounded-xl bg-black/40 border border-titan-border text-red-500 hover:border-red-500/50 p-0"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={exportToExcel}
                title="Exportar Excel"
                className="w-12 h-12 rounded-xl bg-black/40 border border-titan-border text-emerald-500 hover:border-emerald-500/50 p-0"
              >
                <FileText className="w-5 h-5" />
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={exportToWhatsApp}
                title="Compartilhar WhatsApp"
                className="w-12 h-12 rounded-xl bg-black/40 border border-titan-border text-green-500 hover:border-green-500/50 p-0"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Unified Pattern */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    {
      id: 'faturamento',
      label: 'Faturamento',
      value: formatCurrency(totalSales),
      icon: TrendingUp,
      subLabel: 'Total no período',
      variant: 'success'
    },

    {
      id: 'servicos',
      label: 'Serviços',
      value: orders.length,
      icon: Wrench,
      subLabel: 'OS registradas',
      variant: 'warning'
    },

    {
      id: 'estoque',
      label: 'Estoque Baixo',
      value: lowStockProducts.length,
      icon: Package,
      subLabel: 'Abaixo do mínimo',
      variant: 'analytics'
    },

    {
      id: 'ticket',
      label: 'Ticket Médio',
      value: formatCurrency(ticketMedio),
      icon: DollarSign,
      subLabel: 'Média por venda',
      variant: 'finance'
    },
  ].map((card) => (
    <CardPadrao
      key={card.id}
      title={card.label}
      value={card.value}
      subValue={card.subLabel}
      icon={card.icon}
      variant={card.variant}
      onClick={() => setActiveFilter(card.id as any)}
      active={activeFilter === card.id}
    />
  ))}
</div>
      {/* Visualization Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-premium p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
          >
            <div className="w-12 h-12 border-4 border-titan-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px]">Processando inteligência de dados...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-premium p-20 flex flex-col items-center justify-center text-center space-y-4 border-red-500/20 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
          >
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Erro de Processamento</h3>
            <p className="text-white/40 max-w-md uppercase font-bold text-[10px] tracking-widest">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-xl border-white/10 hover:border-white/30 text-white">Tentar Novamente</Button>
          </motion.div>
        ) : activeFilter && (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="p-8 md:p-10 rounded-[40px] border border-titan-border shadow-[0_40px_100px_rgba(0,0,0,0.6)] min-h-[500px]">
              <CardHeader className="mb-10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-[20px] shadow-2xl",
                    activeFilter === 'faturamento' && "bg-green-600/20 text-green-400 border border-green-600/30 shadow-green-600/10",
                    activeFilter === 'servicos' && "bg-orange-600/20 text-orange-400 border border-orange-600/30 shadow-orange-600/10",
                    activeFilter === 'estoque' && "bg-blue-600/20 text-blue-400 border border-blue-600/30 shadow-blue-600/10",
                    activeFilter === 'ticket' && "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 shadow-emerald-600/10"
                  )}>
                    {activeFilter === 'faturamento' && <TrendingUp className="w-8 h-8" />}
                    {activeFilter === 'servicos' && <Wrench className="w-8 h-8" />}
                    {activeFilter === 'estoque' && <Package className="w-8 h-8" />}
                    {activeFilter === 'ticket' && <DollarSign className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                      {getMainChartTitle()}
                    </h3>
                    <p className="text-[9px] text-white font-black uppercase tracking-[0.4em] opacity-40">Análise detalhada do período selecionado</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
              {activeFilter === 'estoque' ? (
                /* Low Stock List Specialized View */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lowStockProducts.map(product => (
                      <Card key={product.id} className="flex items-center justify-between p-6 bg-red-950/10 border-red-500/20 rounded-3xl hover:bg-red-950/20 transition-all border">
                        <div>
                          <p className="text-[13px] font-black text-white uppercase tracking-tight">{product.name}</p>
                          <p className="label opacity-40">CÓDIGO: #{product.productCode || product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-red-500">{product.stock} un</p>
                          <p className="label opacity-30">Mínimo: {product.minStock}</p>
                        </div>
                      </Card>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/20">
                        <Package className="w-20 h-20 mb-6 opacity-10" />
                        <h4 className="text-xl font-black uppercase tracking-widest">Estoque em Conformidade</h4>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Nenhum item abaixo do nível crítico</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeFilter === 'servicos' ? (
                /* Services Analysis: Combined Bar by Day + Current Status */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 h-[400px]">
                    <p className="label mb-6">Evolução de Mão de Obra</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSalesByDay()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#ffffff40', fontWeight: 'bold'}} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#ffffff40', fontWeight: 'bold'}} 
                        />
                        <Tooltip 
                          cursor={{fill: '#ffffff05'}}
                          contentStyle={{ 
                            background: '#121212', 
                            borderRadius: '16px', 
                            border: '1px solid #2C2C2C', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)' 
                          }}
                          itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita Mão de Obra']}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="#f59e0b" 
                          radius={[8, 8, 0, 0]} 
                          className="drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                    <div>
                      <p className="label mb-6">Status Operacional</p>
                      <div className="space-y-4">
                        {getOSStatusData().map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between p-5 bg-black/40 border border-titan-border rounded-[20px] group hover:border-white/10 transition-all">
                            <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">{item.name}</span>
                            <span className="text-lg font-black text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Default Bar Chart View for Revenue and Ticket */
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalesByDay()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#ffffff40', fontWeight: 'bold'}} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#ffffff40', fontWeight: 'bold'}} 
                      />
                      <Tooltip 
                        cursor={{fill: '#ffffff05'}}
                        contentStyle={{ 
                          background: '#121212', 
                          borderRadius: '16px', 
                          border: '1px solid #2C2C2C', 
                          boxShadow: '0 20px 40px rgba(0,0,0,0.5)' 
                        }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                        formatter={(value: number) => [formatCurrency(value), activeFilter === 'ticket' ? 'Ticket Médio Diário' : 'Faturamento']}
                      />
                      <Bar 
                        dataKey="total" 
                        fill={activeFilter === 'ticket' ? '#10b981' : '#3b82f6'} 
                        radius={[8, 8, 0, 0]} 
                        className={cn(
                          "transition-all duration-500",
                          activeFilter === 'ticket' ? "drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        )}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
