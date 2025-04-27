import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
// import { ToastViewport } from '@radix-ui/react-toast';
import { ToastViewport } from './components/ui/toast';
import MainRunner from './components/Onboarding/MainRunner';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import MentorSelection from './components/Onboarding/Mentor/MentorSelection';
import { MentorArchetype } from './components/Onboarding/types/coaching';

const Reports = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Reports Page</div>;
const Projects = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Projects Page</div>;
const Clients = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Clients Page</div>;
const Invoices = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Invoices Page</div>;
const Tags = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tags Page</div>;
const Settings = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Settings Page</div>;

const App = () => (
  <Router>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginClassic />} />
          <Route path="/signup" element={<SignupClassic />} />
          <Route path="/onboarding/*" element={<OnboardingFlow />} />

        {/* Mentor Selection Flow */}
        <Route
          path="/mentor"
          element={<MentorSelection onSelect={function (archetype: MentorArchetype): void {
            throw new Error('Function not implemented.');
          } } />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <ToastViewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[25px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </ToastProvider>
    </AuthProvider>
  </Router>
);

const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <LoadingSpinner />;

  return isAuthenticated ? (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64">
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default App;