import { ReactNode } from "react";

export type MentorArchetype = 'Innovator' | 'Sage' | 'Challenger' | 'Master' | 'Guide';
export type CoachingStyle = 'Direct' | 'Friendly' | 'Encouraging' | 'Nurturing' | 'Patient' | 'Challenging' | string;
export type UserRole = 'Student' | 'Professional' | 'Freelancer' | 'Other';
export type OnboardingStep = 'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'complete';



export interface Mentor {
  archetype: MentorArchetype;
  style: CoachingStyle;
  name: string;
  avatar: string;
}

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  milestones: string[];
  endDate?: string;
  estimatedEffortHours?: number;
  whyItMatters?: string;
  smartCriteria: SmartCriteria;
};

export interface LoadingStep {
  message: string;
  progress: number;
  detail?: string;
}

export const BOT_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Reese', 'Morgan', 'Skyler'] as const;

export const SUGGESTED_GOALS_STUDENT = ['Improve focus', 'Manage time better', 'Increase productivity'] as const;
export const SUGGESTED_GOALS_WORK = ['Improve focus', 'Manage time better', 'Increase productivity'] as const;
export const SUGGESTED_GOALS_FREELANCER = ['Improve focus', 'Manage time better', 'Increase productivity'] as const;
export const SUGGESTED_GOALS_OTHER = ['Manage Time Better', 'Increase Productivity', 'IDK, Figure out !'] as const;

const AVATAR_BASE_PATH = 'src/public/avatars';
export const AVATARS = Array.from({ length: 17 }, (_, i) => ({
  id: `${i + 1}`,
  url: `${AVATAR_BASE_PATH}/av${i + 1}.svg`,
  alt: `Avatar ${i + 1}`,
  // You can add more properties if needed
}));

export const RANDOM_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Reese', 'Morgan', 'Skyler'];

export type Answer = {
  description: ReactNode;
  answer: string;
  id: string;
};

export type Question = {
  id: string;
  question: string;
};

export interface ChatBubbleProps {
  content: string | React.ReactNode;
  type: 'user' | 'bot' | 'affirmation';
  sender: 'user' | 'assistant';
  isRendered?: boolean;
  timestamp?: Date;
}

export type SmartCriteriaField = {
  checked: boolean;
  note: string;
};

export type SmartCriteria = {
  specific: SmartCriteriaField;
  measurable: SmartCriteriaField;
  achievable: SmartCriteriaField;
  relevant: SmartCriteriaField;
  timeBound: SmartCriteriaField;
};

export type Availability = {
  workHours: { start: string; end: string };
  dndHours: { start: string; end: string };
  checkIn: { preferredTime: string; frequency: 'daily' | 'weekly' | 'biweekly' };
  timezone: string;
};

export type PlannerData = {
  goals: Goal[];
  availability: Availability;
  notifications: {
    remindersEnabled: boolean;
  };
  integrations?: {
    calendarSync: boolean;
    taskManagementSync: boolean;
  };
};

export type Tone = {
  tone: string | 'Neutral';
};

export type OnboardingData = {
  role: UserRole;
  goals: Goal[];
  mentor: Mentor;
  preferredTone: Tone;
  coachAvatar: string;
  schedule: Availability;
  planner: PlannerData;
};

export type Message = {
  id: string;
  sender: 'user' | 'assistant';
  content: string | React.ReactNode;
  isRendered: boolean;
  timestamp: Date;
  additionalContent: string | '';
};

export interface PlannerSetupProps {
  plannerData: PlannerData;
  onUpdatePlanner: (data: PlannerData) => void;
  onSubmit: () => void;
  setChatHistory: (history: ChatBubbleProps[]) => void;
  errors?: Record<string, string>;
  tone?: Tone | null;
}
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

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
    additionalContent: '',
  };
};

export const getRandomName = (): string => {
  const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
  return RANDOM_NAMES[randomIndex];
};
export const formatIntroduction = (data: OnboardingData): string => {
  let greeting = 'Hello, I am your AI Coach';
  return `${greeting}`;
};

export const getToneStyles = (tone: Tone | null | string) => {
  const styles = {
    Bold: {
      primaryColor: 'from-indigo-600 to-purple-700',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
      textColor: 'text-indigo-600',
      accentColor: 'border-indigo-600',
      animation: 'transition-all duration-300 ease-in-out',
    },
    Calm: {
      primaryColor: 'from-teal-500 to-emerald-600',
      buttonColor: 'bg-teal-500 hover:bg-teal-600',
      textColor: 'text-teal-600',
      accentColor: 'border-teal-500',
      animation: 'transition-all duration-500 ease-in-out',
    },
    Playful: {
      primaryColor: 'from-amber-500 to-orange-600',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
      textColor: 'text-amber-600',
      accentColor: 'border-amber-500',
      animation: 'transition-all duration-300 ease-in-out',
    },
    Neutral: {
      primaryColor: 'from-purple-600 to-indigo-700',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-purple-600',
      accentColor: 'border-purple-600',
      animation: 'transition-all duration-300 ease-in-out',
    },
  };

  return tone && typeof tone === 'object' && 'tone' in tone && tone.tone in styles
    ? styles[tone.tone as keyof typeof styles]
    : styles.Neutral;
};

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

export const loadOnboardingData = (): Partial<OnboardingData> | null => {
  try {
    const data = localStorage.getItem('onboardingData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};