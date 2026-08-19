import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Bell } from 'lucide-react';
import { subscribeUserToPush } from '../services/pushService';

export default function PWAInstallPrompt({ showToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Notification permission is already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushSubscribed(true);
    }

    // Check if already running inside installed standalone PWA app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsStandaloneMode(true);
      // In installed PWA, prompt for Push if not enabled yet
      if ('Notification' in window && Notification.permission !== 'granted') {
        const pushDismissed = sessionStorage.getItem('tormag_push_dismissed');
        if (!pushDismissed) {
          setShowPrompt(true);
        }
      }
      return;
    }

    // Check browser session dismissal
    const dismissedSession = sessionStorage.getItem('tormag_pwa_dismissed');
    if (dismissedSession) return;

    // Detect mobile device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent) || window.innerWidth < 768;

    if (isIosDevice) {
      setIsIOS(true);
    }

    // Show install prompt for mobile browsers
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
      setShowPrompt(false);
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
    if (isStandaloneMode) {
      sessionStorage.getItem('tormag_push_dismissed', 'true');
    } else {
      sessionStorage.setItem('tormag_pwa_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 z-[75] max-w-sm md:w-[360px] mx-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-white text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 shrink-0 border border-slate-700/50">
              {isStandaloneMode ? <Bell className="w-5 h-5 text-blue-400" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                {isStandaloneMode ? 'Уведомления TORMAG' : 'Приложение TORMAG'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {isStandaloneMode
                  ? 'Включите Push для получения статусов заказов и акционных скидок.'
                  : isIOS 
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

        <div className="pt-1 border-t border-slate-800">
          {isStandaloneMode ? (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={loadingPush}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
            >
              <Bell className="w-4 h-4" />
              <span>{loadingPush ? 'Включение...' : 'Включить Push-уведомления'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Установить приложение</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
