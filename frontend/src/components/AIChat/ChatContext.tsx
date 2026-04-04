import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
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

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = useMemo(
    () => ({ isChatOpen, toggleChat, messages, addMessage, clearMessages, isTyping, setIsTyping }),
    [isChatOpen, toggleChat, messages, addMessage, clearMessages, isTyping],
  );

  return (
    <ChatContext.Provider value={value}>
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