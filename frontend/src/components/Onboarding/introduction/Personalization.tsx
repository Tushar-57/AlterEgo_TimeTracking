import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserRole, Question, Answer } from '../types/onboarding';
import { BackButton } from '../UI/BackButton';
import { BookOpen, Briefcase, DollarSign, Star } from 'lucide-react';

interface PersonalizationProps {
  userRole: UserRole | null;
  onSelect: (answers: Answer[]) => void;
  onBack: () => void;
}

const Personalization: React.FC<PersonalizationProps> = ({ userRole, onSelect, onBack }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const roleSpecificQuestions: { [key: string]: { id: string; text: string; color: string; icon: React.ReactNode }[] } = {
    student: [
      { id: 'study-reminders', text: 'Study reminders', color: 'from-blue-400 to-cyan-500', icon: <BookOpen className="w-6 h-6" /> },
      { id: 'assignment-tracking', text: 'Assignment tracking', color: 'from-blue-400 to-cyan-500', icon: <BookOpen className="w-6 h-6" /> },
      { id: 'test-preparation', text: 'Test preparation', color: 'from-blue-400 to-cyan-500', icon: <BookOpen className="w-6 h-6" /> },
      { id: 'knowledge-retention', text: 'Knowledge retention', color: 'from-blue-400 to-cyan-500', icon: <BookOpen className="w-6 h-6" /> },
    ],
    professional: [
      { id: 'time-management', text: 'Time management', color: 'from-violet-400 to-purple-500', icon: <Briefcase className="w-6 h-6" /> },
      { id: 'project-organization', text: 'Project organization', color: 'from-violet-400 to-purple-500', icon: <Briefcase className="w-6 h-6" /> },
      { id: 'work-life-balance', text: 'Work-life balance', color: 'from-violet-400 to-purple-500', icon: <Briefcase className="w-6 h-6" /> },
      { id: 'skill-development', text: 'Skill development', color: 'from-violet-400 to-purple-500', icon: <Briefcase className="w-6 h-6" /> },
    ],
    freelancer: [
      { id: 'client-management', text: 'Client management', color: 'from-emerald-400 to-teal-500', icon: <DollarSign className="w-6 h-6" /> },
      { id: 'project-scheduling', text: 'Project scheduling', color: 'from-emerald-400 to-teal-500', icon: <DollarSign className="w-6 h-6" /> },
      { id: 'income-tracking', text: 'Income tracking', color: 'from-emerald-400 to-teal-500', icon: <DollarSign className="w-6 h-6" /> },
      { id: 'skill-marketing', text: 'Skill marketing', color: 'from-emerald-400 to-teal-500', icon: <DollarSign className="w-6 h-6" /> },
    ],
    other: [
      { id: 'custom-needs', text: 'Custom needs', color: 'from-amber-400 to-orange-500', icon: <Star className="w-6 h-6" /> },
      { id: 'personalized-help', text: 'Personalized help', color: 'from-amber-400 to-orange-500', icon: <Star className="w-6 h-6" /> },
    ],
  };

  useEffect(() => {
    const getQuestions = (): Question[] => {
      const questionData = userRole ? roleSpecificQuestions[userRole.toLowerCase()] || [] : [];
      return questionData.map(({ id, text }) => ({ id, question: text }));
    };
    setQuestions(getQuestions());
  }, [userRole]);

  const handleAnswerToggle = (question: Question) => {
    const answer: Answer = { id: question.id, answer: question.question };
    const isSelected = selectedAnswers.some((a) => a.id === question.id);
    if (isSelected) {
      setSelectedAnswers(selectedAnswers.filter((a) => a.id !== question.id));
    } else {
      setSelectedAnswers([...selectedAnswers, answer]);
    }
  };

  const handleSubmit = () => {
    onSelect(selectedAnswers);
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
            Select the areas where you need support. Choose as many as apply, then continue.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {questions.map((question, index) => {
            const questionData = roleSpecificQuestions[userRole?.toLowerCase() || 'other'].find(
              (q) => q.id === question.id
            );
            const isSelected = selectedAnswers.some((a) => a.id === question.id);
            return (
              <motion.button
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswerToggle(question)}
                className={`group relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-br from-violet-50 to-blue-50 border-2 border-violet-400'
                    : 'bg-white hover:shadow-md'
                }`}
              >
                <div className="relative z-10">
                  <div
                    className={`inline-block p-2 rounded-xl bg-gradient-to-br ${
                      questionData?.color || 'from-violet-400 to-blue-500'
                    } text-white mb-4 group-hover:scale-105 transition-transform duration-300`}
                  >
                    {questionData?.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{question.question}</h3>
                  <p className="text-gray-600 text-sm">
                    Support for {question.question.toLowerCase()} to enhance your {userRole?.toLowerCase() || 'journey'}.
                  </p>
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    questionData?.color || 'from-violet-400 to-blue-500'
                  } opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
              </motion.button>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className="mx-auto block bg-gradient-to-r from-violet-500 to-blue-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
};

export default Personalization;