import React, { useEffect, useState } from 'react';
import {
  ArrowRight, ShieldCheck, Truck, SlidersHorizontal,
  Award, Building2, TicketPercent, FileSpreadsheet
} from 'lucide-react';
import { getBrands, getHomePromotions } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-50/50 via-white to-white border border-slate-200/40 px-8 py-16 md:py-24">
        {/* Soft, beautiful ambient glowing spheres (SaaS style) */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-10 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none z-0"></div>
        <div className="absolute -bottom-30 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none z-0"></div>

        <div className="relative flex items-center z-10">
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
                  Прямые поставки строительных материалов <span className="text-blue-600 font-extrabold">от ведущих дистрибьюторов Казахстана</span>
                </p>
                
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-normal max-w-xl">
                  Комплексное снабжение строительных объектов, гарантированное качество и прозрачные оптовые условия для вашего бизнеса.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="w-full sm:w-auto justify-center px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <span>Перейти в каталог</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('estimate')}
                  className="w-full sm:w-auto justify-center px-8 py-4 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 transform hover:-translate-y-0.5 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <span>Заказ по смете</span>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
            </div>

            {/* Right Column: Sleek Minimalist Glass Tiles */}
            <div className="relative lg:col-span-5 space-y-4 z-10">
              {/* Tile 1 */}
              <div className="group bg-white hover:bg-slate-900 border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-[2px]">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white group-hover:border-transparent shrink-0 shadow-sm">
                  <Building2 className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base font-outfit transition-colors duration-300 group-hover:text-white">Цены заводов</h4>
                  <p className="text-slate-550 group-hover:text-slate-300 text-xs transition-colors duration-300 leading-relaxed font-semibold">
                    Прямые поставки от производителей без посредников и наценок
                  </p>
                </div>
              </div>

              {/* Tile 2 */}
              <div className="group bg-white hover:bg-slate-900 border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-[2px]">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white group-hover:border-transparent shrink-0 shadow-sm">
                  <ShieldCheck className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base font-outfit transition-colors duration-300 group-hover:text-white">Сертификаты качества</h4>
                  <p className="text-slate-550 group-hover:text-slate-300 text-xs transition-colors duration-300 leading-relaxed font-semibold">
                    Полный комплект паспортов качества и соответствия на каждую партию
                  </p>
                </div>
              </div>

              {/* Tile 3 */}
              <div className="group bg-white hover:bg-slate-900 border border-slate-200/80 p-5 rounded-3xl shadow-sm text-left flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-[2px]">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/30 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white group-hover:border-transparent shrink-0 shadow-sm">
                  <Truck className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base font-outfit transition-colors duration-300 group-hover:text-white">Региональные поставки</h4>
                  <p className="text-slate-550 group-hover:text-slate-300 text-xs transition-colors duration-300 leading-relaxed font-semibold">
                    Быстрая и надежная доставка со складов в Алматы и Астане
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {homePromotions.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-outfit">Акции и спецпредложения</h2>
              <p className="text-slate-500 text-sm">Актуальные сезонные предложения, промокоды и распродажи</p>
            </div>
            <button onClick={() => onNavigate('promotions')} className="text-sm font-bold text-emerald-700 hover:text-emerald-600 transition-colors flex items-center gap-1">
              Все акции <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homePromotions.map((promotion) => (
              <div
                key={promotion.id}
                onClick={() => onNavigate('promotions', promotion.id)}
                className="group cursor-pointer bg-white rounded-[2rem] border border-slate-200/80 hover:shadow-xl hover:border-emerald-500/20 transition-all duration-500 overflow-hidden flex flex-col h-full"
              >
                {/* Visual Area */}
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-50 border-b border-slate-100 shrink-0">
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

                  {/* Promo Badge / Discount Badge overlay for image layouts */}
                  {(promotion.imageCard || promotion.image) && promotion.discountValue > 0 && (
                    <span className="absolute bottom-4 left-4 bg-yellow-300 border border-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      -{promotion.discountValue}{promotion.discountType === 'PERCENT' ? '%' : ' ₸'}
                    </span>
                  )}

                  {/* Promo Code indicator overlay */}
                  {promotion.promoCode && (
                    <span className="absolute top-4 right-4 bg-slate-950/75 backdrop-blur-md border border-white/10 text-white rounded-xl px-2.5 py-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider shadow-md">
                      <TicketPercent className="h-3 w-3 text-emerald-400" />
                      <span>{promotion.promoCode}</span>
                    </span>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-6 flex flex-col justify-between flex-grow text-left">
                  <div className="space-y-2">
                    <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">
                      {promotion.badge || 'Акция'}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 font-outfit leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {promotion.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                      {promotion.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-[10px]">
                      {promotion.discountType === 'PERCENT' ? `Скидка ${promotion.discountValue}%` : `Скидка ${formatPrice(promotion.discountValue)}`}
                    </span>
                    <span className="font-bold text-emerald-700 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                      Открыть акцию <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
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

      {/* 🎁 PROMO FOR REVIEWS BANNER */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-left flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden text-white shadow-xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4 max-w-2xl relative z-10">
          <h3 className="text-3xl md:text-4xl font-black text-white font-outfit leading-tight">Получите скидку 10% за ваш отзыв!</h3>
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-semibold">
            Помогите другим покупателям сделать правильный выбор! Оставьте оценку и честный отзыв к любому купленному товару в вашем личном кабинете, и мы мгновенно вышлем вам персональный промокод на скидку 10% для следующего заказа.
          </p>
        </div>
        <button
          onClick={() => onNavigate('orders')}
          className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shrink-0 z-10 cursor-pointer text-xs uppercase tracking-wider font-outfit"
        >
          Оценить покупки
          <Award className="h-4.5 w-4.5 text-blue-600" />
        </button>
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
          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 font-outfit">Затрудняетесь с выбором материалов?</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            Воспользуйтесь нашим интерактивным умным калькулятором. Укажите тип ваших строительных или отделочных работ, выберите подходящий бюджетный уровень — и система мгновенно сформирует идеальный комплект товаров со складов в Алматы.
          </p>
        </div>
        <button
          onClick={() => onNavigate('advisor')}
          className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shrink-0 z-10"
        >
          Рассчитать материалы
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
