'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { toast: () => {} }; // no-op outside provider
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-in rounded-xl px-4 py-2.5 text-sm font-medium shadow-apple-lg ring-1 ring-black/5 dark:ring-white/10 ${
              t.type === 'error'
                ? 'bg-rose-600 text-white'
                : t.type === 'info'
                  ? 'bg-card text-ink'
                  : 'bg-ink text-canvas'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
