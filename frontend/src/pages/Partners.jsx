import React, { useState } from 'react';
import { Award, Briefcase, ChevronRight, CheckCircle2, Send } from 'lucide-react';
import { createPartnerRequest } from '../services/api';
import {
  formatKazakhPhone,
  normalizeInput,
  validateComment,
  validateCompanyName,
  validateEmail,
  validateName,
  validatePhone,
} from '../utils/formValidation';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

export default function Partners({ showToast }) {
  const [formSent, setFormSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', company: '', phone: '', email: '', comments: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError =
      validateName(formData.name, 'Ваше имя') ||
      validateCompanyName(formData.company) ||
      validatePhone(formData.phone, 'Контактный телефон') ||
      validateEmail(formData.email) ||
      validateComment(formData.comments, 'Комментарий к заявке', 1200);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPartnerRequest({
        contactName: normalizeInput(formData.name),
        companyName: normalizeInput(formData.company),
        contactPhone: formData.phone,
        email: normalizeInput(formData.email).toLowerCase(),
        comment: normalizeInput(formData.comments),
      });

      setFormSent(true);
      setFormData({ name: '', company: '', phone: '', email: '', comments: '' });
      showToast?.('✅ Партнерская заявка отправлена. Мы свяжемся с вами в течение 24 часов.');
    } catch (submitError) {
      const message = getFriendlyErrorMessage(submitError);
      setError(message);
      showToast?.(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Partnership Handshake Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Handshake representation via intersecting arcs/lines */}
          <path d="M40 45 C45 35, 55 35, 60 45" strokeWidth="1.5" />
          <path d="M80 45 C75 35, 65 35, 60 45" strokeWidth="1.5" />
          
          {/* Shaking hands detail */}
          <circle cx="60" cy="45" r="5" fill="currentColor" fillOpacity="0.2" />

          {/* Network nodes */}
          <line x1="20" y1="20" x2="40" y2="45" opacity="0.3" strokeDasharray="2,2" />
          <line x1="100" y1="20" x2="80" y2="45" opacity="0.3" strokeDasharray="2,2" />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="100" cy="20" r="3" fill="currentColor" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Сотрудничество
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Продавайте строительные материалы оптовым и розничным клиентам по всему Казахстану через платформу Tormag
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="flex flex-col justify-between gap-6">
          <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Преимущества для дистрибьюторов</h3>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Прямой выход на крупных строительных подрядчиков и застройщиков Казахстана.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Автоматизация выставления B2B счетов, договоров и обмена закрывающими документами через ЭСФ.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Интеграция складского учета и автоматическое обновление складских остатков на витрине.</span>
              </li>
              <li className="flex gap-2 items-start">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold">Безопасная сделка: 100% защита оплаты за каждую отгруженную партию товара.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 space-y-4 relative overflow-hidden shadow-md">
            <div className="relative z-10 space-y-4">
              <h3 className="font-extrabold text-emerald-400 text-lg font-outfit">Требования к партнерам</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
                Мы работаем только с официальными дилерами, заводами-производителями и дистрибьюторами строительных материалов, способными гарантировать качество продукции, предоставлять сертификаты соответствия и осуществлять бесперебойные отгрузки со своих складов в Алматы и регионах.
              </p>
            </div>
            <div className="absolute inset-0 -z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20"></div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
          <h3 className="font-extrabold text-slate-955 text-lg font-outfit border-b border-slate-100 pb-3 mb-5">Стать партнером Tormag</h3>
          
          {formSent ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Заявка успешно отправлена!</h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                Спасибо за интерес к нашей платформе! Наши менеджеры по работе с партнерами рассмотрят ваше предложение и свяжутся с вами в течение 24 часов.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-2">Ваше имя *</label>
                <input
                  type="text"
                  required
                  placeholder="Григорий"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError('');
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-2">Название компании *</label>
                <input
                  type="text"
                  required
                  placeholder="ТОО СтройРесурс"
                  value={formData.company}
                  onChange={(e) => {
                    setFormData({ ...formData, company: e.target.value });
                    setError('');
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase mb-2">Контактный телефон *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (707) 123-4567"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: formatKazakhPhone(e.target.value) });
                      setError('');
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 uppercase mb-2">Электронная почта *</label>
                  <input
                    type="email"
                    required
                    placeholder="partner@company.kz"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setError('');
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-2">Комментарий к заявке</label>
                <textarea
                  rows={3}
                  placeholder="Какую продукцию поставляете, объемы складов..."
                  value={formData.comments}
                  onChange={(e) => {
                    setFormData({ ...formData, comments: e.target.value });
                    setError('');
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md mt-2 transform hover:-translate-y-0.5 cursor-pointer font-outfit uppercase tracking-wider"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Отправляем...' : 'Отправить предложение'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
