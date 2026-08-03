import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, RefreshCw, ShoppingCart, ExternalLink, MessageSquareText, Mic, MicOff } from 'lucide-react';
import { sendAiChatMessage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { getIpxImageUrl } from '../utils/productImage';

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Здравствуйте! Я ваш Ai помощник. Что вы хотите найти?',
  products: []
};

const QUICK_PROMPTS = [
  { label: 'Подобрать смесь', text: 'Какая штукатурка лучше подходит для выравнивания стен в санузле?' },
  { label: 'Расчет на 40 м²', text: 'У меня 40 м² стены, толщина слоя 10 мм. Сколько мешков Ротбанда нужно купить?' },
  { label: 'Доставка и оплата', text: 'Как у вас работает доставка по Алматы и можно ли оплатить курьеру через Kaspi QR?' },
  { label: 'Написать в WhatsApp', isWhatsapp: true }
];

export default function AiAssistantWidget({ onAddToCart, showToast, onNavigate, currentPage, cartItemsCount = 0 }) {
  // NOTE: early return is intentionally placed AFTER all hooks (Rules of Hooks)

  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('tormag_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[AI WIDGET] Failed to parse saved chat history');
    }
    return [INITIAL_MESSAGE];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Голосовой ввод не поддерживается вашим браузером');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'ru-RU';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      localStorage.setItem('tormag_ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('[AI WIDGET] Failed to save chat history');
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadBadge(false);
    }
  }, [isOpen, messages]);

  const handleClearChat = () => {
    if (window.confirm('Очистить историю диалога и начать новый чат?')) {
      setMessages([INITIAL_MESSAGE]);
      localStorage.removeItem('tormag_ai_chat_history');
      showToast?.('История диалога очищена');
    }
  };

  const handleOpenFullPage = () => {
    setIsOpen(false);
    onNavigate?.('ai-assistant');
  };

  const handleSendMessage = async (textToSend = inputMessage) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 1)
        .map(m => ({ role: m.role, text: m.text }));

      const response = await sendAiChatMessage(query, history);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: response.reply || 'Простите, не удалось сформировать ответ.',
        products: response.recommendedProducts || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('[AI WIDGET ERROR]', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Извините, временно произошла ошибка связи с сервером. Вы можете написать нашему менеджеру в WhatsApp.',
          products: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (prompt.isWhatsapp) {
      window.open('https://wa.me/77078889900?text=' + encodeURIComponent('Здравствуйте! Мне нужна помощь в выборе строительных материалов.'), '_blank');
      return;
    }
    handleSendMessage(prompt.text);
  };

  // On mobile: lift above MobileCartBar when cart has items (cart bar ≈ 80px from bottom)
  // sm breakpoint = 640px; on desktop always use 1.5rem (sm:bottom-6)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const bottomOffset = isMobile && cartItemsCount > 0 ? '5.5rem' : '1.5rem';

  // Hide widget when on the dedicated AI page (must be after all hooks)
  if (currentPage === 'ai-assistant') return null;

  return (
    <div
      className="fixed right-4 sm:right-6 z-40 font-sans"
      style={{ bottom: bottomOffset }}
    >
      {/* ── Floating Open Button ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative group bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-lg transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
          title="TORMAG AI"
        >
          <MessageSquareText className="h-5 w-5 text-slate-300" />
          <span className="font-bold text-xs tracking-wide uppercase font-outfit hidden sm:inline-block">
            TORMAG AI
          </span>

          {unreadBadge && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">
              1
            </span>
          )}
        </button>
      )}

      {/* ── Chat Modal Window (Strict Clean Minimal Theme) ── */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[550px] max-h-[82vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

          {/* Strict Minimalist Header */}
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-slate-300" />
              <h3 className="font-bold text-sm text-white font-outfit tracking-wide">TORMAG AI</h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenFullPage}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors border-0 cursor-pointer"
                title="Открыть во весь экран"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors border-0 cursor-pointer"
                title="Удалить чат"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors border-0 cursor-pointer"
                title="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-left bg-slate-50/50 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-sm font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '')}</p>
                </div>

                {/* Inline Recommended Product Cards */}
                {Array.isArray(msg.products) && msg.products.length > 0 && (
                  <div className="w-full space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Рекомендуемые товары:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getIpxImageUrl(prod.image, '100x100')}
                              alt={prod.name}
                              className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0 text-left">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h5>
                              <span className="text-blue-600 font-bold text-xs">{formatPrice(prod.price)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onAddToCart?.(prod, 1);
                              showToast?.(`"${prod.name}" добавлен в корзину`);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors shrink-0 border-0 cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            В корзину
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 p-2.5 rounded-xl w-fit text-xs shadow-sm">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Расчет материалов...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors border-0 cursor-pointer shrink-0"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Footer Single Unified Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 bg-white border-t border-slate-200"
          >
            <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white rounded-2xl p-1 transition-all">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Спросите что-нибудь..."
                disabled={loading}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-1.5 rounded-xl transition-all border-0 cursor-pointer ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title={isListening ? 'Слушаю...' : 'Голосовой ввод'}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white p-1.5 rounded-xl transition-all border-0 cursor-pointer shadow-sm flex items-center justify-center"
                  title="Отправить"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* AI Error Disclaimer */}
          <div className="bg-slate-50 border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400 text-center">
            ИИ может допускать ошибки. Проверяйте информацию с менеджером.
          </div>

        </div>
      )}
    </div>
  );
}
