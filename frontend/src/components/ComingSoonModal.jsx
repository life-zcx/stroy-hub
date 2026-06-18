import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

export default function ComingSoonModal({ isOpen, onClose, title, message }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white/95 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative border border-slate-100/50 flex flex-col items-center text-center overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative subtle background gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="space-y-4 max-w-md mb-8 mt-4">
          <h3 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
            {title || 'Мы скоро откроемся!'}
          </h3>
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
            {message || 'Совсем скоро наш сайт заработает в полную силу! Сейчас вы можете ознакомиться с каталогом товаров и нашими услугами.'}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-slate-905/10 text-sm flex items-center justify-center gap-2 group active:scale-95 duration-200"
        >
          <span>Перейти на сайт</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
