import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, DollarSign, TrendingUp, SlidersHorizontal, Info,
  RefreshCw, Save, Percent, Star,
  Search as SearchIcon, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { getProductsPaged, getPricingSettings, savePricingSettings, getCategories } from '../../../services/api';

const formatPrice = (price) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);

const CATEGORIES_INFO = {
  mixes:    { name: 'Сухие смеси',               defaultMarkup: 15 },
  lumber:   { name: 'Пиломатериалы & Утеплители', defaultMarkup: 12 },
  tools:    { name: 'Инструменты',                defaultMarkup: 20 },
  paints:   { name: 'Краски',                     defaultMarkup: 18 },
  hardware: { name: 'Крепеж',                     defaultMarkup: 25 },
};

const PAGE_SIZE = 50;

export default function PricingPage({ showToast }) {
  /* ─── Server-side pagination state ─────────────────────────────── */
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [dataLoading, setDataLoading] = useState(true);

  const searchTimer = useRef(null);

  /* ─── Category markups ──────────────────────────────────────────── */
  const DEFAULT_MARKUPS = { mixes: 15, lumber: 12, tools: 20, paints: 18, hardware: 25 };
  const [markups, setMarkups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tormag_markups'));
      return saved || DEFAULT_MARKUPS;
    } catch {
      return DEFAULT_MARKUPS;
    }
  });

  const [pendingMarkups, setPendingMarkups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tormag_markups'));
      return saved || DEFAULT_MARKUPS;
    } catch {
      return DEFAULT_MARKUPS;
    }
  });
  const markupTimer = useRef(null);

  /* ─── Individual overrides ──────────────────────────────────────── */
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tormag_product_overrides') || '{}'); } catch { return {}; }
  });

  /* ─── Cost Structure Global Settings ────────────────────────────── */
  const [logisticsPercent, setLogisticsPercent] = useState(5);
  const [acquiringPercent, setAcquiringPercent] = useState(2);
  const [cashbackPercent, setCashbackPercent] = useState(3);
  const [promoCoveragePercent, setPromoCoveragePercent] = useState(30);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(10);
  const [taxPercent, setTaxPercent] = useState(0);

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  /* ─── Database Categories & Expanded state ──────────────────────── */
  const [dbCategories, setDbCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    getCategories()
      .then((cats) => setDbCategories(cats || []))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  /* ─── Load server-side pricing settings once ────────────────────── */
  useEffect(() => {
    getPricingSettings()
      .then((s) => {
        if (s?.markups)   { setMarkups(s.markups);   setPendingMarkups(s.markups); }
        if (s?.overrides) setOverrides(s.overrides);
        if (s?.logisticsPercent !== undefined) setLogisticsPercent(s.logisticsPercent);
        if (s?.acquiringPercent !== undefined) setAcquiringPercent(s.acquiringPercent);
        if (s?.cashbackPercent !== undefined) setCashbackPercent(s.cashbackPercent);
        if (s?.promoCoveragePercent !== undefined) setPromoCoveragePercent(s.promoCoveragePercent);
        if (s?.promoDiscountPercent !== undefined) setPromoDiscountPercent(s.promoDiscountPercent);
        if (s?.taxPercent !== undefined) setTaxPercent(s.taxPercent);
      })
      .catch(() => {/* use local fallback */});
  }, []);

  /* ─── Fetch paginated products ───────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    setDataLoading(true);
    try {
      const result = await getProductsPaged({ page, limit: PAGE_SIZE, search: debouncedSearch });
      setProducts(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast?.('⚠️ Ошибка загрузки товаров');
    } finally {
      setDataLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ─── Debounce search input ─────────────────────────────────────── */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  /* ─── Slider: debounce writes, immediate visual feedback ────────── */
  const handleMarkupChange = (catKey, val) => {
    const num = parseInt(val) || 0;
    setPendingMarkups((prev) => ({ ...prev, [catKey]: num }));
    clearTimeout(markupTimer.current);
    markupTimer.current = setTimeout(() => {
      setMarkups((prev) => ({ ...prev, [catKey]: num }));
    }, 300);
  };

  const handleCategoryMarkupChange = (catKey, val) => {
    const num = parseInt(val) || 0;
    setPendingMarkups((prev) => ({ ...prev, [catKey]: num }));
    clearTimeout(markupTimer.current);
    markupTimer.current = setTimeout(() => {
      setMarkups((prev) => ({ ...prev, [catKey]: num }));
    }, 300);
  };

  const handleCategoryMarkupReset = (catKey) => {
    setPendingMarkups((prev) => {
      const next = { ...prev };
      delete next[catKey];
      return next;
    });
    setMarkups((prev) => {
      const next = { ...prev };
      delete next[catKey];
      return next;
    });
  };

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getPendingMarkupForCategory = useCallback((cat) => {
    let current = cat;
    while (current) {
      if (pendingMarkups[current.id] !== undefined) {
        return { value: pendingMarkups[current.id], isInherited: current.id !== cat.id, inheritedFrom: current.name };
      }
      if (pendingMarkups[current.slug] !== undefined) {
        return { value: pendingMarkups[current.slug], isInherited: current.slug !== cat.slug, inheritedFrom: current.name };
      }
      current = current.parentId ? dbCategories.find(x => x.id === current.parentId) : null;
    }
    return { value: 15, isInherited: true, inheritedFrom: 'По умолчанию' };
  }, [dbCategories, pendingMarkups]);

  const renderCategorySlider = (cat) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = !!expandedCategories[cat.id];
    const { value, isInherited, inheritedFrom } = getPendingMarkupForCategory(cat);

    return (
      <div key={cat.id} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm text-left">
        <div className="flex items-center justify-between text-xs font-black text-slate-700">
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren && (
              <button
                onClick={() => toggleCategoryExpand(cat.id)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-all border-0 bg-transparent text-slate-500 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <span className="truncate" title={cat.name}>{cat.name}</span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {isInherited ? (
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 py-0.5 px-2 rounded-md uppercase tracking-wide">
                наследует
              </span>
            ) : (
              cat.parentId && (
                <button
                  onClick={() => handleCategoryMarkupReset(cat.id)}
                  className="text-[9px] font-black text-red-505 hover:underline cursor-pointer border-0 bg-transparent"
                  title="Сбросить к наследованию"
                >
                  сбросить
                </button>
              )
            )}
            <span className={`font-extrabold text-xs py-0.5 px-2 rounded-md border shrink-0 ${
              isInherited
                ? 'text-slate-500 bg-slate-50 border-slate-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-250'
            }`}>
              +{value}%
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0" max="100" step="1"
          value={value}
          onChange={(e) => handleCategoryMarkupChange(cat.id, e.target.value)}
          className={`custom-slider focus:outline-none ${isInherited ? 'opacity-50 hover:opacity-80 transition-opacity' : 'slider-emerald'}`}
        />

        {/* Render child categories */}
        {hasChildren && isExpanded && (
          <div className="pl-4 border-l-2 border-slate-100 space-y-3 mt-3">
            {cat.children.map(child => {
              const fullChild = dbCategories.find(x => x.id === child.id) || child;
              const childInfo = getPendingMarkupForCategory(fullChild);
              return (
                <div key={fullChild.id} className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="truncate" title={fullChild.name}>{fullChild.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {childInfo.isInherited ? (
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">наследует</span>
                      ) : (
                        <button
                          onClick={() => handleCategoryMarkupReset(fullChild.id)}
                          className="text-[8px] font-black text-red-500 hover:underline cursor-pointer border-0 bg-transparent"
                          title="Сбросить к наследованию"
                        >
                          наследование
                        </button>
                      )}
                      <span className={`font-extrabold text-[11px] py-0.5 px-1.5 rounded-md border shrink-0 ${
                        childInfo.isInherited
                          ? 'text-slate-500 bg-slate-50 border-slate-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        +{childInfo.value}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0" max="100" step="1"
                    value={childInfo.value}
                    onChange={(e) => handleCategoryMarkupChange(fullChild.id, e.target.value)}
                    className={`custom-slider focus:outline-none ${childInfo.isInherited ? 'opacity-40 hover:opacity-75 transition-opacity' : 'slider-emerald'}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ─── Individual product override ───────────────────────────────── */
  const handleProductOverrideChange = (productId, val) => {
    const parsed = val === '' ? '' : parseInt(val) || 0;
    setOverrides((prev) => {
      const next = { ...prev };
      if (parsed === '') delete next[productId];
      else next[productId] = Math.max(0, Math.min(100, parsed));
      return next;
    });
  };

  /* ─── Save ───────────────────────────────────────────────────────── */
  const handleSaveAllPricing = async () => {
    setSettingsLoading(true);
    try {
      await savePricingSettings({
        markups,
        overrides,
        logisticsPercent,
        acquiringPercent,
        cashbackPercent,
        promoCoveragePercent,
        promoDiscountPercent,
        taxPercent
      });
      localStorage.setItem('tormag_markups', JSON.stringify(markups));
      localStorage.setItem('tormag_product_overrides', JSON.stringify(overrides));
      showToast?.('💾 Наценки успешно сохранены!');
    } catch {
      showToast?.('⚠️ Не удалось сохранить наценки');
    } finally {
      setSettingsLoading(false);
    }
  };

  const resolveCategoryMarkup = useCallback((p) => {
    let cat = dbCategories.find(c => c.id === p.categoryId) || dbCategories.find(c => c.slug === p.category);
    while (cat) {
      if (markups[cat.id] !== undefined) {
        return markups[cat.id];
      }
      if (markups[cat.slug] !== undefined) {
        return markups[cat.slug];
      }
      cat = cat.parentId ? dbCategories.find(c => c.id === cat.parentId) : null;
    }
    return 15; // default markup
  }, [dbCategories, markups]);

  /* ─── Compute per-row prices for the current page only ─────────── */
  const rows = useMemo(() =>
    products.map((p) => {
      const categoryMarkup = resolveCategoryMarkup(p);
      const activeMarkup   = overrides[p.id] !== undefined ? overrides[p.id] : categoryMarkup;
      const wholesale      = p.wholesalePrice ?? p.price;
      
      const logisticsAmount = wholesale * (logisticsPercent / 100);
      const acquiringAmount = wholesale * (acquiringPercent / 100);
      const cashbackAmount  = wholesale * (cashbackPercent / 100);
      const promoAmount     = wholesale * (promoCoveragePercent / 100) * (promoDiscountPercent / 100);
      const taxAmount       = wholesale * (taxPercent / 100);
      
      const breakEven       = wholesale + logisticsAmount + acquiringAmount + cashbackAmount + promoAmount + taxAmount;
      const profitAmount    = breakEven * (activeMarkup / 100);
      const retailPrice     = breakEven + profitAmount;
      
      return {
        ...p,
        wholesalePrice: wholesale,
        markupPercentage: activeMarkup,
        isOverridden: overrides[p.id] !== undefined,
        logisticsAmount,
        acquiringAmount,
        cashbackAmount,
        promoAmount,
        taxAmount,
        breakEven,
        profitAmount,
        markupValue: Math.round(profitAmount),
        retailPrice: Math.round(retailPrice)
      };
    }),
  [products, markups, overrides, logisticsPercent, acquiringPercent, cashbackPercent, promoCoveragePercent, promoDiscountPercent, taxPercent, dbCategories, resolveCategoryMarkup]);

  /* ─── Page-level summary (current page only) ───────────────────── */
  const pageSummary = useMemo(() => {
    const totalCost   = rows.reduce((s, r) => s + r.wholesalePrice, 0);
    const totalRetail = rows.reduce((s, r) => s + r.retailPrice,    0);
    const netProfit   = rows.reduce((s, r) => s + r.profitAmount,   0);
    const avgMargin   = totalCost > 0 ? Math.round((netProfit / totalCost) * 100) : 0;
    const topProfitable = [...rows].sort((a, b) => b.profitAmount - a.profitAmount).slice(0, 3);
    return { totalCost, totalRetail, netProfit, avgMargin, topProfitable };
  }, [rows]);

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-900 font-outfit">Ценообразование и Маржинальность</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Управляйте наценками на товары дистрибьюторов в реальном времени.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCostModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0 font-sans"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            Накладные расходы
          </button>
          <button
            onClick={handleSaveAllPricing}
            disabled={settingsLoading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-950 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer border-0 disabled:opacity-60"
          >
            {settingsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            Сохранить реестр цен
          </button>
        </div>
      </div>



      {/* ─── Main 2-col layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left: Category sliders */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-3xl p-6 space-y-6 text-left">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <SlidersHorizontal className="h-5 w-5 text-emerald-650" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Желаемая прибыль по категориям (%)</span>
          </div>

          <div className="space-y-5">
            {dbCategories.length === 0 ? (
              Object.entries(CATEGORIES_INFO).map(([key, info]) => (
                <div key={key} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700">
                    <span className="truncate">{info.name}</span>
                    <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 border border-emerald-250 py-0.5 px-2 rounded-md shrink-0">
                      +{pendingMarkups[key] !== undefined ? pendingMarkups[key] : info.defaultMarkup}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0" max="100" step="1"
                    value={pendingMarkups[key] !== undefined ? pendingMarkups[key] : info.defaultMarkup}
                    onChange={(e) => handleCategoryMarkupChange(key, e.target.value)}
                    className="custom-slider slider-emerald focus:outline-none"
                  />
                </div>
              ))
            ) : (
              dbCategories.filter(c => !c.parentId).map(cat => renderCategorySlider(cat))
            )}
          </div>

          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed font-medium">
            <Info className="h-4 w-4 text-emerald-600 inline-block mr-1.5 -mt-0.5 shrink-0" />
            Указанный процент прибыли прибавляется к <b>точке безубыточности</b> товара из этой категории.
          </div>
        </div>

        {/* Right: paginated product table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
          {/* Table header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Каталог товаров (Индивидуальные маржи)</span>
              <span className="text-[10px] text-slate-400 block font-semibold">Настройте процент прибыли для конкретных позиций индивидуально</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-8 pr-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-40 transition-all"
                />
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-full shrink-0">
                {total.toLocaleString('ru-RU')} позиций
              </span>
            </div>
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            {dataLoading && products.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Загрузка...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5">Товар и Категория</th>
                    <th className="py-4 px-5">Дистрибьютор</th>
                    <th className="py-4 px-5 text-right">Себестоимость (₸)</th>
                    <th className="py-4 px-5 text-center">Прибыль (%)</th>
                    <th className="py-4 px-5 text-right">Итоговая розница (₸)</th>
                    <th className="py-4 px-5 text-right text-emerald-700">Чистая прибыль (₸)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 text-xs font-semibold text-slate-700 transition-opacity ${dataLoading ? 'opacity-50' : ''}`}>
                  {rows.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.isOverridden ? 'bg-emerald-50/10' : ''}`}>
                      <td className="py-4 px-5">
                        <div className="space-y-0.5 max-w-[200px] sm:max-w-xs text-left">
                          <span className="font-black text-slate-900 block truncate">{p.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-400">
                            <span className="uppercase font-black text-slate-450">
                              {(() => {
                                const cat = dbCategories.find(c => c.id === p.categoryId) || dbCategories.find(c => c.slug === p.category);
                                return cat ? cat.name : (CATEGORIES_INFO[p.category]?.name || p.category);
                              })()}
                            </span>
                            <span>•</span>
                            <span>ID: {p.id}</span>
                            {p.article && (
                              <>
                                <span>•</span>
                                <span>Арт: {p.article}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">{p.supplier?.name || 'Дистрибьютор'}</td>
                      <td className="py-4 px-5 text-right font-bold text-slate-800">
                        <div>{formatPrice(p.wholesalePrice)}</div>
                        <div className="has-tooltip inline-block text-[9px] text-slate-450 font-normal underline decoration-dotted cursor-help">
                          +{formatPrice(p.breakEven - p.wholesalePrice)} расходы
                          
                          <div className="tooltip-box text-xs font-semibold space-y-1.5 shadow-xl">
                            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-700 pb-1 mb-1 font-outfit">Детали накладных расходов:</div>
                            <div className="flex justify-between gap-4 font-sans text-[11px]">
                              <span>🚚 Доставка ({logisticsPercent}%):</span>
                              <span className="font-bold text-white">{formatPrice(p.logisticsAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4 font-sans text-[11px]">
                              <span>💳 Эквайринг ({acquiringPercent}%):</span>
                              <span className="font-bold text-white">{formatPrice(p.acquiringAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4 font-sans text-[11px]">
                              <span>🎁 Кешбек ({cashbackPercent}%):</span>
                              <span className="font-bold text-white">{formatPrice(p.cashbackAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4 font-sans text-[11px]">
                              <span>🏷️ Промо ({promoCoveragePercent}%×{promoDiscountPercent}%):</span>
                              <span className="font-bold text-white">{formatPrice(p.promoAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-4 font-sans text-[11px]">
                              <span>🏛️ Налоги ({taxPercent}%):</span>
                              <span className="font-bold text-white">{formatPrice(p.taxAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-slate-450 text-[10px] font-bold">%</span>
                          <input
                            type="number" min="0" max="100"
                            value={p.markupPercentage}
                            onChange={(e) => handleProductOverrideChange(p.id, e.target.value)}
                            className={`w-14 text-center px-1.5 py-1 text-xs font-black rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              p.isOverridden
                                ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          />
                          {p.isOverridden && (
                            <button
                              onClick={() => handleProductOverrideChange(p.id, '')}
                              className="text-[9px] font-black text-red-500 hover:underline cursor-pointer border-0 bg-transparent"
                              title="Сбросить к наценке категории"
                            >
                              сброс
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-black text-slate-900">
                        <div>{formatPrice(p.retailPrice)}</div>
                        <div className="text-[9px] text-slate-400 font-normal">Порог 0: {formatPrice(p.breakEven)}</div>
                      </td>
                      <td className="py-4 px-5 text-right font-black text-emerald-700">
                        <div>{formatPrice(p.markupValue)}</div>
                        <div className="text-[9px] text-emerald-600 font-normal">Наценка: {p.markupPercentage}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination inside table card */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">
                Стр. <b className="text-slate-800">{page}</b> / <b className="text-slate-800">{totalPages}</b>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || dataLoading}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pn = start + i;
                  return (
                    <button
                      key={pn}
                      onClick={() => setPage(pn)}
                      disabled={dataLoading}
                      className={`w-7 h-7 text-[10px] font-bold rounded-lg transition-all ${
                        pn === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pn}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || dataLoading}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Top Profitable (current page) ─────────      {/* ─── Cost Structure Modal ─────────────────────────────────────── */}
      {isCostModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCostModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-slate-850" />
                <h3 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-wider">Настройка структуры затрат</h3>
              </div>
              <button 
                onClick={() => setIsCostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all border-0 cursor-pointer font-sans"
              >
                ✕ Закрыть
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Left column: Sliders */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-[11px] text-slate-600 leading-relaxed font-semibold flex items-start gap-2.5">
                    <Info className="h-4.5 w-4.5 text-slate-550 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-slate-900 uppercase block mb-0.5">Методология ценообразования:</span>
                      Розничная цена рассчитывается снизу вверх. Сначала суммируется базовая закупка и расходы (доставка, эквайринг, кешбек и скидки по акциям), формируя <b>точку безубыточности (порог 0)</b>. Затем на эту точку накладывается процент желаемой прибыли.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logistics */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between text-xs font-black text-slate-700 font-sans">
                        <span>1. Логистика / Доставка</span>
                        <span className="text-slate-900 font-extrabold">{logisticsPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="20" step="0.5"
                        value={logisticsPercent}
                        onChange={(e) => setLogisticsPercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block">Доставка, хранение, упаковка</span>
                    </div>

                    {/* Acquiring */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between text-xs font-black text-slate-700 font-sans">
                        <span>2. Эквайринг и Платформа</span>
                        <span className="text-slate-900 font-extrabold">{acquiringPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="10" step="0.1"
                        value={acquiringPercent}
                        onChange={(e) => setAcquiringPercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block font-sans">Комиссия банка/платежной системы</span>
                    </div>

                    {/* Cashback */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                      <div className="flex justify-between text-xs font-black text-slate-700 font-sans">
                        <span>3. Кешбек клиенту</span>
                        <span className="text-slate-900 font-extrabold">{cashbackPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="15" step="0.5"
                        value={cashbackPercent}
                        onChange={(e) => setCashbackPercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block font-sans">Программа лояльности (расход площадки)</span>
                    </div>

                    {/* Promo setup */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-3 sm:col-span-1 font-sans">
                      <div className="flex justify-between text-xs font-black text-slate-700">
                        <span>4. Охват промо-акций</span>
                        <span className="text-slate-900 font-extrabold">{promoCoveragePercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" step="5"
                        value={promoCoveragePercent}
                        onChange={(e) => setPromoCoveragePercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block">Какая часть заказов использует скидки</span>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-3 sm:col-span-1">
                      <div className="flex justify-between text-xs font-black text-slate-700 font-sans">
                        <span>5. Скидка по промокодам</span>
                        <span className="text-slate-900 font-extrabold">{promoDiscountPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="50" step="1"
                        value={promoDiscountPercent}
                        onChange={(e) => setPromoDiscountPercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block">Размер скидки при активации промокода</span>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-3 sm:col-span-2">
                      <div className="flex justify-between text-xs font-black text-slate-700 font-sans">
                        <span>6. Налоги и сборы (ИП, НДС, др.)</span>
                        <span className="text-slate-900 font-extrabold">{taxPercent}%</span>
                      </div>
                      <input
                        type="range" min="0" max="20" step="0.5"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                        className="custom-slider focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block">Суммарный налог на продажу или оборот</span>
                    </div>
                  </div>
                </div>

                {/* Right column: Interactive receipt preview */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-inner border border-slate-800 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-outfit">Пример расчета для товара за 1 000 ₸</span>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Базовая закупка</span>
                      <span className="font-bold">1 000 ₸</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>+ Доставка ({logisticsPercent}%)</span>
                      <span>+{Math.round(1000 * (logisticsPercent / 100))} ₸</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>+ Эквайринг ({acquiringPercent}%)</span>
                      <span>+{Math.round(1000 * (acquiringPercent / 100))} ₸</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>+ Кешбек клиенту ({cashbackPercent}%)</span>
                      <span>+{Math.round(1000 * (cashbackPercent / 100))} ₸</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-450">
                      <span>+ Промо (охват × скидка)</span>
                      <span>+{Math.round(1000 * (promoCoveragePercent / 100) * (promoDiscountPercent / 100))} ₸</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-450 border-b border-slate-850 pb-2">
                      <span>+ Налоги ({taxPercent}%)</span>
                      <span>+{Math.round(1000 * (taxPercent / 100))} ₸</span>
                    </div>

                    {/* Break-even calculation */}
                    {(() => {
                      const sampleCost = 1000;
                      const logisticsVal = sampleCost * (logisticsPercent / 100);
                      const acquiringVal = sampleCost * (acquiringPercent / 100);
                      const cashbackVal = sampleCost * (cashbackPercent / 100);
                      const promoVal = sampleCost * (promoCoveragePercent / 100) * (promoDiscountPercent / 100);
                      const taxVal = sampleCost * (taxPercent / 100);
                      const breakEven = sampleCost + logisticsVal + acquiringVal + cashbackVal + promoVal + taxVal;
                      
                      // Use a default active markup of 15% for the preview example
                      const activeMarkup = 15;
                      const profitVal = breakEven * (activeMarkup / 100);
                      const retailPrice = breakEven + profitVal;

                      return (
                        <>
                          <div className="flex justify-between items-center text-amber-400 font-bold py-1">
                            <span className="uppercase tracking-wider">Точка безубыточности:</span>
                            <span>{formatPrice(breakEven)}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-450 border-b border-slate-850 pb-2 font-sans">
                            <span>+ Ваша прибыль ({activeMarkup}%)</span>
                            <span>+{Math.round(profitVal)} ₸</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 text-lg font-black pt-2">
                            <span className="font-outfit uppercase tracking-wider">Розничная цена:</span>
                            <span className="font-outfit flex items-center gap-1.5 font-sans">
                              {formatPrice(retailPrice)}
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black font-sans">✓</span>
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button
                onClick={() => setIsCostModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-755 text-xs font-black uppercase tracking-widest rounded-xl transition-all border-0 cursor-pointer font-sans"
              >
                Применить
              </button>
              <button
                onClick={() => {
                  handleSaveAllPricing();
                  setIsCostModalOpen(false);
                }}
                disabled={settingsLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md border-0 cursor-pointer font-sans"
              >
                {settingsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить настройки
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
