import React from 'react';
import { ChevronDown, Truck, Scale, Heart, Share2, Eye } from 'lucide-react';

export default function ProductDeliveryAndActions({
  userCity,
  setIsCityModalOpen,
  deliveryInfo,
  estimatedDeliveryDateStr,
  setActiveInfoModal,
  showToast,
  onToggleFavorite,
  product,
  isFav = false,
  handleShare,
  stats = { views: 0, watching: 0 },
  hideMetrics = false,
}) {
  const watchingCount = stats.watching || 1;

  const getPeopleWord = (cnt) => {
    const m10 = cnt % 10;
    const m100 = cnt % 100;
    if (m10 === 1 && m100 !== 11) return 'человек';
    if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return 'человека';
    return 'человек';
  };

  return (
    <div className="space-y-3">
      {/* Shipping info */}
      <div className="space-y-3 text-xs">
        {/* City Selector Line */}
        <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
          <span>Ваш город:</span>
          <button
            type="button"
            onClick={() => setIsCityModalOpen?.(true)}
            className="inline-flex items-center gap-1 text-blue-600 font-extrabold text-sm hover:underline cursor-pointer focus:outline-none"
          >
            <span>{userCity}</span>
            <ChevronDown className="h-4 w-4 text-blue-600 shrink-0 stroke-[2.5]" />
          </button>
        </div>

        {/* Delivery Line */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Truck className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-blue-600 font-extrabold text-sm leading-tight">
              Доставка
            </span>
            <span className="text-slate-600 font-bold text-xs mt-0.5">
              {deliveryInfo?.days === 1
                ? 'Завтра'
                : `${estimatedDeliveryDateStr} (${deliveryInfo?.label})`}
            </span>
          </div>
        </div>
      </div>

      {/* Price alert button */}
      <button
        type="button"
        onClick={() => setActiveInfoModal?.('priceAlert')}
        className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors pt-1 cursor-pointer"
      >
        Сообщить о снижении цены
      </button>

      {/* Under-card Actions (Desktop only, as icons are placed top next to price on mobile) */}
      <div className="hidden lg:flex border-t border-slate-100 pt-3 items-center justify-around gap-2 text-slate-400">
        <button
          type="button"
          onClick={() => showToast?.('⚖️ Товар добавлен в список сравнения')}
          className="flex flex-col items-center gap-1 hover:text-slate-700 transition-colors text-[10px] font-bold cursor-pointer"
        >
          <Scale className="h-4.5 w-4.5" />
          <span>Сравнить</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite?.(product)}
          className={`flex flex-col items-center gap-1 transition-colors text-[10px] font-bold cursor-pointer ${
            isFav ? 'text-red-500 hover:text-red-600' : 'hover:text-slate-700'
          }`}
        >
          <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-current' : ''}`} />
          <span>{isFav ? 'В избранном' : 'В избранное'}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center gap-1 hover:text-slate-700 transition-colors text-[10px] font-bold cursor-pointer"
        >
          <Share2 className="h-4.5 w-4.5" />
          <span>Поделиться</span>
        </button>
      </div>

      {/* Engagement Metrics footer if shown */}
      {!hideMetrics && (
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Смотрят сейчас:</span>
            <span className="text-emerald-600 font-bold">
              {watchingCount} {getPeopleWord(watchingCount)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-bold">{stats.views || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
