import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteAccount } from '../services/api';

const REASON_OPTIONS = [
  'Слишком высокие цены',
  'Не понравился ассортимент',
  'Меня не устроил сервис',
  'Другое',
  'Много рекламы/уведомлений'
];

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onAccountDeleted,
  showToast
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      showToast?.('Пожалуйста, выберите причину удаления');
      return;
    }

    setLoading(true);
    try {
      await deleteAccount(selectedReason);

      // Clear frontend auth cookies and all client storage explicitly
      try {
        const pastDate = "Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/;";
        document.cookie = `tormag_auth_token=; ${pastDate}`;
        document.cookie = `tormag_admin_auth_token=; ${pastDate}`;

        const host = window.location.hostname;
        if (host) {
          document.cookie = `tormag_auth_token=; ${pastDate} Domain=${host};`;
          document.cookie = `tormag_admin_auth_token=; ${pastDate} Domain=${host};`;
          document.cookie = `tormag_auth_token=; ${pastDate} Domain=.${host};`;
          document.cookie = `tormag_admin_auth_token=; ${pastDate} Domain=.${host};`;
        }

        localStorage.removeItem('tormag_customer');
        localStorage.removeItem('customer');
        localStorage.removeItem('tormag_user');
        sessionStorage.clear();
      } catch (e) {
        console.warn('Error clearing local storage/cookies:', e);
      }

      showToast?.('Ваша учетная запись успешно удалена');
      onAccountDeleted?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Не удалось удалить учетную запись';
      showToast?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-white w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* ── Scrollable Body Area ── */}
      <div 
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
        className="max-w-lg w-full mx-auto p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-5 text-left"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border-0 shrink-0"
            title="Назад"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight text-center">
            Удалить учетную запись
          </h2>
          <div className="w-9 sm:w-10" /> {/* Spacer for centering header title */}
        </div>

        {/* ── Red Warning Banner ── */}
        <div className="bg-[#fff0f2] border border-rose-200/70 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 text-rose-600 shadow-xs">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 stroke-[2.5]" />
          </div>
          <span className="text-xs sm:text-sm font-bold leading-tight">
            Отменить удаление аккаунта невозможно
          </span>
        </div>

        {/* ── Description Section ── */}
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans leading-snug">
            Почему вы хотите удалить учетную запись?
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Вы уверены, что хотите завершить удаление учетной записи? После подтверждения ваши данные будут окончательно анонимизированы.
          </p>
        </div>

        {/* ── Survey Reasons (Radio list) ── */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
            Выберите причину
          </h4>

          <div className="space-y-2 pb-2">
            {REASON_OPTIONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`flex items-center gap-3 p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-rose-50/60 border-rose-300 text-slate-900 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold leading-none">
                    {reason}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Action Bar (Always visible above browser address bar & PWA bar) ── */}
      <div 
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
        className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 pb-3 bg-white border-t border-slate-100/90 shrink-0 text-left z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !selectedReason}
          className="w-full bg-[#ff2d55] hover:bg-[#e02447] disabled:opacity-40 text-white font-bold py-3.5 sm:py-4 px-5 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer border-0 active:scale-98"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Удаление...</span>
            </>
          ) : (
            <span>Удалить учетную запись</span>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}
