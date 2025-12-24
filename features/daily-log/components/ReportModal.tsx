
import React, { useMemo, useState } from 'react';
import { DailyLog, Driver, TransactionType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { X, Copy, Printer, Check, Share2, FileText, Download, FileSpreadsheet, Table, Share } from 'lucide-react';

declare var XLSX: any; // Global SheetJS

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLog;
  driver: Driver;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  log,
  driver
}) => {
  const [copied, setCopied] = useState(false);

  const dateObj = new Date(log.date);
  const fullDateStr = dateObj.toLocaleDateString('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const yearStr = dateObj.getFullYear().toString();

  // Comprehensive Data structure for exports
  const detailedData = useMemo(() => {
    return log.transactions.map((t, idx) => {
      const isTrade = t.type === TransactionType.TRADE;
      const isSales = t.tradeDetails?.category === 'sales';
      
      let typeLabel = '';
      if (t.type === TransactionType.INCOME) typeLabel = 'وارد';
      else if (t.type === TransactionType.EXPENSE) typeLabel = 'مصروف';
      else typeLabel = isSales ? 'تجارة (بيع)' : 'تجارة (شراء)';

      return {
        '#': idx + 1,
        'النوع': typeLabel,
        'البيان / العميل': t.clientName,
        'الصنف': t.tradeDetails?.productName || '-',
        'الكمية': t.tradeDetails ? `${t.tradeDetails.amount} ${t.tradeDetails.unit}` : '-',
        'سعر الوحدة': t.tradeDetails?.price || '-',
        'إجمالي القيمة': t.amount.toLocaleString(),
        'المدفوع نقداً': t.tradeDetails ? t.tradeDetails.paidAmount.toLocaleString() : t.amount.toLocaleString(),
        'المتبقي': t.tradeDetails ? (t.tradeDetails.total - t.tradeDetails.paidAmount).toLocaleString() : '0',
        'الوقت': new Date(t.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
    });
  }, [log.transactions]);

  const reportText = useMemo(() => {
    const income = log.transactions.filter(t => t.type === TransactionType.INCOME);
    const expense = log.transactions.filter(t => t.type === TransactionType.EXPENSE);
    const trades = log.transactions.filter(t => t.type === TransactionType.TRADE);
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);
    const tradeImpact = trades.reduce((sum, t) => {
        const isSales = t.tradeDetails?.category === 'sales';
        const impact = t.tradeDetails?.paidAmount || 0;
        return sum + (isSales ? impact : -impact);
    }, 0);
    const net = totalIncome - totalExpense + tradeImpact;

    let text = `📄 *تقرير يومية - شركة القبسي*\n`;
    text += `👤 السائق: ${driver.name}\n`;
    text += `📱 موبايل: ${driver.mobile}\n`;
    text += `📅 التاريخ: ${fullDateStr}\n`;
    text += `🗓️ السنة: ${yearStr}\n`;
    text += `------------------------\n\n`;
    
    if (trades.length > 0) {
      text += `🏢 *معاملات التجارة*\n`;
      trades.forEach((t, i) => {
        const d = t.tradeDetails!;
        text += `${i+1}. ${d.category === 'sales' ? 'بيع' : 'شراء'} ${d.productName}: ${d.amount}${d.unit} | لـ ${d.customerName}\n`;
        text += `   إجمالي: ${d.total.toLocaleString()} | مدفوع: ${d.paidAmount.toLocaleString()}\n`;
      });
      text += `\n`;
    }

    text += `🟢 *المقبوضات (الوارد)*\n`;
    if (income.length === 0) text += `(لا يوجد)\n`;
    income.forEach((t, i) => {
      text += `${i+1}. ${t.clientName}: ${t.amount.toLocaleString()} ج.م\n`;
    });
    text += `\n`;
    
    text += `🔴 *المصروفات*\n`;
    if (expense.length === 0) text += `(لا يوجد)\n`;
    expense.forEach((t, i) => {
      text += `${i+1}. ${t.clientName}: ${t.amount.toLocaleString()} ج.م\n`;
    });
    text += `\n`;
    
    text += `📊 *الخلاصة المالية*\n`;
    text += `سيولة بالعهدة: ${net.toLocaleString()} ج.م\n`;
    text += `------------------------\n`;
    text += `تم الاستخراج بواسطة تطبيق القبسي الرقمي`;
    
    return text;
  }, [log, driver, fullDateStr, yearStr]);

  /**
   * Helper to share a file via Web Share API
   */
  const shareFile = async (blob: Blob, fileName: string, title: string) => {
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: `تقرير يومية القبسي - ${fileName}`,
        });
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
        return false;
      }
    }
    return false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, '_blank');
  };

  const handleCSVExport = async () => {
    const headers = Object.keys(detailedData[0] || {}).join(',');
    const rows = detailedData.map(row => Object.values(row).join(',')).join('\n');
    const headerInfo = `السائق,${driver.name}\nالهاتف,${driver.mobile}\nالتاريخ,${fullDateStr}\nالسنة,${yearStr}\n\n`;
    const csvContent = "\uFEFF" + headerInfo + headers + '\n' + rows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `alqabasi_report_${log.id}.csv`;

    const shared = await shareFile(blob, fileName, 'تقرير CSV');
    if (!shared) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }
  };

  const handleXLSXExport = async () => {
    if (typeof XLSX === 'undefined') return;

    // Create a worksheet
    const finalWS = XLSX.utils.aoa_to_sheet([
        ["تقرير يومية شركة القبسي"],
        ["السائق:", driver.name],
        ["الهاتف:", driver.mobile],
        ["التاريخ:", fullDateStr],
        ["السنة:", yearStr],
        [""],
        Object.keys(detailedData[0] || {}),
        ...detailedData.map(row => Object.values(row))
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, finalWS, "اليومية");
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `alqabasi_report_${log.id}.xlsx`;

    const shared = await shareFile(blob, fileName, 'تقرير Excel');
    if (!shared) {
      XLSX.writeFile(wb, fileName);
    }
  };

  const handleTXTDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `alqabasi_report_${log.id}.txt`;
    element.click();
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="تصدير التقرير التفصيلي"
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="text-blue-600" aria-hidden="true" />
              تصدير التقارير
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily Log Export Center</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white rounded-2xl hover:bg-slate-200 transition-all shadow-sm active:scale-90"
            aria-label="إغلاق"
          >
            <X size={20} className="text-slate-900" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          
          <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-3xl p-5">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">معاينة النص (للمشاركة السريعة)</p>
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-blue-50 shadow-inner max-h-40 overflow-y-auto custom-scrollbar" tabIndex={0}>
              {reportText}
            </pre>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {/* Main PDF Export */}
             <Button onClick={handlePrint} variant="primary" fullWidth className="py-6 rounded-[1.8rem] shadow-xl shadow-blue-600/20 group">
                <Printer size={24} className="group-hover:animate-pulse" />
                <div className="text-right">
                    <span className="block font-black text-lg">تصدير PDF رسمي</span>
                    <span className="block text-[10px] opacity-60 font-bold uppercase tracking-tighter">Professional Printable Document</span>
                </div>
             </Button>

             <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleXLSXExport} variant="secondary" className="rounded-2xl py-5 border-emerald-100 hover:bg-emerald-50 text-emerald-700 flex flex-col items-center gap-1">
                   <div className="flex items-center gap-2">
                      <FileSpreadsheet size={20} />
                      <span className="font-black text-sm">ملف Excel</span>
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-50">مشاركة أو حفظ</span>
                </Button>
                <Button onClick={handleCSVExport} variant="secondary" className="rounded-2xl py-5 border-blue-100 hover:bg-blue-50 text-blue-700 flex flex-col items-center gap-1">
                   <div className="flex items-center gap-2">
                      <Table size={20} />
                      <span className="font-black text-sm">ملف CSV</span>
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-50">مشاركة أو حفظ</span>
                </Button>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleTXTDownload} variant="outline" className="rounded-2xl py-4 text-slate-500 border-slate-200">
                   <Download size={20} />
                   <span className="font-black text-sm">نص TXT</span>
                </Button>
                <Button onClick={handleCopy} variant="outline" className={`rounded-2xl py-4 transition-all ${copied ? 'border-emerald-500 text-emerald-600' : 'text-slate-500 border-slate-200'}`}>
                   {copied ? <Check size={20} /> : <Copy size={20} />}
                   <span className="font-black text-sm">{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                </Button>
             </div>

             <Button onClick={handleWhatsApp} variant="success" fullWidth className="py-5 rounded-2xl shadow-lg shadow-emerald-600/10 group">
                <Share2 size={22} className="group-hover:scale-110 transition-transform" />
                <span className="font-black">مشاركة النص عبر واتساب</span>
             </Button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Share size={10} />
              Exports support direct sharing to WhatsApp & Email
            </p>
        </div>
      </div>
    </div>
  );
};
