# VolviTracker

Enterprise Project Management, Resource Planning & Finance Suite built for Volvitech. Designed with modern React architecture, server-side transactional validation, and Neon PostgreSQL cloud database integration.

---

## Features

- **Project & Task Operations**: SOW tracking, milestone management, task assignments, and progress analytics.
- **Enterprise Finance Suite**:
  - Client Purchase Orders (CPO), milestones, and drawdowns.
  - Multi-currency Sales Invoicing, VAT/Tax calculation, and domestic vs. export classification.
  - Accounts Receivable (AR) & Accounts Payable (AP) ageing schedules.
  - Supplier Purchase Orders (SPO) and 3-way matching audits.
  - Double-entry cashbook ledger, multi-currency cash accounts, and bank reconciliations.
  - Period locking and immutable audit logging.
- **Master Data & Corporate Dossier**:
  - Centralized legal directory for Client and Supplier accounts.
  - Document vault, corporate governance, UBO verification, and KYC tracking.
- **Role-Based Access Control**:
  - Secure bcrypt password hashing, JWT sessions, and role checks (`Admin`, `Accountant`, `Project Manager`, `Member`).
- **Code Quality & Performance**:
  - Dynamic route code-splitting via `React.lazy` and `Suspense`.
  - Server-side body validation using Zod schemas for all mutating endpoints.
  - Server and client pagination with search across high-volume tables.

---

## Required Environment Variables

Configure the following environment variable names in your `.env` file (local) and Vercel Project Settings (production):

- `DATABASE_URL` — Neon PostgreSQL connection URI.
- `POSTGRES_URL` — Neon PostgreSQL connection URI (alias used by Vercel Postgres/Neon integration).
- `JWT_SECRET` — Cryptographic secret key used to sign and verify session tokens (minimum 32 characters).
- `ALLOWED_ORIGIN` — Allowed CORS origins for API requests (e.g., `http://localhost:5175` or production URL).

> **Note**: Never commit sensitive database credentials or secret keys to version control. Reference `.env.example` as a template.

---

## Getting Started Locally

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or 20.x recommended)
- [npm](https://www.npmjs.com/) (version 9.x or higher)
- A Neon PostgreSQL database instance (or compatible PostgreSQL database)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd tracker
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Populate the required variable names (`DATABASE_URL`, `POSTGRES_URL`, `JWT_SECRET`, `ALLOWED_ORIGIN`).

### 4. Database Initialization (Optional / Fresh Setup)

To initialize or reset the schema with baseline tables and system structure:

```bash
npm run db:reset
```

### 5. Running the Application

Launch the local development server with Vite (which mounts the API middleware):

```bash
npm run dev
```

Open [http://localhost:5175](http://localhost:5175) in your browser.

To run the standalone production Node.js API server:

```bash
npm start
```

---

## Testing & Code Quality

Run unit and integration tests with Vitest:

```bash
npm test
```

Run ESLint to verify code quality across the codebase:

```bash
npm run lint
```

Format code with Prettier:

```bash
npx prettier --write .
```

Verify production bundling:

```bash
npm run build
```

---

## Deployment to Vercel

The application is structured for zero-configuration serverless deployment on Vercel:

1. **Connect Repository**: Link the GitHub/GitLab repository in the [Vercel Dashboard](https://vercel.com).
2. **Framework Preset**: Select **Vite**.
3. **Build & Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Environment Variables**:
   In **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `JWT_SECRET`
   - `ALLOWED_ORIGIN`
5. **Serverless Routing**:
   The included `vercel.json` and `api/index.js` automatically route all `/api/*` traffic to the backend serverless API handler and forward all other routes to the Single Page Application (`dist/index.html`).

---

## Project Structure

```text
tracker/
├── api/                     # Vercel serverless function entry point (api/index.js)
├── public/                  # Public assets and branding logos
├── server/                  # Backend API and database layer
│   ├── api.js               # HTTP API route handlers, CORS, and pagination
│   ├── db.js                # Neon PostgreSQL queries, schema setup, transactions
│   ├── index.js             # Standalone Node.js server launcher
│   ├── reset-db.js          # Database reset & migration utility
│   └── validation.js        # Zod input schemas for POST/PUT endpoints
├── src/                     # React Single Page Application (Vite)
│   ├── components/          # Reusable UI components & modals
│   │   ├── auth/            # Auth-related modals & change password
│   │   ├── docs/            # Document creation and preview modals
│   │   ├── employees/       # Employee directory grid and user creation
│   │   ├── meetings/        # Meeting calendar and scheduling modals
│   │   ├── navbar/          # Top navigation bar
│   │   ├── projects/        # Project and task creation modals
│   │   ├── sidebar/         # Main application navigation sidebar
│   │   └── widgets/         # Shared UI badges, avatars, and buttons
│   ├── context/             # Global React state providers
│   │   ├── AuthContext.jsx  # Authentication, active user session & permissions
│   │   ├── DataContext.jsx  # Workspace entity store and sync
│   │   ├── ToastContext.jsx # Toast notifications
│   │   └── NotificationContext.jsx # Real-time alerts
│   ├── pages/               # Route page views (lazy-loaded in App.jsx)
│   │   ├── auth/            # Login view
│   │   ├── dashboard/       # Project management dashboard
│   │   ├── employee/        # Employee profile and personal planning
│   │   ├── finance/         # Finance & ERP suite
│   │   │   ├── cashbook/    # Cashbook sub-components & ledger table
│   │   │   ├── modals/      # Invoice, PO, payment, and exchange rate modals
│   │   │   ├── tabs/        # Finance overview, client POs, supplier POs, etc.
│   │   │   ├── financeCalcs.js  # Pure money math, drawdown, and ageing logic
│   │   │   └── financeExports.js# Spreadsheet and CSV exporters
│   │   └── masterData/      # Corporate registry & entity management
│   │       ├── components/  # Modularized tables, KPIs, and inspector
│   │       ├── dossier/     # Corporate dossier sub-components and tabs
│   │       └── modals/      # Add entity and upload vault modals
│   ├── services/            # API client modules
│   │   ├── api.js           # Client HTTP requests, auth token storage
│   │   └── financeApi.js    # Client finance API service and cache
│   ├── utils/               # Excel import/export and data utilities
│   ├── App.jsx              # Application router with React.lazy & Suspense
│   ├── index.css            # Tailwind & custom CSS variables
│   └── main.jsx             # React DOM entry point
├── eslint.config.js         # ESLint configuration
├── vercel.json              # Vercel deployment rewrite rules
├── vite.config.js           # Vite build and dev server configuration
└── package.json             # NPM package scripts and dependencies
```
