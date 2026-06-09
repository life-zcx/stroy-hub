import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Minus,
  Percent,
  Plus,
  ShoppingCart,
  ShieldCheck,
  X,
  Gift,
} from 'lucide-react';
import { createOrder, validatePromotionCode, getUserBonuses } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { formatPromotionTargets, getPromotionScopeLabel } from '../utils/promotions';
import { trackEvent } from '../utils/analytics';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

const FREE_DELIVERY_THRESHOLD = 150000;

const getPremiumImage = (productName) => {
  const name = productName.toLowerCase();
  if (name.includes('цемент')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('rotband') || name.includes('штукатурка')) {
    return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('доска')) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('брус')) {
    return 'https://images.unsplash.com/photo-1520156480391-11597d6db64d?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('перфоратор')) {
    return 'https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('шуруповерт')) {
    return 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('tikkurila') || name.includes('краска интерьерная')) {
    return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('эмаль') || name.includes('пф-115')) {
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('саморез')) {
    return 'https://images.unsplash.com/photo-1590236166418-498c199859f8?auto=format&fit=crop&w=400&q=80';
  }
  if (name.includes('анкер') || name.includes('болт')) {
    return 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80';
  }
  return null;
};

export default function CartSidebar({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  showToast,
  customer,
  onOpenAuth,
}) {
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    paymentMethod: 'cash',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoPreview, setPromoPreview] = useState({ valid: false, discountAmount: 0, totalAmount: 0 });
  const [availableBonusPoints, setAvailableBonusPoints] = useState(0);
  const [useBonuses, setUseBonuses] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        clientName: customer.name || '',
        clientPhone: customer.phone || '',
        clientAddress: customer.address || '',
        paymentMethod: 'cash',
      });
    }
  }, [customer, checkoutMode]);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);
  const progressPercent = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const promotionItems = useMemo(() => cart.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    price: item.price,
  })), [cart]);

  // Fetch available loyalty bonuses
  useEffect(() => {
    const fetchBonuses = async () => {
      if (isOpen && customer) {
        try {
          const data = await getUserBonuses();
          setAvailableBonusPoints(data.availableBonusPoints || 0);
        } catch (error) {
          console.error('Error fetching user bonuses:', error);
        }
      } else {
        setAvailableBonusPoints(0);
        setUseBonuses(false);
      }
    };
    fetchBonuses();
  }, [isOpen, customer]);

  const finalTotalBeforeBonuses = promoPreview.valid ? promoPreview.totalAmount : cartTotal;
  const bonusDiscount = useBonuses ? Math.min(availableBonusPoints, finalTotalBeforeBonuses) : 0;
  const finalTotal = finalTotalBeforeBonuses - bonusDiscount;
  const estimatedEarnedBonuses = Math.round(finalTotal * 0.03);

  useEffect(() => {
    if (cart.length === 0) {
      setCheckoutMode(false);
      setPromoCode('');
      setPromoError('');
      setAppliedPromotion(null);
      setPromoPreview({ valid: false, discountAmount: 0, totalAmount: 0 });
    }
  }, [cart.length]);

  useEffect(() => {
    if (!appliedPromotion?.promoCode || cart.length === 0) {
      return;
    }

    const revalidate = async () => {
      try {
        const data = await validatePromotionCode(appliedPromotion.promoCode, promotionItems, cartTotal);
        setAppliedPromotion(data.promotion);
        setPromoPreview({ valid: true, ...data.preview });
        setPromoError('');
      } catch (error) {
        setPromoPreview({ valid: false, discountAmount: 0, totalAmount: cartTotal, error: getFriendlyErrorMessage(error) });
      }
    };

    revalidate();
  }, [appliedPromotion?.promoCode, cartTotal, promotionItems, cart.length]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Введите промокод, чтобы применить скидку.');
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      const data = await validatePromotionCode(promoCode, promotionItems, cartTotal);
      setAppliedPromotion(data.promotion);
      setPromoPreview({ valid: true, ...data.preview });
      setPromoCode(data.promotion.promoCode || promoCode.trim().toUpperCase());
      showToast?.(`% Промокод ${data.promotion.promoCode} применен`);
    } catch (error) {
      console.error(error);
      setAppliedPromotion(null);
      setPromoPreview({ valid: false, discountAmount: 0, totalAmount: cartTotal });
      setPromoError(getFriendlyErrorMessage(error));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromotion(null);
    setPromoCode('');
    setPromoError('');
    setPromoPreview({ valid: false, discountAmount: 0, totalAmount: cartTotal });
  };

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !formData.clientAddress) {
      alert('Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientAddress: formData.clientAddress,
        paymentMethod: formData.paymentMethod,
        promoCode: promoPreview.valid ? appliedPromotion?.promoCode : null,
        useBonuses,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const createdOrder = await createOrder(orderPayload);

      trackEvent('order_created', {
        orderId: createdOrder.id,
        value: createdOrder.totalAmount || finalTotal,
        metadata: {
          itemsCount: cartItemsCount,
          paymentMethod: formData.paymentMethod,
          promoCode: orderPayload.promoCode,
        },
      });

      showToast('🎉 Заказ успешно оформлен! Статус доставки можно отслеживать в разделе «Мои заказы»');
      onClearCart();
      setCheckoutMode(false);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Ошибка при оформлении заказа: ' + getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-emerald-600" />
              {checkoutMode ? 'Оформление заказа' : 'Корзина'}
              <span className="bg-gray-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2">
                {cartItemsCount}
              </span>
            </h2>
            <button
              onClick={() => {
                if (!isSubmitting) {
                  onClose();
                }
              }}
              className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {cart.length > 0 && !checkoutMode && (
            <div className="bg-emerald-50/50 p-4 border-b border-emerald-100">
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                <span>До бесплатной доставки</span>
                <span>
                  {cartTotal >= FREE_DELIVERY_THRESHOLD
                    ? 'Готово! Доставим бесплатно 🚚'
                    : `${formatPrice(FREE_DELIVERY_THRESHOLD - cartTotal)}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                При заказе от {formatPrice(FREE_DELIVERY_THRESHOLD)} доставка по Алматы за наш счет.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-white p-6 rounded-full shadow-sm border border-gray-100 mb-2">
                  <ShoppingCart className="h-12 w-12 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-slate-900">В корзине пока пусто</p>
                <p className="text-slate-500 text-sm max-w-[250px]">
                  Выберите качественные стройматериалы на главной витрине и добавьте их в корзину.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 bg-slate-900 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                >
                  Перейти к покупкам
                </button>
              </div>
            ) : checkoutMode && !customer ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5 px-4">
                <div className="bg-emerald-50 p-6 rounded-full border border-emerald-100 mb-2">
                  <Lock className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">Требуется авторизация</h3>
                <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed">
                  Для оформления заказа и отслеживания его статуса, пожалуйста, войдите в свой личный кабинет покупателя.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full bg-slate-950 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md"
                >
                  Войти или зарегистрироваться
                </button>
                <button
                  onClick={() => setCheckoutMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Вернуться в корзину
                </button>
              </div>
            ) : checkoutMode ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                {appliedPromotion && (
                  <div className={`rounded-2xl border p-4 ${promoPreview.valid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          {promoPreview.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Percent className="h-4 w-4 text-amber-600" />}
                          {appliedPromotion.title}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Код: <span className="font-black tracking-wider text-slate-700">{appliedPromotion.promoCode || 'без кода'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">{getPromotionScopeLabel(appliedPromotion.scope)}: {formatPromotionTargets(appliedPromotion)}</p>
                        <p className="text-xs mt-2 text-slate-600">
                          {promoPreview.valid
                            ? `Скидка ${formatPrice(promoPreview.discountAmount)} уже учтена в итоговой сумме.`
                            : promoPreview.error || 'Промокод больше не подходит для текущего состава корзины.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900"
                      >
                        Убрать
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Имя получателя *</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    placeholder="Например, Александр"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Телефон *</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    required
                    placeholder="+7 (707) 123-45-67"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Адрес доставки *</label>
                  <textarea
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    placeholder="Город, улица, дом, квартира, объект"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Способ оплаты</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all text-sm"
                  >
                    <option value="cash">Наличными / Картой при получении</option>
                    <option value="kaspi">Kaspi Transfer / QR</option>
                    <option value="invoice">Счет на оплату (B2B юр. лица)</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Сумма товаров</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  {promoPreview.valid && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Скидка по промокоду</span>
                      <span>- {formatPrice(promoPreview.discountAmount)}</span>
                    </div>
                  )}
                  {bonusDiscount > 0 && (
                    <div className="flex justify-between text-blue-600 font-semibold">
                      <span>Списание бонусов</span>
                      <span>- {formatPrice(bonusDiscount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-end">
                    <span className="font-bold text-slate-900">К оплате</span>
                    <span className="text-xl font-extrabold text-emerald-600">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutMode(false)}
                    className="flex-1 bg-gray-150 hover:bg-gray-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
                    disabled={isSubmitting}
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Clock className="h-5 w-5 animate-spin" /> : 'Подтвердить'}
                  </button>
                </div>
              </form>
            ) : (
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group"
                  >
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                      title="Удалить из корзины"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={(item.image && !item.image.includes('placehold.co')) ? item.image : (getPremiumImage(item.name) || item.image)}
                        alt={item.name}
                        className="w-3/4 h-3/4 object-contain mix-blend-multiply"
                        onError={(event) => {
                          event.target.onerror = null;
                          event.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight mb-1 pr-4">
                        {item.name}
                      </h3>
                      <div className="text-[10px] text-slate-500 mb-3 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-blue-500" /> {item.supplier?.name || 'Официальный склад'}
                      </div>

                      <div className="flex items-end justify-between mt-auto">
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-slate-600 shadow-sm"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-slate-600 shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-slate-400 mb-0.5">{formatPrice(item.price)} / шт</span>
                          <span className="font-extrabold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && !checkoutMode && (
            <div className="border-t border-gray-100 p-6 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 mb-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  Промокод
                </div>

                {appliedPromotion ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{appliedPromotion.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Код <span className="font-black tracking-wider text-slate-700">{appliedPromotion.promoCode}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">{getPromotionScopeLabel(appliedPromotion.scope)}: {formatPromotionTargets(appliedPromotion)}</p>
                      </div>
                      <button
                        onClick={handleRemovePromoCode}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900"
                      >
                        Убрать
                      </button>
                    </div>

                    {promoPreview.valid ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Скидка по заказу</span>
                        <span className="font-extrabold text-emerald-600">- {formatPrice(promoPreview.discountAmount)}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700">{promoPreview.error || 'Промокод не подходит к текущему заказу.'}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(event) => {
                          setPromoCode(event.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        placeholder="Например, TORMAG10"
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold tracking-[0.15em] uppercase focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        onClick={handleApplyPromoCode}
                        disabled={promoLoading}
                        className="px-4 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60"
                      >
                        {promoLoading ? '...' : 'Применить'}
                      </button>
                    </div>
                    {promoError && <p className="text-xs text-rose-600 font-semibold">{promoError}</p>}
                  </>
                )}
              </div>

              {/* Loyalty program bonuses section */}
              {customer ? (
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-5 text-white mb-5 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Бонусная программа</span>
                      <div className="text-3xl font-black text-white mt-1.5 font-outfit">
                        {formatPrice(availableBonusPoints)}
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 border border-amber-400/30 rounded-2xl text-amber-400">
                      <Gift className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs relative z-10">
                    <div className="text-slate-400 font-medium">
                      Вернем 3% за заказ: <span className="text-emerald-400 font-bold">+{formatPrice(estimatedEarnedBonuses)}</span>
                    </div>
                    
                    {availableBonusPoints > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 active:scale-95 px-3 py-1.5 rounded-xl transition-all border border-white/5 select-none">
                        <input
                          type="checkbox"
                          checked={useBonuses}
                          onChange={(e) => setUseBonuses(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-350 focus:ring-emerald-500 focus:ring-2 transition-all cursor-pointer"
                        />
                        <span className="font-bold text-white text-[11px]">Списать</span>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white mb-5 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-center gap-4 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Бонусная программа</span>
                      <p className="text-[11px] text-slate-300 leading-normal">Войдите, чтобы копить бонусы 3% и оплачивать ими покупки.</p>
                    </div>
                    <button 
                      onClick={onOpenAuth}
                      className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/10 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 font-outfit animate-pulse"
                    >
                      Войти
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Товары ({cartItemsCount})</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {promoPreview.valid && (
                  <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                    <span>Скидка по промокоду</span>
                    <span>- {formatPrice(promoPreview.discountAmount)}</span>
                  </div>
                )}
                {bonusDiscount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 font-semibold">
                    <span>Списание бонусов</span>
                    <span>- {formatPrice(bonusDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Доставка</span>
                  <span className={cartTotal >= FREE_DELIVERY_THRESHOLD ? 'text-green-600 font-bold' : ''}>
                    {cartTotal >= FREE_DELIVERY_THRESHOLD ? 'Бесплатно' : 'По тарифам складов'}
                  </span>
                </div>
                <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-end">
                  <span className="text-base font-semibold text-slate-900">Итого:</span>
                  <div className="text-right">
                    {(promoPreview.valid || bonusDiscount > 0) && (
                      <span className="block text-xs text-slate-400 line-through">{formatPrice(cartTotal)}</span>
                    )}
                    <span className="text-2xl font-extrabold text-emerald-600">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 mb-6 flex gap-3">
                <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Заказ поедет напрямую со складов официальных дилеров. Менеджер свяжется для подтверждения.
                </p>
              </div>

              <button
                onClick={() => {
                  trackEvent('checkout_start', {
                    value: finalTotal,
                    metadata: {
                      itemsCount: cartItemsCount,
                      cartLines: cart.length,
                    },
                  });
                  setCheckoutMode(true);
                }}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                Перейти к оформлению
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
