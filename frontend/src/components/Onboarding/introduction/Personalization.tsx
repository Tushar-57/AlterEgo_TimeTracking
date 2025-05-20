import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole, Answer } from '../utils/onboardingUtils';
import { BackButton } from '../UI/BackButton';
import { BookOpen, Briefcase, DollarSign, Star, Pencil, X, Plus } from 'lucide-react';

interface Priority {
  id: string;
  title: string;
  description: string;
  isCustom?: boolean;
  color: string;
  icon: React.ReactNode;
}

interface PersonalizationProps {
  userRole: UserRole | null;
  onSelect: (answers: Answer[]) => void;
  onBack: () => void;
}

const roleSpecificPriorities: {
  [key: string]: { id: string; title: string; description: string; color: string; icon: React.ReactNode }[];
} = {
  student: [
    {
      id: 'study-reminders',
      title: 'Study Reminders',
      description: 'Support for study reminders to enhance your learning journey.',
      color: 'from-blue-400 to-cyan-500',
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 'assignment-tracking',
      title: 'Assignment Tracking',
      description: 'Support for assignment tracking to enhance your learning journey.',
      color: 'from-blue-400 to-cyan-500',
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 'test-preparation',
      title: 'Test Preparation',
      description: 'Support for test preparation to enhance your learning journey.',
      color: 'from-blue-400 to-cyan-500',
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 'knowledge-retention',
      title: 'Knowledge Retention',
      description: 'Support for knowledge retention to enhance your learning journey.',
      color: 'from-blue-400 to-cyan-500',
      icon: <BookOpen className="w-6 h-6" />,
    },
  ],
  professional: [
    {
      id: 'time-management',
      title: 'Time Management',
      description: 'Support for time management to enhance your professional journey.',
      color: 'from-violet-400 to-purple-500',
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      id: 'project-organization',
      title: 'Project Organization',
      description: 'Support for project organization to enhance your professional journey.',
      color: 'from-violet-400 to-purple-500',
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      id: 'work-life-balance',
      title: 'Work-Life Balance',
      description: 'Support for work-life balance to enhance your professional journey.',
      color: 'from-violet-400 to-purple-500',
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      id: 'skill-development',
      title: 'Skill Development',
      description: 'Support for skill development to enhance your professional journey.',
      color: 'from-violet-400 to-purple-500',
      icon: <Briefcase className="w-6 h-6" />,
    },
  ],
  freelancer: [
    {
      id: 'client-management',
      title: 'Client Management',
      description: 'Support for client management to enhance your freelancing journey.',
      color: 'from-emerald-400 to-teal-500',
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      id: 'project-scheduling',
      title: 'Project Scheduling',
      description: 'Support for project scheduling to enhance your freelancing journey.',
      color: 'from-emerald-400 to-teal-500',
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      id: 'income-tracking',
      title: 'Income Tracking',
      description: 'Support for income tracking to enhance your freelancing journey.',
      color: 'from-emerald-400 to-teal-500',
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      id: 'skill-marketing',
      title: 'Skill Marketing',
      description: 'Support for skill marketing to enhance your freelancing journey.',
      color: 'from-emerald-400 to-teal-500',
      icon: <DollarSign className="w-6 h-6" />,
    },
  ],
  other: [
    {
      id: 'custom-needs',
      title: 'Custom Needs',
      description: 'Support for custom needs to enhance your growth journey.',
      color: 'from-amber-400 to-orange-500',
      icon: <Star className="w-6 h-6" />,
    },
    {
      id: 'personalized-help',
      title: 'Personalized Help',
      description: 'Support for personalized help to enhance your growth journey.',
      color: 'from-amber-400 to-orange-500',
      icon: <Star className="w-6 h-6" />,
    },
  ],
};

