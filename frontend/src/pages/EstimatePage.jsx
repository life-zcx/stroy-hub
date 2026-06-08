import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, HelpCircle, 
  ShoppingCart, RefreshCw, ChevronDown, Check, ArrowRight, Info, AlertCircle 
} from 'lucide-react';
import { matchEstimate } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

export default function EstimatePage({ onAddToCart, onNavigate, showToast, customer, onRequireAuth }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // id-to-product mapping to keep track of checkboxes
  const [activeAlternativeDropdown, setActiveAlternativeDropdown] = useState(null); // row index
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'csv'].includes(ext)) {
        await processFile(droppedFile);
      } else {
        showToast({ title: 'Ошибка', message: 'Пожалуйста, загрузите файл Excel (.xlsx) или .csv', type: 'error' });
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    if (!customer) {
      showToast({ title: 'Требуется вход', message: 'Войдите в профиль, чтобы загрузить и обработать смету.', type: 'warning' });
      onRequireAuth?.();
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedItems({});

    try {
      const data = await matchEstimate(selectedFile);
      if (data.success) {
        setResults(data);
        // Pre-select exact matches and high quality alternative matches
        const initialSelections = {};
        data.items.forEach((item, index) => {
          if (item.status !== 'not_found' && item.matchedProduct) {
            initialSelections[index] = {
              product: item.matchedProduct,
              quantity: item.requestedQuantity,
              originalName: item.originalName
            };
          }
        });
        setSelectedItems(initialSelections);
        showToast({ title: 'Успешно', message: `Файл обработан. Найдено совпадений: ${data.summary.matched + data.summary.alternatives}`, type: 'success' });
      } else {
        setError(data.error || 'Не удалось распознать смету. Проверьте структуру файла.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Произошла ошибка при отправке файла на сервер. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (index, item) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[index]) {
        delete next[index];
      } else {
        next[index] = {
          product: item.matchedProduct,
          quantity: item.requestedQuantity,
          originalName: item.originalName
        };
      }
      return next;
    });
  };

  const handleSelectAlternative = (index, product, quantity, originalName) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: {
        product,
        quantity,
        originalName
      }
    }));
    
    // Update main product in results display so user sees the change
    setResults(prev => {
      const next = { ...prev };
      const item = { ...next.items[index] };
      
      // Swap matched product with selected alternative in UI
      const oldMatched = item.matchedProduct;
      item.matchedProduct = product;
      
      // Insert old matched product to alternatives if it is not already there
      if (oldMatched && !item.alternatives.some(a => a.id === oldMatched.id)) {
        item.alternatives = [oldMatched, ...item.alternatives.filter(a => a.id !== product.id)];
      } else {
        item.alternatives = item.alternatives.filter(a => a.id !== product.id);
      }
      
      item.status = 'exact'; // mark as user chosen exact
      next.items[index] = item;
      return next;
    });

    setActiveAlternativeDropdown(null);
  };

  const handleAddAllToCart = () => {
    const itemsToAdd = Object.values(selectedItems);
    if (itemsToAdd.length === 0) {
      showToast({ title: 'Предупреждение', message: 'Выберите хотя бы один товар для добавления в корзину', type: 'warning' });
      return;
    }

    let addedCount = 0;
    itemsToAdd.forEach(item => {
      onAddToCart(item.product, item.quantity);
      addedCount++;
    });

    showToast({ 
      title: 'Смета в корзине!', 
      message: `Успешно добавлено товаров: ${addedCount} наименований`, 
      type: 'success' 
    });
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setSelectedItems({});
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate totals
  const totalAmount = Object.values(selectedItems).reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="space-y-8">
      {/* Hero Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3 py-4">
        <h1 className="font-outfit text-4xl font-black text-slate-950 tracking-tight sm:text-5xl">
          Быстрый заказ по Excel-смете
        </h1>
        <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Загрузите смету, ведомость или спецификацию в формате Excel/CSV. Наш умный алгоритм мгновенно подберет нужные товары из каталога TORMAG, и вы сможете оформить весь заказ в один клик.
        </p>
      </div>

      {!results && !loading && (
        <div className="max-w-3xl mx-auto">
          {/* Uploader Box */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`group relative overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/40 shadow-inner' 
                : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-slate-100'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".xlsx,.csv"
              onChange={handleFileChange}
            />

            <div className="space-y-4 max-w-sm mx-auto">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                <UploadCloud className="h-10 w-10 transition-transform group-hover:-translate-y-1" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">Перетащите файл сюда или выберите на компьютере</p>
                <p className="mt-1.5 text-xs text-slate-400 font-semibold">Поддерживаются форматы Excel (.xlsx) и CSV до 10 МБ</p>
              </div>
            </div>

            {/* Micro-grid overlay decorative */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
          </div>

          {/* Guidelines info */}
          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 flex gap-4 text-slate-500 text-xs sm:text-sm">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="space-y-1.5 font-medium text-slate-600">
              <p className="font-bold text-slate-900">Полезные советы по структуре файла:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 font-semibold">
                <li>Файл может быть любого вида. Отлично подходит стандартная смета с колонками «Наименование» и «Количество».</li>
                <li>Система автоматически найдет нужные колонки с наименованиями и количеством, даже если в начале сметы есть шапка.</li>
                <li>Итоговые строки сметы (например «Итого к оплате» или «Всего по разделу») будут пропущены автоматически.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton state */}
      {loading && (
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-800">Анализируем вашу смету...</h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">Обычно это занимает 3-5 секунд. Сопоставляем товары с каталогом.</p>
            </div>
          </div>
          
          {/* Skeletons */}
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-between px-6">
                <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-rose-100 bg-rose-50/40 p-8 text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <div>
            <h3 className="text-lg font-black text-slate-900">Не удалось распознать смету</h3>
            <p className="mt-1 text-sm font-semibold text-rose-700 leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={handleReset}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all shadow-md transform hover:-translate-y-0.5"
          >
            Попробовать другой файл
          </button>
        </div>
      )}

      {/* Matching Results Interface */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Results Table */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header info */}
            <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Результаты сопоставления</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Файл: {file?.name}</p>
              </div>
              
              <button 
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Загрузить другой файл
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {results.items.map((item, idx) => {
                const isSelected = !!selectedItems[idx];
                const currentProduct = selectedItems[idx]?.product || item.matchedProduct;

                return (
                  <div 
                    key={idx} 
                    className={`p-5 transition-colors ${
                      item.status === 'not_found' 
                        ? 'bg-slate-50/20' 
                        : isSelected ? 'bg-blue-50/10' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Checkbox selector */}
                      {item.status !== 'not_found' && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange(idx, item)}
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-600 text-white' 
                                : 'border-slate-300 hover:border-blue-500 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>
                        </div>
                      )}

                      {/* Original Product in Excel */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400 tracking-wider">СТРОКА {idx + 1}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'exact' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : item.status === 'alternative' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status === 'exact' && <CheckCircle2 className="h-3 w-3" />}
                            {item.status === 'alternative' && <AlertTriangle className="h-3 w-3" />}
                            {item.status === 'exact' ? 'Точное совпадение' : item.status === 'alternative' ? 'Подобран аналог' : 'Не найдено'}
                          </span>
                        </div>
                        
                        <p className="text-sm font-bold text-slate-900 leading-snug">{item.originalName}</p>
                        <p className="text-xs font-bold text-slate-400">Требуется: <span className="text-slate-800">{item.requestedQuantity} шт</span></p>
                      </div>

                      {/* Matched Store Product */}
                      <div className="sm:w-[320px] shrink-0 space-y-3">
                        {item.status !== 'not_found' && currentProduct ? (
                          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:border-blue-200 transition-colors">
                            <div className="flex gap-2.5">
                              {/* Photo */}
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                                <img 
                                  src={currentProduct.image} 
                                  alt={currentProduct.name} 
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=120';
                                  }}
                                />
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900">{currentProduct.name}</p>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-950">{formatPrice(currentProduct.price)} <span className="text-[10px] text-slate-400 font-semibold">/ шт</span></span>
                                  <span className="text-xs font-black text-blue-600">{formatPrice(currentProduct.price * item.requestedQuantity)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Alternatives Dropdown Trigger */}
                            {item.alternatives && item.alternatives.length > 0 && (
                              <div className="relative mt-2 border-t border-slate-50 pt-2">
                                <button 
                                  onClick={() => setActiveAlternativeDropdown(activeAlternativeDropdown === idx ? null : idx)}
                                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  Посмотреть аналоги ({item.alternatives.length})
                                  <ChevronDown className={`h-3 w-3 transition-transform ${activeAlternativeDropdown === idx ? 'rotate-180' : ''}`} />
                                </button>

                                {activeAlternativeDropdown === idx && (
                                  <div className="absolute left-0 right-0 z-10 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                    {item.alternatives.map((alt) => (
                                      <button 
                                        key={alt.id}
                                        onClick={() => handleSelectAlternative(idx, alt, item.requestedQuantity, item.originalName)}
                                        className="w-full text-left p-2.5 hover:bg-slate-50 text-[11px] block transition-colors"
                                      >
                                        <p className="font-bold text-slate-900 truncate">{alt.name}</p>
                                        <p className="text-[10px] font-black text-blue-600 mt-0.5">{formatPrice(alt.price)}</p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                            <HelpCircle className="mx-auto h-5 w-5 text-slate-300" />
                            <p className="mt-1 text-[11px] font-bold text-slate-400">Аналогов не найдено</p>
                            <button
                              onClick={() => {
                                onNavigate('catalog');
                                showToast({ title: 'Поиск', message: 'Введите ключевые слова в строке поиска для подбора вручную', type: 'info' });
                              }}
                              className="mt-2 text-[10px] font-black uppercase tracking-wider text-blue-600 hover:underline"
                            >
                              Искать в каталоге
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Summary Panel */}
          <aside className="sticky top-24 space-y-6">
            {/* Quick Metrics */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Аналитика сметы</h3>
              
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <div className="text-base font-black text-slate-950">{results.summary.totalRows}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Всего строк</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 text-emerald-700 p-2.5">
                  <div className="text-base font-black">{results.summary.matched}</div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase mt-0.5">Точных</div>
                </div>
                <div className="rounded-2xl bg-amber-50 text-amber-700 p-2.5">
                  <div className="text-base font-black">{results.summary.alternatives}</div>
                  <div className="text-[9px] font-bold text-amber-500 uppercase mt-0.5">Аналогов</div>
                </div>
              </div>
            </div>

            {/* Price Estimator & checkout */}
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl space-y-5 relative overflow-hidden">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Сумма заказа</h3>
                <p className="text-xs font-semibold text-slate-300">Сформировано позиций: {selectedCount} из {results.summary.totalRows}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-300">Итого:</span>
                  <span className="font-outfit text-3xl font-black text-white">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button 
                onClick={handleAddAllToCart}
                disabled={selectedCount === 0}
                className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-800 disabled:text-slate-550 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 group shadow-md transform hover:-translate-y-0.5"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                Перенести всё в корзину
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-[10px] text-center text-slate-400 font-semibold leading-relaxed">
                Добавьте товары в корзину для оформления заказа. Логистика и условия доставки будут рассчитаны в корзине.
              </p>

              {/* Grid light detail */}
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10"></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
