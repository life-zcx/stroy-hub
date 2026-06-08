import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
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
  Calendar,
  Sparkles,
  History,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { createOrder, validatePromotionCode, getProducts } from '../services/api';
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
  bonuses,
  onAddToCart,
}) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    paymentMethod: 'cash',
    deliveryDate: 'today', // today, tomorrow, custom
    customDeliveryDate: '',
    deliveryTimeSlot: '14:00-18:00', // 09:00-13:00, 14:00-18:00, 19:00-22:00
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoPreview, setPromoPreview] = useState({ valid: false, discountAmount: 0, totalAmount: 0 });
  const [bonusInput, setBonusInput] = useState('');
  const [appliedBonuses, setAppliedBonuses] = useState(0);

  // Recommendations state
  const [hits, setHits] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [successOrder, setSuccessOrder] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [step, setStep] = useState('cart'); // 'cart' or 'checkout'
  const [termsError, setTermsError] = useState(false);

  // Load recommendations when cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      const loadRecs = async () => {
        try {
          const popular = await getProducts({ onlyHits: true, limit: 8 });
          setHits(popular);
        } catch (e) {
          console.error('Error loading hits of sales:', e);
        }
        try {
          const viewed = JSON.parse(localStorage.getItem('tormag_recently_viewed') || '[]');
          setRecentlyViewed(viewed);
        } catch (e) {
          console.error('Error loading recently viewed products:', e);
        }
      };
      loadRecs();
    }
  }, [cart.length]);

  // Получаем баланс из пропа bonuses (useBonuses хук из App.jsx)
  const availableBonusPoints = bonuses?.availableBalance ?? 0;
  const pendingBonusPoints = bonuses?.pendingBalance ?? 0;

  // Заполняем форму из профиля клиента
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        clientName: customer.name || '',
        clientPhone: customer.phone || '',
        clientAddress: customer.address || '',
      }));
    }
  }, [customer]);

  // Загружаем summary при открытии корзины
  useEffect(() => {
    if (customer) {
      bonuses?.fetchSummary?.();
    } else {
      setBonusInput('');
      setAppliedBonuses(0);
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

  const finalTotalBeforeBonuses = promoPreview.valid ? promoPreview.totalAmount : cartTotal;
  const bonusDiscount = Math.min(availableBonusPoints, finalTotalBeforeBonuses, appliedBonuses);
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
    if (event && event.preventDefault) event.preventDefault();
    if (!customer) {
      onOpenAuth?.();
      return;
    }

    if (!formData.agreeToTerms) {
      setTermsError(true);
      return;
    }

    if (!formData.clientName || !formData.clientPhone || !formData.clientAddress) {
      alert('Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setIsSubmitting(true);
    try {
      let deliveryDateString = '';
      if (formData.deliveryDate === 'today') {
        deliveryDateString = 'Сегодня (экспресс)';
      } else if (formData.deliveryDate === 'tomorrow') {
        deliveryDateString = 'Завтра';
      } else {
        deliveryDateString = formData.customDeliveryDate || 'Выбранная дата';
      }

      const orderPayload = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientAddress: formData.clientAddress,
        paymentMethod: formData.paymentMethod,
        promoCode: promoPreview.valid ? appliedPromotion?.promoCode : null,
        useBonuses: bonusDiscount > 0 ? bonusDiscount : false,
        deliveryDate: deliveryDateString,
        deliveryTime: formData.deliveryTimeSlot,
        comment: formData.comment || '',
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

      showToast('🎉 Заказ успешно оформлен!');
      onClearCart();
      setSuccessOrder(createdOrder);
    } catch (error) {
      console.error(error);
      alert('Ошибка при оформлении заказа: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayItems = recentlyViewed.length > 0 ? recentlyViewed : hits;
  const hasItems = displayItems.length > 0;
  const recommendationsTitle = recentlyViewed.length > 0 ? "Вы недавно смотрели" : "Рекомендуемые товары";
  const recommendationsIcon = recentlyViewed.length > 0 ? <History className="h-5 w-5 text-blue-500" /> : <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />;

  // Auto-scroll recommendations carousel
  useEffect(() => {
    if (cart.length === 0 && displayItems.length > 4) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => {
          const maxIndex = displayItems.length - 4;
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [cart.length, displayItems.length]);

  const handleNext = () => {
    setCarouselIndex((prev) => {
      const maxIndex = displayItems.length - 4;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const handlePrev = () => {
    setCarouselIndex((prev) => {
      const maxIndex = displayItems.length - 4;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  if (successOrder) {
    const earnedRefund = Math.round(successOrder.totalAmount * 0.03);
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left animate-fade-in-up">
        {/* Animated Checkmark and Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-pulse mb-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 font-outfit">Заказ успешно создан!</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Спасибо за покупку в <span className="font-extrabold text-slate-900">TORMAG</span>. Мы уже начали готовить ваш заказ к отправке.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-[2rem] border border-slate-150 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Номер заказа</span>
              <div className="text-xl font-black text-slate-900">#{successOrder.id}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Итоговая сумма</span>
              <div className="text-xl font-black text-emerald-600 font-outfit">{formatPrice(successOrder.totalAmount)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Получатель</span>
              <p className="font-bold text-slate-800">{successOrder.clientName}</p>
              <p className="text-slate-500 text-xs font-semibold">{successOrder.clientPhone}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Адрес доставки</span>
              <p className="font-bold text-slate-800 leading-snug">{successOrder.clientAddress}</p>
            </div>
            {successOrder.deliveryDate && (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Дата и время доставки</span>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  {successOrder.deliveryDate} {successOrder.deliveryTime ? `(слот: ${successOrder.deliveryTime})` : ''}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Способ оплаты</span>
              <p className="font-bold text-slate-800 uppercase tracking-wider text-xs bg-slate-100 px-2.5 py-1 rounded-md inline-block mt-0.5">
                {successOrder.paymentMethod === 'kaspi' ? 'Kaspi Transfer / QR' : successOrder.paymentMethod === 'invoice' ? 'Счет на оплату' : 'При получении'}
              </p>
            </div>
          </div>

          {/* Cashback Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden">
            <div className="p-3 bg-emerald-100/50 border border-emerald-200 rounded-xl text-emerald-600 shrink-0">
              <Gift className="h-6 w-6" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">Начисление бонусов</span>
              <p className="text-sm font-black text-slate-900 font-outfit">Вам начислено +{formatPrice(earnedRefund)} бонусами!</p>
              <p className="text-[11px] text-slate-550 leading-normal font-medium">Бонусы станут доступны для оплаты новых покупок сразу после доставки данного заказа.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setSuccessOrder(null);
              onNavigate('catalog');
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            <ShoppingBag className="h-5 w-5 text-slate-650" />
            <span>Продолжить покупки</span>
          </button>
          <button
            onClick={() => {
              const orderId = successOrder.id;
              setSuccessOrder(null);
              onNavigate('order-detail', orderId);
            }}
            className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            <span>Отслеживать заказ</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in-up text-left">
        {/* Breadcrumbs */}
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

        {/* Empty Alert (Clean & Borderless design) */}
        <div className="text-center py-6 space-y-4 flex flex-col items-center justify-center">
          <ShoppingCart className="h-16 w-16 text-slate-350" />
          <h1 className="text-2xl font-black text-slate-950 font-outfit">В корзине пока пусто</h1>
          <p className="text-slate-550 text-sm max-w-md mx-auto leading-relaxed">
            Выберите качественные стройматериалы на главной витрине или воспользуйтесь каталогом, чтобы добавить товары в корзину.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-slate-950 hover:bg-emerald-650 text-white px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Перейти к каталогу товаров
          </button>
        </div>

        {/* Recommendations Section */}
        {hasItems && (
          <div className="space-y-4 border-t border-slate-200/85 pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {recommendationsIcon}
                <h2 className="text-xl font-black text-slate-900 font-outfit">{recommendationsTitle}</h2>
              </div>
              
              {/* Manual Nav controls */}
              {displayItems.length > 4 && (
                <div className="hidden md:flex items-center gap-2">
                  <button 
                    onClick={handlePrev}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sliding Carousel Zone */}
            <div className="relative overflow-x-auto md:overflow-hidden w-full py-4 hide-scrollbar snap-x snap-mandatory scroll-smooth">
              <div 
                className="flex transition-transform duration-500 ease-out gap-5 max-md:!transform-none" 
                style={{ transform: `translateX(-${carouselIndex * 276}px)` }}
              >
                {displayItems.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => onNavigate('product', prod.id)}
                    className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:shadow-md transition-all duration-300 w-64 flex-shrink-0 group flex flex-col cursor-pointer hover:border-emerald-500/30 snap-start snap-always"
                  >
                    <div className="h-32 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden relative mb-3">
                      {prod.isHit && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider z-10">
                          Хит
                        </span>
                      )}
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-2/3 h-2/3 object-contain group-hover:scale-105 transition-transform" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'; }}
                      />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[2rem] leading-snug group-hover:text-emerald-600 transition-colors mb-2">
                      {prod.name}
                    </h3>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900 font-outfit">{formatPrice(prod.price)}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddToCart) {
                            onAddToCart(prod);
                            showToast?.(`🛒 «${prod.name}» добавлен в корзину`);
                          } else {
                            onUpdateQuantity?.(prod.id, 1);
                          }
                        }}
                        className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
        {step === 'checkout' ? (
          <button 
            onClick={() => setStep('cart')} 
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
          >
            Корзина
          </button>
        ) : (
          <span className="text-slate-900 font-extrabold">Корзина</span>
        )}
        {step === 'checkout' && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-350 mx-0.5 shrink-0" />
            <span className="text-slate-900 font-extrabold">Оформление заказа</span>
          </>
        )}
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Cart items or Delivery details form */}
        <div className="flex-1 w-full space-y-8">
          {step === 'cart' && (
            /* Cart Items List */
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
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer"
                        title="Удалить из корзины"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> {item.supplier?.name || 'Официальный склад'}
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900 min-w-[24px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 font-outfit block">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {formatPrice(item.price)} / шт
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {step === 'cart' && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => onNavigate?.('catalog')}
                  className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer bg-transparent border-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Продолжить покупки
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customer) {
                      onOpenAuth?.();
                    } else {
                      setStep('checkout');
                    }
                  }}
                  className="bg-slate-950 hover:bg-emerald-650 text-white font-extrabold py-3.5 px-7 rounded-xl shadow-md transition-all flex items-center gap-2 transform active:scale-95 text-sm cursor-pointer"
                >
                  <span>Перейти к оформлению</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
          )}

          {step === 'checkout' && (
            <div className="bg-white rounded-[2rem] border border-slate-150 p-6 sm:p-8 shadow-sm">
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-550 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer bg-transparent border-0 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Вернуться к корзине
              </button>

              <h2 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                Оформление заказа
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
                  className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Войти или зарегистрироваться
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-8">
                
                {/* Шаг 1: Контактные данные получателя */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">1</span>
                    Данные получателя
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Имя получателя *</label>
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
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Телефон *</label>
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
                  </div>
                </div>

                {/* Шаг 2: Способ и параметры доставки */}
                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">2</span>
                    Параметры доставки
                  </h3>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Адрес доставки *</label>
                    <textarea
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleInputChange}
                      required
                      rows="2"
                      placeholder="Город Алматы, улица Абая, дом 10, кв 15"
                      className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none resize-none font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">Формат доставки *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'today', label: 'Сегодня (экспресс)' },
                        { value: 'tomorrow', label: 'Завтра' },
                        { value: 'custom', label: 'Выбрать дату' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, deliveryDate: opt.value }))}
                          className={`p-3.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                            formData.deliveryDate === opt.value
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md transform scale-[1.01]'
                              : 'bg-slate-50 border-slate-150 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.deliveryDate === 'custom' && (
                    <div className="animate-fade-in space-y-2">
                      <label className="block text-[10px] font-black text-slate-555 uppercase tracking-wider">Дата доставки *</label>
                      <input
                        type="date"
                        name="customDeliveryDate"
                        value={formData.customDeliveryDate}
                        onChange={handleInputChange}
                        required={formData.deliveryDate === 'custom'}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none font-semibold text-slate-900"
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">3</span>
                    Комментарий к заказу
                  </h3>
                  <textarea
                    name="comment"
                    value={formData.comment || ''}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Например: позвонить за час до доставки, кодовый замок..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none resize-none font-semibold text-slate-900"
                  />
                </div>

                {/* Шаг 4: Оплата */}
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">4</span>
                    Оплата
                  </h3>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all text-sm outline-none font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Наличными / Картой при получении</option>
                    <option value="kaspi">Kaspi Transfer / QR</option>
                    <option value="invoice">Счет на оплату (B2B юр. лица)</option>
                  </select>
                </div>

                {/* Шаг 5: Скидки и Бонусы */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">5</span>
                    Скидки и Бонусы
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bonuses input */}
                    {customer && (
                      <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-3 flex flex-col justify-center min-h-[120px] shadow-sm">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Списать бонусы</label>
                          <span className="text-[10px] font-bold text-slate-500">Доступно: {formatPrice(availableBonusPoints)}</span>
                        </div>
                        {appliedBonuses > 0 ? (
                          <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 flex items-center justify-between text-xs h-[46px]">
                            <div>
                              <span className="font-bold text-slate-900">Бонусы списаны</span>
                              <span className="block text-[10px] text-slate-500 font-mono">Сумма: -{formatPrice(appliedBonuses)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedBonuses(0);
                                setBonusInput('');
                              }}
                              className="text-xs font-bold text-rose-650 hover:text-rose-800 cursor-pointer"
                            >
                              Убрать
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={bonusInput}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val === '') {
                                  setBonusInput('');
                                } else {
                                  const num = Math.min(availableBonusPoints, finalTotalBeforeBonuses, parseInt(val) || 0);
                                  setBonusInput(num.toString());
                                }
                              }}
                              placeholder="Количество бонусов"
                              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-550 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const amt = parseInt(bonusInput) || 0;
                                if (amt > 0) {
                                  setAppliedBonuses(amt);
                                  showToast?.(`🪙 Списано ${amt} бонусов`);
                                }
                              }}
                              disabled={!bonusInput || parseInt(bonusInput) <= 0}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Использовать
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Promo input */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-3 flex flex-col justify-center min-h-[120px] shadow-sm">
                      <label className="block text-[10px] font-black text-slate-555 uppercase tracking-wider">Промокод на скидку</label>
                      {appliedPromotion ? (
                        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 flex items-center justify-between text-xs h-[46px]">
                          <div>
                            <span className="font-bold text-slate-900 truncate max-w-[120px] block">{appliedPromotion.title}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">Код: {appliedPromotion.promoCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromoCode}
                            className="text-xs font-bold text-rose-650 hover:text-rose-800 cursor-pointer"
                          >
                            Убрать
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="TORMAG10"
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-emerald-550 transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            disabled={promoLoading}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {promoLoading ? '...' : 'Использовать'}
                          </button>
                        </div>
                      )}
                      {promoError && <p className="text-[11px] text-rose-650 font-semibold">{promoError}</p>}
                    </div>
                  </div>
                </div>

                {/* Шаг 6: Детали заказа */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold font-mono">6</span>
                    Детали заказа
                  </h3>

                  <div className="bg-slate-50 border border-slate-150 rounded-[2rem] p-6 space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-500 font-semibold">
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
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Доставка</span>
                        <span className={cartTotal >= FREE_DELIVERY_THRESHOLD ? 'text-green-600 font-bold' : 'font-semibold'}>
                          {cartTotal >= FREE_DELIVERY_THRESHOLD ? 'Бесплатно' : 'По тарифам складов'}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-250 flex justify-between items-end">
                        <span className="text-base font-bold text-slate-900">Итого к оплате:</span>
                        <div className="text-right">
                          {(promoPreview.valid || bonusDiscount > 0) && (
                            <span className="block text-xs text-slate-400 line-through mb-0.5">{formatPrice(cartTotal)}</span>
                          )}
                          <span className="text-2xl font-black text-emerald-600 font-outfit">{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Шаг 7: Подтверждение и согласие */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms || false}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }));
                        if (e.target.checked) setTermsError(false);
                      }}
                      className="mt-1 h-4 w-4 text-emerald-600 border-slate-355 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-550 leading-relaxed font-semibold">
                      Я согласен с <button type="button" onClick={() => onNavigate('legal')} className="text-emerald-600 hover:underline font-bold bg-transparent border-0 p-0 inline cursor-pointer">условиями публичной оферты</button> и обработки персональных данных *
                    </span>
                  </label>

                  {termsError && (
                    <div className="text-red-600 text-xs font-bold mt-2 animate-fade-in">
                      Пожалуйста, подтвердите согласие с условиями публичной оферты!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white font-extrabold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base font-outfit cursor-pointer mt-4"
                  >
                    {isSubmitting ? (
                      <Clock className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Оформить заказ на сумму {formatPrice(finalTotal)}</span>
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        )}
      </div>


      </div>
    </div>
  );
}
