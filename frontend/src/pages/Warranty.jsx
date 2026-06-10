import React from 'react';
import { ShieldCheck, Award, Clock } from 'lucide-react';

export default function Warranty() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* SVG Quality Shield Background */}
        <svg
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block"
          viewBox="0 0 120 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          {/* Badge / Medal Outline */}
          <circle cx="60" cy="35" r="18" fill="currentColor" fillOpacity="0.05" strokeWidth="1" />
          <circle cx="60" cy="35" r="14" fill="none" strokeWidth="0.8" />

          {/* Ribbons */}
          <path d="M52 50 l-6 20 l14 -6 l14 6 l-6 -20" fill="currentColor" fillOpacity="0.1" />

          {/* Star in center */}
          <path d="M60 27 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="currentColor" fillOpacity="0.2" />

          {/* Compass / Blueprint circles */}
          <circle cx="20" cy="50" r="10" opacity="0.2" />
          <circle cx="100" cy="20" r="8" opacity="0.15" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Гарантия качества
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Гарантийные обязательства, сертификация соответствия и правила возврата материалов на платформе Tormag
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">100% Оригинальная продукция</h3>
            <p className="text-slate-400 text-xs mt-0.5 font-semibold">Поставки осуществляются только с официальных дилерских складов</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-semibold">
          Tormag является партнерской площадкой проверенных поставщиков и авторизованных дилеров строительной индустрии. Мы гарантируем оригинальность всей поставляемой продукции. Все товары имеют официальные сертификаты соответствия стандартам ГОСТ и СТ-КЗ, которые предоставляются по требованию покупателя.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-4">
          <Clock className="h-6 w-6 text-slate-900" />
          <h4 className="font-extrabold text-slate-955 text-base font-outfit">Возврат товара в течение 14 дней</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Вы имеете право вернуть товар надлежащего качества в течение 14 календарных дней с момента покупки, если сохранен товарный вид, заводская упаковка, пломбы и сопроводительные документы.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm space-y-4">
          <Award className="h-6 w-6 text-slate-900" />
          <h4 className="font-extrabold text-slate-955 text-base font-outfit">Заводская гарантия брендов</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            На технически сложные товары (строительное оборудование, электроинструмент) распространяется официальная гарантия производителя (от 1 года до 3 лет). Обслуживание производится в сертифицированных сервисных центрах.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 space-y-6 relative overflow-hidden shadow-md">
        <h3 className="text-lg font-extrabold font-outfit text-emerald-400 relative z-10">Порядок действий при обнаружении брака</h3>
        <div className="space-y-4 text-sm relative z-10">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-black shrink-0 mt-0.5">1</span>
            <p className="text-slate-300 font-semibold">
              Сделайте качественные фотографии или видеозапись дефекта строительного материала непосредственно на объекте во время разгрузки.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-black shrink-0 mt-0.5">2</span>
            <p className="text-slate-300 font-semibold">
              Свяжитесь со службой поддержки Tormag или отправьте рекламацию с фотографиями на электронный адрес: <strong className="text-white">support@tormag.kz</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-black shrink-0 mt-0.5">3</span>
            <p className="text-slate-300 font-semibold">
              Наши менеджеры организуют независимую экспертизу или согласуют с дистрибьютором бесплатную замену дефектной партии в течение 48 часов.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 -z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20"></div>
      </div>
    </div>
  );
}
