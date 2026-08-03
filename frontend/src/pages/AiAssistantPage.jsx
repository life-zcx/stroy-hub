import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, RefreshCw, ShoppingCart, ChevronRight, Plus, MessageSquare, AlertCircle, Mic, MicOff } from 'lucide-react';
import { sendAiChatMessage } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { getIpxImageUrl } from '../utils/productImage';
import Link from '../components/Link';
import { getPageHref } from '../utils/navigationHelper';

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Здравствуйте! Я TORMAG AI — ваш умный помощник. Готов ответить абсолютно на любые вопросы: найти информацию, помочь с выбором или сделать сложные расчеты. Что вас интересует?',
  products: []
};

const QUICK_PROMPTS = [
  { label: 'Подобрать материалы', text: 'Помогите подобрать материалы для моего ремонта' },
  { label: 'Расчет объема', text: 'Как правильно рассчитать нужное количество стройматериалов?' },
  { label: 'Сроки доставки', text: 'Расскажи про условия доставки собственным транспортом и варианты оплаты' },
  { label: 'Помощь с разгрузкой', text: 'Предоставляете ли вы грузчиков при доставке?' },
  { label: 'Возврат товара', text: 'Можно ли вернуть неиспользованные остатки материалов?' },
  { label: 'Наличие на складе', text: 'Как узнать, есть ли нужный товар в наличии прямо сейчас?' },
  { label: 'Подобрать аналоги', text: 'Помогите найти более бюджетные аналоги материалов' }
];

