// Financial & PO Operations Data Store for Volvitech

export const INITIAL_EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.20,
  AED: 3.67,
  SAR: 3.75,
};

export const INITIAL_FINANCIAL_KPIS = {
  clientPoTotal: 4850000,
  invoicedTotal: 3420000,
  collectedTotal: 2980000,
  supplierPoCommitted: 2120000,
  supplierBillsBilled: 1650000,
  supplierPaid: 1340000,
  grossMargin: 1770000,
  grossMarginPercent: 51.8,
  arOutstanding: 440000,
  arOverdue: 42500,
  dsoDays: 38,
  apOutstanding: 310000,
  apOverdue: 18200,
  dpoDays: 29,
};

export const INITIAL_PROJECTS_FINANCIALS = [
  {
    id: 'PRJ-2024-01',
    projectName: 'Smart Grid IoT Platform Phase II',
    clientName: 'Gulf Utilities Co.',
    country: 'UAE 🇦🇪',
    currency: 'AED',
    contractValue: 490463, // in USD
    contractValueNative: 1800000,
    invoicedAmount: 367847,
    invoicedPercent: 75,
    supplierCosts: 139800,
    laborCosts: 96200,
    grossMargin: 131847,
    grossMarginPercent: 35.8,
    status: 'Healthy',
    unit: 'Enterprise IoT',
    poNumber: 'PO-GLF-2024-03',
  },
  {
    id: 'PRJ-2024-02',
    projectName: 'Cloud ERP Financial Middleware',
    clientName: 'Riyadh Apex Infrastructure',
    country: 'KSA 🇸🇦',
    currency: 'SAR',
    contractValue: 245333,
    contractValueNative: 920000,
    invoicedAmount: 220800,
    invoicedPercent: 90,
    supplierCosts: 88500,
    laborCosts: 48000,
    grossMargin: 84300,
    grossMarginPercent: 38.2,
    status: 'Healthy',
    unit: 'Fintech Core',
    poNumber: 'PO-KSA-2024-11',
  },
  {
    id: 'PRJ-2024-03',
    projectName: 'Telecom Billing Microservices Engine',
    clientName: 'Tata Communications Ltd',
    country: 'India 🇮🇳',
    currency: 'INR',
    contractValue: 288461,
    contractValueNative: 24000000,
    invoicedAmount: 288461,
    invoicedPercent: 100,
    supplierCosts: 112000,
    laborCosts: 52000,
    grossMargin: 124461,
    grossMarginPercent: 43.1,
    status: 'Completed',
    unit: 'Cloud Infra',
    poNumber: 'PO-IND-2024-88',
  },
  {
    id: 'PRJ-2024-04',
    projectName: 'Algorithmic Ledger Recon Engine',
    clientName: 'Northstar Financial NY',
    country: 'USA 🇺🇸',
    currency: 'USD',
    contractValue: 320000,
    contractValueNative: 320000,
    invoicedAmount: 64000,
    invoicedPercent: 20,
    supplierCosts: 38000,
    laborCosts: 24000,
    grossMargin: 2000,
    grossMarginPercent: 3.1,
    status: 'Margin Risk',
    unit: 'Fintech Core',
    poNumber: 'PO-USA-2024-02',
  },
  {
    id: 'PRJ-2024-05',
    projectName: 'Barclays Open Banking Micro-Gateway',
    clientName: 'Barclays UK Operations',
    country: 'UK 🇬🇧',
    currency: 'USD',
    contractValue: 580000,
    contractValueNative: 580000,
    invoicedAmount: 435000,
    invoicedPercent: 75,
    supplierCosts: 195000,
    laborCosts: 78000,
    grossMargin: 162000,
    grossMarginPercent: 37.2,
    status: 'Healthy',
    unit: 'Fintech Core',
    poNumber: 'PO-BARCLAYS-981',
  },
  {
    id: 'PRJ-2024-06',
    projectName: 'Supply Chain AI Visibility Dashboard',
    clientName: 'NexaCorp International Ltd',
    country: 'USA 🇺🇸',
    currency: 'USD',
    contractValue: 750000,
    contractValueNative: 750000,
    invoicedAmount: 600000,
    invoicedPercent: 80,
    supplierCosts: 290000,
    laborCosts: 165000,
    grossMargin: 145000,
    grossMarginPercent: 24.1,
    status: 'Healthy',
    unit: 'Enterprise Solutions',
    poNumber: 'PO-NX-9901',
  }
];

