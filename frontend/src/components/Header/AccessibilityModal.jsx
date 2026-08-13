import React, { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';

const STORAGE_KEYS = {
  active: 'tormag_accessibility_active',
  fontSize: 'tormag_accessibility_font_size',
  theme: 'tormag_accessibility_theme',
  fontType: 'tormag_accessibility_font_type',
  hideImages: 'tormag_accessibility_hide_images',
};

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) ?? fallback;
};

const readBooleanStorage = (key) => readStorage(key, 'false') === 'true';

export default function AccessibilityModal({ isOpen, onClose }) {
  const [accessibilityActive, setAccessibilityActive] = useState(() => readBooleanStorage(STORAGE_KEYS.active));
  const [fontSize, setFontSize] = useState(() => readStorage(STORAGE_KEYS.fontSize, 'sm'));
  const [accessibilityTheme, setAccessibilityTheme] = useState(() => readStorage(STORAGE_KEYS.theme, 'default'));
  const [fontType, setFontType] = useState(() => readStorage(STORAGE_KEYS.fontType, 'default'));
  const [hideImages, setHideImages] = useState(() => readBooleanStorage(STORAGE_KEYS.hideImages));

  useEffect(() => {
    const html = document.documentElement;

    html.classList.remove(
      'accessibility-active',
      'accessibility-font-md',
      'accessibility-font-lg',
      'accessibility-theme-bw',
      'accessibility-theme-yb',
      'accessibility-dyslexic',
      'accessibility-no-images'
    );

    if (accessibilityActive) {
      html.classList.add('accessibility-active');

      if (fontSize === 'md') html.classList.add('accessibility-font-md');
      if (fontSize === 'lg') html.classList.add('accessibility-font-lg');

      if (accessibilityTheme === 'bw') html.classList.add('accessibility-theme-bw');
      if (accessibilityTheme === 'yb') html.classList.add('accessibility-theme-yb');

      if (fontType === 'dyslexic') html.classList.add('accessibility-dyslexic');
      if (hideImages) html.classList.add('accessibility-no-images');
    }

    localStorage.setItem(STORAGE_KEYS.active, accessibilityActive);
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    localStorage.setItem(STORAGE_KEYS.theme, accessibilityTheme);
    localStorage.setItem(STORAGE_KEYS.fontType, fontType);
    localStorage.setItem(STORAGE_KEYS.hideImages, hideImages);
  }, [accessibilityActive, fontSize, accessibilityTheme, fontType, hideImages]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const resetSettings = () => {
    setAccessibilityActive(false);
    setFontSize('sm');
    setAccessibilityTheme('default');
    setFontType('default');
    setHideImages(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-[24px] shadow-2xl p-8 relative animate-fade-in-up cursor-default text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Закрыть настройки доступности"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-outfit leading-snug">
              Панель настроек доступности
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Адаптируйте интерфейс сайта под ваше зрение.
            </p>
          </div>
        </div>

        <div className="space-y-5 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Размер шрифта</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setFontSize('sm');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${fontSize === 'sm'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Стандарт (А)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setFontSize('md');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${fontSize === 'md'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Средний (А+)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setFontSize('lg');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${fontSize === 'lg'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Крупный (А++)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Цветовая схема</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setAccessibilityTheme('default');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${accessibilityTheme === 'default'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Обычная
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setAccessibilityTheme('bw');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${accessibilityTheme === 'bw'
                    ? 'bg-black border-black text-white shadow-sm font-black'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Ч/Б контраст
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setAccessibilityTheme('yb');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-bold ${accessibilityTheme === 'yb'
                    ? 'bg-yellow-300 border-black text-black shadow-sm font-black'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Желто-черная
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Шрифт</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setFontType('default');
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${fontType === 'default'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Стандартный
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setFontType('dyslexic');
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${fontType === 'dyslexic'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Без засечек (Arial)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Изображения</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setHideImages(false);
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${!hideImages
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Показывать
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessibilityActive(true);
                  setHideImages(true);
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all text-xs font-bold ${hideImages
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
                  }`}
              >
                Скрыть
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={resetSettings}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-xs text-center"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-xs text-center border-0 cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
