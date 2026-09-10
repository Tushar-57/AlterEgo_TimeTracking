import { motion } from 'framer-motion';

interface ChatBubbleProps {
  content?: string | React.ReactNode;
  children?: React.ReactNode;
  isUser: boolean;
  isAnimated?: boolean;
  coachAvatar?: string;
}

const UserAvatar = () => (
  <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
    You
  </div>
);

const BotAvatar = ({ coachAvatar }: { coachAvatar?: string }) => (
  <img
    src={coachAvatar || '/avatars/default.svg'}
    alt=""
    className="mr-2 h-8 w-8 shrink-0 rounded-full border border-border object-cover"
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
  const bubbleClasses = isUser
    ? 'ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground shadow-sm'
    : 'mr-auto max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-card-foreground shadow-sm';

  return (
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mb-4 flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && <BotAvatar coachAvatar={coachAvatar} />}
      <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${bubbleClasses}`}>
        {content || children}
      </div>
      {isUser && <UserAvatar />}
    </motion.div>
  );
};

export default ChatBubble;
