import React, { useState } from 'react';
import { Lock, Mail, RefreshCw, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '../services/api';
import logoImg from '../tormag.png';

export default function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState('admin@tormag.kz');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      
      // Allow only ADMIN or SUPPLIER to enter admin panel
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPPLIER') {
        throw new Error('Доступ запрещен. У вас нет прав администратора или дистрибьютора.');
      }

      localStorage.setItem('tormag_admin_token', data.token);
      localStorage.setItem('tormag_admin_user', JSON.stringify(data.user));
      
      onAuthSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Double-Sided Container Card */}
      <div className="w-full max-w-4xl bg-white border border-slate-200/60 rounded-[2.5rem] shadow-[0_24px_80px_-40px_rgba(15,23,42,0.15)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] relative z-10 animate-fade-in-up">
        
        {/* Left Column: Premium Rebranded Corporate Showcase */}
        <div className="md:col-span-6 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200/50 p-8 sm:p-12 flex flex-col justify-between text-left relative overflow-hidden">
          {/* Subtle geometric line drawing backdrops */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Logo Brand Header */}
          <div className="flex items-center gap-2 shrink-0 relative z-10">
            <img src={logoImg} alt="TORMAG.KZ Logo" className="h-[130px] -my-10 -ml-10 w-auto object-contain shrink-0" />
          </div>

          {/* Main Huge Heading */}
          <div className="my-10 space-y-6 relative z-10 max-w-sm">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] tracking-tight font-outfit text-left">
              Единый <br />
              кабинет <br />
              администратора <br />
              <span className="text-blue-600">и поставщика</span>
            </h2>
            
            <div className="pt-4 border-t border-slate-200/80 w-12">
            </div>
          </div>

          {/* Footer Version Tag */}
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider relative z-10">
            © 2026 TORMAG.KZ
          </div>
        </div>

        {/* Right Column: Modern Authentication Forms */}
        <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-between text-left relative z-10 bg-white">
          <div className="space-y-6 my-auto">
            {/* Greetings */}
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 font-outfit">Добро пожаловать</h3>
              <p className="text-slate-400 text-xs leading-normal">
                Пожалуйста, введите ваши данные для входа в систему.
              </p>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-2xl border border-red-100 shadow-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login Field */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Логин или Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@tormag.kz"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600/50 text-sm text-slate-800 transition-all font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-600/50 text-sm text-slate-800 transition-all font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 font-semibold select-none group-hover:text-slate-800 transition-colors">
                    Запомнить меня
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5 mt-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <>
                    <span>Войти в систему</span>
                    <ArrowRight className="h-4.5 w-4.5 text-slate-300" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panel Copyright Footer */}
          <div className="text-center pt-8 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              © 2026 Вход только для зарегистрированных пользователей.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
