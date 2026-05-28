import React from 'react';
import { Hammer, Truck, Shield, Layers, HelpCircle, HardHat, Paintbrush, Ruler } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: <HardHat className="h-6 w-6 text-amber-500" />,
      title: "Комплексное снабжение объектов",
      desc: "Оптовые поставки строительных и отделочных материалов под ключ для строительных площадок любого масштаба с гибкой системой скидок."
    },
    {
      icon: <Truck className="h-6 w-6 text-emerald-600" />,
      title: "Специализированная логистика",
      desc: "Доставка сыпучих и тяжелых материалов спецтехникой (манипуляторы, самосвалы, бетоновозы) напрямую с заводов и складов."
    },
    {
      icon: <Ruler className="h-6 w-6 text-blue-500" />,
      title: "Расчет и составление смет",
      desc: "Бесплатный точный расчет объема необходимых материалов (цемент, смеси, кирпичи) по вашим чертежам и спецификациям проекта."
    },
    {
      icon: <Paintbrush className="h-6 w-6 text-purple-500" />,
      title: "Шеф-монтаж и консультации",
      desc: "Выезд технических специалистов на объект для обучения ваших рабочих правильному применению строительных смесей и материалов."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Наши услуги</h1>
        <p className="text-slate-500 text-sm">Профессиональные сервисные решения для застройщиков и частных клиентов от Tormag</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="bg-slate-50 rounded-2xl p-3 w-fit">
              {s.icon}
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">{s.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-850 text-white rounded-3xl p-8 sm:p-10 text-center space-y-6">
        <h3 className="text-xl font-bold font-outfit">Нужна индивидуальная услуга или спецзаказ?</h3>
        <p className="text-slate-300 text-sm max-w-lg mx-auto">
          Свяжитесь с нашим отделом продаж! Мы поможем организовать нестандартные поставки, договориться о рассрочке платежа или аренде спецтехники.
        </p>
        <div className="pt-2">
          <a href="tel:77077111653" className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl transition-all shadow-lg text-sm">
            Позвонить: 8 (707) 711-16-53
          </a>
        </div>
      </div>
    </div>
  );
}
