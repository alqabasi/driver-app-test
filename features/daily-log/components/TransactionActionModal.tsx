
import React, { useEffect } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';
import { audioService, SoundType } from '../../../services/audioService';

interface TransactionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionActionModal: React.FC<TransactionActionModalProps> = ({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-end justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-modal-title"
        >
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
            <div className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-200 relative z-10 p-6 pb-10">
                 <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" aria-hidden="true" />
                 
                 <div className="flex justify-between items-center mb-6">
                    <h3 id="action-modal-title" className="text-lg font-bold text-slate-800">خيارات الحركة</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full" aria-label="إغلاق">
                        <X size={18} />
                    </button>
                 </div>

                 <div className="space-y-3">
                     <button 
                        onClick={() => { onEdit(); onClose(); }} 
                        className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl text-slate-800 font-bold active:bg-slate-100 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100"
                     >
                        <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm border border-slate-100">
                            <Edit2 size={20} />
                        </div>
                        تعديل البيانات
                     </button>
                     <button 
                        onClick={() => { onDelete(); onClose(); }} 
                        className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-2xl text-red-600 font-bold active:bg-red-100 transition-colors focus:outline-none focus:ring-4 focus:ring-red-100"
                     >
                        <div className="bg-white p-2 rounded-xl text-red-500 shadow-sm border border-red-100">
                            <Trash2 size={20} />
                        </div>
                        حذف الحركة
                     </button>
                 </div>
            </div>
        </div>
    );
};
