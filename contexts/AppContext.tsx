
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Driver, DailyLog, Transaction, TransactionType, DayStatus, SyncQueueItem, SoundSettings, TradeDetails } from '../types';
import { authApi, driverApi, transactionApi } from '../services/api';
import { storage } from '../services/storageService';
import { toast } from '../services/toast';
import { audioService, SoundType } from '../services/audioService';

interface AppContextType {
  driver: Driver | null;
  logs: DailyLog[];
  currentLog: DailyLog | null;
  isLoading: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  login: (mobile: string, password: string) => Promise<boolean>;
  register: (name: string, mobile: string, password: string) => Promise<boolean>;
  startOfflineMode: (name: string, mobile: string) => Promise<void>;
  updateSoundSettings: (settings: SoundSettings) => Promise<void>;
  logout: () => void;
  createDay: () => Promise<void>;
  selectDay: (log: DailyLog | null) => void;
  addTransaction: (clientName: string, amount: number, type: TransactionType) => Promise<boolean>;
  addTradeTransaction: (details: TradeDetails) => Promise<boolean>;
  updateTransaction: (id: string, clientName: string, amount: number, type: TransactionType, tradeDetails?: TradeDetails) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<void>;
  closeDay: () => Promise<void>;
  exportData: () => Promise<void>;
  calculateCurrentBalance: (transactions: Transaction[]) => number;
}

