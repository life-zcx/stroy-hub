import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, LayoutTemplate } from 'lucide-react';
import { getSystemSettings, saveSystemSettings } from '../../../services/api';

export default function SettingsPage({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    comingSoonModalEnabled: false,
    comingSoonTitle: '',
    comingSoonMessage: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast('Не удалось загрузить настройки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveSystemSettings(settings);
      showToast('Настройки сайта успешно сохранены', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-outfit uppercase tracking-tight">Настройки сайта</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Управление глобальными параметрами и режимами отображения</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Main Settings Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header section with toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-emerald-600" />
                  <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Модальное окно "Скоро открытие"</span>
                </div>
                <p className="text-xs text-slate-500">
                  Показывать всплывающее окно о скором запуске при первом входе посетителей на сайт.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, comingSoonModalEnabled: !prev.comingSoonModalEnabled }))}
                className="flex items-center focus:outline-none transition-colors"
              >
                {settings.comingSoonModalEnabled ? (
                  <ToggleRight className="h-14 w-14 text-emerald-650" />
                ) : (
                  <ToggleLeft className="h-14 w-14 text-slate-300" />
                )}
              </button>
            </div>

            {settings.comingSoonModalEnabled && (
              <div className="space-y-4 animate-fade-in-up">
                {/* Warning alert */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3 text-amber-850">
                  <AlertTriangle className="h-5 w-5 text-amber-605 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium space-y-1">
                    <p className="font-extrabold uppercase tracking-wide text-[10px]">Внимание</p>
                    <p className="leading-relaxed">
                      При включении этого режима, каждый новый посетитель при входе увидит приветственное модальное окно. Пользователи смогут закрыть его, чтобы продолжить работу с сайтом. В рамках одной сессии (пока вкладка открыта) окно повторно показываться не будет.
                    </p>
                  </div>
                </div>

                {/* Title input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Заголовок окна
                  </label>
                  <input
                    type="text"
                    value={settings.comingSoonTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, comingSoonTitle: e.target.value }))}
                    placeholder="Например: Мы скоро откроемся!"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Message input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Текст сообщения
                  </label>
                  <textarea
                    rows={4}
                    value={settings.comingSoonMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, comingSoonMessage: e.target.value }))}
                    placeholder="Подробная информация для пользователей..."
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-medium text-slate-855 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Form Actions Footer */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-150 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/10 active:scale-95 transition-all"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить настройки
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
