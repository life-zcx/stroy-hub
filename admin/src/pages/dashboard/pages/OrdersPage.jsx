import React from 'react';

export default function OrdersPage({
  orders,
  onStatusChange,
  formatPrice,
  getStatusText,
  getStatusClass,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900 mb-6 font-outfit">Заказы клиентов</h2>
      {orders.length === 0 ? (
        <p className="text-center py-20 text-slate-500">Заказы пока отсутствуют.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 font-outfit">Заказ №{order.id}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-1">
                    Оформлен: {new Date(order.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold uppercase">Сменить статус:</span>
                  <select
                    value={order.status}
                    onChange={(event) => onStatusChange(order.id, event.target.value)}
                    className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-amber-500/50 cursor-pointer"
                  >
                    <option value="pending">В обработке</option>
                    <option value="processing">Сборка</option>
                    <option value="shipped">В доставке</option>
                    <option value="completed">Выполнен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 text-sm md:border-r md:border-gray-100 md:pr-6">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase">Данные получателя</h4>
                  <p className="font-semibold text-slate-900">{order.clientName}</p>
                  <p className="text-slate-600">{order.clientPhone}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{order.clientAddress}</p>
                  <div className="pt-2">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600">
                      Оплата: {order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase">Позиции в заказе</h4>
                  <ul className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-2 flex items-center justify-between text-sm gap-2">
                        <span className="font-medium text-slate-900 truncate max-w-[280px]">
                          {item.product?.name} <span className="text-xs text-slate-400">({item.product?.supplier?.name})</span>
                        </span>
                        <span className="text-slate-500 text-xs">
                          {item.quantity} шт x {formatPrice(item.price)}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span>Сумма товаров:</span>
                      <span>{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
                    </div>
                    {(order.discountAmount || order.promoCode) && (
                      <div className="flex justify-between items-center text-sm text-emerald-600 font-semibold">
                        <span>Скидка {order.promoCode ? `(${order.promoCode})` : ''}:</span>
                        <span>- {formatPrice(order.discountAmount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-slate-900">Общая сумма к оплате:</span>
                      <span className="text-lg font-extrabold text-amber-500">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
