import React from 'react';
import { createPortal } from 'react-dom';
import { Layers as LayersIcon, X as XIcon } from 'lucide-react';

export default function CategoryModal({
  open,
  onClose,
  onSubmit,
  editingCategory,
  categoryForm,
  hierarchicalCategories,
  categoryImageFile,
  previewCategoryImage,
  onFormChange,
  onFileChange,
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <LayersIcon className={`h-5.5 w-5.5 ${editingCategory ? 'text-amber-500' : 'text-slate-950'}`} />
            {editingCategory ? 'Редактировать раздел' : 'Создать новый раздел'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 flex-grow">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название раздела *</label>
            <input
              type="text"
              name="name"
              value={categoryForm.name}
              onChange={onFormChange}
              required
              placeholder="Например, Ручные инструменты"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Слаг в URL (необязательно)</label>
            <input
              type="text"
              name="slug"
              value={categoryForm.slug}
              onChange={onFormChange}
              placeholder="hand-tools (сгенерируется автоматически)"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Родительский раздел</label>
              <select
                name="parentId"
                value={categoryForm.parentId}
                onChange={onFormChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
              >
                <option value="">— Корневая категория —</option>
                {hierarchicalCategories
                  .filter((category) => !editingCategory || category.id !== editingCategory.id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {'\u00A0\u00A0'.repeat(category.depth)}{category.depth > 0 ? '└─ ' : ''}{category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Кешбэк (%)</label>
              <input
                type="number"
                name="cashbackPercent"
                value={categoryForm.cashbackPercent}
                onChange={onFormChange}
                placeholder="Наследуется или 3%"
                min="0"
                max="100"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
          </div>

          <div className="border border-dashed border-slate-200 p-4 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-600 uppercase">Изображение раздела</span>

            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  id="categoryFileInput"
                  accept="image/*"
                  onChange={onFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>
              <div className="text-center text-xs text-slate-400 font-bold uppercase">Или URL</div>
              <div>
                <input
                  type="text"
                  name="image"
                  value={categoryForm.image}
                  onChange={onFormChange}
                  placeholder="https://images.com/category.jpg"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-xs text-slate-700"
                  disabled={!!categoryImageFile}
                />
              </div>
            </div>

            {previewCategoryImage && (
              <div className="relative w-full h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden animate-fade-in">
                <img
                  src={previewCategoryImage}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {editingCategory ? 'Сохранить изменения' : 'Создать раздел'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
