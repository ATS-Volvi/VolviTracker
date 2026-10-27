import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addMoney,
  subMoney,
  mulMoney,
  divMoney,
  roundMoney,
  convertToUsd,
  calcInvoiceState,
  validateClientPayment,
  calcSupplierPoState,
  validateSupplierPayment,
  isInvoiceOverdue,
  isSupplierPoOverdue,
  computeFinancialKpis,
  createLinkedClientPaymentCashTransaction,
  createLinkedSupplierPaymentCashTransaction,
  applyCashTransactionToAccounts,
  reverseCashTransactionForPayment,
  reconcileInvoiceAfterPaymentDeletion,
  reconcileSupplierPoAfterPaymentDeletion,
  isInvoiceVoid,
  isClientPoVoid,
  isSupplierPoVoid,
  canDeleteInvoice,
  recalculateClientPoDrawdown,
  recalculateAllClientPos,
  isDateInLockedPeriod,
  calculateArAgeing,
  calculateApAgeing
} from './financeCalcs';

describe('financeCalcs - Integer Cents Money Math', () => {
  it('avoids floating point errors in additions and subtractions', () => {
    // In IEEE 754 float: 0.1 + 0.2 = 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    // With integer cents money math:
    expect(addMoney(0.1, 0.2)).toBe(0.3);

    // In IEEE 754 float: 0.3 - 0.2 = 0.09999999999999998
    expect(subMoney(0.3, 0.2)).toBe(0.1);

    // Rounding & multiplication
    expect(mulMoney(19.99, 3)).toBe(59.97);
    expect(divMoney(100, 3)).toBe(33.33);
  });

  it('correctly handles toCents and fromCents', () => {
    expect(toCents(123.45)).toBe(12345);
    expect(fromCents(12345)).toBe(123.45);
    expect(roundMoney(45.678)).toBe(45.68);
    expect(toCents(null)).toBe(0);
    expect(fromCents(null)).toBe(0);
  });
});

describe('financeCalcs - Invoice State & Client Payments', () => {
  const invoiceUsd = {
    id: 'INV-100',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Acme Corp',
    amountUsd: 1000.00,
    currency: 'USD',
    dueDate: '2024-06-01',
  };

  it('calculates Unpaid state when no payments are linked', () => {
    const state = calcInvoiceState(invoiceUsd, []);
    expect(state.totalUsd).toBe(1000.00);
    expect(state.receivedUsd).toBe(0);
    expect(state.balanceUsd).toBe(1000.00);
    expect(state.status).toBe('Unpaid');
    expect(state.isOverpaid).toBe(false);
  });

  it('handles partial payment correctly', () => {
    const partialPayment = {
      id: 'PMT-1',
      invoiceNumber: 'INV-2024-001',
      amountUsd: 400.00,
    };
    const state = calcInvoiceState(invoiceUsd, [partialPayment]);
    expect(state.receivedUsd).toBe(400.00);
    expect(state.balanceUsd).toBe(600.00);
    expect(state.status).toBe('Partially Paid');
    expect(state.isOverpaid).toBe(false);
  });

  it('handles multiple partial payments culminating in full payment', () => {
    const payments = [
      { id: 'PMT-1', invoiceNumber: 'INV-2024-001', amountUsd: 400.00 },
      { id: 'PMT-2', invoiceNumber: 'INV-2024-001', amountUsd: 600.00 },
    ];
    const state = calcInvoiceState(invoiceUsd, payments);
    expect(state.receivedUsd).toBe(1000.00);
    expect(state.balanceUsd).toBe(0);
    expect(state.status).toBe('Paid');
    expect(state.isOverpaid).toBe(false);
  });

  it('identifies and flags overpayment', () => {
    const excessivePayment = {
      id: 'PMT-EXCESS',
      invoiceNumber: 'INV-2024-001',
      amountUsd: 1250.00,
    };
    const state = calcInvoiceState(invoiceUsd, [excessivePayment]);
    expect(state.receivedUsd).toBe(1250.00);
    expect(state.balanceUsd).toBe(0); // reported open balance is 0
    expect(state.rawBalanceUsd).toBe(-250.00);
    expect(state.status).toBe('Paid');
    expect(state.isOverpaid).toBe(true);
    expect(state.overpaidAmountUsd).toBe(250.00);
  });

  it('rejects payments larger than the remaining balance in validateClientPayment', () => {
    const existingPayment = {
      id: 'PMT-1',
      invoiceNumber: 'INV-2024-001',
      amountUsd: 700.00,
    };

    // Remaining is $300. Try to pay $300.01:
    const invalidResult = validateClientPayment(invoiceUsd, [existingPayment], 300.01);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.isOverpayment).toBe(true);
    expect(invalidResult.remainingBalanceUsd).toBe(300.00);
    expect(invalidResult.excessUsd).toBe(0.01);
    expect(invalidResult.error).toContain('exceeds invoice remaining balance');

    // Pay exactly $300:
    const validResult = validateClientPayment(invoiceUsd, [existingPayment], 300.00);
    expect(validResult.valid).toBe(true);
    expect(validResult.newBalanceUsd).toBe(0);
    expect(validResult.newStatus).toBe('Paid');

    // Reject 0 or negative
    const zeroResult = validateClientPayment(invoiceUsd, [], 0);
    expect(zeroResult.valid).toBe(false);
  });
});

