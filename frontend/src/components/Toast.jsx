import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800">
        <div className="bg-green-500/20 p-1.5 rounded-full">
          <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
        </div>
        <span className="text-sm font-semibold">{toast}</span>
      </div>
    </div>
  );
}
