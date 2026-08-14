import React from 'react';
import { Home, LayoutGrid, ShoppingCart, User, Sparkles } from 'lucide-react';

export default function MobileBottomNav({
  currentPage,
  onNavigate,
  cartItemsCount = 0,
  customer,
  onOpenAuthLogin,
}) {
  const navItems = [
    {
      id: 'home',
      label: 'Главная',
      icon: Home,
      action: () => onNavigate('home'),
      isActive: currentPage === 'home',
    },
    {
      id: 'catalog',
      label: 'Каталог',
      icon: LayoutGrid,
      action: () => onNavigate('catalog'),
      isActive: currentPage === 'catalog',
    },
    {
      id: 'cart',
      label: 'Корзина',
      icon: ShoppingCart,
      badge: cartItemsCount,
      action: () => onNavigate('cart'),
      isActive: currentPage === 'cart',
    },
    {
      id: 'cabinet',
      label: 'Кабинет',
      icon: User,
      action: () => {
        if (customer) {
          onNavigate('cabinet');
        } else if (onOpenAuthLogin) {
          onOpenAuthLogin();
        } else {
          onNavigate('cabinet');
        }
      },
      isActive: currentPage === 'cabinet' || currentPage?.startsWith('cabinet'),
    },
    {
      id: 'ai-assistant',
      label: 'Чат AI',
      icon: Sparkles,
      action: () => onNavigate('ai-assistant'),
      isActive: currentPage === 'ai-assistant',
      isAi: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[80] bg-white border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden pwa-bottom-nav">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
                active
                  ? item.isAi
                    ? 'text-emerald-600 font-bold'
                    : 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    active && item.isAi ? 'animate-pulse' : ''
                  }`}
                  strokeWidth={active ? 2.3 : 1.8}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm font-mono border-2 border-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
