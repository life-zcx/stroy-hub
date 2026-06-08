import React from 'react';
import { ShoppingCart, Zap, ShieldCheck, Clock, MapPin, ArrowRight, Heart } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../utils/productImage';

const formatPrice = (price) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onOpenModal, 
  onOpenDetails,
  onToggleFavorite,
  isFavorite = false
}) {
  const imageSrc = getProductImage(product);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col relative overflow-hidden cursor-pointer"
      onClick={() => onOpenModal && onOpenModal(product)}
    >

      {/* ── Badges ── */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.isHit && (
          <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide flex items-center gap-1 shadow-sm">
            <Zap className="h-2.5 w-2.5 fill-current" /> Хит
          </span>
        )}
        {product.oldPrice && (
          <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
            −{formatPrice(product.oldPrice - product.price)}
          </span>
        )}
      </div>

      {/* ── Favorite ── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(product);
        }}
        className={`absolute top-3 right-3 z-20 p-2 rounded-xl transition-all duration-300 shadow-sm ${
          isFavorite 
            ? 'bg-rose-500 text-white scale-110' 
            : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* ── Image zone (fixed height) ── */}
      <div className="h-44 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-3/4 h-3/4 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4">

        {/* Rating row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <span className="flex items-center text-emerald-500 font-semibold">
            <Zap className="h-3 w-3 fill-current mr-0.5" />{product.rating}
          </span>
          <span className="text-slate-200">•</span>
          <span>{product.reviews} отзывов</span>
        </div>

        {/* Name (2 lines fixed) */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Supplier info */}
        <div className="bg-slate-50 rounded-xl p-2.5 mb-4 space-y-1.5 border border-slate-100 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 leading-tight">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span className="truncate font-medium">{product.supplier?.name || 'Официальный склад'}</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight">
            <Clock className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <span>Доставка: {product.supplier?.delivery || '1–2 дня'}</span>
          </div>
          <div className="flex items-center gap-1.5 leading-tight border-t border-slate-200/50 pt-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            <span>Склад: <strong className="text-slate-700">Алматы</strong> · РК <span className="text-emerald-600 font-bold">✓</span></span>
          </div>
        </div>

        {/* Price + button always at bottom */}
        <div className="mt-auto">
          <div className="mb-3">
            {product.oldPrice && (
              <div className="text-xs text-slate-400 line-through mb-0.5">{formatPrice(product.oldPrice)}</div>
            )}
            <div className="text-xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
              <div className="flex items-baseline gap-1">
                {formatPrice(product.price)}
                <span className="text-xs font-normal text-slate-400">/ шт</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100/50" title="Бонусы за покупку">
                +{formatPrice(Math.round(product.price * (product.cashbackPercent ?? 3) / 100))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-md"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">В корзину</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetails?.(product.id); }}
              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center"
              title="Открыть страницу товара"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
