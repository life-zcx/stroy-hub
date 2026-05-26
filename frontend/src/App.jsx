import React, { useEffect, useState } from 'react';
import Storefront from './pages/Storefront';
import HomePage from './pages/Home';
import Advisor from './pages/Advisor';
import About from './pages/About';
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
import CartSidebar from './components/CartSidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import RegionModal from './components/RegionModal';
import Toast from './components/Toast';
import useToast from './hooks/useToast';
import useNavigation from './hooks/useNavigation';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useCustomerAuth from './hooks/useCustomerAuth';
import useOrders from './hooks/useOrders';
import useRegion from './hooks/useRegion';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('user-agreement');

  const { toast, showToast } = useToast();
  const { currentPage, currentProductId, setCurrentPage, openProductPage } = useNavigation();
  const catalog = useCatalog(showToast);
  const cart = useCart(showToast);
  const auth = useCustomerAuth(showToast);
  const orders = useOrders(auth.customer, showToast);
  const region = useRegion(showToast);

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
    if (auth.authModalOpen || orders.ordersModalOpen || cart.isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [auth.authModalOpen, orders.ordersModalOpen, cart.isCartOpen]);

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
        setSelectedCategory={catalog.setSelectedCategory}
        cartItemsCount={cart.cartItemsCount}
        onOpenCart={() => cart.setIsCartOpen(true)}
        onOpenAuthLogin={auth.openLoginModal}
        fetchMyOrders={orders.fetchMyOrders}
        handleLogout={handleLogout}
        searchQuery={catalog.searchQuery}
        setSearchQuery={catalog.setSearchQuery}
        categories={catalog.categories}
        products={catalog.products}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={setCurrentPage}
            setSelectedCategory={catalog.setSelectedCategory}
            categories={catalog.categories}
          />
        )}

        {currentPage === 'catalog' && (
          <Storefront
            products={catalog.products}
            categories={catalog.categories}
            loading={catalog.loading}
            selectedCategory={catalog.selectedCategory}
            setSelectedCategory={catalog.setSelectedCategory}
            searchQuery={catalog.searchQuery}
            setSearchQuery={catalog.setSearchQuery}
            onAddToCart={cart.handleAddToCart}
            onRefresh={catalog.loadProducts}
            sortBy={catalog.sortBy}
            setSortBy={catalog.setSortBy}
            onOpenProduct={openProductPage}
            onNavigate={setCurrentPage}
            currentRegion={region.currentRegion}
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
        {currentPage === 'partners' && <Partners />}
        {currentPage === 'promotions' && <Promotions />}
        {currentPage === 'product' && (
          <ProductPage
            productId={currentProductId}
            onBackToCatalog={() => {
              catalog.setSelectedCategory('all');
              setCurrentPage('catalog');
            }}
            onAddToCart={cart.handleAddToCart}
            onNavigate={setCurrentPage}
            categories={catalog.categories}
            setSelectedCategory={catalog.setSelectedCategory}
          />
        )}
      </main>

      <Footer
        customer={auth.customer}
        onOpenAuth={auth.openLoginModal}
        fetchMyOrders={orders.fetchMyOrders}
        onNavigate={setCurrentPage}
        setSelectedCategory={catalog.setSelectedCategory}
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

      <OrdersModal
        isOpen={orders.ordersModalOpen}
        onClose={() => orders.setOrdersModalOpen(false)}
        orders={orders.orders}
      />

      <RegionModal
        isOpen={region.regionModalOpen}
        onClose={() => region.setRegionModalOpen(false)}
        currentRegion={region.currentRegion}
        handleSelectRegion={region.handleSelectRegion}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </div>
  );
}