describe('financeCalcs - Multi-Currency Invoices & Payments', () => {
  const fxRates = {
    USD: 1.0,
    AED: 3.67,
    SAR: 3.75,
    INR: 83.20,
  };

  it('converts multi-currency values to USD accurately', () => {
    // 367 AED @ 3.67 = 100 USD
    expect(convertToUsd(367, 'AED', fxRates)).toBe(100.00);
    // 375 SAR @ 3.75 = 100 USD
    expect(convertToUsd(375, 'SAR', fxRates)).toBe(100.00);
    // 8320 INR @ 83.20 = 100 USD
    expect(convertToUsd(8320, 'INR', fxRates)).toBe(100.00);
  });

  it('computes balance and status for native AED invoice paid in AED', () => {
    const aedInvoice = {
      id: 'INV-AED-1',
      invoiceNumber: 'INV-AED-99',
      clientName: 'Dubai Holdings',
      amountNative: 36700, // 36,700 AED = 10,000 USD
      amountUsd: 10000,
      currency: 'AED',
    };

    const paymentAed = {
      id: 'PMT-AED-1',
      invoiceNumber: 'INV-AED-99',
      amountNative: 18350,
      amountUsd: 5000,
      currency: 'AED',
    };

    const state = calcInvoiceState(aedInvoice, [paymentAed], { exchangeRates: fxRates });
    expect(state.totalUsd).toBe(10000);
    expect(state.receivedUsd).toBe(5000);
    expect(state.balanceUsd).toBe(5000);
    expect(state.status).toBe('Partially Paid');

    const paymentAedFinal = {
      id: 'PMT-AED-2',
      invoiceNumber: 'INV-AED-99',
      amountNative: 18350,
      amountUsd: 5000,
      currency: 'AED',
    };

    const finalState = calcInvoiceState(aedInvoice, [paymentAed, paymentAedFinal], { exchangeRates: fxRates });
    expect(finalState.receivedUsd).toBe(10000);
    expect(finalState.balanceUsd).toBe(0);
    expect(finalState.status).toBe('Paid');
  });
});

