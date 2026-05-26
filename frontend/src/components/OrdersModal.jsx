import React from 'react';
import { X, Clock, ClipboardList, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const getStatusDisplay = (status) => {
  switch (status) {
    case 'pending': return { text: 'В обработке', color: 'text-emerald-600 bg-emerald-50', icon: Clock };
    case 'processing': return { text: 'Сборка заказа', color: 'text-blue-500 bg-blue-50', icon: ClipboardList };
    case 'shipped': return { text: 'В доставке 🚚', color: 'text-purple-500 bg-purple-50', icon: Truck };
    case 'completed': return { text: 'Выполнен', color: 'text-green-500 bg-green-50', icon: CheckCircle2 };
    case 'cancelled': return { text: 'Отменен', color: 'text-red-500 bg-red-50', icon: AlertCircle };
    default: return { text: status, color: 'text-gray-500 bg-gray-50', icon: Clock };
  }
};

export default function OrdersModal({ isOpen, onClose, orders }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-gray-150 p-6 sm:p-8 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Мои заказы
          </h3>
          <p className="text-slate-500 text-xs mt-1">Отслеживайте статусы доставки ваших строительных материалов</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Clock className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">У вас пока нет оформленных заказов.</p>
            </div>
          ) : (
            orders.map(order => {
              const statusMap = getStatusDisplay(order.status);
              const StatusIcon = statusMap.icon;
              return (
                <div key={order.id} className="border border-gray-150 p-5 rounded-2xl space-y-3 hover:bg-slate-50/50 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="font-bold text-slate-900">Заказ №{order.id}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Оформлен: {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-3 py-1 rounded-full ${statusMap.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusMap.text}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-600">
                        <span>{item.product?.name} x {item.quantity} шт</span>
                        <span className="font-bold text-slate-800">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-dashed border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500">Адрес: {order.clientAddress}</span>
                      <span className="font-semibold text-slate-500">Товары: {formatPrice(order.subtotalAmount || order.totalAmount)}</span>
                    </div>
                    {(order.discountAmount || order.promoCode) && (
                      <div className="flex justify-between items-center gap-3 text-emerald-600">
                        <span>
                          Скидка {order.promoCode ? `(${order.promoCode})` : ''}
                        </span>
                        <span className="font-bold">- {formatPrice(order.discountAmount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500">Итог к оплате</span>
                      <span className="font-extrabold text-emerald-600 text-sm">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