const DEFAULT_SOUNDS: SoundSettings = {
  enabled: true,
  success: true,
  error: true,
  alert: true,
  sync: true,
  tap: true,
  dismiss: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);

  const calculateCurrentBalance = (transactions: Transaction[]) => {
    return transactions.reduce((sum, tx) => {
      if (tx.type === TransactionType.INCOME) return sum + tx.amount;
      if (tx.type === TransactionType.EXPENSE) return sum - tx.amount;
      if (tx.type === TransactionType.TRADE && tx.tradeDetails) {
        const isSales = tx.tradeDetails.category === 'sales';
        const impact = tx.tradeDetails.paidAmount || 0;
        return sum + (isSales ? impact : -impact);
      }
      return sum;
    }, 0);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshFromServer = async () => {
    if (!navigator.onLine || driver?.isOfflineOnly) return;
    try {
      await Promise.all([
        transactionApi.getAll(),
        driverApi.getCurrentDay()
      ]);
      audioService.play(SoundType.SYNC);
    } catch (e) {}
  };

  const performSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing || driver?.isOfflineOnly) return;
    const queue = await storage.getSyncQueue();
    if (queue.length === 0) return;
    setIsSyncing(true);
    audioService.play(SoundType.SYNC);
    setIsSyncing(false);
  }, [isSyncing, driver?.isOfflineOnly]);

  useEffect(() => {
    if (isOnline) performSync();
  }, [isOnline, performSync]);

  useEffect(() => {
    const initApp = async () => {
      const savedDriver = await storage.getDriver();
      const localLogs = await storage.getLogs();
      if (savedDriver) {
        setDriver(savedDriver);
        audioService.init();
        audioService.updateSettings(
          savedDriver.soundSettings?.enabled ?? true,
          savedDriver.soundSettings ?? DEFAULT_SOUNDS
        );
        setLogs(localLogs.sort((a, b) => b.date - a.date));
        if (navigator.onLine && !savedDriver.isOfflineOnly) await refreshFromServer();
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  const login = async (mobile: string, password: string) => {
    audioService.init();
    if (navigator.onLine) {
      try {
        const { data } = await authApi.login(mobile, password);
        const drv: Driver = { 
          name: 'السائق', mobile, token: data.accessToken, isOfflineOnly: false,
          soundSettings: DEFAULT_SOUNDS 
        };
        await storage.saveDriver(drv);
        setDriver(drv);
        audioService.play(SoundType.SUCCESS);
        localStorage.setItem('alqabasi_token', data.accessToken);
        await refreshFromServer();
        return true;
      } catch (e: any) {
        audioService.play(SoundType.ERROR);
        return false; 
      }
    }
    return false;
  };

  const startOfflineMode = async (name: string, mobile: string) => {
    audioService.init();
    const drv: Driver = { name, mobile, isOfflineOnly: true, soundSettings: DEFAULT_SOUNDS };
    await storage.saveDriver(drv);
    setDriver(drv);
    audioService.play(SoundType.SUCCESS);
    const localLogs = await storage.getLogs();
    setLogs(localLogs.sort((a, b) => b.date - a.date));
    toast.info('تم بدء العمل في وضع عدم الاتصال');
  };

  const updateSoundSettings = async (settings: SoundSettings) => {
    if (!driver) return;
    const updated = { ...driver, soundSettings: settings };
    await storage.saveDriver(updated);
    setDriver(updated);
    audioService.updateSettings(settings.enabled, settings);
    audioService.play(SoundType.SUCCESS);
  };

  const register = async (name: string, mobile: string, password: string) => {
    if (navigator.onLine) {
      try {
        await authApi.register(name, name.split(' ')[0], mobile, password);
        audioService.play(SoundType.SUCCESS);
        return true;
      } catch (e) { 
        audioService.play(SoundType.ERROR);
        return false; 
      }
    }
    return false;
  };

  const logout = () => {
    audioService.play(SoundType.ALERT);
    storage.clearDriver();
    localStorage.removeItem('alqabasi_token');
    setDriver(null);
    setLogs([]);
    setCurrentLog(null);
  };

  const createDay = async () => {
    const todayId = new Date().toISOString().split('T')[0];
    const newLog: DailyLog = {
      id: todayId, driverId: driver?.mobile || '0',
      date: Date.now(), status: DayStatus.OPEN, transactions: [],
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(newLog);
    setLogs(prev => [newLog, ...prev]);
    setCurrentLog(newLog);
    audioService.play(SoundType.SUCCESS);
  };

  const addTransaction = async (clientName: string, amount: number, type: TransactionType) => {
    if (!currentLog) return false;
    
    if (type === TransactionType.EXPENSE) {
      const balance = calculateCurrentBalance(currentLog.transactions);
      if (balance < amount) {
        audioService.play(SoundType.ERROR);
        toast.error(`عذراً، الرصيد الحالي غير كافٍ. المتاح: ${balance.toLocaleString()} ج.م`);
        return false;
      }
    }

    const newTx: Transaction = {
      id: storage.generateId(), clientName, amount, type, timestamp: Date.now(),
      isSynced: driver?.isOfflineOnly ? true : false
    };
    const updatedLog = {
      ...currentLog, transactions: [newTx, ...currentLog.transactions],
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(updatedLog);
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    audioService.play(SoundType.SUCCESS);
    return true;
  };

  const addTradeTransaction = async (details: TradeDetails) => {
    if (!currentLog) return false;

    if (details.category === 'purchase') {
      const balance = calculateCurrentBalance(currentLog.transactions);
      if (balance < details.paidAmount) {
        audioService.play(SoundType.ERROR);
        toast.error(`عذراً، الرصيد لا يكفي لدفع هذا المبلغ. المتاح: ${balance.toLocaleString()} ج.م`);
        return false;
      }
    }

    const newTx: Transaction = {
      id: storage.generateId(),
      clientName: details.customerName,
      amount: details.total,
      type: TransactionType.TRADE,
      timestamp: Date.now(),
      isSynced: driver?.isOfflineOnly ? true : false,
      tradeDetails: details
    };
    const updatedLog = {
      ...currentLog, transactions: [newTx, ...currentLog.transactions],
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(updatedLog);
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    audioService.play(SoundType.SUCCESS);
    return true;
  };

  const updateTransaction = async (id: string, clientName: string, amount: number, type: TransactionType, tradeDetails?: TradeDetails) => {
    if (!currentLog) return false;

    // To validate update, we check if the new balance would be negative
    const currentTransactions = currentLog.transactions;
    const oldTx = currentTransactions.find(t => t.id === id);
    if (!oldTx) return false;

    // Calculate hypothetical balance
    const filtered = currentTransactions.filter(t => t.id !== id);
    const newTxObj: Transaction = { ...oldTx, clientName, amount, type, tradeDetails };
    const predictedBalance = calculateCurrentBalance([...filtered, newTxObj]);

    if (predictedBalance < 0) {
      audioService.play(SoundType.ERROR);
      toast.error(`لا يمكن تعديل الحركة لأن ذلك سيؤدي إلى رصيد سالب (${predictedBalance.toLocaleString()} ج.م)`);
      return false;
    }

    const updatedTransactions = currentLog.transactions.map(tx => 
      tx.id === id ? { ...tx, clientName, amount, type, tradeDetails, isSynced: driver?.isOfflineOnly ? true : false } : tx
    );
    const updatedLog = {
      ...currentLog,
      transactions: updatedTransactions,
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(updatedLog);
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    audioService.play(SoundType.SUCCESS);
    toast.success('تم تحديث الحركة');
    return true;
  };

  const deleteTransaction = async (id: string) => {
    if (!currentLog) return;

    // Validate deletion impact on balance
    const filtered = currentLog.transactions.filter(t => t.id !== id);
    const predictedBalance = calculateCurrentBalance(filtered);

    if (predictedBalance < 0) {
      audioService.play(SoundType.ERROR);
      toast.error(`لا يمكن حذف هذه الحركة لأنها توفر رصيداً لحركات أخرى. الرصيد سيصبح: ${predictedBalance.toLocaleString()} ج.م`);
      return;
    }

    const updatedTransactions = filtered;
    const updatedLog = {
      ...currentLog,
      transactions: updatedTransactions,
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(updatedLog);
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    audioService.play(SoundType.ALERT);
    toast.success('تم حذف الحركة');
  };

  const closeDay = async () => {
    if (!currentLog) return;
    const updatedLog: DailyLog = {
      ...currentLog, status: DayStatus.CLOSED, closedAt: Date.now(),
      isSynced: driver?.isOfflineOnly ? true : false
    };
    await storage.saveLog(updatedLog);
    setCurrentLog(updatedLog);
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
    audioService.play(SoundType.ALERT);
  };

  return (
    <AppContext.Provider value={{
      driver, logs, currentLog, isLoading, isOnline, isSyncing,
      login, register, startOfflineMode, updateSoundSettings, logout, createDay, selectDay: setCurrentLog,
      addTransaction, addTradeTransaction, updateTransaction, deleteTransaction, closeDay, exportData: async () => {
          const data = JSON.stringify(logs, null, 2);
          await navigator.clipboard.writeText(data);
          audioService.play(SoundType.SUCCESS);
          toast.success('تم النسخ');
      },
      calculateCurrentBalance
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
