import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatContainer } from '../Onboarding/UI/ChatContainer';
import { useChat } from './ChatContext';
import { X, RefreshCw, Settings, Paperclip, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { Message, MentorArchetype, CoachingStyle, AVATARS, RANDOM_NAMES } from '../Onboarding/utils/onboardingUtils';
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

const TONES: CoachingStyle[] = ['Direct', 'Friendly', 'Encouraging', 'Nurturing', 'Patient', 'Challenging'];
const ARCHETYPES: MentorArchetype[] = ['Innovator', 'Sage', 'Challenger', 'Master', 'Guide'];

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface ProjectSummary {
  id: number;
  name: string;
}

interface ActionDetails {
  action?: string;
  projectName?: string;
  tagName?: string;
  timerId?: number;
  description?: string;
  duration?: number;
  startTime?: string;
  projectId?: number | null;
  tagIds?: number[];
  tagNames?: string[];
}

interface ActionPromptState {
  action: string;
  details: ActionDetails;
  originalCommand: string;
}

interface ChatApiResponse {
  message?: string;
  intent?: string;
  requiresAction?: boolean;
  actionDetails?: ActionDetails;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
};

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
  const [actionPrompt, setActionPrompt] = useState<ActionPromptState | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const hasFetchedCoachData = useRef(false);
  const isSendingRef = useRef(false);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (hasFetchedCoachData.current) return;
      try {
        const token = sessionStorage.getItem('auth_session');
        if (!token) {
          toast({
            title: 'Session Expired',
            description: 'Please log in to continue.',
            variant: 'destructive',
          });
          navigate('/login');
          return;
        }
        const response = await fetch('/api/onboarding/getOnboardingData', {
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
          archetype: data.archetype || 'Guide',
          goals: data.goals || [],
        });
        hasFetchedCoachData.current = true;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        console.error('Failed to fetch coach data:', error);
        toast({
          title: 'Error',
          description: `Failed to load your profile: ${errorMessage}. Using default settings.`,
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

    if (isChatOpen && !hasFetchedCoachData.current) {
      fetchCoachData();
    }
    return () => {
      if (!isChatOpen) {
        hasFetchedCoachData.current = false;
      }
    };
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

  const normalizeCommand = (command: string): string => {
    // Remove "project", "name", "task description" from commands to avoid misparsing
    return command
      .replace(/\b(project|name|task description:?)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const sendMessage = async (commandOverride?: string) => {
    const rawCommand = (commandOverride ?? input).trim();

    if (!rawCommand || isSendingRef.current) {
      return;
    }

    const normalizedInput = normalizeCommand(rawCommand);
    if (!normalizedInput) {
      return;
    }

    isSendingRef.current = true;
    const selectedContext = commandOverride ? null : context;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: normalizedInput,
      sender: 'user',
      isRendered: true,
      timestamp: new Date(),
      additionalContent: selectedContext ? `${selectedContext.type}: ${selectedContext.value}` : ''
    };

    addMessage(newMessage);
    if (!commandOverride) {
      setInput('');
    }
    setContext(null);
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const token = sessionStorage.getItem('auth_session');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      console.log('Sending command:', normalizedInput);
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          command: normalizedInput,
          context: selectedContext || undefined
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status}, Details: ${errorText}`);
      }
      const data: ChatApiResponse = await response.json();
      console.log('Received response:', data);
      addMessage({
        id: Date.now().toString(),
        content: data.message || 'No response from AI',
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: import.meta.env.DEV ? `Intent: ${data.intent || 'UNKNOWN'}` : ''
      });
      if (data.requiresAction && data.actionDetails?.action) {
        setActionPrompt({ action: data.actionDetails.action, details: data.actionDetails, originalCommand: normalizedInput });
      } else {
        setActionPrompt(null);
      }
      toast({
        title: 'Success',
        description: 'Command processed successfully.',
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: `Failed to send message: ${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
      addMessage({
        id: Date.now().toString(),
        content: `Network error: ${errorMessage}. Please try again.`,
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: ''
      });
      setActionPrompt(null);
    } finally {
      setIsTyping(false);
      isSendingRef.current = false;
    }
  };

  const fetchProjectId = async (projectName: string, token: string): Promise<number | null> => {
    try {
      const response = await fetch('/api/projects/userProjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const projects: ProjectSummary[] = await response.json();
      const project = projects.find((p) => p.name === projectName);
      return project ? project.id : null;
    } catch (error) {
      console.error(`Failed to fetch project ID for ${projectName}:`, error);
      return null;
    }
  };

  const fetchTagIds = async (tagNames: string[], token: string): Promise<{ ids: number[]; tags: Tag[] }> => {
    try {
      const response = await fetch('/api/tags', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const tags: Tag[] = await response.json();
      const ids = tagNames
        .map(name => tags.find(t => t.name === name)?.id)
        .filter((id): id is number => id !== undefined);
      return { ids, tags };
    } catch (error) {
      console.error(`Failed to fetch tag IDs for ${tagNames}:`, error);
      return { ids: [], tags: [] };
    }
  };

  const handleAction = async (action: string, details: ActionDetails, confirmWithoutChanges: boolean = false) => {
    try {
      const token = sessionStorage.getItem('auth_session');
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
      let method = 'POST';
      let body: Record<string, unknown> = {};
      let successMessage = '';
      switch (action) {
        case 'createProject': {
          endpoint = '/api/projects';
          body = { name: details.projectName ?? '', color: '#000000', client: '' };
          successMessage = `Project "${details.projectName}" created successfully. Try re-entering your command to apply it.`;
          break;
        }
        case 'createTag': {
          endpoint = '/api/tags';
          body = { name: details.tagName ?? '', color: '#000000' };
          successMessage = `Tag "${details.tagName}" created successfully. Try re-entering your command to apply it.`;
          break;
        }
        case 'stopTimer': {
          endpoint = `/api/timers/${details.timerId}/stop`;
          body = { endTime: new Date().toISOString(), description: details.description || 'Stopped via AI', billable: false };
          successMessage = 'Timer stopped successfully.';
          break;
        }
        case 'adjustDuration': {
          setInput(`Log ${(details.duration ?? 0) / 60} hours for ${actionPrompt?.originalCommand || ''}`);
          setActionPrompt(null);
          return;
        }
        case 'provideDescription': {
          setInput(`Create time entry with description ${details.description || 'task'} ${actionPrompt?.originalCommand || ''}`);
          setActionPrompt(null);
          return;
        }
        case 'confirmTimeEntry': {
          endpoint = '/api/timers/addTimer';
          const currentTime = new Date().toISOString();
          const startTime = details.startTime ? new Date(details.startTime).toISOString() : currentTime;
          const endTime = details.duration
            ? new Date(new Date(startTime).getTime() + details.duration * 60 * 1000).toISOString()
            : currentTime;
          let projectId: number | null = null;
          let tagIds: number[] = [];
          if (!confirmWithoutChanges && details.projectName) {
            projectId = await fetchProjectId(details.projectName, token);
            if (!projectId) throw new Error(`Project "${details.projectName}" not found. Create it with 'create project ${details.projectName}'.`);
          }
          const tagNames = details.tagNames ?? [];
          if (!confirmWithoutChanges && tagNames.length > 0) {
            const { ids, tags } = await fetchTagIds(tagNames, token);
            tagIds = ids;
            if (tagIds.length !== tagNames.length) {
              const missingTags = tagNames.filter((name) => !tags.some((tag) => tag.name === name));
              throw new Error(`Tags not found: ${missingTags.join(', ')}. Create them with 'add tag <name>'.`);
            }
          }
          body = {
            description: details.description || 'Unnamed Task',
            startTime,
            endTime,
            projectId,
            tagIds,
            billable: false,
            positionTop: '',
            positionLeft: ''
          };
          successMessage = `Time entry "${details.description || 'Unnamed Task'}" created for ${details.duration || 0} minutes${projectId ? ` with project "${details.projectName}" (ID: ${projectId})` : ''}${tagIds.length ? ` and tags "${tagNames.join(', ')}"` : ''}.`;
          break;
        }
        case 'confirmProjectCreation': {
          endpoint = '/api/projects';
          body = { name: details.projectName ?? '', color: '#000000', client: details.description || '' };
          successMessage = `Project "${details.projectName}" created successfully.`;
          break;
        }
        case 'confirmProjectUpdate': {
          if (!details.projectName) {
            throw new Error('Project name is required for project update');
          }
          const project = await fetchProjectId(details.projectName, token);
          if (!project) throw new Error(`Project "${details.projectName}" not found`);
          endpoint = `/api/projects/${project}`;
          body = { name: details.projectName, color: '#000000', client: details.description || '' };
          method = 'PUT';
          successMessage = `Project "${details.projectName}" updated successfully.`;
          break;
        }
        case 'confirmProjectDeletion': {
          if (!details.projectName) {
            throw new Error('Project name is required for project deletion');
          }
          const projectToDelete = await fetchProjectId(details.projectName, token);
          if (!projectToDelete) throw new Error(`Project "${details.projectName}" not found`);
          endpoint = `/api/projects/${projectToDelete}`;
          method = 'DELETE';
          body = {};
          successMessage = `Project "${details.projectName}" deleted successfully.`;
          break;
        }
        default:
          return;
      }
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: method === 'DELETE' ? undefined : JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status}, Details: ${errorText}`);
      }
      addMessage({
        id: Date.now().toString(),
        content: successMessage,
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: ''
      });
      toast({
        title: 'Success',
        description: successMessage,
      });
      setActionPrompt(null);
      if (action !== 'confirmTimeEntry' && actionPrompt?.originalCommand) {
        void sendMessage(actionPrompt.originalCommand);
      }
    } catch (error: unknown) {
      const actionErrorMessage = getErrorMessage(error);
      console.error(`Failed to perform ${action}:`, error);
      const errorMessage = `Failed to ${action === 'createProject' || action === 'confirmProjectCreation' ? 'create project' : 
                              action === 'createTag' ? 'create tag' : 
                              action === 'stopTimer' ? 'stop timer' : 
                              action === 'confirmProjectUpdate' ? 'update project' : 
                              action === 'confirmTimeEntry' ? 'create time entry' : 
                              'delete project'}: ${actionErrorMessage}`;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      addMessage({
        id: Date.now().toString(),
        content: errorMessage,
        sender: 'assistant',
        isRendered: true,
        timestamp: new Date(),
        additionalContent: ''
      });
      setActionPrompt(null);
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
      const token = sessionStorage.getItem('auth_session');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      const response = await fetch('/api/onboarding/updateTone', {
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
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to update tone:', error);
      toast({
        title: 'Error',
        description: `Failed to update tone: ${errorMessage}.`,
        variant: 'destructive',
      });
    }
  };

  const handleMentorChange = async (name: string, archetype: MentorArchetype, avatar: string) => {
    setCoachData((prev) => prev ? { ...prev, name, archetype, avatar } : prev);
    try {
      const token = sessionStorage.getItem('auth_session');
      if (!token) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      const response = await fetch('/api/onboarding/updateMentor', {
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
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to update mentor:', error);
      toast({
        title: 'Error',
        description: `Failed to update mentor: ${errorMessage}.`,
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
              className="relative flex h-[92dvh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-xl bg-gradient-to-br from-pink-100 to-lavender-100 shadow-2xl sm:h-[90vh] sm:w-full sm:rounded-2xl"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lavender-200 bg-gradient-to-r from-white/30 to-white/10 p-3 sm:p-4">
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
                  <h2 className="max-w-[12rem] truncate text-base font-bold text-gray-800 sm:max-w-none sm:text-xl">
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
              <ChatContainer
                messages={messages}
                isTyping={isTyping}
                className="flex-1 overflow-y-auto bg-gradient-to-b from-pink-50 to-lavender-50 px-3 py-3 sm:px-8 sm:py-6"
                coachAvatar={coachData?.avatar || '/avatars/default.svg'}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-lavender-200 bg-gradient-to-t from-white/90 to-white/70 p-3 sm:p-6"
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
                      className="mb-4 flex flex-col gap-3 rounded-lg border-l-4 border-lavender-400 bg-lavender-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-lavender-600" />
                        <span className="text-gray-800 font-medium">
                          {actionPrompt.action === 'createProject'
                            ? `Project "${actionPrompt.details.projectName}" does not exist. Create it?`
                            : actionPrompt.action === 'createTag'
                            ? `Tag "${actionPrompt.details.tagName}" does not exist. Create it?`
                            : actionPrompt.action === 'stopTimer'
                            ? `Stop the active timer for "${actionPrompt.details.description}" (ID: ${actionPrompt.details.timerId})?`
                            : actionPrompt.action === 'provideDescription'
                            ? `Please provide a description for the time entry.`
                            : actionPrompt.action === 'confirmTimeEntry'
                            ? `Confirm time entry: "${actionPrompt.details.description}" from ${actionPrompt.details.startTime}${(actionPrompt.details.duration ?? 0) > 0 ? ` for ${actionPrompt.details.duration} minutes` : ''}${actionPrompt.details.projectName ? ` with project "${actionPrompt.details.projectName}"` : ''}${actionPrompt.details.tagNames?.length ? ` and tags "${actionPrompt.details.tagNames.join(', ')}"` : ''}. Proceed or modify?`
                            : actionPrompt.action === 'confirmProjectCreation'
                            ? `Confirm creation of project "${actionPrompt.details.projectName}"${actionPrompt.details.description ? ` (Description: ${actionPrompt.details.description})` : ''}?`
                            : actionPrompt.action === 'confirmProjectUpdate'
                            ? `Confirm update of project "${actionPrompt.details.projectName}"${actionPrompt.details.description ? ` (Description: ${actionPrompt.details.description})` : ''}?`
                            : actionPrompt.action === 'confirmProjectDeletion'
                            ? `Confirm deletion of project "${actionPrompt.details.projectName}"?`
                            : `Action required: ${actionPrompt.action}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actionPrompt.action === 'confirmTimeEntry' ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (actionPrompt.details.projectName && !actionPrompt.details.projectId) {
                                  setActionPrompt({
                                    ...actionPrompt,
                                    action: 'createProject',
                                    details: { projectName: actionPrompt.details.projectName }
                                  });
                                } else if (actionPrompt.details.tagNames?.length && !actionPrompt.details.tagIds?.length) {
                                  setActionPrompt({
                                    ...actionPrompt,
                                    action: 'createTag',
                                    details: { tagName: actionPrompt.details.tagNames[0] }
                                  });
                                }
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-pink-400 to-lavender-400 text-white rounded-lg shadow-sm flex items-center gap-2"
                            >
                              <PlusCircle className="w-4 h-4" />
                              Create Project/Tag
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAction(actionPrompt.action, actionPrompt.details, true)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-lg shadow-sm flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAction(actionPrompt.action, actionPrompt.details)}
                            className="px-4 py-2 bg-gradient-to-r from-pink-400 to-lavender-400 text-white rounded-lg shadow-sm flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActionPrompt(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-white/95 rounded-xl shadow-md border border-lavender-200 p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                      className="h-24 resize-none rounded-lg border border-lavender-200 bg-pink-50 p-4 text-base text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-lavender-300 sm:h-28 sm:flex-1"
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
                      onClick={() => {
                        void sendMessage();
                      }}
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
                  className="absolute right-2 top-12 z-60 w-[min(20rem,calc(100vw-1rem))] rounded-2xl bg-white/50 p-4 shadow-lg ring-1 ring-lavender-200 backdrop-blur-md sm:right-4 sm:p-6"
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
                  className="absolute bottom-20 left-2 z-60 w-[min(20rem,calc(100vw-1rem))] rounded-2xl bg-white/50 p-4 shadow-lg ring-1 ring-lavender-200 backdrop-blur-md sm:left-6 sm:p-6"
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