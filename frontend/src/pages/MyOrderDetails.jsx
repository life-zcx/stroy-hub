import React, { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, CreditCard, MapPin, RefreshCw, ShoppingBag, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { formatDateTime, getStatusMeta, StatusTimeline } from './MyOrders';
import ReviewModal from '../components/ReviewModal';

export default function MyOrderDetails({ customer, orderId, orders = [], loading, error, onRefresh, onLoadOrder, onOpenAuth, onNavigate, showToast }) {
  const order = orders.find((item) => String(item.id) === String(orderId));
  const hasFullDetails = Boolean(order && Array.isArray(order.items));

  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState([]);

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
      {/* Sleek Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed mb-6">
        <button 
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
        >
          Главная
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <button 
          onClick={() => onNavigate?.('orders')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
        >
          Мои заказы
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">Заказ №{order.id}</span>
      </nav>

      {/* Main Order Info Header */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Информация о покупке</span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-outfit text-3xl font-black text-slate-950">Заказ №{order.id}</h1>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${statusMeta.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusMeta.text}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-555 pt-1">Оформлен: {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-6">
          {/* Order Items with thumbnails */}
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-600" />
              Состав заказа
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-4 transition-colors">
                  <button
                    type="button"
                    onClick={() => item.product && onNavigate('product', item.productId)}
                    className="w-14 h-14 bg-white border border-slate-150 rounded-xl flex items-center justify-center p-2 flex-shrink-0 overflow-hidden shadow-inner cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    <img 
                      src={item.product?.image || 'https://placehold.co/100x100/f8fafc/475569?text=Tormag'} 
                      className="w-full h-full object-contain" 
                      alt={item.product?.name} 
                    />
                  </button>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => item.product && onNavigate('product', item.productId)}
                        className="text-sm font-black text-slate-900 leading-tight hover:text-blue-600 transition-colors cursor-pointer text-left block focus:outline-none"
                      >
                        {item.product?.name || 'Товар удален'}
                      </button>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{formatPrice(item.price)} x {item.quantity} шт</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <span className="font-outfit text-base font-black text-slate-950 shrink-0 text-left sm:text-right">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      {order.status === 'completed' && item.product && (
                        <div className="shrink-0 pl-2">
                          {item.isReviewed || reviewedProductIds.includes(item.productId) ? (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-55/30 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                              ✓ Отзыв оставлен
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedProductForReview(item.product)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              Оценить товар
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment details */}
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Оплата и доставка</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <MapPin className="h-4 w-4" />
                  Адрес доставки
                </div>
                <p className="font-semibold text-sm leading-relaxed text-slate-800">{order.clientAddress}</p>
              </div>
              <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <CreditCard className="h-4 w-4" />
                  Способ оплаты
                </div>
                <p className="font-semibold text-sm text-slate-800">
                  {order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {/* Order Summary Checkout Card */}
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Расчет стоимости</h2>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between gap-4 text-slate-500 font-semibold">
                <span>Товары</span>
                <span className="font-extrabold text-slate-800">{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
              </div>
              {(order.discountAmount || order.promoCode) && (
                <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                  <span>Скидка {order.promoCode ? `(${order.promoCode})` : ''}</span>
                  <span className="font-black">- {formatPrice(order.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3.5 text-base">
                <span className="font-black text-slate-950">К оплате</span>
                <span className="font-outfit font-black text-blue-600 text-lg">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <StatusTimeline order={order} />
        </aside>
      </div>

      {selectedProductForReview && (
        <ReviewModal
          isOpen={!!selectedProductForReview}
          onClose={() => setSelectedProductForReview(null)}
          productId={selectedProductForReview.id}
          productName={selectedProductForReview.name}
          showToast={showToast}
          onSubmitSuccess={(prodId) => {
            setReviewedProductIds((prev) => [...prev, prodId]);
          }}
        />
      )}
    </section>
  );
}
