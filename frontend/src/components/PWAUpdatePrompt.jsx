import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Immediate check on registration
        r.update().catch(() => {});

        // Check on tab focus / visibility change
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            r.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Periodically check for SW updates every 5 minutes
        const intervalId = setInterval(() => {
          r.update().catch(() => {});
        }, 5 * 60 * 1000);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  const [updating, setUpdating] = React.useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
    } catch (e) {
      console.error('Failed to clear browser cache:', e);
    }

    try {
      await updateServiceWorker(true);
    } catch (e) {
      console.warn('updateServiceWorker error:', e);
    }

    // Force immediate hard reload
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[99999] max-w-sm w-full animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 relative text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Доступна новая версия
              </h4>
              <p className="text-xs text-slate-400 font-normal mt-0.5 leading-snug">
                Обновите страницу для применения изменений.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer border-0 shrink-0"
            title="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Обновление...' : 'Обновить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