const Personalization: React.FC<PersonalizationProps> = ({ userRole, onSelect, onBack }) => {
  const [availablePriorities, setAvailablePriorities] = useState<Priority[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [showPriorityForm, setShowPriorityForm] = useState(false);
  const [priorityForm, setPriorityForm] = useState<{
    id?: string;
    title: string;
    description: string;
    isEditing: boolean;
  }>({ title: '', description: '', isEditing: false });
  const [newPriorityText, setNewPriorityText] = useState('');

  useEffect(() => {
    const predefined = roleSpecificPriorities[userRole?.toLowerCase() || 'other'].map((p) => ({
      ...p,
      isCustom: false,
    }));
    setAvailablePriorities(predefined);
    setSelectedAnswers([]);
  }, [userRole]);

  const handleAnswerToggle = (priority: Priority) => {
    const answer: Answer = { id: priority.id, answer: priority.title, description: priority.description };
    const isSelected = selectedAnswers.some((a) => a.id === priority.id);
    if (isSelected) {
      setSelectedAnswers(selectedAnswers.filter((a) => a.id !== priority.id));
    } else {
      setSelectedAnswers([...selectedAnswers, answer]);
    }
  };

  const handleAddPriority = () => {
    if (!newPriorityText.trim()) return;
    setPriorityForm({
      title: newPriorityText.trim(),
      description: `Support for ${newPriorityText.trim().toLowerCase()} to enhance your ${
        userRole?.toLowerCase() || 'journey'
      }.`,
      isEditing: false,
    });
    setShowPriorityForm(true);
    setNewPriorityText('');
  };

  const handleEditPriority = (priority: Priority) => {
    setPriorityForm({
      id: priority.id,
      title: priority.title,
      description: priority.description,
      isEditing: true,
    });
    setShowPriorityForm(true);
  };

  const handleRemovePriority = (priorityId: string) => {
    setAvailablePriorities(availablePriorities.filter((p) => p.id !== priorityId));
    setSelectedAnswers(selectedAnswers.filter((a) => a.id !== priorityId));
  };

  const handleFormSubmit = () => {
    if (!priorityForm.title.trim() || !priorityForm.description.trim()) return;
    const roleColor = roleSpecificPriorities[userRole?.toLowerCase() || 'other'][0].color;
    const roleIcon = roleSpecificPriorities[userRole?.toLowerCase() || 'other'][0].icon;
    const newPriority: Priority = {
      id: priorityForm.isEditing ? priorityForm.id! : Date.now().toString(),
      title: priorityForm.title,
      description: priorityForm.description,
      isCustom: !priorityForm.isEditing || availablePriorities.find((p) => p.id === priorityForm.id)?.isCustom,
      color: roleColor,
      icon: roleIcon,
    };
    if (priorityForm.isEditing) {
      setAvailablePriorities(availablePriorities.map((p) => (p.id === newPriority.id ? newPriority : p)));
      setSelectedAnswers(
        selectedAnswers.map((a) =>
          a.id === newPriority.id ? { id: a.id, answer: newPriority.title, description: newPriority.description } : a
        )
      );
    } else {
      setAvailablePriorities([...availablePriorities, newPriority]);
    }
    setShowPriorityForm(false);
    setPriorityForm({ title: '', description: '', isEditing: false });
  };

  const handleSubmit = () => {
    onSelect(selectedAnswers);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPriority();
    }
  };

  const getHeaderText = () => {
    switch (userRole?.toLowerCase()) {
      case 'student':
        return 'How can we support your learning journey?';
      case 'professional':
        return 'What work priorities do you want to enhance?';
      case 'freelancer':
        return 'What are your key freelancing priorities?';
      case 'other':
        return 'What’s your focus for growth?';
      default:
        return 'Please select a role.';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative">
        <BackButton onClick={onBack} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{getHeaderText()}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select or add priorities where you need support. Choose at least one to continue.
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="flex mb-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <input
              type="text"
              value={newPriorityText}
              onChange={(e) => setNewPriorityText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a custom priority (e.g., Exam Preparation)"
              className="flex-1 p-4 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
            />
            <button
              onClick={handleAddPriority}
              disabled={!newPriorityText.trim()}
              className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 rounded-r-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {availablePriorities.map((priority, index) => {
              const isSelected = selectedAnswers.some((a) => a.id === priority.id);
              return (
                <motion.div
                  key={priority.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswerToggle(priority)}
                  className={`group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-400'
                      : 'bg-white hover:shadow-md'
                  }`}
                >
                  <div className="relative z-10">
                    <div
                      className={`inline-block p-2 rounded-xl bg-gradient-to-br ${priority.color} text-white mb-4 group-hover:scale-105 transition-transform duration-300`}
                    >
                      {priority.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{priority.title}</h3>
                    <p className="text-gray-600 text-sm">{priority.description}</p>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPriority(priority);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {priority.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePriority(priority.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${priority.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                </motion.div>
              );
            })}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleSubmit} // Fixed to use handleSubmit
            disabled={selectedAnswers.length === 0}
            className="mx-auto block bg-gradient-to-r from-violet-500 to-blue-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </motion.button>
        </div>

        <AnimatePresence>
          {showPriorityForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {priorityForm.isEditing ? 'Edit Priority' : 'Add Priority'}
                  </h3>
                  <button
                    onClick={() => setShowPriorityForm(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={priorityForm.title}
                      onChange={(e) => setPriorityForm({ ...priorityForm, title: e.target.value })}
                      placeholder="e.g., Exam Preparation"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={priorityForm.description}
                      onChange={(e) => setPriorityForm({ ...priorityForm, description: e.target.value })}
                      placeholder="e.g., Support for exam preparation to enhance your learning journey."
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 transition-all duration-200"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setShowPriorityForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    disabled={!priorityForm.title.trim() || !priorityForm.description.trim()}
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Personalization;