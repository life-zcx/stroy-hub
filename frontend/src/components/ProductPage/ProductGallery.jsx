import React from 'react';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductGallery({
  product,
  allImages = [],
  activeImageIndex = 0,
  setActiveImageIndex,
  openZoomModal,
  scrollThumbs,
  thumbsRef,
  discount,
  getIpxImageUrl,
  FALLBACK_PRODUCT_IMAGE,
  markImageFailed,
}) {
  const galleryTouchStartX = React.useRef(0);
  const galleryTouchEndX = React.useRef(0);

  const handleGalleryTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      galleryTouchStartX.current = e.targetTouches[0].clientX;
      galleryTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleGalleryTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      galleryTouchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleGalleryTouchEnd = () => {
    const swipeDiff = galleryTouchStartX.current - galleryTouchEndX.current;
    const minSwipeDistance = 35;

    if (swipeDiff > minSwipeDistance) {
      setActiveImageIndex?.((prev) => (allImages.length > 0 ? (prev < allImages.length - 1 ? prev + 1 : 0) : prev));
    } else if (swipeDiff < -minSwipeDistance) {
      setActiveImageIndex?.((prev) => (allImages.length > 0 ? (prev > 0 ? prev - 1 : allImages.length - 1) : prev));
    }
  };

  const activeImage = allImages[activeImageIndex] || allImages[0];

  return (
    <div className="flex flex-col space-y-4">
      {/* Main Image Container — clean single-frame layout with Touch Swipe */}
      <div 
        className="relative bg-slate-50/50 rounded-2xl p-1 sm:p-2 flex items-center justify-center aspect-[4/3] sm:aspect-square w-full overflow-hidden touch-pan-y"
        onTouchStart={handleGalleryTouchStart}
        onTouchMove={handleGalleryTouchMove}
        onTouchEnd={handleGalleryTouchEnd}
      >
        {/* Zoom button hint */}
        <button
          type="button"
          onClick={() => openZoomModal?.(activeImageIndex)}
          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/80 text-slate-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs z-10 cursor-pointer"
          title="Увеличить фото на весь экран"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Main Image */}
        <img
          src={getIpxImageUrl ? getIpxImageUrl(activeImage, '800x800') : activeImage}
          alt={product?.name || 'Фото товара'}
          className="w-full h-full object-contain cursor-pointer select-none"
          onClick={() => openZoomModal?.(activeImageIndex)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_PRODUCT_IMAGE;
            if (activeImage && markImageFailed) markImageFailed(activeImage);
          }}
        />
      </div>

      {/* Thumbnails strip with horizontal scroll controls */}
      {allImages.length > 1 && (
        <div className="relative flex items-center group/thumbs">
          {allImages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs?.('left')}
              className="hidden sm:flex absolute -left-2.5 z-10 p-1.5 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
              title="Прокрутить влево"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={thumbsRef}
            className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 scroll-smooth hide-scrollbar w-full"
          >
            {allImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImageIndex?.(i)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border bg-white overflow-hidden p-1 transition-all shrink-0 cursor-pointer ${
                  activeImageIndex === i
                    ? 'border-2 border-red-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={getIpxImageUrl ? getIpxImageUrl(img, '200x200') : img}
                  alt={`${product?.name || 'Товар'} - фото ${i + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_PRODUCT_IMAGE;
                    if (img && markImageFailed) markImageFailed(img);
                  }}
                />
              </button>
            ))}
          </div>

          {allImages.length > 4 && (
            <button
              type="button"
              onClick={() => scrollThumbs?.('right')}
              className="hidden sm:flex absolute -right-2.5 z-10 p-1.5 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
              title="Прокрутить вправо"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
