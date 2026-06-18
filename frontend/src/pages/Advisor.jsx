import React, { useState, useMemo } from 'react';
import { 
  Sparkles, ShoppingCart, SlidersHorizontal, ArrowLeft, Check, 
  Compass, Calculator, Hammer, Settings, Paintbrush, Layers, 
  Info, Plus, Minus, Trash2, CheckCircle2, DollarSign, ShieldAlert,
  ClipboardList
} from 'lucide-react';
import { calculateMaterials } from '../utils/advisorCalculator.js';
import { getProducts } from '../services/api';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

const QuantityInput = ({ value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (e) => {
    const valStr = e.target.value;
    if (valStr.length > 5) return;
    setLocalVal(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      setLocalVal(value);
      onChange(value);
    } else {
      const clamped = Math.min(99999, parsed);
      setLocalVal(clamped);
      onChange(clamped);
    }
  };

  const inputLength = localVal ? localVal.toString().length : 1;

  return (
    <>
      <style>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
      <input
        type="number"
        min="1"
        max="99999"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="no-spinner text-center text-xs font-bold text-slate-900 bg-transparent focus:outline-none font-mono"
        style={{ width: `${Math.max(2, inputLength + 1.2)}ch`, maxWidth: '5.5ch' }}
      />
    </>
  );
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

export default function Advisor({ products: propProducts = [], onAddToCart, showToast, onNavigate }) {
  const [advisorStep, setAdvisorStep] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState('renovation');
  const [advisorBudget, setAdvisorBudget] = useState('standard'); // budget, standard, premium
  const [includeTools, setIncludeTools] = useState(true);
  const [extraStrength, setExtraStrength] = useState(false);

  const [products, setProducts] = useState(propProducts);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchAdvisorProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts({ limit: 200 });
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.error('[ADVISOR PRODUCTS LOAD ERROR]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisorProducts();
  }, []);
  
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

    const items = calculateMaterials({
      selectedProjectId,
      dimensions,
      includeTools,
      extraStrength,
      advisorBudget,
      products
    });

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
      onAddToCart(item.product, item.quantity);
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
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-2 sm:px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Advisor Math Blueprint Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Compass / Math angles */}
          <circle cx="60" cy="40" r="25" strokeDasharray="3,3" />
          <line x1="60" y1="5" x2="60" y2="75" strokeDasharray="1,2" />
          <line x1="25" y1="40" x2="95" y2="40" strokeDasharray="1,2" />
          
          {/* Math curves */}
          <path d="M30 60 Q 60 20 90 60" strokeWidth="1.2" />

          {/* Calculator symbol */}
          <rect x="85" y="15" width="20" height="28" rx="2" fill="currentColor" fillOpacity="0.05" />
          <rect x="89" y="19" width="12" height="6" fill="currentColor" fillOpacity="0.2" />
          <circle cx="91" cy="31" r="1" fill="currentColor" />
          <circle cx="95" cy="31" r="1" fill="currentColor" />
          <circle cx="99" cy="31" r="1" fill="currentColor" />
          <circle cx="91" cy="37" r="1" fill="currentColor" />
          <circle cx="95" cy="37" r="1" fill="currentColor" />
          <circle cx="99" cy="37" r="1" fill="currentColor" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Калькулятор материалов
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Выберите тип строительных работ, укажите размеры и задайте бюджет. Система автоматически рассчитает точную спецификацию материалов по нормам СНиП РК.
          </p>
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
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/15">
                  <ClipboardList className="h-5.5 w-5.5" />
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
                        className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-3xl p-6 flex flex-col lg:flex-row items-start justify-between gap-6 transition-all shadow-sm hover:shadow-md relative"
                      >
                        <span className="absolute -left-4 top-8 w-8 h-8 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-xs font-black text-slate-650 shadow-sm hidden lg:flex">
                          {idx + 1}
                        </span>
 
                        <div className="flex items-start gap-5 w-full lg:w-auto text-left">
                          {/* Larger and clearer image preview with link to product card */}
                          <Link 
                            href={getPageHref('product', product.id)}
                            onClick={() => onNavigate?.('product', product.id)}
                            className="w-24 h-24 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center shrink-0 p-3 overflow-hidden shadow-inner cursor-pointer hover:border-slate-350 transition-colors block"
                          >
                            <img src={product.image} className="w-full h-full object-contain rounded-lg" alt={product.name} />
                          </Link>
 
                          <div className="space-y-2 text-left flex-grow">
                            <h4 className="text-base font-black text-slate-900 leading-snug hover:text-emerald-700 transition-colors">
                              <Link 
                                href={getPageHref('product', product.id)}
                                onClick={() => onNavigate?.('product', product.id)}
                              >
                                {product.name}
                              </Link>
                            </h4>
                            
                            {/* Consolidated clean metadata line */}
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 items-center font-bold">
                              <span className="bg-slate-100 text-slate-655 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200">
                                {categoryLabelsMap[product.category] || product.category}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>Поставщик: <span className="text-slate-700 font-extrabold">{product.supplier?.name || 'Дистрибьютор'}</span></span>
                              <span className="text-slate-300">•</span>
                              <span>Срок: <span className="text-slate-750 font-extrabold">{product.supplier?.delivery || '1 день'}</span></span>
                            </div>
 
                            {/* Beautiful explanation badge */}
                            <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl inline-flex items-start gap-2 max-w-lg mt-1 font-medium shadow-sm">
                              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> 
                              <span>{item.calcReason}</span>
                            </div>
                          </div>
                        </div>
 
                        {/* Interactive Quantity and price controls aligned to top */}
                        <div className="flex flex-row items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0 lg:self-start lg:mt-1">
                          
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 rounded-xl p-1 shadow-inner">
                            <button
                              onClick={() => handleUpdateQty(product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all border-0 cursor-pointer bg-transparent"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <QuantityInput
                              value={item.quantity}
                              onChange={(val) => handleUpdateQty(product.id, val)}
                            />
                            <button
                              onClick={() => handleUpdateQty(product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all border-0 cursor-pointer bg-transparent"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
 
                          <div className="text-right min-w-[110px]">
                            <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Сумма</span>
                            <span className="block text-base font-black text-slate-900 leading-tight">{formatPrice(itemCost)}</span>
                            <span className="block text-[10px] text-slate-450 font-bold">{formatPrice(product.price)} / шт</span>
                          </div>
 
                          <button
                            onClick={() => handleRemoveItem(product.id)}
                            className="text-slate-350 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-2xl transition-all cursor-pointer border-0 bg-transparent shrink-0"
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
                
                {/* Summary details card (Light theme matching Tormag style) */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden animate-fade-in-up">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-2 text-left">
                    <span className="text-[10px] text-slate-450 uppercase font-black tracking-widest">
                      Итоговая смета подбора
                    </span>
                    <h4 className="text-3xl sm:text-4xl font-black font-outfit text-emerald-600 transition-all duration-300">
                      {formatPrice(totalCost)}
                    </h4>
                    <span className="text-[10px] text-slate-500 block font-bold">
                      Класс спецификации: <span className="text-blue-600 font-extrabold uppercase">{advisorBudget === 'budget' ? 'Эконом' : advisorBudget === 'standard' ? 'Стандарт' : 'Премиум'}</span>
                    </span>

                    {/* Interactive Budget Class Switcher */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mt-3">
                      {['budget', 'standard', 'premium'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setAdvisorBudget(b);
                            const newItems = calculateMaterials({
                              selectedProjectId,
                              dimensions,
                              includeTools,
                              extraStrength,
                              advisorBudget: b,
                              products
                            });
                            setAdvisorResults(newItems);
                          }}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all border-0 cursor-pointer ${
                            advisorBudget === b
                              ? b === 'budget'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : b === 'standard'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-transparent text-slate-550 hover:text-slate-900 hover:bg-slate-200/50'
                          }`}
                        >
                          {b === 'budget' ? 'Эконом' : b === 'standard' ? 'Стандарт' : 'Премиум'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Cost Breakdown Chart - Donut style (Light theme colors) */}
                  <div className="space-y-4 border-t border-slate-100 pt-5 text-left">
                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      Распределение затрат
                    </span>
                    
                    {costBreakdown.length > 0 ? (
                      <div className="flex flex-col items-center justify-center py-2 relative">
                        <svg viewBox="0 0 42 42" className="w-28 h-28 transform -rotate-90">
                          <circle
                            cx="21"
                            cy="21"
                            r="15.91549430918954"
                            fill="transparent"
                            stroke="#f1f5f9"
                            strokeWidth="3.8"
                          />
                          {(() => {
                            let accumulatedPercent = 0;
                            const colors = ['#10b981', '#14b8a6', '#0ea5e9', '#f59e0b', '#a855f7'];
                            return costBreakdown.map((item, idx) => {
                              const percentage = item.percentage;
                              if (percentage <= 0) return null;
                              const strokeDasharray = `${percentage} ${100 - percentage}`;
                              const strokeDashoffset = 100 - accumulatedPercent;
                              accumulatedPercent += percentage;
                              const col = colors[idx % colors.length];
                              return (
                                <circle
                                  key={item.category}
                                  cx="21"
                                  cy="21"
                                  r="15.91549430918954"
                                  fill="transparent"
                                  stroke={col}
                                  strokeWidth="3.8"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-500 ease-out"
                                />
                              );
                            });
                          })()}
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider leading-none">Комплект</span>
                          <span className="text-xs font-black text-slate-800 mt-1 leading-none">{advisorResults.length} наим.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 text-center py-4">Нет данных для отображения</div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2.5">
                      {costBreakdown.map((item, idx) => {
                        const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500'];
                        const col = colors[idx % colors.length];
                        return (
                          <div key={item.category} className="flex items-center gap-2 text-[10px] font-black text-slate-600">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col}`} />
                            <span className="truncate uppercase tracking-wider">{categoryLabelsMap[item.category] || item.category}:</span>
                            <span className="text-slate-800 shrink-0 ml-auto font-black">{item.percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add all items checkout CTA */}
                  <div className="pt-3.5 space-y-3">
                    <button 
                      onClick={handleAddAllToCart}
                      disabled={advisorResults.length === 0}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-4.5 w-4.5 stroke-[2.5]" /> Добавить в корзину
                    </button>

                    <button 
                      onClick={() => {
                        // Natively generate and print/save PDF
                        const dateStr = new Date().toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const projectTypeName = activeProject?.name || 'Расчет';
                        const budgetName = advisorBudget === 'budget' ? 'Эконом' : advisorBudget === 'standard' ? 'Стандарт' : 'Премиум';

                        const itemsRows = advisorResults.map((item, idx) => `
                          <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px; text-align: center; font-size: 12px;">${idx + 1}</td>
                            <td style="padding: 10px; font-size: 12px; font-weight: 600; text-align: left;">${item.product.name}</td>
                            <td style="padding: 10px; font-size: 11px; color: #475569; text-align: center;">${categoryLabelsMap[item.product.category] || item.product.category}</td>
                            <td style="padding: 10px; font-size: 12px; font-weight: 600; text-align: center;">${item.quantity} шт</td>
                            <td style="padding: 10px; font-size: 12px; font-family: monospace; text-align: right;">${formatPrice(item.product.price)}</td>
                            <td style="padding: 10px; font-size: 12px; font-weight: 700; font-family: monospace; text-align: right;">${formatPrice(item.product.price * item.quantity)}</td>
                          </tr>
                        `).join('');

                        const htmlContent = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Смета TORMAG - ${projectTypeName}</title>
                            <meta charset="utf-8">
                            <style>
                              body {
                                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                                color: #1e293b;
                                margin: 40px;
                                line-height: 1.5;
                              }
                              .header {
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                border-bottom: 3px solid #10b981;
                                padding-bottom: 20px;
                                margin-bottom: 30px;
                              }
                              .logo {
                                font-size: 28px;
                                font-weight: 900;
                                color: #0f172a;
                                letter-spacing: -1px;
                              }
                              .logo span {
                                color: #10b981;
                              }
                              .doc-info {
                                text-align: right;
                                font-size: 12px;
                                color: #64748b;
                              }
                              .title {
                                font-size: 22px;
                                font-weight: 800;
                                margin-bottom: 20px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                              }
                              .specs-grid {
                                display: grid;
                                grid-template-cols: 1fr 1fr;
                                gap: 20px;
                                background-color: #f8fafc;
                                border: 1px solid #e2e8f0;
                                border-radius: 12px;
                                padding: 20px;
                                margin-bottom: 30px;
                                font-size: 13px;
                              }
                              .specs-col span {
                                display: block;
                                margin-bottom: 6px;
                              }
                              .specs-col strong {
                                color: #0f172a;
                              }
                              table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 30px;
                              }
                              th {
                                background-color: #f1f5f9;
                                color: #334155;
                                font-weight: 700;
                                font-size: 11px;
                                text-transform: uppercase;
                                padding: 12px 10px;
                                border-bottom: 2px solid #cbd5e1;
                              }
                              .totals-section {
                                display: flex;
                                justify-content: flex-end;
                                margin-bottom: 40px;
                              }
                              .totals-table {
                                width: 300px;
                                font-size: 14px;
                              }
                              .totals-table tr td {
                                padding: 8px 0;
                              }
                              .grand-total {
                                font-size: 20px;
                                font-weight: 900;
                                color: #10b981;
                                border-top: 2px solid #e2e8f0;
                                padding-top: 12px !important;
                              }
                              .footer-note {
                                font-size: 11px;
                                color: #64748b;
                                border-top: 1px solid #e2e8f0;
                                padding-top: 20px;
                                margin-top: 50px;
                                text-align: justify;
                              }
                              @media print {
                                body { margin: 20px; }
                                button { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div>
                                <div class="logo">TOR<span>MAG</span></div>
                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Строительная B2B-платформа</div>
                              </div>
                              <div class="doc-info">
                                <div><strong>Дата:</strong> ${dateStr}</div>
                                <div><strong>Сайт:</strong> tormag.kz</div>
                                <div><strong>Статус:</strong> Спецификация активна</div>
                              </div>
                            </div>

                            <div class="title">Смета подбора строительных материалов</div>

                            <div class="specs-grid">
                              <div class="specs-col">
                                <span><strong>Тип работ:</strong> ${projectTypeName}</span>
                                <span><strong>Класс материалов:</strong> ${budgetName}</span>
                              </div>
                              <div class="specs-col" style="text-align: right;">
                                ${activeProject?.fields?.map(field => `
                                  <span><strong>${field.label}:</strong> ${dimensions[field.id]} ${field.unit}</span>
                                `).join('')}
                              </div>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th style="width: 5%; text-align: center;">№</th>
                                  <th style="width: 45%; text-align: left;">Наименование товара</th>
                                  <th style="width: 15%; text-align: center;">Категория</th>
                                  <th style="width: 10%; text-align: center;">Кол-во</th>
                                  <th style="width: 12%; text-align: right;">Цена</th>
                                  <th style="width: 13%; text-align: right;">Сумма</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${itemsRows}
                              </tbody>
                            </table>

                            <div class="totals-section">
                              <table class="totals-table">
                                <tr>
                                  <td style="color: #64748b;">Итого наименований:</td>
                                  <td style="text-align: right; font-weight: 700;">${advisorResults.length}</td>
                                </tr>
                                <tr class="grand-total">
                                  <td>ИТОГО К ОПЛАТЕ:</td>
                                  <td style="text-align: right;">${formatPrice(totalCost)}</td>
                                </tr>
                              </table>
                            </div>

                            <div class="footer-note">
                              <strong>Важная информация:</strong> Расчет произведен на основе усредненных норм расхода материалов согласно СНиП Республики Казахстан. Фактический расход на объекте может отличаться в зависимости от геометрических погрешностей конструкций, метода нанесения смесей и квалификации исполнителей. Рекомендуется приобретать материалы с технологическим запасом 5-10%.
                            </div>

                            <script>
                              window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                              };
                            </script>
                          </body>
                          </html>
                        `;

                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(htmlContent);
                          printWindow.document.close();
                        } else {
                          showToast('⚠️ Пожалуйста, разрешите всплывающие окна в браузере для скачивания сметы.');
                        }
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold py-3.5 px-5 rounded-2xl transition-all text-[11px] uppercase flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                    >
                      <Compass className="h-4 w-4" /> Скачать смету в PDF
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
