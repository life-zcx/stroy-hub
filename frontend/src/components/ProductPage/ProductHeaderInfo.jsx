import React from 'react';
import { Star } from 'lucide-react';

export default function ProductHeaderInfo({
  product,
  reviewsMeta = { total: 0 },
  articleNum,
  setActiveTab,
  scrollToSection,
}) {
  const reviewsCount = reviewsMeta?.total !== undefined ? reviewsMeta.total : (product?.reviews || 0);
  const hasRating = (product?.rating && product.rating > 0) || reviewsCount > 0;
  const ratingValue = product?.rating && product.rating > 0 ? product.rating : (reviewsCount > 0 ? '5.0' : '0.0');

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1 className="text-lg sm:text-2xl font-black text-slate-900 font-outfit leading-snug inline">
          {product?.name}
        </h1>
        <button
          type="button"
          onClick={() => {
            setActiveTab?.('reviews');
            scrollToSection?.('tabs-section');
          }}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
        >
          <Star className={`h-3.5 w-3.5 ${hasRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-300 text-slate-300'}`} />
          {reviewsCount > 0 ? (
            <>
              <span className="text-slate-900 font-bold">{ratingValue}</span>
              <span className="text-blue-600">({reviewsCount}) ›</span>
            </>
          ) : (
            <span className="text-slate-500 hover:text-blue-600 transition-colors font-bold">
              Нет отзывов ›
            </span>
          )}
        </button>
      </div>

      {articleNum && (
        <div className="text-[11px] font-bold text-slate-400 font-mono">
          Артикул: {articleNum}
        </div>
      )}
    </div>
  );
}
