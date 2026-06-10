import React from 'react';
import { Truck, CreditCard, ShieldCheck, MapPin, Receipt, Compass } from 'lucide-react';

export default function Delivery() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-8 font-sans text-slate-800 text-left px-4 pt-6 pb-8">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* SVG Delivery Truck Background */}
        <svg 
          className="absolute right-4 bottom-0 h-[100%] w-auto text-emerald-500/10 pointer-events-none z-0 select-none hidden md:block" 
          viewBox="0 0 120 80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.8"
        >
          {/* Road line */}
          <line x1="0" y1="70" x2="120" y2="70" />
          
          {/* Truck Body */}
          <rect x="25" y="25" width="65" height="35" rx="3" fill="currentColor" fillOpacity="0.05" />
          <rect x="90" y="35" width="20" height="25" rx="2" fill="currentColor" fillOpacity="0.1" />
          
          {/* Cab windshield and details */}
          <path d="M100 37h7v10h-7z" fill="currentColor" fillOpacity="0.2" />
          <line x1="90" y1="35" x2="90" y2="60" />
          
          {/* Wheels */}
          <circle cx="40" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="40" cy="65" r="2" fill="none" />
          <circle cx="56" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="56" cy="65" r="2" fill="none" />
          <circle cx="95" cy="65" r="7" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
          <circle cx="95" cy="65" r="2" fill="none" />

          {/* Speed/motion lines */}
          <line x1="5" y1="30" x2="18" y2="30" strokeWidth="1.2" />
          <line x1="8" y1="40" x2="20" y2="40" strokeWidth="1.2" />
          <line x1="3" y1="50" x2="15" y2="50" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-outfit text-white">
            Доставка и оплата
          </h1>
          <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Условия доставки и оплаты заказов по Алматы, Алматинской области и другим регионам Казахстана
          </p>
        </div>
      </div>

      {/* Grid: Delivery Info vs Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
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
                Доставка осуществляется в течение 24 часов с момента согласования заказа. Стоимость доставки рассчитывается индивидуально в зависимости от адреса разгрузки, общего веса и габаритов груза.
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="block font-bold text-slate-900">2. Доставка по области</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Поставки в пригородные зоны и населенные пункты Алматинской области осуществляются собственным транспортом или силами логистических партнеров. Стоимость рассчитывается индивидуально менеджером при подтверждении заказа.
              </p>
            </div>
 
            <div className="space-y-1">
              <span className="block font-bold text-slate-900">3. Самовывоз со складов дистрибьюторов</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Вы можете самостоятельно забрать товар со складов компаний-дистрибьюторов. Точные адреса складов и время выдачи будут указаны в личном кабинете после подтверждения заказа.
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
                Оплата производится при получении товара курьеру (наличными или безналичным расчетом через Kaspi QR). Доступна рассрочка Kaspi Red.
              </p>
            </div>
 
            <div className="space-y-2">
              <span className="block font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-slate-400" />
                Для юридических лиц (B2B)
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Оплата по безналичному расчету (выставление счета на ТОО или ИП). После согласования заказа менеджер подготовит счет на оплату. Предоставляем полный пакет закрывающих документов (ЭСФ, накладные, акты сверки).
              </p>
            </div>
 
            <div className="space-y-2">
              <span className="block font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Проверка перед оплатой
              </span>
              <p className="text-slate-500 text-xs leading-relaxed">
                Все расчеты абсолютно прозрачны. Вы проверяете качество, целостность упаковки и комплектность строительных материалов на объекте перед приемкой и оплатой.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