export const INITIAL_CLIENT_POS = [
  {
    id: 'CPO-001',
    poNumber: 'PO-GLF-2024-03',
    issueDate: '2024-02-14',
    clientName: 'Gulf Utilities Co.',
    flag: '🇦🇪',
    country: 'UAE',
    scope: 'Smart Grid IoT Platform Phase II',
    totalValueNative: 1800000,
    currency: 'AED',
    totalValueUsd: 490463.22,
    invoicedNative: 1350000,
    drawdownPercent: 75,
    remainingNative: 450000,
    remainingPercent: 25.0,
    terms: 'Net 60',
    status: 'Partially Invoiced',
    milestones: [
      { name: 'Milestone 1: Architectural Blueprint', amount: 450000, status: 'Paid', invNum: 'INV-2024-001' },
      { name: 'Milestone 2: Sensor Firmware Integration', amount: 450000, status: 'Paid', invNum: 'INV-2024-018' },
      { name: 'Milestone 3: Cloud Telemetry Pipeline', amount: 450000, status: 'Billed', invNum: 'INV-2024-042' },
      { name: 'Milestone 4: User Acceptance Testing (UAT)', amount: 450000, status: 'Unbilled' },
    ]
  },
  {
    id: 'CPO-002',
    poNumber: 'PO-KSA-2024-11',
    issueDate: '2024-01-28',
    clientName: 'Riyadh Apex Infrastructure',
    flag: '🇸🇦',
    country: 'KSA',
    scope: 'Cloud ERP Financial Middleware',
    totalValueNative: 920000,
    currency: 'SAR',
    totalValueUsd: 245333.15,
    invoicedNative: 828000,
    drawdownPercent: 90,
    remainingNative: 92000,
    remainingPercent: 10.0,
    terms: 'Net 45',
    status: 'Partially Invoiced',
    milestones: [
      { name: 'Initial Sprint 1-6 Middleware Delivery', amount: 460000, status: 'Paid', invNum: 'INV-2024-009' },
      { name: 'ZATCA Phase 2 E-Invoicing Bridge', amount: 368000, status: 'Paid', invNum: 'INV-2024-031' },
      { name: 'Final Production Handover & Signoff', amount: 92000, status: 'Unbilled' },
    ]
  },
  {
    id: 'CPO-003',
    poNumber: 'PO-IND-2024-88',
    issueDate: '2024-01-05',
    clientName: 'Tata Communications Ltd',
    flag: '🇮🇳',
    country: 'India',
    scope: 'Telecom Billing Microservices Engine',
    totalValueNative: 24000000,
    currency: 'INR',
    totalValueUsd: 288461.50,
    invoicedNative: 24000000,
    drawdownPercent: 100,
    remainingNative: 0,
    remainingPercent: 0,
    terms: 'Net 30',
    status: 'Fully Invoiced',
    milestones: [
      { name: 'Architecture Review & Core Setup', amount: 6000000, status: 'Paid', invNum: 'INV-2024-002' },
      { name: 'CDR Parsing Microservice Delivery', amount: 8000000, status: 'Paid', invNum: 'INV-2024-014' },
      { name: 'High-Volume Load Simulation', amount: 6000000, status: 'Paid', invNum: 'INV-2024-025' },
      { name: 'Final Warranty & Go-Live Acceptance', amount: 4000000, status: 'Paid', invNum: 'INV-2024-039' },
    ]
  },
  {
    id: 'CPO-004',
    poNumber: 'PO-USA-2024-02',
    issueDate: '2024-02-18',
    clientName: 'Northstar Financial NY',
    flag: '🇺🇸',
    country: 'USA',
    scope: 'Algorithmic Ledger Recon Engine',
    totalValueNative: 320000,
    currency: 'USD',
    totalValueUsd: 320000,
    invoicedNative: 64000,
    drawdownPercent: 20,
    remainingNative: 256000,
    remainingPercent: 80.0,
    terms: 'Net 30',
    status: 'Open',
    milestones: [
      { name: 'Phase 1: Requirements & SOW Finalization', amount: 64000, status: 'Paid', invNum: 'INV-2024-048' },
      { name: 'Phase 2: Reconciliation Algorithm Testing', amount: 128000, status: 'Unbilled' },
      { name: 'Phase 3: Real-Time Stream Engine', amount: 128000, status: 'Unbilled' },
    ]
  },
  {
    id: 'CPO-005',
    poNumber: 'PO-NX-9901',
    issueDate: '2024-01-10',
    clientName: 'NexaCorp International Ltd',
    flag: '🇺🇸',
    country: 'USA',
    scope: 'Supply Chain AI Visibility Dashboard',
    totalValueNative: 750000,
    currency: 'USD',
    totalValueUsd: 750000,
    invoicedNative: 600000,
    drawdownPercent: 80,
    remainingNative: 150000,
    remainingPercent: 20.0,
    terms: 'Net 45',
    status: 'Partially Invoiced',
    milestones: [
      { name: 'Cloud Architecture & Pipeline', amount: 300000, status: 'Paid', invNum: 'INV-2024-006' },
      { name: 'Predictive Analytics Model Training', amount: 300000, status: 'Paid', invNum: 'INV-2024-029' },
      { name: 'Integration with Global ERP', amount: 150000, status: 'Unbilled' },
    ]
  }
];

