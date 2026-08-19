import React from 'react';
import { Search, X } from 'lucide-react';
import Link from '../Link';

export default function SearchAutocomplete({
  localSearchQuery,
  onSearchChange,
  onSearchSubmit,
  onFocus,
  onKeyDown,
  isSearchFocused,
  matchedProducts,
  activeSuggestionIndex,
  getPageHref,
  onNavigate,
  setLocalSearchQuery,
  setIsSearchFocused,
  categories,
}) {
  return (
    <form onSubmit={onSearchSubmit} className="relative flex-grow search-form-container">
      <div className="relative flex items-center w-full">
        <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none transition-colors" />
        <input
          type="text"
          placeholder="Поиск строительных материалов..."
          value={localSearchQuery}
          onChange={onSearchChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="w-full pl-11 pr-10 py-2.5 bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/15 text-xs font-medium text-slate-900 transition-all duration-300 placeholder-slate-400 h-[44px] shadow-2xs focus:shadow-md"
        />
        {localSearchQuery && (
          <button
            type="button"
            onClick={() => setLocalSearchQuery('')}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors border-0 bg-transparent cursor-pointer"
            title="Очистить"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isSearchFocused && matchedProducts.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-[100] py-3 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          <div className="px-4 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left bg-white">
            Найденные товары ({matchedProducts.length})
          </div>
          {matchedProducts.map((p, idx) => (
            <Link
              key={p.id}
              href={getPageHref('product', p.slug || p.id)}
              onClick={() => {
                onNavigate('product', p.slug || p.id);
                setLocalSearchQuery('');
                setIsSearchFocused(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors bg-white group ${
                idx === activeSuggestionIndex ? 'bg-blue-50/90 font-semibold' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                  />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{p.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block">{categories.find(c => c.slug === p.category)?.name || p.category}</span>
                </div>
              </div>
              <div className="shrink-0 font-black text-xs text-blue-600 pr-1">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p.price)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}

