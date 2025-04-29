import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { PlannerData, ChatBubbleProps, Goal } from '../types/onboarding';

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
  const [objectiveTitle, setObjectiveTitle] = useState<string>(plannerData.objectiveTitle || '');
  const [whyItMatters, setWhyItMatters] = useState<string>(plannerData.whyItMatters || '');
  const [startDate, setStartDate] = useState<string>(plannerData.startDate || '');
  const [endDate, setEndDate] = useState<string>(plannerData.endDate || '');
  const [SMART, setSMART] = useState<PlannerData['SMART']>(
    plannerData.SMART || { S: false, M: false, A: false, R: false, T: false }
  );
  const [dailyCheckInTime, setDailyCheckInTime] = useState<string>(plannerData.dailyCheckInTime || '09:00');
  const [weeklyReviewTime, setWeeklyReviewTime] = useState<string>(plannerData.weeklyReviewTime || 'Friday 17:00');
  const [dndStart, setDndStart] = useState<string>(plannerData.dndStart || '22:00');
  const [dndEnd, setDndEnd] = useState<string>(plannerData.dndEnd || '08:00');
  const [workHoursStart, setWorkHoursStart] = useState<string>(plannerData.workHours?.start || '09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState<string>(plannerData.workHours?.end || '17:00');
  const [pomodoroRatio, setPomodoroRatio] = useState<string>(plannerData.pomodoroRatio || '4');

  const handleSMARTChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setSMART((prev) => ({ ...prev, [name]: checked }));
  };

  const handleStringChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(event.target.value);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      alert('End date must be after start date.');
      return;
    }

    const newPlannerData: PlannerData = {
      objectiveTitle,
      whyItMatters,
      startDate,
      endDate,
      SMART,
      dailyCheckInTime,
      weeklyReviewTime,
      dndStart,
      dndEnd,
      workHours: {
        start: workHoursStart,
        end: workHoursEnd,
      },
      pomodoroRatio,
      goals: plannerData.goals || [], // Retain existing goals
    };

    setPlannerData(newPlannerData);
    setChatHistory([
      ...plannerData.goals.map((goal: Goal) => ({
        content: `Goal: ${goal.title}`,
        type: 'user',
        sender: 'user',
        isRendered: true,
        timestamp: new Date(),
      } as ChatBubbleProps)),
      {
        content: (
          <div className="space-y-2">
            <p>Planner Setup:</p>
            <p>Objective: {objectiveTitle}</p>
            <p>Why it matters: {whyItMatters}</p>
            <p>
              Dates: {startDate || 'Not set'} to {endDate || 'Not set'}
            </p>
            <p>
              SMART:{' '}
              {Object.entries(SMART)
                .filter(([_, v]) => v)
                .map(([k]) => ({
                  S: 'Specific',
                  M: 'Measurable',
                  A: 'Achievable',
                  R: 'Relevant',
                  T: 'Time-bound',
                }[k]))
                .join(', ') || 'none'}
            </p>
            <p>Daily Check-In: {dailyCheckInTime}</p>
            <p>Weekly Review: {weeklyReviewTime}</p>
            <p>DND: {dndStart}-{dndEnd}</p>
            <p>Work Hours: {workHoursStart}-{workHoursEnd}</p>
            <p>Pomodoro Ratio: {pomodoroRatio}</p>
          </div>
        ),
        type: 'user',
        sender: 'user',
        isRendered: true,
        timestamp: new Date(),
      } as unknown as ChatBubbleProps,
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
        Define your objectives and schedule to achieve your goals effectively.
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

        <div>
          <label htmlFor="objectiveTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Objective Title
          </label>
          <input
            type="text"
            name="objectiveTitle"
            id="objectiveTitle"
            value={objectiveTitle}
            onChange={(e) => handleStringChange(e, setObjectiveTitle)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>

        <div>
          <label htmlFor="whyItMatters" className="block text-sm font-medium text-gray-700 mb-2">
            Why It Matters
          </label>
          <textarea
            name="whyItMatters"
            id="whyItMatters"
            value={whyItMatters}
            onChange={(e) => handleStringChange(e, setWhyItMatters)}
            className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={startDate}
              onChange={(e) => handleStringChange(e, setStartDate)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={endDate}
              onChange={(e) => handleStringChange(e, setEndDate)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">SMART Goals</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['S', 'M', 'A', 'R', 'T'].map((letter) => (
              <label key={letter} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name={letter}
                  checked={SMART[letter as keyof typeof SMART]}
                  onChange={handleSMARTChange}
                  className="h-4 w-4 text-purple-600 rounded focus:ring-purple-300"
                />
                <span className="text-sm">
                  {{
                    S: 'Specific',
                    M: 'Measurable',
                    A: 'Achievable',
                    R: 'Relevant',
                    T: 'Time-bound',
                  }[letter]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dailyCheckIn" className="block text-sm font-medium text-gray-700 mb-2">
              Daily Check-In Time
            </label>
            <input
              type="time"
              name="dailyCheckIn"
              id="dailyCheckIn"
              value={dailyCheckInTime}
              onChange={(e) => handleStringChange(e, setDailyCheckInTime)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label htmlFor="weeklyReview" className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Review Time
            </label>
            <input
              type="text"
              name="weeklyReview"
              id="weeklyReview"
              value={weeklyReviewTime}
              onChange={(e) => handleStringChange(e, setWeeklyReviewTime)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dndStart" className="block text-sm font-medium text-gray-700 mb-2">
              Do Not Disturb Start
            </label>
            <input
              type="time"
              name="dndStart"
              id="dndStart"
              value={dndStart}
              onChange={(e) => handleStringChange(e, setDndStart)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label htmlFor="dndEnd" className="block text-sm font-medium text-gray-700 mb-2">
              Do Not Disturb End
            </label>
            <input
              type="time"
              name="dndEnd"
              id="dndEnd"
              value={dndEnd}
              onChange={(e) => handleStringChange(e, setDndEnd)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workHoursStart" className="block text-sm font-medium text-gray-700 mb-2">
              Work Hours Start
            </label>
            <input
              type="time"
              name="workHoursStart"
              id="workHoursStart"
              value={workHoursStart}
              onChange={(e) => handleStringChange(e, setWorkHoursStart)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label htmlFor="workHoursEnd" className="block text-sm font-medium text-gray-700 mb-2">
              Work Hours End
            </label>
            <input
              type="time"
              name="workHoursEnd"
              id="workHoursEnd"
              value={workHoursEnd}
              onChange={(e) => handleStringChange(e, setWorkHoursEnd)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pomodoroRatio" className="block text-sm font-medium text-gray-700 mb-2">
            Pomodoro Ratio (e.g., 25/5)
          </label>
          <input
            type="text"
            name="pomodoroRatio"
            id="pomodoroRatio"
            value={pomodoroRatio}
            onChange={(e) => handleStringChange(e, setPomodoroRatio)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="e.g., 25/5"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Next
        </button>
      </form>
    </motion.div>
  );
};

export default StepPlanner;