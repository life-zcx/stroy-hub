import React, { useState } from 'react';
import { Hammer, Truck, Shield, Layers, HelpCircle, HardHat, Paintbrush, Ruler, CheckCircle2, PhoneCall, MessageSquare } from 'lucide-react';

export default function Services({ onOpenCallback }) {
  const [activeTab, setActiveTab] = useState(0);

  const services = [
    {
      tabTitle: "Снабжение",
      tabSubtitle: "Комплексные поставки",
      title: "Комплексное снабжение строительных объектов",
      icon: <HardHat className="h-6 w-6" />,
      desc: "Оптовые поставки строительных и отделочных материалов под ключ для строительных площадок любого масштаба с гибкой системой скидок.",
      longDesc: "Мы берем на себя весь процесс комплектации вашего строительного объекта. От анализа проектной документации до финальной разгрузки материалов на площадке. Вы получаете одного надежного партнера, прозрачный документооборот с НДС и индивидуальные цены от заводов-производителей.",
      benefits: [
        "Цены первого дистрибьютора без посредников",
        "Оплата по факту поставки или отсрочка платежа",
        "Личный менеджер 24/7 для оперативного дозаказа",
        "Полный комплект закрывающих документов"
      ]
    },
    {
      tabTitle: "Логистика",
      tabSubtitle: "Доставка спецтехникой",
      title: "Специализированная логистика и доставка",
      icon: <Truck className="h-6 w-6" />,
      desc: "Доставка сыпучих и тяжелых материалов спецтехникой (манипуляторы, самосвалы, бетоновозы) напрямую с заводов и складов.",
      longDesc: "Наш логистический комплекс позволяет доставлять грузы любой сложности и объема в режиме 24/7. В парке есть манипуляторы различной грузоподъемности, самосвалы и длинномеры. Мы гарантируем точное соблюдение сроков доставки, чтобы ваш объект не простаивал ни минуты.",
      benefits: [
        "Собственный автопарк спецтехники",
        "Доставка в день заказа или точно в срок по графику",
        "Разгрузка и подъем материалов нашими силами",
        "Отслеживание геолокации машины в реальном времени"
      ]
    },
    {
      tabTitle: "Сметы",
      tabSubtitle: "Точный расчет по чертежам",
      title: "Расчет объемов и составление смет",
      icon: <Ruler className="h-6 w-6" />,
      desc: "Бесплатный точный расчет объема необходимых материалов (цемент, смеси, кирпичи) по вашим чертежам и спецификациям проекта.",
      longDesc: "Не знаете, сколько точно мешков штукатурки или кубов бруса вам потребуется? Пришлите нам ваш проект или чертеж! Наши инженеры проведут детальный расчет расхода материалов с учетом всех технологических потерь и предложат оптимальные варианты оптимизации бюджета.",
      benefits: [
        "Бесплатный расчет в течение 2-х часов",
        "Учет СНиП и ГОСТ стандартов при расчетах",
        "Подбор качественных аналогов для снижения сметы",
        "Исключение лишних остатков материалов на объекте"
      ]
    },
    {
      tabTitle: "Консультации",
      tabSubtitle: "Шеф-монтаж под ключ",
      title: "Шеф-монтаж и технические консультации",
      icon: <Paintbrush className="h-6 w-6" />,
      desc: "Выезд технических специалистов на объект для обучения ваших рабочих правильному применению строительных смесей и материалов.",
      longDesc: "Новые технологии требуют профессионального подхода. Наши технологи приедут на вашу строительную площадку, проведут обучение рабочих тонкостям работы со сложными штукатурными, гидроизоляционными или наливными смесями. Мы поможем избежать брака в работе.",
      benefits: [
        "Выезд технолога на объект в течение 24 часов",
        "Практические мастер-классы прямо на стройплощадке",
        "Контроль соблюдения технологии нанесения материалов",
        "Официальное заключение и гарантия производителя"
      ]
    }
  ];

  const activeService = services[activeTab];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Услуги</h1>
        <p className="text-slate-500 text-sm">Профессиональные решения для застройщиков, прорабов и частных клиентов от Tormag</p>
      </div>

      {/* Premium Tab Selector Widget aligned with Tormag design */}
      <div className="bg-slate-100/70 p-2 rounded-[2rem] border border-slate-200/60 grid grid-cols-2 md:grid-cols-4 gap-2 select-none">
        {services.map((s, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 md:gap-3 px-3 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl text-left transition-all duration-300 w-full cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md scale-[1.01] z-10'
                  : 'bg-transparent hover:bg-white/60 text-slate-700 border border-transparent'
              }`}
            >
              <div className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-colors duration-300 shrink-0 ${
                isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-700 border border-slate-200/50 shadow-sm'
              }`}>
                {s.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className={`font-extrabold text-xs md:text-sm leading-tight font-outfit ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {s.tabTitle}
                </div>
                <div className="text-[9px] md:text-[10px] leading-tight font-medium text-slate-400">
                  {s.tabSubtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Box */}
      <div 
        key={activeTab} 
        className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-md transition-all duration-500 animate-slide-up space-y-6"
      >
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 font-outfit leading-tight">
            {activeService.title}
          </h2>
        </div>
        
        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl">
          {activeService.longDesc}
        </p>

        <div className="space-y-3 pt-6 border-t border-slate-100">
          <h4 className="font-extrabold text-slate-950 text-sm uppercase tracking-wider">Что вы получаете:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeService.benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 font-semibold leading-normal">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unified CTA Box at the bottom matching site styling */}
      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 text-center relative overflow-hidden space-y-6 shadow-sm">
        <div className="space-y-2.5 relative z-10 max-w-xl mx-auto">
          <h3 className="font-bold text-slate-950 text-xl font-outfit">Заказать услугу</h3>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            Свяжитесь с нами прямо сейчас! Мы бесплатно проконсультируем вас по всем деталям и подготовим коммерческое предложение.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 max-w-md mx-auto pt-2">
          <button
            type="button"
            onClick={onOpenCallback}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-md hover:shadow-lg text-xs uppercase tracking-wider cursor-pointer font-outfit"
          >
            Оставить заявку
          </button>
          <a
            href="https://wa.me/77077111653"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-950 border border-slate-200/80 font-bold rounded-2xl transition-all shadow-sm text-xs uppercase tracking-wider font-outfit"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

