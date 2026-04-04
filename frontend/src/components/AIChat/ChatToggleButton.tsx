import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from './ChatContext';

const ChatToggleButton: React.FC = () => {
  const { isChatOpen, toggleChat } = useChat();

  return (
    <button
      onClick={toggleChat}
      className={`fixed bottom-24 right-4 z-50 rounded-full p-3 shadow-lg transition-all duration-300 md:bottom-8 md:right-8 md:p-4 ${
        isChatOpen
          ? 'bg-gradient-to-r from-blue-400 to-cyan-500 scale-110'
          : 'bg-gray-900 hover:bg-gray-800'
      }`}
    >
      <MessageCircle className="h-5 w-5 text-white md:h-6 md:w-6" />
    </button>
  );
};

export default ChatToggleButton;