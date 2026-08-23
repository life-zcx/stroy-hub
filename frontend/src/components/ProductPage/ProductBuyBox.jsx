import React from 'react';
import { Tag, CheckCircle2, ShoppingCart, Heart, Share2, Scale } from 'lucide-react';

export default function ProductBuyBox({
  product,
  activePromotion,
  promoDiscountPercentage = 0,
  showStrikethroughOldPrice = false,
  totalOldPrice,
  totalMainPrice,
  effectivePrice,
  displayQty = 1,
  cartQty = 0,
  cartItemForProduct,
  selectedOption,
  inCart = false,
  handleAddToCartWithOption,
  handleBuyNow,
  onUpdateCartQuantity,
  onNavigate,
  formatPrice,
  hidePriceBlock = false,
  onToggleFavorite,
  isFav = false,
  handleShare,
  showToast,
  sideBySideButtons = false,
  hideButtons = false,
}) {
  const cashbackPercent = product?.cashbackPercent ?? 3;
  const cashbackAmount = Math.round((effectivePrice * cashbackPercent) / 100) * displayQty;

  const discount = (totalOldPrice && totalMainPrice && totalOldPrice > totalMainPrice)
    ? Math.round(((totalOldPrice - totalMainPrice) / totalOldPrice) * 100)
    : (promoDiscountPercentage > 0 ? promoDiscountPercentage : 0);

  return (
    <div className="space-y-4">
      {/* Pricing block */}
      {!hidePriceBlock && (
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Main Price, Old Price, Badges & Cashback Badge on Left */}
          <div className="flex flex-col min-w-0">
            {/* Promo Badges (Hit / Discount) */}
            {(product?.isHit || discount > 0) && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {product?.isHit && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                    Хит
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider shadow-2xs">
                    -{discount}%
                  </span>
                )}
              </div>
            )}

            {showStrikethroughOldPrice && (
              <span className="text-xs text-slate-400 line-through font-semibold truncate leading-none mb-1">
                {formatPrice(totalOldPrice)}
              </span>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-950 font-outfit tracking-tight leading-none">
                {formatPrice(totalMainPrice)}
              </span>
              <span className="bg-[#00a046] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0">
                <span>+{formatPrice(cashbackAmount)}</span>
                <span className="w-3 h-3 rounded-full bg-white text-[#00a046] font-black text-[8px] flex items-center justify-center shrink-0">
                  Б
                </span>
              </span>
            </div>
          </div>

          {/* Action Icons (Compare/Favorite/Share) on Right */}
          {(onToggleFavorite || handleShare || showToast) && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => showToast?.('⚖️ Товар добавлен в список сравнения')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Сравнить товар"
              >
                <Scale className="h-5 w-5 text-slate-600" />
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite?.(product)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                </button>
              )}
              {handleShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  title="Поделиться"
                >
                  <Share2 className="h-5 w-5 text-slate-600" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Promotion Banner */}
      {activePromotion && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold">
            <Tag className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{activePromotion.title}</span>
          </div>

          {activePromotion.quantityTiers?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activePromotion.quantityTiers.map((tier, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                    displayQty >= tier.minQuantity
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  от {tier.minQuantity} шт: -
                  {activePromotion.discountType === 'PERCENT'
                    ? `${tier.discountValue}%`
                    : formatPrice(tier.discountValue)}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-600 leading-tight">
              Скидка{' '}
              <strong className="font-extrabold text-slate-900">
                -
                {activePromotion.discountType === 'PERCENT'
                  ? `${activePromotion.discountValue}%`
                  : formatPrice(activePromotion.discountValue)}
              </strong>{' '}
              при заказе от{' '}
              <strong className="font-extrabold text-slate-900">
                {activePromotion.minQuantity || 1} шт.
              </strong>
            </div>
          )}

          {promoDiscountPercentage > 0 ? (
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Скидка -
                {activePromotion.discountType === 'PERCENT'
                  ? `${promoDiscountPercentage}%`
                  : formatPrice(promoDiscountPercentage)}{' '}
                применена
              </span>
            </div>
          ) : activePromotion.minQuantity > displayQty ? (
            <div className="text-[10px] font-semibold text-slate-500 pt-0.5">
              Добавьте ещё {activePromotion.minQuantity - displayQty} шт для активации скидки
            </div>
          ) : null}
        </div>
      )}

      {/* Quantity selector + action buttons */}
      {(() => {
        if (hideButtons) return null;

        if (inCart) {
          // Товар уже в корзине: степпер + кнопка "Перейти в корзину"
          return (
            <div className="space-y-2">
              <div className="flex items-center bg-slate-900 rounded-xl h-12 px-1 justify-between shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    const optToUse = cartItemForProduct?.selectedOption || selectedOption;
                    if (cartQty === 1) onUpdateCartQuantity?.(product.id, 0, optToUse);
                    else onUpdateCartQuantity?.(product.id, cartQty - 1, optToUse);
                  }}
                  className="w-10 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 text-xl font-bold cursor-pointer shrink-0"
                >
                  −
                </button>

                <div className="flex-1 flex items-center justify-center gap-1 h-full px-1 min-w-0 overflow-hidden">
                  <ShoppingCart className="h-4 w-4 text-emerald-400 shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="99999999"
                    value={cartQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const optToUse = cartItemForProduct?.selectedOption || selectedOption;
                      if (!isNaN(val) && val > 0) {
                        onUpdateCartQuantity?.(product.id, Math.min(val, 99999999), optToUse);
                      } else if (e.target.value === '') {
                        onUpdateCartQuantity?.(product.id, 1, optToUse);
                      }
                    }}
                    className="w-full max-w-[85px] min-w-0 bg-transparent text-center font-extrabold text-white text-sm sm:text-base focus:outline-none focus:bg-white/15 rounded py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text truncate"
                  />
                  <span className="text-white/60 text-xs font-normal shrink-0">шт</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const optToUse = cartItemForProduct?.selectedOption || selectedOption;
                    onUpdateCartQuantity?.(product.id, cartQty + 1, optToUse);
                  }}
                  className="w-10 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-90 text-xl font-bold cursor-pointer shrink-0"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigate?.('cart')}
                className="w-full border-2 border-blue-600 hover:bg-blue-50 text-blue-600 font-extrabold h-12 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Перейти в корзину
              </button>
            </div>
          );
        }

        // Side by Side Buttons (Kaspi Style): Green [Купить сейчас] + Blue [В корзину]
        if (sideBySideButtons) {
          return (
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 bg-[#00a046] hover:bg-[#00883b] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center shadow-xs text-sm sm:text-base cursor-pointer"
              >
                Купить сейчас
              </button>
              <button
                type="button"
                onClick={handleAddToCartWithOption}
                className="flex-1 bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center shadow-xs text-sm sm:text-base cursor-pointer"
              >
                В корзину
              </button>
            </div>
          );
        }

        // Standard Stacked Buttons (Desktop / Sidebar)
        return (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCartWithOption}
              className="w-full bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-extrabold h-12 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-base cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              В корзину
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full bg-[#00a046] hover:bg-[#00883b] text-white font-extrabold h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Купить сейчас
            </button>
          </div>
        );
      })()}
    </div>
  );
}

