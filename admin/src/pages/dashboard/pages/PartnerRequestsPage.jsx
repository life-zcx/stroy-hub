import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  XCircle,
} from 'lucide-react';

export default function PartnerRequestsPage({
  requests,
  onStatusChange,
  onCommentUpdate,
  getStatusClass,
  getStatusText,
}) {
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase tracking-tight">Партнерские заявки</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Входящие предложения о сотрудничестве</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-xl">
          <div className="bg-emerald-500/20 p-1 rounded-lg">
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Новые</span>
            <span className="text-sm font-black leading-none">{pendingCount} заявки</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center shadow-inner">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Партнерских заявок пока нет</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className={`bg-white rounded-[2rem] p-5 border transition-all duration-300 hover:shadow-xl ${request.status === 'pending' ? 'border-emerald-100 ring-4 ring-emerald-500/5' : 'border-slate-100'}`}>
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-grow space-y-4 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{request.companyName}</h3>
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-widest ${getStatusClass(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-600 mt-1">Контакт: {request.contactName}</p>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {new Date(request.createdAt).toLocaleDateString('ru-RU')} · {new Date(request.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <button onClick={() => copyToClipboard(request.contactPhone)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors">
                      <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{request.contactPhone}</span>
                      <Copy className="h-3.5 w-3.5 text-slate-300 ml-auto shrink-0" />
                    </button>
                    <button onClick={() => copyToClipboard(request.email)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors">
                      <Mail className="h-4 w-4 text-sky-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{request.email}</span>
                      <Copy className="h-3.5 w-3.5 text-slate-300 ml-auto shrink-0" />
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Комментарий партнера</div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {request.comment || 'Комментарий не указан.'}
                    </p>
                  </div>
                </div>

                <div className="w-full xl:w-[320px] space-y-3">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 focus-within:bg-white focus-within:border-emerald-200 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3 w-3 text-slate-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Заметки менеджера</span>
                    </div>
                    <textarea
                      placeholder="Добавить итог контакта, условия, следующий шаг..."
                      className="w-full bg-transparent border-0 focus:ring-0 text-[11px] font-bold text-slate-700 resize-none min-h-[90px] p-0 placeholder:italic placeholder:text-slate-300"
                      defaultValue={request.adminComment}
                      onBlur={(event) => onCommentUpdate(request.id, request.status, event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onStatusChange(request.id, 'pending')} className={`p-3 rounded-xl transition-all border flex items-center justify-center ${request.status === 'pending' ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-amber-500 hover:text-amber-500 hover:bg-amber-50'}`} title="Новая заявка">
                      <Clock className="h-5 w-5" />
                    </button>
                    <button onClick={() => onStatusChange(request.id, 'contacted')} className={`p-3 rounded-xl transition-all border flex items-center justify-center ${request.status === 'contacted' ? 'bg-sky-600 text-white border-sky-700 shadow-lg shadow-sky-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-sky-600 hover:text-sky-600 hover:bg-sky-50'}`} title="Связались">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button onClick={() => onStatusChange(request.id, 'approved')} className={`p-3 rounded-xl transition-all border flex items-center justify-center ${request.status === 'approved' ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Одобрено">
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => onStatusChange(request.id, 'rejected')} className={`p-3 rounded-xl transition-all border flex items-center justify-center ${request.status === 'rejected' ? 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-500/20' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50'}`} title="Отклонено">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