export default function AiAssistantPage({ onAddToCart, showToast, onNavigate }) {
  // Chat Sessions Storage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('tormag_ai_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[AI PAGE] Failed to parse saved chat sessions');
    }
    return [{
      id: 'session-1',
      title: 'Диалог 1',
      messages: [INITIAL_MESSAGE],
      updatedAt: Date.now()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    const savedId = localStorage.getItem('tormag_ai_active_session_id');
    return savedId || 'session-1';
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const LOADING_STEPS = [
    'Анализирую склад TORMAG...',
    'Подбираю лучшую продукцию...',
    'Рассчитываю расход материалов...',
    'Формирую выгодный вариант...'
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

  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Active Session Helper
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'session-1',
    title: 'Диалог 1',
    messages: [INITIAL_MESSAGE]
  };

  const messages = currentSession.messages || [INITIAL_MESSAGE];

  const scrollToBottom = () => {
    if (messagesEndRef.current?.parentElement) {
      messagesEndRef.current.parentElement.scrollTo({
        top: messagesEndRef.current.parentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
    try {
      localStorage.setItem('tormag_ai_chat_sessions', JSON.stringify(sessions));
      localStorage.setItem('tormag_ai_active_session_id', activeSessionId);
    } catch (e) {
      console.warn('[AI PAGE] Failed to save chat sessions');
    }
  }, [sessions, activeSessionId, messages]);

  // Voice Input Speech Recognition
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

      recognition.onerror = (err) => {
        console.warn('[VOICE RECOGNITION ERROR]', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('[VOICE INPUT EXCEPTION]', e);
      setIsListening(false);
    }
  };

  const handleCreateNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession = {
      id: newSessionId,
      title: `Диалог ${sessions.length + 1}`,
      messages: [INITIAL_MESSAGE],
      updatedAt: Date.now()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    showToast?.('Создан новый диалог');
  };

  const handleDeleteChat = (sessionIdToDelete, e) => {
    e?.stopPropagation();
    if (sessions.length <= 1) {
      setSessions([{
        id: 'session-1',
        title: 'Диалог 1',
        messages: [INITIAL_MESSAGE],
        updatedAt: Date.now()
      }]);
      setActiveSessionId('session-1');
      showToast?.('Чат удален');
      return;
    }

    if (window.confirm('Вы действительно хотите удалить этот чат?')) {
      const filtered = sessions.filter(s => s.id !== sessionIdToDelete);
      setSessions(filtered);
      if (activeSessionId === sessionIdToDelete) {
        setActiveSessionId(filtered[0].id);
      }
      showToast?.('Чат удален');
    }
  };

  const handleSendMessage = async (textToSend = inputMessage) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: query
    };

    const updatedMessages = [...messages, userMsg];

    let newTitle = currentSession.title;
    if (messages.length <= 1) {
      newTitle = query.length > 24 ? query.substring(0, 24) + '...' : query;
    }

    setSessions(prev => prev.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    }));

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
        text: (response.reply || 'Простите, не удалось сформировать ответ.').replace(/\*\*/g, ''),
        products: response.recommendedProducts || [],
        options: response.quickOptions || []
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: [...updatedMessages, aiMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } catch (error) {
      console.error('[AI PAGE ERROR]', error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Извините, сервис ИИ-консультаций временно недоступен. Вы можете задать вопрос нашему менеджеру по телефону или заказать обратный звонок.',
        products: []
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: [...updatedMessages, errorMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans text-slate-800 text-left overflow-hidden">

      {/* Top Header Row with Breadcrumbs & Actions (Desktop only) */}
      <div className="hidden sm:flex items-center justify-between gap-4 shrink-0 pt-5 pb-2">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Link
            href={getPageHref('home')}
            onClick={() => onNavigate?.('home')}
            className="hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold text-slate-500"
          >
            Главная
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">TORMAG AI</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Начать новый чат</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleDeleteChat(currentSession.id, e)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Удалить чат"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Удалить чат</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout - Fixed Viewport Height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 overflow-hidden h-[calc(100vh-11rem)] min-h-[580px] max-h-[820px]">

        {/* Left Sidebar: Saved Chat Sessions & Quick Prompts */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 overflow-hidden">

          {/* Chat Sessions List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Мои диалоги
              </h3>
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer bg-transparent border-0 flex items-center gap-1 p-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Новый
              </button>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${sess.id === activeSessionId
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${sess.id === activeSessionId ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{sess.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(sess.id, e)}
                    className={`p-1 rounded-lg transition-colors border-0 cursor-pointer ${sess.id === activeSessionId ? 'hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'hover:bg-slate-200 text-slate-400 hover:text-red-600'
                      }`}
                    title="Удалить чат"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompts List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-sm text-slate-900">
              Частые вопросы
            </h3>

            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={loading}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl transition-all cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 block">
                    {prompt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    "{prompt.text}"
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className="lg:col-span-8 bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl shadow-none sm:shadow-sm h-full flex flex-col overflow-hidden">

          {/* Mobile Toolbar (Visible on Mobile only) */}
          <div className="sm:hidden bg-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-xs text-slate-900 tracking-wide">TORMAG AI</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border-0 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Новый чат</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteChat(currentSession.id, e)}
                className="text-slate-400 hover:text-red-500 p-1.5 bg-slate-100 hover:bg-red-50 rounded-lg border-0 cursor-pointer transition-colors"
                title="Удалить чат"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[78%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none shadow-sm font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '')}</p>
                </div>

                {/* Kasper Interactive Options Buttons */}
                {Array.isArray(msg.options) && msg.options.length > 0 && (
                  <div className="w-full max-w-[85%] sm:max-w-[78%] flex flex-wrap gap-2 pt-1">
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
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer border-0 flex items-center gap-1.5 ${optionText.includes('Другое')
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
                          : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200'
                          }`}
                      >
                        <span>{optionText}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recommended Products Grid */}
                {Array.isArray(msg.products) && msg.products.length > 0 && (
                  <div className="w-full max-w-[92%] space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Рекомендуемые товары:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getIpxImageUrl(prod.image, '120x120')}
                              alt={prod.name}
                              className="w-10 h-10 object-contain rounded-xl bg-slate-50 p-1 shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0 text-left">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h5>
                              <span className="text-blue-600 font-bold text-xs block mt-0.5">{formatPrice(prod.price)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onAddToCart?.(prod, 1);
                              showToast?.(`"${prod.name}" добавлен в корзину`);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors shrink-0 border-0 cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            В корзину
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator (Dynamic Kasper Style) */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-600 bg-white border border-slate-200 p-3 rounded-xl w-fit text-xs font-semibold shadow-sm animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                <span>{LOADING_STEPS[loadingStepIdx]}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Single Unified Input Bar & Disclaimer */}
          <div className="ai-chat-input-bar p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white rounded-2xl p-1 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Спросите что-нибудь..."
                disabled={loading}
                className="flex-1 bg-transparent px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                inputMode="text"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
              />

              <div className="flex items-center gap-1 shrink-0 pr-0.5">
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-xl transition-all border-0 cursor-pointer ${isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                    }`}
                  title={isListening ? 'Слушаю... Нажмите для отмены' : 'Голосовой ввод'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Send Airplane Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white p-2 rounded-xl transition-all border-0 cursor-pointer shadow-sm flex items-center justify-center"
                  title="Отправить"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* AI Error Disclaimer */}
            <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-slate-400 pb-0.5">
              <AlertCircle className="h-3 w-3 shrink-0 text-slate-400" />
              <span>ИИ может допускать ошибки. Проверяйте информацию с менеджерами.</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
