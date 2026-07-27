import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MapPin, Check, Compass } from 'lucide-react';
import { ALL_CITIES, POPULAR_CITIES, findClosestCity } from '../utils/geo';

export default function CityModal({ isOpen, onClose, currentCity, onSelectCity }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CITIES;
    const query = searchQuery.toLowerCase().trim();
    return ALL_CITIES.filter(city => city.toLowerCase().includes(query));
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (city) => {
    onSelectCity(city);
    try {
      localStorage.setItem('tormag_user_city', city);
      localStorage.setItem('tormag_region', city);
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleDetectCity = () => {
    if (!navigator.geolocation) {
      handleSelect('Алматы');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const closest = findClosestCity(pos.coords.latitude, pos.coords.longitude);
        handleSelect(closest || 'Алматы');
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        handleSelect('Алматы');
      },
      { timeout: 5000 }
    );
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">
            ВЫБЕРИТЕ ГОРОД
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 pt-4 pb-2 shrink-0 bg-white">
          <div className="relative flex items-center">
            <Search className="h-4.5 w-4.5 text-blue-600 absolute left-4 pointer-events-none stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти город"
              autoFocus
              className="w-full pl-11 pr-9 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Cities Pills (show if no search query) */}
        {!searchQuery && (
          <div className="px-6 py-2 shrink-0 flex flex-wrap gap-2">
            {POPULAR_CITIES.map((city) => {
              const isSelected = currentCity?.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        )}

        {/* 3 Columns Cities Grid (Scrolls smoothly inside container) */}
        <div className="px-6 py-3 overflow-y-auto flex-1 min-h-0 space-y-1">
          {filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-3">
              {filteredCities.map((city) => {
                const isSelected = currentCity?.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-600 font-extrabold border border-blue-100'
                        : 'hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    <span className="truncate">{city}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-bold text-slate-400">
              Населенный пункт не найден
            </div>
          )}
        </div>

        {/* Footer Bar (Always Fixed at bottom) */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Текущий город: <strong className="font-extrabold text-slate-900">{currentCity || 'Алматы'}</strong></span>
          </div>
          <button
            type="button"
            onClick={handleDetectCity}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-black tracking-wider text-[11px] uppercase cursor-pointer transition-colors disabled:opacity-50"
          >
            <Compass className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Определяем...' : 'ОПРЕДЕЛИТЬ ГОРОД'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
