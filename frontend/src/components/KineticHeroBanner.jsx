import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Award, ChevronLeft, ChevronRight, Sparkles, Copy, Check } from 'lucide-react';

import Link from './Link';
import { getPageHref } from '../utils/navigationHelper';
import './KineticHeroBanner.css';

const THEME_GRADIENTS = {
  emerald: 'from-emerald-500 to-teal-600',
  ocean: 'from-sky-500 to-blue-600',
  sunset: 'from-amber-500 to-orange-600',
  royal: 'from-indigo-500 to-violet-600',
  graphite: 'from-slate-700 to-slate-900',
  rose: 'from-rose-500 to-pink-600',
};

const THEME_GLOWS = {
  emerald: { primary: '#10b981', secondary: '#059669' },
  ocean: { primary: '#3b82f6', secondary: '#2563eb' },
  sunset: { primary: '#f97316', secondary: '#ea580c' },
  royal: { primary: '#6366f1', secondary: '#4f46e5' },
  graphite: { primary: '#64748b', secondary: '#475569' },
  rose: { primary: '#f43f5e', secondary: '#e11d48' },
};

function getThemeGradient(theme) {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.ocean;
}

function getThemeGlow(theme) {
  return THEME_GLOWS[theme] || THEME_GLOWS.ocean;
}

