import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, PlannerData, UserRole, Answer, Goal, Mentor } from './types/onboarding';
import { ChatContainer } from './UI/ChatContainer';
import ChatBubble from './UI/ChatBubble';
import TypingIndicator from './UI/TypingIndicator';
import RoleSelection from './introduction/RoleSelection';
import StepGoals from './goals/StepGoals';
import Personalization from './introduction/Personalization';
import StepPlanner from './planner/StepPlanner';
import ProgressBar from './UI/ProgressBar';
import { createMessage } from './utils/onboardingUtils';
import StepMentor from './Mentor/MentorComponent';
import { ChildProcess } from 'node:child_process';

interface ChatOnboardingProps {
  onComplete: (data: {
    role: UserRole;
    goals: Goal[];
    answers: Answer[];
    mentor: Mentor;
    planner: PlannerData;
  }) => void;
}

const ChatOnboarding: React.FC<ChatOnboardingProps> = ({ onComplete }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'mentor' | 'complete'>('intro');
  const [previousStep, setPreviousStep] = useState<'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'mentor' | 'complete'>('intro');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Answer[]>([]);
  const [selectedMentor, setMentor] = useState<Mentor | null>(null);
  const [coachAvatar, setCoachAvatar] = useState<string>(''); // Added for avatar
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
    setCurrentStep('role');
    await addMessage("Let's start onboarding!", 'user');
    await simulateTyping();
    await addMessage("Let's begin by selecting your role.", 'assistant', 300);
    setPreviousStep('intro');
  };

  const handleRoleSelect = async (role: UserRole) => {
    setCurrentStep('personalization');
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
    setPreviousStep('role');
  };

  const handlePersonalizationSelect = async (answers: Answer[]) => {
    setCurrentStep('goals');
    setSelectedAnswers(answers);
    await addMessage(
      <div className="flex flex-col gap-2">
        <span>My priorities are:</span>
        {answers.map((answer) => (
          <div key={answer.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            <span className="font-semibold">{answer.answer}</span>: {answer.description}
          </div>
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
    setPreviousStep('personalization');
  };

  const handleGoalsUpdate = (goals: Goal[]) => {
    setSelectedGoals(goals);
    setPlannerData({ ...plannerData, goals });
  };

  const handleGoalsSelect = async (goals: Goal[]) => {
    setCurrentStep('planner');
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
    setPreviousStep('goals');
  };

  const handlePlannerSubmit = async () => {
    setCurrentStep('mentor');
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
      "Great! Now, let’s meet your AI Alter Ego!",
      'assistant',
      300
    );
    setPreviousStep('planner');
  };

  const handleMentorSelect = async (selectedMentor: Mentor) => {
    setMentor(selectedMentor);
    setCoachAvatar(selectedMentor.avatar);
    await addMessage(
      <div className="flex flex-col gap-2">
        <span>My AI AlterEgo:</span>
        <span className="bg-[#a8d8ea] text-white px-2 py-1 rounded-full text-sm">
          {selectedMentor.name} ({selectedMentor.archetype}, {selectedMentor.style})
        </span>
      </div>,
      'user'
    );
    await simulateTyping();
    await addMessage(
      "Your 'AI Alter Ego' is ready, Let's try it out!",
      'assistant',
      300
    );

    // Construct OnboardingData
    const onboardingData: any = {
      role: selectedRole!,
      goals: plannerData.goals,
      answers: selectedAnswers,
      mentor: selectedMentor,
      preferredTone: selectedMentor.style,
      coachAvatar: selectedMentor.avatar,
      schedule: plannerData.availability,
      planner: plannerData,
    };

    // Send to backend
    try {
      console.log('Sending payload:', JSON.stringify(onboardingData, null, 2));
      const response = await fetch('/api/onboarding/onboardNewUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit onboarding data: ${response.statusText}`);
      }

      console.log('Onboarding data submitted successfully');
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      // Optionally show error to user (e.g., toast)
    }

    setCurrentStep('complete');
    setPreviousStep('mentor');
    onComplete({
      role: selectedRole!,
      goals: plannerData.goals,
      answers: selectedAnswers,
      planner: plannerData,
      mentor: selectedMentor,
    });
  };

  const handleBack = async () => {
    if (currentStep === 'role') {
      await simulateTyping();
      await addMessage(
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">Welcome to AlterEgo</h2>
          <p className="text-gray-600">Ready to become your best self? Let's begin!</p>
        </div>,
        'assistant'
      );
      setCurrentStep('intro');
      setPreviousStep('intro');
    } else if (currentStep === 'personalization') {
      await simulateTyping();
      await addMessage("Let's begin by selecting your role.", 'assistant', 300);
      setCurrentStep('role');
      setPreviousStep('intro');
      setSelectedAnswers([]);
    } else if (currentStep === 'goals') {
      await simulateTyping();
      await addMessage(
        "Let's personalize your experience by selecting your priorities.",
        'assistant',
        300
      );
      setCurrentStep('personalization');
      setPreviousStep('role');
      setSelectedGoals([]);
      setPlannerData({ ...plannerData, goals: [] });
    } else if (currentStep === 'planner') {
      await simulateTyping();
      await addMessage(
        "Let's identify which goals you'd like to achieve.",
        'assistant',
        300
      );
      setCurrentStep('goals');
      setPreviousStep('personalization');
    } else if (currentStep === 'mentor') {
      await simulateTyping();
      await addMessage(
        "Awesome goals! Let's set up your planner to achieve them.",
        'assistant',
        300
      );
      setCurrentStep('planner');
      setPreviousStep('goals');
      setMentor(null);
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
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="p-4 z-20">
        <ProgressBar currentStep={currentStep} tone={null} />
      </div>
      <div className="flex-1 overflow-auto relative">
        <ChatContainer messages={messages} isTyping={isTyping} className="pb-32 min-h-full" coachAvatar="">
          <AnimatePresence mode="wait">
            {!isTyping && currentStep !== 'complete' && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-2xl w-full my-6 px-4"
              >
                {currentStep === 'intro' && (
                  <ChatBubble isUser={true}>
                    <div className="flex justify-end">
                      <button
                        onClick={handleIntroductionSelect}
                        className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Start Onboarding
                      </button>
                    </div>
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
                    onUpdateGoals={handleGoalsUpdate}
                    onBack={handleBack}
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
                    onBack={handleBack}
                  />
                )}
                {currentStep === 'mentor' && (
                  <StepMentor onSelect={handleMentorSelect} onBack={handleBack} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ChatContainer>
      </div>
      <motion.div
        key="input"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 left-0 right-0 z-10"
      >
        <div className="mx-auto max-w-2xl px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <textarea
              placeholder={currentStep === 'complete' ? 'Type your message...' : 'Complete onboarding to start chatting...'}
              disabled={currentStep !== 'complete'}
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 text-gray-900 text-base transition-all duration-200 resize-none h-20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              disabled={currentStep !== 'complete'}
              className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatOnboarding;