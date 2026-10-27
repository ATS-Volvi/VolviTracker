/**
 * Pure calculation functions and integer-cents money math helper
 * for Volvitech Financial Operations.
 */

// --- 1. Integer Cents Money Math Helpers ---

export function toCents(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
}

export function fromCents(cents) {
  if (cents === null || cents === undefined || isNaN(cents)) return 0;
  return Number((Number(cents) / 100).toFixed(2));
}

export function roundMoney(amount) {
  return fromCents(toCents(amount));
}

export function addMoney(a, b) {
  return fromCents(toCents(a) + toCents(b));
}

export function subMoney(a, b) {
  return fromCents(toCents(a) - toCents(b));
}

export function mulMoney(amount, factor) {
  return fromCents(Math.round(toCents(amount) * Number(factor || 0)));
}

export function divMoney(amount, divisor) {
  const d = Number(divisor);
  if (!d) return 0;
  return fromCents(Math.round(toCents(amount) / d));
}

export function sumMoney(amounts = []) {
  if (!Array.isArray(amounts)) return 0;
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

// Default FX rates fallback if not supplied
export const DEFAULT_EXCHANGE_RATES = {
  USD: 1.0,
  AED: 3.67,
  SAR: 3.75,
  INR: 83.20,
  GBP: 0.79,
  EUR: 0.92,
};

export function getExchangeRate(currency, exchangeRates = {}) {
  if (!currency || currency === 'USD') return 1.0;
  if (exchangeRates && typeof exchangeRates === 'object' && exchangeRates[currency] !== undefined && exchangeRates[currency] !== null) {
    const val = Number(exchangeRates[currency]);
    if (!isNaN(val) && val > 0) return val;
  }
  return DEFAULT_EXCHANGE_RATES[currency] || 1.0;
}

export function convertToUsd(amountNative, currency = 'USD', exchangeRates = {}) {
  const num = Number(amountNative) || 0;
  if (!currency || currency === 'USD') {
    return roundMoney(num);
  }
  const rate = getExchangeRate(currency, exchangeRates);
  return divMoney(num, rate);
}

export function convertFromUsd(amountUsd, currency = 'USD', exchangeRates = {}) {
  const num = Number(amountUsd) || 0;
  if (!currency || currency === 'USD') {
    return roundMoney(num);
  }
  const rate = getExchangeRate(currency, exchangeRates);
  return mulMoney(num, rate);
}

// --- 2. Invoice & Client Payment Calculation ---

export function getInvoicePayments(invoiceNumber, paymentsReceived = []) {
  if (!invoiceNumber || !Array.isArray(paymentsReceived)) return [];
  return paymentsReceived.filter(p => p.invoiceNumber === invoiceNumber);
}

export function calcInvoiceTotalPaidUsd(invoice, payments = [], exchangeRates = {}) {
  if (!Array.isArray(payments) || payments.length === 0) return 0;
  let totalCents = 0;
  for (const p of payments) {
    if (p.amountUsd !== undefined && p.amountUsd !== null && Number(p.amountUsd) > 0) {
      // Historical USD amount recorded at payment time is preserved!
      totalCents += toCents(p.amountUsd);
    } else {
      // Use historical exchange rate stored on payment record first, then fallback to current rates
      const pmtRate = p.exchangeRate ? Number(p.exchangeRate) : getExchangeRate(p.currency || invoice?.currency || 'USD', exchangeRates);
      const converted = divMoney(p.amountNative, pmtRate);
      totalCents += toCents(converted);
    }
  }
  return fromCents(totalCents);
}

export function calcInvoiceState(invoice, payments = [], options = {}) {
  if (!invoice) {
    return {
      totalUsd: 0,
      receivedUsd: 0,
      balanceUsd: 0,
      status: 'Unpaid',
      isOverpaid: false,
      overpaidAmountUsd: 0,
    };
  }

  const exchangeRates = options.exchangeRates || {};
  // If invoice has a historical amountUsd, use it directly!
  // If not, use the historical exchangeRate stored on the invoice if present:
  const invRate = invoice.exchangeRate ? Number(invoice.exchangeRate) : getExchangeRate(invoice.currency || 'USD', exchangeRates);
  const totalUsd = invoice.amountUsd !== undefined && invoice.amountUsd !== null && Number(invoice.amountUsd) > 0
    ? roundMoney(invoice.amountUsd)
    : divMoney(invoice.amountNative, invRate);

  const receivedUsd = calcInvoiceTotalPaidUsd(invoice, payments, exchangeRates);
  const balanceUsd = subMoney(totalUsd, receivedUsd);

  let status = 'Unpaid';
  if (toCents(receivedUsd) <= 0) {
    status = 'Unpaid';
  } else if (toCents(balanceUsd) <= 0) {
    status = 'Paid';
  } else {
    status = 'Partially Paid';
  }

  const isOverpaid = toCents(balanceUsd) < 0;
  const overpaidAmountUsd = isOverpaid ? Math.abs(balanceUsd) : 0;

  return {
    totalUsd,
    receivedUsd,
    balanceUsd: isOverpaid ? 0 : balanceUsd,
    rawBalanceUsd: balanceUsd,
    status,
    isOverpaid,
    overpaidAmountUsd,
  };
}

export function validateClientPayment(invoice, existingPayments = [], newPaymentAmountUsd) {
  const pmtUsd = roundMoney(newPaymentAmountUsd);
  if (toCents(pmtUsd) <= 0) {
    return {
      valid: false,
      error: 'Payment amount must be greater than zero.',
      remainingBalanceUsd: 0,
      isOverpayment: false,
    };
  }

  const state = calcInvoiceState(invoice, existingPayments);
  const remainingBalance = state.balanceUsd;

  if (toCents(pmtUsd) > toCents(remainingBalance)) {
    const excess = subMoney(pmtUsd, remainingBalance);
    return {
      valid: false,
      error: `Payment of $${pmtUsd.toLocaleString()} exceeds invoice remaining balance of $${remainingBalance.toLocaleString()} by $${excess.toLocaleString()}.`,
      remainingBalanceUsd: remainingBalance,
      isOverpayment: true,
      excessUsd: excess,
    };
  }

  const newBalance = subMoney(remainingBalance, pmtUsd);
  return {
    valid: true,
    remainingBalanceUsd: remainingBalance,
    newBalanceUsd: newBalance,
    newStatus: toCents(newBalance) <= 0 ? 'Paid' : 'Partially Paid',
  };
}

// --- 3. Supplier PO & Supplier Payment Calculation ---

export function getSupplierPoPayments(poNumber, paymentsMade = []) {
  if (!poNumber || !Array.isArray(paymentsMade)) return [];
  return paymentsMade.filter(p => p.supplierPoNumber === poNumber);
}

export function calcSupplierPoTotalPaidUsd(supplierPo, payments = [], exchangeRates = {}) {
  if (!Array.isArray(payments) || payments.length === 0) return 0;
  let totalCents = 0;
  for (const p of payments) {
    if (p.amountUsd !== undefined && p.amountUsd !== null && Number(p.amountUsd) > 0) {
      totalCents += toCents(p.amountUsd);
    } else {
      const pmtRate = p.exchangeRate ? Number(p.exchangeRate) : getExchangeRate(p.currency || supplierPo?.currency || 'USD', exchangeRates);
      const converted = divMoney(p.amountNative, pmtRate);
      totalCents += toCents(converted);
    }
  }
  return fromCents(totalCents);
}

export function calcSupplierPoState(supplierPo, payments = [], options = {}) {
  if (!supplierPo) {
    return {
      totalBillUsd: 0,
      paidUsd: 0,
      balanceUsd: 0,
      status: 'Open',
      isOverpaid: false,
      overpaidAmountUsd: 0,
    };
  }

  const exchangeRates = options.exchangeRates || {};
  const spoRate = supplierPo.exchangeRate ? Number(supplierPo.exchangeRate) : getExchangeRate(supplierPo.currency || 'USD', exchangeRates);
  // Bill amount: if billedUsd is present and > 0, use billedUsd; otherwise committedUsd
  const totalBillUsd = supplierPo.billedUsd !== undefined && supplierPo.billedUsd !== null && Number(supplierPo.billedUsd) > 0
    ? roundMoney(supplierPo.billedUsd)
    : (supplierPo.committedUsd !== undefined && supplierPo.committedUsd !== null && Number(supplierPo.committedUsd) > 0
        ? roundMoney(supplierPo.committedUsd)
        : divMoney(supplierPo.committedNative, spoRate));

  const paidUsd = calcSupplierPoTotalPaidUsd(supplierPo, payments, exchangeRates);
  const balanceUsd = subMoney(totalBillUsd, paidUsd);

  let status = supplierPo.status || 'Open';
  if (toCents(paidUsd) <= 0) {
    status = supplierPo.status === 'Bill Overdue' ? 'Bill Overdue' : (supplierPo.status || 'Open');
  } else if (toCents(balanceUsd) <= 0) {
    status = 'Fulfilled';
  } else {
    status = 'Partially Paid';
  }

  const isOverpaid = toCents(balanceUsd) < 0;
  const overpaidAmountUsd = isOverpaid ? Math.abs(balanceUsd) : 0;

  return {
    totalBillUsd,
    paidUsd,
    balanceUsd: isOverpaid ? 0 : balanceUsd,
    rawBalanceUsd: balanceUsd,
    status,
    isOverpaid,
    overpaidAmountUsd,
  };
}

export function validateSupplierPayment(supplierPo, existingPayments = [], newPaymentAmountUsd) {
  const pmtUsd = roundMoney(newPaymentAmountUsd);
  if (toCents(pmtUsd) <= 0) {
    return {
      valid: false,
      error: 'Payment amount must be greater than zero.',
      remainingBalanceUsd: 0,
      isOverpayment: false,
    };
  }

  const state = calcSupplierPoState(supplierPo, existingPayments);
  const remainingBalance = state.balanceUsd;

  if (toCents(pmtUsd) > toCents(remainingBalance)) {
    const excess = subMoney(pmtUsd, remainingBalance);
    return {
      valid: false,
      error: `Payment of $${pmtUsd.toLocaleString()} exceeds PO remaining balance of $${remainingBalance.toLocaleString()} by $${excess.toLocaleString()}.`,
      remainingBalanceUsd: remainingBalance,
      isOverpayment: true,
      excessUsd: excess,
    };
  }

  const newBalance = subMoney(remainingBalance, pmtUsd);
  return {
    valid: true,
    remainingBalanceUsd: remainingBalance,
    newBalanceUsd: newBalance,
    newStatus: toCents(newBalance) <= 0 ? 'Fulfilled' : 'Partially Paid',
  };
}

// --- 4. Overdue Check Helpers ---

export function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isInvoiceOverdue(invoice, balanceUsd, refDate = new Date()) {
  if (toCents(balanceUsd) <= 0) return false;
  if (!invoice || !invoice.dueDate) return false;

  const due = parseDate(invoice.dueDate);
  if (!due) return false;

  const current = new Date(refDate);
  current.setHours(0, 0, 0, 0);

  return due < current;
}

export function isSupplierPoOverdue(supplierPo, balanceUsd, refDate = new Date()) {
  if (toCents(balanceUsd) <= 0) return false;
  if (!supplierPo) return false;

  if (supplierPo.status === 'Bill Overdue') return true;
  if (supplierPo.dueDate) {
    const due = parseDate(supplierPo.dueDate);
    if (due) {
      const current = new Date(refDate);
      current.setHours(0, 0, 0, 0);
      return due < current;
    }
  }
  return false;
}

// --- 5. Pure Consolidated KPI Computation ---

export function computeFinancialKpis({
  invoices = [],
  clientPos = [],
  supplierPos = [],
  paymentsReceived = [],
  paymentsMade = [],
  exchangeRates = {},
  refDate = new Date(),
} = {}) {
  // 1. Client PO Total
  let clientPoTotalCents = 0;
  for (const cpo of clientPos || []) {
    if (cpo.status === 'Void' || cpo.isVoid) continue;
    const usdVal = cpo.totalValueUsd !== undefined && cpo.totalValueUsd !== null
      ? cpo.totalValueUsd
      : convertToUsd(cpo.totalValueNative, cpo.currency || 'USD', exchangeRates);
    clientPoTotalCents += toCents(usdVal);
  }
  const clientPoTotal = fromCents(clientPoTotalCents);

  // 2. Invoiced Total & AR Tracking
  let invoicedTotalCents = 0;
  let arOutstandingCents = 0;
  let arOverdueCents = 0;
  let arOverdueCount = 0;
  const overdueClientAccounts = new Set();

  for (const inv of invoices || []) {
    if (inv.status === 'Void' || inv.isVoid) continue;
    const linkedPmts = getInvoicePayments(inv.invoiceNumber, paymentsReceived);
    const state = calcInvoiceState(inv, linkedPmts, { exchangeRates });
    invoicedTotalCents += toCents(state.totalUsd);
    arOutstandingCents += toCents(state.balanceUsd);

    if (isInvoiceOverdue(inv, state.balanceUsd, refDate)) {
      arOverdueCents += toCents(state.balanceUsd);
      arOverdueCount += 1;
      if (inv.clientName) {
        overdueClientAccounts.add(inv.clientName);
      }
    }
  }

  const invoicedTotal = fromCents(invoicedTotalCents);
  const arOutstanding = fromCents(arOutstandingCents);
  const arOverdue = fromCents(arOverdueCents);
  const arOverdueAccountsCount = overdueClientAccounts.size;

  // 3. Collected Total
  let collectedTotalCents = 0;
  for (const pmt of paymentsReceived || []) {
    const usdVal = pmt.amountUsd !== undefined && pmt.amountUsd !== null
      ? pmt.amountUsd
      : convertToUsd(pmt.amountNative, pmt.currency || 'USD', exchangeRates);
    collectedTotalCents += toCents(usdVal);
  }
  const collectedTotal = fromCents(collectedTotalCents);

  // 4. Supplier PO Committed, Billed & AP Tracking
  let supplierPoCommittedCents = 0;
  let supplierBillsBilledCents = 0;
  let apOutstandingCents = 0;
  let apOverdueCents = 0;
  let apOverdueBillsCount = 0;
  const overdueVendors = new Set();

  for (const spo of supplierPos || []) {
    if (spo.status === 'Void' || spo.isVoid) continue;
    const committedUsd = spo.committedUsd !== undefined && spo.committedUsd !== null
      ? spo.committedUsd
      : convertToUsd(spo.committedNative, spo.currency || 'USD', exchangeRates);
    supplierPoCommittedCents += toCents(committedUsd);

    const linkedPmts = getSupplierPoPayments(spo.poNumber, paymentsMade);
    const state = calcSupplierPoState(spo, linkedPmts, { exchangeRates });
    supplierBillsBilledCents += toCents(state.totalBillUsd);
    apOutstandingCents += toCents(state.balanceUsd);

    if (isSupplierPoOverdue(spo, state.balanceUsd, refDate)) {
      apOverdueCents += toCents(state.balanceUsd);
      apOverdueBillsCount += 1;
      if (spo.supplierName) {
        overdueVendors.add(spo.supplierName);
      }
    }
  }

  const supplierPoCommitted = fromCents(supplierPoCommittedCents);
  const supplierBillsBilled = fromCents(supplierBillsBilledCents);
  const apOutstanding = fromCents(apOutstandingCents);
  const apOverdue = fromCents(apOverdueCents);
  const apOverdueVendorsCount = overdueVendors.size;

  // 5. Supplier Paid
  let supplierPaidCents = 0;
  for (const pmt of paymentsMade || []) {
    const usdVal = pmt.amountUsd !== undefined && pmt.amountUsd !== null
      ? pmt.amountUsd
      : convertToUsd(pmt.amountNative, pmt.currency || 'USD', exchangeRates);
    supplierPaidCents += toCents(usdVal);
  }
  const supplierPaid = fromCents(supplierPaidCents);

  // 6. Days Sales Outstanding (DSO) & Days Payable Outstanding (DPO)
  // DSO: (AR / Invoiced) * 365
  const dsoDays = invoicedTotal > 0
    ? Math.min(365, Math.round((arOutstanding / invoicedTotal) * 365))
    : 0;

  // DPO: (AP / Supplier Billed or Committed) * 365
  const apDenominator = supplierBillsBilled > 0 ? supplierBillsBilled : supplierPoCommitted;
  const dpoDays = apDenominator > 0
    ? Math.min(365, Math.round((apOutstanding / apDenominator) * 365))
    : 0;

  // 7. Gross Margin & Rates
  const grossMargin = subMoney(invoicedTotal, supplierBillsBilled);
  const grossMarginPercent = invoicedTotal > 0
    ? Number(((grossMargin / invoicedTotal) * 100).toFixed(1))
    : 0;

  const poDrawdownRate = clientPoTotal > 0
    ? Number(((invoicedTotal / clientPoTotal) * 100).toFixed(1))
    : 0;

  const unbilledTotal = Math.max(0, subMoney(clientPoTotal, invoicedTotal));

  const collectionEfficiency = invoicedTotal > 0
    ? Number(((collectedTotal / invoicedTotal) * 100).toFixed(1))
    : 0;

  return {
    clientPoTotal,
    invoicedTotal,
    collectedTotal,
    supplierPoCommitted,
    supplierBillsBilled,
    supplierPaid,
    grossMargin,
    grossMarginPercent,
    arOutstanding,
    arOverdue,
    arOverdueCount,
    arOverdueAccountsCount,
    dsoDays,
    apOutstanding,
    apOverdue,
    apOverdueBillsCount,
    apOverdueVendorsCount,
    dpoDays,
    poDrawdownRate,
    unbilledTotal,
    collectionEfficiency,
  };
}

// --- 5. Cash Transaction Linking & Reversal Helpers ---

export function createLinkedClientPaymentCashTransaction({ payment, chosenAccount, invoiceNumber = '' }) {
  if (!payment) return null;
  const pmtId = payment.id || `PMT-RCV-${Date.now()}`;
  const acc = chosenAccount || {};
  const amtNative = roundMoney(payment.amountNative || 0);
  const amtUsd = roundMoney(payment.amountUsd || amtNative);
  const exRate = Number(payment.exchangeRate) || 1.0;

  return {
    id: `CB-TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    voucherNo: payment.reference || `VR-${Date.now().toString().slice(-4)}`,
    date: payment.date || new Date().toISOString().slice(0, 10),
    type: 'Inflow',
    category: 'Client Collection',
    accountId: acc.id || '',
    accountName: acc.accountName || 'Primary Operating Treasury Account',
    transferToAccountId: '',
    transferToAccountName: '',
    entity: acc.entity || 'Volvitech US Corp',
    counterparty: payment.clientName || 'Client Account',
    description: payment.notes || `Receipt for invoice ${invoiceNumber || payment.invoiceNumber || ''}`,
    reference: payment.reference || '',
    linkedInvoice: invoiceNumber || payment.invoiceNumber || '',
    linkedPo: payment.linkedPo || '',
    linkedPaymentId: pmtId,
    paymentMode: payment.mode || 'Wire',
    currency: payment.currency || 'USD',
    exchangeRate: exRate,
    amountNative: amtNative,
    amountUsd: amtUsd,
    status: 'Reconciled',
    notes: payment.notes || ''
  };
}

export function createLinkedSupplierPaymentCashTransaction({ payment, chosenAccount, poNumber = '' }) {
  if (!payment) return null;
  const pmtId = payment.id || `PMT-SUP-${Date.now()}`;
  const acc = chosenAccount || {};
  const amtNative = roundMoney(payment.amountNative || 0);
  const amtUsd = roundMoney(payment.amountUsd || amtNative);
  const exRate = Number(payment.exchangeRate) || 1.0;

  return {
    id: `CB-TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    voucherNo: payment.reference || `VR-${Date.now().toString().slice(-4)}`,
    date: payment.date || new Date().toISOString().slice(0, 10),
    type: 'Outflow',
    category: 'Vendor Payment',
    accountId: acc.id || '',
    accountName: acc.accountName || 'Primary Operating Treasury Account',
    transferToAccountId: '',
    transferToAccountName: '',
    entity: acc.entity || 'Volvitech US Corp',
    counterparty: payment.supplierName || 'Vendor Partner',
    description: payment.notes || `Disbursement for supplier PO ${poNumber || payment.supplierPoNumber || ''}`,
    reference: payment.reference || '',
    linkedInvoice: '',
    linkedPo: poNumber || payment.supplierPoNumber || '',
    linkedPaymentId: pmtId,
    paymentMode: payment.mode || 'Wire',
    currency: payment.currency || 'USD',
    exchangeRate: exRate,
    amountNative: amtNative,
    amountUsd: amtUsd,
    status: 'Reconciled',
    notes: payment.notes || ''
  };
}

export function applyCashTransactionToAccounts(cashTxn, cashAccounts = []) {
  if (!cashTxn || !cashTxn.accountId || !Array.isArray(cashAccounts)) {
    return cashAccounts;
  }

  return cashAccounts.map(acc => {
    if (acc.id !== cashTxn.accountId) return acc;

    const currentBal = Number(acc.currentBalance ?? acc.balanceNative ?? 0);
    const amt = Number(cashTxn.amountNative) || 0;
    const delta = cashTxn.type === 'Inflow' ? amt : (cashTxn.type === 'Outflow' ? -amt : 0);
    const newBal = roundMoney(currentBal + delta);
    const exRate = Number(acc.exchangeRate) || 1.0;
    const newBalUsd = exRate > 0 ? roundMoney(newBal / exRate) : newBal;

    return {
      ...acc,
      currentBalance: newBal,
      balanceNative: newBal,
      balanceUsd: newBalUsd
    };
  });
}

export function reverseCashTransactionForPayment(paymentId, cashTransactions = [], cashAccounts = []) {
  if (!paymentId) return { nextTransactions: cashTransactions, nextAccounts: cashAccounts };

  const txnsToRemove = (cashTransactions || []).filter(t => t.linkedPaymentId === paymentId);
  if (txnsToRemove.length === 0) {
    return { nextTransactions: cashTransactions, nextAccounts: cashAccounts };
  }

  let updatedAccounts = [...(cashAccounts || [])];
  for (const txn of txnsToRemove) {
    if (!txn.accountId) continue;
    updatedAccounts = updatedAccounts.map(acc => {
      if (acc.id !== txn.accountId) return acc;
      const currentBal = Number(acc.currentBalance ?? acc.balanceNative ?? 0);
      const amt = Number(txn.amountNative) || 0;
      // Invert: if was Inflow, subtract; if Outflow, add
      const delta = txn.type === 'Inflow' ? -amt : (txn.type === 'Outflow' ? amt : 0);
      const newBal = roundMoney(currentBal + delta);
      const exRate = Number(acc.exchangeRate) || 1.0;
      const newBalUsd = exRate > 0 ? roundMoney(newBal / exRate) : newBal;

      return {
        ...acc,
        currentBalance: newBal,
        balanceNative: newBal,
        balanceUsd: newBalUsd
      };
    });
  }

  const nextTransactions = (cashTransactions || []).filter(t => t.linkedPaymentId !== paymentId);
  return {
    nextTransactions,
    nextAccounts: updatedAccounts,
    remainingTransactions: nextTransactions,
    updatedAccounts
  };
}

export function reconcileInvoiceAfterPaymentDeletion(invoiceNumber, paymentsReceived = [], invoices = [], exchangeRates = {}) {
  if (!invoiceNumber || !Array.isArray(invoices)) return invoices;
  const remainingPayments = (paymentsReceived || []).filter(p => p.invoiceNumber === invoiceNumber);

  return invoices.map(inv => {
    if (inv.invoiceNumber !== invoiceNumber) return inv;
    const state = calcInvoiceState(inv, remainingPayments, { exchangeRates });
    return {
      ...inv,
      receivedUsd: state.receivedUsd,
      balanceUsd: state.balanceUsd,
      status: state.status,
      isPaid: state.status === 'Paid'
    };
  });
}

export function reconcileSupplierPoAfterPaymentDeletion(poNumber, paymentsMade = [], supplierPos = [], exchangeRates = {}) {
  if (!poNumber || !Array.isArray(supplierPos)) return supplierPos;
  const remainingPayments = (paymentsMade || []).filter(p => p.supplierPoNumber === poNumber);

  return supplierPos.map(spo => {
    if (spo.poNumber !== poNumber) return spo;
    const state = calcSupplierPoState(spo, remainingPayments, { exchangeRates });
    return {
      ...spo,
      paidUsd: state.paidUsd,
      balanceUsd: state.balanceUsd,
      remainingUsd: state.balanceUsd,
      status: state.status
    };
  });
}

// --- 6. Void, Drawdown Recalculation & Period Lock Helpers ---

export function isInvoiceVoid(invoice) {
  return Boolean(invoice && (invoice.status === 'Void' || invoice.isVoid));
}

export function isClientPoVoid(clientPo) {
  return Boolean(clientPo && (clientPo.status === 'Void' || clientPo.isVoid));
}

export function isSupplierPoVoid(supplierPo) {
  return Boolean(supplierPo && (supplierPo.status === 'Void' || supplierPo.isVoid));
}

export function canDeleteInvoice(invoice, paymentsReceived = []) {
  if (!invoice) return { canDelete: true, reason: '' };
  const payments = getInvoicePayments(invoice.invoiceNumber, paymentsReceived);
  if (payments.length > 0) {
    return {
      canDelete: false,
      reason: 'Invoice has associated payment receipts. It cannot be hard-deleted and must be voided instead.'
    };
  }
  return { canDelete: true, reason: '' };
}

export function recalculateClientPoDrawdown(clientPo, invoices = []) {
  if (!clientPo) return clientPo;
  const totalNative = Number(clientPo.totalValueNative || 0);
  const exRate = Number(clientPo.exchangeRate) || 1.0;

  // Filter non-void invoices linked to this PO
  const linkedInvoices = (invoices || []).filter(inv =>
    inv.linkedPoNumber === clientPo.poNumber && !isInvoiceVoid(inv)
  );

  let invoicedNativeCents = 0;
  for (const inv of linkedInvoices) {
    invoicedNativeCents += toCents(inv.amountNative || 0);
  }
  const invoicedNative = fromCents(invoicedNativeCents);
  const invoicedUsd = exRate > 0 ? divMoney(invoicedNative, exRate) : invoicedNative;

  const drawdownPercent = totalNative > 0
    ? Number(Math.min(100, (invoicedNative / totalNative) * 100).toFixed(1))
    : 0;
  const remainingNative = Math.max(0, subMoney(totalNative, invoicedNative));
  const remainingPercent = Number(Math.max(0, 100 - drawdownPercent).toFixed(1));

  let status = clientPo.status;
  if (clientPo.status !== 'Void') {
    if (toCents(remainingNative) <= 0 && toCents(totalNative) > 0) {
      status = 'Fulfilled';
    } else if (toCents(invoicedNative) > 0) {
      status = 'In Progress';
    } else {
      status = clientPo.status === 'Draft' ? 'Draft' : 'Active';
    }
  }

  return {
    ...clientPo,
    invoicedNative,
    invoicedUsd,
    drawdownPercent,
    remainingNative,
    remainingPercent,
    status
  };
}

export function recalculateAllClientPos(clientPos = [], invoices = []) {
  if (!Array.isArray(clientPos)) return [];
  return clientPos.map(cpo => recalculateClientPoDrawdown(cpo, invoices));
}

export function isDateInLockedPeriod(dateStr, lockedPeriods = []) {
  if (!dateStr || !Array.isArray(lockedPeriods) || lockedPeriods.length === 0) return false;
  const period = String(dateStr).slice(0, 7); // 'YYYY-MM'
  if (!/^\d{4}-\d{2}$/.test(period)) return false;

  return lockedPeriods.some(lp => {
    if (typeof lp === 'string') return lp === period;
    return lp && lp.period === period;
  });
}

// --- 7. Real AR and AP Ageing Pure Calculations ---

/**
 * Computes AR Ageing from invoices and outstanding balances.
 * Buckets: 'current', '1-30', '31-60', '61-90', '90+'
 * @param {Array} invoices
 * @param {Object} options
 * @param {string|Date} [options.asOfDate] - Cut-off date (defaults to today)
 * @param {string} [options.clientFilter] - 'ALL' or specific client name
 * @returns {Object} { items, summary, byClient, clientsList }
 */
export function calculateArAgeing(invoices = [], options = {}) {
  const asOf = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const clientFilter = (options.clientFilter || 'ALL').trim();

  // Exclude voided invoices
  const activeInvoices = (invoices || []).filter(inv => !isInvoiceVoid(inv));

  // Compute items
  const items = activeInvoices
    .filter(inv => {
      if (clientFilter && clientFilter !== 'ALL') {
        return (inv.clientName || '').toLowerCase() === clientFilter.toLowerCase();
      }
      return true;
    })
    .map(inv => {
      const isPaid = inv.status === 'Paid';
      const amountDue = isPaid ? 0 : Number(inv.balanceUsd ?? inv.amountUsd ?? 0);
      const dueDateStr = inv.dueDate || inv.date || inv.issueDate;
      const dueDate = dueDateStr ? new Date(dueDateStr) : asOf;

      const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
      const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const diffTime = asOfDay.getTime() - dueDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = isPaid ? 0 : Math.max(0, diffDays);

      let bucket = 'current';
      if (!isPaid && amountDue > 0) {
        if (daysOverdue > 90) bucket = '90+';
        else if (daysOverdue > 60) bucket = '61-90';
        else if (daysOverdue > 30) bucket = '31-60';
        else if (daysOverdue > 0) bucket = '1-30';
        else bucket = 'current';
      }

      return {
        ...inv,
        amountDue,
        dueDate: dueDateStr,
        daysOverdue,
        bucket,
        isOverdue: daysOverdue > 0 && amountDue > 0
      };
    });

  // Calculate summary totals
  const totalArOutstanding = items.reduce((acc, i) => acc + i.amountDue, 0);
  const currentTotal = items.filter(i => i.bucket === 'current' && i.amountDue > 0).reduce((acc, i) => acc + i.amountDue, 0);
  const d1to30Total = items.filter(i => i.bucket === '1-30').reduce((acc, i) => acc + i.amountDue, 0);
  const d31to60Total = items.filter(i => i.bucket === '31-60').reduce((acc, i) => acc + i.amountDue, 0);
  const d61to90Total = items.filter(i => i.bucket === '61-90').reduce((acc, i) => acc + i.amountDue, 0);
  const d90PlusTotal = items.filter(i => i.bucket === '90+').reduce((acc, i) => acc + i.amountDue, 0);

  // Group by client
  const clientsList = Array.from(new Set(activeInvoices.map(i => i.clientName).filter(Boolean))).sort();
  const byClient = (clientFilter && clientFilter !== 'ALL' ? [clientFilter] : clientsList).map(client => {
    const clientInvs = items.filter(i => (i.clientName || '').toLowerCase() === client.toLowerCase());
    const cur = clientInvs.filter(i => i.bucket === 'current').reduce((a, b) => a + b.amountDue, 0);
    const b1 = clientInvs.filter(i => i.bucket === '1-30').reduce((a, b) => a + b.amountDue, 0);
    const b2 = clientInvs.filter(i => i.bucket === '31-60').reduce((a, b) => a + b.amountDue, 0);
    const b3 = clientInvs.filter(i => i.bucket === '61-90').reduce((a, b) => a + b.amountDue, 0);
    const b4 = clientInvs.filter(i => i.bucket === '90+').reduce((a, b) => a + b.amountDue, 0);
    const total = cur + b1 + b2 + b3 + b4;

    return {
      clientName: client,
      current: cur,
      d1to30: b1,
      d31to60: b2,
      d61to90: b3,
      d90Plus: b4,
      totalDue: total,
      invoiceCount: clientInvs.length
    };
  }).filter(c => c.totalDue > 0 || (clientFilter !== 'ALL'));

  return {
    items,
    summary: {
      totalOutstanding: totalArOutstanding,
      current: currentTotal,
      d1to30: d1to30Total,
      d31to60: d31to60Total,
      d61to90: d61to90Total,
      d90Plus: d90PlusTotal
    },
    byClient,
    clientsList
  };
}

/**
 * Computes AP Ageing from supplier purchase orders / bills and outstanding balances.
 * Buckets: 'current', '1-30', '31-60', '61-90', '90+'
 * @param {Array} supplierPos
 * @param {Object} options
 * @param {string|Date} [options.asOfDate] - Cut-off date (defaults to today)
 * @param {string} [options.supplierFilter] - 'ALL' or specific vendor name
 * @returns {Object} { items, summary, bySupplier, suppliersList }
 */
export function calculateApAgeing(supplierPos = [], options = {}) {
  const asOf = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const supplierFilter = (options.supplierFilter || 'ALL').trim();

  // Exclude voided SPOs
  const activeSupplierPos = (supplierPos || []).filter(spo => !isSupplierPoVoid(spo));

  const items = activeSupplierPos
    .filter(spo => {
      if (supplierFilter && supplierFilter !== 'ALL') {
        return (spo.supplierName || '').toLowerCase() === supplierFilter.toLowerCase();
      }
      return true;
    })
    .map(spo => {
      const isSettled = spo.paymentStatus === 'Paid' || spo.status === 'Fulfilled';
      const amountDue = isSettled ? 0 : Number(spo.remainingUsd ?? spo.remainingNative ?? spo.totalValueUsd ?? spo.committedUsd ?? 0);
      const dueDateStr = spo.paymentTermsDueDate || spo.dueDate || spo.issueDate || spo.date;
      const dueDate = dueDateStr ? new Date(dueDateStr) : asOf;

      const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
      const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const diffTime = asOfDay.getTime() - dueDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = isSettled ? 0 : Math.max(0, diffDays);

      let bucket = 'current';
      if (!isSettled && amountDue > 0) {
        if (daysOverdue > 90) bucket = '90+';
        else if (daysOverdue > 60) bucket = '61-90';
        else if (daysOverdue > 30) bucket = '31-60';
        else if (daysOverdue > 0) bucket = '1-30';
        else bucket = 'current';
      }

      return {
        ...spo,
        amountDue,
        dueDate: dueDateStr,
        daysOverdue,
        bucket,
        isOverdue: daysOverdue > 0 && amountDue > 0
      };
    });

  const totalApOutstanding = items.reduce((acc, s) => acc + s.amountDue, 0);
  const currentTotal = items.filter(s => s.bucket === 'current' && s.amountDue > 0).reduce((acc, s) => acc + s.amountDue, 0);
  const d1to30Total = items.filter(s => s.bucket === '1-30').reduce((acc, s) => acc + s.amountDue, 0);
  const d31to60Total = items.filter(s => s.bucket === '31-60').reduce((acc, s) => acc + s.amountDue, 0);
  const d61to90Total = items.filter(s => s.bucket === '61-90').reduce((acc, s) => acc + s.amountDue, 0);
  const d90PlusTotal = items.filter(s => s.bucket === '90+').reduce((acc, s) => acc + s.amountDue, 0);

  const suppliersList = Array.from(new Set(activeSupplierPos.map(s => s.supplierName).filter(Boolean))).sort();
  const bySupplier = (supplierFilter && supplierFilter !== 'ALL' ? [supplierFilter] : suppliersList).map(supplier => {
    const supPos = items.filter(s => (s.supplierName || '').toLowerCase() === supplier.toLowerCase());
    const cur = supPos.filter(s => s.bucket === 'current').reduce((a, b) => a + b.amountDue, 0);
    const b1 = supPos.filter(s => s.bucket === '1-30').reduce((a, b) => a + b.amountDue, 0);
    const b2 = supPos.filter(s => s.bucket === '31-60').reduce((a, b) => a + b.amountDue, 0);
    const b3 = supPos.filter(s => s.bucket === '61-90').reduce((a, b) => a + b.amountDue, 0);
    const b4 = supPos.filter(s => s.bucket === '90+').reduce((a, b) => a + b.amountDue, 0);
    const total = cur + b1 + b2 + b3 + b4;

    return {
      supplierName: supplier,
      current: cur,
      d1to30: b1,
      d31to60: b2,
      d61to90: b3,
      d90Plus: b4,
      totalDue: total,
      poCount: supPos.length
    };
  }).filter(s => s.totalDue > 0 || (supplierFilter !== 'ALL'));

  return {
    items,
    summary: {
      totalOutstanding: totalApOutstanding,
      current: currentTotal,
      d1to30: d1to30Total,
      d31to60: d31to60Total,
      d61to90: d61to90Total,
      d90Plus: d90PlusTotal
    },
    bySupplier,
    suppliersList
  };
}


