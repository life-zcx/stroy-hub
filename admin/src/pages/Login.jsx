import React, { useState } from 'react';
import { Hammer, Lock, Mail, RefreshCw } from 'lucide-react';
import { login } from '../services/api';

export default function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      localStorage.setItem('stroyhub_admin_token', data.token);
      localStorage.setItem('stroyhub_admin_user', JSON.stringify(data.user));
      
      onAuthSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-[140px] opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600 rounded-full blur-[140px] opacity-15"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
        
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-br from-amber-400 to-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-500/20 mb-2 animate-bounce">
            <Hammer className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-outfit">
            stroy-<span className="text-amber-500">hub.kz</span>
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Панель управления дистрибьюторов</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Электронная почта</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@stroy-hub.kz"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 text-white text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 text-white text-sm transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              'Войти в систему'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Охраняется stroy-hub security</span>
        </div>

      </div>
    </div>
  );
}
