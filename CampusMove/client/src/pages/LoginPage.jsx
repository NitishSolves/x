import React, { useState } from 'react';
import { Bus, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onBack, onGoToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div class="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <button
          onClick={onBack}
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center shadow-lg shadow-campus-500/30">
            <Bus class="w-5 h-5 text-white" />
          </div>
          <span class="text-2xl font-black tracking-tight text-white">CampusMove</span>
        </div>
        <h2 class="text-xl font-bold tracking-tight text-slate-200">Sign in to your campus account</h2>
        <p class="text-xs text-slate-400 mt-1">Access real-time bus tracking, driver controls, or admin fleet</p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div class="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 backdrop-blur-xl sm:px-10">
          
          {error && (
            <div class="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400">
              <AlertCircle class="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form class="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                College Email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full mt-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-campus-600 hover:bg-campus-500 text-white shadow-lg shadow-campus-600/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>

          {/* Demo Autofill Section */}
          <div class="mt-6 pt-5 border-t border-slate-800">
            <span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              Quick Test Autofill
            </span>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFill('student@apex.edu', 'student123')}
                class="py-2 px-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-slate-300 transition text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleFill('driver1@apex.edu', 'driver123')}
                class="py-2 px-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-amber-400 transition text-center"
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => handleFill('admin@apex.edu', 'admin123')}
                class="py-2 px-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] font-semibold text-indigo-400 transition text-center"
              >
                Admin
              </button>
            </div>
          </div>

          <div class="mt-5 text-center">
            <button
              onClick={onGoToRegister}
              class="text-xs text-slate-400 hover:text-white transition"
            >
              Don't have an account? <span class="text-campus-400 font-bold underline">Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
