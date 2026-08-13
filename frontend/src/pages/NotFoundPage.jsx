import React from 'react';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

export default function NotFoundPage({ onNavigate }) {
  const quickLinks = [
    { label: 'Акции и скидки', page: 'promotions' },
    { label: 'Услуги', page: 'services' },
    { label: 'Доставка и оплата', page: 'delivery' },
    { label: 'О компании', page: 'about' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-16 pb-12 sm:pb-24 text-center font-sans animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <span className="block font-outfit text-8xl sm:text-9xl font-black text-slate-900 tracking-tighter leading-none select-none">
          404
        </span>

        <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Страница не найдена
        </h1>

        <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal max-w-lg mx-auto">
          Запрашиваемый адрес не существует, был перемещён или удалён. Воспользуйтесь каталогом товаров или вернитесь на главную страницу.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={getPageHref('home')}
            onClick={() => onNavigate?.('home')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#1069b3] hover:bg-[#0d5b9c] active:scale-[0.98] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-xs uppercase tracking-wider shadow-sm cursor-pointer border-0"
          >
            На главную
          </Link>

          <Link
            href={getPageHref('catalog')}
            onClick={() => onNavigate?.('catalog')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-xs uppercase tracking-wider shadow-sm cursor-pointer border-0"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-14 sm:mt-16 pt-8 sm:pt-10 border-t border-slate-200 max-w-4xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
          Популярные разделы
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.page}
              href={getPageHref(item.page)}
              onClick={() => onNavigate?.(item.page)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all text-xs font-bold uppercase tracking-wider text-center cursor-pointer"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


