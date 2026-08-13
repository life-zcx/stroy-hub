import React from 'react';
import { Search } from 'lucide-react';
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
      <input
        type="text"
        placeholder="Поиск строительных материалов..."
        value={localSearchQuery}
        onChange={onSearchChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/50 text-xs text-slate-900 transition-all placeholder-slate-500 placeholder:text-slate-500 h-[42px]"
      />
      <button
        type="submit"
        aria-label="Искать"
        className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>

      {isSearchFocused && matchedProducts.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 py-3 max-h-[380px] overflow-y-auto divide-y divide-slate-50 animate-slide-up">
          <div className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Найденные товары</div>
          {matchedProducts.map((p, idx) => (
            <Link
              key={p.id}
              href={getPageHref('product', p.slug || p.id)}
              onClick={() => {
                onNavigate('product', p.slug || p.id);
                setLocalSearchQuery('');
                setIsSearchFocused(false);
              }}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-all group ${
                idx === activeSuggestionIndex ? 'bg-slate-150 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                  />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{p.name}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold">{categories.find(c => c.slug === p.category)?.name || p.category}</span>
                </div>
              </div>
              <div className="shrink-0 font-extrabold text-xs text-slate-950 pr-2">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(p.price)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
