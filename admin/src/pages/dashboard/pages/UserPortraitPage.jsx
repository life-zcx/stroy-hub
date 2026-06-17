import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Award as AwardIcon,
  Coins as CoinsIcon,
  X as XIcon,
  Activity as ActivityIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Trash2 as Trash2Icon,
  ShoppingBag as ShoppingBagIcon,
  BarChart3 as BarChart3Icon,
  Loader2 as Loader2Icon,
  Sparkles as SparklesIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  Clock as ClockIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Edit as EditIcon,
  ShieldAlert as ShieldAlertIcon
} from 'lucide-react';
import { 
  getUserPortrait, 
  adjustUserBonuses,
  addUserCartItem,
  updateUserCartItem,
  removeUserCartItem,
  clearUserCart,
  getProducts,
  updateUser,
  updateUserBlockStatus,
  getSuppliers,
  getOrderById
} from '../../../services/api';

export default function UserPortraitPage({ userId, onBack, showToast }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs state
  const [activeTab, setActiveTab] = useState('overview'); // overview, cart, orders, behavior

  // Bonus Adjustment Form
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustBusy, setAdjustBusy] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState('');

  // Cart Editor State
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  
  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addQuantities, setAddQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);

  // Block Status State
  const [blockBusy, setBlockBusy] = useState(false);

  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [suppliersList, setSuppliersList] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Quick Order View States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  const fetchPortrait = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getUserPortrait(userId);
      setData(res);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить портрет пользователя: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPortrait();
    }
  }, [userId]);

  const handleToggleBlock = async () => {
    if (!data?.user) return;
    const nextStatus = !data.user.isBlocked;
    const confirmMsg = nextStatus 
      ? `Вы действительно хотите ЗАБЛОКИРОВАТЬ пользователя ${data.user.name || ''}?`
      : `Разблокировать пользователя ${data.user.name || ''}?`;
      
    if (!window.confirm(confirmMsg)) return;

    setBlockBusy(true);
    try {
      await updateUserBlockStatus(userId, nextStatus);
      showToast?.(nextStatus ? '🔒 Пользователь заблокирован' : '🔓 Пользователь разблокирован');
      await fetchPortrait();
    } catch (err) {
      console.error(err);
      showToast?.('❌ Ошибка смены статуса блокировки: ' + (err.response?.data?.error || err.message));
    } finally {
      setBlockBusy(false);
    }
  };

  const handleOpenEditModal = async () => {
    if (!data?.user) return;
    setEditName(data.user.name || '');
    setEditEmail(data.user.email || '');
    setEditPhone(data.user.phone || '');
    setEditAddress(data.user.address || '');
    
    // Find supplierId if suppliersList is already populated
    const matchedSupplier = suppliersList.find(s => s.name === data.user.supplierName);
    setEditSupplierId(matchedSupplier ? matchedSupplier.id : '');

    setEditError('');
    setIsEditModalOpen(true);

    try {
      const sups = await getSuppliers();
      setSuppliersList(sups);
      if (data.user.supplierName) {
        const found = sups.find(s => s.name === data.user.supplierName);
        if (found) setEditSupplierId(found.id);
      }
    } catch (err) {
      console.error("Failed to load suppliers list", err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSaving(true);

    try {
      await updateUser(userId, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        supplierId: editSupplierId ? parseInt(editSupplierId, 10) : null
      });
      
      showToast?.('✅ Профиль пользователя успешно обновлен');
      setIsEditModalOpen(false);
      await fetchPortrait();
    } catch (err) {
      setEditError(err.response?.data?.error || err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenOrderDetails = async (orderId) => {
    setLoadingOrderDetails(true);
    setSelectedOrder(null);
    setOrderModalOpen(true);
    try {
      const orderData = await getOrderById(orderId);
      setSelectedOrder(orderData);
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось загрузить состав заказа: ' + (err.response?.data?.error || err.message));
      setOrderModalOpen(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Search products when query or tab changes
  useEffect(() => {
    let active = true;
    if (activeTab === 'cart') {
      const timer = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await getProducts({ search: searchQuery, limit: 8 });
          if (active) {
            setSearchResults(res);
          }
        } catch (err) {
          console.error("Failed to load products for search", err);
        } finally {
          if (active) setSearchLoading(false);
        }
      }, 300); // 300ms debounce
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [activeTab, searchQuery]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccessMsg('');
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt === 0) {
      setAdjustError('Введите корректное число бонусов');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Укажите причину корректировки');
      return;
    }

    setAdjustBusy(true);
    try {
      const res = await adjustUserBonuses(userId, amt, adjustReason);
      setAdjustSuccessMsg(res.message || 'Баланс успешно изменен');
      setAdjustAmount('');
      setAdjustReason('');
      if (showToast) {
        showToast('✅ Баланс бонусов пользователя успешно скорректирован!');
      }
      // Reload details
      const updated = await getUserPortrait(userId);
      setData(updated);
    } catch (err) {
      setAdjustError(err.response?.data?.error || err.message);
    } finally {
      setAdjustBusy(false);
    }
  };

  // Cart Operations
  const handleQuantityChange = async (productId, currentQty, direction) => {
    const newQty = direction === 'up' ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;
    
    setUpdatingItemId(productId);
    try {
      const updatedCart = await updateUserCartItem(userId, productId, newQty);
      setData(prev => ({ ...prev, cart: updatedCart }));
      showToast?.('✅ Количество товара изменено');
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось изменить количество: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleManualQuantity = async (productId, value) => {
    const newQty = parseInt(value, 10);
    if (isNaN(newQty) || newQty < 1) return;

    setUpdatingItemId(productId);
    try {
      const updatedCart = await updateUserCartItem(userId, productId, newQty);
      setData(prev => ({ ...prev, cart: updatedCart }));
      showToast?.('✅ Количество товара обновлено');
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось обновить количество: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdatingItemId(productId);
    try {
      const updatedCart = await removeUserCartItem(userId, productId);
      setData(prev => ({ ...prev, cart: updatedCart }));
      showToast?.('🗑️ Товар удален из корзины клиента');
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось удалить товар: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Вы уверены, что хотите полностью очистить корзину клиента?')) {
      return;
    }
    setClearingCart(true);
    try {
      await clearUserCart(userId);
      setData(prev => ({ ...prev, cart: [] }));
      showToast?.('🗑️ Корзина клиента очищена');
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось очистить корзину: ' + (err.response?.data?.error || err.message));
    } finally {
      setClearingCart(false);
    }
  };

  const handleAddItem = async (productId) => {
    const qty = addQuantities[productId] || 1;
    setAddingProductId(productId);
    try {
      const updatedCart = await addUserCartItem(userId, productId, qty);
      setData(prev => ({ ...prev, cart: updatedCart }));
      showToast?.('✅ Товар добавлен в корзину покупателя');
      setAddQuantities(prev => ({ ...prev, [productId]: 1 }));
    } catch (err) {
      console.error(err);
      showToast?.('❌ Не удалось добавить товар: ' + (err.response?.data?.error || err.message));
    } finally {
      setAddingProductId(null);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Выполнен</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Отменен</span>;
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ожидает</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">В обработке</span>;
      case 'shipped':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Отгружен</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{status}</span>;
    }
  };

  const cartTotalAmount = useMemo(() => {
    if (!data?.cart) return 0;
    return data.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [data?.cart]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3 min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Загрузка портрета пользователя...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Назад к списку
        </button>
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          {error || 'Не удалось найти указанного пользователя.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header / Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Назад к списку пользователей"
          >
            <ArrowLeftIcon className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 font-outfit">
                Портрет пользователя: {data.user.name || 'Без имени'}
              </h2>
              {data.user.isBlocked ? (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <LockIcon className="w-3.5 h-3.5" />
                  Заблокирован
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <UnlockIcon className="w-3.5 h-3.5" />
                  Активен
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Email: {data.user.email} • ID: {data.user.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBlock}
            disabled={blockBusy}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              data.user.isBlocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {blockBusy ? (
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
            ) : data.user.isBlocked ? (
              <>
                <UnlockIcon className="w-3.5 h-3.5" />
                Разблокировать
              </>
            ) : (
              <>
                <LockIcon className="w-3.5 h-3.5" />
                Заблокировать
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Tab Menu */}
      <div className="flex border border-slate-200/60 bg-slate-100 bg-slate-100/50 p-1 rounded-xl w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          Профиль & Лояльность
        </button>
        
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
            activeTab === 'cart'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBagIcon className="w-3.5 h-3.5" />
          Редактор корзины
          {data.cart?.length > 0 && (
            <span className="ml-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
              {data.cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3Icon className="w-3.5 h-3.5" />
          История заказов
          {data.recentOrders?.length > 0 && (
            <span className="ml-1 bg-slate-200 text-slate-800 text-[9px] px-1.5 py-0.5 rounded-full font-black">
              {data.recentOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'behavior'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ActivityIcon className="w-3.5 h-3.5" />
          Активность на сайте (CRM)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white/40 min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Info Columns */}
            <div className="space-y-6">
              {/* Profile details */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Основная информация</h4>
                  <button
                    onClick={handleOpenEditModal}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <EditIcon className="w-3 h-3" />
                    Редактировать
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <MailIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                      <p className="text-sm text-slate-800 font-medium break-all">{data.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <PhoneIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Телефон</p>
                      <p className="text-sm text-slate-800 font-medium">{data.user.phone || 'Не указан'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Адрес доставки</p>
                      <p className="text-sm text-slate-800 font-medium">{data.user.address || 'Не указан'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CalendarIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Зарегистрирован</p>
                      <p className="text-sm text-slate-800 font-medium">
                        {new Date(data.user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {data.user.supplierName && (
                    <div className="flex items-start gap-2.5">
                      <ActivityIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Привязан к складу</p>
                        <p className="text-sm text-slate-800 font-bold">{data.user.supplierName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase statistics */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Аналитика покупок</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-b border-slate-100 pb-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Всего заказов</p>
                    <p className="text-lg font-black text-slate-900 font-outfit mt-1">{data.stats.totalOrders}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                      ({data.stats.completedOrders} вып. • {data.stats.cancelledOrders} отм.)
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Сумма покупок</p>
                    <p className="text-lg font-black text-slate-950 font-outfit mt-1 text-slate-900">
                      {data.stats.totalSpent.toLocaleString('ru-RU')} ₸
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Средний чек</p>
                    <p className="text-lg font-black text-slate-900 font-outfit mt-1">
                      {data.stats.avgOrderValue.toLocaleString('ru-RU')} ₸
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Оплата чаще всего</p>
                    <p className="text-xs font-bold text-slate-700 mt-2 truncate" title={data.stats.favoritePaymentMethod}>
                      {data.stats.favoritePaymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Loyalty, Adjustments Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loyalty Progress */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Программа лояльности</h4>
                  <span className="flex items-center gap-1 text-[11px] font-black text-slate-900 uppercase bg-slate-100 px-2.5 py-0.5 rounded-full">
                    <AwardIcon className="w-3.5 h-3.5" />
                    {data.loyalty.levelName}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-medium text-slate-600">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Бонус на обычные товары</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.baseCashbackPercent}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Бонус на крупные покупки (&gt;1 млн ₸)</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.highValueCashback}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Лимит оплаты бонусами</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">До {data.loyalty.maxBonusPaymentPercent}% заказа</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Потрачено в этом году</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">{data.loyalty.totalSpentThisYear.toLocaleString('ru-RU')} ₸</p>
                  </div>
                </div>

                {data.loyalty.nextLevel && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Прогресс до уровня «{data.loyalty.nextLevelName}»</span>
                      <span className="text-slate-700">{data.loyalty.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${data.loyalty.progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold text-right">
                      Нужно совершить покупок еще на {data.loyalty.neededToNextLevel.toLocaleString('ru-RU')} ₸
                    </p>
                  </div>
                )}
              </div>

              {/* Bonus Transactions History */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1">
                  <CoinsIcon className="w-3.5 h-3.5 text-amber-500" />
                  История бонусных транзакций
                </h4>
                {!data.bonusTransactions || data.bonusTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-4 text-center">Транзакции по бонусам отсутствуют.</p>
                ) : (
                  <div className="overflow-x-auto max-h-[300px] border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="px-3 py-2">Тип</th>
                          <th className="px-3 py-2">Сумма</th>
                          <th className="px-3 py-2">Описание</th>
                          <th className="px-3 py-2">Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bonusTransactions.map((tx) => {
                          let typeBadge;
                          switch (tx.type) {
                            case 'earned':
                              typeBadge = <span className="text-emerald-700 font-bold">Начисление</span>;
                              break;
                            case 'spent':
                              typeBadge = <span className="text-rose-700 font-bold">Списание</span>;
                              break;
                            case 'manual':
                              typeBadge = <span className="text-amber-700 font-bold">Корректировка</span>;
                              break;
                            case 'cancelled':
                              typeBadge = <span className="text-slate-500 font-bold">Отмена</span>;
                              break;
                            default:
                              typeBadge = <span className="text-slate-700 font-bold">{tx.type}</span>;
                          }

                          let amountColor = tx.type === 'spent' ? 'text-rose-600' : 'text-emerald-600';
                          let amountPrefix = tx.type === 'spent' ? '-' : '+';

                          return (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="px-3 py-2">{typeBadge}</td>
                              <td className={`px-3 py-2 font-mono font-bold ${amountColor}`}>
                                {amountPrefix}{Math.abs(tx.amount).toLocaleString('ru-RU')} ₸
                              </td>
                              <td className="px-3 py-2 text-slate-650 max-w-[200px] truncate" title={tx.description || ''}>
                                {tx.description || (tx.orderId ? `Заказ #${tx.orderId}` : '—')}
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bonus Balance & Manual adjustment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats cards */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Бонусный баланс</h4>
                  
                  <div className="grid grid-cols-2 gap-4 flex-1 mt-2">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Доступно</p>
                      <p className="text-2xl font-black text-emerald-600 font-outfit mt-1 flex items-center gap-1">
                        {data.bonuses.available.toLocaleString('ru-RU')}
                        <span className="text-xs font-semibold">₸</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Ожидают начисления</p>
                      <p className="text-2xl font-black text-slate-400 font-outfit mt-1 flex items-center gap-1">
                        {data.bonuses.pending.toLocaleString('ru-RU')}
                        <span className="text-xs font-semibold">₸</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Всего начислено</p>
                      <p className="text-sm font-extrabold text-slate-700 mt-1">
                        {data.bonuses.totalEarned.toLocaleString('ru-RU')} ₸
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Всего потрачено</p>
                      <p className="text-sm font-extrabold text-slate-700 mt-1">
                        {data.bonuses.totalSpent.toLocaleString('ru-RU')} ₸
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual adjustment form */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                    <CoinsIcon className="w-4 h-4 text-amber-500" />
                    Корректировка бонусов
                  </h4>

                  <form onSubmit={handleAdjust} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Сумма (положительная или отрицательная)</label>
                      <input
                        type="number"
                        placeholder="Пример: 1500 или -500"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-slate-800 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Причина начисления / списания</label>
                      <input
                        type="text"
                        placeholder="Пример: Премия B2B клиенту"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-slate-800 focus:outline-none"
                        required
                      />
                    </div>

                    {adjustError && (
                      <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
                        {adjustError}
                      </div>
                    )}

                    {adjustSuccessMsg && (
                      <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                        {adjustSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={adjustBusy}
                      className="w-full flex items-center justify-center gap-1 py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-60 transition-colors"
                    >
                      Применить корректировку
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Active Cart Editor */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBagIcon className="w-4 h-4 text-slate-500" />
                  Текущая корзина покупателя
                </h4>
                {data.cart && data.cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    disabled={clearingCart}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {clearingCart ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <Trash2Icon className="w-3.5 h-3.5" />}
                    Очистить корзину
                  </button>
                )}
              </div>

              {!data.cart || data.cart.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <ShoppingBagIcon className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-sm font-semibold">Корзина клиента в данный момент пуста.</p>
                  <p className="text-xs">Используйте поиск справа, чтобы добавить товары.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="px-4 py-3">Товар</th>
                          <th className="px-4 py-3">Цена за ед.</th>
                          <th className="px-4 py-3 text-center w-32">Кол-во</th>
                          <th className="px-4 py-3">Итого</th>
                          <th className="px-4 py-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.cart.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {item.image ? <img src={item.image} alt={item.name} className="object-cover w-full h-full" /> : <span>📦</span>}
                              </div>
                              <span className="truncate max-w-[220px]" title={item.name}>{item.name}</span>
                            </td>
                            
                            <td className="px-4 py-3 text-slate-500 font-bold">
                              {item.price.toLocaleString('ru-RU')} ₸
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center border border-slate-200 rounded-xl px-1.5 py-1 w-fit mx-auto bg-slate-50">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity, 'down')}
                                  disabled={item.quantity <= 1 || updatingItemId === item.id}
                                  className="p-1 hover:bg-white rounded-lg text-slate-600 disabled:opacity-40 transition-colors"
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </button>
                                
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleManualQuantity(item.id, e.target.value)}
                                  disabled={updatingItemId === item.id}
                                  className="w-10 text-center bg-transparent border-0 text-xs font-black text-slate-800 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />

                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity, 'up')}
                                  disabled={updatingItemId === item.id}
                                  className="p-1 hover:bg-white rounded-lg text-slate-650 disabled:opacity-40 transition-colors"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-3 font-black text-slate-900 font-mono">
                              {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={updatingItemId === item.id}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Удалить из корзины"
                              >
                                {updatingItemId === item.id ? (
                                  <Loader2Icon className="w-4 h-4 animate-spin text-slate-400" />
                                ) : (
                                  <Trash2Icon className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex-wrap gap-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Всего позиций: <strong className="text-slate-800 font-bold">{data.cart.length}</strong> (кол-во товаров: <strong className="text-slate-800 font-bold">{data.cart.reduce((s,i)=>s+i.quantity,0)}</strong>)
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      Итого сумма корзины:
                      <strong className="text-lg font-black text-slate-950 font-outfit text-blue-600">
                        {cartTotalAmount.toLocaleString('ru-RU')} ₸
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog Search & Add Panel */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <SearchIcon className="w-4 h-4 text-slate-500" />
                Добавить товар в корзину
              </h4>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию или категории..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 focus:border-slate-800 focus:outline-none"
                />
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-[10px]" />
              </div>

              {/* Scrollable Results List */}
              <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-2 min-h-[200px]">
                {searchLoading ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2Icon className="w-6 h-6 animate-spin text-slate-400" />
                    <span className="text-xs font-semibold">Ищем товары...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center font-medium">Товары не найдены по запросу.</p>
                ) : (
                  searchResults.map((product) => {
                    const inlineQty = addQuantities[product.id] || 1;
                    return (
                      <div 
                        key={product.id} 
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex gap-2 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded bg-white border border-slate-200/50 overflow-hidden flex items-center justify-center shrink-0">
                            {product.image ? <img src={product.image} alt={product.name} className="object-cover w-full h-full" /> : <span>📦</span>}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold text-slate-800 truncate leading-tight" title={product.name}>
                              {product.name}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-bold mt-0.5">
                              {product.price.toLocaleString('ru-RU')} ₸ / {product.category || 'Строительный'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 mt-1 sm:mt-0">
                          {/* Qty field */}
                          <input
                            type="number"
                            min="1"
                            value={inlineQty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              setAddQuantities(prev => ({ ...prev, [product.id]: v }));
                            }}
                            className="w-12 text-center py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                          />
                          <button
                            onClick={() => handleAddItem(product.id)}
                            disabled={addingProductId === product.id}
                            className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-lg transition-colors text-[10px] font-black uppercase flex items-center justify-center"
                            title="Добавить в корзину"
                          >
                            {addingProductId === product.id ? (
                              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlusIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">История заказов в системе</h4>
            {data.recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-8">Этот пользователь еще не совершал заказов.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-3">Заказ</th>
                      <th className="px-4 py-3">Дата создания</th>
                      <th className="px-4 py-3">Сумма заказа</th>
                      <th className="px-4 py-3">Тип оплаты</th>
                      <th className="px-4 py-3 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenOrderDetails(order.id)}
                            className="font-black text-blue-600 hover:text-blue-850 hover:underline font-outfit cursor-pointer bg-transparent border-0 p-0 text-left focus:outline-none"
                          >
                            #{order.id}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')} в {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {order.totalAmount.toLocaleString('ru-RU')} ₸
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{order.paymentMethod}</td>
                        <td className="px-4 py-3 text-center">{getOrderStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Recently Viewed Products */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <ActivityIcon className="w-4 h-4 text-indigo-500" />
                История просмотров товаров (CRM)
              </h4>
              {!data.recentlyViewed || data.recentlyViewed.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-8 text-center">Нет просмотров товаров.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-1">
                  {data.recentlyViewed.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs text-slate-400">📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-extrabold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                          {item.price.toLocaleString('ru-RU')} ₸
                        </span>
                        <span className="block text-[8px] text-slate-400 mt-0.5 leading-none font-semibold">
                          {new Date(item.viewedAt).toLocaleDateString('ru-RU')} {new Date(item.viewedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Search Queries */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <SearchIcon className="w-4 h-4 text-blue-500" />
                Что искал клиент на сайте
              </h4>
              {!data.recentSearches || data.recentSearches.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-8 text-center">Клиент еще ничего не искал.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {data.recentSearches.map((item, idx) => (
                    <div key={idx} className="bg-slate-55 border border-slate-200/60 rounded-xl px-4 py-2 flex flex-col hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-black text-slate-900">«{item.query}»</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-slate-400" />
                        {new Date(item.searchedAt).toLocaleDateString('ru-RU')} {new Date(item.searchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-scale-up z-10">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit">Редактирование профиля</h3>
                <p className="text-xs text-slate-400 mt-1">Изменение личных данных и привязки к складу</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">ФИО клиента</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:border-slate-950 focus:outline-none"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">Email адрес</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:border-slate-950 focus:outline-none"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">Номер телефона</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:border-slate-950 focus:outline-none"
                  placeholder="+7 (707) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">Адрес доставки по умолчанию</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:border-slate-950 focus:outline-none"
                  placeholder="г. Алматы, ул. Абая, 10"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400">Привязка к складу (Поставщик)</label>
                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold focus:border-slate-950 focus:outline-none bg-white"
                >
                  <option value="">Не выбран (клиент покупает с общего каталога)</option>
                  {suppliersList.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {editError && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  {editSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Order Details Modal */}
      {orderModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setOrderModalOpen(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-scale-up z-10">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-outfit">Детали заказа #{selectedOrder?.id || ''}</h3>
                <p className="text-xs text-slate-400 mt-1">Просмотр состава и информации о доставке</p>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {loadingOrderDetails ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3 min-h-[300px] ">
                <Loader2Icon className="w-8 h-8 animate-spin text-slate-900" />
                <p className="text-sm font-semibold">Загрузка состава заказа...</p>
              </div>
            ) : !selectedOrder ? (
              <div className="p-8 text-center text-slate-500">
                Не удалось загрузить данные заказа.
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                {/* Order Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl text-xs font-semibold text-slate-650">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Статус</span>
                    <span className="mt-1.5 block">{getOrderStatusBadge(selectedOrder.status)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Сумма заказа</span>
                    <span className="mt-1 block text-slate-900 font-extrabold text-sm">{selectedOrder.totalAmount.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Использовано бонусов</span>
                    <span className="mt-1 block text-slate-600 font-bold">{selectedOrder.usedBonusPoints.toLocaleString('ru-RU')} ₸</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Тип оплаты</span>
                    <span className="mt-1 block text-slate-850 font-bold">{selectedOrder.paymentMethod}</span>
                  </div>
                </div>

                {/* Client and Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                    <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Получатель</span>
                    <p className="text-slate-800"><strong className="text-slate-500">Имя:</strong> {selectedOrder.clientName}</p>
                    <p className="text-slate-800"><strong className="text-slate-500">Телефон:</strong> {selectedOrder.clientPhone}</p>
                  </div>
                  <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                    <span className="block text-[9px] uppercase font-black tracking-wider text-slate-400">Доставка</span>
                    <p className="text-slate-800"><strong className="text-slate-500">Адрес:</strong> {selectedOrder.clientAddress}</p>
                    {selectedOrder.deliveryDate && (
                      <p className="text-slate-800">
                        <strong className="text-slate-500">Время:</strong> {selectedOrder.deliveryDate} {selectedOrder.deliveryTime || ''}
                      </p>
                    )}
                  </div>
                </div>

                {selectedOrder.cancellationReason && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                    <strong className="font-bold">Причина отмены:</strong> {selectedOrder.cancellationReason}
                  </div>
                )}

                {/* Order Items Table */}
                <div className="space-y-3">
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Состав заказа</span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="px-4 py-2.5">Товар</th>
                          <th className="px-4 py-2.5 text-center">Кол-во</th>
                          <th className="px-4 py-2.5">Цена</th>
                          <th className="px-4 py-2.5 text-right">Итого</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-900 flex items-center gap-2">
                              {item.product?.image && (
                                <img src={item.product.image} alt={item.product.name} className="w-6 h-6 object-cover rounded bg-slate-50 border" />
                              )}
                              <span className="truncate max-w-[240px]" title={item.product?.name}>{item.product?.name || 'Товар'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-slate-800">{item.quantity} шт</td>
                            <td className="px-4 py-2.5 text-slate-500 font-medium">{item.price.toLocaleString('ru-RU')} ₸</td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-900 font-mono">{(item.price * item.quantity).toLocaleString('ru-RU')} ₸</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
