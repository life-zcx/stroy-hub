import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent, FileSpreadsheet,
  Hammer, HardHat, ChevronLeft, ChevronRight,
  Gift, UserPlus, LogIn, Percent, ShoppingCart, Heart, Sparkles, LayoutGrid
} from 'lucide-react';
import { getBrands, getHomePromotions, getProductsPage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { getProductImage, getIpxImageUrl, FALLBACK_PRODUCT_IMAGE, markImageFailed } from '../utils/productImage';
import KineticHeroBanner from '../components/KineticHeroBanner';


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

export default function Home({
  onNavigate,
  setSelectedCategory,
  categories = [],
  onAddToCart,
  onUpdateCartQuantity,
  cart = [],
  onToggleFavorite,
  isFavorite,
  onOpenDetails,
  customer,
  bonuses,
  onOpenAuth
}) {
  const [brands, setBrands] = useState([]);
  const [homePromotions, setHomePromotions] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow - now;
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Root categories are those with no parentId
  const rootCategories = categories.filter(cat => cat.parentId === null);

  const categoriesList = rootCategories.length > 0
    ? rootCategories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      desc: cat.slug === 'mixes' ? 'Цемент, штукатурка, шпатлевка' :
        cat.slug === 'lumber' ? 'Брус, доска, фанера' :
          cat.slug === 'tools' ? 'Дрели, перфораторы, диски' :
            cat.slug === 'paints' ? 'Интерьерные, фасадные, грунты' :
              cat.slug === 'hardware' ? 'Саморезы, анкеры, дюбели' : 'Строительные материалы',
      bg: cat.image || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop'
    }))
    : [
      { id: 'mixes', name: 'Сухие смеси', desc: 'Цемент, штукатурка, шпатлевка', bg: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop' },
      { id: 'lumber', name: 'Пиломатериалы', desc: 'Брус, доска, фанера', bg: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop' },
      { id: 'tools', name: 'Инструменты', desc: 'Дрели, перфораторы, диски', bg: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop' },
      { id: 'paints', name: 'Краски', desc: 'Интерьерные, фасадные, грунты', bg: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop' },
    ];

  const fallbackBrands = [
    { name: 'Bosch', desc: 'Проф. инструменты' },
    { name: 'Knauf', desc: 'Сухие смеси и ГКЛ' },
    { name: 'Tikkurila', desc: 'Премиум краски' },
    { name: 'Makita', desc: 'Японское качество' },
    { name: 'Технониколь', desc: 'Кровля и изоляция' },
    { name: 'Alina', desc: 'Казахстанский бренд' }
  ];

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setProductsLoading(true);
        const [loadedBrands, loadedPromotions, productsResult] = await Promise.all([
          getBrands(),
          getHomePromotions(),
          getProductsPage({ limit: 8, onlyHits: true })
        ]);

        if (!isMounted) {
          return;
        }

        setBrands(loadedBrands);
        setHomePromotions(loadedPromotions);
        setPopularProducts(productsResult?.data || []);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setBrands([]);
          setHomePromotions([]);
          setPopularProducts([]);
        }
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleHeroSlideChange = useCallback((slideIndex) => {
    const dealsCount = Math.min(popularProducts.slice(0, 3).length, 3);
    if (dealsCount > 0) {
      setCurrentDealIndex(slideIndex % dealsCount);
    }
  }, [popularProducts]);




  // Touch Swipe support for Product of the Day deals
  const [dealTouchStart, setDealTouchStart] = useState(null);
  const [dealTouchEnd, setDealTouchEnd] = useState(null);

  const handleDealTouchStart = (e) => {
    setDealTouchEnd(null);
    setDealTouchStart(e.targetTouches[0].clientX);
  };

  const handleDealTouchMove = (e) => {
    setDealTouchEnd(e.targetTouches[0].clientX);
  };

  const handleDealTouchEnd = (dealsCount) => {
    if (!dealTouchStart || !dealTouchEnd || dealsCount <= 1) return;
    const distance = dealTouchStart - dealTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setCurrentDealIndex((prev) => (prev + 1) % dealsCount);
    } else if (isRightSwipe) {
      setCurrentDealIndex((prev) => (prev - 1 + dealsCount) % dealsCount);
    }
  };

  useEffect(() => {
    // Set descriptive title and meta description for SEO
    const prevTitle = document.title;
    document.title = "TORMAG — Строительная B2B-платформа в Алматы | Купить стройматериалы оптом";

    let metaDesc = document.querySelector('meta[name="description"]');
    let createdMeta = false;
    const prevMetaContent = metaDesc ? metaDesc.getAttribute('content') : '';

    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
      createdMeta = true;
    }
    metaDesc.setAttribute('content', 'Строительная B2B-платформа TORMAG в Алматы. Прямые оптовые поставки строительных материалов от ведущих дистрибьюторов по выгодным ценам. Доставка по Алматы и Казахстану.');

    // Add Organization Schema JSON-LD
    const oldScript = document.getElementById('jsonld-org-schema');
    if (oldScript) {
      oldScript.remove();
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "TORMAG",
      "url": "https://tormag.kz",
      "logo": "https://tormag.kz/src/favicon.png",
      "description": "Строительная B2B-платформа TORMAG в Алматы. Прямые оптовые поставки строительных материалов от ведущих дистрибьюторов.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Алматы",
        "addressCountry": "KZ"
      }
    };

    const script = document.createElement('script');
    script.id = 'jsonld-org-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (metaDesc) {
        if (createdMeta) {
          metaDesc.remove();
        } else {
          metaDesc.setAttribute('content', prevMetaContent);
        }
      }
      const addedScript = document.getElementById('jsonld-org-schema');
      if (addedScript) {
        addedScript.remove();
      }
    };
  }, []);

  const brandLogos = brands.length > 0
    ? brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      desc: brand.description,
      logo: brand.logo,
    }))
    : fallbackBrands;

  return (
    <div className="space-y-20 animate-fade-in-up font-sans text-slate-800">

      {/* 🚀 HYBRID HERO SECTION: KINETIC GSAP SLIDER + LOYALTY WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <KineticHeroBanner
          homePromotions={homePromotions}
          onNavigate={onNavigate}
          onSlideChange={handleHeroSlideChange}
        />

        {/* Right Column: Product of the Day Deals Carousel (lg:col-span-4) - styled exactly like Technodom */}
        <div 
          onTouchStart={handleDealTouchStart}
          onTouchMove={handleDealTouchMove}
          onTouchEnd={() => handleDealTouchEnd(Math.min(popularProducts.slice(0, 3).length, 3))}
          className="lg:col-span-4 flex flex-col justify-between rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-7 pb-14 sm:pb-12 relative overflow-hidden shadow-sm h-full text-slate-800 group/deal"
        >
          {(() => {
            const deals = popularProducts.slice(0, 3);
            return (
              <>
                {/* Header: Title and Countdown boxes */}
                <div className="flex items-center justify-between pb-3 mb-4 z-10 relative">
                  <h3 className="font-extrabold text-slate-900 text-[15px] font-sans">Товар дня</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-[13px] text-center tracking-tight">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-slate-700 font-bold text-xs">:</span>
                    <span className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-[13px] text-center tracking-tight">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-slate-700 font-bold text-xs">:</span>
                    <span className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-[13px] text-center tracking-tight">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {deals.length > 0 ? (() => {
                  const product = deals[currentDealIndex] || deals[0];
                  const imageSrc = getProductImage(product);
                  const isFav = isFavorite?.(product);

                  return (
                    <div className="flex flex-col justify-between flex-grow text-slate-850 z-10 relative">
                      
                      {/* Product Image zone with navigation chevrons and Favorite heart */}
                      <div className="relative h-44 sm:h-48 flex items-center justify-center bg-transparent rounded-2xl w-full mb-3 overflow-hidden">
                        
                        {/* Favorite button */}
                        <button
                          type="button"
                          aria-label="Добавить в избранное"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite?.(product);
                          }}
                          className={`absolute top-2 right-2 z-30 p-2 rounded-full transition-all shadow-sm ${
                            isFav 
                              ? 'bg-rose-500 text-white' 
                              : 'bg-white hover:text-rose-500 text-slate-400 border border-slate-100'
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                        </button>

                        {/* Chevrons */}
                        {deals.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentDealIndex(prev => (prev - 1 + deals.length) % deals.length);
                              }}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full border border-slate-200/80 shadow-sm transition-all duration-200 z-30 cursor-pointer active:scale-95 opacity-0 group-hover/deal:opacity-100"
                              title="Предыдущий товар"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentDealIndex(prev => (prev + 1) % deals.length);
                              }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full border border-slate-200/80 shadow-sm transition-all duration-200 z-30 cursor-pointer active:scale-95 opacity-0 group-hover/deal:opacity-100"
                              title="Следующий товар"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        <Link
                          href={getPageHref('product', product.slug || product.id)}
                          onClick={() => onOpenDetails?.(product.slug || product.id)}
                          className="w-full h-full flex items-center justify-center cursor-pointer p-2"
                        >
                          <img 
                            src={imageSrc} 
                            alt={product.name || 'Товар дня TORMAG'} 
                            width="300"
                            height="300"
                            fetchpriority="high"
                            decoding="async"
                            className="max-h-full max-w-full object-contain" 
                            onError={(e) => {
                              e.target.onerror = null;
                              if (product?.image) markImageFailed(product.image);
                              e.target.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                          />
                        </Link>
                      </div>

                      {/* Product details (Title and Price left-aligned) */}
                      <Link
                        href={getPageHref('product', product.slug || product.id)}
                        onClick={() => onOpenDetails?.(product.slug || product.id)}
                        className="flex flex-col text-left group/deal cursor-pointer justify-end mb-3"
                      >
                        <h4 className="text-slate-700 text-xs sm:text-sm leading-snug group-hover/deal:text-blue-700 transition-colors line-clamp-2 mb-1.5 font-medium">
                          {product.name}
                        </h4>

                        <div>
                          <span className="text-xl font-extrabold text-slate-900 font-outfit tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>

                      {/* Unified brand blue button */}
                      <button
                        type="button"
                        onClick={() => onAddToCart?.(product, 1)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer border-0 mt-auto z-20"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>В корзину</span>
                      </button>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs font-semibold gap-2 h-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-transparent" />
                    Загружаем предложения...
                  </div>
                )}

                {/* Indicators at the exact same bottom baseline as hero slider */}
                {deals.length > 0 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                    {deals.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentDealIndex(idx);
                        }}
                        className="w-8 h-8 p-0 flex items-center justify-center transition-all duration-300 cursor-pointer border-0 bg-transparent"
                        title={`Товар ${idx + 1}`}
                        aria-label={`Товар ${idx + 1}`}
                      >
                        <span
                          className={`h-2 rounded-full transition-all duration-500 ${
                            currentDealIndex === idx
                              ? 'w-7 bg-slate-900'
                              : 'w-2 bg-slate-300/80 hover:bg-slate-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>




      {/* 📂 QUICK CATEGORIES PREVIEW */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Популярные категории</h2>
            <p className="text-slate-600 font-semibold text-sm">Самые востребованные строительные материалы этого сезона</p>
          </div>
          <Link
            href={getPageHref('catalog')}
            onClick={() => {
              setSelectedCategory('all');
              onNavigate('catalog');
            }}
            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Смотреть весь каталог
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {(rootCategories.length > 0 ? rootCategories : categoriesList).map((cat) => {
            const imageSrc = cat.image || cat.bg;
            return (
              <Link
                key={cat.id || cat.slug}
                href={getPageHref('catalog', null, cat.slug || cat.id)}
                onClick={() => setSelectedCategory(cat.slug || cat.id)}
                className="relative w-full h-32 sm:h-44 md:h-52 lg:h-56 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 active:scale-[0.99] cursor-pointer block"
              >
                {imageSrc ? (
                  <>
                    <img
                      src={getIpxImageUrl(imageSrc, '400x300')}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackEl = e.target.parentElement?.querySelector('.category-fallback-box');
                        if (fallbackEl) fallbackEl.classList.remove('hidden');
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/25 to-transparent" />
                  </>
                ) : null}

                {/* Clean Light Fallback Card (when image is missing) */}
                <div className={`category-fallback-box ${imageSrc ? 'hidden' : ''} absolute inset-0 bg-slate-100 p-3 sm:p-4 flex flex-col justify-end text-left`}>
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center mb-auto">
                    <LayoutGrid className="h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Category Title directly overlayed at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 text-left z-10">
                  <h3 className={`text-sm sm:text-base md:text-xl font-extrabold leading-tight font-outfit ${imageSrc ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>
                    {cat.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 🔥 POPULAR PRODUCTS / HITS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Популярные товары</h2>
            <p className="text-slate-600 font-semibold text-sm">Хиты продаж и востребованные строительные материалы</p>
          </div>
          <Link
            href={getPageHref('catalog')}
            onClick={() => {
              setSelectedCategory('all');
              onNavigate('catalog');
            }}
            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Смотреть все товары
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6 items-start min-h-[380px]">
          {productsLoading ? (
            <ProductSkeleton count={8} />
          ) : (
            popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateCartQuantity}
                cartQuantity={cart.find(i => i.id === product.id)?.quantity || 0}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite ? isFavorite(product) : false}
                onNavigate={onNavigate}
              />
            ))
          )}
        </div>
      </section>

      {/* 🛡️ KEY STRENGTHS (ПРЕИМУЩЕСТВА) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Почему выбирают TORMAG?</h2>
          <p className="text-slate-700 font-bold text-sm">Мы меняем подход к закупке строительных материалов в Казахстане</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-emerald">
              <Award className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Цены дистрибьюторов</h3>
            <p className="text-slate-800 text-xs font-semibold leading-relaxed">
              Вы заказываете товары напрямую с официальных региональных складов брендов, исключая наценки розничных магазинов.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-blue">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">100% Гарантия бренда</h3>
            <p className="text-slate-800 text-xs font-semibold leading-relaxed">
              Все поставщики проходят жесткую модерацию. Предоставляем сертификаты соответствия на каждую партию товара.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-violet">
              <Truck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Быстрая доставка</h3>
            <p className="text-slate-800 text-xs font-semibold leading-relaxed">
              Собственная курьерская сеть и грузовой транспорт гарантируют доставку в течение 24 часов с момента подтверждения.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-green">
              <Building2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Удобно для бизнеса</h3>
            <p className="text-slate-800 text-xs font-semibold leading-relaxed">
              Полный пакет закрывающих документов для ТОО и ИП. Работаем с НДС, предоставляем отсрочку платежа постоянным клиентам.
            </p>
          </div>

        </div>
      </section>


      {/* 🛠️ WIDGET TEASER CARD */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-600/20 rounded-[2.5rem] p-8 md:p-12 text-left flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="space-y-4 max-w-xl relative z-10">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 font-outfit">Затрудняетесь с выбором материалов?</h3>
          <p className="text-slate-800 text-xs md:text-sm leading-relaxed font-semibold">
            Воспользуйтесь нашим интерактивным умным калькулятором. Укажите тип ваших строительных или отделочных работ, выберите подходящий бюджетный уровень — и система мгновенно сформирует идеальный комплект товаров со складов в Алматы.
          </p>
        </div>
        <Link
          href={getPageHref('advisor')}
          onClick={() => onNavigate('advisor')}
          className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shrink-0 z-10"
        >
          Рассчитать материалы
          <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-600" />
        </Link>
      </section>

      {/* 🏢 BRANDS GRID */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Официальные бренды-партнеры</h2>
          <p className="text-slate-600 font-semibold text-sm">Материалы от ведущих казахстанских и мировых заводов-производителей</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {brandLogos.map((brand, i) => (
            <div
              key={brand.id || i}
              className="bg-white border border-slate-350 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-650 hover:shadow-md transition-all group"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} width="120" height="48" loading="lazy" decoding="async" className="h-12 max-w-[120px] object-contain mb-3 transition-all" />
              ) : null}
              <span className="font-black text-slate-800 group-hover:text-slate-950 text-lg transition-colors tracking-tight font-outfit">{brand.name}</span>
              <span className="text-[10px] text-slate-600 font-semibold mt-1 block">{brand.desc}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
