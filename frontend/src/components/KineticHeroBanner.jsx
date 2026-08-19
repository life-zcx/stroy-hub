import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Copy, Check, Gift, ShoppingCart } from 'lucide-react';


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
  banners = [],
  homePromotions = [],
  loading = false,
  onNavigate,
  onSlideChange
}) {

  const [currentSlide, setCurrentSlide] = useState(0);

  const isAutoplayRef = useRef(false);
  const onSlideChangeRef = useRef(onSlideChange);
  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  });

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

  const totalSlides = banners.length + homePromotions.length;

  useEffect(() => {
    if (totalSlides > 0 && currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  const nextSlide = useCallback((isAutoplay = false) => {
    if (totalSlides === 0) return;
    isAutoplayRef.current = Boolean(isAutoplay);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback((isAutoplay = false) => {
    if (totalSlides === 0) return;
    isAutoplayRef.current = Boolean(isAutoplay);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((idx) => {
    isAutoplayRef.current = false;
    setCurrentSlide(idx);
  }, []);

  // GSAP Kinetic Entrance Animation trigger ONLY on slide change
  useEffect(() => {
    if (!contentRef.current || totalSlides === 0) return;

    if (timelineRef.current) timelineRef.current.kill();
    if (progressTimelineRef.current) progressTimelineRef.current.kill();

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    timelineRef.current = tl;

    // Reset initial targets cleanly without causing CLS layout shifts
    const textTargets = [titleRef.current, subtitleRef.current, textRef.current, ctaRef.current].filter(Boolean);
    if (textTargets.length > 0) {
      gsap.set(textTargets, { opacity: 0 });
    }
    
    if (visualCardRef.current) {
      gsap.set(visualCardRef.current, { opacity: 0, scale: 0.98 });
    }

    // Title Entrance
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }
      );
    }

    // Subtitle & text entrance
    const subTargets = [subtitleRef.current, textRef.current].filter(Boolean);
    if (subTargets.length > 0) {
      tl.fromTo(
        subTargets,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, stagger: 0.05 },
        "-=0.2"
      );
    }

    // CTA buttons entrance
    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        "-=0.2"
      );
    }

    // Right side visual card entrance
    if (visualCardRef.current) {
      tl.fromTo(
        visualCardRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        "-=0.3"
      );
    }

    // Autoplay slide transition timer
    let autoplayTimer = null;
    if (totalSlides > 1) {
      autoplayTimer = setTimeout(() => {
        nextSlide(true);
      }, 10000);
    }

    if (onSlideChangeRef.current) {
      onSlideChangeRef.current(currentSlide);
    }

    return () => {
      tl.kill();
      if (autoplayTimer) clearTimeout(autoplayTimer);
    };
  }, [currentSlide, nextSlide, totalSlides]);

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

  if (loading || totalSlides === 0) {
    return (
      <div className="kinetic-banner-container w-full relative overflow-hidden rounded-[2rem] bg-slate-100/90 border border-slate-200/80 h-[430px] sm:h-[450px] lg:h-[480px] flex items-center shadow-xs select-none">
        <div className="w-full h-full bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 animate-pulse flex items-center px-8 sm:px-12">
          <div className="space-y-4 max-w-lg w-full">
            <div className="h-10 sm:h-12 bg-slate-200/80 rounded-2xl w-3/4 animate-pulse" />
            <div className="h-5 sm:h-6 bg-slate-200/60 rounded-xl w-1/2 animate-pulse" />
            <div className="h-4 bg-slate-200/40 rounded-lg w-5/6 animate-pulse" />
            <div className="flex gap-3 pt-4">
              <div className="h-12 bg-slate-200/80 rounded-2xl w-36 animate-pulse" />
              <div className="h-12 bg-slate-200/60 rounded-2xl w-36 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Current slide targets
  let currentBanner = null;
  let currentPromo = null;

  if (currentSlide < banners.length) {
    currentBanner = banners[currentSlide];
  } else {
    const pIndex = currentSlide - banners.length;
    if (pIndex < homePromotions.length) {
      currentPromo = homePromotions[pIndex];
    }
  }

  const currentTheme = currentPromo?.theme || 'ocean';
  const glowColors = getThemeGlow(currentTheme);

  return (

    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="kinetic-banner-container w-full relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/85 group/hero h-[430px] sm:h-[450px] lg:h-[480px] flex items-center shadow-sm text-slate-800 select-none"
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

      {/* Main Slide Content Container */}
      <div ref={contentRef} className="w-full h-full relative z-10 flex items-center">

        {/* ── DYNAMIC UPLOADED BANNERS (FROM ADMIN) ── */}
        {currentBanner && (() => {
          const targetUrl = currentBanner.linkUrl || '';
          const isExternal = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');

          const bannerButtons = Array.isArray(currentBanner.buttons) && currentBanner.buttons.length > 0
            ? currentBanner.buttons
            : (currentBanner.buttonText ? [{
                id: 'btn_fallback',
                text: currentBanner.buttonText,
                url: currentBanner.linkUrl || '',
                actionType: 'LINK',
                variant: 'PRIMARY_BLUE',
                icon: 'arrow'
              }] : []);

          const pos = currentBanner.position || 'bottom-left';
          const posClass = pos === 'bottom-center'
            ? 'bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6 text-center items-center'
            : pos === 'center-left'
            ? 'top-1/2 -translate-y-1/2 left-6 sm:left-12 text-left'
            : 'bottom-5 left-6 sm:bottom-6 sm:left-12 text-left';


          const hasOverlay = currentBanner.title || currentBanner.subtitle || bannerButtons.length > 0;

          const renderButtonIcon = (iconName) => {
            if (iconName === 'sparkles') return <Sparkles className="h-4.5 w-4.5" />;
            if (iconName === 'gift') return <Gift className="h-4.5 w-4.5" />;
            if (iconName === 'shopping') return <ShoppingCart className="h-4.5 w-4.5" />;
            if (iconName === 'arrow') return <ArrowRight className="h-4.5 w-4.5" />;
            return null;
          };

          const renderButtonClass = (variant) => {
            if (variant === 'OUTLINE_WHITE') return 'bg-slate-900/60 hover:bg-slate-900/80 text-white border border-white/40 shadow-lg';
            if (variant === 'SLATE_DARK') return 'bg-slate-900 hover:bg-slate-950 text-white shadow-lg';
            if (variant === 'EMERALD') return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/40';
            if (variant === 'AMBER') return 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/30';
            return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40';
          };

          const handleButtonClick = (btn, e) => {
            if (btn.actionType === 'AUTH_MODAL') {
              e.preventDefault();
              e.stopPropagation();
              onNavigate && onNavigate('auth_modal');
              return;
            }

            if (btn.url) {
              const url = btn.url;
              if (url.startsWith('http://') || url.startsWith('https://')) {
                window.open(url, '_blank');
              } else {
                onNavigate && onNavigate(url.replace(/^\//, ''));
              }
            }
          };

          const slideMarkup = (
            <div className="absolute inset-0 w-full h-full block group/banner overflow-hidden rounded-[2rem]">
              <picture className="w-full h-full block">
                {currentBanner.imageMobile && (
                  <source media="(max-width: 640px)" srcSet={currentBanner.imageMobile} />
                )}
                <img
                  src={currentBanner.imageDesktop}
                  alt={currentBanner.title || 'Рекламный баннер TORMAG'}
                  className="w-full h-full object-cover select-none"
                />
              </picture>

              {hasOverlay && (
                <>
                  {Boolean(currentBanner.title || currentBanner.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  )}
                  <div className={`absolute z-20 space-y-3 max-w-xl text-white ${posClass}`}>

                    {currentBanner.title && (
                      <h2 ref={titleRef} className="text-2xl sm:text-4xl font-extrabold font-outfit drop-shadow-md">
                        {currentBanner.title}
                      </h2>
                    )}
                    {currentBanner.subtitle && (
                      <p ref={subtitleRef} className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                        {currentBanner.subtitle}
                      </p>
                    )}

                    {bannerButtons.length > 0 && (
                      <div ref={ctaRef} className="pt-2 flex flex-wrap items-center gap-2.5">
                        {bannerButtons.map((btn, idx) => (
                          <button
                            key={btn.id || idx}
                            type="button"
                            onClick={(e) => handleButtonClick(btn, e)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider font-extrabold transition-all duration-300 active:scale-95 cursor-pointer border-0 ${renderButtonClass(btn.variant)}`}
                          >
                            <span>{btn.text}</span>
                            {renderButtonIcon(btn.icon)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );

          if (bannerButtons.length === 0 && targetUrl) {
            if (isExternal) {
              return (
                <a href={targetUrl} target="_blank" rel="noreferrer" className="w-full h-full block cursor-pointer z-10">
                  {slideMarkup}
                </a>
              );
            }
            return (
              <Link href={targetUrl} onClick={() => onNavigate && onNavigate(targetUrl.replace(/^\//, ''))} className="w-full h-full block cursor-pointer z-10">
                {slideMarkup}
              </Link>
            );
          }

          return slideMarkup;
        })()}


        {/* ── DYNAMIC PROMOTIONS ── */}
        {currentPromo && (() => {
          const bannerSrc = currentPromo.imageHome || currentPromo.imageCard || currentPromo.image;
          if (bannerSrc) {
            return (
              <Link
                href={getPageHref('promotions', currentPromo.id)}
                onClick={() => onNavigate('promotions', currentPromo.id)}
                className="absolute inset-0 w-full h-full block cursor-pointer group/promo z-10 overflow-hidden rounded-[2rem]"
              >
                {/* Responsive banner: uses imageMobile on smartphones if provided */}
                <picture className="w-full h-full block">
                  {currentPromo.imageMobile && (
                    <source media="(max-width: 640px)" srcSet={currentPromo.imageMobile} />
                  )}
                  <img
                    src={bannerSrc}
                    alt={currentPromo.title}
                    className="w-full h-full object-cover object-left select-none"
                  />
                </picture>

                {/* Subtle gradient shadow on bottom-left for crisp button contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                {/* CTA Button placed at bottom-left */}
                <div ref={ctaRef} className="absolute bottom-6 left-5 sm:bottom-8 sm:left-10 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-blue-900/40 text-[10px] sm:text-xs uppercase tracking-wider transition-colors duration-300">
                    <span>Открыть акцию</span>
                    <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full h-full px-6 sm:px-10 lg:px-12 py-7 sm:py-9 pb-14 sm:pb-12">
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
                    className="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-6 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl sm:rounded-2xl transition-colors duration-300 shadow-md flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer border-0"
                  >
                    <span>Открыть акцию</span>
                    <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
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

      {/* Navigation Arrows (Only if more than 1 slide) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={() => prevSlide(false)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-sm border border-slate-200/70 transition-colors duration-200 z-30 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
            title="Предыдущий слайд"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => nextSlide(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 shadow-sm border border-slate-200/70 transition-colors duration-200 z-30 opacity-0 group-hover/hero:opacity-100 cursor-pointer hidden md:block"
            title="Следующий слайд"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

    </div>
  );
}
