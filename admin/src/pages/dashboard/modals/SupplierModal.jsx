import React from 'react';
import { createPortal } from 'react-dom';
import { UserCheck as UserCheckIcon, X as XIcon } from 'lucide-react';

export default function SupplierModal({
  open,
  onClose,
  onSubmit,
  editingSupplier,
  supplierForm,
  onFormChange,
}) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <UserCheckIcon className={`h-5.5 w-5.5 ${editingSupplier ? 'text-amber-500' : 'text-slate-950'}`} />
            {editingSupplier ? 'Редактировать дистрибьютора' : 'Регистрация дистрибьютора'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 flex-grow">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название компании *</label>
            <input
              type="text"
              name="name"
              value={supplierForm.name}
              onChange={onFormChange}
              required
              placeholder="ТОО СтройОптАзия"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Срок доставки со склада *</label>
            <input
              type="text"
              name="delivery"
              value={supplierForm.delivery}
              onChange={onFormChange}
              required
              placeholder="Завтра, 1-2 дня"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Рейтинг поставщика</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                name="rating"
                value={supplierForm.rating}
                onChange={onFormChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Количество отзывов</label>
              <input
                type="number"
                name="reviews"
                value={supplierForm.reviews}
                onChange={onFormChange}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
              {editingSupplier ? 'Сохранить изменения' : 'Зарегистрировать'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
