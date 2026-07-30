import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, TrendingUp, BarChart3, 
  Award, PieChart, ShoppingBag, 
  Calendar, Layers, UserCheck, Download as DownloadIcon,
  Truck, CreditCard, Gift, Tag, Landmark, Target,
  ChevronRight
} from 'lucide-react';
import { getOrders, getProducts, getPricingSettings } from '../../../services/api';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

/**
 * Extract the date when the order transitioned to "completed" status.
 * Falls back to createdAt if statusHistory is unavailable.
 */
function getOrderCompletedDate(order) {
  if (Array.isArray(order.statusHistory)) {
    const completedEntry = [...order.statusHistory]
      .reverse()
      .find(entry => entry.status === 'completed');
    if (completedEntry?.changedAt) {
      return new Date(completedEntry.changedAt);
    }
  }
  return new Date(order.createdAt || Date.now());
}

/**
 * Resolve the wholesale (cost) price for an order item.
 * If the item has a selectedOption and the product has matching variant
 * with its own price — use that variant's wholesale price.
 * Otherwise fall back to base product.price (wholesale).
 */
function resolveWholesaleCost(orderItem) {
  const prod = orderItem.product || {};
  const selectedOption = orderItem.selectedOption;

  // If variant was selected, look for its wholesale price in product.options
  if (selectedOption && prod.options && typeof prod.options === 'object') {
    const opts = prod.options;
    if (Array.isArray(opts.items)) {
      const matched = opts.items.find(
        o => String(o.value || '').trim() === String(selectedOption).trim()
      );
      if (matched && matched.price !== undefined && matched.price !== null && !isNaN(parseFloat(matched.price))) {
        return parseFloat(matched.price);
      }
    }
  }

  // Fall back to base product wholesale price
  if (prod.price !== undefined && prod.price !== null && !isNaN(parseFloat(prod.price))) {
    return parseFloat(prod.price);
  }

  // Last resort: estimate from retail price stored in order item
  return orderItem.price ? Math.round(orderItem.price * 0.85) : 0;
}

