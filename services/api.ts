
import axios from "axios";
import { toast } from "./toast";

// Updated to the guide's base URL while maintaining fallback support
const BASE_URL = "https://api.drivers.alqabasy.online/api/v1";

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 8000 // Fast timeout to trigger offline mode quickly if network is sluggish
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("alqabasi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => {
    const feedback = response.data?.feedback || response.data?.message;
    const method = response.config.method?.toUpperCase();

    if (feedback && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
      toast.success(feedback);
    }

    return response;
  },
  (error) => {
    // If it's a network error (no response) and we're offline, don't show toast as AppContext handles it
    if (!error.response && !navigator.onLine) {
      return Promise.reject({ ...error, isNetworkError: true });
    }

    const feedback = error.response?.data?.feedback || error.response?.data?.message;
    if (feedback) {
      toast.error(feedback);
    }

    return Promise.reject(error);
  }
);

export interface ApiLoginResponse {
  accessToken: string;
  feedback?: string;
}

export interface ApiTransaction {
  id: number;
  driver_id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  timestamp: string;
}

export interface ApiDay {
  id: number;
  driver_id: number;
  date: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
}

export const authApi = {
  login: (mobile: string, password: string) =>
    http.post<ApiLoginResponse>("/auth/login", { mobile, password }),

  register: (fullName: string, shortName: string, mobile: string, password: string) =>
    http.post("/auth/register", { fullName, shortName, mobile, password }),

  logout: () => http.post("/auth/logout"),
  refresh: () => http.post<{ accessToken: string }>("/auth/refresh")
};

export const driverApi = {
  openDay: () => http.post<ApiDay>("/driver/day/open"),
  closeDay: () => http.post<ApiDay>("/driver/day/close"),
  getCurrentDay: () => http.get<ApiDay>("/driver/day/current")
};

export const transactionApi = {
  create: (amount: number, type: string, description: string) =>
    http.post<ApiTransaction>("/transactions", { amount, type, description }),

  getAll: () => http.get<ApiTransaction[]>("/transactions")
};

export default http;
