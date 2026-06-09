import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Search, Menu, X, Hammer, ShieldCheck, Phone,
  MapPin, User, ClipboardList, LogOut, ChevronDown, Heart, GitCompare, Tag, Gift, Eye,
} from 'lucide-react';
import logoImg from '../tormag.png';
import { trackEvent } from '../utils/analytics';
import { formatPrice } from '../utils/formatPrice';

const MOBILE_NAV_ITEMS = [
  { id: 'catalog', name: 'Каталог' },
  { id: 'services', name: 'Услуги' },
  { id: 'payment-terms', name: 'Условия оплаты' },
  { id: 'delivery-terms', name: 'Условия доставки' },
  { id: 'warranty', name: 'Гарантия на товар' },
  { id: 'faq', name: 'Вопрос-ответ' },
  { id: 'about', name: 'О компании' },
  { id: 'delivery', name: 'Доставка и оплата' },
  { id: 'requisites', name: 'Реквизиты' },
  { id: 'partners', name: 'Партнеры' },
  { id: 'promotions', name: 'Акции' },
  { id: 'estimate', name: 'Заказ по смете' },
  { id: 'advisor', name: 'Умный подбор' },
];

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
}) {
  const adminUrl = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://cabinet.tormag.kz';

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(globalSearchQuery || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const megaMenuRef = useRef(null);

  const [accessibilityActive, setAccessibilityActive] = useState(() => {
    return localStorage.getItem('tormag_accessibility_active') === 'true';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('tormag_accessibility_font_size') || 'sm';
  });
  const [accessibilityTheme, setAccessibilityTheme] = useState(() => {
    return localStorage.getItem('tormag_accessibility_theme') || 'default';
  });
  const [fontType, setFontType] = useState(() => {
    return localStorage.getItem('tormag_accessibility_font_type') || 'default';
  });
  const [hideImages, setHideImages] = useState(() => {
    return localStorage.getItem('tormag_accessibility_hide_images') === 'true';
  });
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    
    html.classList.remove(
      'accessibility-active',
      'accessibility-font-md',
      'accessibility-font-lg',
      'accessibility-theme-bw',
      'accessibility-theme-yb',
      'accessibility-dyslexic',
      'accessibility-no-images'
    );

    if (accessibilityActive) {
      html.classList.add('accessibility-active');
      
      if (fontSize === 'md') html.classList.add('accessibility-font-md');
      if (fontSize === 'lg') html.classList.add('accessibility-font-lg');
      
      if (accessibilityTheme === 'bw') html.classList.add('accessibility-theme-bw');
      if (accessibilityTheme === 'yb') html.classList.add('accessibility-theme-yb');
      
      if (fontType === 'dyslexic') html.classList.add('accessibility-dyslexic');
      if (hideImages) html.classList.add('accessibility-no-images');
    }

    localStorage.setItem('tormag_accessibility_active', accessibilityActive);
    localStorage.setItem('tormag_accessibility_font_size', fontSize);
    localStorage.setItem('tormag_accessibility_theme', accessibilityTheme);
    localStorage.setItem('tormag_accessibility_font_type', fontType);
    localStorage.setItem('tormag_accessibility_hide_images', hideImages);
  }, [accessibilityActive, fontSize, accessibilityTheme, fontType, hideImages]);

  useEffect(() => {
    if (isAccessibilityModalOpen) {
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
  }, [isAccessibilityModalOpen]);

  const renderAccessibilityModal = () => {
    if (!isAccessibilityModalOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
        onClick={() => setIsAccessibilityModalOpen(false)}
      >
        <div 
          className="w-full max-w-md bg-white rounded-[24px] shadow-2xl p-8 relative animate-fade-in-up cursor-default text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsAccessibilityModalOpen(false)}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title and Icon Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-outfit leading-snug">
                Панель настроек доступности
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Адаптируйте интерфейс сайта под ваше зрение.
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-5 mb-8">
            {/* Font Size */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Размер шрифта</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setFontSize('sm');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    fontSize === 'sm'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Стандарт (А)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setFontSize('md');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    fontSize === 'md'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Средний (А+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setFontSize('lg');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    fontSize === 'lg'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Крупный (А++)
                </button>
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Цветовая схема</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setAccessibilityTheme('default');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    accessibilityTheme === 'default'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Обычная
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setAccessibilityTheme('bw');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    accessibilityTheme === 'bw'
                      ? 'bg-black border-black text-white shadow-sm font-black'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Ч/Б контраст
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setAccessibilityTheme('yb');
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${
                    accessibilityTheme === 'yb'
                      ? 'bg-yellow-300 border-black text-black shadow-sm font-black'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Желто-черная
                </button>
              </div>
            </div>

            {/* Font Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Шрифт</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setFontType('default');
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${
                    fontType === 'default'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Стандартный
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setFontType('dyslexic');
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${
                    fontType === 'dyslexic'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Без засечек (Arial)
                </button>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Изображения</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setHideImages(false);
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${
                    !hideImages
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Показывать
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccessibilityActive(true);
                    setHideImages(true);
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${
                    hideImages
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  Скрыть
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAccessibilityActive(false);
                setFontSize('sm');
                setAccessibilityTheme('default');
                setFontType('default');
                setHideImages(false);
                setIsAccessibilityModalOpen(false);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-xs text-center"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => setIsAccessibilityModalOpen(false)}
              className="flex-1 bg-[#525252] hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-xs text-center"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    );
  };

  const navigateTo = (page) => {
    onNavigate(page);
    if (page === 'catalog') setSelectedCategory('all');
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.slug);
    setIsMegaMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localSearchQuery);
    if (localSearchQuery.trim()) {
      trackEvent('search', { searchQuery: localSearchQuery.trim() });
    }
    setSelectedCategory('all');
    navigateTo('catalog');
    setIsSearchFocused(false);
  };

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

  const rootCategories = categories.filter(c => !c.parentId);

  const matchedProducts = localSearchQuery.trim() === '' ? [] : products.slice(0, 6);
  const cartTotal = cart?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;

  return (
    <>
      {renderAccessibilityModal()}
      
      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-[120] lg:hidden animate-fade-in space-y-4 p-4 overflow-y-auto flex flex-col text-slate-800">
          {/* Header row */}
          <div className="flex justify-between items-center h-12 border-b border-slate-100 pb-2">
            <div
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
                setIsMegaMenuOpen(false);
              }}
              className="flex items-center cursor-pointer group shrink-0"
            >
              <img src={logoImg} alt="TORMAG.KZ - Всё для стройки и ремонта" width="125" height="56" className="h-14 w-auto object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 hover:bg-gray-100 h-[40px] w-[40px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Search wrapped inside a form with Autocomplete */}
          <form onSubmit={handleSearchSubmit} className="relative w-full search-form-container">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 text-sm"
              />
              <button type="submit" className="absolute left-3 top-3.5 text-gray-400 hover:text-emerald-600 transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Autocomplete Dropdown List */}
            {isSearchFocused && matchedProducts.length > 0 && (
              <div className="absolute left-3 right-3 top-full mt-2 bg-white rounded-2xl border border-slate-200/85 shadow-2xl z-50 py-2.5 max-h-[300px] overflow-y-auto divide-y divide-slate-50 animate-slide-up">
                <div className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Найденные товары</div>
                {matchedProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('product', p.id);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={p.image} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }} />
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="font-bold text-slate-900 text-[11px] truncate group-hover:text-emerald-600 transition-colors">{p.name}</h4>
                        <span className="text-[8px] text-slate-400 font-semibold">{categories.find(c => c.slug === p.category)?.name || p.category}</span>
                      </div>
                    </div>
                    <div className="shrink-0 font-extrabold text-[11px] text-slate-950">
                      {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
          
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAccessibilityModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-slate-700 bg-slate-100 flex items-center gap-2 border border-slate-300 mb-2"
            >
              <Eye className="h-4 w-4 text-emerald-600" />
              <span>Версия для слабовидящих</span>
            </button>
            {MOBILE_NAV_ITEMS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  navigateTo(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${currentPage === tab.id
                  ? 'bg-emerald-600/10 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {tab.name}
              </button>
            ))}
            {customer && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenOrders();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${currentPage === 'orders'
                    ? 'bg-emerald-600/10 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  Мои заказы
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('cashback');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${currentPage === 'cashback'
                    ? 'bg-amber-500/10 text-amber-700'
                    : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  Мой кешбэк
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
              <MapPin className="h-3.5 w-3.5 text-blue-600" /> {currentRegion}
            </span>
          </div>

          {/* Links shifted from main header here */}
          <div className="flex items-center gap-6 font-semibold">
            <button
              onClick={() => navigateTo('services')}
              className={`hover:text-white transition-colors ${currentPage === 'services' ? 'text-white font-bold' : ''}`}
            >
              Услуги
            </button>

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
                  <button
                    onClick={() => navigateTo('payment-terms')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Условия оплаты
                  </button>
                  <button
                    onClick={() => navigateTo('delivery-terms')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Условия доставки
                  </button>
                  <button
                    onClick={() => navigateTo('warranty')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Гарантия на товар
                  </button>
                  <button
                    onClick={() => navigateTo('faq')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Вопрос-ответ
                  </button>
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
                  <button
                    onClick={() => navigateTo('about')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    О нас
                  </button>
                  <button
                    onClick={() => navigateTo('delivery')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Доставка и оплата
                  </button>
                  <button
                    onClick={() => navigateTo('requisites')}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Реквизиты
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('partners')}
              className={`hover:text-white transition-colors ${currentPage === 'partners' ? 'text-white font-bold' : ''}`}
            >
              Партнеры
            </button>
            <button
              onClick={() => navigateTo('promotions')}
              className={`hover:text-white transition-colors ${currentPage === 'promotions' ? 'text-white font-bold' : ''}`}
            >
              Акции
            </button>
            <button
              onClick={() => navigateTo('estimate')}
              className={`hover:text-white transition-colors ${currentPage === 'estimate' ? 'text-white font-bold' : ''}`}
            >
              Заказ по смете
            </button>
            <button
              onClick={() => navigateTo('advisor')}
              className={`hover:text-white transition-colors ${currentPage === 'advisor' ? 'text-white font-bold' : ''}`}
            >
              Расчет материалов
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAccessibilityModalOpen(true)}
              title="Версия для слабовидящих"
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all mr-1"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <div className="relative group/phone">
              <a
                href="tel:77077111653"
                className="flex items-center gap-1.5 font-bold text-white hover:text-blue-500 transition-colors py-1"
              >
                <Phone className="h-3.5 w-3.5 text-blue-600 group-hover/phone:animate-pulse" /> 8 (707) 711-16-53
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
                      className="w-full bg-[#525252] hover:bg-slate-900 text-white font-bold py-3 rounded-2xl transition-all shadow-lg text-xs"
                    >
                      Заказать звонок
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
                      <span className="text-slate-900 text-sm font-bold">Пн. – Пт.: с 8:00 до 17:00</span>
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

            {/* Header direct call button */}
            <button
              onClick={onOpenCallback}
              className="bg-blue-600/10 hover:bg-blue-600 border border-blue-600/20 hover:border-blue-600 text-blue-500 hover:text-white px-4 py-1.5 rounded-full text-[11px] font-bold transition-all"
            >
              Заказать звонок
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Premium Main Navigation Header */}
      <header className={`z-40 transition-all duration-300 ${isMobileMenuOpen ? 'fixed top-0 inset-x-0 bg-white' : 'sticky top-0'} ${isScrolled
        ? 'bg-white/97 backdrop-blur-md shadow-md border-b border-gray-200/50 py-2'
        : 'bg-white border-b border-gray-100 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-12 gap-4">

            {/* Logo */}
            <div
              onClick={() => {
                onNavigate('home');
                setIsMegaMenuOpen(false);
              }}
              className="flex items-center cursor-pointer group shrink-0"
            >
              <img src={logoImg} alt="TORMAG.KZ - Всё для стройки и ремонта" width="125" height="56" fetchpriority="high" className="h-14 w-auto object-contain" />
            </div>

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

              {/* Wide Search Input wrapped inside a form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-grow search-form-container">
                <input
                  type="text"
                  placeholder="Поиск строительных материалов..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/50 text-xs text-slate-900 transition-all placeholder-slate-400 h-[42px]"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>

                {/* Desktop Autocomplete Dropdown List */}
                {isSearchFocused && matchedProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 py-3 max-h-[380px] overflow-y-auto divide-y divide-slate-50 animate-slide-up">
                    <div className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Найденные товары</div>
                    {matchedProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('product', p.id);
                          setLocalSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={p.image} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }} />
                          </div>
                          <div className="text-left min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{p.name}</h4>
                            <span className="text-[9px] text-slate-400 font-semibold">{categories.find(c => c.slug === p.category)?.name || p.category}</span>
                          </div>
                        </div>
                        <div className="shrink-0 font-extrabold text-xs text-slate-950 pr-2">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Right Action Icons with labels below */}
            <div className="hidden lg:flex items-center gap-7">
              {/* Auth / Account */}
              {isAuthChecking ? (
                <div className="flex flex-col items-center justify-center animate-pulse py-1 min-w-[45px]">
                  <div className="h-5 w-5 rounded-full bg-slate-200 mb-1" />
                  <div className="h-2.5 w-10 bg-slate-200 rounded" />
                </div>
              ) : customer ? (
                <div className="relative user-menu-container">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
                  >
                    <User className="h-5 w-5 mb-0.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      Профиль
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 animate-fade-in-up">
                      <div className="px-3 py-2 border-b border-gray-100 mb-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{customer.name || 'Покупатель'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{customer.email}</p>
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenOrders();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
                          <span>Мои заказы</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('cashback');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Gift className="h-4.5 w-4.5 text-amber-500" />
                          <span>Мой кешбэк</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('my-promotions');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Tag className="h-4.5 w-4.5 text-emerald-600" />
                          <span>Мои промокоды</span>
                        </button>
                        {(customer.role === 'SUPPLIER' || customer.role === 'ADMIN') && (
                          <a
                            href={adminUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                            <span>Кабинет дистрибьютора</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                          <span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              <button
                type="button"
                onClick={onOpenFavorites}
                className="relative flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
              >
                <div className="relative">
                  <Heart className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Избранное</span>
              </button>

              {/* Cart */}
              <div className="relative group/cart py-1">
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 mb-0.5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white">
                        {cartItemsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Корзина</span>
                </button>

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
                          <div key={item.id} className="flex gap-3 pt-3 first:pt-0 items-center justify-between group/item">
                            <div
                              onClick={() => onNavigate?.('product', item.id)}
                              className="flex gap-2.5 items-center min-w-0 cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-4/5 h-4/5 object-contain"
                                  onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate leading-snug w-[150px] group-hover/item:text-blue-600 transition-colors" title={item.name}>
                                  {item.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {item.quantity} шт × {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveFromCart?.(item.id);
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
                          <span className="text-xs font-bold text-slate-550">Итого к оплате:</span>
                          <span className="text-base font-extrabold text-emerald-600 font-outfit">{formatPrice(cartTotal)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('cart');
                          }}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <span>Перейти в корзину</span>
                          <ShoppingCart className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions and Hamburger */}
            <div className="flex lg:hidden items-center gap-3">
              {/* User/Profile Button */}
              {isAuthChecking ? (
                <div className="relative flex items-center justify-center p-2.5 bg-slate-100/50 border border-slate-200/50 rounded-xl h-[40px] w-[40px] animate-pulse">
                  <div className="h-5 w-5 bg-slate-200 rounded-full" />
                </div>
              ) : customer ? (
                <div className="relative user-menu-container">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="relative flex items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-xl h-[40px] w-[40px]"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 animate-fade-in-up">
                      <div className="px-3 py-2 border-b border-gray-100 mb-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{customer.name || 'Покупатель'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{customer.email}</p>
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenOrders();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
                          <span>Мои заказы</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('cashback');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Gift className="h-4.5 w-4.5 text-amber-500" />
                          <span>Мой кешбэк</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('my-promotions');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Tag className="h-4.5 w-4.5 text-emerald-600" />
                          <span>Мои промокоды</span>
                        </button>
                        {(customer.role === 'SUPPLIER' || customer.role === 'ADMIN') && (
                          <a
                            href={adminUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                            <span>Кабинет дистрибьютора</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                          <span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthLogin}
                  className="relative flex items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-xl h-[40px] w-[40px]"
                >
                  <User className="h-5 w-5" />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-xl h-[40px] w-[40px]"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 hover:bg-gray-100 h-[40px] w-[40px] flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5.5 w-5.5" />}
              </button>
            </div>
          </div>


          {/* Dynamic Full-Width Mega Menu Dropdown */}
          {isMegaMenuOpen && (
            <div
              ref={megaMenuRef}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl border border-slate-200/85 shadow-2xl z-50 p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-h-[75vh] overflow-y-auto animate-slide-up"
            >
              {rootCategories.length === 0 ? (
                <div className="col-span-full text-center py-10 text-slate-400 text-xs font-semibold">
                  Разделы каталога загружаются...
                </div>
              ) : (
                rootCategories.map(rootCat => (
                  <div key={rootCat.id} className="space-y-4">
                    {/* Parent Root Category */}
                    <div
                      onClick={() => handleCategoryClick(rootCat)}
                      className="flex items-center gap-2.5 font-black text-slate-950 text-sm font-outfit cursor-pointer hover:text-emerald-600 transition-all border-b border-slate-100 pb-2.5 group"
                    >
                      {rootCat.image ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={rootCat.image}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Hammer className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      <span className="leading-snug">{rootCat.name}</span>
                    </div>

                    {/* Subcategories (Children) & Sub-subcategories (Grandchildren) */}
                    <div className="flex flex-col gap-3.5 pl-1">
                      {categories
                        .filter(sub => sub.parentId === rootCat.id)
                        .map(sub => (
                          <div key={sub.id} className="space-y-1.5 text-left">
                            {/* Subcategory (2nd level) */}
                            <button
                              onClick={() => handleCategoryClick(sub)}
                              className="text-left text-xs text-slate-900 hover:text-emerald-600 font-extrabold transition-colors block w-full leading-snug"
                            >
                              {sub.name}
                            </button>

                            {/* Sub-subcategories (3rd level) */}
                            <div className="flex flex-col gap-1 pl-2 border-l border-slate-100 mt-1">
                              {categories
                                .filter(grand => grand.parentId === sub.id)
                                .map(grand => (
                                  <button
                                    key={grand.id}
                                    onClick={() => handleCategoryClick(grand)}
                                    className="text-left text-[11px] text-slate-400 hover:text-emerald-600 font-semibold transition-colors py-0.5 leading-relaxed cursor-pointer"
                                  >
                                    {grand.name}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        ))
                      }
                      {categories.filter(sub => sub.parentId === rootCat.id).length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">Нет подразделов</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}


        </div>
      </header>
    </>
  );
}