describe('financeCalcs - Supplier PO & Supplier Payment State', () => {
  const supplierPo = {
    id: 'SPO-1',
    poNumber: 'PO-SUP-2024-01',
    supplierName: 'Cloud Server Provider',
    committedUsd: 5000,
    billedUsd: 5000,
    status: 'Open',
  };

  it('tracks partial payment without subtracting from billedUsd', () => {
    const partialPmt = {
      id: 'PMT-S-1',
      supplierPoNumber: 'PO-SUP-2024-01',
      amountUsd: 2000,
    };
    const state = calcSupplierPoState(supplierPo, [partialPmt]);
    expect(state.totalBillUsd).toBe(5000);
    expect(state.paidUsd).toBe(2000);
    expect(state.balanceUsd).toBe(3000);
    expect(state.status).toBe('Partially Paid');
  });

  it('marks status Fulfilled when balance is paid in full', () => {
    const payments = [
      { id: 'PMT-S-1', supplierPoNumber: 'PO-SUP-2024-01', amountUsd: 2000 },
      { id: 'PMT-S-2', supplierPoNumber: 'PO-SUP-2024-01', amountUsd: 3000 },
    ];
    const state = calcSupplierPoState(supplierPo, payments);
    expect(state.paidUsd).toBe(5000);
    expect(state.balanceUsd).toBe(0);
    expect(state.status).toBe('Fulfilled');
  });

  it('rejects payments larger than remaining PO balance', () => {
    const existingPmt = {
      id: 'PMT-S-1',
      supplierPoNumber: 'PO-SUP-2024-01',
      amountUsd: 4500,
    };
    // Balance is 500. Try to pay 600
    const res = validateSupplierPayment(supplierPo, [existingPmt], 600);
    expect(res.valid).toBe(false);
    expect(res.isOverpayment).toBe(true);
    expect(res.remainingBalanceUsd).toBe(500);
    expect(res.excessUsd).toBe(100);

    // Pay exact remaining 500
    const validRes = validateSupplierPayment(supplierPo, [existingPmt], 500);
    expect(validRes.valid).toBe(true);
    expect(validRes.newBalanceUsd).toBe(0);
    expect(validRes.newStatus).toBe('Fulfilled');
  });
});

describe('financeCalcs - Overdue Calculation & Financial KPIs', () => {
  const refDate = new Date('2024-05-15T00:00:00Z');

  it('identifies overdue invoices based on due date and balance', () => {
    // Due 2024-05-01 (before May 15) with balance > 0 -> Overdue
    const overdueInv = {
      invoiceNumber: 'INV-PAST',
      dueDate: '2024-05-01',
    };
    expect(isInvoiceOverdue(overdueInv, 500, refDate)).toBe(true);

    // Paid in full (balance = 0) -> NOT overdue
    expect(isInvoiceOverdue(overdueInv, 0, refDate)).toBe(false);

    // Due 2024-06-01 (after May 15) -> NOT overdue
    const futureInv = {
      invoiceNumber: 'INV-FUTURE',
      dueDate: '2024-06-01',
    };
    expect(isInvoiceOverdue(futureInv, 500, refDate)).toBe(false);
  });

  it('computes consolidated financial KPIs dynamically', () => {
    const testInvoices = [
      {
        id: 'I-1',
        invoiceNumber: 'INV-1',
        clientName: 'Client Alpha',
        amountUsd: 10000,
        dueDate: '2024-04-30', // Overdue relative to 2024-05-15
      },
      {
        id: 'I-2',
        invoiceNumber: 'INV-2',
        clientName: 'Client Beta',
        amountUsd: 5000,
        dueDate: '2024-04-15', // Overdue relative to 2024-05-15
      },
      {
        id: 'I-3',
        invoiceNumber: 'INV-3',
        clientName: 'Client Alpha', // Same account as I-1
        amountUsd: 8000,
        dueDate: '2024-06-30', // Future
      },
    ];

    const testPaymentsReceived = [
      { invoiceNumber: 'INV-1', amountUsd: 4000 }, // Balance remaining: 6000 (overdue)
      { invoiceNumber: 'INV-2', amountUsd: 2000 }, // Balance remaining: 3000 (overdue)
      { invoiceNumber: 'INV-3', amountUsd: 8000 }, // Balance remaining: 0 (paid)
    ];

    const testSupplierPos = [
      {
        id: 'S-1',
        poNumber: 'SPO-1',
        supplierName: 'Vendor X',
        committedUsd: 6000,
        billedUsd: 6000,
        status: 'Bill Overdue',
      },
      {
        id: 'S-2',
        poNumber: 'SPO-2',
        supplierName: 'Vendor Y',
        committedUsd: 4000,
        billedUsd: 4000,
        status: 'Open',
      },
    ];

    const testPaymentsMade = [
      { supplierPoNumber: 'SPO-1', amountUsd: 2000 }, // Balance remaining: 4000 (overdue)
      { supplierPoNumber: 'SPO-2', amountUsd: 4000 }, // Balance remaining: 0 (fulfilled)
    ];

    const kpis = computeFinancialKpis({
      invoices: testInvoices,
      clientPos: [{ totalValueUsd: 30000 }],
      supplierPos: testSupplierPos,
      paymentsReceived: testPaymentsReceived,
      paymentsMade: testPaymentsMade,
      refDate,
    });

    expect(kpis.clientPoTotal).toBe(30000);
    expect(kpis.invoicedTotal).toBe(23000); // 10k + 5k + 8k
    expect(kpis.collectedTotal).toBe(14000); // 4k + 2k + 8k
    expect(kpis.arOutstanding).toBe(9000); // 6k + 3k + 0
    expect(kpis.arOverdue).toBe(9000); // Both INV-1 (6k) and INV-2 (3k) are overdue
    expect(kpis.arOverdueCount).toBe(2);
    expect(kpis.arOverdueAccountsCount).toBe(2); // Client Alpha and Client Beta

    expect(kpis.supplierPoCommitted).toBe(10000);
    expect(kpis.supplierBillsBilled).toBe(10000);
    expect(kpis.supplierPaid).toBe(6000);
    expect(kpis.apOutstanding).toBe(4000); // SPO-1 remaining 4000
    expect(kpis.apOverdue).toBe(4000);
    expect(kpis.apOverdueBillsCount).toBe(1);

    expect(kpis.grossMargin).toBe(13000); // 23000 - 10000
    expect(kpis.grossMarginPercent).toBe(56.5);
  });
});

