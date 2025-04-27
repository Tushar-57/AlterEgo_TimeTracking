import React from 'react';
import { Tone } from './types/onboarding';
import { getToneStyles } from './utils/onboardingUtils';

interface TypingIndicatorProps {
  tone: Tone | null;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ tone }) => {
  const toneStyles = getToneStyles(tone);
  const dotColor = tone ? toneStyles.textColor : 'text-purple-600';
  
  return (
    <div className="flex items-center space-x-1 ml-4 mb-4">
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '200ms' }} />
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '400ms' }} />
    </div>
  );
};

export default TypingIndicator;