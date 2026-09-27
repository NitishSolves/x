import React, { useState, useEffect } from 'react';
import { Bus, Lock, Mail, User, School, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function RegisterPage({ onBack, onGoToLogin }) {
  const { register } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [studentId, setStudentId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadColleges() {
      try {
        const list = await api.colleges.getAll();
        setColleges(list);
        if (list.length > 0) {
          setCollegeId(list[0].id);
        }
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    }
    loadColleges();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!collegeId) {
      setError('Please select your college.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        collegeId,
        studentId: role === 'STUDENT' ? studentId : null,
        licenseNumber: role === 'DRIVER' ? licenseNumber : null,
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
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
        <h2 class="text-xl font-bold tracking-tight text-slate-200">Create your campus account</h2>
        <p class="text-xs text-slate-400 mt-1">Join your college transit network</p>
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
                Select Your College Tenant *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <School class="w-4 h-4" />
                </div>
                <select
                  required
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Account Type / Role
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  class={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    role === 'STUDENT'
                      ? 'bg-campus-600/30 border-campus-500 text-campus-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  class={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    role === 'DRIVER'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Bus Driver
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Name *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User class="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                College Email Address *
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
                Password *
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
                  placeholder="Minimum 6 characters"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            {role === 'STUDENT' ? (
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Student Roll / ID # (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. AIT-2024-101"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
                />
              </div>
            ) : (
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Commercial Driver License (CDL) #
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. CDL-88219"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              class="w-full mt-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-campus-600 hover:bg-campus-500 text-white shadow-lg shadow-campus-600/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>

          <div class="mt-5 text-center">
            <button
              onClick={onGoToLogin}
              class="text-xs text-slate-400 hover:text-white transition"
            >
              Already have an account? <span class="text-campus-400 font-bold underline">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
