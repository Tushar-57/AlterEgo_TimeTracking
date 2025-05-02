import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from '../Onboarding/types/onboarding';

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{ isChatOpen, toggleChat, messages, addMessage, clearMessages, isTyping, setIsTyping }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};