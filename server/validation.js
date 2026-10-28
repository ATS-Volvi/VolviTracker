import { z } from 'zod';

/**
 * Validates a payload against a given Zod schema.
 * Returns { success: true, data } or { success: false, error: string, issues: Array }.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMsg = (result.error.issues || result.error.errors || [])
      .map(issue => `${issue.path.length > 0 ? issue.path.join('.') : 'body'}: ${issue.message}`)
      .join(', ');
    return {
      success: false,
      error: `Validation error: ${errorMsg}`,
      issues: result.error.issues || result.error.errors || []
    };
  }
  return { success: true, data: result.data };
}

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const signupSchema = z.object({
  fullName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.string().optional(),
  department: z.string().optional(),
  organization: z.string().optional(),
  userType: z.string().optional()
}).refine(data => Boolean((data.fullName && data.fullName.trim()) || (data.name && data.name.trim())), {
  message: 'Full name is required',
  path: ['fullName']
}).passthrough();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

// -----------------------------------------------------------------------------
// Core Workspace Entity Schemas
// -----------------------------------------------------------------------------
export const projectPostSchema = z.union([
  z.object({
    project: z.object({
      name: z.string().trim().min(1, 'Project name is required')
    }).passthrough(),
    tasks: z.array(z.any()).optional()
  }).passthrough(),
  z.object({
    name: z.string().trim().min(1, 'Project name is required')
  }).passthrough()
]);

export const projectPutSchema = z.object({}).passthrough();

export const taskPostSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  projectId: z.any().optional()
}).refine(data => Boolean((data.name && data.name.trim()) || (data.title && data.title.trim())), {
  message: 'Task name is required',
  path: ['name']
}).passthrough();

export const taskPutSchema = z.object({}).passthrough();

export const meetingPostSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional()
}).refine(data => Boolean((data.name && data.name.trim()) || (data.title && data.title.trim())), {
  message: 'Meeting name is required',
  path: ['name']
}).passthrough();

export const meetingPutSchema = z.object({}).passthrough();

export const employeePostSchema = z.object({
  name: z.string().trim().min(1, 'Employee name is required'),
  email: z.string().trim().email('Invalid employee email format'),
  role: z.string().optional()
}).passthrough();

export const employeePutSchema = z.object({}).passthrough();

export const docPostSchema = z.object({
  title: z.string().optional(),
  name: z.string().optional()
}).refine(data => Boolean((data.title && data.title.trim()) || (data.name && data.name.trim())), {
  message: 'Document title is required',
  path: ['title']
}).passthrough();

export const docPutSchema = z.object({}).passthrough();

// -----------------------------------------------------------------------------
// Finance Schemas
// -----------------------------------------------------------------------------
export const exchangeRatesSchema = z.union([
  z.object({
    rates: z.record(z.string(), z.number({ invalid_type_error: 'Rate must be a number' })),
    effectiveDate: z.string().optional()
  }).passthrough(),
  z.object({
    currency: z.string().trim().min(1, 'Currency code is required'),
    rate: z.number({ invalid_type_error: 'Rate must be a number' }).positive('Rate must be positive'),
    effectiveDate: z.string().optional()
  }).passthrough()
]);

export const financeImportSchema = z.object({}).passthrough();

export const financeProjectPostSchema = z.object({
  name: z.string().trim().min(1, 'Finance project name is required')
}).passthrough();

export const financeProjectPutSchema = z.object({}).passthrough();

export const voidReasonSchema = z.object({
  reason: z.string().trim().min(1, 'A non-empty reason is required for voiding')
});

export const clientPoPostSchema = z.object({
  poNumber: z.string().trim().min(1, 'PO number is required'),
  clientName: z.string().trim().min(1, 'Client name is required')
}).passthrough();

export const clientPoPutSchema = z.object({}).passthrough();

export const invoicePostSchema = z.union([
  z.object({
    invoice: z.object({
      invoiceNumber: z.string().trim().min(1, 'Invoice number is required')
    }).passthrough()
  }).passthrough(),
  z.object({
    invoiceNumber: z.string().trim().min(1, 'Invoice number is required')
  }).passthrough()
]);

export const invoicePutSchema = z.object({}).passthrough();

export const supplierPoPostSchema = z.object({
  poNumber: z.string().trim().min(1, 'Supplier PO number is required'),
  supplierName: z.string().trim().min(1, 'Supplier name is required')
}).passthrough();

export const supplierPoPutSchema = z.object({}).passthrough();

export const paymentReceivedPostSchema = z.union([
  z.object({
    payment: z.object({
      amountUsd: z.any().optional()
    }).passthrough()
  }).passthrough(),
  z.object({}).passthrough()
]);

export const paymentReceivedPutSchema = z.object({}).passthrough();

export const paymentMadePostSchema = z.union([
  z.object({
    payment: z.object({
      amountUsd: z.any().optional()
    }).passthrough()
  }).passthrough(),
  z.object({}).passthrough()
]);

export const paymentMadePutSchema = z.object({}).passthrough();

export const cashAccountPostSchema = z.object({
  name: z.string().trim().min(1, 'Cash account name is required')
}).passthrough();

export const cashAccountPutSchema = z.object({}).passthrough();

export const cashTransactionPostSchema = z.object({
  amountNative: z.any().optional()
}).passthrough();

export const cashTransactionPutSchema = z.object({}).passthrough();

export const masterDirectoryPostSchema = z.object({
  name: z.string().trim().min(1, 'Company or legal name is required'),
  category: z.string().trim().min(1, 'Category (Client or Supplier) is required')
}).passthrough();

export const masterDirectoryPutSchema = z.object({}).passthrough();

export const documentVaultPostSchema = z.object({
  title: z.string().trim().min(1, 'Document title is required')
}).passthrough();

export const documentVaultPutSchema = z.object({}).passthrough();

export const lockedPeriodPostSchema = z.object({
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format (e.g. 2026-09)'),
  reason: z.string().optional()
});
