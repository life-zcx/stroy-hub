import React from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  const normalizedToast = typeof toast === 'string'
    ? { message: toast, type: 'success' }
    : toast;
  const type = normalizedToast.type || 'success';
  const styles = {
    success: {
      wrapper: 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80',
      icon: 'bg-emerald-600 text-white',
      Icon: Check,
    },
    error: {
      wrapper: 'bg-red-50/95 text-red-800 border-red-200/80',
      icon: 'bg-red-600 text-white',
      Icon: AlertTriangle,
    },
    warning: {
      wrapper: 'bg-amber-50/95 text-amber-900 border-amber-200/80',
      icon: 'bg-amber-500 text-white',
      Icon: AlertTriangle,
    },
    info: {
      wrapper: 'bg-blue-50/95 text-blue-800 border-blue-200/80',
      icon: 'bg-blue-600 text-white',
      Icon: Info,
    },
  };
  const selectedStyle = styles[type] || styles.success;
  const Icon = selectedStyle.Icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className={`${selectedStyle.wrapper} backdrop-blur-sm px-5 py-3.5 rounded-2xl shadow-xl flex items-start gap-3 border max-w-sm`}>
        <div className={`${selectedStyle.icon} p-1 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
          <Icon className="h-3.5 w-3.5 stroke-[3.5]" />
        </div>
        <div className="space-y-0.5">
          {normalizedToast.title && <div className="text-xs font-black leading-normal">{normalizedToast.title}</div>}
          <div className="text-xs font-bold leading-normal">{normalizedToast.message}</div>
        </div>
      </div>
    </div>
  );
}
