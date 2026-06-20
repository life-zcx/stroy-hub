import React, { useState, useMemo } from 'react';
import { X, Search, MapPin, Check } from 'lucide-react';
import { ALL_CITIES, POPULAR_CITIES, findClosestCity } from '../utils/geo';

export default function RegionModal({
  isOpen,
  onClose,
  currentRegion,
  handleSelectRegion,
  showToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    return ALL_CITIES.filter(city => 
      city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const detectRegion = () => {
    if (!navigator.geolocation) {
      showToast?.('⚠️ Геолокация не поддерживается');
      return;
    }

    showToast?.('🔍 Определяем город...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const cityName = findClosestCity(position.coords.latitude, position.coords.longitude);
        handleSelectRegion(cityName);
      },
      () => {
        showToast?.('⚠️ Разрешите доступ к геопозиции или выберите город вручную.');
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-[26px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh] border border-white/20">
        
        {/* Header */}
        <div className="p-6 pb-4 relative">
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-extrabold text-slate-900 mb-5 font-outfit uppercase tracking-tight">
            Выберите город
          </h2>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              placeholder="Найти город"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/30 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-base"
            />
          </div>
        </div>

        {/* Popular Cities */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1.5 leading-none">
            {POPULAR_CITIES.map(city => (
              <button
                key={city}
                onClick={() => handleSelectRegion(city)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentRegion === city 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* City List */}
        <div className="flex-grow overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0.5">
              {filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => handleSelectRegion(city)}
                  className={`group flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
                    currentRegion === city 
                    ? 'bg-emerald-50 text-emerald-700 font-bold' 
                    : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <span className="text-sm truncate">{city}</span>
                  {currentRegion === city && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Город не найден</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 box-border">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5" />
            <span>Текущий город: <span className="text-slate-900">{currentRegion || 'Не выбран'}</span></span>
          </div>
          
          <button 
            onClick={detectRegion}
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-[11px] transition-colors uppercase tracking-widest leading-none bg-emerald-50 py-2 px-3 rounded-lg"
          >
            <MapPin className="h-3.5 w-3.5" />
            Определить город
          </button>
        </div>
      </div>
    </div>
  );
}
