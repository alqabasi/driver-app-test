
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRADE = 'trade'
}

export type TradeCategory = 'sales' | 'purchase';
export type WeightUnit = 'KG' | 'ton';

export interface ExpenseItem {
  id: string;
  label: string;
  value: number;
}

export interface TradeDetails {
  category: TradeCategory;
  productName: string;
  amount: number;
  unit: WeightUnit;
  price: number;
  customerName: string;
  image?: string; // base64 encoded
  expenses: ExpenseItem[];
  total: number;
  paidAmount: number; // initial payment received/paid
}

export interface Transaction {
  id: string;
  clientName: string; // Acts as summary or customer name
  amount: number;    // For simple tx: the amount. For trade: the total.
  type: TransactionType;
  timestamp: number;
  isSynced?: boolean; 
  localId?: string;
  tradeDetails?: TradeDetails; // Optional details for trade type
}

export enum DayStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

export interface DailyLog {
  id: string; // YYYY-MM-DD
  driverId: string;
  date: number;
  status: DayStatus;
  transactions: Transaction[];
  closedAt?: number;
  isSynced?: boolean;
}

export interface SoundSettings {
  enabled: boolean;
  success: boolean;
  error: boolean;
  alert: boolean;
  sync: boolean;
  tap: boolean;
  dismiss: boolean;
  [key: string]: boolean;
}

export interface Driver {
  id?: number;
  mobile: string;
  name: string;
  token?: string;
  isOfflineOnly?: boolean;
  soundSettings?: SoundSettings;
}

export interface SyncQueueItem {
  id: string;
  action: 'OPEN_DAY' | 'CLOSE_DAY' | 'CREATE_TRANSACTION';
  payload: any;
  timestamp: number;
}
