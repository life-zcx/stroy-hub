import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Bell, Check } from 'lucide-react';
import { subscribeUserToPush } from '../services/pushService';

export default function PWAInstallPrompt({ showToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    // Check if notification permission is already granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setPushSubscribed(true);
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('tormag_pwa_dismissed');
    if (dismissed) return;

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      // In standalone, just check for push capability if not subscribed
      if ('Notification' in window && Notification.permission !== 'granted') {
        setShowPrompt(true);
      }
      return;
    }

    // Detect mobile/desktop
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowIOSTip(true);
    }

    // Android / Desktop Chrome PWA prompt handler
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleEnablePush = async () => {
    setLoadingPush(true);
    try {
      await subscribeUserToPush();
      setPushSubscribed(true);
      if (showToast) {
        showToast('Уведомления успешно включены!', 'success');
      }
      setTimeout(() => {
        handleDismiss();
      }, 1500);
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
    setShowIOSTip(false);
    localStorage.setItem('tormag_pwa_dismissed', 'true');
  };

  if (!showPrompt && !showIOSTip) return null;

  const isMobile = typeof window !== 'undefined' && (/android|iphone|ipad|ipod/i.test(navigator.userAgent) || window.innerWidth < 768);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-md animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 shadow-xl shadow-emerald-900/10 flex flex-col gap-3 text-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm leading-tight">Приложение и Уведомления TORMAG</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {isIOS 
                  ? 'Нажмите «Поделиться» ⎋ и выберите «На экран "Домой"»'
                  : isMobile 
                    ? 'Быстрый доступ и статус заказов в 1 клик!'
                    : 'Установите приложение TORMAG на свой рабочий стол!'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Установить PWA</span>
            </button>
          )}

          {!pushSubscribed ? (
            <button
              onClick={handleEnablePush}
              disabled={loadingPush}
              className="flex-1 border border-blue-600 hover:bg-blue-50 text-blue-600 font-bold text-xs py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{loadingPush ? 'Включение...' : 'Включить Push'}</span>
            </button>
          ) : (
            <div className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Push включен</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
