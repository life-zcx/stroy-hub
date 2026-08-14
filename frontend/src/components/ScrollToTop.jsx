import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop({ cartItemsCount = 0 }) {
  const [isVisible, setIsVisible] = useState(false);

  // ⚠️ ALL hooks must be declared before any early return (Rules of Hooks)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  );

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lift button comfortably above MobileBottomNav (and MobileCartBar if present)
  const bottomOffset = isMobile
    ? cartItemsCount > 0
      ? '8.5rem'
      : '5.75rem'
    : '2rem';

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible) return null;

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
