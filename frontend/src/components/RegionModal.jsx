import React from 'react';
import { X, MapPin } from 'lucide-react';

const GEO_LOCATIONS = [
  { name: 'Алматы и область', lat: 43.2389, lon: 76.8897 },
  { name: 'Астана и Акмолинская область', lat: 51.1693, lon: 71.4490 },
  { name: 'Шымкент и область', lat: 42.3249, lon: 69.5881 },
  { name: 'Караганда и область', lat: 49.8019, lon: 73.1021 },
  { name: 'Атырау и область', lat: 47.1164, lon: 51.9056 },
  { name: 'Усть-Каменогорск и ВКО', lat: 49.9483, lon: 82.6285 },
  { name: 'Актобе и область', lat: 50.2839, lon: 57.1669 },
  { name: 'Павлодар и область', lat: 52.2873, lon: 76.9674 },
  { name: 'Тараз и Жамбылская область', lat: 42.9026, lon: 71.3656 },
  { name: 'Уральск и ЗКО', lat: 51.2333, lon: 51.3667 },
  { name: 'Костанай и область', lat: 53.2144, lon: 63.6244 },
  { name: 'Кызылорда и область', lat: 44.8528, lon: 65.5092 },
  { name: 'Актау и Мангистауская область', lat: 43.6480, lon: 51.1722 },
  { name: 'Петропавловск и СКО', lat: 54.8753, lon: 69.1629 },
  { name: 'Кокшетау и область', lat: 53.2833, lon: 69.3833 },
  { name: 'Талдыкорган и область', lat: 45.0167, lon: 78.3667 },
  { name: 'Туркестан и область', lat: 43.3000, lon: 68.2700 },
];

const REGION_OPTIONS = [
  { name: 'Алматы и область', label: 'г. Алматы и Алматинская область' },
  { name: 'Астана и Акмолинская область', label: 'г. Астана и Акмолинская область' },
  { name: 'Шымкент и область', label: 'г. Шымкент и Туркестанская область' },
  { name: 'Караганда и область', label: 'г. Караганда и Карагандинская область' },
  { name: 'Атырау и область', label: 'г. Атырау и Атырауская область' },
  { name: 'Усть-Каменогорск и ВКО', label: 'г. Усть-Каменогорск и Восточно-Казахстанская область (ВКО)' },
  { name: 'Актобе и область', label: 'г. Актобе и Актюбинская область' },
  { name: 'Павлодар и область', label: 'г. Павлодар и Павлодарская область' },
  { name: 'Тараз и Жамбылская область', label: 'г. Тараз и Жамбылская область' },
  { name: 'Уральск и ЗКО', label: 'г. Уральск и Западно-Казахстанская область (ЗКО)' },
  { name: 'Костанай и область', label: 'г. Костанай и Костанайская область' },
  { name: 'Кызылорда и область', label: 'г. Кызылорда и Кызылординская область' },
  { name: 'Актау и Мангистауская область', label: 'г. Актау и Мангистауская область' },
  { name: 'Петропавловск и СКО', label: 'г. Петропавловск и Северо-Казахстанская область (СКО)' },
  { name: 'Кокшетау и область', label: 'г. Кокшетау и Акмолинская область (Север)' },
  { name: 'Талдыкорган и область', label: 'г. Талдыкорган и Жетысуская область' },
  { name: 'Туркестан и область', label: 'г. Туркестан и Туркестанская область (Юг)' },
];

export default function RegionModal({
  isOpen,
  onClose,
  currentRegion,
  handleSelectRegion,
  showToast,
}) {
  if (!isOpen) return null;

  const detectRegion = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Геолокация не поддерживается');
      return;
    }

    showToast('🔍 Определяем геопозицию по спутникам...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let closest = GEO_LOCATIONS[0];
        let minDistance = Infinity;

        GEO_LOCATIONS.forEach(loc => {
          const dist = Math.sqrt(Math.pow(lat - loc.lat, 2) + Math.pow(lon - loc.lon, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closest = loc;
          }
        });

        handleSelectRegion(closest.name);
      },
      () => {
        showToast('⚠️ Ошибка геолокации. Выберите вручную.');
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-gray-150 p-6 sm:p-7 rounded-3xl shadow-2xl relative space-y-5 animate-fade-in-up text-center">
        {localStorage.getItem('stroyhub_region') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div>
          <div className="inline-flex bg-gradient-to-br from-teal-500 to-emerald-600 p-3 rounded-2xl text-white mb-2 shadow-lg shadow-teal-500/10">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-outfit">Выберите ваш регион</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed">Для точного расчета цен, наличия товаров на складах дистрибьюторов и сроков логистики по Казахстану</p>
        </div>

        <button
          type="button"
          onClick={detectRegion}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 border border-emerald-700/10 group"
        >
          <MapPin className="h-4.5 w-4.5 animate-bounce" />
          <span>Определить автоматически</span>
        </button>

        <div className="text-slate-300 flex items-center justify-center gap-2 my-2 text-[10px] uppercase font-bold tracking-widest">
          <span className="h-[1px] bg-slate-200 w-16"></span>
          <span>Или выберите вручную</span>
          <span className="h-[1px] bg-slate-200 w-16"></span>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 space-y-0.5 scrollbar-thin select-none">
          {REGION_OPTIONS.map(reg => (
            <button
              key={reg.name}
              type="button"
              onClick={() => handleSelectRegion(reg.name)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between shrink-0 ${currentRegion === reg.name
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-slate-50 border-gray-150 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <span>{reg.label}</span>
              {currentRegion === reg.name && (
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shadow shadow-emerald-600/50 shrink-0 ml-2"></span>
              )}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 font-semibold pt-1 uppercase tracking-wider">
          Вы всегда сможете изменить регион в верхнем меню сайта
        </div>
      </div>
    </div>
  );
}
