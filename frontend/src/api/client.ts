import axios from 'axios';

const api = axios.create({ baseURL: '' }); // proxied by Vite dev server

// Attach stored JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Typed helpers ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kycStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Account {
  id: string;
  label: string;
  type: 'FIAT' | 'CRYPTO';
  currency: string;
  balance: string;
  address?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'EXCHANGE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  fromAccountId?: string;
  toAccountId?: string;
  amount: string;
  currency: string;
  fee: string;
  toAmount?: string;
  toCurrency?: string;
  exchangeRate?: string;
  note?: string;
  createdAt: string;
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
};

// Accounts
export const accountsApi = {
  list: () => api.get<Account[]>('/accounts'),
  get: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: { type: 'FIAT' | 'CRYPTO'; currency: string; label: string }) =>
    api.post<Account>('/accounts', data),
};

// Transactions
export const transactionsApi = {
  list: (accountId?: string) =>
    api.get<Transaction[]>('/transactions', { params: accountId ? { accountId } : {} }),
  get: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  deposit: (data: { accountId: string; amount: string }) =>
    api.post<Transaction>('/transactions/deposit', data),
  transfer: (data: { fromAccountId: string; toAccountId: string; amount: string; note?: string }) =>
    api.post<Transaction>('/transactions/transfer', data),
  exchange: (data: { fromAccountId: string; toAccountId: string; amount: string }) =>
    api.post<Transaction>('/transactions/exchange', data),
};

// KYC
export const kycApi = {
  status: () => api.get<{ id: string; kycStatus: string; kycDocType?: string; kycSubmittedAt?: string }>('/kyc'),
  submit: (data: { docType: string; docNumber: string }) => api.post('/kyc/submit', data),
};
