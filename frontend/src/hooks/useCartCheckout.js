import { useState, useEffect, useMemo } from 'react';
import {
  createOrder,
  validatePromotionCode,
  getSystemSettings,
  updateProfile,
} from '../services/api';
import { trackEvent } from '../utils/analytics';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

const FREE_DELIVERY_THRESHOLD = 150000;

export function useCartCheckout({
  cart,
  customer,
  bonuses,
  showToast,
  onCustomerUpdate,
  onClearCart,
  onOpenAuth,
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
  const [appliedBonuses, setAppliedBonuses] = useState(0);

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
  const [successOrder, setSuccessOrder] = useState(null);

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

  const deliveryDays = useMemo(() => {
    if (!activeAddress) return 1;
    const city = activeAddress.city || 'Алматы';
    const routes = systemSettings?.deliveryRoutes || [];
    const matched = routes.find(r => r.to?.toLowerCase() === city.toLowerCase());
    return matched?.days ?? 1;
  }, [activeAddress, systemSettings]);

  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        clientName: customer.name || '',
        clientPhone: customer.phone || '',
      }));
      bonuses?.fetchSummary?.();
    } else {
      setAppliedBonuses(0);
    }
  }, [customer]);

  const availableBonusPoints = bonuses?.availableBalance ?? 0;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyPromoCode = async (promotionItems, cartTotal) => {
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

  const handleRemovePromoCode = (cartTotal) => {
    setAppliedPromotion(null);
    setPromoCode('');
    setPromoError('');
    setPromoPreview({ valid: false, discountAmount: 0, totalAmount: cartTotal });
  };

  const handleCheckoutSubmit = async (event, selectedCartItems, finalTotal, cartItemsCount, bonusDiscount) => {
    if (event && event.preventDefault) event.preventDefault();
    if (!customer) {
      onOpenAuth?.();
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
        comment: formData.comment || null,
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

      showToast?.('Заказ успешно оформлен!');
      onClearCart?.();
      setSuccessOrder(createdOrder);
    } catch (error) {
      console.error(error);
      alert('Ошибка при оформлении заказа: ' + getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    promoCode,
    setPromoCode,
    promoError,
    promoLoading,
    appliedPromotion,
    promoPreview,
    appliedBonuses,
    setAppliedBonuses,
    availableBonusPoints,
    selectedAddressId,
    setSelectedAddressId,
    userAddresses,
    activeAddress,
    deliveryDays,
    showAddAddressModal,
    setShowAddAddressModal,
    editingAddrId,
    newAddrForm,
    setNewAddrForm,
    savingNewAddr,
    successOrder,
    setSuccessOrder,
    handleInputChange,
    handleApplyPromoCode,
    handleRemovePromoCode,
    handleCheckoutSubmit,
  };
}
