import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  getProducts, createProduct, updateProduct, deleteProduct, 
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCategories, createCategory, updateCategory, deleteCategory,
  getOrders, updateOrderStatus 
} from '../services/api';
import { 
  Package as PackageIcon, Truck as TruckIcon, UserCheck as UserCheckIcon, Plus as PlusIcon, 
  Trash2 as Trash2Icon, RefreshCw as RefreshCwIcon, FileSpreadsheet as FileSpreadsheetIcon, 
  PlusCircle as PlusCircleIcon, LogOut as LogOutIcon, ShieldAlert as ShieldAlertIcon, 
  Award as AwardIcon, Layers as LayersIcon, Edit3 as EditIcon, X as XIcon, Image as ImageIcon
} from 'lucide-react';

export default function Dashboard({ user, onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('products'); // products, orders, categories, suppliers
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  // Compute hierarchical tree from flat categories list
  const hierarchicalCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    const map = {};
    const roots = [];
    
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    
    categories.forEach(cat => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat.id]);
      } else {
        roots.push(map[cat.id]);
      }
    });
    
    const result = [];
    const traverse = (node, depth = 0) => {
      result.push({ ...node, depth });
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(child => traverse(child, depth + 1));
    };
    
    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach(root => traverse(root, 0));
    
    return result;
  }, [categories]);
  
  // Loading flags
  const [loading, setLoading] = useState(false);

  // Modal display toggles
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Editing targets
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Forms states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    details: '',
    specifications: '',
    usage: '',
    category: 'mixes',
    categoryId: '',
    price: '',
    oldPrice: '',
    bulkDiscount: '',
    isHit: false,
    supplierId: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    delivery: '1-2 дня',
    rating: 5.0,
    reviews: 0
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    image: '',
    parentId: ''
  });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [previewCategoryImage, setPreviewCategoryImage] = useState('');

  const isSupplier = user.role === 'SUPPLIER';

  const reloadData = async () => {
    setLoading(true);
    try {
      const p = await getProducts();
      setProducts(p);

      const s = await getSuppliers();
      setSuppliers(s);
      
      const c = await getCategories();
      setCategories(c);
      
      // Setup initial supplier in forms
      if (isSupplier) {
        setProductForm(prev => ({ ...prev, supplierId: user.supplierId }));
      } else if (s.length > 0 && !productForm.supplierId) {
        setProductForm(prev => ({ ...prev, supplierId: s[0].id }));
      }

      // Setup initial category in forms
      if (c.length > 0 && !productForm.categoryId) {
        const firstCategory = c[0];
        setProductForm(prev => ({ 
          ...prev, 
          categoryId: firstCategory.id,
          category: firstCategory.slug
        }));
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

  // Product Image Preview
  useEffect(() => {
    if (!imageFile) {
      setPreviewImage(productForm.imageUrl);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewImage(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, productForm.imageUrl]);

  // Category Image Preview
  useEffect(() => {
    if (!categoryImageFile) {
      setPreviewCategoryImage(categoryForm.image);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(categoryImageFile);
    setPreviewCategoryImage(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [categoryImageFile, categoryForm.image]);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'categoryId') {
      const selectedCat = categories.find(c => String(c.id) === String(value));
      setProductForm(prev => ({
        ...prev,
        categoryId: value,
        category: selectedCat ? selectedCat.slug : ''
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const supplierIdToUse = isSupplier ? user.supplierId : productForm.supplierId;
    const categoryIdToUse = productForm.categoryId || (categories[0]?.id || '');
    const categorySlugToUse = productForm.category || (categories[0]?.slug || 'mixes');

    if (!productForm.name || !productForm.price || !supplierIdToUse) {
      alert('Заполните обязательные поля: Название, Цена и Дистрибьютор');
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    if (productForm.description) formData.append('description', productForm.description);
    if (productForm.details) formData.append('details', productForm.details);
    if (productForm.specifications) formData.append('specifications', productForm.specifications);
    if (productForm.usage) formData.append('usage', productForm.usage);
    formData.append('category', categorySlugToUse);
    formData.append('categoryId', categoryIdToUse);
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast('✅ Товар успешно обновлен!');
      } else {
        await createProduct(formData);
        showToast('✅ Карточка товара успешно добавлена!');
      }
      
      resetProductForm();
      setIsProductModalOpen(false);
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения товара: ' + (error.response?.data?.error || error.message));
    }
  };

  const startCreateProduct = () => {
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const startEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || '',
      description: p.description || '',
      details: p.details || '',
      specifications: p.specifications || '',
      usage: p.usage || '',
      category: p.category || '',
      categoryId: p.categoryId || '',
      price: p.price || '',
      oldPrice: p.oldPrice || '',
      bulkDiscount: p.bulkDiscount || '',
      isHit: p.isHit || false,
      supplierId: p.supplierId || '',
      imageUrl: p.image || '',
    });
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      details: '',
      specifications: '',
      usage: '',
      category: categories[0]?.slug || 'mixes',
      categoryId: categories[0]?.id || '',
      price: '',
      oldPrice: '',
      bulkDiscount: '',
      isHit: false,
      supplierId: isSupplier ? user.supplierId : (suppliers[0]?.id || ''),
      imageUrl: '',
    });
    setImageFile(null);
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
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
        showToast('✅ Данные дистрибьютора изменены!');
      } else {
        await createSupplier(supplierForm);
        showToast('🏢 Поставщик зарегистрирован!');
      }
      resetSupplierForm();
      setIsSupplierModalOpen(false);
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения дистрибьютора: ' + (error.response?.data?.error || error.message));
    }
  };

  const startCreateSupplier = () => {
    resetSupplierForm();
    setIsSupplierModalOpen(true);
  };

  const startEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name || '',
      delivery: sup.delivery || '1-2 дня',
      rating: sup.rating || 5.0,
      reviews: sup.reviews || 0
    });
    setIsSupplierModalOpen(true);
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      delivery: '1-2 дня',
      rating: 5.0,
      reviews: 0
    });
  };

  const handleDeleteSupplier = async (id) => {
    if (!confirm('Удалить дистрибьютора? Все его товары также будут удалены!')) return;
    try {
      await deleteSupplier(id);
      showToast('🗑️ Дистрибьютор удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления поставщика: ' + error.message);
    }
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryFileChange = (e) => {
    setCategoryImageFile(e.target.files[0]);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    const formData = new FormData();
    formData.append('name', categoryForm.name);
    if (categoryForm.slug) formData.append('slug', categoryForm.slug);
    if (categoryForm.parentId) formData.append('parentId', categoryForm.parentId);

    if (categoryImageFile) {
      formData.append('imageFile', categoryImageFile);
    } else if (categoryForm.image) {
      formData.append('image', categoryForm.image);
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        showToast('✅ Раздел обновлен!');
      } else {
        await createCategory(formData);
        showToast('✅ Раздел каталога добавлен!');
      }
      resetCategoryForm();
      setIsCategoryModalOpen(false);
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения раздела: ' + (error.response?.data?.error || error.message));
    }
  };

  const startCreateCategory = () => {
    resetCategoryForm();
    setIsCategoryModalOpen(true);
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      slug: cat.slug || '',
      image: cat.image || '',
      parentId: cat.parentId || ''
    });
    setCategoryImageFile(null);
    setIsCategoryModalOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      image: '',
      parentId: ''
    });
    setCategoryImageFile(null);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Вы уверены? Удаление родительского раздела приведет к каскадному удалению всех подразделов!')) return;
    try {
      await deleteCategory(id);
      showToast('🗑️ Раздел каталога удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления раздела: ' + error.message);
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

  // Helper to render nested category lists with indentation
  const getCategoryPath = (catId) => {
    if (!catId) return '';
    const breadcrumbs = [];
    let current = categories.find(c => c.id === catId);
    while (current) {
      breadcrumbs.unshift(current.name);
      current = current.parentId ? categories.find(c => c.id === current.parentId) : null;
    }
    return breadcrumbs.join(' / ');
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
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'categories' 
                ? 'border-amber-500 text-amber-600' 
                : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            <LayersIcon className="h-4.5 w-4.5" />
            Разделы каталога ({categories.length})
          </button>
        )}

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
        <div className="space-y-5 animate-fade-in">
          {/* Header Row with Action Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Зарегистрированные товары</h2>
              <p className="text-xs text-slate-500 mt-0.5">Полный список ассортимента на витрине StroyHub</p>
            </div>
            <button 
              onClick={startCreateProduct}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              Добавить товар
            </button>
          </div>

          {/* Full Width Table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {products.length === 0 ? (
              <p className="text-center py-20 text-slate-500">Товары отсутствуют.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-2">Товар</th>
                      <th className="pb-3 px-2">Категория в базе</th>
                      <th className="pb-3 px-2">Дистрибьютор</th>
                      <th className="pb-3 px-2">Цена</th>
                      <th className="pb-3 pl-2 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-2 font-semibold text-slate-900 max-w-[280px] truncate flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={p.image} className="w-full h-full object-contain" onError={(e) => { e.target.src = 'https://placehold.co/50x50'; }} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate font-bold text-slate-900">{p.name}</span>
                            {p.isHit && (
                              <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded w-fit mt-0.5">ХИТ 🔥</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 text-xs font-semibold">
                          {p.categoryRelation ? getCategoryPath(p.categoryId) : (categories.find(c => c.slug === p.category)?.name || p.category)}
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 text-xs font-bold">{p.supplier?.name}</td>
                        <td className="py-3.5 px-2 font-extrabold text-slate-900">{formatPrice(p.price)}</td>
                        <td className="py-3.5 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => startEditProduct(p)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Редактировать товар"
                            >
                              <EditIcon className="h-4.5 w-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Удалить товар"
                            >
                              <Trash2Icon className="h-4.5 w-4.5" />
                            </button>
                          </div>
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
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
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
                        className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-amber-500/50 cursor-pointer"
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

      {activeTab === 'categories' && !isSupplier && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Row with Action Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Разделы каталога</h2>
              <p className="text-xs text-slate-500 mt-0.5">Настройка структуры и иерархии категорий</p>
            </div>
            <button 
              onClick={startCreateCategory}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              Создать раздел
            </button>
          </div>

          {/* Full Width Grid */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {categories.length === 0 ? (
              <p className="text-center py-20 text-slate-500">Разделы каталога отсутствуют.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pr-2">Изображение</th>
                      <th className="pb-3 px-2">Раздел</th>
                      <th className="pb-3 px-2">Слаг</th>
                      <th className="pb-3 px-2">Родительский раздел</th>
                      <th className="pb-3 pl-2 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hierarchicalCategories.map(cat => (
                      <tr key={cat.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                            {cat.image ? (
                              <img src={cat.image} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <LayersIcon className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-slate-900">
                          <div className="flex items-center" style={{ marginLeft: `${cat.depth * 1.5}rem` }}>
                            {cat.depth > 0 && (
                              <span className="text-slate-300 font-extrabold font-mono mr-2 select-none">
                                └─
                              </span>
                            )}
                            <span className={cat.depth === 0 ? 'font-extrabold text-slate-950 text-sm' : cat.depth === 1 ? 'font-bold text-slate-800 text-sm' : 'font-semibold text-slate-600 text-xs'}>
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-slate-500 font-mono text-xs">{cat.slug}</td>
                        <td className="py-3.5 px-2 text-slate-400 text-xs font-semibold">
                          {cat.parentId ? (
                            <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">
                              {categories.find(c => c.id === cat.parentId)?.name || '—'}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">— Корневой —</span>
                          )}
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => startEditCategory(cat)}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                              title="Редактировать раздел"
                            >
                              <EditIcon className="h-4.5 w-4.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Удалить раздел"
                            >
                              <Trash2Icon className="h-4.5 w-4.5" />
                            </button>
                          </div>
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

      {activeTab === 'suppliers' && !isSupplier && (
        <div className="space-y-5 animate-fade-in">
          {/* Header Row with Action Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Дистрибьюторы на платформе</h2>
              <p className="text-xs text-slate-500 mt-0.5">Официальные склады дилеров и заводов-партнеров</p>
            </div>
            <button 
              onClick={startCreateSupplier}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              Зарегистрировать поставщика
            </button>
          </div>

          {/* Full Width Grid */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {suppliers.map(sup => (
                <div key={sup.id} className="border border-gray-150 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all bg-white">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base">{sup.name}</h3>
                    <div className="space-y-1.5 mt-3">
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-semibold">
                        <TruckIcon className="h-4 w-4 text-emerald-600 shrink-0" /> Доставка: {sup.delivery}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <AwardIcon className="h-4 w-4 text-amber-400 shrink-0" /> Рейтинг: {sup.rating} · {sup.reviews} отзывов
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 border-t border-slate-50 pt-3.5">
                    <button 
                      onClick={() => startEditSupplier(sup)}
                      className="px-3 py-1.5 text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <EditIcon className="h-3.5 w-3.5" /> Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(sup.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Удалить дистрибьютора"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ OVERLAY MODAL: PRODUCT FORM ═══════════════ */}
      {isProductModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsProductModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
                <PlusCircleIcon className={`h-5.5 w-5.5 ${editingProduct ? 'text-amber-500' : 'text-slate-900'}`} />
                {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-5 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название товара *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={productForm.name} 
                    onChange={handleProductChange}
                    required 
                    placeholder="Например, Цемент Портланд М500"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Категория в каталоге *</label>
                  <select 
                    name="categoryId" 
                    value={productForm.categoryId} 
                    onChange={handleProductChange}
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                  >
                    <option value="">Выбрать категорию...</option>
                    {hierarchicalCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {'\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '└─ ' : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Поставщик / Склад *</label>
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
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                    >
                      <option value="">Выбрать поставщика...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Цена (₸) *</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={productForm.price} 
                    onChange={handleProductChange}
                    required 
                    placeholder="2500"
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
                    placeholder="2900"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Короткое описание</label>
                <textarea 
                  name="description" 
                  value={productForm.description} 
                  onChange={handleProductChange}
                  rows={2}
                  placeholder="Основные параметры для быстрого поиска..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Подробное описание товара</label>
                <textarea 
                  name="details" 
                  value={productForm.details} 
                  onChange={handleProductChange}
                  rows={3}
                  placeholder="Полное описание товара, свойства..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Характеристики</label>
                  <textarea 
                    name="specifications" 
                    value={productForm.specifications} 
                    onChange={handleProductChange}
                    rows={2}
                    placeholder="Вес: 30 кг&#10;Марка: М500"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Инструкция по применению</label>
                  <textarea 
                    name="usage" 
                    value={productForm.usage} 
                    onChange={handleProductChange}
                    rows={2}
                    placeholder="Наносить при температуре от +5°С..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Условия опта</label>
                <input 
                  type="text" 
                  name="bulkDiscount" 
                  value={productForm.bulkDiscount} 
                  onChange={handleProductChange}
                  placeholder="от 50 шт: 2300 ₸"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div className="border border-dashed border-slate-200 p-4 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-slate-600 uppercase">Фотография товара</span>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input 
                    type="file" 
                    id="imageFileInput"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  <div className="text-xs text-slate-400 font-bold uppercase shrink-0">Или внешняя ссылка</div>
                  <input 
                    type="text" 
                    name="imageUrl" 
                    value={productForm.imageUrl} 
                    onChange={handleProductChange}
                    placeholder="https://images.com/cement.jpg"
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
                  Отметить как ХИТ продаж 🔥
                </label>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
                  Отмена
                </button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
                  {editingProduct ? 'Сохранить изменения' : 'Загрузить товар'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════ OVERLAY MODAL: CATEGORY FORM ═══════════════ */}
      {isCategoryModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCategoryModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
                <LayersIcon className={`h-5.5 w-5.5 ${editingCategory ? 'text-amber-500' : 'text-slate-950'}`} />
                {editingCategory ? 'Редактировать раздел' : 'Создать новый раздел'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 flex-grow">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название раздела *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={categoryForm.name} 
                  onChange={handleCategoryChange}
                  required 
                  placeholder="Например, Ручные инструменты"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Слаг в URL (необязательно)</label>
                <input 
                  type="text" 
                  name="slug" 
                  value={categoryForm.slug} 
                  onChange={handleCategoryChange}
                  placeholder="hand-tools (сгенерируется автоматически)"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Родительский раздел</label>
                <select 
                  name="parentId" 
                  value={categoryForm.parentId} 
                  onChange={handleCategoryChange}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm cursor-pointer"
                >
                  <option value="">— Корневая категория —</option>
                  {hierarchicalCategories
                    .filter(c => !editingCategory || c.id !== editingCategory.id) // Avoid referencing itself
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {'\u00A0\u00A0'.repeat(c.depth)}{c.depth > 0 ? '└─ ' : ''}{c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="border border-dashed border-slate-200 p-4 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-slate-600 uppercase">Изображение раздела</span>
                
                {/* Photo File Upload support for Category */}
                <div className="space-y-3">
                  <div>
                    <input 
                      type="file" 
                      id="categoryFileInput"
                      accept="image/*"
                      onChange={handleCategoryFileChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                  </div>
                  <div className="text-center text-xs text-slate-400 font-bold uppercase">Или URL</div>
                  <div>
                    <input 
                      type="text" 
                      name="image" 
                      value={categoryForm.image} 
                      onChange={handleCategoryChange}
                      placeholder="https://images.com/category.jpg"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-xs text-slate-700"
                      disabled={!!categoryImageFile}
                    />
                  </div>
                </div>

                {/* Visual Preview */}
                {previewCategoryImage && (
                  <div className="relative w-full h-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden animate-fade-in">
                    <img src={previewCategoryImage} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
                  Отмена
                </button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
                  {editingCategory ? 'Сохранить изменения' : 'Создать раздел'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════ OVERLAY MODAL: SUPPLIER FORM ═══════════════ */}
      {isSupplierModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsSupplierModalOpen(false)} />
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto animate-slide-up z-10 p-6 sm:p-8 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
                <UserCheckIcon className={`h-5.5 w-5.5 ${editingSupplier ? 'text-amber-500' : 'text-slate-950'}`} />
                {editingSupplier ? 'Редактировать дистрибьютора' : 'Регистрация дистрибьютора'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-4 flex-grow">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Название компании *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={supplierForm.name} 
                  onChange={handleSupplierChange}
                  required 
                  placeholder="ТОО СтройОптАзия"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Рейтинг поставщика</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="1" 
                    max="5"
                    name="rating" 
                    value={supplierForm.rating} 
                    onChange={handleSupplierChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Количество отзывов</label>
                  <input 
                    type="number" 
                    name="reviews" 
                    value={supplierForm.reviews} 
                    onChange={handleSupplierChange}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm">
                  Отмена
                </button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-sm shadow-md">
                  {editingSupplier ? 'Сохранить изменения' : 'Зарегистрировать'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
