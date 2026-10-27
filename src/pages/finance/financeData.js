// Financial & PO Operations Data Store for Volvitech
// Seed data has been moved to server/seedFinance.js for server-side persistence in PostgreSQL.
// This module delegates to src/services/financeApi.js to fetch from /api/finance.

export {
  EMPTY_FINANCE_SUITE,
  loadFinanceData,
  getFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData,
  hasBrowserFinanceData,
  importFromLocalStorage,
  calculateKpis,
  apiCreateInvoice,
  apiRecordClientPayment,
  apiRecordSupplierPayment,
  apiUpdateExchangeRates,
  apiDeletePaymentReceived,
  apiDeletePaymentMade,
  apiCreateClientPo,
  apiUpdateClientPo,
  apiVoidClientPo,
  apiDeleteClientPo,
  apiUpdateInvoice,
  apiVoidInvoice,
  apiDeleteInvoice,
  apiCreateSupplierPo,
  apiUpdateSupplierPo,
  apiVoidSupplierPo,
  apiDeleteSupplierPo,
  apiGetAuditLogs,
  apiGetLockedPeriods,
  apiLockPeriod,
  apiUnlockPeriod
} from '../../services/financeApi';

import {
  EMPTY_FINANCE_SUITE,
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData
} from '../../services/financeApi';

// Fallback empty data constants for backward compatibility
export const INITIAL_EXCHANGE_RATES = EMPTY_FINANCE_SUITE.exchangeRates;
export const INITIAL_FINANCIAL_KPIS = EMPTY_FINANCE_SUITE.kpis;
export const INITIAL_PROJECTS_FINANCIALS = EMPTY_FINANCE_SUITE.projects;
export const INITIAL_CLIENT_POS = EMPTY_FINANCE_SUITE.clientPos;
export const INITIAL_INVOICES = EMPTY_FINANCE_SUITE.invoices;
export const INITIAL_SUPPLIER_POS = EMPTY_FINANCE_SUITE.supplierPos;
export const INITIAL_PAYMENTS_RECEIVED = EMPTY_FINANCE_SUITE.paymentsReceived;
export const INITIAL_PAYMENTS_MADE = EMPTY_FINANCE_SUITE.paymentsMade;
export const INITIAL_CASH_ACCOUNTS = EMPTY_FINANCE_SUITE.cashAccounts;
export const INITIAL_CASH_TRANSACTIONS = EMPTY_FINANCE_SUITE.cashTransactions;
export const INITIAL_MASTER_DIRECTORY = EMPTY_FINANCE_SUITE.masterDirectory;
export const INITIAL_DOCUMENT_VAULT = EMPTY_FINANCE_SUITE.vault;
