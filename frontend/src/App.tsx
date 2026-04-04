import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TimeTracker from './components/TimeTracker/TimeTracker';
import Analytics from './components/Analytics';
import LoginClassic from './components/LoginFunctionality';
import SignupClassic from './components/SignupFunctionality';
import ProjectPage from './components/Project/ProjectPage';
import TaskManager from './components/TaskManager';
import { AuthProvider, useAuth, LoadingSpinner } from './context/AuthContext';
import { PlannerForm } from './components/Planner/Planner';
import { Dashboard } from './components/Dashboard';
import { UserTagPage } from './components/UserTags';
import { ToastProvider } from './components/ui/toast';
import { ToastViewport } from './components/ui/toast';
import ChatOnboarding from './components/Onboarding/ChatOnboarding';
import CoachWorkspace from './components/Integration/CoachWorkspace';
import { ChatProvider } from './components/AIChat/ChatContext';
import FullScreenChat from './components/AIChat/FullScreenChat';
import ChatToggleButton from './components/AIChat/ChatToggleButton';

const Reports = () => <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">Reports Page</div>;
const Clients = () => <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">Clients Page</div>;
const Invoices = () => <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">Invoices Page</div>;
const Settings = () => <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">Settings Page</div>;

const App = () => (
  <Router>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginClassic />} />
          <Route path="/signup" element={<SignupClassic />} />
          <Route path="/onboarding" element={<ProtectedOnboarding />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <ToastViewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[25px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </ToastProvider>
    </AuthProvider>
  </Router>
);

const ProtectedOnboarding = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  return <ChatOnboarding onComplete={() => console.log('Onboarding complete!')} />;
};

const ProtectedRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (!loading && isAuthenticated && user && !user.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
  }, [mobileNavOpen]);

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <ChatProvider>
      <div className="relative flex min-h-screen overflow-x-hidden bg-gray-50">
        <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900">Alter Ego</span>
          <div className="w-10" aria-hidden="true" />
        </div>

        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="min-w-0 flex-1 ml-0 pt-16 md:ml-64 md:pt-0">
          <Routes>
            <Route index element={<TimeTracker />} />
            <Route path="/" element={<TimeTracker />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/projects" element={<ProjectPage />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/tags" element={<UserTagPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/planner" element={<PlannerForm />} />
            <Route path="/coach" element={<CoachWorkspace />} />
            <Route path="/dashboard" element={<Dashboard isAuthenticated={isAuthenticated} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <FullScreenChat />
        <ChatToggleButton />
      </div>
    </ChatProvider>
  );
};

export default App;