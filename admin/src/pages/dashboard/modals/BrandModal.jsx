import React from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck as BadgeCheckIcon, X as XIcon } from 'lucide-react';

export default function BrandModal({ open, onClose, onSubmit, editingBrand, brandForm, onFormChange, onFileChange }) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <BadgeCheckIcon className={`h-5.5 w-5.5 ${editingBrand ? 'text-amber-500' : 'text-emerald-600'}`} />
            {editingBrand ? 'Редактировать бренд' : 'Новый бренд-партнер'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 flex-grow">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название бренда *</label>
              <input type="text" name="name" value={brandForm.name} onChange={onFormChange} required placeholder="Bosch" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Порядок сортировки</label>
              <input type="number" min="0" step="1" name="sortOrder" value={brandForm.sortOrder} onChange={onFormChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Описание / для чего *</label>
            <input type="text" name="description" value={brandForm.description} onChange={onFormChange} required placeholder="Проф. инструменты" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Логотип файлом</label>
              <input type="file" accept="image/*" onChange={onFileChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Или URL логотипа</label>
              <input type="text" name="logo" value={brandForm.logo} onChange={onFormChange} placeholder="https://.../logo.png" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          {(brandForm.logo || editingBrand?.logo) && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-center min-h-24">
              <img src={brandForm.logo || editingBrand?.logo} alt={brandForm.name || editingBrand?.name || 'brand'} className="max-h-16 object-contain" />
            </div>
          )}

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 rounded-2xl border border-slate-100 p-4 bg-slate-50/80">
            <input type="checkbox" name="isActive" checked={brandForm.isActive} onChange={onFormChange} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Показывать бренд на главной странице
          </label>

          <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {editingBrand ? 'Сохранить изменения' : 'Добавить бренд'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
