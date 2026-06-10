import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "Как оформить заказ юридическому лицу?",
      a: "При оформлении заказа в корзине выберите тип плательщика 'Юридическое лицо', укажите реквизиты (БИН, ТОО/ИП) и контакты. Наш менеджер проверит наличие товара и подготовит счет на оплату. После зачисления средств мы подготовим ЭСФ и все необходимые сопроводительные документы."
    },
    {
      q: "Можно ли забрать материалы самовывозом?",
      a: "Да, самовывоз доступен со складов. После оформления и подтверждения заказа менеджером вам будут предоставлены точный адрес склада, номер накладной и контакты ответственного сотрудника для получения товара."
    },
    {
      q: "Как рассчитывается стоимость доставки тяжелых грузов?",
      a: "Стоимость доставки рассчитывается индивидуально менеджером после оформления заказа. Сумма зависит от веса, габаритов груза, точного адреса разгрузки и необходимости привлечения специальной техники (например, манипулятора)."
    },
    {
      q: "Как происходит оплата и проверка товара?",
      a: "Оплата производится при получении товара после его осмотра. Вы можете оплатить заказ наличными курьеру или через Kaspi QR при доставке. Перед оплатой вы проверяете соответствие, количество и качество доставленных материалов."
    },
    {
      q: "Как вернуть излишки неиспользованных материалов?",
      a: "Если у вас остались целые, нераспечатанные мешки сухих смесей или другие целые упаковки товара, вы можете оформить возврат в течение 14 дней. Важно сохранить заводской товарный вид продукции и предоставить чек."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG FAQ Question Mark Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Large Help Mark Outline */}
          <path d="M50 20 C65 10 80 25 70 38 C65 45 60 48 60 55" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="65" r="3" fill="currentColor" />

          {/* Small decorative circles */}
          <circle cx="25" cy="30" r="4" opacity="0.15" />
          <circle cx="95" cy="50" r="6" opacity="0.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Вопрос — Ответ
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Часто задаваемые вопросы о покупках, логистике и документообороте на строительной платформе Tormag
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm transition-all">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-950 hover:bg-slate-50 transition-colors gap-4"
              >
                <span className="flex items-center gap-3 font-outfit text-sm text-slate-900">
                  <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  {faq.q}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-slate-550 text-xs sm:text-sm leading-relaxed border-t border-slate-50 animate-fade-in font-semibold">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
