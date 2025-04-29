import { RANDOM_NAMES } from '../types/onboarding';
import { Message, OnboardingData, PlannerData, Tone } from '../types/onboarding';
// import data from '../data/onboarding.json';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Create a new message object
export const createMessage = (
  content: string | React.ReactNode,
  sender: 'user' | 'assistant'
): Message => {
  return {
  id: generateId(),
  content,
  timestamp: new Date(),
  isRendered: false,
  sender: sender,
  additionalContent: ''
};
};

// Get a random name for the AI coach
export const getRandomName = (): string => {
  const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
  return RANDOM_NAMES[randomIndex];
};

// Format the introduction message based on user selections
export const formatIntroduction = (data: OnboardingData): string => {
  const { } = data;
  
  // Adjust greeting based on tone
  let greeting = 'Hello I am you AI Coach';
  let formattedMessage = `${greeting}`;
  // Mention primary goal if available

  return `${formattedMessage}`;
};

// Get tone-specific styles
// export const getToneStyles = (tone: Tone | null | string) => {
//   const styles = {
//     Bold: {
//       primaryColor: 'from-indigo-600 to-purple-700',
//       buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
//       textColor: 'text-indigo-600',
//       accentColor: 'border-indigo-600',
//       animation: 'transition-all duration-300 ease-in-out'
//     },
//     Calm: {
//       primaryColor: 'from-teal-500 to-emerald-600',
//       buttonColor: 'bg-teal-500 hover:bg-teal-600',
//       textColor: 'text-teal-600',
//       accentColor: 'border-teal-500',
//       animation: 'transition-all duration-500 ease-in-out'
//     },
//     Playful: {
//       primaryColor: 'from-amber-500 to-orange-600',
//       buttonColor: 'bg-amber-500 hover:bg-amber-600',
//       textColor: 'text-amber-600', // Fixed from textText
//       accentColor: 'border-amber-500',
//       animation: 'transition-all duration-300 ease-in-out'
//     }
//   };

//   return tone ? styles[tone] : {
//     primaryColor: 'from-purple-600 to-indigo-700',
//     buttonColor: 'bg-purple-600 hover:bg-purple-700',
//     textColor: 'text-purple-600',
//     accentColor: 'border-purple-600',
//     animation: 'transition-all duration-300 ease-in-out'
//   };
// };

// Save onboarding data to localStorage
export const saveOnboardingData = (data: Partial<OnboardingData>) => {
  try {
    const existingData = localStorage.getItem('onboardingData');
    const parsedData = existingData ? JSON.parse(existingData) : {};
    const updatedData = { ...parsedData, ...data };
    localStorage.setItem('onboardingData', JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Load onboarding data from localStorage
export const loadOnboardingData = (): Partial<OnboardingData> | null => {
  try {
    const data = localStorage.getItem('onboardingData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};
