import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Search, Menu, X, Hammer, ShieldCheck, Phone,
  MapPin, User, ClipboardList, LogOut, ChevronDown, Heart, GitCompare,
} from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { id: 'home', name: 'Главная' },
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
  { id: 'advisor', name: 'Умный подбор' },
];

export default function Header({
  isScrolled,
  currentRegion,
  onOpenRegion,
  customer,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentPage,
  onNavigate,
  setSelectedCategory,
  cartItemsCount,
  onOpenCart,
  onOpenAuthLogin,
  fetchMyOrders,
  handleLogout,
  searchQuery,
  setSearchQuery,
  categories = [],
  products = [],
}) {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const megaMenuRef = useRef(null);

  const navigateTo = (page) => {
    onNavigate(page);
    if (page === 'catalog') setSelectedCategory('all');
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.slug); // Correct category selection using slug instead of ID
    onNavigate('catalog'); // Navigate directly without resetting selection to 'all'
    setIsMegaMenuOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigateTo('catalog');
    setIsSearchFocused(false);
  };

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

  // Filter products for the live autocomplete dropdown list
  const matchedProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  return (
    <>
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
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {currentRegion}
            </span>
          </div>

          {/* Links shifted from main header here */}
          <div className="flex items-center gap-6 font-semibold">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-white transition-colors ${currentPage === 'home' ? 'text-white font-bold' : ''}`}
            >
              Главная
            </button>
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
              <div className="absolute left-0 mt-1 hidden group-hover:block bg-white text-slate-800 rounded-xl shadow-xl py-2 w-48 border border-slate-100 z-50 animate-fade-in">
                <button
                  onClick={() => navigateTo('payment-terms')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Условия оплаты
                </button>
                <button
                  onClick={() => navigateTo('delivery-terms')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Условия доставки
                </button>
                <button
                  onClick={() => navigateTo('warranty')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Гарантия на товар
                </button>
                <button
                  onClick={() => navigateTo('faq')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Вопрос-ответ
                </button>
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
              <div className="absolute left-0 mt-1 hidden group-hover:block bg-white text-slate-800 rounded-xl shadow-xl py-2 w-48 border border-slate-100 z-50 animate-fade-in">
                <button
                  onClick={() => navigateTo('about')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  О нас
                </button>
                <button
                  onClick={() => navigateTo('delivery')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Доставка и оплата
                </button>
                <button
                  onClick={() => navigateTo('requisites')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Реквизиты
                </button>
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
          </div>

          <div className="flex items-center gap-6">
            <a href="tel:88005553535" className="flex items-center gap-1.5 font-bold text-white hover:text-emerald-600 transition-colors">
              <Phone className="h-3.5 w-3.5 text-emerald-600" /> 8 (800) 555-35-35
            </a>
          </div>
        </div>
      </div>

      {/* Row 2: Premium Main Navigation Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled
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
                setSelectedCategory('all');
                setIsMegaMenuOpen(false);
              }}
              className="flex items-center cursor-pointer group shrink-0"
            >
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-xl mr-2.5 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                <Hammer className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-outfit">
                stroy-<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">hub.kz</span>
              </span>
            </div>

            {/* Catalog & Search Block in the center */}
            <div className="hidden lg:flex items-center flex-grow max-w-2xl mx-8 gap-3 catalog-menu-container">
              {/* Catalog Button (with mega-menu toggling) */}
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 h-[42px]"
              >
                {isMegaMenuOpen ? <X className="h-4 w-4 text-emerald-400" /> : <Menu className="h-4 w-4 text-slate-300" />}
                <span>Каталог</span>
              </button>

              {/* Wide Search Input wrapped inside a form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-grow search-form-container">
                <input
                  type="text"
                  placeholder="Поиск строительных материалов..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-xs text-slate-900 transition-all placeholder-slate-400 h-[42px]"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center transition-colors"
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
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={p.image} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }} />
                          </div>
                          <div className="text-left min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-600 transition-colors">{p.name}</h4>
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
              {customer ? (
                <div className="relative user-menu-container">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold uppercase mb-0.5">
                      {customer.name ? customer.name[0] : 'U'}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      {customer.name ? customer.name.split(' ')[0] : 'Профиль'}
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
                            fetchMyOrders();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
                          <span>Мои заказы</span>
                        </button>
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
                  className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all"
                >
                  <User className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide">Войти</span>
                </button>
              )}

              {/* Comparison */}
              <button
                type="button"
                onClick={() => alert('Сравнение товаров будет доступно в следующем обновлении')}
                className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all"
              >
                <GitCompare className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Сравнение</span>
              </button>

              {/* Favorites */}
              <button
                type="button"
                onClick={() => alert('Избранное будет доступно в следующем обновлении')}
                className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all"
              >
                <Heart className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Избранное</span>
              </button>

              {/* Cart */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 mb-0.5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-slate-950">
                      {cartItemsCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide">Корзина</span>
              </button>
            </div>

            {/* Mobile Actions and Hamburger */}
            <div className="flex lg:hidden items-center gap-3">
              <button
                type="button"
                onClick={onOpenCart}
                className="relative flex items-center justify-center p-2.5 bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 rounded-xl h-[40px] w-[40px]"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-slate-950">
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

          {/* Mobile Navigation Dropdown */}
          {isMobileMenuOpen && (
            <div className="pt-4 pb-3 lg:hidden animate-fade-in-up space-y-4 border-t border-gray-100 mt-3 max-h-[80vh] overflow-y-auto">
              {/* Mobile Search wrapped inside a form with Autocomplete */}
              <form onSubmit={handleSearchSubmit} className="relative w-full search-form-container px-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
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
                  <div className="absolute left-3 right-3 top-full mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 py-2.5 max-h-[300px] overflow-y-auto divide-y divide-slate-50 animate-slide-up">
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
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
