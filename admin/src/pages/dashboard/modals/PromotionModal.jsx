import React from 'react';
import { createPortal } from 'react-dom';
import { Plus as PlusIcon, Sparkles as SparklesIcon, Trash2 as Trash2Icon, X as XIcon } from 'lucide-react';
import { PROMOTION_SCOPE_OPTIONS, PROMOTION_THEME_OPTIONS } from '../promotionOptions';

function ScopeTargets({ scope, products, categories, selectedProductIds, selectedCategoryIds, onTargetToggle }) {
  if (scope === 'PRODUCT') {
    return (
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Товары для акции *</label>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 grid gap-2">
          {products.map((product) => {
            const checked = selectedProductIds.includes(String(product.id));

            return (
              <label key={product.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <input type="checkbox" checked={checked} onChange={() => onTargetToggle('targetProductIds', product.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="font-medium text-slate-700">{product.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (scope === 'CATEGORY') {
    return (
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Категории для акции *</label>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 grid gap-2">
          {categories.map((category) => {
            const checked = selectedCategoryIds.includes(String(category.id));

            return (
              <label key={category.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <input type="checkbox" checked={checked} onChange={() => onTargetToggle('targetCategoryIds', category.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="font-medium text-slate-700">{'- '.repeat(category.depth || 0)}{category.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
      Скидка применяется ко всему заказу. Для ограничения по ассортименту выберите область действия `Товары` или `Категории`.
    </div>
  );
}

export default function PromotionModal({
  open,
  onClose,
  onSubmit,
  editingPromotion,
  promotionForm,
  onFormChange,
  onTargetToggle,
  onTierChange,
  onAddTier,
  onRemoveTier,
  products,
  categories,
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <SparklesIcon className={`h-5.5 w-5.5 ${editingPromotion ? 'text-amber-500' : 'text-emerald-600'}`} />
            {editingPromotion ? 'Редактировать акцию' : 'Новая акция или промокод'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 flex-grow">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название акции *</label>
              <input type="text" name="title" value={promotionForm.title} onChange={onFormChange} required placeholder="Скидка 10% на первый заказ" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Короткий бейдж</label>
              <input type="text" name="badge" value={promotionForm.badge} onChange={onFormChange} placeholder="Сезонная акция" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Описание *</label>
            <textarea name="description" value={promotionForm.description} onChange={onFormChange} required rows="4" placeholder="Расскажите, кто и на каких условиях может использовать акцию" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Промокод</label>
              <input type="text" name="promoCode" value={promotionForm.promoCode} onChange={onFormChange} placeholder="TORMAG10" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm uppercase tracking-[0.2em]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Область действия *</label>
              <select name="scope" value={promotionForm.scope} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm">
                {PROMOTION_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Тема карточки</label>
              <select name="theme" value={promotionForm.theme} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm">
                {PROMOTION_THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <ScopeTargets
            scope={promotionForm.scope}
            products={products}
            categories={categories}
            selectedProductIds={promotionForm.targetProductIds}
            selectedCategoryIds={promotionForm.targetCategoryIds}
            onTargetToggle={onTargetToggle}
          />

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Тип скидки *</label>
              <select name="discountType" value={promotionForm.discountType} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm">
                <option value="PERCENT">Процент</option>
                <option value="FIXED">Фиксированная сумма</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Базовая скидка *</label>
              <input type="number" min="1" step="1" name="discountValue" value={promotionForm.discountValue} onChange={onFormChange} required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Мин. сумма заказа</label>
              <input type="number" min="0" step="100" name="minOrderAmount" value={promotionForm.minOrderAmount} onChange={onFormChange} placeholder="Например, 50000" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Мин. количество</label>
              <input type="number" min="1" step="1" name="minQuantity" value={promotionForm.minQuantity} onChange={onFormChange} placeholder="Например, 10" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-slate-600 uppercase">Каскадные скидки по количеству</span>
                <p className="text-[11px] text-slate-500 mt-1">Например: от 10 шт — 5%, от 50 шт — 10%. Если уровни не заданы, используется базовая скидка.</p>
              </div>
              <button type="button" onClick={onAddTier} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">
                <PlusIcon className="h-4 w-4" />
                Уровень
              </button>
            </div>

            {promotionForm.quantityTiers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Пока уровни не добавлены. Будет применяться только базовая скидка.
              </div>
            ) : (
              <div className="space-y-3">
                {promotionForm.quantityTiers.map((tier, index) => (
                  <div key={`${index}-${tier.minQuantity}-${tier.discountValue}`} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end rounded-xl border border-slate-200 bg-white p-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">От количества</label>
                      <input type="number" min="1" step="1" value={tier.minQuantity} onChange={(event) => onTierChange(index, 'minQuantity', event.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Скидка уровня</label>
                      <input type="number" min="1" step="1" value={tier.discountValue} onChange={(event) => onTierChange(index, 'discountValue', event.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <button type="button" onClick={() => onRemoveTier(index)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Дата старта</label>
              <input type="datetime-local" name="startsAt" value={promotionForm.startsAt} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Дата окончания</label>
              <input type="datetime-local" name="endsAt" value={promotionForm.endsAt} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Лимит использований</label>
              <input type="number" min="1" name="usageLimit" value={promotionForm.usageLimit} onChange={onFormChange} placeholder="Без лимита" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="isActive" checked={promotionForm.isActive} onChange={onFormChange} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Акция активна и может применяться
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="showOnSite" checked={promotionForm.showOnSite} onChange={onFormChange} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Показывать на странице «Акции и скидки»
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:col-span-2">
              <input type="checkbox" name="showOnHome" checked={promotionForm.showOnHome} onChange={onFormChange} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              Показывать на главной странице в компактном баннере
            </label>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {editingPromotion ? 'Сохранить изменения' : 'Опубликовать акцию'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
