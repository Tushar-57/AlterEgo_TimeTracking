import React from 'react';
import { Tone } from './types/onboarding';
import { getToneStyles } from './utils/onboardingUtils';

interface ChatBubbleProps {
  content: string | React.ReactNode;
  isUser: boolean;
  tone: Tone | null;
  isAnimated?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  content, 
  isUser, 
  tone, 
  isAnimated = true 
}) => {
  const toneStyles = getToneStyles(tone);
  
  // Define base and conditional classes
  const baseClasses = "max-w-[80%] rounded-2xl p-4 mb-4 shadow-sm";
  
  // User message styling
  const userBubbleClasses = `
    ${baseClasses} 
    ml-auto 
    bg-gradient-to-r 
    ${tone ? toneStyles.primaryColor : 'from-purple-600 to-indigo-700'}
    text-white
  `;
  
  // Assistant message styling
  const assistantBubbleClasses = `
    ${baseClasses} 
    mr-auto 
    bg-white 
    border 
    ${tone ? toneStyles.accentColor : 'border-purple-200'}
  `;
  
  // Animation classes
  const animationClasses = isAnimated 
    ? `opacity-0 transform ${isUser ? 'translate-x-4' : '-translate-x-4'} animate-[fadeIn_0.3s_ease-out_forwards]` 
    : '';
  
  return (
    <div 
      className={`
        ${isUser ? userBubbleClasses : assistantBubbleClasses}
        ${animationClasses}
        ${isUser ? 'animate-delay-[0ms]' : 'animate-delay-[300ms]'}
      `}
      style={{ 
        animationDelay: isAnimated ? (isUser ? '0ms' : '300ms') : '0ms',
        opacity: isAnimated ? 0 : 1,
        transform: isAnimated 
          ? `translateX(${isUser ? '1rem' : '-1rem'})` 
          : 'translateX(0)',
      }}
    >
      {content}
    </div>
  );
};

export default ChatBubble;