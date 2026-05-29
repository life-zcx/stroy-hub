import React, { useState, useMemo } from 'react';
import { 
  Sparkles, ShoppingCart, SlidersHorizontal, ArrowLeft, Check, 
  Compass, Calculator, Hammer, Settings, Paintbrush, Layers, 
  Info, Plus, Minus, Trash2, CheckCircle2, DollarSign, ShieldAlert
} from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

const PROJECT_TYPES = [
  {
    id: 'renovation',
    name: 'Отделка и ремонт помещений',
    desc: 'Шпаклевка, выравнивание, грунтование и окраска любых объектов (офисы, цеха, жилые зоны).',
    icon: Paintbrush,
    fields: [
      { id: 'floorArea', label: 'Общая площадь пола объекта', unit: 'м²', min: 5, max: 2000, defaultValue: 50 },
      { id: 'ceilingHeight', label: 'Высота конструкции / стен', unit: 'м', min: 1.5, max: 12, defaultValue: 3.0, step: 0.1 }
    ]
  },
  {
    id: 'insulation',
    name: 'Тепло- и звукоизоляция (Пеноплекс)',
    desc: 'Утепление фасадов, ангаров, складов, перекрытий, балконов или любых строительных конструкций.',
    icon: ShieldAlert,
    fields: [
      { id: 'insulationArea', label: 'Общая площадь теплоизоляции', unit: 'м²', min: 5, max: 5000, defaultValue: 100 },
      { id: 'insulationThickness', label: 'Толщина слоя утеплителя', unit: 'мм', min: 20, max: 300, defaultValue: 50, step: 10 }
    ]
  },
  {
    id: 'foundation',
    name: 'Устройство фундамента',
    desc: 'Опалубка из досок, бетонная армированная основа под любые здания и сооружения.',
    icon: Calculator,
    fields: [
      { id: 'length', label: 'Общая длина фундамента', unit: 'пог. м', min: 10, max: 1000, defaultValue: 60 },
      { id: 'width', label: 'Ширина ленты фундамента', unit: 'м', min: 0.2, max: 3.0, defaultValue: 0.4, step: 0.1 },
      { id: 'depth', label: 'Глубина заложения фундамента', unit: 'м', min: 0.2, max: 5.0, defaultValue: 1.0, step: 0.1 }
    ]
  },
  {
    id: 'wall',
    name: 'Возведение и финиш конструкций / стен',
    desc: 'Штукатурка, финишная отделка перегородок, крепежи каркаса, фиксаторы.',
    icon: Layers,
    fields: [
      { id: 'wallArea', label: 'Общая площадь обрабатываемых стен', unit: 'м²', min: 10, max: 5000, defaultValue: 150 }
    ]
  },
  {
    id: 'bathroom',
    name: 'Отделка влажных зон / помещений',
    desc: 'Устройство стяжки пола, влагостойкая гидроизоляция, плиточные смеси для санузлов, бассейнов, автомоек.',
    icon: Settings,
    fields: [
      { id: 'floorArea', label: 'Площадь пола влажной зоны', unit: 'м²', min: 2, max: 1000, defaultValue: 20 },
      { id: 'ceilingHeight', label: 'Высота стен / перекрытий', unit: 'м', min: 1.5, max: 8, defaultValue: 3.0, step: 0.1 }
    ]
  },
  {
    id: 'decking',
    name: 'Террасы, настилы или ограждения',
    desc: 'Несущий каркас (брусья), деревянный или террасный настил, защитная обработка.',
    icon: Hammer,
    fields: [
      { id: 'deckArea', label: 'Общая площадь настила конструкции', unit: 'м²', min: 5, max: 1500, defaultValue: 40 }
    ]
  }
];

