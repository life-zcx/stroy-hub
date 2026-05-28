import React from 'react';
import { CreditCard, Wallet, Receipt, Percent, ShieldCheck } from 'lucide-react';

export default function PaymentTerms() {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12 font-sans text-slate-800 text-left">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Условия оплаты</h1>
        <p className="text-slate-500 text-sm">Все способы и детали осуществления расчетов на платформе Tormag</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-emerald-50 rounded-xl p-2 text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg font-outfit">Оплата банковской картой</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Мы принимаем платежи с любых банковских карт Казахстана и мира (Visa, Mastercard, UnionPay). Безопасная онлайн-оплата процессится через зашифрованный шлюз.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-blue-50 rounded-xl p-2 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg font-outfit">Kaspi QR / Kaspi Red</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Совершайте покупки мгновенно с помощью Kaspi QR при оформлении заказа или при доставке курьером. Доступна рассрочка Kaspi Red без процентов и переплат.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-amber-50 rounded-xl p-2 text-amber-600">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg font-outfit">Безналичный расчет для B2B</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Для юридических лиц предусмотрена оплата по выставленному счету на оплату. После согласования заказа система сформирует счет-фактуру. Полный пакет закрывающих документов предоставляется через ИС ЭСФ.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-purple-50 rounded-xl p-2 text-purple-600">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg font-outfit">Предоплата и рассрочка</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Крупнооптовые и сборные грузы поставляются по частичной предоплате (от 50%), остаток оплачивается по факту готовности к разгрузке на объекте заказчика.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Безопасность сделок</h4>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Tormag защищает ваши средства. Деньги депонируются на платформе до момента подтверждения успешного получения и проверки товара на месте. Если товар имеет брак, вы сможете быстро оформить возврат.
          </p>
        </div>
      </div>
    </div>
  );
}
