import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  X,
  Zap,
  Heart,
  DollarSign,
  BookOpen,
  Brain,
  Settings,
  Clock,
  Target,
  Palette,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Validation schema for user preferences
const preferencesSchema = z.object({
  productivity: z.object({
    work_hours: z.string().min(1, 'Work hours are required'),
    break_preferences: z.string().min(1, 'Break preferences are required'),
    priority_system: z.string().min(1, 'Priority system is required'),
    task_categories: z.array(z.string()).min(1, 'At least one task category is required')
  }),
  health: z.object({
    exercise_goals: z.string().min(1, 'Exercise goals are required'),
    sleep_schedule: z.string().min(1, 'Sleep schedule is required'),
    dietary_preferences: z.array(z.string()),
    health_metrics: z.array(z.string()).min(1, 'At least one health metric is required')
  }),
  finance: z.object({
    budget_categories: z.array(z.string()).min(1, 'At least one budget category is required'),
    savings_goals: z.number().min(0, 'Savings goals must be positive'),
    expense_tracking: z.string().min(1, 'Expense tracking frequency is required'),
    currency: z.string().min(1, 'Currency is required')
  }),
  journal: z.object({
    reflection_frequency: z.string().min(1, 'Reflection frequency is required'),
    check_in_time: z.string().min(1, 'Check-in time is required'),
    reflection_topics: z.array(z.string()).min(1, 'At least one reflection topic is required'),
    mood_tracking: z.boolean()
  }),
  llm_provider: z.object({
    provider: z.enum(['openai', 'ollama']),
    openai_model: z.string().min(1, 'OpenAI model is required'),
    ollama_model: z.string().min(1, 'Ollama model is required'),
    fallback_enabled: z.boolean()
  }),
  general: z.object({
    timezone: z.string().min(1, 'Timezone is required'),
    language: z.string().min(1, 'Language is required'),
    notification_preferences: z.object({
      web: z.boolean(),
      telegram: z.boolean()
    })
  })
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

interface PreferencesEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (preferences: PreferencesFormData) => void
}

export const PreferencesEditor: React.FC<PreferencesEditorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('productivity')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      productivity: {
        work_hours: '09:00-17:00',
        break_preferences: 'pomodoro',
        priority_system: 'eisenhower',
        task_categories: ['work', 'personal', 'learning']
      },
      health: {
        exercise_goals: '30min daily',
        sleep_schedule: '23:00-07:00',
        dietary_preferences: [],
        health_metrics: ['sleep', 'exercise', 'mood']
      },
      finance: {
        budget_categories: ['food', 'transport', 'entertainment'],
        savings_goals: 1000,
        expense_tracking: 'weekly',
        currency: 'USD'
      },
      journal: {
        reflection_frequency: 'daily',
        check_in_time: '21:00',
        reflection_topics: ['gratitude', 'challenges', 'goals'],
        mood_tracking: true
      },
      llm_provider: {
        provider: 'openai',
        openai_model: 'gpt-4',
        ollama_model: 'llama2',
        fallback_enabled: true
      },
      general: {
        timezone: 'UTC',
        language: 'en',
        notification_preferences: {
          web: true,
          telegram: false
        }
      }
    }
  })

  // Load current preferences when component opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const loadPreferences = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge/preferences')
      if (response.ok) {
        const preferences = await response.json()
        reset(preferences)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/knowledge/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Preferences saved successfully!')
        onSave?.(data)
        onClose()
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleArrayInput = (
    field: keyof PreferencesFormData,
    subfield: string,
    value: string
  ) => {
    const currentValues = getValues()
    const currentArray = (currentValues[field] as any)[subfield] || []
    const newArray = value.split(',').map(item => item.trim()).filter(Boolean)
    setValue(`${field}.${subfield}` as any, newArray, { shouldDirty: true })
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Edit Preferences</h2>
            <p className="text-muted-foreground">
              Customize your AI agent's understanding of your preferences
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading preferences...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="productivity" className="gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Productivity</span>
                  </TabsTrigger>
                  <TabsTrigger value="health" className="gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">Health</span>
                  </TabsTrigger>
                  <TabsTrigger value="finance" className="gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Finance</span>
                  </TabsTrigger>
                  <TabsTrigger value="journal" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Journal</span>
                  </TabsTrigger>
                  <TabsTrigger value="llm_provider" className="gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="general" className="gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                </TabsList>

                {/* Productivity Tab */}
                <TabsContent value="productivity" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Productivity Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Work Hours</label>
                        <Input
                          {...register('productivity.work_hours')}
                          placeholder="09:00-17:00"
                        />
                        {errors.productivity?.work_hours && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.productivity.work_hours.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Break Preferences</label>
                        <select
                          {...register('productivity.break_preferences')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="pomodoro">Pomodoro (25min focus)</option>
                          <option value="ultradian">Ultradian (90min cycles)</option>
                          <option value="flexible">Flexible breaks</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Priority System</label>
                        <select
                          {...register('productivity.priority_system')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="eisenhower">Eisenhower Matrix</option>
                          <option value="moscow">MoSCoW Method</option>
                          <option value="abc">ABC Analysis</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Task Categories</label>
                        <Input
                          placeholder="work, personal, learning"
                          defaultValue={watch('productivity.task_categories')?.join(', ')}
                          onChange={(e) => handleArrayInput('productivity', 'task_categories', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate categories with commas
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Health Tab */}
                <TabsContent value="health" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Health & Wellness Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Exercise Goals</label>
                        <Input
                          {...register('health.exercise_goals')}
                          placeholder="30min daily"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Sleep Schedule</label>
                        <Input
                          {...register('health.sleep_schedule')}
                          placeholder="23:00-07:00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Dietary Preferences</label>
                        <Input
                          placeholder="vegetarian, gluten-free"
                          defaultValue={watch('health.dietary_preferences')?.join(', ')}
                          onChange={(e) => handleArrayInput('health', 'dietary_preferences', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Health Metrics to Track</label>
                        <Input
                          placeholder="sleep, exercise, mood"
                          defaultValue={watch('health.health_metrics')?.join(', ')}
                          onChange={(e) => handleArrayInput('health', 'health_metrics', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Finance Tab */}
                <TabsContent value="finance" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financial Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Budget Categories</label>
                        <Input
                          placeholder="food, transport, entertainment"
                          defaultValue={watch('finance.budget_categories')?.join(', ')}
                          onChange={(e) => handleArrayInput('finance', 'budget_categories', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Savings Goals</label>
                        <Input
                          type="number"
                          {...register('finance.savings_goals', { valueAsNumber: true })}
                          placeholder="1000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Expense Tracking</label>
                        <select
                          {...register('finance.expense_tracking')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select
                          {...register('finance.currency')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Journal Tab */}
                <TabsContent value="journal" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Journal & Reflection Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Reflection Frequency</label>
                        <select
                          {...register('journal.reflection_frequency')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Check-in Time</label>
                        <Input
                          type="time"
                          {...register('journal.check_in_time')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Reflection Topics</label>
                        <Input
                          placeholder="gratitude, challenges, goals"
                          defaultValue={watch('journal.reflection_topics')?.join(', ')}
                          onChange={(e) => handleArrayInput('journal', 'reflection_topics', e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Mood Tracking</label>
                        <Switch
                          checked={watch('journal.mood_tracking')}
                          onCheckedChange={(checked) => setValue('journal.mood_tracking', checked, { shouldDirty: true })}
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* LLM Provider Tab */}
                <TabsContent value="llm_provider" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Provider Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Primary Provider</label>
                        <select
                          {...register('llm_provider.provider')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="ollama">Ollama (Local)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enable Fallback</label>
                        <Switch
                          checked={watch('llm_provider.fallback_enabled')}
                          onCheckedChange={(checked) => setValue('llm_provider.fallback_enabled', checked, { shouldDirty: true })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">OpenAI Model</label>
                        <select
                          {...register('llm_provider.openai_model')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Ollama Model</label>
                        <Input
                          {...register('llm_provider.ollama_model')}
                          placeholder="llama2"
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      General Preferences
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Timezone</label>
                        <select
                          {...register('general.timezone')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Language</label>
                        <select
                          {...register('general.language')}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Web Notifications</label>
                        <Switch
                          checked={watch('general.notification_preferences.web')}
                          onCheckedChange={(checked) => setValue('general.notification_preferences.web', checked, { shouldDirty: true })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Telegram Notifications</label>
                        <Switch
                          checked={watch('general.notification_preferences.telegram')}
                          onCheckedChange={(checked) => setValue('general.notification_preferences.telegram', checked, { shouldDirty: true })}
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {isDirty && 'You have unsaved changes'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving || !isDirty}
              className="gap-2"
            >
              {isSaving ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Preferences
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}