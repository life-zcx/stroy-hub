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
  const startsAt = promotion.startsAt ? new Date(promotion.startsAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : null;

  if (startsAt && endsAt) {
    return `С ${startsAt} до ${endsAt}`;
  }

  if (endsAt) {
    return `До ${endsAt}`;
  }

  if (startsAt) {
    return `С ${startsAt}`;
  }

  return 'Без ограничения по сроку';
}

function getPromotionState(promotion) {
  const now = new Date();

  if (!promotion.isActive) {
    return 'Отключена';
  }

  if (promotion.startsAt && new Date(promotion.startsAt) > now) {
    return 'Запланирована';
  }

  if (promotion.endsAt && new Date(promotion.endsAt) < now) {
    return 'Завершена';
  }

  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    return 'Лимит исчерпан';
  }

  return 'Активна';
}

export default function PromotionsPage({ promotions, onCreatePromotion, onEditPromotion, onDeletePromotion, formatPrice }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Промоакции и промокоды</h2>
          <p className="text-xs text-slate-500 mt-0.5">Управляйте контентом страницы «Акции и скидки» и скидками на этапе оформления заказа</p>
        </div>
        <button
          onClick={onCreatePromotion}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Новая акция
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {promotions.length === 0 ? (
          <div className="xl:col-span-2 bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center">
            <TicketPercentIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-900">Пока не создано ни одной акции.</p>
            <p className="text-sm text-slate-500 mt-1">Добавьте промокод или рекламную кампанию, чтобы заполнить страницу предложений.</p>
          </div>
        ) : (
          promotions.map((promotion) => (
            <article key={promotion.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className={`bg-gradient-to-r ${getPromotionThemeGradient(promotion.theme)} text-white p-5 flex items-start justify-between gap-4`}>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-white/15 border border-white/10">
                      {promotion.badge || getPromotionTypeLabel(promotion)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-slate-950/20 border border-white/10">
                      {getPromotionState(promotion)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black leading-tight font-outfit">{promotion.title}</h3>
                </div>
                {promotion.showOnSite ? <EyeIcon className="h-5 w-5 shrink-0" /> : <EyeOffIcon className="h-5 w-5 shrink-0" />}
              </div>

              <div className="p-5 space-y-4 flex-1">
                <p className="text-sm text-slate-600 leading-relaxed">{promotion.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Условия скидки</span>
                    <p className="font-bold text-slate-900 mt-2">{formatPromotionBenefit(promotion, formatPrice)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Промокод</span>
                    <p className="font-black text-slate-900 mt-2 tracking-[0.2em] uppercase break-all">{promotion.promoCode || 'Без кода'}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Область действия</span>
                    <p className="font-semibold text-slate-700 mt-2">{getPromotionScopeLabel(promotion.scope)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Цели акции</span>
                    <p className="font-semibold text-slate-700 mt-2">{formatPromotionTargets(promotion)}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Период</span>
                    <p className="font-semibold text-slate-700 mt-2">{formatDateRange(promotion)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Количество</span>
                    <p className="font-semibold text-slate-700 mt-2">{promotion.minQuantity ? `От ${promotion.minQuantity} шт` : 'Без порога'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Использований</span>
                    <p className="font-semibold text-slate-700 mt-2">
                      {promotion.usageCount}
                      {promotion.usageLimit ? ` / ${promotion.usageLimit}` : ' / без лимита'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Публикация</span>
                    <p className="font-semibold text-slate-700 mt-2">{promotion.showOnSite ? 'На сайте' : 'Скрыта'}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{promotion.showOnHome ? 'Есть баннер на главной' : 'Без баннера на главной'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 text-xs">
                  <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Каскадные уровни</span>
                  <p className="font-semibold text-slate-700 mt-2">{formatPromotionTiers(promotion, formatPrice)}</p>
                </div>
              </div>

              <div className="px-5 pb-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => onEditPromotion(promotion)}
                  className="px-3 py-2 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  Редактировать
                </button>
                <button
                  onClick={() => onDeletePromotion(promotion.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Удалить акцию"
                >
                  <Trash2Icon className="h-4.5 w-4.5" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
