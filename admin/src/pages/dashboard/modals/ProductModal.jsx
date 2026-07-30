import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PlusCircle as PlusCircleIcon,
  X as XIcon,
  Package,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Layers,
  Link as LinkIcon,
  Trash2,
  CheckCircle,
  Star,
  Upload,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function ProductModal({
  open,
  onClose,
  onSubmit,
  editingProduct,
  productForm,
  hierarchicalCategories,
  suppliers,
  isSupplier,
  user,
  imageFile,
  onFormChange,
  onFileChange,
  additionalImageFiles = [],
  onAdditionalFilesChange,
  onRemoveAdditionalFile,
  onRemoveSavedImage,
  onClearMainImage,
  isSubmitting = false,
}) {
  const [activeTab, setActiveTab] = useState('general');

  if (!open) {
    return null;
  }

  // Live retail price estimator calculation (15% markup + 5% log + 2% acq + 3% tax = ~28% total margin on top of wholesale)
  const wholesalePrice = parseFloat(productForm.price) || 0;
  const estimatedRetailPrice = Math.round(wholesalePrice * 1.28);

  const tabs = [
    { id: 'general', label: 'Основные', icon: Package },
    { id: 'pricing', label: 'Цены', icon: DollarSign },
    { id: 'media', label: 'Галерея', icon: ImageIcon },
    { id: 'details', label: 'Описание', icon: FileText },
    { id: 'options', label: 'Варианты', icon: Layers },
    { id: 'seo', label: 'ЧПУ & SEO', icon: LinkIcon },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] pointer-events-auto animate-slide-up z-10 p-5 sm:p-7 flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${editingProduct ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <PlusCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit leading-snug">
                {editingProduct ? 'Редактирование номенклатуры' : 'Создание новой номенклатуры'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {editingProduct ? `ID: ${editingProduct.id} · ${editingProduct.name}` : 'Заполните параметры товара для каталога Tormag'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl mb-4 shrink-0 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 select-none ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={onSubmit} className="flex-grow flex flex-col min-h-0">
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4 text-left admin-main-scroll">

            {/* ── TAB 1: GENERAL INFO ── */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={onFormChange}
                    required
                    placeholder="Например, Дрель-шуруповерт ALTECO CD 1210 Li-Ion"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Артикул / SKU
                    </label>
                    <input
                      type="text"
                      name="article"
                      value={productForm.article || ''}
                      onChange={onFormChange}
                      placeholder="Например, ALT-CD-1210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-mono font-semibold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Категория *
                    </label>
                    <select
                      name="categoryId"
                      value={productForm.categoryId}
                      onChange={onFormChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold cursor-pointer transition-all"
                    >
                      <option value="">Выбрать категорию...</option>
                      {hierarchicalCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {'\u00A0\u00A0'.repeat(category.depth)}{category.depth > 0 ? '└─ ' : ''}{category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Поставщик / Склад *
                    </label>
                    {isSupplier ? (
                      <input
                        type="text"
                        value={user.supplierName}
                        disabled
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold"
                      />
                    ) : (
                      <select
                        name="supplierId"
                        value={productForm.supplierId}
                        onChange={onFormChange}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold cursor-pointer transition-all"
                      >
                        <option value="">Выбрать поставщика...</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer w-full hover:bg-slate-100/60 transition-all select-none">
                      <input
                        type="checkbox"
                        id="isHit"
                        name="isHit"
                        checked={productForm.isHit}
                        onChange={onFormChange}
                        className="h-4 w-4 rounded text-red-500 focus:ring-red-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Отметить как ХИТ продаж 🔥
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: PRICING & ECONOMICS ── */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      Оптовая цена (₸) *
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium mb-1.5">Себестоимость от поставщика</p>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={onFormChange}
                      required
                      placeholder="2500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/40 text-base font-extrabold text-slate-900 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                      Старая оптовая цена (₸)
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium mb-1.5">Для вывода зачеркнутой скидки</p>
                    <input
                      type="number"
                      name="oldPrice"
                      value={productForm.oldPrice}
                      onChange={onFormChange}
                      placeholder="2900"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/40 text-base font-extrabold text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Кешбэк за покупку (%)
                  </label>
                  <input
                    type="number"
                    name="cashbackPercent"
                    value={productForm.cashbackPercent}
                    onChange={onFormChange}
                    placeholder="По умолчанию (3%)"
                    min="0"
                    max="100"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/40 text-sm font-semibold transition-all"
                  />
                </div>
              </div>
            )}

            {/* ── TAB 3: MEDIA & GALLERY ── */}
            {activeTab === 'media' && (
              <div className="space-y-4 animate-fade-in">
                {/* Main Cover Image */}
                <div className="border border-dashed border-slate-250 p-4 rounded-2xl space-y-3 bg-slate-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Обложка (Главное фото) *</span>
                    {(productForm.imageUrl || imageFile) && (
                      <button
                        type="button"
                        onClick={onClearMainImage}
                        className="text-[10px] text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Очистить обложку
                      </button>
                    )}
                  </div>

                  {(productForm.imageUrl || imageFile) && (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : productForm.imageUrl}
                        alt="Обложка"
                        className="h-16 w-16 object-contain rounded-lg border border-slate-100 bg-slate-50"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block truncate max-w-[200px]">
                          {imageFile ? imageFile.name : 'Текущее главная фото'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle className="h-3 w-3" /> Главное фото карточки
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    id="imageFileInput"
                    accept="image/*"
                    onChange={onFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                </div>

                {/* Additional Photos Gallery Manager */}
                <div className="border border-dashed border-slate-250 p-4 rounded-2xl space-y-3 bg-slate-50/40">
                  <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Дополнительные фотографии в галерею
                  </span>

                  {/* Previews of already saved image URLs */}
                  {Array.isArray(productForm.images) && productForm.images.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Сохраненные фото ({productForm.images.length}):</span>
                      <div className="flex flex-wrap gap-2.5">
                        {productForm.images.map((url, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-white group flex items-center justify-center shadow-2xs">
                            <img src={url} alt="" className="w-full h-full object-contain p-1" onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=Error'; }} />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onRemoveSavedImage?.(url)}
                                className="p-1 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600"
                                title="Удалить из галереи"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previews of newly selected files */}
                  {additionalImageFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Новые выбранные фото ({additionalImageFiles.length}):</span>
                      <div className="flex flex-wrap gap-2.5">
                        {additionalImageFiles.map((file, idx) => {
                          const objectUrl = URL.createObjectURL(file);
                          return (
                            <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-white group flex items-center justify-center shadow-2xs">
                              <img src={objectUrl} alt="" className="w-full h-full object-contain p-1" />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRemoveAdditionalFile?.(idx);
                                    URL.revokeObjectURL(objectUrl);
                                  }}
                                  className="p-1 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600"
                                  title="Удалить"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    id="additionalImageFilesInput"
                    accept="image/*"
                    multiple
                    onChange={onAdditionalFilesChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 font-medium"> Выберите 1 или несколько графических файлов одновременно (JPG, PNG, WEBP).</p>
                </div>
              </div>
            )}

            {/* ── TAB 4: DETAILS & SPECS ── */}
            {activeTab === 'details' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Краткое описание (для списка товаров)
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Показывается в карточках каталога</span>
                  </div>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={onFormChange}
                    rows={3}
                    placeholder="Основные ключевые преимущества товара..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold transition-all resize-y min-h-[70px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Подробное описание товара
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Главный блок на странице товара</span>
                  </div>
                  <textarea
                    name="details"
                    value={productForm.details}
                    onChange={onFormChange}
                    rows={6}
                    placeholder="Полное описание, область применения, физические свойства..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold transition-all resize-y min-h-[140px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Технические характеристики
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!productForm.specifications) {
                            onFormChange({
                              target: {
                                name: 'specifications',
                                value: 'Толщина: 50 мм\nТип кромки: Г-образная\nПлотность: 25-35 кг/м³\nКоэффициент теплопроводности: не более 0,034 Вт/(м·К)'
                              }
                            });
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        + Заполнить пример
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1.5">Каждая характеристика с новой строки в формате <code>Параметр: Значение</code></p>
                    <textarea
                      name="specifications"
                      value={productForm.specifications}
                      onChange={onFormChange}
                      rows={6}
                      placeholder="Толщина: 50 мм&#10;Плотность: 30 кг/м³&#10;Бренд: Пеноплекс"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-mono transition-all resize-y min-h-[140px]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Инструкция по применению
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1.5">Пошаговая инструкция использования или монтажа</p>
                    <textarea
                      name="usage"
                      value={productForm.usage}
                      onChange={onFormChange}
                      rows={6}
                      placeholder="1. Подготовить основание...&#10;2. Нанести клей...&#10;3. Закрепить плиты..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-semibold transition-all resize-y min-h-[140px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: OPTIONS / VARIANTS ── */}
            {activeTab === 'options' && (
              <div className="space-y-4 animate-fade-in">
                <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">Варианты товара (Фасовка / Размеры / Модели)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Название блока вариантов</label>
                    <input
                      type="text"
                      placeholder="Например: Фасовка / Размер:"
                      value={productForm.options?.label || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onFormChange({
                          target: {
                            name: 'options',
                            value: { ...productForm.options, label: val, items: productForm.options?.items || [] }
                          }
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-bold text-slate-500">Список вариантов:</label>
                    {(productForm.options?.items || []).map((item, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <input
                          type="text"
                          placeholder="Значение (50 кг / 12V)"
                          value={item.value || ''}
                          onChange={(e) => {
                            const newItems = [...(productForm.options?.items || [])];
                            newItems[idx] = { ...newItems[idx], value: e.target.value };
                            onFormChange({
                              target: {
                                name: 'options',
                                value: { ...productForm.options, items: newItems }
                              }
                            });
                          }}
                          className="flex-1 min-w-[120px] p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="number"
                          placeholder="Опт. цена ₸"
                          value={item.price || ''}
                          onChange={(e) => {
                            const newItems = [...(productForm.options?.items || [])];
                            newItems[idx] = { ...newItems[idx], price: e.target.value };
                            onFormChange({
                              target: {
                                name: 'options',
                                value: { ...productForm.options, items: newItems }
                              }
                            });
                          }}
                          className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-extrabold"
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0 text-xs text-slate-600 font-semibold select-none">
                          <input
                            type="checkbox"
                            checked={item.available ?? true}
                            onChange={(e) => {
                              const newItems = [...(productForm.options?.items || [])];
                              newItems[idx] = { ...newItems[idx], available: e.target.checked };
                              onFormChange({
                                target: {
                                  name: 'options',
                                  value: { ...productForm.options, items: newItems }
                                }
                              });
                            }}
                            className="rounded text-amber-500 focus:ring-amber-500"
                          />
                          В наличии
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = (productForm.options?.items || []).filter((_, i) => i !== idx);
                            onFormChange({
                              target: {
                                name: 'options',
                                value: { ...productForm.options, items: newItems }
                              }
                            });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...(productForm.options?.items || []), { value: '', available: true }];
                        onFormChange({
                          target: {
                            name: 'options',
                            value: { ...productForm.options, label: productForm.options?.label || 'Фасовка / Размер:', items: newItems }
                          }
                        });
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 pt-1"
                    >
                      + Добавить вариант
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: SEO & SLUG ── */}
            {activeTab === 'seo' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    ЧПУ Ссылка товара (Slug)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={productForm.slug || ''}
                    onChange={onFormChange}
                    placeholder="Auto-generated if blank (например: drel-shurupovert-alteco-cd-1210)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/40 text-sm font-mono font-bold transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Позволяет открывать страницу товара по человекопонятному URL адресу вместо ID.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Предпросмотр адреса в браузере:</span>
                  <div className="text-xs font-mono font-bold text-blue-600 truncate">
                    https://tormag.kz/product/{productForm.slug || 'drel-shurupovert-alteco'}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Submitting Status Banner */}
          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold animate-pulse mb-3">
              <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-amber-600" />
              <span>Идет загрузка и обработка фотографий на сервере, пожалуйста подождите...</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 border-t border-slate-100 pt-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Сохранение товара...</span>
                </>
              ) : (
                <span>{editingProduct ? 'Сохранить изменения' : 'Загрузить в номенклатуру'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
