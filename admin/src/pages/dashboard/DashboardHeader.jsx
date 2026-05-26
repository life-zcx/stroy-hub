import React from 'react';
import { LogOut as LogOutIcon, RefreshCw as RefreshCwIcon } from 'lucide-react';

export default function DashboardHeader({ user, isSupplier, loading, onReload, onLogout }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-5 mb-8 gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Панель управления StroyHub
          </h1>
          <span className="text-xs bg-slate-900 text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {user.role}
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Вы вошли как <strong className="text-slate-700">{user.name} ({user.email})</strong>
          {isSupplier && ` • Представитель склада «${user.supplierName}»`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onReload}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          disabled={loading}
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Синхронизировать
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
        >
          <LogOutIcon className="h-4.5 w-4.5" />
          Выйти
        </button>
      </div>
    </div>
  );
}
