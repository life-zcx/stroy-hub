import React from 'react';
import { Hammer, ShieldCheck, Phone } from 'lucide-react';

export default function Footer({
  customer,
  onOpenAuth,
  fetchMyOrders,
  onNavigate,
  setSelectedCategory,
  setLegalTab,
}) {
  const openCategory = (category) => {
    setSelectedCategory(category);
    onNavigate('catalog');
  };

  const openLegal = (tab) => {
    setLegalTab(tab);
    onNavigate('legal');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 pt-16 pb-8 border-t-4 border-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-xl mr-2.5 shadow-md shadow-emerald-500/5">
                <Hammer className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight font-outfit">
                stroy-<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">hub.kz</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Покупателям</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => { if (!customer) onOpenAuth(); else fetchMyOrders(); }} className="hover:text-emerald-600 transition-colors">Отследить заказ</button></li>
              <li><button onClick={() => onNavigate('delivery')} className="hover:text-emerald-600 transition-colors">Доставка и оплата</button></li>
              <li><a href="#" className="hover:text-emerald-600 transition-colors">Возврат товара</a></li>
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Вход для дистрибьюторов</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Категории</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => openCategory('mixes')} className="hover:text-emerald-600 transition-colors">Сухие смеси</button></li>
              <li><button onClick={() => openCategory('lumber')} className="hover:text-emerald-600 transition-colors">Пиломатериалы</button></li>
              <li><button onClick={() => openCategory('tools')} className="hover:text-emerald-600 transition-colors">Инструменты</button></li>
              <li><button onClick={() => openCategory('paints')} className="hover:text-emerald-600 transition-colors">Краски</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs font-outfit">Служба поддержки</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <a href="tel:88005553535" className="text-white font-bold hover:text-emerald-600 transition-colors block">8 (800) 555-35-35</a>
                  <span className="text-slate-500 text-[10px]">Звонок по Казахстану бесплатный</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 ТОО «StroyHub Technologies». Все права защищены.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            <button onClick={() => openLegal('user-agreement')} className="hover:text-white transition-colors">Пользовательское соглашение</button>
            <button onClick={() => openLegal('offer')} className="hover:text-white transition-colors">Публичная оферта</button>
            <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors">Конфиденциальность и Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
