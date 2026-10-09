import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from './widgets/Avatar';
import ChangePasswordModal from './auth/ChangePasswordModal';
import ChangeProfilePictureModal from './auth/ChangeProfilePictureModal';
import logo from '../assets/volvitech-logo.png';
import iconLogo from '../assets/volvitech-icon.png';

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user, isAdmin, isProjectManager, canManageProjects, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeAvatarOpen, setChangeAvatarOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
    logout();
    addToast('You have been logged out.', 'info', 2000);
    navigate('/login');
  };

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentTab = (searchParams.get('tab') || '').toLowerCase();
  const currentStream = (searchParams.get('stream') || '').toLowerCase();
  const currentAction = (searchParams.get('action') || '').toLowerCase();

  // Active status calculations
  const isProjectsActive = location.pathname === '/projects' || 
    location.pathname === '/dashboard' || 
    (location.pathname === '/' && canManageProjects) || 
    Boolean(user && !canManageProjects && location.pathname === `/employee/${user?.id}`);

  const isClientPosActive = location.pathname === '/sales/client-pos' || 
    (location.pathname === '/finance/client' && (!currentTab || currentTab === 'pos'));

  const isSupplierPosActive = location.pathname === '/purchases/supplier-pos' || 
    (location.pathname === '/finance/supplier' && (!currentTab || currentTab === 'pos'));

  // Accounts Receivable subpages
  const isClientInvoicesActive = location.pathname === '/finance/client' && ['invoices', 'invoice'].includes(currentTab);
  const isReceiptsActive = location.pathname === '/finance/client' && ['receipts', 'receipt', 'payments', 'payment'].includes(currentTab);
  const isArAgeingActive = location.pathname === '/finance/client' && ['ageing', 'aging'].includes(currentTab);
  const isClientStatementsActive = location.pathname === '/finance/client' && ['statements', 'statement'].includes(currentTab);
  const isArActive = location.pathname === '/finance/client' && currentTab && currentTab !== 'pos';

  // Accounts Payable subpages
  const isSupplierInvoicesActive = location.pathname === '/finance/supplier' && ['invoices', 'invoice', 'bills', 'bill'].includes(currentTab);
  const isApPaymentsActive = location.pathname === '/finance/supplier' && ['payments', 'payment'].includes(currentTab);
  const isApAgeingActive = location.pathname === '/finance/supplier' && ['ageing', 'aging'].includes(currentTab);
  const isSupplierStatementsActive = location.pathname === '/finance/supplier' && ['statements', 'statement'].includes(currentTab);
  const isApActive = location.pathname === '/finance/supplier' && currentTab && currentTab !== 'pos';

  // Cash Book subpages
  const isCashBookAllActive = location.pathname === '/finance/cash-book' && (!currentStream || currentStream === 'all') && !currentAction;
  const isCashBookInflowActive = location.pathname === '/finance/cash-book' && currentStream === 'inflow';
  const isCashBookOutflowActive = location.pathname === '/finance/cash-book' && currentStream === 'outflow';
  const isCashBookAddActive = location.pathname === '/finance/cash-book' && ['add-entry', 'add'].includes(currentAction);
  const isCashBookActive = location.pathname === '/finance/cash-book';
  const isTaxActive = location.pathname.startsWith('/finance/tax');
  const isCashFlowActive = location.pathname.startsWith('/finance/cash-flow') || location.pathname.startsWith('/finance/cashflow');

  const isMasterDataActive = location.pathname.startsWith('/master-data');

  // Accordion open states
  const [arOpen, setArOpen] = useState(true);
  const [apOpen, setApOpen] = useState(true);
  const [cashBookOpen, setCashBookOpen] = useState(true);

  // Auto-expand accordion if navigating into its subpages
  useEffect(() => {
    if (location.pathname.startsWith('/finance/client') && currentTab && currentTab !== 'pos') {
      setArOpen(true);
    }
    if (location.pathname.startsWith('/finance/supplier') && currentTab && currentTab !== 'pos') {
      setApOpen(true);
    }
    if (location.pathname.startsWith('/finance/cash-book')) {
      setCashBookOpen(true);
    }
  }, [location.pathname, currentTab]);

  const renderSidebarContent = (collapsed = false) => (
    <div className="flex flex-col h-full justify-between bg-white border-r border-gray-200/80 transition-all duration-300">
      {/* Top Brand Section & Scrollable Navigation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header / Brand Logo */}
        <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 relative ${
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <Link
            to={canManageProjects ? '/projects' : `/employee/${user?.id}`}
            className="flex items-center gap-2.5 hover:opacity-90 transition"
            title={collapsed ? "Volvitech" : undefined}
          >
            {collapsed ? (
              <img
                src={iconLogo}
                alt="Volvitech"
                className="h-8 w-8 object-contain"
              />
            ) : (
              <img
                src={logo}
                alt="Volvitech"
                className="h-8 w-auto object-contain"
              />
            )}
          </Link>

          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 md:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Desktop Collapse / Expand Toggle Edge Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-xs items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-all z-40 active:scale-95"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin py-3 space-y-3 ${collapsed ? 'px-2' : 'px-3.5'}`}>
          {collapsed ? (
            /* ================= COLLAPSED VIEW ================= */
            <div className="space-y-2">
              {/* Projects Collapsed */}
              <div className="relative group">
                <Link
                  to={canManageProjects ? '/projects' : `/employee/${user?.id}`}
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isProjectsActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">folder</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Projects
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>

              {/* Sales Client POs Collapsed */}
              <div className="relative group">
                <Link
                  to="/sales/client-pos"
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isClientPosActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Client POs (Sales)
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>

              {/* Purchases Supplier POs Collapsed */}
              <div className="relative group">
                <Link
                  to="/purchases/supplier-pos"
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isSupplierPosActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">outbox</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Supplier POs (Purchases)
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>

              {/* Accounts Receivable Collapsed Flyout */}
              <div className="relative group">
                <button
                  type="button"
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isArActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                </button>
                <div className="absolute left-full top-0 ml-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all text-left">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Accounts Receivable
                  </div>
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/finance/client?tab=invoices"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isClientInvoicesActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">description</span>
                      <span>Client Invoices</span>
                    </Link>
                    <Link
                      to="/finance/client?tab=receipts"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isReceiptsActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">monetization_on</span>
                      <span>Receipts</span>
                    </Link>
                    <Link
                      to="/finance/client?tab=ageing"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isArAgeingActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">calendar_month</span>
                      <span>AR Ageing</span>
                    </Link>
                    <Link
                      to="/finance/client?tab=statements"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isClientStatementsActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">summarize</span>
                      <span>Client Statements</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Accounts Payable Collapsed Flyout */}
              <div className="relative group">
                <button
                  type="button"
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isApActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                </button>
                <div className="absolute left-full top-0 ml-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all text-left">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Accounts Payable
                  </div>
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/finance/supplier?tab=invoices"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isSupplierInvoicesActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-700">description</span>
                      <span>Supplier Invoices</span>
                    </Link>
                    <Link
                      to="/finance/supplier?tab=payments"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isApPaymentsActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-700">mail</span>
                      <span>Payments</span>
                    </Link>
                    <Link
                      to="/finance/supplier?tab=ageing"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isApAgeingActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-700">calendar_month</span>
                      <span>AP Ageing</span>
                    </Link>
                    <Link
                      to="/finance/supplier?tab=statements"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isSupplierStatementsActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-700">summarize</span>
                      <span>Supplier Statements</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Cash Book Collapsed Flyout */}
              <div className="relative group">
                <button
                  type="button"
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isCashBookActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </button>
                <div className="absolute left-full top-0 ml-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all text-left">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cash Book (Company Account)
                  </div>
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/finance/cash-book?stream=all"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isCashBookAllActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-800">menu_book</span>
                      <span>All Transactions</span>
                    </Link>
                    <Link
                      to="/finance/cash-book?stream=inflow"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isCashBookInflowActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-700">monetization_on</span>
                      <span>Inflow (Credit)</span>
                    </Link>
                    <Link
                      to="/finance/cash-book?stream=outflow"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isCashBookOutflowActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-700">mail</span>
                      <span>Outflow (Debit)</span>
                    </Link>
                    <Link
                      to="/finance/cash-book?action=add-entry"
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                        isCashBookAddActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-blue-600">post_add</span>
                      <span>Add Entry</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tax Collapsed */}
              <div className="relative group">
                <Link
                  to="/finance/tax"
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isTaxActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">balance</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Tax
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>

              {/* Cash Flow Collapsed */}
              <div className="relative group">
                <Link
                  to="/finance/cash-flow"
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isCashFlowActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Cash Flow
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>

              {/* Master Data Collapsed */}
              <div className="relative group pt-2 border-t border-gray-100">
                <Link
                  to="/master-data"
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-150 ${
                    isMasterDataActive ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">apartment</span>
                </Link>
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Master Data
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>
            </div>
          ) : (
            /* ================= EXPANDED VIEW ================= */
            <div className="space-y-4">
              {/* 1. Projects Section */}
              <div className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  Projects
                </div>
                <Link
                  to={canManageProjects ? '/projects' : `/employee/${user?.id}`}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isProjectsActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isProjectsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    folder
                  </span>
                  <span>Projects</span>
                  {isProjectsActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>
              </div>

              {/* 2. Sales Section */}
              <div className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  Sales
                </div>
                <Link
                  to="/sales/client-pos"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isClientPosActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isClientPosActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    description
                  </span>
                  <span>Client POs</span>
                  {isClientPosActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>
              </div>

              {/* 3. Purchases Section */}
              <div className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  Purchases
                </div>
                <Link
                  to="/purchases/supplier-pos"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isSupplierPosActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isSupplierPosActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    outbox
                  </span>
                  <span>Supplier POs</span>
                  {isSupplierPosActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>
              </div>

              {/* 4. Finance Section */}
              <div className="space-y-1.5">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  Finance
                </div>

                {/* Accounts Receivable Accordion */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setArOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isArActive
                        ? 'bg-blue-50/70 text-blue-600 font-bold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[19px] ${isArActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        handshake
                      </span>
                      <span>Accounts Receivable</span>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 ${arOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {arOpen && (
                    <div className="ml-5 pl-3 border-l border-gray-200/90 space-y-0.5 py-1">
                      <Link
                        to="/finance/client?tab=invoices"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isClientInvoicesActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">description</span>
                        <span>Client Invoices</span>
                        {isClientInvoicesActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/client?tab=receipts"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isReceiptsActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">monetization_on</span>
                        <span>Receipts</span>
                        {isReceiptsActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/client?tab=ageing"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isArAgeingActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">calendar_month</span>
                        <span>AR Ageing</span>
                        {isArAgeingActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/client?tab=statements"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isClientStatementsActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">summarize</span>
                        <span>Client Statements</span>
                        {isClientStatementsActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Accounts Payable Accordion */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setApOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isApActive
                        ? 'bg-blue-50/70 text-blue-600 font-bold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[19px] ${isApActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        credit_card
                      </span>
                      <span>Accounts Payable</span>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 ${apOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {apOpen && (
                    <div className="ml-5 pl-3 border-l border-gray-200/90 space-y-0.5 py-1">
                      <Link
                        to="/finance/supplier?tab=invoices"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSupplierInvoicesActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-700">description</span>
                        <span>Supplier Invoices</span>
                        {isSupplierInvoicesActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/supplier?tab=payments"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isApPaymentsActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-700">mail</span>
                        <span>Payments</span>
                        {isApPaymentsActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/supplier?tab=ageing"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isApAgeingActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-700">calendar_month</span>
                        <span>AP Ageing</span>
                        {isApAgeingActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/supplier?tab=statements"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSupplierStatementsActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-700">summarize</span>
                        <span>Supplier Statements</span>
                        {isSupplierStatementsActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Cash Book (Company Account) Accordion */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setCashBookOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                      isCashBookActive
                        ? 'bg-blue-50/70 text-blue-600 font-bold'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left leading-tight">
                      <span className={`material-symbols-outlined text-[19px] shrink-0 ${isCashBookActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        account_balance_wallet
                      </span>
                      <span>Cash Book (Company Account)</span>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 shrink-0 ${cashBookOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {cashBookOpen && (
                    <div className="ml-5 pl-3 border-l border-gray-200/90 space-y-0.5 py-1">
                      <Link
                        to="/finance/cash-book?stream=all"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCashBookAllActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-800">menu_book</span>
                        <span>All Transactions</span>
                        {isCashBookAllActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/cash-book?stream=inflow"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCashBookInflowActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">monetization_on</span>
                        <span>Inflow (Credit)</span>
                        {isCashBookInflowActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/cash-book?stream=outflow"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCashBookOutflowActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-700">mail</span>
                        <span>Outflow (Debit)</span>
                        {isCashBookOutflowActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                      <Link
                        to="/finance/cash-book?action=add-entry"
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCashBookAddActive
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-600">post_add</span>
                        <span>Add Entry</span>
                        {isCashBookAddActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Tax Link */}
                <Link
                  to="/finance/tax"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isTaxActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isTaxActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    balance
                  </span>
                  <span>Tax</span>
                  {isTaxActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>

                {/* Cash Flow Link */}
                <Link
                  to="/finance/cash-flow"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isCashFlowActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isCashFlowActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    account_balance
                  </span>
                  <span>Cash Flow</span>
                  {isCashFlowActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>
              </div>

              {/* 5. Master Data Section */}
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <div className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider">
                  Database
                </div>
                <Link
                  to="/master-data"
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                    isMasterDataActive
                      ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${isMasterDataActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    apartment
                  </span>
                  <span>Master Data</span>
                  {isMasterDataActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Footer Section */}
      <div className={`border-t border-gray-100 relative ${collapsed ? 'p-2' : 'p-3'}`} ref={profileMenuRef}>
        {profileMenuOpen && (
          <div className={`absolute bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up text-left ${
            collapsed
              ? 'left-full bottom-2 ml-3 w-56'
              : 'bottom-full left-3 right-3 mb-2'
          }`}>
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAdmin
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : isProjectManager
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {user?.role || (isAdmin ? 'Admin' : isProjectManager ? 'Project Manager' : 'Member')}
              </span>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setChangeAvatarOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition text-left"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Change Profile Picture
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition text-left"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </button>
            </div>

            <div className="border-t border-gray-100 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
              >
                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`w-full flex items-center rounded-xl hover:bg-gray-100 transition border border-transparent hover:border-gray-200 text-left focus:outline-hidden ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 p-2'
          }`}
          title={collapsed ? user?.fullName : undefined}
        >
          <Avatar
            src={user?.avatar}
            alt={user?.fullName}
            className="h-9 w-9 object-cover ring-1 ring-blue-500/20 shrink-0"
          />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-gray-800 leading-tight truncate">
                    {user?.fullName}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.2 rounded shrink-0 border border-purple-200/60">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {user?.role || 'Member'}
                </div>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition focus:outline-hidden"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to={isAdmin ? '/projects' : `/employee/${user?.id}`}>
            <img src={logo} alt="Volvitech" className="h-7 w-auto object-contain" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="focus:outline-hidden"
        >
          <Avatar
            src={user?.avatar}
            alt={user?.fullName}
            className="h-8 w-8 object-cover ring-1 ring-blue-500/20"
          />
        </button>
      </header>

      {/* Desktop Fixed Collapsible Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel (always fully expanded) */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-slide-right">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Change Profile Picture Modal */}
      <ChangeProfilePictureModal
        isOpen={changeAvatarOpen}
        onClose={() => setChangeAvatarOpen(false)}
      />
    </>
  );
};

export default Sidebar;
