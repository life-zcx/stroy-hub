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
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[99999] max-w-sm w-full animate-slide-up font-sans">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 text-white p-4 sm:p-5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] flex flex-col gap-3 relative overflow-hidden text-left">
        {/* Soft Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-600/25 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse text-blue-400" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                Доступно обновление сайта!
              </h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 leading-snug">
                Вышла новая версия TORMAG. Нажмите кнопку для применения.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border-0 shrink-0"
            title="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-1 z-10">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:scale-98 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Применение изменений...' : 'Обновить и применить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
