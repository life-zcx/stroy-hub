import React from 'react';
import { Mail, Phone, Calendar, ShieldCheck, Percent, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-16 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
            {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Construction Crane Background */}
        <svg 
          className="absolute right-0 bottom-0 h-[110%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 100 100" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Ground line */}
          <line x1="0" y1="95" x2="100" y2="95" />
          {/* Tower vertical mast structure */}
          <line x1="75" y1="95" x2="75" y2="15" strokeWidth="1.2" />
          <line x1="78" y1="95" x2="78" y2="15" strokeWidth="1.2" />
          {/* Tower diagonals */}
          <line x1="75" y1="95" x2="78" y2="85" />
          <line x1="75" y1="85" x2="78" y2="95" />
          <line x1="75" y1="85" x2="78" y2="75" />
          <line x1="75" y1="75" x2="78" y2="85" />
          <line x1="75" y1="75" x2="78" y2="65" />
          <line x1="75" y1="65" x2="78" y2="75" />
          <line x1="75" y1="65" x2="78" y2="55" />
          <line x1="75" y1="55" x2="78" y2="65" />
          <line x1="75" y1="55" x2="78" y2="45" />
          <line x1="75" y1="45" x2="78" y2="55" />
          <line x1="75" y1="45" x2="78" y2="35" />
          <line x1="75" y1="35" x2="78" y2="45" />
          <line x1="75" y1="35" x2="78" y2="25" />
          <line x1="75" y1="25" x2="78" y2="35" />
          <line x1="75" y1="25" x2="78" y2="15" />
          <line x1="75" y1="15" x2="78" y2="25" />
          
          {/* Cabin */}
          <rect x="73" y="10" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />

          {/* Jib (horizontal arm) */}
          <line x1="25" y1="13" x2="95" y2="13" strokeWidth="1.2" />
          {/* Jib secondary structural line */}
          <line x1="30" y1="10" x2="75" y2="10" />
          <line x1="30" y1="10" x2="30" y2="13" />
          <line x1="40" y1="10" x2="40" y2="13" />
          <line x1="50" y1="10" x2="50" y2="13" />
          <line x1="60" y1="10" x2="60" y2="13" />
          <line x1="70" y1="10" x2="70" y2="13" />
          {/* Jib diagonals */}
          <line x1="30" y1="13" x2="40" y2="10" />
          <line x1="40" y1="13" x2="50" y2="10" />
          <line x1="50" y1="13" x2="60" y2="10" />
          <line x1="60" y1="13" x2="70" y2="10" />
          <line x1="70" y1="13" x2="75" y2="10" />

          {/* Counter-weight (back arm) */}
          <line x1="75" y1="13" x2="95" y2="13" />
          <rect x="88" y="13" width="5" height="4" fill="currentColor" fillOpacity="0.4" />
          <line x1="75" y1="10" x2="95" y2="13" />

          {/* Crane Hook and Cable */}
          <line x1="45" y1="13" x2="45" y2="50" strokeWidth="0.5" />
          {/* Hook */}
          <path d="M 44,50 Q 45,53 46,50 Q 47,49 45,49" strokeWidth="1" />
          {/* Cargo load */}
          <rect x="42" y="52" width="6" height="5" rx="0.5" fill="currentColor" fillOpacity="0.3" strokeWidth="0.5" />
          <line x1="45" y1="50" x2="42" y2="52" strokeWidth="0.5" />
          <line x1="45" y1="50" x2="48" y2="52" strokeWidth="0.5" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Платформа Tormag
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Новый казахстанский B2B/B2C маркетплейс прямых дистрибьюторских поставок строительных материалов
          </p>
        </div>
      </div>

      {/* Mission & Key Message Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-outfit">
            Наша миссия — честность и прозрачность
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Tormag — это молодая и амбициозная технологическая платформа, созданная для того, чтобы сделать рынок строительных материалов в Казахстане прозрачным и доступным. Как новый проект, мы нацелены в первую очередь на построение долгосрочного доверия с нашими клиентами. Мы стремимся зарекомендовать себя как безупречно надежный сервис, где каждый заказ доставляется точно в срок.
          </p>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Наш главный приоритет — предложить вам честные низкие цены без скрытых наценок. Мы исключаем длинные цепочки посредников и связываем вас напрямую с заводами-производителями и их официальными складами, гарантируя оригинальность и высокое качество поставляемой продукции.
          </p>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 font-outfit">Почему выбирают Tormag?</h3>
            <p className="text-sm text-slate-500">Каждый день мы совершенствуем сервис, чтобы сделать закупки более выгодными и простыми.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Гарантия качества</h4>
                <p className="text-xs text-slate-500">Только сертифицированный товар от проверенных заводов.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm text-emerald-600">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Прямые цены</h4>
                <p className="text-xs text-slate-500">Никаких посредников — честные цены первого поставщика.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm text-emerald-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Быстрая логистика</h4>
                <p className="text-xs text-slate-500">Согласование и отправка заказов день в день.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with Glassmorphic Style Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-outfit text-slate-900">Tormag в цифрах</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <div className="space-y-3">
              <div className="text-emerald-600 font-black text-4xl md:text-5xl font-outfit tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                0%
              </div>
              <h4 className="font-bold text-slate-900 text-base">Переплат и наценок</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Работаем напрямую с производителями, полностью исключая комиссии и переплаты третьим лицам.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-600 to-emerald-700"></div>
            <div className="space-y-3">
              <div className="text-slate-900 font-black text-4xl md:text-5xl font-outfit tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                100%
              </div>
              <h4 className="font-bold text-slate-900 text-base">Оригинальный товар</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Вся продукция имеет необходимые сертификаты и отгружается непосредственно со складов брендов.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-slate-800 to-slate-900"></div>
            <div className="space-y-3">
              <div className="text-slate-900 font-black text-4xl md:text-5xl font-outfit tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">
                24 часа
              </div>
              <h4 className="font-bold text-slate-900 text-base">Быстрая отгрузка</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Согласование спецификаций, комплектация и отправка заказов со склада в течение суток.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Contact Details Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-outfit text-slate-900">Контакты и поддержка</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Phone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Телефон поддержки</span>
              <a href="tel:77077111653" className="block text-lg font-bold text-slate-950 hover:text-emerald-600 transition-colors">
                8 (707) 711-16-53
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Сотрудничество</span>
              <span className="block text-lg font-bold text-slate-950">partner@tormag.kz</span>
              <span className="block text-xs text-slate-500 font-medium text-emerald-600">Отдел по работе с поставщиками</span>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Режим работы</span>
              <span className="block text-lg font-bold text-slate-950">Пн - Пт: 08:00 - 17:00</span>
              <span className="block text-xs text-slate-500">Суббота, Воскресенье — выходные дни</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
