import React from 'react';
import { motion } from 'framer-motion';
import { MentorArchetype } from '../types/onboarding';
import { Brain, Lightbulb, Target, Compass, Map } from 'lucide-react';

interface MentorSelectionProps {
  onSelect: (archetype: MentorArchetype) => void;
}

const MentorSelection: React.FC<MentorSelectionProps> = ({ onSelect }) => {
  const archetypes = [
    {
      type: 'Innovator',
      icon: <Lightbulb className="w-8 h-8" />,
      description: 'Pushes boundaries and inspires creative solutions',
      color: 'from-blue-100 to-indigo-200'
    },
    {
      type: 'Sage',
      icon: <Brain className="w-8 h-8" />,
      description: 'Shares wisdom and deep insights',
      color: 'from-emerald-100 to-teal-200'
    },
    {
      type: 'Challenger',
      icon: <Target className="w-8 h-8" />,
      description: 'Motivates through ambitious goals',
      color: 'from-orange-100 to-amber-200'
    },
    {
      type: 'Master',
      icon: <Compass className="w-8 h-8" />,
      description: 'Guides with expertise and experience',
      color: 'from-violet-100 to-purple-200'
    },
    {
      type: 'Guide',
      icon: <Map className="w-8 h-8" />,
      description: 'Supports with patience and understanding',
      color: 'from-rose-100 to-pink-200'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
        Choose Your Growth Mentor
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archetypes.map((archetype, index) => (
          <motion.button
            key={archetype.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(archetype.type as MentorArchetype)}
            className={`
              relative overflow-hidden rounded-xl p-6
              bg-gradient-to-br ${archetype.color}
              hover:scale-105 transition-transform duration-300
              group focus:outline-none focus:ring-2 focus:ring-blue-300
              shadow-lg hover:shadow-xl
            `}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            
            <div className="relative z-10">
              <div className="text-gray-700 mb-4">
                {archetype.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {archetype.type}
              </h3>
              
              <p className="text-gray-600 text-sm">
                {archetype.description}
              </p>
            </div>
            
            <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
              {archetype.icon}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MentorSelection;