import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getOrders, getOrderById } from '../../../services/api';
import {
  Search,
  Filter,
  Printer,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronRight,
  AlertTriangle,
  Clock,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Eye,
  ShoppingBag,
  Info,
  Calendar,
  AlertCircle,
  ChevronLeft,
  Trash2
} from 'lucide-react';

export default function OrdersPage({
  products = [],
  onStatusChange,
  onUpdateOrder,
  formatPrice,
  getStatusText,
  getStatusClass,
  userRole,
  showToast,
}) {
  // Page Navigation / Views
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Paginated Orders State
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Sorting States
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('date_desc');
  const [copiedId, setCopiedId] = useState(null);

  // Edit fields (for selected order)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderItems, setOrderItems] = useState([]); // Array of { productId, quantity, price, product }
  const [companyName, setCompanyName] = useState('');
  const [companyBin, setCompanyBin] = useState('');
  const [clientComment, setClientComment] = useState('');

  // Cancellation Reason state
  const [cancellationReason, setCancellationReason] = useState('');

  // Dynamic product search states for editing composition
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Toast / notification helper
  const triggerToast = (msg) => {
    if (showToast) {
      showToast(msg);
    }
  };

  // --- FETCH ORDERS (PAGINATED & FILTERED ON BACKEND) ---
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const result = await getOrders({
        page: currentPage,
        limit: 15,
        search: searchQuery || undefined,
        status: activeTab || undefined,
        sort: sortKey
      });
      if (result) {
        setOrders(result.data || []);
        setTotalOrders(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      triggerToast('⚠️ Ошибка при загрузке списка заказов');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync state from URL hash (persisting order ID on refresh)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#orders/')) {
        const idStr = hash.replace('#orders/', '');
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          setSelectedOrderId(id);
          return;
        }
      }
      setSelectedOrderId(null);
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);


  // Trigger load when page parameters change
  useEffect(() => {
    fetchOrders();
  }, [currentPage, activeTab, sortKey]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Load selected order details
  const fetchSelectedOrderDetails = async (id) => {
    try {
      const order = await getOrderById(id);
      if (order) {
        setSelectedOrder(order);
        setClientName(order.clientName);
        setClientPhone(order.clientPhone);
        setClientAddress(order.clientAddress);
        setManagerNotes(order.managerNotes || '');
        setDiscountAmount(order.discountAmount || 0);
        setCancellationReason(order.cancellationReason || '');
        setCompanyName(order.companyName || '');
        setCompanyBin(order.companyBin || '');
        setClientComment(order.clientComment || '');
        setOrderItems(order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          product: item.product
        })));
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      triggerToast('⚠️ Ошибка при загрузке деталей заказа');
    }
  };

  useEffect(() => {
    if (selectedOrderId) {
      fetchSelectedOrderDetails(selectedOrderId);
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId]);

  // Quick Copy Helper
  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    triggerToast(`Скопировано: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- MANAGE ORDER ITEMS ---
  const handleUpdateItemQty = (productId, delta) => {
    setOrderItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId) => {
    if (orderItems.length <= 1) {
      alert('Заказ не может содержать менее 1 товара. Если хотите отменить заказ, смените его статус на Отменен.');
      return;
    }
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleAddItemToOrder = (product) => {
    if (orderItems.some(item => item.productId === product.id)) {
      handleUpdateItemQty(product.id, 1);
      return;
    }
    setOrderItems(prev => [...prev, {
      productId: product.id,
      quantity: 1,
      price: product.price,
      product: product
    }]);
  };

  // Dynamic product search for adding products
  useEffect(() => {
    if (!selectedOrderId) {
      setProductSearchQuery('');
      setSearchedProducts([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!productSearchQuery.trim()) {
        setSearchedProducts([]);
        return;
      }
      setIsSearchingProducts(true);
      try {
        const results = await getProducts({ search: productSearchQuery, limit: 10 });
        setSearchedProducts(results || []);
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearchQuery, selectedOrderId]);

  // Recalculated totals
  const recalculatedTotals = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(discountAmount) || 0;
    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount)
    };
  }, [orderItems, discountAmount]);

  // Check if any edit changes exist compared to current DB values
  const hasChanges = useMemo(() => {
    if (!selectedOrder) return false;
    
    const currentName = (clientName || '').trim();
    const originalName = (selectedOrder.clientName || '').trim();
    if (currentName !== originalName) return true;

    const currentPhone = (clientPhone || '').trim();
    const originalPhone = (selectedOrder.clientPhone || '').trim();
    if (currentPhone !== originalPhone) return true;

    const currentAddress = (clientAddress || '').trim();
    const originalAddress = (selectedOrder.clientAddress || '').trim();
    if (currentAddress !== originalAddress) return true;

    const currentNotes = (managerNotes || '').trim();
    const originalNotes = (selectedOrder.managerNotes || '').trim();
    if (currentNotes !== originalNotes) return true;

    const currentDiscount = parseFloat(discountAmount) || 0;
    const originalDiscount = parseFloat(selectedOrder.discountAmount) || 0;
    if (currentDiscount !== originalDiscount) return true;

    const currentCompanyName = (companyName || '').trim();
    const originalCompanyName = (selectedOrder.companyName || '').trim();
    if (currentCompanyName !== originalCompanyName) return true;

    const currentCompanyBin = (companyBin || '').trim();
    const originalCompanyBin = (selectedOrder.companyBin || '').trim();
    if (currentCompanyBin !== originalCompanyBin) return true;

    if (orderItems.length !== selectedOrder.items.length) return true;
    for (const item of orderItems) {
      const orig = selectedOrder.items.find(i => i.productId === item.productId);
      if (!orig) return true;
      if (parseInt(orig.quantity, 10) !== parseInt(item.quantity, 10)) return true;
    }
    
    return false;
  }, [selectedOrder, clientName, clientPhone, clientAddress, managerNotes, discountAmount, orderItems]);

  // Intercept window/tab close (unload) when there are unsaved changes
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'У вас есть несохраненные изменения заказа!';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Intercept client-side routing hash changes when there are unsaved changes
  useEffect(() => {
    if (!selectedOrderId || !hasChanges) return;

    const handleBeforeHashChange = (e) => {
      const currentExpectedHash = `#orders/${selectedOrderId}`;
      if (window.location.hash !== currentExpectedHash) {
        const confirmLeave = window.confirm(
          'У вас есть несохраненные изменения заказа! Вы уверены, что хотите выйти без сохранения?'
        );
        if (!confirmLeave) {
          // Revert hash to keep the details page open
          window.removeEventListener('hashchange', handleBeforeHashChange);
          window.location.hash = currentExpectedHash;
          setTimeout(() => {
            window.addEventListener('hashchange', handleBeforeHashChange);
          }, 0);
        } else {
          // User approved leaving
          setSelectedOrderId(null);
        }
      }
    };

    window.addEventListener('hashchange', handleBeforeHashChange);
    return () => window.removeEventListener('hashchange', handleBeforeHashChange);
  }, [selectedOrderId, hasChanges]);

  // --- SAVE ORDER CHANGES ---
  const handleSaveChanges = async () => {
    const payload = {
      clientName,
      clientPhone,
      clientAddress,
      managerNotes,
      companyName: selectedOrder.paymentMethod === 'invoice' ? companyName : null,
      companyBin: selectedOrder.paymentMethod === 'invoice' ? companyBin : null,
      discountAmount: parseFloat(discountAmount) || 0,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      await onUpdateOrder(selectedOrder.id, payload);
      await fetchSelectedOrderDetails(selectedOrder.id);
      fetchOrders();
      triggerToast(`Изменения сохранены! Уведомление отправлено покупателю на ${clientPhone || selectedOrder.clientPhone}`);
    } catch (err) {
      console.error(err);
      triggerToast('⚠️ Ошибка при сохранении изменений');
    }
  };

  const handleSaveNotesOnly = async () => {
    try {
      await onUpdateOrder(selectedOrder.id, { managerNotes });
      await fetchSelectedOrderDetails(selectedOrder.id);
      fetchOrders();
      triggerToast('Внутренние заметки сохранены!');
    } catch (err) {
      console.error(err);
      triggerToast('⚠️ Ошибка при сохранении заметок');
    }
  };

  // --- CHANGE STATUS ---
  const handleStatusChangeAction = async (orderId, nextStatus) => {
    if (nextStatus === 'cancelled') {
      const reason = prompt('Введите причину отмены заказа:');
      if (reason === null) return;
      if (!reason.trim()) {
        alert('Причина отмены обязательна!');
        return;
      }
      try {
        await onUpdateOrder(orderId, {
          status: 'cancelled',
          cancellationReason: reason
        });
        triggerToast(`Заказ отменен. Уведомление отправлено покупателю на ${selectedOrder?.clientPhone || ''}`);
        if (selectedOrderId === orderId) {
          fetchSelectedOrderDetails(orderId);
        }
        fetchOrders();
      } catch (err) {
        console.error(err);
        triggerToast('⚠️ Не удалось обновить статус');
      }
      return;
    }

    if (confirm(`Перевести заказ №${orderId} в статус "${getStatusText(nextStatus)}"?`)) {
      try {
        await onStatusChange(orderId, nextStatus);
        triggerToast(`Статус изменен! Уведомление отправлено покупателю.`);
        if (selectedOrderId === orderId) {
          fetchSelectedOrderDetails(orderId);
        }
        fetchOrders();
      } catch (err) {
        console.error(err);
        triggerToast('⚠️ Не удалось обновить статус');
      }
    }
  };

  // --- GROUP ITEMS BY SUPPLIER ---
  const groupItemsBySupplier = (items) => {
    const groups = {};
    items.forEach(item => {
      const supplierName = item.product?.supplier?.name || 'Другой склад';
      const supplierId = item.product?.supplierId || 'other';
      const delivery = item.product?.supplier?.delivery || '1-2 дня';
      const rating = item.product?.supplier?.rating || 5.0;

      if (!groups[supplierId]) {
        groups[supplierId] = {
          name: supplierName,
          delivery,
          rating,
          items: []
        };
      }
      groups[supplierId].items.push(item);
    });
    return Object.values(groups);
  };

  // --- PRINT INVOICE ---
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const supplierGroups = groupItemsBySupplier(order.items);
    
    const htmlContent = `
      <html>
      <head>
        <title>Расходная Накладная №${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-b: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
          .logo span { color: #f59e0b; }
          .title { text-align: right; }
          .title h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .title p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; }
          .details { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .details-box h3 { margin-top: 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; }
          .details-box p { margin: 5px 0; font-size: 14px; }
          .supplier-section { margin-bottom: 30px; }
          .supplier-title { font-size: 13px; font-weight: bold; background: #f8fafc; padding: 8px 12px; border-left: 3px solid #f59e0b; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .totals { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; flex-direction: column; align-items: flex-end; }
          .totals-row { display: flex; justify-content: space-between; width: 300px; margin-bottom: 8px; font-size: 14px; }
          .totals-row.grand { font-size: 18px; font-weight: bold; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TORMAG<span>.KZ</span></div>
          <div class="title">
            <h1>РАСХОДНАЯ НАКЛАДНАЯ №${order.id}</h1>
            <p>Дата: ${new Date(order.createdAt).toLocaleString('ru-RU')}</p>
          </div>
        </div>
        
        <div class="details">
          <div class="details-box">
            <h3>ПОЛУЧАТЕЛЬ</h3>
            <p><strong>Имя:</strong> ${order.clientName}</p>
            <p><strong>Телефон:</strong> ${order.clientPhone}</p>
            <p><strong>Адрес:</strong> ${order.clientAddress}</p>
          </div>
          <div class="details-box">
            <h3>ИНФОРМАЦИЯ О ПЛАТЕЖЕ</h3>
            <p><strong>Способ оплаты:</strong> ${order.paymentMethod === 'cash' ? 'Наличные' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}</p>
            ${order.paymentMethod === 'invoice' && order.companyName ? `
              <p><strong>Организация:</strong> ${order.companyName}</p>
              <p><strong>БИН/ИИН:</strong> ${order.companyBin}</p>
            ` : ''}
            ${order.deliveryDate ? `
              <p><strong>Дата доставки:</strong> ${order.deliveryDate} ${order.deliveryTime ? `(${order.deliveryTime})` : ''}</p>
            ` : ''}
            ${order.clientComment ? `
              <p><strong>Комментарий покупателя:</strong> <em>«${order.clientComment}»</em></p>
            ` : ''}
            <p><strong>Статус:</strong> ${getStatusText(order.status).toUpperCase()}</p>
          </div>
        </div>

        ${supplierGroups.map(group => `
          <div class="supplier-section">
            <div class="supplier-title">Склад: ${group.name}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Наименование товара</th>
                  <th class="text-right">Цена</th>
                  <th class="text-right" style="width: 15%;">Кол-во</th>
                  <th class="text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                ${group.items.map(item => `
                  <tr>
                    <td>${item.product?.name || 'Товар удален'}</td>
                    <td class="text-right">${formatPrice(item.price)}</td>
                    <td class="text-right">${item.quantity} шт</td>
                    <td class="text-right">${formatPrice(item.quantity * item.price)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="totals">
          <div class="totals-row">
            <span>Товаров на сумму:</span>
            <span>${formatPrice(order.subtotalAmount || order.totalAmount)}</span>
          </div>
          ${order.discountAmount ? `
            <div class="totals-row" style="color: #16a34a; font-weight: bold;">
              <span>Скидка:</span>
              <span>- ${formatPrice(order.discountAmount)}</span>
            </div>
          ` : ''}
          <div class="totals-row grand">
            <span>ИТОГО К ОПЛАТЕ:</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing': return <Info className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'shipped': return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'completed': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusChangedAt = (order, status) => {
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const entry = [...history].reverse().find((item) => item?.status === status);
    if (entry?.changedAt) return new Date(entry.changedAt).toLocaleString('ru-RU');
    if (status === 'pending') return new Date(order.createdAt).toLocaleString('ru-RU');
    return 'Время появится после смены статуса';
  };

  // --- RENDERING DETAIL VIEW (SEPARATE PAGE VIEW - DIRECTLY EDITABLE) ---
  if (selectedOrderId && selectedOrder) {
    const supplierGroups = groupItemsBySupplier(orderItems);
    return (
      <div className="space-y-6 font-sans text-left animate-fade-in pb-24">


      <div className="sticky -top-8 z-30 -mx-8 px-8 py-3 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm mb-6">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (hasChanges && !window.confirm('У вас есть несохраненные изменения заказа! Вы уверены, что хотите выйти без сохранения?')) {
                  return;
                }
                setSelectedOrderId(null);
                window.location.hash = '#orders';
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shrink-0"
              title="Назад к списку"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black font-outfit">Заказ №{selectedOrder.id}</h2>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusClass(selectedOrder.status)}`}>
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Оформлен: {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Status Select */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Статус:</span>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChangeAction(selectedOrder.id, e.target.value)}
                className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white cursor-pointer focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="pending" className="bg-slate-900 text-white">⏳ В обработке</option>
                <option value="processing" className="bg-slate-900 text-white">🔧 Сборка</option>
                <option value="shipped" className="bg-slate-900 text-white">🚚 В доставке</option>
                <option value="completed" className="bg-slate-900 text-white">✅ Выполнен</option>
                <option value="cancelled" className="bg-slate-900 text-white">❌ Отменен</option>
              </select>
            </div>

            {/* Print Invoice */}
            <button
              onClick={() => handlePrintInvoice(selectedOrder)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              title="Печать расходной накладной"
            >
              <Printer className="h-4.5 w-4.5" />
            </button>

            {/* Unsaved changes control buttons */}
            {hasChanges && (
              <>
                {/* Divider line */}
                <div className="h-6 w-px bg-slate-800 shrink-0" />
                <button
                  onClick={() => fetchSelectedOrderDetails(selectedOrderId)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/60 transition-colors"
                >
                  Сбросить
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 font-black text-xs rounded-xl text-slate-950 shadow-md transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-4 w-4 text-slate-950 animate-pulse" />
                  Сохранить
                </button>
              </>
            )}
          </div>
        </div>
      </div>

        {/* Form Body layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main items panel (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
                Спецификация и состав заказа (Редактирование доступно сразу)
              </h3>

              {/* Items groups by supplier */}
              <div className="space-y-6">
                {supplierGroups.map((group, idx) => (
                  <div key={idx} className="border border-slate-200/80 rounded-xl p-4 space-y-3 bg-slate-50/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-800">
                        🏬 Склад: {group.name}
                      </span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase font-outfit">
                        Доставка: {group.delivery}
                      </span>
                    </div>

                    <ul className="divide-y divide-slate-100">
                      {group.items.map((item, itemIdx) => {
                        const productObj = item.product || {};
                        return (
                          <li key={itemIdx} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {productObj.image ? (
                                  <img src={productObj.image} alt={productObj.name} className="object-cover w-full h-full" />
                                ) : (
                                  <ShoppingBag className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block truncate max-w-[220px]" title={productObj.name}>
                                  {productObj.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  Артикул: {productObj.article || '—'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className="text-xs font-semibold text-slate-500">
                                {formatPrice(item.price)}
                              </span>

                              {userRole === 'ADMIN' ? (
                                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                  <button
                                    onClick={() => handleUpdateItemQty(item.productId, -1)}
                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="px-2 text-xs font-black min-w-[24px] text-center font-mono">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateItemQty(item.productId, 1)}
                                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-slate-800 font-outfit">
                                  {item.quantity} шт
                                </span>
                              )}

                              <span className="text-xs font-black text-slate-900 font-outfit min-w-[70px] text-right">
                                {formatPrice(item.price * item.quantity)}
                              </span>

                              {userRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleRemoveItem(item.productId)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                  title="Удалить позицию"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Dynamic search to add products */}
              {userRole === 'ADMIN' && (
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> Добавить товар в заказ
                    </h4>
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProductSearchQuery('')}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-955 uppercase"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600/60 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Поиск товара по названию или артикулу..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-amber-200/60 rounded-xl text-xs font-semibold placeholder-amber-700/40 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 admin-main-scroll">
                    {isSearchingProducts ? (
                      <div className="text-center py-4 text-xs font-semibold text-amber-700/60 animate-pulse">
                        Поиск товаров...
                      </div>
                    ) : productSearchQuery.trim() ? (
                      searchedProducts.length === 0 ? (
                        <div className="text-center py-4 text-xs font-bold text-slate-400">
                          Ничего не найдено по запросу "{productSearchQuery}"
                        </div>
                      ) : (
                        searchedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              handleAddItemToOrder(prod);
                              triggerToast(`Добавлено: ${prod.name}`);
                            }}
                            className="bg-white p-3 border border-slate-150 rounded-xl hover:border-amber-500 cursor-pointer flex justify-between items-center text-xs transition-all shadow-sm hover:shadow group text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {prod.image ? (
                                  <img src={prod.image} alt={prod.name} className="object-cover w-full h-full" />
                                ) : (
                                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 text-left">
                                <span className="font-bold text-slate-800 block truncate max-w-[240px]" title={prod.name}>
                                  {prod.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold block">
                                  Артикул: {prod.article || '—'} | Склад: {prod.supplier?.name || '—'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-slate-900 font-outfit">
                                {formatPrice(prod.price)}
                              </span>
                              <span className="p-1 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
                                <Plus className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-white border border-dashed border-slate-200 rounded-xl">
                        Начните вводить название или артикул для поиска и добавления товаров...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial recalculated totals */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 text-xs space-y-3">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Подитог товаров:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatPrice(recalculatedTotals.subtotal)}
                  </span>
                </div>

                {userRole === 'ADMIN' ? (
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="font-bold text-slate-700">🏷️ Ручная скидка (₸):</span>
                    <input
                      type="number"
                      min="0"
                      max={recalculatedTotals.subtotal}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-32 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                    />
                  </div>
                ) : (
                  (discountAmount > 0) && (
                    <div className="flex justify-between items-center text-emerald-600 font-bold">
                      <span>🏷️ Скидка:</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )
                )}

                <div className="flex justify-between items-end border-t border-slate-200 pt-3 mt-3">
                  <span className="font-black text-slate-900 text-sm">Итого к оплате:</span>
                  <span className="text-xl font-black text-amber-500 font-outfit font-mono">
                    {formatPrice(recalculatedTotals.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900">📝 Внутренние заметки менеджера</h3>
              <p className="text-[10px] text-slate-400">
                Сюда вы можете добавить комментарии о звонке клиенту, согласовании доставки. Клиент их не видит.
              </p>
              <div className="flex items-end gap-3">
                <textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Введите комментарий..."
                  rows={3}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
                <button
                  onClick={handleSaveNotesOnly}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md shrink-0"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Recipient card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-slate-400" />
                Получатель заказа
              </h3>

              {userRole === 'ADMIN' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">ФИО клиента</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Телефон</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Адрес доставки</label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold resize-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                  {selectedOrder.paymentMethod === 'invoice' && (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Название компании</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">БИН / ИИН</label>
                        <input
                          type="text"
                          value={companyBin}
                          onChange={(e) => setCompanyBin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2.5">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400">ФИО:</span>
                      <p className="font-bold text-slate-800">{clientName}</p>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400">Телефон:</span>
                      <p className="font-bold text-slate-800">{clientPhone}</p>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400">Адрес доставки:</span>
                      <p className="font-medium text-slate-700 leading-relaxed">{clientAddress}</p>
                    </div>
                    {selectedOrder.paymentMethod === 'invoice' && selectedOrder.companyName && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-[8px] font-black uppercase text-slate-400">Реквизиты организации:</span>
                        <p className="font-bold text-slate-800">{companyName}</p>
                        <p className="font-mono text-slate-650 mt-0.5">БИН/ИИН: {companyBin}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.cancellationReason && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold leading-relaxed">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block font-black text-[9px] uppercase tracking-wide text-rose-800">Причина отмены:</span>
                    {selectedOrder.cancellationReason}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery & Comments Card */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-slate-400" />
                Доставка и комментарии
              </h3>

              <div className="space-y-3 text-xs">
                {selectedOrder.deliveryDate && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Желаемое время доставки:</span>
                    <p className="font-bold text-slate-800">{selectedOrder.deliveryDate}</p>
                    {selectedOrder.deliveryTime && (
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Интервал: {selectedOrder.deliveryTime}</p>
                    )}
                  </div>
                )}

                {clientComment && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <span className="text-[8px] font-black uppercase text-amber-800 block mb-1">Комментарий покупателя:</span>
                    <p className="font-semibold text-slate-700 italic">«{clientComment}»</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline lifecycle */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-slate-400" />
                Жизненный цикл заказа
              </h3>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 py-2 text-xs">
                {/* Created */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 bg-slate-900 text-white p-1 rounded-full border-2 border-white">
                    <ShoppingBag className="h-3 w-3" />
                  </div>
                  <span className="font-black text-slate-800 block">Заказ оформлен на Tormag</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {getStatusChangedAt(selectedOrder, 'pending')}
                  </span>
                </div>

                {/* Processing */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 p-1 rounded-full border-2 border-white ${
                    ['processing', 'shipped', 'completed'].includes(selectedOrder.status)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Info className="h-3 w-3" />
                  </div>
                  <span className={`font-black block ${
                    ['processing', 'shipped', 'completed'].includes(selectedOrder.status) ? 'text-slate-800' : 'text-slate-400'
                  }`}>Сборка и комплектация</span>
                  {['processing', 'shipped', 'completed'].includes(selectedOrder.status) && (
                    <span className="text-[10px] text-slate-400">{getStatusChangedAt(selectedOrder, 'processing')}</span>
                  )}
                </div>

                {/* Shipped */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 p-1 rounded-full border-2 border-white ${
                    ['shipped', 'completed'].includes(selectedOrder.status)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Truck className="h-3 w-3" />
                  </div>
                  <span className={`font-black block ${
                    ['shipped', 'completed'].includes(selectedOrder.status) ? 'text-slate-800' : 'text-slate-400'
                  }`}>Сборная доставка в пути</span>
                  {['shipped', 'completed'].includes(selectedOrder.status) && (
                    <span className="text-[10px] text-slate-400">{getStatusChangedAt(selectedOrder, 'shipped')}</span>
                  )}
                </div>

                {/* Final status */}
                {selectedOrder.status === 'cancelled' ? (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 bg-rose-500 text-white p-1 rounded-full border-2 border-white">
                      <X className="h-3 w-3" />
                    </div>
                    <span className="font-black text-rose-600 block">Заказ отменен / Отказ</span>
                    <span className="text-[10px] text-slate-400">{getStatusChangedAt(selectedOrder, 'cancelled')}</span>
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0 p-1 rounded-full border-2 border-white ${
                      selectedOrder.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <ShieldCheck className="h-3 w-3" />
                    </div>
                    <span className={`font-black block ${
                      selectedOrder.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>Доставлен и завершен</span>
                    {selectedOrder.status === 'completed' && (
                      <span className="text-[10px] text-slate-400">{getStatusChangedAt(selectedOrder, 'completed')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // --- LIST VIEW RENDERING (WITH COMPACT TABLE & PAGINATION) ---
  return (
    <div className="space-y-6 font-sans text-left animate-fade-in">


      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-outfit">Заказы покупателей</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Всего найдено заказов: {totalOrders}</p>
        </div>
      </div>

      {/* --- FILTER & SEARCH CONTROLS --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Поиск по ID, клиенту, телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-650 text-xs font-bold"
            >
              Сброс
            </button>
          )}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">Сортировка:</span>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setCurrentPage(1); }}
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="date_desc">Сначала новые</option>
            <option value="date_asc">Сначала старые</option>
            <option value="amount_desc">Сумма (по убыванию)</option>
            <option value="amount_asc">Сумма (по возрастанию)</option>
          </select>
        </div>
      </div>

      {/* --- STATUS TABS FILTER --- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 pb-3">
        {[
          { key: 'all', label: 'Все заказы' },
          { key: 'pending', label: 'В обработке' },
          { key: 'processing', label: 'Сборка' },
          { key: 'shipped', label: 'В доставке' },
          { key: 'completed', label: 'Выполнен' },
          { key: 'cancelled', label: 'Отменен' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- TABLE LIST --- */}
      {isLoading ? (
        <div className="bg-white p-20 rounded-2xl border border-slate-200/60 shadow-sm text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Загрузка заказов с сервера...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-slate-200/60 shadow-sm text-center">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-black text-slate-800">Заказы не найдены</h3>
          <p className="text-slate-400 text-xs mt-1">Попробуйте изменить параметры поиска или вкладку.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 bg-slate-50/75 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-4 px-5">ID заказа</th>
                    <th className="py-4 px-4">Дата оформления</th>
                    <th className="py-4 px-4">Клиент</th>
                    <th className="py-4 px-4">Контакты</th>
                    <th className="py-4 px-4">Оплата</th>
                    <th className="py-4 px-4">Сумма</th>
                    <th className="py-4 px-4">Статус</th>
                    <th className="py-4 px-5 text-right">Управление</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        window.location.hash = `#orders/${order.id}`;
                      }}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5 font-bold text-slate-900 font-outfit font-mono">
                        #{order.id}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-normal">
                        {new Date(order.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-4 px-4">
                        {order.clientName}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-mono">
                        {order.clientPhone}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {order.paymentMethod === 'cash' ? 'Наличные' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-900 font-black font-outfit font-mono">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChangeAction(order.id, e.target.value)}
                            className={`appearance-none pl-3.5 pr-6 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${getStatusClass(order.status)}`}
                          >
                            <option value="pending" className="text-slate-800 bg-white">⏳ В обработке</option>
                            <option value="processing" className="text-slate-800 bg-white">🔧 Сборка</option>
                            <option value="shipped" className="text-slate-800 bg-white">🚚 В доставке</option>
                            <option value="completed" className="text-slate-800 bg-white">✅ Выполнен</option>
                            <option value="cancelled" className="text-slate-800 bg-white">❌ Отменен</option>
                          </select>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-[7px] text-current">▼</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              window.location.hash = `#orders/${order.id}`;
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Управление заказом"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Распечатать накладную"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3.5 rounded-2xl border border-slate-200/60 shadow-sm text-xs font-semibold text-slate-600">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Назад
              </button>
              
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                Страница {currentPage} из {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Вперед <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