export default function KineticHeroBanner({
  homePromotions = [],
  onNavigate,
  onSlideChange
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    onSlideChange?.(currentSlide);
  }, [currentSlide, onSlideChange]);
  const totalSlides = 3 + homePromotions.length;

  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const textRef = useRef(null);
  const ctaRef = useRef(null);
  const visualCardRef = useRef(null);
  const progressBarRef = useRef(null);
  const timelineRef = useRef(null);
  const progressTimelineRef = useRef(null);

  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);


  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Current theme colors
  const currentPromo = currentSlide >= 3 ? homePromotions[currentSlide - 3] : null;
  const currentTheme = currentPromo ? currentPromo.theme : (
    currentSlide === 0 ? 'ocean' : currentSlide === 1 ? 'royal' : 'emerald'
  );
  const glowColors = getThemeGlow(currentTheme);

  // GSAP Kinetic Entrance Animation trigger ONLY on slide change
  useEffect(() => {
    if (!contentRef.current) return;

    if (timelineRef.current) timelineRef.current.kill();
    if (progressTimelineRef.current) progressTimelineRef.current.kill();

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timelineRef.current = tl;

    // Reset initial targets
    const textTargets = [titleRef.current, subtitleRef.current, textRef.current, ctaRef.current].filter(Boolean);
    gsap.set(textTargets, { opacity: 0, y: 25 });
    
    if (visualCardRef.current) {
      gsap.set(visualCardRef.current, { opacity: 0, scale: 0.95, y: 20 });
    }

    // Title Entrance
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      );
    }

    // Subtitle & text entrance
    if (subtitleRef.current || textRef.current) {
      const subTargets = [subtitleRef.current, textRef.current].filter(Boolean);
      tl.fromTo(
        subTargets,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
        "-=0.4"
      );
    }

    // CTA buttons entrance
    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45 },
        "-=0.3"
      );
    }

    // Right side visual card entrance
    if (visualCardRef.current) {
      tl.fromTo(
        visualCardRef.current,
        { opacity: 0, scale: 0.94, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power2.out' },
        "-=0.5"
      );
    }

    // Autoplay progress bar animation
    if (progressBarRef.current) {
      const pTl = gsap.timeline();
      progressTimelineRef.current = pTl;

      pTl.fromTo(
        progressBarRef.current,
        { width: '0%' },
        {
          width: '100%',
          duration: 10,
          ease: 'none',
          onComplete: () => {
            nextSlide();
          }
        }
      );
    }

    return () => {
      tl.kill();
      if (progressTimelineRef.current) progressTimelineRef.current.kill();
    };
  }, [currentSlide, nextSlide]);

  // Touch handlers
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
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="kinetic-banner-container lg:col-span-8 relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/85 px-6 sm:px-10 lg:px-12 py-7 sm:py-9 pb-14 sm:pb-12 group/hero h-[430px] sm:h-[450px] lg:h-[480px] flex items-center shadow-sm text-slate-800 select-none"
    >
      {/* Soft Ambient Glow Orbs */}
      <div
        className="kinetic-glow-orb kinetic-glow-primary"
        style={{ backgroundColor: glowColors.primary }}
      />
      <div
        className="kinetic-glow-orb kinetic-glow-secondary"
        style={{ backgroundColor: glowColors.secondary }}
      />

      {/* Progress Bar for Autoplay */}
      <div className="kinetic-progress-track">
        <div ref={progressBarRef} className="kinetic-progress-bar" />
      </div>

      {/* Main Slide Content Container */}
      <div ref={contentRef} className="w-full h-full relative z-10 flex items-center">

        {/* ── SLIDE 0: MAIN USP ── */}
        {currentSlide === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch w-full h-full py-2">
            <div className="lg:col-span-12 flex flex-col justify-between text-left h-full w-full">
              <div className="space-y-4">
                <h1 ref={titleRef} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                  Всё для стройки <br />
                  <span className="text-blue-600">
                    и ремонта
                  </span>
                </h1>

                <div className="space-y-2.5">
                  <p ref={subtitleRef} className="text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                    Прямые поставки строительных материалов <span className="text-blue-600 font-extrabold">от ведущих дистрибьюторов</span>
                  </p>

                  <p ref={textRef} className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                    Комплексное снабжение строительных объектов, гарантированное качество и прозрачные оптовые условия для вашего бизнеса.
                  </p>
                </div>
              </div>

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                <Link
                  href={getPageHref('catalog')}
                  onClick={() => onNavigate('catalog')}
                  className="w-full sm:w-auto justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors duration-300 shadow-md flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  <span>Перейти в каталог</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link
                  href={getPageHref('estimate')}
                  onClick={() => onNavigate('estimate')}
                  className="w-full sm:w-auto justify-center px-6 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 font-bold rounded-2xl transition-colors duration-200 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <span>Заказ по смете</span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE 1: LOYALTY INFO (TORMAG Club) ── */}
        {currentSlide === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full h-full py-2">
            {/* Left Column */}
            <div className="lg:col-span-6 flex flex-col justify-between text-left h-full w-full pr-2">
              <div className="space-y-4">
                <h1 ref={titleRef} className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                  Программа лояльности <br />
                  <span className="text-blue-600">
                    TORMAG Club
                  </span>
                </h1>

                <div className="space-y-2.5">
                  <p ref={subtitleRef} className="text-sm sm:text-base font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                    Накапливайте кешбэк до 5% и оплачивайте бонусами до 100% заказов
                  </p>

                  <p ref={textRef} className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-md">
                    Статус рассчитывается автоматически на основе общей суммы ваших выполненных заказов за календарный год.
                  </p>
                </div>
              </div>

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                <Link
                  href={getPageHref('cashback')}
                  onClick={() => onNavigate('cashback')}
                  className="w-full sm:w-auto justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors duration-300 shadow-md flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  <span>Узнать подробнее</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Clean Loyalty Tier Cards */}
            <div ref={visualCardRef} className="hidden lg:flex relative lg:col-span-6 space-y-3 z-10 w-full flex-col justify-center pl-2">
              
              {/* Tier 1: Участник */}
              <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
                    Уровень «Участник»
                  </h4>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    Базовый
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium">
                  Кешбэк <span className="text-blue-600 font-extrabold">3%</span> • Оплата бонусами до <span className="text-blue-600 font-extrabold">50%</span>
                </p>
              </div>

              {/* Tier 2: Резидент */}
              <div className="bg-gradient-to-r from-blue-50/70 via-white to-white border border-blue-200/80 border-l-4 border-l-blue-600 p-4 rounded-2xl shadow-sm text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
                    Уровень «Резидент»
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-blue-100/90 text-blue-700 rounded-lg shrink-0">
                    от 500 тыс. ₸
                  </span>
                </div>
                <p className="text-slate-600 text-xs font-medium">
                  Кешбэк <span className="text-blue-600 font-extrabold">4%</span> • Оплата бонусами до <span className="text-blue-600 font-extrabold">75%</span>
                </p>
              </div>

              {/* Tier 3: Партнёр */}
              <div className="bg-slate-900 text-white border border-slate-800 p-4 rounded-2xl shadow-md text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-extrabold text-white text-xs sm:text-sm tracking-tight">
                    Уровень «Партнёр»
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-blue-600 text-white rounded-lg shrink-0">
                    от 2 млн. ₸
                  </span>
                </div>
                <p className="text-slate-300 text-xs font-medium">
                  Кешбэк <span className="text-blue-400 font-extrabold">5%</span> • Оплата бонусами до <span className="text-blue-400 font-extrabold">100%</span>
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ── SLIDE 2: REVIEW PROMO ── */}
        {currentSlide === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full h-full py-2">
            <div className="lg:col-span-12 flex flex-col justify-between text-left h-full w-full">
              <div className="space-y-4">
                <h1 ref={titleRef} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight font-outfit">
                  Скидка 10% <br />
                  <span className="text-blue-600">
                    за ваш отзыв!
                  </span>
                </h1>

                <div className="space-y-3">
                  <p ref={subtitleRef} className="text-sm sm:text-base md:text-lg font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                    Оцените ваши прошлые покупки и сэкономьте на следующих заказах
                  </p>

                  <p ref={textRef} className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-xl">
                    Помогите другим прорабам и закупщикам сделать правильный выбор! Напишите честный отзыв к любому купленному товару, и мы мгновенно вышлем вам промокод.
                  </p>
                </div>
              </div>

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                <Link
                  href={getPageHref('orders')}
                  onClick={() => onNavigate('orders')}
                  className="w-full sm:w-auto justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors duration-300 shadow-md flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  <span>Оценить покупки</span>
                  <Award className="h-4.5 w-4.5 text-white" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE 3+: DYNAMIC PROMOTIONS ── */}
        {currentSlide >= 3 && currentPromo && (() => {
          if (currentPromo.image) {
            return (
              <Link
                href={getPageHref('promotions', currentPromo.id)}
                onClick={() => onNavigate('promotions', currentPromo.id)}
                className="absolute inset-0 w-full h-full block cursor-pointer group/promo z-10"
              >
                <img
                  src={currentPromo.image}
                  alt={currentPromo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10 group-hover/promo:bg-black/20 transition-colors duration-300" />

                <div ref={ctaRef} className="absolute bottom-10 left-6 sm:bottom-10 sm:left-10 z-20">
                  <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg backdrop-blur-sm text-xs uppercase tracking-wider transition-colors duration-300">
                    <span>Открыть акцию</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full h-full py-2">
              <div className="lg:col-span-6 flex flex-col justify-between text-left h-full w-full pr-2">
                <div className="space-y-4">
                  <h1 ref={titleRef} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight font-outfit">
                    {currentPromo.title}
                  </h1>

                  <div className="space-y-3">
                    <p ref={textRef} className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal max-w-md">
                      {currentPromo.description}
                    </p>
                  </div>
                </div>

                <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-auto">
                  <Link
                    href={getPageHref('promotions', currentPromo.id)}
                    onClick={() => onNavigate('promotions', currentPromo.id)}
                    className="w-full sm:w-auto justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors duration-300 shadow-md flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
                  >
                    <span>Открыть акцию</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                </div>
              </div>

              {/* Right Side Sleek Promo Voucher Card */}
              <div ref={visualCardRef} className="hidden lg:flex relative lg:col-span-6 space-y-4 z-10 w-full flex-col justify-center items-center pl-2">
                <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <div className="my-1">
                    <span className="text-5xl font-black text-slate-900 font-outfit tracking-tight">
                      -{currentPromo.discountValue}<span className="text-blue-600 font-extrabold">{currentPromo.discountType === 'PERCENT' ? '%' : ' ₸'}</span>
                    </span>
                  </div>

                  {/* Coupon Code Container */}
                  <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between mt-3">
                    <div className="flex flex-col text-left pl-1">
                      <span className="text-[9px] font-black uppercase text-slate-400">Промокод</span>
                      <span className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-wider">
                        {currentPromo.promoCode || 'TORMAG10'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(currentPromo.promoCode || 'TORMAG10', e)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-sm shrink-0"
                    >
                      {copiedCode === (currentPromo.promoCode || 'TORMAG10') ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-white" />
                          <span>Скопировать</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-sm border border-slate-200/70 transition-colors duration-200 z-30 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
        title="Предыдущий слайд"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-sm border border-slate-200/70 transition-colors duration-200 z-30 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
        title="Следующий слайд"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className="p-2 -m-2 flex items-center justify-center transition-all duration-300 cursor-pointer"
            title={`Слайд ${idx + 1}`}
            aria-label={`Слайд ${idx + 1}`}
          >
            <span
              className={`h-2 rounded-full transition-all duration-500 ${
                currentSlide === idx
                  ? 'w-7 bg-slate-900'
                  : 'w-2 bg-slate-300/80 hover:bg-slate-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
