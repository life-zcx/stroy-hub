import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowLeft, Zap, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { getProductImage, FALLBACK_PRODUCT_IMAGE } from '../utils/productImage';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

export default function FavoritesPage({ 
  favorites, 
  onToggleFavorite, 
  onAddToCart, 
  onOpenProduct,
  onNavigate,
  onClearAll
}) {
  return (
    <div className="space-y-8 animate-fade-in-up font-sans text-slate-800 text-left">
      {/* ═══ BREADCRUMBS ═══ */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-2">
        <button 
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-400"
        >
          Главная
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-semibold">Избранное</span>
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-rose-50 text-rose-500 p-2 rounded-xl">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">
              Избранные товары
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            {favorites.length > 0 
              ? `У вас ${favorites.length} сохраненных товаров` 
              : 'Сохраняйте товары, чтобы вернуться к ним позже'}
          </p>
        </div>
        
        {favorites.length > 0 && (
          <button 
            onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Очистить список
          </button>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      {favorites.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center relative">
            <Heart className="h-16 w-16 text-slate-300" />
            <div className="absolute top-0 right-0 h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center text-xl">
              🔍
            </div>
          </div>
          <div className="max-w-xs">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Здесь пока пусто</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Добавляйте товары в избранное, нажимая на сердечко в каталоге
            </p>
            <button 
              onClick={() => onNavigate?.('catalog')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 w-full transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" />
              Перейти в каталог
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(product => (
            <div key={product.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-5 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 relative group flex flex-col h-full">
              {/* Actions Overlay */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={() => onToggleFavorite(product)}
                  className="bg-rose-50 text-rose-500 p-2.5 rounded-2xl shadow-lg border border-rose-100 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
                  title="Удалить из избранного"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </button>
              </div>

              {/* Image Section */}
              <div 
                onClick={() => onOpenProduct?.(product.id)}
                className="w-full aspect-square bg-slate-50/50 rounded-[2rem] flex items-center justify-center overflow-hidden mb-5 p-4 cursor-pointer group-hover:scale-[1.02] transition-transform duration-500"
              >
                <img 
                  src={getProductImage(product)} 
                  alt={product.name} 
                  className="w-4/5 h-4/5 object-contain mix-blend-multiply transition-all duration-500"
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PRODUCT_IMAGE; }}
                />
              </div>

              {/* Info Section */}
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center text-amber-500">
                    <Zap className="h-3 w-3 fill-current mr-0.5" />
                    {product.rating}
                  </span>
                  <span>•</span>
                  <span>{product.category?.name || 'Стройматериалы'}</span>
                </div>

                <h4 
                  onClick={() => onOpenProduct?.(product.id)}
                  className="font-black text-slate-800 text-sm leading-tight mb-3 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2 min-h-[2.5rem] font-outfit"
                >
                  {product.name}
                </h4>

                <div className="space-y-1.5 mb-5 mt-auto">
                   <div className="flex items-center text-[10px] text-slate-500 font-medium font-outfit">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      {product.supplier?.name}
                   </div>
                   <div className="flex items-center text-[10px] text-slate-500 font-medium font-outfit">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                      Доставка: {product.supplier?.delivery}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">за единицу</span>
                  </div>
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl transition-all shadow-md transform hover:-translate-y-0.5 active:scale-95"
                    title="В корзину"
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ BACK TO CATALOG BUTTON ═══ */}
      {favorites.length > 0 && (
        <div className="pt-10 flex justify-center">
          <button 
            onClick={() => onNavigate?.('catalog')}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Вернуться в каталог
          </button>
        </div>
      )}
    </div>
  );
}
