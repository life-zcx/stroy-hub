import React from 'react';
import { Truck, MapPin, ShieldAlert, Compass, Navigation } from 'lucide-react';

export default function DeliveryTerms() {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Условия доставки</h1>
        <p className="text-slate-500 text-sm">Сроки, транспорт и тарифы на транспортировку строительных грузов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-3">
          <MapPin className="h-6 w-6 text-emerald-600" />
          <h4 className="font-extrabold text-slate-950 text-sm font-outfit">В черте г. Алматы</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            От 3 000 ₸. Сроки: от 4 до 24 часов после оплаты. Бесплатная доставка при заказе на сумму свыше 500 000 ₸.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-3">
          <Navigation className="h-6 w-6 text-slate-900" />
          <h4 className="font-extrabold text-slate-950 text-sm font-outfit">Алматинская область</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            От 6 000 ₸. Сроки: 1-2 дня. Точный расчет стоимости производится логистическим калькулятором на основании километража.
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
        <h3 className="text-lg font-extrabold text-slate-950 font-outfit border-b border-slate-100 pb-3">Наш грузовой автопарк</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-slate-100">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Малотоннажный транспорт (до 2.5 тонн)</span>
              <p className="text-slate-400 text-xs font-semibold">Газели, небольшие бортовые грузовики. Подходит для смесей, красок, крепежа.</p>
            </div>
            <span className="font-extrabold text-slate-950 text-sm whitespace-nowrap shrink-0">от 3 000 ₸</span>
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-slate-100">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Грузовой транспорт с краном-манипулятором</span>
              <p className="text-slate-400 text-xs font-semibold">Для транспортировки кирпича, блоков, плит перекрытий. Выполняет автоматическую разгрузку.</p>
            </div>
            <span className="font-extrabold text-slate-950 text-sm whitespace-nowrap shrink-0">от 12 000 ₸</span>
          </div>

          <div className="flex items-start justify-between gap-4 py-2">
            <div>
              <span className="block font-bold text-slate-900 text-sm">Тяжелая спецтехника (до 20 тонн)</span>
              <p className="text-slate-400 text-xs font-semibold">Шаланды, длинномеры, самосвалы под сыпучие материалы.</p>
            </div>
            <span className="font-extrabold text-slate-950 text-sm whitespace-nowrap shrink-0">договорная</span>
          </div>
        </div>
      </div>
    </div>
  );
}
