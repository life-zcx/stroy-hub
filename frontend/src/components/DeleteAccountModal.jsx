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
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
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
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999999] bg-white w-screen h-screen min-h-screen overflow-y-auto animate-fade-in flex flex-col justify-between">
      <div 
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}
        className="max-w-xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-between text-left"
      >
        <div className="space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer border-0"
              title="Назад"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans tracking-tight">
              Удалить учетную запись
            </h2>
            <div className="w-10" /> {/* Spacer for centering header title */}
          </div>

          {/* ── Red Warning Banner ── */}
          <div className="bg-[#fff0f2] border border-rose-200/70 rounded-2xl p-4 flex items-center gap-3 text-rose-600 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold leading-tight">
              Отменить удаление аккаунта невозможно
            </span>
          </div>

          {/* ── Description Section ── */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans leading-snug">
              Почему вы хотите удалить учетную запись?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              Нам очень грустно, что вы уходите. Вы уверены, что хотите завершить удаление своей учетной записи? После подтверждения этого действия ваши данные будут окончательно уничтожены.
            </p>
          </div>

          {/* ── Survey Reasons (Radio list) ── */}
          <div className="space-y-3 pt-1">
            <h4 className="text-base font-bold text-slate-900 font-sans">
              Выберите причину
            </h4>

            <div className="space-y-2.5">
              {REASON_OPTIONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-300 text-slate-900 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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

        {/* ── Action Submit Button ── */}
        <div className="pt-6 pb-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedReason}
            className="w-full bg-[#ff2d55] hover:bg-[#e02447] disabled:opacity-40 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer border-0 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <span>Удалить учетную запись</span>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
