import React from 'react';
import {
  Edit3 as EditIcon,
  Package as PackageIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
} from 'lucide-react';

export default function ProductsPage({
  products,
  categories,
  onCreateProduct,
  onEditProduct,
  onDeleteProduct,
  formatPrice,
  getCategoryPath,
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Зарегистрированные товары</h2>
          <p className="text-xs text-slate-500 mt-0.5">Полный список ассортимента на витрине StroyHub</p>
        </div>
        <button
          onClick={onCreateProduct}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Добавить товар
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <p className="text-center py-20 text-slate-500">Товары отсутствуют.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pr-2">Товар</th>
                  <th className="pb-3 px-2">Категория в базе</th>
                  <th className="pb-3 px-2">Дистрибьютор</th>
                  <th className="pb-3 px-2">Цена</th>
                  <th className="pb-3 pl-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-2 font-semibold text-slate-900 max-w-[280px] truncate flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={product.image}
                          className="w-full h-full object-contain"
                          onError={(event) => {
                            event.target.src = 'https://placehold.co/50x50';
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-bold text-slate-900">{product.name}</span>
                        {product.isHit && (
                          <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded w-fit mt-0.5">
                            ХИТ 🔥
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 text-xs font-semibold">
                      {product.categoryRelation
                        ? getCategoryPath(product.categoryId)
                        : (categories.find((category) => category.slug === product.category)?.name || product.category)}
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 text-xs font-bold">{product.supplier?.name}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-900">{formatPrice(product.price)}</td>
                    <td className="py-3.5 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Редактировать товар"
                        >
                          <EditIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Удалить товар"
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
