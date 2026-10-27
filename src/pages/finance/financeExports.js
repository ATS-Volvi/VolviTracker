// Export Utilities for Volvitech Financial Operations Suite using xlsx
import * as XLSX from 'xlsx';

/**
 * Low-level spreadsheet generator for XLSX or CSV
 */
export function exportToSpreadsheet(dataRows, filename = 'export', sheetName = 'Data', format = 'xlsx') {
  if (!Array.isArray(dataRows) || dataRows.length === 0) {
    throw new Error('No records available to export.');
  }

  const ws = XLSX.utils.json_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Sheet1').slice(0, 31));

  const ext = format === 'csv' ? 'csv' : 'xlsx';
  const cleanFilename = `${filename.replace(/\.[^/.]+$/, '')}.${ext}`;

  XLSX.writeFile(wb, cleanFilename, { bookType: ext });
  return cleanFilename;
}

/**
 * Export Client Invoices
 */
export function exportInvoicesToSpreadsheet(invoices = [], format = 'xlsx') {
  const rows = invoices.map(inv => ({
    'Invoice Number': inv.invoiceNumber || '',
    'Linked Client PO': inv.linkedPo || inv.linkedPoNumber || '',
    'Client Name': inv.clientName || '',
    'Country': inv.country || '',
    'Issue Date': inv.issueDate || inv.date || '',
    'Due Date': inv.dueDate || '',
    'Tax Rate (%)': Number(inv.taxPercent ?? inv.taxRate ?? 0),
    'Taxable Amount (Native)': Number(inv.amountNative || 0),
    'Currency': inv.currency || 'USD',
    'Amount (USD)': Number(inv.amountUsd || 0),
    'Received (USD)': Number(inv.receivedUsd || 0),
    'Outstanding Balance (USD)': Number(inv.balanceUsd || 0),
    'Status': inv.status || 'Pending',
    'Milestone Description': inv.milestone || '',
    'Void Reason': inv.voidReason || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Client_Invoices_${dateStr}`, 'Invoices', format);
}

/**
 * Export Client Purchase Orders
 */
export function exportClientPosToSpreadsheet(clientPos = [], format = 'xlsx') {
  const rows = clientPos.map(cpo => ({
    'PO Number': cpo.poNumber || '',
    'Client Name': cpo.clientName || '',
    'Operating Entity': cpo.entity || '',
    'Issue Date': cpo.issueDate || cpo.date || '',
    'Currency': cpo.currency || 'USD',
    'Total Value (Native)': Number(cpo.totalValueNative || 0),
    'Total Value (USD)': Number(cpo.totalValueUsd || 0),
    'Invoiced (USD)': Number(cpo.invoicedUsd || 0),
    'Drawdown (%)': Number(cpo.drawdownPercent || 0),
    'Remaining Headroom (USD)': Number(cpo.remainingUsd || (cpo.totalValueUsd - (cpo.invoicedUsd || 0))),
    'Payment Terms': cpo.terms || cpo.paymentTerms || '',
    'Status': cpo.status || 'Active',
    'Void Reason': cpo.voidReason || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Client_Purchase_Orders_${dateStr}`, 'Client POs', format);
}

/**
 * Export Supplier Purchase Orders
 */
export function exportSupplierPosToSpreadsheet(supplierPos = [], format = 'xlsx') {
  const rows = supplierPos.map(spo => ({
    'Supplier PO Number': spo.poNumber || '',
    'Supplier / Vendor': spo.supplierName || '',
    'Operating Entity': spo.entity || '',
    'Jurisdiction / Origin': spo.origin || '',
    'Linked Client PO': spo.linkedClientPo || '',
    'Issue Date': spo.issueDate || spo.date || '',
    'Payment Terms': spo.terms || spo.paymentTerms || '',
    'Currency': spo.currency || 'USD',
    'Committed Value (Native)': Number(spo.committedNative || spo.totalValueNative || 0),
    'Committed Value (USD)': Number(spo.committedUsd || spo.totalValueUsd || 0),
    'Billed (USD)': Number(spo.billedUsd || 0),
    'Billed (%)': Number(spo.billedPercent || 0),
    'Remaining Headroom (USD)': Number(spo.remainingUsd || 0),
    'Status': spo.status || 'Open',
    'Void Reason': spo.voidReason || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Supplier_Purchase_Orders_${dateStr}`, 'Supplier POs', format);
}

/**
 * Export Payments Received (Inflow Collections)
 */
export function exportPaymentsReceivedToSpreadsheet(payments = [], format = 'xlsx') {
  const rows = payments.map(pmt => ({
    'Payment Voucher ID': pmt.id || '',
    'Receipt Date': pmt.date || '',
    'Client Name': pmt.clientName || '',
    'Target Invoice': pmt.invoiceNumber || '',
    'Settlement Method': pmt.mode || pmt.paymentMode || '',
    'Bank Reference / UTR': pmt.reference || '',
    'Disbursed Amount (Native)': Number(pmt.amountNative || 0),
    'Currency': pmt.currency || 'USD',
    'Disbursed Amount (USD)': Number(pmt.amountUsd || 0),
    'Exchange Rate': Number(pmt.exchangeRate || 1.0),
    'Account ID': pmt.accountId || '',
    'Status': pmt.status || 'Cleared'
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Client_Payment_Receipts_${dateStr}`, 'Receipts', format);
}

/**
 * Export Payments Made (Vendor Disbursements)
 */
export function exportPaymentsMadeToSpreadsheet(payments = [], format = 'xlsx') {
  const rows = payments.map(pmt => ({
    'Payment Voucher ID': pmt.id || '',
    'Disbursement Date': pmt.date || '',
    'Supplier / Vendor': pmt.supplierName || '',
    'Target Supplier PO': pmt.supplierPoNumber || '',
    'Settlement Method': pmt.mode || pmt.paymentMode || '',
    'Bank Reference / Remittance': pmt.reference || '',
    'Disbursed Amount (Native)': Number(pmt.amountNative || 0),
    'Currency': pmt.currency || 'USD',
    'Disbursed Amount (USD)': Number(pmt.amountUsd || 0),
    'Exchange Rate': Number(pmt.exchangeRate || 1.0),
    'Account ID': pmt.accountId || '',
    'Status': pmt.status || 'Cleared'
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Supplier_Disbursements_${dateStr}`, 'Disbursements', format);
}

/**
 * Export AR Ageing Report
 */
export function exportArAgeingToSpreadsheet(arReport, asOfDate, format = 'xlsx') {
  const asOf = asOfDate || new Date().toISOString().slice(0, 10);
  const rows = (arReport.items || []).map(inv => ({
    'Client Name': inv.clientName || '',
    'Invoice Number': inv.invoiceNumber || '',
    'Linked PO': inv.linkedPo || inv.linkedPoNumber || '',
    'Issue Date': inv.issueDate || inv.date || '',
    'Due Date': inv.dueDate || '',
    'As Of Date': asOf,
    'Days Overdue': Number(inv.daysOverdue || 0),
    'Ageing Bucket': inv.bucket || 'current',
    'Outstanding Balance (USD)': Number(inv.amountDue || 0),
    'Total Invoice (USD)': Number(inv.amountUsd || 0),
    'Status': inv.status || 'Pending'
  }));

  return exportToSpreadsheet(rows, `AR_Ageing_Report_AsOf_${asOf}`, 'AR Ageing', format);
}

/**
 * Export AP Ageing Report
 */
export function exportApAgeingToSpreadsheet(apReport, asOfDate, format = 'xlsx') {
  const asOf = asOfDate || new Date().toISOString().slice(0, 10);
  const rows = (apReport.items || []).map(spo => ({
    'Supplier Name': spo.supplierName || '',
    'Supplier PO Number': spo.poNumber || '',
    'Operating Entity': spo.entity || '',
    'Issue Date': spo.issueDate || spo.date || '',
    'Payment Due Date': spo.dueDate || '',
    'As Of Date': asOf,
    'Days Overdue': Number(spo.daysOverdue || 0),
    'Ageing Bucket': spo.bucket || 'current',
    'Outstanding Payable (USD)': Number(spo.amountDue || 0),
    'Committed PO Value (USD)': Number(spo.committedUsd || spo.totalValueUsd || 0),
    'Status': spo.status || 'Open'
  }));

  return exportToSpreadsheet(rows, `AP_Ageing_Report_AsOf_${asOf}`, 'AP Ageing', format);
}

/**
 * Export Cash Book Transactions
 */
export function exportCashBookToSpreadsheet(transactions = [], format = 'xlsx') {
  const rows = transactions.map(t => ({
    'Date': t.date || '',
    'Voucher No': t.voucherNo || t.id || '',
    'Flow Type': t.type || '',
    'Category': t.category || '',
    'Operating Entity': t.entity || '',
    'Counterparty': t.counterparty || '',
    'Bank Account': t.accountName || '',
    'Currency': t.currency || 'USD',
    'Amount (Native)': Number(t.amountNative || 0),
    'Amount (USD)': Number(t.amountUsd || 0),
    'Exchange Rate': Number(t.exchangeRate || 1.0),
    'Reference / Check #': t.reference || '',
    'Linked Invoice': t.linkedInvoice || '',
    'Linked PO': t.linkedPo || '',
    'Status': t.status || 'Cleared',
    'Description / Notes': t.description || t.notes || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  return exportToSpreadsheet(rows, `Cash_Book_Ledger_${dateStr}`, 'Cash Book', format);
}
