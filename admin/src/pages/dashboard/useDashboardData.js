import { useEffect, useMemo, useState } from 'react';
import {
  createBrand,
  createCategory,
  createPromotion,
  createProduct,
  createSupplier,
  createUser,
  deleteBrand,
  deleteCategory,
  deletePromotion,
  deleteProduct,
  deleteSupplier,
  getBrands,
  getCallbacks,
  getCategories,
  getOrders,
  getPartnerRequests,
  getPromotions,
  getProductsPaged,
  getProducts,
  getSuppliers,
  getUsers,
  updateBrand,
  updateCallback as updateCallbackAPI,
  updateCategory,
  updateOrderStatus,
  updateOrder as updateOrderAPI,
  updatePromotion,
  updateProduct,
  updatePartnerRequest,
  updateSupplier,
  updateUser,
  updateUserBlockStatus,
  updateUserPassword,
  getReviews,
  approveReview,
  deleteReview,
} from '../../services/api';
import { buildHierarchicalCategories, getCategoryPath } from './utils';

function createEmptyProductForm({ categories, suppliers, isSupplier, user }) {
  return {
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
  };
}

function createEmptySupplierForm() {
  return {
    name: '',
    delivery: '1-2 дня',
    rating: 5.0,
    reviews: 0,
  };
}

function createEmptyCategoryForm() {
  return {
    name: '',
    slug: '',
    image: '',
    parentId: '',
  };
}

function createEmptyPromotionForm() {
  return {
    title: '',
    description: '',
    badge: '',
    promoCode: '',
    scope: 'ORDER',
    discountType: 'PERCENT',
    discountValue: '10',
    minOrderAmount: '',
    minQuantity: '',
    theme: 'emerald',
    usageLimit: '',
    targetProductIds: [],
    targetCategoryIds: [],
    quantityTiers: [],
    startsAt: '',
    endsAt: '',
    isActive: true,
    showOnSite: true,
    showOnHome: false,
  };
}

