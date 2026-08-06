import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

export default function MobileCartBar({ 
  cartItemsCount = 0, 
  cartTotal = 0, 
  onOpenCart, 
  currentPage 
}) {
  // Hide if cart is empty or if already on cart/checkout page
  if (!cartItemsCount || cartItemsCount <= 0 || currentPage === 'cart' || currentPage === 'checkout') {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden animate-slide-up">
      <div 
        onClick={onOpenCart}
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 text-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
      >
        {/* Left side: Icon & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white font-black text-[10px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm font-mono">
              {cartItemsCount}
            </span>
          </div>

          <div className="flex flex-col text-left min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {cartItemsCount} {cartItemsCount === 1 ? 'товар' : cartItemsCount < 5 ? 'товара' : 'товаров'}
            </span>
            <span className="text-sm font-black text-white tracking-tight truncate font-outfit">
              {formatPrice(cartTotal)}
            </span>
          </div>
        </div>

        {/* Right side: Button */}
        <button
          type="button"
          onClick={onOpenCart}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
        >
          <span>В корзину</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
