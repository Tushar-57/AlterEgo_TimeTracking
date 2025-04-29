import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Target } from 'lucide-react';
import { Goal, UserRole, SmartCriteria } from '../types/onboarding';
import {
  SUGGESTED_GOALS_STUDENT,
  SUGGESTED_GOALS_WORK,
  SUGGESTED_GOALS_FREELANCER,
  SUGGESTED_GOALS_OTHER,
} from '../types/onboarding';

interface StepGoalsProps {
  selectedGoals: Goal[];
  userRole: UserRole | null;
  onSelect: (goals: Goal[]) => void;
  onSubmit: () => void;
}

interface GoalFormState {
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedEffortHours?: number;
  endDate?: string;
  whyItMatters?: string;
  milestones: string[];
  smartCriteria: SmartCriteria;
}

const StepGoals: React.FC<StepGoalsProps> = ({ selectedGoals, userRole, onSelect, onSubmit }) => {
  const [goalInput, setGoalInput] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalFormState>({
    title: '',
    description: '',
    category: userRole || 'General',
    priority: 'Medium',
    estimatedEffortHours: undefined,
    endDate: undefined,
    whyItMatters: '',
    milestones: [],
    smartCriteria: {
      specific: { checked: false, note: '' },
      measurable: { checked: false, note: '' },
      achievable: { checked: false, note: '' },
      relevant: { checked: false, note: '' },
      timeBound: { checked: false, note: '' },
    },
  });

  const suggestedGoals = (() => {
    switch (userRole?.toLowerCase()) {
      case 'student':
        return SUGGESTED_GOALS_STUDENT;
      case 'professional':
        return SUGGESTED_GOALS_WORK;
      case 'freelancer':
        return SUGGESTED_GOALS_FREELANCER;
      case 'other':
        return SUGGESTED_GOALS_OTHER;
      default:
        return [];
    }
  })();

  const handleAddGoal = () => {
    if (!goalInput.trim()) return;
    setGoalForm({
      ...goalForm,
      title: goalInput.trim(),
      description: `Custom goal: ${goalInput.trim()}`,
    });
    setShowGoalForm(true);
    setGoalInput('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.includes('smartCriteria.')) {
      const [_, criterion, field] = name.split('.');
      setGoalForm({
        ...goalForm,
        smartCriteria: {
          ...goalForm.smartCriteria,
          [criterion]: {
            ...goalForm.smartCriteria[criterion as keyof SmartCriteria],
            [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
          },
        },
      });
    } else {
      setGoalForm({
        ...goalForm,
        [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
      });
    }
  };

  const addMilestone = () => {
    setGoalForm({
      ...goalForm,
      milestones: [...goalForm.milestones, ''],
    });
  };

  const updateMilestone = (index: number, value: string) => {
    const updatedMilestones = [...goalForm.milestones];
    updatedMilestones[index] = value;
    setGoalForm({
      ...goalForm,
      milestones: updatedMilestones,
    });
  };

  const removeMilestone = (index: number) => {
    setGoalForm({
      ...goalForm,
      milestones: goalForm.milestones.filter((_, i) => i !== index),
    });
  };

  const handleFormSubmit = () => {
    const newGoal: Goal = {
      id: Math.random().toString(36).substring(2, 15),
      title: goalForm.title,
      description: goalForm.description,
      category: goalForm.category,
      priority: goalForm.priority,
      estimatedEffortHours: goalForm.estimatedEffortHours,
      endDate: goalForm.endDate,
      whyItMatters: goalForm.whyItMatters,
      milestones: goalForm.milestones,
      smartCriteria: goalForm.smartCriteria,
    };
    onSelect([...selectedGoals, newGoal]);
    setShowGoalForm(false);
    setGoalForm({
      title: '',
      description: '',
      category: userRole || 'General',
      priority: 'Medium',
      estimatedEffortHours: undefined,
      endDate: undefined,
      whyItMatters: '',
      milestones: [],
      smartCriteria: {
        specific: { checked: false, note: '' },
        measurable: { checked: false, note: '' },
        achievable: { checked: false, note: '' },
        relevant: { checked: false, note: '' },
        timeBound: { checked: false, note: '' },
      },
    });
  };

  const handleRemoveGoal = (goalId: string) => {
    onSelect(selectedGoals.filter((g) => g.id !== goalId));
  };

  const handleSuggestedGoal = (goalTitle: string) => {
    const newGoal: Goal = {
      id: Math.random().toString(36).substring(2, 15),
      title: goalTitle,
      description: `Suggested goal: ${goalTitle}`,
      category: userRole || 'General',
      priority: 'Medium',
      estimatedEffortHours: undefined,
      endDate: undefined,
      whyItMatters: '',
      milestones: [],
      smartCriteria: {
        specific: { checked: false, note: '' },
        measurable: { checked: false, note: '' },
        achievable: { checked: false, note: '' },
        relevant: { checked: false, note: '' },
        timeBound: { checked: false, note: '' },
      },
    };
    onSelect([...selectedGoals, newGoal]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGoal();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What goals would you like to achieve?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Add custom goals with detailed planning or choose from our suggestions to start your journey.
        </p>
      </motion.div>

      <div className="mb-8">
        <div className="flex mb-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a goal..."
            className="flex-1 p-4 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            onClick={handleAddGoal}
            disabled={!goalInput.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 rounded-r-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {selectedGoals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your goals:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-2 group"
                >
                  <span className="text-gray-700">{goal.title}</span>
                  <button
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="opacity-70 hover:opacity-100 focus:outline-none"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested goals:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedGoals
              .filter((goal) => !selectedGoals.some((g) => g.title === goal))
              .map((goal, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestedGoal(goal)}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative z-10">
                    <div
                      className="inline-block p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300"
                    >
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal}</h3>
                    <p className="text-gray-600 text-sm">
                      Category: {userRole || 'General'} | Priority: Medium
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                </motion.button>
              ))}
          </div>
        </div>
      </div>

      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Custom Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={goalForm.title}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={goalForm.description}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Why It Matters</label>
                <textarea
                  name="whyItMatters"
                  value={goalForm.whyItMatters || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  name="category"
                  value={goalForm.category}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  name="priority"
                  value={goalForm.priority}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Effort (hours)</label>
                <input
                  type="number"
                  name="estimatedEffortHours"
                  value={goalForm.estimatedEffortHours || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={goalForm.endDate || ''}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Milestones</label>
                {goalForm.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={milestone}
                      onChange={(e) => updateMilestone(index, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => removeMilestone(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addMilestone}
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Milestone
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMART Criteria</label>
                {Object.entries(goalForm.smartCriteria).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={`smartCriteria.${key}.checked`}
                        checked={value.checked}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm capitalize">{key}</span>
                    </label>
                    {value.checked && (
                      <textarea
                        name={`smartCriteria.${key}.note`}
                        value={value.note}
                        onChange={handleFormChange}
                        placeholder={`Note for ${key}`}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!goalForm.title.trim()}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onSubmit}
        disabled={selectedGoals.length === 0}
        className="mx-auto block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </div>
  );
};

export default StepGoals;