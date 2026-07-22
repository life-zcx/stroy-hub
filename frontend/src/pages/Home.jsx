import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent, FileSpreadsheet,
  Hammer, HardHat, ChevronLeft, ChevronRight,
  Gift, UserPlus, LogIn, Percent, ShoppingCart, Heart
} from 'lucide-react';
import { getBrands, getHomePromotions, getProductsPage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { getProductImage } from '../utils/productImage';

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
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3 + homePromotions.length;

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

  useEffect(() => {
    if (totalSlides <= 1) return;
    const slideTimer = setInterval(() => {
      // Auto-advance main banner
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
      // Auto-advance Product of the Day (synchronized only on autoplay)
      const dealsCount = Math.min(popularProducts.slice(0, 3).length, 3);
      if (dealsCount > 0) {
        setCurrentDealIndex((prev) => (prev + 1) % dealsCount);
      }
    }, 10000);
    return () => clearInterval(slideTimer);
  }, [totalSlides, popularProducts, currentSlide, currentDealIndex]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Touch Swipe support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

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

      {/* 🚀 HYBRID HERO SECTION: SLIDER + LOYALTY WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="lg:col-span-8 relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/85 px-4 sm:px-8 md:px-10 py-6 sm:py-8 pb-14 sm:pb-12 group/hero h-[430px] sm:h-[450px] lg:h-[480px] flex items-center shadow-sm text-slate-800"
        >
          {/* Soft, beautiful ambient glowing spheres (SaaS style) */}
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute top-10 -right-40 w-[600px] h-[600px] rounded-full bg-blue-50/30 blur-[150px] pointer-events-none z-0"></div>

          {/* ── Slide 1: Main USP ── */}
          {currentSlide === 0 && (
            <div className="w-full h-full flex-shrink-0 animate-fade-in relative z-10 flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch w-full h-full py-2">
                {/* Left Column: Text Content */}
                <div className="lg:col-span-12 flex flex-col justify-between text-left h-full w-full">
                  <div className="space-y-3.5">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                      Всё для стройки <br />
                      <span className="text-blue-600">
                        и ремонта
                      </span>
                    </h1>
                    
                    <div className="space-y-2 md:space-y-3">
                      <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                        Прямые поставки строительных материалов <span className="text-blue-600 font-extrabold">от ведущих дистрибьюторов Казахстана</span>
                      </p>
                      
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                        Комплексное снабжение строительных объектов, гарантированное качество и прозрачные оптовые условия для вашего бизнеса.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                    <Link
                      href={getPageHref('catalog')}
                      onClick={() => onNavigate('catalog')}
                      className="w-full sm:w-auto justify-center px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
                    >
                      <span>Перейти в каталог</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                    <Link
                      href={getPageHref('estimate')}
                      onClick={() => onNavigate('estimate')}
                      className="w-full sm:w-auto justify-center px-6 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <span>Заказ по смете</span>
                      <ArrowRight className="h-4.5 w-4.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Slide 2: Loyalty Info (TORMAG Club) ── */}
          {currentSlide === 1 && (
            <div className="w-full h-full flex-shrink-0 animate-fade-in relative z-10 text-slate-800 flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch w-full h-full py-2">
                {/* Left Column */}
                <div className="lg:col-span-7 flex flex-col justify-between text-left h-full w-full">
                  <div className="space-y-3.5">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                      Программа лояльности <span className="text-blue-600">TORMAG Club</span>
                    </h1>
                    
                    <div className="space-y-2.5">
                      <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug font-outfit border-l-4 border-slate-800/80 pl-4">
                        Накапливайте кешбэк до 5% и оплачивайте бонусами до 100% от стоимости ваших заказов
                      </p>
                      
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-lg pl-5">
                        Статус рассчитывается автоматически на основе общей суммы ваших выполненных заказов за текущий календарный год.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                    <Link
                      href={getPageHref('cashback')}
                      onClick={() => onNavigate('cashback')}
                      className="w-full sm:w-auto justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer border-0"
                    >
                      <span>Узнать подробнее</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                </div>

                {/* Right Column: Loyalty Info Card list (Clean classical horizontal rows) */}
                <div className="hidden lg:flex relative lg:col-span-5 space-y-3 z-10 w-full flex-col justify-center">
                  {/* Tier 1 */}
                  <div className="bg-white border border-slate-200/60 px-5 py-3 rounded-2xl shadow-sm text-left group">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-slate-950 text-xs sm:text-sm">Уровень «Участник»</h4>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 rounded-lg text-slate-550 shrink-0">
                        Базовый
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-semibold">
                      Кешбэк <span className="text-blue-600 font-bold">3%</span> • Оплата бонусами до <span className="text-blue-600 font-bold">50%</span> заказа
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className="bg-white border border-slate-200/60 px-5 py-3 rounded-2xl shadow-sm text-left group">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-slate-950 text-xs sm:text-sm">Уровень «Резидент»</h4>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                        от 500 тыс. ₸
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-semibold">
                      Кешбэк <span className="text-blue-600 font-bold">4%</span> • Оплата бонусами до <span className="text-blue-600 font-bold">75%</span> заказа
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-white border border-slate-200/60 px-5 py-3 rounded-2xl shadow-sm text-left group">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-extrabold text-slate-950 text-xs sm:text-sm">Уровень «Партнёр»</h4>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                        от 2 млн. ₸
                      </span>
                    </div>
                    <p className="text-slate-555 text-[11px] font-semibold">
                      Кешбэк <span className="text-blue-600 font-bold">5%</span> • Оплата бонусами до <span className="text-blue-600 font-bold">100%</span> заказа
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Slide 3: Review Promo ── */}
          {currentSlide === 2 && (
            <div className="w-full h-full flex-shrink-0 animate-fade-in relative z-10 text-slate-800 flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full h-full px-8 sm:px-10 md:px-12 py-6">
                {/* Left Column */}
                <div className="lg:col-span-12 flex flex-col justify-between text-left h-full w-full">
                  <div className="space-y-3.5">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight font-outfit">
                      Скидка 10% <br />
                      <span className="text-blue-600">
                        за ваш отзыв!
                      </span>
                    </h1>
                    
                    <div className="space-y-3">
                      <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                        Оцените ваши прошлые покупки и сэкономьте на следующих заказах
                      </p>
                      
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                        Помогите другим прорабам и закупщикам сделать правильный выбор! Напишите честный отзыв к любому купленному товару в вашем личном кабинете, и мы мгновенно вышлем вам промокод.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                    <Link
                      href={getPageHref('orders')}
                      onClick={() => onNavigate('orders')}
                      className="w-full sm:w-auto justify-center px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer border-0"
                    >
                      <span>Оценить покупки</span>
                      <Award className="h-4.5 w-4.5 text-white" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Slide 4+ Dynamic Promotions ── */}
          {currentSlide >= 3 && homePromotions[currentSlide - 3] && (() => {
            const promo = homePromotions[currentSlide - 3];
            
            // If the promo has an image, render it as a full-bleed banner card covering 100% of the slider container
            if (promo.image) {
              return (
                <Link
                  href={getPageHref('promotions', promo.id)}
                  onClick={() => onNavigate('promotions', promo.id)}
                  className="absolute inset-0 w-full h-full block cursor-pointer group z-10"
                >
                  <img 
                    src={promo.image} 
                    alt={promo.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]" 
                  />
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  
                  {/* Action Button positioned over the image */}
                  <div className="absolute bottom-12 left-6 sm:bottom-12 sm:left-10 lg:bottom-8 lg:left-12 z-20">
                    <span
                      className="inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl shadow-md transform hover:-translate-y-0.5 text-[10px] sm:text-xs uppercase tracking-wider border-0"
                    >
                      <span>Открыть акцию</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </span>
                  </div>
                </Link>
              );
            }

            // Otherwise, render the classic split layout with text on the left and a gradient card on the right
            return (
              <div className="w-full h-full flex-shrink-0 animate-fade-in relative z-10 text-slate-850 flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full h-full px-8 sm:px-10 md:px-12 py-6">
                  {/* Left Column */}
                  <div className="lg:col-span-6 flex flex-col justify-between text-left h-full w-full">
                    <div className="space-y-3.5">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight font-outfit">
                        {promo.title}
                      </h1>
                      
                      <div className="space-y-3">
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                          {promo.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 lg:mt-auto">
                      <Link
                        href={getPageHref('promotions', promo.id)}
                        onClick={() => onNavigate('promotions', promo.id)}
                        className="w-full sm:w-auto justify-center px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer border-0"
                      >
                        <span>Открыть акцию</span>
                        <ArrowRight className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="hidden lg:flex relative lg:col-span-6 space-y-4 z-10 w-full flex-col justify-center items-center">
                    <div className={`w-full max-w-lg aspect-[16/10] bg-gradient-to-br ${getThemeGradient(promo.theme)} flex flex-col items-center justify-center text-white rounded-3xl p-6 shadow-md`}>
                      <span className="text-5xl font-black font-outfit drop-shadow-sm select-none">
                        -{promo.discountValue}{promo.discountType === 'PERCENT' ? '%' : ' ₸'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-lg mt-4 backdrop-blur-md border border-white/10 select-none">
                        {promo.badge || (promo.promoCode ? 'По промокоду' : 'Скидка')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-3 lg:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-700 shadow-md border border-slate-200/50 hover:scale-105 transition-all z-20 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
            title="Предыдущий слайд"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-3 lg:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-700 shadow-md border border-slate-200/50 hover:scale-105 transition-all z-20 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
            title="Следующий слайд"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="p-3 -m-3 flex items-center justify-center transition-all duration-300 cursor-pointer"
                title={`Слайд ${idx + 1}`}
                aria-label={`Слайд ${idx + 1}`}
              >
                <span className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-6 bg-slate-600' : 'w-2 bg-slate-200 hover:bg-slate-350'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Product of the Day Deals Carousel (lg:col-span-4) - styled exactly like Technodom */}
        <div 
          onTouchStart={handleDealTouchStart}
          onTouchMove={handleDealTouchMove}
          onTouchEnd={() => handleDealTouchEnd(Math.min(popularProducts.slice(0, 3).length, 3))}
          className="lg:col-span-4 flex flex-col justify-between rounded-[2rem] border border-slate-200/80 bg-white p-6 relative overflow-hidden shadow-sm min-h-[380px] lg:min-h-full text-slate-800"
        >
          {(() => {
            const deals = popularProducts.slice(0, 3);
            return (
              <>
                {/* Header: Title and Countdown boxes */}
                <div className="flex items-center justify-between pb-3 mb-4 z-10 relative">
                  <h3 className="font-extrabold text-slate-900 text-[15px] font-sans">Товар дня</h3>
                  <div className="flex items-center gap-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[11px] min-w-[22px] text-center border border-slate-200/30">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-slate-400 font-bold text-[10px]">:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[11px] min-w-[22px] text-center border border-slate-200/30">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-slate-400 font-bold text-[10px]">:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[11px] min-w-[22px] text-center border border-slate-200/30">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {deals.length > 0 ? (() => {
                  const product = deals[currentDealIndex];
                  const imageSrc = getProductImage(product);
                  const isFav = isFavorite?.(product);

                  return (
                    <div className="flex flex-col justify-between flex-grow h-full text-slate-850 z-10 relative">
                      
                      {/* Product Image zone with navigation chevrons and Favorite heart */}
                      <div className="relative h-44 flex items-center justify-center bg-transparent rounded-2xl w-full mb-3 overflow-hidden">
                        
                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(product);
                          }}
                          className={`absolute top-2 right-2 z-20 p-2 rounded-full transition-all shadow-sm ${
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
                              onClick={() => setCurrentDealIndex(prev => (prev - 1 + deals.length) % deals.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white rounded-full border border-slate-200/50 hover:scale-105 transition-all z-20 cursor-pointer shadow-md"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentDealIndex(prev => (prev + 1) % deals.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white rounded-full border border-slate-200/50 hover:scale-105 transition-all z-20 cursor-pointer shadow-md"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <Link
                          href={getPageHref('product', product.id)}
                          onClick={() => onOpenDetails?.(product.id)}
                          className="w-full h-full flex items-center justify-center cursor-pointer"
                        >
                          <img 
                            src={imageSrc} 
                            alt={product.name} 
                            className="h-3/4 object-contain mix-blend-multiply transition-transform duration-300" 
                          />
                        </Link>
                      </div>

                      {/* Product details (Title and Price left-aligned) */}
                      <Link
                        href={getPageHref('product', product.id)}
                        onClick={() => onOpenDetails?.(product.id)}
                        className="flex flex-col text-left group/deal cursor-pointer flex-grow"
                      >
                        <h4 className="text-slate-700 text-xs leading-relaxed group-hover/deal:text-emerald-700 transition-colors line-clamp-3 min-h-[3rem] mb-2 font-medium">
                          {product.name}
                        </h4>

                        <div className="mb-4">
                          <span className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>

                      {/* Full-width blue Technodom-style button */}
                      <button
                        onClick={() => onAddToCart?.(product, 1)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm py-3 rounded-2xl transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-auto"
                      >
                        В корзину
                      </button>

                      {/* Indicators at the bottom */}
                      <div className="flex justify-center gap-1.5 mt-3">
                        {deals.map((_, idx) => (
                          <span
                            key={idx}
                            onClick={() => setCurrentDealIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              currentDealIndex === idx ? 'w-5 bg-slate-600' : 'w-1.5 bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs font-semibold gap-2 h-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-transparent" />
                    Загружаем предложения...
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
            <p className="text-slate-500 text-sm">Самые востребованные строительные материалы этого сезона</p>
          </div>
          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
          >
            Смотреть весь каталог
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesList.map(cat => (
            <Link
              key={cat.id}
              href={getPageHref('catalog', null, cat.id)}
              onClick={() => {
                setSelectedCategory(cat.id);
                onNavigate('catalog');
              }}
              className="group cursor-pointer bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all relative text-left h-64 flex flex-col justify-end p-6"
            >
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-all duration-500"
                style={{ backgroundImage: `url(${cat.bg})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              <div className="relative z-10 space-y-1">
                <h4 className="font-extrabold text-white text-lg">{cat.name}</h4>
                <p className="text-slate-300 text-[10px] leading-relaxed">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🔥 POPULAR PRODUCTS / HITS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Популярные товары</h2>
            <p className="text-slate-500 text-sm">Хиты продаж и востребованные строительные материалы</p>
          </div>
          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
          >
            Смотреть все товары
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productsLoading ? (
            <ProductSkeleton count={4} />
          ) : (
            popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite ? isFavorite(product) : false}
              />
            ))
          )}
        </div>
      </section>

      {/* 🛡️ KEY STRENGTHS (ПРЕИМУЩЕСТВА) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Почему выбирают TORMAG?</h2>
          <p className="text-slate-500 text-sm">Мы меняем подход к закупке строительных материалов в Казахстане</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-emerald">
              <Award className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Цены дистрибьюторов</h3>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Вы заказываете товары напрямую с официальных региональных складов брендов, исключая наценки розничных магазинов.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-blue">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">100% Гарантия бренда</h3>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Все поставщики проходят жесткую модерацию. Предоставляем сертификаты соответствия на каждую партию товара.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-violet">
              <Truck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Быстрая доставка</h3>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Собственная курьерская сеть и грузовой транспорт гарантируют доставку в течение 24 часов с момента подтверждения.
            </p>
          </div>

          <div className="bg-white border border-slate-350 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-green">
              <Building2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">Удобно для бизнеса</h3>
            <p className="text-slate-700 text-xs font-semibold leading-relaxed">
              Полный пакет закрывающих документов для ТОО и ИП. Работаем с НДС, предоставляем отсрочку платежа постоянным клиентам.
            </p>
          </div>

        </div>
      </section>


      {/* 🛠️ WIDGET TEASER CARD */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-600/20 rounded-[2.5rem] p-8 md:p-12 text-left flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="space-y-4 max-w-xl relative z-10">
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 font-outfit">Затрудняетесь с выбором материалов?</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
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
          <p className="text-slate-500 text-sm">Материалы от ведущих казахстанских и мировых заводов-производителей</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {brandLogos.map((brand, i) => (
            <div
              key={brand.id || i}
              className="bg-white border border-slate-350 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-650 hover:shadow-md transition-all group"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-12 max-w-[120px] object-contain mb-3 transition-all" />
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
