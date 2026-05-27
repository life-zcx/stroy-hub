import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, DollarSign, TrendingUp, SlidersHorizontal, Info, 
  Layers3, RefreshCw, Save, CheckCircle, Percent, BarChart3,
  Edit2, Star, TrendingDown, ArrowUpRight
} from 'lucide-react';
import { getProducts, getPricingSettings, savePricingSettings } from '../../../services/api';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

const CATEGORIES_INFO = {
  mixes: { name: 'Сухие смеси', defaultMarkup: 15 },
  lumber: { name: 'Пиломатериалы & Утеплители', defaultMarkup: 12 },
  tools: { name: 'Инструменты', defaultMarkup: 20 },
  paints: { name: 'Краски', defaultMarkup: 18 },
  hardware: { name: 'Крепеж', defaultMarkup: 25 }
};

export default function PricingPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Category-level markups state
  const [markups, setMarkups] = useState(() => {
    const saved = localStorage.getItem('stroyhub_markups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      mixes: 15,
      lumber: 12,
      tools: 20,
      paints: 18,
      hardware: 25
    };
  });

  // 2. Individual product markup overrides state
  const [overrides, setOverrides] = useState(() => {
    const saved = localStorage.getItem('stroyhub_product_overrides');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  const loadProductsData = async () => {
    setLoading(true);
    try {
      const [productsData, settingsData] = await Promise.all([
        getProducts(),
        getPricingSettings().catch(err => {
          console.error("Failed to load settings from server, using local fallbacks", err);
          return null;
        })
      ]);

      setProducts(productsData);

      if (settingsData) {
        if (settingsData.markups) setMarkups(settingsData.markups);
        if (settingsData.overrides) setOverrides(settingsData.overrides);
        
        // Sync back to local storage
        localStorage.setItem('stroyhub_markups', JSON.stringify(settingsData.markups || markups));
        localStorage.setItem('stroyhub_product_overrides', JSON.stringify(settingsData.overrides || overrides));
      }
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Ошибка загрузки товаров для калькуляции цен');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsData();
  }, []);

  const handleMarkupChange = (catKey, val) => {
    setMarkups(prev => ({
      ...prev,
      [catKey]: parseInt(val) || 0
    }));
  };

  const handleProductOverrideChange = (productId, val) => {
    const parsedVal = val === '' ? '' : parseInt(val) || 0;
    setOverrides(prev => {
      const next = { ...prev };
      if (parsedVal === '') {
        delete next[productId];
      } else {
        next[productId] = Math.max(0, Math.min(100, parsedVal));
      }
      return next;
    });
  };

  const handleSaveAllPricing = async () => {
    try {
      await savePricingSettings({ markups, overrides });
      localStorage.setItem('stroyhub_markups', JSON.stringify(markups));
      localStorage.setItem('stroyhub_product_overrides', JSON.stringify(overrides));
      showToast?.('💾 Все наценки (категорийные и индивидуальные) сохранены на сервере!');
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Не удалось сохранить наценки на сервере');
    }
  };

  // Compute pricing and margin analysis summaries
  const pricingSummary = useMemo(() => {
    let totalCostPrice = 0;
    let totalRetailPrice = 0;

    const calculatedProducts = products.map(p => {
      const categoryMarkup = markups[p.category] || 15;
      
      // If individual override exists, prioritize it!
      const activeMarkup = overrides[p.id] !== undefined ? overrides[p.id] : categoryMarkup;
      const wholesalePrice = p.wholesalePrice !== undefined ? p.wholesalePrice : p.price; 
      const markupValue = wholesalePrice * (activeMarkup / 100);
      const retailPrice = wholesalePrice + markupValue;

      totalCostPrice += wholesalePrice;
      totalRetailPrice += retailPrice;

      return {
        ...p,
        wholesalePrice,
        markupPercentage: activeMarkup,
        isOverridden: overrides[p.id] !== undefined,
        markupValue,
        retailPrice
      };
    });

    const netProfit = totalRetailPrice - totalCostPrice;
    const avgMarginPercentage = totalCostPrice > 0 ? Math.round((netProfit / totalCostPrice) * 100) : 0;

    // Top profitable products list (Top-3 by absolute KZT margin value)
    const topProfitable = [...calculatedProducts]
      .sort((a, b) => b.markupValue - a.markupValue)
      .slice(0, 3);

    // Elasticity margin projection report (+10%, +15%, +20%, +25% average markup scenarios)
    const elasticityScenarios = [10, 15, 20, 25].map(sc => {
      const projRetail = totalCostPrice * (1 + sc / 100);
      const projProfit = projRetail - totalCostPrice;
      return {
        markup: sc,
        revenue: projRetail,
        profit: projProfit
      };
    });

    return {
      calculatedProducts,
      totalCostPrice,
      totalRetailPrice,
      netProfit,
      avgMarginPercentage,
      topProfitable,
      elasticityScenarios
    };
  }, [products, markups, overrides]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-black uppercase tracking-widest">Калькуляция наценок и закупа...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-900 font-outfit">Ценообразование и Маржинальность</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Управляйте наценками на товары дистрибьюторов в реальном времени и рассчитывайте чистую прибыль компании.
          </p>
        </div>
        <button 
          onClick={handleSaveAllPricing}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-950 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer border-0"
        >
          <Save className="h-4.5 w-4.5" /> Сохранить реестр цен
        </button>
      </div>

      {/* 3 Summary Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        <div className="bg-white border border-slate-200/80 rounded-2.5xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Себестоимость закупки (Дистрибьюторы)</span>
            <h4 className="text-2xl font-black text-slate-900 font-outfit">{formatPrice(pricingSummary.totalCostPrice)}</h4>
            <span className="text-[9px] text-slate-500 font-bold block">Consolidated Wholesale Cost</span>
          </div>
          <div className="bg-slate-100 text-slate-700 p-3 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2.5xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ожидаемая Выручка (Розничный ритейл)</span>
            <h4 className="text-2xl font-black text-emerald-700 font-outfit">{formatPrice(pricingSummary.totalRetailPrice)}</h4>
            <span className="text-[9px] text-emerald-600 font-bold block">Estimated Gross Retail Revenue</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-2.5xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Ваша чистая маржа (Прибыль)</span>
            <h4 className="text-2xl font-black text-white font-outfit">{formatPrice(pricingSummary.netProfit)}</h4>
            <span className="text-[9px] text-emerald-450 font-bold block">Net Reseller Profit Margin ({pricingSummary.avgMarginPercentage}% ROI)</span>
          </div>
          <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl z-10">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 4 cols: Markups Slider Panel */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-3xl p-6 space-y-6 text-left">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <SlidersHorizontal className="h-5 w-5 text-emerald-650" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Коэффициенты наценок по категориям</span>
          </div>

          <div className="space-y-5">
            {Object.entries(CATEGORIES_INFO).map(([key, info]) => (
              <div key={key} className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="truncate">{info.name}</span>
                  <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 border border-emerald-200 py-0.5 px-2 rounded-md shrink-0">
                    +{markups[key]}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={markups[key]}
                  onChange={(e) => handleMarkupChange(key, e.target.value)}
                  className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 text-[10px] text-slate-550 leading-relaxed font-medium">
            <Info className="h-4.5 w-4.5 text-emerald-600 inline-block mr-1.5 shrink-0 -mt-0.5" />
            Категорийная наценка применяется автоматически, если для товара не настроена **индивидуальная маржа** в правой таблице.
          </div>
        </div>

        {/* Right 8 cols: Dynamic Price List with INDIVIDUAL overrides */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Каталог товаров (Индивидуальные маржи B2B)</span>
              <span className="text-[10px] text-slate-400 block font-semibold">Укажите наценку прямо в строке товара для персонального расчета</span>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-full">{pricingSummary.calculatedProducts.length} позиций</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4.5 px-5">Товар и Категория</th>
                  <th className="py-4.5 px-5">Дистрибьютор</th>
                  <th className="py-4.5 px-5 text-right">Закуп (₸)</th>
                  <th className="py-4.5 px-5 text-center">Ваша наценка (%)</th>
                  <th className="py-4.5 px-5 text-right">Розница на сайте (₸)</th>
                  <th className="py-4.5 px-5 text-right text-emerald-700">Маржа (₸)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {pricingSummary.calculatedProducts.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.isOverridden ? 'bg-emerald-50/10' : ''}`}>
                    <td className="py-4 px-5">
                      <div className="space-y-0.5 max-w-[200px] sm:max-w-xs">
                        <span className="font-black text-slate-900 block truncate">{p.name}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                          {CATEGORIES_INFO[p.category]?.name || p.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {p.supplier?.name || 'Дистрибьютор'}
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-slate-800">
                      {formatPrice(p.wholesalePrice)}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-slate-400 text-[10px] font-bold">%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
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
                      {formatPrice(p.retailPrice)}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-emerald-700">
                      {formatPrice(p.markupValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Reports Section: Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
          <Star className="h-5.5 w-5.5 text-amber-500" />
          <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest font-outfit">Топ прибыльных товаров (Максимальная маржа)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingSummary.topProfitable.map((p, index) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2.5xl border border-slate-150 transition-all">
              <div className="flex items-center gap-3 text-left min-w-0">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm shrink-0">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <span className="block font-black text-xs text-slate-900 truncate max-w-[150px] sm:max-w-[200px]" title={p.name}>
                    {p.name}
                  </span>
                  <span className="text-[9px] text-slate-450 font-bold block mt-0.5 truncate">
                    {p.supplier?.name || 'Дистрибьютор'}
                  </span>
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

    </div>
  );
}
