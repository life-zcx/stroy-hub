import React, { useEffect, useState } from 'react';
import Storefront from './pages/Storefront';
import HomePage from './pages/Home';
import Advisor from './pages/Advisor';
import About from './pages/About';
import FavoritesPage from './pages/Favorites';
import Delivery from './pages/Delivery';
import Legal from './pages/Legal';
import ProductPage from './pages/ProductPage';
import Services from './pages/Services';
import PaymentTerms from './pages/PaymentTerms';
import DeliveryTerms from './pages/DeliveryTerms';
import Warranty from './pages/Warranty';
import Faq from './pages/Faq';
import Requisites from './pages/Requisites';
import Partners from './pages/Partners';
import Promotions from './pages/Promotions';
import MyOrders from './pages/MyOrders';
import MyOrderDetails from './pages/MyOrderDetails';
import CartSidebar from './components/CartSidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import RegionModal from './components/RegionModal';
import CallbackModal from './components/CallbackModal';
import Toast from './components/Toast';
import useToast from './hooks/useToast';
import useNavigation from './hooks/useNavigation';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useCustomerAuth from './hooks/useCustomerAuth';
import useOrders from './hooks/useOrders';
import useRegion from './hooks/useRegion';
import useFavorites from './hooks/useFavorites'
import { getAnalyticsSessionId, setAnalyticsContext, trackEvent } from './utils/analytics';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('user-agreement');

  const { toast, showToast } = useToast();
  const { currentPage, currentProductId, currentCategorySlug, currentOrderId, setCurrentPage, openProductPage } = useNavigation();
  const catalog = useCatalog(showToast, currentCategorySlug || 'all');
  const cart = useCart(showToast);
  const auth = useCustomerAuth(showToast);
  const orders = useOrders(auth.customer, showToast);
  const region = useRegion(showToast);
  const favorites = useFavorites(showToast);

  // Sync category from URL to catalog state
  useEffect(() => {
    if (currentPage === 'catalog' && currentCategorySlug) {
      catalog.setSelectedCategory(currentCategorySlug);
    } else if (currentPage === 'catalog' && !currentCategorySlug) {
      catalog.setSelectedCategory('all');
    }
  }, [currentCategorySlug, currentPage]);

  // Sync category from catalog state back to URL
  const handleSetCategory = (slug) => {
    catalog.setSelectedCategory(slug);
    setCurrentPage('catalog', null, slug);
  };

  useEffect(() => {
    localStorage.setItem('tormag_current_page', currentPage);
    if (currentProductId) {
      localStorage.setItem('tormag_product_id', currentProductId);
    } else {
      localStorage.removeItem('tormag_product_id');
    }
  }, [currentPage, currentProductId]);

  // Dynamic SEO Page Titles
  useEffect(() => {
    const pageTitles = {
      home: "TORMAG — Всё для стройки и ремонта",
      catalog: "TORMAG - Каталог стройматериалов",
      advisor: "TORMAG - Умный подбор стройматериалов",
      about: "TORMAG - О компании",
      delivery: "TORMAG - Доставка и оплата",
      services: "TORMAG - Строительные услуги",
      partners: "TORMAG - Наши партнеры",
      promotions: "TORMAG - Акции и скидки",
      favorites: "TORMAG - Избранные товары",
      orders: "TORMAG - Мои заказы",
      requisites: "TORMAG - Реквизиты компании",
      faq: "TORMAG - Вопрос-ответ",
      legal: "TORMAG - Юридическая информация",
      product: "TORMAG - Просмотр товара"
    };

    const newTitle = pageTitles[currentPage] || "TORMAG — Всё для стройки и ремонта";
    document.title = newTitle;
  }, [currentPage]);

  useEffect(() => {
    setAnalyticsContext({
      region: region.currentRegion,
      country: 'Казахстан',
      city: region.currentRegion,
    });
  }, [region.currentRegion]);

  useEffect(() => {
    trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      sessionId: getAnalyticsSessionId(),
      region: region.currentRegion,
      country: 'Казахстан',
      city: region.currentRegion,
    });
  }, [currentPage, currentProductId, currentCategorySlug, currentOrderId, region.currentRegion]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (auth.authModalOpen || cart.isCartOpen || region.regionModalOpen || isCallbackModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [auth.authModalOpen, cart.isCartOpen, region.regionModalOpen, isCallbackModalOpen]);

  useEffect(() => {
    if (currentPage === 'orders' && auth.customer) {
      orders.fetchMyOrders();
    }
  }, [currentPage, auth.customer]);

  const handleLogout = () => {
    auth.handleLogout();
    orders.clearOrders();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      <Header
        isScrolled={isScrolled}
        currentRegion={region.currentRegion}
        onOpenRegion={() => region.setRegionModalOpen(true)}
        customer={auth.customer}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        setSelectedCategory={handleSetCategory}
        cartItemsCount={cart.cartItemsCount}
        onOpenCart={() => cart.setIsCartOpen(true)}
        onOpenAuthLogin={auth.openLoginModal}
        onOpenCallback={() => setIsCallbackModalOpen(true)}
        onOpenFavorites={() => setCurrentPage('favorites')}
        favoritesCount={favorites.favoritesCount}
        onOpenOrders={() => setCurrentPage('orders')}
        handleLogout={handleLogout}
        searchQuery={catalog.searchQuery}
        setSearchQuery={catalog.setSearchQuery}
        categories={catalog.categories}
        products={catalog.searchSuggestions}
        loadSearchSuggestions={catalog.loadSearchSuggestions}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={setCurrentPage}
            setSelectedCategory={handleSetCategory}
            categories={catalog.categories}
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
          />
        )}

        {currentPage === 'about' && <About />}
        {currentPage === 'delivery' && <Delivery />}
        {currentPage === 'legal' && <Legal defaultTab={legalTab} onNavigate={setCurrentPage} />}
        {currentPage === 'services' && <Services />}
        {currentPage === 'payment-terms' && <PaymentTerms />}
        {currentPage === 'delivery-terms' && <DeliveryTerms />}
        {currentPage === 'warranty' && <Warranty />}
        {currentPage === 'faq' && <Faq />}
        {currentPage === 'requisites' && <Requisites />}
        {currentPage === 'partners' && <Partners showToast={showToast} />}
        {currentPage === 'promotions' && <Promotions />}
        {currentPage === 'orders' && (
          <MyOrders
            customer={auth.customer}
            orders={orders.orders}
            loading={orders.ordersLoading}
            hasMore={orders.ordersHasMore}
            total={orders.ordersTotal}
            onRefresh={orders.fetchMyOrders}
            onLoadMore={orders.loadMoreOrders}
            onOpenAuth={auth.openLoginModal}
            onNavigate={setCurrentPage}
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
          />
        )}
        {currentPage === 'product' && (
          <ProductPage
            productId={currentProductId}
            onBackToCatalog={() => {
              setCurrentPage('catalog');
            }}
            onAddToCart={cart.handleAddToCart}
            onNavigate={setCurrentPage}
            categories={catalog.categories}
            setSelectedCategory={handleSetCategory}
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
      </main>

      <Footer
        customer={auth.customer}
        onOpenAuth={auth.openLoginModal}
        onNavigate={setCurrentPage}
        setSelectedCategory={handleSetCategory}
        setLegalTab={setLegalTab}
      />

      <CartSidebar
        cart={cart.cart}
        isOpen={cart.isCartOpen}
        onClose={() => cart.setIsCartOpen(false)}
        onUpdateQuantity={cart.handleUpdateQuantity}
        onRemoveFromCart={cart.handleRemoveFromCart}
        onClearCart={cart.handleClearCart}
        showToast={showToast}
        customer={auth.customer}
        onOpenAuth={() => {
          cart.setIsCartOpen(false);
          auth.setAuthModalOpen(true);
        }}
      />

      <AuthModal
        isOpen={auth.authModalOpen}
        onClose={() => auth.setAuthModalOpen(false)}
        authTab={auth.authTab}
        setAuthTab={auth.setAuthTab}
        authEmail={auth.authEmail}
        setAuthEmail={auth.setAuthEmail}
        authPassword={auth.authPassword}
        setAuthPassword={auth.setAuthPassword}
        authName={auth.authName}
        setAuthName={auth.setAuthName}
        authPhone={auth.authPhone}
        setAuthPhone={auth.setAuthPhone}
        authAddress={auth.authAddress}
        setAuthAddress={auth.setAuthAddress}
        authError={auth.authError}
        setAuthError={auth.setAuthError}
        authLoading={auth.authLoading}
        handleAuthSubmit={auth.handleAuthSubmit}
        currentRegion={region.currentRegion}
        handleSelectRegion={region.handleSelectRegion}
      />

      <RegionModal
        isOpen={region.regionModalOpen}
        onClose={() => region.setRegionModalOpen(false)}
        currentRegion={region.currentRegion}
        handleSelectRegion={region.handleSelectRegion}
        showToast={showToast}
      />

      <CallbackModal
        isOpen={isCallbackModalOpen}
        onClose={() => setIsCallbackModalOpen(false)}
        onNavigate={setCurrentPage}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </div>
  );
}
