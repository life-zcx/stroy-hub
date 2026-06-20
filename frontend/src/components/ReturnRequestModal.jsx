import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Clock, AlertCircle } from 'lucide-react';
import { createReturnRequest } from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

export default function ReturnRequestModal({
  isOpen,
  onClose,
  order,
  rules = [],
  existingReturns = [],
  showToast,
  onSubmitSuccess
}) {
  const [selectedProducts, setSelectedProducts] = useState({}); // { [productId]: quantity }
  const [reason, setReason] = useState('Брак / Повреждение');
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Брак / Повреждение',
    'Не подошел по характеристикам',
    'Неверная комплектация / Ошибка в заказе',
    'Другое'
  ];

  // Helper to extract completed date
  const getCompletedDate = () => {
    if (!order) return new Date();
    let completedDate = new Date(order.createdAt);
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const completedEntry = order.statusHistory.find(h => h.status === 'completed');
      if (completedEntry && completedEntry.changedAt) {
        completedDate = new Date(completedEntry.changedAt);
      }
    }
    return completedDate;
  };

  // Helper to calculate product return info
  const getProductReturnInfo = (item) => {
    const completedDate = getCompletedDate();
    
    // Find best match rule
    const productRule = rules.find(r => r.scope === 'product' && r.targetId === item.productId);
    const categoryRule = item.product?.categoryId 
      ? rules.find(r => r.scope === 'category' && r.targetId === item.product.categoryId) 
      : null;
    const globalRule = rules.find(r => r.scope === 'global');

    let warrantyDays = 14; // Law default
    if (productRule) {
      warrantyDays = productRule.days;
    } else if (categoryRule) {
      warrantyDays = categoryRule.days;
    } else if (globalRule) {
      warrantyDays = globalRule.days;
    }

    const deadline = new Date(completedDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > deadline;

    // Check already returned qty
    const returnsForProduct = existingReturns.filter(
      r => r.orderId === order.id && r.productId === item.productId && ['pending', 'approved', 'rejected'].includes(r.status)
    );
    const alreadyReturnedQty = returnsForProduct.reduce((sum, r) => sum + r.quantity, 0);
    const availableQty = Math.max(0, item.quantity - alreadyReturnedQty);

    return {
      warrantyDays,
      deadline,
      isExpired,
      alreadyReturnedQty,
      availableQty
    };
  };

  const returnableItems = (order?.items || []).map(item => {
    const info = getProductReturnInfo(item);
    return {
      ...item,
      ...info
    };
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent background scrolling when modal is open and handle scrollbar shifts
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Find first item that is actually returnable
      const firstReturnable = returnableItems.find(item => !item.isExpired && item.availableQty > 0);
      const initialSelected = {};
      if (firstReturnable) {
        initialSelected[firstReturnable.productId] = 1;
      }
      setSelectedProducts(initialSelected);
      setReason('Брак / Повреждение');
      setComment('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setError('');
    }
  }, [isOpen, order, rules, existingReturns]);

  const handleToggleProduct = (productId, availableQty) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const handleQtyChange = (productId, val, maxVal) => {
    const qty = Math.min(maxVal, Math.max(1, parseInt(val) || 1));
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: qty
    }));
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productIdsToReturn = Object.keys(selectedProducts);
    if (productIdsToReturn.length === 0) {
      setError('Пожалуйста, выберите хотя бы один товар для возврата');
      return;
    }
    if (!photoFile) {
      setError('Пожалуйста, прикрепите фотографию товара');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requests = productIdsToReturn.map(productId => {
        const qty = selectedProducts[productId];
        const formData = new FormData();
        formData.append('orderId', order.id);
        formData.append('productId', productId);
        formData.append('quantity', qty);
        formData.append('reason', reason + (comment ? `: ${comment}` : ''));
        if (photoFile) {
          formData.append('photoFile', photoFile);
        }
        return createReturnRequest(formData);
      });

      await Promise.all(requests);
      showToast?.('✅ Заявки на возврат успешно отправлены!');
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || getFriendlyErrorMessage(err) || 'Ошибка при отправке запроса.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl p-8 relative animate-fade-in-up cursor-default max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Оформить возврат</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Выберите товары из заказа №{order.id} для оформления возврата
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Left Column: Product Selection & Info */}
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Выберите товары для возврата *
            </label>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {returnableItems.map((item) => {
                const isExpired = item.isExpired;
                const isNoQty = item.availableQty <= 0;
                const isDisabled = isExpired || isNoQty;
                const isChecked = !!selectedProducts[item.productId];

                return (
                  <div 
                    key={item.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isChecked 
                        ? 'border-emerald-500 bg-emerald-50/30' 
                        : isDisabled 
                          ? 'border-slate-100 opacity-60 bg-slate-50/50' 
                          : 'border-slate-200 hover:border-slate-350 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isDisabled}
                      checked={isChecked}
                      onChange={() => handleToggleProduct(item.productId, item.availableQty)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug" title={item.product?.name}>
                        {item.product?.name}
                      </p>
                      
                      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                        <span>Гарантия: {item.warrantyDays}дн</span>
                        <span className="opacity-40">•</span>
                        <span>До: {item.deadline.toLocaleDateString('ru-RU')}</span>
                        <span className="opacity-40">•</span>
                        <span className="text-slate-700">Доступно: {item.availableQty} шт</span>
                      </div>
                      
                      {isDisabled && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">
                          {isExpired ? '⏳ Истек срок гарантии' : '✓ Уже оформлен возврат'}
                        </p>
                      )}

                      {isChecked && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Кол-во:</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center border border-slate-250 rounded-lg bg-white overflow-hidden h-7">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.productId, selectedProducts[item.productId] - 1, item.availableQty)}
                                className="w-7 h-full flex items-center justify-center text-xs font-extrabold bg-slate-50 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors select-none cursor-pointer"
                              >
                                −
                              </button>
                              <input
                                type="text"
                                readOnly
                                value={selectedProducts[item.productId]}
                                className="w-8 text-center text-xs text-slate-900 outline-none font-bold pointer-events-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(item.productId, selectedProducts[item.productId] + 1, item.availableQty)}
                                className="w-7 h-full flex items-center justify-center text-xs font-extrabold bg-slate-50 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors select-none cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-450 font-bold">шт</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Reasons, File & Comment */}
          <div className="space-y-4">
            {/* Reason Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Причина возврата *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-900 transition-all outline-none font-semibold"
              >
                {reasons.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Фотография товара *
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 cursor-pointer transition-all">
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500 font-bold">Выбрать файл</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {photoPreview && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 relative shrink-0">
                    <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional details */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Комментарий / Описание дефекта
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Опишите подробно проблему с товаром..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-900 transition-all resize-none outline-none"
              />
            </div>
          </div>

          {/* Full Width Footer: Errors & Submit */}
          <div className="md:col-span-2 space-y-4 pt-2">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || Object.keys(selectedProducts).length === 0}
              className="w-full bg-[#525252] hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Clock className="h-5 w-5 animate-spin" />
              ) : (
                <span>Отправить заявку</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
