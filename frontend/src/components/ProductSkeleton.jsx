import React from 'react';

export default function ProductSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4 animate-pulse"
        >
          {/* Image skeleton */}
          <div className="h-44 bg-slate-100 rounded-xl w-full" />

          {/* Details skeleton */}
          <div className="space-y-2.5 flex-1">
            {/* Rating line */}
            <div className="h-3 bg-slate-100 rounded-md w-1/3" />
            
            {/* Title lines */}
            <div className="h-4 bg-slate-100 rounded-md w-full" />
            <div className="h-4 bg-slate-100 rounded-md w-3/4" />

            {/* Supplier block */}
            <div className="h-12 bg-slate-50 border border-slate-100 rounded-xl w-full mt-2" />

            {/* Price line */}
            <div className="h-6 bg-slate-100 rounded-md w-1/2 mt-3" />
          </div>

          {/* Action buttons skeleton */}
          <div className="grid grid-cols-[100px_1fr] gap-2 pt-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}
