import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, HardHat, RefreshCw, TicketPercent } from 'lucide-react';
import { getPublicPromotions, getProducts } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import ProductCard from '../components/ProductCard';

const THEME_GRADIENTS = {
  emerald: 'from-emerald-500 to-teal-600',
  ocean: 'from-sky-500 to-blue-600',
  sunset: 'from-amber-500 to-orange-600',
  royal: 'from-indigo-500 to-violet-600',
  graphite: 'from-slate-700 to-slate-900',
  rose: 'from-rose-500 to-pink-600',
};

function getThemeGradient(theme) {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.emerald;
}

function formatDateTime(value) {
  if (!value) {
    return 'Без ограничения по сроку';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPromotionPeriod(promotion) {
  if (promotion.startsAt && promotion.endsAt) {
    return `до ${formatDateTime(promotion.endsAt)}`;
  }

  if (promotion.endsAt) {
    return `до ${formatDateTime(promotion.endsAt)}`;
  }

  if (promotion.startsAt) {
    return `с ${formatDateTime(promotion.startsAt)}`;
  }

  return 'Бессрочная акция';
}

function getPromotionImage(promotion) {
  if (promotion.image) {
    return promotion.image;
  }
  const title = promotion?.title?.toLowerCase() || '';
  if (title.includes('дрел') || title.includes('сверл') || title.includes('инструмент')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop';
  }
  if (title.includes('первый') || title.includes('заказ') || title.includes('скидк')) {
    return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop';
  }
  if (title.includes('доставк') || title.includes('логистик')) {
    return 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop';
}

export default function Promotions({
  promotionId,
  onNavigate,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  onOpenCallback
}) {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const activePromotionId = promotionId ? Number(promotionId) : null;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [promoData, productData] = await Promise.all([
          getPublicPromotions(),
          getProducts({ limit: 100 })
        ]);
        if (isMounted) {
          setPromotions(promoData);
          setProducts(productData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPromo = promotions.find(p => p.id === activePromotionId);

  // Render detail view
  if (selectedPromo) {
    // Filter products targeting this promotion
    const promoProducts = products.filter(p => 
      selectedPromo.targetProductIds?.includes(p.id) || 
      selectedPromo.targetCategoryIds?.includes(p.categoryId)
    );

    // Fallback hit products if general promo
    const hitProducts = products.filter(p => p.isHit).slice(0, 3);
    const displayProducts = promoProducts.length > 0 ? promoProducts : hitProducts;

    return (
      <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center text-xs font-semibold text-slate-400 font-sans leading-relaxed">
          <button 
            onClick={() => onNavigate?.('home')} 
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
          >
            Главная
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-1 shrink-0" />
          <button 
            onClick={() => onNavigate?.('promotions')} 
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
          >
            Акции
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-1 shrink-0" />
          <span className="text-slate-900 font-extrabold truncate max-w-xs sm:max-w-md">{selectedPromo.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit leading-tight">
          {selectedPromo.title}
        </h1>

        {/* Big Banner Image */}
        <div className="aspect-[21/9] w-full overflow-hidden rounded-[2.5rem] border border-slate-200/80 shadow-sm relative bg-slate-100">
          {selectedPromo.imageDetail || selectedPromo.image ? (
            <img 
              src={selectedPromo.imageDetail || selectedPromo.image} 
              alt={selectedPromo.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getThemeGradient(selectedPromo.theme)} flex flex-col items-center justify-center text-white p-6`}>
              <span className="text-4xl sm:text-6xl font-black font-outfit uppercase tracking-tight drop-shadow-md select-none">
                -{selectedPromo.discountValue}{selectedPromo.discountType === 'PERCENT' ? '%' : ' ₸'}
              </span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 px-3.5 py-1.5 rounded-xl mt-3 backdrop-blur-md border border-white/10 select-none">
                {selectedPromo.badge || (selectedPromo.promoCode ? 'По промокоду' : 'Спецпредложение')}
              </span>
            </div>
          )}
          {selectedPromo.promoCode && (
            <div 
              onClick={() => {
                navigator.clipboard.writeText(selectedPromo.promoCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="absolute top-6 right-6 bg-slate-950/75 backdrop-blur-xl border border-white/10 text-white rounded-[1.5rem] p-4 flex flex-col items-center gap-1.5 shadow-2xl hover:bg-slate-950/85 transition-all duration-300 cursor-pointer select-none active:scale-95"
              title="Нажмите, чтобы скопировать"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-350">
                <TicketPercent className="h-3.5 w-3.5 text-emerald-400" />
                <span>{copied ? 'Скопировано!' : 'Промокод'}</span>
              </div>
              <span className={`font-mono text-sm font-black tracking-widest px-3.5 py-1.5 rounded-xl border transition-all duration-300 ${copied ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 scale-102' : 'bg-white/10 border-white/5 text-yellow-300'}`}>
                {selectedPromo.promoCode}
              </span>
            </div>
          )}
        </div>

        {/* Form Callout */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <p className="text-sm font-bold text-slate-700 leading-relaxed text-left max-w-xl">
            Оформите заявку на сайте, мы свяжемся с вами в ближайшее время и ответим на все интересующие вопросы.
          </p>
          <button
            onClick={onOpenCallback}
            className="w-full md:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md text-xs uppercase tracking-wider shrink-0 cursor-pointer"
          >
            Заказать услугу
          </button>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-base text-slate-800 leading-relaxed font-bold">
            {selectedPromo.description}
          </p>
          <p className="text-slate-500 text-sm leading-relaxed font-semibold">
            В рамках данной акции вы получаете уникальную возможность приобрести высококачественные материалы и инструменты с дополнительной скидкой или приятным подарком. Наша компания гарантирует оперативную доставку и высочайший уровень сервиса. Торопитесь, предложение ограничено!
          </p>
        </div>

        {/* Promoted Products */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <h3 className="text-xl font-extrabold text-slate-900 font-outfit">
            {promoProducts.length > 0 ? 'Товары по акции' : 'Популярные товары'}
          </h3>
          {promoProducts.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 -mt-3">Эта акция распространяется на все товары в нашем каталоге. Ознакомьтесь с нашими хитами продаж:</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenDetails={(id) => onNavigate('product', id)}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite?.(product.id)}
              />
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="space-y-3 pt-6 border-t border-slate-100 pb-12">
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-outfit">Условия проведения акций</h4>
          <ul className="list-disc pl-4 text-xs text-slate-500 space-y-1.5 font-semibold leading-relaxed">
            <li>Скидки по промокодам и акциям не суммируются между собой.</li>
            <li>Акционные предложения и подарки действительны, пока товар есть в наличии.</li>
            <li>Подробную консультацию по условиям и стоимости доставки акционных товаров вы можете получить у менеджера при подтверждении заказа.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Promotions Discount Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Discount tags and stars */}
          <path d="M40 20 L60 20 L80 40 L60 60 L40 60 Z" fill="currentColor" fillOpacity="0.05" />
          <circle cx="50" cy="30" r="3" fill="currentColor" />

          {/* Sparkles */}
          <path d="M90 20 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z" fill="currentColor" fillOpacity="0.2" />
          <path d="M25 50 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z" fill="currentColor" fillOpacity="0.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Акции и скидки
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Сезонные спецпредложения, распродажи и промокоды на строительные материалы и инструменты
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((item) => (
            <div key={item} className="space-y-4 animate-pulse">
              <div className="aspect-[16/9] w-full bg-slate-200 rounded-[2rem]" />
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <TicketPercent className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Сейчас активных акций нет</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">
            Как только менеджеры запустят новую скидку или промокод через панель управления, она автоматически появится на этой странице.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              onClick={() => onNavigate?.('promotions', promotion.id)}
              className="group cursor-pointer space-y-4 text-left"
            >
              <div className="aspect-[16/9] w-full overflow-hidden rounded-[2rem] border border-slate-200/80 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-emerald-500/20 relative bg-slate-50">
                {promotion.imageCard || promotion.image ? (
                  <img
                    src={promotion.imageCard || promotion.image}
                    alt={promotion.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getThemeGradient(promotion.theme)} flex flex-col items-center justify-center text-white p-4 group-hover:scale-105 transition-transform duration-500`}>
                    <span className="text-3xl font-black font-outfit drop-shadow-sm select-none">
                      -{promotion.discountValue}{promotion.discountType === 'PERCENT' ? '%' : ' ₸'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-lg mt-2.5 backdrop-blur-md border border-white/10 select-none">
                      {promotion.badge || (promotion.promoCode ? 'По промокоду' : 'Скидка')}
                    </span>
                  </div>
                )}
                {promotion.discountValue > 0 && (promotion.imageCard || promotion.image) && (
                  <span className="absolute bottom-4 left-4 bg-yellow-300 border border-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    -{promotion.discountValue}{promotion.discountType === 'PERCENT' ? '%' : ' ₸'}
                  </span>
                )}
              </div>
              <div className="space-y-1 pl-1">
                <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-600 transition-colors">
                  {promotion.title}
                </h3>
                <p className="text-slate-400 text-xs font-semibold flex items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatPromotionPeriod(promotion)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
