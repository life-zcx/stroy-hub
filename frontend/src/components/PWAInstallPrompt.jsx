import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Bell, Check } from 'lucide-react';
import { subscribeUserToPush } from '../services/pushService';

export default function PWAInstallPrompt({ showToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Notification permission is already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushSubscribed(true);
    }

    // Check if already running as installed standalone app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Check session dismissal
    const dismissedSession = sessionStorage.getItem('tormag_pwa_dismissed');
    if (dismissedSession) return;

    // Detect mobile device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent) || window.innerWidth < 768;

    if (isIosDevice) {
      setIsIOS(true);
    }

    // Show prompt for mobile browsers
    if (isMobile) {
      setShowPrompt(true);
    }

    // Capture Android Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted PWA install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (!isIOS) {
      if (showToast) {
        showToast('Откройте меню браузера (⋮) и выберите "Добавить на главный экран"', 'info');
      }
    }
  };

  const handleEnablePush = async () => {
    setLoadingPush(true);
    try {
      await subscribeUserToPush();
      setPushSubscribed(true);
      if (showToast) {
        showToast('Уведомления успешно включены', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Ошибка включения уведомлений', 'error');
      }
    } finally {
      setLoadingPush(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('tormag_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[75] max-w-sm w-full animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-white text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 shrink-0 border border-slate-700/50">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Приложение TORMAG</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {isIOS 
                  ? 'Нажмите «Поделиться» ⎋ и выберите «На экран "Домой"»'
                  : 'Быстрый доступ к каталогу и отслеживанию заказов.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors shrink-0 border-0 bg-transparent cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Установить</span>
          </button>

          {!pushSubscribed && (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={loadingPush}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>{loadingPush ? '...' : 'Push'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
