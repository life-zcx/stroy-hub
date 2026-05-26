import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, Menu, X, Hammer, ShieldCheck, Phone, 
  MapPin, CheckCircle2, User, Key, LogOut, ClipboardList, Clock, Truck, Award, AlertCircle,
  Home, Package, PaintBucket, Wrench
} from 'lucide-react';
import { getProducts, getProfile, getOrders, login, register } from './services/api';
import Storefront from './pages/Storefront';
import HomePage from './pages/Home';
import Advisor from './pages/Advisor';
import About from './pages/About';
import Delivery from './pages/Delivery';
import Legal from './pages/Legal';
import CartSidebar from './components/CartSidebar';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

const CATEGORIES = [
  { id: 'all', name: 'Все товары', icon: Home },
  { id: 'mixes', name: 'Сухие смеси', icon: Package },
  { id: 'lumber', name: 'Пиломатериалы', icon: Truck },
  { id: 'tools', name: 'Инструменты', icon: Hammer },
  { id: 'paints', name: 'Краски', icon: PaintBucket },
  { id: 'hardware', name: 'Крепеж', icon: Wrench },
];

export default function App() {
  // Navigation & Menu
  const getInitialPage = () => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (['catalog', 'advisor', 'delivery', 'about', 'legal'].includes(path)) {
      return path;
    }
    return 'home';
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentPage, setCurrentPageRaw] = useState(getInitialPage);

  const setCurrentPage = (page) => {
    setCurrentPageRaw(page);
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPageRaw(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Catalog State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [legalTab, setLegalTab] = useState('user-agreement');

  // Region State
  const [currentRegion, setCurrentRegion] = useState(() => {
    return localStorage.getItem('stroyhub_region') || 'Алматы и область';
  });
  const [regionModalOpen, setRegionModalOpen] = useState(() => {
    return !localStorage.getItem('stroyhub_region');
  });

  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    localStorage.setItem('stroyhub_region', region);
    setRegionModalOpen(false);
    if (toast !== undefined) {
      showToast(`📍 Ваш регион: ${region}`);
    }
  };

  // Cart State
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('stroyhub_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer Auth State
  const [customer, setCustomer] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // login, register
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Order history state
  const [orders, setOrders] = useState([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // premium Toast Message
  const [toast, setToast] = useState(null);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('stroyhub_cart', JSON.stringify(cart));
  }, [cart]);

  // Track scrolling for header styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close catalog and user menu on click away
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCatalogOpen && !event.target.closest('.catalog-dropdown-container')) {
        setIsCatalogOpen(false);
      }
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCatalogOpen, isUserMenuOpen]);

  // Disable body scroll when modals or cart sidebar are open
  useEffect(() => {
    if (authModalOpen || ordersModalOpen || isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [authModalOpen, ordersModalOpen, isCartOpen]);

  // Validate Token and load profile on mount
  useEffect(() => {
    const checkCustomerAuth = async () => {
      const token = localStorage.getItem('stroyhub_customer_token');
      if (token) {
        try {
          const profile = await getProfile();
          setCustomer(profile);
        } catch (error) {
          console.error('Invalid customer token:', error);
          localStorage.removeItem('stroyhub_customer_token');
        }
      }
    };
    checkCustomerAuth();
  }, []);

  // Fetch catalog
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const data = await getProducts(params);
      setProducts(data);
    } catch (error) {
      console.error(error);
      showToast('⚠️ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddToCart = (product) => {
    handleAddToCartAndCheck(product);
  };

  const handleAddToCartAndCheck = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`🛒 «${product.name}» добавлен в корзину`);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Auth operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authTab === 'login') {
        const data = await login(authEmail, authPassword);
        localStorage.setItem('stroyhub_customer_token', data.token);
        setCustomer(data.user);
        showToast(`👋 Добро пожаловать, ${data.user.name || 'Покупатель'}!`);
      } else {
        const payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          phone: authPhone,
          address: authAddress,
          role: 'CUSTOMER'
        };
        const data = await register(payload);
        localStorage.setItem('stroyhub_customer_token', data.token);
        setCustomer(data.user);
        showToast('🎉 Регистрация успешно завершена!');
      }
      setAuthModalOpen(false);
      resetAuthForm();
    } catch (err) {
      console.error(err);
      setAuthError(err.response?.data?.error || err.message || 'Ошибка входа');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stroyhub_customer_token');
    setCustomer(null);
    setOrders([]);
    showToast('🚪 Вы успешно вышли из профиля.');
  };

  const resetAuthForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthPhone('');
    setAuthAddress('');
    setAuthError(null);
  };

  // Fetch orders for customer
  const fetchMyOrders = async () => {
    if (!customer) return;
    setOrdersLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      setOrdersModalOpen(true);
    } catch (error) {
      console.error(error);
      showToast('⚠️ Не удалось загрузить историю заказов');
    } finally {
      setOrdersLoading(false);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Status mapping
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return { text: 'В обработке', color: 'text-emerald-600 bg-emerald-50', icon: Clock };
      case 'processing': return { text: 'Сборка заказа', color: 'text-blue-500 bg-blue-50', icon: ClipboardList };
      case 'shipped': return { text: 'В доставке 🚚', color: 'text-purple-500 bg-purple-50', icon: Truck };
      case 'completed': return { text: 'Выполнен', color: 'text-green-500 bg-green-50', icon: CheckCircle2 };
      case 'cancelled': return { text: 'Отменен', color: 'text-red-500 bg-red-50', icon: AlertCircle };
      default: return { text: status, color: 'text-gray-500 bg-gray-50', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      
      {/* Top micro-header */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span 
              onClick={() => setRegionModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors font-semibold"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {currentRegion}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Официальный агрегатор стройматериалов stroy-hub.kz
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="tel:88005553535" className="flex items-center gap-1.5 font-bold text-white hover:text-emerald-600 transition-colors">
              <Phone className="h-3.5 w-3.5 text-emerald-600" /> 8 (800) 555-35-35
            </a>
          </div>
        </div>
      </div>

      {/* Glassmorphism Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/50 py-2' 
          : 'bg-white border-b border-gray-100 py-3.5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 gap-4">
            
            {/* Logo */}
            <div 
              onClick={() => { setCurrentPage('home'); setSelectedCategory('all'); }}
              className="flex items-center cursor-pointer group shrink-0"
            >
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-xl mr-2.5 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                <Hammer className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-outfit">
                stroy-<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">hub.kz</span>
              </span>
            </div>

            {/* Centered Minimalist Navigation Links (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide">
              {[
                { id: 'home', name: 'Главная' },
                { id: 'catalog', name: 'Каталог' },
                { id: 'advisor', name: 'Умный подбор' },
                { id: 'delivery', name: 'Доставка и оплата' },
                { id: 'about', name: 'О нас' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCurrentPage(tab.id);
                    if (tab.id === 'catalog') setSelectedCategory('all');
                  }}
                  className={`relative transition-colors hover:text-emerald-600 py-1.5 ${
                    currentPage === tab.id 
                      ? 'text-slate-950 font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.name}</span>
                  {currentPage === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Right side: Profile, Cart & Mobile menu button */}
            <div className="flex items-center gap-3">

              {/* Customer Account Trigger */}
              {customer ? (
                <div className="relative user-menu-container">
                  <button 
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-700 font-semibold transition-all h-[40px]"
                    title="Личный кабинет"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold uppercase">
                      {customer.name ? customer.name[0] : 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold">{customer.name ? customer.name.split(' ')[0] : 'Профиль'}</span>
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
                  onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition-all h-[40px]"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  <span>Войти</span>
                </button>
              )}

              {/* Shopping Cart Button */}
              <button 
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-3.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-white border border-slate-950 shadow-sm transition-all h-[40px] group"
              >
                <ShoppingCart className="h-4 w-4 text-slate-300 group-hover:text-white transition-all" />
                {cartItemsCount > 0 ? (
                  <span className="flex h-5 items-center justify-center rounded-lg bg-emerald-600 px-1.5 text-[10px] font-black text-slate-950 ring-1 ring-slate-900">
                    {cartItemsCount}
                  </span>
                ) : (
                  <span className="hidden sm:inline text-xs font-semibold text-slate-300">Корзина</span>
                )}
              </button>

              {/* Mobile Menu Trigger */}
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-700 hover:bg-gray-100 h-[40px] w-[40px] flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5.5 w-5.5" />}
              </button>

            </div>
          </div>

          {/* Mobile search bar & navigation */}
          {isMobileMenuOpen && (
            <div className="pt-4 pb-3 md:hidden animate-fade-in-up space-y-4 border-t border-gray-100 mt-3">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Поиск товаров..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 text-sm"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {[
                  { id: 'home', name: 'Главная' },
                  { id: 'catalog', name: 'Каталог' },
                  { id: 'advisor', name: 'Умный подбор' },
                  { id: 'delivery', name: 'Доставка и оплата' },
                  { id: 'about', name: 'О нас' },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setCurrentPage(tab.id);
                      setIsMobileMenuOpen(false);
                      if (tab.id === 'catalog') setSelectedCategory('all');
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                      currentPage === tab.id 
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

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage 
            onNavigate={(page) => setCurrentPage(page)} 
            setSelectedCategory={setSelectedCategory}
          />
        )}
        {currentPage === 'catalog' && (
          <Storefront 
            products={products}
            loading={loading}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToCart={handleAddToCart}
            onRefresh={loadProducts}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}
        {currentPage === 'advisor' && (
          <Advisor 
            products={products}
            onAddToCart={handleAddToCart}
            showToast={showToast}
          />
        )}
        {currentPage === 'about' && <About />}
        {currentPage === 'delivery' && <Delivery />}
        {currentPage === 'legal' && <Legal defaultTab={legalTab} onNavigate={(page) => setCurrentPage(page)} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-16 pt-16 pb-8 border-t-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-xl mr-2.5 shadow-md shadow-emerald-500/5">
                  <Hammer className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-xl text-white tracking-tight font-outfit">
                  stroy-<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">hub.kz</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Первый B2B/B2C строительный маркетплейс-агрегатор прямых поставок от дилеров в Казахстане. Выгодные цены складов, быстрая доставка.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Покупателям</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => { if (!customer) setAuthModalOpen(true); else fetchMyOrders(); }} className="hover:text-emerald-600 transition-colors">Отследить заказ</button></li>
                <li><button onClick={() => setCurrentPage('delivery')} className="hover:text-emerald-600 transition-colors">Доставка и оплата</button></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Возврат товара</a></li>
                <li>
                  <a 
                    href="http://localhost:3001" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Вход для дистрибьюторов</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Категории</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => { setSelectedCategory('mixes'); setCurrentPage('catalog'); }} className="hover:text-emerald-600 transition-colors">Сухие смеси</button></li>
                <li><button onClick={() => { setSelectedCategory('lumber'); setCurrentPage('catalog'); }} className="hover:text-emerald-600 transition-colors">Пиломатериалы</button></li>
                <li><button onClick={() => { setSelectedCategory('tools'); setCurrentPage('catalog'); }} className="hover:text-emerald-600 transition-colors">Инструменты</button></li>
                <li><button onClick={() => { setSelectedCategory('paints'); setCurrentPage('catalog'); }} className="hover:text-emerald-600 transition-colors">Краски</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Служба поддержки</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <a href="tel:88005553535" className="text-white font-bold hover:text-emerald-600 transition-colors block">8 (800) 555-35-35</a>
                    <span className="text-slate-500 text-[10px]">Звонок по Казахстану бесплатный</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 ТОО «StroyHub Technologies». Все права защищены. Государственная лицензия на торговую деятельность № 26054019.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <button onClick={() => { setLegalTab('user-agreement'); setCurrentPage('legal'); }} className="hover:text-white transition-colors">Пользовательское соглашение</button>
              <button onClick={() => { setLegalTab('offer'); setCurrentPage('legal'); }} className="hover:text-white transition-colors">Публичная оферта</button>
              <button onClick={() => { setLegalTab('privacy'); setCurrentPage('legal'); }} className="hover:text-white transition-colors">Конфиденциальность и Cookies</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartSidebar 
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        showToast={showToast}
        customer={customer}
        onOpenAuth={() => { setIsCartOpen(false); setAuthModalOpen(true); }}
      />

      {/* Premium Customer Auth Modal Overlay */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-150 p-8 rounded-3xl shadow-2xl relative space-y-6 animate-fade-in-up">
            
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Logo */}
            <div className="text-center">
              <div className="inline-flex bg-gradient-to-br from-teal-500 to-emerald-600 p-2.5 rounded-xl text-white mb-2 shadow-lg shadow-emerald-500/10">
                <Hammer className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-outfit">Личный кабинет покупателя</h3>
              <p className="text-slate-500 text-xs mt-1">Авторизуйтесь для оформления заказов и отслеживания доставки</p>
            </div>

            {/* Tabs login vs register */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Войти
              </button>
              <button 
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Регистрация
              </button>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Электронная почта *</label>
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  placeholder="alex@test.com"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Пароль *</label>
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                />
              </div>

              {authTab === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ваше Имя *</label>
                    <input 
                      type="text" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      placeholder="Александр"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Телефон *</label>
                    <input 
                      type="tel" 
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      required
                      placeholder="+7 (707) 123-45-67"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Адрес доставки</label>
                    <input 
                      type="text" 
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="Улица, дом, квартира"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Регион *</label>
                    <select
                      value={currentRegion}
                      onChange={(e) => handleSelectRegion(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 cursor-pointer"
                    >
                      <option value="Алматы и область">Алматы и область</option>
                      <option value="Астана и Акмолинская область">Астана и Акмолинская область</option>
                      <option value="Шымкент и область">Шымкент и область</option>
                      <option value="Караганда и область">Караганда и область</option>
                      <option value="Атырау и область">Атырау и область</option>
                      <option value="Усть-Каменогорск и ВКО">Усть-Каменогорск и ВКО</option>
                    </select>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center"
                disabled={authLoading}
              >
                {authLoading ? <Clock className="h-5 w-5 animate-spin" /> : authTab === 'login' ? 'Войти в систему' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order history overlay modal */}
      {ordersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-gray-150 p-6 sm:p-8 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] animate-fade-in-up">
            
            <button 
              onClick={() => setOrdersModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                Мои заказы
              </h3>
              <p className="text-slate-500 text-xs mt-1">Отслеживайте статусы доставки ваших строительных материалов</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">У вас пока нет оформленных заказов.</p>
                </div>
              ) : (
                orders.map(order => {
                  const statusMap = getStatusDisplay(order.status);
                  const StatusIcon = statusMap.icon;
                  return (
                    <div key={order.id} className="border border-gray-150 p-5 rounded-2xl space-y-3 hover:bg-slate-50/50 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                        <div>
                          <span className="font-bold text-slate-900">Заказ №{order.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Оформлен: {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-3 py-1 rounded-full ${statusMap.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusMap.text}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-slate-600">
                            <span>{item.product?.name} x {item.quantity} шт</span>
                            <span className="font-bold text-slate-800">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-dashed border-gray-100 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Адрес: {order.clientAddress}</span>
                        <span className="font-extrabold text-emerald-600 text-sm">Сумма: {formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Region Selector Modal Overlay */}
      {regionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-150 p-6 sm:p-7 rounded-3xl shadow-2xl relative space-y-5 animate-fade-in-up text-center">
            
            {/* Close button - only show if a region has already been chosen before */}
            {localStorage.getItem('stroyhub_region') && (
              <button 
                onClick={() => setRegionModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {/* Logo and Greeting */}
            <div>
              <div className="inline-flex bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-2xl text-white mb-2 shadow-lg shadow-teal-500/10">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit">Выберите ваш регион</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">Для точного расчета цен, наличия товаров на складах дистрибьюторов и сроков логистики по Казахстану</p>
            </div>

            {/* Auto-Detect Button */}
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  showToast('⚠️ Геолокация не поддерживается');
                  return;
                }
                showToast('🔍 Определяем геопозицию по спутникам...');
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const locations = [
                      { name: 'Алматы и область', lat: 43.2389, lon: 76.8897 },
                      { name: 'Астана и Акмолинская область', lat: 51.1693, lon: 71.4490 },
                      { name: 'Шымкент и область', lat: 42.3249, lon: 69.5881 },
                      { name: 'Караганда и область', lat: 49.8019, lon: 73.1021 },
                      { name: 'Атырау и область', lat: 47.1164, lon: 51.9056 },
                      { name: 'Усть-Каменогорск и ВКО', lat: 49.9483, lon: 82.6285 },
                      { name: 'Актобе и область', lat: 50.2839, lon: 57.1669 },
                      { name: 'Павлодар и область', lat: 52.2873, lon: 76.9674 },
                      { name: 'Тараз и Жамбылская область', lat: 42.9026, lon: 71.3656 },
                      { name: 'Уральск и ЗКО', lat: 51.2333, lon: 51.3667 },
                      { name: 'Костанай и область', lat: 53.2144, lon: 63.6244 },
                      { name: 'Кызылорда и область', lat: 44.8528, lon: 65.5092 },
                      { name: 'Актау и Мангистауская область', lat: 43.6480, lon: 51.1722 },
                      { name: 'Петропавловск и СКО', lat: 54.8753, lon: 69.1629 },
                      { name: 'Кокшетау и область', lat: 53.2833, lon: 69.3833 },
                      { name: 'Талдыкорган и область', lat: 45.0167, lon: 78.3667 },
                      { name: 'Туркестан и область', lat: 43.3000, lon: 68.2700 }
                    ];
                    let closest = locations[0];
                    let minDistance = Infinity;
                    locations.forEach(loc => {
                      const dist = Math.sqrt(Math.pow(lat - loc.lat, 2) + Math.pow(lon - loc.lon, 2));
                      if (dist < minDistance) {
                        minDistance = dist;
                        closest = loc;
                      }
                    });
                    handleSelectRegion(closest.name);
                  },
                  (err) => {
                    showToast('⚠️ Ошибка геолокации. Выберите вручную.');
                  }
                );
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 border border-emerald-700/10 group"
            >
              <MapPin className="h-4.5 w-4.5 animate-bounce" />
              <span>Определить автоматически</span>
            </button>

            <div className="text-slate-300 flex items-center justify-center gap-2 my-2 text-[10px] uppercase font-bold tracking-widest">
              <span className="h-[1px] bg-slate-200 w-16"></span>
              <span>Или выберите вручную</span>
              <span className="h-[1px] bg-slate-200 w-16"></span>
            </div>

            {/* Scrollable list of ALL 17 administrative regions of Kazakhstan */}
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin select-none">
              {[
                { name: 'Алматы и область', label: 'г. Алматы и Алматинская область' },
                { name: 'Астана и Акмолинская область', label: 'г. Астана и Акмолинская область' },
                { name: 'Шымкент и область', label: 'г. Шымкент и Туркестанская область' },
                { name: 'Караганда и область', label: 'г. Караганда и Карагандинская область' },
                { name: 'Атырау и область', label: 'г. Атырау и Атырауская область' },
                { name: 'Усть-Каменогорск и ВКО', label: 'г. Усть-Каменогорск и Восточно-Казахстанская область (ВКО)' },
                { name: 'Актобе и область', label: 'г. Актобе и Актюбинская область' },
                { name: 'Павлодар и область', label: 'г. Павлодар и Павлодарская область' },
                { name: 'Тараз и Жамбылская область', label: 'г. Тараз и Жамбылская область' },
                { name: 'Уральск и ЗКО', label: 'г. Уральск и Западно-Казахстанская область (ЗКО)' },
                { name: 'Костанай и область', label: 'г. Костанай и Костанайская область' },
                { name: 'Кызылорда и область', label: 'г. Кызылорда и Кызылординская область' },
                { name: 'Актау и Мангистауская область', label: 'г. Актау и Мангистауская область' },
                { name: 'Петропавловск и СКО', label: 'г. Петропавловск и Северо-Казахстанская область (СКО)' },
                { name: 'Кокшетау и область', label: 'г. Кокшетау и Акмолинская область (Север)' },
                { name: 'Талдыкорган и область', label: 'г. Талдыкорган и Жетысуская область' },
                { name: 'Туркестан и область', label: 'г. Туркестан и Туркестанская область (Юг)' }
              ].map(reg => (
                <button
                  key={reg.name}
                  type="button"
                  onClick={() => handleSelectRegion(reg.name)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between shrink-0 ${
                    currentRegion === reg.name 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                      : 'bg-slate-50 border-gray-150 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{reg.label}</span>
                  {currentRegion === reg.name && (
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shadow shadow-emerald-600/50 shrink-0 ml-2"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 font-semibold pt-1 uppercase tracking-wider">
              Вы всегда сможете изменить регион в верхнем меню сайта
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Messages */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            <div className="bg-green-500/20 p-1.5 rounded-full">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
            </div>
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        </div>
      )}

    </div>
  );
}
