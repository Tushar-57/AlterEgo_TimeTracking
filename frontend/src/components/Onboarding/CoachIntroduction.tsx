import React, { useEffect } from 'react';
import { ChatBubbleProps, ChatBubbleType } from './types/onboarding';

const affirmations = [
    "You are capable of amazing things.",
    "Every day is a new opportunity to grow.",
    "You are stronger than you think.",
    "Believe in yourself and you will be unstoppable.",
    "Your potential is limitless.",
    "You are making progress, one step at a time.",
    "Embrace the challenges, they help you grow.",
    "You are worthy of your dreams.",
    "Stay focused on your goals, you've got this!",
    "You are exactly where you need to be.",
];

interface CoachIntroductionProps {
    coachName: string;
    preferredTone: string;
    userGoals: string[];
    handleNext: () => void;
    setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
    chatHistory: ChatBubbleType[];
    coachAvatar:string;
}
const CoachIntroduction: React.FC<CoachIntroductionProps> = ({
    coachName,
    preferredTone,
    userGoals,
    handleNext,
    setChatHistory,
    chatHistory,
    coachAvatar}) => {

        const getIntroductionMessage = () => {
        const goalString = userGoals.length > 0 ? userGoals.join(', ') : "your goals";
        const name = coachName.charAt(0).toUpperCase() + coachName.slice(1);

        switch (preferredTone.toLowerCase()) {
            case 'friendly':
                return `Hiya! I'm ${name}, your friendly coach. Together, we'll work on ${goalString}. Let's get started!`;
            case 'bold':
            case 'calm':
                return `Hello, I'm ${coachName}, your calm coach. Together, we'll work on ${goalString}. Let's start by planning your first task.`;
            case 'playful':
                return `Hey there! I'm ${coachName}, your playful coach, and I'm super excited to help you with ${goalString}! Let's jump into planning your first task, shall we?`;
            default:
                return `Hi, I'm ${name}, your coach! I'm here to support you as you work on ${goalString}. Let's start planning.`;
            case 'motivational':
                return `Hey there! I'm ${name} and I will be your motivational coach!. Together, we'll work on ${goalString}. Let's start!`;
            case 'professional':
                return `Greetings. I am ${name}, your professional coach. I'll be guiding you towards ${goalString}. Let's begin.`
        }
    };

    useEffect(() => {
        const message = {
            content: getIntroductionMessage(),
            type: 'bot',
        };
        setChatHistory((prevHistory) => [...prevHistory, message]);

        const goalString = userGoals.length > 0 ? userGoals.join(', ') : "your goals";
      const userMessage = {
          content:`Goals: ${goalString}, Preferred tone: ${preferredTone}`,
          type:"user"
      };
      setChatHistory((prevHistory) => [...prevHistory, userMessage]);

      const randomIndex = Math.floor(Math.random() * affirmations.length);
      const randomAffirmation = affirmations[randomIndex];

      const affirmationMessage = {
          content: randomAffirmation,
          type: 'affirmation',
      };
        setChatHistory((prevHistory) => [...prevHistory, affirmationMessage]);

        

        const timer = setTimeout(() => {
            handleNext();
        }, 3000); 

        return () => clearTimeout(timer);
    }, [handleNext, setChatHistory, chatHistory, coachName, preferredTone, userGoals]);

    return (
        <div className='flex flex-col items-center justify-center h-full p-6'>
            <div className="flex items-center justify-center space-x-4 mb-6">
                <img src={coachAvatar} alt={`${coachName}'s avatar`} className="w-20 h-20 rounded-full object-cover" />
                <div className='flex flex-col'>
                     <h2 className="text-2xl font-bold text-gray-800">{coachName}</h2>
                     <p className="text-md text-gray-600">Your Coach</p>
                </div>
               
            </div>
            <div className="max-w-md rounded-lg overflow-hidden shadow-md p-6 bg-white step-container">
                <p className="text-gray-700 text-center text-lg">{getIntroductionMessage()}</p>
            </div>
        </div>
    );
};

export default CoachIntroduction;
