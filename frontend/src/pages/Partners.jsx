import React, { useState } from 'react';
import { Award, Briefcase, ChevronRight, CheckCircle2, Send } from 'lucide-react';

export default function Partners() {
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', phone: '', email: '', comments: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Сотрудничество и партнерство</h1>
        <p className="text-slate-500 text-sm">Продавайте строительные материалы оптовым и розничным клиентам по всему Казахстану через платформу StroyHub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Преимущества для дистрибьюторов</h3>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Прямой выход на крупных строительных подрядчиков и застройщиков Казахстана.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Автоматизация выставления B2B счетов, договоров и обмена закрывающими документами через ЭСФ.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Интеграция складского учета и автоматическое обновление складских остатков на витрине.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Безопасная сделка: 100% защита оплаты за каждую отгруженную партию товара.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="font-extrabold text-emerald-400 text-lg font-outfit">Требования к партнерам</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Мы работаем только с официальными дилерами, заводами-производителями и дистрибьюторами строительных материалов, способными гарантировать качество продукции, предоставлять сертификаты соответствия и осуществлять бесперебойные отгрузки со своих складов в Алматы и регионах.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="font-extrabold text-slate-950 text-lg font-outfit border-b border-slate-100 pb-3 mb-5">Стать партнером StroyHub</h3>
          
          {formSent ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Заявка успешно отправлена!</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Спасибо за интерес к нашей платформе! Наши менеджеры по работе с партнерами рассмотрят ваше предложение и свяжутся с вами в течение 24 часов.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ваше имя *</label>
                <input
                  type="text"
                  required
                  placeholder="Григорий"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название компании *</label>
                <input
                  type="text"
                  required
                  placeholder="ТОО СтройРесурс"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Контактный телефон *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (707) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Электронная почта *</label>
                  <input
                    type="email"
                    required
                    placeholder="partner@company.kz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Комментарий к заявке</label>
                <textarea
                  rows={3}
                  placeholder="Какую продукцию поставляете, объемы складов..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md mt-2"
              >
                <Send className="h-4 w-4" />
                Отправить предложение
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
