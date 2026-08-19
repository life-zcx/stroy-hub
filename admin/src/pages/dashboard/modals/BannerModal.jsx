import React from 'react';
import { createPortal } from 'react-dom';
import {
  Image as ImageIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
  ArrowRight,
  Sparkles,
  Gift,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';

const VARIANT_OPTIONS = [
  { value: 'PRIMARY_BLUE', label: '🔵 Синяя бренд (Primary Blue)', bg: 'bg-blue-600 text-white' },
  { value: 'OUTLINE_WHITE', label: '⚪ Прозрачная стекло (Outline Glass)', bg: 'bg-slate-900/60 text-white border border-white/30' },
  { value: 'SLATE_DARK', label: '🖤 Тёмная элегантная (Dark Slate)', bg: 'bg-slate-900 text-white' },
  { value: 'EMERALD', label: '🟢 Изумрудная (Emerald)', bg: 'bg-emerald-600 text-white' },
  { value: 'AMBER', label: '🟡 Желтый Tormag (Amber Accent)', bg: 'bg-amber-400 text-slate-950 font-black' },
];

const ICON_OPTIONS = [
  { value: 'arrow', label: 'Стрелка (→)' },
  { value: 'sparkles', label: 'Звезда (✨)' },
  { value: 'gift', label: 'Подарок (🎁)' },
  { value: 'shopping', label: 'Корзина (🛒)' },
  { value: 'none', label: 'Без иконки' },
];

export default function BannerModal({
  open,
  onClose,
  onSubmit,
  editingBanner,
  bannerForm,
  onFormChange,
  buttons = [],
  onAddButton,
  onRemoveButton,
  onButtonChange,
  imageDesktopFile,
  imageMobileFile,
  onDesktopFileChange,
  onMobileFileChange,
  onClearDesktopImage,
  onClearMobileImage,
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto animate-slide-up z-10 flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 p-6 sm:p-8 sm:pb-4 shrink-0">
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 font-outfit">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            {editingBanner ? 'Редактировать баннер' : 'Новый рекламный баннер'}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 flex-grow overflow-y-auto admin-main-scroll p-6 sm:p-8 text-left">
          
          {/* Banner Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                1. Изображения баннера из Figma *
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Фоновая графика высокого разрешения
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Banner 1: Desktop */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">
                    Баннер для ПК (Desktop) *
                  </label>
                  {(imageDesktopFile || bannerForm.imageDesktop) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      ✓ Загружен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider">
                      Обязательно
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                  Рекомендуемый размер: 2432×960 px (Формат 2.5:1)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onDesktopFileChange}
                    className="hidden"
                    id="banner-desktop-upload"
                  />
                  <label
                    htmlFor="banner-desktop-upload"
                    className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold cursor-pointer text-center transition-all duration-200 border-dashed truncate ${
                      (imageDesktopFile || bannerForm.imageDesktop)
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900 hover:bg-blue-100/70'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {imageDesktopFile ? imageDesktopFile.name : (bannerForm.imageDesktop ? 'Изменить файл...' : '+ Выбрать файл...')}
                  </label>
                  {(imageDesktopFile || bannerForm.imageDesktop) && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-11 rounded-xl border border-blue-300 overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={imageDesktopFile ? URL.createObjectURL(imageDesktopFile) : bannerForm.imageDesktop}
                          alt="Превью баннера ПК"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onClearDesktopImage}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Удалить файл"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner 2: Mobile */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider pl-1">
                    Баннер для Смартфонов (Mobile)
                  </label>
                  {(imageMobileFile || bannerForm.imageMobile) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      ✓ Загружен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase tracking-wider" title="Будет использоваться адаптированный ПК баннер">
                      ℹ️ Авто-адаптация ПК
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold text-slate-400 pl-1">
                  Рекомендуемый размер: 780×860 px (Вертикальный)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onMobileFileChange}
                    className="hidden"
                    id="banner-mobile-upload"
                  />
                  <label
                    htmlFor="banner-mobile-upload"
                    className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold cursor-pointer text-center transition-all duration-200 border-dashed truncate ${
                      (imageMobileFile || bannerForm.imageMobile)
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900 hover:bg-blue-100/70'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {imageMobileFile ? imageMobileFile.name : (bannerForm.imageMobile ? 'Изменить файл...' : '+ Выбрать файл...')}
                  </label>
                  {(imageMobileFile || bannerForm.imageMobile) && (
                    <div className="relative group shrink-0">
                      <div className="w-16 h-11 rounded-xl border border-blue-300 overflow-hidden bg-slate-100 shadow-sm">
                        <img
                          src={imageMobileFile ? URL.createObjectURL(imageMobileFile) : bannerForm.imageMobile}
                          alt="Превью баннера мобайл"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onClearMobileImage}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Удалить файл"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 🎛️ BUTTON CONSTRUCTOR SECTION */}
          <div className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Интерактивные кнопки поверх баннера (Конструктор)
                </span>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Добавьте от 0 до 2 кнопок (например: «Вступить в клуб» + «Правила программы»)
                </p>
              </div>

              {buttons.length < 2 && (
                <button
                  type="button"
                  onClick={onAddButton}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Добавить кнопку
                </button>
              )}
            </div>

            {buttons.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-bold text-slate-400 text-center">
                Кнопки кодом не заданы. Вы можете кликать по всему баннеру через общее поле ссылки ниже.
              </div>
            ) : (
              <div className="space-y-4">
                {buttons.map((btn, index) => (
                  <div key={btn.id || index} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 uppercase">
                        Кнопка #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveButton(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Удалить кнопку"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">
                          Текст на кнопке *
                        </label>
                        <input
                          type="text"
                          value={btn.text || ''}
                          onChange={(e) => onButtonChange(index, 'text', e.target.value)}
                          placeholder="Например: Вступить в клуб →"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">
                          Тип действия *
                        </label>
                        <select
                          value={btn.actionType || 'LINK'}
                          onChange={(e) => onButtonChange(index, 'actionType', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                        >
                          <option value="LINK">🔗 Переход по ссылке (URL / Раздел)</option>
                          <option value="AUTH_MODAL">🔐 Открыть окно входа / регистрации</option>
                        </select>
                      </div>
                    </div>

                    {btn.actionType !== 'AUTH_MODAL' && (
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">
                          Ссылка перехода (URL) *
                        </label>
                        <input
                          type="text"
                          value={btn.url || ''}
                          onChange={(e) => onButtonChange(index, 'url', e.target.value)}
                          placeholder="Например: /cashback, /catalog или /estimate"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">
                          Цветовой стиль кнопки
                        </label>
                        <select
                          value={btn.variant || 'PRIMARY_BLUE'}
                          onChange={(e) => onButtonChange(index, 'variant', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                        >
                          {VARIANT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-450 uppercase mb-1">
                          Иконка
                        </label>
                        <select
                          value={btn.icon || 'arrow'}
                          onChange={(e) => onButtonChange(index, 'icon', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Positioning & Text Overlays */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">
                Общая ссылка по клику на весь баннер (если нет кнопок)
              </label>
              <input
                type="text"
                name="linkUrl"
                value={bannerForm.linkUrl || ''}
                onChange={onFormChange}
                placeholder="Например: /cashback"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">
                Расположение текстового блока и кнопок
              </label>
              <select
                name="position"
                value={bannerForm.position || 'bottom-left'}
                onChange={onFormChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold transition-all duration-200"
              >
                <option value="bottom-left">Снизу слева (Классическое)</option>
                <option value="bottom-center">Снизу по центру</option>
                <option value="center-left">По центру слева</option>
              </select>
            </div>
          </div>

          {/* Optional Text Overlays */}
          <div className="grid md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">
                Заголовок (опционально, если не нарисован в Figma)
              </label>
              <input
                type="text"
                name="title"
                value={bannerForm.title || ''}
                onChange={onFormChange}
                placeholder="Скидка на строительный инструмент"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">
                Подзаголовок (опционально)
              </label>
              <input
                type="text"
                name="subtitle"
                value={bannerForm.subtitle || ''}
                onChange={onFormChange}
                placeholder="Накапливайте кешбэк до 5% и оплачивайте бонусами"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold transition-all duration-200"
              />
            </div>
          </div>

          {/* Status & Sort Order */}
          <div className="grid md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4 sm:p-5 bg-slate-50">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 pl-1">
                Порядок показа в слайдере
              </label>
              <input
                type="number"
                name="sortOrder"
                value={bannerForm.sortOrder ?? 0}
                onChange={onFormChange}
                min="0"
                step="1"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold transition-all duration-200"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={bannerForm.isActive}
                  onChange={onFormChange}
                  className="h-4.5 w-4.5 rounded-lg border-slate-350 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
                />
                Баннер активен и отображается на сайте
              </label>
            </div>
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-5 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider shadow-md hover:shadow-blue-600/10">
              {editingBanner ? 'Сохранить изменения' : 'Опубликовать баннер'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
