import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentView from './pages/StudentView';
import DriverView from './pages/DriverView';
import AdminDashboard from './pages/AdminDashboard';
import { Bus } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, loading, login } = useAuth();
  
  // Public auth view navigation: 'landing', 'login', 'register'
  const [authView, setAuthView] = useState('landing');

  // Authenticated view navigation: 'student', 'driver', 'admin'
  const [activeView, setActiveView] = useState(null);

  // Set default active view when user logs in
  React.useEffect(() => {
    if (user && !activeView) {
      if (user.role === 'ADMIN') setActiveView('admin');
      else if (user.role === 'DRIVER') setActiveView('driver');
      else setActiveView('student');
    }
  }, [user]);

  if (loading) {
    return (
      <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center animate-pulse shadow-xl shadow-campus-500/20 mb-4">
          <Bus class="w-6 h-6 text-white" />
        </div>
        <div class="text-sm font-extrabold tracking-tight">Initializing CampusMove...</div>
        <div class="text-xs text-slate-500 mt-1">Connecting to telemetry network</div>
      </div>
    );
  }

  // Not authenticated: render Landing / Login / Register
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onBack={() => setAuthView('landing')}
          onGoToRegister={() => setAuthView('register')}
        />
      );
    }

    if (authView === 'register') {
      return (
        <RegisterPage
          onBack={() => setAuthView('landing')}
          onGoToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LandingPage
        onGoToLogin={() => setAuthView('login')}
        onGoToRegister={() => setAuthView('register')}
        onQuickLogin={async (email, pass) => {
          try {
            await login(email, pass);
          } catch (e) {
            console.error('Quick login error:', e);
            setAuthView('login');
          }
        }}
      />
    );
  }

  // Authenticated: Render Navbar + Active View
  const currentView = activeView || (user.role === 'ADMIN' ? 'admin' : user.role === 'DRIVER' ? 'driver' : 'student');

  return (
    <div class="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar currentView={currentView} onViewChange={setActiveView} />

      <main class="flex-1 pb-12">
        {currentView === 'student' && <StudentView />}
        {currentView === 'driver' && <DriverView />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}