describe('financeCalcs - Cash Transaction Linking & Reversals', () => {
  const mockAccount = {
    id: 'ACC-USD-01',
    accountName: 'JPMorgan Treasury - USD',
    currency: 'USD',
    exchangeRate: 1.0,
    currentBalance: 50000,
    balanceNative: 50000,
    balanceUsd: 50000,
  };

  it('creates matching Inflow cash transaction when client payment is recorded', () => {
    const payment = {
      id: 'PMT-RCV-101',
      date: '2026-10-26',
      clientName: 'Acme Enterprise',
      amountNative: 15000,
      currency: 'USD',
      amountUsd: 15000,
      exchangeRate: 1.0,
      mode: 'Fedwire',
      reference: 'TX-REF-101',
    };

    const txn = createLinkedClientPaymentCashTransaction({
      payment,
      chosenAccount: mockAccount,
      invoiceNumber: 'INV-2026-001',
    });

    expect(txn.type).toBe('Inflow');
    expect(txn.category).toBe('Client Collection');
    expect(txn.linkedPaymentId).toBe('PMT-RCV-101');
    expect(txn.linkedInvoice).toBe('INV-2026-001');
    expect(txn.accountId).toBe('ACC-USD-01');
    expect(txn.amountNative).toBe(15000);
    expect(txn.amountUsd).toBe(15000);

    // Apply to accounts
    const updatedAccounts = applyCashTransactionToAccounts(txn, [mockAccount]);
    expect(updatedAccounts[0].currentBalance).toBe(65000);
    expect(updatedAccounts[0].balanceUsd).toBe(65000);
  });

  it('creates matching Outflow cash transaction when supplier payment is recorded', () => {
    const payment = {
      id: 'PMT-SUP-202',
      date: '2026-10-26',
      supplierName: 'AWS Infrastructure',
      amountNative: 8000,
      currency: 'USD',
      amountUsd: 8000,
      exchangeRate: 1.0,
      mode: 'ACH',
      reference: 'TX-SUP-202',
    };

    const txn = createLinkedSupplierPaymentCashTransaction({
      payment,
      chosenAccount: mockAccount,
      poNumber: 'SPO-2026-005',
    });

    expect(txn.type).toBe('Outflow');
    expect(txn.category).toBe('Vendor Payment');
    expect(txn.linkedPaymentId).toBe('PMT-SUP-202');
    expect(txn.linkedPo).toBe('SPO-2026-005');
    expect(txn.amountNative).toBe(8000);

    // Apply to accounts
    const updatedAccounts = applyCashTransactionToAccounts(txn, [mockAccount]);
    expect(updatedAccounts[0].currentBalance).toBe(42000);
  });

  it('reverses cash transactions and restores account balance when payment is deleted', () => {
    const existingTxn = {
      id: 'CB-TXN-1',
      type: 'Inflow',
      linkedPaymentId: 'PMT-RCV-101',
      accountId: 'ACC-USD-01',
      amountNative: 15000,
      amountUsd: 15000,
    };
    const currentAccount = {
      ...mockAccount,
      currentBalance: 65000,
      balanceNative: 65000,
      balanceUsd: 65000,
    };

    const { nextTransactions, nextAccounts } = reverseCashTransactionForPayment(
      'PMT-RCV-101',
      [existingTxn],
      [currentAccount]
    );

    // Cash transaction is removed
    expect(nextTransactions).toHaveLength(0);
    // Balance is reversed back by -15000
    expect(nextAccounts[0].currentBalance).toBe(50000);
  });

  it('reconciles invoice status and balances when payment is deleted', () => {
    const testInvoice = {
      invoiceNumber: 'INV-100',
      amountUsd: 10000,
      receivedUsd: 10000,
      balanceUsd: 0,
      status: 'Paid',
    };
    // Suppose there were 2 payments: PMT-1 ($4,000) and PMT-2 ($6,000).
    // PMT-2 is deleted, leaving only PMT-1 ($4,000).
    const remainingPayments = [
      { id: 'PMT-1', invoiceNumber: 'INV-100', amountUsd: 4000 },
    ];

    const reconciledInvoices = reconcileInvoiceAfterPaymentDeletion(
      'INV-100',
      remainingPayments,
      [testInvoice]
    );

    expect(reconciledInvoices[0].receivedUsd).toBe(4000);
    expect(reconciledInvoices[0].balanceUsd).toBe(6000);
    expect(reconciledInvoices[0].status).toBe('Partially Paid');
  });
});

