import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import { Brain, Clock, LayoutDashboard, ListChecks, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TimeTracker from './components/TimeTracker/TimeTracker';
import LoginClassic from './components/LoginFunctionality';
import SignupClassic from './components/SignupFunctionality';
import EmailVerificationPage from './components/EmailVerificationPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProjectPage from './components/Project/ProjectPage';
import TaskManager from './components/TaskManager';
import { AuthProvider, useAuth, LoadingSpinner } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { UserTagPage } from './components/UserTags';
import { Toaster } from './components/ui/toaster';
import ChatOnboarding from './components/Onboarding/ChatOnboarding';
import CoachWorkspace from './components/Integration/CoachWorkspace';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';
import ConnectedPlaceholderPage from './components/Workspace/ConnectedPlaceholderPage';
import CheckupPrompt from './components/checkups/CheckupPrompt';
import { ChatProvider } from './components/AIChat/ChatContext';
import FullScreenChat from './components/AIChat/FullScreenChat';
import ChatToggleButton from './components/AIChat/ChatToggleButton';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { getStoredAuthToken } from './utils/auth';
import { useNudges } from './hooks/useNudges';

const App = () => (
  <Router>
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginClassic />} />
          <Route path="/signup" element={<SignupClassic />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<ProtectedOnboarding />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
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
    return <Navigate to="/dashboard" replace />;
  }

  return <ChatOnboarding onComplete={() => setOnboardingCompleted(true)} />;
};

const MOBILE_TABS = [
  { label: 'Timer', to: '/timer', icon: Clock },
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', to: '/tasks', icon: ListChecks },
  { label: 'Coach', to: '/coach/chat', icon: Brain },
];

const ProtectedRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeMobileTab = useMemo(
    () => MOBILE_TABS.find((tab) => location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`)),
    [location.pathname]
  );

  // The day's three check-ins, from the agentic service. They arrive here as
  // well as in the coach app so that having this tab open — which is the tab
  // people actually leave open — is enough to be reached.
  useNudges({
    enabled: isAuthenticated && Boolean(user?.onboardingCompleted),
    onOpen: () => navigate('/coach/chat'),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (!loading && isAuthenticated && user && !user.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Trigger agentic sync on login to populate knowledge base (throttled to prevent duplicates)
  useEffect(() => {
    if (isAuthenticated && user?.onboardingCompleted) {
      const token = getStoredAuthToken();
      if (!token) return;

      // Throttle sync to prevent repeated calls on refresh
      const APP_SYNC_MARKER = 'alterego-app-sync-ts';
      const APP_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum between syncs

      try {
        const now = Date.now();
        const lastSync = window.localStorage.getItem(APP_SYNC_MARKER);
        const lastSyncTime = lastSync ? Number.parseInt(lastSync, 10) : 0;

        if (Number.isFinite(lastSyncTime) && lastSyncTime > 0 && now - lastSyncTime < APP_SYNC_INTERVAL_MS) {
          // Skip sync - ran too recently
          return;
        }

        window.localStorage.setItem(APP_SYNC_MARKER, String(now));
      } catch {
        // Continue even if localStorage fails
      }

      // Trigger onboarding snapshot sync
      fetch('/api/onboarding/syncAgenticSnapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      }).catch(() => {
        // Silent fail - sync is best-effort
      });

      // Trigger time entries backfill
      fetch('/api/timers/sync/agentic/backfill?limit=100', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      }).catch(() => {
        // Silent fail - backfill is best-effort
      });
    }
  }, [isAuthenticated, user]);

  // Safe scroll lock using ref-counted hook
  useBodyScrollLock(mobileNavOpen);

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <ChatProvider>
      <div className="relative flex min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
        <div className="fixed left-0 right-0 top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between border-b border-border bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Alter Ego</p>
            <p className="text-sm font-semibold text-foreground">{activeMobileTab?.label ?? 'Workspace'}</p>
          </div>
          <ThemeToggle className="h-10 w-10 p-0" />
        </div>

        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <main className="ml-0 min-h-0 min-w-0 flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))] md:ml-64 md:pb-0 md:pt-0">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/timer" element={<TimeTracker />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/analytics" element={<Navigate to="/coach/analytics" replace />} />
            <Route path="/notifications" element={<Navigate to="/coach/notifications" replace />} />
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
                      to: '/timer',
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
                      to: '/timer',
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* "Coach" now means the coach. It redirected to the Memory tab,
                so every entry point labelled Coach opened something else. */}
            <Route path="/coach" element={<Navigate to="/coach/chat" replace />} />
            <Route
              path="/coach/chat"
              element={<CoachWorkspace autoLaunch targetView="chat" returnPath="/dashboard" />}
            />
            <Route
              path="/coach/knowledge"
              element={<CoachWorkspace autoLaunch targetView="knowledge" returnPath="/dashboard" />}
            />
            <Route
              path="/coach/analytics"
              element={<CoachWorkspace autoLaunch targetView="analytics" returnPath="/dashboard" />}
            />
            <Route
              path="/coach/notifications"
              element={<CoachWorkspace autoLaunch targetView="notifications" returnPath="/dashboard" />}
            />
            <Route path="/coach/launcher" element={<CoachWorkspace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden">
          {MOBILE_TABS.map((tab) => {
            const isActive = location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
            return (
              <button
                key={tab.to}
                type="button"
                onClick={() => {
                  navigate(tab.to);
                  setMobileNavOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-4 w-4" />
            More
          </button>
        </nav>

        <CheckupPrompt />
        <FullScreenChat />
        <ChatToggleButton />
      </div>
    </ChatProvider>
  );
};

export default App;