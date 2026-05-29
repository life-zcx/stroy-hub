import React from 'react';
import { X, Hammer, Clock } from 'lucide-react';
import logoImg from '../tormag.png';

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
  authResetCode,
  setAuthResetCode,
  authError,
  setAuthError,
  authLoading,
  resendCooldown,
  handleResendCode,
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
          <div className="inline-flex items-center justify-center mb-1">
            <img src={logoImg} alt="TORMAG.KZ Logo" className="h-[95px] -my-6 w-auto object-contain shrink-0" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-outfit">Личный кабинет покупателя</h3>
          <p className="text-slate-500 text-xs mt-1">
            {authTab === 'forgot' ? 'Восстановление доступа к аккаунту' : 
             authTab === 'reset' ? 'Установите новый пароль' : 
             'Авторизуйтесь для оформления заказов и отслеживания доставки'}
          </p>
        </div>

        {/* Tab Switcher - only show for login/register */}
        {(authTab === 'login' || authTab === 'register') && (
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Войти
            </button>
            <button
              onClick={() => { setAuthTab('register'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Регистрация
            </button>
          </div>
        )}

        {authError && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* Email input - shown in login, register, forgot, reset */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Электронная почта *</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              disabled={authTab === 'reset'} // Lock email during reset step
              placeholder="alex@test.com"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 disabled:opacity-60"
            />
          </div>

          {/* Verification Code input - only shown in 'reset' */}
          {authTab === 'reset' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Код из письма *</label>
              <input
                type="text"
                value={authResetCode}
                onChange={(e) => setAuthResetCode(e.target.value)}
                required
                maxLength={6}
                placeholder="123456"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 font-mono text-center tracking-widest text-lg"
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || authLoading}
                  className={`text-xs font-semibold bg-transparent border-0 cursor-pointer ${
                    resendCooldown > 0 
                      ? 'text-slate-400 cursor-not-allowed' 
                      : 'text-emerald-600 hover:text-emerald-500 hover:underline'
                  }`}
                >
                  {resendCooldown > 0 
                    ? `Отправить код повторно через ${resendCooldown} сек` 
                    : 'Отправить код повторно'}
                </button>
              </div>
            </div>
          )}

          {/* Password input - shown in login, register, reset */}
          {(authTab === 'login' || authTab === 'register' || authTab === 'reset') && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                {authTab === 'reset' ? 'Новый пароль *' : 'Пароль *'}
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
              />
            </div>
          )}

          {/* Forgot Password Link - only shown in 'login' */}
          {authTab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setAuthTab('forgot'); setAuthError(null); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-500 hover:underline bg-transparent border-0 cursor-pointer"
              >
                Забыли пароль?
              </button>
            </div>
          )}

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
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center border-0 cursor-pointer"
            disabled={authLoading}
          >
            {authLoading ? (
              <Clock className="h-5 w-5 animate-spin" />
            ) : authTab === 'login' ? (
              'Войти в систему'
            ) : authTab === 'register' ? (
              'Зарегистрироваться'
            ) : authTab === 'forgot' ? (
              'Получить код восстановления'
            ) : (
              'Сбросить пароль'
            )}
          </button>

          {/* Go Back buttons for recovery flows */}
          {(authTab === 'forgot' || authTab === 'reset') && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-0 cursor-pointer"
              >
                Вернуться к авторизации
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
