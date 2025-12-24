
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TradeCategory, WeightUnit, ExpenseItem, TradeDetails } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { X, Check, Save, ShoppingCart, Truck, Plus, Trash2, Camera, User, Package, Calculator, Banknote, Wallet } from 'lucide-react';
import { audioService, SoundType } from '../../../services/audioService';
import { storage } from '../../../services/storageService';
import { useApp } from '../../../contexts/AppContext';
import { MoneyInput } from '../../../components/ui/MoneyInput';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: TradeDetails) => void;
  initialData?: TradeDetails | null;
}

const PRODUCTS = ['ارز ابيض', 'ارز عريض', 'ارز شعير', 'اخري'];

export const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialData
}) => {
  const { currentLog, calculateCurrentBalance } = useApp();
  const [category, setCategory] = useState<TradeCategory>('sales');
  const [productName, setProductName] = useState(PRODUCTS[0]);
  const [customProduct, setCustomProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('ton');
  const [price, setPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [image, setImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);

  const currentWalletBalance = useMemo(() => {
    if (!currentLog) return 0;
    const filtered = initialData 
      ? currentLog.transactions.filter(tx => tx.tradeDetails?.customerName !== initialData.customerName || tx.amount !== initialData.total)
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
        setCategory(initialData.category);
        setProductName(PRODUCTS.includes(initialData.productName) ? initialData.productName : 'اخري');
        if (!PRODUCTS.includes(initialData.productName)) setCustomProduct(initialData.productName);
        setAmount(initialData.amount.toString());
        setUnit(initialData.unit);
        setPrice(initialData.price.toString());
        setCustomerName(initialData.customerName);
        setExpenses(initialData.expenses);
        setPaidAmount(initialData.paidAmount.toString());
        setImage(initialData.image || null);
      } else {
        setCategory('sales');
        setProductName(PRODUCTS[0]);
        setCustomProduct('');
        setAmount('');
        setUnit('ton');
        setPrice('');
        setCustomerName('');
        setExpenses([]);
        setPaidAmount('');
        setImage(null);
      }
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, initialData]);

  const totalCalculated = useMemo(() => {
    const baseTotal = (Number(amount) || 0) * (Number(price) || 0);
    const expensesTotal = expenses.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
    return baseTotal - expensesTotal;
  }, [amount, price, expenses]);

  const addExpense = () => {
    audioService.play(SoundType.TAP);
    setExpenses([...expenses, { id: storage.generateId(), label: '', value: 0 }]);
  };

  const removeExpense = (id: string) => {
    audioService.play(SoundType.TAP);
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, val: any) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        audioService.play(SoundType.SUCCESS);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount || !price) return;

    const finalProductName = productName === 'اخري' ? customProduct : productName;
    
    onSubmit({
      category,
      productName: finalProductName,
      amount: Number(amount),
      unit,
      price: Number(price),
      customerName,
      image: image || undefined,
      expenses,
      total: totalCalculated,
      paidAmount: Number(paidAmount) || 0
    });
  };

  if (!isOpen) return null;

  const isPurchase = category === 'purchase';
  const hasInsufficientFunds = isPurchase && Number(paidAmount) > currentWalletBalance;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-modal-title"
    >
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500 relative z-10 flex flex-col max-h-[95vh]">
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
          <div>
            <h3 id="trade-modal-title" className="text-2xl font-black text-slate-900 tracking-tight">معاملة تجارة</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <Wallet size={12} className="text-slate-400" />
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">المتاح للصرف: {currentWalletBalance.toLocaleString()} ج.م</span>
            </div>
          </div>
          <button onClick={handleClose} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all" aria-label="إغلاق">
            <X size={20} className="text-slate-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto no-scrollbar pb-32">
          
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-[2rem]">
            <button
              type="button"
              onClick={() => setCategory('sales')}
              className={`flex items-center justify-center gap-2 py-4 rounded-[1.6rem] font-black text-sm transition-all ${category === 'sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <ShoppingCart size={18} /> مبيعات
            </button>
            <button
              type="button"
              onClick={() => setCategory('purchase')}
              className={`flex items-center justify-center gap-2 py-4 rounded-[1.6rem] font-black text-sm transition-all ${category === 'purchase' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Truck size={18} /> مشتريات
            </button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="customer-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                <User size={12} /> اسم العميل / المورد
              </label>
              <input
                id="customer-name"
                ref={initialInputRef}
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="مثال: الحاج سيد ارز"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label htmlFor="product-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-2">
                    <Package size={12} /> الصنف
                 </label>
                 <select
                    id="product-select"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none"
                 >
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>
              {productName === 'اخري' && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">اسم الصنف</label>
                   <input
                      type="text"
                      required
                      value={customProduct}
                      onChange={e => setCustomProduct(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none"
                   />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">الكمية</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black outline-none"
                    />
                    <select 
                      value={unit}
                      onChange={e => setUnit(e.target.value as WeightUnit)}
                      className="absolute left-2 top-2 bottom-2 bg-white border border-slate-200 rounded-xl px-2 font-black text-xs outline-none"
                      aria-label="وحدة القياس"
                    >
                      <option value="ton">طن</option>
                      <option value="KG">كيلو</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">السعر للوحدة</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black outline-none"
                  />
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm">المصاريف والخصومات</h4>
                  <button 
                    type="button"
                    onClick={addExpense}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase"
                  >
                    <Plus size={14} /> إضافة بند
                  </button>
               </div>
               {expenses.length === 0 && <p className="text-center py-4 bg-slate-50 rounded-2xl text-slate-300 text-xs font-bold border-2 border-dashed border-slate-100">لا توجد مصاريف إضافية</p>}
               {expenses.map((exp) => (
                 <div key={exp.id} className="flex gap-2 animate-in slide-in-from-right-2">
                    <input
                      placeholder="وصف البند"
                      value={exp.label}
                      onChange={e => updateExpense(exp.id, 'label', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none"
                      aria-label="وصف المصروف"
                    />
                    <input
                      type="number"
                      placeholder="القيمة"
                      value={exp.value || ''}
                      onChange={e => updateExpense(exp.id, 'value', Number(e.target.value))}
                      className="w-24 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-black text-sm outline-none text-left"
                      aria-label="قيمة المصروف"
                    />
                    <button type="button" onClick={() => removeExpense(exp.id)} className="p-3 text-red-400 hover:text-red-600" aria-label="حذف المصروف">
                      <Trash2 size={18} />
                    </button>
                 </div>
               ))}
            </div>

            <div className={`p-6 rounded-[2rem] text-white transition-colors duration-500 ${hasInsufficientFunds ? 'bg-red-900' : 'bg-slate-900'}`}>
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">صافي الحساب</span>
                    <span className="text-3xl font-black tracking-tighter">{totalCalculated.toLocaleString()} <span className="text-xs opacity-50">ج.م</span></span>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                     <Calculator size={24} className={hasInsufficientFunds ? "text-red-400" : "text-blue-400"} />
                  </div>
               </div>

               <div className="space-y-3">
                  <MoneyInput 
                    value={paidAmount}
                    onChange={setPaidAmount}
                    label={category === 'sales' ? 'المبلغ المستلم' : 'المبلغ المدفوع'}
                    error={hasInsufficientFunds ? "خطأ: الرصيد غير كافٍ!" : undefined}
                    className="!px-0"
                  />
                  {!hasInsufficientFunds && (
                    <p className="text-[10px] text-slate-500 font-bold text-center">
                      {category === 'sales' ? 'المتبقي علي العميل: ' : 'المتبقي للعميل: '}
                      {(totalCalculated - (Number(paidAmount) || 0)).toLocaleString()} ج.م
                    </p>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="font-black text-slate-800 text-sm">صورة الفاتورة / المستند</h4>
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative"
                  role="button"
                  aria-label="التقاط صورة للفاتورة"
               >
                  {image ? (
                    <img src={image} className="w-full h-full object-cover" alt="الفاتورة الملتقطة" />
                  ) : (
                    <>
                      <Camera size={32} className="text-slate-300 mb-2" />
                      <span className="text-xs font-black text-slate-400">التقط صورة للفاتورة</span>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
               </div>
            </div>
          </div>
        </form>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-slate-50">
          <Button 
            type="submit" 
            fullWidth 
            size="xl" 
            onClick={handleSubmit} 
            disabled={hasInsufficientFunds}
            className="rounded-[2rem] py-6 shadow-2xl"
          >
            {initialData ? <Save size={24} /> : <Check size={24} />}
            <span>حفظ المعاملة</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
