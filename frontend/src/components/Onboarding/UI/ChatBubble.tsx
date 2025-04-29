import React from 'react';
import { Tone } from '../types/onboarding';

interface ChatBubbleProps {
  content?: string | React.ReactNode; // Make content optional
  children?: React.ReactNode; // Make children optional
  isUser: boolean;
  isAnimated?: boolean;
}

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center ml-2 shrink-0">
    <span className="text-white text-sm">U</span>
  </div>
);

const BotAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-2 shrink-0">
    <span className="text-white text-sm">AI</span>
  </div>
);

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  content, 
  children, 
  isUser, 
  isAnimated = true 
}) => {
  const baseClasses = "max-w-[80%] rounded-2xl p-4 shadow-sm";
  
  const userBubbleClasses = `
    ${baseClasses} 
    ml-auto 
    bg-gradient-to-r 
    from-purple-600 to-indigo-700
    text-white
  `;
  
  const assistantBubbleClasses = `
    ${baseClasses} 
    mr-auto 
    bg-white 
    border 
    border-purple-200
    text-gray-800
  `;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 mb-4`}>
      {!isUser && <BotAvatar />}
      <div className={isUser ? userBubbleClasses : assistantBubbleClasses}>
        {content || children} {/* Render content if provided, otherwise render children */}
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
};

export default ChatBubble;