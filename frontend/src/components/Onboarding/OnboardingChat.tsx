import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentorArchetype, OnboardingData } from '../../types/coaching';
import { Target, Calendar, Settings, User } from 'lucide-react';
import { Answer, Goal, Question, Role } from '../../types/onboarding';
import WelcomeScreen from './WelcomeScreen';
import { WelcomeScreenProps } from './WelcomeScreen';
import RoleSelection from './RoleSelection';
import { RoleSelectionProps } from './RoleSelection';
import Personalization from './Personalization';
import { PersonalizationProps } from './Personalization';
import GoalDefinition from './GoalDefinition';
import AICoachCreation from './AICoachCreation';
import CoachWelcome from './CoachWelcome'; 

interface OnboardingChatProps {
  mentor: MentorArchetype;
  initialGoal: Goal;
  onComplete: (data: OnboardingData) => void;
}

const OnboardingChat: React.FC<OnboardingChatProps> = ({
  mentor,
  initialGoal,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userRole, setUserRole] = useState<Role>('student'); 

  
  const [messages, setMessages] = useState<
    {
      id: string;
      sender: 'user' | 'assistant';
      content: string;
      isRendered: boolean;
      timestamp: Date;
    }[] 
  >([]);

   useEffect(() => {
    if (!userRole) {
      setUserRole('student');
    }
  }, [userRole]);

  const initialGoalData:Goal = { id: 'default', description: '', category: '', connections: []};
  const [goal, setGoal] = useState<Goal>(initialGoalData);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    coachName: '',   
    goal: initialGoal,
    traits: [],
  });

  const steps = [
    {
      title: 'Welcome',
      icon: <User className="w-6 h-6" />,
      options: ['Focus', 'Creativity', 'Discipline', 'Confidence', 'Leadership', 'Adaptability']
    },
    {
      title: 'Schedule',
      icon: <Calendar className="w-6 h-6" />,
      description: 'When would you like to meet?',
      fields: ['preferredTime', 'frequency']
    },
    {
      title: 'Style',
      icon: <Settings className="w-6 h-6" />,
      description: 'How would you like to work together?',
      fields: ['communication', 'feedback', 'pace']
    }
  ];

  const handleTraitToggle = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits?.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...(prev.traits || []), trait]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule!,
        [field]: value
      }
    }));
  };

  const handleStyleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      style: {
        ...prev.style!,
        [field]: value
      }
    }));
  };

   const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData as OnboardingData);
    }
  };

  const handleGoalDefinition = (newGoal: Goal) => {
    setGoal(newGoal);
    handleNext();
  };

  const getPersonalizationQuestions = (): Question[] => {
    switch (userRole) {
      case 'student':
        return [
          {
            text: "How would you like this app to support your learning journey?",
            answers: [
              { id: 'study-reminders', text: "Study reminders" },
              { id: 'assignment-tracking', text: "Assignment tracking" },
              { id: 'test-preparation', text: "Test preparation" },
              { id: 'knowledge-retention', text: "Knowledge retention" },
            ],
          },
        ];
      case 'professional':
        return [
          {
            text: "What aspects of work would you like to improve?",
            answers: [
              { id: 'time-management', text: "Time management" },
              { id: 'project-organization', text: "Project organization" },
              { id: 'work-life-balance', text: "Work-life balance" },
              { id: 'skill-development', text: "Skill development" },
            ],
          },
        ];
      case 'freelancer':
        return [
          {
            text: "What are your key priorities?",
            answers: [
              { id: 'client-management', text: "Client management" },
              { id: 'project-scheduling', text: "Project scheduling" },
              { id: 'income-tracking', text: "Income tracking" },
              { id: 'skill-marketing', text: "Skill marketing" },
            ],
          },
        ];
      case 'other':
        return [
          {
            text: "How would you like this app to help you?",
            answers: [
              { id: 'organization', text: "Organization" },
              { id: 'personal-growth', text: "Personal Growth" },
              { id: 'new-skills', text: "Learn new Skills" },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeScreen
            onStart={() => { console.log('onStart called'); }}
          />
        );
      case 1:
        return (          
          <RoleSelection 
            onSelectRole={(selectedRole: Role) => {
              setUserRole(selectedRole);
              console.log("role selected")
            }}           
            nextStep={() => {
              setCurrentStep(3)
            }}
          /> 
        );
      case 2:
        return (          
          <Personalization
            userRole={userRole}
            nextStep={() => {}}
            previousStep={() => {}}
          />
        );
      case 3:
        return (          
          <GoalDefinition 
            setGoal={(value: any) => {}}
            nextStep={() => {}}           
            previousStep={() => {}}           
          />
        );
        case 4:
        return (
          <AICoachCreation nextStep={() => { console.log('nextStep called'); }}/>
        );

        case 5:
        return (        
          <CoachWelcome          
          goal={{ id: 'default', description: '', category: '', connections: []}}
          nextStep={() => { console.log('nextStep called'); }}
          />
        );
      case 6:
        return (
          <div>
            {/* here will be the last step with the chat with the assistant */}
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const updatedSteps = [...steps];
    if (userRole !== null) {
      //updatedSteps[2].title = `Personalize for ${userRole}`;    
    }
    if (goal) {
      //updatedSteps[3].title = `Goal ${goal.id}`;
    }
  }, [userRole, goal]);
  

 return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <Target className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Goal: {initialGoal.id}</h2>
              <p className="text-blue-100">Let's customize your journey </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-8">
            {steps.map((s, i) => (
              <div
                 key={i}
                 className={`
                  flex-1 h-2 rounded-full
                  ${i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}
                  transition-all duration-300
                `}
               />
            ))}
          </div>
          {/*
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                {steps[step].icon}
                <h3 className="text-xl font-semibold">{steps[step].title}</h3>
              </div>

              <p className="text-gray-600 mb-6">
                {steps[step].description}
              </p>

              {step === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {steps[0].options.map(trait => (
                    <button
                      key={trait}
                      onClick={() => handleTraitToggle(trait)}
                      className={`
                        p-3 rounded-lg text-left transition-all duration-200
                        ${formData.traits?.includes(trait)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700'}
                        border hover:shadow-md
                      `}
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={formData.schedule?.preferredTime}
                      onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Frequency
                    </label>
                    <select
                      value={formData.schedule?.frequency}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {Object.entries(formData.style!).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => handleStyleChange(key, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        {key === 'communication' && (
                          <>
                            <option value="Direct">Direct</option>
                            <option value="Casual">Casual</option>
                            <option value="Formal">Formal</option>
                          </>
                        )}
                        {key === 'feedback' && (
                          <>
                            <option value="Detailed">Detailed</option>
                            <option value="Concise">Concise</option>
                            <option value="Balanced">Balanced</option>
                          </>
                        )}
                        {key === 'pace' && (
                          <>
                            <option value="Fast">Fast</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Relaxed">Relaxed</option>
                          </>
                        )}
                      </select>
                    </div>
                  )))}
                </div>
              )}
            </motion.div> */}
           {/* </AnimatePresence> */}
           
          {renderStep()}

          <div className="mt-8 flex justify-end">
            {currentStep !== steps.length - 1 && currentStep !== 0 && (
            
            <button
             onClick={handleNext}
               className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg
                transition-all duration-200 hover:shadow-md"
            > 
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}           
            </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default OnboardingChat;
