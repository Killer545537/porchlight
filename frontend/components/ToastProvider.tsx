'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ToastAction {
    label: string;
    run: () => void;
}

interface Toast {
    id: number;
    message: string;
    action?: ToastAction;
}

interface ToastContextValue {
    toast: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        (message: string, action?: ToastAction) => {
            const id = nextId.current++;
            setToasts((prev) => [...prev, { id, message, action }]);
            setTimeout(() => dismiss(id), 4600);
        },
        [dismiss],
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className='fixed left-1/2 bottom-[18px] z-[100] flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none w-max max-w-[92vw]'>
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className='animate-toast pointer-events-auto flex items-center gap-3 rounded-porch bg-ink px-3.5 py-[11px] text-bg shadow-porch max-w-[92vw]'
                        style={{ font: '500 13.5px var(--font-sans)' }}
                    >
                        <span>{t.message}</span>
                        {t.action && (
                            <button
                                type='button'
                                onClick={() => {
                                    t.action?.run();
                                    dismiss(t.id);
                                }}
                                className='mono cursor-pointer text-accent underline underline-offset-[3px]'
                                style={{ font: '600 13px var(--font-sans)' }}
                            >
                                {t.action.label}
                            </button>
                        )}
                        <button
                            type='button'
                            onClick={() => dismiss(t.id)}
                            className='cursor-pointer text-bg opacity-55 hover:opacity-100 leading-none'
                            aria-label='Dismiss'
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
