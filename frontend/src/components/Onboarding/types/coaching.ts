export type MentorArchetype = 'Innovator' | 'Sage' | 'Challenger' | 'Master' | 'Guide';

export type CoachingStyle = 'Direct' | 'Nurturing' | 'Analytical' | 'Inspirational';

export type PersonalityTrait = 'Encouraging' | 'Challenging' | 'Patient' | 'Energetic';

export type UserRole = 'student' | 'professional' | 'freelancer' | 'other';

export interface Mentor {
  archetype: MentorArchetype;
  style: CoachingStyle;
  traits: PersonalityTrait[];
  name: string;
  avatar: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  milestones: string[];
  connections: string[];
}

export interface LoadingStep {
  message: string;
  progress: number;
  detail?: string;
}
export const RANDOM_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Drew', 'Reese', 'Morgan', 'Skyler',
];

export const TRAITS = ['Motivating', 'Empathetic', 'Logical', 'Creative'];
export const TONES = ['Friendly', 'Professional', 'Encouraging'];

export const SUGGESTED_GOALS = [
  'Improve focus',
  'Manage time better',
  'Increase productivity',
];

export const AVATARS = [
  { id: '1', url: '/assets/avatars/avatar1.png', alt: 'Avatar 1' },
  { id: '2', url: '/assets/avatars/avatar2.png', alt: 'Avatar 2' },
  { id: '3', url: '/assets/avatars/avatar3.png', alt: 'Avatar 3' },
];

