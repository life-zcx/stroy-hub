import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './dashboard/Sidebar';
import BrandModal from './dashboard/modals/BrandModal';
import CategoryModal from './dashboard/modals/CategoryModal';
import ProductModal from './dashboard/modals/ProductModal';
import SupplierModal from './dashboard/modals/SupplierModal';
import CallbacksPage from './dashboard/pages/CallbacksPage';
import BrandsPage from './dashboard/pages/BrandsPage';
import CategoriesPage from './dashboard/pages/CategoriesPage';
import OrdersPage from './dashboard/pages/OrdersPage';
import PartnerRequestsPage from './dashboard/pages/PartnerRequestsPage';
import PromotionsPage from './dashboard/pages/PromotionsPage';
import ProductsPage from './dashboard/pages/ProductsPage';
import SuppliersPage from './dashboard/pages/SuppliersPage';
import UsersPage from './dashboard/pages/UsersPage';
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

const ADMIN_PAGES = ['products', 'orders', 'promotions', 'brands', 'callbacks', 'partners', 'categories', 'suppliers', 'users'];
const SUPPLIER_PAGES = ['products', 'orders'];

const pageTitles = {
  products: 'Управление товарами',
  orders: 'Заказы и продажи',
  promotions: 'Акции и скидки',
  brands: 'Бренды-партнеры',
  callbacks: 'Обратные звонки',
  partners: 'Партнерские заявки',
  categories: 'Разделы каталога',
  suppliers: 'Дистрибьюторы',
  users: 'Пользователи системы',
};

function getPageFromHash(hash, allowedPages) {
  const page = hash.replace('#', '');
  return allowedPages.includes(page) ? page : allowedPages[0];
}

export default function Dashboard({ user, onLogout, showToast }) {
  const {
    isSupplier,
    loading,
    products,
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
    handleCallbackStatusChange,
    handleCallbackCommentUpdate,
    handlePartnerRequestStatusChange,
    handlePartnerRequestCommentUpdate,
    handleCreateUser,
    handleUpdateUser,
    handleUpdateUserPassword,
    handleToggleUserBlock,
    getCategoryPath,
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
    products: products.length,
    orders: orders.length,
    callbacks: callbacks.filter((callback) => callback.status === 'pending').length,
    partners: partnerRequests.filter((request) => request.status === 'pending').length,
    promotions: promotions.filter((promotion) => promotion.isCurrentlyActive).length,
    brands: brands.filter((brand) => brand.isActive).length,
    categories: categories.length,
    suppliers: suppliers.length,
    users: users.length,
  };

  const renderPage = () => {
    switch (activePage) {
      case 'orders':
        return (
          <OrdersPage
            orders={orders}
            onStatusChange={handleStatusChange}
            formatPrice={formatPrice}
            getStatusText={getOrderStatusText}
            getStatusClass={getOrderStatusClass}
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
      case 'brands':
        return isSupplier ? null : (
          <BrandsPage
            brands={brands}
            onCreateBrand={startCreateBrand}
            onEditBrand={startEditBrand}
            onDeleteBrand={handleDeleteBrand}
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
            products={products}
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
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
      <main className="flex-1 ml-72 min-h-screen flex flex-col relative overflow-x-hidden">
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{user.name}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                {user.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-8 animate-fade-in-up">
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
