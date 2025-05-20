export type MentorArchetype = 'Innovator' | 'Sage' | 'Challenger' | 'Master' | 'Guide';
export type CoachingStyle = 'Direct' | 'Friendly' | 'Encouraging' | 'Nurturing' | 'Patient' | 'Challenging' | 'Inspirational';
// export type UserRole = 'Student' | 'Professional' | 'Freelancer' | 'Other';
export type OnboardingStep = 'intro' | 'role' | 'personalization' | 'goals' | 'planner' | 'mentor' | 'complete';

export type UserRole = 'student' | 'professional' | 'freelancer' | 'other';

export interface Answer {
  id: string;
  answer: string; // Title (e.g., "Time Management")
  description: string; // Description (e.g., "Support for time management...")
}

// Other types remain unchanged
export type Message = {
  id: string;
  sender: 'user' | 'assistant';
  content: string | React.ReactNode;
  isRendered: boolean;
  timestamp: Date;
  additionalContent: string | '';
};

export interface PlannerData {
  goals: Goal[];
  availability: {
    workHours: { start: string; end: string };
    dndHours: { start: string; end: string };
    checkIn: { preferredTime: string; frequency: string };
    timezone: string;
  };
  notifications: { remindersEnabled: boolean };
  integrations: { calendarSync: boolean; taskManagementSync: boolean };
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedEffortHours?: number;
  endDate?: string;
  whyItMatters?: string;
  milestones: string[];
  smartCriteria: SmartCriteria;
}

export interface Mentor {
  archetype: string;
  style: string;
  name: string;
  avatar: string;
}

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

// export type PlannerData = {
//   goals: Goal[];
//   availability: Availability;
//   notifications: {
//     remindersEnabled: boolean;
//   };
//   integrations?: {
//     calendarSync: boolean;
//     taskManagementSync: boolean;
//   };
// };

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

