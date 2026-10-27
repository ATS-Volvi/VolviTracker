// Helper functions and internal entities for Cash Book & Cashflow Ledger

export const isExtraPaymentTxn = (t) => {
  if (t.type === 'ExtraPayment') return true;
  const extraCategories = [
    'Payroll & Salaries',
    'Salary & Employee Payroll',
    'Executive & Contractor Stipend',
    'Office Rent & Facilities',
    'Office Rent & Lease',
    'Utilities & Facilities',
    'Cloud & Infrastructure',
    'Cloud & IT Infrastructure',
    'Cloud & IT Hosting (AWS/GCP/Azure)',
    'Software Licenses & Subscriptions',
    'Tax & Statutory Duty',
    'Tax & Statutory Duty Remittance',
    'Professional Fees & Legal',
    'Legal & Audit Consultation',
    'Travel & Client Entertainment',
    'Travel & Client Logistics',
    'Petty Cash Expense',
    'Petty Cash Operational Overhead',
    'Hardware & Equipment',
    'Other Operational Payment'
  ];
  return extraCategories.includes(t.category) || Boolean(t.isExtraPayment);
};

export const isSalaryTxn = (t) => {
  return (
    t.category === 'Salary & Employee Payroll' ||
    t.category === 'Payroll & Salaries' ||
    t.category === 'Executive & Contractor Stipend' ||
    t.description?.toLowerCase().includes('salary') ||
    t.description?.toLowerCase().includes('payroll')
  );
};

export const isVendorOutflowTxn = (t) => {
  return t.type === 'Outflow' && !isExtraPaymentTxn(t);
};

export const formatCurrency = (amount, cur = 'USD') => {
  const symbols = { USD: '$', AED: 'AED ', INR: '₹', SAR: 'SAR ' };
  const sym = symbols[cur] || `${cur} `;
  return `${sym}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const OPERATING_ENTITIES = [
  {
    id: 'ENT-VOL-US',
    name: 'Volvitech US Corp',
    category: 'Operating Entity',
    classification: 'Internal Entity',
    country: 'USA 🇺🇸',
    currency: 'USD',
    avatarText: 'US',
    taxId: 'US-EIN-12-889021',
    contactPerson: 'Global Treasury Desk',
    contactEmail: 'treasury@volvitech.com',
    contactPhone: '+1 (415) 800-9900',
    bankDetails: { bankName: 'JPMorgan Chase New York', accountNumber: '••••8102', swiftIban: 'CHASUS33XXX' },
    creditTerms: 'Operating Hub',
    isInternalEntity: true
  },
  {
    id: 'ENT-VOL-AE',
    name: 'Volvitech UAE FZ-LLC',
    category: 'Operating Entity',
    classification: 'Internal Entity',
    country: 'UAE 🇦🇪',
    currency: 'AED',
    avatarText: 'AE',
    taxId: 'TRN 10049281000003',
    contactPerson: 'GCC Treasury Desk',
    contactEmail: 'treasury-ae@volvitech.com',
    contactPhone: '+971 4 550 1122',
    bankDetails: { bankName: 'First Abu Dhabi Bank (FAB)', accountNumber: '••••1002', swiftIban: 'FABUAEADXXX' },
    creditTerms: 'Operating Hub',
    isInternalEntity: true
  },
  {
    id: 'ENT-VOL-IN',
    name: 'Volvitech India Pvt Ltd',
    category: 'Operating Entity',
    classification: 'Internal Entity',
    country: 'India 🇮🇳',
    currency: 'INR',
    avatarText: 'IN',
    taxId: '29AABCV9912K1Z8',
    contactPerson: 'India Accounts Desk',
    contactEmail: 'accounts-in@volvitech.com',
    contactPhone: '+91 80 4900 2200',
    bankDetails: { bankName: 'HDFC Bank Bengaluru', accountNumber: '••••0194', swiftIban: 'HDFCINBBXXX' },
    creditTerms: 'Operating Hub',
    isInternalEntity: true
  },
  {
    id: 'ENT-VOL-SA',
    name: 'Volvitech KSA Branch',
    category: 'Operating Entity',
    classification: 'Internal Entity',
    country: 'KSA 🇸🇦',
    currency: 'SAR',
    avatarText: 'SA',
    taxId: 'CR 1010992812',
    contactPerson: 'Riyadh Finance Desk',
    contactEmail: 'finance-ksa@volvitech.com',
    contactPhone: '+966 11 800 4400',
    bankDetails: { bankName: 'Al Rajhi Bank Riyadh', accountNumber: '••••4421', swiftIban: 'RJHIUSMSXXX' },
    creditTerms: 'Operating Hub',
    isInternalEntity: true
  }
];
