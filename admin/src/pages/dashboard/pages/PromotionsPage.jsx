import React from 'react';
import {
  Edit3 as EditIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Plus as PlusIcon,
  TicketPercent as TicketPercentIcon,
  Trash2 as Trash2Icon,
} from 'lucide-react';
import {
  formatPromotionBenefit,
  formatPromotionTargets,
  formatPromotionTiers,
  getPromotionThemeGradient,
  getPromotionScopeLabel,
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

export default function PromotionsPage({
  promotions,
  onCreatePromotion,
  onEditPromotion,
  onDeletePromotion,
  formatPrice,
}) {
  // Filter for manual promotions only
  const manualPromotions = promotions.filter(p => !p.userId && !p.promoCode?.startsWith('REV-'));

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-outfit uppercase tracking-tight">Промоакции и промокоды</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Управляйте рекламными кампаниями и активными скидками</p>
        </div>
        <button
          onClick={onCreatePromotion}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-emerald-600/10 transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Новая акция
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manualPromotions.length === 0 ? (
          <div className="lg:col-span-3 bg-white p-20 rounded-[2.5rem] border border-slate-200/60 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
              <TicketPercentIcon className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-extrabold text-slate-900 uppercase tracking-wider text-sm">Пока не создано ни одной ручной акции</p>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">Добавьте промокод или рекламную кампанию, чтобы заполнить список предложений и запустить скидки.</p>
          </div>
        ) : (
          manualPromotions.map((promotion) => {
            const promoState = getPromotionState(promotion);
            let stateBadgeColor = 'bg-slate-500/20 text-slate-100';
            if (promoState === 'Активна') stateBadgeColor = 'bg-emerald-500/35 text-white border border-emerald-400/20';
            if (promoState === 'Отключена') stateBadgeColor = 'bg-rose-500/35 text-white border border-rose-400/20';
            if (promoState === 'Запланирована') stateBadgeColor = 'bg-amber-500/35 text-white border border-amber-400/20';

            return (
              <article key={promotion.id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                {/* Gradient header */}
                <div className={`bg-gradient-to-r ${getPromotionThemeGradient(promotion.theme)} text-white p-5 flex flex-col gap-3`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                      {promotion.badge || getPromotionTypeLabel(promotion)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${stateBadgeColor}`}>
                        {promoState}
                      </span>
                      {promotion.showOnSite ? (
                        <EyeIcon className="h-4 w-4 text-white/85 shrink-0" title="Отображается на сайте" />
                      ) : (
                        <EyeOffIcon className="h-4 w-4 text-white/60 shrink-0" title="Скрыто на сайте" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-extrabold leading-snug font-outfit pr-2" title={promotion.title}>
                    {promotion.title}
                  </h3>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2" title={promotion.description}>
                    {promotion.description}
                  </p>

                  {/* Promotion details table style */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100 text-[11px]">
                    {promotion.promoCode && (
                      <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-bold uppercase text-[9px] pl-1.5">Промокод:</span>
                        <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-xs tracking-wider uppercase border border-emerald-100">
                          {promotion.promoCode}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Размер скидки:</span>
                      <span className="font-extrabold text-slate-800 text-xs">
                        {formatPromotionBenefit(promotion, formatPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Использовано:</span>
                      <span className="font-bold text-slate-700">
                        {promotion.usageCount} <span className="text-slate-300 font-normal">из</span> {promotion.usageLimit || '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Область / Цели:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[170px]" title={`${getPromotionScopeLabel(promotion.scope)}: ${formatPromotionTargets(promotion)}`}>
                        {getPromotionScopeLabel(promotion.scope)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Период действия:</span>
                      <span className="font-bold text-slate-700">
                        {formatDateRange(promotion)}
                      </span>
                    </div>
                    {promotion.quantityTiers && promotion.quantityTiers.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-slate-100 mt-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Каскадность:</span>
                        <span className="font-semibold text-slate-650 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100/50 break-words leading-relaxed" title={formatPromotionTiers(promotion, formatPrice)}>
                          {formatPromotionTiers(promotion, formatPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="px-5 pb-4 pt-3 border-t border-slate-100/80 flex items-center justify-between bg-slate-50/50">
                  <button
                    onClick={() => onEditPromotion(promotion)}
                    className="px-3 py-2 text-slate-650 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-transparent hover:border-emerald-200/50"
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => onDeletePromotion(promotion.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    title="Удалить акцию"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
