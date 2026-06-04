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
  ArrowLeft,
} from 'lucide-react';
import { createOrder, validatePromotionCode, getUserBonuses } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { formatPromotionTargets, getPromotionScopeLabel } from '../utils/promotions';
import { trackEvent } from '../utils/analytics';

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

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  showToast,
  customer,
  onOpenAuth,
  onNavigate,
}) {
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
  }, [customer]);

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
      if (customer) {
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
  }, [customer]);

  const finalTotalBeforeBonuses = promoPreview.valid ? promoPreview.totalAmount : cartTotal;
  const bonusDiscount = useBonuses ? Math.min(availableBonusPoints, finalTotalBeforeBonuses) : 0;
  const finalTotal = finalTotalBeforeBonuses - bonusDiscount;
  const estimatedEarnedBonuses = Math.round(finalTotal * 0.03);

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
        setPromoPreview({ valid: false, discountAmount: 0, totalAmount: cartTotal, error: error.response?.data?.error || 'Промокод больше не подходит к текущему заказу.' });
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
      setPromoError(error.response?.data?.error || 'Не удалось применить промокод.');
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
    if (!customer) {
      onOpenAuth?.();
      return;
    }

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
      onNavigate('orders');
    } catch (error) {
      console.error(error);
      alert('Ошибка при оформлении заказа: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-fade-in-up">
        <div className="bg-white p-8 rounded-full shadow-sm border border-gray-150 inline-block">
          <ShoppingCart className="h-16 w-16 text-slate-300" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-outfit">В корзине пока пусто</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Выберите качественные стройматериалы на главной витрине или воспользуйтесь каталогом, чтобы добавить товары в корзину.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="mt-6 bg-slate-900 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md"
        >
          Перейти к каталогу товаров
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up font-sans text-slate-800 text-left">
      {/* Sleek Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed">
        <button 
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
        >
          Главная
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
        <span className="text-slate-900 font-extrabold">Корзина</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Cart items and Delivery details form */}
        <div className="flex-1 w-full space-y-8">
          {/* Cart Items List */}
          <div className="bg-white rounded-[2rem] border border-slate-150 p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-black text-slate-950 flex items-center gap-3 mb-6">
              <ShoppingCart className="h-7 w-7 text-emerald-600" />
              Корзина покупок
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">
                {cartItemsCount} шт
              </span>
            </h1>

            {/* Delivery Progress Bar */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
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

            {/* List */}
            <ul className="divide-y divide-slate-100">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 sm:gap-6 py-6 first:pt-0 last:pb-0 relative group"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-tight pr-6">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all flex-shrink-0"
                        title="Удалить из корзины"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> {item.supplier?.name || 'Официальный склад'}
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-650 shadow-sm"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-650 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="block text-[11px] text-slate-400 mb-0.5">{formatPrice(item.price)} / шт</span>
                        <span className="text-base sm:text-lg font-black text-slate-950">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Details Form */}
          <div className="bg-white rounded-[2rem] border border-slate-150 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              Данные получателя и доставка
            </h2>

            {!customer ? (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-center space-y-4">
                <Lock className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Для оформления заказа требуется авторизация</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Пожалуйста, войдите в личный кабинет. Это позволит отслеживать статус заказа, применять промокоды и тратить бонусы.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                >
                  Войти или зарегистрироваться
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Имя получателя *</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    placeholder="Александр"
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Телефон *</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    required
                    placeholder="+7 (707) 123-45-67"
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none font-semibold text-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Адрес доставки *</label>
                  <textarea
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    placeholder="Город Алматы, улица Абая, дом 10, кв 15"
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none resize-none font-semibold text-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Способ оплаты</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none font-semibold text-slate-900"
                  >
                    <option value="cash">Наличными / Картой при получении</option>
                    <option value="kaspi">Kaspi Transfer / QR</option>
                    <option value="invoice">Счет на оплату (B2B юр. лица)</option>
                  </select>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Breakdown, Loyalty Program, and Checkout Action button */}
        <div className="w-full lg:w-96 space-y-6 shrink-0">
          {/* Loyalty Program Gradient Card */}
          {customer ? (
            <div className={`rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 text-white shadow-md relative overflow-hidden transition-all duration-300 ${
              useBonuses 
                ? 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]' 
                : 'border border-white/5'
            }`}>
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
                  <label className={`flex items-center gap-2 cursor-pointer active:scale-95 px-3.5 py-2 rounded-xl transition-all border select-none ${
                    useBonuses 
                      ? 'bg-amber-400 hover:bg-amber-350 text-slate-950 border-amber-400' 
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/5'
                  }`}>
                    <input
                      type="checkbox"
                      checked={useBonuses}
                      onChange={(e) => setUseBonuses(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="font-black text-[11px] uppercase tracking-wider">
                      {useBonuses ? 'Списано ✓' : 'Списать'}
                    </span>
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center gap-4 relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Бонусная программа</span>
                  <p className="text-[11px] text-slate-300 leading-normal">Войдите, чтобы копить бонусы 3% и оплачивать ими покупки.</p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/10 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 font-outfit"
                >
                  Войти
                </button>
              </div>
            </div>
          )}

          {/* Promo Code Input Block */}
          <div className="bg-white rounded-[2rem] border border-slate-150 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <Percent className="h-4 w-4 text-emerald-600" />
              Промокод на скидку
            </div>

            {appliedPromotion ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
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
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-emerald-100 mt-1">
                    <span className="text-slate-600">Скидка по промокоду</span>
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
                    placeholder="TORMAG10"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-sm font-bold tracking-[0.15em] uppercase focus:bg-white focus:border-emerald-500 outline-none transition-all"
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

          {/* Pricing Totals Card */}
          <div className="bg-white rounded-[2rem] border border-slate-150 p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2">Детали заказа</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Товары ({cartItemsCount})</span>
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
              <div className="flex justify-between text-slate-500">
                <span>Доставка</span>
                <span className={cartTotal >= FREE_DELIVERY_THRESHOLD ? 'text-green-600 font-bold' : ''}>
                  {cartTotal >= FREE_DELIVERY_THRESHOLD ? 'Бесплатно' : 'По тарифам складов'}
                </span>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-end">
                <span className="text-base font-bold text-slate-900">Итого к оплате:</span>
                <div className="text-right">
                  {(promoPreview.valid || bonusDiscount > 0) && (
                    <span className="block text-xs text-slate-400 line-through mb-0.5">{formatPrice(cartTotal)}</span>
                  )}
                  <span className="text-2xl font-black text-emerald-600 font-outfit">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex gap-3 text-left">
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-650 leading-relaxed">
                Товары поедут напрямую со складов официальных дилеров. Наш менеджер свяжется с вами для подтверждения доставки.
              </p>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={isSubmitting}
              className="w-full bg-slate-950 hover:bg-emerald-650 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Clock className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Оформить заказ</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
