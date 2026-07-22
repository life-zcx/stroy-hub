import React from 'react';
import { AlertTriangle, Check, Info } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  const normalizedToast = typeof toast === 'string'
    ? { message: toast, type: 'success' }
    : toast;
  const type = normalizedToast.type || 'success';

  // Strip leading emoji characters to avoid missing font square glyphs
  const cleanText = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\s]+/u, '');
  };

  const messageText = cleanText(normalizedToast.message);
  const titleText = cleanText(normalizedToast.title);

  const styles = {
    success: {
      line: 'from-emerald-400 via-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]',
      iconColor: 'text-emerald-400',
      Icon: Check,
    },
    error: {
      line: 'from-rose-400 via-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]',
      iconColor: 'text-rose-400',
      Icon: AlertTriangle,
    },
    warning: {
      line: 'from-amber-400 via-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]',
      iconColor: 'text-amber-400',
      Icon: AlertTriangle,
    },
    info: {
      line: 'from-sky-400 via-sky-500 to-blue-500 shadow-[0_0_12px_rgba(14,165,233,0.9)]',
      iconColor: 'text-sky-400',
      Icon: Info,
    },
  };

  const selectedStyle = styles[type] || styles.success;
  const Icon = selectedStyle.Icon;

  return (
    <div className="fixed top-4 left-4 right-4 sm:top-auto sm:bottom-6 sm:left-auto sm:right-6 z-50 animate-fade-in-up sm:max-w-md w-auto">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl space-y-2 border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 ${selectedStyle.iconColor} shrink-0`} />
          <div className="space-y-0.5">
            {titleText && (
              <div className="text-xs font-bold text-slate-200">{titleText}</div>
            )}
            <div className="text-xs font-semibold text-white leading-snug break-words">
              {messageText}
            </div>
          </div>
        </div>
        {/* Красивая светящаяся полоса снизу */}
        <div className={`h-0.5 w-full rounded-full bg-gradient-to-r ${selectedStyle.line}`} />
      </div>
    </div>
  );
}
