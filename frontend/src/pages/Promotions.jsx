import React, { useEffect, useState } from 'react';
import { Calendar, Copy, TicketPercent } from 'lucide-react';
import { getPublicPromotions } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { formatPromotionBenefit, formatPromotionTargets, formatPromotionTiers, getPromotionScopeLabel, getPromotionTheme } from '../utils/promotions';

function formatDateTime(value) {
  if (!value) {
    return 'Без ограничения по сроку';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPromotionPeriod(promotion) {
  if (promotion.startsAt && promotion.endsAt) {
    return `С ${formatDateTime(promotion.startsAt)} до ${formatDateTime(promotion.endsAt)}`;
  }

  if (promotion.endsAt) {
    return `До ${formatDateTime(promotion.endsAt)}`;
  }

  if (promotion.startsAt) {
    return `С ${formatDateTime(promotion.startsAt)}`;
  }

  return 'Без ограничения по сроку';
}

function getPromotionLabel(promotion) {
  return promotion.promoCode ? 'Промокод' : 'Акция без кода';
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedPromotionId, setCopiedPromotionId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPromotions = async () => {
      try {
        const data = await getPublicPromotions();
        if (isMounted) {
          setPromotions(data);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setPromotions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPromotions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyPromoCode = async (promotion) => {
    if (!promotion?.promoCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(promotion.promoCode);
      setCopiedPromotionId(promotion.id);
      window.setTimeout(() => {
        setCopiedPromotionId((current) => (current === promotion.id ? null : current));
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-10 font-sans text-slate-800 text-left">
      <div className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-outfit">Акции и скидки</h1>
          <p className="text-slate-500 text-sm md:text-base max-w-3xl leading-relaxed">
            Здесь появляются все запущенные через админку промо-кампании: сезонные скидки, спецпредложения для оптовых заказов и промокоды,
            которые можно применить при оформлении покупки.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row animate-pulse">
              <div className="bg-slate-200 md:w-72 h-44 md:h-auto" />
              <div className="p-8 flex-1 space-y-4">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-8 w-3/4 rounded bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-3 rounded bg-slate-100" />
                  <div className="h-3 rounded bg-slate-100 w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <TicketPercent className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Сейчас активных акций нет</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">
            Как только менеджеры запустят новую скидку или промокод через панель управления, она автоматически появится на этой странице.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {promotions.map((promotion) => {
            const theme = getPromotionTheme(promotion.theme);

            return (
              <div key={promotion.id} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className={`bg-gradient-to-br ${theme.gradient} text-white p-8 md:w-72 shrink-0 flex flex-col justify-between items-start gap-6`}>
                  <div className="space-y-3 w-full">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase font-black bg-white/20 px-2.5 py-1 rounded-md tracking-wider">
                        {promotion.badge || 'Предложение'}
                      </span>
                      <span className="text-[10px] uppercase font-black bg-slate-950/20 px-2.5 py-1 rounded-md tracking-wider border border-white/10">
                        {getPromotionLabel(promotion)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-100 uppercase">Выгода</span>
                      <span className="block text-2xl font-black leading-tight mt-1">{promotion.discountType === 'PERCENT' ? `${promotion.discountValue}%` : formatPrice(promotion.discountValue)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <span className="block text-xs font-bold text-slate-100 uppercase">Код для оформления</span>
                    <div className="space-y-2">
                      <span className="block font-black text-lg font-mono tracking-[0.2em] bg-slate-950/20 px-3 py-2 rounded-xl border border-white/10 break-all">
                        {promotion.promoCode || 'БЕЗ КОДА'}
                      </span>
                      {promotion.promoCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyPromoCode(promotion)}
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] px-3 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedPromotionId === promotion.id ? 'Скопировано' : 'Скопировать'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-grow flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-slate-950 text-xl font-outfit leading-snug">{promotion.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{promotion.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className={`rounded-2xl border p-4 ${theme.soft}`}>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Условия</span>
                      <p className="text-sm font-semibold text-slate-900 mt-2">{formatPromotionBenefit(promotion)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/70">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Срок действия</span>
                      <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-slate-900">
                        <Calendar className={`h-4 w-4 ${theme.accent}`} />
                        <span>{formatPromotionPeriod(promotion)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 p-4 bg-white/70">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Где действует</span>
                      <p className="text-sm font-semibold text-slate-900 mt-2">{getPromotionScopeLabel(promotion.scope)}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{formatPromotionTargets(promotion)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4 bg-white/70">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Каскадные уровни</span>
                      <p className="text-sm font-semibold text-slate-900 mt-2">{formatPromotionTiers(promotion) || 'Без дополнительных уровней'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
