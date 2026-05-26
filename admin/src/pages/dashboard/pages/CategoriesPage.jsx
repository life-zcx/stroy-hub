import React from 'react';
import {
  Edit3 as EditIcon,
  Layers as LayersIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
} from 'lucide-react';

export default function CategoriesPage({
  categories,
  hierarchicalCategories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Разделы каталога</h2>
          <p className="text-xs text-slate-500 mt-0.5">Настройка структуры и иерархии категорий</p>
        </div>
        <button
          onClick={onCreateCategory}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Создать раздел
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center py-20 text-slate-500">Разделы каталога отсутствуют.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pr-2">Изображение</th>
                  <th className="pb-3 px-2">Раздел</th>
                  <th className="pb-3 px-2">Слаг</th>
                  <th className="pb-3 px-2">Родительский раздел</th>
                  <th className="pb-3 pl-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {hierarchicalCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img
                            src={category.image}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <LayersIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-900">
                      <div className="flex items-center" style={{ marginLeft: `${category.depth * 1.5}rem` }}>
                        {category.depth > 0 && (
                          <span className="text-slate-300 font-extrabold font-mono mr-2 select-none">└─</span>
                        )}
                        <span className={category.depth === 0 ? 'font-extrabold text-slate-950 text-sm' : category.depth === 1 ? 'font-bold text-slate-800 text-sm' : 'font-semibold text-slate-600 text-xs'}>
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 font-mono text-xs">{category.slug}</td>
                    <td className="py-3.5 px-2 text-slate-400 text-xs font-semibold">
                      {category.parentId ? (
                        <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
                          {categories.find((item) => item.id === category.parentId)?.name || '—'}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">— Корневой —</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditCategory(category)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                          title="Редактировать раздел"
                        >
                          <EditIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCategory(category.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Удалить раздел"
                        >
                          <Trash2Icon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
