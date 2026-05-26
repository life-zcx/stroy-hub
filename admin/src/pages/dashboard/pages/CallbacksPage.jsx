import React from 'react';
import {
  Clock as ClockIcon,
  MessageSquare as MessageSquareIcon,
  PhoneCall as PhoneCallIcon,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy
} from 'lucide-react';

export default function CallbacksPage({
  callbacks,
  onStatusChange,
  onCommentUpdate,
  getCallbackStatusClass,
  getCallbackStatusText,
}) {
  const pendingCount = callbacks.filter((callback) => callback.status === 'pending').length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple alert or toast could be added here
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase tracking-tight">Обратные звонки</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Очередь запросов на консультацию</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-xl">
             <div className="bg-emerald-500/20 p-1 rounded-lg">
                <PhoneCallIcon className="h-4 w-4 text-emerald-400" />
             </div>
             <div className="flex flex-col pr-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Ожидают</span>
               <span className="text-sm font-black leading-none">{pendingCount} заявки</span>
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {callbacks.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center shadow-inner">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <PhoneCallIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Очередь звонков пуста</p>
          </div>
        ) : (
          callbacks.map((callback) => (
            <div 
              key={callback.id} 
              className={`bg-white rounded-[2rem] p-5 border transition-all duration-300 group hover:shadow-xl hover:-translate-y-0.5 ${
                callback.status === 'pending' ? 'border-emerald-100 ring-4 ring-emerald-500/5' : 'border-slate-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-center gap-6">
                
                {/* Status Indicator Icon */}
                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                  callback.status === 'pending' ? 'bg-emerald-100 text-emerald-600' : 
                  callback.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-500'
                }`}>
                  {callback.status === 'pending' ? <AlertCircle className="h-7 w-7" /> : 
                   callback.status === 'completed' ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
                </div>

                {/* Patient / Name Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
                      {callback.userName}
                    </h3>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-widest ${getCallbackStatusClass(callback.status)}`}>
                      {getCallbackStatusText(callback.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 group/phone cursor-pointer" onClick={() => copyToClipboard(callback.userPhone)}>
                      <span className="text-lg font-black text-emerald-600 font-outfit tracking-tighter transition-colors group-hover/phone:text-emerald-500">
                        {callback.userPhone}
                      </span>
                      <Copy className="h-3 w-3 text-slate-300 opacity-0 group-hover/phone:opacity-100 transition-all" />
                    </div>
                    <div className="h-3 w-px bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                       <ClockIcon className="h-3.5 w-3.5" />
                       {new Date(callback.createdAt).toLocaleDateString('ru-RU')} · {new Date(callback.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Manager Notes */}
                <div className="w-full lg:w-1/3 bg-slate-50 rounded-2xl p-3 border border-slate-100 focus-within:bg-white focus-within:border-emerald-200 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareIcon className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Заметки
                    </span>
                  </div>
                  <textarea
                    placeholder="Добавить результат звонка..."
                    className="w-full bg-transparent border-0 focus:ring-0 text-[11px] font-bold text-slate-700 resize-none min-h-[40px] p-0 placeholder:italic placeholder:text-slate-300"
                    defaultValue={callback.comment}
                    onBlur={(event) => onCommentUpdate(callback.id, callback.status, event.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-1.5 shrink-0 px-2">
                  <button
                    onClick={() => onStatusChange(callback.id, 'pending')}
                    title="В ожидание"
                    className={`p-3 rounded-xl transition-all border ${
                      callback.status === 'pending'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20 scale-110'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                  >
                    <ClockIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(callback.id, 'completed')}
                    title="Дозвонился"
                    className={`p-3 rounded-xl transition-all border ${
                      callback.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/20 scale-110'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onStatusChange(callback.id, 'rejected')}
                    title="Отказ / Недозвон"
                    className={`p-3 rounded-xl transition-all border ${
                      callback.status === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-500/20 scale-110'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
