import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './dashboard/Sidebar';
import BrandModal from './dashboard/modals/BrandModal';
import CategoryModal from './dashboard/modals/CategoryModal';
import ProductModal from './dashboard/modals/ProductModal';
import { LogOut, RefreshCw } from 'lucide-react';
import SupplierModal from './dashboard/modals/SupplierModal';
import CallbacksPage from './dashboard/pages/CallbacksPage';
import BrandsPage from './dashboard/pages/BrandsPage';
import CategoriesPage from './dashboard/pages/CategoriesPage';
import OrdersPage from './dashboard/pages/OrdersPage';
import PartnerRequestsPage from './dashboard/pages/PartnerRequestsPage';
import PromotionsPage from './dashboard/pages/PromotionsPage';
import ReviewPromosPage from './dashboard/pages/ReviewPromosPage';
import ProductsPage from './dashboard/pages/ProductsPage';
import SuppliersPage from './dashboard/pages/SuppliersPage';
import UsersPage from './dashboard/pages/UsersPage';
import PricingPage from './dashboard/pages/PricingPage';
import AnalyticsPage from './dashboard/pages/AnalyticsPage';
import ReviewsPage from './dashboard/pages/ReviewsPage';
import CashbackSettingsPage from './dashboard/pages/CashbackSettingsPage';
import PromotionModal from './dashboard/modals/PromotionModal';
import { useDashboardData } from './dashboard/useDashboardData';
import {
  formatPrice,
  getCallbackStatusClass,
  getCallbackStatusText,
  getOrderStatusClass,
  getOrderStatusText,
  getPartnerRequestStatusClass,
  getPartnerRequestStatusText,
} from './dashboard/utils';

const ADMIN_PAGES = ['orders', 'callbacks', 'partners', 'reviews', 'cashback', 'review-promos', 'promotions', 'products', 'categories', 'brands', 'pricing', 'analytics', 'suppliers', 'users'];
const SUPPLIER_PAGES = ['products', 'orders'];

const pageTitles = {
  products: 'Управление товарами',
  orders: 'Заказы и продажи',
  pricing: 'Ценообразование и Маржа',
  analytics: 'Аналитика и Отчеты',
  promotions: 'Акции и скидки',
  'review-promos': 'Промокоды',
  brands: 'Бренды-партнеры',
  reviews: 'Модерация отзывов',
  callbacks: 'Обратные звонки',
  partners: 'Партнерские заявки',
  categories: 'Разделы каталога',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи системы',
  cashback: 'Управление кешбэком',
};

function getPageFromHash(hash, allowedPages) {
  const cleanHash = hash.replace('#', '');
  const page = cleanHash.split('/')[0];
  return allowedPages.includes(page) ? page : allowedPages[0];
}

