
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Sparkles, X, Check, Bot, Volume2, Hourglass, Loader } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../lib/analytics';

type AIError = {
  type: 'network' | 'parsing' | 'auth' | 'validation';
  message: string;
  recoverable: boolean;
};

type ConversationState = {
  step: number;
  context: object;
  requiredFields: string[];
};

type ActionPayload = {
  action: string;
  payload: any;
  confirmationQuestion?: string;
};

interface VoiceAIModeProps {
  onProcessingStart?: () => void;
  onProcessingEnd?: (success: boolean) => void;
  onActivityLog?: (activity: string) => void;
  className?: string;
  activeTimer?: boolean;
  selectedProjectId?: string;
}

const FILTERED_WORDS = ['password', 'credit card'];
const DEBOUNCE_TIME = 500;

const VoiceAIMode: React.FC<VoiceAIModeProps> = ({ 
  onProcessingStart,
  onProcessingEnd,
  onActivityLog,
  className,
  activeTimer,
  selectedProjectId
}) => {
    // const { user } = useAuth();
    const { isAuthenticated } = useAuth();
    const [aiStatus, setAiStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [error, setError] = useState<AIError | null>(null);
    const [voiceFeedback, setVoiceFeedback] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null);
    const [conversation, setConversation] = useState<ConversationState | null>(null);
    const [projectConfirmation, setProjectConfirmation] = useState<{
      required: boolean;
      projectName: string;
      tempCommand: string;
    }>({ required: false, projectName: '', tempCommand: '' });
    
    const abortController = useRef(new AbortController());
    const timeoutRef = useRef<number>();

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Analytics
    useEffect(() => {
      if (isAuthenticated) {
        trackEvent('AI Component Mounted');
      }
    }, [isAuthenticated]);

    const handleFollowUp = useCallback((input: string) => {
        if (!conversation) return;
        
        setConversation(prev => {
          if (!prev) return null;
          
          const newContext = { 
            ...prev.context, 
            [prev.requiredFields[prev.step]]: input 
          };
          
          return {
            ...prev,
            context: newContext,
            step: prev.step + 1
          };
        });
      }, [conversation]);

    // Enhanced error classification
  const classifyError = useCallback((err: unknown): AIError => {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { type: 'network', message: 'Request aborted', recoverable: true };
    }
    if (err instanceof Error) {
      if (err.message.includes('401')) return { type: 'auth', message: 'Session expired', recoverable: false };
      if (err.message.includes('validation')) return { type: 'validation', message: err.message, recoverable: true };
      return { type: 'network', message: err.message, recoverable: true };
    }
    return { type: 'parsing', message: 'Unknown error', recoverable: false };
  }, []);
  // Security: Input sanitization
  const sanitizeInput = useCallback((text: string) => {
    let sanitized = text;
    FILTERED_WORDS.forEach(word => {
      sanitized = sanitized.replace(new RegExp(word, 'gi'), '****');
    });
    return sanitized;
  }, []);

  // Performance: Debounced processing
  const DEBOUNCE_TIME = 1000; // Increased from 500ms

