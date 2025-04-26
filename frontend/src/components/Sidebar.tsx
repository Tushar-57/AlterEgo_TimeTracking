import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Timer, 
  BarChart2, 
  Users, 
  FileText, 
  Settings, 
  Tag,
  Clock,
  PieChart,
  UserPlus,
  LucideCalendarCheck2,
  WatchIcon,
  CalendarRangeIcon, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ icon: Icon, label, to }: { icon: any; label: string; to: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
        isActive 
          ? 'bg-black text-white shadow-md' 
          : 'text-gray-500 hover:bg-gray-100 hover:shadow-sm'
      }`}
    >
      <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      <span className="font-light group-hover:font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-8">
        <WatchIcon className="w-8 h-8" />
        {/* <NavItem icon={WatchIcon} label='Time Tracker' to='/'/> */}
        <span className="text-xl font-light">Alter Ego</span>
      </div>

      <div className="space-y-1">
        <div className="mb-6">
        <div className="text-xs font-medium text-gray-400 mb-3 px-4">OVERVIEW</div>
          <NavItem icon={Timer} label="Timer" to="/" />
          <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <div className="mb-6">
          </div>
        </div>
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 mb-3 px-4">PLANNER</div>
          <NavItem icon={LucideCalendarCheck2} label="Tasks" to="/tasks" />
          <NavItem icon={CalendarRangeIcon} label="AI Planner" to="/planner" />
          <br/>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 mb-3 px-4">ANALYZE</div>
          <NavItem icon={BarChart2} label="Analytics" to="/analytics" />
          <NavItem icon={PieChart} label="Reports" to="/reports" />
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 mb-3 px-4">MANAGE</div>
          <NavItem icon={Users} label="Projects" to="/projects" />
          <NavItem icon={UserPlus} label="Clients" to="/clients" />
          <NavItem icon={FileText} label="Invoices" to="/invoices" />
          <NavItem icon={Tag} label="Tags" to="/tags" />
        </div>

        <div className="absolute bottom-4 left-6 right-6 space-y-1">
          <NavItem icon={Settings} label="Settings" to="/settings" />
          <div
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
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

    </div>
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