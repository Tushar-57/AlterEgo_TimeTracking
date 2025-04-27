import React from 'react';
import { OnboardingStep, Tone } from './types/onboarding';
import { getToneStyles } from './utils/onboardingUtils';

interface ProgressBarProps {
  currentStep: OnboardingStep;
  tone: Tone | null;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, tone }) => {
  const toneStyles = getToneStyles(tone);
  const gradientClasses = tone 
    ? toneStyles.primaryColor 
    : 'from-purple-600 to-indigo-700';
  
  // Define all steps in order
  const steps: OnboardingStep[] = [
    'introduction',
    'traits',
    'goals',
    'tone',
    'identity',
    'planner',
    'completion',
  ];
  
  // Get current step index
  const currentIndex = steps.indexOf(currentStep);
  
  // Calculate progress percentage
  const progressPercentage = Math.max(
    5, // Minimum starting progress
    ((currentIndex + 1) / steps.length) * 100
  );
  
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
      <div 
        className={`h-full bg-gradient-to-r ${gradientClasses} transition-all duration-700 ease-in-out`}
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;