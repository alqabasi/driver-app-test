
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TransactionType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { X, Check, ArrowDownCircle, ArrowUpCircle, Save, Wallet } from 'lucide-react';
import { audioService, SoundType } from '../../../services/audioService';
import { useApp } from '../../../contexts/AppContext';
import { MoneyInput } from '../../../components/ui/MoneyInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientName: string, amount: number, type: TransactionType) => void;
  initialType?: TransactionType;
  initialData?: {
    clientName: string;
    amount: number;
    type: TransactionType;
  } | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialType = TransactionType.INCOME,
  initialData
}) => {
  const { currentLog, calculateCurrentBalance } = useApp();
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWalletBalance = useMemo(() => {
    if (!currentLog) return 0;
    const filtered = initialData 
      ? currentLog.transactions.filter(tx => tx.clientName !== initialData.clientName || tx.amount !== initialData.amount)
      : currentLog.transactions;
    return calculateCurrentBalance(filtered);
  }, [currentLog, initialData, calculateCurrentBalance, isOpen]);

  const handleClose = () => {
    audioService.play(SoundType.DISMISS);
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      if (initialData) {
        setClientName(initialData.clientName);
        setAmount(initialData.amount.toString());
        setType(initialData.type);
      } else {
        setType(initialType);
        setClientName('');
        setAmount('');
      }
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, initialType, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !amount) return;
    onSubmit(clientName, Number(amount), type);
  };

  const isIncome = type === TransactionType.INCOME;
  const isEditing = !!initialData;
  const hasInsufficientFunds = !isIncome && Number(amount) > currentWalletBalance;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      
      <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-500 relative z-10 flex flex-col max-h-[95vh]">
        
        <div className="w-full flex justify-center pt-4 pb-2 sm:hidden">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-8 py-5 flex justify-between items-center">
          <div>
            <h3 id="tx-modal-title" className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'تعديل الحركة' : (isIncome ? 'إضافة وارد' : 'إضافة مصروف')}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
               <Wallet size={12} className="text-slate-400" />
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">المتاح: {currentWalletBalance.toLocaleString()} ج.م</span>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all transform active:rotate-90"
            aria-label="إغلاق النافذة"
          >
            <X size={20} className="text-slate-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-7 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-3 p-2 bg-slate-100 rounded-[2rem]">
            <button
              type="button"
              onClick={() => {
                audioService.play(SoundType.TAP);
                setType(TransactionType.INCOME);
              }}
              className={`flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-sm ${
                isIncome 
                  ? 'bg-white text-emerald-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ArrowUpCircle size={20} />
              وارد
            </button>
            <button
              type="button"
              onClick={() => {
                audioService.play(SoundType.TAP);
                setType(TransactionType.EXPENSE);
              }}
              className={`flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-sm ${
                !isIncome 
                  ? 'bg-white text-red-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ArrowDownCircle size={20} />
              مصروف
            </button>
          </div>

          <div className="space-y-5">
             <MoneyInput 
               value={amount}
               onChange={setAmount}
               label="المبلغ"
               error={hasInsufficientFunds ? "الرصيد غير كافٍ!" : undefined}
             />

             <div className="relative">
                <input
                  id="client-name-input"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder=" "
                  className="peer w-full px-6 pt-7 pb-3 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-xl font-bold bg-slate-50/50 text-slate-900 transition-all placeholder:text-transparent"
                />
                <label 
                  htmlFor="client-name-input"
                  className="absolute top-5 right-6 text-slate-400 text-base font-bold transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-slate-500 peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-slate-500 pointer-events-none"
                >
                   البيان / اسم العميل / الغرض
                </label>
             </div>
          </div>

          <div className="pt-4">
            <Button 
                type="submit" 
                fullWidth 
                size="xl" 
                disabled={hasInsufficientFunds && !isIncome}
                className={`rounded-[2rem] py-6 shadow-2xl transition-all transform active:scale-[0.96] font-black text-xl ${
                    isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700 disabled:bg-slate-300'
                }`}
            >
                {isEditing ? <Save size={28} /> : <Check size={28} />}
                <span>
                    {isEditing ? 'حفظ التعديلات' : (isIncome ? 'تأكيد الوارد' : 'تأكيد المصروف')}
                </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
