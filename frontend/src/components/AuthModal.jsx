import React from 'react';
import { X, Hammer, Clock } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  authTab,
  setAuthTab,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  authPhone,
  setAuthPhone,
  authAddress,
  setAuthAddress,
  authError,
  setAuthError,
  authLoading,
  handleAuthSubmit,
  currentRegion,
  handleSelectRegion,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-gray-150 p-8 rounded-3xl shadow-2xl relative space-y-6 animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex bg-gradient-to-br from-teal-500 to-emerald-600 p-2.5 rounded-xl text-white mb-2 shadow-lg shadow-emerald-500/10">
            <Hammer className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-outfit">Личный кабинет покупателя</h3>
          <p className="text-slate-500 text-xs mt-1">Авторизуйтесь для оформления заказов и отслеживания доставки</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setAuthTab('login'); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
          >
            Войти
          </button>
          <button
            onClick={() => { setAuthTab('register'); setAuthError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
          >
            Регистрация
          </button>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Электронная почта *</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              placeholder="alex@test.com"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Пароль *</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
            />
          </div>

          {authTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ваше Имя *</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                  placeholder="Александр"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Телефон *</label>
                <input
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  required
                  placeholder="+7 (707) 123-45-67"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Адрес доставки</label>
                <input
                  type="text"
                  value={authAddress}
                  onChange={(e) => setAuthAddress(e.target.value)}
                  placeholder="Улица, дом, квартира"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Регион *</label>
                <select
                  value={currentRegion}
                  onChange={(e) => handleSelectRegion(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 cursor-pointer"
                >
                  <option value="Алматы">Алматы</option>
                  <option value="Астана">Астана</option>
                  <option value="Шымкент">Шымкент</option>
                  <option value="Караганда">Караганда</option>
                  <option value="Актобе">Актобе</option>
                  <option value="Атырау">Атырау</option>
                  <option value="Актау">Актау</option>
                  <option value="Усть-Каменогорск">Усть-Каменогорск</option>
                  <option value="Павлодар">Павлодар</option>
                  <option value="Тараз">Тараз</option>
                  <option value="Костанай">Костанай</option>
                  <option value="Кызылорда">Кызылорда</option>
                  <option value="Уральск">Уральск</option>
                  <option value="Петропавловск">Петропавловск</option>
                  <option value="Туркестан">Туркестан</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center"
            disabled={authLoading}
          >
            {authLoading ? <Clock className="h-5 w-5 animate-spin" /> : authTab === 'login' ? 'Войти в систему' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
