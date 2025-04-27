import { Tone } from "./types";

export type Trait = 'Confidence' | 'Creativity' | 'Focus' | 'Discipline' | 'Empathy' | 'Optimism';
export type Role = 'student' | 'professional' | 'freelancer' | 'other';

export type Answer = {
  text: string;
  id: string;
};

export type Question = {
  text: string;
  answers: Answer[];
};

export type Avatar = {
  id: string;
  url: string;
  alt: string;
};

export interface ChatBubbleProps {
  content: string;
  type: 'user' | 'bot' | 'affirmation';
  sender?: 'user' | 'assistant';
  isRendered?: boolean;
  timestamp?: Date;
}

export type PlannerData = {
  objectiveTitle: string;
  whyItMatters: string;
  startDate: string;
  endDate: string;
  SMART: {
    S: boolean;
    M: boolean;
    A: boolean;
    R: boolean;
    T: boolean;
  };
  dailyCheckInTime: string;
  weeklyReviewTime: string;
  dndStart: string;
  dndEnd: string;
  workHours: {
    start: string;
    end: string;
  };
  pomodoroRatio: string;
};

export type Goal = {
  id: string; // Default: ''
  title: string,
  description: string; // Default: ''
  category: string; // Default: ''
  connections: string[]; // Default: []
};

export type OnboardingData = {
  reason: string;
  traits: Trait[];
  goals: Goal[];
  tone: Tone;
  coachName: string;
  avatar: Avatar;
  planner: PlannerData;
};

export type Message = {
  id: string;
  sender: 'user' | 'assistant';
  content: string | React.ReactNode;
  isRendered: boolean;
  timestamp: Date;
};

export interface WelcomeScreenProps {
  onStart: () => void;
}

export interface RoleSelectionProps {
  onSelectRole: (role: string) => void;
  nextStep: () => void;
}

export interface PersonalizationProps {
  userRole: string;
  nextStep: () => void;
  previousStep: () => void;
}

export interface StepGoalsProps {
  handleNext: () => void;
  userGoals: Goal[];
  setUserGoals: (goals: Goal[]) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

export interface StepToneProps {
  handleNext: () => void;
  preferredTone: string;
  setPreferredTone: (tone: string) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

export interface NameAndAvatarProps {
  handleNext: () => void;
  coachName: string;
  setCoachName: (name: string) => void;
  coachAvatar: string;
  setCoachAvatar: (avatar: string) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

export interface PlannerSetupProps {
  handleNext: () => void;
  plannerData: PlannerData;
  setPlannerData: (data: PlannerData) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

export interface CoachWelcomeProps {
  goal: Goal;
  nextStep: () => void;
}

export interface ChatContainerProps {
  messages: ChatBubbleProps[];
  isTyping: boolean;
  tone: string;
}

export interface MentorSelectionProps {
  onSelect: (mentor: string) => void;
}


