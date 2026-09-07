import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { DEFAULT_DEMO_PASSWORD } from '../utils/crypto';
import logo from '../assets/volvitech-logo.png';

const ROLE_OPTIONS = [
  'Admin',
  'Product Lead',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Project Manager',
  'QA Engineer'
];

const PRESET_AVATARS = [
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
];

const calculatePasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
};

const Login = () => {
  const { login, signup, quickLogin } = useAuth();
  const { employees } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('Software Engineer');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);

  // Status & Modals
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Seed / fallback employees
  const profiles = employees.length
    ? employees
    : [
        { id: '1', fullName: 'Swastik Kumar', email: 'swastikk005@gmail.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=swastikk' },
        { id: '2', fullName: 'Amara Patel', email: 'amara@example.com', role: 'Designer', avatar: 'https://i.pravatar.cc/150?u=amara' },
        { id: '3', fullName: 'Liam Chen', email: 'liam@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=liam' },
        { id: '4', fullName: 'Noor Hassan', email: 'noor@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=noor' }
      ];

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        addToast(`Welcome back, ${result.user.fullName}!`, 'success');
        navigate('/dashboard');
      } else {
        setErrorMessage(result.error || 'Authentication failed.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        fullName: signupName,
        email: signupEmail,
        role: signupRole,
        password: signupPassword,
        avatar: selectedAvatar
      });

      if (result.success) {
        addToast(`Account created! Welcome to Volvitech, ${result.user.fullName}.`, 'success');
        navigate('/dashboard');
      } else {
        setErrorMessage(result.error || 'Failed to create account.');
      }
    } catch {
      setErrorMessage('An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoProfile = (p) => {
    setMode('signin');
    setEmail(p.email);
    setPassword(DEFAULT_DEMO_PASSWORD);
    setErrorMessage('');
    addToast(`Filled credentials for ${p.fullName}. Click "Sign In" to proceed.`, 'info', 2500);
  };

  const handleQuickSignIn = (p) => {
    quickLogin(p);
    addToast(`Signed in as ${p.fullName}`, 'success');
    navigate('/dashboard');
  };

  const passwordStrength = calculatePasswordStrength(signupPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/60 p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      <div className="card p-6 sm:p-8 w-full max-w-md shadow-xl border-gray-200/90 backdrop-blur-sm bg-white/95">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Volvitech" className="h-9 w-auto object-contain" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Workspace
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'signin'
              ? 'Enter your credentials to access your workspace'
              : 'Join your team and track projects on Volvitech'}
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="input-field pl-9 text-sm"
                  placeholder="name@volvitech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-9 pr-10 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in to Workspace'
              )}
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="Swastik Kumar"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                className="input-field text-sm"
                placeholder="swastik@volvitech.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Role / Title
              </label>
              <select
                className="input-field text-sm bg-white"
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  className="input-field pr-10 text-sm"
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showSignupPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Password strength indicator */}
              {signupPassword && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>Password strength:</span>
                    <span className="font-semibold">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.3%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.3%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.3%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showSignupPassword ? 'text' : 'password'}
                className="input-field text-sm"
                placeholder="Confirm password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
              />
              {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Select Profile Avatar
              </label>
              <div className="flex items-center gap-2.5">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`relative rounded-full p-0.5 transition ${
                      selectedAvatar === av.url ? 'ring-2 ring-blue-600 ring-offset-2' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* DEMO PROFILES SECTION */}
        <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          <span>OR PICK A PROFILE</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="mb-2.5 flex items-center justify-between text-xs text-gray-500 px-1">
          <span>Demo Team Profiles</span>
          <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
            Pass: password123
          </span>
        </div>

        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img
                  src={p.avatar}
                  alt={p.fullName}
                  className="h-9 w-9 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName)}&background=0070F3&color=fff`;
                  }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 truncate">{p.fullName}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      (p.role || '').toLowerCase() === 'admin'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.role || 'Member'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{p.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => autofillDemoProfile(p)}
                  title="Auto-fill form with this user"
                  className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-blue-700 hover:bg-white rounded border border-gray-200 shadow-2xs transition"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSignIn(p)}
                  title="Instant 1-Click Sign In"
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-600 hover:text-white rounded border border-blue-200 transition"
                >
                  Sign in
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialEmail={email}
      />
    </div>
  );
};

export default Login;