describe('financeCalcs - Historical Exchange Rate Preservation', () => {
  it('preserves historical invoice and payment values even when live exchange rates change', () => {
    // Historical transaction locked in at rate 3.67 for AED
    const historicalPayment = {
      id: 'PMT-HIST-1',
      invoiceNumber: 'INV-AE-01',
      currency: 'AED',
      exchangeRate: 3.67,
      amountNative: 3670,
      amountUsd: 1000, // 3670 / 3.67 = 1000
    };

    const historicalInvoice = {
      invoiceNumber: 'INV-AE-01',
      currency: 'AED',
      exchangeRate: 3.67,
      amountNative: 7340,
      amountUsd: 2000, // 7340 / 3.67 = 2000
    };

    // Live exchange rates later change drastically! AED becomes 4.00
    const liveRates = {
      USD: 1.0,
      AED: 4.00,
      INR: 90.0,
    };

    const state = calcInvoiceState(historicalInvoice, [historicalPayment], {
      exchangeRates: liveRates,
    });

    // The payment amountUsd was locked at 1000, invoice amountUsd was locked at 2000
    // It must NOT recalculate using 4.00!
    expect(state.receivedUsd).toBe(1000);
    expect(state.totalUsd).toBe(2000);
    expect(state.balanceUsd).toBe(1000);
    expect(state.status).toBe('Partially Paid');
  });

  it('creates linked Outflow cash transaction for supplier payments and debits cash account', () => {
    const payment = {
      id: 'PMT-SUP-01',
      date: '2026-10-26',
      supplierName: 'Acme Cloud Services',
      amountNative: 5000,
      currency: 'USD',
      amountUsd: 5000,
      exchangeRate: 1.0,
      reference: 'WIRE-99881',
      mode: 'Bank Wire',
    };
    const account = {
      id: 'ACC-01',
      name: 'Chase Operating Checking',
      currency: 'USD',
      currentBalance: 50000,
      balanceNative: 50000,
      balanceUsd: 50000,
    };

    const cashTx = createLinkedSupplierPaymentCashTransaction({
      payment,
      chosenAccount: account,
      poNumber: 'SPO-2024-001',
    });

    expect(cashTx.linkedPaymentId).toBe('PMT-SUP-01');
    expect(cashTx.type).toBe('Outflow');
    expect(cashTx.amountNative).toBe(5000);
    expect(cashTx.amountUsd).toBe(5000);

    // Apply to accounts (debit)
    const updatedAccounts = applyCashTransactionToAccounts(cashTx, [account]);
    expect(updatedAccounts[0].currentBalance).toBe(45000);
    expect(updatedAccounts[0].balanceUsd).toBe(45000);

    // Reverse payment deletion (credit back)
    const { nextTransactions, nextAccounts } = reverseCashTransactionForPayment(
      'PMT-SUP-01',
      [cashTx],
      updatedAccounts
    );

    expect(nextTransactions).toHaveLength(0);
    expect(nextAccounts[0].currentBalance).toBe(50000);
  });

  it('reconciles supplier PO when a payment is deleted/reversed', () => {
    const testPo = {
      poNumber: 'SPO-2024-001',
      totalValueUsd: 12000,
      committedUsd: 12000,
      billedUsd: 12000,
      paidUsd: 12000,
      balanceUsd: 0,
      remainingUsd: 0,
      status: 'Fulfilled',
    };
    // 2 payments of 6000 were made. One is deleted.
    const remainingPayments = [
      { id: 'PMT-1', supplierPoNumber: 'SPO-2024-001', amountUsd: 6000 },
    ];

    const reconciled = reconcileSupplierPoAfterPaymentDeletion(
      'SPO-2024-001',
      remainingPayments,
      [testPo]
    );

    expect(reconciled[0].paidUsd).toBe(6000);
    expect(reconciled[0].balanceUsd).toBe(6000);
    expect(reconciled[0].remainingUsd).toBe(6000);
    expect(reconciled[0].status).toBe('Partially Paid');
  });
});

