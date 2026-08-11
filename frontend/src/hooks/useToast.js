import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    setToast(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback((payload, durationOverride) => {
    const id = Date.now() + Math.random();
    let toastObj;

    if (typeof payload === 'string') {
      const isError = /❌|error|ошибка|не удалось|неверн|аннулирован|заблокирован|заполните|отклонен/i.test(payload);
      const isWarning = /⚠️|предупреждение|внимание|требуется/i.test(payload);
      const type = isError ? 'error' : isWarning ? 'warning' : 'success';
      toastObj = { id, message: payload, type, duration: durationOverride || 4000 };
    } else if (payload && typeof payload === 'object') {
      let type = payload.type;
      if (!type && payload.message) {
        const isError = /❌|error|ошибка|не удалось|неверн|аннулирован|заблокирован|заполните|отклонен/i.test(payload.message);
        const isWarning = /⚠️|предупреждение|внимание|требуется/i.test(payload.message);
        type = isError ? 'error' : isWarning ? 'warning' : 'success';
      }
      toastObj = { id, duration: 4000, type: type || 'success', ...payload };
      if (durationOverride) toastObj.duration = durationOverride;
    } else {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast(toastObj);

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, toastObj.duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast, hideToast };
}
