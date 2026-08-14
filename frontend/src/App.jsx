import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import RegionModal from './components/RegionModal';
import CallbackModal from './components/CallbackModal';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import MobileCartBar from './components/MobileCartBar';
import MobileBottomNav from './components/MobileBottomNav';
import ComingSoonModal from './components/ComingSoonModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import AiAssistantWidget from './components/AiAssistantWidget';

import SeoHeadManager from './components/SeoHeadManager';
import AppRoutes from './components/AppRoutes';

import useToast from './hooks/useToast';
import useNavigation from './hooks/useNavigation';
import useCatalog from './hooks/useCatalog';
import useCart from './hooks/useCart';
import useCustomerAuth from './hooks/useCustomerAuth';
import useOrders from './hooks/useOrders';
import useRegion from './hooks/useRegion';
import useFavorites from './hooks/useFavorites';
import useBonuses from './hooks/useBonuses';

import { getSystemSettings } from './services/api';

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  const isPwa = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('user-agreement');
  const [comingSoonSettings, setComingSoonSettings] = useState({
    comingSoonModalEnabled: false,
    comingSoonTitle: '',
    comingSoonMessage: ''
  });
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  const { toast, showToast, hideToast } = useToast();
  const { currentPage, currentProductId, currentCategorySlug, currentOrderId, setCurrentPage, openProductPage } = useNavigation();

  const isCabinetPage = currentPage === 'cabinet' || currentPage.startsWith('cabinet/');
  const isNotFound = currentPage === '404';

  const catalog = useCatalog(showToast, currentCategorySlug || 'all', currentPage);
  const auth = useCustomerAuth(showToast);
  const cart = useCart(showToast, auth.customer);
  const orders = useOrders(auth.customer, showToast);
  const region = useRegion(showToast);
  const favorites = useFavorites(showToast);
  const bonuses = useBonuses(auth.customer);

  useEffect(() => {
    if (currentPage === 'catalog' && currentCategorySlug) {
      catalog.setSelectedCategory(currentCategorySlug);
    } else if (currentPage === 'catalog' && !currentCategorySlug) {
      catalog.setSelectedCategory('all');
    }
  }, [currentCategorySlug, currentPage]);

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleGlobalLinkClick = (e) => {
      if (e.defaultPrevented) return;
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

        e.preventDefault();
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    document.addEventListener('click', handleGlobalLinkClick);
    return () => document.removeEventListener('click', handleGlobalLinkClick);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'TORMAG_PUSH_RECEIVED') {
        const { title, body } = event.data;
        showToast(`${title || 'TORMAG'}: ${body || ''}`, 'info');
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [showToast]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setComingSoonSettings(data);

        const wasDismissed = sessionStorage.getItem('tormag_coming_soon_dismissed') === 'true';
        if (data.comingSoonModalEnabled && !wasDismissed) {
          setIsComingSoonModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to load system settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleCloseComingSoonModal = () => {
    setIsComingSoonModalOpen(false);
    sessionStorage.setItem('tormag_coming_soon_dismissed', 'true');
  };

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
    <div className={`min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans ${currentPage === 'ai-assistant' ? 'ai-assistant-root overflow-hidden' : ''}`}>
      <SeoHeadManager
        currentPage={currentPage}
        currentProductId={currentProductId}
        currentCategorySlug={currentCategorySlug}
        currentOrderId={currentOrderId}
        isCabinetPage={isCabinetPage}
        region={region}
      />

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

      <main className={`flex-grow w-full mx-auto ${currentPage === 'ai-assistant' ? 'max-w-7xl p-0 sm:p-4 lg:p-6 h-[calc(100dvh-70px)] sm:h-[calc(100dvh-120px)] flex flex-col overflow-hidden' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-8'}`}>
        <AppRoutes
          currentPage={currentPage}
          currentProductId={currentProductId}
          currentCategorySlug={currentCategorySlug}
          currentOrderId={currentOrderId}
          isCabinetPage={isCabinetPage}
          isNotFound={isNotFound}
          legalTab={legalTab}
          setCurrentPage={setCurrentPage}
          handleSetCategory={handleSetCategory}
          openProductPage={openProductPage}
          setIsCallbackModalOpen={setIsCallbackModalOpen}
          handleCustomerUpdate={handleCustomerUpdate}
          handleLogout={handleLogout}
          showToast={showToast}
          catalog={catalog}
          auth={auth}
          cart={cart}
          orders={orders}
          region={region}
          favorites={favorites}
          bonuses={bonuses}
        />
      </main>

      {(currentPage !== 'ai-assistant' || (typeof window !== 'undefined' && window.innerWidth >= 640)) && !isPwa && (
        <Footer
          customer={auth.customer}
          onOpenAuth={auth.openLoginModal}
          onNavigate={setCurrentPage}
          setSelectedCategory={handleSetCategory}
          setLegalTab={setLegalTab}
        />
      )}

      <AuthModal
        isOpen={auth.authModalOpen}
        onClose={() => auth.setAuthModalOpen(false)}
        authTab={auth.authTab}
        setAuthTab={auth.setAuthTab}
        authEmail={auth.authEmail}
        setAuthEmail={auth.setAuthEmail}
        authPassword={auth.authPassword}
        setAuthPassword={auth.setAuthPassword}
        authConfirmPassword={auth.authConfirmPassword}
        setAuthConfirmPassword={auth.setAuthConfirmPassword}
        authName={auth.authName}
        setAuthName={auth.setAuthName}
        authPhone={auth.authPhone}
        setAuthPhone={auth.setAuthPhone}
        handlePhoneChange={auth.handlePhoneChange}
        authAddress={auth.authAddress}
        setAuthAddress={auth.setAuthAddress}
        entityType={auth.entityType}
        setEntityType={auth.setEntityType}
        companyBin={auth.companyBin}
        setCompanyBin={auth.setCompanyBin}
        companyName={auth.companyName}
        setCompanyName={auth.setCompanyName}
        directorName={auth.directorName}
        setDirectorName={auth.setDirectorName}
        legalAddress={auth.legalAddress}
        setLegalAddress={auth.setLegalAddress}
        organizationType={auth.organizationType}
        setOrganizationType={auth.setOrganizationType}
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

      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={handleCloseComingSoonModal}
        title={comingSoonSettings.comingSoonTitle}
        message={comingSoonSettings.comingSoonMessage}
      />

      {currentPage !== 'ai-assistant' && <ScrollToTop cartItemsCount={cart.cartItemsCount} />}
      <AiAssistantWidget
        onAddToCart={cart.handleAddToCart}
        showToast={showToast}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        cartItemsCount={cart.cartItemsCount}
      />
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        cartItemsCount={cart.cartItemsCount}
        customer={auth.customer}
        onOpenAuthLogin={auth.openLoginModal}
      />
      <PWAInstallPrompt showToast={showToast} />
      <PWAUpdatePrompt />
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
