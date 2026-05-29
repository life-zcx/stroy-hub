import React, { useState, useMemo } from 'react';
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
  ChevronRight
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

export default function Storefront({
  products,
  categories,
  loading,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
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
  onOpenProduct,
  onToggleFavorite,
  isFavorite,
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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

  const processedProducts = useMemo(() => {
    return products;
  }, [products]);

  const activeFilterCount = (onlyHits ? 1 : 0) + (onlyBulk ? 1 : 0) + (priceRange.min > 0 || priceRange.max < 200000 ? 1 : 0);

  const resetFilters = () => {
    setPriceRange({ min: 0, max: 200000 });
    setOnlyHits(false);
    setOnlyBulk(false);
    setSelectedCategory('all');
  };

  const rootCategories = categories.filter(c => !c.parentId);

  // ═══ RENDER SIDEBAR CONTENT ═══
  const SidebarContent = () => (
    <div className="space-y-8">
      {/* Sort */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-[9px]">Сортировка</h3>
        <div className="relative group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-900 cursor-pointer outline-none focus:border-emerald-500 transition-all h-[36px]"
          >
            <option value="popular">По популярности</option>
            <option value="priceAsc">Сначала дешевле</option>
            <option value="priceDesc">Сначала дороже</option>
            <option value="rating">По рейтингу ⭐</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* Category Tree */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Разделы
        </h3>
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            onClick={() => { setSelectedCategory('all'); setIsMobileFiltersOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            Все товары
          </button>
          {rootCategories.map(cat => (
            <div key={cat.id} className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(cat.slug); setIsMobileFiltersOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${selectedCategory === cat.slug || currentCategoryDetail?.breadcrumbs?.some(b => b.id === cat.id)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <span>{cat.name}</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${currentCategoryDetail?.breadcrumbs?.some(b => b.id === cat.id) ? 'rotate-90' : ''}`} />
              </button>

              {/* Subcategories if root is active/parent */}
              {currentCategoryDetail?.breadcrumbs?.some(b => b.id === cat.id) && (
                <div className="pl-4 pb-1 space-y-1 flex flex-col border-l border-slate-100 ml-3.5 mt-1">
                  {categories.filter(c => c.parentId === cat.id).map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedCategory(sub.slug); setIsMobileFiltersOpen(false); }}
                      className={`text-[11px] font-bold py-1.5 px-3 rounded-lg text-left transition-colors ${selectedCategory === sub.slug
                          ? 'text-emerald-600 bg-emerald-50/50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-[9px]">Цена, ₸</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">От</span>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">До</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 200000 }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-[9px]">Фильтры</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setOnlyHits(v => !v)}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl border transition-all ${onlyHits ? 'bg-red-50 border-red-100 text-red-700 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-red-100 hover:bg-red-50/30'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${onlyHits ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Zap className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-[11px] font-extrabold text-left leading-tight">Только ХИТЫ 🔥</span>
          </button>

          <button
            onClick={() => setOnlyBulk(v => !v)}
            className={`flex items-center gap-2.5 w-full p-2.5 rounded-xl border transition-all ${onlyBulk ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-100 hover:bg-emerald-50/30'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${onlyBulk ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Tag className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-extrabold text-left leading-tight">Оптовая цена %</span>
          </button>
        </div>
      </div>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl text-xs font-black transition-all border border-red-100 shadow-sm"
        >
          <X className="h-4 w-4" /> Сбросить все
        </button>
      )}
    </div>
  );

  // If no category selected, show root Tiles view
  if (selectedCategory === 'all' && !searchQuery && loading === false && products.length > 0 && priceRange.min === 0 && priceRange.max === 200000 && !onlyHits && !onlyBulk) {
    return (
      <div className="space-y-12 animate-fade-in-up">
        {/* Banner or Title can go here */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-outfit uppercase tracking-tight">Каталог товаров</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Широкий ассортимент качественных строительных материалов от фундамента до крыши. 
            Покупайте всё необходимое в одном месте с доставкой по городу.
          </p>
        </div>

        {rootCategories.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic font-semibold text-xs flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
            Разделы каталога загружаются...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rootCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className="group cursor-pointer bg-white border border-slate-200/60 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-500 flex flex-col relative h-[280px] justify-end overflow-hidden"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 opacity-90"
                  style={{ backgroundImage: `url(${cat.image || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-0"></div>
                
                <div className="relative z-10 space-y-2">
                  <h3 className="font-extrabold text-white text-lg sm:text-xl leading-tight font-outfit group-hover:text-emerald-400 transition-colors text-left">{cat.name}</h3>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-left">
                    Перейти в раздел <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-fade-in-up font-sans text-slate-800 min-h-screen">
      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
          onOpenDetails={onOpenProduct}
        />
      )}

      {/* ═══ SIDEBAR (Desktop) ═══ */}
      <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-24 self-start bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <SidebarContent />
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-grow space-y-3">
        
        {/* Mobile Header / Breadcrumbs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {currentCategoryDetail && currentCategoryDetail.breadcrumbs && (
              <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                <button onClick={() => setSelectedCategory('all')} className="hover:text-emerald-600 transition-colors uppercase">Каталог</button>
                {currentCategoryDetail.breadcrumbs.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <ChevronRight className="h-2.5 w-2.5" />
                    <button 
                      onClick={() => setSelectedCategory(b.slug)} 
                      className={`hover:text-emerald-600 transition-colors uppercase ${i === currentCategoryDetail.breadcrumbs.length - 1 ? 'text-slate-900 border-b-2 border-emerald-500 pb-0.5' : ''}`}
                    >
                      {b.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
            {!currentCategoryDetail && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Все товары
              </div>
            )}

            {/* Mobile Filter Toggle */}
            <button
               onClick={() => setIsMobileFiltersOpen(true)}
               className="lg:hidden flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
            >
              <Filter className="h-4 w-4" /> Фильтры
            </button>
          </div>

          {/* Heading & Toolbar Group */}
          <div className="text-left">
             <h1 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight leading-none">
               {currentCategoryDetail?.name || 'Все товары'}
             </h1>
             
             <div className="flex items-center justify-between gap-4 mt-2 pb-3 border-b border-slate-100 mb-2">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Найдено {total || processedProducts.length} позиций</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Вид:</span>
                 <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-[32px]">
                   <button
                     onClick={() => setViewMode('grid')}
                     className={`px-2 h-full rounded-md transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <LayoutGrid className="h-3.5 w-3.5" />
                   </button>
                   <button
                     onClick={() => setViewMode('list')}
                     className={`px-2 h-full rounded-md transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <List className="h-3.5 w-3.5" />
                   </button>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Categories Pills (Quick access to subcategories) */}
        {currentCategoryDetail?.children?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {currentCategoryDetail.children.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedCategory(sub.slug)}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* ═══ PRODUCT GRID ═══ */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Загружаем товары...</p>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-inner">
               <Search className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 font-outfit uppercase">Ничего не нашли</h3>
              <p className="text-slate-400 text-xs font-bold max-w-xs mx-auto uppercase tracking-wide">Попробуйте изменить параметры фильтра или сбросить их</p>
            </div>
            <button 
              onClick={() => { resetFilters(); setSelectedCategory('all'); }} 
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all transform hover:-translate-y-0.5 shadow-md"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {processedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onOpenModal={setSelectedProduct}
                  onOpenDetails={onOpenProduct}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite?.(product.id)}
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
            <div className="space-y-5">
              {processedProducts.map(product => (
                <div key={product.id} className="bg-white border border-slate-100 p-5 rounded-3xl hover:shadow-xl hover:border-emerald-500/10 transition-all flex flex-col sm:flex-row items-center gap-6 relative group text-left">
                {product.isHit && (
                  <span className="absolute top-5 left-5 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 z-10 shadow-lg shadow-red-500/30">
                    <Zap className="h-3 w-3 fill-current" /> Хит
                  </span>
                )}
                <div className="w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-2 mix-blend-multiply" 
                    onError={(e) => { e.target.src = 'https://placehold.co/128x128'; }} 
                  />
                </div>
                <div className="flex-grow space-y-3 min-w-0 py-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{categories.find(c => c.slug === product.category)?.name || product.category}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors truncate">{product.name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Цена</span>
                      <p className="text-xl font-black text-slate-900">{product.price.toLocaleString()} ₸</p>
                    </div>
                    {product.bulkDiscount && (
                       <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                         <Tag className="h-3 w-3 text-emerald-600" />
                         <span className="text-[10px] font-bold text-emerald-700 uppercase">Оптом дешевле</span>
                       </div>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="flex-grow sm:w-16 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center transition-all shadow-md transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <Zap className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onOpenProduct(product.id)}
                    className="flex-grow sm:w-16 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                </div>
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
        )}
      </div>

      {/* ═══ MOBILE FILTERS DRAWER ═══ */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-left p-6 overflow-y-auto">
             <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
               <h2 className="text-xl font-black text-slate-900 uppercase font-outfit">Фильтры</h2>
               <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-slate-50 rounded-xl"><X className="h-6 w-6 text-slate-400" /></button>
             </div>
             <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
