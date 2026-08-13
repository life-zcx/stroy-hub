import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';

const CITY_COORDINATES = {
  'Алматы': [43.238949, 76.889709],
  'Астана': [51.169392, 71.449074],
  'Шымкент': [42.3417, 69.5901],
  'Караганда': [49.8019, 73.1021],
  'Актобе': [50.2839, 57.1670],
  'Тараз': [42.9000, 71.3667],
  'Павлодар': [52.2873, 76.9674],
  'Кызылорда': [44.8488, 65.5092],
  'Усть-Каменогорск': [49.9500, 82.6167],
  'Семей': [50.4111, 80.2275],
  'Атырау': [47.1167, 51.8833],
  'Актау': [43.6500, 51.1500],
  'Уральск': [51.2333, 51.3667],
  'Костанай': [53.2144, 63.6246],
  'Петропавловск': [54.8667, 69.1500],
};

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY || '';

export default function AddressMapPicker({ initialCity = 'Алматы', initialStreet = '', onSelectAddress }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addressText, setAddressText] = useState(initialStreet ? `${initialCity}, ${initialStreet}` : initialCity);

  const reverseGeocode = async (coords) => {
    let detectedCity = initialCity;
    let detectedStreet = '';
    let fullAddress = '';

    // 1. Try Yandex JS Geocoder
    if (window.ymaps && window.ymaps.geocode) {
      try {
        const res = await window.ymaps.geocode(coords);
        const firstGeoObject = res.geoObjects?.get(0);
        if (firstGeoObject) {
          const name = firstGeoObject.properties.get('name') || '';
          const text = firstGeoObject.properties.get('text') || firstGeoObject.getAddressLine() || '';
          const description = firstGeoObject.properties.get('description') || '';

          const localities = firstGeoObject.getLocalities();
          if (localities && localities.length > 0) {
            detectedCity = localities[0];
          } else if (description.includes('Алматы')) {
            detectedCity = 'Алматы';
          } else if (description.includes('Астана')) {
            detectedCity = 'Астана';
          }

          const thoroughfare = firstGeoObject.getThoroughfare();
          const premiseNumber = firstGeoObject.getPremiseNumber();

          if (thoroughfare) {
            detectedStreet = `${thoroughfare}${premiseNumber ? ', д. ' + premiseNumber : ''}`;
          } else if (name && name !== detectedCity && !name.includes('точки') && !name.includes('координаты')) {
            detectedStreet = name;
          } else if (text) {
            const cleaned = text
              .replace(/^Казахстан,\s*/i, '')
              .replace(new RegExp(`^${detectedCity},\\s*`, 'i'), '');
            if (cleaned && cleaned !== detectedCity) {
              detectedStreet = cleaned;
            }
          }

          if (detectedStreet) {
            fullAddress = text || `${detectedCity}, ${detectedStreet}`;
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Fallback to BigDataCloud API
    if (!detectedStreet || detectedStreet === detectedCity) {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords[0]}&longitude=${coords[1]}&localityLanguage=ru`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.city || data.locality) {
              detectedCity = data.city || data.locality || detectedCity;
            }
            const informatives = data.localityInfo?.informative || [];
            const roadInfo = informatives.find(i => i.description === 'road' || i.description === 'street' || i.order === 8 || i.order === 9);
            if (roadInfo?.name) {
              detectedStreet = roadInfo.name;
            }
          }
        }
      } catch (e) {
        console.warn('BigDataCloud geocoding error:', e);
      }
    }

    // 3. Fallback to OSM Nominatim
    if (!detectedStreet || detectedStreet === detectedCity) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&accept-language=ru`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            detectedCity = data.address.city || data.address.town || data.address.village || detectedCity;
            const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
            const houseNumber = data.address.house_number || '';
            if (road) {
              detectedStreet = `${road}${houseNumber ? ', д. ' + houseNumber : ''}`;
            }
            if (data.display_name) {
              fullAddress = data.display_name;
            }
          }
        }
      } catch (e) {
        console.warn('OSM Nominatim geocoding error:', e);
      }
    }

    const isGeneric = !detectedStreet || 
      detectedStreet === detectedCity || 
      detectedStreet.includes('Указанная точка') || 
      detectedStreet.includes('Казахстан');

    const realStreet = isGeneric ? '' : detectedStreet;

    if (realStreet) {
      setAddressText(fullAddress || `${detectedCity}, ${realStreet}`);
    } else {
      setAddressText(`${detectedCity} (точка: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`);
    }

    onSelectAddress?.({
      city: detectedCity,
      street: realStreet,
      coords
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadYandexMapsScript = () => {
      if (window.ymaps) {
        if (isMounted) window.ymaps.ready(initMap);
        return;
      }

      const existingScript = document.getElementById('yandex-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isMounted && window.ymaps) window.ymaps.ready(initMap);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = 'yandex-maps-script';
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => {
        if (isMounted && window.ymaps) {
          window.ymaps.ready(initMap);
        }
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const centerCoords = CITY_COORDINATES[initialCity] || [43.238949, 76.889709];

      try {
        const map = new window.ymaps.Map(mapContainerRef.current, {
          center: centerCoords,
          zoom: 15,
          controls: ['zoomControl', 'geolocationControl']
        });

        const placemark = new window.ymaps.Placemark(centerCoords, {
          hintContent: 'Кликните на карту или перетащите метку'
        }, {
          draggable: true,
          preset: 'islands#blueIcon'
        });

        map.geoObjects.add(placemark);

        mapInstanceRef.current = map;
        placemarkRef.current = placemark;

        // Event listeners
        placemark.events.add('dragend', () => {
          const newCoords = placemark.geometry.getCoordinates();
          reverseGeocode(newCoords);
        });

        map.events.add('click', (e) => {
          const clickedCoords = e.get('coords');
          placemark.geometry.setCoordinates(clickedCoords);
          reverseGeocode(clickedCoords);
        });

        if (isMounted) setMapLoaded(true);
      } catch (e) {
        console.error('Error initializing map:', e);
      }
    };

    loadYandexMapsScript();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when city changes
  useEffect(() => {
    if (mapInstanceRef.current && initialCity) {
      const newCoords = CITY_COORDINATES[initialCity];
      if (newCoords) {
        mapInstanceRef.current.setCenter(newCoords, 14);
        if (placemarkRef.current) {
          placemarkRef.current.geometry.setCoordinates(newCoords);
        }
      }
    }
  }, [initialCity]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        if (mapInstanceRef.current && placemarkRef.current) {
          mapInstanceRef.current.setCenter(coords, 16);
          placemarkRef.current.geometry.setCoordinates(coords);
          await reverseGeocode(coords);
        }
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Не удалось определить ваше местоположение');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;
    setSearching(true);

    const cleanInput = searchQuery
      .replace(/\bд\.\s*/gi, ' ')
      .replace(/\bул\.\s*/gi, ' ')
      .replace(/\bмкр\.\s*/gi, 'микрорайон ')
      .replace(/\s+/g, ' ')
      .trim();

    const queryWithCity = cleanInput.toLowerCase().includes(initialCity.toLowerCase())
      ? cleanInput
      : `${initialCity}, ${cleanInput}`;

    let foundCoords = null;

    if (window.ymaps && window.ymaps.geocode) {
      try {
        const res = await window.ymaps.geocode(queryWithCity);
        const firstGeoObject = res.geoObjects?.get(0);
        if (firstGeoObject) {
          foundCoords = firstGeoObject.geometry.getCoordinates();
        }
      } catch {
        // Fallback to Nominatim
      }
    }

    if (!foundCoords) {
      try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryWithCity)}&format=json&accept-language=ru&limit=1`);
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            foundCoords = [parseFloat(nomData[0].lat), parseFloat(nomData[0].lon)];
          }
        }
      } catch (err) {
        console.warn('Nominatim search error:', err);
      }
    }

    if (foundCoords) {
      if (mapInstanceRef.current && placemarkRef.current) {
        mapInstanceRef.current.setCenter(foundCoords, 16);
        placemarkRef.current.geometry.setCoordinates(foundCoords);
        await reverseGeocode(foundCoords);
      }
    } else {
      alert(`Адрес "${searchQuery}" не найден на карте. Попробуйте уточнить название улицы или дома.`);
    }

    setSearching(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#1b5fc1]" />
          Укажите точку на карте
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="text-[11px] font-bold text-[#1b5fc1] hover:text-[#144ba0] flex items-center gap-1 bg-[#ecf3fe] hover:bg-[#deebff] px-3 py-1 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          {locating ? 'Поиск...' : 'Мое местоположение'}
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-250 shadow-sm bg-slate-100 h-64 sm:h-80 md:h-[320px]">
        {/* Floating Yellow Search Bar inside map */}
        <div className="absolute top-2.5 left-2.5 z-10 max-w-[260px] sm:max-w-xs w-full shadow-md rounded-xl overflow-hidden bg-white border border-slate-200">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchSubmit(e);
                }
              }}
              placeholder={`Поиск адреса в г. ${initialCity}...`}
              className="w-full pl-8 pr-16 py-1.5 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={searching || !searchQuery.trim()}
              className="absolute right-1 px-2.5 py-1 bg-[#ffdb4d] hover:bg-[#ebd03f] active:scale-95 disabled:opacity-50 text-slate-900 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin text-slate-900" /> : 'Найти'}
            </button>
          </div>
        </div>

        <div ref={mapContainerRef} className="w-full h-full" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-50/90 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 z-20">
            <Loader2 className="w-5 h-5 animate-spin text-[#1b5fc1]" />
            Загрузка Яндекс.Карт...
          </div>
        )}
      </div>

      {addressText && (
        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Выбранный адрес: <span className="font-bold text-slate-900">{addressText}</span>
          </p>
        </div>
      )}
    </div>
  );
}
