import React from 'react';
import { CreditCard, Wallet, Receipt, Percent, ShieldCheck } from 'lucide-react';

export default function PaymentTerms() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Payment Shield Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Credit Card Outline */}
          <rect x="30" y="20" width="60" height="38" rx="4" fill="currentColor" fillOpacity="0.05" />
          <line x1="30" y1="28" x2="90" y2="28" strokeWidth="1.5" />
          <rect x="36" y="36" width="12" height="8" rx="1" fill="currentColor" fillOpacity="0.2" />
          
          {/* Shield Outline */}
          <path d="M95 15c4 0 7 2 7 2s0 8-3 12-4 5-4 5-1-1-4-5-3-9-3-12c0 0 3-2 7-2z" fill="currentColor" fillOpacity="0.1" strokeWidth="1" />
          
          {/* Waves / Connections */}
          <path d="M10 50 Q 25 35 40 50 T 70 50" opacity="0.3" />
          <path d="M15 55 Q 30 40 45 55 T 75 55" opacity="0.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Условия оплаты
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Все способы и детали осуществления расчетов на строительной платформе Tormag
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Оплата при получении</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Вы можете оплатить ваш заказ наличными курьеру непосредственно при доставке строительных материалов на ваш объект.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Kaspi QR / Kaspi Red</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Оплачивайте покупки мгновенно с помощью Kaspi QR курьеру при получении товара. Также доступна удобная рассрочка Kaspi Red без процентов и переплат.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Безналичный расчет для B2B</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Для юридических лиц предусмотрена оплата по выставленному счету на ТОО или ИП. После согласования сметы наш менеджер выставит официальный счет. Все закрывающие документы предоставляются через ИС ЭСФ.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Предоплата и рассрочка</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Крупнооптовые партии товаров и спецзаказы напрямую с заводов поставляются по частичной предоплате (от 50%), остаток оплачивается по факту готовности к разгрузке на объекте.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-950 text-sm font-outfit">Проверка качества перед оплатой</h4>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed font-semibold">
            Tormag гарантирует прозрачность расчетов. Перед совершением оплаты и приемом строительных материалов вы имеете полное право осмотреть доставленную продукцию на комплектность, целостность упаковки и соответствие заявленному качеству.
          </p>
        </div>
      </div>
    </div>
  );
}
