import React from 'react';
import { ShieldAlert, Mail, Phone, LogOut, MessageSquare } from 'lucide-react';

export default function BlockedPage({ user, onLogout, onOpenCallback }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] border border-rose-200/80 shadow-2xl p-8 sm:p-12 text-center space-y-7 relative overflow-hidden">
        {/* Background Subtle Warning Accent */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-500/10 mx-auto relative z-10">
          <ShieldAlert className="h-10 w-10 stroke-[2.2]" />
        </div>

        {/* Text Details */}
        <div className="space-y-3 relative z-10">
          <div className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-700 text-xs font-black uppercase tracking-widest font-mono">
            Доступ ограничён
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Учетная запись заблокирована
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Доступ к функциям личного кабинета и оформлению заказов приостановлен администратором платформы TORMAG.
          </p>
        </div>

        {/* Support Contacts Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            Служба поддержки и отдел безопасности
          </span>
          <div className="space-y-2 text-xs sm:text-sm font-bold text-slate-800">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <a href="mailto:support@tormag.kz" className="hover:text-emerald-600 transition-colors">
                support@tormag.kz
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <a href="tel:+77771112233" className="hover:text-emerald-600 transition-colors">
                +7 (777) 111-22-33
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          {onOpenCallback && (
            <button
              type="button"
              onClick={onOpenCallback}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold px-7 py-3.5 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 border border-emerald-500/30 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Заказать обратный звонок</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold px-7 py-3.5 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider border border-slate-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Выйти из аккаунта</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
