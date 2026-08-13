import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, MapPin, User, X } from 'lucide-react';

export default function MobileDrawer({
  isOpen,
  onClose,
  currentRegion,
  customer,
  onNavigate,
  setSelectedCategory,
  onOpenAuthLogin,
  onOpenCart,
  onOpenCallback,
  onOpenFavorites,
  onOpenOrders,
  onOpenRegion,
  favoritesCount = 0,
  cartItemsCount = 0,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  const regionLabel = typeof currentRegion === 'string'
    ? currentRegion
    : currentRegion?.name || 'Алматы';

  return createPortal(
        <div className="fixed inset-0 z-[99999] lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => onClose()}
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-[320px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col overflow-y-auto animate-slide-right text-slate-800">
            
            {/* Greeting Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 relative text-left">
              <button
                type="button"
                onClick={() => onClose()}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {customer ? (
                <div className="pr-8 space-y-2">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {customer.name || 'Пользователь'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{customer.email || customer.phone}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('cabinet');
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Личный кабинет</span>
                  </button>
                </div>
              ) : (
                <div className="pr-8 space-y-2">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Добро пожаловать!
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Войти, чтобы делать покупки, отслеживать заказы и пользоваться персональными скидками.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthLogin?.();
                    }}
                    className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Войти
                  </button>
                </div>
              )}
            </div>

            {/* Region / Location Row */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegion?.();
              }}
              className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 text-xs font-bold text-blue-600 hover:bg-blue-50/50 transition-colors text-left cursor-pointer"
            >
              <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
              <span>{regionLabel}</span>
            </button>

            {/* Menu List */}
            <div className="flex-1 divide-y divide-slate-100">
              {/* Account & Quick Actions */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (customer) onNavigate('cabinet'); else onOpenAuthLogin?.();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Личный кабинет</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (customer) onOpenOrders?.(); else onOpenAuthLogin?.();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Мои заказы</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFavorites?.();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Избранное</span>
                <div className="flex items-center gap-2">
                  {favoritesCount > 0 && (
                    <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {favoritesCount}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCart?.();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Корзина</span>
                <div className="flex items-center gap-2">
                  {cartItemsCount > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cartItemsCount}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </div>
              </button>

              {/* Main Store Pages */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setSelectedCategory?.('all');
                  onNavigate('catalog');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Каталог товаров</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('promotions');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Акции %</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('services');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Услуги</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('delivery');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Доставка и оплата</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('estimate');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Заказ по смете</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('advisor');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Расчет материалов</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('partners');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Партнеры</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('faq');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Вопрос-ответ (FAQ)</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('about');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">О компании</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('requisites');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Реквизиты</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCallback?.();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-950">Связаться с нами</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
              </button>
            </div>

          </div>
        </div>,
        document.body
      );
}
