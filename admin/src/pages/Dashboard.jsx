import React, { useState, useEffect } from 'react';
import { 
  getProducts, createProduct, deleteProduct, 
  getSuppliers, createSupplier, getOrders, updateOrderStatus 
} from '../services/api';
import { 
  Package as PackageIcon, Truck as TruckIcon, UserCheck as UserCheckIcon, Plus as PlusIcon, 
  Trash2 as Trash2Icon, RefreshCw as RefreshCwIcon, FileSpreadsheet as FileSpreadsheetIcon, 
  PlusCircle as PlusCircleIcon, LogOut as LogOutIcon, ShieldAlert as ShieldAlertIcon, 
  Award as AwardIcon 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'mixes', name: 'Сухие смеси' },
  { id: 'lumber', name: 'Пиломатериалы' },
  { id: 'tools', name: 'Инструменты' },
  { id: 'paints', name: 'Краски' },
  { id: 'hardware', name: 'Крепеж' },
];

export default function Dashboard({ user, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('products'); // products, orders, suppliers
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Loading flags
  const [loading, setLoading] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'mixes',
    price: '',
    oldPrice: '',
    bulkDiscount: '',
    isHit: false,
    supplierId: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    delivery: '1-2 дня',
    rating: 5.0,
    reviews: 0
  });

  const isSupplier = user.role === 'SUPPLIER';

  const reloadData = async () => {
    setLoading(true);
    try {
      const p = await getProducts();
      setProducts(p);

      const s = await getSuppliers();
      setSuppliers(s);
      
      // Auto-set supplierId in product form
      if (isSupplier) {
        setProductForm(prev => ({ ...prev, supplierId: user.supplierId }));
      } else if (s.length > 0 && !productForm.supplierId) {
        setProductForm(prev => ({ ...prev, supplierId: s[0].id }));
      }

      const o = await getOrders();
      setOrders(o);
    } catch (error) {
      console.error(error);
      showToast('⚠️ Ошибка при синхронизации с базой данных PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const supplierIdToUse = isSupplier ? user.supplierId : productForm.supplierId;

    if (!productForm.name || !productForm.price || !supplierIdToUse) {
      alert('Заполните обязательные поля: Название, Цена и Дистрибьютор');
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    if (productForm.description) formData.append('description', productForm.description);
    formData.append('category', productForm.category);
    formData.append('price', productForm.price);
    formData.append('supplierId', supplierIdToUse);
    
    if (productForm.oldPrice) formData.append('oldPrice', productForm.oldPrice);
    if (productForm.bulkDiscount) formData.append('bulkDiscount', productForm.bulkDiscount);
    formData.append('isHit', productForm.isHit);
    
    if (imageFile) {
      formData.append('imageFile', imageFile);
    } else if (productForm.imageUrl) {
      formData.append('imageUrl', productForm.imageUrl);
    }

    try {
      await createProduct(formData);
      showToast('✅ Карточка товара успешно добавлена!');
      setProductForm({
        name: '',
        description: '',
        category: 'mixes',
        price: '',
        oldPrice: '',
        bulkDiscount: '',
        isHit: false,
        supplierId: isSupplier ? user.supplierId : (suppliers[0]?.id || ''),
        imageUrl: '',
      });
      setImageFile(null);
      
      const fileInput = document.getElementById('imageFileInput');
      if (fileInput) fileInput.value = '';

      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка добавления: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить товар?')) return;
    try {
      await deleteProduct(id);
      showToast('🗑️ Товар удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления: ' + error.message);
    }
  };

  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.delivery) return;
    try {
      await createSupplier(supplierForm);
      showToast('🏢 Поставщик зарегистрирован!');
      setSupplierForm({
        name: '',
        delivery: '1-2 дня',
        rating: 5.0,
        reviews: 0
      });
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка создания: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('🔄 Статус заказа изменен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка: ' + error.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'В обработке';
      case 'processing': return 'Сборка заказа';
      case 'shipped': return 'В доставке';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up font-sans">
      
      {/* Upper header with profile and logout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-5 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">Панель управления StroyHub</h1>
            <span className="text-xs bg-slate-900 text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Вы вошли как <strong className="text-slate-700">{user.name} ({user.email})</strong>
            {isSupplier && ` • Представитель склада «${user.supplierName}»`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={reloadData} 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            disabled={loading}
          >
            <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Синхронизировать
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOutIcon className="h-4.5 w-4.5" />
            Выйти
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-px">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'products' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          <PackageIcon className="h-4.5 w-4.5" />
          Мои товары ({products.length})
        </button>
        
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'orders' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          <FileSpreadsheetIcon className="h-4.5 w-4.5" />
          Заказы ({orders.length})
        </button>

        {!isSupplier && (
          <button 
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'suppliers' 
                ? 'border-amber-500 text-amber-600' 
                : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            <UserCheckIcon className="h-4.5 w-4.5" />
            Дистрибьюторы ({suppliers.length})
          </button>
        )}
      </div>

      {/* Dashboard Views */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form + Live Preview */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2 font-outfit">
                <PlusCircleIcon className="h-5 w-5 text-amber-500" />
                Загрузить товар
              </h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название товара *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={productForm.name} 
                    onChange={handleProductChange}
                    required 
                    placeholder="Штукатурка, кабель, саморезы и др."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Описание <span className="normal-case text-slate-400 font-normal">(необязательно — отображается в карточке)</span>
                  </label>
                  <textarea 
                    name="description" 
                    value={productForm.description} 
                    onChange={handleProductChange}
                    rows={3}
                    placeholder="Укажите характеристики, область применения, состав, размеры..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Категория</label>
                    <select 
                      name="category" 
                      value={productForm.category} 
                      onChange={handleProductChange}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Поставщик</label>
                    {isSupplier ? (
                      <input 
                        type="text"
                        value={user.supplierName}
                        disabled
                        className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-slate-500 text-sm font-semibold"
                      />
                    ) : (
                      <select 
                        name="supplierId" 
                        value={productForm.supplierId} 
                        onChange={handleProductChange}
                        required
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                      >
                        <option value="">Выбрать...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Цена (₸) *</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={productForm.price} 
                      onChange={handleProductChange}
                      required 
                      placeholder="4500"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Старая цена (₸)</label>
                    <input 
                      type="number" 
                      name="oldPrice" 
                      value={productForm.oldPrice} 
                      onChange={handleProductChange}
                      placeholder="5200"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Оптовые условия (необязательно)</label>
                  <input 
                    type="text" 
                    name="bulkDiscount" 
                    value={productForm.bulkDiscount} 
                    onChange={handleProductChange}
                    placeholder="от 100 шт: 3800 ₸"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>

                <div className="border border-dashed border-gray-200 p-4 rounded-xl space-y-3">
                  <span className="block text-xs font-bold text-slate-600 uppercase">Изображение товара</span>
                  <div>
                    <input 
                      type="file" 
                      id="imageFileInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                  <div className="text-center text-xs text-gray-400 font-bold uppercase py-1">Или URL</div>
                  <div>
                    <input 
                      type="text" 
                      name="imageUrl" 
                      value={productForm.imageUrl} 
                      onChange={handleProductChange}
                      placeholder="https://images.com/product.jpg"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-xs text-slate-700"
                      disabled={!!imageFile}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isHit" 
                    name="isHit" 
                    checked={productForm.isHit} 
                    onChange={handleProductChange}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="isHit" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Отметить товар бейджем "ХИТ"
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-slate-900 hover:bg-amber-500 hover:shadow-lg text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
                >
                  <PlusIcon className="h-5 w-5" />
                  Опубликовать на витрине
                </button>
              </form>
            </div>

            {/* ─── Live Card Preview ─── */}
            {productForm.name && (
              <div className="bg-white p-5 rounded-2xl border border-dashed border-amber-300 shadow-sm">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AwardIcon className="h-3.5 w-3.5" /> Превью карточки на витрине
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                  {/* Image preview */}
                  <div className="h-36 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {(productForm.imageUrl || imageFile) ? (
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : productForm.imageUrl}
                        alt="preview"
                        className="w-3/4 h-3/4 object-contain mix-blend-multiply"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <PackageIcon className="h-10 w-10 mb-1" />
                        <span className="text-[10px] font-semibold">Нет фото</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    {/* Badges */}
                    <div className="flex gap-1.5 mb-2">
                      {productForm.isHit && (
                        <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">⚡ Хит</span>
                      )}
                      {productForm.oldPrice && (
                        <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                          −{formatPrice((productForm.oldPrice - productForm.price) || 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[2rem] mb-2">
                      {productForm.name || 'Название товара'}
                    </p>
                    <div className="bg-slate-50 rounded-lg p-2 mb-3 text-[10px] text-slate-500 space-y-1">
                      <div>🛡 {suppliers.find(s => s.id === productForm.supplierId)?.name || user.supplierName || '—'}</div>
                      <div>📦 Доставка: 1–2 дня · Склад Алматы</div>
                    </div>
                    {productForm.oldPrice && (
                      <div className="text-[10px] text-slate-400 line-through">{formatPrice(productForm.oldPrice)}</div>
                    )}
                    <div className="text-base font-extrabold text-slate-900">
                      {productForm.price ? formatPrice(productForm.price) : '— ₸'}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">/ шт</span>
                    </div>
                    {productForm.bulkDiscount && (
                      <div className="text-[9px] text-emerald-700 bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-1">{productForm.bulkDiscount}</div>
                    )}
                    <button className="w-full mt-2.5 bg-slate-900 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5">
                      🛒 В корзину
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 mb-5 font-outfit">Зарегистрированные товары</h2>
            {products.length === 0 ? (
              <p className="text-center py-20 text-slate-500">Товары отсутствуют.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-2">Товар</th>
                      <th className="pb-3 px-2">Категория</th>
                      <th className="pb-3 px-2">Дистрибьютор</th>
                      <th className="pb-3 px-2">Цена</th>
                      <th className="pb-3 pl-2 text-right">Удалить</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                        <td className="py-3.5 pr-2 font-semibold text-slate-900 max-w-[200px] truncate">{p.name}</td>
                        <td className="py-3.5 px-2 text-slate-500">{CATEGORIES.find(c => c.id === p.category)?.name || p.category}</td>
                        <td className="py-3.5 px-2 text-slate-500 text-xs font-semibold">{p.supplier?.name}</td>
                        <td className="py-3.5 px-2 font-bold text-slate-900">{formatPrice(p.price)}</td>
                        <td className="py-3.5 pl-2 text-right">
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2Icon className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 font-outfit">Заказы клиентов</h2>
          {orders.length === 0 ? (
            <p className="text-center py-20 text-slate-500">Заказы пока отсутствуют.</p>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 font-outfit">Заказ №{order.id}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">Оформлен: {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold uppercase">Сменить статус:</span>
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-amber-500/50"
                      >
                        <option value="pending">В обработке</option>
                        <option value="processing">Сборка</option>
                        <option value="shipped">В доставке</option>
                        <option value="completed">Выполнен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 text-sm md:border-r md:border-gray-100 md:pr-6">
                      <h4 className="font-bold text-slate-400 text-[10px] uppercase">Данные получателя</h4>
                      <p className="font-semibold text-slate-900">{order.clientName}</p>
                      <p className="text-slate-600">{order.clientPhone}</p>
                      <p className="text-slate-500 text-xs leading-relaxed">{order.clientAddress}</p>
                      <div className="pt-2">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-600">
                          Оплата: {order.paymentMethod === 'cash' ? 'Наличные / Терминал' : order.paymentMethod === 'kaspi' ? 'Kaspi QR' : 'B2B Счет'}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-400 text-[10px] uppercase">Позиции в заказе</h4>
                      <ul className="divide-y divide-gray-100">
                        {order.items.map(item => (
                          <li key={item.id} className="py-2 flex items-center justify-between text-sm gap-2">
                            <span className="font-medium text-slate-900 truncate max-w-[280px]">
                              {item.product?.name} <span className="text-xs text-slate-400">({item.product?.supplier?.name})</span>
                            </span>
                            <span className="text-slate-500 text-xs">
                              {item.quantity} шт x {formatPrice(item.price)}
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatPrice(item.quantity * item.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-end">
                        <span className="font-bold text-slate-900">Общая сумма к оплате:</span>
                        <span className="text-lg font-extrabold text-amber-500">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'suppliers' && !isSupplier && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2 font-outfit">
              <UserCheckIcon className="h-5 w-5 text-amber-500" />
              Новый дистрибьютор
            </h2>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название компании *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={supplierForm.name} 
                  onChange={handleSupplierChange}
                  required 
                  placeholder="ТОО СтройАзиа"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Срок доставки со склада *</label>
                <input 
                  type="text" 
                  name="delivery" 
                  value={supplierForm.delivery} 
                  onChange={handleSupplierChange}
                  required 
                  placeholder="Завтра, 1-2 дня"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-slate-900 hover:bg-amber-500 hover:shadow-lg text-white font-bold rounded-xl transition-all text-sm"
              >
                Зарегистрировать поставщика
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-5 font-outfit">Дистрибьюторы на платформе</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suppliers.map(sup => (
                <div key={sup.id} className="border border-gray-150 p-4 rounded-xl space-y-2">
                  <h3 className="font-bold text-slate-900">{sup.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <TruckIcon className="h-3.5 w-3.5 text-amber-500" /> Доставка: {sup.delivery}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
