import React, { useState, useEffect } from 'react';
import { X, Phone, Clock } from 'lucide-react';
import { createCallbackRequest } from '../services/api';
import { formatKazakhPhone, normalizeInput, validateName, validatePhone } from '../utils/formValidation';

export default function CallbackModal({ isOpen, onClose, onNavigate, showToast }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handlePhoneChange = (e) => {
    setPhone(formatKazakhPhone(e.target.value));
    setError('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameError = validateName(name, 'Ваше имя');
    const phoneError = validatePhone(phone, 'Телефон');

    if (nameError || phoneError) {
      setError(nameError || phoneError);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await createCallbackRequest(normalizeInput(name), phone);
      showToast?.('✅ Заявка отправлена! Мы перезвоним вам в ближайшее время.');
      onClose();
      setName('');
      setPhone('');
    } catch (error) {
      showToast?.('❌ Ошибка при отправке заявки: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-8 relative animate-fade-in-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Заказать звонок</h3>
          <p className="text-slate-500 text-sm">Представьтесь, мы вам перезвоним.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ваше имя *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              required
              placeholder="Иван"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Телефон *</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              placeholder="+7 (707) 123-45-67"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/50 text-sm text-slate-900 transition-all font-mono tracking-wider"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#525252] hover:bg-slate-900 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Clock className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Отправить</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            Продолжая, вы соглашаетесь с{' '}
            <span 
              onClick={() => {
                onNavigate?.('legal');
                onClose();
              }}
              className="underline underline-offset-2 cursor-pointer hover:text-emerald-600 transition-colors"
            >
              политикой конфиденциальности
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
