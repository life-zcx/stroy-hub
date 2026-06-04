import React from 'react';
import {
  Edit3 as EditIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  TicketPercent as TicketPercentIcon,
  Trash2 as Trash2Icon,
} from 'lucide-react';
import {
  formatPromotionBenefit,
  getPromotionThemeGradient,
  getPromotionTypeLabel,
} from '../promotionOptions';

function formatDateRange(promotion) {
  const startsAt = promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString('ru-RU') : null;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt).toLocaleDateString('ru-RU') : null;
  if (startsAt && endsAt) return `${startsAt} — ${endsAt}`;
  if (endsAt) return `До ${endsAt}`;
  if (startsAt) return `С ${startsAt}`;
  return 'Бессрочно';
}

function getPromotionState(promotion) {
  const now = new Date();
  if (!promotion.isActive) return 'Отключена';
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return 'Запланирована';
  if (promotion.endsAt && new Date(promotion.endsAt) < now) return 'Завершена';
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) return 'Лимит исчерпан';
  return 'Активна';
}

export default function ReviewPromosPage({ promotions, onEditPromotion, onDeletePromotion, formatPrice }) {
  // Filter for review-based promotions
  const reviewPromotions = promotions.filter(p => p.userId !== null || p.promoCode?.startsWith('REV-'));

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-outfit uppercase tracking-tight">Промокоды за отзывы</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Автоматически начисленные промокоды за оценки товаров</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviewPromotions.length === 0 ? (
          <div className="lg:col-span-3 bg-white p-16 rounded-[2rem] border border-slate-200 shadow-sm text-center">
            <TicketPercentIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Промокодов за отзывы пока нет.</p>
            <p className="text-xs text-slate-500 mt-1">Они появятся автоматически после отправки отзывов покупателями.</p>
          </div>
        ) : (
          reviewPromotions.map((promotion) => (
            <article key={promotion.id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden flex flex-col justify-between">
              {/* Compact header */}
              <div className={`bg-gradient-to-r ${getPromotionThemeGradient(promotion.theme)} text-white p-3.5 flex items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="flex gap-1.5 flex-wrap mb-1">
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/15">
                      {promotion.badge || getPromotionTypeLabel(promotion)}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/20">
                      {getPromotionState(promotion)}
                    </span>
                  </div>
                  <h3 className="text-xs font-black leading-tight font-outfit truncate" title={promotion.title}>
                    {promotion.title}
                  </h3>
                </div>
                {promotion.showOnSite ? <EyeIcon className="h-4.5 w-4.5 shrink-0" /> : <EyeOffIcon className="h-4.5 w-4.5 shrink-0" />}
              </div>

              {/* Compact content */}
              <div className="p-3.5 space-y-3 text-[11px] flex-1">
                <p className="text-slate-500 font-medium line-clamp-2 leading-relaxed" title={promotion.description}>
                  {promotion.description}
                </p>

                {/* Key value list */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Промокод:</span>
                    <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs tracking-wider uppercase">
                      {promotion.promoCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Размер скидки:</span>
                    <span className="font-extrabold text-slate-800">
                      {formatPromotionBenefit(promotion, formatPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Использовано:</span>
                    <span className="font-bold text-slate-800">
                      {promotion.usageCount} из {promotion.usageLimit || 'без лимита'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Период:</span>
                    <span className="font-bold text-slate-700">
                      {formatDateRange(promotion)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="px-3.5 pb-3 pt-2 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={() => onEditPromotion(promotion)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <EditIcon className="h-3 w-3" />
                  Редактировать
                </button>
                <button
                  onClick={() => onDeletePromotion(promotion.id)}
                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                  title="Удалить промокод"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
