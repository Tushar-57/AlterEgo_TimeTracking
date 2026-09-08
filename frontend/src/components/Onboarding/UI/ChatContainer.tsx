import React, { useRef, useEffect } from 'react';
import { Message } from '../utils/onboardingUtils';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  className?: string;
  coachAvatar?: string;
  children?: React.ReactNode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isTyping,
  className,
  coachAvatar,
  children,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  return (
    <div className={className}>
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          content={msg.content}
          isUser={msg.sender === 'user'}
          isAnimated={msg.isRendered}
          coachAvatar={msg.sender === 'assistant' ? coachAvatar : undefined}
        />
      ))}
      {isTyping && <TypingIndicator />}
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
};
