import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Truck, MapPin, Navigation, Info, RefreshCw, 
  CheckCircle, ShieldAlert, Award, Compass, Clock, Send,
  Sliders, Save, Settings, ChevronDown, ChevronUp
} from 'lucide-react';
import { getOrders } from '../../../services/api';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

// Simulated Warehouse coordinates on our SVG map (1000x500 box)
const WAREHOUSES = {
  knauf: { name: 'Кнауф Центр (Север)', x: 500, y: 80, supplierName: 'Кнауф Центр (Прямой склад)', color: '#10b981' },
  lestorg: { name: 'ЛесТорг База (Запад)', x: 120, y: 280, supplierName: 'ЛесТорг База', color: '#3b82f6' },
  bosch: { name: 'Bosch KZ (Центр)', x: 480, y: 260, supplierName: 'Bosch Official KZ', color: '#f59e0b' },
  makita: { name: 'Макита-Казахстан (Восток)', x: 800, y: 270, supplierName: 'Макита-Казахстан', color: '#a855f7' },
  hardware: { name: 'Крепеж-Мастер (Юго-Восток)', x: 700, y: 400, supplierName: 'Крепеж-Мастер', color: '#ec4899' },
  stroyopt: { name: 'СтройОпт ТОО (Юг)', x: 420, y: 430, supplierName: 'СтройОпт ТОО', color: '#06b6d4' }
};

// Customer Delivery Object (simulated default in Almaty centre-south)
const CLIENT_LOCATION = { name: 'Объект клиента (мкр. Самал)', x: 520, y: 360 };

