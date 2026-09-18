import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from './widgets/Avatar';
import ChangePasswordModal from './auth/ChangePasswordModal';
import ChangeProfilePictureModal from './auth/ChangeProfilePictureModal';
import logo from '../assets/volvitech-logo.png';

const NavBar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeAvatarOpen, setChangeAvatarOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    addToast('You have been logged out.', 'info', 2000);
    navigate('/login');
  };

  const isPlannerActive = location.pathname === '/dashboard' || location.pathname === '/';
  const isProfileActive = Boolean(user && location.pathname === `/employee/${user.id}`);
  const isDocsActive = location.pathname.startsWith('/docs');

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/[0.88] backdrop-blur-md border-b border-gray-200/40 shadow-xs'
            : 'bg-white/50 backdrop-blur-xs border-b border-gray-100'
        }`}
      >
        <nav className="w-full px-4 sm:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-5">
            <Link
              to={isAdmin ? '/dashboard' : `/employee/${user?.id}`}
              className="flex items-center gap-2.5 hover:opacity-90 transition"
            >
              <img
                src={logo}
                alt="Volvitech"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>
            <span className="h-4 w-px bg-gray-200 hidden sm:inline-block"></span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {isAdmin ? (
                <Link
                  to="/dashboard"
                  className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    isPlannerActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Planner</span>
                </Link>
              ) : (
                <Link
                  to={`/employee/${user?.id}`}
                  className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    isProfileActive
                      ? 'bg-blue-50 text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Personal</span>
                </Link>
              )}
              <Link
                to="/docs"
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  isDocsActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Docs</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition border border-transparent hover:border-gray-200 focus:outline-hidden"
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.fullName}
                    className="h-8 w-8 object-cover ring-1 ring-blue-500/20"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-gray-800 leading-tight">
                      {user.fullName}
                    </div>
                    {isAdmin ? (
                      <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 mt-0.5">
                        Admin
                      </span>
                    ) : (
                      <div className="text-[10px] text-gray-500 leading-tight font-medium">
                        {user.role || 'Member'}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      menuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50 animate-slide-up text-left">
                    {/* User header info */}
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span
                        className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isAdmin
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}
                      >
                        {user.role || 'Member'}
                      </span>
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
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
                          setMenuOpen(false);
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
              </div>
            )}
          </div>
        </nav>
      </header>

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

export default NavBar;