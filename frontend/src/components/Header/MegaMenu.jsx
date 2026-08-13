import React from 'react';
import { Hammer } from 'lucide-react';
import Link from '../Link';

export default function MegaMenu({
  isOpen,
  megaMenuRef,
  categories,
  getPageHref,
  onCategoryClick,
}) {
  if (!isOpen) return null;

  const rootCategories = categories.filter(c => !c.parentId);

  return (
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
            <Link
              href={getPageHref('catalog', null, rootCat.slug)}
              onClick={() => onCategoryClick(rootCat)}
              className="flex items-center gap-2.5 font-black text-slate-950 text-sm font-outfit cursor-pointer hover:text-emerald-600 transition-all border-b border-slate-100 pb-2.5 group"
            >
              {rootCat.image ? (
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={rootCat.image}
                    alt={rootCat.name}
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
            </Link>

            <div className="flex flex-col gap-3.5 pl-1">
              {categories
                .filter(sub => sub.parentId === rootCat.id)
                .map(sub => (
                  <div key={sub.id} className="space-y-1.5 text-left">
                    <Link
                      href={getPageHref('catalog', null, sub.slug)}
                      onClick={() => onCategoryClick(sub)}
                      className="text-left text-xs text-slate-900 hover:text-emerald-600 font-extrabold transition-colors block w-full leading-snug cursor-pointer"
                    >
                      {sub.name}
                    </Link>

                    <div className="flex flex-col gap-1 pl-2 border-l border-slate-100 mt-1">
                      {categories
                        .filter(grand => grand.parentId === sub.id)
                        .map(grand => (
                          <Link
                            key={grand.id}
                            href={getPageHref('catalog', null, grand.slug)}
                            onClick={() => onCategoryClick(grand)}
                            className="text-left text-[11px] text-slate-400 hover:text-emerald-600 font-semibold transition-colors py-0.5 leading-relaxed cursor-pointer"
                          >
                            {grand.name}
                          </Link>
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
  );
}
