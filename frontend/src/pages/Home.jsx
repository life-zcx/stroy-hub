import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent, FileSpreadsheet,
  Hammer, HardHat, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getBrands, getHomePromotions, getProductsPage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';
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

export default function Home({
  onNavigate,
  setSelectedCategory,
  categories = [],
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  onOpenDetails
}) {
  const [brands, setBrands] = useState([]);
  const [homePromotions, setHomePromotions] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3 + homePromotions.length;

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
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 10000);
    return () => clearInterval(slideTimer);
  }, [currentSlide, totalSlides]);

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

      {/* 🚀 ULTRA-MINIMALIST LIGHT HERO CAROUSEL */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-50/50 via-white to-white border border-slate-200/40 px-5 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 group/hero h-[510px] sm:h-[460px] lg:h-[480px] flex items-center"
      >
        {/* Soft, beautiful ambient glowing spheres (SaaS style) */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-10 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute -bottom-30 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none z-0"></div>

        {/* ── Slide 1: Main USP ── */}
        {currentSlide === 0 && (
          <div className="w-full animate-fade-in relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-4 md:space-y-6 text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                  Всё для стройки <br />
                  <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                    и ремонта
                  </span>
                </h1>
                
                <div className="space-y-3 md:space-y-4">
                  <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                    Прямые поставки строительных материалов <span className="text-blue-600 font-extrabold">от ведущих дистрибьюторов Казахстана</span>
                  </p>
                  
                  <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-xl">
                    Комплексное снабжение строительных объектов, гарантированное качество и прозрачные оптовые условия для вашего бизнеса.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-2 md:pt-4">
                  <Link
                    href={getPageHref('catalog')}
                    onClick={() => onNavigate('catalog')}
                    className="w-full sm:w-auto justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <span>Перейти в каталог</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href={getPageHref('estimate')}
                    onClick={() => onNavigate('estimate')}
                    className="w-full sm:w-auto justify-center px-8 py-4 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <span>Заказ по смете</span>
                    <ArrowRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-slate-600" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Sleek Minimalist Glass Tiles */}
              <div className="hidden lg:block relative lg:col-span-5 space-y-4 z-10 w-full">
                {/* Tile 1 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 shrink-0 shadow-sm">
                    <Hammer className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base font-outfit">Цены дистрибьюторов</h4>
                    <p className="text-slate-555 text-xs leading-relaxed font-semibold">
                      Прямые поставки от официальных дистрибьюторов без розничных наценок
                    </p>
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 shrink-0 shadow-sm">
                    <HardHat className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base font-outfit">Сертификаты качества</h4>
                    <p className="text-slate-555 text-xs leading-relaxed font-semibold">
                      Полный комплект паспортов качества и соответствия на каждую партию
                    </p>
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 shrink-0 shadow-sm">
                    <Truck className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base font-outfit">Региональные поставки</h4>
                    <p className="text-slate-555 text-xs leading-relaxed font-semibold">
                      Быстрая и надежная доставка со складов по Алматы и области
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slide 2: Review Promo ── */}
        {currentSlide === 1 && (
          <div className="w-full animate-fade-in relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-4 md:space-y-6 text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                  Скидка 10% <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    за ваш отзыв!
                  </span>
                </h1>
                
                <div className="space-y-3 md:space-y-4">
                  <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800 leading-snug font-outfit border-l-4 border-emerald-500 pl-4">
                    Оцените ваши прошлые покупки и сэкономьте на следующих заказах
                  </p>
                  
                  <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-xl">
                    Помогите другим прорабам и закупщикам сделать правильный выбор! Напишите честный отзыв к любому купленному товару в вашем личном кабинете, и мы мгновенно вышлем вам промокод.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-2 md:pt-4">
                  <Link
                    href={getPageHref('orders')}
                    onClick={() => onNavigate('orders')}
                    className="w-full sm:w-auto justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <span>Оценить покупки</span>
                    <Award className="h-4.5 w-4.5 text-emerald-550" />
                  </Link>
                </div>
              </div>

              {/* Right Column */}
              <div className="hidden lg:flex relative lg:col-span-5 space-y-4 z-10 w-full flex-col justify-center">
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm text-left backdrop-blur-[2px] w-full max-w-md mx-auto">
                  <div className="flex items-center gap-1 text-yellow-400 mb-2">
                    <span className="text-lg">★</span><span className="text-lg">★</span><span className="text-lg">★</span><span className="text-lg">★</span><span className="text-lg">★</span>
                  </div>
                  <p className="text-slate-850 text-xs font-semibold leading-relaxed">
                    «Отличные пиломатериалы и штукатурка, привезли прямо на объект на следующий день. Цены действительно ниже розницы. Будем брать еще.»
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-2 font-bold">— ТОО "СпецМонолитСтрой"</span>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-md text-left flex items-center gap-4 w-full max-w-xs mx-auto transform lg:translate-x-4">
                  <div className="text-3xl font-black font-outfit leading-none shrink-0">-10%</div>
                  <div className="text-[10px] font-bold leading-tight">Ваш персональный промокод за отзыв в личном кабинете</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slide 2: Loyalty Program Promo ── */}
        {currentSlide === 2 && (
          <div className="w-full animate-fade-in relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-4 md:space-y-6 text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                  Программа лояльности <br />
                  <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                    TORMAG Club
                  </span>
                </h1>
                
                <div className="space-y-3 md:space-y-4">
                  <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                    Накапливайте кешбэк до 5% и оплачивайте бонусами до 100% от стоимости ваших заказов
                  </p>
                  
                  <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-xl">
                    Статус рассчитывается автоматически на основе общей суммы ваших выполненных заказов за текущий календарный год.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-2 md:pt-4">
                  <Link
                    href={getPageHref('cashback')}
                    onClick={() => onNavigate('cashback')}
                    className="w-full sm:w-auto justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <span>Узнать подробнее</span>
                    <ArrowRight className="h-4.5 w-4.5 text-blue-400" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Sleek Minimalist Tiles matching Slide 1 */}
              <div className="hidden lg:block relative lg:col-span-5 space-y-4 z-10 w-full">
                {/* Tile 1 */}
                <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 border border-slate-100 shrink-0 shadow-sm w-12 h-12 flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit flex items-center gap-2">
                      Уровень «Участник» 
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Базовый</span>
                    </h4>
                    <p className="text-slate-555 text-[11px] leading-relaxed font-semibold">
                      Кешбэк <span className="text-slate-900 font-extrabold">3%</span> • Оплата бонусами до <span className="text-slate-900 font-extrabold">50%</span> заказа
                    </p>
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="bg-white border border-blue-200/80 p-4 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 shrink-0 shadow-sm w-12 h-12 flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit flex items-center gap-2">
                      Уровень «Резидент»
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">от 500 тыс. ₸</span>
                    </h4>
                    <p className="text-slate-555 text-[11px] leading-relaxed font-semibold">
                      Кешбэк <span className="text-blue-600 font-extrabold">4%</span> • Оплата бонусами до <span className="text-blue-600 font-extrabold">75%</span> заказа
                    </p>
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm text-left flex items-center gap-5 backdrop-blur-[2px]">
                  <div className="p-3 rounded-2xl bg-indigo-55/10 text-indigo-600 border border-indigo-100/30 shrink-0 shadow-sm w-12 h-12 flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit flex items-center gap-2">
                      Уровень «Партнёр»
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">от 2 млн. ₸</span>
                    </h4>
                    <p className="text-slate-555 text-[11px] leading-relaxed font-semibold">
                      Кешбэк <span className="text-indigo-600 font-extrabold">5%</span> • Оплата бонусами до <span className="text-indigo-600 font-extrabold">100%</span> заказа
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Slide 3+ Dynamic Promotions ── */}
        {currentSlide >= 3 && homePromotions[currentSlide - 3] && (() => {
          const promo = homePromotions[currentSlide - 3];
          return (
            <div className="w-full animate-fade-in relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-4 md:space-y-6 text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit line-clamp-2">
                    {promo.title}
                  </h1>
                  
                  <div className="space-y-3 md:space-y-4">
                    <p className="text-slate-700 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-xl line-clamp-3">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <Link
                      href={getPageHref('promotions', promo.id)}
                      onClick={() => onNavigate('promotions', promo.id)}
                      className="w-full sm:w-auto justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <span>Открыть акцию</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                </div>

                {/* Right Column */}
                <div className="hidden lg:flex relative lg:col-span-5 space-y-4 z-10 w-full flex-col justify-center items-center">
                  {promo.image ? (
                    <div className="w-full max-w-md aspect-[16/10] overflow-hidden rounded-3xl shadow-md border border-slate-100 bg-white">
                      <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-full max-w-md aspect-[16/10] bg-gradient-to-br ${getThemeGradient(promo.theme)} flex flex-col items-center justify-center text-white rounded-3xl p-6 shadow-md`}>
                      <span className="text-5xl font-black font-outfit drop-shadow-sm select-none">
                        -{promo.discountValue}{promo.discountType === 'PERCENT' ? '%' : ' ₸'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-lg mt-4 backdrop-blur-md border border-white/10 select-none">
                        {promo.badge || (promo.promoCode ? 'По промокоду' : 'Скидка')}
                      </span>
                    </div>
                  )}
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {Array.from({ length: 3 + homePromotions.length }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="p-3 -m-3 flex items-center justify-center transition-all duration-300 cursor-pointer"
              title={`Слайд ${idx + 1}`}
              aria-label={`Слайд ${idx + 1}`}
            >
              <span className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-400 hover:bg-slate-500'
              }`} />
            </button>
          ))}
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
      {popularProducts.length > 0 && (
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
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onOpenDetails={onOpenDetails}
                onToggleFavorite={onToggleFavorite}
                isFavorite={isFavorite ? isFavorite(product) : false}
              />
            ))}
          </div>
        </section>
      )}

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
