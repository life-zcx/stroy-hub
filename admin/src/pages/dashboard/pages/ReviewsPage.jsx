import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Trash2,
  Star,
  User,
  ShoppingBag,
} from 'lucide-react';

export default function ReviewsPage({
  reviews = [],
  onApprove,
  onDelete,
}) {
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved'

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase tracking-tight">Модерация отзывов</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Премодерация оценок и отзывов на товары</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-xl">
          <div className="bg-amber-500/20 p-1 rounded-lg">
            <MessageSquare className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">На модерации</span>
            <span className="text-sm font-black leading-none">{pendingCount} отзывов</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setFilter('pending')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'pending' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Ожидают проверки ({pendingCount})
          {filter === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'approved' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Одобренные
          {filter === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'all' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Все ({reviews.length})
          {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center shadow-inner">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              {filter === 'pending'
                ? 'Нет отзывов, ожидающих проверки'
                : filter === 'approved'
                ? 'Нет одобренных отзывов'
                : 'Отзывы не найдены'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 hover:shadow-xl ${
                !review.isApproved ? 'border-amber-100 ring-4 ring-amber-500/5' : 'border-slate-100'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="space-y-4 flex-1">
                  {/* User & Date Header */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{review.user?.name || 'Покупатель'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{review.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')} {new Date(review.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4.5 w-4.5 ${
                          star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs font-black text-slate-900">{review.rating} из 5</span>
                  </div>

                  {/* Comment */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {review.comment || <span className="italic text-slate-400">Покупатель оставил только оценку, без комментария.</span>}
                    </p>
                  </div>

                  {/* Product block */}
                  <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100/50 rounded-2xl p-3 max-w-xl">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={review.product?.image}
                        alt={review.product?.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Товар</p>
                      <h5 className="text-xs font-extrabold text-slate-900 truncate">{review.product?.name}</h5>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                  {!review.isApproved && (
                    <button
                      onClick={() => onApprove(review.id)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/10 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Одобрить</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(review.id)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
