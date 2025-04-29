import React from 'react';
import { motion } from 'framer-motion';
import { Goal } from '../types/coaching';
import { Target, ChevronRight, Clock, Flag } from 'lucide-react';

interface GoalCanvasProps {
  goals: Goal[];
  onGoalSelect: (goal: Goal) => void;
}

const GoalCanvas: React.FC<GoalCanvasProps> = ({ goals, onGoalSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
        Choose Your Primary Goal
      </h2>
      
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Select a goal that resonates with your aspirations. This will help your mentor create a personalized growth plan.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <button
              onClick={() => onGoalSelect(goal)}
              className={`
                w-full text-left p-6 rounded-xl
                bg-gradient-to-br from-white to-gray-50
                hover:from-blue-50 hover:to-indigo-50
                border border-gray-200 hover:border-blue-200
                shadow-sm hover:shadow-md
                transition-all duration-300
                relative overflow-hidden
              `}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {goal.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                </div>
                
                <p className="text-gray-600 mb-6">
                  {goal.description}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" />
                      Key Milestones
                    </h4>
                    <ul className="space-y-2">
                      {goal.milestones.map((milestone: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, idx: React.Key | null | undefined) => (
                        <li 
                          key={idx}
                          className="flex items-center gap-3 text-gray-600 text-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Estimated timeline: 3-6 months
                  </div>
                </div>
              </div>
              
              <div 
                className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 
                opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 mx-auto block text-blue-600 hover:text-blue-700 font-medium"
      >
        Don't see your goal? Create a custom one
      </motion.button>
    </div>
  );
};

export default GoalCanvas;