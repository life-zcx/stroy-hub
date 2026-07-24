import React, { useState } from 'react';
import { X, Clock, Eye, EyeOff, User, Building2 } from 'lucide-react';
import logoImg from '../tormag.png';
import { ALL_CITIES } from '../utils/geo';

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
  entityType,
  setEntityType,
  companyBin,
  setCompanyBin,
  companyName,
  setCompanyName,
  directorName,
  setDirectorName,
  legalAddress,
  setLegalAddress,
  organizationType,
  setOrganizationType,
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
  const isLegalReg = authTab === 'register' && entityType === 'LEGAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full ${isLegalReg ? 'max-w-4xl' : authTab === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white border border-gray-150 p-6 md:p-8 rounded-3xl shadow-2xl relative space-y-5 animate-fade-in-up transition-all duration-300 my-auto`}>
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

        {/* Entity Type Switcher (Physical vs Legal) during Registration */}
        {authTab === 'register' && (
          <div className="flex items-center justify-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setEntityType('PHYSICAL')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${entityType === 'PHYSICAL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Физическое лицо</span>
            </button>
            <button
              type="button"
              onClick={() => setEntityType('LEGAL')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${entityType === 'LEGAL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Юридическое лицо</span>
            </button>
          </div>
        )}

        {authError && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isLegalReg ? (
            /* WIDE 2-COLUMN LAYOUT FOR LEGAL ENTITY REGISTRATION */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {/* Left Column: Organization Details */}
              <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Данные организации</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">БИН или ИИН *</label>
                  <input
                    type="text"
                    value={companyBin}
                    onChange={(e) => setCompanyBin(e.target.value)}
                    required
                    maxLength={12}
                    placeholder="Введите БИН или ИИН"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Наименование организации *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Введите наименование организации"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО руководителя *</label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    required
                    placeholder="Введите ФИО руководителя"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Юридический адрес *</label>
                  <input
                    type="text"
                    value={legalAddress}
                    onChange={(e) => setLegalAddress(e.target.value)}
                    required
                    placeholder="Введите юридический адрес"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тип организации *</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="">Выберите тип организации</option>
                    <option value="ТОО">ТОО (Товарищество с ограниченной ответственностью)</option>
                    <option value="ИП">ИП (Индивидуальный предприниматель)</option>
                    <option value="АО">АО (Акционерное общество)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Account & Contact Details */}
              <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Контактные & Учетные данные</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Электронная почта *</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="user@tormag.kz"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Пароль *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full p-2.5 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-transparent border-0 p-1 cursor-pointer flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО контактного лица *</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                    placeholder="Иванов Иван"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Телефон *</label>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    placeholder="+7 (707) 123-45-67"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Регион *</label>
                    <select
                      value={currentRegion}
                      onChange={(e) => handleSelectRegion(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 cursor-pointer"
                    >
                      {ALL_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Адрес доставки</label>
                    <input
                      type="text"
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="Улица, дом"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD SINGLE/DOUBLE COLUMN LAYOUT FOR OTHER MODAL STATES */
            <div className={authTab === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
              {/* Email input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Электронная почта *</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={authTab === 'reset' || authTab === 'register-confirm'}
                  placeholder="user@tormag.kz"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800 disabled:opacity-60"
                />
              </div>

              {/* Verification Code input */}
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
                      className={`text-xs font-semibold bg-transparent border-0 cursor-pointer ${resendCooldown > 0
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

              {/* Password input */}
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
                      autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-transparent border-0 p-1 cursor-pointer flex items-center justify-center"
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
                        <div className={`h-full transition-all duration-300 ${pwdStrength.score === 1 ? 'w-1/3 bg-red-500' :
                          pwdStrength.score === 2 ? 'w-2/3 bg-amber-500' :
                            'w-full bg-emerald-500'
                          }`} />
                      </div>
                      <span className={`text-[10px] font-bold ${pwdStrength.score === 1 ? 'text-red-500' :
                        pwdStrength.score === 2 ? 'text-amber-500' :
                          'text-emerald-600'
                        }`}>
                        {pwdStrength.text}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Forgot Password Link */}
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
                      {ALL_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
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
          )}

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
