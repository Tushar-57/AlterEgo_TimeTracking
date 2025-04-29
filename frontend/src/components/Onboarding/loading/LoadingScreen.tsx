import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingStep } from '../types/coaching';
import ParticleBackground from '../visual/ParticleBackground';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingSteps: LoadingStep[] = [
    { message: "Building your personal growth space...", progress: 25 },
    { message: "Customizing your experience...", progress: 50 },
    { message: "Preparing your coaching environment...", progress: 75 },
    { message: "Ready to begin your journey...", progress: 100 }
  ];

  useEffect(() => {
    const stepDuration = 1500;
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        setTimeout(onComplete, 1000);
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const targetProgress = loadingSteps[currentStep].progress;
    const duration = 1000;
    const steps = 60;
    const increment = (targetProgress - progress) / steps;
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + increment, targetProgress);
        return Number(next.toFixed(1));
      });
    }, duration / steps);

    return () => clearInterval(progressTimer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
      <ParticleBackground />
      
      <div className="relative z-10 w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {loadingSteps[currentStep].message}
            </h2>
  
            <div className="bg-gray-200/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <p className="text-gray-600 text-sm mt-4">
              {progress}% Complete
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
export default LoadingScreen;