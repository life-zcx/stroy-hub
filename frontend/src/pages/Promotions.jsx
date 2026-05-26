import React from 'react';
import { Tag, Sparkles, Percent, Calendar } from 'lucide-react';

export default function Promotions() {
  const activePromos = [
    {
      badge: "Спеццена",
      title: "Скидка на цемент М500 при заказе от 50 мешков",
      desc: "Получите специальную оптовую цену 2 300 ₸ вместо 2 500 ₸ за каждый мешок 50 кг при заказе большой партии сухой строительной смеси.",
      code: "CEMENT50",
      validUntil: "30.06.2026",
      color: "from-emerald-500 to-teal-600"
    },
    {
      badge: "Акция сезона",
      title: "Бесплатная доставка по Алматы при заказе от 300 000 ₸",
      desc: "Оформите заказ на любые строительные материалы на общую сумму свыше 300 000 ₸ и получите бесплатную логистику малотоннажным транспортом до дверей.",
      code: "FREESHIP",
      validUntil: "15.07.2026",
      color: "from-blue-500 to-indigo-600"
    },
    {
      badge: "Скидка партнера",
      title: "Скидка 10% на все лакокрасочные материалы Alina Paint",
      desc: "Премиальные водоэмульсионные краски, эмали и грунтовки со скидкой напрямую со складов производителя.",
      code: "ALINAPAINT10",
      validUntil: "10.06.2026",
      color: "from-amber-500 to-orange-600"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Акции и скидки</h1>
        <p className="text-slate-500 text-sm">Актуальные распродажи, партнерские скидки и промокоды в маркетплейсе StroyHub</p>
      </div>

      <div className="space-y-6">
        {activePromos.map((promo, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            {/* Colorful Left block */}
            <div className={`bg-gradient-to-br ${promo.color} text-white p-8 md:w-64 shrink-0 flex flex-col justify-between items-start gap-6`}>
              <span className="text-[10px] uppercase font-black bg-white/20 px-2.5 py-1 rounded-md tracking-wider">
                {promo.badge}
              </span>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-100 uppercase">Промокод</span>
                <span className="block font-black text-xl font-mono tracking-widest bg-slate-950/20 px-3 py-1.5 rounded-lg border border-white/10">{promo.code}</span>
              </div>
            </div>

            {/* Right block with description */}
            <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-950 text-lg font-outfit leading-snug">{promo.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{promo.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase border-t border-slate-50 pt-4 w-fit">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>Действительно до: {promo.validUntil}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