export default function AnalyticsPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, settingsData] = await Promise.all([
        getOrders({ limit: 9999, status: 'completed' }),
        getProducts(),
        getPricingSettings().catch(err => {
          console.error("Failed to load pricing settings on analytics page", err);
          return null;
        })
      ]);
      setOrders(ordersData?.data || (Array.isArray(ordersData) ? ordersData : []));
      setProducts(productsData);
      if (settingsData) {
        setPricingSettings(settingsData);
      }
    } catch (error) {
      console.error(error);
      showToast?.('Ошибка загрузки данных для аналитики продаж');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Saved markups config for calculating profit/margin on orders
  const markups = useMemo(() => {
    let baseMarkups = { mixes: 15, lumber: 12, tools: 20, paints: 18, hardware: 25 };
    let productOverrides = {};

    if (pricingSettings) {
      if (pricingSettings.markups) baseMarkups = pricingSettings.markups;
      if (pricingSettings.overrides) productOverrides = pricingSettings.overrides;
    } else {
      const saved = localStorage.getItem('tormag_markups');
      const overrides = localStorage.getItem('tormag_product_overrides');
      if (saved) {
        try { baseMarkups = JSON.parse(saved); } catch (e) {}
      }
      if (overrides) {
        try { productOverrides = JSON.parse(overrides); } catch (e) {}
      }
    }

    return { baseMarkups, productOverrides };
  }, [pricingSettings]);

  // Compute analytics metrics strictly for COMPLETED (DELIVERED) orders
  const stats = useMemo(() => {
    let grossRevenue = 0;
    let totalCostPrice = 0;
    let itemsSold = 0;
    let totalDiscountUsed = 0;
    let totalBonusesUsed = 0;
    let totalCashbackEarned = 0;

    let totalLogistics = 0;
    let totalAcquiring = 0;
    let totalCashbackExpense = 0;
    let totalPromoExpense = 0;
    let totalTaxExpense = 0;

    const logisticsPercent = pricingSettings?.logisticsPercent !== undefined ? pricingSettings.logisticsPercent : 5;
    const acquiringPercent = pricingSettings?.acquiringPercent !== undefined ? pricingSettings.acquiringPercent : 2;
    const cashbackPercentSetting = pricingSettings?.cashbackPercent !== undefined ? pricingSettings.cashbackPercent : 3;
    const promoCoveragePercent = pricingSettings?.promoCoveragePercent !== undefined ? pricingSettings.promoCoveragePercent : 30;
    const promoDiscountPercent = pricingSettings?.promoDiscountPercent !== undefined ? pricingSettings.promoDiscountPercent : 10;
    const taxPercent = pricingSettings?.taxPercent !== undefined ? pricingSettings.taxPercent : 3;

    const categorySales = {};
    const supplierSales = {};

    const now = new Date();

    const completedOrders = orders.filter(order => {
      if (order.status !== 'completed') return false;
      const orderDate = getOrderCompletedDate(order);

      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < weekAgo) return false;
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < monthAgo) return false;
      } else if (timeRange === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });

    completedOrders.forEach(order => {
      const items = order.items || [];
      const orderSubtotal = order.subtotalAmount || items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const orderDiscount = order.discountAmount || 0;
      const orderBonuses = order.usedBonusPoints || 0;
      
      totalDiscountUsed += orderDiscount;
      totalBonusesUsed += orderBonuses;

      const discountRatio = orderSubtotal > 0 ? (order.totalAmount / orderSubtotal) : 1;

      items.forEach(item => {
        const qty = item.quantity || 1;
        const prod = item.product || {};
        itemsSold += qty;

        const itemGross = (item.price || prod.price || 0) * qty;
        const itemNetRevenue = Math.round(itemGross * discountRatio);
        grossRevenue += itemNetRevenue;

        const wholesaleUnit = resolveWholesaleCost(item);
          
        const itemCost = wholesaleUnit * qty;
        totalCostPrice += itemCost;

        const itemLogistics = Math.round(itemCost * (logisticsPercent / 100));
        const itemAcquiring = Math.round(itemCost * (acquiringPercent / 100));
        const itemTaxCost = Math.round(itemCost * (taxPercent / 100));

        totalLogistics += itemLogistics;
        totalAcquiring += itemAcquiring;
        totalTaxExpense += itemTaxCost;

        const cashbackRate = prod.cashbackPercent || 3;
        totalCashbackEarned += Math.round(itemNetRevenue * (cashbackRate / 100));

        const cat = prod.category || 'mixes';
        categorySales[cat] = (categorySales[cat] || 0) + itemNetRevenue;

        const supplierName = prod.supplier?.name || 'Официальный склад';
        supplierSales[supplierName] = (supplierSales[supplierName] || 0) + itemNetRevenue;
      });
    });

    totalCashbackExpense = totalCashbackEarned;
    totalPromoExpense = totalDiscountUsed;

    const totalOverheadExpenses = totalLogistics + totalAcquiring + totalTaxExpense;
    const totalBreakEven = totalCostPrice + totalOverheadExpenses;
    const netProfit = grossRevenue - totalBreakEven;
    const avgOrderValue = completedOrders.length > 0 ? Math.round(grossRevenue / completedOrders.length) : 0;
    const avgMarginPercentage = totalBreakEven > 0 ? Math.round((netProfit / totalBreakEven) * 100) : 0;

    const categorySalesList = Object.entries(categorySales).map(([key, value]) => ({
      key,
      name: key === 'mixes' ? 'Сухие смеси' : key === 'lumber' ? 'Пиломатериалы / Утеплители' : key === 'tools' ? 'Инструменты' : key === 'paints' ? 'Краски' : key === 'hardware' ? 'Крепеж' : key,
      value,
      percentage: grossRevenue > 0 ? Math.round((value / grossRevenue) * 100) : 0
    })).sort((a, b) => b.value - a.value);

    const supplierSalesList = Object.entries(supplierSales).map(([name, value]) => ({
      name,
      value,
      percentage: grossRevenue > 0 ? Math.round((value / grossRevenue) * 100) : 0
    })).sort((a, b) => b.value - a.value);

    return {
      completedOrdersCount: completedOrders.length,
      grossRevenue,
      totalCostPrice,
      totalLogistics,
      totalAcquiring,
      totalCashbackExpense,
      totalPromoExpense,
      totalTaxExpense,
      totalOverheadExpenses,
      totalBreakEven,
      netProfit,
      itemsSold,
      avgOrderValue,
      avgMarginPercentage,
      totalDiscountUsed,
      totalBonusesUsed,
      totalCashbackEarned,
      categorySalesList,
      supplierSalesList,
      completedOrders,
      settings: {
        logisticsPercent,
        acquiringPercent,
        cashbackPercentSetting,
        promoCoveragePercent,
        promoDiscountPercent,
        taxPercent
      }
    };
  }, [orders, pricingSettings, markups, timeRange, startDate, endDate]);

  if (loading) {
    return (
      <div className="py-36 flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Загрузка данных аналитики...</p>
      </div>
    );
  }

  const isNegativeProfit = stats.netProfit < 0;

  const periodLabel = timeRange === 'all' 
    ? 'Все время' 
    : timeRange === 'month' 
      ? 'Последний месяц' 
      : timeRange === 'week' 
        ? 'Последняя неделя' 
        : startDate && endDate 
          ? `${new Date(startDate).toLocaleDateString('ru-RU')} — ${new Date(endDate).toLocaleDateString('ru-RU')}` 
          : 'Произвольный период';

  const handleExportExcel = () => {
    const headers = [
      'Номер заказа',
      'Клиент',
      'Телефон',
      'Дата выполнения',
      'Способ оплаты',
      'Сумма до скидок (KZT)',
      'Скидки по промокоду (KZT)',
      'Оплата бонусами (KZT)',
      'Чистая выручка (KZT)',
      'Закуп / Оптовая себестоимость (KZT)',
      'Доставка и Логистика (KZT)',
      'Банковский эквайринг (KZT)',
      'Расход на Кешбэк (KZT)',
      'Бюджет Промо (KZT)',
      'Налоги и сборы (KZT)',
      'Точка безубыточности / Порог 0 (KZT)',
      'Чистая прибыль (KZT)'
    ];

    const { logisticsPercent, acquiringPercent, cashbackPercentSetting, promoCoveragePercent, promoDiscountPercent, taxPercent } = stats.settings;

    const rows = stats.completedOrders.map(order => {
      const subtotal = order.subtotalAmount || (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
      const discount = order.discountAmount || 0;
      const usedBonuses = order.usedBonusPoints || 0;
      const netTotal = order.totalAmount || (subtotal - discount);
      
      let cost = 0;
      let logistics = 0;
      let acquiring = 0;
      let cashbackExp = 0;
      let promoExp = 0;
      let taxExp = 0;

      (order.items || []).forEach(i => {
        const prod = i.product || {};
        const wholesale = resolveWholesaleCost(i);
        
        const qty = i.quantity || 1;
        const itemCost = wholesale * qty;
        cost += itemCost;

        logistics += Math.round(itemCost * (logisticsPercent / 100));
        acquiring += Math.round(itemCost * (acquiringPercent / 100));
        cashbackExp += Math.round(itemCost * (cashbackPercentSetting / 100));
        promoExp += Math.round(itemCost * (promoCoveragePercent / 100) * (promoDiscountPercent / 100));
        taxExp += Math.round(itemCost * (taxPercent / 100));
      });

      const breakEven = cost + logistics + acquiring + cashbackExp + promoExp + taxExp;
      const profit = netTotal - breakEven;
      const completedDate = getOrderCompletedDate(order);

      return [
        `№${order.id}`,
        order.clientName || 'Покупатель',
        order.clientPhone || '—',
        completedDate.toLocaleDateString('ru-RU'),
        order.paymentMethod === 'cash' ? 'Наличные' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'Счет на оплату',
        subtotal,
        discount,
        usedBonuses,
        netTotal,
        cost,
        logistics,
        acquiring,
        cashbackExp,
        promoExp,
        taxExp,
        breakEven,
        profit
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `финансовый_отчет_tormag_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Финансовый отчет успешно сформирован и скачан');
  };

  // Overhead cost items as array for rendering
  const overheadItems = [
    { icon: Truck,       label: 'Доставка и Склад',   value: stats.totalLogistics,        percent: stats.settings.logisticsPercent,                                       desc: 'Логистика, хранение, упаковка' },
    { icon: CreditCard,  label: 'Эквайринг банка',     value: stats.totalAcquiring,         percent: stats.settings.acquiringPercent,                                       desc: 'Комиссия банку за прием платежей' },
    { icon: Gift,        label: 'Кешбэк клиентам',     value: stats.totalCashbackExpense,   percent: stats.settings.cashbackPercentSetting,                                desc: 'Бюджет программы лояльности' },
    { icon: Tag,         label: 'Промо-акции',          value: stats.totalPromoExpense,      percent: `${stats.settings.promoCoveragePercent}x${stats.settings.promoDiscountPercent}`, desc: 'Резерв скидок по промокодам' },
    { icon: Landmark,    label: 'Налоги и сборы',       value: stats.totalTaxExpense,        percent: stats.settings.taxPercent,                                            desc: 'Налог на продажи / оборот' },
  ];

  return (
    <div className="pb-12 text-left">
      
      {/* ═══════════════════════════ HEADER BAR ═══════════════════════════ */}
      <div className="mb-6">
        {/* Top row: Title + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-outfit">Аналитика и Отчетность</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Финансовый анализ по доставленным заказам · {periodLabel} · {stats.completedOrdersCount} сделок
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Export */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer border-0 h-[34px] shrink-0"
              title="Выгрузить финансовый отчет доставленных заказов в Excel"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Выгрузить в Excel
            </button>

            {/* Period selector */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 shadow-sm h-[34px] items-center">
              {['all', 'month', 'week', 'custom'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer h-full ${
                    timeRange === range 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200/30'
                  }`}
                >
                  {range === 'all' ? 'Все время' : range === 'month' ? 'Месяц' : range === 'week' ? 'Неделя' : 'Период'}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {timeRange === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold h-[34px] animate-fade-in shrink-0">
                <span className="text-slate-400 font-bold text-[10px] pl-1.5">С</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold h-[26px]"
                />
                <span className="text-slate-400 font-bold text-[10px]">ПО</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold h-[26px] mr-0.5"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex border border-slate-200/65 bg-slate-100/70 p-0.5 rounded-xl w-fit gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200/40'
            }`}
          >
            Обзор аналитики
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-200/40'
            }`}
          >
            Реестр сделок (История продаж)
          </button>
        </div>
      </div>

      {/* ═══════════════════════════ TAB: OVERVIEW ═══════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* ────── PRIMARY KPI ROW ────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Left: Revenue / Cost / Profit — 3 large cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Gross Revenue */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Валовый оборот</span>
                  <div className="bg-slate-50 text-slate-600 p-1.5 rounded-lg border border-slate-200/60">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">{formatPrice(stats.grossRevenue)}</h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Чистая выручка после скидок</span>
              </div>

              {/* Total Cost */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Себестоимость</span>
                  <div className="bg-slate-50 text-slate-600 p-1.5 rounded-lg border border-slate-200/60">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">{formatPrice(stats.totalCostPrice)}</h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Оптовый закуп товара</span>
              </div>

              {/* Net Profit */}
              <div className={`border rounded-2xl p-5 shadow-sm ${
                isNegativeProfit 
                  ? 'bg-rose-50/40 border-rose-200/70' 
                  : 'bg-emerald-50/30 border-emerald-200/60'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Чистая прибыль</span>
                  <div className={`p-1.5 rounded-lg border ${
                    isNegativeProfit 
                      ? 'bg-rose-100 text-rose-700 border-rose-200' 
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className={`text-2xl font-black font-outfit tracking-tight ${
                  isNegativeProfit ? 'text-rose-700' : 'text-emerald-700'
                }`}>{formatPrice(stats.netProfit)}</h3>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                  Маржа: {stats.avgMarginPercentage}%
                </span>
              </div>
            </div>

            {/* Right: Secondary metrics — stacked compact */}
            <div className="lg:col-span-4 grid grid-cols-1 gap-3">
              
              {/* Break-even */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-slate-50 text-slate-500 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                    <Target className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Порог 0 (Безубыток)</span>
                    <span className="text-[10px] text-slate-400 font-medium">Закуп + Расходы</span>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 font-outfit shrink-0">{formatPrice(stats.totalBreakEven)}</span>
              </div>

              {/* Overhead total */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-slate-50 text-slate-500 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Накладные расходы</span>
                    <span className="text-[10px] text-slate-400 font-medium">5 статей затрат</span>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 font-outfit shrink-0">{formatPrice(stats.totalOverheadExpenses)}</span>
              </div>

              {/* AOV */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-slate-50 text-slate-500 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Средний чек</span>
                    <span className="text-[10px] text-slate-400 font-medium">Продано: {stats.itemsSold} шт.</span>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 font-outfit shrink-0">{formatPrice(stats.avgOrderValue)}</span>
              </div>
            </div>
          </div>

          {/* ────── OVERHEAD BREAKDOWN — compact table inside card ────── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-outfit">Структура накладных расходов</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Детализация 5 статей расходов из модуля ценообразования</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg font-outfit shrink-0">
                Итого: {formatPrice(stats.totalOverheadExpenses)}
              </span>
            </div>

            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100">
                {overheadItems.map((item, idx) => {
                  const Icon = item.icon;
                  const share = stats.totalOverheadExpenses > 0 ? Math.round((item.value / stats.totalOverheadExpenses) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 w-[40%]">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-slate-50 text-slate-500 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.percent}%</span>
                      </td>
                      <td className="py-3 px-3 w-[25%]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-800 rounded-full transition-all" 
                              style={{ width: `${Math.max(2, share)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{share}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="text-sm font-black text-slate-900 font-outfit">{formatPrice(item.value)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ────── BOTTOM: Categories + Suppliers ────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Category distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="bg-slate-50 text-slate-600 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                  <PieChart className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-outfit">Продажи по категориям</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Доля выручки в разрезе товарных групп</p>
                </div>
              </div>

              <div className="p-5 space-y-3.5">
                {stats.categorySalesList.length > 0 ? (
                  stats.categorySalesList.map(item => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ChevronRight className="h-3 w-3 text-slate-300" />
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 font-outfit">
                          <span className="text-xs font-extrabold text-slate-900">{formatPrice(item.value)}</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 py-0.5 px-1.5 rounded">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                          className="h-full bg-slate-900 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">Нет данных за выбранный период</p>
                )}
              </div>
            </div>

            {/* Suppliers leaderboard */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                <div className="bg-slate-50 text-slate-600 p-1.5 rounded-lg border border-slate-200/60 shrink-0">
                  <Award className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-outfit">Закупки у дистрибьюторов</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Рейтинг поставщиков по объему закупа</p>
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                {stats.supplierSalesList.length > 0 ? (
                  stats.supplierSalesList.map((sup, idx) => (
                    <div key={sup.name} className="flex items-center justify-between py-2.5 px-3 bg-slate-50/60 rounded-xl border border-slate-100/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-bold text-xs text-slate-900 truncate max-w-[150px] sm:max-w-[220px]" title={sup.name}>
                            {sup.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-slate-400 shrink-0" />
                            Доля: {sup.percentage}%
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-slate-900 font-outfit shrink-0 ml-2">{formatPrice(sup.value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">Нет данных за выбранный период</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════ TAB: HISTORY ═══════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-outfit">Реестр исполненных сделок</h4>
              <p className="text-[10px] text-slate-400 font-medium">История доставленных заказов</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">{periodLabel}</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1 px-3 rounded-lg">
                {stats.completedOrders.length} сделок
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Номер</th>
                  <th className="py-3 px-5">Клиент</th>
                  <th className="py-3 px-5">Дата</th>
                  <th className="py-3 px-5 text-right">Себестоимость</th>
                  <th className="py-3 px-5 text-right">Выручка</th>
                  <th className="py-3 px-5 text-right">Маржа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {stats.completedOrders.length > 0 ? (
                  stats.completedOrders.map(order => {
                    const gross = order.totalAmount || order.subtotalAmount || 0;
                    const { logisticsPercent, acquiringPercent, cashbackPercentSetting, promoCoveragePercent, promoDiscountPercent, taxPercent } = stats.settings;
                    
                    let cost = 0;
                    let overheads = 0;

                    (order.items || []).forEach(i => {
                      const wholesale = resolveWholesaleCost(i);
                      const qty = i.quantity || 1;
                      const itemCost = wholesale * qty;
                      cost += itemCost;

                      overheads += Math.round(itemCost * (logisticsPercent / 100))
                        + Math.round(itemCost * (acquiringPercent / 100))
                        + Math.round(itemCost * (taxPercent / 100));
                    });

                    const breakEven = cost + overheads;
                    const margin = gross - breakEven;
                    const isMarginNegative = margin < 0;
                    const completedDate = getOrderCompletedDate(order);
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-5">
                          <span className="font-bold text-slate-900 font-outfit">№{String(order.id).slice(0, 8)}</span>
                        </td>
                        <td className="py-3 px-5 text-slate-700 font-bold">
                          {order.clientName || 'Покупатель'}
                          {order.clientPhone && (
                            <span className="block text-[10px] text-slate-400 font-normal">{order.clientPhone}</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {completedDate.toLocaleDateString('ru-RU')}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-700 font-outfit">
                          <div>{formatPrice(cost)}</div>
                          <div className="text-[9px] text-slate-400 font-normal">+{formatPrice(overheads)} расходы</div>
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-slate-900 font-outfit">
                          <div>{formatPrice(gross)}</div>
                          <div className="text-[9px] text-slate-400 font-normal">Порог 0: {formatPrice(breakEven)}</div>
                        </td>
                        <td className={`py-3 px-5 text-right font-bold font-outfit ${
                          isMarginNegative ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {formatPrice(margin)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      За выбранный период доставленных заказов не найдено.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