describe('financeCalcs - Void Handling & PO Drawdown Recalculation', () => {
  const baseClientPo = {
    id: 'CPO-1',
    poNumber: 'CPO-2024-001',
    totalValueNative: 100000,
    totalValueUsd: 100000,
    currency: 'USD',
    exchangeRate: 1.0,
    invoicedNative: 0,
    invoicedUsd: 0,
    drawdownPercent: 0,
    remainingNative: 100000,
    remainingPercent: 100,
    status: 'Active',
  };

  const invoice1 = {
    id: 'INV-1',
    invoiceNumber: 'INV-2024-001',
    linkedPoNumber: 'CPO-2024-001',
    amountNative: 40000,
    amountUsd: 40000,
    currency: 'USD',
    status: 'Unpaid',
  };

  const invoice2 = {
    id: 'INV-2',
    invoiceNumber: 'INV-2024-002',
    linkedPoNumber: 'CPO-2024-001',
    amountNative: 60000,
    amountUsd: 60000,
    currency: 'USD',
    status: 'Unpaid',
  };

  it('calculates drawdown accurately when invoices are linked', () => {
    const updated = recalculateClientPoDrawdown(baseClientPo, [invoice1]);
    expect(updated.invoicedNative).toBe(40000);
    expect(updated.drawdownPercent).toBe(40);
    expect(updated.remainingNative).toBe(60000);
    expect(updated.remainingPercent).toBe(60);
    expect(updated.status).toBe('In Progress');
  });

  it('marks PO as Fulfilled when 100% drawdown is reached', () => {
    const updated = recalculateClientPoDrawdown(baseClientPo, [invoice1, invoice2]);
    expect(updated.invoicedNative).toBe(100000);
    expect(updated.drawdownPercent).toBe(100);
    expect(updated.remainingNative).toBe(0);
    expect(updated.status).toBe('Fulfilled');
  });

  it('recalculates PO drawdown down when an invoice is voided', () => {
    const voidedInvoice2 = { ...invoice2, status: 'Void', isVoid: true, voidReason: 'Cancelled by client' };
    const updated = recalculateClientPoDrawdown(baseClientPo, [invoice1, voidedInvoice2]);
    expect(updated.invoicedNative).toBe(40000);
    expect(updated.drawdownPercent).toBe(40);
    expect(updated.remainingNative).toBe(60000);
    expect(updated.status).toBe('In Progress');
  });

  it('recalculates PO drawdown back to 0 when all invoices are voided', () => {
    const voidedInvoice1 = { ...invoice1, status: 'Void', isVoid: true };
    const voidedInvoice2 = { ...invoice2, status: 'Void', isVoid: true };
    const updated = recalculateClientPoDrawdown(baseClientPo, [voidedInvoice1, voidedInvoice2]);
    expect(updated.invoicedNative).toBe(0);
    expect(updated.drawdownPercent).toBe(0);
    expect(updated.remainingNative).toBe(100000);
    expect(updated.status).toBe('Active');
  });

  it('excludes voided invoices and voided POs from computeFinancialKpis totals', () => {
    const activeInv = {
      invoiceNumber: 'INV-ACT-1',
      amountUsd: 5000,
      status: 'Unpaid',
      dueDate: '2099-12-01',
    };
    const voidInv = {
      invoiceNumber: 'INV-VOID-1',
      amountUsd: 15000,
      status: 'Void',
      isVoid: true,
      dueDate: '2024-01-01',
    };
    const activePo = {
      poNumber: 'CPO-ACT-1',
      totalValueUsd: 50000,
      status: 'Active',
    };
    const voidPo = {
      poNumber: 'CPO-VOID-1',
      totalValueUsd: 25000,
      status: 'Void',
      isVoid: true,
    };

    const kpis = computeFinancialKpis({
      invoices: [activeInv, voidInv],
      clientPos: [activePo, voidPo],
      supplierPos: [],
      paymentsReceived: [],
      paymentsMade: [],
    });

    expect(kpis.clientPoTotal).toBe(50000); // 25000 voided PO excluded
    expect(kpis.invoicedTotal).toBe(5000); // 15000 voided invoice excluded
    expect(kpis.arOutstanding).toBe(5000);
    expect(kpis.arOverdue).toBe(0); // void invoice overdue not counted
  });
});

