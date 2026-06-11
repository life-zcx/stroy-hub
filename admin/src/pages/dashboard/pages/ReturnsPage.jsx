import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  User,
  ShoppingBag,
  Clock,
  Eye
} from 'lucide-react';

export default function ReturnsPage({
  returns = [],
  onUpdateStatus,
  loading = false,
}) {
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [comments, setComments] = useState({}); // { [id]: 'comment' }
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Lightbox photo URL
  
  // Parse return ID from hash (e.g. #returns/15)
  const [selectedReturnId, setSelectedReturnId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const parts = hash.split('/');
    if (parts[0] === '#returns' && parts[1]) {
      return parseInt(parts[1]) || null;
    }
    return null;
  });

  // Listen to hash changes (e.g. F5 or back/forward browser navigation)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const parts = hash.split('/');
      if (parts[0] === '#returns' && parts[1]) {
        setSelectedReturnId(parseInt(parts[1]) || null);
      } else {
        setSelectedReturnId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectReturn = (id) => {
    if (id) {
      window.location.hash = `returns/${id}`;
    } else {
      window.location.hash = 'returns';
    }
  };

  const pendingCount = returns.filter((r) => r.status === 'pending').length;

  const filteredReturns = returns.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    if (filter === 'rejected') return r.status === 'rejected';
    return true;
  });

  const handleCommentChange = (id, val) => {
    setComments((prev) => ({ ...prev, [id]: val }));
  };

  const handleAction = async (id, status) => {
    const adminComment = comments[id] || '';
    await onUpdateStatus(id, status, adminComment);
    // Clear comment after action
    setComments((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'approved': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'rejected': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'На проверке';
      case 'approved': return 'Согласован';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  const selectedReturn = returns.find(r => r.id === selectedReturnId);

  if (loading && selectedReturnId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-sans text-slate-500">
        <Clock className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-wider">Загрузка деталей заявки №{selectedReturnId}...</p>
      </div>
    );
  }

  // 1. Detailed Subpage View
  if (selectedReturn) {
    const ret = selectedReturn;
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectReturn(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            ← Назад к списку
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Заявка #{ret.id}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Panel: Information */}
          <div className="flex-1 w-full space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-650">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{ret.user?.name || ret.order?.clientName || 'Покупатель'}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {ret.user?.email || '—'} • {ret.user?.phone || ret.order?.clientPhone || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(ret.status)}`}>
                    {getStatusText(ret.status)}
                  </span>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {new Date(ret.createdAt).toLocaleDateString('ru-RU')} {new Date(ret.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Details block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Order Reference */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Заказ</p>
                  <p className="text-sm font-black text-slate-900">Заказ №{ret.orderId}</p>
                  {ret.order?.createdAt && (
                    <p className="text-[10px] text-slate-505 font-semibold mt-0.5">
                      от {new Date(ret.order.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>

                {/* Product Reference */}
                <div className="flex items-center gap-3 bg-blue-50/40 border border-blue-100/40 rounded-2xl p-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-150 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={ret.product?.image || 'https://placehold.co/50x50?text=Tormag'}
                      alt={ret.product?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Товар</p>
                    <h5 className="text-xs font-extrabold text-slate-900 truncate">{ret.product?.name}</h5>
                    <p className="text-[10px] text-slate-505 font-bold mt-0.5">Количество к возврату: <span className="text-rose-600 font-extrabold">{ret.quantity} шт</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason block */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Причина возврата и комментарий</h5>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ret.reason}
                </p>
              </div>
            </div>

            {/* Attached photo if exists */}
            {ret.photoUrl && (
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Прикрепленное фото</h5>
                <div 
                  className="relative w-48 h-48 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPhoto(ret.photoUrl)}
                >
                  <img src={ret.photoUrl} className="w-full h-full object-cover" alt="Attached return product" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )}

            {/* Admin comment display (for completed returns) */}
            {ret.status !== 'pending' && ret.adminComment && (
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">Примечание администратора</h5>
                <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-205">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">
                    «{ret.adminComment}»
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Moderation Actions (Only for pending) */}
          {ret.status === 'pending' ? (
            <div className="w-full lg:w-80 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
                Решение по возврату
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-2">
                    Комментарий для клиента
                  </label>
                  <textarea
                    value={comments[ret.id] || ''}
                    onChange={(e) => handleCommentChange(ret.id, e.target.value)}
                    placeholder="Напишите комментарий для клиента (например, причину отказа)..."
                    rows={4}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 resize-none outline-none text-slate-900 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      handleAction(ret.id, 'approved');
                      handleSelectReturn(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Одобрить возврат</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAction(ret.id, 'rejected');
                      handleSelectReturn(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Отклонить возврат</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-80 bg-slate-50 rounded-[2rem] border border-slate-200/50 p-6 text-center space-y-2 shrink-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Статус решения</p>
              <span className={`inline-flex items-center border px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusBadgeClass(ret.status)}`}>
                {getStatusText(ret.status)}
              </span>
              <p className="text-[10px] text-slate-505 font-medium leading-relaxed pt-2">
                Эта заявка уже обработана администратором и закрыта для редактирования.
              </p>
            </div>
          )}
        </div>

        {/* Photo lightbox modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={selectedPhoto} className="max-w-full max-h-[90vh] rounded-3xl object-contain shadow-2xl" alt="Enlarged return product" />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Table List View (Default)
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase tracking-tight">Заявки на возврат</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Модерация возвратов товаров от клиентов
          </p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-xl">
          <div className="bg-amber-500/20 p-1 rounded-lg">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Ожидают проверки</span>
            <span className="text-sm font-black leading-none">{pendingCount} заявок</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setFilter('pending')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'pending' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Ожидают проверки ({pendingCount})
          {filter === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'approved' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Согласованные
          {filter === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />}
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'rejected' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Отклоненные
          {filter === 'rejected' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors relative ${
            filter === 'all' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Все ({returns.length})
          {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
        </button>
      </div>

      {/* Returns Table/Grid */}
      <div className="space-y-4">
        {filteredReturns.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center shadow-inner">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              Заявки не найдены
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-slate-550">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-150">
                <tr>
                  <th className="px-6 py-3">ID / Дата</th>
                  <th className="px-6 py-3">Клиент</th>
                  <th className="px-6 py-3">Товар / Заказ</th>
                  <th className="px-6 py-3">Кол-во</th>
                  <th className="px-6 py-3">Статус</th>
                  <th className="px-6 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((ret) => (
                  <tr 
                    key={ret.id} 
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => handleSelectReturn(ret.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900"># {ret.id}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {new Date(ret.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{ret.user?.name || ret.order?.clientName || 'Покупатель'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{ret.user?.phone || ret.order?.clientPhone || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-bold text-slate-455 uppercase mb-0.5">Заказ №{ret.orderId}</div>
                      <div className="font-extrabold text-slate-900 truncate max-w-[240px]" title={ret.product?.name}>
                        {ret.product?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      {ret.quantity} шт
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center border px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(ret.status)}`}>
                        {getStatusText(ret.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSelectReturn(ret.id)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo lightbox modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedPhoto} className="max-w-full max-h-[90vh] rounded-3xl object-contain shadow-2xl" alt="Enlarged return product" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 bg-white/10 rounded-full transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
