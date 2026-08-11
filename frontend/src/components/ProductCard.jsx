import React, { useState } from 'react';
import { ShoppingCart, Zap, Heart, Tag, Minus, Plus } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../utils/productImage';
import Link from './Link';
import { getPageHref } from '../utils/navigationHelper';

const formatPrice = (price) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);

export default function ProductCard({ 
  product, 
  onAddToCart,
  onUpdateQuantity,   // (id, newQty) — обновить кол-во в корзине
  cartQuantity = 0,   // текущее кол-во этого товара в корзине (0 = нет)
  onOpenModal, 
  onOpenDetails,
  onToggleFavorite,
  onNavigate,
  isFavorite = false
}) {
  const [loading, setLoading] = useState(false);
  const imageSrc = getProductImage(product, '600x600');

  const inCart = cartQuantity > 0;

  const handleAdd = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onAddToCart?.(product, 1);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (cartQuantity === 1) {
        // Убрать из корзины
        await onUpdateQuantity?.(product.id, 0);
      } else {
        await onUpdateQuantity?.(product.id, cartQuantity - 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onUpdateQuantity?.(product.id, cartQuantity + 1);
    } finally {
      setLoading(false);
    }
  };

  const firstOption = React.useMemo(() => {
    if (product.options && typeof product.options === 'object' && Array.isArray(product.options.items) && product.options.items.length > 0) {
      return product.options.items.find(i => i.available) || product.options.items[0];
    }
    return null;
  }, [product]);

  const displayPrice = React.useMemo(() => {
    if (firstOption && firstOption.price && !isNaN(parseFloat(firstOption.price))) {
      return parseFloat(firstOption.price);
    }
    return product.price;
  }, [firstOption, product.price]);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col relative overflow-hidden text-slate-800">

      {/* ── Badges ── */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.isHit && (
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1 shadow-sm">
            <Zap className="h-3 w-3 fill-current" /> Хит
          </span>
        )}
        {product.oldPrice && product.oldPrice > displayPrice && (
          <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide shadow-sm">
            −{Math.round((1 - displayPrice / product.oldPrice) * 100)}%
          </span>
        )}
        {product.activePromotion && (
          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide shadow-sm flex items-center gap-1">
            <Tag className="h-3 w-3 fill-current shrink-0" />
            <span>{product.activePromotion.badgeText || product.activePromotion.title}</span>
          </span>
        )}
      </div>

      {/* ── Favorite ── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(product);
        }}
        className={`absolute top-3 right-3 z-20 p-2 rounded-xl transition-all duration-300 shadow-md border border-slate-200/80 ${
          isFavorite 
            ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30 border-rose-600' 
            : 'bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-500 hover:bg-white'
        }`}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* ── Link wrapper for clickable product area ── */}
      <Link
        href={getPageHref('product', product.slug || product.id)}
        className="flex flex-col flex-1 cursor-pointer min-w-0 w-full"
        onClick={() => onOpenDetails && onOpenDetails(product.slug || product.id)}
      >
        {/* ── Image zone ── */}
        <div className="aspect-square bg-slate-50/80 flex items-center justify-center overflow-hidden flex-shrink-0 w-full relative p-3 sm:p-4">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain"
            onError={(e) => {
              if (e.target.src !== product.image && product.image) {
                e.target.src = product.image;
              } else {
                e.target.onerror = null;
                e.target.src = FALLBACK_PRODUCT_IMAGE;
              }
            }}
          />
        </div>



        {/* ── Content ── */}
        <div className="flex flex-col flex-1 p-4 pb-0 min-w-0 w-full">
          {/* Rating row */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-medium">
            <span className="flex items-center text-emerald-600 font-bold">
              <Zap className="h-3 w-3 fill-current mr-0.5" />
              {product.rating && product.rating > 0 ? product.rating : '0.0'}
            </span>
            <span className="text-slate-300">•</span>
            <span>
              {product.reviews && product.reviews > 0
                ? `${product.reviews} ${product.reviews % 10 === 1 && product.reviews % 100 !== 11 ? 'отзыв' : [2,3,4].includes(product.reviews % 10) && ![12,13,14].includes(product.reviews % 100) ? 'отзыва' : 'отзывов'}`
                : '0 отзывов'}
            </span>
          </div>

          {/* Name — flex-grow pushes price to bottom */}
          <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3 break-words flex-grow">
            {product.name}
          </h3>

          {/* Price — always at bottom */}
          <div className="mb-3 space-y-1.5">
            {product.oldPrice ? (
              <div className="text-xs text-slate-500 line-through leading-none font-medium">{formatPrice(product.oldPrice)}</div>
            ) : (
              <div className="text-xs leading-none invisible select-none">-</div>
            )}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-extrabold text-slate-900 leading-none">
                {formatPrice(displayPrice)}
              </span>
              <span className="text-xs font-semibold text-slate-600">/ шт</span>
              {firstOption && (
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 leading-none">
                  {firstOption.value}
                </span>
              )}
            </div>
            <div>
              <span className="bg-[#e6f7ef] text-[#00a046] text-[10px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#b2e6ce] leading-none" title="Бонусы за покупку">
                <span className="font-extrabold text-[#00a046]">+{formatPrice(Math.round(displayPrice * (product.cashbackPercent ?? 3) / 100))}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#00a046] text-white font-black text-[9px] flex items-center justify-center shrink-0 leading-none">Б</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* ── Actions Zone ── */}
      <div className="p-4 pt-2">
        {inCart ? (
          /* ── Степпер когда товар в корзине ── */
          <div className="flex items-center justify-between bg-blue-600 rounded-xl h-[44px] px-1 shadow-md shadow-blue-600/20 overflow-hidden">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={loading}
              className="w-10 h-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-50"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('cart')}
              className="flex-1 flex items-center justify-center gap-1.5 h-full text-white font-extrabold text-sm hover:bg-white/10 transition-all rounded-lg"
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-white" />
              <span>{cartQuantity}</span>
              <span className="text-white/70 text-[10px] font-normal">шт</span>
            </button>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={loading}
              className="w-10 h-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          /* ── Кнопка "В корзину" когда товара нет ── */
          <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold h-[44px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 text-xs uppercase tracking-wider disabled:opacity-60 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span>В корзину</span>
          </button>
        )}
      </div>
    </div>
  );
}
