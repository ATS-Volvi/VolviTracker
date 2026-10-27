import { useMemo } from 'react';
import { convertToUsd } from '../financeCalcs';
import { isExtraPaymentTxn, isSalaryTxn, isVendorOutflowTxn } from './cashbookHelpers';

export function useCashflowCalculation({
  rawTransactions = [],
  activeCompany = null,
  exchangeRates = {},
  streamFilter = 'all',
  extraCategoryFilter = 'all',
  statusFilter = 'all',
  accountFilter = 'all',
  txnSearchQuery = ''
}) {
  const toUsd = (amount, cur) => convertToUsd(amount, cur, exchangeRates);

  // High-level KPI calculation
  const stats = useMemo(() => {
    let totalInflowUsd = 0;
    let totalVendorOutflowUsd = 0;
    let totalExtraPaymentsUsd = 0;
    let salaryPaymentsUsd = 0;
    let rentPaymentsUsd = 0;
    let cloudPaymentsUsd = 0;
    let taxPaymentsUsd = 0;
    let otherExtraUsd = 0;
    let reconciledCount = 0;

    const targetTxns = activeCompany
      ? rawTransactions.filter(t =>
          (t.counterparty || '').toLowerCase() === activeCompany.name.toLowerCase() ||
          (t.entity || '').toLowerCase() === activeCompany.name.toLowerCase() ||
          t.companyId === activeCompany.id
        )
      : rawTransactions;

    targetTxns.forEach(t => {
      const usdVal = t.amountUsd || toUsd(t.amountNative, t.currency);
      if (t.status === 'Reconciled') reconciledCount += 1;

      if (t.type === 'Inflow') {
        totalInflowUsd += usdVal;
      } else if (isExtraPaymentTxn(t)) {
        totalExtraPaymentsUsd += usdVal;
        if (isSalaryTxn(t)) {
          salaryPaymentsUsd += usdVal;
        } else if (t.category?.includes('Rent') || t.description?.toLowerCase().includes('rent') || t.description?.toLowerCase().includes('lease')) {
          rentPaymentsUsd += usdVal;
        } else if (t.category?.includes('Cloud') || t.description?.toLowerCase().includes('aws') || t.description?.toLowerCase().includes('hosting')) {
          cloudPaymentsUsd += usdVal;
        } else if (t.category?.includes('Tax') || t.description?.toLowerCase().includes('gst') || t.description?.toLowerCase().includes('tax')) {
          taxPaymentsUsd += usdVal;
        } else {
          otherExtraUsd += usdVal;
        }
      } else if (t.type === 'Outflow') {
        totalVendorOutflowUsd += usdVal;
      }
    });

    const totalOutflowUsd = totalVendorOutflowUsd + totalExtraPaymentsUsd;
    const netCashflowUsd = totalInflowUsd - totalOutflowUsd;
    const netMarginPercent = totalInflowUsd > 0 ? Math.round((netCashflowUsd / totalInflowUsd) * 100) : 0;
    const reconRate = targetTxns.length > 0 ? Math.round((reconciledCount / targetTxns.length) * 100) : 100;

    return {
      totalInflowUsd,
      totalVendorOutflowUsd,
      totalExtraPaymentsUsd,
      totalOutflowUsd,
      netCashflowUsd,
      netMarginPercent,
      salaryPaymentsUsd,
      rentPaymentsUsd,
      cloudPaymentsUsd,
      taxPaymentsUsd,
      otherExtraUsd,
      totalCount: targetTxns.length,
      reconciledCount,
      reconRate
    };
  }, [rawTransactions, activeCompany, exchangeRates]);

  // Filtered transactions for the ledger table
  const filteredTransactions = useMemo(() => {
    let list = rawTransactions;

    if (activeCompany) {
      list = list.filter(t =>
        (t.counterparty || '').toLowerCase() === activeCompany.name.toLowerCase() ||
        (t.entity || '').toLowerCase() === activeCompany.name.toLowerCase() ||
        t.companyId === activeCompany.id
      );
    }

    return list.filter(t => {
      if (streamFilter === 'Inflow' && t.type !== 'Inflow') return false;
      if (streamFilter === 'Outflow' && t.type !== 'Outflow' && !isExtraPaymentTxn(t)) return false;
      if (streamFilter === 'Vendor' && !isVendorOutflowTxn(t)) return false;
      if (streamFilter === 'Extra' && !isExtraPaymentTxn(t)) return false;
      if (streamFilter === 'Transfer' && t.type !== 'Transfer') return false;

      if (extraCategoryFilter !== 'all') {
        if (extraCategoryFilter === 'Salary' && !isSalaryTxn(t)) return false;
        if (extraCategoryFilter === 'Rent' && !(t.category?.includes('Rent') || t.description?.toLowerCase().includes('rent'))) return false;
        if (extraCategoryFilter === 'Cloud' && !(t.category?.includes('Cloud') || t.description?.toLowerCase().includes('cloud') || t.description?.toLowerCase().includes('aws'))) return false;
        if (extraCategoryFilter === 'Tax' && !(t.category?.includes('Tax') || t.description?.toLowerCase().includes('tax'))) return false;
      }

      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (accountFilter !== 'all' && t.accountId !== accountFilter && t.transferToAccountId !== accountFilter) return false;

      if (txnSearchQuery.trim()) {
        const q = txnSearchQuery.toLowerCase();
        const match =
          t.voucherNo?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.counterparty?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.linkedInvoice?.toLowerCase().includes(q) ||
          t.linkedPo?.toLowerCase().includes(q) ||
          t.accountName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rawTransactions, activeCompany, streamFilter, extraCategoryFilter, statusFilter, accountFilter, txnSearchQuery]);

  // Cumulative running balance in chronological order
  const transactionsWithRunningBalance = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningNet = 0;

    const withBalance = sorted.map(t => {
      const isCredit = t.type === 'Inflow';
      const usdVal = t.amountUsd || toUsd(t.amountNative, t.currency);
      if (isCredit) {
        runningNet += usdVal;
      } else {
        runningNet -= usdVal;
      }
      return {
        ...t,
        runningNetBalanceUsd: runningNet
      };
    });

    return withBalance.reverse();
  }, [filteredTransactions, exchangeRates]);

  return {
    stats,
    filteredTransactions,
    transactionsWithRunningBalance,
    toUsd
  };
}
