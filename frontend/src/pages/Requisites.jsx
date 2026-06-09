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
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Реквизиты</h1>
          <p className="text-slate-500 text-sm">Официальные юридические и банковские данные ИП «TORMAG.KZ»</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 w-fit cursor-pointer font-outfit"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Скопировано!" : "Скопировать реквизиты"}
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
