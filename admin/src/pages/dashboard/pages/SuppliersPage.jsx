import React from 'react';
import {
  Award as AwardIcon,
  Edit3 as EditIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  Truck as TruckIcon,
} from 'lucide-react';

export default function SuppliersPage({ suppliers, onCreateSupplier, onEditSupplier, onDeleteSupplier }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Дистрибьюторы на платформе</h2>
          <p className="text-xs text-slate-500 mt-0.5">Официальные склады дилеров и заводов-партнеров</p>
        </div>
        <button
          onClick={onCreateSupplier}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Зарегистрировать поставщика
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="border border-gray-150 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all bg-white">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">{supplier.name}</h3>
                <div className="space-y-1.5 mt-3">
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-semibold">
                    <TruckIcon className="h-4 w-4 text-emerald-600 shrink-0" /> Доставка: {supplier.delivery}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <AwardIcon className="h-4 w-4 text-amber-400 shrink-0" /> Рейтинг: {supplier.rating} · {supplier.reviews} отзывов
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 border-t border-slate-50 pt-3.5">
                <button
                  onClick={() => onEditSupplier(supplier)}
                  className="px-3 py-1.5 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <EditIcon className="h-3.5 w-3.5" /> Редактировать
                </button>
                <button
                  onClick={() => onDeleteSupplier(supplier.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Удалить дистрибьютора"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
