import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X, AlertTriangle, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { cancelOrderApi } from '../services/api';

const REASON_OPTIONS = [
  'Изменились планы / сроки доставки',
  'Нашел аналогичный товар дешевле',
  'Ошибка в заказе / выбрал не тот товар',
  'Слишком долгое время сборки',
  'Другая причина',
];

export default function OrderCancelModal({ isOpen, onClose, order, onSuccess, showToast }) {
  const [cancelType, setCancelType] = useState('full'); // 'full' | 'partial'
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const canPartialCancel = orderItems.length > 1 || orderItems.some((i) => i.quantity > 1);

  const [cancelQuantities, setCancelQuantities] = useState({});

  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      // reset state
      setCancelType('full');
      setSelectedReason(REASON_OPTIONS[0]);
      setCustomReason('');
      const initialMap = {};
      orderItems.forEach((item) => {
        initialMap[item.id] = 0;
      });
      setCancelQuantities(initialMap);

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isOpen, order]);

  if (!isOpen || !order || typeof document === 'undefined') return null;

  const handleQuantityChange = (itemId, maxQty, delta) => {
    setCancelQuantities((prev) => {
      const current = prev[itemId] || 0;
      const nextVal = Math.min(maxQty, Math.max(0, current + delta));
      return { ...prev, [itemId]: nextVal };
    });
  };

  const getReasonText = () => {
    if (selectedReason === 'Другая причина') {
      return customReason.trim() || 'Отмена по инициативе покупателя';
    }
    return selectedReason;
  };

  const partialItemsToCancel = orderItems.filter((item) => (cancelQuantities[item.id] || 0) > 0);
  const totalItemsToCancelCount = partialItemsToCancel.reduce((sum, item) => sum + (cancelQuantities[item.id] || 0), 0);
  const estimatedRefundAmount = partialItemsToCancel.reduce((sum, item) => sum + item.price * cancelQuantities[item.id], 0);
  const isAllItemsSelected =
    cancelType === 'full' ||
    (partialItemsToCancel.length > 0 && orderItems.every((item) => (cancelQuantities[item.id] || 0) >= item.quantity));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedReason) {
      showToast?.('Пожалуйста, выберите причину отмены');
      return;
    }

    setLoading(true);

    try {
      const reason = getReasonText();
      let payload = { cancellationReason: reason };

      if (cancelType === 'partial' && !isAllItemsSelected) {
        if (partialItemsToCancel.length === 0) {
          showToast?.('Пожалуйста, выберите хотя бы один товар для отмены.');
          setLoading(false);
          return;
        }

        payload.itemsToCancel = partialItemsToCancel.map((item) => ({
          itemId: item.id,
          productId: item.productId,
          quantityToRemove: cancelQuantities[item.id],
        }));
      }

      const updatedOrder = await cancelOrderApi(order.id, payload);

      if (updatedOrder.status === 'cancelled') {
        showToast?.(`Заказ №${order.id} успешно отменен`);
      } else {
        showToast?.(`Выполнен отказ от товаров по заказу №${order.id}`);
      }

      onSuccess?.(updatedOrder);
      onClose();
    } catch (err) {
      console.error('Cancel order error:', err);
      const msg = err.response?.data?.error || 'Не удалось выполнить отмену заказа';
      showToast?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white sm:rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer border-0 shrink-0"
              title="Назад"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
              Отмена заказа №{order.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Content Area ── */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-5 text-left">
          {/* Warning Banner */}
          <div className="bg-[#fff0f2] border border-rose-200/70 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 text-rose-600 shadow-xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-bold leading-tight">
              Выберите причину отмены заказа
            </span>
          </div>

          {/* Partial vs Full Mode Switcher */}
          {canPartialCancel && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setCancelType('full')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${cancelType === 'full'
                    ? 'bg-white text-rose-600 shadow-xs border border-rose-100'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Весь заказ
              </button>

              <button
                type="button"
                onClick={() => setCancelType('partial')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${cancelType === 'partial'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Отдельные товары
              </button>
            </div>
          )}

          {/* Item Selection for Partial Cancellation */}
          {cancelType === 'partial' && canPartialCancel && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                Выберите товары для отмены
              </h4>

              <div className="space-y-2">
                {orderItems.map((item) => {
                  const removeQty = cancelQuantities[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl sm:rounded-2xl border transition-all ${removeQty > 0
                          ? 'border-rose-300 bg-rose-50/60 text-slate-900'
                          : 'border-slate-200/80 bg-slate-50/70 text-slate-700'
                        }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.product?.name || 'Товар'}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          {formatPrice(item.price)} × {item.quantity} шт
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          disabled={removeQty <= 0}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {removeQty} / {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          disabled={removeQty >= item.quantity}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalItemsToCancelCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Выбрано к отмене: {totalItemsToCancelCount} шт</span>
                  <span className="font-outfit font-black text-sm text-amber-900">-{formatPrice(estimatedRefundAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Survey Reasons */}
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
              Причина отмены
            </h4>

            <div className="space-y-2">
              {REASON_OPTIONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${isSelected
                        ? 'bg-rose-50/60 border-rose-300 text-slate-900 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 text-slate-700'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-300 bg-white'
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold leading-none">
                      {reason}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedReason === 'Другая причина' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Укажите подробнее причину..."
                rows={3}
                className="w-full mt-2 p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
              />
            )}
          </div>

          {/* Notice */}
          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
            {isAllItemsSelected
              ? 'Заказ будет отменен. Использованные бонусные баллы вернутся на ваш баланс.'
              : 'По выбранным товарам будет оформлен отказ. Сумма заказа будет автоматически пересчитана.'}
          </p>
        </div>

        {/* ── Action Bar (Fixed at bottom on mobile, bottom of card on desktop) ── */}
        <div
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
          className="w-full px-4 sm:px-6 pt-3 pb-3 bg-white border-t border-slate-100 shrink-0 flex items-center gap-3 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] sm:shadow-none"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="hidden sm:block flex-1 py-3.5 px-4 rounded-2xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Вернуться
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedReason}
            className="flex-1 bg-[#ff2d55] hover:bg-[#e02447] disabled:opacity-40 text-white font-bold py-3.5 sm:py-4 px-5 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer border-0 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Отмена заказа...</span>
              </>
            ) : (
              <span>{isAllItemsSelected ? 'Отменить заказ' : 'Отказаться от товаров'}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
