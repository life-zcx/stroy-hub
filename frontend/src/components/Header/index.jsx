import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart, Menu, X, Phone,
  MapPin, User, ChevronDown, Heart, Eye, Gift,
} from 'lucide-react';
import logoImg from '../../tormag.png';
import { trackEvent } from '../../utils/analytics';
import { formatPrice } from '../../utils/formatPrice';
import Link from '../Link';
import AccessibilityModal from './AccessibilityModal';
import MegaMenu from './MegaMenu';
import MobileDrawer from './MobileDrawer';
import SearchAutocomplete from './SearchAutocomplete';

export default function Header({
  isScrolled,
  currentRegion,
  onOpenRegion,
  customer,
  isAuthChecking,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentPage,
  onNavigate,
  setSelectedCategory,
  cart = [],
  onRemoveFromCart,
  cartItemsCount,
  onOpenCart,
  onOpenAuthLogin,
  onOpenCallback,
  onOpenFavorites,
  favoritesCount = 0,
  onOpenOrders,
  handleLogout,
  searchQuery: globalSearchQuery,
  setSearchQuery,
  categories = [],
  products = [],
  loadSearchSuggestions,
  bonuses,
}) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(globalSearchQuery || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const megaMenuRef = useRef(null);

  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  const navigateTo = (page) => {
    onNavigate(page);
    if (page === 'catalog') setSelectedCategory('all');
  };

  const getPageHref = (pageId, productId = null, categorySlug = null) => {
    if (pageId === 'product') return `/product/${productId}`;
    if (pageId === 'order-detail') return `/orders/${productId}`;
    if (pageId === 'promotions' && productId) return `/promotions/${productId}`;
    if (pageId === 'catalog') return categorySlug && categorySlug !== 'all' ? `/catalog/${categorySlug}` : '/catalog';
    if (pageId === 'home') return '/';
    return `/${pageId}`;
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.slug);
    setIsMegaMenuOpen(false);
  };

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeSuggestionIndex >= 0 && matchedProducts[activeSuggestionIndex]) {
      const selectedProduct = matchedProducts[activeSuggestionIndex];
      onNavigate('product', selectedProduct.slug || selectedProduct.id);
      setLocalSearchQuery('');
      setIsSearchFocused(false);
      setActiveSuggestionIndex(-1);
      return;
    }
    setSearchQuery(localSearchQuery);
    if (localSearchQuery.trim()) {
      trackEvent('search', { searchQuery: localSearchQuery.trim() });
    }
    setSelectedCategory('all');
    navigateTo('catalog');
    setIsSearchFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!isSearchFocused || matchedProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev < matchedProducts.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : matchedProducts.length - 1
      );
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      setActiveSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [localSearchQuery]);

  useEffect(() => {
    const query = localSearchQuery.trim();
    const timer = setTimeout(() => {
      loadSearchSuggestions?.(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, loadSearchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current &&
        !megaMenuRef.current.contains(event.target) &&
        !event.target.closest('.catalog-menu-container')) {
        setIsMegaMenuOpen(false);
      }
      if (!event.target.closest('.search-form-container')) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const matchedProducts = localSearchQuery.trim() === '' ? [] : products.slice(0, 6);
  const cartTotal = cart?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

  return (
    <>
      <AccessibilityModal
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
      />

      {/* Dimmed backdrop when Mega Menu is open */}
      {isMegaMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-[1px] z-30 animate-fade-in"
          onClick={() => setIsMegaMenuOpen(false)}
        />
      )}

      {/* Row 1: Premium Top Bar with Main Navigation Buttons */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2.5 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span
              onClick={onOpenRegion}
              className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors font-semibold"
            >
              <MapPin className="h-3.5 w-3.5 text-blue-400" /> {currentRegion}
            </span>
          </div>

          {/* Links shifted from main header here */}
          <div className="flex items-center gap-6 font-semibold">
            <Link
              href="/services"
              onClick={() => navigateTo('services')}
              className={`hover:text-white transition-colors ${currentPage === 'services' ? 'text-white font-bold' : ''}`}
            >
              Услуги
            </Link>

            {/* "Клиенту" dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors py-1"
              >
                <span>Клиенту</span>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50 animate-fade-in">
                <div className="bg-white text-slate-800 rounded-xl shadow-xl py-2 w-48 border border-slate-100 overflow-hidden">
                  <Link
                    href="/payment-terms"
                    onClick={() => navigateTo('payment-terms')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Условия оплаты
                  </Link>
                  <Link
                    href="/delivery-terms"
                    onClick={() => navigateTo('delivery-terms')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Условия доставки
                  </Link>
                  <Link
                    href="/warranty"
                    onClick={() => navigateTo('warranty')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Гарантия на товар
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => navigateTo('faq')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Вопрос-ответ
                  </Link>
                </div>
              </div>
            </div>

            {/* "Информация" dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors py-1"
              >
                <span>Информация</span>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50 animate-fade-in">
                <div className="bg-white text-slate-800 rounded-xl shadow-xl py-2 w-48 border border-slate-100 overflow-hidden">
                  <Link
                    href="/about"
                    onClick={() => navigateTo('about')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    О нас
                  </Link>
                  <Link
                    href="/delivery"
                    onClick={() => navigateTo('delivery')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Доставка и оплата
                  </Link>
                  <Link
                    href="/requisites"
                    onClick={() => navigateTo('requisites')}
                    className="w-full text-left block px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Реквизиты
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/partners"
              onClick={() => navigateTo('partners')}
              className={`hover:text-white transition-colors ${currentPage === 'partners' ? 'text-white font-bold' : ''}`}
            >
              Партнеры
            </Link>
            <Link
              href="/promotions"
              onClick={() => navigateTo('promotions')}
              className={`hover:text-white transition-colors ${currentPage === 'promotions' ? 'text-white font-bold' : ''}`}
            >
              Акции
            </Link>
            <Link
              href="/estimate"
              onClick={() => navigateTo('estimate')}
              className={`hover:text-white transition-colors ${currentPage === 'estimate' ? 'text-white font-bold' : ''}`}
            >
              Заказ по смете
            </Link>
            <Link
              href="/advisor"
              onClick={() => navigateTo('advisor')}
              className={`hover:text-white transition-colors ${currentPage === 'advisor' ? 'text-white font-bold' : ''}`}
            >
              Расчет материалов
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAccessibilityModalOpen(true)}
              title="Версия для слабовидящих"
              aria-label="Панель настроек доступности"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all mr-1"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <div className="relative group/phone">
              <a
                href="tel:77077111653"
                className="flex items-center gap-1.5 font-bold text-white hover:text-blue-500 transition-colors py-1"
              >
                <Phone className="h-3.5 w-3.5 text-blue-400 group-hover/phone:animate-pulse" /> 8 (707) 711-16-53
              </a>

              {/* Contact Information Cards (Popup) */}
              <div className="absolute right-0 top-full pt-3 hidden group-hover/phone:block z-[60] w-[320px] animate-fade-in pointer-events-auto">
                <div className="shadow-2xl rounded-3xl overflow-hidden border border-white/10 ring-1 ring-black/5">
                  {/* Top Card */}
                  <div className="bg-white p-6 pb-5">
                    <div className="flex flex-col gap-1 mb-4">
                      <span className="text-lg font-bold text-slate-900 leading-tight">8 (707) 711-16-53</span>
                      <span className="text-slate-400 text-[11px] font-medium font-outfit uppercase tracking-tighter">По всем вопросам</span>
                    </div>
                    <button
                      onClick={onOpenCallback}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/25 text-xs border-0 cursor-pointer"
                    >
                      Перезвоните мне
                    </button>
                  </div>

                  {/* Bottom Card */}
                  <div className="bg-slate-50 p-6 pt-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 text-[11px] font-medium font-outfit uppercase tracking-tighter">E-mail</span>
                      <span className="text-slate-900 text-sm font-bold">zakaz@tormag.kz</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 text-[11px] font-medium font-outfit uppercase tracking-tighter">Режим работы</span>
                      <span className="text-slate-900 text-sm font-bold">Пн. – Пт.: с 8:00 до 20:00</span>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href="https://t.me/lifezcx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 hover:border-sky-100 hover:bg-sky-50 transition-all group/social"
                      >
                        <svg className="w-5 h-5 text-sky-500 transition-transform group-hover/social:scale-110" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                        </svg>
                      </a>
                      <a
                        href="https://wa.me/77077111653"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50 transition-all group/social"
                      >
                        <svg className="w-5 h-5 text-emerald-500 transition-transform group-hover/social:scale-110" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.403.007 12.04c0 2.12.552 4.191 1.598 6.056L0 24l6.105-1.602a11.832 11.832 0 005.937 1.61h.005c6.635 0 12.04-5.405 12.044-12.041a11.82 11.82 0 00-3.517-8.423" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Header direct call link */}
            <button
              type="button"
              onClick={onOpenCallback}
              className="text-xs font-semibold text-blue-400 hover:text-white transition-colors underline-offset-4 hover:underline border-0 bg-transparent cursor-pointer p-0"
            >
              Заказать звонок
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Premium Main Navigation Header */}
      <header className={`z-40 transition-all duration-300 ${isMobileMenuOpen ? 'fixed top-0 inset-x-0 bg-white' : 'sticky top-0'} py-2.5 ${isScrolled
        ? 'bg-white shadow-md border-b border-gray-200/50'
        : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-12 gap-4">

            {/* Left Mobile Hamburger Menu Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 hover:bg-gray-100 h-[40px] w-[40px] flex items-center justify-center cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5.5 w-5.5" />}
              </button>
            </div>

            {/* Logo */}
            <Link
              href="/"
              onClick={() => {
                onNavigate('home');
                setIsMegaMenuOpen(false);
              }}
              className="flex items-center cursor-pointer group shrink-0"
            >
              <img src={logoImg} alt="TORMAG.KZ - Всё для стройки и ремонта" width="125" height="36" fetchpriority="high" className="h-9 w-[125px] object-contain" />
            </Link>

            {/* Catalog & Search Block in the center */}
            <div className="hidden lg:flex items-center flex-grow max-w-5xl ml-4 mr-8 gap-3 catalog-menu-container">
              {/* Catalog Button (with mega-menu toggling) */}
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 h-[42px]"
              >
                {isMegaMenuOpen ? <X className="h-4 w-4 text-blue-400" /> : <Menu className="h-4 w-4 text-slate-300" />}
                <span>Каталог</span>
              </button>

              <SearchAutocomplete
                localSearchQuery={localSearchQuery}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleKeyDown}
                isSearchFocused={isSearchFocused}
                matchedProducts={matchedProducts}
                activeSuggestionIndex={activeSuggestionIndex}
                getPageHref={getPageHref}
                onNavigate={onNavigate}
                setLocalSearchQuery={setLocalSearchQuery}
                setIsSearchFocused={setIsSearchFocused}
                categories={categories}
              />
            </div>

            {/* Right Action Icons with labels below */}
            <div className="hidden lg:flex items-center gap-7">
              {/* Cashback Balance */}
              {!isAuthChecking && customer && bonuses && (
                <Link
                  href="/cashback"
                  onClick={() => onNavigate('cashback')}
                  className={`flex flex-col items-center justify-center transition-all ${currentPage === 'cashback' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                >
                  <Gift className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">
                    {formatPrice(bonuses.availableBalance ?? 0)}
                  </span>
                </Link>
              )}

              {/* Auth / Account */}
              {isAuthChecking ? (
                <div className="flex flex-col items-center justify-center animate-pulse py-1 min-w-[45px]">
                  <div className="h-5 w-5 rounded-full bg-slate-200 mb-1" />
                  <div className="h-2.5 w-10 bg-slate-200 rounded" />
                </div>
              ) : customer ? (
                <Link
                  href="/cabinet"
                  onClick={() => onNavigate('cabinet')}
                  className={`flex flex-col items-center justify-center transition-all ${currentPage === 'cabinet' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                >
                  <User className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">
                    Профиль
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthLogin}
                  className="flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
                >
                  <User className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Войти</span>
                </button>
              )}

              {/* Favorites */}
              <Link
                href="/favorites"
                onClick={onOpenFavorites}
                className="relative flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
              >
                <div className="relative">
                  <Heart className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Избранное</span>
              </Link>

              {/* Cart */}
              <div className="relative group/cart py-1">
               <Link
                  href="/cart"
                  onClick={onOpenCart}
                  className="flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-5 w-5 mb-0.5" />
                    {cartItemsCount > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white">
                        {cartItemsCount > 99 ? '99+' : cartItemsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Корзина</span>
                </Link>

                {/* Premium Cart Popover Dropdown */}
                {cartItemsCount > 0 && cart && cart.length > 0 && (
                  <div className="absolute right-0 top-full pt-3 hidden group-hover/cart:block z-50 w-[340px] animate-fade-in pointer-events-auto">
                    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden p-5 flex flex-col gap-4 text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Товары в корзине</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cartItemsCount} шт</span>
                      </div>

                      {/* Items List */}
                      <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                        {cart.map((item) => (
                          <div key={`${item.id}-${item.selectedOption || ''}`} className="flex gap-3 pt-3 first:pt-0 items-center justify-between group/item">
                            <Link
                              href={`/product/${item.id}`}
                              onClick={() => onNavigate?.('product', item.id)}
                              className="flex gap-2.5 items-center flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  width="40"
                                  height="40"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-4/5 h-4/5 object-contain"
                                  onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-800 truncate leading-snug group-hover/item:text-blue-600 transition-colors" title={item.name}>
                                  {item.name}
                                </h4>
                                {item.selectedOption && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block mt-0.5">
                                    {item.selectedOption}
                                  </span>
                                )}
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {item.quantity} шт × {formatPrice(item.price)}
                                </p>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                              <button
                                type="button"
                                aria-label="Удалить товар из корзины"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveFromCart?.(item.id, item.selectedOption);
                                }}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                                title="Удалить"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer summary */}
                      <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-600">Итого к оплате:</span>
                          <span className="text-base font-extrabold text-emerald-600 font-outfit">{formatPrice(cartTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Mobile Cart Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={onOpenCart}
                aria-label="Корзина"
                className="relative flex items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 hover:bg-gray-100 h-[40px] w-[40px] cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm font-mono">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>


          <MegaMenu
            isOpen={isMegaMenuOpen}
            megaMenuRef={megaMenuRef}
            categories={categories}
            getPageHref={getPageHref}
            onCategoryClick={handleCategoryClick}
          />

        </div>
      </header>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentRegion={currentRegion}
        customer={customer}
        onNavigate={onNavigate}
        setSelectedCategory={setSelectedCategory}
        onOpenAuthLogin={onOpenAuthLogin}
        onOpenCart={onOpenCart}
        onOpenCallback={onOpenCallback}
        onOpenFavorites={onOpenFavorites}
        onOpenOrders={onOpenOrders}
        onOpenRegion={onOpenRegion}
        favoritesCount={favoritesCount}
        cartItemsCount={cartItemsCount}
      />
    </>
  );
}