describe('financeCalcs - Invoice Deletion vs Void Validation', () => {
  it('permits deletion of invoice with zero payments', () => {
    const inv = { invoiceNumber: 'INV-DEL-1' };
    const res = canDeleteInvoice(inv, []);
    expect(res.canDelete).toBe(true);
  });

  it('prohibits hard-deletion of invoice with associated payment receipts', () => {
    const inv = { invoiceNumber: 'INV-DEL-2' };
    const payments = [{ id: 'PMT-1', invoiceNumber: 'INV-DEL-2', amountUsd: 200 }];
    const res = canDeleteInvoice(inv, payments);
    expect(res.canDelete).toBe(false);
    expect(res.reason).toMatch(/cannot be hard-deleted and must be voided instead/i);
  });
});

describe('financeCalcs - Period Locking Checks', () => {
  const lockedPeriods = [
    { period: '2024-01', lockedBy: 'admin@volvitech.com' },
    '2024-02',
  ];

  it('detects dates falling into locked periods', () => {
    expect(isDateInLockedPeriod('2024-01-15', lockedPeriods)).toBe(true);
    expect(isDateInLockedPeriod('2024-02-28', lockedPeriods)).toBe(true);
    expect(isDateInLockedPeriod('2024-03-01', lockedPeriods)).toBe(false);
  });

  it('gracefully handles missing or empty periods', () => {
    expect(isDateInLockedPeriod(null, lockedPeriods)).toBe(false);
    expect(isDateInLockedPeriod('2024-01-15', [])).toBe(false);
    expect(isDateInLockedPeriod('invalid-date', lockedPeriods)).toBe(false);
  });
});

