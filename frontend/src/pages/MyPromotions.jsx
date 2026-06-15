import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Copy, Check, ChevronRight } from 'lucide-react';
import { getMyPromotions } from '../services/api';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

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
      <section className="mx-auto max-w-2xl py-20 px-4 text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm mx-auto animate-pulse">
          <Gift className="h-9 w-9" />
        </div>
        <div>
          <h1 className="font-outfit text-3xl font-black text-slate-950">Мои промокоды</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Войдите в аккаунт, чтобы просмотреть ваши личные промокоды и скидки за отзывы.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="bg-slate-950 hover:bg-blue-600 text-white font-black px-8 py-3.5 rounded-xl transition-all text-sm uppercase tracking-wider shadow-sm active:scale-95 cursor-pointer font-outfit"
        >
          Войти в аккаунт
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6 text-left animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
            Ваши персональные промокоды за отзывы о товарах
          </h3>
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
                <div key={promo.id} className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group transition-all ${
                  isInvalid ? 'border-slate-200 bg-slate-50/60 opacity-70' : 'border-slate-200/80 hover:shadow-md'
                }`}>
                  <div className={`absolute top-0 right-0 text-white text-[9px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl font-mono shadow-sm ${badgeColor}`}>
                    {badgeText}
                  </div>
                  <div>
                    <h4 className={`font-outfit text-base font-black pr-16 leading-tight ${isInvalid ? 'text-slate-500' : 'text-slate-950'}`}>
                      {promo.title}
                    </h4>
                    <p className="text-slate-555 text-[11px] font-semibold mt-1">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold tracking-wider px-2.5 py-1.5 rounded-lg border ${
                        isInvalid ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-slate-900 bg-slate-50 border-slate-100'
                      }`}>
                        {promo.promoCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                        До {new Date(promo.endsAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {isInvalid ? (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wider font-outfit cursor-not-allowed"
                      >
                        {isUsed ? 'Использован' : 'Неактивен'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyCode(promo.promoCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white hover:bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer font-outfit"
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
                  <div className="text-[9px] text-slate-400 font-semibold sm:hidden mt-0.5">
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
