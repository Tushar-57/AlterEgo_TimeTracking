import { Message, OnboardingData, PlannerData, Tone } from '../types/onboarding';
import data from '../data/onboarding.json';

// Generate a unique ID for messages
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
  sender,
  content,
  timestamp: new Date(),
  id: '',
  sender: 'user',
  content: undefined,
  isRendered: false,
  timestamp: undefined
};
};

// Get a random name for the AI coach
export const getRandomName = (): string => {
  const randomIndex = Math.floor(Math.random() * data.randomNames.length);
  return data.randomNames[randomIndex];
};

// Format the introduction message based on user selections
export const formatIntroduction = (data: OnboardingData): string => {
  const { tone, coachName, goals, traits } = data;
  
  // Adjust greeting based on tone
  let greeting = '';
  switch (tone) {
    case 'Bold':
      greeting = `Hey there! I'm ${coachName}, your bold coach ready to drive results!`;
      break;
    case 'Calm':
      greeting = `Hello. I'm ${coachName}, your calm guide on this journey.`;
      break;
    case 'Playful':
      greeting = `Hi friend! I'm ${coachName}, your playful companion in this adventure!`;
      break;
    default:
      greeting = `Hi, I'm ${coachName}, your personal coach.`;
  }
  let formattedMessage = `${greeting}`;

  // Mention primary goal if available
  if(goals.length > 0){
    const goalMessage = `I'm here to help you ${goals[0].toLowerCase()}.`;
    formattedMessage += ` ${goalMessage}`;
  }else{
    formattedMessage += ` I'm here to help you achieve your goals.`
  }
  
  // Mention a key trait if available
  if (traits.length > 0){
    const traitMessage = `Together, we'll build ${traits[0].toLowerCase()} and make real progress.`;
    formattedMessage += ` ${traitMessage}`;
  } else {
    formattedMessage += ` Together, we'll make real progress.`;
  }
  
  let question = '';
  switch (tone) {
    case 'Bold':
      question = "Ready to tackle your first challenge?";
      break;
    case 'Calm':
      question = "Shall we begin planning your first steps?";
      break;
    case 'Playful':
      question = "Excited to start our first adventure together?";
      break;
    default:
      question = "Ready to get started?";
  }

  return `${formattedMessage} ${question}`;
};

// Validate planner data
export const validatePlannerData = (data: PlannerData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!data.objectiveTitle.trim()) {
    errors.objectiveTitle = 'Objective title is required';
  }
  
  if (!data.whyItMatters.trim()) {
    errors.whyItMatters = 'Please explain why this matters to you';
  }
  
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!data.endDate) {
    errors.endDate = 'End date is required';
  } else if (new Date(data.endDate) <= new Date(data.startDate)) {
    errors.endDate = 'End date must be after start date';
  }

  // Validate if time formats are not empty
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  
  
  if (!timeRegex.test(data.dailyCheckInTime)) {
    errors.dailyCheckInTime = 'Invalid time format (use HH:MM)';
  }
  
  if (!timeRegex.test(data.weeklyReviewTime)) {
    errors.weeklyReviewTime = 'Invalid time format (use HH:MM)';
  }
  
  if (!timeRegex.test(data.dndStart)) {
    errors.dndStart = 'Invalid time format (use HH:MM)';
  } else if (data.dndStart && data.dndEnd && data.dndStart === data.dndEnd) {
    errors.dndEnd = 'DND start and end cannot be the same time.';
  }
  
  if (!timeRegex.test(data.dndEnd)) {
    errors.dndEnd = 'Invalid time format (use HH:MM)';
  }
  
  if (data.workHours.start && !timeRegex.test(data.workHours.start)) {
    errors.workHoursStart = 'Invalid time format (use HH:MM)';
  } else if (data.workHours.start && data.workHours.end && data.workHours.start === data.workHours.end) {
    errors.workHoursEnd = 'Work hours start and end cannot be the same time.';
  }
  if(data.workHours.end && !timeRegex.test(data.workHours.end)){
    errors.workHoursEnd = 'Invalid time format (use HH:MM)';
  }
  
  return errors;
};

// Get tone-specific styles
export const getToneStyles = (tone: Tone | null) => ({
  primaryColor: tone ? `from-${tone}-500 to-${tone}-700` : 'from-purple-600 to-indigo-700',
  // Add other style properties
});
  
  const styles = {
    Bold: {
      primaryColor: 'from-indigo-600 to-purple-700',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
      textColor: 'text-indigo-600',
      accentColor: 'border-indigo-600',
      animation: 'transition-all duration-300 ease-in-out'
    },
    Calm: {
      primaryColor: 'from-teal-500 to-emerald-600',
      buttonColor: 'bg-teal-500 hover:bg-teal-600',
      textColor: 'text-teal-600',
      accentColor: 'border-teal-500',
      animation: 'transition-all duration-500 ease-in-out'
    },
    Playful: {
      primaryColor: 'from-amber-500 to-orange-600',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
      textColor: 'text-amber-600',
      accentColor: 'border-amber-500',
      animation: 'transition-all duration-300 ease-in-out'
    }
  };
  
  return styles[tone];
};

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
    return data ? { ...JSON.parse(data), planner: JSON.parse(data).planner || data.DEFAULT_PLANNER_DATA } : {planner: data.DEFAULT_PLANNER_DATA};
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }

}; 

