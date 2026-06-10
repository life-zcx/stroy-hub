import React from 'react';
import { Truck, MapPin, ShieldAlert, Compass, Navigation } from 'lucide-react';

export default function DeliveryTerms() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Delivery Truck Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Road line */}
          <line x1="0" y1="70" x2="120" y2="70" />
          
          {/* Truck Body */}
          <rect x="25" y="25" width="65" height="35" rx="3" fill="currentColor" fillOpacity="0.05" />
          <rect x="90" y="35" width="20" height="25" rx="2" fill="currentColor" fillOpacity="0.1" />
          
          {/* Cab windshield and details */}
          <path d="M100 37h7v10h-7z" fill="currentColor" fillOpacity="0.2" />
          <line x1="90" y1="35" x2="90" y2="60" />
          
          {/* Wheels */}
          <circle cx="40" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="40" cy="65" r="2" fill="none" />
          <circle cx="56" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="56" cy="65" r="2" fill="none" />
          <circle cx="95" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="95" cy="65" r="2" fill="none" />

          {/* Speed/motion lines */}
          <line x1="5" y1="30" x2="18" y2="30" strokeWidth="1.2" />
          <line x1="8" y1="40" x2="20" y2="40" strokeWidth="1.2" />
          <line x1="3" y1="50" x2="15" y2="50" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Условия доставки
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Сроки, транспорт и тарифы на транспортировку строительных грузов по Казахстану
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-3">
          <MapPin className="h-6 w-6 text-emerald-600" />
          <h4 className="font-extrabold text-slate-950 text-sm font-outfit">В черте г. Алматы</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Сроки: от 4 до 24 часов после подтверждения заказа. Бесплатная доставка при заказе на сумму свыше 150 000 ₸.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-3">
          <Navigation className="h-6 w-6 text-slate-900" />
          <h4 className="font-extrabold text-slate-950 text-sm font-outfit">Алматинская область</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Сроки: 1-2 дня. Стоимость рассчитывается индивидуально менеджером при подтверждении заказа.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-3">
          <Compass className="h-6 w-6 text-slate-900" />
          <h4 className="font-extrabold text-slate-950 text-sm font-outfit">Регионы РК</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Организация ЖД и автомобильных грузоперевозок по всему Казахстану. Индивидуальный расчет стоимости под крупные оптовые объемы.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-slate-950 font-outfit border-b border-slate-100 pb-3">Доступный грузовой транспорт</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-slate-100">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Малотоннажный транспорт (до 2.5 тонн)</span>
              <p className="text-slate-400 text-xs font-semibold">Газели, небольшие бортовые грузовики. Подходит для смесей, красок, крепежа.</p>
            </div>
            <span className="font-extrabold text-slate-550 text-xs whitespace-nowrap shrink-0">рассчитывается индивидуально</span>
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-slate-100">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Грузовой транспорт с краном-манипулятором</span>
              <p className="text-slate-400 text-xs font-semibold">Для транспортировки кирпича, блоков, плит перекрытий. Выполняет автоматическую разгрузку.</p>
            </div>
            <span className="font-extrabold text-slate-550 text-xs whitespace-nowrap shrink-0">рассчитывается индивидуально</span>
          </div>

          <div className="flex items-start justify-between gap-4 py-2">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Тяжелая спецтехника (до 20 тонн)</span>
              <p className="text-slate-400 text-xs font-semibold">Шаланды, длинномеры, самосвалы под сыпучие материалы.</p>
            </div>
            <span className="font-extrabold text-slate-550 text-xs whitespace-nowrap shrink-0">рассчитывается индивидуально</span>
          </div>
        </div>
      </div>
    </div>
  );
}
