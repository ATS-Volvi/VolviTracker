import { describe, it, expect } from 'vitest';
import { parseDateToYmd, extractInvoiceData } from './invoiceExtractor';

describe('invoiceExtractor tests', () => {
  it('parses diverse date formats correctly to YYYY-MM-DD', () => {
    expect(parseDateToYmd('18-Nov-2026')).toBe('2026-11-18');
    expect(parseDateToYmd('Nov 18, 2026')).toBe('2026-11-18');
    expect(parseDateToYmd('2026-11-18')).toBe('2026-11-18');
    expect(parseDateToYmd('18/11/2026')).toBe('2026-11-18');
  });

  it('extracts structured invoice details from text document', () => {
    const rawText = `
      TAX INVOICE
      Invoice Number: VOL-EXP-INV-2026099
      Invoice Date: 18-Nov-2026
      Billed To: NexaCorp International Ltd.
      Client PO Number: VOL-CPO-2026001
      Payment Terms: Net 30 Days
      Milestone: Phase 1 Deliverables
      Subtotal: $ 45,000.00
      Total Amount Due: $ 47,250.00
      Currency: USD
      Location: New York, USA
      Notes: Swift transfer to treasury account
    `;

    const result = extractInvoiceData(rawText, 'Invoice_NexaCorp.pdf', {
      clientsList: [{ name: 'NexaCorp International Ltd.', country: 'New York, USA' }],
      clientPosList: [{ poNumber: 'VOL-CPO-2026001', id: 'po-1' }]
    });

    expect(result.extracted.invoiceNumber).toBe('VOL-EXP-INV-2026099');
    expect(result.extracted.currency).toBe('USD');
    expect(result.extracted.clientName).toBe('NexaCorp International Ltd.');
    expect(result.extracted.selectedClientPoId).toBe('po-1');
    expect(result.extracted.invoicingDate).toBe('2026-11-18');
    expect(result.extracted.paymentTermDays).toBe(30);
    expect(result.extracted.invoiceValue).toBe(47250);
    expect(result.extracted.milestonesText).toBe('Phase 1 Deliverables');
    expect(result.extractedCount).toBeGreaterThanOrEqual(7);
  });
});
