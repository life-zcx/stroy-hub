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
      // 1. Try to fetch location by IP silently (without browser popups)
      fetch('https://ipapi.co/json/')
        .then((res) => {
          if (!res.ok) throw new Error('IP geo lookup failed');
          return res.json();
        })
        .then((data) => {
          const apiCity = data.city ? data.city.toLowerCase().trim() : '';
          
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

          const matchedCity = CITY_TRANSLATIONS[apiCity];
          if (matchedCity) {
            handleSelectRegion(matchedCity);
            showToast?.(`📍 Мы определили ваш город: ${matchedCity}`);
          } else {
            // If the IP-detected city is not in our mapping, fallback to browser geolocation
            triggerBrowserGeolocation();
          }
        })
        .catch(() => {
          // If IP fetch fails, fallback to browser geolocation
          triggerBrowserGeolocation();
        });
    }

    function triggerBrowserGeolocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const cityName = findClosestCity(position.coords.latitude, position.coords.longitude);
            handleSelectRegion(cityName);
            showToast?.(`📍 Мы определили ваш город: ${cityName}`);
          },
          () => {
            // If denied or error, open the modal
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
