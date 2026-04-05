import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BarChart2, Clock, LayoutDashboard, ListChecks, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TimeTracker from './components/TimeTracker/TimeTracker';
import Analytics from './components/Analytics';
import LoginClassic from './components/LoginFunctionality';
import SignupClassic from './components/SignupFunctionality';
import EmailVerificationPage from './components/EmailVerificationPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProjectPage from './components/Project/ProjectPage';
import TaskManager from './components/TaskManager';
import { AuthProvider, useAuth, LoadingSpinner } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { UserTagPage } from './components/UserTags';
import { ToastProvider } from './components/ui/toast';
import { ToastViewport } from './components/ui/toast';
import ChatOnboarding from './components/Onboarding/ChatOnboarding';
import CoachWorkspace from './components/Integration/CoachWorkspace';
import ProfilePage from './components/Profile/ProfilePage';
import ConnectedPlaceholderPage from './components/Workspace/ConnectedPlaceholderPage';
import { ChatProvider } from './components/AIChat/ChatContext';
import FullScreenChat from './components/AIChat/FullScreenChat';
import ChatToggleButton from './components/AIChat/ChatToggleButton';

const App = () => (
  <Router>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginClassic />} />
          <Route path="/signup" element={<SignupClassic />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<ProtectedOnboarding />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <ToastViewport className="[--viewport-padding:_25px] fixed bottom-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[25px] w-[390px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
      </ToastProvider>
    </AuthProvider>
  </Router>
);

const ProtectedOnboarding = () => {
  const { isAuthenticated, user, loading, setOnboardingCompleted } = useAuth();
  const location = useLocation();
  const onboardingRedoRequested = new URLSearchParams(location.search).get('redo') === 'true';

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboardingCompleted && !onboardingRedoRequested) {
    return <Navigate to="/" replace />;
  }

  return <ChatOnboarding onComplete={() => setOnboardingCompleted(true)} />;
};

const ProtectedRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const mobileTabs = [
    { label: 'Timer', to: '/', icon: Clock },
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', to: '/tasks', icon: ListChecks },
    { label: 'Analytics', to: '/analytics', icon: BarChart2 },
    { label: 'Coach', to: '/coach', icon: Clock },
  ];

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
        <main className="min-w-0 flex-1 ml-0 pb-20 pt-16 md:ml-64 md:pb-0 md:pt-0">
          <Routes>
            <Route index element={<TimeTracker />} />
            <Route path="/" element={<TimeTracker />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route
              path="/reports"
              element={
                <ConnectedPlaceholderPage
                  title="Reports Workspace"
                  subtitle="Build richer weekly and monthly reporting habits by connecting your analytics and scheduled work in one place."
                  badge="Reporting"
                  quickLinks={[
                    {
                      label: 'Analytics Dashboard',
                      to: '/analytics',
                      description: 'Review trends and performance snapshots.',
                    },
                    {
                      label: 'Calendar Dashboard',
                      to: '/dashboard',
                      description: 'Inspect scheduled entries across the week.',
                    },
                    {
                      label: 'Timer',
                      to: '/',
                      description: 'Capture time blocks that feed reports.',
                    },
                    {
                      label: 'Project Space',
                      to: '/projects',
                      description: 'Group report cuts by project/client.',
                    },
                  ]}
                  highlights={[
                    'Use this section to curate weekly review stories before exporting to clients or your team.',
                    'Cross-check project workload balance against actual tracked time.',
                    'Keep recurring reporting habits in sync with your planner and onboarding cadence.',
                  ]}
                />
              }
            />
            <Route path="/projects" element={<ProjectPage />} />
            <Route
              path="/clients"
              element={
                <ConnectedPlaceholderPage
                  title="Clients Workspace"
                  subtitle="Maintain your client roster and map each account to the projects and tags you are actively tracking."
                  badge="Client Ops"
                  quickLinks={[
                    {
                      label: 'Projects',
                      to: '/projects',
                      description: 'Assign and organize client-facing projects.',
                    },
                    {
                      label: 'Tags',
                      to: '/tags',
                      description: 'Standardize labels used across client time entries.',
                    },
                    {
                      label: 'Task Manager',
                      to: '/tasks',
                      description: 'Track delivery tasks against each client workflow.',
                    },
                    {
                      label: 'Invoices',
                      to: '/invoices',
                      description: 'Prepare next billing view from organized time logs.',
                    },
                  ]}
                  highlights={[
                    'Track account context before switching to billing and reporting.',
                    'Define clear naming conventions so projects, tags, and invoices stay aligned.',
                    'Use client links to quickly jump between planning and execution views.',
                  ]}
                />
              }
            />
            <Route
              path="/invoices"
              element={
                <ConnectedPlaceholderPage
                  title="Invoices Workspace"
                  subtitle="Prepare invoice-ready context by combining billable entries, project color coding, and client grouping."
                  badge="Billing"
                  quickLinks={[
                    {
                      label: 'Projects',
                      to: '/projects',
                      description: 'Verify billable work grouped by project.',
                    },
                    {
                      label: 'Clients',
                      to: '/clients',
                      description: 'Review client context before issuing invoices.',
                    },
                    {
                      label: 'Reports',
                      to: '/reports',
                      description: 'Cross-check summaries before billing.',
                    },
                    {
                      label: 'Timer Entries',
                      to: '/',
                      description: 'Capture missing billable sessions quickly.',
                    },
                  ]}
                  highlights={[
                    'Use this area to align billing prep with tracked output and client expectations.',
                    'Reconcile outlier entries before creating invoice narratives.',
                    'Maintain a clear path from execution logs to invoice decisions.',
                  ]}
                />
              }
            />
            <Route path="/tags" element={<UserTagPage />} />
            <Route
              path="/settings"
              element={
                <ConnectedPlaceholderPage
                  title="Settings Hub"
                  subtitle="Tune your account experience, onboarding profile, and assistant behavior from one coordinated place."
                  badge="Configuration"
                  quickLinks={[
                    {
                      label: 'Profile',
                      to: '/profile',
                      description: 'Update onboarding details or redo onboarding.',
                    },
                    {
                      label: 'AI Coach',
                      to: '/coach',
                      description: 'Continue context-aware planning with your mentor.',
                    },
                    {
                      label: 'Tags',
                      to: '/tags',
                      description: 'Refine the taxonomy used across your entries.',
                    },
                    {
                      label: 'Projects',
                      to: '/projects',
                      description: 'Adjust your project map and client grouping.',
                    },
                  ]}
                  highlights={[
                    'Settings are intentionally linked so profile updates flow into planner and coach behavior.',
                    'Use profile actions to keep onboarding context current as your routine evolves.',
                    'Treat settings as a control center instead of isolated one-off pages.',
                  ]}
                />
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/coach" element={<CoachWorkspace />} />
            <Route path="/dashboard" element={<Dashboard isAuthenticated={isAuthenticated} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white/95 px-1 py-1 backdrop-blur md:hidden">
          {mobileTabs.map((tab) => {
            const isActive = tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to);
            return (
              <button
                key={tab.to}
                type="button"
                onClick={() => {
                  navigate(tab.to);
                  setMobileNavOpen(false);
                }}
                className={`flex flex-col items-center justify-center rounded-lg py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="mb-1 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <FullScreenChat />
        <ChatToggleButton />
      </div>
    </ChatProvider>
  );
};

export default App;