export const INITIAL_INVOICES = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2024-0042',
    linkedPo: 'PO-GLF-2024-03',
    clientName: 'Gulf Utilities Co.',
    country: 'UAE 🇦🇪',
    issueDate: '2024-03-01',
    dueDate: '2024-05-01',
    amountNative: 450000,
    currency: 'AED',
    amountUsd: 122615.80,
    receivedUsd: 0,
    balanceUsd: 122615.80,
    status: 'Pending',
    milestone: 'Milestone 3: Cloud Telemetry Pipeline',
    taxPercent: 5.0,
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2024-0031',
    linkedPo: 'PO-KSA-2024-11',
    clientName: 'Riyadh Apex Infrastructure',
    country: 'KSA 🇸🇦',
    issueDate: '2024-02-15',
    dueDate: '2024-03-31',
    amountNative: 368000,
    currency: 'SAR',
    amountUsd: 98133.33,
    receivedUsd: 98133.33,
    balanceUsd: 0,
    status: 'Paid',
    milestone: 'ZATCA Phase 2 E-Invoicing Bridge',
    taxPercent: 15.0,
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2024-0048',
    linkedPo: 'PO-USA-2024-02',
    clientName: 'Northstar Financial NY',
    country: 'USA 🇺🇸',
    issueDate: '2024-02-25',
    dueDate: '2024-03-27',
    amountNative: 64000,
    currency: 'USD',
    amountUsd: 64000,
    receivedUsd: 64000,
    balanceUsd: 0,
    status: 'Paid',
    milestone: 'Phase 1: Requirements & SOW Finalization',
    taxPercent: 0,
  },
  {
    id: 'INV-004',
    invoiceNumber: 'INV-2024-0055',
    linkedPo: 'PO-NX-9901',
    clientName: 'NexaCorp International Ltd',
    country: 'USA 🇺🇸',
    issueDate: '2024-03-10',
    dueDate: '2024-04-24',
    amountNative: 150000,
    currency: 'USD',
    amountUsd: 150000,
    receivedUsd: 0,
    balanceUsd: 150000,
    status: 'Pending',
    milestone: 'Predictive Analytics Model Training Part 2',
    taxPercent: 0,
  }
];