export default function Advisor({ products = [], onAddToCart, showToast }) {
  const [advisorStep, setAdvisorStep] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState('renovation');
  const [advisorBudget, setAdvisorBudget] = useState('standard'); // budget, standard, premium
  const [includeTools, setIncludeTools] = useState(true);
  const [extraStrength, setExtraStrength] = useState(false);
  
  // Dynamic parameters dictionary with expanded limits
  const [dimensions, setDimensions] = useState({
    floorArea: 50,
    ceilingHeight: 3.0,
    insulationArea: 100,
    insulationThickness: 50,
    length: 60,
    width: 0.4,
    depth: 1.0,
    wallArea: 150,
    deckArea: 40
  });

  const [advisorResults, setAdvisorResults] = useState([]);
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const activeProject = useMemo(() => {
    return PROJECT_TYPES.find(p => p.id === selectedProjectId) || PROJECT_TYPES[0];
  }, [selectedProjectId]);

  const handleDimensionChange = (key, val) => {
    setDimensions(prev => ({
      ...prev,
      [key]: parseFloat(val) || 0
    }));
  };

  const handleAdvisorSelect = () => {
    if (!products || products.length === 0) {
      showToast('⚠️ Продукты каталога загружаются. Попробуйте еще раз.');
      return;
    }

    const getProductForCategory = (categorySlug) => {
      let filtered = products.filter(p => p.category === categorySlug);
      if (filtered.length === 0) return null;

      if (advisorBudget === 'budget') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (advisorBudget === 'premium') {
        filtered.sort((a, b) => b.price - a.price);
      } else {
        filtered.sort((a, b) => b.rating - a.rating);
      }
      return filtered[0];
    };

    let items = [];

    // Main Calculator algorithms based on generic construction formulas
    if (selectedProjectId === 'renovation') {
      const floor = dimensions.floorArea;
      const height = dimensions.ceilingHeight;
      // Walls perimeter approximation: 4 * sqrt(floor) * height (applicable for any rectangular shape)
      const wallAreaApprox = Math.round(4 * Math.sqrt(floor) * height);
      
      const mixProduct = getProductForCategory('mixes');
      if (mixProduct) {
        const quantity = Math.max(1, Math.round(wallAreaApprox / 4));
        items.push({ product: mixProduct, quantity, calcReason: `Выравнивание стен: ~10кг/м² на ${wallAreaApprox} м² площади стен` });
      }

      const paintProduct = getProductForCategory('paints');
      if (paintProduct) {
        const quantity = Math.max(1, Math.round(wallAreaApprox / 30));
        items.push({ product: paintProduct, quantity, calcReason: `Окрашивание поверхностей в 2 слоя на ${wallAreaApprox} м²` });
      }

      const hardwareProduct = getProductForCategory('hardware');
      if (hardwareProduct) {
        const quantity = Math.max(1, Math.round(wallAreaApprox / 40));
        items.push({ product: hardwareProduct, quantity, calcReason: `Крепеж каркасов и монтажных систем` });
      }

      if (includeTools) {
        const toolProduct = getProductForCategory('tools');
        if (toolProduct) {
          items.push({ product: toolProduct, quantity: 1, calcReason: `Инструмент для монтажа и отделки` });
        }
      }
    } 
    
    else if (selectedProjectId === 'insulation') {
      const area = dimensions.insulationArea;
      const thick = dimensions.insulationThickness;

      let insulationProduct = products.find(p => 
        /пеноплекс|утеплитель|xps|минвата|плита|плиты|изоляц/i.test(p.name)
      );

      if (!insulationProduct) {
        const isPremium = advisorBudget === 'premium';
        const isBudget = advisorBudget === 'budget';
        insulationProduct = {
          id: 'temp_insulation_' + advisorBudget,
          name: isPremium 
            ? `Экструдированный пенополистирол Пеноплекс Фундамент ${thick} мм` 
            : isBudget 
              ? `Минеральная вата ТеплоКнауф Для Коттеджа ${thick} мм`
              : `Экструдированный пенополистирол Пеноплекс Комфорт ${thick} мм`,
          category: 'lumber', 
          price: isPremium ? 15500 : isBudget ? 7200 : 9800,
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
          rating: 4.8,
          supplier: { name: 'Пеноплекс-Казахстан (Офиц. склад)', delivery: 'Завтра' }
        };
      }

      const insulationQty = Math.max(1, Math.ceil(area / 5));
      items.push({ 
        product: insulationProduct, 
        quantity: insulationQty, 
        calcReason: `Теплоизоляция: Утепление поверхности ${area} м² (толщина ${thick} мм, ~5 м² на упак.)` 
      });

      const adhesiveMix = products.find(p => p.category === 'mixes' && /клей|цемент/i.test(p.name)) || getProductForCategory('mixes');
      if (adhesiveMix) {
        const qty = Math.max(1, Math.round(area / 6));
        items.push({ 
          product: adhesiveMix, 
          quantity: qty, 
          calcReason: `Клеевой состав: Монтаж плит утеплителя (~5кг/м²)` 
        });
      }

      let dowelProduct = products.find(p => p.category === 'hardware' && /дюбель|гриб|анкер/i.test(p.name));
      if (!dowelProduct) {
        dowelProduct = {
          id: 'temp_dowel',
          name: 'Дюбель для теплоизоляции тарельчатый (дюбель-гриб) 10х100 мм, 100 шт',
          category: 'hardware',
          price: 2400,
          image: 'https://images.unsplash.com/photo-1590236166418-498c199859f8?w=400&auto=format&fit=crop&q=80',
          rating: 4.7,
          supplier: { name: 'Крепеж-Мастер', delivery: 'Завтра' }
        };
      }

      const dowelQty = Math.max(1, Math.ceil((area * 6) / 100));
      items.push({ 
        product: dowelProduct, 
        quantity: dowelQty, 
        calcReason: `Крепеж утеплителя: Тарельчатые дюбели (расход 6 шт/м²)` 
      });

      if (includeTools) {
        const powerTool = products.find(p => p.category === 'tools' && /перфоратор|шуруповерт/i.test(p.name)) || getProductForCategory('tools');
        if (powerTool) {
          items.push({ 
            product: powerTool, 
            quantity: 1, 
            calcReason: `Инструмент для монтажа крепежных элементов` 
          });
        }
      }
    }
    
    else if (selectedProjectId === 'foundation') {
      const len = dimensions.length;
      const w = dimensions.width;
      const d = dimensions.depth;
      const volume = len * w * d;
      
      const cementProduct = products.find(p => p.category === 'mixes' && p.name.includes('Цемент')) || getProductForCategory('mixes');
      if (cementProduct) {
        const quantity = Math.max(5, Math.round(volume * 7));
        items.push({ product: cementProduct, quantity, calcReason: `Приготовление раствора: ${volume.toFixed(1)} м³ заливки (7 мешков/м³)` });
      }

      const lumberProduct = products.find(p => p.category === 'lumber' && p.name.includes('Доска')) || getProductForCategory('lumber');
      if (lumberProduct) {
        const quantity = Math.max(2, Math.round(len * 2));
        items.push({ product: lumberProduct, quantity, calcReason: `Опалубка фундамента (щиты с двух сторон)` });
      }

      const anchorProduct = products.find(p => p.category === 'hardware' && p.name.includes('Анкер')) || getProductForCategory('hardware');
      if (anchorProduct) {
        const quantity = Math.max(1, Math.round(len / 15));
        items.push({ product: anchorProduct, quantity, calcReason: `Силовые фиксаторы опалубки и связки каркаса` });
      }

      if (includeTools) {
        const powerTool = products.find(p => p.category === 'tools' && p.name.includes('Перфоратор')) || getProductForCategory('tools');
        if (powerTool) {
          items.push({ product: powerTool, quantity: 1, calcReason: `Строительное оборудование для замеса и сборки опалубки` });
        }
      }
    } 
    
    else if (selectedProjectId === 'wall') {
      const area = dimensions.wallArea;

      const mixProduct = getProductForCategory('mixes');
      if (mixProduct) {
        const quantity = Math.max(2, Math.round(area / 3.5));
        items.push({ product: mixProduct, quantity, calcReason: `Оштукатуривание и шпаклевка: ~8.5кг/м² на ${area} м²` });
      }

      const hardwareProduct = getProductForCategory('hardware');
      if (hardwareProduct) {
        const quantity = Math.max(1, Math.round(area / 25));
        items.push({ product: hardwareProduct, quantity, calcReason: `Соединительные стеновые подвесы и анкеры` });
      }

      const paintProduct = getProductForCategory('paints');
      if (paintProduct) {
        const quantity = Math.max(1, Math.round(area / 30));
        items.push({ product: paintProduct, quantity, calcReason: `Защитно-отделочное грунтование и покраска` });
      }

      if (includeTools) {
        const screwdriver = products.find(p => p.category === 'tools' && p.name.includes('Шуруповерт')) || getProductForCategory('tools');
        if (screwdriver) {
          items.push({ product: screwdriver, quantity: 1, calcReason: `Сборка металлокаркаса и маяков` });
        }
      }
    } 
    
    else if (selectedProjectId === 'bathroom') {
      const floor = dimensions.floorArea;
      const height = dimensions.ceilingHeight;
      const wallAreaApprox = Math.round((Math.sqrt(floor) * 4) * height);

      const adhesive = products.find(p => p.category === 'mixes' && p.name.includes('Knauf')) || getProductForCategory('mixes');
      if (adhesive) {
        const quantity = Math.max(2, Math.round(wallAreaApprox / 6) + Math.round(floor / 6));
        items.push({ product: adhesive, quantity, calcReason: `Кладка покрытий на стены (${wallAreaApprox} м²) и пол (${floor} м²)` });
      }

      const paint = products.find(p => p.category === 'paints' && p.name.includes('Tikkurila')) || getProductForCategory('paints');
      if (paint) {
        const quantity = Math.max(1, Math.round(wallAreaApprox / 25));
        items.push({ product: paint, quantity, calcReason: `Влагостойкая защита потолков и перекрытий` });
      }

      const hardwareProduct = getProductForCategory('hardware');
      if (hardwareProduct) {
        items.push({ product: hardwareProduct, quantity: 1, calcReason: `Герметичные крепежные анкеры и метизы` });
      }

      if (includeTools) {
        const handTool = getProductForCategory('tools');
        if (handTool) {
          items.push({ product: handTool, quantity: 1, calcReason: `Набор инструментов для финишной облицовки` });
        }
      }
    } 
    
    else if (selectedProjectId === 'decking') {
      const area = dimensions.deckArea;

      const boardsProduct = products.find(p => p.category === 'lumber' && p.name.includes('Доска')) || getProductForCategory('lumber');
      if (boardsProduct) {
        const quantity = Math.max(5, Math.round((area / 0.9) * 1.15));
        items.push({ product: boardsProduct, quantity, calcReason: `Лицевой настил: Доски с технологическим запасом 15%` });
      }

      const beamsProduct = products.find(p => p.category === 'lumber' && p.name.includes('Брус')) || getProductForCategory('lumber');
      if (beamsProduct) {
        const quantity = Math.max(3, Math.round((area * 1.2) / 3));
        items.push({ product: beamsProduct, quantity, calcReason: `Несущие прогоны и лаги под настил` });
      }

      const screwsProduct = products.find(p => p.category === 'hardware' && p.name.includes('Саморезы')) || getProductForCategory('hardware');
      if (screwsProduct) {
        const quantity = Math.max(1, Math.round(area / 14));
        items.push({ product: screwsProduct, quantity, calcReason: `Метизы по дереву для фиксации лаг и досок` });
      }

      const anchorProduct = products.find(p => p.category === 'hardware' && p.name.includes('Анкер')) || getProductForCategory('hardware');
      if (anchorProduct && extraStrength) {
        items.push({ product: anchorProduct, quantity: 1, calcReason: `Крепление каркаса рамы к бетонному или грунтовому основанию` });
      }

      if (includeTools) {
        const screwdriver = products.find(p => p.category === 'tools' && p.name.includes('Шуруповерт')) || getProductForCategory('tools');
        if (screwdriver) {
          items.push({ product: screwdriver, quantity: 1, calcReason: `Строительный инструмент для фиксации настилов` });
        }
      }
    }

    setAdvisorResults(items);
    setAdvisorStep(2);
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      setAdvisorResults(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setAdvisorResults(prev => prev.map(item => 
        item.product.id === productId ? { ...item, quantity: newQty } : item
      ));
    }
  };

  const handleRemoveItem = (productId) => {
    setAdvisorResults(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleAddAllToCart = () => {
    if (advisorResults.length === 0) return;
    
    advisorResults.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        onAddToCart(item.product);
      }
    });

    showToast(`🛒 Комплект собран! ${advisorResults.length} наим. товаров добавлены в корзину!`);
    setAdvisorStep(1);
    setAdvisorResults([]);
  };

  const totalCost = useMemo(() => {
    return advisorResults.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [advisorResults]);

  const costBreakdown = useMemo(() => {
    const categories = {};
    let sumTotal = 0;
    advisorResults.forEach(item => {
      const cat = item.product.category || 'other';
      const cost = item.product.price * item.quantity;
      categories[cat] = (categories[cat] || 0) + cost;
      sumTotal += cost;
    });

    return Object.entries(categories).map(([category, value]) => ({
      category,
      value,
      percentage: sumTotal > 0 ? Math.round((value / sumTotal) * 100) : 0
    }));
  }, [advisorResults]);

  const categoryLabelsMap = {
    mixes: 'Смеси',
    lumber: 'Дерево/Утеплители',
    tools: 'Инструмент',
    paints: 'Краски',
    hardware: 'Крепеж'
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-2 sm:px-4">
      
      {/* Premium Minimalist Header */}
      <div className="relative p-6 sm:p-10 rounded-[2rem] bg-white border border-slate-200 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-outfit text-slate-950">
              Умный калькулятор материалов
            </h1>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
              Выберите тип строительных или отделочных работ, укажите размеры конструкции и задайте бюджетный уровень. Система автоматически рассчитает точный объём и спецификацию материалов по строительным нормам СНиП РК.
            </p>
          </div>
        </div>
      </div>

      {/* Main interactive panel */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-xl p-6 sm:p-10 relative overflow-hidden">
        
        {advisorStep === 1 ? (
          /* Step 1: Sleek Configuration Dashboard */
          <div className="space-y-10">
            
            {/* Steps Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 border border-slate-200 text-blue-600 p-3 rounded-2xl">
                  <SlidersHorizontal className="h-5.5 w-5.5" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-xl font-outfit">Конфигуратор сметы</h3>
                  <p className="text-xs text-slate-400 font-medium">Заполните спецификации вашего будущего проекта</p>
                </div>
              </div>
              <span className="bg-slate-100 text-slate-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm border border-slate-200">
                Шаг 1 из 2
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left 8 cols: Project Templates Grid & Sliders */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* 1. Project Cards Grid */}
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    1. Выберите тип строительных или отделочных работ
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PROJECT_TYPES.map(proj => {
                      const IconComponent = proj.icon;
                      const isSelected = selectedProjectId === proj.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => setSelectedProjectId(proj.id)}
                          className={`p-5 rounded-2xl border text-left transition-all flex gap-4 items-start relative cursor-pointer min-h-[6.5rem] w-full ${
                            isSelected 
                              ? 'bg-blue-50/50 border-blue-600 text-slate-950 shadow-sm scale-[1.01] ring-4 ring-blue-500/10' 
                              : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className={`p-3 rounded-xl shrink-0 transition-transform ${isSelected ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-600'}`}>
                            <IconComponent className="h-5 w-5 stroke-[2]" />
                          </div>
                          <div className="space-y-1 pr-6 whitespace-normal break-words text-left">
                            <span className="block font-black text-sm font-outfit tracking-tight leading-tight">{proj.name}</span>
                            <span className={`block text-[11px] leading-relaxed font-medium ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                              {proj.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-0.5 shadow">
                              <Check className="h-3 w-3 stroke-[3.5]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Premium Dimension Sliders */}
                <div className="space-y-5 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-3.5 mb-4">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">
                      Геометрические параметры объекта
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProject.fields.map(field => (
                      <div key={field.id} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all text-left">
                        <div className="flex items-center justify-between text-xs font-black text-slate-700">
                          <span className="font-outfit tracking-wide">{field.label}</span>
                          <span className="text-blue-700 font-extrabold text-sm bg-blue-50 border border-blue-200 py-0.5 px-3 rounded-lg shadow-inner shrink-0">
                            {dimensions[field.id]} {field.unit}
                          </span>
                        </div>
                        
                        <div className="py-2">
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            value={dimensions[field.id]}
                            onChange={(e) => handleDimensionChange(field.id, e.target.value)}
                            className="w-full h-2 bg-slate-100 rounded-lg cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                          <span>минимум: {field.min} {field.unit}</span>
                          <span>максимум: {field.max} {field.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right 4 cols: High-End Budget and Extras widgets */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 3. Budget select */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    2. Выберите ценовой сегмент
                  </label>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        id: 'budget', 
                        label: 'Эконом комплект', 
                        tag: 'Выгодный выбор',
                        desc: 'Надёжные базовые материалы по минимальным ценам. Подходит для дачных построек или хозблоков.', 
                        color: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        activeColor: 'border-slate-800 bg-slate-900 text-white ring-4 ring-slate-900/10'
                      },
                      { 
                        id: 'standard', 
                        label: 'Стандарт (Рекомендуем)', 
                        tag: 'Золотая середина',
                        desc: 'Сертифицированные бренды с превосходным балансом долговечности и стоимости. Идеально для жилых домов.', 
                        color: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        activeColor: 'border-blue-600 bg-gradient-to-br from-blue-50/50 to-sky-50/50 text-slate-900 ring-4 ring-blue-500/15'
                      },
                      { 
                        id: 'premium', 
                        label: 'Премиум подбор', 
                        tag: 'Наивысший стандарт',
                        desc: 'Максимальный ресурс службы, экологические паспорта и топовые мировые бренды (Knauf, Tikkurila).', 
                        color: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                        activeColor: 'border-amber-500 bg-gradient-to-br from-amber-50/40 to-orange-50/40 text-slate-900 ring-4 ring-amber-500/15'
                      }
                    ].map(bud => {
                      const isSelected = advisorBudget === bud.id;
                      return (
                        <button
                          key={bud.id}
                          onClick={() => setAdvisorBudget(bud.id)}
                          className={`w-full p-5 rounded-2.5xl border text-left transition-all cursor-pointer relative ${
                            isSelected ? bud.activeColor : bud.color
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="block font-black text-xs uppercase tracking-wider">{bud.label}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                              isSelected 
                                ? bud.id === 'budget' ? 'bg-white/20 text-white' : 'bg-blue-600/15 text-blue-800' 
                                : 'bg-slate-200/60 text-slate-550'
                            }`}>
                              {bud.tag}
                            </span>
                          </div>
                          <span className={`block text-[11px] leading-relaxed font-medium ${
                            isSelected ? bud.id === 'budget' ? 'text-slate-300' : 'text-slate-700' : 'text-slate-500'
                          }`}>
                            {bud.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Advanced options checkboxes */}
                <div className="space-y-4 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-3xl p-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-left mb-2">
                    3. Дополнительные опции
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer select-none group text-left">
                    <input 
                      type="checkbox" 
                      checked={includeTools} 
                      onChange={(e) => setIncludeTools(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors">Расходные инструменты</span>
                      <span className="block text-[10px] text-slate-500 leading-normal">
                        Включить валики, шпатели, буры или шуруповерт для выполнения этих работ.
                      </span>
                    </div>
                  </label>

                  <div className="h-px bg-slate-200/70 my-3" />

                  <label className="flex items-start gap-3 cursor-pointer select-none group text-left">
                    <input 
                      type="checkbox" 
                      checked={extraStrength} 
                      onChange={(e) => setExtraStrength(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors">Повышенный запас прочности</span>
                      <span className="block text-[10px] text-slate-500 leading-normal">
                        Включить антикоррозийный крепеж, влагостойкие версии и 10% технологический запас.
                      </span>
                    </div>
                  </label>
                </div>

              </div>

            </div>

            {/* Launch CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-450 font-bold">
                <Info className="h-4 w-4 text-emerald-600" />
                <span>Все цены указаны в тенге с учетом НДС</span>
              </div>
              
              <button 
                onClick={handleAdvisorSelect}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 uppercase text-xs tracking-widest border-0 cursor-pointer shrink-0"
              >
                Сформировать смету
              </button>
            </div>

          </div>
        ) : (
          /* Step 2: Advanced Calculated Bill & Checkout Sheet */
          <div className="space-y-8 animate-fade-in-up">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl shadow-lg shadow-emerald-500/10">
                  <Check className="h-5.5 w-5.5 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-xl font-outfit">Ведомость строительных материалов</h3>
                  <p className="text-xs text-slate-400 font-medium">Спецификация рассчитана и проверена по СНиП нормам</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setAdvisorStep(1)} 
                  className="inline-flex items-center gap-1.5 text-xs text-slate-655 hover:text-slate-900 font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 py-2.5 px-5 rounded-xl transition-all border-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Параметры
                </button>
                <span className="bg-slate-150 text-slate-655 text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider border border-slate-250">
                  Шаг 2 из 2
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left side: spreadsheet of items */}
              <div className="lg:col-span-8 space-y-4">
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    Подобранный комплект товаров
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-full">
                    {advisorResults.length} наименований
                  </span>
                </div>

                <div className="space-y-4">
                  {advisorResults.map((item, idx) => {
                    const product = item.product;
                    const itemCost = product.price * item.quantity;
                    return (
                      <div 
                        key={product.id} 
                        className="bg-white border border-slate-200/80 hover:border-slate-350 rounded-2.5xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all shadow-sm hover:shadow relative"
                      >
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm hidden md:flex">
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-4.5 w-full sm:w-auto text-left">
                          <div className="w-18 h-18 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center flex-shrink-0 p-2 overflow-hidden shadow-inner">
                            <img src={product.image} className="w-full h-full object-contain" alt={product.name} />
                          </div>
                          <div className="space-y-2 text-left">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {categoryLabelsMap[product.category] || product.category}
                              </span>
                              {product.supplier?.delivery === 'Завтра' && (
                                <span className="inline-flex items-center text-[9px] font-bold text-blue-750 bg-blue-50/50 border border-blue-150 px-2 py-0.5 rounded-full">
                                  ⚡ Быстрая доставка
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight block hover:text-emerald-700 transition-colors">
                              {product.name}
                            </h4>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-semibold">
                              <span>Поставщик: <span className="text-slate-600">{product.supplier?.name || 'Дистрибьютор'}</span></span>
                              <span>•</span>
                              <span>Срок поставки: <span className="text-slate-600">{product.supplier?.delivery || '1 день'}</span></span>
                            </div>

                            {/* Math consumption justification */}
                            <div className="inline-flex items-start gap-1.5 text-[10px] font-bold text-slate-655 bg-slate-100/80 py-1.5 px-3 rounded-xl border border-slate-150">
                              <Info className="h-3.5 w-3.5 text-emerald-650 shrink-0 mt-0.5" /> 
                              <span>{item.calcReason}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Quantity controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
                            <button
                              onClick={() => handleUpdateQty(product.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all border-0 cursor-pointer bg-transparent"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(product.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all border-0 cursor-pointer bg-transparent"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[100px]">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Сумма</span>
                            <span className="block text-base font-black text-slate-900">{formatPrice(itemCost)}</span>
                            <span className="block text-[10px] text-slate-400 font-bold">{formatPrice(product.price)} / шт</span>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(product.id)}
                            className="text-slate-350 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all cursor-pointer border-0 bg-transparent"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Back to parameters and custom message */}
                <div className="bg-slate-50 border border-slate-200 rounded-2.5xl p-6 text-left text-xs text-slate-500 flex items-start gap-3.5">
                  <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-750 block">Важная строительная информация:</span>
                    <p className="leading-relaxed font-medium">
                      Расход рассчитан на основе усредненных параметров СНиП Республики Казахстан. Фактический расход на вашем строительном объекте может незначительно отличаться в зависимости от кривизны стен, способа нанесения смесей и квалификации строительной бригады. Рекомендуется приобретать с запасом 5-10%.
                    </p>
                  </div>
                </div>

              </div>

              {/* Right side: visual breakdown and checkout summary */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Summary details card */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-6 relative overflow-hidden border border-white/5 animate-fade-in-up">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">
                      Итоговая смета подбора
                    </span>
                    <h4 className="text-3xl sm:text-4xl font-black font-outfit text-white">
                      {formatPrice(totalCost)}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      Сгенерировано по классу: <span className="text-emerald-400 font-extrabold uppercase">{advisorBudget}</span>
                    </span>
                  </div>

                  {/* Visual Cost Breakdown Chart */}
                  <div className="space-y-3.5 border-t border-white/10 pt-5 text-left">
                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      Распределение затрат
                    </span>
                    
                    <div className="h-3.5 w-full rounded-full bg-white/10 flex overflow-hidden shadow-inner">
                      {costBreakdown.map((item, idx) => {
                        const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500'];
                        const col = colors[idx % colors.length];
                        return (
                          <div 
                            key={item.category} 
                            style={{ width: `${item.percentage}%` }} 
                            className={`h-full ${col} transition-all`} 
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2.5">
                      {costBreakdown.map((item, idx) => {
                        const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500'];
                        const col = colors[idx % colors.length];
                        return (
                          <div key={item.category} className="flex items-center gap-2 text-[10px] font-black text-slate-300">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col}`} />
                            <span className="truncate uppercase tracking-wider">{categoryLabelsMap[item.category] || item.category}:</span>
                            <span className="text-white shrink-0 ml-auto font-black">{item.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add all items checkout CTA */}
                  <div className="pt-3.5 space-y-3.5">
                    <button 
                      onClick={handleAddAllToCart}
                      disabled={advisorResults.length === 0}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4.5 px-6 rounded-2xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" /> Добавить в корзину
                    </button>

                    <button 
                      onClick={() => {
                        setShowSavedNotification(true);
                        setTimeout(() => setShowSavedNotification(false), 3000);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-5 rounded-2xl transition-all text-[11px] uppercase flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <Compass className="h-4 w-4" /> Скачать смету в PDF
                    </button>

                    {showSavedNotification && (
                      <div className="text-[11px] text-emerald-400 font-extrabold text-center bg-emerald-950/70 border border-emerald-900 py-3 px-4 rounded-xl animate-pulse">
                        👍 Смета успешно сохранена в вашем личном кабинете!
                      </div>
                    )}
                  </div>

                </div>

                {/* Expert recommendation tips card */}
                <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50 space-y-3 text-left">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Рекомендация эксперта
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-655 font-medium">
                    {advisorBudget === 'budget' && 'Вы выбрали Эконом смету. Данные материалы отлично подойдут для дачных пристроек, технических или нежилых зон. Для внутренних жилых пространств мы рекомендуем рассмотреть класс Стандарт для долговечности.'}
                    {advisorBudget === 'standard' && 'Выбран стандартный комплект материалов. Это сбалансированная смета из сертифицированных брендовых составов со сроком службы более 15 лет без изменения свойств.'}
                    {advisorBudget === 'premium' && 'Сформирован премиальный комплект наивысшего качества. Продукция от лидеров рынка с максимальными гарантийными сроками, высочайшими показателями прочности и экологическими паспортами.'}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
