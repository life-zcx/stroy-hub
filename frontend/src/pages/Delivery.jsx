import React from 'react';
import { Truck, CreditCard, ShieldCheck, MapPin, Receipt, Compass } from 'lucide-react';

export default function Delivery() {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4">
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-outfit">Доставка и оплата</h1>
        <p className="text-slate-500 text-sm">Условия доставки заказов по Алматы, Алматинской области и другим регионам Казахстана</p>
      </div>

      {/* Grid: Delivery Info vs Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Delivery Block */}
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Условия доставки</h3>
          </div>

          <div className="space-y-5 text-sm">
            <div className="space-y-1">
              <span className="block font-bold text-slate-900">1. Зона доставки «Алматы»</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Доставка осуществляется в течение 24 часов с момента согласования заказа. Стоимость доставки по городу — от 3 000 ₸ в зависимости от общего тоннажа и габаритов груза.
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="block font-bold text-slate-900">2. Доставка по области</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Поставки в пригородные зоны и населенные пункты Алматинской области осуществляются по тарифной сетке логистических партнеров или собственным транспортом. Расчет стоимости производится автоматически при оформлении заказа.
              </p>
            </div>

            <div className="space-y-1">
              <span className="block font-bold text-slate-900">3. Самовывоз со складов дистрибьюторов</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Вы можете самостоятельно забрать товар со складов компаний-дистрибьюторов. Точные адреса складов и время выдачи будут указаны в личном кабинете после оплаты.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Block */}
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="bg-slate-100 rounded-xl p-2.5 text-slate-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-lg font-outfit">Способы оплаты</h3>
          </div>

          <div className="space-y-5 text-sm">
            <div className="space-y-2">
              <span className="block font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-slate-400" />
                Для физических лиц (B2C)
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Оплата банковскими картами Visa / Mastercard на сайте или безналичным расчетом через Kaspi QR при получении. Возможна рассрочка Kaspi Red.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-slate-400" />
                Для юридических лиц (B2B)
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Оплата по безналичному расчету (выставление счета на ТОО или ИП). Предоставляем полный комплект бухгалтерских закрывающих документов (ЭСФ, накладные, акты сверки).
              </p>
            </div>

            <div className="space-y-2">
              <span className="block font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Безопасность сделки
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Все платежи защищены. Денежные средства резервируются на платформе Tormag и переводятся поставщику только после подтверждения успешного приема товара клиентом.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
