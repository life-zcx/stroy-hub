import React, { useState } from 'react';
import { ShieldCheck, Phone, ChevronDown } from 'lucide-react';
import logoImg from '../tormag.png';
import Link from './Link';
import { getPageHref } from '../utils/navigationHelper';

export default function Footer({
  customer,
  onOpenAuth,
  onNavigate,
  setSelectedCategory,
  setLegalTab,
}) {
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (section) => {
    setOpenAccordion(prev => prev === section ? null : section);
  };

  const openLegal = (tab) => {
    setLegalTab(tab);
    onNavigate('legal');
  };

  return (
    <footer className="bg-slate-900 text-slate-300 mt-12 pt-6 lg:pt-12 pb-6 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Desktop Layout & Mobile Accordion Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
          
          {/* Column 1: Brand Info (Desktop only) */}
          <div className="space-y-3 hidden lg:block">
            <div className="flex items-center">
              <Link href={getPageHref('home')} onClick={() => onNavigate('home')}>
                <img src={logoImg} alt="TORMAG.KZ - Всё для стройки и ремонта" width="98" height="44" className="h-11 w-auto object-contain brightness-0 invert" />
              </Link>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs font-medium">
              TORMAG.KZ — крупнейший строительный маркетплейс Казахстана. Всё для качественного строительства, ремонта и благоустройства вашего дома напрямую от дистрибьюторов.
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <span className="text-slate-200 text-xs font-bold">Проверенные поставщики & Гарантия</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="border-b border-slate-800/80 lg:border-none pb-3 lg:pb-0">
            <button
              type="button"
              onClick={() => toggleAccordion('nav')}
              className="w-full flex justify-between items-center text-left font-bold text-white uppercase tracking-wider text-xs font-outfit py-2 lg:py-0 lg:mb-6"
            >
              <span>Навигация</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 lg:hidden transition-transform duration-200 ${openAccordion === 'nav' ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            <ul className={`space-y-3 text-sm mt-3 lg:mt-0 transition-all ${openAccordion === 'nav' ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link href={getPageHref('home')} onClick={() => onNavigate('home')} className="hover:text-emerald-500 transition-colors">
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href={getPageHref('catalog')}
                  onClick={() => { setSelectedCategory('all'); onNavigate('catalog'); }}
                  className="hover:text-emerald-500 transition-colors"
                >
                  Каталог товаров
                </Link>
              </li>
              <li>
                <Link href={getPageHref('services')} onClick={() => onNavigate('services')} className="hover:text-emerald-500 transition-colors">
                  Наши услуги
                </Link>
              </li>
              <li>
                <Link href={getPageHref('promotions')} onClick={() => onNavigate('promotions')} className="hover:text-emerald-500 transition-colors">
                  Акции
                </Link>
              </li>
              <li>
                <Link href={getPageHref('favorites')} onClick={() => onNavigate('favorites')} className="hover:text-emerald-500 transition-colors">
                  Избранное
                </Link>
              </li>
              <li>
                <Link
                  href={customer ? getPageHref('orders') : '#'}
                  onClick={(e) => {
                    if (!customer) {
                      e.preventDefault();
                      onOpenAuth();
                    } else {
                      onNavigate('orders');
                    }
                  }}
                  className="hover:text-emerald-500 transition-colors"
                >
                  Мои заказы
                </Link>
              </li>
              <li>
                <Link href={getPageHref('about')} onClick={() => onNavigate('about')} className="hover:text-emerald-500 transition-colors">
                  О компании
                </Link>
              </li>
              <li>
                <Link href={getPageHref('delivery')} onClick={() => onNavigate('delivery')} className="hover:text-emerald-500 transition-colors">
                  Доставка и оплата
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contacts */}
          <div className="border-b border-slate-800/80 lg:border-none pb-3 lg:pb-0">
            <button
              type="button"
              onClick={() => toggleAccordion('contacts')}
              className="w-full flex justify-between items-center text-left font-bold text-white uppercase tracking-wider text-xs font-outfit py-2 lg:py-0 lg:mb-6"
            >
              <span>Контакты</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 lg:hidden transition-transform duration-200 ${openAccordion === 'contacts' ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            <ul className={`space-y-4 text-sm mt-3 lg:mt-0 ${openAccordion === 'contacts' ? 'block' : 'hidden lg:block'}`}>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:77077111653" className="text-white font-bold hover:text-emerald-500 transition-colors block">8 (707) 711-16-53</a>
                </div>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">E-mail</span>
                <a href="mailto:zakaz@tormag.kz" className="text-white hover:text-emerald-500 transition-colors font-semibold">zakaz@tormag.kz</a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Режим работы</span>
                <span className="text-white font-semibold">Пн. – Пт.: с 8:00 до 20:00</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Social media & Messengers */}
          <div>
            <h4 className="font-bold text-white mb-3 lg:mb-6 uppercase tracking-wider text-xs font-outfit">Мессенджеры</h4>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <a
                href="https://t.me/lifezcx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 bg-slate-800/50 hover:bg-sky-500/10 border border-slate-800 hover:border-sky-500/20 rounded-xl transition-all group/soc"
              >
                <svg className="w-5 h-5 text-sky-500 transition-transform group-hover/soc:scale-110 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                <span className="text-xs font-bold text-slate-300 group-hover/soc:text-white transition-colors">Telegram</span>
              </a>
              <a
                href="https://wa.me/77077111653"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 rounded-xl transition-all group/soc"
              >
                <svg className="w-5 h-5 text-emerald-500 transition-transform group-hover/soc:scale-110 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.403.007 12.04c0 2.12.552 4.191 1.598 6.056L0 24l6.105-1.602a11.832 11.832 0 005.937 1.61h.005c6.635 0 12.04-5.405 12.044-12.041a11.82 11.82 0 00-3.517-8.423" />
                </svg>
                <span className="text-xs font-bold text-slate-300 group-hover/soc:text-white transition-colors">WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-400 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="TORMAG.KZ" className="h-6 w-auto object-contain brightness-0 invert lg:hidden shrink-0" />
            <p>© 2026 TORMAG.KZ. Все права защищены.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[11px]">
            <Link href={getPageHref('legal')} onClick={() => openLegal('user-agreement')} className="hover:text-white transition-colors">
              Пользовательское соглашение
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <Link href={getPageHref('legal')} onClick={() => openLegal('offer')} className="hover:text-white transition-colors">
              Публичная оферта
            </Link>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <Link href={getPageHref('legal')} onClick={() => openLegal('privacy')} className="hover:text-white transition-colors">
              Конфиденциальность
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
