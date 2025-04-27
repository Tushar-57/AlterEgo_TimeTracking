import React, { useState, ChangeEvent, FormEvent, Dispatch, SetStateAction } from 'react';
import { ChatBubbleProps, PlannerData, PlannerSetupProps } from './types/onboarding';

const StepPlanner: React.FC<PlannerSetupProps> = ({
  handleNext,
  plannerData,
  setPlannerData,
  setChatHistory
}) => {
  // State initialization
  const [objectiveTitle, setObjectiveTitle] = useState<string>(plannerData.objectiveTitle || '');
  const [whyItMatters, setWhyItMatters] = useState<string>(plannerData.whyItMatters || '');
  const [startDate, setStartDate] = useState<string>(plannerData.startDate || '');
  const [endDate, setEndDate] = useState<string>(plannerData.endDate || '');
  const [SMART, setSMART] = useState<PlannerData['SMART']>(plannerData.SMART || { 
    S: false, 
    M: false, 
    A: false, 
    R: false, 
    T: false 
  });
  const [dailyCheckInTime, setDailyCheckInTime] = useState<string>(plannerData.dailyCheckInTime || '09:00');
  const [weeklyReviewTime, setWeeklyReviewTime] = useState<string>(plannerData.weeklyReviewTime || 'Friday 17:00');
  const [dndStart, setDndStart] = useState<string>(plannerData.dndStart || '22:00');
  const [dndEnd, setDndEnd] = useState<string>(plannerData.dndEnd || '08:00');
  const [workHoursStart, setWorkHoursStart] = useState<string>(plannerData.workHours?.start || '09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState<string>(plannerData.workHours?.end || '17:00');
  const [pomodoroRatio, setPomodoroRatio] = useState<string>(plannerData.pomodoroRatio || '4');

  const handleSMARTChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setSMART(prev => ({ ...prev, [name]: checked }));
  };

  const handleStringChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: Dispatch<SetStateAction<string>>
  ) => {
    setter(event.target.value);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (new Date(endDate) <= new Date(startDate)) {
      alert("End date must be after start date.");
      return;
    }

    const newPlannerData: PlannerData = {
      objectiveTitle,
      whyItMatters,
      startDate,
      endDate,
      SMART,
      dailyCheckInTime,  // Correct property name
      weeklyReviewTime,  // Correct property name
      dndStart,
      dndEnd,
      workHours: {
        start: workHoursStart,
        end: workHoursEnd,
      },
      pomodoroRatio,
    };

    setPlannerData(newPlannerData);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      {
        content: `Objective: ${objectiveTitle}, Why it matters: ${whyItMatters}, Dates: ${startDate} to ${endDate}, SMART: ${Object.entries(SMART).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}, Daily: ${dailyCheckInTime}, Weekly: ${weeklyReviewTime}, DND: ${dndStart}-${dndEnd}, Work Hours: ${workHoursStart}-${workHoursEnd}, Pomodoro: ${pomodoroRatio}`,
        type: 'user',
      } as ChatBubbleProps,
    ]);
    
    handleNext();
  };

  return (
    <div className="flex flex-col space-y-4 w-full p-6">
      <h2 className="text-2xl font-bold">Planner Setup</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full">
        <div>
          <label htmlFor="objectiveTitle" className="block text-sm font-medium text-gray-700">Objective Title</label>
          <input type="text" name="objectiveTitle" id="objectiveTitle" value={objectiveTitle} onChange={(e) => handleStringChange(e, setObjectiveTitle)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required />
        </div>
        <div>
          <label htmlFor="whyItMatters" className="block text-sm font-medium text-gray-700">Why It Matters</label>
          <textarea name="whyItMatters" id="whyItMatters" value={whyItMatters} onChange={(e) => handleStringChange(e, setWhyItMatters)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required />
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" name="startDate" id="startDate" value={startDate} onChange={(e) => handleStringChange(e, setStartDate)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" name="endDate" id="endDate" value={endDate} onChange={(e) => handleStringChange(e, setEndDate)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">SMART Goals</label>
          {['S', 'M', 'A', 'R', 'T'].map((letter) => (
            <div key={letter} className="flex items-center">
              <input
                type="checkbox"
                name={letter}
                checked={SMART[letter as keyof typeof SMART]}
                onChange={handleSMARTChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-900">
                {{
                  S: 'Specific',
                  M: 'Measurable',
                  A: 'Achievable',
                  R: 'Relevant',
                  T: 'Time-bound'
                }[letter]}
              </label>
            </div>
          ))}
        </div>
        </div>
        <div>
          <label htmlFor="dailyCheckIn" className="block text-sm font-medium text-gray-700">Daily Check-In Time</label>
          <input type="time" name="dailyCheckIn" id="dailyCheckIn" value={dailyCheckInTime} onChange={(e) => handleStringChange(e, setDailyCheckInTime)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="weeklyReview" className="block text-sm font-medium text-gray-700">Weekly Review Time</label>
          <input type="text" name="weeklyReview" id="weeklyReview" value={weeklyReviewTime} onChange={(e) => handleStringChange(e, setWeeklyReviewTime)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="dndStart" className="block text-sm font-medium text-gray-700">Do Not Disturb Start</label>
          <input type="time" name="dndStart" id="dndStart" value={dndStart} onChange={(e) => handleStringChange(e, setDndStart)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div>
          <label htmlFor="dndEnd" className="block text-sm font-medium text-gray-700">Do Not Disturb End</label>
          <input type="time" name="dndEnd" id="dndEnd" value={dndEnd} onChange={(e) => handleStringChange(e, setDndEnd)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="workHoursStart" className="block text-sm font-medium text-gray-700">
              Work Hours Start
            </label>
            <input
              type="time"
              name="workHoursStart"
              id="workHoursStart"
              value={workHoursStart}
              onChange={(e) => handleStringChange(e, setWorkHoursStart)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="workHoursEnd" className="block text-sm font-medium text-gray-700">
              Work Hours End
            </label>
            <input
              type="time"
              name="workHoursEnd"
              id="workHoursEnd"
              value={workHoursEnd}
              onChange={(e) => handleStringChange(e, setWorkHoursEnd)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>
        <div>
          <label htmlFor="pomodoroRatio" className="block text-sm font-medium text-gray-700">Pomodoro Ratio</label>
          <input type="text" name="pomodoroRatio" id="pomodoroRatio" value={pomodoroRatio} onChange={(e) => handleStringChange(e, setPomodoroRatio)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Next
        </button>
      </form>
    </div>
  );
};


export default StepPlanner;  