export const INITIAL_SUPPLIER_POS = [
  {
    id: 'SPO-001',
    poNumber: 'PO-SUP-2024-114',
    entity: 'Volvitech Tech FZ-LLC',
    supplierName: 'Apex Cloud Infrastructure Ltd',
    origin: 'International (Ireland)',
    taxId: 'IE9822401G',
    linkedProject: 'PRJ-2024-01',
    linkedClientPo: 'PO-GLF-2024-03',
    committedUsd: 140000,
    committedNative: 513800,
    currency: 'AED',
    billedUsd: 110000,
    billedPercent: 78.5,
    remainingUsd: 30000,
    terms: 'Net 30 SWIFT Wire',
    status: 'Partially Invoiced',
    items: [
      { desc: 'Dedicated IoT Cluster Hosting 6 Months', qty: 6, unitPrice: 15000, total: 90000 },
      { desc: 'MQTT Broker High-Throughput Node', qty: 1, unitPrice: 50000, total: 50000 }
    ]
  },
  {
    id: 'SPO-002',
    poNumber: 'PO-SUP-2024-118',
    entity: 'Volvitech India Pvt Ltd',
    supplierName: 'DataCore Systems India Ltd',
    origin: 'Domestic (GST Regular)',
    taxId: '27AAACD1982K1Z9',
    linkedProject: 'PRJ-2024-03',
    linkedClientPo: 'PO-IND-2024-88',
    committedUsd: 139423,
    committedNative: 11600000,
    currency: 'INR',
    billedUsd: 139423,
    billedPercent: 100,
    remainingUsd: 0,
    terms: 'Net 45 NEFT/RTGS',
    status: 'Fulfilled',
    items: [
      { desc: 'Senior Microservices Developers (4 Engineers)', qty: 4, unitPrice: 2000000, total: 8000000 },
      { desc: 'Quality Assurance & Automated Testing SOW', qty: 1, unitPrice: 3600000, total: 3600000 }
    ]
  },
  {
    id: 'SPO-003',
    poNumber: 'PO-SUP-2024-121',
    entity: 'Volvitech US Corp',
    supplierName: 'Nordic CyberSec Solutions',
    origin: 'Import / EEA (Norway)',
    taxId: 'VAT NO981029',
    linkedProject: 'PRJ-2024-05',
    linkedClientPo: 'PO-BARCLAYS-981',
    committedUsd: 260000,
    committedNative: 260000,
    currency: 'USD',
    billedUsd: 65000,
    billedPercent: 25.0,
    remainingUsd: 195000,
    terms: 'Net 30 Fedwire SWIFT',
    status: 'Active Drawdown',
    items: [
      { desc: 'API Security Penetration Testing', qty: 2, unitPrice: 65000, total: 130000 },
      { desc: 'SOC-2 Type II Compliance Audit Module', qty: 1, unitPrice: 130000, total: 130000 }
    ]
  },
  {
    id: 'SPO-004',
    poNumber: 'PO-SUP-2024-129',
    entity: 'Volvitech KSA Branch',
    supplierName: 'Riyadh Telecom Networks',
    origin: 'Domestic KSA (CR 1010892019)',
    taxId: 'CR 1010892019',
    linkedProject: 'PRJ-2024-02',
    linkedClientPo: 'PO-KSA-2024-11',
    committedUsd: 88500,
    committedNative: 331875,
    currency: 'SAR',
    billedUsd: 88500,
    billedPercent: 100,
    remainingUsd: 0,
    terms: 'Net 15 SAR Local Transfer',
    status: 'Bill Overdue',
    items: [
      { desc: 'GCC Dedicated Fiber Tunnel & VPN Peering', qty: 1, unitPrice: 88500, total: 88500 }
    ]
  }
];

export const INITIAL_PAYMENTS_RECEIVED = [
  {
    id: 'PMT-RCV-001',
    date: '2024-03-05',
    clientName: 'Riyadh Apex Infrastructure',
    invoiceNumber: 'INV-2024-0031',
    linkedPo: 'PO-KSA-2024-11',
    amountNative: 368000,
    currency: 'SAR',
    amountUsd: 98133.33,
    mode: 'SADAD / Wire',
    reference: 'SAR-TX-9821092',
    status: 'Settled',
    notes: 'Tranche 2 full settlement credited to Volvitech KSA'
  },
  {
    id: 'PMT-RCV-002',
    date: '2024-03-12',
    clientName: 'Northstar Financial NY',
    invoiceNumber: 'INV-2024-0048',
    linkedPo: 'PO-USA-2024-02',
    amountNative: 64000,
    currency: 'USD',
    amountUsd: 64000,
    mode: 'Fedwire / ACH',
    reference: 'FED-ACH-449102',
    status: 'Settled',
    notes: 'Phase 1 SOW milestone payment received'
  }
];

export const INITIAL_PAYMENTS_MADE = [
  {
    id: 'PMT-SUP-001',
    date: '2024-03-14',
    supplierName: 'DataCore Systems India Ltd',
    supplierPoNumber: 'PO-SUP-2024-118',
    amountNative: 11600000,
    currency: 'INR',
    amountUsd: 139423,
    mode: 'RTGS',
    reference: 'RTGS-IN-88910214',
    status: 'Paid',
    notes: 'Full sprint settlement verified against 3-way match audit'
  },
  {
    id: 'PMT-SUP-002',
    date: '2024-03-18',
    supplierName: 'Nordic CyberSec Solutions',
    supplierPoNumber: 'PO-SUP-2024-121',
    amountNative: 65000,
    currency: 'USD',
    amountUsd: 65000,
    mode: 'SWIFT Wire',
    reference: 'SWIFT-NO-990141',
    status: 'Paid',
    notes: 'Penetration testing advance milestone'
  }
];

