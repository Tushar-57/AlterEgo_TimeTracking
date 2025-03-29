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
  CalendarRangeIcon
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, to }: { icon: any; label: string; to: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-black text-white' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-light">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-8">
        <WatchIcon className="w-8 h-8" />
        {/* <NavItem icon={WatchIcon} label='Time Tracker' to='/'/> */}
        <span className="text-xl font-light">Alter Ego</span>
      </div>

      <div className="space-y-1">
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 mb-3 px-4">TRACK</div>
          <NavItem icon={Timer} label="Timer" to="/" />
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

        <div className="absolute bottom-6 left-6 right-6">
          <NavItem icon={Settings} label="Settings" to="/settings" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;