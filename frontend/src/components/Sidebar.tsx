import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { 
  Timer, 
  BarChart2, 
  Users, 
  FileText, 
  Settings, 
  Tag,
  Clock,
  UserPlus,
  LucideCalendarCheck2,
  WatchIcon,
  LayoutDashboard,
  UserRound,
  BellRing,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const NavItem = ({
  icon: Icon,
  label,
  to,
  onNavigate,
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to}
      onClick={onNavigate}
      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
        isActive 
          ? 'bg-gradient-to-r from-teal-700 via-cyan-600 to-amber-500 text-white shadow-md'
          : 'text-slate-600 hover:bg-teal-50 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      <span className="font-light group-hover:font-medium">{label}</span>
    </Link>
  );
};

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
        className={`fixed left-0 top-0 z-50 h-[100dvh] w-64 border-r border-teal-200/60 bg-white/95 p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] shadow-xl backdrop-blur-xl transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900/95 md:z-20 md:translate-x-0 md:shadow-none md:pt-6 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <WatchIcon className="h-8 w-8 text-teal-700 dark:text-cyan-300" />
          <span className="text-xl font-light text-slate-900 dark:text-slate-100">Alter Ego</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-9 w-9 p-0" />
          <button
            type="button"
            onClick={onMobileClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100%-5.5rem)] flex-col space-y-1 overflow-y-auto pb-4">
        <div className="mb-6">
        <div className="mb-3 px-4 text-xs font-medium tracking-[0.14em] text-teal-700 dark:text-cyan-300">OVERVIEW</div>
          <NavItem icon={Timer} label="Timer" to="/timer" onNavigate={onMobileClose} />
          <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onNavigate={onMobileClose} />
        </div>
        <div className="mb-6">
          <div className="mb-3 px-4 text-xs font-medium tracking-[0.14em] text-teal-700 dark:text-cyan-300">PLANNER</div>
          <NavItem icon={LucideCalendarCheck2} label="Tasks" to="/tasks" onNavigate={onMobileClose} />
          <NavItem icon={Clock} label="AI Coach" to="/coach/knowledge" onNavigate={onMobileClose} />
        </div>

        <div className="mb-6">
          <div className="mb-3 px-4 text-xs font-medium tracking-[0.14em] text-teal-700 dark:text-cyan-300">ANALYZE</div>
          <NavItem icon={BarChart2} label="Analytics" to="/coach/analytics" onNavigate={onMobileClose} />
          <NavItem icon={BellRing} label="AI Notifications" to="/coach/notifications" onNavigate={onMobileClose} />
        </div>

        <div className="mb-6">
          <div className="mb-3 px-4 text-xs font-medium tracking-[0.14em] text-teal-700 dark:text-cyan-300">MANAGE</div>
          <NavItem icon={Users} label="Projects" to="/projects" onNavigate={onMobileClose} />
          <NavItem icon={UserPlus} label="Clients" to="/clients" onNavigate={onMobileClose} />
          <NavItem icon={FileText} label="Invoices" to="/invoices" onNavigate={onMobileClose} />
          <NavItem icon={Tag} label="Tags" to="/tags" onNavigate={onMobileClose} />
        </div>

        <div className="mt-auto space-y-1 border-t border-teal-200/60 pt-4 dark:border-slate-700">
          <NavItem icon={UserRound} label="Profile" to="/profile" onNavigate={onMobileClose} />
          <NavItem icon={Settings} label="Settings" to="/settings" onNavigate={onMobileClose} />
          <div
            onClick={() => {
              onMobileClose();
              logout();
            }}
            className="flex cursor-pointer items-center space-x-3 rounded-xl px-4 py-3 text-slate-600 transition-all duration-200 hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 22q-.825 0-1.413-.588T3 20V4q0-.825.588-1.413T5 2h7v2H5v16h7v2H5Zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5l-5 5Z"/>
            </svg>
            <span className="font-light">Log Out</span>
          </div>
        </div>
      </div>

    </aside>
    </>
  );
};

export default Sidebar;

// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import {
//   Timer,
//   BarChart2,
//   Users,
//   FileText,
//   Settings,
//   Tag,
//   Clock,
//   PieChart,
//   UserPlus,
//   LucideCalendarCheck2,
//   WatchIcon,
//   CalendarRangeIcon,
//   LayoutDashboard,
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const NavItem = ({ icon: Icon, label, to }: { icon: any; label: string; to: string }) => {
//   const location = useLocation();
//   const isActive = location.pathname === to;

//   return (
//     <Link
//       to={to}
//       className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-inter ${
//         isActive
//           ? 'bg-[#A8D5BA] text-white shadow-md'
//           : 'text-[#A3BFFA] hover:bg-[#F8C8DC]/20 hover:shadow-sm'
//       }`}
//     >
//       <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
//       <span className="group-hover:font-medium">{label}</span>
//     </Link>
//   );
// };

// const Sidebar = () => {
//   const { logout } = useAuth();
//   return (
//     <div className="w-64 h-screen fixed left-0 top-0 bg-[#FAF9F6] dark:bg-[#2D2D2D] border-r border-[#F8C8DC]/30 p-6">
//       <div className="flex items-center space-x-3 mb-8">
//         <WatchIcon className="w-8 h-8 text-[#FF6B6B]" />
//         <span className="text-xl font-light text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Alter Ego</span>
//       </div>

//       <div className="space-y-1">
//         <div className="mb-6">
//           <div className="text-xs font-medium text-[#A3BFFA] mb-3 px-4 font-inter">OVERVIEW</div>
//           <NavItem icon={Timer} label="Timer" to="/" />
//           <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
//         </div>
//         <div className="mb-6">
//           <div className="text-xs font-medium text-[#A3BFFA] mb-3 px-4 font-inter">PLANNER</div>
//           <NavItem icon={LucideCalendarCheck2} label="Tasks" to="/tasks" />
//           <NavItem icon={CalendarRangeIcon} label="AI Planner" to="/planner" />
//         </div>

//         <div className="mb-6">
//           <div className="text-xs font-medium text-[#A3BFFA] mb-3 px-4 font-inter">ANALYZE</div>
//           <NavItem icon={BarChart2} label="Analytics" to="/analytics" />
//           <NavItem icon={PieChart} label="Reports" to="/reports" />
//         </div>

//         <div className="mb-6">
//           <div className="text-xs font-medium text-[#A3BFFA] mb-3 px-4 font-inter">MANAGE</div>
//           <NavItem icon={Users} label="Projects" to="/projects" />
//           <NavItem icon={UserPlus} label="Clients" to="/clients" />
//           <NavItem icon={FileText} label="Invoices" to="/invoices" />
//           <NavItem icon={Tag} label="Tags" to="/tags" />
//         </div>

//         <div className="absolute bottom-4 left-6 right-6 space-y-1">
//           <NavItem icon={Settings} label="Settings" to="/settings" />
//           <div
//             onClick={logout}
//             className="flex items-center space-x-3 px-4 py-3 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 rounded-lg transition-all duration-200 cursor-pointer font-inter"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-5 w-5"
//               viewBox="0 0 24 24"
//               fill="currentColor"
//             >
//               <path d="M5 22q-.825 0-1.413-.588T3 20V4q0-.825.588-1.413T5 2h7v2H5v16h7v2H5Zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5l-5 5Z" />
//             </svg>
//             <span>Log Out</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;