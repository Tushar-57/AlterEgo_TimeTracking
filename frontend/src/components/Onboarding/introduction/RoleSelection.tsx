import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Users, Sparkles } from 'lucide-react';
import { UserRole } from '../types/onboarding';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../UI/BackButton';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'intro' | 'role' | 'goals' | 'complete'>('intro');
  const [previousStep, setPreviousStep] = useState<'intro' | 'role' | 'goals' | 'complete'>('intro');
  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: <GraduationCap className="w-8 h-8" />,
      description: 'Focus on academic goals and learning efficiency',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'professional',
      title: 'Professional',
      icon: <Briefcase className="w-8 h-8" />,
      description: 'Enhance work performance and career growth',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'freelancer',
      title: 'Freelancer',
      icon: <Users className="w-8 h-8" />,
      description: 'Balance projects and personal development',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'other',
      title: 'Other',
      icon: <Sparkles className="w-8 h-8" />,
      description: 'Custom path for your unique journey',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
        <div className="relative">
        <BackButton onClick={() => setCurrentStep('intro')} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What best describes your current focus?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This will help us tailor your experience and provide the most relevant guidance for your journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(role.id as UserRole)}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg
                hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative z-10">
                <div className={`inline-block p-3 rounded-2xl bg-gradient-to-br ${role.color}
                  text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {role.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {role.title}
                </h3>
                
                <p className="text-gray-600">
                  {role.description}
                </p>
              </div>
              
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color}
                opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.button>
          ))}
        </div>
      </div>
      </div>
  );
};
export default RoleSelection;