import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, RefreshCw, ShoppingCart, ExternalLink, MessageSquareText, Mic, MicOff } from 'lucide-react';
import { sendAiChatMessage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { getIpxImageUrl } from '../utils/productImage';

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Здравствуйте! Я TORMAG AI — ваш умный помощник. Готов ответить абсолютно на любые вопросы: найти информацию, помочь с выбором или сделать сложные расчеты. Что вас интересует?',
  products: []
};

const QUICK_PROMPTS = [
  { label: 'Подобрать материалы', text: 'Помогите подобрать материалы для моего ремонта' },
  { label: 'Расчет объема', text: 'Как правильно рассчитать нужное количество стройматериалов?' },
  { label: 'Сроки доставки', text: 'Расскажи про условия доставки' },
  { label: 'Задать вопрос в WhatsApp', isWhatsapp: true }
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
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e) => {
    // Disable dragging on mobile devices (<640px)
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    // Only drag if left click and not clicking action buttons
    if (e.button !== 0 || e.target.closest('button')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    // Disable dragging on mobile devices (<640px)
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

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
        products: response.recommendedProducts || [],
        options: response.quickOptions || []
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
          products: [],
          options: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (prompt.isWhatsapp) {
      window.open('https://wa.me/77077111653?text=' + encodeURIComponent('Здравствуйте! Мне нужна помощь в выборе строительных материалов.'), '_blank');
      return;
    }
    handleSendMessage(prompt.text);
  };

  // On mobile: lift above MobileCartBar when cart has items (5.5rem), or snap down (0.75rem) when empty
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const bottomOffset = isMobile ? (cartItemsCount > 0 ? '5.5rem' : '0.75rem') : '1.5rem';

  const LOADING_STEPS = [
    'Анализирую ваш запрос...',
    'Ищу информацию в TORMAG...',
    'Проверяю детали...',
    'Формулирую ответ...'
  ];
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Hide widget when on the dedicated AI page (must be after all hooks)
  if (currentPage === 'ai-assistant') return null;

  return (
    <>
      {/* ── Floating Open Button ── */}
      {!isOpen && (
        <div
          className="fixed z-40 font-sans"
          style={{
            bottom: bottomOffset,
            right: '1.5rem'
          }}
        >
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
        </div>
      )}

      {/* ── Chat Modal Window (Mobile Above Cart Bar, Draggable on Desktop) ── */}
      {isOpen && (
        <div
          className="fixed z-50 sm:z-40 font-sans inset-x-3.5 sm:inset-auto sm:right-6 flex justify-center"
          style={{
            bottom: bottomOffset,
            transform: isMobile ? 'none' : `translate(${position.x}px, ${position.y}px)`
          }}
        >
          <div className={`w-full sm:w-[380px] h-[540px] bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border-0 ${isMobile && cartItemsCount === 0 ? 'max-h-[84vh]' : 'max-h-[74vh]'
            }`}>

            {/* Draggable Minimalist Header (Desktop Only Drag) */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className={`bg-slate-900 text-white p-3.5 flex items-center justify-between select-none ${isDragging ? 'sm:cursor-grabbing' : 'sm:cursor-grab'
                }`}
              title="Зажмите, чтобы перетащить окно"
            >
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
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-left bg-slate-100/70 custom-scrollbar">
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

                  {/* Kasper Interactive Options Buttons */}
                  {Array.isArray(msg.options) && msg.options.length > 0 && (
                    <div className="w-full max-w-[92%] flex flex-wrap gap-1.5 pt-1">
                      {msg.options.map((optionText, optIdx) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            if (optionText.includes('Другое')) {
                              setInputMessage('Мне нужно ');
                              inputRef.current?.focus();
                            } else {
                              handleSendMessage(optionText);
                            }
                          }}
                          disabled={loading}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer border-0 flex items-center gap-1 ${optionText.includes('Другое')
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
                            : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200'
                            }`}
                        >
                          <span>{optionText}</span>
                        </button>
                      ))}
                    </div>
                  )}

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

              {/* Loading typing indicator (Dynamic Kasper Style) */}
              {loading && (
                <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200/80 p-2.5 rounded-xl w-fit text-xs shadow-sm font-semibold animate-pulse">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                  <span>{LOADING_STEPS[loadingStepIdx]}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100/80 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 select-none">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={loading}
                  className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all border border-slate-200/80 hover:border-blue-200 cursor-pointer shrink-0 shadow-2xs flex items-center gap-1 active:scale-95"
                >
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>

            {/* Footer Single Unified Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2 bg-slate-50 border-t border-slate-100"
            >
              <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-slate-400 rounded-2xl p-1 transition-all">
                <input
                  ref={inputRef}
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
                    className={`p-1.5 rounded-xl transition-all border-0 cursor-pointer ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-700'
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
        </div>
      )}
    </>
  );
}
