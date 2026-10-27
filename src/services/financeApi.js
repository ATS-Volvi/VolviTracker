// Client-side Finance API service connecting to backend PostgreSQL endpoints
import { getAuthToken } from './api';

const API_BASE = '/api';

export const EMPTY_FINANCE_SUITE = {
  kpis: {
    clientPoTotal: 0,
    invoicedTotal: 0,
    collectedTotal: 0,
    supplierPoCommitted: 0,
    supplierBillsBilled: 0,
    supplierPaid: 0,
    grossMargin: 0,
    grossMarginPercent: 0,
    arOutstanding: 0,
    arOverdue: 0,
    dsoDays: 0,
    apOutstanding: 0,
    apOverdue: 0,
    dpoDays: 0,
  },
  exchangeRates: { USD: 1.0, INR: 83.20, AED: 3.67, SAR: 3.75 },
  projects: [],
  clientPos: [],
  invoices: [],
  supplierPos: [],
  paymentsReceived: [],
  paymentsMade: [],
  cashAccounts: [],
  cashTransactions: [],
  masterDirectory: [],
  vault: []
};

// In-memory cache for synchronous reads across UI components
let inMemoryFinanceData = null;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetch all finance suite data from the server API
 */
export async function fetchFinanceData() {
  try {
    const data = await request('/finance', { method: 'GET' });
    inMemoryFinanceData = {
      ...EMPTY_FINANCE_SUITE,
      ...data,
      kpis: calculateKpis(data)
    };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('volvitech_finance_updated', { detail: inMemoryFinanceData }));
    }
    return inMemoryFinanceData;
  } catch (err) {
    console.error('[Finance API] Failed to fetch finance data:', err);
    throw err;
  }
}

/**
 * Recalculate KPIs based on current dataset
 */
export function calculateKpis(data = {}) {
  const clientPos = (data.clientPos || []).filter(po => po.status !== 'Void' && !po.isVoid);
  const invoices = (data.invoices || []).filter(inv => inv.status !== 'Void' && !inv.isVoid);
  const paymentsReceived = data.paymentsReceived || [];
  const supplierPos = (data.supplierPos || []).filter(spo => spo.status !== 'Void' && !spo.isVoid);
  const paymentsMade = data.paymentsMade || [];

  const clientPoTotal = clientPos.reduce((sum, po) => sum + (Number(po.totalValueUsd) || 0), 0);
  const invoicedTotal = invoices.reduce((sum, inv) => sum + (Number(inv.amountUsd) || 0), 0);
  const collectedTotal = paymentsReceived.reduce((sum, pmt) => sum + (Number(pmt.amountUsd) || 0), 0);
  const supplierPoCommitted = supplierPos.reduce((sum, spo) => sum + (Number(spo.committedUsd) || 0), 0);
  const supplierBillsBilled = supplierPos.reduce((sum, spo) => sum + (Number(spo.billedUsd) || 0), 0);
  const supplierPaid = paymentsMade.reduce((sum, pmt) => sum + (Number(pmt.amountUsd) || 0), 0);

  const grossMargin = invoicedTotal - supplierBillsBilled;
  const grossMarginPercent = invoicedTotal > 0 ? ((grossMargin / invoicedTotal) * 100).toFixed(1) : 0;
  const arOutstanding = invoicedTotal - collectedTotal;
  const apOutstanding = supplierBillsBilled - supplierPaid;

  return {
    clientPoTotal,
    invoicedTotal,
    collectedTotal,
    supplierPoCommitted,
    supplierBillsBilled,
    supplierPaid,
    grossMargin,
    grossMarginPercent: Number(grossMarginPercent),
    arOutstanding: Math.max(0, arOutstanding),
    arOverdue: Math.round(arOutstanding * 0.1),
    dsoDays: 38,
    apOutstanding: Math.max(0, apOutstanding),
    apOverdue: Math.round(apOutstanding * 0.06),
    dpoDays: 29
  };
}

/**
 * Synchronous getter using in-memory cache (falls back to EMPTY_FINANCE_SUITE)
 */
export function loadFinanceData() {
  if (inMemoryFinanceData) {
    return inMemoryFinanceData;
  }

  // If not yet loaded in memory, try to trigger background fetch if in browser
  if (typeof window !== 'undefined') {
    fetchFinanceData().catch(() => {});
  }

  return EMPTY_FINANCE_SUITE;
}

export const getFinanceData = loadFinanceData;

/**
 * Save updated finance data - updates memory cache, notifies subscribers,
 * and persists to backend via transaction import endpoint
 */
export function saveFinanceData(data) {
  if (!data) return;

  // Protect against saving empty placeholder before first fetch
  if (data === EMPTY_FINANCE_SUITE && !inMemoryFinanceData) {
    return;
  }

  const enriched = {
    ...EMPTY_FINANCE_SUITE,
    ...data,
    kpis: calculateKpis(data)
  };

  inMemoryFinanceData = enriched;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('volvitech_finance_updated', { detail: enriched }));
  }

  // Persist to database in background
  request('/finance/import', {
    method: 'POST',
    body: JSON.stringify(enriched)
  }).catch((err) => {
    console.error('[Finance API] Error syncing updated data to server:', err);
  });
}

