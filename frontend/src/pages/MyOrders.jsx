import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, ClipboardList, Clock, RefreshCw, ShoppingBag, Truck, User, Mail, Phone, MapPin, Gift } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

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
                    <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
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

import { getOrderById } from '../services/api';

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
  onAddToCart,
  showToast,
  bonuses,
}) {
  const handleRepeatOrder = async (order) => {
    let orderWithItems = order;
    if (!order.items || order.items.length === 0) {
      try {
        orderWithItems = await getOrderById(order.id);
      } catch (e) {
        console.error(e);
        showToast('⚠️ Не удалось загрузить состав заказа.');
        return;
      }
    }

    if (!orderWithItems.items || orderWithItems.items.length === 0) {
      showToast('⚠️ В заказе нет позиций для копирования.');
      return;
    }

    orderWithItems.items.forEach(item => {
      if (item.product) {
        for (let i = 0; i < item.quantity; i++) {
          onAddToCart(item.product);
        }
      }
    });

    showToast(`🛒 Заказ №${order.id} успешно добавлен в корзину!`);
    onNavigate('cart');
  };

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

  const [showBonusHistory, setShowBonusHistory] = useState(false);

  // Загружаем summary и историю при открытии страницы
  useEffect(() => {
    if (customer && bonuses) {
      bonuses.fetchSummary();
    }
  }, [customer]);

  const handleToggleBonusHistory = () => {
    if (!showBonusHistory && bonuses?.history?.length === 0) {
      bonuses.fetchHistory();
    }
    setShowBonusHistory((v) => !v);
  };

  // Используем реальные данные из bonuses-хука
  const availableBalance = bonuses?.availableBalance ?? 0;
  const pendingBalance = bonuses?.pendingBalance ?? 0;

  return (
    <section className="space-y-8">
      {/* Premium Dashboard Header & Profile Row (Unified & Clean, No Gold) */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Profile Info */}
          <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Личный кабинет</span>
              <h2 className="text-3xl font-black font-outfit text-slate-950 mt-1">
                Юрий
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Электронная почта</span>
                  <span className="block text-slate-900 truncate">{customer.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Телефон связи</span>
                  <span className="block text-slate-900">{customer.phone || 'Не указан'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Основной адрес доставки</span>
                  <span className="block text-slate-900 truncate" title={customer.address}>
                    {customer.address || 'Адрес доставки не указан'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Cashback Info */}
          <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Накопленный кешбэк</span>
                <h4 className="text-3xl font-black font-outfit text-slate-950 mt-1">
                  {formatPrice(availableBalance)}
                </h4>
                {pendingBalance > 0 && (
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    ⏳ +{formatPrice(pendingBalance)} ждут выполнения
                  </p>
                )}
              </div>
              <div className="p-3 bg-emerald-100/50 border border-emerald-200 text-emerald-600 rounded-xl">
                <Gift className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-emerald-100">
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                Кешбэк 3% начисляется с каждого выполненного заказа и доступен для списания при следующих покупках.
              </p>
              
              <Link
                href={getPageHref('cashback')}
                onClick={() => onNavigate?.('cashback')}
                className="flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider mt-1.5 inline-flex"
              >
                История транзакций
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          
        </div>
      </div>


      {/* Orders Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
            История ваших заказов ({total || orders.length})
          </h3>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-655 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/85 py-2 px-4 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Обновить список
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-400">
            Загружаем ваши заказы...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-350 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-lg font-black text-slate-900">Заказов пока нет</h2>
            <p className="mt-2 text-sm text-slate-500">Оформите заказ из каталога, и он появится на этой странице.</p>
            <Link
              href={getPageHref('catalog')}
              onClick={() => onNavigate('catalog')}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-500 inline-flex items-center justify-center"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
            <div className="hidden grid-cols-[1fr_160px_130px_260px] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-400 md:grid">
              <span>Заказ</span>
              <span>Статус</span>
              <span>Сумма</span>
              <span className="text-right">Действие</span>
            </div>
            {orders.map((order) => {
              const statusMeta = getStatusMeta(order.status);
              const StatusIcon = statusMeta.icon;

              return (
                <Link 
                  key={order.id} 
                  href={getPageHref('order-detail', order.id)}
                  onClick={() => onNavigate('order-detail', order.id)}
                  className="grid gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0 md:grid-cols-[1fr_160px_130px_260px] md:items-center cursor-pointer hover:bg-slate-50/40 transition-colors block text-slate-800"
                >
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

                  <div className="flex justify-start md:justify-end gap-2 flex-wrap">
                    {order.status === 'completed' && (!order.returnRequests || order.returnRequests.length === 0) && (
                      <Link
                        href={getPageHref('order-detail', order.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('order-detail', order.id);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-rose-700 transition-colors cursor-pointer"
                      >
                        Возврат
                      </Link>
                    )}
                    <Link
                      href={getPageHref('order-detail', order.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('order-detail', order.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-600 cursor-pointer"
                    >
                      Подробнее
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Link>
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
      </div>
    </section>
  );
}
