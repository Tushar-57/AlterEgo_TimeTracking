// import React from 'react';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  content?: string | React.ReactNode;
  children?: React.ReactNode;
  isUser: boolean;
  isAnimated?: boolean;
  coachAvatar?: string; // Added coachAvatar prop
}

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center ml-2 shrink-0">
    <span className="text-white text-sm">U</span>
  </div>
);

const BotAvatar = ({ coachAvatar }: { coachAvatar?: string }) => (
  <img
    src={coachAvatar || '/avatars/default.svg'}
    alt="Coach Avatar"
    className="w-8 h-8 rounded-full border border-lavender-300 mr-2 shrink-0"
    onError={(e) => (e.currentTarget.src = '/avatars/default.svg')}
  />
);

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  children,
  isUser,
  isAnimated = true,
  coachAvatar,
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
      {!isUser && <BotAvatar coachAvatar={coachAvatar} />}
      <div className={isUser ? userBubbleClasses : assistantBubbleClasses}>
        {content || children}
      </div>
      {isUser && <UserAvatar />}
    </motion.div>
  );
};

export default ChatBubble;