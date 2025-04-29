import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, Calendar } from 'lucide-react';
import { PlannerData, ChatBubbleProps, Goal, Availability } from '../types/onboarding';

interface PlannerSetupProps {
  handleNext: () => void;
  plannerData: PlannerData;
  setPlannerData: (data: PlannerData) => void;
  setChatHistory: (history: ChatBubbleProps[]) => void;
}

const StepPlanner: React.FC<PlannerSetupProps> = ({
  handleNext,
  plannerData,
  setPlannerData,
  setChatHistory,
}) => {
  const [availability, setAvailability] = useState<Availability>(
    plannerData.availability || {
      workHours: { start: '09:00', end: '17:00' },
      dndHours: { start: '22:00', end: '08:00' },
      checkIn: { preferredTime: '09:00', frequency: 'daily' },
      timezone: 'America/New_York',
    }
  );
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(
    plannerData.notifications.remindersEnabled
  );
  const [calendarSync, setCalendarSync] = useState<boolean>(
    plannerData.integrations?.calendarSync || false
  );
  const [taskManagementSync, setTaskManagementSync] = useState<boolean>(
    plannerData.integrations?.taskManagementSync || false
  );

  const handleAvailabilityChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Availability | string
  ) => {
    const { name, value } = e.target;
    if (field === 'workHours' || field === 'dndHours') {
      const [_, child] = name.split('.');
      setAvailability({
        ...availability,
        [field]: {
          ...availability[field],
          [child]: value,
        },
      });
    } else if (field === 'checkIn') {
      setAvailability({
        ...availability,
        checkIn: {
          ...availability.checkIn,
          [name]: value,
        },
      });
    } else {
      setAvailability({
        ...availability,
        [field]: value,
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newPlannerData: PlannerData = {
      goals: plannerData.goals || [],
      availability,
      notifications: {
        remindersEnabled,
      },
      integrations: {
        calendarSync,
        taskManagementSync,
      },
    };

    setPlannerData(newPlannerData);
    setChatHistory([
      ...plannerData.goals.map((goal: Goal) => ({
        content: `Goal: ${goal.title} (${goal.whyItMatters || 'No reason specified'})`,
        type: 'user',
        sender: 'user',
        isRendered: true,
        timestamp: new Date(),
      } as ChatBubbleProps)),
      {
        content: (
          <div className="space-y-2">
            <p>Planner Setup:</p>
            <p>Work Hours: {availability.workHours.start} to {availability.workHours.end}</p>
            <p>DND Hours: {availability.dndHours.start} to {availability.dndHours.end}</p>
            <p>Check-In: {availability.checkIn.preferredTime} ({availability.checkIn.frequency})</p>
            <p>Timezone: {availability.timezone}</p>
            <p>Reminders: {remindersEnabled ? 'Enabled' : 'Disabled'}</p>
            <p>Calendar Sync: {calendarSync ? 'Enabled' : 'Disabled'}</p>
            <p>Task Management Sync: {taskManagementSync ? 'Enabled' : 'Disabled'}</p>
          </div>
        ),
        type: 'user',
        sender: 'user',
        isRendered: true,
        timestamp: new Date(),
      } as ChatBubbleProps,
    ]);

    handleNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Set Up Your Planner</h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Configure your availability, notifications, and integrations to align with your goals.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-lg">
        {plannerData.goals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Goals</h3>
            <div className="flex flex-wrap gap-2">
              {plannerData.goals.map((goal: Goal) => (
                <span
                  key={goal.id}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {goal.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Availability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block h-4 w-4 mr-1" /> Work Hours Start
              </label>
              <input
                type="time"
                name="workHours.start"
                value={availability.workHours.start}
                onChange={(e) => handleAvailabilityChange(e, 'workHours')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block h-4 w-4 mr-1" /> Work Hours End
              </label>
              <input
                type="time"
                name="workHours.end"
                value={availability.workHours.end}
                onChange={(e) => handleAvailabilityChange(e, 'workHours')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block h-4 w-4 mr-1" /> DND Start
              </label>
              <input
                type="time"
                name="dndHours.start"
                value={availability.dndHours.start}
                onChange={(e) => handleAvailabilityChange(e, 'dndHours')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block h-4 w-4 mr-1" /> DND End
              </label>
              <input
                type="time"
                name="dndHours.end"
                value={availability.dndHours.end}
                onChange={(e) => handleAvailabilityChange(e, 'dndHours')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block h-4 w-4 mr-1" /> Check-In Time
              </label>
              <input
                type="time"
                name="preferredTime"
                value={availability.checkIn.preferredTime}
                onChange={(e) => handleAvailabilityChange(e, 'checkIn')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline-block h-4 w-4 mr-1" /> Check-In Frequency
              </label>
              <select
                name="frequency"
                value={availability.checkIn.frequency}
                onChange={(e) => handleAvailabilityChange(e, 'checkIn')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline-block h-4 w-4 mr-1" /> Timezone
            </label>
            <input
              type="text"
              name="timezone"
              value={availability.timezone}
              onChange={(e) => handleAvailabilityChange(e, 'timezone')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="e.g., America/New_York"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded focus:ring-purple-300"
            />
            <span className="text-sm">
              <Bell className="inline-block h-4 w-4 mr-1" /> Enable Reminders
            </span>
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Integrations</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={calendarSync}
              onChange={(e) => setCalendarSync(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded focus:ring-purple-300"
            />
            <span className="text-sm">
              <Calendar className="inline-block h-4 w-4 mr-1" /> Calendar Sync
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={taskManagementSync}
              onChange={(e) => setTaskManagementSync(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded focus:ring-purple-300"
            />
            <span className="text-sm">Task Management Sync</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Complete Setup
        </button>
      </form>
    </motion.div>
  );
};

export default StepPlanner;