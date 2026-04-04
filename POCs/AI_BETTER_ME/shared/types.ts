/**
 * Shared TypeScript types for the AI Agent Ecosystem
 */

export interface AgentState {
  agent_id: string;
  agent_type: AgentType;
  current_task?: Task;
  context: Record<string, any>;
  last_active: string;
  capabilities: string[];
}

export enum AgentType {
  MAIN_ORCHESTRATOR = 'main_orchestrator',
  PRODUCTIVITY = 'productivity',
  HEALTH = 'health',
  FINANCE = 'finance',
  SCHEDULING = 'scheduling',
  JOURNAL = 'journal',
  GENERAL = 'general'
}

export interface Task {
  task_id: string;
  title: string;
  description: string;
  assigned_agent: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  dependencies: string[];
  metadata: Record<string, any>;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface KnowledgeEntry {
  entry_id: string;
  user_id: string;
  category: string;
  content: string;
  embedding: number[];
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  agent_type?: AgentType;
  timestamp: string;
  reasoning?: string;
}

export interface UserPreferences {
  user_id: string;
  preferences: {
    productivity: ProductivityPreferences;
    health: HealthPreferences;
    finance: FinancePreferences;
    journal: JournalPreferences;
    llm_provider: LLMProviderConfig;
  };
  patterns: {
    daily_routines: any[];
    interaction_history: any[];
    success_metrics: Record<string, any>;
    reflection_insights: any[];
  };
}

export interface ProductivityPreferences {
  work_hours: string;
  break_preferences: string;
  priority_system: string;
}

export interface HealthPreferences {
  exercise_goals: string;
  sleep_schedule: string;
  dietary_preferences: string[];
}

export interface FinancePreferences {
  budget_categories: string[];
  savings_goals: number;
  expense_tracking: string;
}

export interface JournalPreferences {
  reflection_frequency: string;
  check_in_time: string;
  reflection_topics: string[];
  mood_tracking: boolean;
}

export interface LLMProviderConfig {
  provider: 'openai' | 'ollama';
  openai_api_key?: string;
  openai_model: string;
  ollama_endpoint: string;
  ollama_model: string;
  fallback_enabled: boolean;
}