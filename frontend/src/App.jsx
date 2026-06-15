import React, { useEffect, useState } from 'react';
import Storefront from './pages/Storefront';
import HomePage from './pages/Home';
import Advisor from './pages/Advisor';
import About from './pages/About';
import EstimatePage from './pages/EstimatePage';
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
import MyPromotions from './pages/MyPromotions';
import CashbackPage from './pages/CashbackPage';
import TransactionsHistoryPage from './pages/TransactionsHistoryPage';
import Cabinet from './pages/Cabinet';
import CartPage from './pages/CartPage';
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
import useBonuses from './hooks/useBonuses';
import { getAnalyticsSessionId, setAnalyticsContext, trackEvent } from './utils/analytics';
import { getPageHref } from './utils/navigationHelper';
import { PATH_TO_CABINET_TAB } from './hooks/useNavigation';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('user-agreement');

  const { toast, showToast } = useToast();
  const { currentPage, currentProductId, currentCategorySlug, currentOrderId, setCurrentPage, openProductPage } = useNavigation();
  const catalog = useCatalog(showToast, currentCategorySlug || 'all');
  const auth = useCustomerAuth(showToast);
  const cart = useCart(showToast, auth.customer);
  const orders = useOrders(auth.customer, showToast);
  const region = useRegion(showToast);
  const favorites = useFavorites(showToast);
  const bonuses = useBonuses(auth.customer);

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

  // Dynamic SEO Page Titles and Descriptions
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
      'my-promotions': "TORMAG - Мои промокоды",
      cashback: "TORMAG - Мой кешбэк",
      'cashback/history': "TORMAG - История транзакций",
      requisites: "TORMAG - Реквизиты компании",
      faq: "TORMAG - Вопрос-ответ",
      legal: "TORMAG - Юридическая информация",
      estimate: "TORMAG - Заказ по смете",
      product: "TORMAG - Просмотр товара",
      'payment-terms': "TORMAG - Условия оплаты",
      'delivery-terms': "TORMAG - Условия доставки",
      warranty: "TORMAG - Гарантия на товар",
      cart: "TORMAG - Корзина",
      'order-detail': "TORMAG - Детали заказа"
    };

    const pageDescriptions = {
      home: "Строительная платформа TORMAG в Алматы. Огромный каталог стройматериалов, прямые оптовые поставки от дистрибьюторов, оперативная доставка и кэшбэк 3%.",
      catalog: "Каталог строительных и отделочных материалов TORMAG. Широкий ассортимент сухих смесей, красок, инструментов, крепежа с доставкой по Алматы.",
      advisor: "Умный калькулятор-подборщик строительных материалов под ваш бюджет и задачи от платформы TORMAG.",
      about: "Узнайте больше о строительной платформе TORMAG. Наша миссия, команда, ценности и преимущества работы с нами.",
      delivery: "Условия и сроки доставки строительных материалов по Алматы и области. Удобные способы оплаты, включая Kaspi QR.",
      services: "Услуги снабжения объектов, расчета смет, шеф-монтажа и специализированной логистики от платформы TORMAG.",
      partners: "Официальные дистрибьюторы и бренды-партнеры строительной платформы TORMAG.",
      promotions: "Акции, распродажи, спецпредложения и действующие промокоды на строительные материалы в TORMAG.",
      favorites: "Ваш список избранных строительных материалов на платформе TORMAG.",
      orders: "Управление и отслеживание статуса ваших заказов на платформе TORMAG.",
      estimate: "Удобная загрузка смет в формате Excel/CSV для автоматического подбора материалов в TORMAG.",
      'cashback/history': "История начисления и списания бонусных баллов кешбэка TORMAG.",
      legal: "Пользовательское соглашение, договор публичной оферты и политика конфиденциальности платформы TORMAG."
    };

    // Dynamic page title/description updates (skip product and catalog to let their subcomponents handle it when data loads)
    if (currentPage !== 'product' && currentPage !== 'catalog') {
      const newTitle = pageTitles[currentPage] || "TORMAG — Всё для стройки и ремонта";
      document.title = newTitle;

      const newDesc = pageDescriptions[currentPage] || "Строительная платформа TORMAG в Алматы. Огромный выбор строительных материалов от дистрибьюторов по выгодным ценам с доставкой.";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', newDesc);
      }
    } else if (currentPage === 'catalog' && !currentCategorySlug) {
      // If catalog root page without category, set the default
      document.title = pageTitles.catalog;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', pageDescriptions.catalog);
      }
    }

    // Dynamic Canonical Link
    const canonicalPath = getPageHref(currentPage, currentProductId, currentCategorySlug);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `https://tormag.kz${canonicalPath}`);
  }, [currentPage, currentProductId, currentCategorySlug]);

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
    if (auth.authModalOpen || region.regionModalOpen || isCallbackModalOpen || isMobileMenuOpen) {
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
  }, [auth.authModalOpen, region.regionModalOpen, isCallbackModalOpen, isMobileMenuOpen]);

  const isCabinetPage = currentPage === 'cabinet' || currentPage.startsWith('cabinet/');

  useEffect(() => {
    if ((currentPage === 'orders' || isCabinetPage) && auth.customer) {
      orders.fetchMyOrders();
    }
  }, [currentPage, auth.customer]);

  const handleLogout = () => {
    auth.handleLogout();
    orders.clearOrders();
    setCurrentPage('home');
  };

  const handleCustomerUpdate = (updated) => {
    auth.setCustomer?.(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      <Header
        isScrolled={isScrolled}
        currentRegion={region.currentRegion}
        onOpenRegion={() => region.setRegionModalOpen(true)}
        customer={auth.customer}
        isAuthChecking={auth.isAuthChecking}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        cart={cart.cart}
        onRemoveFromCart={cart.handleRemoveFromCart}
        setSelectedCategory={handleSetCategory}
        cartItemsCount={cart.cartItemsCount}
        onOpenCart={() => setCurrentPage('cart')}
        onOpenAuthLogin={auth.openLoginModal}
        onOpenCallback={() => setIsCallbackModalOpen(true)}
        onOpenFavorites={() => setCurrentPage('favorites')}
        favoritesCount={favorites.favoritesCount}
        onOpenOrders={() => setCurrentPage('cabinet')}
        handleLogout={handleLogout}
        searchQuery={catalog.searchQuery}
        setSearchQuery={catalog.setSearchQuery}
        categories={catalog.categories}
        products={catalog.searchSuggestions}
        loadSearchSuggestions={catalog.loadSearchSuggestions}
        bonuses={bonuses}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={setCurrentPage}
            setSelectedCategory={handleSetCategory}
            categories={catalog.categories}
            setSearchQuery={catalog.setSearchQuery}
            onAddToCart={cart.handleAddToCart}
            onToggleFavorite={favorites.toggleFavorite}
            isFavorite={favorites.isFavorite}
            onOpenDetails={openProductPage}
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
            onAddToCart={cart.handleAddToCart}
            showToast={showToast}
            bonuses={bonuses}
          />
        )}
        {currentPage === 'my-promotions' && (
          <MyPromotions
            customer={auth.customer}
            onOpenAuth={auth.openLoginModal}
            onNavigate={setCurrentPage}
            showToast={showToast}
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

        {currentPage === 'cart' && (
          <CartPage
            cart={cart.cart}
            onUpdateQuantity={cart.handleUpdateQuantity}
            onRemoveFromCart={cart.handleRemoveFromCart}
            onClearCart={cart.handleClearCart}
            showToast={showToast}
            customer={auth.customer}
            onOpenAuth={() => auth.setAuthModalOpen(true)}
            onNavigate={setCurrentPage}
            bonuses={bonuses}
            onAddToCart={cart.handleAddToCart}
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

      {/* Cart is now a dedicated page: CartPage */}

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
        handlePhoneChange={auth.handlePhoneChange}
        authAddress={auth.authAddress}
        setAuthAddress={auth.setAuthAddress}
        authResetCode={auth.authResetCode}
        setAuthResetCode={auth.setAuthResetCode}
        authError={auth.authError}
        setAuthError={auth.setAuthError}
        authLoading={auth.authLoading}
        resendCooldown={auth.resendCooldown}
        handleResendCode={auth.handleResendCode}
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
