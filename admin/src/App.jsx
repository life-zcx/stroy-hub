import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { getProfile } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('stroyhub_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getProfile();
      if (profile.role === 'ADMIN' || profile.role === 'SUPPLIER') {
        setUser(profile);
      } else {
        localStorage.removeItem('stroyhub_admin_token');
        localStorage.removeItem('stroyhub_admin_user');
      }
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      localStorage.removeItem('stroyhub_admin_token');
      localStorage.removeItem('stroyhub_admin_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    showToast(`👋 С возвращением, ${userData.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('stroyhub_admin_token');
    localStorage.removeItem('stroyhub_admin_user');
    setUser(null);
    showToast('🚪 Вы успешно вышли из панели управления.');
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-400">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide uppercase">Безопасное соединение stroy-hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} showToast={showToast} />
      ) : (
        <Login onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Premium Toast Messages */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
            <div className="bg-green-500/20 p-1.5 rounded-full">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
            </div>
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
