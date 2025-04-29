import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserRole, Question, Answer } from './types/onboarding';
import { BackButton } from './UI/BackButton';
import { CheckCircle } from 'lucide-react';

interface PersonalizationProps {
  userRole: UserRole | null;
  onSelect: (answers: Answer[]) => void;
  onBack: () => void;
}

const Personalization: React.FC<PersonalizationProps> = ({ userRole, onSelect, onBack }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const roleSpecificQuestions: { [key: string]: { id: string; text: string; color: string }[] } = {
    student: [
      { id: 'study-reminders', text: 'Study reminders', color: 'from-blue-500 to-indigo-600' },
      { id: 'assignment-tracking', text: 'Assignment tracking', color: 'from-blue-500 to-indigo-600' },
      { id: 'test-preparation', text: 'Test preparation', color: 'from-blue-500 to-indigo-600' },
      { id: 'knowledge-retention', text: 'Knowledge retention', color: 'from-blue-500 to-indigo-600' },
    ],
    professional: [
      { id: 'time-management', text: 'Time management', color: 'from-purple-500 to-pink-600' },
      { id: 'project-organization', text: 'Project organization', color: 'from-purple-500 to-pink-600' },
      { id: 'work-life-balance', text: 'Work-life balance', color: 'from-purple-500 to-pink-600' },
      { id: 'skill-development', text: 'Skill development', color: 'from-purple-500 to-pink-600' },
    ],
    freelancer: [
      { id: 'client-management', text: 'Client management', color: 'from-emerald-500 to-teal-600' },
      { id: 'project-scheduling', text: 'Project scheduling', color: 'from-emerald-500 to-teal-600' },
      { id: 'income-tracking', text: 'Income tracking', color: 'from-emerald-500 to-teal-600' },
      { id: 'skill-marketing', text: 'Skill marketing', color: 'from-emerald-500 to-teal-600' },
    ],
    other: [
      { id: 'custom-needs', text: 'Custom needs', color: 'from-amber-500 to-orange-600' },
      { id: 'personalized-help', text: 'Personalized help', color: 'from-amber-500 to-orange-600' },
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
        return 'How would you like this app to support your learning journey?';
      case 'professional':
        return 'What aspects of work would you like to improve?';
      case 'freelancer':
        return 'What are your key priorities?';
      case 'other':
        return 'Please tell us what’s your focus?';
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
            Choose the areas where you need support. Select as many as apply, then continue.
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
                className={`group relative overflow-hidden rounded-2xl p-8 shadow-lg transition-shadow duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-500'
                    : 'bg-white hover:shadow-xl'
                }`}
              >
                <div className="relative z-10">
                  <div
                    className={`inline-block p-3 rounded-2xl bg-gradient-to-br ${
                      questionData?.color || 'from-purple-500 to-indigo-600'
                    } text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{question.question}</h3>
                  <p className="text-gray-600">
                    Support for {question.question.toLowerCase()} to enhance your {userRole?.toLowerCase() || 'journey'}.
                  </p>
                </div>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    questionData?.color || 'from-purple-500 to-indigo-600'
                  } opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
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
          className="mx-auto block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
};

export default Personalization;