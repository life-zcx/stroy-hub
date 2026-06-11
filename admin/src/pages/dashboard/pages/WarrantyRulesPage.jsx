import React, { useState } from 'react';
import { RefreshCw, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export default function WarrantyRulesPage({
  rules = [],
  categories = [],
  products = [],
  onCreateRule,
  onDeleteRule,
  loading = false,
}) {
  const [scope, setScope] = useState('global');
  const [targetId, setTargetId] = useState('');
  const [days, setDays] = useState('14');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 0) {
      setError('Срок гарантии должен быть числом >= 0');
      return;
    }

    let finalTargetId = null;
    if (scope !== 'global') {
      finalTargetId = parseInt(targetId, 10);
      if (isNaN(finalTargetId)) {
        setError('Необходимо выбрать категорию или товар');
        return;
      }
    }

    try {
      await onCreateRule({
        scope,
        targetId: finalTargetId,
        days: parsedDays,
      });
      setSuccess('Правило успешно создано!');
      setTargetId('');
      setDays('14');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка создания правила');
    }
  };

  const getScopeLabel = (s) => {
    switch (s) {
      case 'global': return 'Глобально';
      case 'category': return 'Категория';
      case 'product': return 'Товар';
      default: return s;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-outfit">Правила гарантии и возвратов</h2>
          <p className="text-xs text-slate-500 mt-0.5">Управляйте гарантийными сроками для всего ассортимента, групп товаров или отдельных позиций</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Creation Form */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-950 text-base font-outfit">Добавить новое правило</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Область применения</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  setTargetId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold outline-none"
              >
                <option value="global">Глобально (на все товары)</option>
                <option value="category">Категория (группа товаров)</option>
                <option value="product">Товар (конкретная позиция)</option>
              </select>
            </div>

            {scope === 'category' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Выберите категорию</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold outline-none"
                >
                  <option value="">-- Выберите категорию --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'product' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Выберите товар</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-semibold outline-none mb-3"
                >
                  <option value="">-- Выберите из последних товаров --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Или введите ID товара вручную:</span>
                  <input
                    type="number"
                    placeholder="ID товара (например: 12)"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Срок гарантии (в днях)</label>
              <input
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-bold outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Создать правило</span>
            </button>
          </form>
        </div>

        {/* Existing Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-950 text-base font-outfit">Действующие правила</h3>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-4 px-6">Область</th>
                    <th className="py-4 px-6">Цель</th>
                    <th className="py-4 px-6">Срок возврата</th>
                    <th className="py-4 px-6 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 uppercase tracking-widest font-black">
                        Правила гарантии не заданы. Будет действовать стандартный срок 14 дней.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rule.scope === 'global' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            rule.scope === 'category' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-purple-50 text-purple-700 border border-purple-100'
                          }`}>
                            {getScopeLabel(rule.scope)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {rule.scope === 'global' ? (
                            <span className="italic text-slate-400">Все товары маркетплейса</span>
                          ) : (
                            <span className="font-bold text-slate-900">{rule.targetName || `ID: ${rule.targetId}`}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {rule.days} дней
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Удалить это правило гарантии?')) {
                                onDeleteRule(rule.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Удалить правило"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
