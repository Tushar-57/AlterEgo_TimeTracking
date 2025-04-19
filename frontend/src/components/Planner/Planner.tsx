import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type FormData = {
  objectiveTitle: string;
  whyItMatters: string;
  startDate: string;
  endDate: string;
  smart: Record<'S' | 'M' | 'A' | 'R' | 'T', boolean>;
  dailyCheckIn: string;
  weeklyReview: string;
  dndStart: string;
  dndEnd: string;
  workHours: number;
  pomodoroRatio: string;
};

export const PlannerForm: React.FC = () => {
  const [data, setData] = useState<FormData>({
    objectiveTitle: '',
    whyItMatters: '',
    startDate: '',
    endDate: '',
    smart: { S: false, M: false, A: false, R: false, T: false },
    dailyCheckIn: '',
    weeklyReview: '',
    dndStart: '',
    dndEnd: '',
    workHours: 8,
    pomodoroRatio: '25/5',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name;
    let value: string | number | boolean;

    if (target instanceof HTMLInputElement) {
      if (target.type === 'checkbox') {
        value = target.checked;
      } else if (target.type === 'number') {
        value = target.valueAsNumber;
      } else {
        value = target.value;
      }
    } else {
      value = target.value;
    }

    setData(prev => {
      if (name in prev.smart && typeof value === 'boolean') {
        return {
          ...prev,
          smart: { ...prev.smart, [name]: value },
        };
      }
      return {
        ...prev,
        [name]: value,
      } as any;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('http://localhost:8080/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) throw new Error('Failed to save plan');
      
      // Show success message
      setSuccessMessage('Plan saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      setData({
        objectiveTitle: '',
        whyItMatters: '',
        startDate: '',
        endDate: '',
        smart: { S: false, M: false, A: false, R: false, T: false },
        dailyCheckIn: '',
        weeklyReview: '',
        dndStart: '',
        dndEnd: '',
        workHours: 8,
        pomodoroRatio: '25/5',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Plan Your Work</h1>
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Vision & Objectives */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Vision &amp; Objectives</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Objective Title</label>
            <input
              name="objectiveTitle"
              value={data.objectiveTitle}
              onChange={handleChange}
              placeholder="Enter your main objective"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Why It Matters</label>
            <textarea
              name="whyItMatters"
              rows={3}
              value={data.whyItMatters}
              onChange={handleChange}
              placeholder="Describe the purpose"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Timeframe</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={data.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={data.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">SMART Checks</label>
            <div className="flex flex-wrap gap-6">
              {(['S', 'M', 'A', 'R', 'T'] as const).map(letter => {
                const labels = {
                  S: 'Specific',
                  M: 'Measurable',
                  A: 'Achievable',
                  R: 'Relevant',
                  T: 'Time-bound'
                };
                
                return (
                  <label key={letter} className="flex items-center space-x-2 text-gray-700">
                    <input
                      type="checkbox"
                      name={letter}
                      checked={data.smart[letter]}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span><strong>{letter}</strong>: {labels[letter]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Review Cadence */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Review Cadence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Daily Check-in Time</label>
              <input
                type="time"
                name="dailyCheckIn"
                value={data.dailyCheckIn}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Weekly Review Day</label>
              <select
                name="weeklyReview"
                value={data.weeklyReview}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a day</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                  .map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* User Preferences */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">User Preferences</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Do-Not-Disturb Window</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Start Time</label>
                <input
                  type="time"
                  name="dndStart"
                  value={data.dndStart}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">End Time</label>
                <input
                  type="time"
                  name="dndEnd"
                  value={data.dndEnd}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Working Hours per Day</label>
              <input
                type="number"
                name="workHours"
                min={1}
                max={24}
                value={data.workHours}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Focus/Break Ratio</label>
              <input
                name="pomodoroRatio"
                value={data.pomodoroRatio}
                onChange={handleChange}
                placeholder="e.g. 25/5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">Minutes of work/Minutes of break</p>
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Saving...
            </>
          ) : (
            'Save Planner'
          )}
        </button>
      </form>
    </div>
  );
};