import React from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle as PlusCircleIcon, X as XIcon } from 'lucide-react';

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
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <PlusCircleIcon className={`h-5.5 w-5.5 ${editingProduct ? 'text-amber-500' : 'text-slate-900'}`} />
            {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название товара *</label>
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={onFormChange}
                required
                placeholder="Например, Цемент Портланд М500"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Категория в каталоге *</label>
              <select
                name="categoryId"
                value={productForm.categoryId}
                onChange={onFormChange}
                required
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
              >
                <option value="">Выбрать категорию...</option>
                {hierarchicalCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'\u00A0\u00A0'.repeat(category.depth)}{category.depth > 0 ? '└─ ' : ''}{category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Поставщик / Склад *</label>
              {isSupplier ? (
                <input
                  type="text"
                  value={user.supplierName}
                  disabled
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-slate-500 text-sm font-semibold"
                />
              ) : (
                <select
                  name="supplierId"
                  value={productForm.supplierId}
                  onChange={onFormChange}
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                >
                  <option value="">Выбрать поставщика...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Цена (₸) *</label>
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={onFormChange}
                required
                placeholder="2500"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Старая цена (₸)</label>
              <input
                type="number"
                name="oldPrice"
                value={productForm.oldPrice}
                onChange={onFormChange}
                placeholder="2900"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Короткое описание</label>
            <textarea
              name="description"
              value={productForm.description}
              onChange={onFormChange}
              rows={2}
              placeholder="Основные параметры для быстрого поиска..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Подробное описание товара</label>
            <textarea
              name="details"
              value={productForm.details}
              onChange={onFormChange}
              rows={3}
              placeholder="Полное описание товара, свойства..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Характеристики</label>
              <textarea
                name="specifications"
                value={productForm.specifications}
                onChange={onFormChange}
                rows={2}
                placeholder="Вес: 30 кг&#10;Марка: М500"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Инструкция по применению</label>
              <textarea
                name="usage"
                value={productForm.usage}
                onChange={onFormChange}
                rows={2}
                placeholder="Наносить при температуре от +5°С..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Условия опта</label>
            <input
              type="text"
              name="bulkDiscount"
              value={productForm.bulkDiscount}
              onChange={onFormChange}
              placeholder="от 50 шт: 2300 ₸"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          <div className="border border-dashed border-slate-200 p-4 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-600 uppercase">Фотография товара</span>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                id="imageFileInput"
                accept="image/*"
                onChange={onFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
              <div className="text-xs text-slate-400 font-bold uppercase shrink-0">Или внешняя ссылка</div>
              <input
                type="text"
                name="imageUrl"
                value={productForm.imageUrl}
                onChange={onFormChange}
                placeholder="https://images.com/cement.jpg"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-xs text-slate-700"
                disabled={!!imageFile}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHit"
              name="isHit"
              checked={productForm.isHit}
              onChange={onFormChange}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isHit" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Отметить как ХИТ продаж 🔥
            </label>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {editingProduct ? 'Сохранить изменения' : 'Загрузить товар'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
