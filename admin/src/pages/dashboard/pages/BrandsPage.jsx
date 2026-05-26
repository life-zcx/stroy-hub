import React from 'react';
import { BadgeCheck as BadgeCheckIcon, Edit3 as EditIcon, Plus as PlusIcon, Trash2 as Trash2Icon } from 'lucide-react';

export default function BrandsPage({ brands, onCreateBrand, onEditBrand, onDeleteBrand }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Бренды-партнеры</h2>
          <p className="text-xs text-slate-500 mt-0.5">Управляйте логотипами и описаниями брендов в блоке на главной странице</p>
        </div>
        <button onClick={onCreateBrand} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5">
          <PlusIcon className="h-4 w-4" />
          Новый бренд
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {brands.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center">
            <BadgeCheckIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-900">Бренды пока не заполнены.</p>
            <p className="text-sm text-slate-500 mt-1">Добавьте логотип, название и описание, чтобы вывести бренд на главную страницу.</p>
          </div>
        ) : brands.map((brand) => (
          <article key={brand.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1">
              <div className="h-24 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="max-h-16 max-w-[80%] object-contain" />
                ) : (
                  <span className="font-black text-slate-400 text-xl font-outfit">{brand.name}</span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-950 font-outfit">{brand.name}</h3>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.2em] ${brand.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {brand.isActive ? 'Активен' : 'Скрыт'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{brand.description}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Порядок на главной: <span className="font-bold text-slate-800">{brand.sortOrder}</span>
              </div>
            </div>

            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <button onClick={() => onEditBrand(brand)} className="px-3 py-2 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all">
                <EditIcon className="h-3.5 w-3.5" />
                Редактировать
              </button>
              <button onClick={() => onDeleteBrand(brand.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Удалить бренд">
                <Trash2Icon className="h-4.5 w-4.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
