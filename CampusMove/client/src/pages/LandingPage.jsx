import React, { useState, useEffect } from 'react';
import { Bus, Navigation, Shield, Radio, CheckCircle, ArrowRight, Smartphone, Sparkles, School } from 'lucide-react';
import { api } from '../api/client';

export default function LandingPage({ onGoToLogin, onGoToRegister, onQuickLogin }) {
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    async function loadColleges() {
      try {
        const list = await api.colleges.getAll();
        setColleges(list);
      } catch (e) {
        console.error('Error fetching colleges:', e);
      }
    }
    loadColleges();
  }, []);

  return (
    <div class="min-h-screen bg-slate-950 text-white selection:bg-campus-500 selection:text-white flex flex-col justify-between">
      {/* Top Header */}
      <header class="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center shadow-lg shadow-campus-500/30">
            <Bus class="w-5 h-5 text-white" />
          </div>
          <div>
            <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CampusMove
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            onClick={() => onGoToLogin()}
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => onGoToRegister()}
            class="px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-lg shadow-campus-600/30 transition active:scale-95"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main class="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div class="text-center max-w-3xl mx-auto space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-campus-400">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Production Real-Time Transportation Engine</span>
          </div>

          <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            Where’s your campus bus? <br />
            <span class="bg-gradient-to-r from-campus-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
              Track it in real time.
            </span>
          </h1>

          <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn ordinary driver smartphones into high-precision GPS beacons. Zero dedicated hardware. Real-time telemetry, dynamic stop ETAs, live bus occupancy, and multi-tenant control.
          </p>

          {/* Quick Demo Credentials Panel */}
          <div class="pt-6">
            <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-left max-w-2xl mx-auto">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-amber-400" />
                  <span class="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Instant Interactive Demo Credentials
                  </span>
                </div>
                <span class="text-[11px] text-slate-500 font-mono">Tenant: Apex Tech (AIT)</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Admin Quick Launch */}
                <button
                  onClick={() => onQuickLogin('admin@apex.edu', 'admin123')}
                  class="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-indigo-950/40 hover:border-indigo-500/50 border border-slate-700/60 transition group text-left"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      ADMIN
                    </span>
                    <ArrowRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div class="font-bold text-xs text-white">Campus Command</div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">admin@apex.edu</div>
                </button>

                {/* Driver Quick Launch */}
                <button
                  onClick={() => onQuickLogin('driver1@apex.edu', 'driver123')}
                  class="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-amber-950/40 hover:border-amber-500/50 border border-slate-700/60 transition group text-left"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      DRIVER
                    </span>
                    <ArrowRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div class="font-bold text-xs text-white">Driver Cockpit</div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">driver1@apex.edu</div>
                </button>

                {/* Student Quick Launch */}
                <button
                  onClick={() => onQuickLogin('student@apex.edu', 'student123')}
                  class="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-campus-950/40 hover:border-campus-500/50 border border-slate-700/60 transition group text-left"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-campus-500/20 text-campus-400 border border-campus-500/30">
                      STUDENT
                    </span>
                    <ArrowRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-campus-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div class="font-bold text-xs text-white">Live Passenger</div>
                  <div class="text-[11px] text-slate-400 font-mono mt-0.5">student@apex.edu</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div class="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Radio class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-sm text-white mb-1">Real-Time First</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Real telemetry in, real-time result out. High-frequency Socket.IO telemetry broadcast with dynamic stop ETAs.
            </p>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Shield class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-sm text-white mb-1">No Fake State</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Zero simulated passengers or fake buses. Clean empty states when buses are parked at the depot.
            </p>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Smartphone class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-sm text-white mb-1">Mobile Driver Cockpit</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              No hardware boxes required. Driver launches app, starts trip, and smartphone broadcasts GPS automatically.
            </p>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <School class="w-5 h-5" />
            </div>
            <h3 class="font-bold text-sm text-white mb-1">Multi-Tenant Isolation</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Strict isolation: colleges manage their own buses, routes, drivers, and alerts without data cross-leakage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer class="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>CampusMove &copy; 2026. Production Smart Campus Transportation Platform.</div>
        <div class="flex items-center gap-6">
          <span>React + Vite</span>
          <span>Node.js + Socket.IO</span>
          <span>PostgreSQL / Neon Ready</span>
        </div>
      </footer>
    </div>
  );
}