export const INITIAL_MASTER_DIRECTORY = [
  {
    id: 'CL-US-1092',
    name: 'NexaCorp International Ltd.',
    category: 'Client',
    classification: 'International',
    country: 'USA 🇺🇸',
    avatarText: 'NC',
    department: 'Global Sourcing & Procurement',
    companyMail: 'corporate@nexacorp.com',
    taxId: 'US-EIN-99210-FX',
    taxDescription: 'IRS Form W-9 Active',
    contactPerson: 'Marcus Vance',
    contactEmail: 'm.vance@nexacorp.com',
    contactPhone: '+1 (415) 555-0192',
    contact: 'Marcus Vance (m.vance@nexacorp.com)',
    stakeholders: [
      { name: 'Marcus Vance', email: 'm.vance@nexacorp.com', phone: '+1 (415) 555-0192', role: 'VP Global Procurement' },
      { name: 'Sarah Lin', email: 's.lin@nexacorp.com', phone: '+1 (415) 555-0341', role: 'Finance & Billing Director' },
      { name: 'David Koenig', email: 'd.koenig@nexacorp.com', phone: '+1 (415) 555-0899', role: 'Technical Delivery Lead' }
    ],
    creditTerms: 'Net 45 (Export Wire)',
    creditLimit: '$250,000',
    currency: 'USD',
    activePoVolume: '$1,850,000',
    activePoCount: 4,
    compliance: 'Verified',
    docsCount: 6,
    lifetimeBilled: '$2.45M',
    unbilledCap: '$170,000',
    avgDso: '38 Days',
    bankDetails: {
      bankName: 'JPMorgan Chase New York',
      accountNumber: '9920148102',
      swiftIban: 'CHASUS33XXX',
      routing: '021000021'
    },
    attachedDocs: [
      { name: 'NexaCorp_Executed_MSA_2024.pdf', size: '4.2 MB', category: 'MSA', expiry: 'Dec 31, 2026' },
      { name: 'IRS_W9_Tax_Exemption_Certificate.pdf', size: '1.1 MB', category: 'Tax', expiry: 'Active' },
      { name: 'JPMorgan_Official_Bank_Mandate.pdf', size: '640 KB', category: 'Banking', expiry: 'Verified' }
    ]
  },
  {
    id: 'CL-AE-3841',
    name: 'Gulf Utilities Co.',
    category: 'Client',
    classification: 'International',
    country: 'UAE 🇦🇪',
    avatarText: 'GU',
    department: 'Infrastructure & Power Grids',
    companyMail: 'contact@gulfutilities.ae',
    taxId: 'TRN 10028941200003',
    taxDescription: 'UAE FTA Registered',
    contactPerson: 'Tariq Al-Maktoum',
    contactEmail: 'tariq@gulfutilities.ae',
    contactPhone: '+971 4 800 2931',
    contact: 'Tariq Al-Maktoum (tariq@gulfutilities.ae)',
    stakeholders: [
      { name: 'Tariq Al-Maktoum', email: 'tariq@gulfutilities.ae', phone: '+971 4 800 2931', role: 'Commercial Director' },
      { name: 'Fatima Al-Zahra', email: 'f.alzahra@gulfutilities.ae', phone: '+971 4 800 2944', role: 'Treasury & Accounts Head' }
    ],
    creditTerms: 'Net 60 (L/C or Swift)',
    creditLimit: 'Sovereign Backed',
    currency: 'AED',
    activePoVolume: 'AED 4,200,000',
    activePoCount: 3,
    compliance: 'Doc Expiring (42d left)',
    docsCount: 5,
    lifetimeBilled: 'AED 4.2M',
    unbilledCap: 'AED 650,000',
    avgDso: '54 Days',
    bankDetails: {
      bankName: 'First Abu Dhabi Bank (FAB)',
      accountNumber: 'AE48030000109281002',
      swiftIban: 'FABUAEADXXX',
      routing: '030'
    },
    attachedDocs: [
      { name: 'GulfUtilities_Enterprise_SOW.pdf', size: '3.1 MB', category: 'MSA', expiry: 'Nov 14, 2025' },
      { name: 'AbuDhabi_Commercial_Trade_License.pdf', size: '1.8 MB', category: 'License', expiry: 'Expiring in 42d' },
      { name: 'FTA_Tax_Registration_TRN.pdf', size: '820 KB', category: 'Tax', expiry: 'Dec 2027' }
    ]
  },
  {
    id: 'SU-IN-4912',
    name: 'DataCore Systems India Ltd',
    category: 'Supplier',
    classification: 'Domestic',
    country: 'India 🇮🇳',
    avatarText: 'DC',
    department: 'Enterprise Cloud Platform',
    companyMail: 'procurement@datacoreindia.in',
    taxId: '27AAACD1982K1Z9',
    taxDescription: 'GST / PAN Regular',
    contactPerson: 'Rajesh Sharma',
    contactEmail: 'finance@datacoreindia.in',
    contactPhone: '+91 80 4491 8200',
    contact: 'Rajesh Sharma (finance@datacoreindia.in)',
    creditTerms: 'Net 30 (RTGS / NEFT)',
    creditLimit: 'MSME Tier-1',
    currency: 'INR',
    activePoVolume: '₹32,000,000',
    activePoCount: 2,
    compliance: 'Verified',
    docsCount: 8,
    lifetimeBilled: '₹32.0M',
    unbilledCap: '₹4.5M',
    avgDso: '28 Days',
    bankDetails: {
      bankName: 'HDFC Bank Bengaluru Koramangala',
      accountNumber: '50200081920194',
      swiftIban: 'HDFCINBBXXX',
      routing: 'IFSC: HDFC0000053'
    },
    attachedDocs: [
      { name: 'DataCore_Subcontractor_Framework_Agmt.pdf', size: '2.4 MB', category: 'MSA', expiry: 'Jan 2027' },
      { name: 'GST_Certificate_27AAACD1982K1Z9.pdf', size: '920 KB', category: 'Tax', expiry: 'Active' },
      { name: 'HDFC_Bank_Cancelled_Cheque_Mandate.pdf', size: '480 KB', category: 'Banking', expiry: 'Verified' }
    ]
  },
  {
    id: 'SU-US-8803',
    name: 'CloudScale DevOps LLC',
    category: 'Supplier',
    classification: 'International',
    country: 'USA 🇺🇸',
    avatarText: 'CS',
    department: 'DevOps & Site Reliability',
    companyMail: 'billing@cloudscale.io',
    taxId: 'US-EIN-44109-CL',
    taxDescription: 'IRS Form W-8BEN Signed',
    contactPerson: 'Eileen Cole',
    contactEmail: 'billing@cloudscale.io',
    contactPhone: '+1 (512) 809-2210',
    contact: 'Eileen Cole (billing@cloudscale.io)',
    creditTerms: 'Net 30 (ACH Direct)',
    creditLimit: 'Auto-Debit Opted',
    currency: 'USD',
    activePoVolume: '$540,000',
    activePoCount: 1,
    compliance: 'Verified',
    docsCount: 4,
    lifetimeBilled: '$540k',
    unbilledCap: '$80,000',
    avgDso: '25 Days',
    bankDetails: {
      bankName: 'Silicon Valley Bank (SVB) Austin',
      accountNumber: '3301928014',
      swiftIban: 'SVBUS6SXXX',
      routing: '121140399'
    },
    attachedDocs: [
      { name: 'CloudScale_Master_Services_Agmt.pdf', size: '1.9 MB', category: 'MSA', expiry: 'Active' },
      { name: 'W8BEN_Foreign_Tax_Withholding.pdf', size: '610 KB', category: 'Tax', expiry: 'Verified' }
    ]
  },
  {
    id: 'SU-SA-9014',
    name: 'Riyadh Telecom Networks',
    category: 'Supplier',
    classification: 'International',
    country: 'KSA 🇸🇦',
    avatarText: 'RT',
    department: 'Network Operations & 5G',
    companyMail: 'corporate@riyadhtelecom.sa',
    taxId: 'CR: 1010892019',
    taxDescription: 'ZATCA Compliant e-Inv',
    contactPerson: 'Fahad Al-Husseini',
    contactEmail: 'fahad@riyadhtelecom.sa',
    contactPhone: '+966 11 481 9022',
    contact: 'Fahad Al-Husseini (fahad@riyadhtelecom.sa)',
    creditTerms: 'Net 15 (SADAD Transfer)',
    creditLimit: 'Strict SLA Terms',
    currency: 'SAR',
    activePoVolume: 'SAR 1,120,000',
    activePoCount: 1,
    compliance: 'Verified',
    docsCount: 5,
    lifetimeBilled: 'SAR 1.12M',
    unbilledCap: 'SAR 180k',
    avgDso: '14 Days',
    bankDetails: {
      bankName: 'Al Rajhi Bank Riyadh Olaya',
      accountNumber: 'SA44800004126080109',
      swiftIban: 'RJHISARIXXX',
      routing: '80'
    },
    attachedDocs: [
      { name: 'RiyadhTelecom_Fiber_Service_Contract.pdf', size: '2.8 MB', category: 'MSA', expiry: 'Aug 2026' },
      { name: 'Commercial_Registration_CR1010892019.pdf', size: '1.2 MB', category: 'License', expiry: 'Verified' }
    ]
  },
  {
    id: 'CL-IN-1120',
    name: 'Bharat Bank India',
    category: 'Client',
    classification: 'Domestic',
    country: 'India 🇮🇳',
    avatarText: 'BB',
    taxId: '29BBKPB9910F1Z4',
    taxDescription: 'PAN Verification Open',
    contactPerson: 'Pooja Nair',
    contactEmail: 'procure@bharatbank.co.in',
    contactPhone: '+91 22 6609 4410',
    contact: 'Pooja Nair (procure@bharatbank.co.in)',
    creditTerms: 'Net 45 (RTGS Wire)',
    creditLimit: 'Pending CFO Approval',
    currency: 'INR',
    activePoVolume: '₹18,500,000',
    activePoCount: 1,
    compliance: 'Renewal Pending',
    docsCount: 3,
    lifetimeBilled: '₹18.5M',
    unbilledCap: '₹2.2M',
    avgDso: '44 Days',
    bankDetails: {
      bankName: 'State Bank of India Corporate BKC',
      accountNumber: '30918201948',
      swiftIban: 'SBININBBXXX',
      routing: 'IFSC: SBIN0004100'
    },
    attachedDocs: [
      { name: 'BharatBank_Core_SOW_Proposal.pdf', size: '2.1 MB', category: 'MSA', expiry: 'Nov 2025' }
    ]
  }
];