describe('financeCalcs - Real AR and AP Ageing Reports', () => {
  const asOf = '2026-06-01';

  const testInvoices = [
    {
      invoiceNumber: 'INV-CURR',
      clientName: 'Client Alpha',
      amountUsd: 1000,
      balanceUsd: 1000,
      dueDate: '2026-06-15', // Due in future relative to asOf -> Current
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-1-30',
      clientName: 'Client Alpha',
      amountUsd: 2000,
      balanceUsd: 2000,
      dueDate: '2026-05-15', // 17 days overdue -> 1-30
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-31-60',
      clientName: 'Client Beta',
      amountUsd: 3000,
      balanceUsd: 3000,
      dueDate: '2026-04-15', // 47 days overdue -> 31-60
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-61-90',
      clientName: 'Client Beta',
      amountUsd: 4000,
      balanceUsd: 4000,
      dueDate: '2026-03-15', // 78 days overdue -> 61-90
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-90-PLUS',
      clientName: 'Client Gamma',
      amountUsd: 5000,
      balanceUsd: 5000,
      dueDate: '2026-01-01', // 151 days overdue -> 90+
      status: 'Pending',
    },
    {
      invoiceNumber: 'INV-PAID',
      clientName: 'Client Alpha',
      amountUsd: 9000,
      balanceUsd: 0,
      dueDate: '2026-01-01',
      status: 'Paid', // Fully paid -> 0 amountDue
    },
    {
      invoiceNumber: 'INV-VOID',
      clientName: 'Client Gamma',
      amountUsd: 10000,
      balanceUsd: 10000,
      dueDate: '2026-01-01',
      status: 'Void', // Voided -> excluded
    },
  ];

  it('correctly categorizes invoices into ageing buckets as of specified date', () => {
    const report = calculateArAgeing(testInvoices, { asOfDate: asOf });

    expect(report.summary.totalOutstanding).toBe(15000);
    expect(report.summary.current).toBe(1000);
    expect(report.summary.d1to30).toBe(2000);
    expect(report.summary.d31to60).toBe(3000);
    expect(report.summary.d61to90).toBe(4000);
    expect(report.summary.d90Plus).toBe(5000);
    expect(report.items.length).toBe(6); // voided excluded
  });

  it('filters ageing report by client accurately', () => {
    const reportAlpha = calculateArAgeing(testInvoices, {
      asOfDate: asOf,
      clientFilter: 'Client Alpha',
    });

    expect(reportAlpha.summary.totalOutstanding).toBe(3000);
    expect(reportAlpha.summary.current).toBe(1000);
    expect(reportAlpha.summary.d1to30).toBe(2000);
    expect(reportAlpha.items.every(i => i.clientName === 'Client Alpha')).toBe(true);
  });

  it('correctly categorizes supplier POs into AP ageing buckets', () => {
    const testSpos = [
      {
        poNumber: 'SPO-1',
        supplierName: 'Vendor A',
        remainingUsd: 500,
        paymentTermsDueDate: '2026-06-10', // Current
        status: 'Open',
      },
      {
        poNumber: 'SPO-2',
        supplierName: 'Vendor A',
        remainingUsd: 1500,
        paymentTermsDueDate: '2026-05-10', // 22 days -> 1-30
        status: 'Open',
      },
      {
        poNumber: 'SPO-3',
        supplierName: 'Vendor B',
        remainingUsd: 2500,
        paymentTermsDueDate: '2026-02-01', // 120 days -> 90+
        status: 'Open',
      },
      {
        poNumber: 'SPO-VOID',
        supplierName: 'Vendor B',
        remainingUsd: 9999,
        paymentTermsDueDate: '2026-02-01',
        status: 'Void', // Voided -> excluded
      },
    ];

    const apReport = calculateApAgeing(testSpos, { asOfDate: asOf });
    expect(apReport.summary.totalOutstanding).toBe(4500);
    expect(apReport.summary.current).toBe(500);
    expect(apReport.summary.d1to30).toBe(1500);
    expect(apReport.summary.d90Plus).toBe(2500);
    expect(apReport.items.length).toBe(3);
  });
});


