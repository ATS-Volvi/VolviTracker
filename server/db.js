import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import * as seedFinance from './seedFinance.js';

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error('[DB] Neither DATABASE_URL nor POSTGRES_URL is defined in environment variables.');
}

export const sql = neon(dbUrl);

export const toNum = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
};

export const safeJson = (val, fallback = []) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

// Transform DB snake_case to frontend camelCase (never exposes password hashes)
export const toEmployeeDto = (row) => row ? ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role || 'Member',
  avatar: row.avatar || '',
  isAdmin: Boolean(row.is_admin || (row.role || '').toLowerCase() === 'admin'),
  userType: row.user_type || 'internal',
  externalType: row.external_type || null,
  organization: row.organization || (row.user_type === 'external' ? '' : 'Volvitech')
}) : null;

// Finance DTO Converters
export const toFinanceProjectDto = (row) => row ? ({
  id: row.id,
  projectName: row.project_name,
  clientName: row.client_name || '',
  country: row.country || '',
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  contractValue: toNum(row.contract_value),
  contractValueNative: toNum(row.contract_value_native),
  invoicedAmount: toNum(row.invoiced_amount),
  invoicedPercent: toNum(row.invoiced_percent),
  supplierCosts: toNum(row.supplier_costs),
  laborCosts: toNum(row.labor_costs),
  grossMargin: toNum(row.gross_margin),
  grossMarginPercent: toNum(row.gross_margin_percent),
  status: row.status || 'Healthy',
  unit: row.unit || '',
  poNumber: row.po_number || ''
}) : null;

export const toClientPoDto = (row) => row ? ({
  id: row.id,
  poNumber: row.po_number,
  issueDate: row.issue_date || '',
  clientName: row.client_name || '',
  flag: row.flag || '',
  country: row.country || '',
  scope: row.scope || '',
  totalValueNative: toNum(row.total_value_native),
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  totalValueUsd: toNum(row.total_value_usd),
  invoicedNative: toNum(row.invoiced_native),
  drawdownPercent: toNum(row.drawdown_percent),
  remainingNative: toNum(row.remaining_native),
  remainingPercent: toNum(row.remaining_percent),
  terms: row.terms || 'Net 30',
  status: row.status || 'Active',
  voidReason: row.void_reason || '',
  voidedAt: row.voided_at ? new Date(row.voided_at).toISOString() : '',
  voidedBy: row.voided_by || '',
  isVoid: row.status === 'Void',
  milestones: safeJson(row.milestones, [])
}) : null;

export const toInvoiceDto = (row) => row ? ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  linkedPo: row.linked_po || '',
  clientName: row.client_name || '',
  country: row.country || '',
  issueDate: row.issue_date || '',
  dueDate: row.due_date || '',
  amountNative: toNum(row.amount_native),
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  amountUsd: toNum(row.amount_usd),
  receivedUsd: toNum(row.received_usd),
  balanceUsd: toNum(row.balance_usd),
  status: row.status || 'Pending',
  voidReason: row.void_reason || '',
  voidedAt: row.voided_at ? new Date(row.voided_at).toISOString() : '',
  voidedBy: row.voided_by || '',
  isVoid: row.status === 'Void',
  milestone: row.milestone || '',
  taxPercent: toNum(row.tax_percent)
}) : null;

export const toSupplierPoDto = (row) => row ? ({
  id: row.id,
  poNumber: row.po_number,
  entity: row.entity || '',
  supplierName: row.supplier_name || '',
  origin: row.origin || '',
  taxId: row.tax_id || '',
  linkedProject: row.linked_project || '',
  linkedClientPo: row.linked_client_po || '',
  committedUsd: toNum(row.committed_usd),
  committedNative: toNum(row.committed_native),
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  billedUsd: toNum(row.billed_usd),
  billedPercent: toNum(row.billed_percent),
  paidUsd: toNum(row.paid_usd),
  balanceUsd: toNum(row.balance_usd),
  paymentTerms: row.payment_terms || '',
  status: row.status || 'Open',
  voidReason: row.void_reason || '',
  voidedAt: row.voided_at ? new Date(row.voided_at).toISOString() : '',
  voidedBy: row.voided_by || '',
  isVoid: row.status === 'Void',
  items: safeJson(row.items, [])
}) : null;

export const toAuditLogDto = (row) => row ? ({
  id: row.id,
  userEmail: row.user_email || '',
  userName: row.user_name || '',
  action: row.action || '',
  entityType: row.entity_type || '',
  entityId: row.entity_id || '',
  oldValues: safeJson(row.old_values, {}),
  newValues: safeJson(row.new_values, {}),
  reason: row.reason || '',
  timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
}) : null;

export const toLockedPeriodDto = (row) => row ? ({
  period: row.period,
  lockedAt: row.locked_at ? new Date(row.locked_at).toISOString() : '',
  lockedBy: row.locked_by || '',
  reason: row.reason || ''
}) : null;

export const toPaymentReceivedDto = (row) => row ? ({
  id: row.id,
  date: row.date || '',
  clientName: row.client_name || '',
  invoiceNumber: row.invoice_number || '',
  linkedPo: row.linked_po || '',
  amountNative: toNum(row.amount_native),
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  amountUsd: toNum(row.amount_usd),
  mode: row.mode || '',
  reference: row.reference || '',
  status: row.status || 'Settled',
  notes: row.notes || '',
  accountId: row.account_id || ''
}) : null;

export const toPaymentMadeDto = (row) => row ? ({
  id: row.id,
  date: row.date || '',
  supplierName: row.supplier_name || '',
  supplierPoNumber: row.supplier_po_number || '',
  amountNative: toNum(row.amount_native),
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  amountUsd: toNum(row.amount_usd),
  mode: row.mode || '',
  reference: row.reference || '',
  status: row.status || 'Paid',
  notes: row.notes || '',
  accountId: row.account_id || ''
}) : null;

export const toCashAccountDto = (row) => row ? ({
  id: row.id,
  accountName: row.account_name || '',
  accountType: row.account_type || 'Bank Account',
  accountNumber: row.account_number || '',
  bankName: row.bank_name || '',
  entity: row.entity || '',
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  openingBalance: toNum(row.opening_balance),
  currentBalance: toNum(row.current_balance),
  balanceNative: toNum(row.current_balance),
  balanceUsd: toNum(row.exchange_rate, 1.0) > 0 ? toNum(row.current_balance) / toNum(row.exchange_rate, 1.0) : toNum(row.current_balance),
  status: row.status || 'Active',
  isPrimary: Boolean(row.is_primary)
}) : null;

export const toCashTransactionDto = (row) => row ? ({
  id: row.id,
  date: row.date || '',
  voucherNo: row.voucher_no || '',
  type: row.type || 'Inflow',
  category: row.category || '',
  accountId: row.account_id || '',
  accountName: row.account_name || '',
  transferToAccountId: row.transfer_to_account_id || '',
  transferToAccountName: row.transfer_to_account_name || '',
  entity: row.entity || '',
  counterparty: row.counterparty || '',
  description: row.description || '',
  reference: row.reference || '',
  linkedInvoice: row.linked_invoice || '',
  linkedPo: row.linked_po || '',
  linkedPaymentId: row.linked_payment_id || '',
  paymentMode: row.payment_mode || '',
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  amountNative: toNum(row.amount_native),
  amountUsd: toNum(row.amount_usd),
  status: row.status || 'Reconciled',
  notes: row.notes || ''
}) : null;

export const toMasterDirectoryDto = (row) => row ? ({
  id: row.id,
  name: row.name || '',
  category: row.category || 'Client',
  classification: row.classification || 'International',
  country: row.country || '',
  avatarText: row.avatar_text || '',
  department: row.department || '',
  companyMail: row.company_mail || '',
  taxId: row.tax_id || '',
  taxDescription: row.tax_description || '',
  contactPerson: row.contact_person || '',
  contactEmail: row.contact_email || '',
  contactPhone: row.contact_phone || '',
  contact: row.contact || '',
  stakeholders: safeJson(row.stakeholders, []),
  creditTerms: row.credit_terms || '',
  creditLimit: row.credit_limit || '',
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0),
  activePoVolume: row.active_po_volume || '',
  activePoCount: toNum(row.active_po_count),
  compliance: row.compliance || '',
  docsCount: toNum(row.docs_count),
  lifetimeBilled: row.lifetime_billed || '',
  unbilledCap: row.unbilled_cap || '',
  avgDso: row.avg_dso || '',
  bankDetails: safeJson(row.bank_details, {}),
  attachedDocs: safeJson(row.attached_docs, [])
}) : null;

export const toDocumentVaultDto = (row) => row ? ({
  id: row.id,
  title: row.title || '',
  category: row.category || 'General',
  entityName: row.entity_name || '',
  fileType: row.file_type || 'PDF',
  size: row.size || '',
  updatedDate: row.updated_date || '',
  expiryDate: row.expiry_date || '',
  hash: row.hash || '',
  tags: safeJson(row.tags, []),
  url: row.url || '',
  currency: row.currency || 'USD',
  exchangeRate: toNum(row.exchange_rate, 1.0)
}) : null;

const parseJsonArray = (val) => safeJson(val, []);

export const toProjectDto = (row) => row ? ({
  id: row.id,
  name: row.name,
  createdBy: row.created_by ? String(row.created_by) : '',
  clientName: row.client_name || '',
  contactDesignation: row.contact_designation || row.client_designation || '',
  clientDesignation: row.contact_designation || row.client_designation || '',
  pocName: row.poc_name || '',
  refererName: row.referer_name || '',
  contactNumber: row.contact_number || '',
  contactEmail: row.contact_email || '',
  status: row.status || 'Not started',
  startDate: row.start_date || '',
  endDate: row.end_date || '',
  startValue: Number(row.start_value) || 0,
  endValue: Number(row.end_value) || 100,
  progress: Number(row.progress) || 0,
  assigneeIds: parseJsonArray(row.assignee_ids),
  assigneeId: row.assignee_id ? String(row.assignee_id) : ''
}) : null;

export const toTaskDto = (row) => row ? ({
  id: String(row.id),
  name: row.name,
  projectId: row.project_id ? String(row.project_id) : '',
  parentId: row.parent_id ? String(row.parent_id) : null,
  status: row.status || 'Not started',
  dueDate: row.due_date || '',
  createdDate: row.created_date || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : ''),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  priority: row.priority || 'Medium',
  description: row.description || '',
  assigneeIds: parseJsonArray(row.assignee_ids),
  assigneeId: row.assignee_id ? String(row.assignee_id) : ''
}) : null;

export const toMeetingDto = (row) => row ? ({
  id: row.id,
  name: row.name,
  dateTime: row.date_time || '',
  status: row.status || 'Not started',
  url: row.url || '',
  attendeeIds: parseJsonArray(row.attendee_ids),
  attendeeId: row.attendee_id ? String(row.attendee_id) : ''
}) : null;

export const toDocDto = (row) => row ? ({
  id: row.id,
  title: row.title,
  category: row.category || 'General',
  summary: row.summary || '',
  content: row.content || '',
  tags: parseJsonArray(row.tags),
  externalUrl: row.external_url || '',
  authorId: row.author_id ? String(row.author_id) : '',
  authorName: row.author_name || '',
  authorRole: row.author_role || '',
  authorAvatar: row.author_avatar || '',
  isPinned: Boolean(row.is_pinned),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
}) : null;

let isInitialized = false;

