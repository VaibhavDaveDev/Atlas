import { tokenStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

const getAuthHeaders = () => {
  const workspace = tokenStorage.getWorkspace();
  const workspaceId = (workspace as any)?.workspaceId || (workspace as any)?.id;

  return {
    'Content-Type': 'application/json',
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
  };
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  return await response.json();
}

export async function getAccounts() {
  return await fetchWithAuth('/finance/accounts');
}

export async function createAccount(data: any) {
  return await fetchWithAuth('/finance/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getJournalEntries() {
  return await fetchWithAuth('/finance/journals');
}

export async function getJournalEntry(id: string) {
  return await fetchWithAuth(`/finance/journals/${id}`);
}

export async function createJournalEntry(data: any) {
  return await fetchWithAuth('/finance/journals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInvoices() {
  return await fetchWithAuth('/finance/invoices');
}

export async function getInvoice(id: string) {
  return await fetchWithAuth(`/finance/invoices/${id}`);
}

export async function createInvoice(data: any) {
  return await fetchWithAuth('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function postInvoice(id: string) {
  return await fetchWithAuth(`/finance/invoices/${id}/post`, {
    method: 'PATCH',
  });
}

export async function getPayments() {
  return await fetchWithAuth('/finance/payments');
}

export async function getPayment(id: string) {
  return await fetchWithAuth(`/finance/payments/${id}`);
}

export async function createPayment(data: any) {
  return await fetchWithAuth('/finance/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reconcilePayment(id: string) {
  return await fetchWithAuth(`/finance/payments/${id}/reconcile`, {
    method: 'POST',
  });
}

export async function getBalanceSheet() {
  return await fetchWithAuth('/finance/reports/balance-sheet');
}

export async function getDashboardStats() {
  return await fetchWithAuth('/finance/reports/dashboard');
}

export async function getProfitLoss(startDate: string, endDate: string) {
  return await fetchWithAuth(`/finance/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);
}

export async function getCashFlow(startDate: string, endDate: string) {
  return await fetchWithAuth(`/finance/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
}

export async function getPeriods() {
  return await fetchWithAuth('/finance/periods');
}

export async function closePeriod(data: { name: string, startDate: string, endDate: string }) {
  return await fetchWithAuth('/finance/periods/close', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function setupFinance(data: { baseCurrency: string, fiscalYearStart: string }) {
  return await fetchWithAuth('/finance/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExchangeRate(base: string, quote: string, date?: string) {
  let url = `/finance/exchange-rates?base=${base}&quote=${quote}`;
  if (date) url += `&date=${date}`;
  return await fetchWithAuth(url);
}

export async function getSupportedCurrencies() {
  return await fetchWithAuth('/finance/exchange-rates/currencies');
}

