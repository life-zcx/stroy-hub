import React, { useState, useEffect } from 'react';
import { 
  Search, Hammer, Wrench, PaintBucket, Package, Truck, Home, 
  Clock, ShieldCheck, Zap, RefreshCw, LayoutGrid, List, SlidersHorizontal,
  ShoppingCart, MapPin, ChevronDown, X
} from 'lucide-react';
import { getSuppliers } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

const getPremiumImage = (productName) => {
  const name = productName.toLowerCase();
  if (name.includes('цемент')) return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80';
  if (name.includes('rotband') || name.includes('штукатурка')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80';
  if (name.includes('доска')) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
  if (name.includes('брус')) return 'https://images.unsplash.com/photo-1520156480391-11597d6db64d?auto=format&fit=crop&w=400&q=80';
  if (name.includes('перфоратор')) return 'https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80';
  if (name.includes('шуруповерт')) return 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=400&q=80';
  if (name.includes('tikkurila') || name.includes('краска интерьерная')) return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80';
  if (name.includes('эмаль') || name.includes('пф-115')) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80';
  if (name.includes('саморез')) return 'https://images.unsplash.com/photo-1590236166418-498c199859f8?auto=format&fit=crop&w=400&q=80';
  if (name.includes('анкер') || name.includes('болт')) return 'https://images.unsplash.com/photo-1610962015564-3773c3736540?auto=format&fit=crop&w=400&q=80';
  return null;
};

export default function Storefront({ 
  products, 
  loading, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery, 
  setSearchQuery, 
  onAddToCart,
  onRefresh,
  sortBy,
  setSortBy
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [onlyHits, setOnlyHits] = useState(false);
  const [onlyBulk, setOnlyBulk] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setAllSuppliers(data);
      } catch (err) {
        console.error('Error loading suppliers:', err);
      }
    };
    loadSuppliers();
  }, []);

  const handleSupplierToggle = (id) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedSuppliers([]);
    setOnlyHits(false);
    setOnlyBulk(false);
    setPriceRange({ min: 0, max: 200000 });
  };

  const activeFilterCount = selectedSuppliers.length + (onlyHits ? 1 : 0) + (onlyBulk ? 1 : 0) + (priceRange.max < 200000 || priceRange.min > 0 ? 1 : 0);

  const processedProducts = React.useMemo(() => {
    let list = [...products];
    if (selectedSuppliers.length > 0) list = list.filter(p => selectedSuppliers.includes(p.supplierId));
    list = list.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    if (onlyHits) list = list.filter(p => p.isHit);
    if (onlyBulk) list = list.filter(p => !!p.bulkDiscount);
    if (sortBy === 'priceAsc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'priceDesc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, selectedSuppliers, priceRange, onlyHits, onlyBulk, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in-up font-sans text-slate-800">
      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* ═══ STICKY CONTROLS BAR ═══ */}
      <div className="sticky top-[78px] z-20 space-y-0">
        
        {/* Main controls row */}
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/60 px-3.5 py-2.5 rounded-3xl shadow-sm">
          
          {/* Quick filter tabs */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => { setOnlyHits(false); setOnlyBulk(false); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap h-[34px] ${
                (!onlyHits && !onlyBulk) 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                  : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Все товары
            </button>
            <button 
              type="button"
              onClick={() => { setOnlyHits(true); setOnlyBulk(false); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap h-[34px] ${
                onlyHits 
                  ? 'bg-red-500 border-red-500 text-white shadow-sm' 
                  : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              🔥 Хиты
            </button>
            <button 
              type="button"
              onClick={() => { setOnlyBulk(true); setOnlyHits(false); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap h-[34px] ${
                onlyBulk 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              % Скидки
            </button>
          </div>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Search */}
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Поиск по каталогу..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all w-full h-[34px] outline-none"
            />
          </div>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Sort */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-emerald-600/20 focus:border-emerald-600 outline-none cursor-pointer h-[34px] text-slate-700 shrink-0"
          >
            <option value="popular">Популярные</option>
            <option value="priceAsc">Дешевле</option>
            <option value="priceDesc">Дороже</option>
            <option value="rating">По рейтингу ⭐</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-[34px] shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="Плитка"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="Список"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Filter toggle button */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border h-[34px] shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Фильтры</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-emerald-700 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ═══ COLLAPSIBLE FILTER PANEL ═══ */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filtersOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-2 bg-white border border-slate-200/60 rounded-3xl shadow-sm p-4">
            <div className="flex flex-wrap items-start gap-6">

              {/* Price Range */}
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Цена, ₸</p>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    placeholder="От"
                    className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  />
                  <span className="text-slate-300">—</span>
                  <input 
                    type="number" 
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 200000 }))}
                    placeholder="До"
                    className="w-28 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden md:block w-px self-stretch bg-slate-100" />

              {/* Suppliers — takes all remaining space */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Дистрибьюторы</p>
                <div className="flex flex-wrap gap-1.5">
                  {allSuppliers.map(sup => (
                    <button
                      key={sup.id}
                      onClick={() => handleSupplierToggle(sup.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSuppliers.includes(sup.id)
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {sup.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden md:block w-px self-stretch bg-slate-100" />

              {/* Markers */}
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Маркеры</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setOnlyHits(v => !v)}
                    className={`flex items-center gap-2.5 w-full text-left text-xs font-semibold transition-colors ${onlyHits ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${onlyHits ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${onlyHits ? 'translate-x-4' : 'translate-x-0'}`} />
                    </span>
                    Только ХИТЫ 🔥
                  </button>
                  <button
                    onClick={() => setOnlyBulk(v => !v)}
                    className={`flex items-center gap-2.5 w-full text-left text-xs font-semibold transition-colors ${onlyBulk ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${onlyBulk ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${onlyBulk ? 'translate-x-4' : 'translate-x-0'}`} />
                    </span>
                    С оптовой скидкой %
                  </button>
                </div>
              </div>

              {/* Reset button */}
              {activeFilterCount > 0 && (
                <button 
                  onClick={resetFilters}
                  className="shrink-0 self-center flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 font-bold transition-colors"
                >
                  <X className="h-3 w-3" />
                  Сбросить
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ═══ PRODUCT GRID ═══ */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Подгружаем базу PostgreSQL...</p>
        </div>
      ) : processedProducts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-150 flex flex-col items-center justify-center space-y-4">
          <Search className="h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-bold text-slate-900">Не найдено подходящих товаров</h3>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {processedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onOpenModal={setSelectedProduct}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {processedProducts.map(product => (
            <div key={product.id} className="bg-white border border-gray-150 p-4 rounded-2xl hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4 relative group text-left">
              {product.isHit && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-0.5 z-10">
                  <Zap className="h-2.5 w-2.5 fill-current" /> Хит
                </span>
              )}
              <div className="w-24 h-24 bg-gray-50/50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={getPremiumImage(product.name) || product.image} 
                  alt={product.name} 
                  className="w-4/5 h-4/5 object-contain mix-blend-multiply group-hover:scale-105 transition-all duration-300"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'; }}
                />
              </div>
              <div className="flex-grow space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center"><Zap className="h-3 w-3 fill-current mr-0.5" />{product.rating}</span>
                  <span>•</span>
                  <span>{product.reviews} отзывов</span>
                </div>
                <h4 className="font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">{product.name}</h4>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center"><ShieldCheck className="h-3.5 w-3.5 mr-1 text-blue-500" /> {product.supplier?.name}</span>
                  <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Доставка: {product.supplier?.delivery}</span>
                  <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Склад: Алматы (Доставка по РК: Да ✓)</span>
                </div>
              </div>
              <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 gap-3">
                <div>
                  {product.oldPrice && <span className="block text-xs text-slate-400 line-through mb-0.5">{formatPrice(product.oldPrice)}</span>}
                  <span className="text-lg font-extrabold text-slate-900 block">{formatPrice(product.price)} <span className="text-[10px] text-slate-400 font-normal">/ шт</span></span>
                  {product.bulkDiscount && <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded block mt-1">{product.bulkDiscount}</span>}
                </div>
                <button 
                  onClick={() => onAddToCart(product)}
                  className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Купить</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
