import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatContainer } from '../Onboarding/UI/ChatContainer';
import { useChat } from './ChatContext';
import { X, RefreshCw, Settings, Paperclip } from 'lucide-react';
import { Message, MentorArchetype, CoachingStyle, AVATARS, RANDOM_NAMES } from '../Onboarding/types/onboarding';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../Calendar_updated/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/toast';

const SUGGESTION_PROMPTS = [
  'Start a timer for coding on Project X',
  'How much time did I spend this week?',
  'Create a new project named Sprint 5',
  'What should I work on next?',
  'How am I doing today?',
  'Who are you?'
];

const TONES: CoachingStyle[] = ['Direct', 'Friendly', 'Encouraging', 'Nurturing', 'Patient', 'Challenging', 'Inspirational'];
const ARCHETYPES: MentorArchetype[] = ['Innovator', 'Sage', 'Challenger', 'Master', 'Guide'];

const FullScreenChat: React.FC = () => {
  const { isChatOpen, toggleChat, messages, addMessage, clearMessages, isTyping, setIsTyping } = useChat();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'tone' | 'mentor'>('tone');
  const [coachData, setCoachData] = useState<{
    name: string;
    tone: string;
    avatar: string;
    archetype: string;
    goals: Array<{ id: string; title: string; milestones: string[] }>;
  } | null>(null);
  const [context, setContext] = useState<{ type: string; value: string } | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [actionPrompt, setActionPrompt] = useState<{ action: string; details: any } | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          toast({
            title: 'Session Expired',
            description: 'Please log in to continue.',
            variant: 'destructive',
          });
          navigate('/login');
          return;
        }
        const response = await fetch('http://localhost:8080/api/onboarding/getOnboardingData', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: 'Unauthorized',
              description: 'Your session is invalid. Please log in again.',
              variant: 'destructive',
            });
            navigate('/login');
          } else if (response.status === 404) {
            toast({
              title: 'Onboarding Data Not Found',
              description: 'Please complete onboarding to use the chat.',
              variant: 'destructive',
            });
            navigate('/onboarding');
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        const data = JSON.parse(text);
        console.log('Received onboarding data:', data);
        if (!data || Object.keys(data).length === 0) {
          throw new Error('No onboarding data available');
        }
        setCoachData({
          name: data.name && data.name.trim() !== '' ? data.name : 'Assistant',
          tone: data.preferredTone || 'Friendly',
          avatar: data.coachAvatar || '/avatars/default.svg',
          archetype: 'Guide',
          goals: data.goals || [],
        });
      } catch (error) {
        console.error('Failed to fetch coach data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile. Using default settings.',
          variant: 'destructive',
        });
        setCoachData({
          name: 'Assistant',
          tone: 'Friendly',
          avatar: '/avatars/default.svg',
          archetype: 'Guide',
          goals: [],
        });
      } finally {
        setIsAvatarLoading(false);
      }
    };

    if (isChatOpen) {
      fetchCoachData();
    }
  }, [isChatOpen, navigate, toast]);

  useEffect(() => {
    if (messages.length === 0 && isChatOpen && coachData) {
      addMessage({
        id: Date.now().toString(),
        content: `Hello, I'm ${coachData.name}, your ${coachData.tone} ${coachData.archetype}! Try commands like 'Start a timer for coding' or 'How much time did I spend this week?'`,
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: ''
      });
      setShowSuggestions(true);
    } else if (messages.length > 1) {
      setShowSuggestions(false);
    }
  }, [messages, isChatOpen, coachData, addMessage]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      isRendered: true,
      timestamp: new Date(),
      additionalContent: context ? `${context.type}: ${context.value}` : ''
    };

    addMessage(newMessage);
    setInput('');
    setContext(null);
    setIsTyping(true);
    setShowSuggestions(false);
    setActionPrompt(null);

    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      console.log('Sending command:', input);
      const response = await fetch('http://localhost:8080/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          command: input,
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received response:', data);
      addMessage({
        id: Date.now().toString(),
        content: data.message || 'No response from AI',
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: data.intent ? `Intent: ${data.intent}` : ''
      });
      if (data.requiresAction) {
        setActionPrompt({ action: data.actionDetails.action, details: data.actionDetails });
      }
      toast({
        title: 'Success',
        description: 'Command processed successfully.',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      addMessage({
        id: Date.now().toString(),
        content: 'Network error. Please try again.',
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: ''
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      let endpoint = '';
      let body = {};
      switch (action) {
        case 'createProject':
          endpoint = '/api/projects';
          body = { name: details.projectName, color: '#000000', description: '' };
          break;
        case 'createTag':
          endpoint = '/api/tags';
          body = { name: details.tagName, color: '#000000' };
          break;
        case 'stopTimer':
          endpoint = `/api/timers/${details.timerId}/stop`;
          body = { endTime: new Date().toISOString(), description: 'Stopped via AI', billable: false };
          break;
        default:
          return;
      }
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: action === 'stopTimer' ? 'POST' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      toast({
        title: 'Success',
        description: `${action === 'createProject' ? 'Project' : action === 'createTag' ? 'Tag' : 'Timer'} ${action === 'stopTimer' ? 'stopped' : 'created'} successfully.`,
      });
      setActionPrompt(null);
      // Re-send the original command
      sendMessage();
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action === 'createProject' ? 'create project' : action === 'createTag' ? 'create tag' : 'stop timer'}.`,
        variant: 'destructive',
      });
    }
  };

  const handleRestartChat = () => {
    clearMessages();
    setInput('');
    setContext(null);
    setShowSuggestions(true);
    setActionPrompt(null);
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setShowSuggestions(false);
  };

  const handleToneChange = async (tone: CoachingStyle) => {
    setCoachData((prev) => prev ? { ...prev, tone } : prev);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:8080/api/onboarding/updateTone', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tone }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      toast({
        title: 'Success',
        description: 'Tone updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update tone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tone.',
        variant: 'destructive',
      });
    }
  };

  const handleMentorChange = async (name: string, archetype: MentorArchetype, avatar: string) => {
    setCoachData((prev) => prev ? { ...prev, name, archetype, avatar } : prev);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:8080/api/onboarding/updateMentor', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentor: {
            name,
            archetype,
            style: coachData?.tone || 'Friendly',
            avatar
          },
          coachAvatar: avatar
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      toast({
        title: 'Success',
        description: 'Mentor updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update mentor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mentor.',
        variant: 'destructive',
      });
    }
  };

  const handleContextSelect = (type: string, value: string) => {
    setContext({ type, value });
    setShowContextPicker(false);
  };

  const contextOptions = coachData?.goals.flatMap(goal => [
    { type: 'Goal', value: goal.title },
    ...goal.milestones.map(milestone => ({ type: 'Milestone', value: milestone })),
    { type: 'Habit', value: `Track progress on ${goal.title}` }
  ]) || [
    { type: 'Goal', value: 'Get Fall 2025 Internship' },
    { type: 'Milestone', value: 'Getting Interview' },
    { type: 'Milestone', value: 'Clearing Interview' },
    { type: 'Habit', value: 'Daily job applications' }
  ];

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-gradient-to-br from-pink-100 to-lavender-100 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/30 to-white/10 border-b border-lavender-200">
                <div className="flex items-center gap-3">
                  {isAvatarLoading || !coachData ? (
                    <div className="w-10 h-10 rounded-full bg-lavender-200 animate-pulse" />
                  ) : (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      src={coachData.avatar}
                      alt={`${coachData.name} avatar`}
                      className="w-10 h-10 rounded-full border border-lavender-300"
                      onError={(e) => (e.currentTarget.src = '/avatars/default.svg')}
                    />
                  )}
                  <h2 className="text-xl font-bold text-gray-800">
                    {coachData?.name || 'Assistant'} ({coachData?.archetype || 'Guide'})
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        ref={settingsButtonRef}
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-all"
                      >
                        <Settings className="w-5 h-5 text-gray-700" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm rounded-md py-1 px-2">
                      Customize Chat
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleRestartChat}
                        className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-all"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-700" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm rounded-md py-1 px-2">
                      Restart Chat
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleChat}
                        className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-all"
                      >
                        <X className="w-5 h-5 text-gray-700" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm rounded-md py-1 px-2">
                      Close Chat
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <ChatContainer messages={messages} isTyping={isTyping} className="flex-1 px-8 py-6 overflow-y-auto bg-gradient-to-b from-pink-50 to-lavender-50" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 bg-gradient-to-t from-white/90 to-white/70 border-t border-lavender-200"
              >
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-lavender-300 scrollbar-track-lavender-100"
                    >
                      {SUGGESTION_PROMPTS.map((prompt, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleSuggestionClick(prompt)}
                          className="px-4 py-2 bg-gradient-to-r from-pink-200 to-lavender-200 text-gray-800 rounded-full text-sm font-medium transition-all shadow-sm flex-shrink-0"
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {actionPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 p-4 bg-lavender-100 rounded-lg shadow-sm flex items-center justify-between"
                    >
                      <span className="text-gray-800">
                        {actionPrompt.action === 'createProject'
                          ? `Project "${actionPrompt.details.projectName}" does not exist. Create it?`
                          : actionPrompt.action === 'createTag'
                          ? `Tag "${actionPrompt.details.tagName}" does not exist. Create it?`
                          : `An active timer is running. Stop it?`}
                      </span>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAction(actionPrompt.action, actionPrompt.details)}
                          className="px-4 py-2 bg-gradient-to-r from-pink-400 to-lavender-400 text-white rounded-lg shadow-sm"
                        >
                          Yes
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActionPrompt(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-white/95 rounded-xl shadow-md border border-lavender-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowContextPicker(true)}
                          className="p-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all"
                        >
                          <Paperclip className="w-5 h-5 text-gray-700" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 text-white text-sm rounded-md py-1 px-2">
                        Add context like goals or habits for focused AI responses
                      </TooltipContent>
                    </Tooltip>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      placeholder="Type your message or select a suggestion..."
                      className="flex-1 p-4 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-300 bg-pink-50 text-gray-900 text-base transition-all resize-none h-28"
                    />
                  </div>
                  {context && (
                    <div className="text-sm text-gray-600">
                      Attached: {context.type} - {context.value}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-lavender-400 text-white px-6 py-3 rounded-lg shadow-sm transition-all"
                    >
                      Send
                    </motion.button>
                  </div>
                </div>
              </motion.div>
              {showSettingsModal && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute top-12 right-4 bg-white/50 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-lavender-200 p-6 w-72 max-w-[90vw] z-60"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Settings</h3>
                  <div className="flex border-b border-lavender-200 mb-4">
                    <button
                      onClick={() => setSettingsTab('tone')}
                      className={`flex-1 py-2 text-sm font-medium ${settingsTab === 'tone' ? 'text-lavender-600 border-b-2 border-lavender-600' : 'text-gray-600'}`}
                    >
                      Tone
                    </button>
                    <button
                      onClick={() => setSettingsTab('mentor')}
                      className={`flex-1 py-2 text-sm font-medium ${settingsTab === 'mentor' ? 'text-lavender-600 border-b-2 border-lavender-600' : 'text-gray-600'}`}
                    >
                      Mentor
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {settingsTab === 'tone' && (
                      <motion.div
                        key="tone"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3"
                      >
                        {TONES.map((tone) => (
                          <motion.button
                            key={tone}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToneChange(tone)}
                            className={`p-3 rounded-lg bg-gradient-to-r from-pink-200 to-lavender-200 text-gray-800 font-medium transition-all hover:bg-opacity-80 ${coachData?.tone === tone ? 'ring-2 ring-lavender-300' : ''}`}
                          >
                            {tone}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                    {settingsTab === 'mentor' && (
                      <motion.div
                        key="mentor"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3"
                      >
                        {ARCHETYPES.map((archetype) => (
                          <motion.button
                            key={archetype}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
                              const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)].url;
                              handleMentorChange(name, archetype, avatar);
                            }}
                            className={`p-3 rounded-lg bg-gradient-to-r from-pink-200 to-lavender-200 text-gray-800 font-medium transition-all hover:bg-opacity-80 ${coachData?.archetype === archetype ? 'ring-2 ring-lavender-300' : ''}`}
                          >
                            {archetype}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettingsModal(false)}
                    className="mt-4 w-full text-gray-600 hover:text-gray-800 font-medium bg-pink-100/50 rounded-lg py-2 transition-all hover:bg-pink-200/50"
                  >
                    Close
                  </motion.button>
                </motion.div>
              )}
              {showContextPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute bottom-24 left-6 bg-white/50 backdrop-blur-md rounded-2xl shadow-lg ring-1 ring-lavender-200 p-6 w-72 max-w-[90vw] z-60"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Context</h3>
                  <div className="grid gap-3">
                    {contextOptions.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleContextSelect(option.type, option.value)}
                        className="p-3 rounded-lg bg-gradient-to-r from-pink-200 to-lavender-200 text-gray-800 font-medium transition-all hover:bg-opacity-80 text-left"
                      >
                        {option.type}: {option.value}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowContextPicker(false)}
                    className="mt-4 w-full text-gray-600 hover:text-gray-800 font-medium bg-pink-100/50 rounded-lg py-2 transition-all hover:bg-pink-200/50"
                  >
                    Close
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default FullScreenChat;