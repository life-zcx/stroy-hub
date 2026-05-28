import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent
} from 'lucide-react';
import { getBrands, getHomePromotions } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function Home({ onNavigate, setSelectedCategory, categories = [] }) {
  const [brands, setBrands] = useState([]);
  const [homePromotions, setHomePromotions] = useState([]);

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
        const [loadedBrands, loadedPromotions] = await Promise.all([
          getBrands(),
          getHomePromotions(),
        ]);

        if (!isMounted) {
          return;
        }

        setBrands(loadedBrands);
        setHomePromotions(loadedPromotions);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setBrands([]);
          setHomePromotions([]);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
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
      
      {/* 🚀 ULTRA-MINIMALIST LIGHT HERO SECTION */}
      <div className="relative">
        {/* Subtle ambient blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[140px] pointer-events-none z-0"></div>
        <svg className="hero-blueprint-field" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
          {/* Grid Pattern Definition */}
          <defs>
            <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 98, 190, 0.12)" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

          {/* Technical Drawing Coordinate Axes (Оси здания) */}
          {/* Axis A */}
          <line x1="120" y1="0" x2="120" y2="520" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="120" cy="520" r="14" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1" />
          <text x="120" y="524" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">А</text>

          {/* Axis B */}
          <line x1="680" y1="0" x2="680" y2="520" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="680" cy="520" r="14" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1" />
          <text x="680" y="524" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">Б</text>

          {/* Axis C */}
          <line x1="1200" y1="0" x2="1200" y2="520" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="1200" cy="520" r="14" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1" />
          <text x="1200" y="524" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">В</text>

          {/* Horizontal Axis 1 */}
          <line x1="0" y1="160" x2="1440" y2="160" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="40" cy="160" r="14" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1" />
          <text x="40" y="164" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">1</text>

          {/* Horizontal Axis 2 */}
          <line x1="0" y1="420" x2="1440" y2="420" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="40" cy="420" r="14" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1" />
          <text x="40" y="424" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">2</text>

          {/* Room Floor Plan Sketch (Чертеж комнат и стен - классический маркер архитектуры) */}
          <g opacity="0.95">
            {/* Main Outer Thick Walls */}
            <rect x="220" y="100" width="340" height="240" rx="6" stroke="rgba(0, 98, 190, 0.42)" strokeWidth="2.5" />
            <rect x="228" y="108" width="324" height="224" rx="4" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            
            {/* Interior wall partitioning */}
            <line x1="390" y1="108" x2="390" y2="332" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="2" />
            
            {/* Classic Architectural Door Swing Symbol (Дверной проем с радиусом открывания) */}
            <path d="M 390 200 L 420 200 A 30 30 0 0 1 390 230 L 390 200" fill="none" stroke="rgba(0, 98, 190, 0.42)" strokeWidth="1.25" />
            <line x1="390" y1="200" x2="390" y2="230" stroke="rgba(0, 98, 190, 0.45)" strokeWidth="2" />

            {/* Window symbols */}
            <rect x="280" y="96" width="50" height="8" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />
            <line x1="280" y1="100" x2="330" y2="100" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />

            <rect x="470" y="96" width="50" height="8" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />
            <line x1="470" y1="100" x2="520" y2="100" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />

            {/* Pillar supports */}
            <rect x="216" y="96" width="8" height="8" fill="rgba(0, 98, 190, 0.55)" />
            <rect x="556" y="96" width="8" height="8" fill="rgba(0, 98, 190, 0.55)" />
            <rect x="216" y="336" width="8" height="8" fill="rgba(0, 98, 190, 0.55)" />
            <rect x="556" y="336" width="8" height="8" fill="rgba(0, 98, 190, 0.55)" />
          </g>

          {/* Dimension Lines (Размерные линии с архитектурными засечками) */}
          <g opacity="0.95">
            {/* Top dimension line */}
            <line x1="220" y1="60" x2="560" y2="60" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />
            <line x1="215" y1="65" x2="225" y2="55" stroke="rgba(0, 98, 190, 0.6)" strokeWidth="1.5" />
            <line x1="555" y1="65" x2="565" y2="55" stroke="rgba(0, 98, 190, 0.6)" strokeWidth="1.5" />
            <line x1="385" y1="65" x2="395" y2="55" stroke="rgba(0, 98, 190, 0.45)" strokeWidth="1.5" />
            
            <rect x="360" y="49" width="60" height="20" fill="#f8fafc" />
            <text x="390" y="63" textAnchor="middle" fill="rgba(0, 98, 190, 0.85)" fontSize="10.5" fontWeight="bold" fontFamily="monospace">12 400</text>

            {/* Left vertical dimension line */}
            <line x1="170" y1="100" x2="170" y2="340" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" />
            <line x1="165" y1="105" x2="175" y2="95" stroke="rgba(0, 98, 190, 0.6)" strokeWidth="1.5" />
            <line x1="165" y1="335" x2="175" y2="345" stroke="rgba(0, 98, 190, 0.6)" strokeWidth="1.5" />
            
            <rect x="145" y="209" width="48" height="20" fill="#f8fafc" />
            <text x="169" y="222" textAnchor="middle" fill="rgba(0, 98, 190, 0.8)" fontSize="10.5" fontWeight="bold" fontFamily="monospace" transform="rotate(-90 169 219)">8 600</text>
          </g>

          {/* Construction Tower Crane Sketch (Чертеж строительного башенного крана справа за карточками) */}
          <g transform="translate(1010, 50) scale(0.92)" opacity="0.9">
            {/* Crane Lattice Mast (Башня крана - решетчатая ферма) */}
            <line x1="80" y1="60" x2="80" y2="480" stroke="rgba(0, 98, 190, 0.35)" strokeWidth="1.5" />
            <line x1="100" y1="60" x2="100" y2="480" stroke="rgba(0, 98, 190, 0.35)" strokeWidth="1.5" />
            
            {/* Mast braces */}
            <line x1="80" y1="110" x2="100" y2="110" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="160" x2="100" y2="160" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="210" x2="100" y2="210" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="260" x2="100" y2="260" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="310" x2="100" y2="310" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="360" x2="100" y2="360" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            <line x1="80" y1="410" x2="100" y2="410" stroke="rgba(0, 98, 190, 0.28)" strokeWidth="1" />
            
            {/* Mast diagonals */}
            <line x1="80" y1="60" x2="100" y2="110" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="100" y1="110" x2="80" y2="160" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="80" y1="160" x2="100" y2="210" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="100" y1="210" x2="80" y2="260" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="80" y1="260" x2="100" y2="310" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="100" y1="310" x2="80" y2="360" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="80" y1="360" x2="100" y2="410" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />
            <line x1="100" y1="410" x2="80" y2="460" stroke="rgba(0, 98, 190, 0.25)" strokeWidth="1" />

            {/* Operator Cabin */}
            <rect x="70" y="30" width="22" height="30" rx="3" fill="#f8fafc" stroke="rgba(0, 98, 190, 0.5)" strokeWidth="1.5" />
            <line x1="76" y1="40" x2="86" y2="40" stroke="rgba(0, 98, 190, 0.45)" strokeWidth="1" />

            {/* Apex */}
            <path d="M 80 30 L 90 0 L 100 30" stroke="rgba(0, 98, 190, 0.45)" strokeWidth="1.5" />

            {/* Crane Lattice Jib */}
            <line x1="-120" y1="30" x2="280" y2="30" stroke="rgba(0, 98, 190, 0.42)" strokeWidth="1.5" />
            <line x1="-120" y1="18" x2="280" y2="18" stroke="rgba(0, 98, 190, 0.3)" strokeWidth="1" />
            {/* Jib diagonals */}
            <path d="M -120 30 L -100 18 L -80 30 L -60 18 L -40 30 L -20 18 L 0 30 L 20 18 L 40 30 L 60 18 L 80 30 L 100 18 L 120 30 L 140 18 L 160 30 L 180 18 L 200 30 L 220 18 L 240 30 L 260 18 L 280 30" stroke="rgba(0, 98, 190, 0.22)" strokeWidth="1" />

            {/* Counter-weight blocks */}
            <rect x="-100" y="30" width="30" height="20" fill="rgba(0, 98, 190, 0.15)" stroke="rgba(0, 98, 190, 0.45)" strokeWidth="1" />

            {/* Trolley and Hook */}
            <rect x="180" y="30" width="12" height="6" fill="rgba(0, 98, 190, 0.5)" />
            <line x1="186" y1="36" x2="186" y2="160" stroke="rgba(0, 98, 190, 0.38)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="186" cy="162" r="3" fill="rgba(0, 98, 190, 0.6)" />
            <path d="M 186 165 C 183 168 183 172 186 172 C 188 172 188 169 186 169" stroke="rgba(0, 98, 190, 0.6)" strokeWidth="1" fill="none" />
          </g>

          {/* Protractors/Technical Drawing Angle Guide in the center-right */}
          <g transform="translate(740, 260)" opacity="0.8">
            <circle cx="0" cy="0" r="70" stroke="rgba(0, 98, 190, 0.18)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="0" cy="0" r="100" stroke="rgba(0, 98, 190, 0.12)" strokeWidth="1" />
            <line x1="-120" y1="0" x2="120" y2="0" stroke="rgba(0, 98, 190, 0.15)" strokeWidth="1" />
            <line x1="0" y1="-120" x2="0" y2="120" stroke="rgba(0, 98, 190, 0.15)" strokeWidth="1" />
          </g>
        </svg>

        <div className="relative py-12 md:py-20 flex items-center z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
            
            {/* Left Column: Text Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                Всё для стройки <br />
                <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                  и ремонта
                </span>
              </h1>
              
              <div className="space-y-4">
                <p className="text-lg md:text-xl font-bold text-slate-800 leading-snug font-outfit border-l-4 border-blue-600 pl-4">
                  Тут вы можете купить любой стройматериал <span className="text-blue-600 font-extrabold">по самым низким ценам</span>
                </p>
                
                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-normal max-w-xl">
                  Заниматься стройкой или ремонтом стало легче, ведь тут вы найдете все самое необходимое.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider"
                >
                  Перейти в каталог
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => onNavigate('advisor')}
                  className="px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center gap-2 text-xs uppercase tracking-wider shadow-sm"
                >
                  Умный подборщик
                  <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>

            {/* Right Column: Sleek Minimalist Glass Tiles */}
            <div className="relative lg:col-span-5 space-y-3.5 z-10">
              {/* Tile 1 */}
              <div className="group bg-white/60 hover:bg-white/90 border border-slate-200/50 p-4 rounded-2xl shadow-sm text-left flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-[2px]">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                  <Building2 className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Цены заводов</h4>
                  <p className="text-slate-400 group-hover:text-slate-500 text-[11px] transition-colors leading-normal">
                    Прямые поставки от производителей без посредников и наценок
                  </p>
                </div>
              </div>

              {/* Tile 2 */}
              <div className="group bg-white/60 hover:bg-white/90 border border-slate-200/50 p-4 rounded-2xl shadow-sm text-left flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-[2px]">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Сертификаты качества</h4>
                  <p className="text-slate-400 group-hover:text-slate-500 text-[11px] transition-colors leading-normal">
                    Полный комплект паспортов качества и соответствия на каждую партию
                  </p>
                </div>
              </div>

              {/* Tile 3 */}
              <div className="group bg-white/60 hover:bg-white/90 border border-slate-200/50 p-4 rounded-2xl shadow-sm text-left flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-[2px]">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                  <Truck className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Региональные поставки</h4>
                  <p className="text-slate-400 group-hover:text-slate-500 text-[11px] transition-colors leading-normal">
                    Быстрая и надежная доставка со складов в Алматы и Астане
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {homePromotions.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Акции на главной</h2>
              <p className="text-slate-500 text-sm">Показываем только те предложения, которые менеджер отметил для главной страницы</p>
            </div>
            <button onClick={() => onNavigate('promotions')} className="text-sm font-bold text-emerald-700 hover:text-emerald-600 transition-colors">
              Все акции
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {homePromotions.map((promotion) => (
              <button
                key={promotion.id}
                type="button"
                onClick={() => onNavigate('promotions')}
                className="text-left rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-emerald-50/40 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                      <TicketPercent className="h-3.5 w-3.5" />
                      {promotion.badge || 'Акция'}
                    </span>
                    <h3 className="text-lg font-black text-slate-950 font-outfit leading-tight">{promotion.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{promotion.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] uppercase font-black tracking-[0.18em] text-emerald-700">Промокод</span>
                    <span className="block mt-1 px-3 py-2 rounded-xl bg-slate-900 text-white font-black tracking-[0.2em] text-sm">
                      {promotion.promoCode || 'AUTO'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-600">
                    {promotion.discountType === 'PERCENT' ? `Скидка ${promotion.discountValue}%` : `Скидка ${formatPrice(promotion.discountValue)}`}
                  </span>
                  <span className="font-bold text-emerald-700">Открыть акцию</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 🛡️ KEY STRENGTHS (ПРЕИМУЩЕСТВА) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Почему выбирают Tormag?</h2>
          <p className="text-slate-500 text-sm">Мы меняем подход к закупке строительных материалов в Казахстане</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-emerald">
              <Award className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Цены дистрибьюторов</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Вы заказываете товары напрямую с официальных региональных складов брендов, исключая наценки розничных магазинов.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-blue">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">100% Гарантия бренда</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Все поставщики проходят жесткую модерацию. Предоставляем сертификаты соответствия на каждую партию товара.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-violet">
              <Truck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Быстрая доставка</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Собственная курьерская сеть и грузовой транспорт гарантируют доставку в течение 24 часов с момента подтверждения.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="glossy-icon-shell glossy-icon-green">
              <Building2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Удобно для бизнеса</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Полный пакет закрывающих документов для ТОО и ИП. Работаем с НДС, предоставляем отсрочку платежа постоянным клиентам.
            </p>
          </div>

        </div>
      </section>

      {/* 📂 QUICK CATEGORIES PREVIEW */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Популярные категории</h2>
            <p className="text-slate-500 text-sm">Самые востребованные строительные материалы этого сезона</p>
          </div>
          <button 
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
          >
            Смотреть весь каталог
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesList.map(cat => (
            <div 
              key={cat.id}
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
            </div>
          ))}
        </div>
      </section>

      {/* 🛠️ WIDGET TEASER CARD */}
      <section className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-600/20 rounded-[2.5rem] p-8 md:p-12 text-left flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="space-y-4 max-w-xl relative z-10">
          <span className="text-[10px] bg-emerald-600/10 text-emerald-700 border border-emerald-600/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Интеллектуальная система</span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 font-outfit">Затрудняетесь с выбором материалов?</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            Воспользуйтесь нашим интерактивным умным подборщиком. Укажите тип ваших строительных или отделочных работ, выберите подходящий бюджетный уровень — и система мгновенно сформирует идеальный комплект товаров со складов поставщиков в Алматы.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('advisor')}
          className="px-8 py-4 bg-slate-900 hover:bg-emerald-600 hover:text-slate-950 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shrink-0 z-10"
        >
          Запустить подборщик
          <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-600" />
        </button>
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
              className="bg-white border border-slate-200/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-600/40 hover:shadow-sm transition-all group"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-12 max-w-[120px] object-contain mb-3 grayscale group-hover:grayscale-0 transition-all" />
              ) : null}
              <span className="font-black text-slate-400 group-hover:text-slate-800 text-lg transition-colors tracking-tight font-outfit">{brand.name}</span>
              <span className="text-[9px] text-slate-400 mt-1 block">{brand.desc}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
