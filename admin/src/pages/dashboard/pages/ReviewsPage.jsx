import React, { useState, useEffect } from 'react';
import { getReviews } from '../../../services/api';
import {
  MessageSquare,
  CheckCircle2,
  Trash2,
  Star,
  User,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function ReviewsPage({
  onApprove,
  onDelete,
}) {
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved'
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviews({
        page,
        limit,
        isApproved: filter === 'all' ? undefined : filter === 'approved'
      });

      if (res && res.data) {
        setReviews(res.data);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else if (Array.isArray(res)) {
        // Fallback for old direct array response
        let list = res;
        if (filter === 'pending') list = res.filter(r => !r.isApproved);
        if (filter === 'approved') list = res.filter(r => r.isApproved);
        setReviews(list);
        setTotal(list.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading reviews in admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, filter]);

  // Reset page when tab changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleApproveAction = async (id) => {
    await onApprove(id);
    loadReviews();
  };

  const handleDeleteAction = async (id) => {
    await onDelete(id);
    loadReviews();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase tracking-tight">Модерация отзывов</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Премодерация оценок и отзывов на товары</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => handleFilterChange('pending')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'pending' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Ожидают проверки
          {filter === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => handleFilterChange('approved')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'approved' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Одобренные
          {filter === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />}
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'all' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Все ({total})
          {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-sm font-semibold text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Загружаем отзывы...</span>
          </div>
        ) : reviews.length === 0 ? (
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
          <>
            {reviews.map((review) => (
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
                        onClick={() => handleApproveAction(review.id)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/10 active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Одобрить</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAction(review.id)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Удалить</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-xs font-extrabold text-slate-700">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
