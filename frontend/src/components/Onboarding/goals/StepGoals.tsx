import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { Goal, UserRole, SmartCriteria } from '../types/onboarding';
import {
  SUGGESTED_GOALS_STUDENT,
  SUGGESTED_GOALS_WORK,
  SUGGESTED_GOALS_FREELANCER,
  SUGGESTED_GOALS_OTHER,
} from '../types/onboarding';
import { BackButton } from '../UI/BackButton';

interface StepGoalsProps {
  selectedGoals: Goal[];
  userRole: UserRole | null;
  onSelect: (goals: Goal[]) => void;
  onUpdateGoals: (goals: Goal[]) => void;
  onBack: () => void;
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
  isEditing?: boolean;
  editGoalId?: string;
}

export const GoalForm: React.FC<{
  goalForm: GoalFormState;
  setGoalForm: React.Dispatch<React.SetStateAction<GoalFormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  userRole: UserRole | null;
}> = ({ goalForm, setGoalForm, onSubmit, onCancel, userRole }) => {
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const requiredFields = [
    { name: 'title', value: goalForm.title.trim() },
    { name: 'description', value: goalForm.description.trim() },
  ];
  const completedFields = requiredFields.filter((field) => field.value).length;

  useEffect(() => {
    setErrors({
      title: goalForm.title.trim() ? undefined : 'Title is required',
      description: goalForm.description.trim() ? undefined : 'Description is required',
    });
  }, [goalForm.title, goalForm.description]);

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

  const validateAndSubmit = () => {
    if (!goalForm.title.trim() || !goalForm.description.trim()) {
      return;
    }
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {goalForm.isEditing ? 'Edit Goal' : 'Create Goal'}
          </h3>
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Required Fields</h4>
            <span className="text-sm text-gray-500">{completedFields}/2 completed</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedFields / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
            <div className="space-y-4">
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
                  className={`w-full p-3 border ${
                    errors.title ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.title}
                  </p>
                )}
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
                  className={`w-full p-3 border ${
                    errors.description ? 'border-red-400' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200`}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why It Matters
                </label>
                <textarea
                  name="whyItMatters"
                  value={goalForm.whyItMatters || ''}
                  onChange={handleFormChange}
                  placeholder="Why is this goal important?"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={goalForm.category}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={goalForm.priority}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Effort (hours)
                  </label>
                  <input
                    type="number"
                    name="estimatedEffortHours"
                    value={goalForm.estimatedEffortHours || ''}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={goalForm.endDate || ''}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h4>
            {goalForm.milestones.length === 0 && (
              <p className="text-gray-500 text-sm mb-2">No milestones added yet.</p>
            )}
            {goalForm.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => updateMilestone(index, e.target.value)}
                  placeholder={`Milestone ${index + 1}`}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                />
                <button
                  onClick={() => removeMilestone(index)}
                  className="text-red-500 hover:text-red-600 shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              onClick={addMilestone}
              className="mt-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Milestone
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">SMART Criteria</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(goalForm.smartCriteria).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name={`smartCriteria.${key}.checked`}
                      checked={value.checked}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-300"
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                  </label>
                  {value.checked && (
                    <textarea
                      name={`smartCriteria.${key}.note`}
                      value={value.note}
                      onChange={handleFormChange}
                      placeholder={`How is this goal ${key}?`}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={validateAndSubmit}
            disabled={!goalForm.title.trim() || !goalForm.description.trim()}
            className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Goal
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const StepGoals: React.FC<StepGoalsProps> = ({ selectedGoals, userRole, onSelect, onUpdateGoals, onBack }) => {
  const [goalInput, setGoalInput] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [localGoals, setLocalGoals] = useState<Goal[]>(selectedGoals);
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

  useEffect(() => {
    setLocalGoals(selectedGoals);
  }, [selectedGoals]);

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
  })().filter((goal) => !localGoals.some((g) => g.title === goal));

  const handleAddGoal = () => {
    if (!goalInput.trim()) return;
    setGoalForm({
      ...goalForm,
      title: goalInput.trim(),
      description: `Custom goal: ${goalInput.trim()}`,
      isEditing: false,
      editGoalId: undefined,
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
      isEditing: false,
      editGoalId: undefined,
    });
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalForm({
      ...goal,
      isEditing: true,
      editGoalId: goal.id,
    });
    setShowGoalForm(true);
  };

  const handleFormSubmit = () => {
    if (!goalForm.title.trim() || !goalForm.description.trim()) return;
    const newGoal: Goal = {
      id: goalForm.isEditing ? goalForm.editGoalId! : Math.random().toString(36).substring(2, 15),
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
    const updatedGoals = goalForm.isEditing
      ? localGoals.map((g) => (g.id === newGoal.id ? newGoal : g))
      : [...localGoals, newGoal];
    setLocalGoals(updatedGoals);
    onUpdateGoals(updatedGoals);
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
      isEditing: false,
      editGoalId: undefined,
    });
  };

  const handleRemoveGoal = (goalId: string) => {
    const updatedGoals = localGoals.filter((g) => g.id !== goalId);
    setLocalGoals(updatedGoals);
    onUpdateGoals(updatedGoals);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGoal();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What goals would you like to achieve?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add custom goals or choose from suggestions. Add at least one goal to continue.
          </p>
        </motion.div>
        <BackButton onClick={onBack} />
      </div>

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

        {localGoals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Your goals ({localGoals.length} selected):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ring-2 ring-blue-300 glow"
                >
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-block p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white mb-4 group-hover:scale-105 transition-transform duration-300">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                    <p className="text-gray-600 text-sm">
                      Category: {goal.category} | Priority: {goal.priority}
                    </p>
                    <p className="text-gray-600 text-sm mt-1 truncate">
                      {goal.whyItMatters || 'No reason specified'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveGoal(goal.id)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {suggestedGoals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested goals:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedGoals.slice(0, 4).map((goalTitle, index) => (
                <motion.button
                  key={goalTitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSuggestedGoal(goalTitle)}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative z-10">
                    <div className="inline-block p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 text-white mb-4 group-hover:scale-105 transition-transform duration-300">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{goalTitle}</h3>
                    <p className="text-gray-600 text-sm">
                      Category: {userRole || 'General'} | Priority: Medium
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showGoalForm && (
          <GoalForm
            goalForm={goalForm}
            setGoalForm={setGoalForm}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowGoalForm(false)}
            userRole={userRole}
          />
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => onSelect(localGoals)}
        disabled={localGoals.length === 0}
        className="mx-auto block bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </div>
  );
};

export default StepGoals;