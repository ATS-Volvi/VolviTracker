import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from './widgets/Avatar';
import ChangePasswordModal from './auth/ChangePasswordModal';
import ChangeProfilePictureModal from './auth/ChangeProfilePictureModal';
import logo from '../assets/volvitech-logo.png';
import iconLogo from '../assets/volvitech-icon.png';

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user, isAdmin, logout } = useAuth();
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

  const isProjectsActive = location.pathname === '/projects' || 
    location.pathname === '/dashboard' || 
    location.pathname === '/' || 
    Boolean(user && location.pathname === `/employee/${user.id}`);
  const isMasterDataActive = location.pathname.startsWith('/master-data');
  const isFinanceActive = location.pathname.startsWith('/finance') || location.pathname.startsWith('/docs');

  const navItems = [
    {
      to: isAdmin ? '/projects' : `/employee/${user?.id}`,
      label: 'Projects',
      active: isProjectsActive,
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    ...(isAdmin ? [{
      to: '/finance',
      label: 'Finance',
      active: isFinanceActive,
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }] : []),
    {
      to: '/master-data',
      label: 'Master Data',
      active: isMasterDataActive,
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  const renderSidebarContent = (collapsed = false) => (
    <div className="flex flex-col h-full justify-between bg-white border-r border-gray-200/80 transition-all duration-300">
      {/* Top Brand Section */}
      <div className="flex flex-col">
        <div className={`h-16 flex items-center border-b border-gray-100 relative ${
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <Link
            to={isAdmin ? '/projects' : `/employee/${user?.id}`}
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

        {/* Navigation Items */}
        <div className={`p-2.5 space-y-1 ${collapsed ? 'px-2' : 'px-3.5'}`}>
          {!collapsed && (
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Workspace
            </div>
          )}
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center rounded-xl text-sm font-semibold transition-all duration-150 ${
                collapsed
                  ? 'justify-center p-3'
                  : 'gap-3 px-3.5 py-2.5'
              } ${
                item.active
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className={item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              )}

              {/* Floating Tooltip in Collapsed Mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  {item.label}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </Link>
          ))}
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
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}
              >
                {user?.role || (isAdmin ? 'Admin' : 'Member')}
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
