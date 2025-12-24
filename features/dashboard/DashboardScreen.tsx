
import React, { useMemo, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DailyLog, DayStatus, TransactionType } from '../../types';
import { LogOut, Plus, ArrowRight, Download, Printer, Info, Play, Calendar, LayoutDashboard, Cloud, CloudOff, RefreshCcw } from 'lucide-react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { IncomeExpenseChart } from '../../components/ui/IncomeExpenseChart';
import { DeveloperInfoModal } from '../../components/DeveloperInfoModal';
import { PrintView } from '../daily-log/components/PrintView';
import { toast } from '../../services/toast';

export const DashboardScreen: React.FC = () => {
  const { driver, logs, logout, createDay, selectDay, exportData, isOnline, isSyncing } = useApp();
  const [isDevInfoOpen, setIsDevInfoOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [printingLog, setPrintingLog] = useState<DailyLog | null>(null);

  const activeLog = useMemo(() => logs.find(l => l.status === DayStatus.OPEN), [logs]);

  if (!driver) return null;

  const getDaySummary = (log: DailyLog) => {
    const income = log.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = log.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  };

  const handleQuickPrint = (e: React.MouseEvent, log: DailyLog) => {
    e.stopPropagation();
    setPrintingLog(log);
    setTimeout(() => {
        window.print();
        setPrintingLog(null);
    }, 100);
  };

  const showSyncInfo = !driver.isOfflineOnly;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-cairo" dir="rtl">
      {/* Dynamic Hidden Print View for Dashboard Actions */}
      {printingLog && <PrintView log={printingLog} driver={driver} />}

      <div className="bg-blue-950 pt-10 pb-24 px-6 rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <LayoutDashboard className="text-white" size={24} />
             </div>
             <div>
                <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-0.5">القبسي للخدمات</p>
                <h1 className="text-2xl font-black text-white tracking-tight">{driver.name.split(' ')[0]} 👋</h1>
             </div>
          </div>
          <div className="flex gap-2 items-center">
             {showSyncInfo && (
               <div className={`p-3 rounded-2xl transition-all ${isOnline ? 'bg-blue-600/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isSyncing ? <RefreshCcw size={20} className="animate-spin" /> : (isOnline ? <Cloud size={20} /> : <CloudOff size={20} />)}
               </div>
             )}
             <button onClick={() => setIsDevInfoOpen(true)} className="p-3.5 bg-white/5 text-white/70 rounded-2xl border border-white/5">
                <Info size={22} />
             </button>
             <button onClick={() => setIsConfirmOpen(true)} className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10">
                <LogOut size={22} />
             </button>
          </div>
        </div>

        {activeLog ? (
            <button onClick={() => selectDay(activeLog)} className="w-full bg-blue-600 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all">
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="bg-white text-blue-600 w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl">
                            <Play size={32} fill="currentColor" className="mr-1" />
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-2xl mb-1 tracking-tight">متابعة الوردية</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-white/80 text-sm font-bold">الوردية الحالية نشطة</span>
                            </div>
                        </div>
                    </div>
                    <ArrowRight className="text-white rotate-180 opacity-50" size={28} />
                </div>
            </button>
        ) : (
            <button onClick={createDay} className="w-full bg-white text-blue-950 rounded-[3rem] p-8 shadow-2xl relative group active:scale-[0.98] transition-all border border-blue-50">
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-600 w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                            <Plus size={36} />
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-2xl mb-1 tracking-tight">بدء وردية</span>
                            <span className="text-blue-400 text-sm font-bold">افتح سجل يومي جديد</span>
                        </div>
                    </div>
                    <ArrowRight className="text-blue-900 rotate-180 opacity-20" size={28} />
                </div>
            </button>
        )}
      </div>

      <div className="px-6 -mt-10 relative z-20 mb-10">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-blue-50 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Calendar size={24} /></div>
                <div>
                    <span className="block text-[10px] font-black text-blue-300 uppercase tracking-widest">الأيام</span>
                    <span className="text-2xl font-black text-blue-950 tracking-tighter">{logs.length}</span>
                </div>
            </div>
            <button onClick={exportData} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-blue-50 flex items-center gap-4 text-right">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Download size={24} /></div>
                <div>
                    <span className="block text-[10px] font-black text-emerald-300 uppercase tracking-widest">نسخ</span>
                    <span className="text-sm font-black text-blue-950">تصدير يدوي</span>
                </div>
            </button>
        </div>
      </div>

      {/* Only show network banner if NOT in offline-only mode */}
      {!isOnline && !driver.isOfflineOnly && (
        <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-amber-200 text-amber-700 rounded-xl"><CloudOff size={20} /></div>
          <p className="text-amber-800 font-bold text-xs">أنت تعمل الآن في وضع عدم الاتصال. سيتم حفظ بياناتك محلياً ومزامنتها تلقائياً عند عودة الإنترنت.</p>
        </div>
      )}

      <div className="px-6">
        <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="font-black text-2xl text-blue-950 tracking-tight">سجل العمليات</h2>
            <div className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-widest uppercase">{logs.length} يوماً</div>
        </div>

        <div className="space-y-5">
          {logs.map(log => {
               const { income, expense, net } = getDaySummary(log);
               const isClosed = log.status === DayStatus.CLOSED;
               return (
                <button key={log.id} onClick={() => selectDay(log)} className="w-full bg-white p-7 rounded-[3rem] shadow-sm border border-blue-50 hover:shadow-2xl active:scale-[0.98] transition-all text-right group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="block font-black text-blue-950 text-2xl tracking-tighter leading-none mb-2">
                            {new Date(log.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                        {!log.isSynced && !driver.isOfflineOnly && <span className="text-amber-500 text-[10px] font-bold flex items-center gap-1"><RefreshCcw size={10} className="animate-spin" /> جاري المزامنة...</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => handleQuickPrint(e, log)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            aria-label="طباعة سريعة"
                        >
                            <Printer size={18} />
                        </button>
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase ${isClosed ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                        {isClosed ? 'مغلق' : 'نشط'}
                        </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end bg-blue-50/20 p-5 rounded-[2rem] border border-blue-50">
                    <div className="flex items-center gap-5">
                       <IncomeExpenseChart income={income} expense={expense} height={40} barWidth="w-3" />
                       <div className="text-right">
                          <span className="block text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">صافي اليومية</span>
                          <span className={`font-black text-3xl tracking-tighter ${net >= 0 ? 'text-blue-950' : 'text-red-500'}`}>
                            {net.toLocaleString()} <span className="text-xs opacity-30">ج.م</span>
                          </span>
                       </div>
                    </div>
                  </div>
                </button>
               );
          })}
        </div>
      </div>

      <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={logout} title="تسجيل الخروج" message="هل أنت متأكد من رغبتك في تسجيل الخروج؟ سيتم حذف الجلسة الحالية." variant="danger" />
      <DeveloperInfoModal isOpen={isDevInfoOpen} onClose={() => setIsDevInfoOpen(false)} />
    </div>
  );
};
