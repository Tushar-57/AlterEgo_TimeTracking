import React from 'react';
import type { ComponentType } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  ArrowUp, 
  ArrowDown,
  BarChart2,
  PieChart,
  Activity
} from 'lucide-react';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType 
}: { 
  icon: ComponentType<{ className?: string }>;
  label: string; 
  value: string; 
  change: string;
  changeType: 'positive' | 'negative' 
}) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
      <div className={`flex items-center space-x-1 ${
        changeType === 'positive' ? 'text-green-500' : 'text-red-500'
      }`}>
        {changeType === 'positive' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span className="text-sm">{change}</span>
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-xl sm:text-2xl font-semibold">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

  const Analytics = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-light mb-2">Analytics Dashboard</h1>
          <p className="text-gray-500">Track your productivity and performance metrics</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <StatCard 
            icon={Clock}
            label="Total Hours"
            value="164.2h"
            change="12%"
            changeType="positive"
          />
          <StatCard 
            icon={Calendar}
            label="Productive Days"
            value="18/22"
            change="8%"
            changeType="positive"
          />
          <StatCard 
            icon={Users}
            label="Active Projects"
            value="7"
            change="2"
            changeType="negative"
          />
          <StatCard 
            icon={Activity}
            label="Efficiency Rate"
            value="87%"
            change="5%"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium">Hours by Project</h3>
              </div>
              <select className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm sm:w-auto">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart Placeholder
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-medium">Time Distribution</h3>
              </div>
              <select className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm sm:w-auto">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart Placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;