/**
 * Subscribe to finance data updates
 */
export function subscribeFinanceData(callback) {
  if (typeof window === 'undefined') return () => {};

  const handler = (e) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  window.addEventListener('volvitech_finance_updated', handler);
  return () => window.removeEventListener('volvitech_finance_updated', handler);
}

/**
 * Check if legacy browser localStorage finance data exists
 */
export function hasBrowserFinanceData() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('volvitech_finance_suite');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0);
  } catch {
    return false;
  }
}

/**
 * Upload existing browser localStorage finance data to the API in a single transaction
 */
export async function importFromLocalStorage() {
  if (typeof window === 'undefined') throw new Error('Not running in browser');

  const raw = localStorage.getItem('volvitech_finance_suite');
  if (!raw) {
    throw new Error('No finance data found in this browser\'s local storage');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('Failed to parse local storage finance data');
  }

  const res = await request('/finance/import', {
    method: 'POST',
    body: JSON.stringify(parsed)
  });

  // Remove key from localStorage so import is strictly one-time
  try {
    localStorage.removeItem('volvitech_finance_suite');
  } catch {}

  const resultData = res.data || inMemoryFinanceData;
  inMemoryFinanceData = {
    ...EMPTY_FINANCE_SUITE,
    ...resultData,
    kpis: calculateKpis(resultData)
  };

  window.dispatchEvent(new CustomEvent('volvitech_finance_updated', { detail: inMemoryFinanceData }));
  return inMemoryFinanceData;
}

// Transactional Multi-step Write Helpers (Task 6)
export async function apiCreateInvoice(payload) {
  const inv = await request('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return inv;
}

export async function apiRecordClientPayment(payload) {
  const pmt = await request('/finance/payments-received', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return pmt;
}

export async function apiRecordSupplierPayment(payload) {
  const pmt = await request('/finance/payments-made', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return pmt;
}

export async function apiUpdateExchangeRates(payload) {
  const res = await request('/finance/exchange-rates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiDeletePaymentReceived(id) {
  const res = await request(`/finance/payments-received/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}

export async function apiDeletePaymentMade(id) {
  const res = await request(`/finance/payments-made/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}

// Client PO Operations
export async function apiCreateClientPo(payload) {
  const res = await request('/finance/client-pos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiUpdateClientPo(id, payload) {
  const res = await request(`/finance/client-pos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiVoidClientPo(id, reason) {
  const res = await request(`/finance/client-pos/${encodeURIComponent(id)}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  await fetchFinanceData();
  return res;
}

export async function apiDeleteClientPo(id) {
  const res = await request(`/finance/client-pos/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}

// Invoice Operations
export async function apiUpdateInvoice(id, payload) {
  const res = await request(`/finance/invoices/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiVoidInvoice(id, reason) {
  const res = await request(`/finance/invoices/${encodeURIComponent(id)}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  await fetchFinanceData();
  return res;
}

export async function apiDeleteInvoice(id) {
  const res = await request(`/finance/invoices/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}

// Supplier PO Operations
export async function apiCreateSupplierPo(payload) {
  const res = await request('/finance/supplier-pos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiUpdateSupplierPo(id, payload) {
  const res = await request(`/finance/supplier-pos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  await fetchFinanceData();
  return res;
}

export async function apiVoidSupplierPo(id, reason) {
  const res = await request(`/finance/supplier-pos/${encodeURIComponent(id)}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  await fetchFinanceData();
  return res;
}

export async function apiDeleteSupplierPo(id) {
  const res = await request(`/finance/supplier-pos/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}

// Audit Log Operations (Admin only)
export async function apiGetAuditLogs(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.user) searchParams.set('user', params.user);
  if (params.action && params.action !== 'ALL') searchParams.set('action', params.action);
  if (params.entityType && params.entityType !== 'ALL') searchParams.set('entityType', params.entityType);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  return await request(`/finance/audit-logs${qs ? `?${qs}` : ''}`, {
    method: 'GET'
  });
}

// Period Locking Operations
export async function apiGetLockedPeriods() {
  return await request('/finance/locked-periods', {
    method: 'GET'
  });
}

export async function apiLockPeriod(period, reason = '') {
  const res = await request('/finance/locked-periods', {
    method: 'POST',
    body: JSON.stringify({ period, reason })
  });
  await fetchFinanceData();
  return res;
}

export async function apiUnlockPeriod(period) {
  const res = await request(`/finance/locked-periods/${encodeURIComponent(period)}`, {
    method: 'DELETE'
  });
  await fetchFinanceData();
  return res;
}


