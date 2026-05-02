import React, { useState, useEffect } from 'react';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Data Processing for Charts
  const getSalesByDay = () => {
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
  };

  const getMainChartTitle = () => {
    switch(activeFilter) {
      case 'faturamento': return 'Evolução de Vendas (Total)';
      case 'servicos': return 'Evolução de Mão de Obra';
      case 'estoque': return 'Movimentação de Itens';
      case 'ticket': return 'Volume de Vendas Diário';
      default: return 'Evolução de Vendas';
    }
  };

  const getSalesByPayment = () => {
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
  };

  const getOSStatusData = () => {
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
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const exportToPDF = () => {
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
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    doc.setFontSize(12);
    doc.text(`Resumo do Período:`, 15, 60);
    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${formatCurrency(totalSales)}`, 15, 68);
    doc.text(`Ordens de Serviço Ativas: ${orders.filter(o => o.status !== 'entregue').length}`, 15, 74);
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
  };

  const exportToExcel = () => {
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
      ['Total de Vendas', sales.reduce((sum, s) => sum + s.totalAmount, 0)],
      ['Quantidade de Vendas', sales.length],
      ['Ticket Médio', sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    XLSX.writeFile(wb, `relatorio_${companyName.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  };

  const exportToWhatsApp = () => {
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const companyName = settings?.name || 'Titan ERP';
    
    const message = `*Relatório de Desempenho - ${companyName}*\n\n` +
      `📅 *Período:* ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}\n` +
      `💰 *Faturamento:* ${formatCurrency(totalSales)}\n` +
      `📦 *Vendas Realizadas:* ${sales.length}\n` +
      `🛠️ *OS Ativas:* ${orders.filter(o => o.status !== 'entregue').length}\n` +
      `⚠️ *Estoque Baixo:* ${lowStockProducts.length} itens\n\n` +
      `_Gerado em: ${new Date().toLocaleString()}_`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 px-2 sm:px-0">
      {/* Header - Unified with Reports UI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-premium p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-[8px] text-white shadow-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Relatórios</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
              <Calendar className="w-3 h-3 text-blue-500" />
              {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Minimal Date Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold px-2 py-1 outline-none dark:text-white"
            />
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-1" />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] font-bold px-2 py-1 outline-none dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportToPDF}
              title="Exportar PDF"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-red-500 shadow-sm h-auto active:bg-red-50 dark:active:bg-red-900/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportToExcel}
              title="Exportar Excel"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-500 shadow-sm h-auto active:bg-emerald-50 dark:active:bg-emerald-900/20"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={exportToWhatsApp}
              title="Compartilhar WhatsApp"
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-green-500 shadow-sm h-auto active:bg-green-50 dark:active:bg-green-900/20"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <button 
          onClick={() => setActiveFilter('faturamento')}
          className={cn(
            "text-left p-3 md:p-4 card-premium",
            activeFilter === 'faturamento' 
              ? "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-lg" 
              : "bg-[#1F2937]"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <TrendingUp className={cn("w-4 h-4", activeFilter === 'faturamento' ? "text-green-600" : "text-green-500")} />
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Faturamento</span>
          </div>
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(sales.reduce((sum, s) => sum + s.totalAmount, 0))}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Total no período</p>
        </button>

        <button 
          onClick={() => setActiveFilter('servicos')}
          className={cn(
            "text-left p-3 md:p-4 card-premium",
            activeFilter === 'servicos' 
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-500 shadow-lg" 
              : "bg-[#1F2937]"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Wrench className={cn("w-4 h-4", activeFilter === 'servicos' ? "text-orange-600" : "text-orange-500")} />
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Serviços</span>
          </div>
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
            {orders.length}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">OS registradas</p>
        </button>

        <button 
          onClick={() => setActiveFilter('estoque')}
          className={cn(
            "text-left p-3 md:p-4 card-premium",
            activeFilter === 'estoque' 
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-lg" 
              : "bg-[#1F2937]"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Package className={cn("w-4 h-4", activeFilter === 'estoque' ? "text-blue-600" : "text-blue-500")} />
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Estoque Baixo</span>
          </div>
          <p className={cn("text-lg md:text-xl font-black truncate", lowStockProducts.length > 0 ? "text-red-500" : "text-slate-900 dark:text-white")}>
            {lowStockProducts.length}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Abaixo do mínimo</p>
        </button>

        <button 
          onClick={() => setActiveFilter('ticket')}
          className={cn(
            "text-left p-3 md:p-4 card-premium",
            activeFilter === 'ticket' 
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-lg" 
              : "bg-[#1F2937]"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <DollarSign className={cn("w-4 h-4", activeFilter === 'ticket' ? "text-emerald-600" : "text-emerald-500")} />
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ticket Médio</span>
          </div>
          <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Média por venda</p>
        </button>
      </div>

      {/* Visualization Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-premium p-20 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-12 h-12 border-4 border-titan-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Processando dados...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-premium p-20 flex flex-col items-center justify-center text-center space-y-4 border-red-500/20"
          >
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-black text-white uppercase italic">Ops! Algo deu errado</h3>
            <p className="text-white/40 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Tentar Novamente</Button>
          </motion.div>
        ) : activeFilter && (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Chart/Analysis Title */}
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                {activeFilter === 'faturamento' && <TrendingUp className="w-5 h-5 text-green-500" />}
                {activeFilter === 'servicos' && <Wrench className="w-5 h-5 text-orange-500" />}
                {activeFilter === 'estoque' && <Package className="w-5 h-5 text-blue-500" />}
                {activeFilter === 'ticket' && <DollarSign className="w-5 h-5 text-emerald-500" />}
                {getMainChartTitle()}
              </h3>
              {activeFilter === 'faturamento' && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                  Total de Vendas
                </div>
              )}
            </div>

            <div className="card-premium p-6 min-h-[400px]">
              {activeFilter === 'estoque' ? (
                /* Low Stock List Specialized View */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{product.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600 dark:text-red-400">{product.stock} un</p>
                          <p className="text-[9px] text-slate-400 uppercase leading-none">Mínimo: {product.minStock}</p>
                        </div>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-50">
                        <Package className="w-16 h-16 mb-4" />
                        <h4 className="text-xl font-bold">Tudo em ordem!</h4>
                        <p className="text-sm">Nenhum produto com estoque baixo no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeFilter === 'servicos' ? (
                /* Services Analysis: Combined Bar by Day + Current Status */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 h-[350px]">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-4">Evolução de Mão de Obra</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSalesByDay()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita Mão de Obra']}
                        />
                        <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-4">Status por OS</p>
                      <div className="space-y-3">
                        {getOSStatusData().map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Default Bar Chart View for Revenue and Ticket */
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalesByDay()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), activeFilter === 'ticket' ? 'Ticket Médio Diário' : 'Faturamento']}
                      />
                      <Bar 
                        dataKey="total" 
                        fill={activeFilter === 'ticket' ? '#10b981' : '#3b82f6'} 
                        radius={[6, 6, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
