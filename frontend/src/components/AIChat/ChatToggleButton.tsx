import React from 'react';
import { Sparkles } from 'lucide-react';
import { useChat } from './ChatContext';

const ChatToggleButton: React.FC = () => {
  const { isChatOpen, toggleChat } = useChat();

  // The full-screen chat carries its own close control.
  if (isChatOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label="Open chat"
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 md:right-8 md:bottom-8"
    >
      <Sparkles className="h-5 w-5" />
      <span className="hidden sm:inline">Ask</span>
    </button>
  );
};

export default ChatToggleButton;
