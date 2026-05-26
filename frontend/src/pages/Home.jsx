import React from 'react';
import { 
  ArrowRight, ShieldCheck, Truck, Hammer, SlidersHorizontal, 
  Award, Sparkles, ClipboardList, Building2 
} from 'lucide-react';

export default function Home({ onNavigate, setSelectedCategory }) {
  const categoriesList = [
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
      <div className="relative py-12 md:py-20 flex items-center">
        {/* Subtle ambient blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
          
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
          <div className="lg:col-span-5 bg-slate-50/50 border border-slate-100 p-5 sm:p-6 rounded-[36px] backdrop-blur-[2px]">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-850 font-bold text-sm">01</div>
                <h4 className="font-extrabold text-slate-900 text-sm">Цены заводов</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Реальная стоимость первого дистрибьюторского уровня без скрытых наценок</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">02</div>
                <h4 className="font-extrabold text-slate-900 text-sm">Сертификаты</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Полный комплект документов соответствия на каждую партию</p>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] space-y-3 text-left col-span-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">03</div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Региональные поставки</h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Оперативная логистика со складов дилеров в Алматы и других регионах</p>
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
            <div className="w-12 h-12 bg-emerald-50/80 rounded-2xl flex items-center justify-center text-emerald-850">
              <Award className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Цены дистрибьюторов</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Вы заказываете товары напрямую с официальных региональных складов брендов, исключая наценки розничных магазинов.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50/80 rounded-2xl flex items-center justify-center text-blue-700">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">100% Гарантия бренда</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Все поставщики проходят жесткую модерацию. Предоставляем сертификаты соответствия на каждую партию товара.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50/80 rounded-2xl flex items-center justify-center text-purple-700">
              <Truck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Быстрая доставка</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Собственная курьерская сеть и грузовой транспорт гарантируют доставку в течение 24 часов с момента подтверждения.
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm text-left space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50/80 rounded-2xl flex items-center justify-center text-green-700">
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
