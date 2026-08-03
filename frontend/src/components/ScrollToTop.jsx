import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop({ cartItemsCount = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible) return null;

  // Sync bottom position with AiAssistantWidget (right side):
  // mobile with cart → 5.5rem, mobile without cart → 1.5rem
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const bottomOffset = isMobile && cartItemsCount > 0 ? '5.5rem' : '1.5rem';

  return (
    <button
      onClick={scrollToTop}
      aria-label="Наверх"
      title="Наверх"
      style={{ bottom: bottomOffset }}
      className="fixed left-4 sm:left-6 z-40 p-3 bg-slate-900/90 hover:bg-emerald-600 text-white backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/60 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group animate-fade-in"
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
