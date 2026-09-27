import React from 'react';
import { Bus, Wifi, WifiOff, LogOut, Shield, User, Navigation, ChevronRight, School } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function Navbar({ currentView, onViewChange }) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header class="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & College Tenant */}
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center shadow-lg shadow-campus-500/20">
            <Bus class="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CampusMove
              </span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-campus-500/20 text-campus-400 border border-campus-500/30">
                Live Transit
              </span>
            </div>
            {user?.college && (
              <div class="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <School class="w-3.5 h-3.5 text-slate-400" />
                <span>{user.college.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Switcher Tabs (Accessible according to role) */}
        <nav class="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <button
            onClick={() => onViewChange('student')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              currentView === 'student'
                ? 'bg-campus-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Navigation class="w-3.5 h-3.5" />
            <span>Student Tracker</span>
          </button>

          {(user?.role === 'DRIVER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => onViewChange('driver')}
              class={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                currentView === 'driver'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Bus class="w-3.5 h-3.5" />
              <span>Driver Cockpit</span>
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => onViewChange('admin')}
              class={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Shield class="w-3.5 h-3.5" />
              <span>Admin Radar</span>
            </button>
          )}
        </nav>

        {/* Real-Time Connectivity Pill & Profile */}
        <div class="flex items-center gap-3">
          {/* Socket.IO Heartbeat Indicator */}
          <div
            class={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title={isConnected ? 'Connected to live real-time server' : 'Reconnecting to real-time server...'}
          >
            {isConnected ? (
              <>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="hidden sm:inline">Telemetry Active</span>
              </>
            ) : (
              <>
                <WifiOff class="w-3 h-3 text-rose-400" />
                <span class="hidden sm:inline">Reconnecting</span>
              </>
            )}
          </div>

          {/* User profile dropdown / signout */}
          <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div class="hidden lg:block text-right">
              <div class="text-xs font-bold text-white">{user?.name}</div>
              <div class="text-[10px] text-slate-400 font-mono uppercase">{user?.role}</div>
            </div>

            <button
              onClick={logout}
              class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 transition"
              title="Sign Out"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div class="md:hidden border-t border-slate-800/80 px-4 py-2 flex items-center justify-around bg-slate-900/90 text-xs">
        <button
          onClick={() => onViewChange('student')}
          class={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-semibold ${
            currentView === 'student' ? 'text-campus-400 bg-campus-500/10' : 'text-slate-400'
          }`}
        >
          <Navigation class="w-3.5 h-3.5" />
          <span>Student</span>
        </button>

        {(user?.role === 'DRIVER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => onViewChange('driver')}
            class={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-semibold ${
              currentView === 'driver' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
            }`}
          >
            <Bus class="w-3.5 h-3.5" />
            <span>Driver</span>
          </button>
        )}

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => onViewChange('admin')}
            class={`flex items-center gap-1 py-1 px-2.5 rounded-lg font-semibold ${
              currentView === 'admin' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
            }`}
          >
            <Shield class="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
}
