import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MentorSelection from './Mentor/MentorSelection';
import RoleSelection from './RoleSelection';
import Personalization from './Personalization';
import StepGoals from './GoalDefination';
import AICoachCreation from './AICoachCreation';
import CoachIntroduction from './CoachIntroduction';
import CoachWelcome from './CoachWelcome';
import LoadingScreen from './loading/LoadingScreen';
import StepIntroduction from './Introduction';
import { ChatBubbleProps, Goal } from './types/onboarding';

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatBubbleProps[]>([]);
  const [userData, setUserData] = useState({
    role: '' as 'student' | 'professional' | 'freelancer' | 'other' ,
    traits: [] as string[],
    goals: [] as string[],
    mentorType: '',
    coachName: '',
    preferredTone: 'friendly',
    coachAvatar: ''
  });

  const steps = [
    { component: StepIntroduction, name: 'Welcome' },
    { component: RoleSelection, name: 'Role' },
    { component: MentorSelection, name: 'Mentor' },
    { component: StepGoals, name: 'Goals' },
    { component: Personalization, name: 'Personalization' },
    { component: AICoachCreation, name: 'Creation' },
    { component: CoachIntroduction, name: 'Introduction' },
    { component: CoachWelcome, name: 'Completion' }
  ];

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const updateUserData = (newData: Partial<typeof userData>) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case 0:
        return <StepIntroduction handleNext={handleNext} setChatHistory={setChatHistory} />;

      case 1:
        return (
          <RoleSelection
            onSelectRole={(role) => updateUserData({ role })}
            nextStep={handleNext}
          />
        );

        case 2: // Mentor Selection
        return (
          <MentorSelection
            onSelect={(mentorType) => {
              updateUserData({ mentorType });
              handleNext();
            }}
          />
        );

        case 3: // Goals
        return (
          <StepGoals
            handleNext={handleNext}
            handleBack={handleBack}
            userGoals={userData.goals}
            setUserGoals={(goals) => updateUserData({ goals })}
            setChatHistory={setChatHistory}
          />
        );

      case 4:
        return (
          <MentorSelection
            onSelect={(mentorType) => {
              updateUserData({ mentorType });
              handleNext();
            }}
          />
        );

      case 5:
        return <AICoachCreation nextStep={handleNext} />;

      case 6:
        return (
          <CoachIntroduction
            coachName={userData.coachName}
            preferredTone={userData.preferredTone}
            userGoals={userData.goals}
            handleNext={handleNext}
            coachAvatar={userData.coachAvatar}
            setChatHistory={setChatHistory}
            chatHistory={chatHistory}
          />
        );

      case 7:
        return (
          <CoachWelcome
            nextStep={handleNext}
            goal={{
              id: 'user-goal',
              title: userData.goals[0] || '',
              description: '',
              category: 'personal-growth',
              connections: []
            }}
          />
        );

      default:
        return <LoadingScreen onComplete={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto min-h-screen flex flex-col"
        >
          {/* Progress Indicator */}
          <div className="p-6">
            <div className="flex gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              />
            ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            {getStepComponent()}
          </div>

          {/* Navigation Controls */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                Back
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;