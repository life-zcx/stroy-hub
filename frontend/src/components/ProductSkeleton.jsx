import React from 'react';

export default function ProductSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-sm flex flex-col justify-between space-y-2.5 animate-pulse"
        >
          {/* Image skeleton matching ProductCard aspect-square */}
          <div className="aspect-square bg-slate-100 rounded-xl w-full" />

          {/* Details skeleton */}
          <div className="space-y-2 flex-1 min-w-0">
            {/* Title 2 lines */}
            <div className="h-3.5 bg-slate-100 rounded-md w-full" />
            <div className="h-3.5 bg-slate-100 rounded-md w-3/4" />

            {/* Price line */}
            <div className="h-5 bg-slate-100 rounded-md w-1/2 mt-2" />
            <div className="h-3 bg-emerald-50 rounded-md w-2/3" />
          </div>

          {/* Action button matching ProductCard h-[38px] sm:h-[44px] */}
          <div className="h-[38px] sm:h-[44px] bg-slate-200 rounded-xl w-full shrink-0" />
        </div>
      ))}
    </>
  );
}
