
import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { CalculatorModal } from './CalculatorModal';

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0.00',
  id,
  required = false,
  className = '',
  error
}) => {
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Open on '=' or ',' keys
    if (e.key === '=' || e.key === ',' || (e.key === '=' && e.ctrlKey)) {
      e.preventDefault();
      setIsCalcOpen(true);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex justify-between items-center mb-2 px-6">
        <label htmlFor={id} className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsCalcOpen(true)}
          className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
          title="افتح الآلة الحاسبة (= أو ,)"
        >
          <Calculator size={14} />
          <span className="text-[9px] font-black uppercase tracking-tighter">حاسبة</span>
        </button>
      </div>

      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          required={required}
          min="0"
          step="any"
          value={value}
          onKeyDown={handleKeyDown}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-6 pt-10 pb-4 rounded-[2rem] border-4 outline-none text-5xl font-black tracking-tighter text-left pl-14 transition-all shadow-inner bg-white ${
            error 
              ? 'border-red-500 focus:border-red-600 text-red-900' 
              : 'border-slate-50 focus:border-blue-500 text-slate-900'
          }`}
        />
        <span className="absolute left-6 bottom-6 font-black text-xl text-slate-400">ج.م</span>
      </div>

      {error && (
        <p className="absolute -bottom-6 right-6 text-[10px] font-black text-red-500 animate-bounce">
          {error}
        </p>
      )}

      <CalculatorModal 
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        initialValue={value}
        onInsert={(val) => onChange(val)}
      />
    </div>
  );
};
