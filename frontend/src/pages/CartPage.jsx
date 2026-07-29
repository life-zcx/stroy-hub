import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AddressMapPicker from '../components/AddressMapPicker';
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
  Truck,
  MapPin,
  Edit3,
  Star,
  Trash2,
} from 'lucide-react';
import { createOrder, validatePromotionCode, getProducts, getProductById, getSystemSettings, updateProfile } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { formatPromotionTargets, getPromotionScopeLabel } from '../utils/promotions';
import { trackEvent } from '../utils/analytics';
import { getFriendlyErrorMessage } from '../utils/errorHelper';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

const FREE_DELIVERY_THRESHOLD = 150000;

const KAZAKHSTAN_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Тараз', 'Павлодар', 'Кызылорда', 'Актобе',
  'Усть-Каменогорск', 'Семей', 'Атырау', 'Актау', 'Уральск', 'Костанай', 'Петропавловск',
  'Темиртау', 'Туркестан', 'Кокшетау', 'Талдыкорган', 'Экибастуз', 'Рудный', 'Жанаозен'
];

const QuantityInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (e) => {
    const valStr = e.target.value;
    if (valStr.length > 4) return;
    setLocalVal(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setLocalVal(value);
      onChange(value);
    } else {
      const clamped = Math.min(9999, parsed);
      setLocalVal(clamped);
      onChange(clamped);
    }
  };

  const inputLength = localVal ? localVal.toString().length : 1;

  return (
    <>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
      <input
        type="number"
        min="1"
        max="9999"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="no-spinner text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-none font-mono"
        style={{ width: `${Math.max(2, inputLength + 1.2)}ch`, maxWidth: '4.5ch' }}
      />
    </>
  );
};