export const INITIAL_DOCUMENT_VAULT = [
  {
    id: 'DOC-V-01',
    title: 'Standard Client Master Services Agreement (MSA) - Volvitech v4.2',
    category: 'MSA',
    entityName: 'Global Corporate',
    fileType: 'PDF',
    size: '1.4 MB',
    updatedDate: '2024-02-10',
    expiryDate: '2026-12-31',
    hash: 'sha256:8f912c9a...3b',
    tags: ['Legal', 'MSA', 'Clients', 'Global'],
    url: 'https://docs.google.com/document/d/sample-msa'
  },
  {
    id: 'DOC-V-02',
    title: 'ZATCA E-Invoicing Phase 2 Compliance Specification & Cryptographic Keys',
    category: 'Tax',
    entityName: 'Riyadh Telecom Networks',
    fileType: 'PDF',
    size: '890 KB',
    updatedDate: '2024-01-18',
    expiryDate: '2026-06-30',
    hash: 'sha256:4d10fe99...1a',
    tags: ['KSA', 'ZATCA', 'Tax', 'E-Invoice'],
    url: 'https://docs.google.com/document/d/sample-zatca'
  },
  {
    id: 'DOC-V-03',
    title: 'UAE Federal Tax Authority (FTA) Corporate Tax & VAT Registration Certificate',
    category: 'Tax',
    entityName: 'Gulf Utilities Co.',
    fileType: 'PDF',
    size: '420 KB',
    updatedDate: '2024-01-05',
    expiryDate: '2027-01-05',
    hash: 'sha256:77bb01fa...cd',
    tags: ['UAE', 'VAT', 'TRN', 'FTA'],
    url: 'https://docs.google.com/document/d/sample-fta'
  },
  {
    id: 'DOC-V-04',
    title: 'Volvitech Global Banking Details & SWIFT Wire Routing Directory',
    category: 'Banking',
    entityName: 'Volvitech Global Treasury',
    fileType: 'PDF',
    size: '310 KB',
    updatedDate: '2024-03-01',
    expiryDate: 'Permanent',
    hash: 'sha256:90ee4182...bb',
    tags: ['Banking', 'Wire Transfer', 'USD', 'AED', 'INR', 'SAR'],
    url: 'https://docs.google.com/document/d/sample-banking'
  },
  {
    id: 'DOC-V-05',
    title: 'Subcontractor Procurement & 3-Way Match Audit SOP',
    category: 'License',
    entityName: 'DataCore Systems India Ltd',
    fileType: 'DOCX',
    size: '560 KB',
    updatedDate: '2024-02-22',
    expiryDate: '2026-02-22',
    hash: 'sha256:12ca0019...4e',
    tags: ['Procurement', '3-Way Match', 'Audit', 'AP'],
    url: 'https://docs.google.com/document/d/sample-sop'
  },
  {
    id: 'DOC-V-06',
    title: 'Volvitech Standard Mutual Non-Disclosure Agreement (NDA) v4.0',
    category: 'NDA',
    entityName: 'NexaCorp International Ltd.',
    fileType: 'PDF',
    size: '850 KB',
    updatedDate: '2024-01-15',
    expiryDate: '2029-01-15',
    hash: 'sha256:00ab44ef...33',
    tags: ['NDA', 'Legal', 'Confidentiality'],
    url: 'https://docs.google.com/document/d/sample-nda'
  }
];

