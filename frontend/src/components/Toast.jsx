import React from 'react';
import { Check } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="bg-emerald-50/95 backdrop-blur-sm text-emerald-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-200/80 max-w-sm">
        <div className="bg-emerald-600 text-white p-1 rounded-full flex items-center justify-center shrink-0 shadow-sm">
          <Check className="h-3.5 w-3.5 stroke-[3.5]" />
        </div>
        <span className="text-xs font-bold leading-normal">{toast}</span>
      </div>
    </div>
  );
}
