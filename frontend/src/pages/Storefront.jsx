import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  X,
  Zap,
  Tag,
  ArrowRight,
  Hammer,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { getIpxImageUrl } from '../utils/productImage';

export default function Storefront({
  products,
  categories,
  loading,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  onlyHits,
  setOnlyHits,
  onlyBulk,
  setOnlyBulk,
  loadingMore,
  hasMore,
  total,
  onLoadMore,
  onAddToCart,
  onUpdateCartQuantity,
  cart = [],
  onOpenProduct,
  onToggleFavorite,
  isFavorite,
  onNavigate,
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [quantities, setQuantities] = useState({});

  const getQuantity = (id) => quantities[id] || 1;
  const changeQuantity = (id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  // Helper for category info
  const currentCategoryDetail = useMemo(() => {
    if (selectedCategory === 'all') return null;
    const cat = categories.find(c => c.slug === selectedCategory);
    if (!cat) return null;

    // Build breadcrumbs
    const breadcrumbs = [];
    let temp = cat;
    while (temp) {
      breadcrumbs.unshift(temp);
      temp = categories.find(c => c.id === temp.parentId);
    }

    // Find children
    const children = categories.filter(c => c.parentId === cat.id);

    return { ...cat, breadcrumbs, children };
  }, [selectedCategory, categories]);

  useEffect(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (currentCategoryDetail) {
      document.title = `${currentCategoryDetail.name} — Купить стройматериалы в TORMAG`;
      if (metaDesc) {
        metaDesc.setAttribute('content', `Большой выбор товаров в категории "${currentCategoryDetail.name}" в каталоге TORMAG. Доступные оптовые цены, оперативная доставка по Алматы и области.`);
      }
    } else {
      document.title = "Каталог стройматериалов — TORMAG";
      if (metaDesc) {
        metaDesc.setAttribute('content', "Каталог строительных и отделочных материалов TORMAG. Широкий ассортимент сухих смесей, красок, инструментов, крепежа с доставкой по Алматы.");
      }
    }
  }, [currentCategoryDetail]);

  // Lock background scroll when Mobile Filters are open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileFiltersOpen]);


  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  // Dynamically aggregate brands/suppliers from products
  const availableSuppliers = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const sName = p.supplier?.name;
      if (sName) {
        map.set(sName, (map.get(sName) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const processedProducts = useMemo(() => {
    if (selectedSuppliers.length === 0) return products;
    return products.filter(p => p.supplier?.name && selectedSuppliers.includes(p.supplier.name));
  }, [products, selectedSuppliers]);

  const activeFilterCount = (onlyHits ? 1 : 0) + (onlyBulk ? 1 : 0) + (priceRange.min > 0 || priceRange.max < 200000 ? 1 : 0) + selectedSuppliers.length;

  const resetFilters = () => {
    setPriceRange({ min: 0, max: 200000 });
    setOnlyHits(false);
    setOnlyBulk(false);
    setSelectedSuppliers([]);
    setSelectedCategory('all');
    if (typeof setSearchQuery === 'function') {
      setSearchQuery('');
    }
  };

  const rootCategories = categories.filter(c => !c.parentId);

  // ═══ RENDER SIDEBAR CONTENT ═══
  const SidebarContent = ({ isCompact = false }) => (
    <div className={isCompact ? "space-y-4 text-left" : "space-y-5 text-left"}>
      {/* Sort Header */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Сортировка</label>
        <div className="relative group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer outline-none focus:border-slate-400 focus:bg-white transition-all h-[38px]"
          >
            <option value="popular">По популярности</option>
            <option value="priceAsc">Сначала дешевле</option>
            <option value="priceDesc">Сначала дороже</option>
            <option value="rating">По рейтингу ⭐</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-700 transition-colors" />
        </div>
      </div>

      {/* Category Tree */}
      <div className="space-y-2 pt-3.5 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-slate-600" /> Разделы
        </label>
        <div className="flex flex-col gap-1">
          <Link
            href={getPageHref('catalog')}
            onClick={() => { setSelectedCategory('all'); setIsMobileFiltersOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <span>Все товары</span>
          </Link>
          {rootCategories.map(cat => {
            const isActive = selectedCategory === cat.slug || currentCategoryDetail?.breadcrumbs?.some(b => b.id === cat.id);
            return (
              <div key={cat.id} className="space-y-0.5">
                <Link
                  href={getPageHref('catalog', null, cat.slug)}
                  onClick={() => { setSelectedCategory(cat.slug); setIsMobileFiltersOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left min-w-0 ${isActive
                      ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200/80'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span className="truncate pr-1" title={cat.name}>{cat.name}</span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform text-slate-400 shrink-0 ${isActive ? 'rotate-90 text-slate-800' : ''}`} />
                </Link>

                {/* Subcategories */}
                {isActive && (
                  <div className="pl-3.5 pb-1 space-y-0.5 flex flex-col border-l border-slate-200 ml-3 my-1 overflow-hidden">
                    {categories.filter(c => c.parentId === cat.id).map(sub => (
                      <Link
                        key={sub.id}
                        href={getPageHref('catalog', null, sub.slug)}
                        onClick={() => { setSelectedCategory(sub.slug); setIsMobileFiltersOpen(false); }}
                        className={`text-[11px] font-semibold py-1 px-2 rounded-lg text-left transition-colors truncate block w-full ${selectedCategory === sub.slug
                            ? 'text-blue-600 font-bold bg-blue-50/50'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        title={sub.name}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Brands List */}
      {availableSuppliers.length > 0 && (
        <div className="space-y-2 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Бренды</label>
            {selectedSuppliers.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSuppliers([])}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline"
              >
                Сбросить
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
            {availableSuppliers.map(({ name, count }) => {
              const isChecked = selectedSuppliers.includes(name);
              return (
                <label
                  key={name}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedSuppliers(prev => 
                          isChecked ? prev.filter(s => s !== name) : [...prev, name]
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer shrink-0"
                    />
                    <span className={`text-xs truncate ${isChecked ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2 pt-3.5 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Цена, ₸</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase ml-0.5">От</span>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase ml-0.5">До</span>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 200000 }))}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Clean Checkboxes for Flags */}
      <div className="space-y-2 pt-3.5 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Спецпредложения</label>
        
        <label className="flex items-center gap-2.5 py-1.5 px-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={onlyHits}
            onChange={() => setOnlyHits(v => !v)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer shrink-0"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Только ХИТЫ
          </span>
        </label>

        <label className="flex items-center gap-2.5 py-1.5 px-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="checkbox"
            checked={onlyBulk}
            onChange={() => setOnlyBulk(v => !v)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer shrink-0"
          />
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
            <Tag className="h-3.5 w-3.5 text-emerald-600" /> Товар со скидкой
          </span>
        </label>
      </div>

      {/* Clean Reset Button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full text-center py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
        >
          Сбросить фильтры ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in-up font-sans text-slate-800 min-h-screen">

      {/* ═══ SIDEBAR (Desktop) ═══ */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm h-fit self-start">
        <SidebarContent />
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-grow space-y-3 min-w-0">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 text-left flex-wrap mb-1.5 font-medium min-w-0">
          <Link href={getPageHref('home')} onClick={() => onNavigate?.('home')} className="hover:text-slate-700 transition-colors shrink-0">Главная</Link>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
          {selectedCategory === 'all' && !searchQuery ? (
            <span className="text-slate-400 font-normal shrink-0">Каталог</span>
          ) : (
            <>
              <Link href={getPageHref('catalog')} onClick={() => { setSelectedCategory('all'); setSearchQuery?.(''); }} className="hover:text-slate-700 transition-colors shrink-0">Каталог</Link>
              {searchQuery ? (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                  <span className="text-slate-500 font-normal truncate max-w-[140px] sm:max-w-[200px]">Поиск: «{searchQuery}»</span>
                </>
              ) : (
                currentCategoryDetail?.breadcrumbs?.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                    {i === (currentCategoryDetail.breadcrumbs.length - 1) ? (
                      <span className="text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[160px]">{b.name}</span>
                    ) : (
                      <Link href={getPageHref('catalog', null, b.slug)} onClick={() => setSelectedCategory(b.slug)} className="hover:text-slate-700 transition-colors truncate max-w-[110px] sm:max-w-[150px]">
                        {b.name}
                      </Link>
                    )}
                  </React.Fragment>
                ))
              )}
            </>
          )}
        </nav>

        {/* Page Title */}
        <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 leading-tight text-left mb-5 tracking-tight break-words [word-break:break-word] overflow-hidden">
          {searchQuery ? `Результаты поиска по запросу «${searchQuery}»` : (currentCategoryDetail?.name || 'Все товары')}
        </h1>

        {/* Category image tile grid — показываем только если нет поискового запроса */}
        {!searchQuery && (
          loading && categories.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full h-52 sm:h-56 lg:h-60 rounded-2xl sm:rounded-3xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : (currentCategoryDetail?.children?.length > 0 || (selectedCategory === 'all' && rootCategories.length > 0)) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
              {(currentCategoryDetail?.children?.length > 0 ? currentCategoryDetail.children : rootCategories).map((cat) => {
                const descendantIds = new Set();
                const descendantSlugs = new Set();
                const collectDescendants = (cId, cSlug) => {
                  if (cId) descendantIds.add(cId);
                  if (cSlug) descendantSlugs.add(cSlug);
                  categories.filter(ch => ch.parentId === cId).forEach(ch => collectDescendants(ch.id, ch.slug));
                };
                collectDescendants(cat.id, cat.slug);

                let count = cat.totalProductsCount ?? cat._count?.products;
                if (!count || count === 0) {
                  let totalSum = 0;
                  categories.forEach(c => {
                    if (descendantIds.has(c.id) && c._count?.products) {
                      totalSum += c._count.products;
                    }
                  });
                  if (totalSum > 0) {
                    count = totalSum;
                  } else {
                    const matchedProds = products.filter(p => descendantSlugs.has(p.category) || descendantIds.has(p.categoryId) || descendantSlugs.has(p.categoryRelation?.slug));
                    count = matchedProds.length;
                  }
                }

                // Formatter for count with Russian declension (e.g. "2 товаров", "406 520 товаров")
                const formatCount = (num) => {
                  if (num === null || num === undefined) return 'Каталог';
                  const n = Number(num);
                  const mod10 = n % 10;
                  const mod100 = n % 100;
                  let word = 'товаров';
                  if (mod100 >= 11 && mod100 <= 19) word = 'товаров';
                  else if (mod10 === 1) word = 'товар';
                  else if (mod10 >= 2 && mod10 <= 4) word = 'товара';
                  return `${n.toLocaleString('ru-RU')} ${word}`;
                };

                const catProducts = products.filter(p => descendantSlugs.has(p.category) || descendantIds.has(p.categoryId) || descendantSlugs.has(p.categoryRelation?.slug));
                const firstProdImg = catProducts[0]?.image || catProducts[0]?.images?.[0];
                const imageSrc = cat.image || cat.bg || firstProdImg;
                const optimizedSrc = imageSrc ? getIpxImageUrl(imageSrc, '300x300') : null;

                return (
                  <Link
                    key={cat.id}
                    href={getPageHref('catalog', null, cat.slug)}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className="bg-[#f3f4f6] hover:bg-[#eaecef] rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between h-[200px] sm:h-[220px] lg:h-[235px] text-left transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="space-y-0.5 z-10 text-left">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 break-words [word-break:break-word] overflow-hidden" title={cat.name}>
                        {cat.name}
                      </h3>
                      <span className="text-[11px] sm:text-xs font-normal text-slate-400 block mt-0.5">
                        {formatCount(count)}
                      </span>
                    </div>

                    <div className="w-full h-28 sm:h-32 lg:h-36 flex items-center justify-center mt-auto p-1 overflow-hidden">
                      {optimizedSrc ? (
                        <img
                          src={optimizedSrc}
                          alt={cat.name}
                          className="max-h-full max-w-full object-contain mix-blend-multiply contrast-[1.08] brightness-[1.04]"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallbackEl = e.target.parentElement?.querySelector('.cat-fallback');
                            if (fallbackEl) fallbackEl.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`cat-fallback ${optimizedSrc ? 'hidden' : ''} w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-200/60 shadow-2xs flex items-center justify-center text-slate-400`}>
                        <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 stroke-[1.6]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* Found count + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 font-medium">Найдено {total || processedProducts.length} товаров</p>
          <div className="flex items-center bg-[#f3f4f6] p-0.5 rounded-xl border border-slate-200/70 h-9 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'}`}
              title="Сетка"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'}`}
              title="Список"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter + Sort row (mobile only) */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-all active:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
            Фильтры
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-slate-900 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{activeFilterCount}</span>
            )}
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full h-full py-2.5 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer outline-none"
            >
              <option value="popular">Популярные</option>
              <option value="priceAsc">Дешевле</option>
              <option value="priceDesc">Дороже</option>
              <option value="rating">По рейтингу</option>
            </select>
            <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none rotate-90" />
          </div>
        </div>

        {/* Active filter chips */}
        {(activeFilterCount > 0 || searchQuery) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-left">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold whitespace-nowrap shrink-0 shadow-xs">
                Поиск: «{searchQuery}»
                <button onClick={() => setSearchQuery?.('')} className="cursor-pointer ml-0.5 hover:text-slate-200">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedSuppliers.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">
                Бренд: {s}
                <button onClick={() => setSelectedSuppliers(prev => prev.filter(item => item !== s))} className="cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {onlyHits && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">
                🔥 Хиты
                <button onClick={() => setOnlyHits(false)} className="cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {onlyBulk && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">
                🏷️ Скидка
                <button onClick={() => setOnlyBulk(false)} className="cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-400 text-slate-900 rounded-full text-xs font-semibold whitespace-nowrap shrink-0">
                {currentCategoryDetail?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { resetFilters(); setSearchQuery?.(''); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Очистить все
            </button>
          </div>
        )}

        {/* ═══ PRODUCT GRID ═══ */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-5">
            <ProductSkeleton count={12} />
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4 my-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-slate-200/60">
              <Search className="h-7 w-7 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {searchQuery ? `Ничего не найдено по запросу «${searchQuery}»` : 'Ничего не нашли'}
              </h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto font-medium">
                {searchQuery
                  ? 'Проверьте правильность написания или попробуйте сформулировать запрос иначе'
                  : 'Попробуйте изменить параметры фильтра или сбросить их'}
              </p>
            </div>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery?.(''); resetFilters(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer border-0 active:scale-95"
              >
                Сбросить поиск и показать все товары
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { resetFilters(); setSelectedCategory('all'); }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-0 active:scale-95"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-5">
              {processedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateCartQuantity}
                  cartQuantity={cart.find(i => i.id === product.id)?.quantity || 0}
                  onOpenDetails={onOpenProduct}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite?.(product.id)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
            {hasMore && (
              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingMore ? 'animate-spin' : ''}`} />
                  Показать еще
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2 w-full">
              {processedProducts.map(product => (
                <div key={product.id} className="bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all flex items-center gap-3 relative overflow-hidden p-3 text-left w-full">

                  {/* Image */}
                  <Link
                    href={getPageHref('product', product.slug || product.id)}
                    onClick={() => onOpenProduct?.(product.slug || product.id)}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-1.5 mix-blend-multiply"
                      onError={(e) => { e.target.src = 'https://placehold.co/128x128'; }}
                    />
                  </Link>

                  {/* Info */}
                  <Link
                    href={getPageHref('product', product.slug || product.id)}
                    onClick={() => onOpenProduct?.(product.slug || product.id)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    {product.isHit && (
                      <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase mb-1">
                        <Zap className="h-2.5 w-2.5 fill-current" /> Хит
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 break-words mb-1">{product.name}</h3>
                    <p className="text-base font-bold text-slate-900">{product.price.toLocaleString()} ₸</p>
                    {product.article && <p className="text-[10px] text-slate-400 mt-0.5">Арт: {product.article}</p>}
                  </Link>

                  {/* Cart button */}
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAddToCart(product, getQuantity(product.id))}
                      className="w-[38px] h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingMore ? 'animate-spin' : ''}`} />
                  Показать еще
                </button>
              </div>
            )}
          </>
        )}
      </div>


      {/* ═══ MOBILE FILTERS — KASPI STYLE FULLSCREEN ═══ */}
      {isMobileFiltersOpen && createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden bg-white flex flex-col">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="text-slate-500 text-sm font-medium cursor-pointer hover:text-slate-800 transition-colors"
            >
              Отменить
            </button>
            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Фильтры</span>
            <button
              onClick={() => { resetFilters(); }}
              className="text-emerald-600 text-sm font-semibold cursor-pointer hover:text-emerald-700 transition-colors"
            >
              Сбросить
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">

            {/* Сортировка */}
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сортировка</p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 cursor-pointer outline-none"
                >
                  <option value="popular">По популярности</option>
                  <option value="priceAsc">Сначала дешевле</option>
                  <option value="priceDesc">Сначала дороже</option>
                  <option value="rating">По рейтингу</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Разделы */}
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" /> Разделы
              </p>
              <div className="space-y-0.5">
                <Link
                  href={getPageHref('catalog')}
                  onClick={() => { setSelectedCategory('all'); setIsMobileFiltersOpen(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${selectedCategory === 'all' ? 'text-slate-900 font-bold' : 'text-slate-600'}`}
                >
                  <span>Все товары</span>
                </Link>
                {rootCategories.map(cat => {
                  const isActive = selectedCategory === cat.slug || currentCategoryDetail?.breadcrumbs?.some(b => b.id === cat.id);
                  const subs = categories.filter(c => c.parentId === cat.id);
                  return (
                    <div key={cat.id}>
                      <Link
                        href={getPageHref('catalog', null, cat.slug)}
                        onClick={() => { setSelectedCategory(cat.slug); if (!subs.length) setIsMobileFiltersOpen(false); }}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'}`}
                      >
                        <span>{cat.name}</span>
                        {subs.length > 0 ? (
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        )}
                      </Link>
                      {isActive && subs.length > 0 && (
                        <div className="ml-4 border-l border-slate-200 pl-3 space-y-0.5 mt-0.5">
                          {subs.map(sub => (
                            <Link
                              key={sub.id}
                              href={getPageHref('catalog', null, sub.slug)}
                              onClick={() => { setSelectedCategory(sub.slug); setIsMobileFiltersOpen(false); }}
                              className={`block py-2 px-2 text-sm rounded-lg transition-colors ${selectedCategory === sub.slug ? 'text-emerald-600 font-semibold bg-emerald-50' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Бренды — chips */}
            {availableSuppliers.length > 0 && (
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Бренд</p>
                  {selectedSuppliers.length > 0 && (
                    <button onClick={() => setSelectedSuppliers([])} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Сбросить</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSuppliers.map(({ name, count }) => {
                    const isChecked = selectedSuppliers.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedSuppliers(prev => isChecked ? prev.filter(s => s !== name) : [...prev, name])}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {name}
                        {count > 0 && <span className={`ml-1 text-[10px] ${isChecked ? 'text-white/70' : 'text-slate-400'}`}>({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Цена */}
            <div className="px-4 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Цена, ₸</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">ОТ</p>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-slate-400 bg-slate-50"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">ДО</p>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 200000 }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-slate-400 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Спецпредложения */}
            <div className="px-4 py-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Спецпредложения</p>
              <label className="flex items-center justify-between py-2.5 cursor-pointer">
                <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Только ХИТЫ
                </span>
                <div
                  onClick={() => setOnlyHits(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${onlyHits ? 'bg-emerald-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${onlyHits ? 'left-6' : 'left-1'}`} />
                </div>
              </label>
              <label className="flex items-center justify-between py-2.5 cursor-pointer border-t border-slate-100">
                <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" /> Товар со скидкой
                </span>
                <div
                  onClick={() => setOnlyBulk(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${onlyBulk ? 'bg-emerald-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${onlyBulk ? 'left-6' : 'left-1'}`} />
                </div>
              </label>
            </div>

          </div>

          {/* Sticky bottom — Применить */}
          <div className="px-4 py-4 border-t border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wide"
            >
              Применить фильтр{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>

        </div>,
        document.body
      )}

    </div>
  );
}
