import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const remainingRef = useRef(4000);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  const normalizedToast = toast
    ? (typeof toast === 'string'
      ? { message: toast, type: 'success', duration: 4000, id: 'toast' }
      : { duration: 4000, type: 'success', id: toast.id || 'toast', ...toast })
    : null;

  const duration = normalizedToast?.duration || 4000;

  useEffect(() => {
    if (!normalizedToast) return;

    startTimeRef.current = Date.now();
    remainingRef.current = duration;
    setIsHovered(false);

    timerRef.current = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [normalizedToast?.id, duration, onClose]);

  if (!normalizedToast) return null;

  const type = normalizedToast.type || 'success';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimeRef.current = Date.now();
    if (remainingRef.current > 0) {
      timerRef.current = setTimeout(() => {
        onClose?.();
      }, remainingRef.current);
    }
  };

  // Strip leading emoji characters to avoid font squares
  const cleanText = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\s]+/u, '').trim();
  };

  const messageText = cleanText(normalizedToast.message);
  const titleText = cleanText(normalizedToast.title);

  // Clean, sharp reference design color maps matching the screenshot
  const styles = {
    success: {
      bg: 'bg-[#f0fdf4]',
      border: 'border-[#22c55e]',
      text: 'text-[#15803d]',
      iconBorder: 'border-[#16a34a]',
      iconColor: 'text-[#16a34a]',
      progressBar: 'bg-[#16a34a]',
      Icon: Check,
    },
    error: {
      bg: 'bg-[#fff1f2]',
      border: 'border-[#ef4444]',
      text: 'text-[#991b1b]',
      iconBorder: 'border-[#dc2626]',
      iconColor: 'text-[#dc2626]',
      progressBar: 'bg-[#dc2626]',
      Icon: AlertCircle,
    },
    warning: {
      bg: 'bg-[#fffbeb]',
      border: 'border-[#f59e0b]',
      text: 'text-[#b45309]',
      iconBorder: 'border-[#d97706]',
      iconColor: 'text-[#d97706]',
      progressBar: 'bg-[#d97706]',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-[#eff6ff]',
      border: 'border-[#3b82f6]',
      text: 'text-[#1d4ed8]',
      iconBorder: 'border-[#2563eb]',
      iconColor: 'text-[#2563eb]',
      progressBar: 'bg-[#2563eb]',
      Icon: Info,
    },
  };

  const selectedStyle = styles[type] || styles.success;
  const Icon = selectedStyle.Icon;

  return (
    <div className="fixed top-2 left-2.5 right-2.5 z-[9999] w-auto sm:top-[54px] sm:right-6 sm:left-auto sm:max-w-md animate-fade-in-down">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden ${selectedStyle.bg} border-2 ${selectedStyle.border} ${selectedStyle.text} px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-full sm:min-w-[300px] select-none`}
      >
        {/* Left: Circle Icon & Message */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-6 h-6 rounded-full border-2 ${selectedStyle.iconBorder} flex items-center justify-center shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${selectedStyle.iconColor} stroke-[2.8]`} />
          </div>
          <div className="min-w-0 flex-1">
            {titleText && (
              <div className="text-xs font-bold leading-tight mb-0.5">{titleText}</div>
            )}
            <div className="text-sm font-semibold leading-snug whitespace-nowrap sm:whitespace-normal">
              {messageText}
            </div>
          </div>
        </div>

        {/* Right: Close Cross Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${selectedStyle.text} hover:opacity-75 transition-opacity p-0.5 shrink-0 cursor-pointer`}
            title="Закрыть"
          >
            <X className="h-4.5 w-4.5 stroke-[2]" />
          </button>
        )}

        {/* Animated Progress Bar at bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 pointer-events-none">
          <div
            key={normalizedToast.id}
            style={{
              animation: `toastProgress ${duration}ms linear forwards`,
              animationPlayState: isHovered ? 'paused' : 'running',
            }}
            className={`h-full ${selectedStyle.progressBar}`}
          />
        </div>
      </div>
    </div>
  );
}
