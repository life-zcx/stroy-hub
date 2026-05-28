import React, { useEffect } from 'react';
import { ArrowLeft, ClipboardList, CreditCard, MapPin, RefreshCw, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { formatDateTime, getStatusMeta, StatusTimeline } from './MyOrders';

export default function MyOrderDetails({ customer, orderId, orders = [], loading, error, onRefresh, onLoadOrder, onOpenAuth, onNavigate }) {
  const order = orders.find((item) => String(item.id) === String(orderId));
  const hasFullDetails = Boolean(order && Array.isArray(order.items));

  useEffect(() => {
    if (customer && orderId && !hasFullDetails && !loading && !error) {
      onLoadOrder(orderId);
    }
  }, [customer, orderId, hasFullDetails, loading, error, onLoadOrder]);

  if (!customer) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h1 className="font-outfit text-2xl font-black text-slate-950">Детали заказа</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Войдите в аккаунт, чтобы открыть информацию по заказу.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-600"
        >
          Войти в аккаунт
        </button>
      </section>
    );
  }

  if (!hasFullDetails && !error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-400">
        Загружаем заказ...
      </div>
    );
  }

  if (!hasFullDetails) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h1 className="font-outfit text-2xl font-black text-slate-950">Заказ не найден</h1>
        <p className="mt-2 text-sm text-slate-500">{error || 'Возможно, заказ был удален или не принадлежит вашему аккаунту.'}</p>
        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-600"
        >
          Вернуться к списку
        </button>
      </section>
    );
  }

  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            К списку заказов
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-outfit text-3xl font-black text-slate-950">Заказ №{order.id}</h1>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${statusMeta.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusMeta.text}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-400">Оформлен: {formatDateTime(order.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh(orderId)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-600" />
              Состав заказа
            </h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.product?.name || 'Товар удален'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{formatPrice(item.price)} x {item.quantity} шт</p>
                  </div>
                  <span className="font-outfit text-sm font-black text-slate-950">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-900">Оплата и доставка</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <MapPin className="h-4 w-4" />
                  Адрес доставки
                </div>
                <p className="font-bold leading-6 text-slate-800">{order.clientAddress}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <CreditCard className="h-4 w-4" />
                  Способ оплаты
                </div>
                <p className="font-bold text-slate-800">
                  {order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-900">Итого</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-slate-500">
                <span>Товары</span>
                <span className="font-bold text-slate-800">{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
              </div>
              {(order.discountAmount || order.promoCode) && (
                <div className="flex justify-between gap-4 text-emerald-600">
                  <span>Скидка {order.promoCode ? `(${order.promoCode})` : ''}</span>
                  <span className="font-black">- {formatPrice(order.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base">
                <span className="font-black text-slate-950">К оплате</span>
                <span className="font-outfit font-black text-blue-600">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <StatusTimeline order={order} />
        </aside>
      </div>
    </section>
  );
}
