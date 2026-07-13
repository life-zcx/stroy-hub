import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Tag, Truck, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  CreditCard, DollarSign, Wallet, Percent, MapPin, Calendar, Clock, RotateCcw
} from 'lucide-react';

export default function InfoModals({ isOpen, type, onClose, showToast }) {
  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-[24px] shadow-2xl w-full max-h-[85vh] relative animate-fade-in-up z-10 border border-slate-100 flex flex-col cursor-default overflow-hidden ${
          type === 'priceAlert' || type === 'share' ? 'max-w-sm' : 'max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors z-20 bg-white/90 backdrop-blur-xs shadow-xs"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Content Switch (Only this container scrolls) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {type === 'lowPrice' && <LowPriceContent />}
          {type === 'delivery' && <DeliveryContent />}
          {type === 'returns' && <ReturnsContent />}
          {type === 'priceAlert' && (
            <PriceAlertContent onClose={onClose} showToast={showToast} />
          )}
          {type === 'share' && (
            <ShareContent onClose={onClose} showToast={showToast} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────── */
/* 1. ГАРАНТИЯ НИЗКОЙ ЦЕНЫ CONTENT */
/* ──────────────────────────────────────────────────────── */
function LowPriceContent() {
  return (
    <div className="p-8 sm:p-10 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-orange-500 font-outfit uppercase tracking-tight">Гарантия низкой цены</h2>
        <p className="text-xs text-slate-400 font-bold mt-1.5">В сети магазинов строительных материалов «Тормаг»</p>
      </div>

      <div className="space-y-4 text-sm text-slate-650 leading-relaxed font-semibold">
        <p>
          Воспользуйтесь, если вы уже приобрели товар или только планируете его покупку в сети «Тормаг».
        </p>
        <p className="font-bold text-slate-800 text-center text-base py-1 bg-orange-50/30 rounded-xl border border-orange-100/30">
          Гарантия 14 дней. Компенсируем до 110% разницы в цене.
        </p>
        <p className="font-semibold">
          Отпустим выбранный товар по цене конкурента в любом магазине «Тормаг».
        </p>
        <p>
          Национальная сеть «Тормаг» гарантирует своим клиентам самые выгодные цены на строительные и отделочные материалы, инструменты и сантехнику.
        </p>
        <p>
          Если в течение 14 дней после совершения покупки в розничном или интернет-магазине сети «Тормаг» вы нашли в розничном или онлайн-магазине из списка конкурентов аналогичный товар по более низкой цене, мы компенсируем вам разницу. Если же вы только планируете совершить покупку и нашли желаемый товар дешевле в другом магазине из перечисленных в правилах акции, мы предоставим вам товар по цене конкурента в любом розничном или интернет-магазине «Тормаг».
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-orange-500 text-center font-outfit uppercase tracking-tight">Как это работает?</h3>
        <div className="space-y-3.5 text-sm text-slate-650 leading-relaxed font-semibold">
          <div className="flex gap-3">
            <span className="bg-orange-50 text-orange-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">1</span>
            <p>Вы приобрели товар или только планируете покупку в любом магазине сети «Тормаг» или интернет-магазине www.tormag.kz.</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-orange-50 text-orange-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">2</span>
            <p>В течение 14 дней вы нашли аналогичный товар в другом магазине строительных материалов из перечисленных в правилах акции по более низкой цене.</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-orange-50 text-orange-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black">3</span>
            <p>Вы можете получить 110% compensation разницы в цене в виде дополнительных бонусов на вашу карту Тормаг или приобрести выбранный товар по цене конкурента.</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50/40 border border-amber-100/60 rounded-2xl p-5 space-y-2">
        <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Внимание</span>
        </h4>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-500 font-semibold leading-relaxed">
          <li>Акционные товары не действуют в акции.</li>
          <li>Гарантия низкой цены не действует на продукцию брендов Bosch и Makita по категориям «Электроинструменты» при продаже ниже розничной цены дилера.</li>
          <li>Товар конкурента должен быть в наличии и доступен для доставки день в день.</li>
          <li>Товары, полностью или частично оплаченные в рассрочку/кредит, принимают участие в акции.</li>
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* 2. УСЛОВИЯ ДОСТАВКИ И САМОВЫВОЗА CONTENT */
/* ──────────────────────────────────────────────────────── */
function DeliveryContent() {
  return (
    <div className="p-8 sm:p-10 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-orange-500 font-outfit uppercase tracking-tight">Условия доставки и самовывоза</h2>
        <p className="text-xs text-slate-400 font-bold mt-1.5">Сеть строительных гипермаркетов «Тормаг»</p>
      </div>

      <div className="space-y-4 text-sm text-slate-650 leading-relaxed font-semibold">
        <h3 className="text-lg font-black text-orange-500 text-center font-outfit uppercase tracking-tight">Доставка день в день</h3>
        <p className="text-center text-slate-450 font-semibold italic">Вы выбираете, мы доставляем</p>
        <p className="font-bold text-slate-800 text-center">
          Доставим онлайн-заказ бесплатно в черте города от 10 000 ₸
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-semibold text-slate-600">
            Без выходных собственной службой доставки
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-semibold text-slate-600">
            Быстрый самовывоз из пунктов выдачи заказов
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-500 font-semibold leading-relaxed border-t border-slate-100 pt-4">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Информация о доставке и самовывозе:</h4>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>Оплата производится только в тенге.</li>
          <li>Срок резерва товара: 2 (два) календарных дня с даты подтверждения заказа.</li>
          <li>Товары, которые продаются только онлайн и под заказ, недоступны для самовывоза.</li>
          <li>Товары, которые продаются только по предоплате, можно оплатить на сайте картой или в кредит.</li>
          <li>В подтверждении оплаты мы выдаем фискальный или контрольный чек.</li>
          <li>Оплата принимается только от владельца карты. Необходимо иметь документ, удостоверяющий личность.</li>
          <li>При получении товара вскройте в присутствии курьера упаковку и осмотрите товар на предмет повреждений.</li>
        </ul>
      </div>

      {/* Payment methods */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <h3 className="text-lg font-black text-orange-500 text-center font-outfit uppercase tracking-tight">Способы оплаты</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
            <h4 className="text-xs font-black text-slate-800">Visa / Mastercard / Union Pay</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Принимаем платежные карты онлайн на сайте и в приложении, курьеру при получении или в кассах.</p>
          </div>
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
            <h4 className="text-xs font-black text-slate-800">Бонусы</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Получайте бонусы за покупки. Оплачивайте бонусами до 30% стоимости следующей покупки.</p>
          </div>
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
            <h4 className="text-xs font-black text-slate-800">В кредит или рассрочку</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Выбирайте удобные условия кредита или рассрочки от банков-партнеров онлайн или в розничных точках.</p>
          </div>
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
            <h4 className="text-xs font-black text-slate-800">Безналичный расчет</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Оплачивайте покупки со счета юридического лица. Выпишем счет в течение 3 дней.</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <h3 className="text-lg font-black text-orange-500 text-center font-outfit uppercase tracking-tight">Часто задаваемые вопросы</h3>
        <div className="space-y-2">
          <AccordionItem 
            title="Сколько стоит доставка по городу?"
            content="Доставка бесплатная при заказе на сумму от 10 000 ₸. Если сумма заказа меньше 10 000 ₸, стоимость доставки составляет 1 500 ₸ в черте города."
          />
          <AccordionItem 
            title="Сколько стоит доставка за чертой города?"
            content="Доставка за пределы города рассчитывается по тарифу 150 ₸ за каждый километр от границы города."
          />
          <AccordionItem 
            title="Как купить товар?"
            content="Выберите товары, добавьте их в корзину, укажите способ получения (доставка или самовывоз), выберите способ оплаты и подтвердите заказ."
          />
          <AccordionItem 
            title="Безопасна ли оплата картой на сайте?"
            content="Да, все платежи защищены протоколом 3D-Secure банков-эмитентов."
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* 3. УСЛОВИЯ ВОЗВРАТА И ОБМЕНА CONTENT */
/* ──────────────────────────────────────────────────────── */
function ReturnsContent() {
  return (
    <div className="p-8 sm:p-10 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-orange-550 font-outfit uppercase tracking-tight">Условия возврата и обмена</h2>
      </div>

      <div className="space-y-4 text-sm text-slate-650 leading-relaxed font-semibold">
        <p>
          Мы гарантируем обмен или возврат товара в течение 14 календарных дней с момента покупки. Товар не должен быть в употреблении, сохранён его товарный вид, потребительские свойства, пломбы, ярлыки, а также имеется документ, подтверждающий факт приобретения.
        </p>
        <p>
          Для возврата товара обратитесь в ближайший магазин розничной сети «Тормаг» в Казахстане.
        </p>
        <p>
          Условия регулируются Законом Казахстана «О защите прав потребителей».
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-orange-550 text-center font-outfit uppercase tracking-tight">Как вернуть или обменять товар</h3>
        
        <div className="space-y-4 text-sm text-slate-650 leading-relaxed font-semibold">
          <p>
            Обратитесь в ближайший магазин розничной сети «Тормаг» в Казахстане с кассовым чеком или документом, подтверждающим факт покупки товара.
          </p>
          <p>
            <strong>Если возвращаете товар, оплаченный банковской картой</strong> — принесите карту, с которой была проведена оплата или номер банковского счёта, а также удостоверение личности.
          </p>
          <p>
            <strong>Если возвращаете или обмениваете товар, купленный в кредит или рассрочку</strong> — принесите удостоверение личности.
          </p>
          <p>
            <strong>Если возвращаете или обмениваете товар ненадлежащего качества</strong> — передайте товар в магазин для дальнейшей его передачи на диагностику в авторизованный сервисный центр (далее-АСЦ), в случае подтверждения дефекта на основании акта (заключения) АСЦ Вам будет произведен возврат или обмен товара. В целях более оперативного получения Акта АСЦ Вы можете самостоятельно передать товар на проверку (экспертизу) в АСЦ бренда производителя и получите там акт (заключение), подтверждающее наличие дефекта товара при отсутствии нарушений правил эксплуатаций и условий гарантии. Затем принесите акт для возврата или обмена в магазин.
          </p>
          <p>
            Услуга проверки (экспертизы) может быть платной и оплачивается продавцом. При самостоятельной передаче товара Покупателем в АСЦ на диагностику Продавец возмещает Покупателю стоимость диагностики в случае подтверждения дефекта АСЦ на основании документа подтверждающего оплату.
          </p>
          <p>
            В случае если АСЦ не подтвердит дефект производителя в товаре, с согласия потребителя, и за его счёт недостатки, обнаруженные в товаре, могут быть устранены АСЦ.
          </p>
        </div>
      </div>

      <div className="bg-red-50/30 border border-red-100/50 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>Какие товары не подлежат возврату</span>
        </h3>
        <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-500 font-semibold leading-relaxed">
          <li><strong>Колерованная краска</strong> (поскольку изготавливается под индивидуальный заказ цвета).</li>
          <li><strong>Отрезные материалы</strong> (кабели, провода, линолеум, шланги, пиломатериалы, нарезанные под нужный размер заказчика).</li>
          <li><strong>Вскрытые сухие смеси</strong> (цемент, гипсовая штукатурка, клей для плитки с нарушенной герметичностью мешка).</li>
          <li>Товары с неполной комплектацией или следами монтажа/употребления.</li>
        </ul>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* ACCORDION UTILITY COMPONENT */
/* ──────────────────────────────────────────────────────── */
function AccordionItem({ title, content }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex justify-between items-center text-xs font-bold text-slate-700 hover:bg-slate-50 text-left transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="p-3.5 pt-0 text-xs text-slate-550 font-semibold leading-relaxed bg-white border-t border-slate-50">
          {content}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* PRICE ALERT MODAL CONTENT */
/* ──────────────────────────────────────────────────────── */
function PriceAlertContent({ onClose, showToast }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showToast) {
      showToast(`🔔 Уведомление о снижении цены настроено на адрес: ${email}`);
    }
    onClose();
  };

  return (
    <div className="p-6 sm:p-8 space-y-4">
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">Сообщить о снижении цены</h2>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center text-sm shadow-xs"
        >
          Получить уведомление
        </button>
      </form>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* SHARE MODAL CONTENT */
/* ──────────────────────────────────────────────────────── */
function ShareContent({ onClose, showToast }) {
  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      if (showToast) {
        showToast('📋 Ссылка скопирована в буфер обмена!');
      }
    }
    onClose();
  };

  const handleShareClick = (platform, shareLink) => {
    window.open(shareLink, '_blank', 'noopener,noreferrer');
    if (showToast) {
      showToast(`↗️ Открываем ссылку для публикации в ${platform}`);
    }
    onClose();
  };

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">Поделиться</h2>
      
      <div className="flex flex-col gap-3 pt-2">
        {/* VKontakte */}
        <button
          onClick={() => handleShareClick('ВКонтакте', `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}`)}
          className="w-full h-14 bg-[#7aa1d2] hover:bg-[#6c94c5] text-white font-extrabold rounded-full flex items-center transition-all cursor-pointer group pr-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#4872a3] flex items-center justify-center shrink-0 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M15.684 1.933H8.316C4.041 1.933 1.933 4.041 1.933 8.316v7.368c0 4.275 2.108 6.383 6.383 6.383h7.368c4.275 0 6.383-2.108 6.383-6.383V8.316c0-4.275-2.108-6.383-6.383-6.383zm2.597 13.913c0 2.221-1.077 3.298-3.298 3.298h-1.012c-.521 0-.964-.17-.964-.672v-.93c0-.521-.247-.624-.598-.624-.312 0-.612.181-.795.534-.143.273-.247.608-.247 1.02v.672h-2.146c-1.923 0-3.847-1.742-3.847-3.847 0-.586.117-1.12.352-1.589l1.459-2.923c.181-.362.481-.598.883-.598.429 0 .768.326.768.756v1.171c0 .546.247.649.598.649.312 0 .598-.181.795-.534.13-.248.247-.56.247-.949v-1.024c0-.546.169-.976.677-.976h.976c.547 0 .977.43.977.976v.93c0 .546.247.649.598.649.312 0 .598-.181.795-.534.13-.248.247-.56.247-.949v-1.072h1.011c.547 0 .977.43.977.976V12.7c0 .546.247.649.598.649.312 0 .598-.181.795-.534.13-.248.247-.56.247-.949v-1.072h.93c.547 0 .977.43.977.976v.95c0 2.221-1.077 3.298-3.298 3.298z" />
            </svg>
          </div>
          <span className="flex-1 text-center text-sm font-semibold tracking-wide">Вконтакте</span>
        </button>

        {/* Facebook */}
        <button
          onClick={() => handleShareClick('Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
          className="w-full h-14 bg-[#7a93d6] hover:bg-[#6881c5] text-white font-extrabold rounded-full flex items-center transition-all cursor-pointer group pr-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#4965af] flex items-center justify-center shrink-0 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
            </svg>
          </div>
          <span className="flex-1 text-center text-sm font-semibold tracking-wide">Facebook</span>
        </button>

        {/* Whatsapp */}
        <button
          onClick={() => handleShareClick('WhatsApp', `https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`)}
          className="w-full h-14 bg-[#82b788] hover:bg-[#72a678] text-white font-extrabold rounded-full flex items-center transition-all cursor-pointer group pr-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#4e8d56] flex items-center justify-center shrink-0 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.908.533 3.69 1.464 5.214L2 22l4.92-.1.085.045c1.472.784 3.123 1.203 4.83 1.203h.005c5.52 0 10-4.48 10-10.003C21.84 6.48 17.524 2 12.004 2zm0 16.5c-1.63 0-3.155-.445-4.47-1.22l-.32-.19-2.96.61.625-2.88-.205-.33c-.85-1.355-1.3-2.92-1.3-4.545 0-4.685 3.81-8.5 8.5-8.5s8.5 3.815 8.5 8.5-3.81 8.5-8.5 8.5z" />
            </svg>
          </div>
          <span className="flex-1 text-center text-sm font-semibold tracking-wide">Whatsapp</span>
        </button>

        {/* Telegram */}
        <button
          onClick={() => handleShareClick('Telegram', `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`)}
          className="w-full h-14 bg-[#79c3eb] hover:bg-[#68b2da] text-white font-extrabold rounded-full flex items-center transition-all cursor-pointer group pr-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#31a3df] flex items-center justify-center shrink-0 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <svg className="h-5.5 w-5.5 fill-current text-white relative left-[-1px]" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.88 1.19-5.32 3.52-.5.35-.96.52-1.37.51-.45-.01-1.32-.26-1.97-.47-.8-.26-1.43-.4-1.37-.85.03-.23.35-.47.96-.71 3.76-1.64 6.27-2.72 7.53-3.25 3.58-1.51 4.32-1.77 4.81-1.78.11 0 .35.03.5.15.13.1.17.24.18.34.02.1-.01.37-.02.47z" />
            </svg>
          </div>
          <span className="flex-1 text-center text-sm font-semibold tracking-wide">Telegram</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="w-full h-14 bg-[#f2f2f2] hover:bg-[#e7e7e7] text-slate-800 font-extrabold rounded-full flex items-center transition-all cursor-pointer group pr-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5 text-slate-600 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <span className="flex-1 text-center text-sm font-semibold tracking-wide">Скопировать ссылку</span>
        </button>
      </div>
    </div>
  );
}
