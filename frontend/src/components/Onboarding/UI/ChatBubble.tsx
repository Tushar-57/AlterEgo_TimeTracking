import React from 'react';
import { motion } from 'framer-motion';
import { Tone } from '../types/onboarding';

interface ChatBubbleProps {
  content?: string | React.ReactNode;
  children?: React.ReactNode;
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
  isAnimated = true,
}) => {
  const baseClasses = 'max-w-[80%] rounded-2xl p-4 shadow-sm';

  const userBubbleClasses = `
    ${baseClasses}
    ml-auto
    bg-gradient-to-r
    from-blue-400
    to-cyan-500
    text-white
    border
    border-blue-200
    text-shadow-sm
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
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 mb-4`}
    >
      {!isUser && <BotAvatar />}
      <div className={isUser ? userBubbleClasses : assistantBubbleClasses}>
        {content || children}
      </div>
      {isUser && <UserAvatar />}
    </motion.div>
  );
};

export default ChatBubble;