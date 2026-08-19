import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, ClipboardList, CreditCard, MapPin, RefreshCw, ShoppingBag, 
  ChevronRight, ChevronDown, ChevronUp, Repeat, Clock, Truck, CheckCircle2, AlertCircle, Gift, Coins 
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { formatDateTime, getStatusMeta } from './MyOrders';
import ReviewModal from '../components/ReviewModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import OrderCancelModal from '../components/OrderCancelModal';
import { getMyReturnRequests, getWarrantyRules } from '../services/api';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

export default function MyOrderDetails({ customer, orderId, orders = [], loading, error, onRefresh, onLoadOrder, onOpenAuth, onNavigate, onAddToCart, showToast, bonuses }) {
  const order = orders.find((item) => String(item.id) === String(orderId));
  const hasFullDetails = Boolean(order && Array.isArray(order.items));

  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [reviewedProductIds, setReviewedProductIds] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [warrantyRules, setWarrantyRules] = useState([]);
  const [isExpandedItems, setIsExpandedItems] = useState(false);
  const fetchedOrderRef = useRef(null);

  const fetchReturns = async () => {
    try {
      const data = await getMyReturnRequests();
      setReturnRequests(data);
    } catch (err) {
      console.error('Failed to load returns:', err);
    }
  };

  const fetchWarrantyRules = async () => {
    try {
      const data = await getWarrantyRules();
      setWarrantyRules(data);
    } catch (err) {
      console.error('Failed to load warranty rules:', err);
    }
  };

  useEffect(() => {
    if (customer?.id && orderId) {
      if (fetchedOrderRef.current !== orderId) {
        fetchedOrderRef.current = orderId;
        if (!hasFullDetails && !loading && !error) {
          onLoadOrder(orderId);
        }
        bonuses?.fetchSummary?.();
        fetchReturns();
        fetchWarrantyRules();
      }
    }
  }, [customer?.id, orderId, hasFullDetails, loading, error, onLoadOrder, bonuses]);

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
          className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-slate-800"
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
          className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-slate-800"
        >
          Вернуться к списку
        </button>
      </section>
    );
  }

  const getCompletedDate = () => {
    let completedDate = new Date(order.createdAt);
    if (order.statusHistory && Array.isArray(order.statusHistory)) {
      const completedEntry = order.statusHistory.find(h => h.status === 'completed');
      if (completedEntry && completedEntry.changedAt) {
        completedDate = new Date(completedEntry.changedAt);
      }
    }
    return completedDate;
  };

  const getProductReturnInfo = (item) => {
    const completedDate = getCompletedDate();
    const productRule = warrantyRules.find(r => r.scope === 'product' && r.targetId === item.productId);
    const categoryRule = item.product?.categoryId 
      ? warrantyRules.find(r => r.scope === 'category' && r.targetId === item.product.categoryId) 
      : null;
    const globalRule = warrantyRules.find(r => r.scope === 'global');

    let warrantyDays = 14;
    if (productRule) warrantyDays = productRule.days;
    else if (categoryRule) warrantyDays = categoryRule.days;
    else if (globalRule) warrantyDays = globalRule.days;

    const deadline = new Date(completedDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > deadline;

    const returnsForProduct = returnRequests.filter(
      r => r.orderId === order.id && r.productId === item.productId && ['pending', 'approved', 'rejected'].includes(r.status)
    );
    const alreadyReturnedQty = returnsForProduct.reduce((sum, r) => sum + r.quantity, 0);
    const availableQty = Math.max(0, item.quantity - alreadyReturnedQty);

    return { isExpired, availableQty };
  };

  const isAnyItemReturnable = order?.status === 'completed' && (order?.items || []).some(item => {
    const info = getProductReturnInfo(item);
    return !info.isExpired && info.availableQty > 0;
  });

  const handleRepeatOrder = async (ord) => {
    if (!ord.items || ord.items.length === 0) {
      showToast('В заказе нет позиций для копирования.');
      return;
    }

    ord.items.forEach(item => {
      if (item.product) {
        onAddToCart?.(item.product, item.quantity);
      }
    });

    showToast(`Заказ №${ord.id} успешно добавлен в корзину!`);
    onNavigate('cart');
  };

  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;

  return (
    <section className="space-y-6">
      {/* Sleek Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed mb-6">
        <Link 
          href={getPageHref('home')}
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
        >
          Главная
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <Link 
          href={getPageHref('orders')}
          onClick={() => onNavigate?.('orders')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
        >
          Мои заказы
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">Заказ №{order.id}</span>
      </nav>

      {/* Main Order Info Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Информация о покупке</span>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-950">Заказ №{order.id}</h1>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusMeta.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusMeta.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-5">
          {/* Order Items with thumbnails */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                Состав заказа ({order.items.length} {order.items.length === 1 ? 'позиция' : order.items.length < 5 ? 'позиции' : 'позиций'})
              </h2>
              {order.items.length > 4 && (
                <span className="text-[11px] font-bold text-slate-400">
                  {isExpandedItems ? `Показано: ${order.items.length}` : `Показано: 4 из ${order.items.length}`}
                </span>
              )}
            </div>

            <div className={`space-y-3 ${isExpandedItems && order.items.length > 5 ? 'max-h-[500px] overflow-y-auto pr-1' : ''}`}>
              {(isExpandedItems ? order.items : order.items.slice(0, 4)).map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3.5 transition-colors">
                  <Link
                    href={item.product ? getPageHref('product', item.product?.slug || item.productId || item.product?.id) : '#'}
                    onClick={(e) => {
                      if (!item.product) e.preventDefault();
                      else onNavigate('product', item.product?.slug || item.productId || item.product?.id);
                    }}
                    className="w-12 h-12 bg-white border border-slate-150 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden shadow-inner cursor-pointer hover:border-slate-300 transition-colors block"
                  >
                    <img 
                      src={item.product?.image || 'https://placehold.co/100x100/f8fafc/475569?text=Tormag'} 
                      className="w-full h-full object-contain" 
                      alt={item.product?.name} 
                    />
                  </Link>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="text-left">
                      <Link
                        href={item.product ? getPageHref('product', item.product?.slug || item.productId || item.product?.id) : '#'}
                        onClick={(e) => {
                          if (!item.product) e.preventDefault();
                          else onNavigate('product', item.product?.slug || item.productId || item.product?.id);
                        }}
                        className="text-sm font-black text-slate-900 leading-tight hover:text-blue-600 transition-colors cursor-pointer text-left block focus:outline-none"
                      >
                        {item.product?.name || 'Товар удален'}
                      </Link>
                      {item.selectedOption && (
                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {item.selectedOption}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs font-semibold text-slate-400">{formatPrice(item.price)} x {item.quantity} шт</p>
                        {item.cancelledQuantity > 0 && (
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block" title={item.cancellationReason ? `Причина: ${item.cancellationReason}` : 'Отказ покупателем'}>
                            Отменено: {item.cancelledQuantity} шт {item.cancellationReason ? `(${item.cancellationReason})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="font-outfit text-base font-black text-slate-950 shrink-0 block">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {(() => {
                          const orderSubtotal = order.subtotalAmount || order.totalAmount || 1;
                          const discountRatio = orderSubtotal > 0 ? (order.totalAmount / orderSubtotal) : 1;
                          const itemPaidTotal = item.price * item.quantity * discountRatio;
                          const itemRate = item.price >= 1000000 ? 0.05 : 0.03;
                          const itemEarnedBonus = Math.round(itemPaidTotal * itemRate);

                          return (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-md inline-block mt-0.5" title="Начисляемый кешбэк за данный товар (с учетом скидки)">
                              +{formatPrice(itemEarnedBonus)} бонусов
                            </span>
                          );
                        })()}
                      </div>
                      {order.status === 'completed' && item.product && (
                        <div className="shrink-0 pl-2 flex flex-col sm:flex-row gap-2 items-center">
                          {item.isReviewed || reviewedProductIds.includes(item.productId) ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 shrink-0">
                              ✓ Отзыв оставлен
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedProductForReview(item.product)}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                            >
                              Оценить товар
                            </button>
                          )}

                          {(() => {
                            const ret = returnRequests.find(r => r.orderId === order.id && r.productId === item.productId);
                            if (ret) {
                              const statusTexts = {
                                pending: 'Ожидает решения',
                                approved: 'Возврат одобрен',
                                rejected: 'Возврат отклонен'
                              };
                              const statusClasses = {
                                pending: 'text-amber-700 bg-amber-50 border-amber-200',
                                approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                                rejected: 'text-rose-700 bg-rose-50 border-rose-200'
                              };
                              return (
                                <div className={`text-[10px] font-bold border px-2.5 py-1 rounded-lg flex flex-col items-start gap-0.5 shrink-0 ${statusClasses[ret.status] || ''}`}>
                                  <span>{statusTexts[ret.status] || ret.status} ({ret.quantity} шт)</span>
                                  {ret.adminComment && <span className="text-[9px] opacity-80 max-w-[150px] truncate">Комм: {ret.adminComment}</span>}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {order.items.length > 4 && (
              <button
                type="button"
                onClick={() => setIsExpandedItems(!isExpandedItems)}
                className="w-full mt-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isExpandedItems ? 'Свернуть список позиций' : `Показать еще ${order.items.length - 4} товаров (всего ${order.items.length} поз.)`}</span>
                {isExpandedItems ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
            )}
          </div>

          {/* Shipping & Payment details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2.5">Оплата и доставка</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  Адрес доставки
                </div>
                <p className="font-semibold text-sm leading-snug text-slate-800">{order.clientAddress}</p>
                {order.deliveryDate && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-650">
                    <span className="font-bold block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Желаемое время доставки</span>
                    <div className="font-bold text-slate-800">{order.deliveryDate}</div>
                    {order.deliveryTime && <div className="text-slate-600 mt-0.5">Интервал: {order.deliveryTime}</div>}
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
                <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  Способ оплаты
                </div>
                <p className="font-semibold text-sm text-slate-800">
                  {order.paymentMethod === 'cash' ? 'Наличными при получении' : order.paymentMethod === 'kaspi' ? 'Kaspi QR / Kaspi Red' : 'Безналичный расчет (B2B)'}
                </p>
                {order.paymentMethod === 'invoice' && order.companyName && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-650">
                    <span className="font-bold block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Реквизиты организации</span>
                    <div className="font-bold text-slate-800">{order.companyName}</div>
                    <div className="font-mono mt-0.5 text-slate-600">БИН/ИИН: {order.companyBin}</div>
                  </div>
                )}
              </div>
            </div>
            {order.clientComment && (
              <div className="mt-3 rounded-xl bg-slate-50/80 border border-slate-100 p-3">
                <div className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Комментарий к заказу
                </div>
                <p className="text-xs text-slate-700 font-semibold italic">«{order.clientComment}»</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          {/* Order Summary Checkout Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2.5">Расчет стоимости</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-slate-500 font-semibold">
                <span>Товары ({order.items?.length || 0})</span>
                <span className="font-extrabold text-slate-800">{formatPrice(order.subtotalAmount || order.totalAmount)}</span>
              </div>
              
              {order.promoCode && (
                <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                  <span>Промокод ({order.promoCode})</span>
                  <span className="font-black">- {formatPrice((order.discountAmount || 0) - (order.usedBonusPoints || 0))}</span>
                </div>
              )}

              {Boolean(order.usedBonusPoints && order.usedBonusPoints > 0) && (
                <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                  <span>Списано бонусами</span>
                  <span className="font-black">- {formatPrice(order.usedBonusPoints)}</span>
                </div>
              )}

              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base">
                <span className="font-black text-slate-950">К оплате</span>
                <span className="font-outfit font-black text-slate-950 text-lg">{formatPrice(order.totalAmount)}</span>
              </div>

              {/* Minimal Clean Cashback Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Gift className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  Кешбэк за заказ (3%)
                </span>
                <span className="font-outfit font-black text-emerald-600">
                  +{formatPrice(Math.round((order.totalAmount || 0) * 0.03))}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleRepeatOrder(order)}
                className="w-full mt-4 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer text-center font-outfit flex items-center justify-center gap-2"
              >
                <Repeat className="h-4 w-4" />
                Повторить заказ
              </button>

              {['pending', 'processing'].includes(order.status) && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full mt-2 px-4 py-3 bg-[#fff0f2] hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center font-outfit flex items-center justify-center gap-2 shadow-xs"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 stroke-[2.5]" />
                  Отменить заказ
                </button>
              )}

              {order.status === 'shipped' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center">
                  <div className="text-[11px] font-extrabold text-amber-800 flex items-center justify-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-amber-600" />
                    Заказ передан в доставку
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold text-amber-700">
                    Отмена недоступна, так как товар в пути. После получения можно оформить возврат.
                  </p>
                </div>
              )}

              {isAnyItemReturnable && (
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="w-full mt-2 px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center font-outfit flex items-center justify-center gap-2"
                >
                  Оформить возврат
                </button>
              )}
            </div>
          </div>

          {/* Custom Beautiful Status Timeline */}
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-blue-600" />
              Отслеживание заказа
            </h3>
            
            <div className="relative space-y-6 text-left">
              {/* Vertical timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

              {(() => {
                const STATUS_STEPS = ['pending', 'processing', 'shipped', 'completed'];
                const currentIndex = STATUS_STEPS.indexOf(order.status);
                const steps = order.status === 'cancelled' ? ['pending', 'cancelled'] : STATUS_STEPS;

                const getHistoryTime = (status) => {
                  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
                  const entry = [...history].reverse().find((item) => item?.status === status);
                  if (entry?.changedAt) return entry.changedAt;
                  if (status === 'pending') return order.createdAt;
                  return null;
                };

                const getStepMeta = (status) => {
                  const metas = {
                    pending: { text: 'Принят в обработку', desc: 'Заказ успешно зарегистрирован и ожидает подтверждения оператором', icon: Clock, activeColor: 'text-amber-600 bg-amber-50 border-amber-200' },
                    processing: { text: 'Сборка и комплектация', desc: 'Собираем товары на складе и готовим сопроводительные документы', icon: ClipboardList, activeColor: 'text-blue-600 bg-blue-50 border-blue-200' },
                    shipped: { text: 'Передан в доставку', desc: 'Заказ передан курьеру и находится в пути на ваш объект', icon: Truck, activeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                    completed: { text: 'Заказ выполнен', desc: 'Товары успешно доставлены, приняты и оплачены', icon: CheckCircle2, activeColor: 'text-emerald-700 bg-emerald-50 border-emerald-250' },
                    cancelled: { text: 'Заказ отменен', desc: order.cancellationReason ? `Причина: ${order.cancellationReason}` : 'Заказ был отменен покупателем или менеджером', icon: AlertCircle, activeColor: 'text-rose-600 bg-rose-50 border-rose-200' },
                  };
                  return metas[status] || metas.pending;
                };

                return steps.map((status, index) => {
                  const meta = getStepMeta(status);
                  const Icon = meta.icon;
                  const changedAt = getHistoryTime(status);
                  const isDone = status === 'cancelled' || (currentIndex >= index && currentIndex !== -1);
                  const isCurrent = order.status === status;

                  return (
                    <div key={status} className="flex gap-4 items-start group">
                      {/* Timeline Dot Indicator */}
                      <div className="relative flex h-6 w-6 items-center justify-center rounded-full shrink-0 z-10">
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isDone 
                            ? isCurrent 
                              ? 'bg-white border-blue-600 shadow-md ring-4 ring-blue-500/10' 
                              : 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {isDone && !isCurrent ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <Icon className={`h-3 w-3 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className={`text-sm font-extrabold transition-colors ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                            {meta.text}
                          </span>
                          {isCurrent && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-slate-950 text-white px-2 py-0.5 rounded-full shrink-0">
                              текущий
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed font-semibold transition-colors ${isDone ? 'text-slate-655' : 'text-slate-350'}`}>
                          {meta.desc}
                        </p>
                        {changedAt && (
                          <p className="text-[10px] text-slate-400 font-extrabold font-mono uppercase">
                            {new Date(changedAt).toLocaleString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
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

      {showReturnModal && (
        <ReturnRequestModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          order={order}
          rules={warrantyRules}
          existingReturns={returnRequests}
          showToast={showToast}
          onSubmitSuccess={() => {
            fetchReturns();
          }}
        />
      )}

      {showCancelModal && (
        <OrderCancelModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          order={order}
          showToast={showToast}
          onSuccess={(updatedOrder) => {
            onLoadOrder?.(order.id);
            onRefresh?.();
            bonuses?.fetchSummary?.();
          }}
        />
      )}
    </section>
  );
}
