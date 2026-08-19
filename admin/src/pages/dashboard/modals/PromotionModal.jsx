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
  onHomeFileChange,
  onCardFileChange,
  onDetailFileChange,
  onMobileFileChange,
  imageHomeFile,
  imageCardFile,
  imageDetailFile,
  imageMobileFile,
  onClearImageHome,
  onClearImageCard,
  onClearImageDetail,
  onClearImageMobile,
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto animate-slide-up z-10 flex flex-col border border-slate-100" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 p-6 sm:p-8 sm:pb-4 shrink-0">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 font-outfit">
            <SparklesIcon className={`h-6 w-6 ${editingPromotion ? 'text-emerald-500' : 'text-emerald-600'}`} />
            {editingPromotion ? 'Редактировать акцию' : 'Новая акция или промокод'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 flex-grow overflow-y-auto admin-main-scroll p-6 sm:p-8 text-left">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Название акции *</label>
              <input type="text" name="title" value={promotionForm.title} onChange={onFormChange} required placeholder="Скидка 10% на первый заказ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-semibold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Короткий бейдж</label>
              <input type="text" name="badge" value={promotionForm.badge} onChange={onFormChange} placeholder="Сезонная акция" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-semibold transition-all duration-200" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Описание *</label>
            <textarea name="description" value={promotionForm.description} onChange={onFormChange} required rows="3" placeholder="Расскажите, кто и на каких условиях может использовать акцию" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-semibold transition-all duration-200" />
          </div>

          {/* Promotion Banners (Home, Card, Detail, Mobile) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Изображения и Баннеры акции
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Загрузите баннеры для нужных разделов
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Banner 1: Home Page Hero */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">
                    1. Баннер для Главной страницы
                  </label>
                  {(imageHomeFile || promotionForm.imageHome) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      ✓ Загружен
                    </span>
                  ) : (imageCardFile || promotionForm.imageCard) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider" title="Если файл не выложен, система возьмет баннер со 2-го поля">
                      ⚠️ Возьмется с поля 2
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase tracking-wider">
                      Не загружен
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                  Рекомендуемый размер: 2432×960 px (Слайдер на Главной)
                </span>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onHomeFileChange}
                    className="hidden"
                    id="promo-home-upload"
                  />
                  <label
                    htmlFor="promo-home-upload"
                    className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold cursor-pointer text-center transition-all duration-200 border-dashed truncate ${
                      (imageHomeFile || promotionForm.imageHome)
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 hover:bg-emerald-100/70'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {imageHomeFile ? imageHomeFile.name : (promotionForm.imageHome ? 'Изменить файл...' : '+ Выбрать файл...')}
                  </label>
                  {(imageHomeFile || promotionForm.imageHome) && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-11 rounded-xl border border-emerald-300 overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={imageHomeFile ? URL.createObjectURL(imageHomeFile) : promotionForm.imageHome}
                          alt="Превью для главной"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onClearImageHome}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Удалить баннер главной"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner 2: Promotions Page (Cards and Detail) */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">
                    2. Баннер для страницы Акций
                  </label>
                  {(imageCardFile || promotionForm.imageCard) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      ✓ Загружен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase tracking-wider">
                      Не загружен
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                  Рекомендуемый размер: 1012×404 px (Карточки и внутри акции)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onCardFileChange}
                    className="hidden"
                    id="promo-card-upload"
                  />
                  <label
                    htmlFor="promo-card-upload"
                    className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold cursor-pointer text-center transition-all duration-200 border-dashed truncate ${
                      (imageCardFile || promotionForm.imageCard)
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 hover:bg-emerald-100/70'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {imageCardFile ? imageCardFile.name : (promotionForm.imageCard ? 'Изменить файл...' : '+ Выбрать файл...')}
                  </label>
                  {(imageCardFile || promotionForm.imageCard) && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-11 rounded-xl border border-emerald-300 overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={imageCardFile ? URL.createObjectURL(imageCardFile) : promotionForm.imageCard}
                          alt="Превью карточки"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onClearImageCard}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Удалить баннер"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner 3: Mobile Devices Image */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">
                    3. Баннер для мобильных устройств (Смартфоны)
                  </label>
                  {(imageMobileFile || promotionForm.imageMobile) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      ✓ Загружен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-black uppercase tracking-wider" title="Автоматически адаптирует ПК-баннер на телефонах">
                      ℹ️ Авто-адаптация ПК баннера
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                  Рекомендуемый размер: 780×860 px (Вертикальный баннер для экранов телефонов)
                </span>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onMobileFileChange}
                    className="hidden"
                    id="promo-mobile-upload"
                  />
                  <label
                    htmlFor="promo-mobile-upload"
                    className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold cursor-pointer text-center transition-all duration-200 border-dashed truncate ${
                      (imageMobileFile || promotionForm.imageMobile)
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 hover:bg-emerald-100/70'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {imageMobileFile ? imageMobileFile.name : (promotionForm.imageMobile ? 'Изменить файл...' : '+ Выбрать файл...')}
                  </label>
                  {(imageMobileFile || promotionForm.imageMobile) && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-11 rounded-xl border border-emerald-300 overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={imageMobileFile ? URL.createObjectURL(imageMobileFile) : promotionForm.imageMobile}
                          alt="Превью для мобилок"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onClearImageMobile}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Удалить мобильный баннер"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Промокод</label>
              <input type="text" name="promoCode" value={promotionForm.promoCode} onChange={onFormChange} placeholder="TORMAG10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Область действия *</label>
              <select name="scope" value={promotionForm.scope} onChange={onFormChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200">
                {PROMOTION_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Цвет заглушки (если нет баннера)</label>
              <select name="theme" value={promotionForm.theme} onChange={onFormChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200">
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
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Тип скидки *</label>
              <select name="discountType" value={promotionForm.discountType} onChange={onFormChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200">
                <option value="PERCENT">Процент</option>
                <option value="FIXED">Фиксированная сумма</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Базовая скидка *</label>
              <input type="number" min="1" step="1" name="discountValue" value={promotionForm.discountValue} onChange={onFormChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Мин. сумма заказа</label>
              <input type="number" min="0" step="100" name="minOrderAmount" value={promotionForm.minOrderAmount} onChange={onFormChange} placeholder="Например, 50000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Мин. количество</label>
              <input type="number" min="1" step="1" name="minQuantity" value={promotionForm.minQuantity} onChange={onFormChange} placeholder="Например, 10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Каскадные скидки по количеству</span>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">Например: от 10 шт — 5%, от 50 шт — 10%. Если уровни не заданы, используется базовая скидка.</p>
              </div>
              <button type="button" onClick={onAddTier} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all">
                <PlusIcon className="h-4 w-4" />
                Добавить
              </button>
            </div>

            {promotionForm.quantityTiers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-400 text-center">
                Пока уровни не добавлены. Будет применяться только базовая скидка.
              </div>
            ) : (
              <div className="space-y-3">
                {promotionForm.quantityTiers.map((tier, index) => (
                  <div key={`${index}-${tier.minQuantity}-${tier.discountValue}`} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">От количества</label>
                      <input type="number" min="1" step="1" value={tier.minQuantity} onChange={(event) => onTierChange(index, 'minQuantity', event.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm font-semibold transition-all duration-200" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Скидка уровня</label>
                      <input type="number" min="1" step="1" value={tier.discountValue} onChange={(event) => onTierChange(index, 'discountValue', event.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm font-semibold transition-all duration-200" />
                    </div>
                    <button type="button" onClick={() => onRemoveTier(index)} className="p-2 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Дата старта</label>
              <input type="datetime-local" name="startsAt" value={promotionForm.startsAt} onChange={onFormChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Дата окончания</label>
              <input type="datetime-local" name="endsAt" value={promotionForm.endsAt} onChange={onFormChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Лимит использований</label>
              <input type="number" min="1" name="usageLimit" value={promotionForm.usageLimit} onChange={onFormChange} placeholder="Без лимита" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">Макс. раз на клиента</label>
              <input type="number" min="1" name="maxUsagePerUser" value={promotionForm.maxUsagePerUser} onChange={onFormChange} placeholder="Без ограничений" className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-bold transition-all duration-200" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4 sm:p-5 bg-slate-50">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" name="isActive" checked={promotionForm.isActive} onChange={onFormChange} className="h-4.5 w-4.5 rounded-lg border-slate-350 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2 transition-all cursor-pointer" />
              Акция активна и может применяться
            </label>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" name="showOnSite" checked={promotionForm.showOnSite} onChange={onFormChange} className="h-4.5 w-4.5 rounded-lg border-slate-350 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2 transition-all cursor-pointer" />
              Показывать на странице «Акции и скидки»
            </label>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer sm:col-span-2">
              <input type="checkbox" name="showOnHome" checked={promotionForm.showOnHome} onChange={onFormChange} className="h-4.5 w-4.5 rounded-lg border-slate-350 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2 transition-all cursor-pointer" />
              Показывать на главной странице в компактном баннере
            </label>
            <div className="sm:col-span-2 border-t border-slate-200 pt-4 mt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="isFirstOrderOnly"
                  checked={!!promotionForm.isFirstOrderOnly}
                  onChange={onFormChange}
                  className="mt-0.5 h-4.5 w-4.5 rounded-lg border-slate-350 text-amber-500 focus:ring-amber-400 focus:ring-offset-2 transition-all cursor-pointer shrink-0"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                    Только для первого заказа
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 mt-0.5">
                    Промокод сработает только у тех клиентов, у которых ещё нет ни одного оформленного заказа
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-5 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-600/10">
              {editingPromotion ? 'Сохранить изменения' : 'Опубликовать акцию'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