function createEmptyBrandForm() {
  return {
    name: '',
    description: '',
    logo: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formatDateTimeInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

export function useDashboardData({ user, showToast }) {
  // products is now only a lightweight first-page batch for sidebar counts.
  // Full paginated listing lives in ProductsPage and PricingPage.
  const [products, setProducts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);

  const isSupplier = user.role === 'SUPPLIER';

  const [productForm, setProductForm] = useState(() =>
    createEmptyProductForm({ categories: [], suppliers: [], isSupplier, user })
  );
  const [supplierForm, setSupplierForm] = useState(createEmptySupplierForm);
  const [categoryForm, setCategoryForm] = useState(createEmptyCategoryForm);
  const [promotionForm, setPromotionForm] = useState(createEmptyPromotionForm);
  const [brandForm, setBrandForm] = useState(createEmptyBrandForm);

  const [imageFile, setImageFile] = useState(null);
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [previewCategoryImage, setPreviewCategoryImage] = useState('');

  const hierarchicalCategories = useMemo(
    () => buildHierarchicalCategories(categories),
    [categories]
  );

  const reloadData = async () => {
    setLoading(true);

    try {
      // Load only first page of products to populate sidebar count.
      // ProductsPage / PricingPage each manage their own paginated fetches.
      const firstPage = await getProductsPaged({ page: 1, limit: 50 });
      setProducts(firstPage.data || []);
      setProductTotal(firstPage.total || 0);

      const loadedSuppliers = await getSuppliers();
      setSuppliers(loadedSuppliers);

      const loadedCategories = await getCategories();
      setCategories(loadedCategories);

      if (isSupplier) {
        setProductForm((prev) => ({ ...prev, supplierId: user.supplierId }));
      } else if (loadedSuppliers.length > 0 && !productForm.supplierId) {
        setProductForm((prev) => ({ ...prev, supplierId: loadedSuppliers[0].id }));
      }

      if (loadedCategories.length > 0 && !productForm.categoryId) {
        const firstCategory = loadedCategories[0];
        setProductForm((prev) => ({
          ...prev,
          categoryId: firstCategory.id,
          category: firstCategory.slug,
        }));
      }

      const loadedOrders = await getOrders();
      setOrders(loadedOrders);

      if (!isSupplier) {
        const loadedCallbacks = await getCallbacks();
        setCallbacks(loadedCallbacks);

        const loadedPartnerRequests = await getPartnerRequests();
        setPartnerRequests(loadedPartnerRequests);

        const loadedUsers = await getUsers();
        setUsers(loadedUsers);

        const loadedPromotions = await getPromotions();
        setPromotions(loadedPromotions);

        const loadedBrands = await getBrands();
        setBrands(loadedBrands);

        const loadedReviews = await getReviews();
        setReviews(loadedReviews);
      } else {
        setCallbacks([]);
        setPromotions([]);
        setBrands([]);
        setReviews([]);
      }
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

  useEffect(() => {
    if (!categoryImageFile) {
      setPreviewCategoryImage(categoryForm.image);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(categoryImageFile);
    setPreviewCategoryImage(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [categoryImageFile, categoryForm.image]);

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm(createEmptyProductForm({ categories, suppliers, isSupplier, user }));
    setImageFile(null);
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierForm(createEmptySupplierForm());
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm(createEmptyCategoryForm());
    setCategoryImageFile(null);
  };

  const resetPromotionForm = () => {
    setEditingPromotion(null);
    setPromotionForm(createEmptyPromotionForm());
  };

  const resetBrandForm = () => {
    setEditingBrand(null);
    setBrandForm(createEmptyBrandForm());
    setBrandLogoFile(null);
  };

  const handleProductChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'categoryId') {
      const selectedCategory = categories.find((category) => String(category.id) === String(value));
      setProductForm((prev) => ({
        ...prev,
        categoryId: value,
        category: selectedCategory ? selectedCategory.slug : '',
      }));
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

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

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      details: product.details || '',
      specifications: product.specifications || '',
      usage: product.usage || '',
      category: product.category || '',
      categoryId: product.categoryId || '',
      price: product.wholesalePrice || product.price || '',
      oldPrice: product.oldPrice || '',
      bulkDiscount: product.bulkDiscount || '',
      isHit: product.isHit || false,
      supplierId: product.supplierId || '',
      imageUrl: product.image || '',
    });
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить товар?')) {
      return;
    }

    try {
      await deleteProduct(id);
      showToast('🗑️ Товар удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления: ' + error.message);
    }
  };

  const handleSupplierChange = (event) => {
    const { name, value } = event.target;
    setSupplierForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();

    if (!supplierForm.name || !supplierForm.delivery) {
      return;
    }

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

  const startEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      delivery: supplier.delivery || '1-2 дня',
      rating: supplier.rating || 5.0,
      reviews: supplier.reviews || 0,
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!confirm('Удалить дистрибьютора? Все его товары также будут удалены!')) {
      return;
    }

    try {
      await deleteSupplier(id);
      showToast('🗑️ Дистрибьютор удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления поставщика: ' + error.message);
    }
  };

  const handlePromotionSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...promotionForm,
      targetProductIds: promotionForm.targetProductIds,
      targetCategoryIds: promotionForm.targetCategoryIds,
      quantityTiers: promotionForm.quantityTiers.filter((tier) => tier.minQuantity && tier.discountValue),
      startsAt: toIsoOrNull(promotionForm.startsAt),
      endsAt: toIsoOrNull(promotionForm.endsAt),
    };

    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, payload);
        showToast('✅ Акция обновлена!');
      } else {
        await createPromotion(payload);
        showToast('🎯 Новая акция опубликована!');
      }

      resetPromotionForm();
      setIsPromotionModalOpen(false);
      reloadData();
    } catch (error) {
      console.error(error);
      const isMissingRoute = error.response?.status === 404;
      const message = isMissingRoute
        ? 'API акций не найден. Перезапустите backend, чтобы он подхватил новый маршрут /api/promotions.'
        : (error.response?.data?.error || error.message);
      alert('Ошибка сохранения акции: ' + message);
    }
  };

  const startCreatePromotion = () => {
    resetPromotionForm();
    setIsPromotionModalOpen(true);
  };

  const startEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setPromotionForm({
      title: promotion.title || '',
      description: promotion.description || '',
      badge: promotion.badge || '',
      promoCode: promotion.promoCode || '',
      scope: promotion.scope || 'ORDER',
      discountType: promotion.discountType || 'PERCENT',
      discountValue: String(promotion.discountValue ?? ''),
      minOrderAmount: promotion.minOrderAmount ? String(promotion.minOrderAmount) : '',
      minQuantity: promotion.minQuantity ? String(promotion.minQuantity) : '',
      theme: promotion.theme || 'emerald',
      usageLimit: promotion.usageLimit ? String(promotion.usageLimit) : '',
      targetProductIds: (promotion.targetProductIds || []).map(String),
      targetCategoryIds: (promotion.targetCategoryIds || []).map(String),
      quantityTiers: (promotion.quantityTiers || []).map((tier) => ({
        minQuantity: String(tier.minQuantity ?? ''),
        discountValue: String(tier.discountValue ?? ''),
      })),
      startsAt: formatDateTimeInput(promotion.startsAt),
      endsAt: formatDateTimeInput(promotion.endsAt),
      isActive: promotion.isActive ?? true,
      showOnSite: promotion.showOnSite ?? true,
      showOnHome: promotion.showOnHome ?? false,
    });
    setIsPromotionModalOpen(true);
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!confirm('Удалить акцию? Если она уже применялась в заказах, удаление будет запрещено.')) {
      return;
    }

    try {
      await deletePromotion(promotionId);
      showToast('🗑️ Акция удалена');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления акции: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBrandSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('name', brandForm.name);
    formData.append('description', brandForm.description);
    formData.append('sortOrder', brandForm.sortOrder || '0');
    formData.append('isActive', String(brandForm.isActive));

    if (brandLogoFile) {
      formData.append('logoFile', brandLogoFile);
    } else if (brandForm.logo) {
      formData.append('logo', brandForm.logo);
    }

    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData);
        showToast('✅ Бренд обновлен!');
      } else {
        await createBrand(formData);
        showToast('🏷️ Бренд добавлен на главную!');
      }

      resetBrandForm();
      setIsBrandModalOpen(false);
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения бренда: ' + (error.response?.data?.error || error.message));
    }
  };

  const startCreateBrand = () => {
    resetBrandForm();
    setIsBrandModalOpen(true);
  };

  const startEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name || '',
      description: brand.description || '',
      logo: brand.logo || '',
      sortOrder: String(brand.sortOrder ?? 0),
      isActive: brand.isActive ?? true,
    });
    setBrandLogoFile(null);
    setIsBrandModalOpen(true);
  };

  const handleDeleteBrand = async (brandId) => {
    if (!confirm('Удалить бренд-партнер с главной страницы?')) {
      return;
    }

    try {
      await deleteBrand(brandId);
      showToast('🗑️ Бренд удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления бренда: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryFileChange = (event) => {
    setCategoryImageFile(event.target.files[0]);
  };

  const handlePromotionChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPromotionForm((prev) => ({
      ...prev,
      ...(name === 'scope'
        ? {
            targetProductIds: value === 'PRODUCT' ? prev.targetProductIds : [],
            targetCategoryIds: value === 'CATEGORY' ? prev.targetCategoryIds : [],
          }
        : {}),
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePromotionTargetToggle = (field, id) => {
    setPromotionForm((prev) => {
      const stringId = String(id);
      const list = prev[field] || [];

      return {
        ...prev,
        [field]: list.includes(stringId)
          ? list.filter((item) => item !== stringId)
          : [...list, stringId],
      };
    });
  };

  const handlePromotionTierChange = (index, field, value) => {
    setPromotionForm((prev) => ({
      ...prev,
      quantityTiers: prev.quantityTiers.map((tier, tierIndex) => (
        tierIndex === index ? { ...tier, [field]: value } : tier
      )),
    }));
  };

  const handleAddPromotionTier = () => {
    setPromotionForm((prev) => ({
      ...prev,
      quantityTiers: [...prev.quantityTiers, { minQuantity: '', discountValue: '' }],
    }));
  };

  const handleRemovePromotionTier = (index) => {
    setPromotionForm((prev) => ({
      ...prev,
      quantityTiers: prev.quantityTiers.filter((_, tierIndex) => tierIndex !== index),
    }));
  };

  const handleBrandChange = (event) => {
    const { name, value, type, checked } = event.target;
    setBrandForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBrandFileChange = (event) => {
    setBrandLogoFile(event.target.files[0] || null);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    if (!categoryForm.name) {
      return;
    }

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

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      image: category.image || '',
      parentId: category.parentId || '',
    });
    setCategoryImageFile(null);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Вы уверены? Удаление родительского раздела приведет к каскадному удалению всех подразделов!')) {
      return;
    }

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

  const handleUpdateOrder = async (orderId, orderData) => {
    try {
      await updateOrderAPI(orderId, orderData);
      showToast('💾 Заказ успешно сохранен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка обновления заказа: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCallbackStatusChange = async (callbackId, newStatus) => {
    try {
      await updateCallbackAPI(callbackId, newStatus);
      showToast('🔄 Статус заявки изменен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка: ' + error.message);
    }
  };

  const handleCallbackCommentUpdate = async (callbackId, currentStatus, newComment) => {
    try {
      await updateCallbackAPI(callbackId, currentStatus, newComment);
      showToast('📝 Комментарий обновлен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка: ' + error.message);
    }
  };

  const handlePartnerRequestStatusChange = async (requestId, newStatus) => {
    try {
      await updatePartnerRequest(requestId, newStatus);
      showToast('🔄 Статус партнерской заявки изменен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    }
  };

  const handlePartnerRequestCommentUpdate = async (requestId, currentStatus, newComment) => {
    try {
      await updatePartnerRequest(requestId, currentStatus, newComment);
      showToast('📝 Комментарий по партнерской заявке обновлен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      showToast('✅ Пользователь создан.');
      await reloadData();
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.error || error.message);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await updateUser(userId, userData);
      showToast('✅ Данные пользователя обновлены.');
      await reloadData();
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.error || error.message);
    }
  };

  const handleUpdateUserPassword = async (userId, password) => {
    try {
      await updateUserPassword(userId, password);
      showToast('🔐 Пароль пользователя обновлен.');
      await reloadData();
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.error || error.message);
    }
  };

  const handleToggleUserBlock = async (userId, isBlocked) => {
    try {
      await updateUserBlockStatus(userId, isBlocked);
      showToast(isBlocked ? '⛔ Пользователь заблокирован.' : '✅ Пользователь разблокирован.');
      await reloadData();
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.error || error.message);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await approveReview(reviewId);
      showToast('✅ Отзыв успешно одобрен!');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка при одобрении отзыва: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }
    try {
      await deleteReview(reviewId);
      showToast('🗑️ Отзыв удален');
      reloadData();
    } catch (error) {
      console.error(error);
      alert('Ошибка при удалении отзыва: ' + (error.response?.data?.error || error.message));
    }
  };

  return {
    isSupplier,
    loading,
    products,
    productTotal,
    suppliers,
    categories,
    orders,
    callbacks,
    partnerRequests,
    promotions,
    brands,
    users,
    hierarchicalCategories,
    isProductModalOpen,
    isCategoryModalOpen,
    isSupplierModalOpen,
    isPromotionModalOpen,
    isBrandModalOpen,
    editingProduct,
    editingCategory,
    editingSupplier,
    editingPromotion,
    editingBrand,
    productForm,
    supplierForm,
    categoryForm,
    promotionForm,
    brandForm,
    imageFile,
    categoryImageFile,
    previewCategoryImage,
    reloadData,
    setIsProductModalOpen,
    setIsCategoryModalOpen,
    setIsSupplierModalOpen,
    setIsPromotionModalOpen,
    setIsBrandModalOpen,
    handleProductChange,
    handleFileChange,
    handleProductSubmit,
    startCreateProduct,
    startEditProduct,
    handleDeleteProduct,
    handleSupplierChange,
    handleSupplierSubmit,
    startCreateSupplier,
    startEditSupplier,
    handleDeleteSupplier,
    handlePromotionChange,
    handlePromotionTargetToggle,
    handlePromotionTierChange,
    handleAddPromotionTier,
    handleRemovePromotionTier,
    handlePromotionSubmit,
    startCreatePromotion,
    startEditPromotion,
    handleDeletePromotion,
    handleBrandChange,
    handleBrandFileChange,
    handleBrandSubmit,
    startCreateBrand,
    startEditBrand,
    handleDeleteBrand,
    handleCategoryChange,
    handleCategoryFileChange,
    handleCategorySubmit,
    startCreateCategory,
    startEditCategory,
    handleDeleteCategory,
    handleStatusChange,
    handleUpdateOrder,
    handleCallbackStatusChange,
    handleCallbackCommentUpdate,
    handlePartnerRequestStatusChange,
    handlePartnerRequestCommentUpdate,
    handleCreateUser,
    handleUpdateUser,
    handleUpdateUserPassword,
    handleToggleUserBlock,
    handleApproveReview,
    handleDeleteReview,
    getCategoryPath: (categoryId) => getCategoryPath(categories, categoryId),
    resetProductForm,
    resetSupplierForm,
    resetCategoryForm,
    resetPromotionForm,
    resetBrandForm,
    user,
    reviews,
  };
}