export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  showToast,
  customer,
  onCustomerUpdate,
  onOpenAuth,
  onNavigate,
  bonuses,
  onAddToCart,
  currentPage = 'cart',
}) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    paymentMethod: 'cash',
    companyName: '',
    companyBin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoPreview, setPromoPreview] = useState({ valid: false, discountAmount: 0, totalAmount: 0 });
  const [bonusInput, setBonusInput] = useState('');
  const [appliedBonuses, setAppliedBonuses] = useState(0);

  // Address selection & city delivery settings state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [newAddrForm, setNewAddrForm] = useState({
    city: 'Алматы',
    street: '',
    details: '',
    isDefault: false,
  });
  const [savingNewAddr, setSavingNewAddr] = useState(false);

  // Recommendations state
  const [hits, setHits] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [successOrder, setSuccessOrder] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [step, setStep] = useState(() => currentPage === 'checkout' ? 'checkout' : 'cart');
  const [termsError, setTermsError] = useState(false);

  useEffect(() => {
    if (currentPage === 'checkout') {
      setStep('checkout');
    } else if (currentPage === 'cart') {
      setStep('cart');
    }
  }, [currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, successOrder]);

  // Fetch system settings for city delivery routes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSystemSettings(data);
      } catch (e) {
        console.error('Failed to load system settings in cart:', e);
      }
    };
    fetchSettings();
  }, []);

  // Compute available user addresses
  const userAddresses = useMemo(() => {
    if (customer?.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return customer.addresses;
    }
    if (customer?.address) {
      return [{
        id: 'legacy_1',
        city: 'Алматы',
        street: customer.address,
        details: '',
        isDefault: true,
      }];
    }
    return [];
  }, [customer]);

  // Auto-select default address
  useEffect(() => {
    if (userAddresses.length > 0) {
      const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
      if (defaultAddr && (!selectedAddressId || !userAddresses.some(a => a.id === selectedAddressId))) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [userAddresses, selectedAddressId]);

  const activeAddress = useMemo(() => {
    return userAddresses.find(a => a.id === selectedAddressId) || userAddresses[0] || null;
  }, [userAddresses, selectedAddressId]);

  // Calculate delivery days for selected city
  const deliveryDays = useMemo(() => {
    if (!activeAddress) return 1;
    const city = activeAddress.city || 'Алматы';
    const routes = systemSettings?.deliveryRoutes || [];
    const matched = routes.find(r => r.to?.toLowerCase() === city.toLowerCase());
    return matched?.days ?? 1;
  }, [activeAddress, systemSettings]);

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
          const uniqueViewed = [];
          const seenIds = new Set();
          for (const item of viewed) {
            const strId = String(item.id);
            if (item && item.id && !seenIds.has(strId)) {
              seenIds.add(strId);
              uniqueViewed.push(item);
            }
          }
          setRecentlyViewed(uniqueViewed);
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
      }));
    }
  }, [customer]);

  const handleOpenAddModal = () => {
    setEditingAddrId(null);
    setNewAddrForm({
      city: 'Алматы',
      street: '',
      details: '',
      isDefault: userAddresses.length === 0,
    });
    setShowAddAddressModal(true);
  };

  const handleEditAddress = (addr) => {
    setEditingAddrId(addr.id);
    setNewAddrForm({
      city: addr.city || 'Алматы',
      street: addr.street || '',
      details: addr.details || '',
      isDefault: !!addr.isDefault,
    });
    setShowAddAddressModal(true);
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const updatedList = userAddresses.map(a => ({ ...a, isDefault: a.id === id }));
      const defaultAddrObj = updatedList.find(a => a.isDefault) || updatedList[0];
      const defaultAddrStr = defaultAddrObj
        ? `г. ${defaultAddrObj.city}, ${defaultAddrObj.street}${defaultAddrObj.details ? `, ${defaultAddrObj.details}` : ''}`
        : '';

      const updatedCustomer = await updateProfile({
        addresses: updatedList,
        address: defaultAddrStr
      });
      onCustomerUpdate?.(updatedCustomer);
      showToast?.('Основной адрес обновлен');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const updatedList = userAddresses.filter(a => a.id !== id);
      if (updatedList.length > 0 && !updatedList.some(a => a.isDefault)) {
        updatedList[0].isDefault = true;
      }

      const defaultAddrObj = updatedList[0] || null;
      const defaultAddrStr = defaultAddrObj
        ? `г. ${defaultAddrObj.city}, ${defaultAddrObj.street}${defaultAddrObj.details ? `, ${defaultAddrObj.details}` : ''}`
        : '';

      const updatedCustomer = await updateProfile({
        addresses: updatedList,
        address: defaultAddrStr
      });
      onCustomerUpdate?.(updatedCustomer);
      if (selectedAddressId === id) {
        setSelectedAddressId(updatedList[0]?.id || null);
      }
      showToast?.('Адрес удален');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddrForm.street.trim()) {
      alert('Укажите улицу и дом');
      return;
    }
    setSavingNewAddr(true);
    try {
      let updatedList = [];
      let targetId = editingAddrId;

      if (editingAddrId) {
        updatedList = userAddresses.map(a => a.id === editingAddrId ? { ...newAddrForm, id: editingAddrId } : a);
      } else {
        targetId = 'addr_' + Date.now();
        const isFirst = userAddresses.length === 0;
        const newObj = { ...newAddrForm, id: targetId, isDefault: newAddrForm.isDefault || isFirst };
        updatedList = [...userAddresses, newObj];
      }

      if (newAddrForm.isDefault) {
        updatedList = updatedList.map(a => ({ ...a, isDefault: a.id === targetId }));
      }

      const defaultAddrObj = updatedList.find(a => a.isDefault) || updatedList[0];
      const defaultAddrStr = defaultAddrObj
        ? `г. ${defaultAddrObj.city}, ${defaultAddrObj.street}${defaultAddrObj.details ? `, ${defaultAddrObj.details}` : ''}`
        : '';

      const updatedCustomer = await updateProfile({
        addresses: updatedList,
        address: defaultAddrStr
      });

      onCustomerUpdate?.(updatedCustomer);
      setSelectedAddressId(targetId);
      setShowAddAddressModal(false);
      setNewAddrForm({ city: 'Алматы', street: '', details: '', isDefault: false });
      showToast?.(editingAddrId ? 'Адрес обновлен!' : 'Новый адрес добавлен!');
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить адрес');
    } finally {
      setSavingNewAddr(false);
    }
  };

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

  const maxBonusPaymentPercent = bonuses?.loyalty?.maxBonusPaymentPercent ?? 50;
  const finalTotalBeforeBonuses = promoPreview.valid ? promoPreview.totalAmount : cartTotal;
  const maxBonusDiscount = Math.floor(finalTotalBeforeBonuses * (maxBonusPaymentPercent / 100));
  const bonusDiscount = Math.min(availableBonusPoints, maxBonusDiscount, appliedBonuses);
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
    if (event && event.preventDefault) event.preventDefault();
    if (!customer) {
      onOpenAuth?.();
      return;
    }

    if (!formData.agreeToTerms) {
      setTermsError(true);
      return;
    }

    if (!formData.clientName || !formData.clientPhone) {
      alert('Пожалуйста, заполните все обязательные поля (Имя и Телефон)!');
      return;
    }

    if (!activeAddress && !formData.clientAddress) {
      alert('Пожалуйста, выберите или укажите адрес доставки!');
      return;
    }

    if (formData.paymentMethod === 'invoice') {
      if (!formData.companyName || !formData.companyBin) {
        alert('Пожалуйста, заполните реквизиты организации (Название и БИН/ИИН)!');
        return;
      }
      if (formData.companyBin.length !== 12 || !/^\d+$/.test(formData.companyBin)) {
        alert('БИН/ИИН должен состоять ровно из 12 цифр!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const fullAddressStr = activeAddress
        ? `г. ${activeAddress.city || 'Алматы'}, ${activeAddress.street}${activeAddress.details ? `, ${activeAddress.details}` : ''}`
        : formData.clientAddress;

      const deliveryTimeframeText = activeAddress
        ? `Доставка ~${deliveryDays} дн. (г. ${activeAddress.city || 'Алматы'})`
        : 'Доставка по согласованию';

      let finalComment = formData.comment || '';

      const orderPayload = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientAddress: fullAddressStr,
        paymentMethod: formData.paymentMethod,
        companyName: formData.paymentMethod === 'invoice' ? formData.companyName : null,
        companyBin: formData.paymentMethod === 'invoice' ? formData.companyBin : null,
        promoCode: promoPreview.valid ? appliedPromotion?.promoCode : null,
        useBonuses: bonusDiscount > 0 ? bonusDiscount : false,
        deliveryDate: deliveryTimeframeText,
        deliveryTime: 'С 09:00 до 18:00',
        comment: finalComment,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          selectedOption: item.selectedOption || null,
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

      showToast('Заказ успешно оформлен!');
      onClearCart();
      setSuccessOrder(createdOrder);
    } catch (error) {
      console.error(error);
      alert('Ошибка при оформлении заказа: ' + getFriendlyErrorMessage(error));
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
                {successOrder.paymentMethod === 'kaspi' ? 'Kaspi QR / Kaspi Red' : successOrder.paymentMethod === 'invoice' ? 'Безналичный расчет (B2B)' : 'Наличными при получении'}
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

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href={getPageHref('catalog')}
            onClick={() => {
              setSuccessOrder(null);
              onNavigate('catalog');
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] text-center"
          >
            <ShoppingBag className="h-5 w-5 text-slate-650" />
            <span>Продолжить покупки</span>
          </Link>
          <Link
            href={successOrder ? getPageHref('order-detail', successOrder.id) : '#'}
            onClick={() => {
              const orderId = successOrder.id;
              setSuccessOrder(null);
              onNavigate('order-detail', orderId);
            }}
            className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] text-center"
          >
            <span>Отслеживать заказ</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in-up text-left">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400 font-sans leading-relaxed">
          <Link 
            href={getPageHref('home')}
            onClick={() => onNavigate?.('home')} 
            className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
          >
            Главная
          </Link>
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
          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate('catalog')}
            className="bg-slate-950 hover:bg-emerald-650 text-white px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer text-center inline-flex items-center"
          >
            Перейти к каталогу товаров
          </Link>
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
                    className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:shadow-md transition-all duration-300 w-64 flex-shrink-0 group flex flex-col snap-start snap-always text-slate-800"
                  >
                    <Link
                      href={getPageHref('product', prod.id)}
                      onClick={() => onNavigate('product', prod.id)}
                      className="h-32 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden relative mb-3 block"
                    >
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
                    </Link>
                    <Link
                      href={getPageHref('product', prod.id)}
                      onClick={() => onNavigate('product', prod.id)}
                      className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[2rem] leading-snug hover:text-emerald-600 transition-colors mb-2 block"
                    >
                      {prod.name}
                    </Link>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900 font-outfit">{formatPrice(prod.price)}</span>
                      <button 
                        onClick={async () => {
                          if (onAddToCart) {
                            let itemToAdd = prod;
                            if (!prod.options) {
                              try {
                                const fullProd = await getProductById(prod.id);
                                if (fullProd) itemToAdd = fullProd;
                              } catch (e) {
                                setRecentlyViewed(prev => {
                                  const updated = prev.filter(p => String(p.id) !== String(prod.id));
                                  try {
                                    localStorage.setItem('tormag_recently_viewed', JSON.stringify(updated));
                                  } catch (err) {}
                                  return updated;
                                });
                                showToast?.('Этот товар больше не доступен');
                                return;
                              }
                            }
                            onAddToCart(itemToAdd);
                            showToast?.(`«${itemToAdd.name}» добавлен в корзину`);
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
        <Link 
          href={getPageHref('home')}
          onClick={() => onNavigate?.('home')} 
          className="hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-550"
        >
          Главная
        </Link>
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
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="h-7 w-7 text-emerald-600 shrink-0" />
              <h1 className="text-2xl font-black text-slate-950 flex-1 leading-tight">Корзина покупок</h1>
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold shrink-0">
                {cartItemsCount} шт
              </span>
            </div>



            {/* List */}
            <ul className="divide-y divide-slate-100">
              {cart.map((item) => (
                <li
                  key={`${item.id}-${item.selectedOption || ''}`}
                  className="flex gap-4 sm:gap-6 py-6 first:pt-0 last:pb-0 relative group"
                >
                  <Link
                    href={getPageHref('product', item.id)}
                    onClick={() => onNavigate('product', item.id)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-emerald-500/30 transition-all"
                  >
                    <img
                      src={item.image || '/tormag.png'}
                      alt={item.name}
                      className="w-3/4 h-3/4 object-contain mix-blend-multiply"
                      onError={(event) => {
                        event.target.onerror = null;
                        event.target.src = '/tormag.png';
                      }}
                    />
                  </Link>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={getPageHref('product', item.id)}
                          onClick={() => onNavigate('product', item.id)}
                          className="hover:text-emerald-700 transition-colors cursor-pointer text-left block"
                        >
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-tight">
                            {item.name}
                          </h3>
                        </Link>
                        {item.selectedOption && (
                          <div className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block mt-1">
                            Вариант: {item.selectedOption}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id, item.selectedOption)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer mt-0.5"
                        title="Удалить из корзины"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> {item.supplier?.name || 'Официальный склад'}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-2 border-t border-slate-50">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1, false, item.selectedOption)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <QuantityInput
                          value={item.quantity}
                          onChange={(val) => onUpdateQuantity(item.id, val, true, item.selectedOption)}
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1, false, item.selectedOption)}
                          className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right ml-auto shrink-0">
                        <span className="text-sm sm:text-base font-black text-slate-900 font-outfit block">
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
                <Link
                  href={getPageHref('catalog')}
                  onClick={() => onNavigate?.('catalog')}
                  className="px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer bg-transparent border-0 text-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Продолжить покупки
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (!customer) {
                      onOpenAuth?.();
                    } else {
                      setStep('checkout');
                      onNavigate?.('checkout');
                    }
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold py-3.5 px-7 rounded-2xl shadow-md shadow-slate-950/20 transition-all flex items-center gap-2 transform active:scale-95 text-sm cursor-pointer"
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
                onClick={() => {
                  setStep('cart');
                  onNavigate?.('cart');
                }}
                className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-550 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer bg-transparent border-0 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Вернуться к корзине
              </button>

              <h2 className="text-xl font-black text-slate-950 mb-6 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
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
                  className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Войти или зарегистрироваться
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-8">
                
                {/* Шаг 1: Адрес доставки */}
                <div className="space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">1</span>
                    Адрес
                  </h3>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-700">Адрес доставки (магазин):</span>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      Добавить новый адрес
                    </button>
                  </div>

                  {/* List of user addresses */}
                  {userAddresses.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                      <MapPin className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">У вас пока нет сохраненных адресов</p>
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Указать адрес доставки
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                      {userAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className="py-3.5 flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-950 bg-slate-950 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white group-hover:border-slate-400" />
                                )}
                              </div>
                              <div className="text-left space-y-0.5 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {addr.city ? `${addr.city}, ` : ''}{addr.street}
                                </p>
                                {addr.details && (
                                  <p className="text-xs font-normal text-slate-500 truncate">
                                    {addr.details}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title={addr.isDefault ? "Основной адрес" : "Сделать основным"}
                              >
                                <Star className={`w-4 h-4 ${addr.isDefault ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600'}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditAddress(addr)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Редактировать"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dynamic delivery duration banner calculated from city delivery settings */}
                  {activeAddress && (
                    <div className="mt-4 bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 text-slate-900 animate-fade-in">
                      <div className="p-2.5 bg-slate-200 text-slate-900 rounded-xl shrink-0">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5 text-xs text-left">
                        <div className="font-extrabold uppercase tracking-wider text-[10px] text-slate-600">
                          РАСЧЕТНЫЙ СРОК ДОСТАВКИ В Г. {(activeAddress.city || 'Алматы').toUpperCase()}
                        </div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          ~ {deliveryDays} {deliveryDays === 1 ? 'день' : deliveryDays < 5 ? 'дня' : 'дней'} (по индивидуальному графику для вашего города)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Шаг 2: Данные получателя */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">2</span>
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
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-950 transition-all text-sm outline-none font-semibold text-slate-900"
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
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-950 transition-all text-sm outline-none font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Шаг 3: Комментарий к заказу */}
                <div className="border-t border-slate-100 pt-6 space-y-3 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">3</span>
                    Комментарий к заказу
                  </h3>
                  <textarea
                    name="comment"
                    value={formData.comment || ''}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Например: позвонить за час до доставки, кодовый замок..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-950 transition-all text-sm outline-none resize-none font-semibold text-slate-900"
                  />
                </div>

                {/* Шаг 4: Состав заказа */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">4</span>
                    Состав заказа ({cart.length})
                  </h3>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-4">Наименование</th>
                          <th className="py-3.5 px-4">Артикул</th>
                          <th className="py-3.5 px-4 text-center">Кол-во</th>
                          <th className="py-3.5 px-4 text-right">Цена</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cart.map((item, idx) => {
                          const sku = item.article || item.product?.article || item.product?.sku || item.sku || `ART-${item.id}`;
                          return (
                            <tr key={`${item.id}_${item.selectedOption || 'def'}_${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  {item.image && (
                                    <img src={item.image} alt={item.title} className="w-10 h-10 object-contain rounded-lg border border-slate-100 bg-slate-50 shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-900 line-clamp-2">{item.title}</span>
                                    {item.selectedOption && (
                                      <span className="inline-block text-[10px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                                        Вариант: {item.selectedOption}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">
                                {sku}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800">
                                {item.quantity} шт
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 font-outfit">
                                {formatPrice(item.price * item.quantity)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Шаг 5: Скидки и Бонусы */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">5</span>
                    Скидка и бонусы
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bonuses input */}
                    {customer && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-center min-h-[120px] shadow-sm">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Списать бонусы (до {maxBonusPaymentPercent}%)</label>
                          <span className="text-[10px] font-bold text-slate-500">Доступно: {formatPrice(availableBonusPoints)}</span>
                        </div>
                        {appliedBonuses > 0 ? (
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center justify-between text-xs h-[46px]">
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
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Убрать
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
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
                                  const maxAllowed = Math.floor(finalTotalBeforeBonuses * (maxBonusPaymentPercent / 100));
                                  const num = Math.min(availableBonusPoints, maxAllowed, parseInt(val) || 0);
                                  setBonusInput(num.toString());
                                }
                              }}
                              placeholder="Количество бонусов"
                              className="w-full min-w-0 flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-slate-950 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const amt = parseInt(bonusInput) || 0;
                                if (amt > 0) {
                                  setAppliedBonuses(amt);
                                  showToast?.(`Списано ${amt} бонусов`);
                                }
                              }}
                              disabled={!bonusInput || parseInt(bonusInput) <= 0}
                              className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                            >
                              Использовать
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Promo input */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-center min-h-[120px] shadow-sm">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Промокод на скидку</label>
                      {appliedPromotion ? (
                        <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 flex items-center justify-between text-xs h-[46px]">
                          <div>
                            <span className="font-bold text-slate-900 truncate max-w-[120px] block">{appliedPromotion.title}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">Код: {appliedPromotion.promoCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromoCode}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Убрать
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="TORMAG10"
                            className="w-full min-w-0 flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-slate-950 transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            disabled={promoLoading}
                            className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                          >
                            {promoLoading ? '...' : 'Использовать'}
                          </button>
                        </div>
                      )}
                      {promoError && <p className="text-[11px] text-rose-600 font-semibold">{promoError}</p>}
                    </div>
                  </div>
                </div>

                {/* Шаг 6: Оплата */}
                <div className="border-t border-slate-100 pt-6 space-y-3 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">6</span>
                    Оплата
                  </h3>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-950 transition-all text-sm outline-none font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Наличными при получении</option>
                    <option value="kaspi">Kaspi QR / Kaspi Red (курьеру при получении)</option>
                    <option value="invoice">Безналичный расчет (B2B юр. лица - ТОО/ИП)</option>
                  </select>

                  {formData.paymentMethod === 'invoice' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fade-in mt-3">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Реквизиты организации для выставления счета</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1">Наименование компании (ТОО / ИП) *</label>
                          <input
                            type="text"
                            name="companyName"
                            value={formData.companyName || ''}
                            onChange={handleInputChange}
                            required={formData.paymentMethod === 'invoice'}
                            placeholder="ТОО СтройСервис"
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-slate-950 transition-all text-xs outline-none font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-1">БИН / ИИН (12 цифр) *</label>
                          <input
                            type="text"
                            name="companyBin"
                            value={formData.companyBin || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                              setFormData(prev => ({ ...prev, companyBin: val }));
                            }}
                            required={formData.paymentMethod === 'invoice'}
                            placeholder="123456789012"
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-slate-950 transition-all text-xs outline-none font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Шаг 7: Детали заказа */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0 shadow-xs">7</span>
                    Детали заказа
                  </h3>

                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Товары ({cartItemsCount})</span>
                        <span>{formatPrice(cartTotal)}</span>
                      </div>
                      {promoPreview.valid && (
                        <div className="flex justify-between text-slate-900 font-semibold">
                          <span>Скидка по промокоду</span>
                          <span>- {formatPrice(promoPreview.discountAmount)}</span>
                        </div>
                      )}
                      {bonusDiscount > 0 && (
                        <div className="flex justify-between text-slate-900 font-semibold">
                          <span>Списание бонусов</span>
                          <span>- {formatPrice(bonusDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Доставка</span>
                        <span className={cartTotal >= FREE_DELIVERY_THRESHOLD ? 'text-slate-900 font-bold' : 'font-semibold'}>
                          {cartTotal >= FREE_DELIVERY_THRESHOLD ? 'Бесплатно' : 'По тарифам складов'}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-250 flex justify-between items-end">
                        <span className="text-base font-bold text-slate-900">Итого к оплате:</span>
                        <div className="text-right">
                          {(promoPreview.valid || bonusDiscount > 0) && (
                            <span className="block text-xs text-slate-400 line-through mb-0.5">{formatPrice(cartTotal)}</span>
                          )}
                          <span className="text-2xl font-black text-slate-950 font-outfit">{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Подтверждение оферты и кнопка "Оформить заказ" */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms || false}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }));
                        if (e.target.checked) setTermsError(false);
                      }}
                      className="mt-1 h-4 w-4 text-slate-950 border-slate-300 rounded focus:ring-slate-950 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed font-semibold">
                      Я согласен с <button type="button" onClick={() => onNavigate('legal')} className="text-slate-950 hover:underline font-bold bg-transparent border-0 p-0 inline cursor-pointer">условиями публичной оферты</button> и обработки персональных данных *
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
                    className="w-full bg-slate-950 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-transparent text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-slate-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-outfit cursor-pointer mt-4"
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


      {/* Fullscreen modal to quick add new address during checkout */}
      {showAddAddressModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative border border-slate-100 my-auto text-left">
            <button
              type="button"
              onClick={() => setShowAddAddressModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <MapPin className="h-6 w-6 text-[#1b5fc1] shrink-0" />
              <h3 className="text-lg font-black text-slate-900 font-outfit">
                {editingAddrId ? 'Редактировать адрес' : 'Добавить новый адрес'}
              </h3>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Interactive Map */}
                <div className="space-y-2">
                  <AddressMapPicker
                    initialCity={newAddrForm.city || 'Алматы'}
                    initialStreet={newAddrForm.street || ''}
                    onSelectAddress={({ city, street }) => {
                      setNewAddrForm(f => ({
                        ...f,
                        city: city || f.city,
                        street: street || ''
                      }));
                    }}
                  />
                </div>

                {/* Right Column: Inputs & Form Controls */}
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Город *</label>
                      <input
                        type="text"
                        list="city-options-list-cart-modal"
                        value={newAddrForm.city}
                        onChange={e => setNewAddrForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="Алматы"
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#1b5fc1]"
                      />
                      <datalist id="city-options-list-cart-modal">
                        {KAZAKHSTAN_CITIES.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Улица и дом *</label>
                      <input
                        type="text"
                        value={newAddrForm.street}
                        onChange={e => setNewAddrForm(f => ({ ...f, street: e.target.value }))}
                        placeholder="пр. Абая, д. 150"
                        required
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#1b5fc1]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Квартира / офис / комментарий</label>
                      <input
                        type="text"
                        value={newAddrForm.details}
                        onChange={e => setNewAddrForm(f => ({ ...f, details: e.target.value }))}
                        placeholder="кв. 42, 5 этаж, код 123"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#1b5fc1]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="modalIsDefaultCheck"
                        checked={newAddrForm.isDefault}
                        onChange={e => setNewAddrForm(f => ({ ...f, isDefault: e.target.checked }))}
                        className="h-4 w-4 text-[#1b5fc1] rounded border-slate-300 focus:ring-[#1b5fc1] cursor-pointer"
                      />
                      <label htmlFor="modalIsDefaultCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Сделать основным адресом
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={savingNewAddr}
                      className="flex-1 py-3.5 bg-slate-950 hover:bg-[#1b5fc1] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                    >
                      {savingNewAddr ? 'Сохранение...' : 'Сохранить и выбрать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressModal(false)}
                      className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      </div>
    </div>
  );
}
