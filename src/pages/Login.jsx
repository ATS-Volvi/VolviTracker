import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const Login = () => {
  const { login } = useAuth();
  const { employees } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showProfiles, setShowProfiles] = useState(true);

  // Seed employees if none exist (first run)
  const profiles = employees.length
    ? employees
    : [
        { id: '1', fullName: 'Swastik K.', email: 'swastikk005@gmail.com', avatar: 'https://i.pravatar.cc/150?u=swastikk005@gmail.com' },
        { id: '2', fullName: 'Alex Morgan', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/150?u=alex' },
        { id: '3', fullName: 'Jordan Lee', email: 'jordan@example.com', avatar: 'https://i.pravatar.cc/150?u=jordan' }
      ];

  const handleLogin = (e, profile) => {
    if (e) e.preventDefault();
    const user = profile || profiles.find(p => p.email === email);
    if (user) {
      login(user);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your workspace</p>

        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          OR PICK A PROFILE
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => handleLogin(null, p)}
              className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left"
            >
              <img src={p.avatar} alt={p.fullName} className="h-9 w-9 rounded-full" />
              <div>
                <div className="text-sm font-medium text-gray-800">{p.fullName}</div>
                <div className="text-xs text-gray-500">{p.email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;