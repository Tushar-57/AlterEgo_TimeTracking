import React, { useRef, useEffect } from 'react';
import { Message, Tone } from './types/onboarding';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  tone: Tone | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isTyping, 
  tone 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);
  
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map(message => (
        <ChatBubble
          key={message.id}
          content={message.content}
          isUser={message.sender === 'user'}
          tone={tone}
        />
      ))}
      
      {isTyping && <TypingIndicator tone={tone} />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;