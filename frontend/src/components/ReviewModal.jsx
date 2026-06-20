import React, { useState, useEffect } from 'react';
import { X, Star, Copy, Check, Clock } from 'lucide-react';
import { createProductReview } from '../services/api';
import { getFriendlyErrorMessage } from '../utils/errorHelper';

export default function ReviewModal({ isOpen, onClose, productId, productName, showToast, onSubmitSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(null);
      setComment('');
      setError('');
      setPromoCode('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await createProductReview(productId, rating, comment);
      setPromoCode(data.promoCode);
      showToast?.('✅ Отзыв успешно опубликован! Получен промокод.');
      if (onSubmitSuccess) {
        onSubmitSuccess(productId, rating);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    showToast?.('📋 Промокод скопирован в буфер обмена!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-[24px] shadow-2xl p-8 relative animate-fade-in-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!promoCode ? (
          // Form State
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Оценить товар</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Поделитесь своим мнением о товаре <span className="font-semibold text-slate-800">«{productName}»</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ваша оценка *</label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-md hover:bg-slate-50 transition-colors focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-all duration-150 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400 scale-110'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-600 font-outfit">
                    {rating === 5 ? 'Отлично' : rating === 4 ? 'Хорошо' : rating === 3 ? 'Нормально' : rating === 2 ? 'Плохо' : 'Ужасно'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Комментарий</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Расскажите, что вам понравилось или не понравилось в этом товаре..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-900 transition-all resize-none outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 leading-relaxed">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#525252] hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Clock className="h-5 w-5 animate-spin" />
                ) : (
                  <span>Отправить отзыв</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          // Success State with Promo Code
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Спасибо за отзыв!</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
              Ваш отзыв опубликован. В подарок мы дарим вам промокод на скидку <span className="font-bold text-slate-800">10%</span> на следующий заказ!
            </p>

            {/* Promo Code Display Card */}
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 mb-8 relative group overflow-hidden">
              <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-br-lg font-mono">
                КУПОН НА 10%
              </div>
              <div className="flex items-center justify-between gap-4 mt-2">
                <span className="font-mono text-2xl font-bold tracking-wider text-slate-900 pl-2">
                  {promoCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Скопировать</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-[10px] text-slate-400 mt-3 text-left pl-2 font-medium">
                * Действует 30 дней на весь ассортимент при оформлении следующего заказа.
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#525252] hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md text-sm"
            >
              Отлично
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
