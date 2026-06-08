import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ShoppingCart, ShieldCheck, Clock, MapPin, Star,
  Truck, Package, CheckCircle2, Tag, RefreshCw, ChevronRight,
} from 'lucide-react';
import { getProductById, getProductReviews } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from '../utils/productImage';
import { trackEvent } from '../utils/analytics';

const CATEGORY_LABELS = {
  mixes: 'Сухие смеси',
  lumber: 'Пиломатериалы',
  tools: 'Инструменты',
  paints: 'Краски',
  hardware: 'Крепеж',
};

const splitLines = (value) => {
  return value ? value.split('\n').map(line => line.trim()).filter(Boolean) : [];
};

export default function ProductPage({
  productId,
  onBackToCatalog,
  onAddToCart,
  showToast,
  onNavigate,
  categories = [],
  setSelectedCategory
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProductById(productId);
        setProduct(data);
        trackEvent('product_view', {
          productId: data.id,
          value: data.price,
          metadata: {
            name: data.name,
            category: data.category,
          },
        });
        try {
          const viewed = JSON.parse(localStorage.getItem('tormag_recently_viewed') || '[]');
          const filtered = viewed.filter(p => p.id !== data.id);
          filtered.unshift({
            id: data.id,
            name: data.name,
            price: data.price,
            oldPrice: data.oldPrice,
            image: data.image,
            category: data.category,
            supplier: data.supplier,
            isHit: data.isHit
          });
          localStorage.setItem('tormag_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
        } catch (e) {
          console.error('Error saving recently viewed product:', e);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Товар не найден');
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await getProductReviews(productId);
        setReviews(data);
      } catch (err) {
        console.error('Error loading product reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (productId) {
      loadProduct();
      loadReviews();
    }
  }, [productId]);

  const breadcrumbs = useMemo(() => {
    if (!product || !categories || categories.length === 0) return [];
    
    // Find the category of the product
    let currentCat = categories.find(c => c.id === product.categoryId || c.slug === product.category);
    
    if (!currentCat && product.categoryRelation) {
      currentCat = categories.find(c => c.id === product.categoryRelation.id);
    }
    
    if (!currentCat) return [];

    const path = [];
    let temp = currentCat;
    while (temp) {
      path.unshift(temp);
      if (temp.parentId) {
        const parent = categories.find(c => c.id === temp.parentId);
        temp = parent;
      } else {
        temp = null;
      }
    }
    return path;
  }, [product, categories]);

  const specs = useMemo(() => splitLines(product?.specifications), [product]);
  const usage = useMemo(() => splitLines(product?.usage), [product]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-bold uppercase tracking-wider">Загружаем страницу товара...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
        <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-slate-900 font-outfit mb-2">Товар не найден</h1>
        <p className="text-sm text-slate-500 mb-6">{error || 'Позиция отсутствует или была удалена поставщиком.'}</p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const imageSrc = getProductImage(product);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl py-3 px-4 sm:px-5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            onBackToCatalog();
          }}
          className="inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors text-xs font-bold shrink-0 cursor-pointer bg-transparent border-0 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>В каталог</span>
        </button>

        <div className="h-4 w-px bg-slate-200 shrink-0 mx-1" />

        <nav className="flex flex-wrap items-center text-xs font-semibold text-slate-400 font-sans leading-relaxed">
          <button
            onClick={() => onNavigate?.('home')}
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
          >
            Главная
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />
          <button
            onClick={() => {
              onBackToCatalog();
            }}
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
          >
            Каталог
          </button>
          {breadcrumbs.map((cat) => (
            <React.Fragment key={cat.id}>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />
              <button
                onClick={() => {
                  if (setSelectedCategory) setSelectedCategory(cat.slug || cat.id);
                }}
                className="hover:text-emerald-600 transition-colors text-left cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
              >
                {cat.name}
              </button>
            </React.Fragment>
          ))}
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />
          <span className="text-slate-800 font-bold truncate max-w-[150px] sm:max-w-[280px]">
            {product.name}
          </span>
        </nav>
      </div>

      <section className="bg-white border border-slate-200/70 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative min-h-[360px] bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="absolute top-5 left-5 flex flex-wrap gap-2">
              <span className="bg-white/90 border border-slate-200 text-slate-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              {product.isHit && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Хит продаж
                </span>
              )}
              {discount && (
                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  -{discount}%
                </span>
              )}
            </div>
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full max-w-md h-[280px] sm:h-[340px] object-contain drop-shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_PRODUCT_IMAGE;
              }}
            />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500">{product.rating} · {product.reviews} отзывов</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight font-outfit mb-4">
              {product.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {product.description || product.details || 'Поставщик пока не добавил подробное описание товара.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <ShieldCheck className="h-4 w-4 text-blue-500 mb-2" />
                <p className="text-[10px] uppercase font-bold text-slate-400">Поставщик</p>
                <p className="text-xs font-bold text-slate-800 truncate">{product.supplier?.name || 'Официальный склад'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <Clock className="h-4 w-4 text-emerald-600 mb-2" />
                <p className="text-[10px] uppercase font-bold text-slate-400">Доставка</p>
                <p className="text-xs font-bold text-slate-800">{product.supplier?.delivery || '1-2 дня'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <MapPin className="h-4 w-4 text-emerald-500 mb-2" />
                <p className="text-[10px] uppercase font-bold text-slate-400">Склад</p>
                <p className="text-xs font-bold text-slate-800">Алматы · РК</p>
              </div>
            </div>

            <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              {product.oldPrice && (
                <div className="text-sm text-slate-400 line-through mb-1">{formatPrice(product.oldPrice)}</div>
              )}
              <div className="flex flex-wrap items-end gap-2 mb-4">
                <span className="text-4xl font-black text-slate-950 font-outfit">{formatPrice(product.price)}</span>
                <span className="text-sm text-slate-400 pb-1">/ шт</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product);
                  showToast?.(`🛒 «${product.name}» добавлен в корзину`);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md transform hover:-translate-y-0.5"
              >
                <ShoppingCart className="h-5 w-5" />
                Добавить в корзину
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-2xl font-extrabold text-slate-950 font-outfit">Подробная информация</h2>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.details || product.description || 'Поставщик пока не добавил расширенную информацию по товару.'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-extrabold text-slate-950 font-outfit">Характеристики</h2>
          {specs.length > 0 ? (
            <dl className="space-y-3">
              {specs.map((line, index) => {
                const [label, ...rest] = line.split(':');
                return (
                  <div key={`${line}-${index}`} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <dt className="text-[10px] uppercase font-bold text-slate-400">{rest.length ? label : `Параметр ${index + 1}`}</dt>
                    <dd className="text-sm font-semibold text-slate-800 mt-0.5">{rest.length ? rest.join(':').trim() : line}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">Характеристики пока не заполнены.</p>
          )}
        </div>
      </section>

      {/* Reviews block */}
      <section className="bg-white border border-slate-200/70 rounded-[2rem] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-950 font-outfit">Отзывы покупателей ({reviews.length})</h2>
            <p className="text-slate-400 text-xs font-semibold">На основе покупок этого товара</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
              <span className="ml-1.5 font-outfit text-xl font-bold text-slate-900">{product.rating || '4.5'}</span>
            </div>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold text-slate-500">{product.reviews || '0'} оценок</span>
          </div>
        </div>

        {loadingReviews ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
            <span>Загружаем отзывы...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-sm font-bold text-slate-400">У этого товара пока нет отзывов.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Оставить отзыв могут только пользователи, купившие и получившие данный товар.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm font-outfit">{rev.user?.name}</span>
                      <span className="text-slate-300 text-[10px]">·</span>
                      <span className="text-slate-400 text-[11px] font-semibold">
                        {new Date(rev.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.user?.email && (
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100/80">
                      {rev.user.email}
                    </span>
                  )}
                </div>
                {rev.comment && (
                  <p className="text-sm text-slate-650 leading-relaxed mt-3 bg-slate-50/40 p-3.5 rounded-2xl border border-slate-100/60 font-medium">
                    {rev.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
