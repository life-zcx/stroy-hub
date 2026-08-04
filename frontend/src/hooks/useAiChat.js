import { useState, useEffect, useCallback, useRef } from 'react';
import { sendAiChatMessage } from '../services/api';

const SESSIONS_STORAGE_KEY = 'tormag_ai_chat_sessions';
const ACTIVE_SESSION_ID_KEY = 'tormag_ai_active_session_id';
const LEGACY_HISTORY_KEY = 'tormag_ai_chat_history';
const UPDATE_EVENT_NAME = 'tormag_ai_chat_updated';

export const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Здравствуйте! Я TORMAG AI — ваш умный помощник. Готов ответить абсолютно на любые вопросы: найти информацию, помочь с выбором или сделать сложные расчеты. Что вас интересует?',
  products: []
};

export const LOADING_STEPS = [
  'Анализирую склад TORMAG...',
  'Подбираю лучшую продукцию...',
  'Рассчитываю расход материалов...',
  'Формирую выгодный вариант...'
];

export function getStoredChatData() {
  try {
    const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedActiveId = localStorage.getItem(ACTIVE_SESSION_ID_KEY) || parsed[0].id;
        return { sessions: parsed, activeSessionId: savedActiveId };
      }
    }

    // Migration from legacy history if exists
    const legacyHistory = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (legacyHistory) {
      const parsedLegacy = JSON.parse(legacyHistory);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const firstUserMsg = parsedLegacy.find(m => m.role === 'user');
        const title = firstUserMsg
          ? (firstUserMsg.text.length > 24 ? firstUserMsg.text.substring(0, 24) + '...' : firstUserMsg.text)
          : 'Диалог 1';
        const migratedSessions = [{
          id: 'session-1',
          title,
          messages: parsedLegacy,
          updatedAt: Date.now()
        }];
        return { sessions: migratedSessions, activeSessionId: 'session-1' };
      }
    }
  } catch (e) {
    console.warn('[AI CHAT] Failed to load stored sessions:', e);
  }

  const defaultSession = {
    id: 'session-1',
    title: 'Диалог 1',
    messages: [INITIAL_MESSAGE],
    updatedAt: Date.now()
  };
  return { sessions: [defaultSession], activeSessionId: 'session-1' };
}

export function saveChatData(sessions, activeSessionId) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  } catch (e) {
    console.warn('[AI CHAT] Failed to save chat sessions:', e);
  }
}

export default function useAiChat() {
  const [{ sessions, activeSessionId }, setChatState] = useState(getStoredChatData);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const reloadFromStorage = useCallback(() => {
    setChatState(getStoredChatData());
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === SESSIONS_STORAGE_KEY || e.key === ACTIVE_SESSION_ID_KEY) {
        reloadFromStorage();
      }
    };

    window.addEventListener(UPDATE_EVENT_NAME, reloadFromStorage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(UPDATE_EVENT_NAME, reloadFromStorage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadFromStorage]);

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

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'session-1',
    title: 'Диалог 1',
    messages: [INITIAL_MESSAGE]
  };

  const messages = currentSession.messages || [INITIAL_MESSAGE];

  const changeActiveSession = (newId) => {
    setChatState(prev => {
      const nextState = { ...prev, activeSessionId: newId };
      saveChatData(nextState.sessions, newId);
      return nextState;
    });
  };

  const handleCreateNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession = {
      id: newSessionId,
      title: `Диалог ${sessions.length + 1}`,
      messages: [INITIAL_MESSAGE],
      updatedAt: Date.now()
    };

    setChatState(prev => {
      const newSessions = [newSession, ...prev.sessions];
      saveChatData(newSessions, newSessionId);
      return { sessions: newSessions, activeSessionId: newSessionId };
    });
  };

  const handleDeleteChat = (sessionIdToDelete, e) => {
    e?.stopPropagation();
    if (sessions.length <= 1) {
      const defaultSession = {
        id: 'session-1',
        title: 'Диалог 1',
        messages: [INITIAL_MESSAGE],
        updatedAt: Date.now()
      };
      setChatState({ sessions: [defaultSession], activeSessionId: 'session-1' });
      saveChatData([defaultSession], 'session-1');
      return;
    }

    const filtered = sessions.filter(s => s.id !== sessionIdToDelete);
    const newActiveId = activeSessionId === sessionIdToDelete ? filtered[0].id : activeSessionId;
    setChatState({ sessions: filtered, activeSessionId: newActiveId });
    saveChatData(filtered, newActiveId);
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

    const updatedSessionsAfterUser = sessions.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    });

    setChatState({ sessions: updatedSessionsAfterUser, activeSessionId: currentSession.id });
    saveChatData(updatedSessionsAfterUser, currentSession.id);
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

      const { sessions: freshSessions } = getStoredChatData();
      const updatedSessionsAfterAi = freshSessions.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: [...s.messages, aiMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      });

      setChatState({ sessions: updatedSessionsAfterAi, activeSessionId: currentSession.id });
      saveChatData(updatedSessionsAfterAi, currentSession.id);
    } catch (error) {
      console.error('[AI CHAT ERROR]', error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Извините, сервис ИИ-консультаций временно недоступен. Вы можете задать вопрос нашему менеджеру по телефону или в WhatsApp.',
        products: []
      };

      const { sessions: freshSessions } = getStoredChatData();
      const updatedSessionsAfterError = freshSessions.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: [...s.messages, errorMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      });

      setChatState({ sessions: updatedSessionsAfterError, activeSessionId: currentSession.id });
      saveChatData(updatedSessionsAfterError, currentSession.id);
    } finally {
      setLoading(false);
    }
  };

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

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      console.error('[VOICE RECOGNITION ERROR]', e);
      setIsListening(false);
    }
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId: changeActiveSession,
    currentSession,
    messages,
    inputMessage,
    setInputMessage,
    loading,
    loadingStepIdx,
    LOADING_STEPS,
    isListening,
    handleVoiceInput,
    handleSendMessage,
    handleCreateNewChat,
    handleDeleteChat
  };
}
