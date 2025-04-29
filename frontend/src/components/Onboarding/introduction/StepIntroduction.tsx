import React from 'react';
import { motion } from 'framer-motion';
import ChatBubble from '../UI/ChatBubble';

interface StepIntroductionProps {
  onSelect: () => void;
}

const StepIntroduction: React.FC<StepIntroductionProps> = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <ChatBubble isUser={false}>
        <button
          onClick={onSelect}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Start Onboarding
        </button>
      </ChatBubble>
    </motion.div>
  );
};


export default StepIntroduction;