
import React, { useState, useEffect, useMemo } from 'react';
import { X, Delete, Check, Calculator as CalcIcon } from 'lucide-react';
import { audioService, SoundType } from '../../services/audioService';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (value: string) => void;
  initialValue?: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialValue = ''
}) => {
  const [expression, setExpression] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setExpression(initialValue || '');
    }
  }, [isOpen, initialValue]);

  const resultPreview = useMemo(() => {
    if (!expression) return '0';
    try {
      // Basic safe arithmetic parser
      // Replaces visual operators with JS operators
      const sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^-0-9+*/.]/g, '');
      
      // Simple evaluator using Function instead of eval for better isolation
      const res = new Function(`return ${sanitized}`)();
      if (isNaN(res) || !isFinite(res)) return 'Error';
      
      // Return raw number as string without fixed precision
      return String(res);
    } catch {
      return '...';
    }
  }, [expression]);

  const handleKey = (key: string) => {
    audioService.play(SoundType.TAP);
    if (key === 'C') {
      setExpression('');
    } else if (key === 'back') {
      setExpression(prev => prev.slice(0, -1));
    } else if (key === '=') {
      const final = resultPreview;
      if (final !== 'Error' && final !== '...') {
        setExpression(final);
      }
    } else {
      // Prevent multiple consecutive operators
      const lastChar = expression.slice(-1);
      const isOp = ['+', '-', '×', '÷'].includes(key);
      const lastIsOp = ['+', '-', '×', '÷'].includes(lastChar);
      
      if (isOp && lastIsOp) {
        setExpression(prev => prev.slice(0, -1) + key);
      } else {
        setExpression(prev => prev + key);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (['+', '-', '.', '*'].includes(e.key)) {
        const keyMap: Record<string, string> = { '*': '×', '/': '÷' };
        handleKey(keyMap[e.key] || e.key);
      }
      if (e.key === 'Enter' || e.key === '=' || e.key === ',') handleKey('=');
      if (e.key === 'Backspace') handleKey('back');
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expression]);

  if (!isOpen) return null;

  const buttons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', 'C', '+']
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Display Area */}
        <div className="bg-slate-900 p-8 text-right">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-blue-400">
              <CalcIcon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">آلة حاسبة ذكية</span>
            </div>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="h-8 text-slate-400 font-mono text-lg overflow-x-auto no-scrollbar" dir="ltr">
            {expression || '0'}
          </div>
          <div className="text-white font-black text-5xl tracking-tighter mt-2" dir="ltr">
            {resultPreview === '...' ? (expression || '0') : resultPreview}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-6 grid grid-cols-4 gap-3 bg-slate-50/50">
          {buttons.flat().map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleKey(btn)}
              className={`h-16 rounded-2xl font-black text-xl transition-all active:scale-90 shadow-sm flex items-center justify-center ${
                ['÷', '×', '-', '+'].includes(btn) 
                  ? 'bg-blue-50 text-blue-600' 
                  : btn === 'C' ? 'bg-red-50 text-red-500' : 'bg-white text-slate-800'
              }`}
            >
              {btn}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKey('back')}
            className="h-16 bg-white rounded-2xl font-black text-xl transition-all active:scale-90 shadow-sm flex items-center justify-center text-slate-400"
          >
            <Delete size={24} />
          </button>
          <button
            type="button"
            onClick={() => handleKey('=')}
            className="h-16 col-span-2 bg-slate-900 text-white rounded-2xl font-black text-xl transition-all active:scale-95 shadow-lg shadow-slate-900/20"
          >
            =
          </button>
          <button
            type="button"
            onClick={() => {
              audioService.play(SoundType.SUCCESS);
              onInsert(resultPreview === 'Error' || resultPreview === '...' ? '0' : resultPreview);
              onClose();
            }}
            className="h-16 bg-blue-600 text-white rounded-2xl font-black text-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center"
          >
            <Check size={28} />
          </button>
        </div>

        <div className="p-4 text-center bg-white border-t border-slate-50">
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Alqabasi Smart Calculator Utility</p>
        </div>
      </div>
    </div>
  );
};
