import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from './ChatContext';

const ChatToggleButton: React.FC = () => {
  const { isChatOpen, toggleChat } = useChat();

  return (
    <button
      onClick={toggleChat}
      className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
        isChatOpen
          ? 'bg-gradient-to-r from-blue-400 to-cyan-500 scale-110'
          : 'bg-gray-900 hover:bg-gray-800'
      }`}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
};

export default ChatToggleButton;