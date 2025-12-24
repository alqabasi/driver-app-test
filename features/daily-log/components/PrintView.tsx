
import React, { useMemo } from 'react';
import { DailyLog, TransactionType, Driver, DayStatus, Transaction } from '../../../types';

interface PrintViewProps {
  log: DailyLog;
  driver: Driver;
}

export const PrintView: React.FC<PrintViewProps> = ({ log, driver }) => {
  const transactions = log.transactions;

  // Financial Calculations
  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const trades = transactions.filter(t => t.type === TransactionType.TRADE);

    const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expense.reduce((acc, t) => acc + t.amount, 0);

    let tradeCashIn = 0;
    let tradeCashOut = 0;
    let customerDebts = 0; // Money others owe driver (Sales remainder)
    let driverDebts = 0;   // Money driver owes others (Purchase remainder)

    const productSummary: Record<string, { ton: number; kg: number }> = {};

    trades.forEach(t => {
      if (!t.tradeDetails) return;
      const d = t.tradeDetails;
      const isSales = d.category === 'sales';
      const remainder = d.total - d.paidAmount;

      if (isSales) {
        tradeCashIn += d.paidAmount;
        customerDebts += remainder;
      } else {
        tradeCashOut += d.paidAmount;
        driverDebts += remainder;
      }

      // Weight breakdown
      if (!productSummary[d.productName]) productSummary[d.productName] = { ton: 0, kg: 0 };
      if (d.unit === 'ton') productSummary[d.productName].ton += d.amount;
      else productSummary[d.productName].kg += d.amount;
    });

    const cashInHand = (totalIncome + tradeCashIn) - (totalExpense + tradeCashOut);

    return {
      totalIncome,
      totalExpense,
      tradeCashIn,
      tradeCashOut,
      cashInHand,
      customerDebts,
      driverDebts,
      productSummary,
      income,
      expense,
      trades
    };
  }, [transactions]);

  const dateObj = new Date(log.date);
  const dateStr = dateObj.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const yearStr = dateObj.getFullYear().toString();
  
  const docId = `ALQ-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}-${driver.mobile.slice(-4)}`;

  return (
    <div className="hidden print-only bg-white text-slate-900 w-full h-full absolute top-0 left-0 z-[9999] font-cairo" dir="rtl">
      <style>
        {`
          @media print { 
            @page { margin: 15mm; size: A4; } 
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .page-break { page-break-before: always; }
          }
        `}
      </style>
      
      <div className="max-w-[210mm] mx-auto min-h-screen relative flex flex-col p-8 border-[1px] border-slate-200">
        
        {/* Official Letterhead */}
        <div className="flex justify-between items-start border-b-4 border-blue-900 pb-6 mb-8">
           <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg">ق</div>
                 <div>
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight leading-none">شركة القبسي للنقل</h1>
                    <span className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">Alqabasi Transport & Trading</span>
                 </div>
              </div>
              <div className="mt-4 flex gap-3">
                 <span className="bg-blue-900 text-white text-[9px] font-black px-3 py-1.5 rounded-md uppercase tracking-tighter">كشف حساب يومي معتمد</span>
                 {driver.isOfflineOnly && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-3 py-1.5 rounded-md uppercase tracking-tighter border border-slate-200">عمل محلي - Offline Mode</span>}
              </div>
           </div>
           
           <div className="text-left flex flex-col items-end">
              <div className="text-right bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
                 <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Doc Reference / المرجع</span>
                 <span className="font-mono font-black text-base text-blue-950 block">{docId}</span>
                 
                 <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-[10px] text-slate-400 font-bold">السائق:</span>
                        <span className="text-[11px] font-black text-slate-800">{driver.name}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-[10px] text-slate-400 font-bold">الهاتف:</span>
                        <span className="text-[11px] font-black text-slate-800" dir="ltr">{driver.mobile}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-[10px] text-slate-400 font-bold">التاريخ:</span>
                        <span className="text-[11px] font-black text-slate-800">{dateStr}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-[10px] text-slate-400 font-bold">السنة:</span>
                        <span className="text-[11px] font-black text-slate-800">{yearStr}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Primary Cash Summary */}
        <div className="mb-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center border-b border-slate-100 pb-2">ملخص السيولة النقدية (Cash Flow Summary)</h3>
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                    <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">إجمالي المقبوضات</span>
                    <span className="block text-2xl font-black text-emerald-600">{(summary.totalIncome + summary.tradeCashIn).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                    <span className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">إجمالي المصروفات</span>
                    <span className="block text-2xl font-black text-red-500">{(summary.totalExpense + summary.tradeCashOut).toLocaleString()}</span>
                </div>
                <div className="bg-blue-900 rounded-2xl p-5 text-center text-white shadow-xl shadow-blue-900/20 col-span-2 flex flex-col justify-center">
                    <span className="block text-[10px] font-black text-blue-300 mb-1 uppercase tracking-widest">صافي السيولة بالعهدة (Cash in Hand)</span>
                    <span className="block text-4xl font-black tracking-tighter">{summary.cashInHand.toLocaleString()} <span className="text-xs opacity-50">ج.م</span></span>
                </div>
            </div>
        </div>

        {/* Debt & Credit Summary */}
        <div className="mb-10 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
                <div>
                   <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">مبالغ مستحقة للشركة (مدينين)</span>
                   <span className="block text-xl font-black text-emerald-900">{summary.customerDebts.toLocaleString()} ج.م</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-400 text-left">Accounts<br/>Receivable</div>
            </div>
            <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 flex items-center justify-between">
                <div>
                   <span className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">مبالغ مستحقة على الشركة (دائنين)</span>
                   <span className="block text-xl font-black text-red-900">{summary.driverDebts.toLocaleString()} ج.م</span>
                </div>
                <div className="text-[10px] font-bold text-red-400 text-left">Accounts<br/>Payable</div>
            </div>
        </div>

        {/* Trade Details Table */}
        {summary.trades.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="font-black text-lg text-slate-800">تفاصيل معاملات التجارة (Trade Journal)</h3>
            </div>
            <table className="w-full text-right text-xs">
                <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <th className="py-3 px-3 rounded-r-xl">النوع</th>
                        <th className="py-3 px-3">العميل / المورد</th>
                        <th className="py-3 px-3">الصنف والكمية</th>
                        <th className="py-3 px-3 text-center">القيمة الإجمالية</th>
                        <th className="py-3 px-3 text-center">المدفوع نقداً</th>
                        <th className="py-3 px-3 rounded-l-xl text-left">المتبقي</th>
                    </tr>
                </thead>
                <tbody className="font-bold text-slate-700 divide-y divide-slate-100">
                    {summary.trades.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className={`py-3 px-3 ${t.tradeDetails?.category === 'sales' ? 'text-blue-600' : 'text-amber-600'}`}>
                                {t.tradeDetails?.category === 'sales' ? 'مبيعات' : 'مشتريات'}
                            </td>
                            <td className="py-3 px-3 text-sm">{t.tradeDetails?.customerName}</td>
                            <td className="py-3 px-3">{t.tradeDetails?.amount} {t.tradeDetails?.unit === 'ton' ? 'طن' : 'ك'} - {t.tradeDetails?.productName}</td>
                            <td className="py-3 px-3 text-center">{t.tradeDetails?.total.toLocaleString()}</td>
                            <td className="py-3 px-3 text-center font-black text-slate-900">{t.tradeDetails?.paidAmount.toLocaleString()}</td>
                            <td className="py-3 px-3 text-left font-black text-blue-900">
                                {(t.tradeDetails!.total - t.tradeDetails!.paidAmount).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}

        {/* Expenses & Income Combined Table */}
        <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-black text-base text-slate-800">المقبوضات (Income)</h3>
               </div>
               <table className="w-full text-right text-xs">
                  <tbody className="divide-y divide-slate-50">
                     {summary.income.map((t) => (
                        <tr key={t.id}>
                           <td className="py-3 px-2 font-bold text-slate-600">{t.clientName}</td>
                           <td className="py-3 px-2 text-left font-black text-emerald-600">{t.amount.toLocaleString()}</td>
                        </tr>
                     ))}
                     {summary.income.length === 0 && <tr><td className="py-4 text-center text-slate-300 italic">لا يوجد سجلات</td></tr>}
                  </tbody>
               </table>
            </div>
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-5 bg-red-500 rounded-full"></div>
                  <h3 className="font-black text-base text-slate-800">المصروفات (Expenses)</h3>
               </div>
               <table className="w-full text-right text-xs">
                  <tbody className="divide-y divide-slate-50">
                     {summary.expense.map((t) => (
                        <tr key={t.id}>
                           <td className="py-3 px-2 font-bold text-slate-600">{t.clientName}</td>
                           <td className="py-3 px-2 text-left font-black text-red-600">{t.amount.toLocaleString()}</td>
                        </tr>
                     ))}
                     {summary.expense.length === 0 && <tr><td className="py-4 text-center text-slate-300 italic">لا يوجد سجلات</td></tr>}
                  </tbody>
               </table>
            </div>
        </div>

        {/* Product Volume Summary */}
        <div className="mb-10 bg-slate-900 text-white rounded-[2rem] p-6">
           <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h4 className="font-black text-sm uppercase tracking-widest">إجمالي كميات المحاصيل (Inventory Movement)</h4>
              <span className="text-[9px] opacity-40 font-bold uppercase">Consolidated Summary</span>
           </div>
           <div className="grid grid-cols-3 gap-6">
              {Object.entries(summary.productSummary).map(([name, vol]) => (
                <div key={name} className="border-r border-white/5 pr-4">
                   <span className="block text-[10px] text-blue-400 font-bold mb-1">{name}</span>
                   <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black">{vol.ton.toLocaleString()}</span>
                      <span className="text-[10px] opacity-50 font-bold">طن</span>
                      {vol.kg > 0 && (
                        <>
                          <span className="text-lg font-black ml-1">/ {vol.kg.toLocaleString()}</span>
                          <span className="text-[10px] opacity-50 font-bold">ك</span>
                        </>
                      )}
                   </div>
                </div>
              ))}
              {Object.keys(summary.productSummary).length === 0 && <p className="col-span-3 text-center py-2 opacity-30 text-xs italic">لا توجد حركة بضائع مسجلة</p>}
           </div>
        </div>

        {/* Official Footer & Signature Area */}
        <div className="mt-auto pt-10 border-t-2 border-slate-100">
            <div className="grid grid-cols-3 gap-10 px-4">
               <div className="text-center">
                  <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-16">إعداد السائق / Prepared By</p>
                  <div className="border-b border-slate-200 w-full mb-2"></div>
                  <p className="font-black text-slate-900 text-sm">{driver.name}</p>
               </div>
               <div className="text-center">
                  <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-16">المراجعة المالية / Auditor</p>
                  <div className="border-b border-slate-200 w-full"></div>
               </div>
               <div className="text-center">
                  <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-16">اعتماد الإدارة / Approval</p>
                  <div className="border-b border-slate-200 w-full"></div>
               </div>
            </div>
            
            <div className="mt-12 text-center">
               <div className="inline-block px-10 py-3 bg-slate-50 rounded-full border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400">
                    صدرت هذه اليومية إلكترونياً وتعتبر مستنداً رسمياً للمحاسبة. 
                    <br/> 
                    Alqabasi Digital Logistics Management System - {new Date().toLocaleString('ar-EG')}
                  </p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};
