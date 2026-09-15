import React, { useEffect, useState } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export default function AppInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  setDeferredPrompt,
  showToast,
}) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast?.('Приложение TORMAG установлено!');
      }
      setDeferredPrompt?.(null);
      onClose();
    } else {
      showToast?.('Откройте меню браузера (⋮) и выберите "Добавить на главный экран"', 'info');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6 relative animate-fade-in-up cursor-default text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900 mb-1 font-outfit">Приложение TORMAG</h3>
          <p className="text-slate-500 text-xs">Установите приложение для быстрого доступа к каталогу и заказам.</p>
        </div>

        {isIOS ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-700 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>Нажмите кнопку <strong>«Поделиться»</strong> <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> в меню Safari.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Выберите <strong>«На экран "Домой"»</strong> <PlusSquare className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-all text-xs cursor-pointer border-0"
            >
              Понятно
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Download className="h-4 w-4" />
                <span>Установить приложение</span>
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                <p>1. Откройте меню браузера (<strong>⋮</strong>).</p>
                <p>2. Выберите <strong>«Добавить на главный экран»</strong>.</p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs cursor-pointer border-0"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
