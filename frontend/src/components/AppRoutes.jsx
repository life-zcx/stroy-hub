import React, { lazy, Suspense } from 'react';
import HomePage from '../pages/Home';
import { PATH_TO_CABINET_TAB } from '../hooks/useNavigation';

const Storefront = lazy(() => import('../pages/Storefront'));
const Advisor = lazy(() => import('../pages/Advisor'));
const About = lazy(() => import('../pages/About'));
const EstimatePage = lazy(() => import('../pages/EstimatePage'));
const FavoritesPage = lazy(() => import('../pages/Favorites'));
const Delivery = lazy(() => import('../pages/Delivery'));
const Legal = lazy(() => import('../pages/Legal'));
const ProductPage = lazy(() => import('../pages/ProductPage'));
const Services = lazy(() => import('../pages/Services'));
const PaymentTerms = lazy(() => import('../pages/PaymentTerms'));
const DeliveryTerms = lazy(() => import('../pages/DeliveryTerms'));
const Warranty = lazy(() => import('../pages/Warranty'));
const Faq = lazy(() => import('../pages/Faq'));
const Requisites = lazy(() => import('../pages/Requisites'));
const Partners = lazy(() => import('../pages/Partners'));
const Promotions = lazy(() => import('../pages/Promotions'));
const MyOrderDetails = lazy(() => import('../pages/MyOrderDetails'));
const CashbackPage = lazy(() => import('../pages/CashbackPage'));
const TransactionsHistoryPage = lazy(() => import('../pages/TransactionsHistoryPage'));
const Cabinet = lazy(() => import('../pages/Cabinet'));
const CartPage = lazy(() => import('../pages/CartPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const BlockedPage = lazy(() => import('../pages/BlockedPage'));
const AiAssistantPage = lazy(() => import('../pages/AiAssistantPage'));

const PageLoader = () => (
  <div className="w-full py-24 flex flex-col items-center justify-center space-y-4">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-sm font-medium text-slate-500">Загрузка страницы...</span>
  </div>
);

export default function AppRoutes({
  currentPage,
  currentProductId,
  currentCategorySlug,
  currentOrderId,
  isCabinetPage,
  isNotFound,
  legalTab,
  setCurrentPage,
  handleSetCategory,
  openProductPage,
  setIsCallbackModalOpen,
  handleCustomerUpdate,
  handleLogout,
  showToast,
  catalog,
  auth,
  cart,
  orders,
  region,
  favorites,
  bonuses
}) {
  return (
    <Suspense fallback={<PageLoader />}>
      {currentPage === 'home' && (
        <HomePage
          onNavigate={setCurrentPage}
          setSelectedCategory={handleSetCategory}
          categories={catalog.categories}
          setSearchQuery={catalog.setSearchQuery}
          onAddToCart={cart.handleAddToCart}
          onUpdateCartQuantity={cart.handleSetCartQuantity}
          cart={cart.cart}
          onToggleFavorite={favorites.toggleFavorite}
          isFavorite={favorites.isFavorite}
          onOpenDetails={openProductPage}
          customer={auth.customer}
          bonuses={bonuses}
          onOpenAuth={auth.openLoginModal}
        />
      )}

      {currentPage === 'catalog' && (
        <Storefront
          products={catalog.products}
          categories={catalog.categories}
          loading={catalog.loading}
          loadingMore={catalog.loadingMore}
          hasMore={catalog.hasMore}
          total={catalog.total}
          selectedCategory={catalog.selectedCategory}
          setSelectedCategory={handleSetCategory}
          searchQuery={catalog.searchQuery}
          setSearchQuery={catalog.setSearchQuery}
          sortBy={catalog.sortBy}
          setSortBy={catalog.setSortBy}
          priceRange={catalog.priceRange}
          setPriceRange={catalog.setPriceRange}
          onlyHits={catalog.onlyHits}
          setOnlyHits={catalog.setOnlyHits}
          onlyBulk={catalog.onlyBulk}
          setOnlyBulk={catalog.setOnlyBulk}
          onAddToCart={cart.handleAddToCart}
          onUpdateCartQuantity={cart.handleSetCartQuantity}
          cart={cart.cart}
          onRefresh={catalog.loadProducts}
          onLoadMore={catalog.loadMoreProducts}
          onOpenProduct={openProductPage}
          onNavigate={setCurrentPage}
          currentRegion={region.currentRegion}
          onToggleFavorite={favorites.toggleFavorite}
          isFavorite={favorites.isFavorite}
        />
      )}

      {currentPage === 'advisor' && (
        <Advisor
          products={catalog.products}
          onAddToCart={cart.handleAddToCart}
          showToast={showToast}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'about' && <About />}
      {currentPage === 'estimate' && (
        <EstimatePage
          onAddToCart={cart.handleAddToCart}
          onNavigate={setCurrentPage}
          showToast={showToast}
          customer={auth.customer}
          onRequireAuth={auth.openLoginModal}
        />
      )}
      {currentPage === 'delivery' && <Delivery />}
      {currentPage === 'legal' && <Legal defaultTab={legalTab} onNavigate={setCurrentPage} />}
      {currentPage === 'services' && <Services onOpenCallback={() => setIsCallbackModalOpen(true)} />}
      {currentPage === 'payment-terms' && <PaymentTerms />}
      {currentPage === 'delivery-terms' && <DeliveryTerms />}
      {currentPage === 'warranty' && <Warranty />}
      {currentPage === 'faq' && <Faq />}
      {currentPage === 'requisites' && <Requisites />}
      {currentPage === 'partners' && <Partners showToast={showToast} />}
      {currentPage === 'promotions' && (
        <Promotions
          promotionId={currentProductId}
          onNavigate={setCurrentPage}
          onAddToCart={cart.handleAddToCart}
          onUpdateCartQuantity={cart.handleSetCartQuantity}
          cart={cart.cart}
          onToggleFavorite={favorites.toggleFavorite}
          isFavorite={favorites.isFavorite}
          onOpenCallback={() => setIsCallbackModalOpen(true)}
        />
      )}

      {isCabinetPage && (
        <Cabinet
          customer={auth.customer}
          orders={orders.orders}
          ordersLoading={orders.ordersLoading}
          ordersHasMore={orders.ordersHasMore}
          ordersTotal={orders.ordersTotal}
          onRefreshOrders={orders.fetchMyOrders}
          onLoadMoreOrders={orders.loadMoreOrders}
          bonuses={bonuses}
          onNavigate={setCurrentPage}
          onOpenAuth={auth.openLoginModal}
          handleLogout={handleLogout}
          showToast={showToast}
          onCustomerUpdate={handleCustomerUpdate}
          onAddToCart={cart.handleAddToCart}
          initialTab={PATH_TO_CABINET_TAB[currentPage] || 'profile'}
        />
      )}

      {currentPage === 'cashback' && (
        <CashbackPage
          customer={auth.customer}
          bonuses={bonuses}
          onNavigate={setCurrentPage}
          onOpenAuth={auth.openLoginModal}
        />
      )}
      {currentPage === 'cashback/history' && (
        <TransactionsHistoryPage
          customer={auth.customer}
          bonuses={bonuses}
          onNavigate={setCurrentPage}
          onOpenAuth={auth.openLoginModal}
        />
      )}
      {currentPage === 'order-detail' && (
        <MyOrderDetails
          customer={auth.customer}
          orderId={currentOrderId}
          orders={orders.orders}
          loading={orders.orderDetailsLoading}
          error={orders.orderDetailsError}
          onRefresh={orders.fetchOrderDetails}
          onLoadOrder={orders.fetchOrderDetails}
          onOpenAuth={auth.openLoginModal}
          onNavigate={setCurrentPage}
          onAddToCart={cart.handleAddToCart}
          showToast={showToast}
          bonuses={bonuses}
        />
      )}
      {currentPage === 'product' && (
        <ProductPage
          productId={currentProductId}
          onBackToCatalog={() => setCurrentPage('catalog')}
          onAddToCart={cart.handleAddToCart}
          onUpdateCartQuantity={cart.handleSetCartQuantity}
          cart={cart.cart}
          onNavigate={setCurrentPage}
          categories={catalog.categories}
          setSelectedCategory={handleSetCategory}
          onToggleFavorite={favorites.toggleFavorite}
          isFavorite={favorites.isFavorite}
          showToast={showToast}
        />
      )}

      {currentPage === 'favorites' && (
        <FavoritesPage
          favorites={favorites.favorites}
          onToggleFavorite={favorites.toggleFavorite}
          onAddToCart={cart.handleAddToCart}
          onOpenProduct={openProductPage}
          onNavigate={setCurrentPage}
          onClearAll={favorites.clearFavorites}
        />
      )}

      {(currentPage === 'cart' || currentPage === 'checkout') && (
        <CartPage
          cart={cart.cart}
          onUpdateQuantity={cart.handleUpdateQuantity}
          onRemoveFromCart={cart.handleRemoveFromCart}
          onClearCart={cart.handleClearCart}
          showToast={showToast}
          customer={auth.customer}
          onCustomerUpdate={handleCustomerUpdate}
          onOpenAuth={() => auth.setAuthModalOpen(true)}
          onNavigate={setCurrentPage}
          bonuses={bonuses}
          onAddToCart={cart.handleAddToCart}
          currentPage={currentPage}
        />
      )}

      {currentPage === 'ai-assistant' && (
        <AiAssistantPage
          onAddToCart={cart.handleAddToCart}
          showToast={showToast}
          onNavigate={setCurrentPage}
          onOpenCallback={() => setIsCallbackModalOpen(true)}
        />
      )}

      {auth.customer?.isBlocked && (
        <BlockedPage
          user={auth.customer}
          onLogout={handleLogout}
          onOpenCallback={() => setIsCallbackModalOpen(true)}
        />
      )}

      {isNotFound && !auth.isAuthChecking && (
        <NotFoundPage onNavigate={setCurrentPage} />
      )}
    </Suspense>
  );
}