// Helper to load or initialize from localStorage
export function loadFinanceData() {
  try {
    const raw = localStorage.getItem('volvitech_finance_suite');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        kpis: { ...INITIAL_FINANCIAL_KPIS, ...(parsed.kpis || {}) },
        exchangeRates: { ...INITIAL_EXCHANGE_RATES, ...(parsed.exchangeRates || {}) },
        projects: parsed.projects && parsed.projects.length ? parsed.projects : INITIAL_PROJECTS_FINANCIALS,
        clientPos: parsed.clientPos && parsed.clientPos.length ? parsed.clientPos : INITIAL_CLIENT_POS,
        invoices: parsed.invoices && parsed.invoices.length ? parsed.invoices : INITIAL_INVOICES,
        supplierPos: parsed.supplierPos && parsed.supplierPos.length ? parsed.supplierPos : INITIAL_SUPPLIER_POS,
        paymentsReceived: parsed.paymentsReceived && parsed.paymentsReceived.length ? parsed.paymentsReceived : INITIAL_PAYMENTS_RECEIVED,
        paymentsMade: parsed.paymentsMade && parsed.paymentsMade.length ? parsed.paymentsMade : INITIAL_PAYMENTS_MADE,
        masterDirectory: (parsed.masterDirectory && parsed.masterDirectory.length ? parsed.masterDirectory : INITIAL_MASTER_DIRECTORY).map(m => {
          let updatedId = m.id;
          if (updatedId && updatedId.startsWith('ENT-')) {
            const prefix = m.category === 'Supplier' ? 'SU' : 'CL';
            updatedId = updatedId.replace(/^ENT-/, `${prefix}-`);
          }
          const matchInitial = INITIAL_MASTER_DIRECTORY.find(init => init.id === updatedId || init.id === m.id);
          return {
            ...m,
            id: updatedId,
            department: m.department || matchInitial?.department || (m.category === 'Client' ? 'Enterprise Procurement' : 'Technical Operations'),
            companyMail: m.companyMail || matchInitial?.companyMail || m.contactEmail || `contact@${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          };
        }),
        vault: (parsed.vault && parsed.vault.length ? parsed.vault : INITIAL_DOCUMENT_VAULT).map(v => {
          const matchInitial = INITIAL_DOCUMENT_VAULT.find(iv => iv.id === v.id || iv.title === v.title);
          return {
            ...v,
            entityName: v.entityName || matchInitial?.entityName || 'Global Corporate',
            hash: v.hash || matchInitial?.hash || 'sha256:77bb01fa...cd',
          };
        }),
      };
    }
  } catch (e) {
    console.error('Error loading finance data from storage:', e);
  }

  return {
    kpis: INITIAL_FINANCIAL_KPIS,
    exchangeRates: INITIAL_EXCHANGE_RATES,
    projects: INITIAL_PROJECTS_FINANCIALS,
    clientPos: INITIAL_CLIENT_POS,
    invoices: INITIAL_INVOICES,
    supplierPos: INITIAL_SUPPLIER_POS,
    paymentsReceived: INITIAL_PAYMENTS_RECEIVED,
    paymentsMade: INITIAL_PAYMENTS_MADE,
    masterDirectory: INITIAL_MASTER_DIRECTORY,
    vault: INITIAL_DOCUMENT_VAULT,
  };
}

export function saveFinanceData(data) {
  try {
    localStorage.setItem('volvitech_finance_suite', JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('volvitech_finance_updated', { detail: data }));
  } catch (e) {
    console.error('Error saving finance data:', e);
  }
}

export function subscribeFinanceData(callback) {
  const handler = (e) => {
    if (e.detail) {
      callback(e.detail);
    }
  };
  window.addEventListener('volvitech_finance_updated', handler);
  return () => window.removeEventListener('volvitech_finance_updated', handler);
}

