import React, { useEffect } from 'react';
import {
  X, ShoppingCart, Zap, ShieldCheck, Clock, MapPin,
  Package, Truck, Star, Tag, ChevronRight, CheckCircle2
} from 'lucide-react';

const formatPrice = (price) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);

const getPremiumImage = (productName) => {
  const n = productName.toLowerCase();
  if (n.includes('цемент'))      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80';
  if (n.includes('rotband') || n.includes('штукатурка')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80';
  if (n.includes('доска'))       return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
  if (n.includes('брус'))        return 'https://images.unsplash.com/photo-1520156480391-11597d6db64d?auto=format&fit=crop&w=800&q=80';
  if (n.includes('перфоратор'))  return 'https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=800&q=80';
  if (n.includes('шуруповерт'))  return 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=800&q=80';
  if (n.includes('tikkurila') || n.includes('краска интерьерная')) return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80';
  if (n.includes('эмаль') || n.includes('пф-115')) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
  if (n.includes('саморез'))     return 'https://images.unsplash.com/photo-1590236166418-498c199859f8?auto=format&fit=crop&w=800&q=80';
  if (n.includes('анкер') || n.includes('болт')) return 'https://images.unsplash.com/photo-1610962015564-3773c3736540?auto=format&fit=crop&w=800&q=80';
  return null;
};

const CATEGORY_LABELS = {
  mixes: 'Сухие смеси',
  lumber: 'Пиломатериалы',
  tools: 'Инструменты',
  paints: 'Краски',
  hardware: 'Крепеж',
};

export default function ProductModal({ product, onClose, onAddToCart }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const imageSrc = getPremiumImage(product.name) || product.image;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-slate-100 rounded-full shadow-md transition-all"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* ── Left: Image ── */}
            <div className="relative bg-slate-50 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none flex items-center justify-center p-8 min-h-[280px]">
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isHit && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 shadow-sm animate-pulse">
                    <Zap className="h-3 w-3 fill-current" /> Хит продаж
                  </span>
                )}
                {discount && (
                  <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase shadow-sm">
                    −{discount}%
                  </span>
                )}
              </div>

              <img
                src={imageSrc}
                alt={product.name}
                className="w-3/4 h-auto max-h-56 object-contain mix-blend-multiply drop-shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            {/* ── Right: Info ── */}
            <div className="p-6 md:p-7 flex flex-col">
              {/* Category breadcrumb */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mb-3">
                <span>Каталог</span>
                <ChevronRight className="h-3 w-3" />
                <span>{CATEGORY_LABELS[product.category] || product.category}</span>
              </div>

              {/* Name */}
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-3 font-outfit">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 text-sm">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {product.rating} · {product.reviews} отзывов
                </span>
              </div>

              {/* Description */}
              {product.description ? (
                <p className="text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50 rounded-2xl p-3.5">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic mb-4 bg-slate-50 rounded-2xl p-3.5">
                  Подробное описание товара отсутствует.
                </p>
              )}

              {/* Supplier block */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {product.supplier?.name || 'Официальный склад'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  Доставка: {product.supplier?.delivery || '1–2 дня'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  Склад: <strong className="text-slate-700 ml-1">Алматы</strong>
                  <span className="text-emerald-600 font-bold ml-1">· РК ✓</span>
                </div>
                {product.bulkDiscount && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-2.5 py-1.5 border border-emerald-100">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-semibold">{product.bulkDiscount}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-5">
                {product.oldPrice && (
                  <div className="text-sm text-slate-400 line-through mb-0.5">
                    {formatPrice(product.oldPrice)}
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{formatPrice(product.price)}</span>
                  <span className="text-sm text-slate-400 font-normal">/ шт</span>
                  {discount && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-lg">
                      экономия {formatPrice(product.oldPrice - product.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-auto space-y-2.5">
                <button
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25 hover:shadow-xl"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Добавить в корзину
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors"
                >
                  Продолжить покупки →
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom: extra trust badges ── */}
          <div className="border-t border-slate-100 px-6 py-4 grid grid-cols-3 gap-4">
            {[
              { icon: CheckCircle2, color: 'text-emerald-500', text: 'Оригинальный товар' },
              { icon: Truck, color: 'text-blue-500', text: 'Доставка по всему РК' },
              { icon: Package, color: 'text-amber-500', text: 'Прямой поставщик' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex flex-col items-center text-center gap-1.5">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-[11px] text-slate-500 font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
