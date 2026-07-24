import React from 'react';
import { Home, ShoppingBag, Compass, ArrowLeft } from 'lucide-react';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] border border-slate-200/80 shadow-xl p-8 sm:p-12 text-center space-y-7 relative overflow-hidden">
        {/* Background Blueprint Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-lg mx-auto relative z-10">
          <Compass className="h-10 w-10 stroke-[2.2]" />
        </div>

        {/* Text Details */}
        <div className="space-y-3 relative z-10">
          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-700 text-xs font-black uppercase tracking-widest font-mono">
            Ошибка 404
          </div>
          <h1 className="font-outfit text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Страница не найдена
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Запрашиваемый адрес не существует, был перемещён или удален. Воспользуйтесь навигацией по каталогу.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <Link
            href={getPageHref('home')}
            onClick={() => onNavigate?.('home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold px-7 py-3.5 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 border border-emerald-500/30 cursor-pointer"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>На главную</span>
          </Link>

          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate?.('catalog')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold px-7 py-3.5 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider border border-slate-200 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>В каталог товаров</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
