import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './widgets/Avatar';
import logo from '../assets/volvitech-logo.png';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/[0.08] backdrop-blur-[3px] border-b border-gray-200/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="w-full px-4 sm:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <img
              src={logo}
              alt="Volvitech"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <span className="h-4 w-px bg-gray-200 hidden sm:inline-block"></span>
          <Link to="/dashboard" className="text-sm font-bold text-gray-700 hover:text-[#0070F3] transition hidden sm:inline-block">
            Planner
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <Avatar src={user.avatar} alt={user.fullName} className="h-8 w-8" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.fullName}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Log out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default NavBar;