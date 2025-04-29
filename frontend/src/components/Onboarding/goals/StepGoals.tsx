import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, ChevronLeft, ChevronRight } from 'lucide-react';
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

const StepGoals: React.FC<StepGoalsProps> = ({ selectedGoals, userRole, onSelect }) => {
  const [goalInput, setGoalInput] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [currentSuggestedIndex, setCurrentSuggestedIndex] = useState(0);
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
  })().filter((goal) => !selectedGoals.some((g) => g.title === goal));

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

  const handleSuggestedGoal = (goalTitle: string) => {
    setGoalForm({
      ...goalForm,
      title: goalTitle,
      description: `Suggested goal: ${goalTitle}`,
      category: userRole || 'General',
      priority: 'Medium',
    });
    setShowGoalForm(true);
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
    if (!goalForm.title.trim() || !goalForm.description.trim()) return;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGoal();
    }
  };

  const handleNextSuggested = () => {
    setCurrentSuggestedIndex((prev) => (prev + 1) % suggestedGoals.length);
  };

  const handlePrevSuggested = () => {
    setCurrentSuggestedIndex((prev) => (prev - 1 + suggestedGoals.length) % suggestedGoals.length);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What goals would you like to achieve?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Add custom goals or choose a suggested goal to start your journey. You can add multiple goals.
        </p>
      </motion.div>

      <div className="mb-8">
        <div className="flex mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a goal..."
            className="flex-1 p-4 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleAddGoal}
            disabled={!goalInput.trim()}
            className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 rounded-r-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 flex items-center gap-2 group"
                >
                  <span className="text-gray-700">{goal.title}</span>
                  <button
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="opacity-70 hover:opacity-100 focus:outline-none"
                  >
                    <X className="h-4 w-4 text-blue-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestedGoals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested goal:</h3>
            <div className="relative">
              <motion.button
                key={suggestedGoals[currentSuggestedIndex]}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleSuggestedGoal(suggestedGoals[currentSuggestedIndex])}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 w-full"
              >
                <div className="relative z-10">
                  <div
                    className="inline-block p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white mb-4 group-hover:scale-105 transition-transform duration-300"
                  >
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{suggestedGoals[currentSuggestedIndex]}</h3>
                  <p className="text-gray-600 text-sm">
                    Category: {userRole || 'General'} | Priority: Medium
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </motion.button>
              {suggestedGoals.length > 1 && (
                <>
                  <button
                    onClick={handlePrevSuggested}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-blue-50 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    onClick={handleNextSuggested}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-blue-50 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showGoalForm && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Custom Goal</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={goalForm.title}
                  onChange={handleFormChange}
                  placeholder="Enter goal title"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={goalForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe your goal"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why It Matters</label>
                <textarea
                  name="whyItMatters"
                  value={goalForm.whyItMatters || ''}
                  onChange={handleFormChange}
                  placeholder="Why is this goal important?"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={goalForm.category}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={goalForm.priority}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Effort (hours)</label>
                <input
                  type="number"
                  name="estimatedEffortHours"
                  value={goalForm.estimatedEffortHours || ''}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={goalForm.endDate || ''}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
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
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                    />
                    <button
                      onClick={() => removeMilestone(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addMilestone}
                  className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Milestone
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMART Criteria</label>
                {Object.entries(goalForm.smartCriteria).map(([key, value]) => (
                  <div key={key} className="mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={`smartCriteria.${key}.checked`}
                        checked={value.checked}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-300"
                      />
                      <span className="text-sm capitalize">{key}</span>
                    </label>
                    {value.checked && (
                      <textarea
                        name={`smartCriteria.${key}.note`}
                        value={value.note}
                        onChange={handleFormChange}
                        placeholder={`Note for ${key}`}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 transition-all duration-200"
                        rows={3}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!goalForm.title.trim() || !goalForm.description.trim()}
                className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => onSelect(selectedGoals)}
        disabled={selectedGoals.length === 0}
        className="mx-auto block bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </div>
  );
};

export default StepGoals;