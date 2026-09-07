import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BarChart2,
  BellRing,
  FileText,
  LayoutDashboard,
  LucideCalendarCheck2,
  Settings,
  Sparkles,
  Tag,
  Timer,
  UserPlus,
  UserRound,
  Users,
  WatchIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

type NavItemProps = {
  icon: LucideIcon;
  label: string;
  to: string;
  onNavigate?: () => void;
  /** Route hands off to the separate Agentic Coach app — show an affordance. */
  external?: boolean;
};

const NavItem = ({ icon: Icon, label, to, onNavigate, external = false }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-label={external ? `${label} (opens Coach)` : undefined}
      title={external ? `${label} — opens your AI Coach` : undefined}
      className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-brand-gradient text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {external && (
        <ArrowUpRight
          className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
        />
      )}
    </Link>
  );
};

const GroupLabel = ({ children }: { children: string }) => (
  <div className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
    {children}
  </div>
);

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose();
    }
  }, [location.pathname, mobileOpen, onMobileClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-[100dvh] w-64 border-r border-border bg-card p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] shadow-xl backdrop-blur-xl transition-transform duration-300 md:z-20 md:translate-x-0 md:pt-6 md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WatchIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">Alter Ego</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 p-0" />
            <button
              type="button"
              onClick={onMobileClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex h-[calc(100%-5.5rem)] flex-col gap-1 overflow-y-auto pb-4">
          <div className="mb-5">
            <GroupLabel>Overview</GroupLabel>
            <NavItem icon={Timer} label="Timer" to="/timer" onNavigate={onMobileClose} />
            <NavItem icon={LayoutDashboard} label="Calendar" to="/dashboard" onNavigate={onMobileClose} />
          </div>

          <div className="mb-5">
            <GroupLabel>Planner</GroupLabel>
            <NavItem icon={LucideCalendarCheck2} label="Tasks" to="/tasks" onNavigate={onMobileClose} />
          </div>

          <div className="mb-5">
            <GroupLabel>Coach</GroupLabel>
            <NavItem icon={Sparkles} label="Coach" to="/coach/knowledge" onNavigate={onMobileClose} external />
            <NavItem icon={BarChart2} label="Analytics" to="/coach/analytics" onNavigate={onMobileClose} external />
            <NavItem icon={BellRing} label="Notifications" to="/coach/notifications" onNavigate={onMobileClose} external />
          </div>

          <div className="mb-5">
            <GroupLabel>Manage</GroupLabel>
            <NavItem icon={Users} label="Projects" to="/projects" onNavigate={onMobileClose} />
            <NavItem icon={UserPlus} label="Clients" to="/clients" onNavigate={onMobileClose} />
            <NavItem icon={FileText} label="Invoices" to="/invoices" onNavigate={onMobileClose} />
            <NavItem icon={Tag} label="Tags" to="/tags" onNavigate={onMobileClose} />
          </div>

          <div className="mt-auto space-y-1 border-t border-border pt-4">
            <NavItem icon={UserRound} label="Profile" to="/profile" onNavigate={onMobileClose} />
            <NavItem icon={Settings} label="Settings" to="/settings" onNavigate={onMobileClose} />
            <button
              type="button"
              onClick={() => {
                onMobileClose();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 22q-.825 0-1.413-.588T3 20V4q0-.825.588-1.413T5 2h7v2H5v16h7v2H5Zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5l-5 5Z" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
