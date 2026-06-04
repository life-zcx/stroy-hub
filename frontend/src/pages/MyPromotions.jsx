import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Copy, Check, ChevronRight } from 'lucide-react';
import { getMyPromotions } from '../services/api';

export default function MyPromotions({ customer, onOpenAuth, onNavigate, showToast }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchPromos = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const data = await getMyPromotions();
      setPromos(data);
    } catch (err) {
      console.error('Error fetching promos:', err);
      showToast?.('❌ Не удалось загрузить промокоды.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, [customer]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast?.('📋 Промокод скопирован в буфер обмена!');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (!customer) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12 animate-fade-in-up">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="font-outfit text-2xl font-black text-slate-950">Мои промокоды</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Войдите в аккаунт, чтобы просмотреть ваши личные промокоды и скидки за отзывы.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-600 cursor-pointer font-outfit"
        >
          Войти в аккаунт
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6 text-left animate-fade-in-up">
      {/* Sleek Breadcrumb */}
      {/* Sleek Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed mb-6">
        <button 
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
        >
          Главная
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">Мои промокоды</span>
      </nav>

      {/* Header card */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Бонусы и купоны</span>
          <h1 className="font-outfit text-3xl font-black text-slate-950">Мои промокоды</h1>
          <p className="text-xs font-semibold text-slate-400">Ваши персональные промокоды за отзывы о товарах</p>
        </div>
      </div>

      {/* Promos Grid */}
      <div className="space-y-4">
        {loading && promos.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-400">
            Загружаем ваши промокоды...
          </div>
        ) : promos.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center">
            <Gift className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-lg font-black text-slate-900">Промокодов пока нет</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Оставляйте полезные отзывы к полученным товарам в деталях ваших заказов, и здесь появятся ваши купоны на скидку!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promos.map((promo) => {
              const isUsed = promo.usageLimit !== null && promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit;
              const isExpired = promo.endsAt && new Date(promo.endsAt) < new Date();
              const isInvalid = !promo.isActive || isUsed || isExpired;

              let badgeText = promo.badge || 'Купон';
              let badgeColor = 'bg-emerald-500';

              if (isUsed) {
                badgeText = 'Использован';
                badgeColor = 'bg-slate-400';
              } else if (isExpired) {
                badgeText = 'Истек';
                badgeColor = 'bg-rose-500';
              } else if (!promo.isActive) {
                badgeText = 'Неактивен';
                badgeColor = 'bg-slate-400';
              }

              return (
                <div key={promo.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden group transition-all ${
                  isInvalid ? 'border-slate-200 bg-slate-50/60 opacity-70' : 'border-slate-200/80 hover:shadow-md'
                }`}>
                  <div className={`absolute top-0 right-0 text-white text-[9px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl font-mono shadow-sm ${badgeColor}`}>
                    {badgeText}
                  </div>
                  <div>
                    <h4 className={`font-outfit text-lg font-black pr-16 leading-snug ${isInvalid ? 'text-slate-500' : 'text-slate-950'}`}>
                      {promo.title}
                    </h4>
                    <p className="text-slate-500 text-xs font-semibold mt-1">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 mt-2">
                    <span className={`font-mono text-xl font-bold tracking-wider px-3.5 py-1.5 rounded-xl border ${
                      isInvalid ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-slate-900 bg-slate-50 border-slate-100'
                    }`}>
                      {promo.promoCode}
                    </span>
                    {isInvalid ? (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider font-outfit cursor-not-allowed"
                      >
                        {isUsed ? 'Использован' : 'Неактивен'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyCode(promo.promoCode)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 text-white hover:bg-blue-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer font-outfit"
                      >
                        {copiedCode === promo.promoCode ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    Действует до: {new Date(promo.endsAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
