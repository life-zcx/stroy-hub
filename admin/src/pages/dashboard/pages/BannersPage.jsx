import React from 'react';
import {
  Edit3 as EditIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Image as ImageIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-react';

export default function BannersPage({
  banners = [],
  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
}) {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-outfit uppercase tracking-tight">Баннеры главной страницы</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Управляйте рекламными слайдами в заглавном блоке сайта</p>
        </div>
        <button
          onClick={onCreateBanner}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-blue-600/10 transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          Новый баннер
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200/60 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
            <ImageIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="font-extrabold text-slate-900 uppercase tracking-wider text-sm">Пока не создано ни одного баннера</p>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Загрузите качественные рекламные изображения для ПК и мобильных устройств, чтобы заполнить главный слайдер на главной странице.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <article key={banner.id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              
              {/* Banner Image Preview Container */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                <img
                  src={banner.imageDesktop}
                  alt={banner.title || 'Баннер главной страницы'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/50 text-white backdrop-blur-md border border-white/20">
                      Порядок: #{banner.sortOrder}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      {banner.isActive ? 'Активен' : 'Скрыт'}
                    </span>
                  </div>

                  {banner.title && (
                    <h3 className="text-white text-base font-extrabold line-clamp-1 drop-shadow-md font-outfit">
                      {banner.title}
                    </h3>
                  )}
                </div>
              </div>

              {/* Body Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                {banner.subtitle && (
                  <p className="text-slate-600 text-xs font-medium leading-relaxed line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Ссылка клика:</span>
                    {banner.linkUrl ? (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs truncate max-w-[170px]"
                      >
                        <span className="truncate">{banner.linkUrl}</span>
                        <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-semibold italic text-[10px]">Не указана</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Мобильный баннер:</span>
                    <span className={`font-extrabold text-xs ${banner.imageMobile ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {banner.imageMobile ? '✓ Загружен' : 'Авто-адаптация ПК'}
                    </span>
                  </div>

                  {banner.buttonText && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Текст кнопки:</span>
                      <span className="font-extrabold text-slate-800 text-xs">
                        {banner.buttonText}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-4 pt-3 border-t border-slate-100/80 flex items-center justify-between bg-slate-50/50">
                <button
                  onClick={() => onEditBanner(banner)}
                  className="px-3.5 py-2 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-transparent hover:border-blue-200/50"
                >
                  <EditIcon className="h-3.5 w-3.5" />
                  Редактировать
                </button>
                <button
                  onClick={() => onDeleteBanner(banner.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                  title="Удалить баннер"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>

            </article>
          ))}
        </div>
      )}
    </div>
  );
}