// Initialize database schema tables & seed if empty
export async function initDb() {
  if (isInitialized) return;

  try {
    // 1. Employees Table
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'Member',
        avatar TEXT DEFAULT '',
        password_hash TEXT DEFAULT '',
        is_admin BOOLEAN DEFAULT FALSE,
        user_type TEXT DEFAULT 'internal',
        external_type TEXT DEFAULT NULL,
        organization TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'internal';`;
    await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS external_type TEXT DEFAULT NULL;`;
    await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT '';`;

    // 2. Projects Table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        client_name TEXT DEFAULT '',
        contact_designation TEXT DEFAULT '',
        client_designation TEXT DEFAULT '',
        poc_name TEXT DEFAULT '',
        referer_name TEXT DEFAULT '',
        contact_number TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'Not started',
        start_date TEXT,
        end_date TEXT,
        start_value NUMERIC DEFAULT 0,
        end_value NUMERIC DEFAULT 100,
        progress NUMERIC DEFAULT 0,
        assignee_ids JSONB DEFAULT '[]'::jsonb,
        assignee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_designation TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_designation TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS poc_name TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS referer_name TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '';`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignee_ids JSONB DEFAULT '[]'::jsonb;`;
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignee_id VARCHAR(100);`;

    // 3. Tasks Table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        project_id VARCHAR(100),
        parent_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Not started',
        due_date TEXT,
        priority VARCHAR(50) DEFAULT 'Medium',
        description TEXT DEFAULT '',
        assignee_ids JSONB DEFAULT '[]'::jsonb,
        assignee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id VARCHAR(100);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);`;

    // 4. Meetings Table
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        date_time TEXT,
        status VARCHAR(50) DEFAULT 'Not started',
        url TEXT DEFAULT '',
        attendee_ids JSONB DEFAULT '[]'::jsonb,
        attendee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 5. Docs Table
    await sql`
      CREATE TABLE IF NOT EXISTS docs (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        tags JSONB DEFAULT '[]'::jsonb,
        external_url TEXT DEFAULT '',
        author_id VARCHAR(100),
        author_name TEXT DEFAULT '',
        author_role TEXT DEFAULT '',
        author_avatar TEXT DEFAULT '',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 6. Exchange Rates Table
    await sql`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        currency VARCHAR(10) PRIMARY KEY,
        rate NUMERIC(18,4) NOT NULL,
        effective_date TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 7. Finance Projects Table
    await sql`
      CREATE TABLE IF NOT EXISTS finance_projects (
        id VARCHAR(100) PRIMARY KEY,
        project_name TEXT NOT NULL,
        client_name TEXT DEFAULT '',
        country TEXT DEFAULT '',
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        contract_value NUMERIC(18,2) DEFAULT 0,
        contract_value_native NUMERIC(18,2) DEFAULT 0,
        invoiced_amount NUMERIC(18,2) DEFAULT 0,
        invoiced_percent NUMERIC(18,2) DEFAULT 0,
        supplier_costs NUMERIC(18,2) DEFAULT 0,
        labor_costs NUMERIC(18,2) DEFAULT 0,
        gross_margin NUMERIC(18,2) DEFAULT 0,
        gross_margin_percent NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Healthy',
        unit TEXT DEFAULT '',
        po_number TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 8. Client POs Table
    await sql`
      CREATE TABLE IF NOT EXISTS client_pos (
        id VARCHAR(100) PRIMARY KEY,
        po_number TEXT NOT NULL,
        issue_date TEXT DEFAULT '',
        client_name TEXT NOT NULL,
        flag TEXT DEFAULT '',
        country TEXT DEFAULT '',
        scope TEXT DEFAULT '',
        total_value_native NUMERIC(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        total_value_usd NUMERIC(18,2) DEFAULT 0,
        invoiced_native NUMERIC(18,2) DEFAULT 0,
        drawdown_percent NUMERIC(18,2) DEFAULT 0,
        remaining_native NUMERIC(18,2) DEFAULT 0,
        remaining_percent NUMERIC(18,2) DEFAULT 0,
        terms TEXT DEFAULT 'Net 30',
        status VARCHAR(50) DEFAULT 'Active',
        milestones JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 9. Invoices Table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number TEXT NOT NULL,
        linked_po TEXT DEFAULT '',
        client_name TEXT DEFAULT '',
        country TEXT DEFAULT '',
        issue_date TEXT DEFAULT '',
        due_date TEXT DEFAULT '',
        amount_native NUMERIC(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        amount_usd NUMERIC(18,2) DEFAULT 0,
        received_usd NUMERIC(18,2) DEFAULT 0,
        balance_usd NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        milestone TEXT DEFAULT '',
        tax_percent NUMERIC(18,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 10. Supplier POs Table
    await sql`
      CREATE TABLE IF NOT EXISTS supplier_pos (
        id VARCHAR(100) PRIMARY KEY,
        po_number TEXT NOT NULL,
        entity TEXT DEFAULT '',
        supplier_name TEXT NOT NULL,
        origin TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        linked_project TEXT DEFAULT '',
        linked_client_po TEXT DEFAULT '',
        committed_usd NUMERIC(18,2) DEFAULT 0,
        committed_native NUMERIC(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        billed_usd NUMERIC(18,2) DEFAULT 0,
        billed_percent NUMERIC(18,2) DEFAULT 0,
        paid_usd NUMERIC(18,2) DEFAULT 0,
        balance_usd NUMERIC(18,2) DEFAULT 0,
        payment_terms TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'Open',
        items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 11. Payments Received Table
    await sql`
      CREATE TABLE IF NOT EXISTS payments_received (
        id VARCHAR(100) PRIMARY KEY,
        date TEXT DEFAULT '',
        client_name TEXT DEFAULT '',
        invoice_number TEXT DEFAULT '',
        linked_po TEXT DEFAULT '',
        amount_native NUMERIC(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        amount_usd NUMERIC(18,2) DEFAULT 0,
        mode TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'Settled',
        notes TEXT DEFAULT '',
        account_id VARCHAR(100) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 12. Payments Made Table
    await sql`
      CREATE TABLE IF NOT EXISTS payments_made (
        id VARCHAR(100) PRIMARY KEY,
        date TEXT DEFAULT '',
        supplier_name TEXT DEFAULT '',
        supplier_po_number TEXT DEFAULT '',
        amount_native NUMERIC(18,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        amount_usd NUMERIC(18,2) DEFAULT 0,
        mode TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'Paid',
        notes TEXT DEFAULT '',
        account_id VARCHAR(100) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 13. Cash Accounts Table
    await sql`
      CREATE TABLE IF NOT EXISTS cash_accounts (
        id VARCHAR(100) PRIMARY KEY,
        account_name TEXT NOT NULL,
        account_type TEXT DEFAULT 'Bank Account',
        account_number TEXT DEFAULT '',
        bank_name TEXT DEFAULT '',
        entity TEXT DEFAULT '',
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        opening_balance NUMERIC(18,2) DEFAULT 0,
        current_balance NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 14. Cash Transactions Table
    await sql`
      CREATE TABLE IF NOT EXISTS cash_transactions (
        id VARCHAR(100) PRIMARY KEY,
        date TEXT DEFAULT '',
        voucher_no TEXT DEFAULT '',
        type VARCHAR(50) DEFAULT 'Inflow',
        category TEXT DEFAULT '',
        account_id VARCHAR(100) DEFAULT '',
        account_name TEXT DEFAULT '',
        transfer_to_account_id VARCHAR(100) DEFAULT '',
        transfer_to_account_name TEXT DEFAULT '',
        entity TEXT DEFAULT '',
        counterparty TEXT DEFAULT '',
        description TEXT DEFAULT '',
        reference TEXT DEFAULT '',
        linked_invoice TEXT DEFAULT '',
        linked_po TEXT DEFAULT '',
        linked_payment_id VARCHAR(100) DEFAULT '',
        payment_mode TEXT DEFAULT '',
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        amount_native NUMERIC(18,2) DEFAULT 0,
        amount_usd NUMERIC(18,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Reconciled',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 15. Master Directory Table
    await sql`
      CREATE TABLE IF NOT EXISTS master_directory (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'Client',
        classification VARCHAR(50) DEFAULT 'International',
        country TEXT DEFAULT '',
        avatar_text VARCHAR(10) DEFAULT '',
        department TEXT DEFAULT '',
        company_mail TEXT DEFAULT '',
        tax_id TEXT DEFAULT '',
        tax_description TEXT DEFAULT '',
        contact_person TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        contact_phone TEXT DEFAULT '',
        contact TEXT DEFAULT '',
        stakeholders JSONB DEFAULT '[]'::jsonb,
        credit_terms TEXT DEFAULT '',
        credit_limit TEXT DEFAULT '',
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        active_po_volume TEXT DEFAULT '',
        active_po_count INT DEFAULT 0,
        compliance TEXT DEFAULT '',
        docs_count INT DEFAULT 0,
        lifetime_billed TEXT DEFAULT '',
        unbilled_cap TEXT DEFAULT '',
        avg_dso TEXT DEFAULT '',
        bank_details JSONB DEFAULT '{}'::jsonb,
        attached_docs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 16. Document Vault Table
    await sql`
      CREATE TABLE IF NOT EXISTS document_vault (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'General',
        entity_name TEXT DEFAULT '',
        file_type VARCHAR(20) DEFAULT 'PDF',
        size TEXT DEFAULT '',
        updated_date TEXT DEFAULT '',
        expiry_date TEXT DEFAULT '',
        hash TEXT DEFAULT '',
        tags JSONB DEFAULT '[]'::jsonb,
        url TEXT DEFAULT '',
        currency VARCHAR(10) DEFAULT 'USD',
        exchange_rate NUMERIC(18,4) DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 17. Finance Audit Log Table
    await sql`
      CREATE TABLE IF NOT EXISTS finance_audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) DEFAULT '',
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        old_values JSONB DEFAULT '{}'::jsonb,
        new_values JSONB DEFAULT '{}'::jsonb,
        reason TEXT DEFAULT '',
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 18. Finance Locked Periods Table
    await sql`
      CREATE TABLE IF NOT EXISTS finance_locked_periods (
        period VARCHAR(7) PRIMARY KEY,
        locked_at TIMESTAMPTZ DEFAULT NOW(),
        locked_by VARCHAR(255) NOT NULL,
        reason TEXT DEFAULT ''
      );
    `;

    // Schema Migrations for Foreign Keys & Metadata
    try {
      await sql`ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS linked_payment_id VARCHAR(100) DEFAULT '';`;
      await sql`ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS effective_date TEXT DEFAULT '';`;
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS void_reason TEXT DEFAULT '';`;
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;`;
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voided_by TEXT DEFAULT '';`;
      await sql`ALTER TABLE client_pos ADD COLUMN IF NOT EXISTS void_reason TEXT DEFAULT '';`;
      await sql`ALTER TABLE client_pos ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;`;
      await sql`ALTER TABLE client_pos ADD COLUMN IF NOT EXISTS voided_by TEXT DEFAULT '';`;
      await sql`ALTER TABLE supplier_pos ADD COLUMN IF NOT EXISTS void_reason TEXT DEFAULT '';`;
      await sql`ALTER TABLE supplier_pos ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;`;
      await sql`ALTER TABLE supplier_pos ADD COLUMN IF NOT EXISTS voided_by TEXT DEFAULT '';`;
    } catch (migErr) {
      console.warn('[DB] Schema migration notice:', migErr?.message || migErr);
    }

    // Check if initial seeding is needed
    const empCount = await sql`SELECT COUNT(*)::int as count FROM employees;`;
    if (empCount[0]?.count === 0) {
      console.log('[DB] Seeding initial data into Neon PostgreSQL...');
      // Seed default admin and team with bcrypt password
      const initialSeedHash = await bcrypt.hash('swastik', 10);
      
      await sql`
        INSERT INTO employees (id, full_name, email, role, avatar, password_hash) VALUES
        ('1', 'Swastik Kumar', 'swastikk005@gmail.com', 'Admin', 'https://i.pravatar.cc/150?u=swastik', ${initialSeedHash}),
        ('2', 'Amara Patel', 'amara@example.com', 'Designer', 'https://i.pravatar.cc/150?u=amara', ${initialSeedHash}),
        ('3', 'Liam Chen', 'liam@example.com', 'Engineer', 'https://i.pravatar.cc/150?u=liam', ${initialSeedHash}),
        ('4', 'Noor Hassan', 'noor@example.com', 'Engineer', 'https://i.pravatar.cc/150?u=noor', ${initialSeedHash})
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO projects (id, name, assignee_id, assignee_ids, status, start_date, end_date, start_value, end_value, progress) VALUES
        ('p1', 'Public launch of iOS app', '1', '["1"]'::jsonb, 'In progress', '2025-04-09', '2025-04-30', 0, 100, 0.5),
        ('p2', 'Revamp new hire onboarding', '', '[]'::jsonb, 'Done', '2025-01-20', '2025-02-04', 0, 100, 1.0),
        ('p3', 'Quarterly sales planning', '', '[]'::jsonb, 'Not started', '2025-03-24', '2025-03-28', 0, 100, 0)
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO tasks (id, name, project_id, assignee_id, assignee_ids, status, due_date, priority, description) VALUES
        ('t1', 'Design homepage hero', 'p1', '2', '["2"]'::jsonb, 'In progress', '2026-07-20', 'High', 'New hero section with gradient.'),
        ('t5', 'iOS Beta TestFlight build', 'p1', '1', '["1"]'::jsonb, 'Done', '2026-07-10', 'High', 'TestFlight build submitted and approved.'),
        ('t2', 'Set up CI pipeline', 'p3', '3', '["3"]'::jsonb, 'Not started', '2026-07-25', 'Medium', 'GitHub Actions for lint + test.'),
        ('t3', 'Write API docs', 'p2', '4', '["4"]'::jsonb, 'Done', '2026-07-05', 'Low', 'Document the v1 endpoints.'),
        ('t4', 'User interview synthesis', 'p1', '1', '["1"]'::jsonb, 'In progress', '2026-07-18', 'Medium', 'Summarize 10 interviews.')
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO meetings (id, name, attendee_id, attendee_ids, date_time, status, url) VALUES
        ('m1', 'Sprint Planning', '1', '["1"]'::jsonb, '2026-07-13T09:00:00.000Z', 'Done', 'https://meet.example.com/sprint'),
        ('m2', 'Design Review', '2', '["2"]'::jsonb, '2026-07-20T14:30:00.000Z', 'Not started', ''),
        ('m3', '1:1 with Liam', '3', '["3"]'::jsonb, '2026-07-17T11:00:00.000Z', 'In progress', 'https://meet.example.com/11')
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('[DB] Seeding completed successfully.');
    }

    if (process.env.SEED_FINANCE === 'true') {
      const finCount = await sql`SELECT COUNT(*)::int as count FROM finance_projects;`;
      if (finCount[0]?.count === 0) {
        console.log('[DB] SEED_FINANCE=true: Seeding finance suite data into Neon PostgreSQL...');
        await seedFinanceData();
        console.log('[DB] Finance suite seeding completed.');
      }
    }

    isInitialized = true;
    console.log('[DB] Neon PostgreSQL schema ready.');
  } catch (err) {
    console.error('[DB] Schema initialization error:', err);
    throw err;
  }
}

// Data retrieval for client hydration
export async function getBootstrapData() {
  await initDb();
  let docRows = [];
  const [empRows, projRows, taskRows, meetRows] = await Promise.all([
    sql`SELECT * FROM employees ORDER BY created_at ASC`,
    sql`SELECT * FROM projects ORDER BY created_at ASC`,
    sql`SELECT * FROM tasks ORDER BY created_at ASC`,
    sql`SELECT * FROM meetings ORDER BY created_at ASC`
  ]);

  try {
    docRows = await sql`SELECT * FROM docs ORDER BY created_at DESC`;
  } catch {
    docRows = [];
  }

  return {
    employees: empRows.map(toEmployeeDto),
    projects: projRows.map(toProjectDto),
    tasks: taskRows.map(toTaskDto),
    meetings: meetRows.map(toMeetingDto),
    docs: docRows.map(toDocDto)
  };
}

// Project Operations
export async function createProjectRecord(project, tasks = []) {
  await initDb();
  const id = project.id || ('proj_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const assigneeIdsJson = JSON.stringify(Array.isArray(project.assigneeIds) ? project.assigneeIds : []);
  const assigneeId = (project.assigneeIds && project.assigneeIds[0]) || project.assigneeId || '';
  
  // Calculate progress based on tasks if present
  let progress = Number(project.progress) || 0;
  if (tasks.length > 0) {
    const doneCount = tasks.filter(t => t.status === 'Done').length;
    progress = doneCount / tasks.length;
  }
  let status = progress === 1 ? 'Done' : (progress === 0 ? 'Not started' : (project.status || 'In progress'));

  const clientName = project.clientName || '';
  const contactDesignation = project.contactDesignation || project.clientDesignation || '';
  const pocName = project.pocName || project.pointOfContactName || '';
  const refererName = project.refererName || '';
  const contactNumber = project.contactNumber || project.contactPhone || '';
  const contactEmail = project.contactEmail || '';
  const createdBy = project.createdBy || project.creatorId || '';

  await sql`
    INSERT INTO projects (
      id, name, created_by, client_name, contact_designation, client_designation, poc_name, referer_name, contact_number, contact_email, status, start_date, end_date, start_value, end_value, progress, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${project.name}, ${createdBy}, ${clientName}, ${contactDesignation}, ${contactDesignation}, ${pocName}, ${refererName}, ${contactNumber}, ${contactEmail}, ${status}, ${project.startDate || ''}, ${project.endDate || ''},
      0, 100, ${progress}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      created_by = COALESCE(NULLIF(EXCLUDED.created_by, ''), projects.created_by),
      client_name = EXCLUDED.client_name,
      contact_designation = EXCLUDED.contact_designation,
      client_designation = EXCLUDED.client_designation,
      poc_name = EXCLUDED.poc_name,
      referer_name = EXCLUDED.referer_name,
      contact_number = EXCLUDED.contact_number,
      contact_email = EXCLUDED.contact_email,
      status = EXCLUDED.status,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      progress = EXCLUDED.progress,
      assignee_ids = EXCLUDED.assignee_ids,
      assignee_id = EXCLUDED.assignee_id;
  `;

  // Insert or update bundled tasks
  for (const t of tasks) {
    const tId = t.id && !t.id.startsWith('temp_') ? t.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
    const tAssigneeIdsJson = JSON.stringify(Array.isArray(t.assigneeIds) ? t.assigneeIds : []);
    const tAssigneeId = (t.assigneeIds && t.assigneeIds[0]) || t.assigneeId || '';
    const tParentId = t.parentId ? String(t.parentId) : null;

    await sql`
      INSERT INTO tasks (
        id, name, project_id, parent_id, status, due_date, priority, description, assignee_ids, assignee_id
      ) VALUES (
        ${tId}, ${t.name}, ${id}, ${tParentId}, ${t.status || 'Not started'}, ${t.dueDate || ''},
        ${t.priority || 'Medium'}, ${t.description || ''}, ${tAssigneeIdsJson}::jsonb, ${tAssigneeId}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        project_id = EXCLUDED.project_id,
        parent_id = EXCLUDED.parent_id,
        status = EXCLUDED.status,
        due_date = EXCLUDED.due_date,
        priority = EXCLUDED.priority,
        description = EXCLUDED.description,
        assignee_ids = EXCLUDED.assignee_ids,
        assignee_id = EXCLUDED.assignee_id;
    `;
  }

  const saved = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return toProjectDto(saved[0]);
}

export async function updateProjectRecord(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM projects WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  const createdBy = updates.createdBy !== undefined ? updates.createdBy : (current.created_by || '');
  let progress = updates.progress !== undefined ? Number(updates.progress) : Number(current.progress);
  let status = updates.status !== undefined ? updates.status : current.status;

  if (progress === 0) status = 'Not started';
  else if (progress === 1) status = 'Done';
  else if (status === 'Not started' && progress > 0) status = 'In progress';

  const startDate = updates.startDate !== undefined ? updates.startDate : current.start_date;
  const endDate = updates.endDate !== undefined ? updates.endDate : current.end_date;
  const assigneeIds = updates.assigneeIds !== undefined ? updates.assigneeIds : (current.assignee_ids || []);
  const assigneeIdsJson = JSON.stringify(Array.isArray(assigneeIds) ? assigneeIds : []);
  const assigneeId = updates.assigneeId !== undefined ? updates.assigneeId : ((assigneeIds && assigneeIds[0]) || current.assignee_id || '');

  const clientName = updates.clientName !== undefined ? updates.clientName : (current.client_name || '');
  const contactDesignation = updates.contactDesignation !== undefined ? updates.contactDesignation : (updates.clientDesignation !== undefined ? updates.clientDesignation : (current.contact_designation || current.client_designation || ''));
  const pocName = updates.pocName !== undefined ? updates.pocName : (current.poc_name || '');
  const refererName = updates.refererName !== undefined ? updates.refererName : (current.referer_name || '');
  const contactNumber = updates.contactNumber !== undefined ? updates.contactNumber : (updates.contactPhone !== undefined ? updates.contactPhone : (current.contact_number || ''));
  const contactEmail = updates.contactEmail !== undefined ? updates.contactEmail : (current.contact_email || '');

  await sql`
    UPDATE projects SET
      name = ${name},
      created_by = ${createdBy},
      client_name = ${clientName},
      contact_designation = ${contactDesignation},
      client_designation = ${contactDesignation},
      poc_name = ${pocName},
      referer_name = ${refererName},
      contact_number = ${contactNumber},
      contact_email = ${contactEmail},
      status = ${status},
      progress = ${progress},
      start_date = ${startDate},
      end_date = ${endDate},
      assignee_ids = ${assigneeIdsJson}::jsonb,
      assignee_id = ${assigneeId}
    WHERE id = ${id};
  `;

  const updated = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return toProjectDto(updated[0]);
}

export async function deleteProjectRecord(id) {
  await initDb();
  await sql`DELETE FROM tasks WHERE project_id = ${id}`;
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return { success: true };
}

// Task Operations
export async function createTaskRecord(task) {
  await initDb();
  const id = task.id && !task.id.startsWith('temp_') ? task.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const taskName = (task.name || task.title || '').trim();
  const assigneeIdsJson = JSON.stringify(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  const assigneeId = (task.assigneeIds && task.assigneeIds[0]) || task.assigneeId || '';
  const projectId = task.projectId || '';
  const parentId = task.parentId ? String(task.parentId) : null;
  const status = task.status || 'Not started';

  await sql`
    INSERT INTO tasks (
      id, name, project_id, parent_id, status, due_date, priority, description, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${taskName}, ${projectId}, ${parentId}, ${status}, ${task.dueDate || ''},
      ${task.priority || 'Medium'}, ${task.description || ''}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      project_id = EXCLUDED.project_id,
      parent_id = EXCLUDED.parent_id,
      status = EXCLUDED.status,
      due_date = EXCLUDED.due_date,
      priority = EXCLUDED.priority,
      description = EXCLUDED.description,
      assignee_ids = EXCLUDED.assignee_ids,
      assignee_id = EXCLUDED.assignee_id;
  `;

  // Auto-recalculate project progress if associated with a project
  if (projectId) {
    await recalcProjectProgress(projectId);
  }

  const created = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(created[0]);
}

export async function updateTaskRecord(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  const projectId = updates.projectId !== undefined ? updates.projectId : current.project_id;
  const parentId = updates.parentId !== undefined ? (updates.parentId ? String(updates.parentId) : null) : current.parent_id;
  const status = updates.status !== undefined ? updates.status : current.status;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : current.due_date;
  const priority = updates.priority !== undefined ? updates.priority : current.priority;
  const description = updates.description !== undefined ? updates.description : current.description;
  const assigneeIds = updates.assigneeIds !== undefined ? updates.assigneeIds : (current.assignee_ids || []);
  const assigneeIdsJson = JSON.stringify(Array.isArray(assigneeIds) ? assigneeIds : []);
  const assigneeId = updates.assigneeId !== undefined ? updates.assigneeId : ((assigneeIds && assigneeIds[0]) || current.assignee_id || '');

  await sql`
    UPDATE tasks SET
      name = ${name},
      project_id = ${projectId},
      parent_id = ${parentId},
      status = ${status},
      due_date = ${dueDate},
      priority = ${priority},
      description = ${description},
      assignee_ids = ${assigneeIdsJson}::jsonb,
      assignee_id = ${assigneeId}
    WHERE id = ${id};
  `;

  if (projectId) await recalcProjectProgress(projectId);
  if (current.project_id && current.project_id !== projectId) {
    await recalcProjectProgress(current.project_id);
  }

  const updated = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(updated[0]);
}

export async function deleteTaskRecord(id) {
  await initDb();
  const existing = await sql`SELECT project_id FROM tasks WHERE id = ${id}`;
  const projectId = existing[0]?.project_id;

  await sql`DELETE FROM tasks WHERE id = ${id}`;
  if (projectId) await recalcProjectProgress(projectId);
  return { success: true };
}

// Meeting Operations
export async function createMeetingRecord(meeting) {
  await initDb();
  const id = meeting.id || ('meet_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const meetingName = (meeting.name || meeting.title || '').trim();
  const attendeeIdsJson = JSON.stringify(Array.isArray(meeting.attendeeIds) ? meeting.attendeeIds : []);
  const attendeeId = (meeting.attendeeIds && meeting.attendeeIds[0]) || meeting.attendeeId || '';

  await sql`
    INSERT INTO meetings (
      id, name, date_time, status, url, attendee_ids, attendee_id
    ) VALUES (
      ${id}, ${meetingName}, ${meeting.dateTime || ''}, ${meeting.status || 'Not started'},
      ${meeting.url || ''}, ${attendeeIdsJson}::jsonb, ${attendeeId}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      date_time = EXCLUDED.date_time,
      status = EXCLUDED.status,
      url = EXCLUDED.url,
      attendee_ids = EXCLUDED.attendee_ids,
      attendee_id = EXCLUDED.attendee_id;
  `;

  const created = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  return toMeetingDto(created[0]);
}

export async function updateMeetingRecord(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  const dateTime = updates.dateTime !== undefined ? updates.dateTime : current.date_time;
  const status = updates.status !== undefined ? updates.status : current.status;
  const url = updates.url !== undefined ? updates.url : current.url;
  const attendeeIds = updates.attendeeIds !== undefined ? updates.attendeeIds : (current.attendee_ids || []);
  const attendeeIdsJson = JSON.stringify(Array.isArray(attendeeIds) ? attendeeIds : []);
  const attendeeId = updates.attendeeId !== undefined ? updates.attendeeId : ((attendeeIds && attendeeIds[0]) || current.attendee_id || '');

  await sql`
    UPDATE meetings SET
      name = ${name},
      date_time = ${dateTime},
      status = ${status},
      url = ${url},
      attendee_ids = ${attendeeIdsJson}::jsonb,
      attendee_id = ${attendeeId}
    WHERE id = ${id};
  `;

  const updated = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  return toMeetingDto(updated[0]);
}

export async function deleteMeetingRecord(id) {
  await initDb();
  await sql`DELETE FROM meetings WHERE id = ${id}`;
  return { success: true };
}

// Employee Operations
export async function getEmployeeByEmailWithPassword(email) {
  await initDb();
  const cleanEmail = (email || '').toLowerCase().trim();
  const rows = await sql`SELECT * FROM employees WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function getEmployeeByIdWithPassword(id) {
  await initDb();
  const rows = await sql`SELECT * FROM employees WHERE id = ${id} LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function createEmployeeRecord(emp) {
  await initDb();
  const id = emp.id || ('emp_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const isAdmin = Boolean(emp.isAdmin || (emp.role || '').toLowerCase() === 'admin');
  const userType = emp.userType || 'internal';
  const externalType = emp.externalType || null;
  const organization = emp.organization || (userType === 'internal' ? 'Volvitech' : '');

  await sql`
    INSERT INTO employees (
      id, full_name, email, role, avatar, password_hash, is_admin, user_type, external_type, organization
    ) VALUES (
      ${id}, ${emp.fullName}, ${emp.email.toLowerCase().trim()}, ${emp.role || 'Member'},
      ${emp.avatar || ''}, ${emp.passwordHash || ''}, ${isAdmin}, ${userType}, ${externalType}, ${organization}
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      avatar = EXCLUDED.avatar,
      password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), employees.password_hash),
      is_admin = EXCLUDED.is_admin,
      user_type = EXCLUDED.user_type,
      external_type = EXCLUDED.external_type,
      organization = EXCLUDED.organization;
  `;

  const created = await sql`SELECT * FROM employees WHERE id = ${id} OR LOWER(email) = ${emp.email.toLowerCase().trim()}`;
  return toEmployeeDto(created[0]);
}

export async function updateEmployeeRecord(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM employees WHERE id = ${id} OR email = ${updates.email || ''}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const fullName = updates.fullName !== undefined ? updates.fullName : current.full_name;
  let role = updates.role !== undefined ? updates.role : current.role;
  const avatar = updates.avatar !== undefined ? updates.avatar : current.avatar;
  const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : current.password_hash;
  const userType = updates.userType !== undefined ? updates.userType : (current.user_type || 'internal');
  const externalType = updates.externalType !== undefined ? updates.externalType : (current.external_type || null);
  const organization = updates.organization !== undefined ? updates.organization : (current.organization || '');

  let isAdmin;
  if (updates.isAdmin !== undefined) {
    isAdmin = Boolean(updates.isAdmin);
    if (!isAdmin && (role || '').toLowerCase() === 'admin') {
      role = 'Member';
    }
  } else {
    isAdmin = Boolean(current.is_admin || (current.role || '').toLowerCase() === 'admin');
  }

  await sql`
    UPDATE employees SET
      full_name = ${fullName},
      role = ${role},
      avatar = ${avatar},
      password_hash = ${passwordHash},
      is_admin = ${isAdmin},
      user_type = ${userType},
      external_type = ${externalType},
      organization = ${organization}
    WHERE id = ${current.id};
  `;

  const updated = await sql`SELECT * FROM employees WHERE id = ${current.id}`;
  return toEmployeeDto(updated[0]);
}

export async function updatePasswordByEmail(email, newPasswordHash) {
  await initDb();
  const cleanEmail = email.toLowerCase().trim();
  await sql`
    UPDATE employees SET password_hash = ${newPasswordHash}
    WHERE LOWER(email) = ${cleanEmail};
  `;
  const updated = await sql`SELECT * FROM employees WHERE LOWER(email) = ${cleanEmail}`;
  return toEmployeeDto(updated[0]);
}

export async function deleteEmployeeRecord(id) {
  await initDb();
  if (!id) return { success: false };
  await sql`DELETE FROM employees WHERE id = ${id}`;
  try {
    await sql`UPDATE projects SET assignee_id = '' WHERE assignee_id = ${id}`;
    await sql`UPDATE tasks SET assignee_id = '' WHERE assignee_id = ${id}`;
    await sql`UPDATE meetings SET attendee_id = '' WHERE attendee_id = ${id}`;
  } catch (err) {
    console.warn('[DB] Non-critical warning cleaning up employee references:', err.message);
  }
  return { success: true, id };
}

// Helper: Calculate project progress from its tasks in DB
async function recalcProjectProgress(projectId) {
  if (!projectId) return;
  const tasks = await sql`SELECT status FROM tasks WHERE project_id = ${projectId}`;
  if (tasks.length === 0) return;

  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const progress = doneCount / tasks.length;
  const status = progress === 1 ? 'Done' : (progress === 0 ? 'Not started' : 'In progress');

  await sql`
    UPDATE projects SET
      progress = ${progress},
      status = ${status}
    WHERE id = ${projectId};
  `;
}

// ----------------------------------------------------
// Doc Operations
// ----------------------------------------------------
export async function createDocRecord(doc) {
  await initDb();
  const id = doc.id || ('doc_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const tagsJson = JSON.stringify(Array.isArray(doc.tags) ? doc.tags : []);

  await sql`
    INSERT INTO docs (id, title, category, summary, content, tags, external_url, author_id, author_name, author_role, author_avatar, is_pinned)
    VALUES (${id}, ${doc.title || ''}, ${doc.category || 'General'}, ${doc.summary || ''}, ${doc.content || ''}, ${tagsJson}::jsonb, ${doc.externalUrl || ''}, ${doc.authorId || ''}, ${doc.authorName || ''}, ${doc.authorRole || ''}, ${doc.authorAvatar || ''}, ${Boolean(doc.isPinned)})
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      summary = EXCLUDED.summary,
      content = EXCLUDED.content,
      tags = EXCLUDED.tags,
      external_url = EXCLUDED.external_url,
      is_pinned = EXCLUDED.is_pinned,
      updated_at = NOW();
  `;

  const res = await sql`SELECT * FROM docs WHERE id = ${id}`;
  return toDocDto(res[0]);
}

export async function updateDocRecord(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM docs WHERE id = ${id}`;
  if (existing.length === 0) return createDocRecord({ id, ...updates });

  const current = existing[0];
  const title = updates.title !== undefined ? updates.title : current.title;
  const category = updates.category !== undefined ? updates.category : current.category;
  const summary = updates.summary !== undefined ? updates.summary : current.summary;
  const content = updates.content !== undefined ? updates.content : current.content;
  const tagsJson = JSON.stringify(updates.tags !== undefined ? updates.tags : (current.tags || []));
  const externalUrl = updates.externalUrl !== undefined ? updates.externalUrl : current.external_url;
  const isPinned = updates.isPinned !== undefined ? Boolean(updates.isPinned) : Boolean(current.is_pinned);

  await sql`
    UPDATE docs SET
      title = ${title},
      category = ${category},
      summary = ${summary},
      content = ${content},
      tags = ${tagsJson}::jsonb,
      external_url = ${externalUrl},
      is_pinned = ${isPinned},
      updated_at = NOW()
    WHERE id = ${id};
  `;

  const res = await sql`SELECT * FROM docs WHERE id = ${id}`;
  return toDocDto(res[0]);
}

export async function deleteDocRecord(id) {
  await initDb();
  await sql`DELETE FROM docs WHERE id = ${id}`;
  return true;
}

// ==========================================
// FINANCE SUITE DATA LAYER
// ==========================================

export async function seedFinanceData() {
  console.log('[DB] Seeding finance suite tables from seedFinance.js...');

  // 1. Exchange Rates
  for (const [curr, rate] of Object.entries(seedFinance.INITIAL_EXCHANGE_RATES)) {
    await sql`
      INSERT INTO exchange_rates (currency, rate, updated_at)
      VALUES (${curr}, ${rate}, NOW())
      ON CONFLICT (currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();
    `;
  }

  // 2. Finance Projects
  for (const p of seedFinance.INITIAL_PROJECTS_FINANCIALS) {
    await sql`
      INSERT INTO finance_projects (
        id, project_name, client_name, country, currency, exchange_rate,
        contract_value, contract_value_native, invoiced_amount, invoiced_percent,
        supplier_costs, labor_costs, gross_margin, gross_margin_percent,
        status, unit, po_number
      ) VALUES (
        ${p.id}, ${p.projectName}, ${p.clientName || ''}, ${p.country || ''}, ${p.currency || 'USD'}, ${p.exchangeRate || 1.0},
        ${p.contractValue || 0}, ${p.contractValueNative || 0}, ${p.invoicedAmount || 0}, ${p.invoicedPercent || 0},
        ${p.supplierCosts || 0}, ${p.laborCosts || 0}, ${p.grossMargin || 0}, ${p.grossMarginPercent || 0},
        ${p.status || 'Healthy'}, ${p.unit || ''}, ${p.poNumber || ''}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 3. Client POs
  for (const po of seedFinance.INITIAL_CLIENT_POS) {
    await sql`
      INSERT INTO client_pos (
        id, po_number, issue_date, client_name, flag, country, scope,
        total_value_native, currency, exchange_rate, total_value_usd, invoiced_native,
        drawdown_percent, remaining_native, remaining_percent, terms, status, milestones
      ) VALUES (
        ${po.id}, ${po.poNumber}, ${po.issueDate || ''}, ${po.clientName}, ${po.flag || ''}, ${po.country || ''}, ${po.scope || ''},
        ${po.totalValueNative || 0}, ${po.currency || 'USD'}, ${po.exchangeRate || 1.0}, ${po.totalValueUsd || 0}, ${po.invoicedNative || 0},
        ${po.drawdownPercent || 0}, ${po.remainingNative || 0}, ${po.remainingPercent || 0}, ${po.terms || 'Net 30'}, ${po.status || 'Active'},
        ${JSON.stringify(po.milestones || [])}::jsonb
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 4. Invoices
  for (const inv of seedFinance.INITIAL_INVOICES) {
    await sql`
      INSERT INTO invoices (
        id, invoice_number, linked_po, client_name, country, issue_date, due_date,
        amount_native, currency, exchange_rate, amount_usd, received_usd, balance_usd,
        status, milestone, tax_percent
      ) VALUES (
        ${inv.id}, ${inv.invoiceNumber}, ${inv.linkedPo || ''}, ${inv.clientName || ''}, ${inv.country || ''}, ${inv.issueDate || ''}, ${inv.dueDate || ''},
        ${inv.amountNative || 0}, ${inv.currency || 'USD'}, ${inv.exchangeRate || 1.0}, ${inv.amountUsd || 0}, ${inv.receivedUsd || 0}, ${inv.balanceUsd || 0},
        ${inv.status || 'Pending'}, ${inv.milestone || ''}, ${inv.taxPercent || 0}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 5. Supplier POs
  for (const spo of seedFinance.INITIAL_SUPPLIER_POS) {
    await sql`
      INSERT INTO supplier_pos (
        id, po_number, entity, supplier_name, origin, tax_id, linked_project, linked_client_po,
        committed_usd, committed_native, currency, exchange_rate, billed_usd, billed_percent,
        paid_usd, balance_usd, payment_terms, status, items
      ) VALUES (
        ${spo.id}, ${spo.poNumber}, ${spo.entity || ''}, ${spo.supplierName}, ${spo.origin || ''}, ${spo.taxId || ''}, ${spo.linkedProject || ''}, ${spo.linkedClientPo || ''},
        ${spo.committedUsd || 0}, ${spo.committedNative || 0}, ${spo.currency || 'USD'}, ${spo.exchangeRate || 1.0}, ${spo.billedUsd || 0}, ${spo.billedPercent || 0},
        ${spo.paidUsd || 0}, ${spo.balanceUsd || 0}, ${spo.paymentTerms || ''}, ${spo.status || 'Open'},
        ${JSON.stringify(spo.items || [])}::jsonb
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 6. Payments Received
  for (const pr of seedFinance.INITIAL_PAYMENTS_RECEIVED) {
    await sql`
      INSERT INTO payments_received (
        id, date, client_name, invoice_number, linked_po, amount_native, currency, exchange_rate,
        amount_usd, mode, reference, status, notes, account_id
      ) VALUES (
        ${pr.id}, ${pr.date || ''}, ${pr.clientName || ''}, ${pr.invoiceNumber || ''}, ${pr.linkedPo || ''},
        ${pr.amountNative || 0}, ${pr.currency || 'USD'}, ${pr.exchangeRate || 1.0}, ${pr.amountUsd || 0},
        ${pr.mode || ''}, ${pr.reference || ''}, ${pr.status || 'Settled'}, ${pr.notes || ''}, ${pr.accountId || ''}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 7. Payments Made
  for (const pm of seedFinance.INITIAL_PAYMENTS_MADE) {
    await sql`
      INSERT INTO payments_made (
        id, date, supplier_name, supplier_po_number, amount_native, currency, exchange_rate,
        amount_usd, mode, reference, status, notes, account_id
      ) VALUES (
        ${pm.id}, ${pm.date || ''}, ${pm.supplierName || ''}, ${pm.supplierPoNumber || ''},
        ${pm.amountNative || 0}, ${pm.currency || 'USD'}, ${pm.exchangeRate || 1.0}, ${pm.amountUsd || 0},
        ${pm.mode || ''}, ${pm.reference || ''}, ${pm.status || 'Paid'}, ${pm.notes || ''}, ${pm.accountId || ''}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 8. Cash Accounts
  for (const ca of seedFinance.INITIAL_CASH_ACCOUNTS) {
    await sql`
      INSERT INTO cash_accounts (
        id, account_name, account_type, account_number, bank_name, entity, currency, exchange_rate,
        opening_balance, current_balance, status, is_primary
      ) VALUES (
        ${ca.id}, ${ca.accountName}, ${ca.accountType || 'Bank Account'}, ${ca.accountNumber || ''}, ${ca.bankName || ''},
        ${ca.entity || ''}, ${ca.currency || 'USD'}, ${ca.exchangeRate || 1.0}, ${ca.openingBalance || 0},
        ${ca.currentBalance || 0}, ${ca.status || 'Active'}, ${Boolean(ca.isPrimary)}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 9. Cash Transactions
  for (const ct of seedFinance.INITIAL_CASH_TRANSACTIONS) {
    await sql`
      INSERT INTO cash_transactions (
        id, date, voucher_no, type, category, account_id, account_name,
        transfer_to_account_id, transfer_to_account_name, entity, counterparty, description,
        reference, linked_invoice, linked_po, payment_mode, currency, exchange_rate,
        amount_native, amount_usd, status, notes
      ) VALUES (
        ${ct.id}, ${ct.date || ''}, ${ct.voucherNo || ''}, ${ct.type || 'Inflow'}, ${ct.category || ''},
        ${ct.accountId || ''}, ${ct.accountName || ''}, ${ct.transferToAccountId || ''}, ${ct.transferToAccountName || ''},
        ${ct.entity || ''}, ${ct.counterparty || ''}, ${ct.description || ''}, ${ct.reference || ''},
        ${ct.linkedInvoice || ''}, ${ct.linkedPo || ''}, ${ct.paymentMode || ''}, ${ct.currency || 'USD'},
        ${ct.exchangeRate || 1.0}, ${ct.amountNative || 0}, ${ct.amountUsd || 0}, ${ct.status || 'Reconciled'},
        ${ct.notes || ''}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 10. Master Directory
  for (const md of seedFinance.INITIAL_MASTER_DIRECTORY) {
    await sql`
      INSERT INTO master_directory (
        id, name, category, classification, country, avatar_text, department, company_mail,
        tax_id, tax_description, contact_person, contact_email, contact_phone, contact,
        stakeholders, credit_terms, credit_limit, currency, exchange_rate, active_po_volume,
        active_po_count, compliance, docs_count, lifetime_billed, unbilled_cap, avg_dso,
        bank_details, attached_docs
      ) VALUES (
        ${md.id}, ${md.name}, ${md.category || 'Client'}, ${md.classification || 'International'},
        ${md.country || ''}, ${md.avatarText || ''}, ${md.department || ''}, ${md.companyMail || ''},
        ${md.taxId || ''}, ${md.taxDescription || ''}, ${md.contactPerson || ''}, ${md.contactEmail || ''},
        ${md.contactPhone || ''}, ${md.contact || ''}, ${JSON.stringify(md.stakeholders || [])}::jsonb,
        ${md.creditTerms || ''}, ${md.creditLimit || ''}, ${md.currency || 'USD'}, ${md.exchangeRate || 1.0},
        ${md.activePoVolume || ''}, ${md.activePoCount || 0}, ${md.compliance || ''}, ${md.docsCount || 0},
        ${md.lifetimeBilled || ''}, ${md.unbilledCap || ''}, ${md.avgDso || ''},
        ${JSON.stringify(md.bankDetails || {})}::jsonb, ${JSON.stringify(md.attachedDocs || [])}::jsonb
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }

  // 11. Document Vault
  for (const doc of seedFinance.INITIAL_DOCUMENT_VAULT) {
    await sql`
      INSERT INTO document_vault (
        id, title, category, entity_name, file_type, size, updated_date, expiry_date,
        hash, tags, url, currency, exchange_rate
      ) VALUES (
        ${doc.id}, ${doc.title}, ${doc.category || 'General'}, ${doc.entityName || ''},
        ${doc.fileType || 'PDF'}, ${doc.size || ''}, ${doc.updatedDate || ''}, ${doc.expiryDate || ''},
        ${doc.hash || ''}, ${JSON.stringify(doc.tags || [])}::jsonb, ${doc.url || ''},
        ${doc.currency || 'USD'}, ${doc.exchangeRate || 1.0}
      ) ON CONFLICT (id) DO NOTHING;
    `;
  }
}

// Get All Finance Data
export async function getFinanceSuiteData() {
  await initDb();
  const [
    ratesRows,
    projectsRows,
    clientPosRows,
    invoicesRows,
    supplierPosRows,
    pmtRcvRows,
    pmtMadeRows,
    cashAccRows,
    cashTxnRows,
    masterDirRows,
    vaultRows,
    lockedPeriodsRows
  ] = await Promise.all([
    sql`SELECT * FROM exchange_rates ORDER BY currency ASC`,
    sql`SELECT * FROM finance_projects ORDER BY created_at ASC`,
    sql`SELECT * FROM client_pos ORDER BY created_at ASC`,
    sql`SELECT * FROM invoices ORDER BY created_at ASC`,
    sql`SELECT * FROM supplier_pos ORDER BY created_at ASC`,
    sql`SELECT * FROM payments_received ORDER BY created_at ASC`,
    sql`SELECT * FROM payments_made ORDER BY created_at ASC`,
    sql`SELECT * FROM cash_accounts ORDER BY created_at ASC`,
    sql`SELECT * FROM cash_transactions ORDER BY created_at ASC`,
    sql`SELECT * FROM master_directory ORDER BY created_at ASC`,
    sql`SELECT * FROM document_vault ORDER BY created_at ASC`,
    sql`SELECT * FROM finance_locked_periods ORDER BY period DESC`
  ]);

  const exchangeRates = {};
  const exchangeRatesList = [];
  for (const r of ratesRows) {
    exchangeRates[r.currency] = Number(r.rate);
    exchangeRatesList.push({
      currency: r.currency,
      rate: Number(r.rate),
      effectiveDate: r.effective_date || '',
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    });
  }
  if (!exchangeRates.USD) exchangeRates.USD = 1.0;
  if (!exchangeRates.INR) exchangeRates.INR = 83.20;
  if (!exchangeRates.AED) exchangeRates.AED = 3.67;
  if (!exchangeRates.SAR) exchangeRates.SAR = 3.75;

  return {
    exchangeRates,
    exchangeRatesList,
    lockedPeriods: lockedPeriodsRows.map(toLockedPeriodDto),
    projects: projectsRows.map(toFinanceProjectDto),
    clientPos: clientPosRows.map(toClientPoDto),
    invoices: invoicesRows.map(toInvoiceDto),
    supplierPos: supplierPosRows.map(toSupplierPoDto),
    paymentsReceived: pmtRcvRows.map(toPaymentReceivedDto),
    paymentsMade: pmtMadeRows.map(toPaymentMadeDto),
    cashAccounts: cashAccRows.map(toCashAccountDto),
    cashTransactions: cashTxnRows.map(toCashTransactionDto),
    masterDirectory: masterDirRows.map(toMasterDirectoryDto),
    vault: vaultRows.map(toDocumentVaultDto)
  };
}

// 1. EXCHANGE RATES
export async function getExchangeRates() {
  await initDb();
  const rows = await sql`SELECT * FROM exchange_rates ORDER BY currency ASC`;
  const rates = {};
  for (const r of rows) rates[r.currency] = Number(r.rate);
  return rates;
}

export async function getExchangeRatesList() {
  await initDb();
  const rows = await sql`SELECT * FROM exchange_rates ORDER BY currency ASC`;
  return rows.map(r => ({
    currency: r.currency,
    rate: Number(r.rate),
    effectiveDate: r.effective_date || '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : ''
  }));
}

export async function upsertExchangeRate(currency, rate, effectiveDate = '') {
  await initDb();
  const effDate = effectiveDate || new Date().toISOString().slice(0, 10);
  await sql`
    INSERT INTO exchange_rates (currency, rate, effective_date, updated_at)
    VALUES (${currency.toUpperCase()}, ${toNum(rate, 1.0)}, ${effDate}, NOW())
    ON CONFLICT (currency) DO UPDATE SET 
      rate = EXCLUDED.rate, 
      effective_date = EXCLUDED.effective_date,
      updated_at = NOW();
  `;
  return getExchangeRates();
}

// 2. FINANCE PROJECTS
export async function getFinanceProjects() {
  await initDb();
  const rows = await sql`SELECT * FROM finance_projects ORDER BY created_at ASC`;
  return rows.map(toFinanceProjectDto);
}

export async function createFinanceProject(data) {
  await initDb();
  const id = data.id || `PRJ-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO finance_projects (
      id, project_name, client_name, country, currency, exchange_rate,
      contract_value, contract_value_native, invoiced_amount, invoiced_percent,
      supplier_costs, labor_costs, gross_margin, gross_margin_percent,
      status, unit, po_number, created_at, updated_at
    ) VALUES (
      ${id}, ${data.projectName || 'Untitled Project'}, ${data.clientName || ''}, ${data.country || ''},
      ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)}, ${toNum(data.contractValue)},
      ${toNum(data.contractValueNative)}, ${toNum(data.invoicedAmount)}, ${toNum(data.invoicedPercent)},
      ${toNum(data.supplierCosts)}, ${toNum(data.laborCosts)}, ${toNum(data.grossMargin)},
      ${toNum(data.grossMarginPercent)}, ${data.status || 'Healthy'}, ${data.unit || ''},
      ${data.poNumber || ''}, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      project_name = EXCLUDED.project_name,
      client_name = EXCLUDED.client_name,
      country = EXCLUDED.country,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      contract_value = EXCLUDED.contract_value,
      contract_value_native = EXCLUDED.contract_value_native,
      invoiced_amount = EXCLUDED.invoiced_amount,
      invoiced_percent = EXCLUDED.invoiced_percent,
      supplier_costs = EXCLUDED.supplier_costs,
      labor_costs = EXCLUDED.labor_costs,
      gross_margin = EXCLUDED.gross_margin,
      gross_margin_percent = EXCLUDED.gross_margin_percent,
      status = EXCLUDED.status,
      unit = EXCLUDED.unit,
      po_number = EXCLUDED.po_number,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM finance_projects WHERE id = ${id}`;
  return toFinanceProjectDto(res[0]);
}

export async function updateFinanceProject(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM finance_projects WHERE id = ${id}`;
  if (existing.length === 0) return createFinanceProject({ id, ...updates });
  const cur = existing[0];
  const projectName = updates.projectName !== undefined ? updates.projectName : cur.project_name;
  const clientName = updates.clientName !== undefined ? updates.clientName : cur.client_name;
  const country = updates.country !== undefined ? updates.country : cur.country;
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const contractValue = updates.contractValue !== undefined ? toNum(updates.contractValue) : toNum(cur.contract_value);
  const contractValueNative = updates.contractValueNative !== undefined ? toNum(updates.contractValueNative) : toNum(cur.contract_value_native);
  const invoicedAmount = updates.invoicedAmount !== undefined ? toNum(updates.invoicedAmount) : toNum(cur.invoiced_amount);
  const invoicedPercent = updates.invoicedPercent !== undefined ? toNum(updates.invoicedPercent) : toNum(cur.invoiced_percent);
  const supplierCosts = updates.supplierCosts !== undefined ? toNum(updates.supplierCosts) : toNum(cur.supplier_costs);
  const laborCosts = updates.laborCosts !== undefined ? toNum(updates.laborCosts) : toNum(cur.labor_costs);
  const grossMargin = updates.grossMargin !== undefined ? toNum(updates.grossMargin) : toNum(cur.gross_margin);
  const grossMarginPercent = updates.grossMarginPercent !== undefined ? toNum(updates.grossMarginPercent) : toNum(cur.gross_margin_percent);
  const status = updates.status !== undefined ? updates.status : cur.status;
  const unit = updates.unit !== undefined ? updates.unit : cur.unit;
  const poNumber = updates.poNumber !== undefined ? updates.poNumber : cur.po_number;

  await sql`
    UPDATE finance_projects SET
      project_name = ${projectName},
      client_name = ${clientName},
      country = ${country},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      contract_value = ${contractValue},
      contract_value_native = ${contractValueNative},
      invoiced_amount = ${invoicedAmount},
      invoiced_percent = ${invoicedPercent},
      supplier_costs = ${supplierCosts},
      labor_costs = ${laborCosts},
      gross_margin = ${grossMargin},
      gross_margin_percent = ${grossMarginPercent},
      status = ${status},
      unit = ${unit},
      po_number = ${poNumber},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM finance_projects WHERE id = ${id}`;
  return toFinanceProjectDto(res[0]);
}

export async function deleteFinanceProject(id) {
  await initDb();
  await sql`DELETE FROM finance_projects WHERE id = ${id}`;
  return true;
}

// 3. CLIENT POS
export async function getClientPos() {
  await initDb();
  const rows = await sql`SELECT * FROM client_pos ORDER BY created_at ASC`;
  return rows.map(toClientPoDto);
}

export async function createClientPo(data) {
  await initDb();
  const id = data.id || `CPO-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO client_pos (
      id, po_number, issue_date, client_name, flag, country, scope,
      total_value_native, currency, exchange_rate, total_value_usd, invoiced_native,
      drawdown_percent, remaining_native, remaining_percent, terms, status, milestones,
      created_at, updated_at
    ) VALUES (
      ${id}, ${data.poNumber || ''}, ${data.issueDate || ''}, ${data.clientName || ''},
      ${data.flag || ''}, ${data.country || ''}, ${data.scope || ''},
      ${toNum(data.totalValueNative)}, ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      ${toNum(data.totalValueUsd)}, ${toNum(data.invoicedNative)}, ${toNum(data.drawdownPercent)},
      ${toNum(data.remainingNative)}, ${toNum(data.remainingPercent)}, ${data.terms || 'Net 30'},
      ${data.status || 'Active'}, ${JSON.stringify(data.milestones || [])}::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      po_number = EXCLUDED.po_number,
      issue_date = EXCLUDED.issue_date,
      client_name = EXCLUDED.client_name,
      flag = EXCLUDED.flag,
      country = EXCLUDED.country,
      scope = EXCLUDED.scope,
      total_value_native = EXCLUDED.total_value_native,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      total_value_usd = EXCLUDED.total_value_usd,
      invoiced_native = EXCLUDED.invoiced_native,
      drawdown_percent = EXCLUDED.drawdown_percent,
      remaining_native = EXCLUDED.remaining_native,
      remaining_percent = EXCLUDED.remaining_percent,
      terms = EXCLUDED.terms,
      status = EXCLUDED.status,
      milestones = EXCLUDED.milestones,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  return toClientPoDto(res[0]);
}

export async function recalculateClientPoDrawdownInDb(poNumber) {
  if (!poNumber) return null;
  await initDb();
  const poRes = await sql`SELECT * FROM client_pos WHERE po_number = ${poNumber}`;
  if (poRes.length === 0) return null;
  const po = poRes[0];

  const activeInvoices = await sql`
    SELECT * FROM invoices 
    WHERE linked_po = ${poNumber} AND status != 'Void'
  `;

  const totalInvoicedNative = activeInvoices.reduce((sum, inv) => sum + toNum(inv.amount_native), 0);
  const totalVal = toNum(po.total_value_native) || 1;
  const pct = Math.min(100, Math.round((totalInvoicedNative / totalVal) * 100));
  const remainingNative = Math.max(0, toNum(po.total_value_native) - totalInvoicedNative);
  const remainingPercent = 100 - pct;
  const newStatus = po.status === 'Void' ? 'Void' : (pct >= 100 ? 'Fully Invoiced' : (pct > 0 ? 'Partially Invoiced' : 'Active'));

  await sql`
    UPDATE client_pos SET
      invoiced_native = ${totalInvoicedNative},
      drawdown_percent = ${pct},
      remaining_native = ${remainingNative},
      remaining_percent = ${remainingPercent},
      status = ${newStatus},
      updated_at = NOW()
    WHERE id = ${po.id}
  `;

  const updated = await sql`SELECT * FROM client_pos WHERE id = ${po.id}`;
  return toClientPoDto(updated[0]);
}

export async function updateClientPo(id, updates, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  if (existing.length === 0) return createClientPo({ id, ...updates });
  const cur = existing[0];
  const poNumber = updates.poNumber !== undefined ? updates.poNumber : cur.po_number;
  const issueDate = updates.issueDate !== undefined ? updates.issueDate : cur.issue_date;
  const clientName = updates.clientName !== undefined ? updates.clientName : cur.client_name;
  const flag = updates.flag !== undefined ? updates.flag : cur.flag;
  const country = updates.country !== undefined ? updates.country : cur.country;
  const scope = updates.scope !== undefined ? updates.scope : cur.scope;
  const totalValueNative = updates.totalValueNative !== undefined ? toNum(updates.totalValueNative) : toNum(cur.total_value_native);
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const totalValueUsd = updates.totalValueUsd !== undefined ? toNum(updates.totalValueUsd) : toNum(cur.total_value_usd);
  const invoicedNative = updates.invoicedNative !== undefined ? toNum(updates.invoicedNative) : toNum(cur.invoiced_native);
  const drawdownPercent = updates.drawdownPercent !== undefined ? toNum(updates.drawdownPercent) : toNum(cur.drawdown_percent);
  const remainingNative = updates.remainingNative !== undefined ? toNum(updates.remainingNative) : toNum(cur.remaining_native);
  const remainingPercent = updates.remainingPercent !== undefined ? toNum(updates.remainingPercent) : toNum(cur.remaining_percent);
  const terms = updates.terms !== undefined ? updates.terms : cur.terms;
  const status = updates.status !== undefined ? updates.status : cur.status;
  const milestones = updates.milestones !== undefined ? updates.milestones : safeJson(cur.milestones, []);

  await sql`
    UPDATE client_pos SET
      po_number = ${poNumber},
      issue_date = ${issueDate},
      client_name = ${clientName},
      flag = ${flag},
      country = ${country},
      scope = ${scope},
      total_value_native = ${totalValueNative},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      total_value_usd = ${totalValueUsd},
      invoiced_native = ${invoicedNative},
      drawdown_percent = ${drawdownPercent},
      remaining_native = ${remainingNative},
      remaining_percent = ${remainingPercent},
      terms = ${terms},
      status = ${status},
      milestones = ${JSON.stringify(milestones)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
  `;
  // Recalculate drawdown based on active invoices
  await recalculateClientPoDrawdownInDb(poNumber);
  const res = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  const dto = toClientPoDto(res[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'EDIT',
      entityType: 'Client PO',
      entityId: id,
      oldValues: toClientPoDto(cur),
      newValues: dto
    });
  }

  return dto;
}

export async function voidClientPo(id, reason, user = null) {
  await initDb();
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to void a Client PO.');
  }
  const existing = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  if (existing.length === 0) throw new Error('Client PO not found');
  const po = existing[0];

  await sql`
    UPDATE client_pos SET
      status = 'Void',
      void_reason = ${reason.trim()},
      voided_at = NOW(),
      voided_by = ${user?.email || 'Admin'},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  const dto = toClientPoDto(updated[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'VOID',
      entityType: 'Client PO',
      entityId: id,
      oldValues: toClientPoDto(po),
      newValues: dto,
      reason: reason.trim()
    });
  }

  return dto;
}

export async function deleteClientPo(id, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM client_pos WHERE id = ${id}`;
  if (existing.length === 0) return false;
  const po = existing[0];

  await sql`DELETE FROM client_pos WHERE id = ${id}`;

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'DELETE',
      entityType: 'Client PO',
      entityId: id,
      oldValues: toClientPoDto(po),
      newValues: null
    });
  }

  return true;
}

// 4. INVOICES
export async function getInvoices() {
  await initDb();
  const rows = await sql`SELECT * FROM invoices ORDER BY created_at ASC`;
  return rows.map(toInvoiceDto);
}

export async function createInvoice(data, user = null) {
  await initDb();
  const id = data.id || `INV-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO invoices (
      id, invoice_number, linked_po, client_name, country, issue_date, due_date,
      amount_native, currency, exchange_rate, amount_usd, received_usd, balance_usd,
      status, milestone, tax_percent, created_at, updated_at
    ) VALUES (
      ${id}, ${data.invoiceNumber || ''}, ${data.linkedPo || ''}, ${data.clientName || ''},
      ${data.country || ''}, ${data.issueDate || ''}, ${data.dueDate || ''},
      ${toNum(data.amountNative)}, ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      ${toNum(data.amountUsd)}, ${toNum(data.receivedUsd)}, ${toNum(data.balanceUsd)},
      ${data.status || 'Pending'}, ${data.milestone || ''}, ${toNum(data.taxPercent)},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      invoice_number = EXCLUDED.invoice_number,
      linked_po = EXCLUDED.linked_po,
      client_name = EXCLUDED.client_name,
      country = EXCLUDED.country,
      issue_date = EXCLUDED.issue_date,
      due_date = EXCLUDED.due_date,
      amount_native = EXCLUDED.amount_native,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      amount_usd = EXCLUDED.amount_usd,
      received_usd = EXCLUDED.received_usd,
      balance_usd = EXCLUDED.balance_usd,
      status = EXCLUDED.status,
      milestone = EXCLUDED.milestone,
      tax_percent = EXCLUDED.tax_percent,
      updated_at = NOW();
  `;
  if (data.linkedPo) {
    await recalculateClientPoDrawdownInDb(data.linkedPo);
  }
  const res = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  const dto = toInvoiceDto(res[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: id,
      oldValues: null,
      newValues: dto
    });
  }

  return dto;
}

export async function updateInvoice(id, updates, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  if (existing.length === 0) return createInvoice({ id, ...updates }, user);
  const cur = existing[0];
  const invoiceNumber = updates.invoiceNumber !== undefined ? updates.invoiceNumber : cur.invoice_number;
  const linkedPo = updates.linkedPo !== undefined ? updates.linkedPo : cur.linked_po;
  const clientName = updates.clientName !== undefined ? updates.clientName : cur.client_name;
  const country = updates.country !== undefined ? updates.country : cur.country;
  const issueDate = updates.issueDate !== undefined ? updates.issueDate : cur.issue_date;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : cur.due_date;
  const amountNative = updates.amountNative !== undefined ? toNum(updates.amountNative) : toNum(cur.amount_native);
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const amountUsd = updates.amountUsd !== undefined ? toNum(updates.amountUsd) : toNum(cur.amount_usd);
  const receivedUsd = updates.receivedUsd !== undefined ? toNum(updates.receivedUsd) : toNum(cur.received_usd);
  const balanceUsd = updates.balanceUsd !== undefined ? toNum(updates.balanceUsd) : toNum(cur.balance_usd);
  const status = updates.status !== undefined ? updates.status : cur.status;
  const milestone = updates.milestone !== undefined ? updates.milestone : cur.milestone;
  const taxPercent = updates.taxPercent !== undefined ? toNum(updates.taxPercent) : toNum(cur.tax_percent);

  await sql`
    UPDATE invoices SET
      invoice_number = ${invoiceNumber},
      linked_po = ${linkedPo},
      client_name = ${clientName},
      country = ${country},
      issue_date = ${issueDate},
      due_date = ${dueDate},
      amount_native = ${amountNative},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      amount_usd = ${amountUsd},
      received_usd = ${receivedUsd},
      balance_usd = ${balanceUsd},
      status = ${status},
      milestone = ${milestone},
      tax_percent = ${taxPercent},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  // Recalculate PO drawdown for both previous linked PO and new linked PO
  if (cur.linked_po) {
    await recalculateClientPoDrawdownInDb(cur.linked_po);
  }
  if (linkedPo && linkedPo !== cur.linked_po) {
    await recalculateClientPoDrawdownInDb(linkedPo);
  }

  const res = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  const dto = toInvoiceDto(res[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'EDIT',
      entityType: 'Invoice',
      entityId: id,
      oldValues: toInvoiceDto(cur),
      newValues: dto
    });
  }

  return dto;
}

export async function voidInvoice(id, reason, user = null) {
  await initDb();
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to void an invoice.');
  }
  const existing = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  if (existing.length === 0) throw new Error('Invoice not found');
  const inv = existing[0];

  await sql`
    UPDATE invoices SET
      status = 'Void',
      void_reason = ${reason.trim()},
      voided_at = NOW(),
      voided_by = ${user?.email || 'Admin'},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  if (inv.linked_po) {
    await recalculateClientPoDrawdownInDb(inv.linked_po);
  }

  const updated = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  const dto = toInvoiceDto(updated[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'VOID',
      entityType: 'Invoice',
      entityId: id,
      oldValues: toInvoiceDto(inv),
      newValues: dto,
      reason: reason.trim()
    });
  }

  return dto;
}

export async function deleteInvoice(id, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  if (existing.length === 0) return false;
  const inv = existing[0];

  // Check if invoice has payments: Never hard-delete an invoice that has payments
  const payments = await sql`
    SELECT * FROM payments_received WHERE invoice_number = ${inv.invoice_number}
  `;
  if (payments.length > 0) {
    throw new Error(`Invoice ${inv.invoice_number} has ${payments.length} payment receipt(s) recorded. Invoices with payments cannot be hard-deleted; please void it instead with a reason.`);
  }

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  if (inv.linked_po) {
    await recalculateClientPoDrawdownInDb(inv.linked_po);
  }

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: id,
      oldValues: toInvoiceDto(inv),
      newValues: null
    });
  }

  return true;
}

// 5. SUPPLIER POS
export async function getSupplierPos() {
  await initDb();
  const rows = await sql`SELECT * FROM supplier_pos ORDER BY created_at ASC`;
  return rows.map(toSupplierPoDto);
}

export async function createSupplierPo(data) {
  await initDb();
  const id = data.id || `SPO-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO supplier_pos (
      id, po_number, entity, supplier_name, origin, tax_id, linked_project, linked_client_po,
      committed_usd, committed_native, currency, exchange_rate, billed_usd, billed_percent,
      paid_usd, balance_usd, payment_terms, status, items, created_at, updated_at
    ) VALUES (
      ${id}, ${data.poNumber || ''}, ${data.entity || ''}, ${data.supplierName || ''},
      ${data.origin || ''}, ${data.taxId || ''}, ${data.linkedProject || ''}, ${data.linkedClientPo || ''},
      ${toNum(data.committedUsd)}, ${toNum(data.committedNative)}, ${data.currency || 'USD'},
      ${toNum(data.exchangeRate, 1.0)}, ${toNum(data.billedUsd)}, ${toNum(data.billedPercent)},
      ${toNum(data.paidUsd)}, ${toNum(data.balanceUsd)}, ${data.paymentTerms || ''},
      ${data.status || 'Open'}, ${JSON.stringify(data.items || [])}::jsonb, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      po_number = EXCLUDED.po_number,
      entity = EXCLUDED.entity,
      supplier_name = EXCLUDED.supplier_name,
      origin = EXCLUDED.origin,
      tax_id = EXCLUDED.tax_id,
      linked_project = EXCLUDED.linked_project,
      linked_client_po = EXCLUDED.linked_client_po,
      committed_usd = EXCLUDED.committed_usd,
      committed_native = EXCLUDED.committed_native,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      billed_usd = EXCLUDED.billed_usd,
      billed_percent = EXCLUDED.billed_percent,
      paid_usd = EXCLUDED.paid_usd,
      balance_usd = EXCLUDED.balance_usd,
      payment_terms = EXCLUDED.payment_terms,
      status = EXCLUDED.status,
      items = EXCLUDED.items,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  return toSupplierPoDto(res[0]);
}

export async function updateSupplierPo(id, updates, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  if (existing.length === 0) return createSupplierPo({ id, ...updates });
  const cur = existing[0];
  const poNumber = updates.poNumber !== undefined ? updates.poNumber : cur.po_number;
  const entity = updates.entity !== undefined ? updates.entity : cur.entity;
  const supplierName = updates.supplierName !== undefined ? updates.supplierName : cur.supplier_name;
  const origin = updates.origin !== undefined ? updates.origin : cur.origin;
  const taxId = updates.taxId !== undefined ? updates.taxId : cur.tax_id;
  const linkedProject = updates.linkedProject !== undefined ? updates.linkedProject : cur.linked_project;
  const linkedClientPo = updates.linkedClientPo !== undefined ? updates.linkedClientPo : cur.linked_client_po;
  const committedUsd = updates.committedUsd !== undefined ? toNum(updates.committedUsd) : toNum(cur.committed_usd);
  const committedNative = updates.committedNative !== undefined ? toNum(updates.committedNative) : toNum(cur.committed_native);
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const billedUsd = updates.billedUsd !== undefined ? toNum(updates.billedUsd) : toNum(cur.billed_usd);
  const billedPercent = updates.billedPercent !== undefined ? toNum(updates.billedPercent) : toNum(cur.billed_percent);
  const paidUsd = updates.paidUsd !== undefined ? toNum(updates.paidUsd) : toNum(cur.paid_usd);
  const balanceUsd = updates.balanceUsd !== undefined ? toNum(updates.balanceUsd) : toNum(cur.balance_usd);
  const paymentTerms = updates.paymentTerms !== undefined ? updates.paymentTerms : cur.payment_terms;
  const status = updates.status !== undefined ? updates.status : cur.status;
  const items = updates.items !== undefined ? updates.items : safeJson(cur.items, []);

  await sql`
    UPDATE supplier_pos SET
      po_number = ${poNumber},
      entity = ${entity},
      supplier_name = ${supplierName},
      origin = ${origin},
      tax_id = ${taxId},
      linked_project = ${linkedProject},
      linked_client_po = ${linkedClientPo},
      committed_usd = ${committedUsd},
      committed_native = ${committedNative},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      billed_usd = ${billedUsd},
      billed_percent = ${billedPercent},
      paid_usd = ${paidUsd},
      balance_usd = ${balanceUsd},
      payment_terms = ${paymentTerms},
      status = ${status},
      items = ${JSON.stringify(items)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  const dto = toSupplierPoDto(res[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'EDIT',
      entityType: 'Supplier PO',
      entityId: id,
      oldValues: toSupplierPoDto(cur),
      newValues: dto
    });
  }

  return dto;
}

export async function voidSupplierPo(id, reason, user = null) {
  await initDb();
  if (!reason || !reason.trim()) {
    throw new Error('A reason is required to void a Supplier PO.');
  }
  const existing = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  if (existing.length === 0) throw new Error('Supplier PO not found');
  const po = existing[0];

  await sql`
    UPDATE supplier_pos SET
      status = 'Void',
      void_reason = ${reason.trim()},
      voided_at = NOW(),
      voided_by = ${user?.email || 'Admin'},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  const updated = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  const dto = toSupplierPoDto(updated[0]);

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'VOID',
      entityType: 'Supplier PO',
      entityId: id,
      oldValues: toSupplierPoDto(po),
      newValues: dto,
      reason: reason.trim()
    });
  }

  return dto;
}

export async function deleteSupplierPo(id, user = null) {
  await initDb();
  const existing = await sql`SELECT * FROM supplier_pos WHERE id = ${id}`;
  if (existing.length === 0) return false;
  const po = existing[0];

  await sql`DELETE FROM supplier_pos WHERE id = ${id}`;

  if (user) {
    await recordFinanceAuditLog({
      userEmail: user.email,
      userName: user.fullName || user.email,
      action: 'DELETE',
      entityType: 'Supplier PO',
      entityId: id,
      oldValues: toSupplierPoDto(po),
      newValues: null
    });
  }

  return true;
}

// 6. PAYMENTS RECEIVED
export async function getPaymentsReceived() {
  await initDb();
  const rows = await sql`SELECT * FROM payments_received ORDER BY created_at ASC`;
  return rows.map(toPaymentReceivedDto);
}

export async function createPaymentReceived(data) {
  await initDb();
  const id = data.id || `PMT-RCV-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO payments_received (
      id, date, client_name, invoice_number, linked_po, amount_native, currency, exchange_rate,
      amount_usd, mode, reference, status, notes, account_id, created_at, updated_at
    ) VALUES (
      ${id}, ${data.date || ''}, ${data.clientName || ''}, ${data.invoiceNumber || ''},
      ${data.linkedPo || ''}, ${toNum(data.amountNative)}, ${data.currency || 'USD'},
      ${toNum(data.exchangeRate, 1.0)}, ${toNum(data.amountUsd)}, ${data.mode || ''},
      ${data.reference || ''}, ${data.status || 'Settled'}, ${data.notes || ''},
      ${data.accountId || ''}, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      client_name = EXCLUDED.client_name,
      invoice_number = EXCLUDED.invoice_number,
      linked_po = EXCLUDED.linked_po,
      amount_native = EXCLUDED.amount_native,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      amount_usd = EXCLUDED.amount_usd,
      mode = EXCLUDED.mode,
      reference = EXCLUDED.reference,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      account_id = EXCLUDED.account_id,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM payments_received WHERE id = ${id}`;
  return toPaymentReceivedDto(res[0]);
}

export async function updatePaymentReceived(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM payments_received WHERE id = ${id}`;
  if (existing.length === 0) return createPaymentReceived({ id, ...updates });
  const cur = existing[0];
  const date = updates.date !== undefined ? updates.date : cur.date;
  const clientName = updates.clientName !== undefined ? updates.clientName : cur.client_name;
  const invoiceNumber = updates.invoiceNumber !== undefined ? updates.invoiceNumber : cur.invoice_number;
  const linkedPo = updates.linkedPo !== undefined ? updates.linkedPo : cur.linked_po;
  const amountNative = updates.amountNative !== undefined ? toNum(updates.amountNative) : toNum(cur.amount_native);
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const amountUsd = updates.amountUsd !== undefined ? toNum(updates.amountUsd) : toNum(cur.amount_usd);
  const mode = updates.mode !== undefined ? updates.mode : cur.mode;
  const reference = updates.reference !== undefined ? updates.reference : cur.reference;
  const status = updates.status !== undefined ? updates.status : cur.status;
  const notes = updates.notes !== undefined ? updates.notes : cur.notes;
  const accountId = updates.accountId !== undefined ? updates.accountId : cur.account_id;

  await sql`
    UPDATE payments_received SET
      date = ${date},
      client_name = ${clientName},
      invoice_number = ${invoiceNumber},
      linked_po = ${linkedPo},
      amount_native = ${amountNative},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      amount_usd = ${amountUsd},
      mode = ${mode},
      reference = ${reference},
      status = ${status},
      notes = ${notes},
      account_id = ${accountId},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM payments_received WHERE id = ${id}`;
  return toPaymentReceivedDto(res[0]);
}

export async function deletePaymentReceived(id) {
  await initDb();
  const existing = await sql`SELECT * FROM payments_received WHERE id = ${id}`;
  if (existing.length === 0) return false;
  const pmt = existing[0];

  const queries = [];

  // 1. Find and reverse any linked cash transaction
  const linkedTxns = await sql`
    SELECT * FROM cash_transactions 
    WHERE linked_payment_id = ${id} 
       OR (account_id = ${pmt.account_id} AND reference = ${pmt.reference} AND reference != '' AND type = 'Inflow')
  `;

  for (const txn of linkedTxns) {
    if (txn.account_id) {
      const accRes = await sql`SELECT * FROM cash_accounts WHERE id = ${txn.account_id}`;
      if (accRes.length > 0) {
        const acc = accRes[0];
        const newBal = toNum(acc.current_balance) - toNum(txn.amount_native);
        queries.push(sql`
          UPDATE cash_accounts SET
            current_balance = ${newBal},
            updated_at = NOW()
          WHERE id = ${acc.id};
        `);
      }
    }
    queries.push(sql`DELETE FROM cash_transactions WHERE id = ${txn.id};`);
  }

  // 2. Recalculate invoice balance if linked to an invoice
  const invNum = pmt.invoice_number;
  if (invNum) {
    const invRes = await sql`SELECT * FROM invoices WHERE invoice_number = ${invNum}`;
    if (invRes.length > 0) {
      const inv = invRes[0];
      const otherPmts = await sql`
        SELECT * FROM payments_received WHERE invoice_number = ${invNum} AND id != ${id}
      `;
      const newRcvUsd = otherPmts.reduce((sum, p) => sum + toNum(p.amount_usd), 0);
      const newBalUsd = Math.max(0, toNum(inv.amount_usd) - newRcvUsd);
      const newStatus = newRcvUsd <= 0 ? 'Unpaid' : (newBalUsd <= 0 ? 'Paid' : 'Partially Paid');
      queries.push(sql`
        UPDATE invoices SET
          received_usd = ${newRcvUsd},
          balance_usd = ${newBalUsd},
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${inv.id};
      `);
    }
  }

  // 3. Delete the payment record
  queries.push(sql`DELETE FROM payments_received WHERE id = ${id};`);

  if (queries.length > 0) {
    await sql.transaction(queries);
  }
  return true;
}

// 7. PAYMENTS MADE
export async function getPaymentsMade() {
  await initDb();
  const rows = await sql`SELECT * FROM payments_made ORDER BY created_at ASC`;
  return rows.map(toPaymentMadeDto);
}

export async function createPaymentMade(data) {
  await initDb();
  const id = data.id || `PMT-SUP-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO payments_made (
      id, date, supplier_name, supplier_po_number, amount_native, currency, exchange_rate,
      amount_usd, mode, reference, status, notes, account_id, created_at, updated_at
    ) VALUES (
      ${id}, ${data.date || ''}, ${data.supplierName || ''}, ${data.supplierPoNumber || ''},
      ${toNum(data.amountNative)}, ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      ${toNum(data.amountUsd)}, ${data.mode || ''}, ${data.reference || ''},
      ${data.status || 'Paid'}, ${data.notes || ''}, ${data.accountId || ''},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      supplier_name = EXCLUDED.supplier_name,
      supplier_po_number = EXCLUDED.supplier_po_number,
      amount_native = EXCLUDED.amount_native,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      amount_usd = EXCLUDED.amount_usd,
      mode = EXCLUDED.mode,
      reference = EXCLUDED.reference,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      account_id = EXCLUDED.account_id,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM payments_made WHERE id = ${id}`;
  return toPaymentMadeDto(res[0]);
}

export async function updatePaymentMade(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM payments_made WHERE id = ${id}`;
  if (existing.length === 0) return createPaymentMade({ id, ...updates });
  const cur = existing[0];
  const date = updates.date !== undefined ? updates.date : cur.date;
  const supplierName = updates.supplierName !== undefined ? updates.supplierName : cur.supplier_name;
  const supplierPoNumber = updates.supplierPoNumber !== undefined ? updates.supplierPoNumber : cur.supplier_po_number;
  const amountNative = updates.amountNative !== undefined ? toNum(updates.amountNative) : toNum(cur.amount_native);
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const amountUsd = updates.amountUsd !== undefined ? toNum(updates.amountUsd) : toNum(cur.amount_usd);
  const mode = updates.mode !== undefined ? updates.mode : cur.mode;
  const reference = updates.reference !== undefined ? updates.reference : cur.reference;
  const status = updates.status !== undefined ? updates.status : cur.status;
  const notes = updates.notes !== undefined ? updates.notes : cur.notes;
  const accountId = updates.accountId !== undefined ? updates.accountId : cur.account_id;

  await sql`
    UPDATE payments_made SET
      date = ${date},
      supplier_name = ${supplierName},
      supplier_po_number = ${supplierPoNumber},
      amount_native = ${amountNative},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      amount_usd = ${amountUsd},
      mode = ${mode},
      reference = ${reference},
      status = ${status},
      notes = ${notes},
      account_id = ${accountId},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM payments_made WHERE id = ${id}`;
  return toPaymentMadeDto(res[0]);
}

export async function deletePaymentMade(id) {
  await initDb();
  const existing = await sql`SELECT * FROM payments_made WHERE id = ${id}`;
  if (existing.length === 0) return false;
  const pmt = existing[0];

  const queries = [];

  // 1. Find and reverse any linked cash transaction
  const linkedTxns = await sql`
    SELECT * FROM cash_transactions 
    WHERE linked_payment_id = ${id} 
       OR (account_id = ${pmt.account_id} AND reference = ${pmt.reference} AND reference != '' AND type = 'Outflow')
  `;

  for (const txn of linkedTxns) {
    if (txn.account_id) {
      const accRes = await sql`SELECT * FROM cash_accounts WHERE id = ${txn.account_id}`;
      if (accRes.length > 0) {
        const acc = accRes[0];
        const newBal = toNum(acc.current_balance) + toNum(txn.amount_native);
        queries.push(sql`
          UPDATE cash_accounts SET
            current_balance = ${newBal},
            updated_at = NOW()
          WHERE id = ${acc.id};
        `);
      }
    }
    queries.push(sql`DELETE FROM cash_transactions WHERE id = ${txn.id};`);
  }

  // 2. Recalculate supplier PO balance if linked
  const spoNum = pmt.supplier_po_number;
  if (spoNum) {
    const spoRes = await sql`SELECT * FROM supplier_pos WHERE po_number = ${spoNum}`;
    if (spoRes.length > 0) {
      const spo = spoRes[0];
      const otherPmts = await sql`
        SELECT * FROM payments_made WHERE supplier_po_number = ${spoNum} AND id != ${id}
      `;
      const newPaidUsd = otherPmts.reduce((sum, p) => sum + toNum(p.amount_usd), 0);
      const newBalUsd = Math.max(0, toNum(spo.committed_usd) - newPaidUsd);
      const newStatus = newBalUsd <= 0 ? 'Fulfilled' : 'Active';
      queries.push(sql`
        UPDATE supplier_pos SET
          paid_usd = ${newPaidUsd},
          balance_usd = ${newBalUsd},
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${spo.id};
      `);
    }
  }

  // 3. Delete the payment record
  queries.push(sql`DELETE FROM payments_made WHERE id = ${id};`);

  if (queries.length > 0) {
    await sql.transaction(queries);
  }
  return true;
}

// 8. CASH ACCOUNTS
export async function getCashAccounts() {
  await initDb();
  const rows = await sql`SELECT * FROM cash_accounts ORDER BY created_at ASC`;
  return rows.map(toCashAccountDto);
}

export async function createCashAccount(data) {
  await initDb();
  const id = data.id || `ACC-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO cash_accounts (
      id, account_name, account_type, account_number, bank_name, entity, currency, exchange_rate,
      opening_balance, current_balance, status, is_primary, created_at, updated_at
    ) VALUES (
      ${id}, ${data.accountName || 'Bank Account'}, ${data.accountType || 'Bank Account'},
      ${data.accountNumber || ''}, ${data.bankName || ''}, ${data.entity || ''},
      ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)}, ${toNum(data.openingBalance)},
      ${toNum(data.currentBalance)}, ${data.status || 'Active'}, ${Boolean(data.isPrimary)},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      account_name = EXCLUDED.account_name,
      account_type = EXCLUDED.account_type,
      account_number = EXCLUDED.account_number,
      bank_name = EXCLUDED.bank_name,
      entity = EXCLUDED.entity,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      opening_balance = EXCLUDED.opening_balance,
      current_balance = EXCLUDED.current_balance,
      status = EXCLUDED.status,
      is_primary = EXCLUDED.is_primary,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM cash_accounts WHERE id = ${id}`;
  return toCashAccountDto(res[0]);
}

export async function updateCashAccount(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM cash_accounts WHERE id = ${id}`;
  if (existing.length === 0) return createCashAccount({ id, ...updates });
  const cur = existing[0];
  const accountName = updates.accountName !== undefined ? updates.accountName : cur.account_name;
  const accountType = updates.accountType !== undefined ? updates.accountType : cur.account_type;
  const accountNumber = updates.accountNumber !== undefined ? updates.accountNumber : cur.account_number;
  const bankName = updates.bankName !== undefined ? updates.bankName : cur.bank_name;
  const entity = updates.entity !== undefined ? updates.entity : cur.entity;
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const openingBalance = updates.openingBalance !== undefined ? toNum(updates.openingBalance) : toNum(cur.opening_balance);
  const currentBalance = updates.currentBalance !== undefined ? toNum(updates.currentBalance) : toNum(cur.current_balance);
  const status = updates.status !== undefined ? updates.status : cur.status;
  const isPrimary = updates.isPrimary !== undefined ? Boolean(updates.isPrimary) : Boolean(cur.is_primary);

  await sql`
    UPDATE cash_accounts SET
      account_name = ${accountName},
      account_type = ${accountType},
      account_number = ${accountNumber},
      bank_name = ${bankName},
      entity = ${entity},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      opening_balance = ${openingBalance},
      current_balance = ${currentBalance},
      status = ${status},
      is_primary = ${isPrimary},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM cash_accounts WHERE id = ${id}`;
  return toCashAccountDto(res[0]);
}

export async function deleteCashAccount(id) {
  await initDb();
  await sql`DELETE FROM cash_accounts WHERE id = ${id}`;
  return true;
}

// 9. CASH TRANSACTIONS
export async function getCashTransactions() {
  await initDb();
  const rows = await sql`SELECT * FROM cash_transactions ORDER BY created_at ASC`;
  return rows.map(toCashTransactionDto);
}

export async function createCashTransaction(data) {
  await initDb();
  const id = data.id || `CB-TXN-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO cash_transactions (
      id, date, voucher_no, type, category, account_id, account_name,
      transfer_to_account_id, transfer_to_account_name, entity, counterparty, description,
      reference, linked_invoice, linked_po, payment_mode, currency, exchange_rate,
      amount_native, amount_usd, status, notes, created_at, updated_at
    ) VALUES (
      ${id}, ${data.date || ''}, ${data.voucherNo || ''}, ${data.type || 'Inflow'},
      ${data.category || ''}, ${data.accountId || ''}, ${data.accountName || ''},
      ${data.transferToAccountId || ''}, ${data.transferToAccountName || ''},
      ${data.entity || ''}, ${data.counterparty || ''}, ${data.description || ''},
      ${data.reference || ''}, ${data.linkedInvoice || ''}, ${data.linkedPo || ''},
      ${data.paymentMode || ''}, ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      ${toNum(data.amountNative)}, ${toNum(data.amountUsd)}, ${data.status || 'Reconciled'},
      ${data.notes || ''}, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      voucher_no = EXCLUDED.voucher_no,
      type = EXCLUDED.type,
      category = EXCLUDED.category,
      account_id = EXCLUDED.account_id,
      account_name = EXCLUDED.account_name,
      transfer_to_account_id = EXCLUDED.transfer_to_account_id,
      transfer_to_account_name = EXCLUDED.transfer_to_account_name,
      entity = EXCLUDED.entity,
      counterparty = EXCLUDED.counterparty,
      description = EXCLUDED.description,
      reference = EXCLUDED.reference,
      linked_invoice = EXCLUDED.linked_invoice,
      linked_po = EXCLUDED.linked_po,
      payment_mode = EXCLUDED.payment_mode,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      amount_native = EXCLUDED.amount_native,
      amount_usd = EXCLUDED.amount_usd,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM cash_transactions WHERE id = ${id}`;
  return toCashTransactionDto(res[0]);
}

export async function updateCashTransaction(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM cash_transactions WHERE id = ${id}`;
  if (existing.length === 0) return createCashTransaction({ id, ...updates });
  const cur = existing[0];
  const date = updates.date !== undefined ? updates.date : cur.date;
  const voucherNo = updates.voucherNo !== undefined ? updates.voucherNo : cur.voucher_no;
  const type = updates.type !== undefined ? updates.type : cur.type;
  const category = updates.category !== undefined ? updates.category : cur.category;
  const accountId = updates.accountId !== undefined ? updates.accountId : cur.account_id;
  const accountName = updates.accountName !== undefined ? updates.accountName : cur.account_name;
  const transferToAccountId = updates.transferToAccountId !== undefined ? updates.transferToAccountId : cur.transfer_to_account_id;
  const transferToAccountName = updates.transferToAccountName !== undefined ? updates.transferToAccountName : cur.transfer_to_account_name;
  const entity = updates.entity !== undefined ? updates.entity : cur.entity;
  const counterparty = updates.counterparty !== undefined ? updates.counterparty : cur.counterparty;
  const description = updates.description !== undefined ? updates.description : cur.description;
  const reference = updates.reference !== undefined ? updates.reference : cur.reference;
  const linkedInvoice = updates.linkedInvoice !== undefined ? updates.linkedInvoice : cur.linked_invoice;
  const linkedPo = updates.linkedPo !== undefined ? updates.linkedPo : cur.linked_po;
  const paymentMode = updates.paymentMode !== undefined ? updates.paymentMode : cur.payment_mode;
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const amountNative = updates.amountNative !== undefined ? toNum(updates.amountNative) : toNum(cur.amount_native);
  const amountUsd = updates.amountUsd !== undefined ? toNum(updates.amountUsd) : toNum(cur.amount_usd);
  const status = updates.status !== undefined ? updates.status : cur.status;
  const notes = updates.notes !== undefined ? updates.notes : cur.notes;

  await sql`
    UPDATE cash_transactions SET
      date = ${date},
      voucher_no = ${voucherNo},
      type = ${type},
      category = ${category},
      account_id = ${accountId},
      account_name = ${accountName},
      transfer_to_account_id = ${transferToAccountId},
      transfer_to_account_name = ${transferToAccountName},
      entity = ${entity},
      counterparty = ${counterparty},
      description = ${description},
      reference = ${reference},
      linked_invoice = ${linkedInvoice},
      linked_po = ${linkedPo},
      payment_mode = ${paymentMode},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      amount_native = ${amountNative},
      amount_usd = ${amountUsd},
      status = ${status},
      notes = ${notes},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM cash_transactions WHERE id = ${id}`;
  return toCashTransactionDto(res[0]);
}

export async function deleteCashTransaction(id) {
  await initDb();
  await sql`DELETE FROM cash_transactions WHERE id = ${id}`;
  return true;
}

// 10. MASTER DIRECTORY
export async function getMasterDirectory() {
  await initDb();
  const rows = await sql`SELECT * FROM master_directory ORDER BY created_at ASC`;
  return rows.map(toMasterDirectoryDto);
}

export async function createMasterDirectoryEntry(data) {
  await initDb();
  const id = data.id || `ENT-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO master_directory (
      id, name, category, classification, country, avatar_text, department, company_mail,
      tax_id, tax_description, contact_person, contact_email, contact_phone, contact,
      stakeholders, credit_terms, credit_limit, currency, exchange_rate, active_po_volume,
      active_po_count, compliance, docs_count, lifetime_billed, unbilled_cap, avg_dso,
      bank_details, attached_docs, created_at, updated_at
    ) VALUES (
      ${id}, ${data.name || ''}, ${data.category || 'Client'}, ${data.classification || 'International'},
      ${data.country || ''}, ${data.avatarText || ''}, ${data.department || ''}, ${data.companyMail || ''},
      ${data.taxId || ''}, ${data.taxDescription || ''}, ${data.contactPerson || ''}, ${data.contactEmail || ''},
      ${data.contactPhone || ''}, ${data.contact || ''}, ${JSON.stringify(data.stakeholders || [])}::jsonb,
      ${data.creditTerms || ''}, ${data.creditLimit || ''}, ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      ${data.activePoVolume || ''}, ${toNum(data.activePoCount)}, ${data.compliance || ''}, ${toNum(data.docsCount)},
      ${data.lifetimeBilled || ''}, ${data.unbilledCap || ''}, ${data.avgDso || ''},
      ${JSON.stringify(data.bankDetails || {})}::jsonb, ${JSON.stringify(data.attachedDocs || [])}::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      classification = EXCLUDED.classification,
      country = EXCLUDED.country,
      avatar_text = EXCLUDED.avatar_text,
      department = EXCLUDED.department,
      company_mail = EXCLUDED.company_mail,
      tax_id = EXCLUDED.tax_id,
      tax_description = EXCLUDED.tax_description,
      contact_person = EXCLUDED.contact_person,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      contact = EXCLUDED.contact,
      stakeholders = EXCLUDED.stakeholders,
      credit_terms = EXCLUDED.credit_terms,
      credit_limit = EXCLUDED.credit_limit,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      active_po_volume = EXCLUDED.active_po_volume,
      active_po_count = EXCLUDED.active_po_count,
      compliance = EXCLUDED.compliance,
      docs_count = EXCLUDED.docs_count,
      lifetime_billed = EXCLUDED.lifetime_billed,
      unbilled_cap = EXCLUDED.unbilled_cap,
      avg_dso = EXCLUDED.avg_dso,
      bank_details = EXCLUDED.bank_details,
      attached_docs = EXCLUDED.attached_docs,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM master_directory WHERE id = ${id}`;
  return toMasterDirectoryDto(res[0]);
}

export async function updateMasterDirectoryEntry(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM master_directory WHERE id = ${id}`;
  if (existing.length === 0) return createMasterDirectoryEntry({ id, ...updates });
  const cur = existing[0];
  const name = updates.name !== undefined ? updates.name : cur.name;
  const category = updates.category !== undefined ? updates.category : cur.category;
  const classification = updates.classification !== undefined ? updates.classification : cur.classification;
  const country = updates.country !== undefined ? updates.country : cur.country;
  const avatarText = updates.avatarText !== undefined ? updates.avatarText : cur.avatar_text;
  const department = updates.department !== undefined ? updates.department : cur.department;
  const companyMail = updates.companyMail !== undefined ? updates.companyMail : cur.company_mail;
  const taxId = updates.taxId !== undefined ? updates.taxId : cur.tax_id;
  const taxDescription = updates.taxDescription !== undefined ? updates.taxDescription : cur.tax_description;
  const contactPerson = updates.contactPerson !== undefined ? updates.contactPerson : cur.contact_person;
  const contactEmail = updates.contactEmail !== undefined ? updates.contactEmail : cur.contact_email;
  const contactPhone = updates.contactPhone !== undefined ? updates.contactPhone : cur.contact_phone;
  const contact = updates.contact !== undefined ? updates.contact : cur.contact;
  const stakeholders = updates.stakeholders !== undefined ? updates.stakeholders : safeJson(cur.stakeholders, []);
  const creditTerms = updates.creditTerms !== undefined ? updates.creditTerms : cur.credit_terms;
  const creditLimit = updates.creditLimit !== undefined ? updates.creditLimit : cur.credit_limit;
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);
  const activePoVolume = updates.activePoVolume !== undefined ? updates.activePoVolume : cur.active_po_volume;
  const activePoCount = updates.activePoCount !== undefined ? toNum(updates.activePoCount) : toNum(cur.active_po_count);
  const compliance = updates.compliance !== undefined ? updates.compliance : cur.compliance;
  const docsCount = updates.docsCount !== undefined ? toNum(updates.docsCount) : toNum(cur.docs_count);
  const lifetimeBilled = updates.lifetimeBilled !== undefined ? updates.lifetimeBilled : cur.lifetime_billed;
  const unbilledCap = updates.unbilledCap !== undefined ? updates.unbilledCap : cur.unbilled_cap;
  const avgDso = updates.avgDso !== undefined ? updates.avgDso : cur.avg_dso;
  const bankDetails = updates.bankDetails !== undefined ? updates.bankDetails : safeJson(cur.bank_details, {});
  const attachedDocs = updates.attachedDocs !== undefined ? updates.attachedDocs : safeJson(cur.attached_docs, []);

  await sql`
    UPDATE master_directory SET
      name = ${name},
      category = ${category},
      classification = ${classification},
      country = ${country},
      avatar_text = ${avatarText},
      department = ${department},
      company_mail = ${companyMail},
      tax_id = ${taxId},
      tax_description = ${taxDescription},
      contact_person = ${contactPerson},
      contact_email = ${contactEmail},
      contact_phone = ${contactPhone},
      contact = ${contact},
      stakeholders = ${JSON.stringify(stakeholders)}::jsonb,
      credit_terms = ${creditTerms},
      credit_limit = ${creditLimit},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      active_po_volume = ${activePoVolume},
      active_po_count = ${activePoCount},
      compliance = ${compliance},
      docs_count = ${docsCount},
      lifetime_billed = ${lifetimeBilled},
      unbilled_cap = ${unbilledCap},
      avg_dso = ${avgDso},
      bank_details = ${JSON.stringify(bankDetails)}::jsonb,
      attached_docs = ${JSON.stringify(attachedDocs)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM master_directory WHERE id = ${id}`;
  return toMasterDirectoryDto(res[0]);
}

export async function deleteMasterDirectoryEntry(id) {
  await initDb();
  await sql`DELETE FROM master_directory WHERE id = ${id}`;
  return true;
}

// 11. DOCUMENT VAULT
export async function getDocumentVault() {
  await initDb();
  const rows = await sql`SELECT * FROM document_vault ORDER BY created_at ASC`;
  return rows.map(toDocumentVaultDto);
}

export async function createDocumentVaultEntry(data) {
  await initDb();
  const id = data.id || `DOC-V-${Date.now().toString(36).toUpperCase()}`;
  await sql`
    INSERT INTO document_vault (
      id, title, category, entity_name, file_type, size, updated_date, expiry_date,
      hash, tags, url, currency, exchange_rate, created_at, updated_at
    ) VALUES (
      ${id}, ${data.title || ''}, ${data.category || 'General'}, ${data.entityName || ''},
      ${data.fileType || 'PDF'}, ${data.size || ''}, ${data.updatedDate || ''}, ${data.expiryDate || ''},
      ${data.hash || ''}, ${JSON.stringify(data.tags || [])}::jsonb, ${data.url || ''},
      ${data.currency || 'USD'}, ${toNum(data.exchangeRate, 1.0)},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      entity_name = EXCLUDED.entity_name,
      file_type = EXCLUDED.file_type,
      size = EXCLUDED.size,
      updated_date = EXCLUDED.updated_date,
      expiry_date = EXCLUDED.expiry_date,
      hash = EXCLUDED.hash,
      tags = EXCLUDED.tags,
      url = EXCLUDED.url,
      currency = EXCLUDED.currency,
      exchange_rate = EXCLUDED.exchange_rate,
      updated_at = NOW();
  `;
  const res = await sql`SELECT * FROM document_vault WHERE id = ${id}`;
  return toDocumentVaultDto(res[0]);
}

export async function updateDocumentVaultEntry(id, updates) {
  await initDb();
  const existing = await sql`SELECT * FROM document_vault WHERE id = ${id}`;
  if (existing.length === 0) return createDocumentVaultEntry({ id, ...updates });
  const cur = existing[0];
  const title = updates.title !== undefined ? updates.title : cur.title;
  const category = updates.category !== undefined ? updates.category : cur.category;
  const entityName = updates.entityName !== undefined ? updates.entityName : cur.entity_name;
  const fileType = updates.fileType !== undefined ? updates.fileType : cur.file_type;
  const size = updates.size !== undefined ? updates.size : cur.size;
  const updatedDate = updates.updatedDate !== undefined ? updates.updatedDate : cur.updated_date;
  const expiryDate = updates.expiryDate !== undefined ? updates.expiryDate : cur.expiry_date;
  const hash = updates.hash !== undefined ? updates.hash : cur.hash;
  const tags = updates.tags !== undefined ? updates.tags : safeJson(cur.tags, []);
  const url = updates.url !== undefined ? updates.url : cur.url;
  const currency = updates.currency !== undefined ? updates.currency : cur.currency;
  const exchangeRate = updates.exchangeRate !== undefined ? toNum(updates.exchangeRate) : toNum(cur.exchange_rate, 1.0);

  await sql`
    UPDATE document_vault SET
      title = ${title},
      category = ${category},
      entity_name = ${entityName},
      file_type = ${fileType},
      size = ${size},
      updated_date = ${updatedDate},
      expiry_date = ${expiryDate},
      hash = ${hash},
      tags = ${JSON.stringify(tags)}::jsonb,
      url = ${url},
      currency = ${currency},
      exchange_rate = ${exchangeRate},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  const res = await sql`SELECT * FROM document_vault WHERE id = ${id}`;
  return toDocumentVaultDto(res[0]);
}

export async function deleteDocumentVaultEntry(id) {
  await initDb();
  await sql`DELETE FROM document_vault WHERE id = ${id}`;
  return true;
}

// ==========================================
// MULTI-STEP DATABASE TRANSACTIONS (Task 6)
// ==========================================

// 1. Invoice creation + Client PO drawdown in a single database transaction
export async function createInvoiceTx(payload) {
  await initDb();
  const inv = payload.invoice || payload;
  const id = inv.id || `INV-${Date.now().toString(36).toUpperCase()}`;
  const invNum = inv.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`;
  const linkedPo = inv.linkedPo || payload.linkedPo || '';
  const clientPoId = payload.clientPoId || null;
  const milestoneName = payload.milestoneName || inv.milestone || '';

  const amtNative = toNum(inv.amountNative);
  const curr = inv.currency || 'USD';
  const exRate = toNum(inv.exchangeRate, 1.0);
  const amtUsd = toNum(inv.amountUsd) || (amtNative / (exRate || 1.0));
  const recUsd = toNum(inv.receivedUsd, 0);
  const balUsd = toNum(inv.balanceUsd) || (amtUsd - recUsd);

  const poQuery = clientPoId 
    ? await sql`SELECT * FROM client_pos WHERE id = ${clientPoId}`
    : linkedPo ? await sql`SELECT * FROM client_pos WHERE po_number = ${linkedPo} OR id = ${linkedPo}` : [];

  const queries = [
    sql`
      INSERT INTO invoices (
        id, invoice_number, linked_po, client_name, country, issue_date, due_date,
        amount_native, currency, exchange_rate, amount_usd, received_usd, balance_usd,
        status, milestone, tax_percent, created_at, updated_at
      ) VALUES (
        ${id}, ${invNum}, ${linkedPo}, ${inv.clientName || ''}, ${inv.country || ''},
        ${inv.issueDate || new Date().toISOString().slice(0, 10)}, ${inv.dueDate || ''},
        ${amtNative}, ${curr}, ${exRate}, ${amtUsd}, ${recUsd}, ${balUsd},
        ${inv.status || 'Pending'}, ${milestoneName}, ${toNum(inv.taxPercent, 0)}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        linked_po = EXCLUDED.linked_po,
        amount_native = EXCLUDED.amount_native,
        amount_usd = EXCLUDED.amount_usd,
        updated_at = NOW();
    `
  ];

  if (poQuery.length > 0) {
    const po = poQuery[0];
    const newInvoicedNative = toNum(po.invoiced_native) + amtNative;
    const totalNative = toNum(po.total_value_native);
    const newDrawdown = totalNative > 0 ? (newInvoicedNative / totalNative) * 100 : 0;
    const newRemaining = Math.max(0, totalNative - newInvoicedNative);
    const newRemPercent = totalNative > 0 ? (newRemaining / totalNative) * 100 : 0;
    const newStatus = newRemaining <= 0 ? 'Fully Invoiced' : 'Partially Invoiced';

    const milestones = safeJson(po.milestones, []);
    if (milestoneName) {
      const idx = milestones.findIndex(m => m.name === milestoneName || m.milestone === milestoneName);
      if (idx !== -1) {
        milestones[idx] = { ...milestones[idx], status: 'Billed', invNum };
      }
    }

    queries.push(sql`
      UPDATE client_pos SET
        invoiced_native = ${newInvoicedNative},
        drawdown_percent = ${newDrawdown},
        remaining_native = ${newRemaining},
        remaining_percent = ${newRemPercent},
        status = ${newStatus},
        milestones = ${JSON.stringify(milestones)}::jsonb,
        updated_at = NOW()
      WHERE id = ${po.id};
    `);
  }

  await sql.transaction(queries);
  const created = await sql`SELECT * FROM invoices WHERE id = ${id}`;
  return toInvoiceDto(created[0]);
}

// 2. Client Payment Received + Invoice Balance + Cash Inflow Transaction
export async function recordClientPaymentTx(payload) {
  await initDb();
  const pmt = payload.payment || payload;
  const id = pmt.id || `PMT-RCV-${Date.now().toString(36).toUpperCase()}`;
  const invId = payload.invoiceId || pmt.invoiceId || '';
  const invNum = pmt.invoiceNumber || '';
  const cashAccId = payload.cashAccountId || pmt.accountId || '';

  const amtNative = toNum(pmt.amountNative);
  const curr = pmt.currency || 'USD';
  const exRate = toNum(pmt.exchangeRate, 1.0);
  const amtUsd = toNum(pmt.amountUsd) || (amtNative / (exRate || 1.0));

  const queries = [
    sql`
      INSERT INTO payments_received (
        id, date, client_name, invoice_number, linked_po, amount_native, currency, exchange_rate,
        amount_usd, mode, reference, status, notes, account_id, created_at, updated_at
      ) VALUES (
        ${id}, ${pmt.date || new Date().toISOString().slice(0, 10)}, ${pmt.clientName || ''},
        ${invNum}, ${pmt.linkedPo || ''}, ${amtNative}, ${curr}, ${exRate}, ${amtUsd},
        ${pmt.mode || 'Bank Wire'}, ${pmt.reference || ''}, ${pmt.status || 'Settled'},
        ${pmt.notes || ''}, ${cashAccId}, NOW(), NOW()
      );
    `
  ];

  if (invId || invNum) {
    const invRes = invId 
      ? await sql`SELECT * FROM invoices WHERE id = ${invId}`
      : await sql`SELECT * FROM invoices WHERE invoice_number = ${invNum}`;
    if (invRes.length > 0) {
      const inv = invRes[0];
      const newRcvUsd = toNum(inv.received_usd) + amtUsd;
      const newBalUsd = Math.max(0, toNum(inv.amount_usd) - newRcvUsd);
      const newStatus = newBalUsd <= 0 ? 'Paid' : 'Partially Paid';
      queries.push(sql`
        UPDATE invoices SET
          received_usd = ${newRcvUsd},
          balance_usd = ${newBalUsd},
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${inv.id};
      `);
    }
  }

  if (cashAccId) {
    const accRes = await sql`SELECT * FROM cash_accounts WHERE id = ${cashAccId}`;
    if (accRes.length > 0) {
      const acc = accRes[0];
      const newBal = toNum(acc.current_balance) + amtNative;
      const txnId = `CB-TXN-${Date.now().toString(36).toUpperCase()}`;
      const voucherNo = payload.voucherNo || pmt.reference || `VR-${Date.now().toString().slice(-4)}`;
      queries.push(sql`
        INSERT INTO cash_transactions (
          id, date, voucher_no, type, category, account_id, account_name,
          transfer_to_account_id, transfer_to_account_name, entity, counterparty,
          description, reference, linked_invoice, linked_po, linked_payment_id, payment_mode,
          currency, exchange_rate, amount_native, amount_usd, status, notes, created_at, updated_at
        ) VALUES (
          ${txnId}, ${pmt.date || new Date().toISOString().slice(0, 10)}, ${voucherNo},
          'Inflow', 'Client Collection', ${acc.id}, ${acc.account_name},
          '', '', ${acc.entity || ''}, ${pmt.clientName || ''},
          ${pmt.notes || `Receipt for invoice ${invNum}`}, ${pmt.reference || ''},
          ${invNum}, ${pmt.linkedPo || ''}, ${id}, ${pmt.mode || 'Wire'}, ${curr}, ${exRate},
          ${amtNative}, ${amtUsd}, 'Reconciled', ${pmt.notes || ''}, NOW(), NOW()
        );
      `);
      queries.push(sql`
        UPDATE cash_accounts SET
          current_balance = ${newBal},
          updated_at = NOW()
        WHERE id = ${acc.id};
      `);
    }
  }

  await sql.transaction(queries);
  const created = await sql`SELECT * FROM payments_received WHERE id = ${id}`;
  return toPaymentReceivedDto(created[0]);
}

// 3. Supplier Payment Made + Supplier PO Balance + Cash Outflow Transaction
export async function recordSupplierPaymentTx(payload) {
  await initDb();
  const pmt = payload.payment || payload;
  const id = pmt.id || `PMT-SUP-${Date.now().toString(36).toUpperCase()}`;
  const spoId = payload.supplierPoId || pmt.supplierPoId || '';
  const spoNum = pmt.supplierPoNumber || '';
  const cashAccId = payload.cashAccountId || pmt.accountId || '';

  const amtNative = toNum(pmt.amountNative);
  const curr = pmt.currency || 'USD';
  const exRate = toNum(pmt.exchangeRate, 1.0);
  const amtUsd = toNum(pmt.amountUsd) || (amtNative / (exRate || 1.0));

  const queries = [
    sql`
      INSERT INTO payments_made (
        id, date, supplier_name, supplier_po_number, amount_native, currency, exchange_rate,
        amount_usd, mode, reference, status, notes, account_id, created_at, updated_at
      ) VALUES (
        ${id}, ${pmt.date || new Date().toISOString().slice(0, 10)}, ${pmt.supplierName || ''},
        ${spoNum}, ${amtNative}, ${curr}, ${exRate}, ${amtUsd},
        ${pmt.mode || 'Bank Wire'}, ${pmt.reference || ''}, ${pmt.status || 'Paid'},
        ${pmt.notes || ''}, ${cashAccId}, NOW(), NOW()
      );
    `
  ];

  if (spoId || spoNum) {
    const spoRes = spoId
      ? await sql`SELECT * FROM supplier_pos WHERE id = ${spoId}`
      : await sql`SELECT * FROM supplier_pos WHERE po_number = ${spoNum}`;
    if (spoRes.length > 0) {
      const spo = spoRes[0];
      const newPaidUsd = toNum(spo.paid_usd) + amtUsd;
      const newBalUsd = Math.max(0, toNum(spo.committed_usd) - newPaidUsd);
      const newStatus = newBalUsd <= 0 ? 'Fulfilled' : 'Active';
      queries.push(sql`
        UPDATE supplier_pos SET
          paid_usd = ${newPaidUsd},
          balance_usd = ${newBalUsd},
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${spo.id};
      `);
    }
  }

  if (cashAccId) {
    const accRes = await sql`SELECT * FROM cash_accounts WHERE id = ${cashAccId}`;
    if (accRes.length > 0) {
      const acc = accRes[0];
      const newBal = toNum(acc.current_balance) - amtNative;
      const txnId = `CB-TXN-${Date.now().toString(36).toUpperCase()}`;
      const voucherNo = payload.voucherNo || pmt.reference || `VR-${Date.now().toString().slice(-4)}`;
      queries.push(sql`
        INSERT INTO cash_transactions (
          id, date, voucher_no, type, category, account_id, account_name,
          transfer_to_account_id, transfer_to_account_name, entity, counterparty,
          description, reference, linked_invoice, linked_po, linked_payment_id, payment_mode,
          currency, exchange_rate, amount_native, amount_usd, status, notes, created_at, updated_at
        ) VALUES (
          ${txnId}, ${pmt.date || new Date().toISOString().slice(0, 10)}, ${voucherNo},
          'Outflow', 'Vendor Payment', ${acc.id}, ${acc.account_name},
          '', '', ${acc.entity || ''}, ${pmt.supplierName || ''},
          ${pmt.notes || `Disbursement for supplier PO ${spoNum}`}, ${pmt.reference || ''},
          '', ${spoNum}, ${id}, ${pmt.mode || 'Wire'}, ${curr}, ${exRate},
          ${amtNative}, ${amtUsd}, 'Reconciled', ${pmt.notes || ''}, NOW(), NOW()
        );
      `);
      queries.push(sql`
        UPDATE cash_accounts SET
          current_balance = ${newBal},
          updated_at = NOW()
        WHERE id = ${acc.id};
      `);
    }
  }

  await sql.transaction(queries);
  const created = await sql`SELECT * FROM payments_made WHERE id = ${id}`;
  return toPaymentMadeDto(created[0]);
}

// 4. Batch Import from Browser localStorage (Task 5 & 6)
export async function batchImportFinanceTx(suiteData) {
  await initDb();
  if (!suiteData || typeof suiteData !== 'object') {
    throw new Error('Invalid finance suite data provided for import.');
  }

  const queries = [];

  // Rates
  if (suiteData.exchangeRates && typeof suiteData.exchangeRates === 'object') {
    for (const [curr, rate] of Object.entries(suiteData.exchangeRates)) {
      queries.push(sql`
        INSERT INTO exchange_rates (currency, rate, updated_at)
        VALUES (${curr}, ${toNum(rate, 1.0)}, NOW())
        ON CONFLICT (currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();
      `);
    }
  }

  // Projects
  if (Array.isArray(suiteData.projects)) {
    for (const p of suiteData.projects) {
      if (!p.id) continue;
      queries.push(sql`
        INSERT INTO finance_projects (
          id, project_name, client_name, country, currency, exchange_rate,
          contract_value, contract_value_native, invoiced_amount, invoiced_percent,
          supplier_costs, labor_costs, gross_margin, gross_margin_percent,
          status, unit, po_number, updated_at
        ) VALUES (
          ${p.id}, ${p.projectName || 'Untitled Project'}, ${p.clientName || ''}, ${p.country || ''},
          ${p.currency || 'USD'}, ${toNum(p.exchangeRate, 1.0)}, ${toNum(p.contractValue)},
          ${toNum(p.contractValueNative)}, ${toNum(p.invoicedAmount)}, ${toNum(p.invoicedPercent)},
          ${toNum(p.supplierCosts)}, ${toNum(p.laborCosts)}, ${toNum(p.grossMargin)},
          ${toNum(p.grossMarginPercent)}, ${p.status || 'Healthy'}, ${p.unit || ''}, ${p.poNumber || ''}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          client_name = EXCLUDED.client_name,
          country = EXCLUDED.country,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          contract_value = EXCLUDED.contract_value,
          contract_value_native = EXCLUDED.contract_value_native,
          invoiced_amount = EXCLUDED.invoiced_amount,
          invoiced_percent = EXCLUDED.invoiced_percent,
          supplier_costs = EXCLUDED.supplier_costs,
          labor_costs = EXCLUDED.labor_costs,
          gross_margin = EXCLUDED.gross_margin,
          gross_margin_percent = EXCLUDED.gross_margin_percent,
          status = EXCLUDED.status,
          unit = EXCLUDED.unit,
          po_number = EXCLUDED.po_number,
          updated_at = NOW();
      `);
    }
  }

  // Client POs
  if (Array.isArray(suiteData.clientPos)) {
    for (const po of suiteData.clientPos) {
      if (!po.id) continue;
      queries.push(sql`
        INSERT INTO client_pos (
          id, po_number, issue_date, client_name, flag, country, scope,
          total_value_native, currency, exchange_rate, total_value_usd, invoiced_native,
          drawdown_percent, remaining_native, remaining_percent, terms, status, milestones, updated_at
        ) VALUES (
          ${po.id}, ${po.poNumber || ''}, ${po.issueDate || ''}, ${po.clientName || ''},
          ${po.flag || ''}, ${po.country || ''}, ${po.scope || ''},
          ${toNum(po.totalValueNative)}, ${po.currency || 'USD'}, ${toNum(po.exchangeRate, 1.0)},
          ${toNum(po.totalValueUsd)}, ${toNum(po.invoicedNative)}, ${toNum(po.drawdownPercent)},
          ${toNum(po.remainingNative)}, ${toNum(po.remainingPercent)}, ${po.terms || 'Net 30'},
          ${po.status || 'Active'}, ${JSON.stringify(po.milestones || [])}::jsonb, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          po_number = EXCLUDED.po_number,
          issue_date = EXCLUDED.issue_date,
          client_name = EXCLUDED.client_name,
          flag = EXCLUDED.flag,
          country = EXCLUDED.country,
          scope = EXCLUDED.scope,
          total_value_native = EXCLUDED.total_value_native,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          total_value_usd = EXCLUDED.total_value_usd,
          invoiced_native = EXCLUDED.invoiced_native,
          drawdown_percent = EXCLUDED.drawdown_percent,
          remaining_native = EXCLUDED.remaining_native,
          remaining_percent = EXCLUDED.remaining_percent,
          terms = EXCLUDED.terms,
          status = EXCLUDED.status,
          milestones = EXCLUDED.milestones,
          updated_at = NOW();
      `);
    }
  }

  // Invoices
  if (Array.isArray(suiteData.invoices)) {
    for (const inv of suiteData.invoices) {
      if (!inv.id) continue;
      queries.push(sql`
        INSERT INTO invoices (
          id, invoice_number, linked_po, client_name, country, issue_date, due_date,
          amount_native, currency, exchange_rate, amount_usd, received_usd, balance_usd,
          status, milestone, tax_percent, updated_at
        ) VALUES (
          ${inv.id}, ${inv.invoiceNumber || ''}, ${inv.linkedPo || ''}, ${inv.clientName || ''},
          ${inv.country || ''}, ${inv.issueDate || ''}, ${inv.dueDate || ''},
          ${toNum(inv.amountNative)}, ${inv.currency || 'USD'}, ${toNum(inv.exchangeRate, 1.0)},
          ${toNum(inv.amountUsd)}, ${toNum(inv.receivedUsd)}, ${toNum(inv.balanceUsd)},
          ${inv.status || 'Pending'}, ${inv.milestone || ''}, ${toNum(inv.taxPercent)}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          invoice_number = EXCLUDED.invoice_number,
          linked_po = EXCLUDED.linked_po,
          client_name = EXCLUDED.client_name,
          country = EXCLUDED.country,
          issue_date = EXCLUDED.issue_date,
          due_date = EXCLUDED.due_date,
          amount_native = EXCLUDED.amount_native,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          amount_usd = EXCLUDED.amount_usd,
          received_usd = EXCLUDED.received_usd,
          balance_usd = EXCLUDED.balance_usd,
          status = EXCLUDED.status,
          milestone = EXCLUDED.milestone,
          tax_percent = EXCLUDED.tax_percent,
          updated_at = NOW();
      `);
    }
  }

  // Supplier POs
  if (Array.isArray(suiteData.supplierPos)) {
    for (const spo of suiteData.supplierPos) {
      if (!spo.id) continue;
      queries.push(sql`
        INSERT INTO supplier_pos (
          id, po_number, entity, supplier_name, origin, tax_id, linked_project, linked_client_po,
          committed_usd, committed_native, currency, exchange_rate, billed_usd, billed_percent,
          paid_usd, balance_usd, payment_terms, status, items, updated_at
        ) VALUES (
          ${spo.id}, ${spo.poNumber || ''}, ${spo.entity || ''}, ${spo.supplierName || ''},
          ${spo.origin || ''}, ${spo.taxId || ''}, ${spo.linkedProject || ''}, ${spo.linkedClientPo || ''},
          ${toNum(spo.committedUsd)}, ${toNum(spo.committedNative)}, ${spo.currency || 'USD'},
          ${toNum(spo.exchangeRate, 1.0)}, ${toNum(spo.billedUsd)}, ${toNum(spo.billedPercent)},
          ${toNum(spo.paidUsd)}, ${toNum(spo.balanceUsd)}, ${spo.paymentTerms || ''},
          ${spo.status || 'Open'}, ${JSON.stringify(spo.items || [])}::jsonb, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          po_number = EXCLUDED.po_number,
          entity = EXCLUDED.entity,
          supplier_name = EXCLUDED.supplier_name,
          origin = EXCLUDED.origin,
          tax_id = EXCLUDED.tax_id,
          linked_project = EXCLUDED.linked_project,
          linked_client_po = EXCLUDED.linked_client_po,
          committed_usd = EXCLUDED.committed_usd,
          committed_native = EXCLUDED.committed_native,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          billed_usd = EXCLUDED.billed_usd,
          billed_percent = EXCLUDED.billed_percent,
          paid_usd = EXCLUDED.paid_usd,
          balance_usd = EXCLUDED.balance_usd,
          payment_terms = EXCLUDED.payment_terms,
          status = EXCLUDED.status,
          items = EXCLUDED.items,
          updated_at = NOW();
      `);
    }
  }

  // Payments Received
  if (Array.isArray(suiteData.paymentsReceived)) {
    for (const pr of suiteData.paymentsReceived) {
      if (!pr.id) continue;
      queries.push(sql`
        INSERT INTO payments_received (
          id, date, client_name, invoice_number, linked_po, amount_native, currency, exchange_rate,
          amount_usd, mode, reference, status, notes, account_id, updated_at
        ) VALUES (
          ${pr.id}, ${pr.date || ''}, ${pr.clientName || ''}, ${pr.invoiceNumber || ''},
          ${pr.linkedPo || ''}, ${toNum(pr.amountNative)}, ${pr.currency || 'USD'},
          ${toNum(pr.exchangeRate, 1.0)}, ${toNum(pr.amountUsd)}, ${pr.mode || ''},
          ${pr.reference || ''}, ${pr.status || 'Settled'}, ${pr.notes || ''}, ${pr.accountId || ''}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          client_name = EXCLUDED.client_name,
          invoice_number = EXCLUDED.invoice_number,
          linked_po = EXCLUDED.linked_po,
          amount_native = EXCLUDED.amount_native,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          amount_usd = EXCLUDED.amount_usd,
          mode = EXCLUDED.mode,
          reference = EXCLUDED.reference,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          account_id = EXCLUDED.account_id,
          updated_at = NOW();
      `);
    }
  }

  // Payments Made
  if (Array.isArray(suiteData.paymentsMade)) {
    for (const pm of suiteData.paymentsMade) {
      if (!pm.id) continue;
      queries.push(sql`
        INSERT INTO payments_made (
          id, date, supplier_name, supplier_po_number, amount_native, currency, exchange_rate,
          amount_usd, mode, reference, status, notes, account_id, updated_at
        ) VALUES (
          ${pm.id}, ${pm.date || ''}, ${pm.supplierName || ''}, ${pm.supplierPoNumber || ''},
          ${toNum(pm.amountNative)}, ${pm.currency || 'USD'}, ${toNum(pm.exchangeRate, 1.0)},
          ${toNum(pm.amountUsd)}, ${pm.mode || ''}, ${pm.reference || ''}, ${pm.status || 'Paid'},
          ${pm.notes || ''}, ${pm.accountId || ''}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          supplier_name = EXCLUDED.supplier_name,
          supplier_po_number = EXCLUDED.supplier_po_number,
          amount_native = EXCLUDED.amount_native,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          amount_usd = EXCLUDED.amount_usd,
          mode = EXCLUDED.mode,
          reference = EXCLUDED.reference,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          account_id = EXCLUDED.account_id,
          updated_at = NOW();
      `);
    }
  }

  // Cash Accounts
  if (Array.isArray(suiteData.cashAccounts)) {
    for (const ca of suiteData.cashAccounts) {
      if (!ca.id) continue;
      queries.push(sql`
        INSERT INTO cash_accounts (
          id, account_name, account_type, account_number, bank_name, entity, currency, exchange_rate,
          opening_balance, current_balance, status, is_primary, updated_at
        ) VALUES (
          ${ca.id}, ${ca.accountName || ''}, ${ca.accountType || 'Bank Account'},
          ${ca.accountNumber || ''}, ${ca.bankName || ''}, ${ca.entity || ''},
          ${ca.currency || 'USD'}, ${toNum(ca.exchangeRate, 1.0)}, ${toNum(ca.openingBalance)},
          ${toNum(ca.currentBalance)}, ${ca.status || 'Active'}, ${Boolean(ca.isPrimary)}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          account_name = EXCLUDED.account_name,
          account_type = EXCLUDED.account_type,
          account_number = EXCLUDED.account_number,
          bank_name = EXCLUDED.bank_name,
          entity = EXCLUDED.entity,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          opening_balance = EXCLUDED.opening_balance,
          current_balance = EXCLUDED.current_balance,
          status = EXCLUDED.status,
          is_primary = EXCLUDED.is_primary,
          updated_at = NOW();
      `);
    }
  }

  // Cash Transactions
  if (Array.isArray(suiteData.cashTransactions)) {
    for (const ct of suiteData.cashTransactions) {
      if (!ct.id) continue;
      queries.push(sql`
        INSERT INTO cash_transactions (
          id, date, voucher_no, type, category, account_id, account_name,
          transfer_to_account_id, transfer_to_account_name, entity, counterparty, description,
          reference, linked_invoice, linked_po, linked_payment_id, payment_mode, currency, exchange_rate,
          amount_native, amount_usd, status, notes, updated_at
        ) VALUES (
          ${ct.id}, ${ct.date || ''}, ${ct.voucherNo || ''}, ${ct.type || 'Inflow'},
          ${ct.category || ''}, ${ct.accountId || ''}, ${ct.accountName || ''},
          ${ct.transferToAccountId || ''}, ${ct.transferToAccountName || ''},
          ${ct.entity || ''}, ${ct.counterparty || ''}, ${ct.description || ''},
          ${ct.reference || ''}, ${ct.linkedInvoice || ''}, ${ct.linkedPo || ''},
          ${ct.linkedPaymentId || ''},
          ${ct.paymentMode || ''}, ${ct.currency || 'USD'}, ${toNum(ct.exchangeRate, 1.0)},
          ${toNum(ct.amountNative)}, ${toNum(ct.amountUsd)}, ${ct.status || 'Reconciled'},
          ${ct.notes || ''}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          voucher_no = EXCLUDED.voucher_no,
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          account_id = EXCLUDED.account_id,
          account_name = EXCLUDED.account_name,
          transfer_to_account_id = EXCLUDED.transfer_to_account_id,
          transfer_to_account_name = EXCLUDED.transfer_to_account_name,
          entity = EXCLUDED.entity,
          counterparty = EXCLUDED.counterparty,
          description = EXCLUDED.description,
          reference = EXCLUDED.reference,
          linked_invoice = EXCLUDED.linked_invoice,
          linked_po = EXCLUDED.linked_po,
          linked_payment_id = EXCLUDED.linked_payment_id,
          payment_mode = EXCLUDED.payment_mode,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          amount_native = EXCLUDED.amount_native,
          amount_usd = EXCLUDED.amount_usd,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          updated_at = NOW();
      `);
    }
  }

  // Master Directory
  if (Array.isArray(suiteData.masterDirectory)) {
    for (const md of suiteData.masterDirectory) {
      if (!md.id) continue;
      queries.push(sql`
        INSERT INTO master_directory (
          id, name, category, classification, country, avatar_text, department, company_mail,
          tax_id, tax_description, contact_person, contact_email, contact_phone, contact,
          stakeholders, credit_terms, credit_limit, currency, exchange_rate, active_po_volume,
          active_po_count, compliance, docs_count, lifetime_billed, unbilled_cap, avg_dso,
          bank_details, attached_docs, updated_at
        ) VALUES (
          ${md.id}, ${md.name || ''}, ${md.category || 'Client'}, ${md.classification || 'International'},
          ${md.country || ''}, ${md.avatarText || ''}, ${md.department || ''}, ${md.companyMail || ''},
          ${md.taxId || ''}, ${md.taxDescription || ''}, ${md.contactPerson || ''}, ${md.contactEmail || ''},
          ${md.contactPhone || ''}, ${md.contact || ''}, ${JSON.stringify(md.stakeholders || [])}::jsonb,
          ${md.creditTerms || ''}, ${md.creditLimit || ''}, ${md.currency || 'USD'}, ${toNum(md.exchangeRate, 1.0)},
          ${md.activePoVolume || ''}, ${toNum(md.activePoCount)}, ${md.compliance || ''}, ${toNum(md.docsCount)},
          ${md.lifetimeBilled || ''}, ${md.unbilledCap || ''}, ${md.avgDso || ''},
          ${JSON.stringify(md.bankDetails || {})}::jsonb, ${JSON.stringify(md.attachedDocs || [])}::jsonb, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          classification = EXCLUDED.classification,
          country = EXCLUDED.country,
          avatar_text = EXCLUDED.avatar_text,
          department = EXCLUDED.department,
          company_mail = EXCLUDED.company_mail,
          tax_id = EXCLUDED.tax_id,
          tax_description = EXCLUDED.tax_description,
          contact_person = EXCLUDED.contact_person,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          contact = EXCLUDED.contact,
          stakeholders = EXCLUDED.stakeholders,
          credit_terms = EXCLUDED.credit_terms,
          credit_limit = EXCLUDED.credit_limit,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          active_po_volume = EXCLUDED.active_po_volume,
          active_po_count = EXCLUDED.active_po_count,
          compliance = EXCLUDED.compliance,
          docs_count = EXCLUDED.docs_count,
          lifetime_billed = EXCLUDED.lifetime_billed,
          unbilled_cap = EXCLUDED.unbilled_cap,
          avg_dso = EXCLUDED.avg_dso,
          bank_details = EXCLUDED.bank_details,
          attached_docs = EXCLUDED.attached_docs,
          updated_at = NOW();
      `);
    }
  }

  // Vault
  if (Array.isArray(suiteData.vault)) {
    for (const doc of suiteData.vault) {
      if (!doc.id) continue;
      queries.push(sql`
        INSERT INTO document_vault (
          id, title, category, entity_name, file_type, size, updated_date, expiry_date,
          hash, tags, url, currency, exchange_rate, updated_at
        ) VALUES (
          ${doc.id}, ${doc.title || ''}, ${doc.category || 'General'}, ${doc.entityName || ''},
          ${doc.fileType || 'PDF'}, ${doc.size || ''}, ${doc.updatedDate || ''}, ${doc.expiryDate || ''},
          ${doc.hash || ''}, ${JSON.stringify(doc.tags || [])}::jsonb, ${doc.url || ''},
          ${doc.currency || 'USD'}, ${toNum(doc.exchangeRate, 1.0)}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          entity_name = EXCLUDED.entity_name,
          file_type = EXCLUDED.file_type,
          size = EXCLUDED.size,
          updated_date = EXCLUDED.updated_date,
          expiry_date = EXCLUDED.expiry_date,
          hash = EXCLUDED.hash,
          tags = EXCLUDED.tags,
          url = EXCLUDED.url,
          currency = EXCLUDED.currency,
          exchange_rate = EXCLUDED.exchange_rate,
          updated_at = NOW();
      `);
    }
  }

  if (queries.length > 0) {
    await sql.transaction(queries);
  }

  return await getFinanceSuiteData();
}

// ==========================================
// AUDIT LOGGING & PERIOD LOCKING (Task 2 & 4)
// ==========================================

export async function recordFinanceAuditLog({
  userEmail,
  userName = '',
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  reason = ''
}) {
  try {
    await initDb();
    const id = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await sql`
      INSERT INTO finance_audit_logs (
        id, user_email, user_name, action, entity_type, entity_id, old_values, new_values, reason, timestamp
      ) VALUES (
        ${id}, ${userEmail || 'unknown@volvitech.com'}, ${userName || ''}, ${action}, ${entityType},
        ${String(entityId)}, ${JSON.stringify(oldValues || {})}::jsonb,
        ${JSON.stringify(newValues || {})}::jsonb, ${reason || ''}, NOW()
      );
    `;
    return id;
  } catch (err) {
    console.error('[Audit Log] Failed to write audit record:', err);
    return null;
  }
}

export async function getFinanceAuditLogs({
  user = '',
  action = '',
  entityType = '',
  startDate = '',
  endDate = '',
  search = '',
  limit = 200
} = {}) {
  await initDb();
  const maxRows = Math.min(500, Number(limit) || 200);
  const rows = await sql`
    SELECT * FROM finance_audit_logs 
    ORDER BY timestamp DESC 
    LIMIT ${maxRows}
  `;

  let list = rows.map(toAuditLogDto);

  if (user) {
    const q = user.toLowerCase();
    list = list.filter(l => l.userEmail.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q));
  }
  if (action && action !== 'ALL') {
    list = list.filter(l => l.action.toLowerCase() === action.toLowerCase());
  }
  if (entityType && entityType !== 'ALL') {
    list = list.filter(l => l.entityType.toLowerCase() === entityType.toLowerCase());
  }
  if (startDate) {
    list = list.filter(l => l.timestamp >= startDate);
  }
  if (endDate) {
    list = list.filter(l => l.timestamp <= endDate + 'T23:59:59.999Z');
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(l =>
      l.entityId.toLowerCase().includes(s) ||
      l.userEmail.toLowerCase().includes(s) ||
      l.userName.toLowerCase().includes(s) ||
      l.reason.toLowerCase().includes(s) ||
      JSON.stringify(l.newValues).toLowerCase().includes(s) ||
      JSON.stringify(l.oldValues).toLowerCase().includes(s)
    );
  }

  return list;
}

export async function getLockedPeriods() {
  await initDb();
  const rows = await sql`SELECT * FROM finance_locked_periods ORDER BY period DESC`;
  return rows.map(toLockedPeriodDto);
}

export async function lockPeriod(period, lockedBy = 'Admin', reason = '') {
  await initDb();
  const cleanPeriod = String(period || '').trim().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(cleanPeriod)) {
    throw new Error('Invalid period format. Expected YYYY-MM');
  }
  await sql`
    INSERT INTO finance_locked_periods (period, locked_at, locked_by, reason)
    VALUES (${cleanPeriod}, NOW(), ${lockedBy || 'Admin'}, ${reason || ''})
    ON CONFLICT (period) DO UPDATE SET
      locked_at = NOW(),
      locked_by = EXCLUDED.locked_by,
      reason = EXCLUDED.reason;
  `;
  return await getLockedPeriods();
}

export async function unlockPeriod(period) {
  await initDb();
  const cleanPeriod = String(period || '').trim().slice(0, 7);
  await sql`DELETE FROM finance_locked_periods WHERE period = ${cleanPeriod}`;
  return await getLockedPeriods();
}

export async function isPeriodLocked(dateStr) {
  if (!dateStr) return false;
  const period = String(dateStr).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(period)) return false;
  await initDb();
  const rows = await sql`SELECT period FROM finance_locked_periods WHERE period = ${period}`;
  return rows.length > 0;
}


