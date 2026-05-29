import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Edit3 as EditIcon,
  Package as PackageIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload as UploadIcon,
  AlertTriangle,
  X as XIcon,
} from 'lucide-react';
import { getProductsPaged, importProductsXlsx } from '../../../services/api';

const PAGE_SIZE = 50;

export default function ProductsPage({
  categories,
  onCreateProduct,
  onEditProduct,
  onDeleteProduct,
  formatPrice,
  getCategoryPath,
}) {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [importing, setImporting]   = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState('');

  const fileInputRef = useRef(null);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportErrors([]);
    setImportSuccess('');

    try {
      const res = await importProductsXlsx(file);
      if (res.success) {
        setImportSuccess(`Импорт успешно завершен! Создано товаров: ${res.createdCount || 0}, обновлено: ${res.updatedCount || 0}`);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      if (errData?.errors) {
        setImportErrors(errData.errors);
      } else {
        setImportErrors([{ row: 'Система', error: errData?.error || err.message || 'Ошибка импорта' }]);
      }
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset
    }
  };

  const debounceTimer = useRef(null);

  // Debounce search input
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductsPaged({ page, limit: PAGE_SIZE, search: debouncedSearch });
      setProducts(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // After create/edit/delete, refresh current page
  const handleDeleteWithRefresh = async (id) => {
    await onDeleteProduct(id);
    fetchProducts();
  };

  const handleEditProduct = (product) => {
    onEditProduct(product);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Зарегистрированные товары</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Загрузка...' : `${total.toLocaleString('ru-RU')} позиций в каталоге Tormag`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={handleSearchChange}
              className="pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-52 transition-all"
            />
          </div>

          {/* Reload */}
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-40"
            title="Обновить"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Import XLSX */}
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            <UploadIcon className="h-4 w-4" />
            {importing ? 'Импорт...' : 'Импорт прайса (.xlsx)'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {/* Add product */}
          <button
            onClick={onCreateProduct}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-4 w-4" />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Import Success Banner */}
      {importSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {importSuccess}
          </div>
          <button onClick={() => setImportSuccess('')} className="p-1 text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Import Errors Modal */}
      {importErrors.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-base font-extrabold font-outfit text-slate-900">Ошибки валидации файла импорта</h3>
              </div>
              <button 
                onClick={() => setImportErrors([])} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                Импорт был прерван. Пожалуйста, исправьте следующие ошибки в файле и загрузите его повторно:
              </p>
              <div className="space-y-2">
                {importErrors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs flex gap-2">
                    <span className="font-black text-red-700 whitespace-nowrap bg-red-100/60 px-2 py-0.5 rounded-lg h-fit">
                      Строка {err.row}
                    </span>
                    <span className="font-semibold text-slate-700 leading-relaxed">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setImportErrors([])} 
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-7 w-7 animate-spin text-blue-500 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">Загрузка товаров...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <PackageIcon className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-semibold">
              {debouncedSearch ? `По запросу «${debouncedSearch}» ничего не найдено` : 'Товары отсутствуют'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pr-2">Товар</th>
                  <th className="pb-3 px-2">Категория</th>
                  <th className="pb-3 px-2">Дистрибьютор</th>
                  <th className="pb-3 px-2">Цена</th>
                  <th className="pb-3 pl-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pr-2 font-semibold text-slate-900 max-w-[280px] truncate">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={product.image}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = 'https://placehold.co/50x50'; }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-bold text-slate-900">{product.name}</span>
                          {product.isHit && (
                            <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded w-fit mt-0.5">ХИТ 🔥</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 text-xs font-semibold">
                      {product.categoryRelation
                        ? getCategoryPath(product.categoryId)
                        : (categories.find((c) => c.slug === product.category)?.name || product.category)}
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 text-xs font-bold">{product.supplier?.name}</td>
                    <td className="py-3.5 px-2 font-extrabold text-slate-900">{formatPrice(product.price)}</td>
                    <td className="py-3.5 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Редактировать товар"
                        >
                          <EditIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithRefresh(product.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500 font-semibold">
            Страница <span className="font-black text-slate-800">{page}</span> из <span className="font-black text-slate-800">{totalPages}</span>
            &nbsp;·&nbsp;
            всего <span className="font-black text-slate-800">{total.toLocaleString('ru-RU')}</span> позиций
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Назад
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNum = start + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className={`w-8 h-8 text-xs font-bold rounded-xl transition-all ${
                    pageNum === page
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Вперёд
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