// Modify the processing useEffect
  useEffect(() => {
      if (!transcript) return;

      const handler = setTimeout(() => {
          const cleanText = sanitizeInput(transcript);
          setVoiceFeedback("Processing your command...");
          sendToAI(cleanText);
          resetTranscript();
      }, DEBOUNCE_TIME);

      return () => clearTimeout(handler);
  }, [transcript]);

  const trackEvent = useCallback((event: string, metadata?: object) => {
    if (process.env.NODE_ENV === 'production') {
      analytics.track(event, metadata);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!isAuthenticated) {
      setError({ type: 'auth', message: 'Please login to use voice commands', recoverable: false });
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
      resetTranscript(); // Reset transcript
      setIsAnimating(false);
      setVoiceFeedback(''); // Clear feedback
    } else {
      abortController.current.abort();
      abortController.current = new AbortController();
      setError(null);
      setVoiceFeedback("Listening...");
      setIsAnimating(true);
      onProcessingStart?.();
      trackEvent('Voice Command Started');
      SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
    }
  }, [isAuthenticated, listening, onProcessingStart, trackEvent, resetTranscript]);

  // const executePendingAction = useCallback(async () => {
  //   if (!pendingAction) return;

  //   try {
  //     setRequiresConfirmation(false);
  //     setAiStatus('processing');
      
  //     const response = await fetch('/api/time-entries', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(pendingAction.payload),
  //     });

  //     if (!response.ok) throw new Error('Action failed');
      
  //     onActivityLog?.(`Confirmed: ${pendingAction.payload.taskDescription}`);
  //     setAiStatus('success');
  //     setPendingAction(null);
  //   } catch (err) {
  //     setError(classifyError(err));
  //   }
  // }, [pendingAction, onActivityLog]);

  const cancelAction = useCallback(() => {
    setRequiresConfirmation(false);
    setPendingAction(null);
    setVoiceFeedback('Action cancelled');
    setTimeout(() => setVoiceFeedback(''), 2000);
  }, []);
  
  
  
  const handleProjectConfirmation = async (confirmed: boolean) => {
    if (confirmed) {
      // Create the project
      await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({
          name: projectConfirmation.projectName,
          color: '#4f46e5' // Default color
        })
      });
      // Retry original command
      sendToAI(projectConfirmation.tempCommand);
    }
    setProjectConfirmation({ required: false, projectName: '', tempCommand: '' });
    window.dispatchEvent(new Event('projectUpdated'));
  };
  const sendToAI = useCallback(async (text: string) => {
    try {
      setAiStatus('processing');
      trackEvent('Voice Command Received', { length: text.length });
      onActivityLog?.(`Processing: "${text}"`);

      const context = {
        activeTimer,
        selectedProjectId,
        timeOfDay: new Date().getHours()
      };

      const response = await fetch('/api/ai/parseCommand', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({ 
          command: text,
          context: {
            activeTimer,
            selectedProjectId,
            timeOfDay: new Date().getHours()
          }
        }),
        signal: abortController.current.signal
      });
  
      const data = await response.json();
      
      // Handle project creation requirement
      if (data.requiresProjectCreation) {
        setProjectConfirmation({
          required: true,
          projectName: data.projectName,
          tempCommand: text
        });
        setVoiceFeedback(`Create project "${data.projectName}" first?`);
        return;
      }  

      trackEvent('AI Action Executed', { action: data.action });
      onActivityLog?.(`Action: ${data.action} (${text})`);
      
      if (data.action === 'createEntry') {
        await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.payload),
        });
      }

      setAiStatus('success');
      setVoiceFeedback(data.confirmationText || 'Action completed!');
      setTimeout(() => setVoiceFeedback(''), 2000);
      onProcessingEnd?.(true);

    } catch (err) {
      const error = classifyError(err);
      setError(error);
      trackEvent('AI Error', { error: error.message });
      
      if(error.recoverable) {
        setVoiceFeedback("Oops! Please try that again");
        setTimeout(() => {
          setError(null);
          setVoiceFeedback('');
        }, 3000);
      }
      
      onProcessingEnd?.(false);
    } finally {
      setIsAnimating(false);
    }
  }, [activeTimer, selectedProjectId, trackEvent, onActivityLog, onProcessingEnd]);

  // Accessibility: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleListening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className={`bg-red-50 p-4 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <X className="w-5 h-5" />
          Browser does not support speech recognition
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold">AI Time Assistant</h2>
            <p className="text-sm text-gray-500">{voiceFeedback}</p>
          </div>
        </div>
        
        <button
          onClick={toggleListening}
          aria-label={listening ? 'Stop listening' : 'Start voice command'}
          aria-live="polite"
          disabled={!isAuthenticated}
          className={`p-3 rounded-full transition-all transform ${
            listening 
              ? 'bg-red-500 hover:bg-red-600 scale-110' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          } shadow-lg hover:shadow-xl disabled:opacity-50`}
        >
          {listening ? (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
              </div>
            </div>
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-center">
        <div className={`voice-feedback-pulse ${isAnimating ? 'animate-pulse' : ''}`}>
          {aiStatus === 'processing' ? (
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          ) : (
            <Mic className="w-8 h-8 text-purple-600" />
          )}
        </div>
      </div>

      {projectConfirmation.required && (
        <div className="confirmation-dialog bg-white p-4 rounded-lg mb-4">
          <p className="text-gray-700 mb-3">{voiceFeedback}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleProjectConfirmation(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Confirm Create
            </button>
            <button
              onClick={() => handleProjectConfirmation(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-100 animate-shake">
          <div className="flex items-center space-x-2 text-red-600">
            <X className="w-4 h-4" />
            <div>
              <p>{error.message}</p>
              {error.recoverable && (
                <button 
                  onClick={() => setError(null)}
                  className="text-sm mt-1 text-red-700 hover:underline"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* <div className="space-y-4">
        <div className="p-4 bg-white rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Suggested Commands</h3>
          <div className="grid grid-cols-2 gap-2">
            {smartSuggestions.map((example, i) => (
              <div key={i} className="p-2 text-sm bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                "{example}"
              </div>
            ))}
          </div>
        </div>

        {conversation && (
          <div className="conversation-flow bg-white p-4 rounded-lg">
            {conversation.requiredFields.map((field) => (
              <div key={field} className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => handleFollowUp(e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-white rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activities</h3>
          <div className="space-y-2 h-32 overflow-y-auto">
            {[
              'Started team meeting timer',
              'Logged 1.5h development',
              'Created client call entry'
            ].map((activity, i) => (
              <div key={i} className="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded-md">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default VoiceAIMode;