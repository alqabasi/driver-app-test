
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TransactionType, DayStatus, Transaction, TradeDetails } from '../../types';
import { Button } from '../../components/ui/Button';
import { TransactionModal } from './components/TransactionModal';
import { TradeModal } from './components/TradeModal';
import { DaySettingsModal } from './components/DaySettingsModal';
import { ReportModal } from './components/ReportModal';
import { PrintView } from './components/PrintView';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { IncomeExpenseChart } from '../../components/ui/IncomeExpenseChart';
import { TransactionActionModal } from './components/TransactionActionModal';
import { 
  ChevronLeft, Lock, Settings, FileText, ArrowUp, ArrowDown, Share2,
  Search, Clock, LayoutList, Cloud, CloudOff, RefreshCw, ShoppingBag, Truck, Wallet
} from 'lucide-react';
import { audioService, SoundType } from '../../services/audioService';

interface ConfirmConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  variant: 'danger' | 'warning' | 'success' | 'info';
}

export const DailyLogScreen: React.FC = () => {
  const { currentLog, driver, selectDay, addTransaction, addTradeTransaction, updateTransaction, deleteTransaction, closeDay, isOnline, isSyncing, calculateCurrentBalance } = useApp();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });
  
  const [txType, setTxType] = useState(TransactionType.INCOME);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { progressPercent, remainingHours } = useMemo(() => {
    if (!currentLog) return { progressPercent: 0, remainingHours: 0 };
    const [year, month, day] = currentLog.id.split('-').map(Number);
    const start = new Date(year, month - 1, day, 4, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const total = end.getTime() - start.getTime();
    const elapsed = Math.max(0, now - start.getTime());
    const percent = Math.min(100, (elapsed / total) * 100);
    const remainingHrs = Math.max(0, Math.ceil((end.getTime() - now) / (1000 * 60 * 60)));
    return { progressPercent: percent, remainingHours: remainingHrs };
  }, [currentLog, now]);

  const isClosed = currentLog?.status === DayStatus.CLOSED;

  const displayedTransactions = useMemo(() => {
    if (!currentLog) return [];
    let data = [...currentLog.transactions];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(t => t.clientName.toLowerCase().includes(query) || t.tradeDetails?.productName.toLowerCase().includes(query));
    }
    data.sort((a, b) => b.timestamp - a.timestamp);
    return data;
  }, [currentLog?.transactions, searchQuery]);

  if (!currentLog || !driver) return null;

  const summary = (() => {
    const income = currentLog.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = currentLog.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const tradeBalance = currentLog.transactions.filter(t => t.type === TransactionType.TRADE).reduce((sum, t) => {
        const isSales = t.tradeDetails?.category === 'sales';
        const impact = t.tradeDetails?.paidAmount || 0;
        return sum + (isSales ? impact : -impact);
    }, 0);
    const net = income - expense + tradeBalance;
    return { income: income + (tradeBalance > 0 ? tradeBalance : 0), expense: expense + (tradeBalance < 0 ? Math.abs(tradeBalance) : 0), net };
  })();

  const handleCloseDayConfirm = async () => {
    setConfirmConfig({
      isOpen: true,
      title: 'تقفيل اليومية',
      message: 'تحذير: بمجرد إغلاق اليومية لا يمكن إضافة حركات مرة أخرى. هل أنت متأكد؟',
      variant: 'warning',
      confirmText: 'نعم، إغلاق الآن',
      onConfirm: closeDay
    });
  };

  const timerRef = useRef<number | null>(null);

  const startLongPress = (tx: Transaction) => {
    if (isClosed) return;
    timerRef.current = window.setTimeout(() => {
      audioService.play(SoundType.ALERT);
      setSelectedTransaction(tx);
      setIsActionModalOpen(true);
      timerRef.current = null;
    }, 600);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      setEditingTransaction(selectedTransaction);
      if (selectedTransaction.type === TransactionType.TRADE) {
        setIsTradeModalOpen(true);
      } else {
        setIsTxModalOpen(true);
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTransaction) {
      setConfirmConfig({
        isOpen: true,
        title: 'حذف الحركة',
        message: `هل أنت متأكد من حذف حركة "${selectedTransaction.clientName}"؟ سيتم التحقق من تأثير ذلك على رصيد العهدة.`,
        variant: 'danger',
        confirmText: 'نعم، حذف',
        onConfirm: () => deleteTransaction(selectedTransaction.id)
      });
    }
  };

  const handleTxSubmit = async (clientName: string, amount: number, type: TransactionType) => {
    let success = false;
    if (editingTransaction) {
      success = await updateTransaction(editingTransaction.id, clientName, amount, type);
    } else {
      success = await addTransaction(clientName, amount, type);
    }
    
    if (success) {
      setEditingTransaction(null);
      setIsTxModalOpen(false);
    }
  };

  const handleTradeSubmit = async (details: TradeDetails) => {
    let success = false;
    if (editingTransaction) {
        success = await updateTransaction(editingTransaction.id, details.customerName, details.total, TransactionType.TRADE, details);
    } else {
        success = await addTradeTransaction(details);
    }

    if (success) {
      setEditingTransaction(null);
      setIsTradeModalOpen(false);
    }
  };

  const isLowBalance = summary.net < 500;

  return (
    <div className="min-h-screen bg-slate-50 pb-44 no-print font-cairo" dir="rtl">
      <PrintView log={currentLog} driver={driver} />

      {/* Blue Header */}
      <div className="bg-blue-900 text-white pt-8 pb-24 px-6 rounded-b-[3.5rem] shadow-2xl relative z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 to-blue-900 opacity-50"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => selectDay(null)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md border border-white/5" aria-label="الرجوع للرئيسية">
            <ChevronLeft size={24} className="rotate-180" />
          </button>
          <div className="flex gap-3">
             {!driver.isOfflineOnly && (
               <div className={`p-4 rounded-2xl backdrop-blur-md border border-white/5 transition-colors ${isOnline ? 'bg-white/10 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                  {isSyncing ? <RefreshCw size={22} className="animate-spin" /> : (isOnline ? <Cloud size={22} /> : <CloudOff size={22} />)}
               </div>
             )}
             <button onClick={() => setIsReportOpen(true)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md border border-white/5" aria-label="عرض التقرير">
              <FileText size={22} />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md border border-white/5" aria-label="الإعدادات">
              <Settings size={22} />
            </button>
          </div>
        </div>

        <div className="text-center mb-8 relative z-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest mb-4 backdrop-blur-md uppercase ${isClosed ? 'bg-red-500/20 border-red-500/20 text-red-100' : 'bg-emerald-500/20 border-emerald-500/20 text-emerald-100'}`}>
                {isClosed ? <Lock size={12} /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                {isClosed ? 'مغلق' : 'مفتوح الآن'}
            </span>
            <h1 className="text-3xl font-black mb-1 tracking-tighter">
                {new Date(currentLog.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
            <p className="text-blue-300 font-bold text-sm tracking-widest uppercase opacity-60">سائق: {driver.name}</p>
        </div>

        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 backdrop-blur-sm relative z-10">
           <div className="h-2.5 bg-blue-950/50 rounded-full w-full overflow-hidden mb-3">
               <div className={`h-full rounded-full transition-all duration-1000 ${isClosed ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
           </div>
           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-70">
              <div className="flex items-center gap-1.5"><Clock size={12} /> 04:00</div>
              {!isClosed && <div>متبقي {remainingHours} ساعة</div>}
              <div className="flex items-center gap-1.5">04:00 <Clock size={12} /></div>
           </div>
        </div>
      </div>

      {/* Floating Summary */}
      <div className="px-6 -mt-16 relative z-10 mb-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white">
            <div className="flex justify-between items-center divide-x divide-x-reverse divide-blue-50">
                <div className="flex-1 text-center">
                    <span className="block text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">دخل السيولة</span>
                    <span className="text-emerald-600 font-black text-2xl tracking-tighter">{summary.income.toLocaleString()}</span>
                </div>
                <div className="flex-1 text-center flex flex-col items-center">
                    <IncomeExpenseChart income={summary.income} expense={summary.expense} height={45} barWidth="w-3.5" />
                    <div className={`mt-2 flex flex-col items-center ${isLowBalance ? 'animate-pulse' : ''}`}>
                      <span className={`block font-black text-2xl tracking-tighter ${summary.net < 0 ? 'text-red-500' : 'text-blue-950'}`}>{summary.net.toLocaleString()}</span>
                      <span className="text-[8px] font-black text-blue-300 uppercase tracking-tighter flex items-center gap-1">
                        <Wallet size={8} /> رصيد المحفظة
                      </span>
                    </div>
                </div>
                <div className="flex-1 text-center">
                    <span className="block text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">خرج السيولة</span>
                    <span className="text-red-500 font-black text-2xl tracking-tighter">{summary.expense.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>

      {/* History */}
      <div className="px-6 space-y-6">
        <div className="relative">
             <Search size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300" />
             <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="بحث في الحركات..."
                 className="w-full pr-14 pl-6 py-5 bg-white rounded-[2rem] shadow-sm border border-blue-50 focus:border-blue-600 outline-none transition-all font-bold"
             />
        </div>

        <div className="space-y-4">
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[3rem] border border-blue-50">
              <LayoutList size={40} className="text-blue-100 mx-auto mb-4" />
              <p className="text-blue-300 font-bold text-sm">لا توجد حركات مسجلة</p>
            </div>
          ) : (
            displayedTransactions.map((tx) => (
              <div 
                key={tx.id} 
                onMouseDown={() => startLongPress(tx)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(tx)}
                onTouchEnd={cancelLongPress}
                className={`bg-white p-6 rounded-[2rem] shadow-sm border border-blue-50 flex items-center justify-between group transition-all select-none ${!isClosed ? 'active:bg-slate-50 cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 
                      tx.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-600' :
                      (tx.tradeDetails?.category === 'sales' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')
                    }`}>
                        {tx.type === TransactionType.INCOME ? <ArrowUp size={24} /> : 
                         tx.type === TransactionType.EXPENSE ? <ArrowDown size={24} /> :
                         (tx.tradeDetails?.category === 'sales' ? <ShoppingBag size={24} /> : <Truck size={24} />)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-black text-blue-950 text-base leading-none">{tx.clientName}</h4>
                           {tx.type === TransactionType.TRADE && (
                             <span className="text-[8px] px-2 py-0.5 bg-slate-100 rounded-full font-black text-slate-400 uppercase tracking-tighter">تجارة</span>
                           )}
                        </div>
                        <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-1 block">
                          {tx.type === TransactionType.TRADE ? `${tx.tradeDetails?.amount} ${tx.tradeDetails?.unit === 'ton' ? 'طن' : 'كيلو'} ${tx.tradeDetails?.productName}` : new Date(tx.timestamp).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={`font-black text-xl tracking-tighter ${
                    tx.type === TransactionType.INCOME || (tx.type === TransactionType.TRADE && tx.tradeDetails?.category === 'sales') ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                      {tx.type === TransactionType.INCOME || (tx.type === TransactionType.TRADE && tx.tradeDetails?.category === 'sales') ? '+' : '-'}
                      {tx.type === TransactionType.TRADE ? tx.tradeDetails?.paidAmount.toLocaleString() : tx.amount.toLocaleString()}
                  </div>
                  {tx.type === TransactionType.TRADE && (
                    <span className="text-[8px] font-bold text-slate-300">من إجمالي {tx.amount.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-8 left-6 right-6 z-40">
        {!isClosed ? (
          <div className="bg-blue-950 p-2 rounded-[2.5rem] shadow-2xl flex gap-2 backdrop-blur-xl border border-white/10" role="navigation">
            <button 
              onClick={() => { audioService.play(SoundType.TAP); setTxType(TransactionType.INCOME); setEditingTransaction(null); setIsTxModalOpen(true); }}
              className="flex-1 bg-white/5 hover:bg-white/15 text-white rounded-[2rem] py-5 font-black flex flex-col items-center transition-all"
              aria-label="إضافة وارد جديد"
            >
              <div className="bg-emerald-500 p-2 rounded-full mb-1"><ArrowUp size={18} /></div>
              <span className="text-[10px] uppercase tracking-widest">وارد</span>
            </button>
            <button 
              onClick={() => { audioService.play(SoundType.TAP); setEditingTransaction(null); setIsTradeModalOpen(true); }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] py-5 font-black flex flex-col items-center transition-all shadow-xl shadow-blue-600/20"
              aria-label="إضافة معاملة تجارة"
            >
              <div className="bg-white p-2 rounded-full mb-1 text-blue-600"><ShoppingBag size={18} /></div>
              <span className="text-[10px] uppercase tracking-widest">تجارة</span>
            </button>
            <button 
              onClick={() => { audioService.play(SoundType.TAP); setTxType(TransactionType.EXPENSE); setEditingTransaction(null); setIsTxModalOpen(true); }}
              className="flex-1 bg-white/5 hover:bg-white/15 text-white rounded-[2rem] py-5 font-black flex flex-col items-center transition-all"
              aria-label="إضافة مصروف جديد"
            >
              <div className="bg-red-500 p-2 rounded-full mb-1"><ArrowDown size={18} /></div>
              <span className="text-[10px] uppercase tracking-widest">مصروف</span>
            </button>
          </div>
        ) : (
            <Button onClick={() => setIsReportOpen(true)} fullWidth size="xl" className="rounded-[2.5rem] py-6 shadow-2xl">
              <Share2 size={24} />
              <span>تصدير تقرير اليومية</span>
            </Button>
        )}
      </div>

      <TransactionModal isOpen={isTxModalOpen} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }} onSubmit={handleTxSubmit} initialType={txType} initialData={editingTransaction} />
      <TradeModal isOpen={isTradeModalOpen} onClose={() => { setIsTradeModalOpen(false); setEditingTransaction(null); }} onSubmit={handleTradeSubmit} initialData={editingTransaction?.tradeDetails} />
      <TransactionActionModal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} onEdit={handleEdit} onDelete={handleDeleteConfirm} />
      <DaySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onCloseDay={handleCloseDayConfirm} driver={driver} isDayClosed={isClosed} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} log={currentLog} driver={driver} />
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} variant={confirmConfig.variant} confirmText={confirmConfig.confirmText} />
    </div>
  );
};
