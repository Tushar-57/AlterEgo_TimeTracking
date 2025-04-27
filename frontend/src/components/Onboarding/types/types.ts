export type MentorArchetype = 'Innovator' | 'Sage' | 'Challenger' | 'Master' | 'Guide';
export type Role = 'student' | 'professional' | 'freelancer' | 'other';
export type Tone = 'Bold' | 'Calm' | 'Playful' | 'Motivational' | 'Professional';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  connections: string[];
}

export interface ChatBubbleProps {
  content: string;
  type: 'user' | 'bot' | 'affirmation';
  timestamp?: Date;
}

export interface OnboardingData {
  role: Role;
  goals: Goal[];
  mentorType: MentorArchetype;
  coachName: string;
  preferredTone: Tone;
  coachAvatar: string;
}