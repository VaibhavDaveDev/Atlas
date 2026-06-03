import { tokenStorage, refreshToken as refreshAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  let token = tokenStorage.getAccessToken();
  if (!token) throw new Error('No authentication token found');

  const getHeaders = (t: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${t}`,
    ...options.headers,
  });

  const headers = getHeaders(token);

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (currentRefreshToken) {
      try {
        const refreshResponse = await refreshAuthToken(currentRefreshToken);
        if (refreshResponse?.data?.accessToken) {
          tokenStorage.setAccessToken(refreshResponse.data.accessToken);
          token = refreshResponse.data.accessToken;
          // Retry request
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: getHeaders(token as string),
          });
        }
      } catch (e) {
        // Refresh failed, fall through to error handling
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }

  const result = await response.json();
  // Standardize result structure if needed, or return as is if API always returns { success, data, error }
  return result;
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

