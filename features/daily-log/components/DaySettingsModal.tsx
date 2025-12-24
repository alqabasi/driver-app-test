
import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { X, Lock, User, Phone, Info, Volume2, VolumeX, Check, MousePointer2, XCircle } from 'lucide-react';
import { Driver, SoundSettings } from '../../../types';
import { DeveloperInfoModal } from '../../../components/DeveloperInfoModal';
import { useApp } from '../../../contexts/AppContext';
import { audioService, SoundType } from '../../../services/audioService';

interface DaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseDay: () => void;
  driver: Driver;
  isDayClosed: boolean;
}

export const DaySettingsModal: React.FC<DaySettingsModalProps> = ({
  isOpen,
  onClose,
  onCloseDay,
  driver,
  isDayClosed
}) => {
  const [isDevInfoOpen, setIsDevInfoOpen] = useState(false);
  const { updateSoundSettings } = useApp();
  
  const sounds = driver.soundSettings || {
    enabled: true, success: true, error: true, alert: true, sync: true, tap: true, dismiss: true
  };

  const handleClose = () => {
    audioService.play(SoundType.DISMISS);
    onClose();
  };

  const toggleSound = (key: keyof SoundSettings) => {
    const newSettings = { ...sounds, [key]: !sounds[key] };
    updateSoundSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
      >
        <div 
          className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-xl font-bold text-gray-800">الإعدادات والملف الشخصي</h3>
            <button 
              onClick={handleClose} 
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Driver Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold">السائق الحالي</p>
                  <h4 className="text-lg font-bold text-slate-800">{driver.name}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mr-2">
                 <Phone size={16} />
                 <span className="font-medium dir-ltr">{driver.mobile}</span>
              </div>
            </div>

            {/* Sound Preferences Section */}
            <div>
               <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-gray-500 font-bold text-sm flex items-center gap-2">
                     <Volume2 size={16} />
                     تفضيلات الصوت
                  </h4>
                  <button 
                    onClick={() => toggleSound('enabled')}
                    className={`text-xs font-black px-3 py-1 rounded-full transition-all ${sounds.enabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {sounds.enabled ? 'مفعل' : 'معطل'}
                  </button>
               </div>
               
               <div className={`space-y-3 transition-opacity ${sounds.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <Check size={18} className="text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">أصوات النجاح والحفظ</span>
                     </div>
                     <button 
                        onClick={() => toggleSound('success')}
                        className={`w-12 h-6 rounded-full relative transition-colors ${sounds.success ? 'bg-emerald-500' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sounds.success ? 'right-7' : 'right-1'}`} />
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <MousePointer2 size={18} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-700">صوت ضغط الأزرار</span>
                     </div>
                     <button 
                        onClick={() => toggleSound('tap')}
                        className={`w-12 h-6 rounded-full relative transition-colors ${sounds.tap ? 'bg-blue-600' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sounds.tap ? 'right-7' : 'right-1'}`} />
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <XCircle size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">صوت إغلاق النوافذ</span>
                     </div>
                     <button 
                        onClick={() => toggleSound('dismiss')}
                        className={`w-12 h-6 rounded-full relative transition-colors ${sounds.dismiss ? 'bg-slate-400' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sounds.dismiss ? 'right-7' : 'right-1'}`} />
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <Lock size={18} className="text-blue-900" />
                        <span className="text-sm font-bold text-slate-700">تنبيهات الإغلاق والحذف</span>
                     </div>
                     <button 
                        onClick={() => toggleSound('alert')}
                        className={`w-12 h-6 rounded-full relative transition-colors ${sounds.alert ? 'bg-blue-600' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sounds.alert ? 'right-7' : 'right-1'}`} />
                     </button>
                  </div>
               </div>
            </div>

            <hr className="border-gray-100" />

            {/* Actions */}
            <div>
              <h4 className="text-gray-500 font-bold mb-3 text-sm">إجراءات الوردية</h4>
              {!isDayClosed ? (
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => {
                    handleClose();
                    setTimeout(() => onCloseDay(), 100);
                  }}
                  className="bg-slate-800 hover:bg-slate-900"
                >
                  <Lock size={20} />
                  تقفيل اليومية نهائياً
                </Button>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-xl text-gray-500 font-medium flex items-center justify-center gap-2">
                  <Lock size={16} />
                  هذه اليومية مغلقة
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
               <button 
                  onClick={() => {
                    audioService.play(SoundType.TAP);
                    setIsDevInfoOpen(true);
                  }}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-50 px-3 py-2 rounded-full transition-colors"
               >
                  <Info size={14} />
                  <span>عن التطبيق والمطور</span>
               </button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10" onClick={handleClose}></div>
      </div>

      <DeveloperInfoModal isOpen={isDevInfoOpen} onClose={() => {
        audioService.play(SoundType.DISMISS);
        setIsDevInfoOpen(false);
      }} />
    </>
  );
};
