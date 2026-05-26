import React from 'react';
import { ShoppingCart, Zap, ShieldCheck, Clock, MapPin } from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);

const getPremiumImage = (productName) => {
  const n = productName.toLowerCase();
  if (n.includes('цемент'))      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80';
  if (n.includes('rotband') || n.includes('штукатурка')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80';
  if (n.includes('доска'))       return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
  if (n.includes('брус'))        return 'https://images.unsplash.com/photo-1520156480391-11597d6db64d?auto=format&fit=crop&w=400&q=80';
  if (n.includes('перфоратор'))  return 'https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80';
  if (n.includes('шуруповерт'))  return 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=400&q=80';
  if (n.includes('tikkurila') || n.includes('краска интерьерная')) return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80';
  if (n.includes('эмаль') || n.includes('пф-115')) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80';
  if (n.includes('саморез'))     return 'https://images.unsplash.com/photo-1590236166418-498c199859f8?auto=format&fit=crop&w=400&q=80';
  if (n.includes('анкер') || n.includes('болт')) return 'https://images.unsplash.com/photo-1610962015564-3773c3736540?auto=format&fit=crop&w=400&q=80';
  return null;
};

export default function ProductCard({ product, onAddToCart, onOpenModal }) {
  const imageSrc = getPremiumImage(product.name) || product.image;

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

      {/* ── Image zone (fixed height) ── */}
      <div className="h-44 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-3/4 h-3/4 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
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
            <div className="text-xl font-extrabold text-slate-900 flex items-baseline gap-1">
              {formatPrice(product.price)}
              <span className="text-xs font-normal text-slate-400">/ шт</span>
            </div>
            {product.bulkDiscount && (
              <div className="text-[10px] text-emerald-700 font-semibold mt-1 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                {product.bulkDiscount}
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="w-full bg-slate-900 hover:bg-emerald-600 hover:shadow-lg text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">В корзину</span>
          </button>
        </div>
      </div>
    </div>
  );
}
