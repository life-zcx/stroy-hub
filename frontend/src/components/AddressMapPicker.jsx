import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

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

export default function AddressMapPicker({ initialCity = 'Алматы', initialStreet = '', onSelectAddress }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressText, setAddressText] = useState(initialStreet ? `${initialCity}, ${initialStreet}` : initialCity);

  const reverseGeocode = async (coords) => {
    let detectedCity = initialCity;
    let detectedStreet = '';
    let fullAddress = '';

    // 1. Try Yandex Geocoder
    if (window.ymaps && window.ymaps.geocode) {
      try {
        const res = await window.ymaps.geocode(coords);
        const firstGeoObject = res.geoObjects.get(0);
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
          } else if (name && name !== detectedCity) {
            detectedStreet = name;
          } else {
            detectedStreet = text.replace(/^Казахстан,\s*/i, '').replace(new RegExp(`^${detectedCity},\\s*`, 'i'), '');
          }

          fullAddress = text || `${detectedCity}, ${detectedStreet}`;
        }
      } catch (err) {
        console.error('Yandex geocoding error:', err);
      }
    }

    // 2. Fallback to OSM Nominatim if street is still empty
    if (!detectedStreet || detectedStreet === detectedCity) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&accept-language=ru`);
        const data = await res.json();
        if (data && data.address) {
          detectedCity = data.address.city || data.address.town || data.address.village || detectedCity;
          const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
          const houseNumber = data.address.house_number || '';
          if (road) {
            detectedStreet = `${road}${houseNumber ? ', д. ' + houseNumber : ''}`;
          } else {
            detectedStreet = data.display_name || '';
          }
          fullAddress = data.display_name || fullAddress;
        }
      } catch (e) {
        console.error('OSM Nominatim geocoding error:', e);
      }
    }

    const finalStreet = detectedStreet || 'Указанная точка на карте';
    setAddressText(fullAddress || `${detectedCity}, ${finalStreet}`);

    onSelectAddress?.({
      city: detectedCity,
      street: finalStreet,
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
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
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
        }, {
          searchControlProvider: 'yandex#search'
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-50/90 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
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
