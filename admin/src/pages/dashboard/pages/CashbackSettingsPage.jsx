import React, { useEffect, useState } from 'react';
import {
  Percent,
  Search,
  Save,
  RefreshCw,
  Layers,
  Package,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { getCategories, updateCategory, getProductsPaged, updateProduct } from '../../../services/api';

export default function CashbackSettingsPage({ showToast }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'products'
  
  // Categories states
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingCategoryPercent, setEditingCategoryPercent] = useState({}); // { categoryId: percent_string }
  const [savingCategoryIds, setSavingCategoryIds] = useState({}); // { categoryId: boolean }

  // Products states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [editingProductPercent, setEditingProductPercent] = useState({}); // { productId: percent_string }
  const [savingProductIds, setSavingProductIds] = useState({}); // { productId: boolean }

  // Load Categories
  const fetchCategoriesData = async () => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      
      // Initialize edit values
      const initialPercents = {};
      data.forEach(c => {
        initialPercents[c.id] = (c.cashbackPercent ?? '').toString();
      });
      setEditingCategoryPercent(initialPercents);
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось загрузить категории');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load Products
  const fetchProductsData = async () => {
    setProductsLoading(true);
    try {
      const result = await getProductsPaged({
        page: productPage,
        limit: 15,
        search: productSearch,
        category: selectedCategoryFilter
      });
      setProducts(result.data || []);
      setProductTotalPages(result.totalPages || 1);

      // Initialize edit values
      const initialPercents = {};
      (result.data || []).forEach(p => {
        initialPercents[p.id] = (p.cashbackPercent ?? '').toString();
      });
      setEditingProductPercent(initialPercents);
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось загрузить товары');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProductsData();
    }
  }, [activeTab, productPage, selectedCategoryFilter]);

  // Trigger search on enter or button click
  const handleProductSearchSubmit = (e) => {
    e.preventDefault();
    setProductPage(1);
    fetchProductsData();
  };

  // Save Category Cashback Percent
  const handleSaveCategoryPercent = async (categoryId) => {
    setSavingCategoryIds(prev => ({ ...prev, [categoryId]: true }));
    const val = editingCategoryPercent[categoryId];
    
    // Validate value
    const parsed = val === '' ? null : parseInt(val, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      showToast?.('⚠️ Укажите число от 0 до 100 или оставьте пустым');
      setSavingCategoryIds(prev => ({ ...prev, [categoryId]: false }));
      return;
    }

    try {
      const fd = new FormData();
      fd.append('cashbackPercent', parsed === null ? '' : parsed.toString());
      await updateCategory(categoryId, fd);
      showToast?.('✨ Настройки кешбэка категории обновлены');
      fetchCategoriesData();
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось обновить категорию');
    } finally {
      setSavingCategoryIds(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Save Product Cashback Percent
  const handleSaveProductPercent = async (productId) => {
    setSavingProductIds(prev => ({ ...prev, [productId]: true }));
    const val = editingProductPercent[productId];
    
    // Validate value
    const parsed = val === '' ? null : parseInt(val, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      showToast?.('⚠️ Укажите число от 0 до 100 или оставьте пустым');
      setSavingProductIds(prev => ({ ...prev, [productId]: false }));
      return;
    }

    try {
      const fd = new FormData();
      fd.append('cashbackPercent', parsed === null ? '' : parsed.toString());
      await updateProduct(productId, fd);
      showToast?.('✨ Настройки кешбэка товара обновлены');
      fetchProductsData();
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось обновить товар');
    } finally {
      setSavingProductIds(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Управление кешбэком</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Настройте персональный процент начисления бонусов (кешбэка) для категорий или отдельных товаров.
          </p>
        </div>
      </div>


      {/* Tab Switchers */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="h-4 w-4" />
          По категориям ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="h-4 w-4" />
          Поштучно для товаров
        </button>
      </div>

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Настройки кешбэка по разделам каталога
            </h3>
            <button
              onClick={fetchCategoriesData}
              disabled={categoriesLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Название категории</th>
                  <th className="px-6 py-4">Slug (Идентификатор)</th>
                  <th className="px-6 py-4 text-center">Процент кешбэка (%)</th>
                  <th className="px-6 py-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesLoading && categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold">
                      Загрузка разделов каталога...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold">
                      Разделы каталога отсутствуют.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const isSaving = savingCategoryIds[cat.id] || false;
                    const currentValue = editingCategoryPercent[cat.id] ?? '';
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                          {cat.image && (
                            <img
                              src={cat.image}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span>{cat.name}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {cat.slug}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="3 (по умолч.)"
                              value={currentValue}
                              onChange={(e) => setEditingCategoryPercent(prev => ({
                                ...prev,
                                [cat.id]: e.target.value
                              }))}
                              className="w-28 bg-transparent border-0 outline-none text-center font-mono font-bold text-slate-800"
                            />
                            <Percent className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSaveCategoryPercent(cat.id)}
                            disabled={isSaving || currentValue === (cat.cashbackPercent ?? '').toString()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all disabled:shadow-none shadow-sm"
                          >
                            {isSaving ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            <span>Сохранить</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters and search bar */}
          <div className="bg-white rounded-2xl border border-slate-250 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleProductSearchSubmit} className="flex-1 w-full flex gap-2">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-150 rounded-xl px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <Search className="h-4 w-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Поиск по названию товара..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-transparent border-0 py-2.5 outline-none text-sm font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Найти
              </button>
            </form>

            <div className="w-full md:w-64">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setProductPage(1);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none transition-all"
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Товар</th>
                    <th className="px-6 py-4">Категория</th>
                    <th className="px-6 py-4 text-right">Розничная цена</th>
                    <th className="px-6 py-4 text-center">Процент кешбэка (%)</th>
                    <th className="px-6 py-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productsLoading && products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400 font-semibold">
                        Загрузка списка товаров...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400 font-semibold">
                        Товары не найдены.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => {
                      const isSaving = savingProductIds[prod.id] || false;
                      const currentValue = editingProductPercent[prod.id] ?? '';
                      
                      // Calculate effective / inherited rate
                      const inheritedRate = prod.categoryRelation?.cashbackPercent ?? 3;
                      const hasOverride = prod.cashbackPercent !== null && prod.cashbackPercent !== undefined;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {prod.image && (
                              <img
                                src={prod.image}
                                alt=""
                                className="w-10 h-10 rounded-xl object-contain border border-slate-100 bg-white"
                                onError={(e) => { e.target.src = 'https://placehold.co/400x300'; }}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate max-w-xs">{prod.name}</p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                ID: {prod.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {prod.categoryRelation?.name || prod.category}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            {Math.round(prod.price)} ₸
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder={`${inheritedRate} (катег.)`}
                                  value={currentValue}
                                  onChange={(e) => setEditingProductPercent(prev => ({
                                    ...prev,
                                    [prod.id]: e.target.value
                                  }))}
                                  className="w-28 bg-transparent border-0 outline-none text-center font-mono font-bold text-slate-800"
                                />
                                <Percent className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                              <span className="text-[9px] text-slate-400 font-semibold mt-1">
                                {hasOverride ? 'Спец. тариф' : `Наследуется: ${inheritedRate}%`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSaveProductPercent(prod.id)}
                              disabled={isSaving || currentValue === (prod.cashbackPercent ?? '').toString()}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all disabled:shadow-none shadow-sm"
                            >
                              {isSaving ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              <span>Сохранить</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {productTotalPages > 1 && (
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  disabled={productPage <= 1 || productsLoading}
                  onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-550/10 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Назад
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Страница <span className="text-slate-900">{productPage}</span> из {productTotalPages}
                </span>
                <button
                  disabled={productPage >= productTotalPages || productsLoading}
                  onClick={() => setProductPage(prev => Math.min(productTotalPages, prev + 1))}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-550/10 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
