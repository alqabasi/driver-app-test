import React, { useState, useEffect } from 'react';
import { toast } from '../../services/toast';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };

    const unsubscribe = toast.subscribe((message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000); // Auto close after 4s
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-3 pointer-events-none px-6">
      {toasts.map(t => (
        <div 
          key={t.id}
          className={`pointer-events-auto w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-300 border-2 ${
            t.type === 'success' ? 'bg-slate-900 text-white border-slate-800' :
            t.type === 'error' ? 'bg-white text-red-600 border-red-50' :
            'bg-white text-slate-800 border-slate-100'
          }`}
        >
          <div className={`p-2.5 rounded-full shrink-0 ${
             t.type === 'success' ? 'bg-emerald-500 text-white' :
             t.type === 'error' ? 'bg-red-50 text-red-500' :
             'bg-blue-50 text-blue-600'
          }`}>
            {t.type === 'success' && <CheckCircle size={20} className="fill-current" />}
            {t.type === 'error' && <AlertCircle size={20} />}
            {t.type === 'info' && <Info size={20} />}
          </div>
          
          <p className="flex-1 font-bold text-sm leading-relaxed">{t.message}</p>
          
          <button 
             onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
             className={`p-1 rounded-full transition-colors shrink-0 ${
                t.type === 'success' ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
             }`}
          >
             <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
