import React from 'react';
import { Building2, Copy, Check } from 'lucide-react';

export default function Requisites() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `
Наименование компании: ИП «TORMAG.KZ»
Юридический адрес: Республика Казахстан, г. Алматы, Бостандыкский район, проспект Аль-Фараби, 77/7, офис 12
Банк получателя: АО «Kaspi Bank»
БИК: KASPKZ2A
КБе: 17
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Requisites Building Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Building Columns / Temple Style representing official/legal institution */}
          <line x1="20" y1="70" x2="100" y2="70" strokeWidth="1.5" />
          <line x1="25" y1="65" x2="95" y2="65" strokeWidth="1" />
          
          {/* Columns */}
          <rect x="30" y="30" width="8" height="35" rx="0.5" fill="currentColor" fillOpacity="0.05" />
          <rect x="46" y="30" width="8" height="35" rx="0.5" fill="currentColor" fillOpacity="0.05" />
          <rect x="62" y="30" width="8" height="35" rx="0.5" fill="currentColor" fillOpacity="0.05" />
          <rect x="78" y="30" width="8" height="35" rx="0.5" fill="currentColor" fillOpacity="0.05" />
          
          {/* Roof Triangle */}
          <path d="M22 30 L60 12 L98 30 Z" fill="currentColor" fillOpacity="0.1" />
          <line x1="20" y1="30" x2="100" y2="30" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Реквизиты
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Официальные юридические и банковские данные ИП «TORMAG.KZ»
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="relative z-10 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-md shrink-0 w-fit cursor-pointer font-outfit uppercase tracking-wider"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Скопировано!" : "Скопировать"}
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm overflow-hidden space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-lg font-outfit">ИП «TORMAG.KZ»</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs w-1/3">Полное наименование</td>
                <td className="py-4 pl-4 font-bold text-slate-900 leading-relaxed">Индивидуальный предприниматель «TORMAG.KZ»</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">Сокращенное название</td>
                <td className="py-4 pl-4 font-semibold text-slate-900 leading-relaxed">ИП «TORMAG.KZ» (Тормаг)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">БИН</td>
                <td className="py-4 pl-4 font-mono font-bold text-slate-900">---</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">Юридический адрес</td>
                <td className="py-4 pl-4 text-slate-600 leading-relaxed font-semibold">Республика Казахстан, г. Алматы, Бостандыкский район, проспект Аль-Фараби, 77/7, офис 12</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">Расчетный счет (IBAN)</td>
                <td className="py-4 pl-4 font-mono font-bold text-slate-900">---</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">Банк получателя</td>
                <td className="py-4 pl-4 font-semibold text-slate-900">АО «Kaspi Bank»</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">БИК</td>
                <td className="py-4 pl-4 font-mono font-semibold text-slate-900">KASPKZ2A</td>
              </tr>
              <tr>
                <td className="py-4 pr-4 font-bold text-slate-400 uppercase text-xs">КБе</td>
                <td className="py-4 pl-4 font-semibold text-slate-900">17</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