export default function LogisticsPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDispatched, setIsDispatched] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Dynamic Logistics Tariffs State synced with localStorage
  const [rates, setRates] = useState(() => {
    const saved = localStorage.getItem('stroyhub_logistics_rates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      dieselPrice: 295,          // 295 KZT / Litre diesel
      fuelConsumption: 15,       // 15 Litres / 100km
      amortizationRate: 50,      // 50 KZT / km wear & tear
      driverWagePercent: 40,     // 40% of baseline truck rate
      gazelleBaseCost: 6000,     // 6 000 KZT base rent Gazelle
      kamazBaseCost: 18000,      // 18 000 KZT base rent Kamaz
      furaBaseCost: 45000        // 45 000 KZT base rent Eurofura
    };
  });

  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      if (data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Ошибка загрузки заказов для калькуляции логистики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogisticsData();
  }, []);

  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  // Calculations based on order items and customized tariffs
  const logisticsMetrics = useMemo(() => {
    if (!activeOrder || !activeOrder.items) return null;

    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    const requiredWarehouses = new Set();

    activeOrder.items.forEach(item => {
      const product = item.product || {};
      const qty = item.quantity || 1;
      
      let itemWeight = 5; 
      let itemVol = 0.05; 
      
      if (product.category === 'mixes') {
        itemWeight = product.name.includes('50') ? 50 : 30;
        itemVol = 0.06;
      } else if (product.category === 'lumber') {
        itemWeight = 22;
        itemVol = 0.045;
      } else if (product.category === 'paints') {
        itemWeight = 11;
        itemVol = 0.015;
      } else if (product.category === 'hardware') {
        itemWeight = 3;
        itemVol = 0.005;
      } else if (product.category === 'tools') {
        itemWeight = 6;
        itemVol = 0.03;
      }

      totalWeightKg += itemWeight * qty;
      totalVolumeM3 += itemVol * qty;

      Object.entries(WAREHOUSES).forEach(([key, value]) => {
        if (product.supplier?.name === value.supplierName || product.supplierId === value.supplierName) {
          requiredWarehouses.add(key);
        }
      });
    });

    if (requiredWarehouses.size === 0) {
      requiredWarehouses.add('knauf');
      requiredWarehouses.add('bosch');
    }

    // Auto-select optimal transport and baseline rate from dynamic settings
    let truckType = 'ГАЗель 1.5т';
    let truckMaxLoad = '1 500 кг';
    let truckBaseCost = rates.gazelleBaseCost;
    
    if (totalWeightKg > 1500 && totalWeightKg <= 5000) {
      truckType = 'КамАЗ Манипулятор 5т';
      truckMaxLoad = '5 000 кг';
      truckBaseCost = rates.kamazBaseCost;
    } else if (totalWeightKg > 5000) {
      truckType = 'Еврофура Тягач 20т';
      truckMaxLoad = '20 000 кг';
      truckBaseCost = rates.furaBaseCost;
    }

    const pathNodes = [];
    let currentX = CLIENT_LOCATION.x;
    let currentY = CLIENT_LOCATION.y;
    let distanceKm = 0;

    const warehouseKeys = Array.from(requiredWarehouses);
    warehouseKeys.forEach(wKey => {
      const warehouse = WAREHOUSES[wKey];
      pathNodes.push(warehouse);
      
      const dx = warehouse.x - currentX;
      const dy = warehouse.y - currentY;
      const stepDist = Math.sqrt(dx*dx + dy*dy) * 0.045; 
      distanceKm += stepDist;

      currentX = warehouse.x;
      currentY = warehouse.y;
    });

    const dx = CLIENT_LOCATION.x - currentX;
    const dy = CLIENT_LOCATION.y - currentY;
    distanceKm += Math.sqrt(dx*dx + dy*dy) * 0.045;
    distanceKm = Math.round(distanceKm + 10); 

    // Calculations based on customize rate states
    const fuelCost = Math.round(distanceKm * (rates.fuelConsumption / 100) * rates.dieselPrice); 
    const driverSalary = Math.round(truckBaseCost * (rates.driverWagePercent / 100));
    const amortization = Math.round(distanceKm * rates.amortizationRate);
    const totalFreightCost = truckBaseCost + fuelCost + driverSalary + amortization;

    return {
      totalWeightKg: Math.round(totalWeightKg),
      totalVolumeM3: parseFloat(totalVolumeM3.toFixed(2)),
      requiredWarehouses: warehouseKeys,
      truckType,
      truckMaxLoad,
      distanceKm,
      fuelCost,
      driverSalary,
      amortization,
      totalFreightCost
    };
  }, [activeOrder, rates]);

  const handleDispatch = () => {
    setIsDispatched(true);
    showToast?.('🚛 Грузовой транспорт отправлен на консолидацию складов!');
    setTimeout(() => {
      setIsDispatched(false);
    }, 4000);
  };

  const handleRateChange = (key, val) => {
    setRates(prev => ({
      ...prev,
      [key]: parseFloat(val) || 0
    }));
  };

  const saveRatesToStorage = () => {
    localStorage.setItem('stroyhub_logistics_rates', JSON.stringify(rates));
    showToast?.('💾 Новые тарифы логистики и ГСМ успешно сохранены!');
    setShowConfig(false);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-black uppercase tracking-widest">Загружаем ведомости логистики...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header with collapsible Tariff Settings Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left">
          <h2 className="text-2xl font-black text-slate-900 font-outfit">Консолидированная Логистика и Доставка</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Оптимизируйте сборный забор грузов со складов разных дистрибьюторов Алматы и доставку единым рейсом.
          </p>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border-0"
        >
          <Settings className="h-4.5 w-4.5" /> 
          {showConfig ? 'Скрыть настройки тарифов' : 'Настройка тарифов & ГСМ'}
          {showConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Collapsible Tariff Config Panel */}
      {showConfig && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6 text-left animate-fade-in-up">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Sliders className="h-5 w-5 text-emerald-400" />
            <h4 className="text-sm font-black uppercase tracking-widest">Панель корректировки тарифов ГСМ и амортизации</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">Цена дизельного топлива (₸/литр)</label>
              <input 
                type="number" 
                value={rates.dieselPrice} 
                onChange={(e) => handleRateChange('dieselPrice', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">Расход топлива (л/100 км)</label>
              <input 
                type="number" 
                value={rates.fuelConsumption} 
                onChange={(e) => handleRateChange('fuelConsumption', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">Амортизация (₸ за км пути)</label>
              <input 
                type="number" 
                value={rates.amortizationRate} 
                onChange={(e) => handleRateChange('amortizationRate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">Оклад водителя (% от аренды)</label>
              <input 
                type="number" 
                value={rates.driverWagePercent} 
                onChange={(e) => handleRateChange('driverWagePercent', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">ГАЗЕЛЬ: Базовая аренда (₸)</label>
              <input 
                type="number" 
                value={rates.gazelleBaseCost} 
                onChange={(e) => handleRateChange('gazelleBaseCost', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">КАМАЗ: Базовая аренда (₸)</label>
              <input 
                type="number" 
                value={rates.kamazBaseCost} 
                onChange={(e) => handleRateChange('kamazBaseCost', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">ЕВРОФУРА: Базовая аренда (₸)</label>
              <input 
                type="number" 
                value={rates.furaBaseCost} 
                onChange={(e) => handleRateChange('furaBaseCost', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={saveRatesToStorage}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border-0 shadow-md"
            >
              <Save className="h-4 w-4" /> Зафиксировать тарифную сетку
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 4 cols: Orders List selector */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Navigation className="h-5 w-5 text-emerald-650 animate-bounce" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Заказы в сборке</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {orders.map(order => {
              const isSelected = order.id === selectedOrderId;
              return (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setIsDispatched(false);
                  }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer block relative ${
                    isSelected 
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md' 
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="block font-black text-xs uppercase tracking-wider">Заказ №{String(order.id).slice(0, 8)}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shrink-0 ${
                      isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-250 text-slate-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className={`block text-[11px] leading-relaxed font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    Клиент: {order.customerName || order.user?.name || 'B2B Заказчик'}
                  </span>
                  <span className={`block text-[10px] mt-1 ${isSelected ? 'text-emerald-300' : 'text-emerald-700 font-extrabold'}`}>
                    Итого к оплате: {formatPrice(order.total || order.totalAmount || 150000)}
                  </span>
                </button>
              );
            })}

            {orders.length === 0 && (
              <p className="text-xs text-slate-400 font-bold text-center py-8">Активные сборные заказы отсутствуют.</p>
            )}
          </div>
        </div>

        {/* Right 8 cols: Main Route Planner map & metrics */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          {activeOrder && logisticsMetrics ? (
            <>
              {/* Route Map & metrics grid */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-150 pb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5.5 w-5.5 text-emerald-600" />
                    <span className="text-sm font-black text-slate-950 font-outfit">Интерактивный симулятор забора грузов</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Консолидация складов Алматы
                  </span>
                </div>

                {/* SVG MAP CONSOLE */}
                <div className="relative border border-slate-200 rounded-2.5xl overflow-hidden bg-slate-950 shadow-inner">
                  <div className="absolute top-4 left-4 bg-slate-900/90 border border-white/10 rounded-xl p-3 z-10 space-y-1 text-white">
                    <span className="text-[8px] text-slate-450 uppercase font-black tracking-widest block">Условные обозначения</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                      <span>Склады консолидации</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shrink-0" />
                      <span>Объект доставки B2B</span>
                    </div>
                  </div>

                  <svg viewBox="0 0 1000 500" className="w-full h-auto max-h-[360px] opacity-90 select-none">
                    <path d="M 0,100 L 1000,100 M 0,200 L 1000,200 M 0,300 L 1000,300 M 0,400 L 1000,400 M 200,0 L 200,500 M 400,0 L 400,500 M 600,0 L 600,500 M 800,0 L 800,500" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    <path d="M 100,480 Q 500,400 900,480" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeDasharray="5,5" />
                    <text x="500" y="475" fill="rgba(255,255,255,0.2)" fontSize="14" fontWeight="black" textAnchor="middle" letterSpacing="6">ИЛИЙСКИЙ АЛАТАУ</text>

                    {/* Consolidated Route Path connector line loop */}
                    {logisticsMetrics.requiredWarehouses.map((wKey, index) => {
                      const start = WAREHOUSES[wKey];
                      const nextKey = logisticsMetrics.requiredWarehouses[(index + 1) % logisticsMetrics.requiredWarehouses.length];
                      const end = WAREHOUSES[nextKey];
                      
                      return (
                        <g key={`path-${index}`}>
                          <line 
                            x1={start.x} y1={start.y} 
                            x2={end.x} y2={end.y} 
                            stroke="#10b981" strokeWidth="2.5" 
                            strokeDasharray="8,5"
                            className="animate-dash"
                          />
                        </g>
                      );
                    })}

                    {/* Direct delivery route paths to client */}
                    {logisticsMetrics.requiredWarehouses.map(wKey => {
                      const warehouse = WAREHOUSES[wKey];
                      return (
                        <line 
                          key={`delivery-${wKey}`}
                          x1={warehouse.x} y1={warehouse.y} 
                          x2={CLIENT_LOCATION.x} y2={CLIENT_LOCATION.y} 
                          stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" 
                          strokeDasharray="4,4"
                        />
                      );
                    })}

                    {/* Distributor Warehouse Pins */}
                    {Object.entries(WAREHOUSES).map(([key, value]) => {
                      const isActive = logisticsMetrics.requiredWarehouses.includes(key);
                      return (
                        <g key={key} className="cursor-pointer group">
                          {isActive && (
                            <circle cx={value.x} cy={value.y} r="18" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1" className="animate-ping" />
                          )}
                          <circle 
                            cx={value.x} cy={value.y} r="8" 
                            fill={isActive ? '#10b981' : '#334155'} 
                            stroke="#0f172a" strokeWidth="2" 
                          />
                          <text 
                            x={value.x} y={value.y - 14} 
                            fill={isActive ? '#34d399' : '#94a3b8'} 
                            fontSize="10" fontWeight="bold" 
                            textAnchor="middle"
                          >
                            {value.name}
                          </text>
                        </g>
                      );
                    })}

                    {/* B2B Client Location Pin */}
                    <g>
                      <circle cx={CLIENT_LOCATION.x} cy={CLIENT_LOCATION.y} r="22" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1" className="animate-pulse" />
                      <circle cx={CLIENT_LOCATION.x} cy={CLIENT_LOCATION.y} r="8" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
                      <text x={CLIENT_LOCATION.x} y={CLIENT_LOCATION.y + 22} fill="#ef4444" fontSize="11" fontWeight="black" textAnchor="middle">
                        {CLIENT_LOCATION.name}
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Logistics breakdown specs grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl">
                    <span className="text-[10px] text-slate-450 uppercase font-black block mb-1">Спецификация веса</span>
                    <p className="text-base font-black text-slate-900 font-outfit">{logisticsMetrics.totalWeightKg} кг</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Суммарный вес груза</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">Рекомендованный транспорт</span>
                    <p className="text-base font-black text-emerald-700 font-outfit">{logisticsMetrics.truckType}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Вместимость до {logisticsMetrics.truckMaxLoad}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-2xl">
                    <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">Оптимизированный километраж</span>
                    <p className="text-base font-black text-slate-900 font-outfit">~ {logisticsMetrics.distanceKm} км</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Время в пути: ~2.5 часа</span>
                  </div>
                </div>

              </div>

              {/* Finance breakdown specs card */}
              <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-4 text-left w-full sm:w-auto">
                  <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest block">
                    Расчет себестоимости рейса ресейла
                  </span>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Базовая ставка транспорта:</span>
                    </div>
                    <span className="font-extrabold text-white">{formatPrice(logisticsMetrics.totalFreightCost * 0.55)}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Расходы на ДТ (Дизель):</span>
                    </div>
                    <span className="font-extrabold text-white">{formatPrice(logisticsMetrics.fuelCost)}</span>

                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Амортизация и ГСМ:</span>
                    </div>
                    <span className="font-extrabold text-white">{formatPrice(logisticsMetrics.amortization)}</span>

                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Оплата труда водителя ({rates.driverWagePercent}%):</span>
                    </div>
                    <span className="font-extrabold text-white">{formatPrice(logisticsMetrics.driverSalary)}</span>
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Общие расходы на консолидацию</span>
                    <h4 className="text-2xl font-black text-emerald-400 font-outfit">{formatPrice(logisticsMetrics.totalFreightCost)}</h4>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 space-y-3.5">
                  <button 
                    onClick={handleDispatch}
                    disabled={isDispatched}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-8 rounded-2xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4.5 w-4.5" /> {isDispatched ? 'Грузовик в пути!' : 'Отправить в рейс'}
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 text-[10px] text-slate-350 leading-relaxed font-semibold max-w-xs text-left">
                    <Clock className="h-4.5 w-4.5 text-emerald-400 inline-block mr-1.5 shrink-0 -mt-0.5" />
                    Нажмите «Отправить в рейс», чтобы передать путевой лист и логистические метки сборной доставки водителю-экспедитору.
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
              <Truck className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h4 className="text-lg font-black text-slate-900 font-outfit mb-1">Заказ не выбран</h4>
              <p className="text-xs text-slate-500">Выберите заказ в левой панели, чтобы сгенерировать симуляцию забора и смету транспортных расходов.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
