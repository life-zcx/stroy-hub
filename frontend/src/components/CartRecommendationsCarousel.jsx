import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function CartRecommendationsCarousel({
  recommendations = [],
  cart = [],
  onAddToCart,
  onUpdateQuantity,
  onToggleFavorite,
  isFavorite,
  showToast,
  onNavigate,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const handleNext = () => {
    setCurrentIndex((prev) => {
      if (!trackRef.current || !containerRef.current) return prev;
      const maxScroll = trackRef.current.scrollWidth - containerRef.current.clientWidth;
      const cards = trackRef.current.children;
      if (cards[prev + 1] && cards[prev + 1].offsetLeft >= maxScroll) {
        return 0; // Loop back to start
      }
      return Math.min(prev + (window.innerWidth < 640 ? 2 : 2), recommendations.length - 1);
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      if (prev <= 0) return recommendations.length - 1;
      return Math.max(0, prev - (window.innerWidth < 640 ? 2 : 2));
    });
  };

  // Update exact DOM translation offset whenever currentIndex or viewport size changes
  useEffect(() => {
    if (!trackRef.current || !containerRef.current) return;
    const cards = trackRef.current.children;
    if (cards.length === 0) return;

    if (currentIndex <= 0) {
      setTranslateX(0);
      return;
    }

    const targetCard = cards[currentIndex] || cards[cards.length - 1];
    if (!targetCard) return;

    const maxScroll = Math.max(0, trackRef.current.scrollWidth - containerRef.current.clientWidth);
    const targetOffset = targetCard.offsetLeft;
    const finalOffset = Math.min(targetOffset, maxScroll);

    setTranslateX(finalOffset);
  }, [currentIndex, recommendations.length]);

  useEffect(() => {
    const handleResize = () => {
      if (!trackRef.current || !containerRef.current) return;
      const cards = trackRef.current.children;
      if (cards[currentIndex]) {
        const maxScroll = Math.max(0, trackRef.current.scrollWidth - containerRef.current.clientWidth);
        setTranslateX(Math.min(cards[currentIndex].offsetLeft, maxScroll));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  // Auto-slide animation (glides smoothly every 4 seconds when not hovered)
  useEffect(() => {
    if (recommendations.length <= 2 || isHovered) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [recommendations.length, isHovered]);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div 
      className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-150 shadow-xs space-y-4 mt-8 text-left"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-950 font-outfit tracking-tight leading-none">
            С этим товаром часто покупают
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">Рекомендуемые сопутствующие товары</p>
        </div>
        {recommendations.length > 2 && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-90"
              title="Назад"
            >
              <ChevronLeft className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-90"
              title="Вперед"
            >
              <ChevronRight className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="overflow-hidden w-full py-1">
        <div
          ref={trackRef}
          className="flex items-stretch gap-3 sm:gap-4 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${translateX}px)` }}
        >
          {recommendations.map((prod) => {
            const cartItem = cart?.find((item) => item.id === prod.id || item.productId === prod.id);
            const cartQuantity = cartItem?.quantity || 0;
            const isFav = isFavorite ? isFavorite(prod) : false;

            return (
              <div key={prod.id} className="w-[calc(50%-0.375rem)] sm:w-60 shrink-0">
                <ProductCard
                  product={prod}
                  cartQuantity={cartQuantity}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateQuantity}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFav}
                  onNavigate={onNavigate}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
