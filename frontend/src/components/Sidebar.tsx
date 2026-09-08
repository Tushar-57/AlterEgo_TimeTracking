import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BarChart2,
  BellRing,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
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
  /** Marks routes that hand off to the external Agentic Coach product. */
  external?: boolean;
  onNavigate?: () => void;
};

const NavItem = ({ icon: Icon, label, to, external, onNavigate }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      aria-label={external ? `${label} (opens Coach)` : undefined}
      title={external ? 'Opens the Coach workspace' : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {external ? (
        <ArrowUpRight
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/60'}`}
        />
      ) : null}
    </Link>
  );
};

const NavGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
      {label}
    </div>
    <div className="space-y-0.5">{children}</div>
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
        className={`fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-64 flex-col border-r border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] shadow-xl transition-transform duration-300 md:z-20 md:translate-x-0 md:shadow-none md:pt-4 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <WatchIcon className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground">Alter Ego</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="h-9 w-9 p-0" />
            <button
              type="button"
              onClick={onMobileClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          <NavGroup label="Overview">
            <NavItem icon={Timer} label="Timer" to="/timer" onNavigate={onMobileClose} />
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onNavigate={onMobileClose} />
          </NavGroup>

          <NavGroup label="Plan">
            <NavItem icon={ListChecks} label="Tasks" to="/tasks" onNavigate={onMobileClose} />
          </NavGroup>

          <NavGroup label="Coach">
            <NavItem icon={Sparkles} label="AI Coach" to="/coach/knowledge" external onNavigate={onMobileClose} />
            <NavItem icon={BarChart2} label="Analytics" to="/coach/analytics" external onNavigate={onMobileClose} />
            <NavItem icon={BellRing} label="AI Notifications" to="/coach/notifications" external onNavigate={onMobileClose} />
          </NavGroup>

          <NavGroup label="Manage">
            <NavItem icon={Users} label="Projects" to="/projects" onNavigate={onMobileClose} />
            <NavItem icon={UserPlus} label="Clients" to="/clients" onNavigate={onMobileClose} />
            <NavItem icon={FileText} label="Invoices" to="/invoices" onNavigate={onMobileClose} />
            <NavItem icon={Tag} label="Tags" to="/tags" onNavigate={onMobileClose} />
          </NavGroup>

          <div className="mt-auto space-y-0.5 border-t border-border pt-3">
            <NavItem icon={UserRound} label="Profile" to="/profile" onNavigate={onMobileClose} />
            <NavItem icon={Settings} label="Settings" to="/settings" onNavigate={onMobileClose} />
            <button
              type="button"
              onClick={() => {
                onMobileClose();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 text-left">Log Out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
