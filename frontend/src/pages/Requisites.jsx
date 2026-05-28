import React from 'react';
import { FileSpreadsheet, Building2, ClipboardList, Copy, Check } from 'lucide-react';

export default function Requisites() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `
Наименование компании: ТОО "Tormag" (Тормаг)
БИН: 260540019284
Юридический адрес: Республика Казахстан, г. Алматы, Бостандыкский район, проспект Аль-Фараби, 77/7, офис 12
Расчетный счет (KZT): KZ859261827495018273
Банк получателя: АО "Kaspi Bank"
БИК: KASPKZ2A
КБе: 17
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Реквизиты компании</h1>
          <p className="text-slate-500 text-sm">Официальные юридические и банковские данные ИП «TORMAG.KZ»</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 w-fit"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Скопировано!" : "Скопировать реквизиты"}
        </button>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <Building2 className="h-5 w-5 text-emerald-600" />
          <h3 className="font-extrabold text-slate-900 text-lg font-outfit">ИП «TORMAG.KZ»</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase w-1/3">Полное наименование</td>
                <td className="py-3 pl-4 font-bold text-slate-900">Индивидуальный предприниматель «TORMAG.KZ»</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">Сокращенное название</td>
                <td className="py-3 pl-4 font-semibold text-slate-900">ИП «TORMAG.KZ» (Тормаг)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">БИН</td>
                <td className="py-3 pl-4 font-mono font-bold text-slate-900">---</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">Юридический адрес</td>
                <td className="py-3 pl-4 text-slate-600">Республика Казахстан, г. Алматы, Бостандыкский район, проспект Аль-Фараби, 77/7, офис 12</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">Расчетный счет (IBAN)</td>
                <td className="py-3 pl-4 font-mono font-bold text-slate-900">---</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">Банк получателя</td>
                <td className="py-3 pl-4 font-semibold text-slate-900">АО «Kaspi Bank»</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">БИК</td>
                <td className="py-3 pl-4 font-mono font-semibold text-slate-900">KASPKZ2A</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-slate-400 uppercase">КБе</td>
                <td className="py-3 pl-4 font-semibold text-slate-900">17</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
