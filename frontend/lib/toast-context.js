"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, ttl = 3800) => {
      const id = ++seq.current;
      setToasts((list) => [...list, { id, type, message }]);
      if (ttl) setTimeout(() => remove(id), ttl);
      return id;
    },
    [remove]
  );

  // Stable API object.
  const api = useRef({
    success: (m) => push("ok", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  });
  // Keep closures fresh if push identity changes.
  api.current.success = (m) => push("ok", m);
  api.current.error = (m) => push("error", m);
  api.current.info = (m) => push("info", m);

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            role="status"
            onClick={() => remove(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
