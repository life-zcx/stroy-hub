import React from 'react';
import { 
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2
} from 'lucide-react';

export default function Home({ onNavigate, setSelectedCategory, categories = [] }) {
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

  const brandLogos = [
    { name: 'Bosch', desc: 'Проф. инструменты' },
    { name: 'Knauf', desc: 'Сухие смеси и ГКЛ' },
    { name: 'Tikkurila', desc: 'Премиум краски' },
    { name: 'Makita', desc: 'Японское качество' },
    { name: 'Технониколь', desc: 'Кровля и изоляция' },
    { name: 'Alina', desc: 'Казахстанский бренд' }
  ];

  return (
    <div className="space-y-20 animate-fade-in-up font-sans text-slate-800">
      
      {/* 🚀 ULTRA-MINIMALIST LIGHT HERO SECTION */}
      <div className="relative">
        {/* Subtle ambient blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none z-0"></div>
        <svg className="hero-blueprint-field" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
          {/* Grid Pattern Definition */}
          <defs>
            <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(15, 118, 110, 0.12)" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

          {/* Technical Drawing Coordinate Axes (Оси здания) */}
          {/* Axis A */}
          <line x1="120" y1="0" x2="120" y2="520" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="120" cy="520" r="14" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1" />
          <text x="120" y="524" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">А</text>

          {/* Axis B */}
          <line x1="680" y1="0" x2="680" y2="520" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="680" cy="520" r="14" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1" />
          <text x="680" y="524" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">Б</text>

          {/* Axis C */}
          <line x1="1200" y1="0" x2="1200" y2="520" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="1200" cy="520" r="14" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1" />
          <text x="1200" y="524" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">В</text>

          {/* Horizontal Axis 1 */}
          <line x1="0" y1="160" x2="1440" y2="160" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="40" cy="160" r="14" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1" />
          <text x="40" y="164" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">1</text>

          {/* Horizontal Axis 2 */}
          <line x1="0" y1="420" x2="1440" y2="420" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" strokeDasharray="8 6" />
          <circle cx="40" cy="420" r="14" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1" />
          <text x="40" y="424" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">2</text>

          {/* Room Floor Plan Sketch (Чертеж комнат и стен - классический маркер архитектуры) */}
          <g opacity="0.95">
            {/* Main Outer Thick Walls */}
            <rect x="220" y="100" width="340" height="240" rx="6" stroke="rgba(15, 118, 110, 0.42)" strokeWidth="2.5" />
            <rect x="228" y="108" width="324" height="224" rx="4" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            
            {/* Interior wall partitioning */}
            <line x1="390" y1="108" x2="390" y2="332" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="2" />
            
            {/* Classic Architectural Door Swing Symbol (Дверной проем с радиусом открывания) */}
            <path d="M 390 200 L 420 200 A 30 30 0 0 1 390 230 L 390 200" fill="none" stroke="rgba(15, 118, 110, 0.42)" strokeWidth="1.25" />
            <line x1="390" y1="200" x2="390" y2="230" stroke="rgba(15, 118, 110, 0.45)" strokeWidth="2" />

            {/* Window symbols */}
            <rect x="280" y="96" width="50" height="8" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />
            <line x1="280" y1="100" x2="330" y2="100" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />

            <rect x="470" y="96" width="50" height="8" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />
            <line x1="470" y1="100" x2="520" y2="100" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />

            {/* Pillar supports */}
            <rect x="216" y="96" width="8" height="8" fill="rgba(15, 118, 110, 0.55)" />
            <rect x="556" y="96" width="8" height="8" fill="rgba(15, 118, 110, 0.55)" />
            <rect x="216" y="336" width="8" height="8" fill="rgba(15, 118, 110, 0.55)" />
            <rect x="556" y="336" width="8" height="8" fill="rgba(15, 118, 110, 0.55)" />
          </g>

          {/* Dimension Lines (Размерные линии с архитектурными засечками) */}
          <g opacity="0.95">
            {/* Top dimension line */}
            <line x1="220" y1="60" x2="560" y2="60" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />
            <line x1="215" y1="65" x2="225" y2="55" stroke="rgba(15, 118, 110, 0.6)" strokeWidth="1.5" />
            <line x1="555" y1="65" x2="565" y2="55" stroke="rgba(15, 118, 110, 0.6)" strokeWidth="1.5" />
            <line x1="385" y1="65" x2="395" y2="55" stroke="rgba(15, 118, 110, 0.45)" strokeWidth="1.5" />
            
            <rect x="360" y="49" width="60" height="20" fill="#f8fafc" />
            <text x="390" y="63" textAnchor="middle" fill="rgba(15, 118, 110, 0.85)" fontSize="10.5" fontWeight="bold" fontFamily="monospace">12 400</text>

            {/* Left vertical dimension line */}
            <line x1="170" y1="100" x2="170" y2="340" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" />
            <line x1="165" y1="105" x2="175" y2="95" stroke="rgba(15, 118, 110, 0.6)" strokeWidth="1.5" />
            <line x1="165" y1="335" x2="175" y2="345" stroke="rgba(15, 118, 110, 0.6)" strokeWidth="1.5" />
            
            <rect x="145" y="209" width="48" height="20" fill="#f8fafc" />
            <text x="169" y="222" textAnchor="middle" fill="rgba(15, 118, 110, 0.8)" fontSize="10.5" fontWeight="bold" fontFamily="monospace" transform="rotate(-90 169 219)">8 600</text>
          </g>

          {/* Construction Tower Crane Sketch (Чертеж строительного башенного крана справа за карточками) */}
          <g transform="translate(1010, 50) scale(0.92)" opacity="0.9">
            {/* Crane Lattice Mast (Башня крана - решетчатая ферма) */}
            <line x1="80" y1="60" x2="80" y2="480" stroke="rgba(15, 118, 110, 0.35)" strokeWidth="1.5" />
            <line x1="100" y1="60" x2="100" y2="480" stroke="rgba(15, 118, 110, 0.35)" strokeWidth="1.5" />
            
            {/* Mast braces */}
            <line x1="80" y1="110" x2="100" y2="110" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="160" x2="100" y2="160" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="210" x2="100" y2="210" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="260" x2="100" y2="260" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="310" x2="100" y2="310" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="360" x2="100" y2="360" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            <line x1="80" y1="410" x2="100" y2="410" stroke="rgba(15, 118, 110, 0.28)" strokeWidth="1" />
            
            {/* Mast diagonals */}
            <line x1="80" y1="60" x2="100" y2="110" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="100" y1="110" x2="80" y2="160" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="80" y1="160" x2="100" y2="210" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="100" y1="210" x2="80" y2="260" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="80" y1="260" x2="100" y2="310" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="100" y1="310" x2="80" y2="360" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="80" y1="360" x2="100" y2="410" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />
            <line x1="100" y1="410" x2="80" y2="460" stroke="rgba(15, 118, 110, 0.25)" strokeWidth="1" />

            {/* Operator Cabin */}
            <rect x="70" y="30" width="22" height="30" rx="3" fill="#f8fafc" stroke="rgba(15, 118, 110, 0.5)" strokeWidth="1.5" />
            <line x1="76" y1="40" x2="86" y2="40" stroke="rgba(15, 118, 110, 0.45)" strokeWidth="1" />

            {/* Apex */}
            <path d="M 80 30 L 90 0 L 100 30" stroke="rgba(15, 118, 110, 0.45)" strokeWidth="1.5" />

            {/* Crane Lattice Jib */}
            <line x1="-120" y1="30" x2="280" y2="30" stroke="rgba(15, 118, 110, 0.42)" strokeWidth="1.5" />
            <line x1="-120" y1="18" x2="280" y2="18" stroke="rgba(15, 118, 110, 0.3)" strokeWidth="1" />
            {/* Jib diagonals */}
            <path d="M -120 30 L -100 18 L -80 30 L -60 18 L -40 30 L -20 18 L 0 30 L 20 18 L 40 30 L 60 18 L 80 30 L 100 18 L 120 30 L 140 18 L 160 30 L 180 18 L 200 30 L 220 18 L 240 30 L 260 18 L 280 30" stroke="rgba(15, 118, 110, 0.22)" strokeWidth="1" />

            {/* Counter-weight blocks */}
            <rect x="-100" y="30" width="30" height="20" fill="rgba(15, 118, 110, 0.15)" stroke="rgba(15, 118, 110, 0.45)" strokeWidth="1" />

            {/* Trolley and Hook */}
            <rect x="180" y="30" width="12" height="6" fill="rgba(15, 118, 110, 0.5)" />
            <line x1="186" y1="36" x2="186" y2="160" stroke="rgba(15, 118, 110, 0.38)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="186" cy="162" r="3" fill="rgba(15, 118, 110, 0.6)" />
            <path d="M 186 165 C 183 168 183 172 186 172 C 188 172 188 169 186 169" stroke="rgba(15, 118, 110, 0.6)" strokeWidth="1" fill="none" />
          </g>

          {/* Protractors/Technical Drawing Angle Guide in the center-right */}
          <g transform="translate(740, 260)" opacity="0.8">
            <circle cx="0" cy="0" r="70" stroke="rgba(15, 118, 110, 0.18)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="0" cy="0" r="100" stroke="rgba(15, 118, 110, 0.12)" strokeWidth="1" />
            <line x1="-120" y1="0" x2="120" y2="0" stroke="rgba(15, 118, 110, 0.15)" strokeWidth="1" />
            <line x1="0" y1="-120" x2="0" y2="120" stroke="rgba(15, 118, 110, 0.15)" strokeWidth="1" />
          </g>
        </svg>

        <div className="relative py-12 md:py-20 flex items-center z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
            
            {/* Left Column: Text Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-outfit">
                Прямые поставки <br />
                <span className="text-emerald-900">
                  от производителей
                </span>
              </h1>
              
              <p className="text-slate-500 text-sm md:text-base leading-relaxed font-normal max-w-lg">
                Первый специализированный строительный маркетплейс-агрегатор в Казахстане. Связываем застройщиков и частных лиц напрямую с заводами и официальными дистрибьюторами.
              </p>

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
                  <SlidersHorizontal className="h-4 w-4 text-emerald-800" />
                </button>
              </div>
            </div>

            {/* Right Column: Clean Minimalist Showcase Grid with Soft Background Pod */}
            <div className="relative lg:col-span-5 bg-slate-50/60 border border-white/80 p-5 sm:p-6 rounded-[36px] backdrop-blur-[2px] shadow-[0_24px_80px_-54px_rgba(15,23,42,0.65)] overflow-hidden">
              <div className="relative z-10 space-y-4">
                {/* Card 1 */}
                <div className="bg-white/90 border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="glossy-icon-shell glossy-icon-emerald shrink-0">
                    <Building2 className="h-5.5 w-5.5" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Цены заводов</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Реальная стоимость первого дистрибьюторского уровня напрямую с заводов-изготовителей без скрытых наценок посредников.
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/90 border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="glossy-icon-shell glossy-icon-blue shrink-0">
                    <ShieldCheck className="h-5.5 w-5.5" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Сертификаты качества</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Полный комплект паспортов качества, экологических заключений и официальных сертификатов соответствия на каждую партию.
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white/90 border border-slate-200/50 p-5 rounded-3xl shadow-sm text-left flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="glossy-icon-shell glossy-icon-violet shrink-0">
                    <Truck className="h-5.5 w-5.5" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm font-outfit">Региональные поставки</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Оперативная и надежная доставка грузовым спецтранспортом со складов дилеров in Алматы, Астане и других крупных регионах Казахстана.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🛡️ KEY STRENGTHS (ПРЕИМУЩЕСТВА) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Почему выбирают StroyHub?</h2>
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
      <section className="bg-gradient-to-br from-teal-500/10 to-emerald-600/5 border border-emerald-600/20 rounded-[2.5rem] p-8 md:p-12 text-left flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
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
              key={i}
              className="bg-white border border-slate-200/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-emerald-600/40 hover:shadow-sm transition-all group"
            >
              <span className="font-black text-slate-400 group-hover:text-slate-800 text-lg transition-colors tracking-tight font-outfit">{brand.name}</span>
              <span className="text-[9px] text-slate-400 mt-1 block">{brand.desc}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
