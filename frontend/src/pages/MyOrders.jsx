import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, ClipboardList, Clock, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const STATUS_META = {
  pending: { text: 'В обработке', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
  processing: { text: 'Сборка заказа', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: ClipboardList },
  shipped: { text: 'В доставке', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Truck },
  completed: { text: 'Выполнен', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
  cancelled: { text: 'Отменен', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: AlertCircle },
};

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'completed'];

export const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU');
};

export const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

const getHistoryTime = (order, status) => {
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const entry = [...history].reverse().find((item) => item?.status === status);
  if (entry?.changedAt) return entry.changedAt;
  if (status === 'pending') return order.createdAt;
  return null;
};

export function StatusTimeline({ order }) {
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const steps = order.status === 'cancelled' ? ['pending', 'cancelled'] : STATUS_STEPS;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
      <h4 className="mb-4 text-[11px] font-black uppercase tracking-wider text-slate-400">Время смены статусов</h4>
      <div className="space-y-4">
        {steps.map((status, index) => {
          const meta = getStatusMeta(status);
          const Icon = meta.icon;
          const changedAt = getHistoryTime(order, status);
          const isDone = status === 'cancelled' || (currentIndex >= index && currentIndex !== -1);
          const isCurrent = order.status === status;

          return (
            <div key={status} className="flex gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                isDone ? meta.color : 'border-slate-200 bg-white text-slate-300'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-extrabold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                    {meta.text}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      текущий
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {changedAt ? formatDateTime(changedAt) : 'Время появится после смены статуса'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyOrders({
  customer,
  orders = [],
  loading,
  hasMore,
  total,
  onRefresh,
  onLoadMore,
  onOpenAuth,
  onNavigate,
}) {
  if (!customer) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h1 className="font-outfit text-2xl font-black text-slate-950">Мои заказы</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Войдите в аккаунт, чтобы посмотреть историю заказов и отслеживать время смены статусов.
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

  return (
    <section className="space-y-7">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Личный кабинет</p>
          <h1 className="mt-1 font-outfit text-3xl font-black text-slate-950">Мои заказы</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            История покупок и текущий статус доставки.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-400">
          Загружаем ваши заказы...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-lg font-black text-slate-900">Заказов пока нет</h2>
          <p className="mt-2 text-sm text-slate-500">Оформите заказ из каталога, и он появится на этой странице.</p>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-500"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_160px_150px_170px] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 md:grid">
            <span>Заказ</span>
            <span>Статус</span>
            <span>Сумма</span>
            <span className="text-right">Действие</span>
          </div>
          {orders.map((order) => {
            const statusMeta = getStatusMeta(order.status);
            const StatusIcon = statusMeta.icon;

            return (
              <article key={order.id} className="grid gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_160px_150px_170px] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-outfit text-lg font-black text-slate-950">Заказ №{order.id}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {order._count?.items ?? order.items?.length ?? 0} поз.
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Оформлен: {formatDateTime(order.createdAt)}</p>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500" title={order.clientAddress}>{order.clientAddress}</p>
                </div>

                <div>
                  <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${statusMeta.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    {statusMeta.text}
                  </span>
                </div>

                <div className="font-outfit text-lg font-black text-blue-600 md:text-base">
                  {formatPrice(order.totalAmount)}
                </div>

                <div className="flex justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigate('order-detail', order.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-600"
                  >
                    Подробнее
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
          {hasMore && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Показать еще
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
