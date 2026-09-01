import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './widgets/Avatar';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="text-xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">V</span>
          <span>Volvitech</span>
        </Link>
        <Link to="/dashboard" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">Planner</Link>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <Avatar src={user.avatar} alt={user.fullName} className="h-8 w-8" />
              <span className="text-sm text-gray-700 hidden sm:inline">{user.fullName}</span>
            </div>
            <button onClick={handleLogout} className="btn-ghost text-sm">Log out</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;