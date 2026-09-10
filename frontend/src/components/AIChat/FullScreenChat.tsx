import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatContainer } from '../Onboarding/UI/ChatContainer';
import { useChat } from './ChatContext';
import {
  X,
  RefreshCw,
  Settings,
  Paperclip,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Lightbulb,
  Send,
} from 'lucide-react';
import { Message, MentorArchetype, CoachingStyle, AVATARS, RANDOM_NAMES } from '../Onboarding/utils/onboardingUtils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../Calendar_updated/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/toast';
import { useAuth } from '../../context/AuthContext';
import { formatMinutesAsHoursMinutes } from '../../utils/utils';

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

const formatActionDuration = (duration?: number | null): string =>
  formatMinutesAsHoursMinutes(Math.max(0, Math.round(Number(duration ?? 0))));

const FullScreenChat: React.FC = () => {
  const { isChatOpen, toggleChat, messages, addMessage, clearMessages, isTyping, setIsTyping } = useChat();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();
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
  const [isDocked, setIsDocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('alterego_chat_docked') === '1';
    } catch {
      return false;
    }
  });
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const hasFetchedCoachData = useRef(false);
  const isSendingRef = useRef(false);
  const lastCommandRef = useRef('');

  useEffect(() => {
    const fetchCoachData = async () => {
      if (hasFetchedCoachData.current) return;
      try {
        if (!token) {
          toast({
            title: 'Signed out',
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
              title: 'No setup found',
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
    lastCommandRef.current = normalizedInput;

    try {
      if (!token) {
        toast({
          title: 'Signed out',
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
        additionalContent: ''
      });
      if (data.requiresAction && data.actionDetails?.action) {
        setActionPrompt({ action: data.actionDetails.action, details: data.actionDetails, originalCommand: normalizedInput });
      } else {
        setActionPrompt(null);
      }
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
      if (!token) {
        toast({
          title: 'Signed out',
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
          setInput(`Log ${formatActionDuration(details.duration)} for ${actionPrompt?.originalCommand || ''}`);
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
            description: details.description || 'Untitled',
            startTime,
            endTime,
            projectId,
            tagIds,
            billable: false,
            positionTop: '',
            positionLeft: ''
          };
          successMessage = `Time entry "${details.description || 'Untitled'}" created for ${formatActionDuration(details.duration)}${projectId ? ` with project "${details.projectName}" (ID: ${projectId})` : ''}${tagIds.length ? ` and tags "${tagNames.join(', ')}"` : ''}.`;
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

  const toggleDocked = () => {
    setIsDocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('alterego_chat_docked', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleRetry = () => {
    if (lastCommandRef.current && !isSendingRef.current) {
      void sendMessage(lastCommandRef.current);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setShowSuggestions(false);
  };

  const handleToneChange = async (tone: CoachingStyle) => {
    setCoachData((prev) => prev ? { ...prev, tone } : prev);
    try {
      if (!token) {
        toast({
          title: 'Signed out',
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
      if (!token) {
        toast({
          title: 'Signed out',
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
    { type: 'Milestone', value: 'Loading' },
    { type: 'Milestone', value: 'Clearing' },
    { type: 'Habit', value: 'Daily job applications' }
  ];

  const actionPromptMessage = actionPrompt
    ? actionPrompt.action === 'createProject'
      ? `Project "${actionPrompt.details.projectName}" does not exist. Create it?`
      : actionPrompt.action === 'createTag'
      ? `Tag "${actionPrompt.details.tagName}" does not exist. Create it?`
      : actionPrompt.action === 'stopTimer'
      ? `Stop the active timer for "${actionPrompt.details.description}" (ID: ${actionPrompt.details.timerId})?`
      : actionPrompt.action === 'provideDescription'
      ? `Please provide a description for the time entry.`
      : actionPrompt.action === 'confirmTimeEntry'
      ? `Confirm time entry: "${actionPrompt.details.description}" from ${actionPrompt.details.startTime}${(actionPrompt.details.duration ?? 0) > 0 ? ` for ${formatActionDuration(actionPrompt.details.duration)}` : ''}${actionPrompt.details.projectName ? ` with project "${actionPrompt.details.projectName}"` : ''}${actionPrompt.details.tagNames?.length ? ` and tags "${actionPrompt.details.tagNames.join(', ')}"` : ''}. Proceed or modify?`
      : actionPrompt.action === 'confirmProjectCreation'
      ? `Confirm creation of project "${actionPrompt.details.projectName}"${actionPrompt.details.description ? ` (Description: ${actionPrompt.details.description})` : ''}?`
      : actionPrompt.action === 'confirmProjectUpdate'
      ? `Confirm update of project "${actionPrompt.details.projectName}"${actionPrompt.details.description ? ` (Description: ${actionPrompt.details.description})` : ''}?`
      : actionPrompt.action === 'confirmProjectDeletion'
      ? `Confirm deletion of project "${actionPrompt.details.projectName}"?`
      : `Action required: ${actionPrompt.action}`
    : '';

  const canRetry = messages.length > 0 && !isTyping && lastCommandRef.current.length > 0;

  const iconButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

  // Non-docked: `inset-0 m-auto` + fixed size centres without a CSS transform,
  // so framer-motion's y/scale animation doesn't fight the positioning.
  const panelClass = isDocked
    ? 'fixed bottom-4 right-4 z-50 flex h-[72vh] max-h-[720px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl'
    : 'fixed inset-0 z-50 m-auto flex h-[90dvh] max-h-[820px] w-[95vw] max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl';

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isChatOpen && (
          <>
            {!isDocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={toggleChat}
                className="fixed inset-0 z-40 bg-black/50"
                aria-hidden="true"
              />
            )}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-label="Chat"
              className={panelClass}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {isAvatarLoading || !coachData ? (
                    <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  ) : (
                    <img
                      src={coachData.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full border border-border object-cover"
                      onError={(e) => (e.currentTarget.src = '/avatars/default.svg')}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {coachData?.name || 'Coach'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {coachData?.tone || 'Friendly'} {coachData?.archetype || 'Guide'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={toggleDocked} className={iconButtonClass} aria-label={isDocked ? 'Expand chat' : 'Dock chat'}>
                        {isDocked ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{isDocked ? 'Expand' : 'Dock to corner'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button ref={settingsButtonRef} type="button" onClick={() => setShowSettingsModal(true)} className={iconButtonClass} aria-label="Chat settings">
                        <Settings className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Customize</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={handleRestartChat} className={iconButtonClass} aria-label="Restart chat">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>New chat</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={toggleChat} className={iconButtonClass} aria-label="Close chat">
                        <X className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <ChatContainer
                messages={messages}
                isTyping={isTyping}
                className="flex-1 overflow-y-auto bg-background px-4 py-4 sm:px-6"
                coachAvatar={coachData?.avatar || '/avatars/default.svg'}
              />

              <div className="border-t border-border bg-card p-3 sm:p-4">
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 flex gap-2 overflow-x-auto pb-1"
                    >
                      {SUGGESTION_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSuggestionClick(prompt)}
                          className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {prompt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {actionPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 flex flex-col gap-3 rounded-lg border border-border border-l-4 border-l-primary bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm font-medium text-surface-foreground">{actionPromptMessage}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {actionPrompt.action === 'confirmTimeEntry' ? (
                          <>
                            <button
                              type="button"
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Create project / tag
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(actionPrompt.action, actionPrompt.details, true)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirm
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAction(actionPrompt.action, actionPrompt.details)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActionPrompt(null)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {context && (
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                    {context.type}: {context.value}
                    <button type="button" onClick={() => setContext(null)} aria-label="Remove context" className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="mb-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSuggestions((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Examples
                  </button>
                  {canRetry && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setShowContextPicker(true)}
                        aria-label="Attach context"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Attach a goal or habit for a focused reply</TooltipContent>
                  </Tooltip>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Say anything… (Enter to send)"
                    className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showSettingsModal && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-3 top-14 z-[60] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
                >
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Settings</h3>
                  <div className="mb-3 flex border-b border-border">
                    <button
                      type="button"
                      onClick={() => setSettingsTab('tone')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${settingsTab === 'tone' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Tone
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsTab('mentor')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${settingsTab === 'mentor' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Mentor
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {settingsTab === 'tone' && (
                      <motion.div key="tone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 gap-2">
                        {TONES.map((tone) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => handleToneChange(tone)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${coachData?.tone === tone ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-secondary-foreground hover:bg-accent'}`}
                          >
                            {tone}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {settingsTab === 'mentor' && (
                      <motion.div key="mentor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 gap-2">
                        {ARCHETYPES.map((archetype) => (
                          <button
                            key={archetype}
                            type="button"
                            onClick={() => {
                              const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
                              const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)].url;
                              handleMentorChange(name, archetype, avatar);
                            }}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${coachData?.archetype === archetype ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary text-secondary-foreground hover:bg-accent'}`}
                          >
                            {archetype}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="mt-3 w-full rounded-lg bg-muted py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Done
                  </button>
                </motion.div>
              )}

              {showContextPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-24 left-3 z-[60] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
                >
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Add context</h3>
                  <div className="grid gap-2">
                    {contextOptions.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleContextSelect(option.type, option.value)}
                        className="rounded-lg border border-border bg-secondary px-3 py-2 text-left text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
                      >
                        {option.type}: {option.value}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContextPicker(false)}
                    className="mt-3 w-full rounded-lg bg-muted py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default FullScreenChat;