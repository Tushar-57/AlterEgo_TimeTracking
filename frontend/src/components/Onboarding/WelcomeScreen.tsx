import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-4">
              Welcome to Your Growth Journey
            </h1>
            <p className="text-lg text-indigo-100 max-w-xl">
              Meet your personalized AI coach, designed to help you achieve your goals and unlock your full potential.
            </p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="space-y-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Personalized Guidance</h3>
                <p className="text-gray-600">Get a coach that adapts to your unique needs and learning style</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Smart Goal Setting</h3>
                <p className="text-gray-600">Define and track meaningful goals with intelligent milestones</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Continuous Support</h3>
                <p className="text-gray-600">Get daily check-ins and adjustments to keep you on track</p>
              </div>
            </motion.div>
          </div>
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onStart}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl
              flex items-center justify-center gap-2 text-lg font-medium
              hover:shadow-lg transition-shadow duration-300"
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;