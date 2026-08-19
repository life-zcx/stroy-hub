import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent, FileSpreadsheet,
  Hammer, HardHat, ChevronLeft, ChevronRight,
  Gift, UserPlus, LogIn, Percent, ShoppingCart, Heart, Sparkles, LayoutGrid
} from 'lucide-react';
import { getBrands, getHomePromotions, getProductsPage, getPublicBanners } from '../services/api';
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
  const [banners, setBanners] = useState([]);
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
        const [loadedBrands, loadedPromotions, loadedBanners, productsResult] = await Promise.all([
          getBrands(),
          getHomePromotions(),
          getPublicBanners(),
          getProductsPage({ limit: 8, onlyHits: true })
        ]);

        if (!isMounted) {
          return;
        }

        setBrands(loadedBrands);
        setHomePromotions(loadedPromotions);
        setBanners(loadedBanners);
        setPopularProducts(productsResult?.data || []);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setBrands([]);
          setHomePromotions([]);
          setBanners([]);
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

      {/* 🚀 HYBRID HERO SECTION: KINETIC GSAP SLIDER */}
      <div className="w-full">
        <KineticHeroBanner
          banners={banners}
          homePromotions={homePromotions}
          loading={productsLoading}
          onNavigate={onNavigate}
          onSlideChange={handleHeroSlideChange}
        />

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {(rootCategories.length > 0 ? rootCategories : categoriesList).map((cat) => {
            const descendantIds = new Set();
            const descendantSlugs = new Set();
            const collectDescendants = (cId, cSlug) => {
              if (cId) descendantIds.add(cId);
              if (cSlug) descendantSlugs.add(cSlug);
              (categoriesList || []).filter(ch => ch.parentId === cId).forEach(ch => collectDescendants(ch.id, ch.slug));
            };
            collectDescendants(cat.id, cat.slug);

            let count = cat.totalProductsCount ?? cat._count?.products;
            if (!count || count === 0) {
              let totalSum = 0;
              (categoriesList || []).forEach(c => {
                if (descendantIds.has(c.id) && c._count?.products) {
                  totalSum += c._count.products;
                }
              });
              if (totalSum > 0) {
                count = totalSum;
              } else {
                const matchedProds = (popularProducts || []).filter(p => descendantSlugs.has(p.category) || descendantIds.has(p.categoryId) || descendantSlugs.has(p.categoryRelation?.slug));
                count = matchedProds.length;
              }
            }
            
            const formatCount = (num) => {
              if (num === null || num === undefined) return 'Каталог';
              const n = Number(num);
              const mod10 = n % 10;
              const mod100 = n % 100;
              let word = 'товаров';
              if (mod100 >= 11 && mod100 <= 19) word = 'товаров';
              else if (mod10 === 1) word = 'товар';
              else if (mod10 >= 2 && mod10 <= 4) word = 'товара';
              return `${n.toLocaleString('ru-RU')} ${word}`;
            };

            const catProducts = (popularProducts || []).filter(p => descendantSlugs.has(p.category) || descendantIds.has(p.categoryId) || descendantSlugs.has(p.categoryRelation?.slug));
            const firstProdImg = catProducts[0]?.image || catProducts[0]?.images?.[0];
            const imageSrc = cat.image || cat.bg || firstProdImg;
            const optimizedSrc = imageSrc ? getIpxImageUrl(imageSrc, '300x300') : null;

            return (
              <Link
                key={cat.id || cat.slug}
                href={getPageHref('catalog', null, cat.slug || cat.id)}
                onClick={() => setSelectedCategory(cat.slug || cat.id)}
                className="bg-[#f3f4f6] hover:bg-[#eaecef] rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 flex flex-col justify-between h-[200px] sm:h-[220px] lg:h-[235px] text-left transition-all duration-200 cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-0.5 z-10 text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 break-words [word-break:break-word] overflow-hidden" title={cat.name}>
                    {cat.name}
                  </h3>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-400 block mt-0.5">
                    {formatCount(count)}
                  </span>
                </div>

                <div className="w-full h-28 sm:h-32 lg:h-36 flex items-center justify-center mt-auto p-1 overflow-hidden">
                  {optimizedSrc ? (
                    <img
                      src={optimizedSrc}
                      alt={cat.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply contrast-[1.08] brightness-[1.04]"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackEl = e.target.parentElement?.querySelector('.cat-fallback');
                        if (fallbackEl) fallbackEl.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`cat-fallback ${optimizedSrc ? 'hidden' : ''} w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-200/60 shadow-2xs flex items-center justify-center text-slate-400`}>
                    <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 stroke-[1.6]" />
                  </div>
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
        <div className="text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Почему стоит заказать материалы именно у нас?</h2>
          <p className="text-slate-600 font-semibold text-sm">Мы меняем подход к закупке строительных материалов в Казахстане</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-200 p-7 sm:p-8 rounded-[2rem] text-left space-y-4 transition-all duration-300 shadow-2xs hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 group-hover:border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs transition-colors">
              <Award className="h-6.5 w-6.5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit group-hover:text-blue-600 transition-colors">Цены дистрибьюторов</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                Прямые поставки — вы заказываете товары напрямую с официальных региональных складов брендов, исключая наценки розничных магазинов.
              </p>
            </div>
          </div>

          <div className="bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-200 p-7 sm:p-8 rounded-[2rem] text-left space-y-4 transition-all duration-300 shadow-2xs hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 group-hover:border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs transition-colors">
              <ShieldCheck className="h-6.5 w-6.5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit group-hover:text-blue-600 transition-colors">100% Гарантия бренда</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                Гарантия качества — все поставщики проходят жесткую модерацию. Предоставляем сертификаты соответствия на каждую партию.
              </p>
            </div>
          </div>

          <div className="bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-200 p-7 sm:p-8 rounded-[2rem] text-left space-y-4 transition-all duration-300 shadow-2xs hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 group-hover:border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs transition-colors">
              <Truck className="h-6.5 w-6.5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit group-hover:text-blue-600 transition-colors">Быстрая доставка</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                Собственная курьерская сеть и грузовой транспорт гарантируют оперативную доставку по Алматы и области.
              </p>
            </div>
          </div>

          <div className="bg-slate-50/90 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-200 p-7 sm:p-8 rounded-[2rem] text-left space-y-4 transition-all duration-300 shadow-2xs hover:shadow-md group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 group-hover:border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs transition-colors">
              <Building2 className="h-6.5 w-6.5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit group-hover:text-blue-600 transition-colors">Удобно для бизнеса</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                Полный пакет закрывающих документов для ТОО и ИП. Работаем с НДС, предоставляем отсрочку платежа постоянным клиентам.
              </p>
            </div>
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
