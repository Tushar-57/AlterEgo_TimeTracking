import React from 'react';
import { OnboardingStep, Tone } from '../types/onboarding';
import { getToneStyles } from '../utils/onboardingUtils';

interface ProgressBarProps {
  currentStep: OnboardingStep;
  tone: Tone | null;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, tone }) => {
  const toneStyles = getToneStyles(tone);
  const gradientClasses = tone
    ? toneStyles.primaryColor
    : 'from-purple-600 to-indigo-700';

  const steps: OnboardingStep[] = [
    'intro',
    'role',
    'personalization',
    'goals',
    'planner',
    'mentor',
    'complete',
  ];

  const currentIndex = steps.indexOf(currentStep);
  const progressPercentage = Math.max(
    5,
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