export default function Dashboard({ user, onLogout, showToast }) {
  const {
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
    getCategoryPath,
    reviews,
  } = useDashboardData({ user, showToast });

  const allowedPages = useMemo(
    () => (isSupplier ? SUPPLIER_PAGES : ADMIN_PAGES),
    [isSupplier]
  );

  const [activePage, setActivePage] = useState(() => {
    if (typeof window === 'undefined') {
      return allowedPages[0];
    }

    return getPageFromHash(window.location.hash, allowedPages);
  });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const syncPageFromHash = () => {
      setActivePage(getPageFromHash(window.location.hash, allowedPages));
    };

    syncPageFromHash();
    window.addEventListener('hashchange', syncPageFromHash);

    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, [allowedPages]);

  useEffect(() => {
    if (allowedPages.includes(activePage)) {
      return;
    }

    setActivePage(allowedPages[0]);
  }, [activePage, allowedPages]);

  const handlePageChange = (page) => {
    if (!allowedPages.includes(page)) {
      return;
    }

    window.location.hash = page;
    setActivePage(page);
  };

  const counts = {
    products: productTotal,
    orders: orders.length,
    pricing: 0,
    logistics: 0,
    analytics: 0,
    callbacks: callbacks.filter((callback) => callback.status === 'pending').length,
    partners: partnerRequests.filter((request) => request.status === 'pending').length,
    promotions: promotions.filter((promotion) => promotion.isCurrentlyActive && !promotion.userId && !promotion.promoCode?.startsWith('REV-')).length,
    'review-promos': promotions.filter((promotion) => promotion.userId !== null || promotion.promoCode?.startsWith('REV-')).length,
    brands: brands.filter((brand) => brand.isActive).length,
    categories: categories.length,
    suppliers: suppliers.length,
    users: users.length,
    reviews: reviews.filter((r) => !r.isApproved).length,
  };

  const renderPage = () => {
    switch (activePage) {
      case 'pricing':
        return <PricingPage showToast={showToast} />;
      case 'analytics':
        return <AnalyticsPage showToast={showToast} />;
      case 'orders':
        return (
          <OrdersPage
            orders={orders}
            products={products}
            onStatusChange={handleStatusChange}
            onUpdateOrder={handleUpdateOrder}
            formatPrice={formatPrice}
            getStatusText={getOrderStatusText}
            getStatusClass={getOrderStatusClass}
            userRole={user.role}
            showToast={showToast}
          />
        );
      case 'callbacks':
        return (
          <CallbacksPage
            callbacks={callbacks}
            onStatusChange={handleCallbackStatusChange}
            onCommentUpdate={handleCallbackCommentUpdate}
            getCallbackStatusClass={getCallbackStatusClass}
            getCallbackStatusText={getCallbackStatusText}
          />
        );
      case 'promotions':
        return isSupplier ? null : (
          <PromotionsPage
            promotions={promotions}
            onCreatePromotion={startCreatePromotion}
            onEditPromotion={startEditPromotion}
            onDeletePromotion={handleDeletePromotion}
            formatPrice={formatPrice}
          />
        );
      case 'review-promos':
        return isSupplier ? null : (
          <ReviewPromosPage
            promotions={promotions}
            onEditPromotion={startEditPromotion}
            onDeletePromotion={handleDeletePromotion}
            formatPrice={formatPrice}
          />
        );
      case 'brands':
        return isSupplier ? null : (
          <BrandsPage
            brands={brands}
            onCreateBrand={startCreateBrand}
            onEditBrand={startEditBrand}
            onDeleteBrand={handleDeleteBrand}
          />
        );
      case 'reviews':
        return isSupplier ? null : (
          <ReviewsPage
            reviews={reviews}
            onApprove={handleApproveReview}
            onDelete={handleDeleteReview}
          />
        );
      case 'categories':
        return isSupplier ? null : (
          <CategoriesPage
            categories={categories}
            hierarchicalCategories={hierarchicalCategories}
            onCreateCategory={startCreateCategory}
            onEditCategory={startEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'partners':
        return isSupplier ? null : (
          <PartnerRequestsPage
            requests={partnerRequests}
            onStatusChange={handlePartnerRequestStatusChange}
            onCommentUpdate={handlePartnerRequestCommentUpdate}
            getStatusClass={getPartnerRequestStatusClass}
            getStatusText={getPartnerRequestStatusText}
          />
        );
      case 'suppliers':
        return isSupplier ? null : (
          <SuppliersPage
            suppliers={suppliers}
            onCreateSupplier={startCreateSupplier}
            onEditSupplier={startEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        );
      case 'cashback':
        return isSupplier ? null : (
          <CashbackSettingsPage showToast={showToast} />
        );
      case 'users':
        return isSupplier ? null : (
          <UsersPage
            currentUser={user}
            users={users}
            suppliers={suppliers}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onUpdateUserPassword={handleUpdateUserPassword}
            onToggleUserBlock={handleToggleUserBlock}
          />
        );
      case 'products':
      default:
        return (
          <ProductsPage
            user={user}
            suppliers={suppliers}
            categories={categories}
            onCreateProduct={startCreateProduct}
            onEditProduct={startEditProduct}
            onDeleteProduct={handleDeleteProduct}
            formatPrice={formatPrice}
            getCategoryPath={getCategoryPath}
          />
        );
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-slate-50/50 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onPageChange={handlePageChange}
        pages={allowedPages}
        counts={counts}
        user={user}
        onLogout={onLogout}
        onReload={reloadData}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-72 h-screen flex flex-col relative overflow-hidden">
        {/* Compact Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-outfit uppercase">
              {pageTitles[activePage]}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Панель управления / {activePage}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isSupplier && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">
                Склад: {user.supplierName}
              </span>
            )}
            <div className="h-8 w-px bg-slate-200" />
            <div className="relative header-user-menu-container">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity"
              >
                <span className="text-xs font-bold text-slate-700">{user.name}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-sm">
                  {user.name?.[0] || 'A'}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-50 p-3 animate-fade-in-up">
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-2 text-left">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{user.name || 'Пользователь'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{user.role}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        reloadData();
                      }}
                      disabled={loading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                      <span>Синхронизировать</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Выйти из системы</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 animate-fade-in-up admin-main-scroll">
          {renderPage()}
        </div>
      </main>

      {/* Modals remain same */}
      <ProductModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        editingProduct={editingProduct}
        productForm={productForm}
        hierarchicalCategories={hierarchicalCategories}
        suppliers={suppliers}
        isSupplier={isSupplier}
        user={user}
        imageFile={imageFile}
        onFormChange={handleProductChange}
        onFileChange={handleFileChange}
      />

      <CategoryModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        hierarchicalCategories={hierarchicalCategories}
        categoryImageFile={categoryImageFile}
        previewCategoryImage={previewCategoryImage}
        onFormChange={handleCategoryChange}
        onFileChange={handleCategoryFileChange}
      />

      <SupplierModal
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
        editingSupplier={editingSupplier}
        supplierForm={supplierForm}
        onFormChange={handleSupplierChange}
      />

      <PromotionModal
        open={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        onSubmit={handlePromotionSubmit}
        editingPromotion={editingPromotion}
        promotionForm={promotionForm}
        onFormChange={handlePromotionChange}
        onTargetToggle={handlePromotionTargetToggle}
        onTierChange={handlePromotionTierChange}
        onAddTier={handleAddPromotionTier}
        onRemoveTier={handleRemovePromotionTier}
        products={products}
        categories={hierarchicalCategories}
      />

      <BrandModal
        open={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSubmit={handleBrandSubmit}
        editingBrand={editingBrand}
        brandForm={brandForm}
        onFormChange={handleBrandChange}
        onFileChange={handleBrandFileChange}
      />
    </div>
  );
}
