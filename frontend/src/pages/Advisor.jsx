import React, { useState } from 'react';
import { Sparkles, ShoppingCart, SlidersHorizontal, ArrowLeft, Check, Compass } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(price);
};

export default function Advisor({ products, onAddToCart, showToast }) {
  const [advisorStep, setAdvisorStep] = useState(1);
  const [advisorProject, setAdvisorProject] = useState('renovation'); // renovation, foundation, wall
  const [advisorBudget, setAdvisorBudget] = useState('standard'); // budget, standard, premium
  const [advisorResults, setAdvisorResults] = useState(null);

  const handleAdvisorSelect = () => {
    let recommendations = [];
    
    if (advisorProject === 'renovation') {
      recommendations = products.filter(p => ['mixes', 'paints', 'tools'].includes(p.category));
    } else if (advisorProject === 'foundation') {
      recommendations = products.filter(p => ['mixes', 'lumber', 'hardware'].includes(p.category));
    } else if (advisorProject === 'wall') {
      recommendations = products.filter(p => ['paints', 'hardware', 'tools'].includes(p.category));
    }

    if (advisorBudget === 'budget') {
      recommendations = recommendations.sort((a, b) => a.price - b.price).slice(0, 4);
    } else if (advisorBudget === 'premium') {
      recommendations = recommendations.sort((a, b) => b.price - a.price).slice(0, 4);
    } else {
      recommendations = recommendations.slice(0, 4);
    }

    setAdvisorResults(recommendations);
    setAdvisorStep(2);
  };

  const handleAddAdvisorProductsToCart = () => {
    if (!advisorResults) return;
    advisorResults.forEach(product => {
      onAddToCart(product);
    });
    showToast('🛒 Все подобранные товары добавлены в корзину!');
    setAdvisorStep(1);
    setAdvisorResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left">
      
      {/* Header Info */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Интеллектуальный подбор материалов</h1>
        <p className="text-slate-500 text-sm">Укажите параметры вашего строительного или отделочного проекта, и наша умная система подберет идеальный пакет сертифицированных материалов.</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm p-6 sm:p-10 relative overflow-hidden">
        
        {advisorStep === 1 ? (
          /* Step 1: Form */
          <div className="space-y-8">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-emerald-600 text-slate-950 p-2 rounded-xl">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Параметры подбора</h3>
                <p className="text-[10px] text-slate-400">Пожалуйста, выберите подходящие критерии</p>
              </div>
            </div>

            <div className="space-y-6">
              
              {/* Project Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">1. Выберите тип строительного проекта</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'renovation', label: 'Косметический ремонт', desc: 'Отделка комнат, покраска стен, мелкий ремонт' },
                    { id: 'foundation', label: 'Подготовка фундамента', desc: 'Бетонирование, деревянная опалубка, крепеж' },
                    { id: 'wall', label: 'Возведение & Финиш', desc: 'Штукатурка стен, покраска, соединительные крепежи' }
                  ].map(proj => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setAdvisorProject(proj.id)}
                      className={`p-5 rounded-2xl border text-left transition-all ${
                        advisorProject === proj.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-slate-50 border-gray-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold text-sm mb-1">{proj.label}</span>
                      <span className={`block text-[10px] ${advisorProject === proj.id ? 'text-slate-400' : 'text-slate-500'}`}>{proj.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Class Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">2. Качество и бюджетный класс материалов</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'budget', label: 'Эконом', desc: 'Выгодные базовые товары' },
                    { id: 'standard', label: 'Стандарт', desc: 'Оптимальное соотношение' },
                    { id: 'premium', label: 'Премиум', desc: 'Лучшие мировые бренды' }
                  ].map(budget => (
                    <button
                      key={budget.id}
                      type="button"
                      onClick={() => setAdvisorBudget(budget.id)}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        advisorBudget === budget.id 
                          ? 'bg-emerald-600 border-emerald-600 text-slate-950 font-extrabold shadow-md' 
                          : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold text-sm mb-0.5">{budget.label}</span>
                      <span className={`block text-[9px] ${advisorBudget === budget.id ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{budget.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <button 
              onClick={handleAdvisorSelect}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase text-xs tracking-wider"
            >
              <Sparkles className="h-4.5 w-4.5 animate-pulse" /> Сформировать список товаров
            </button>

          </div>
        ) : (
          /* Step 2: Recommendations results */
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 text-white p-2 rounded-xl">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Рекомендованный комплект собран</h3>
                  <p className="text-[10px] text-slate-400">Система подобрала оптимальные материалы</p>
                </div>
              </div>
              <button 
                onClick={() => setAdvisorStep(1)} 
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-600 font-bold"
              >
                <ArrowLeft className="h-4 w-4" /> Изменить параметры подбора
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advisorResults && advisorResults.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-150 overflow-hidden">
                      <img src={p.image} className="w-4/5 h-4/5 object-contain" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Дистрибьютор: {p.supplier?.name}</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700">{formatPrice(p.price)}</span>
                </div>
              ))}
            </div>

            {/* Total and Bulk Buy */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Итоговая стоимость комплекта</span>
                <h4 className="text-2xl font-black text-emerald-400">
                  {formatPrice(advisorResults ? advisorResults.reduce((acc, p) => acc + p.price, 0) : 0)}
                </h4>
              </div>
              <button 
                onClick={handleAddAdvisorProductsToCart}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 px-8 rounded-xl transition-all text-xs uppercase shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <ShoppingCart className="h-4.5 w-4.5" /> Добавить весь комплект в корзину
              </button>
            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
