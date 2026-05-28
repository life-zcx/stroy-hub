import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Printer,
  Copy,
  Check,
  X,
  Edit2,
  Trash2,
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
  ArrowRight,
  Eye,
  FileText,
  ShoppingBag,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function OrdersPage({
  orders = [],
  products = [],
  onStatusChange,
  onUpdateOrder,
  formatPrice,
  getStatusText,
  getStatusClass,
  userRole,
}) {
  // Filters & Sorting States
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('date_desc');
  const [copiedId, setCopiedId] = useState(null);

  // Selected Order Drawer / Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields (for selected order)
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [orderItems, setOrderItems] = useState([]); // Array of { productId, quantity, price, product }

  // Rejection / Cancellation Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customCancelText, setCustomCancelText] = useState('');

  // Toast / notification helper
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Lock body scroll when drawer or cancel modal is open
  useEffect(() => {
    if (selectedOrder || isCancelModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder, isCancelModalOpen]);

  // Quick Copy Helper
  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    triggerToast(`Скопировано: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- CALCULATE KPI STATS ---
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedVolume = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const rejectionRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0';

    return {
      total,
      pending,
      completedVolume,
      rejectionRate
    };
  }, [orders]);

  // --- FILTER & SORT ORDERS ---
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Tab Filter
        if (activeTab !== 'all' && order.status !== activeTab) {
          return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchId = String(order.id).includes(query);
          const matchClient = order.clientName.toLowerCase().includes(query);
          const matchPhone = order.clientPhone.toLowerCase().includes(query);
          const matchSupplier = order.items.some(item => 
            item.product?.supplier?.name?.toLowerCase().includes(query)
          );
          const matchProduct = order.items.some(item => 
            item.product?.name?.toLowerCase().includes(query)
          );

          return matchId || matchClient || matchPhone || matchSupplier || matchProduct;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortKey === 'date_desc') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortKey === 'date_asc') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortKey === 'amount_desc') {
          return b.totalAmount - a.totalAmount;
        }
        if (sortKey === 'amount_asc') {
          return a.totalAmount - b.totalAmount;
        }
        return 0;
      });
  }, [orders, activeTab, searchQuery, sortKey]);

  // Get status count helper
  const getStatusCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  // --- OPEN DRAWER ---
  const openOrderDrawer = (order) => {
    setSelectedOrder(order);
    setIsEditing(false);
    setClientName(order.clientName);
    setClientPhone(order.clientPhone);
    setClientAddress(order.clientAddress);
    setManagerNotes(order.managerNotes || '');
    setOrderItems(order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: item.product
    })));
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

  // Dynamic order total preview
  const recalculatedTotals = useMemo(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Evaluate promo discount if promo code exists
    let discount = 0;
    if (selectedOrder?.promotionSnapshot && selectedOrder?.promoCode) {
      const snap = selectedOrder.promotionSnapshot;
      // Re-apply discount structure if we have a valid snapshot
      if (snap.discountType === 'PERCENT') {
        discount = Math.round(subtotal * (snap.discountValue / 100));
      } else if (snap.discountType === 'FIXED') {
        discount = snap.discountValue;
      }
      
      // If order has minimum order requirements
      if (snap.minOrderAmount && subtotal < snap.minOrderAmount) {
        discount = 0; // Invalidated promo code
      }
    }
    
    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount)
    };
  }, [orderItems, selectedOrder]);

  // --- SAVE ORDER CHANGES ---
  const handleSaveChanges = async () => {
    const payload = {
      clientName,
      clientPhone,
      clientAddress,
      managerNotes,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    await onUpdateOrder(selectedOrder.id, payload);
    
    // Refresh selected order local state with new calculated values
    const updatedOrder = orders.find(o => o.id === selectedOrder.id);
    if (updatedOrder) {
      openOrderDrawer(updatedOrder);
    }
    setIsEditing(false);
    triggerToast('Изменения сохранены!');
  };

  // --- SAVE NOTE DIRECTLY ---
  const handleSaveNotesOnly = async () => {
    await onUpdateOrder(selectedOrder.id, { managerNotes });
    triggerToast('Комментарий менеджера сохранен!');
  };

  // --- TRANSITION STATUS ---
  const handleQuickStatusChange = async (orderId, nextStatus) => {
    if (nextStatus === 'cancelled') {
      setSelectedOrder(orders.find(o => o.id === orderId));
      setIsCancelModalOpen(true);
      return;
    }

    if (confirm(`Перевести заказ №${orderId} в статус "${getStatusText(nextStatus)}"?`)) {
      await onStatusChange(orderId, nextStatus);
      triggerToast('Статус успешно изменен!');
      const updated = orders.find(o => o.id === orderId);
      if (selectedOrder && selectedOrder.id === orderId && updated) {
        setSelectedOrder(updated);
      }
    }
  };

  // --- CANCEL ORDER CONFIRMATION ---
  const handleConfirmCancellation = async () => {
    const reason = cancellationReason === 'Другое' ? customCancelText : cancellationReason;
    if (!reason) {
      alert('Укажите причину отмены.');
      return;
    }

    await onUpdateOrder(selectedOrder.id, {
      status: 'cancelled',
      cancellationReason: reason
    });

    setIsCancelModalOpen(false);
    setCancellationReason('');
    setCustomCancelText('');
    triggerToast('Заказ отменен.');
    
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) {
      openOrderDrawer(updated);
    }
  };

  // --- GROUP ITEMS BY SUPPLIER (THE SLICE!) ---
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

  // --- PRINT INVOICE DIALOG ---
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const supplierGroups = groupItemsBySupplier(order.items);
    
    const htmlContent = `
      <html>
      <head>
        <title>Расходная Накладная №${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-b: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
          .logo span { color: #f59e0b; }
          .title { text-align: right; }
          .title h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .title p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; }
          .details { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .details-box h3 { margin-top: 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
          .details-box p { margin: 5px 0; font-size: 14px; font-weight: 500; }
          .supplier-section { margin-bottom: 30px; }
          .supplier-title { font-size: 13px; font-weight: bold; background: #f8fafc; padding: 8px 12px; border-left: 3px solid #f59e0b; margin-bottom: 12px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .totals { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px; display: flex; flex-direction: column; align-items: flex-end; }
          .totals-row { display: flex; justify-content: space-between; width: 300px; margin-bottom: 8px; font-size: 14px; color: #475569; }
          .totals-row.grand { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
          .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          @media print {
            body { padding: 0; }
          }
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
            <p><strong>Способ оплаты:</strong> ${order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}</p>
            <p><strong>Статус заказа:</strong> ${getStatusText(order.status).toUpperCase()}</p>
          </div>
        </div>

        ${supplierGroups.map(group => `
          <div class="supplier-section">
            <div class="supplier-title">Склад дистрибьютора: ${group.name} (Доставка: ${group.delivery})</div>
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
              <span>Скидка по промокоду (${order.promoCode || ''}):</span>
              <span>- ${formatPrice(order.discountAmount)}</span>
            </div>
          ` : ''}
          <div class="totals-row grand">
            <span>ИТОГО К ОПЛАТЕ:</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Благодарим вас за сотрудничество со строительным маркетплейсом Tormag.kz!</p>
          <p>По вопросам поддержки: support@tormag.kz</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Status Colors Helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing': return <Info className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'shipped': return <Truck className="h-4 w-4 text-indigo-500 animate-bounce" />;
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

  return (
    <div className="space-y-8 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-800 text-xs font-bold uppercase tracking-wider">
            <Check className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* --- KPI ANALYTICS WIDGETS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-amber-400/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Всего заказов</span>
            <p className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300 font-outfit">{stats.total}</p>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-400/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">В обработке</span>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black text-slate-900 font-outfit">{stats.pending}</p>
              {stats.pending > 0 && <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-emerald-400/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Объем продаж</span>
            <p className="text-2xl font-black text-slate-900 font-outfit text-emerald-600">{formatPrice(stats.completedVolume)}</p>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-rose-400/40 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Процент отмен</span>
            <p className="text-3xl font-black text-slate-900 font-outfit text-rose-500">{stats.rejectionRate}%</p>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* --- FILTER & SEARCH CONTROLS --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Поиск по ID, клиенту, телефону, поставщику..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Сброс
            </button>
          )}
        </div>

        {/* Sorting and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400">Сортировка:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Сначала новые</option>
              <option value="date_asc">Сначала старые</option>
              <option value="amount_desc">Сумма (по убыванию)</option>
              <option value="amount_asc">Сумма (по возрастанию)</option>
            </select>
          </div>
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
          const count = getStatusCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/40'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-500 font-bold'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* --- ORDERS CARDS CONTAINER --- */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-slate-200/60 shadow-sm text-center">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-bounce" />
          <h3 className="text-base font-black text-slate-800">Заказы не найдены</h3>
          <p className="text-slate-400 text-xs mt-1">Попробуйте изменить параметры поиска или фильтры по статусам.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const isCopiedPhone = copiedId === `phone_${order.id}`;
            const isCopiedAddress = copiedId === `addr_${order.id}`;
            
            // Slicing items by Supplier for visual representation
            const supplierGroups = groupItemsBySupplier(order.items);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 font-outfit">Заказ №{order.id}</span>
                      <span
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
                      {new Date(order.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openOrderDrawer(order)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors group"
                      title="Просмотр и редактирование"
                    >
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handlePrintInvoice(order)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors group"
                      title="Печать расходной накладной"
                    >
                      <Printer className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  
                  {/* Left Column: Client Details */}
                  <div className="space-y-3.5 border-b md:border-b-0 md:border-r border-slate-100/80 pb-4 md:pb-0 md:pr-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Данные получателя</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                          <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>{order.clientName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold">{order.clientPhone}</span>
                          <button
                            onClick={() => handleCopyText(order.clientPhone, `phone_${order.id}`)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isCopiedPhone ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-slate-500">
                          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed truncate max-w-[200px]" title={order.clientAddress}>
                            {order.clientAddress}
                          </span>
                          <button
                            onClick={() => handleCopyText(order.clientAddress, `addr_${order.id}`)}
                            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                          >
                            {isCopiedAddress ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100/60 space-y-2">
                      <span className="text-[9px] bg-slate-100 px-2.5 py-1 rounded-lg font-black uppercase text-slate-600 inline-flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        {order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                      </span>
                      
                      {order.cancellationReason && (
                        <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-rose-700 font-semibold leading-relaxed">
                          <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="block font-black text-[9px] uppercase tracking-wide text-rose-800">Причина отмены:</span>
                            {order.cancellationReason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Product Slice (срез по поставщикам) */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        Товары по складам ({supplierGroups.length})
                      </h4>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                        {supplierGroups.map((group, idx) => (
                          <div key={idx} className="bg-slate-50/50 border border-slate-200/40 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-700 truncate max-w-[130px]" title={group.name}>
                                🏬 {group.name}
                              </span>
                              <span className="font-bold text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-outfit">
                                {group.delivery}
                              </span>
                            </div>
                            
                            <ul className="space-y-1 pl-2">
                              {group.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="text-xs text-slate-600 flex justify-between gap-2">
                                  <span className="truncate max-w-[140px] font-medium">
                                    • {item.product?.name || 'Товар удален'}
                                  </span>
                                  <span className="font-black text-slate-900 flex-shrink-0">
                                    {item.quantity} шт
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100/60 flex justify-between items-end">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Итого к оплате</span>
                        <span className="text-xl font-extrabold text-amber-500 font-outfit">{formatPrice(order.totalAmount)}</span>
                      </div>
                      
                      {order.discountAmount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          Скидка: {formatPrice(order.discountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50/60 rounded-b-2xl border-t border-slate-100/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Статус:</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      className={`p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-amber-500/50 cursor-pointer ${
                        order.status === 'cancelled'
                          ? 'text-rose-600 border-rose-200'
                          : order.status === 'completed'
                          ? 'text-emerald-600 border-emerald-200'
                          : 'text-slate-700'
                      }`}
                    >
                      <option value="pending">⏳ В обработке</option>
                      <option value="processing">🔧 Сборка</option>
                      <option value="shipped">🚚 В доставке</option>
                      <option value="completed">✅ Выполнен</option>
                      <option value="cancelled">❌ Отменен</option>
                    </select>
                  </div>

                  <button
                    onClick={() => openOrderDrawer(order)}
                    className="text-xs font-bold text-slate-900 hover:text-amber-500 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    Полноценное управление
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- DETAILED ORDER DRAWER / MODAL --- */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end transition-opacity duration-300">
          
          {/* BackDrop click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />

          {/* Side Drawer */}
          <div className="relative w-full max-w-4xl bg-white h-screen shadow-2xl flex flex-col justify-between z-50 animate-fade-in-left overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200/80 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black font-outfit">Заказ №{selectedOrder.id}</span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${getStatusClass(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Оформлен: {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  title="Печать накладной"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- Left Column (2/3): Items details and editing --- */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Supplier groups / Product slice */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
                        Спецификация и состав заказа
                      </h3>
                      {userRole === 'ADMIN' && (
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all ${
                            isEditing
                              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isEditing ? 'Отменить правку' : 'Редактировать состав'}
                        </button>
                      )}
                    </div>

                    {/* Sliced items list */}
                    <div className="space-y-6">
                      {groupItemsBySupplier(
                        isEditing
                          ? orderItems
                          : selectedOrder.items
                      ).map((group, idx) => (
                        <div key={idx} className="border border-slate-200/80 rounded-xl p-4 space-y-3 bg-slate-50/20">
                          
                          {/* Supplier title block */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-xs font-black text-slate-800">
                              🏬 Поставщик: {group.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Rating: ⭐ {group.rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                                Срок: {group.delivery}
                              </span>
                            </div>
                          </div>

                          {/* Items Table */}
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
                                      <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]" title={productObj.name}>
                                        {productObj.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium block">
                                        Категория: {productObj.categoryRelation?.name || productObj.category || 'Строительные смеси'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="text-xs font-semibold text-slate-500">
                                      {formatPrice(item.price)}
                                    </span>

                                    {/* Qty adjustments in edit mode */}
                                    {isEditing ? (
                                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                                        <button
                                          onClick={() => handleUpdateItemQty(item.productId, -1)}
                                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="px-2.5 text-xs font-black font-outfit min-w-[24px] text-center">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleUpdateItemQty(item.productId, 1)}
                                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                        >
                                          <Plus className="h-3 w-3" />
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

                                    {isEditing && (
                                      <button
                                        onClick={() => handleRemoveItem(item.productId)}
                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
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

                    {/* Add Product block in edit mode */}
                    {isEditing && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Добавить товар в заказ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                          {products.slice(0, 10).map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => handleAddItemToOrder(prod)}
                              className="bg-white p-2 border border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer flex justify-between items-center text-xs font-semibold transition-all"
                            >
                              <div className="truncate max-w-[180px] text-slate-700">
                                {prod.name}
                              </div>
                              <span className="text-amber-500 font-black flex-shrink-0">
                                {formatPrice(prod.price)} +
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order summary recalculated totals */}
                    <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Подитог товаров:</span>
                        <span className="font-bold text-slate-800">
                          {formatPrice(isEditing ? recalculatedTotals.subtotal : (selectedOrder.subtotalAmount || selectedOrder.totalAmount))}
                        </span>
                      </div>
                      
                      {(selectedOrder.promoCode || selectedOrder.discountAmount > 0) && (
                        <div className="flex justify-between items-center text-emerald-600 font-bold">
                          <span className="flex items-center gap-1">
                            🏷️ Скидка по промокоду ({selectedOrder.promoCode || 'Акция'}):
                          </span>
                          <span>
                            - {formatPrice(isEditing ? recalculatedTotals.discount : selectedOrder.discountAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-end border-t border-slate-200 pt-2.5 mt-2">
                        <span className="font-black text-slate-900 text-sm">Общая сумма к оплате:</span>
                        <span className="text-lg font-black text-amber-500 font-outfit">
                          {formatPrice(isEditing ? recalculatedTotals.total : selectedOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manager private notes */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-black text-slate-900">📝 Внутренние заметки менеджера</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Сюда вы можете добавить комментарии о звонке клиенту, согласовании времени доставки и других нюансах. Клиент эти заметки не видит.
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
                        className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all"
                      >
                        Сохранить заметку
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- Right Column (1/3): Client data form & Order Timeline --- */}
                <div className="space-y-6">
                  
                  {/* Client Info form */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-slate-400" />
                      Получатель заказа
                    </h3>
                    
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">ФИО клиента</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Телефон</label>
                          <input
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Адрес доставки</label>
                          <textarea
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            rows={3}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-2.5">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase text-slate-400">ФИО:</span>
                            <p className="font-bold text-slate-800">{selectedOrder.clientName}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase text-slate-400">Номер телефона:</span>
                            <p className="font-bold text-slate-800">{selectedOrder.clientPhone}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase text-slate-400">Адрес доставки:</span>
                            <p className="font-medium text-slate-700 leading-relaxed">{selectedOrder.clientAddress}</p>
                          </div>
                        </div>

                        {selectedOrder.cancellationReason && (
                          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold leading-relaxed">
                            <AlertCircle className="h-4.5 w-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="block font-black text-[9px] uppercase tracking-wide text-rose-800">Причина отмены заказа:</span>
                              {selectedOrder.cancellationReason}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Timeline Tracker */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
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

                      {/* Final Status (Completed or Cancelled) */}
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

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              
              {/* Quick Status selectors inside details */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-400">Действие:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleQuickStatusChange(selectedOrder.id, e.target.value)}
                  className={`p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 cursor-pointer ${
                    selectedOrder.status === 'cancelled'
                      ? 'text-rose-600 border-rose-200'
                      : selectedOrder.status === 'completed'
                      ? 'text-emerald-600 border-emerald-200'
                      : 'text-slate-700'
                  }`}
                >
                  <option value="pending">⏳ В обработке</option>
                  <option value="processing">🔧 Сборка</option>
                  <option value="shipped">🚚 В доставке</option>
                  <option value="completed">✅ Выполнен</option>
                  <option value="cancelled">❌ Отменен</option>
                </select>
              </div>

              {/* Edit Mode Save button */}
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 font-bold text-xs rounded-xl text-slate-700 transition-colors"
                  >
                    Отменить изменения
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 font-black text-xs rounded-xl text-slate-950 shadow-md transition-all"
                  >
                    Сохранить изменения
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Закрыть детали
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- CANCELLATION REASON MODAL --- */}
      {isCancelModalOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-500 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-black text-slate-900">Форма отказа от заказа</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Пожалуйста, выберите причину отказа. Это необходимо для ведения аналитики продаж и уведомления клиента.
            </p>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Причина отмены</label>
              <select
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">-- Выберите причину --</option>
                <option value="Нет в наличии на складах">Нет в наличии на складах</option>
                <option value="Покупатель отменил заказ при созвоне">Покупатель отменил заказ при созвоне</option>
                <option value="Ошибка в стоимости материалов">Ошибка в стоимости материалов</option>
                <option value="Не устраивают условия сборной доставки">Не устраивают условия сборной доставки</option>
                <option value="Другое">Другое (указать вручную)</option>
              </select>
            </div>

            {cancellationReason === 'Другое' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Свой вариант причины</label>
                <textarea
                  value={customCancelText}
                  onChange={(e) => setCustomCancelText(e.target.value)}
                  placeholder="Опишите детальнее..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancellationReason('');
                  setCustomCancelText('');
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmCancellation}
                disabled={!cancellationReason}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                Подтвердить отказ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
