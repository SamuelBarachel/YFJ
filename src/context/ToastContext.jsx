import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, Trash2 } from 'lucide-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showDone = useCallback((msg = 'Done!', type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={{ showDone }}>
      {children}
      {toast && (
        <div
          className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-2xl animate-slide-up"
          style={{
            background: toast.type === 'danger'
              ? 'rgba(217,101,112,0.15)'
              : 'rgba(52,168,83,0.14)',
            border: toast.type === 'danger'
              ? '1px solid rgba(217,101,112,0.35)'
              : '1px solid rgba(52,168,83,0.35)',
            backdropFilter: 'blur(20px)',
            boxShadow: toast.type === 'danger'
              ? '0 8px 30px rgba(217,101,112,0.2)'
              : '0 8px 30px rgba(52,168,83,0.2)',
          }}
        >
          {toast.type === 'danger'
            ? <Trash2 size={15} style={{ color: '#d96570' }} />
            : <CheckCircle size={15} style={{ color: '#34a853' }} />
          }
          <span className="text-sm font-black" style={{ color: toast.type === 'danger' ? '#d96570' : '#34a853' }}>
            {toast.msg}
          </span>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
