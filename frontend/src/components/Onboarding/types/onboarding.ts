// import { Goal, Mentor, MentorArchetype } from "./coaching";
export type MentorArchetype = 'Innovator' | 'Sage' | 'Challenger' | 'Master' | 'Guide';
export type CoachingStyle = 'Direct' | 'Friendly' | 'Encouraging' | 'Nurturing' | 'Patient' | 'Challenging' | 'Inspirational';
export type UserRole = 'Student' | 'Professional' | 'Freelancer' | 'Other';
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
  priority: "Low" | "Medium" | "High" | "Critical"; // Priority level
  milestones: string[];      // Add from GoalCanvas
  endDate?: string;
  estimatedEffortHours?: number;   // Estimated hours needed to complete (useful for planning load)
  smartCriteria: SmartCriteria
};
export interface LoadingStep {
  message: string;
  progress: number;
  detail?: string;
}
export const BOT_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Reese', 'Morgan', 'Skyler',
] as const;

export const SUGGESTED_GOALS_STUDENT = [
  'Improve focus',
  'Manage time better',
  'Increase productivity',
] as const;

export const SUGGESTED_GOALS_WORK = [
  'Improve focus',
  'Manage time better',
  'Increase productivity',
] as const;

export const SUGGESTED_GOALS_FREELANCER = [
  'Improve focus',
  'Manage time better',
  'Increase productivity',
] as const;

export const SUGGESTED_GOALS_OTHER = [
  'Manage Time Better',
  'Increase Productivity',
  'IDK, Figure out !',
] as const;

// export type SuggestedGoalStudent = typeof SUGGESTED_GOALS_STUDENT[number];
// export type SuggestedGoalWork = typeof SUGGESTED_GOALS_WORK[number];
// export type SuggestedGoalFreelancer = typeof SUGGESTED_GOALS_FREELANCER[number];
// export type SuggestedGoalOther = typeof SUGGESTED_GOALS_OTHER[number];

export type AVATARS = [
  { id: '1', url: '/assets/avatars/avatar1.png', alt: 'Avatar 1' },
  { id: '2', url: '/assets/avatars/avatar2.png', alt: 'Avatar 2' },
  { id: '3', url: '/assets/avatars/avatar3.png', alt: 'Avatar 3' },
];
export const RANDOM_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Reese', 'Morgan', 'Skyler',
];
export const AVATARS = [
  { id: '1', url: '/assets/avatars/avatar1.png', alt: 'Avatar 1' },
  { id: '2', url: '/assets/avatars/avatar2.png', alt: 'Avatar 2' },
  { id: '3', url: '/assets/avatars/avatar3.png', alt: 'Avatar 3' },
];
export type Answer = {
  answer: string;
  id: string;
};
export type Question = {
  id: string;
  question: string;
  // previousAnswers?: Answer[];
};

export interface ChatBubbleProps {
  content: string;
  type: 'user' | 'bot' | 'affirmation';
  sender?: 'user' | 'assistant';
  isRendered?: boolean;
  timestamp?: Date;
}
export type SmartCriteriaField = {
  checked: boolean;  // true or false
  note: string;      // explanation, user comment, or template hint
};

export type SmartCriteria = {
  specific: SmartCriteriaField;
  measurable: SmartCriteriaField;
  achievable: SmartCriteriaField;
  relevant: SmartCriteriaField;
  timeBound: SmartCriteriaField;
};
export type Availability = {
  workHours: {
    start: string;   // HH:mm format, e.g., "09:00"
    end: string;     // HH:mm format, e.g., "17:00"
  };
  dndHours: {
    start: string;   // HH:mm format
    end: string;     // HH:mm format
  };
  checkIn: {
    preferredTime: string;             // HH:mm, when user prefers check-ins
    frequency: 'daily' | 'weekly' | 'biweekly';  // how often user wants to check-in
  };
  timezone: string;                    // e.g., "America/New_York"
};
export type SMART = {
  S: boolean;
  M: boolean;
  A: boolean;
  R: boolean;
  T: boolean;
};
export type WorkHours = {
  start: string;
  end: string;
};
export type PlannerData = {
  objectiveTitle: string;
  whyItMatters: string;
  startDate: string;
  endDate: string;
  SMART: SMART;
  dailyCheckInTime: string;
  weeklyReviewTime: string;
  dndStart: string;
  dndEnd: string;
  workHours: WorkHours;
  pomodoroRatio: string;
  goals: Goal[];
};

export type Tone ={
  tone: string | "Neutral";
}
export type OnboardingData = {
  role: UserRole;
  goals: (Goal | string)[];
  mentor: Mentor;
  preferredTone: Tone;
  coachAvatar: string;
  schedule: {
    workHours: WorkHours;
    dndHours: { start: string; end: string };
    checkIn: { preferredTime: string; frequency: 'daily' | 'weekly' | 'biweekly' };
    timezone: string;
  };
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