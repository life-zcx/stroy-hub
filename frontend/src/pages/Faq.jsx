import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "Как оформить заказ юридическому лицу?",
      a: "При оформлении заказа в корзине выберите тип плательщика 'Юридическое лицо', укажите реквизиты (БИН, ТОО/ИП) и почту. Система автоматически сформирует счет на оплату. После зачисления средств мы подготовим ЭСФ и все сопроводительные документы."
    },
    {
      q: "Можно ли забрать материалы самовывозом?",
      a: "Да, самовывоз доступен со складов наших партнеров. После оплаты заказа в личном кабинете появится точный адрес склада, номер накладной и контакты ответственного кладовщика."
    },
    {
      q: "Как рассчитывается стоимость доставки тяжелых грузов?",
      a: "Стоимость доставки рассчитывается автоматически исходя из общего веса груза и расстояния от ближайшего дистрибьюторского склада до вашей точки разгрузки. Для сыпучих и тяжелых материалов (бетон, кирпичи, смеси на паллетах) предоставляются манипуляторы."
    },
    {
      q: "Что такое безопасная сделка на Tormag?",
      a: "Мы резервируем ваши деньги на транзитном счете платформы. Партнер-поставщик получает оплату только после того, как вы примете товар на объекте и подпишете акт приемки в электронном виде или в накладной. Это гарантирует доставку именно того товара, который вы оплатили."
    },
    {
      q: "Как вернуть излишки неиспользованных материалов?",
      a: "Если у вас остались целые, нераспечатанные мешки сухих смесей или другие целые упаковки товара, вы можете оформить возврат в течение 14 дней. Важно сохранить заводской товарный вид продукции и предоставить чек."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Вопрос — Ответ</h1>
        <p className="text-slate-500 text-sm">Часто задаваемые вопросы о покупках, логистике и документообороте на Tormag</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm transition-all">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-950 hover:bg-slate-50 transition-colors gap-4"
              >
                <span className="flex items-center gap-3 font-outfit text-sm">
                  <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  {faq.q}
                </span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-500 text-xs leading-relaxed border-t border-slate-50 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
