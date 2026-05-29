import { useState, useEffect } from 'react';
import { findClosestCity } from '../utils/geo';

export default function useRegion(showToast) {
  const [currentRegion, setCurrentRegion] = useState(() => {
    return localStorage.getItem('tormag_region') || 'Алматы';
  });
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  useEffect(() => {
    const savedRegion = localStorage.getItem('tormag_region');
    
    if (!savedRegion) {
      console.log('[GEO IP] No saved region found. Attempting silent first-party IP geolocation...');
      
      // Fetch from our OWN backend (completely AdBlock-safe!)
      fetch('/api/geo')
        .then((res) => {
          if (!res.ok) throw new Error('First-party geo lookup failed');
          return res.json();
        })
        .then((data) => {
          console.log('[GEO IP] Backend response:', data);
          const apiCity = data.city ? data.city.toLowerCase().trim() : '';
          
          if (!processCity(apiCity)) {
            console.log('[GEO IP] City not mapped from backend. Falling back to browser GPS...');
            triggerBrowserGeolocation();
          }
        })
        .catch((err) => {
          console.warn('[GEO IP] Backend geolocation failed:', err.message);
          triggerBrowserGeolocation();
        });
    }

    // English-to-Russian mapping for Kazakhstan cities
    const CITY_TRANSLATIONS = {
      'almaty': 'Алматы',
      'astana': 'Астана',
      'nur-sultan': 'Астана',
      'shymkent': 'Шымкент',
      'karaganda': 'Караганда',
      'qaraghandy': 'Караганда',
      'atyrau': 'Атырау',
      'aktobe': 'Актобе',
      'ust-kamenogorsk': 'Усть-Каменогорск',
      'oskemen': 'Усть-Каменогорск',
      'pavlodar': 'Павлодар',
      'taraz': 'Тараз',
      'uralsk': 'Уральск',
      'oral': 'Уральск',
      'kostanay': 'Костанай',
      'kustanay': 'Костанай',
      'kyzylorda': 'Кызылорда',
      'aktau': 'Актау',
      'petropavlovsk': 'Петропавловск',
      'kokshetau': 'Кокшетау',
      'taldykorgan': 'Талдыкорган',
      'turkestan': 'Туркестан',
      'semey': 'Семей',
      'semipalatinsk': 'Семей',
      'temirtau': 'Темиртау',
      'zhezkazgan': 'Жезказган',
      'rudny': 'Рудный',
      'ekibastuz': 'Экибастуз',
      'kentau': 'Кентау',
      'zhanaozen': 'Жанаозен',
      'satpayev': 'Сатпаев',
      'kaskelen': 'Каскелен',
      'stepnogorsk': 'Степногорск',
      'shuchinsk': 'Щучинск',
      'konaev': 'Конаев',
      'kapchagay': 'Конаев',
      'ridder': 'Риддер',
      'saran': 'Сарань',
      'aksu': 'Аксу',
      'tekeli': 'Текели',
      'zhitikara': 'Житикара',
      'aralsk': 'Аральск',
      'lisakovsk': 'Лисаковск',
      'atbasar': 'Атбасар',
      'shalkar': 'Шалкар',
      'khromtau': 'Хромтау',
      'ayagoz': 'Аягоз',
      'zaysan': 'Зайсан',
      'shemonaikha': 'Шемонаиха',
      'altay': 'Алтай',
      'balkhash': 'Балхаш',
      'ereymentau': 'Ерейментау',
      'esil': 'Есиль',
      'makat': 'Макат',
      'shu': 'Шу',
      'kandyagash': 'Кандыагаш',
      'fort-shevchenko': 'Форт-Шевченко'
    };

    function processCity(cityLower) {
      if (!cityLower) return false;
      const matchedCity = CITY_TRANSLATIONS[cityLower];
      if (matchedCity) {
        console.log(`[GEO IP] Successfully matched: "${cityLower}" -> "${matchedCity}"`);
        handleSelectRegion(matchedCity);
        return true;
      }
      return false;
    }

    function triggerBrowserGeolocation() {
      console.log('[GEO IP] Requesting browser HTML5 Geolocation coordinates...');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const cityName = findClosestCity(position.coords.latitude, position.coords.longitude);
            console.log('[GEO IP] Browser HTML5 coords matched closest city:', cityName);
            handleSelectRegion(cityName);
          },
          (err) => {
            console.warn('[GEO IP] Browser Geolocation denied or failed:', err);
            setRegionModalOpen(true);
          }
        );
      } else {
        setRegionModalOpen(true);
      }
    }
  }, []);

  const handleSelectRegion = (region) => {
    setCurrentRegion(region);
    localStorage.setItem('tormag_region', region);
    setRegionModalOpen(false);
  };

  return {
    currentRegion,
    regionModalOpen,
    setRegionModalOpen,
    handleSelectRegion,
  };
}
