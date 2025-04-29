import React, { useState, useEffect, useRef } from 'react';
import { Message, PlannerData, Tone, UserRole, Answer, Goal } from './types/onboarding';
import { ChatContainer } from './UI/ChatContainer';
import ChatBubble from './UI/ChatBubble';
import TypingIndicator from './UI/TypingIndicator';
import RoleSelection from './RoleSelection';
import StepGoals from './goals/StepGoals';
import Personalization from './Personalization';
import StepPlanner from './planner/StepPlanner';
import ProgressBar from './ProgressBar';
import { createMessage } from './utils/onboardingUtils';

interface ChatOnboardingProps {
  onComplete: (data: {
    role: UserRole;
    goals: Goal[];
    answers: Answer[];
    planner: PlannerData;
  }) => void;
}

const ChatOnboarding: React.FC<ChatOnboardingProps> = ({ onComplete }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'complete'>('intro');
  const [previousStep, setPreviousStep] = useState<'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'complete'>('intro');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [plannerData, setPlannerData] = useState<PlannerData>({
    goals: [],
    availability: {
      workHours: { start: '09:00', end: '17:00' },
      dndHours: { start: '22:00', end: '08:00' },
      checkIn: { preferredTime: '09:00', frequency: 'daily' },
      timezone: 'America/New_York',
    },
    notifications: {
      remindersEnabled: true,
    },
    integrations: {
      calendarSync: false,
      taskManagementSync: false,
    },
  });
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (content: string | React.ReactNode, sender: 'user' | 'assistant', delay = 0) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, createMessage(content, sender)]);
        resolve();
      }, delay);
    });
  };

  const simulateTyping = async (duration = 1500) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  const handleIntroductionSelect = async () => {
    await addMessage("Let's start onboarding!", 'user');
    await simulateTyping();
    setCurrentStep('role');
    setPreviousStep('intro');
  };

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    await addMessage(
      <div className="flex items-center gap-2">
        <span>I'm currently a</span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{role}</span>
      </div>,
      'user'
    );
    await simulateTyping();
    await addMessage(
      "Great choice! Let's personalize your experience by selecting your priorities.",
      'assistant',
      300
    );
    setCurrentStep('personalization');
    setPreviousStep('role');
  };

  const handlePersonalizationSelect = async (answers: Answer[]) => {
    setSelectedAnswers(answers);
    await addMessage(
      <div className="flex flex-col gap-2">
        <span>My priorities are:</span>
        {answers.map((answer) => (
          <span key={answer.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {answer.answer}
          </span>
        ))}
      </div>,
      'user'
    );
    await simulateTyping();
    await addMessage(
      "Thanks for sharing! Let's identify which goals you'd like to achieve.",
      'assistant',
      300
    );
    setCurrentStep('goals');
    setPreviousStep('personalization');
  };

  const handleGoalsSelect = async (goals: Goal[]) => {
    setSelectedGoals(goals);
    setPlannerData({ ...plannerData, goals });
    await addMessage(
      <div className="flex flex-col gap-2">
        <span>My goals are:</span>
        {goals.map((goal) => (
          <span key={goal.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {goal.title}
          </span>
        ))}
      </div>,
      'user'
    );
    await simulateTyping();
    await addMessage(
      "Awesome goals! Let's set up your planner to achieve them.",
      'assistant',
      300
    );
    setCurrentStep('planner');
    setPreviousStep('goals');
  };

  const handlePlannerSubmit = async () => {
    await addMessage(
      <div className="flex flex-col gap-2">
        <span>My planner is set up with {plannerData.goals.length} goals.</span>
        {plannerData.goals.map((goal) => (
          <span key={goal.id} className="text-sm">Goal: {goal.title} ({goal.whyItMatters || 'No reason specified'})</span>
        ))}
        <span>Availability: {plannerData.availability.workHours.start} - {plannerData.availability.workHours.end}</span>
        <span>Reminders: {plannerData.notifications.remindersEnabled ? 'Enabled' : 'Disabled'}</span>
      </div>,
      'user'
    );
    await simulateTyping();
    await addMessage(
      "You're all set to start your journey!",
      'assistant',
      300
    );
    setCurrentStep('complete');
    setPreviousStep('planner');
    onComplete({
      role: selectedRole!,
      goals: plannerData.goals,
      answers: selectedAnswers,
      planner: plannerData,
    });
  };

  const handleBack = () => {
    if (currentStep === 'role') {
      setCurrentStep('intro');
      setPreviousStep('intro');
    } else if (currentStep === 'personalization') {
      setCurrentStep('role');
      setPreviousStep('intro');
    } else if (currentStep === 'goals') {
      setCurrentStep('personalization');
      setPreviousStep('role');
    } else if (currentStep === 'planner') {
      setCurrentStep('goals');
      setPreviousStep('personalization');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      await simulateTyping(1000);
      if (!isMounted) return;
      await addMessage(
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">Welcome to AlterEgo</h2>
          <p className="text-gray-600">Ready to become your best self? Let's begin!</p>
        </div>,
        'assistant'
      );
      setCurrentStep('intro');
      setPreviousStep('intro');
    };
    initialize();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="p-4">
        <ProgressBar currentStep={currentStep} tone={null} />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ChatContainer messages={messages} isTyping={isTyping}>
          {!isTyping && currentStep !== 'complete' && (
            <div className="mx-auto max-w-2xl w-full my-6 px-4">
              {currentStep === 'intro' && (
                <ChatBubble isUser={true}>
                  <button
                    onClick={handleIntroductionSelect}
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Start Onboarding
                  </button>
                </ChatBubble>
              )}
              {currentStep === 'role' && <RoleSelection onSelect={handleRoleSelect} />}
              {currentStep === 'personalization' && (
                <Personalization
                  userRole={selectedRole}
                  onSelect={handlePersonalizationSelect}
                  onBack={handleBack}
                />
              )}
              {currentStep === 'goals' && (
                <StepGoals
                  selectedGoals={selectedGoals}
                  userRole={selectedRole}
                  onSelect={handleGoalsSelect}
                />
              )}
              {currentStep === 'planner' && (
                <StepPlanner
                  plannerData={plannerData}
                  onUpdatePlanner={setPlannerData}
                  onSubmit={handlePlannerSubmit}
                  setChatHistory={setChatHistory}
                  errors={{}}
                  tone={null}
                />
              )}
            </div>
          )}
        </ChatContainer>
      </div>
    </div>
  );
};

export default ChatOnboarding;