import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Sparkles, DollarSign, TrendingUp, SlidersHorizontal, Info,
  RefreshCw, Save, Percent, Star,
  Search as SearchIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getProductsPaged, getPricingSettings, savePricingSettings } from '../../../services/api';

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


  const [settingsLoading, setSettingsLoading] = useState(false);

  /* ─── Load server-side pricing settings once ────────────────────── */
  useEffect(() => {
    getPricingSettings()
      .then((s) => {
        if (s?.markups)   { setMarkups(s.markups);   setPendingMarkups(s.markups); }
        if (s?.overrides) setOverrides(s.overrides);
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
      await savePricingSettings({ markups, overrides });
      localStorage.setItem('tormag_markups', JSON.stringify(markups));
      localStorage.setItem('tormag_product_overrides', JSON.stringify(overrides));
      showToast?.('💾 Наценки успешно сохранены!');
    } catch {
      showToast?.('⚠️ Не удалось сохранить наценки');
    } finally {
      setSettingsLoading(false);
    }
  };

  /* ─── Compute per-row prices for the current page only ─────────── */
  const rows = useMemo(() =>
    products.map((p) => {
      const categoryMarkup = markups[p.category] ?? 15;
      const activeMarkup   = overrides[p.id] !== undefined ? overrides[p.id] : categoryMarkup;
      const wholesale      = p.wholesalePrice ?? p.price;
      const markupValue    = wholesale * (activeMarkup / 100);
      const retailPrice    = wholesale + markupValue;
      return { ...p, wholesalePrice: wholesale, markupPercentage: activeMarkup, isOverridden: overrides[p.id] !== undefined, markupValue, retailPrice };
    }),
  [products, markups, overrides]);

  /* ─── Page-level summary (current page only) ───────────────────── */
  const pageSummary = useMemo(() => {
    const totalCost   = rows.reduce((s, r) => s + r.wholesalePrice, 0);
    const totalRetail = rows.reduce((s, r) => s + r.retailPrice,    0);
    const netProfit   = totalRetail - totalCost;
    const avgMargin   = totalCost > 0 ? Math.round((netProfit / totalCost) * 100) : 0;
    const topProfitable = [...rows].sort((a, b) => b.markupValue - a.markupValue).slice(0, 3);
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
        <button
          onClick={handleSaveAllPricing}
          disabled={settingsLoading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-950 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer border-0 disabled:opacity-60"
        >
          {settingsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
          Сохранить реестр цен
        </button>
      </div>

      {/* ─── Summary Cards (current page) ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Себестоимость (текущая стр.)</span>
            <h4 className="text-2xl font-black text-slate-900 font-outfit">{formatPrice(pageSummary.totalCost)}</h4>
            <span className="text-[9px] text-slate-500 font-bold block">Wholesale Cost — Page {page}</span>
          </div>
          <div className="bg-slate-100 text-slate-700 p-3 rounded-2xl"><DollarSign className="h-6 w-6" /></div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Выручка (текущая стр.)</span>
            <h4 className="text-2xl font-black text-emerald-700 font-outfit">{formatPrice(pageSummary.totalRetail)}</h4>
            <span className="text-[9px] text-emerald-600 font-bold block">Estimated Gross Revenue</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl"><TrendingUp className="h-6 w-6" /></div>
        </div>

        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Чистая маржа (текущая стр.)</span>
            <h4 className="text-2xl font-black text-white font-outfit">{formatPrice(pageSummary.netProfit)}</h4>
            <span className="text-[9px] text-emerald-400 font-bold block">Net Profit · {pageSummary.avgMargin}% ROI</span>
          </div>
          <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl z-10"><Sparkles className="h-6 w-6" /></div>
        </div>
      </div>

      {/* ─── Main 2-col layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left: Category sliders */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-3xl p-6 space-y-6 text-left">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <SlidersHorizontal className="h-5 w-5 text-emerald-650" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Коэффициенты наценок по категориям</span>
          </div>

          <div className="space-y-5">
            {Object.entries(CATEGORIES_INFO).map(([key, info]) => (
              <div key={key} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="truncate">{info.name}</span>
                  <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 border border-emerald-200 py-0.5 px-2 rounded-md shrink-0">
                    +{pendingMarkups[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0" max="100" step="1"
                  value={pendingMarkups[key]}
                  onChange={(e) => handleMarkupChange(key, e.target.value)}
                  className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed font-medium">
            <Info className="h-4 w-4 text-emerald-600 inline-block mr-1.5 -mt-0.5 shrink-0" />
            Категорийная наценка применяется автоматически, если для товара не настроена индивидуальная маржа в таблице справа.
          </div>
        </div>

        {/* Right: paginated product table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
          {/* Table header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Каталог товаров (Индивидуальные маржи)</span>
              <span className="text-[10px] text-slate-400 block font-semibold">Укажите наценку прямо в строке товара для персонального расчета</span>
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
                    <th className="py-4 px-5 text-right">Закуп (₸)</th>
                    <th className="py-4 px-5 text-center">Ваша наценка (%)</th>
                    <th className="py-4 px-5 text-right">Розница (₸)</th>
                    <th className="py-4 px-5 text-right text-emerald-700">Маржа (₸)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-100 text-xs font-semibold text-slate-700 transition-opacity ${dataLoading ? 'opacity-50' : ''}`}>
                  {rows.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.isOverridden ? 'bg-emerald-50/10' : ''}`}>
                      <td className="py-4 px-5">
                        <div className="space-y-0.5 max-w-[200px] sm:max-w-xs">
                          <span className="font-black text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                            {CATEGORIES_INFO[p.category]?.name || p.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">{p.supplier?.name || 'Дистрибьютор'}</td>
                      <td className="py-4 px-5 text-right font-bold text-slate-800">{formatPrice(p.wholesalePrice)}</td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-slate-400 text-[10px] font-bold">%</span>
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
                      <td className="py-4 px-5 text-right font-black text-slate-900">{formatPrice(p.retailPrice)}</td>
                      <td className="py-4 px-5 text-right font-black text-emerald-700">{formatPrice(p.markupValue)}</td>
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

      {/* ─── Top Profitable (current page) ──────────────────────────── */}
      {pageSummary.topProfitable.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
            <Star className="h-5 w-5 text-amber-500" />
            <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest font-outfit">
              Топ прибыльных (текущая страница)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pageSummary.topProfitable.map((p, index) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-150 transition-all">
                <div className="flex items-center gap-3 text-left min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm shrink-0">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="block font-black text-xs text-slate-900 truncate max-w-[150px]" title={p.name}>{p.name}</span>
                    <span className="text-[9px] text-slate-450 font-bold block mt-0.5 truncate">{p.supplier?.name || 'Дистрибьютор'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Маржа / ед.</span>
                  <span className="block font-black text-xs text-emerald-700">{formatPrice(p.markupValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
