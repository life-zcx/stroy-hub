import React, { useState } from 'react';
import { X, Hammer, Clock, Eye, EyeOff } from 'lucide-react';
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
  handlePhoneChange,
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
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', colorClass: '' };
    if (pwd.length < 6) return { score: 1, text: 'Слишком короткий (минимум 6 символов)', colorClass: 'bg-red-500 text-red-500' };
    const hasLetters = /[a-zA-Zа-яА-Я]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    if (hasLetters && hasNumbers) return { score: 3, text: 'Надежный пароль', colorClass: 'bg-emerald-500 text-emerald-500' };
    return { score: 2, text: 'Средний пароль (добавьте буквы или цифры)', colorClass: 'bg-amber-500 text-amber-500' };
  };

  const pwdStrength = getPasswordStrength(authPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full ${authTab === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white border border-gray-150 p-6 md:p-8 rounded-3xl shadow-2xl relative space-y-5 animate-fade-in-up transition-all duration-300 my-auto`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors z-10"
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
             authTab === 'register-confirm' ? 'Подтверждение почты' : 
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
          <div className={authTab === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
            
            {/* Email input - shown in login, register, forgot, reset, register-confirm */}
            <div className={authTab === 'register' ? '' : ''}>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Электронная почта *</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                disabled={authTab === 'reset' || authTab === 'register-confirm'} // Lock email during reset/confirm steps
                placeholder="customer@test.com"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 disabled:opacity-60"
              />
            </div>

            {/* Verification Code input - shown in 'reset' or 'register-confirm' */}
            {(authTab === 'reset' || authTab === 'register-confirm') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  {authTab === 'register-confirm' ? 'Код подтверждения из письма *' : 'Код из письма *'}
                </label>
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
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  {authTab === 'reset' ? 'Новый пароль *' : 'Пароль *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-transparent border-0 p-1 cursor-pointer flex items-center justify-center transition-colors"
                    title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {authTab === 'register' && authPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${
                        pwdStrength.score === 1 ? 'w-1/3 bg-red-500' :
                        pwdStrength.score === 2 ? 'w-2/3 bg-amber-500' :
                        'w-full bg-emerald-500'
                      }`} />
                    </div>
                    <span className={`text-[10px] font-bold ${
                      pwdStrength.score === 1 ? 'text-red-500' :
                      pwdStrength.score === 2 ? 'text-amber-500' :
                      'text-emerald-600'
                    }`}>
                      {pwdStrength.text}
                    </span>
                  </div>
                )}
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Ваше Имя *</label>
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Телефон *</label>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    placeholder="+7 (707) 123-45-67"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Регион *</label>
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
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Адрес доставки</label>
                  <input
                    type="text"
                    value={authAddress}
                    onChange={(e) => setAuthAddress(e.target.value)}
                    placeholder="Улица, дом, квартира"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center border-0 cursor-pointer mt-4"
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
            ) : authTab === 'register-confirm' ? (
              'Подтвердить и завершить регистрацию'
            ) : (
              'Сбросить пароль'
            )}
          </button>

          {/* Go Back buttons for recovery flows */}
          {(authTab === 'forgot' || authTab === 'reset' || authTab === 'register-confirm') && (
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
