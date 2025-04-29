import React, { useRef, useEffect, Children } from 'react';
import { Message, Tone } from '../types/onboarding';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  children?: React.ReactNode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isTyping, 
  children
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 h-[calc(100vh-200px)]">
      {messages.map(message => (
        <ChatBubble
          key={message.id}
          content={message.content}
          isUser={message.sender === 'user'}
        />
      ))}
      {isTyping && <TypingIndicator />}
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
};