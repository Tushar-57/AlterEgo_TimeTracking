import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock3, RefreshCcw, Save, Sparkles, Target, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Calendar_updated/components/hooks/use-toast';

type Frequency = 'daily' | 'weekly' | 'biweekly';

type SmartCriteriaField = {
  checked: boolean;
  note: string;
};

type SmartCriteria = {
  specific: SmartCriteriaField;
  measurable: SmartCriteriaField;
  achievable: SmartCriteriaField;
  relevant: SmartCriteriaField;
  timeBound: SmartCriteriaField;
};

type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  milestones: string[];
  endDate: string;
  estimatedEffortHours: number;
  whyItMatters: string;
  smartCriteria: SmartCriteria;
};

type Answer = {
  id: string;
  answer: string;
  description: string;
};

type Availability = {
  workHours: { start: string; end: string };
  dndHours: { start: string; end: string };
  checkIn: { preferredTime: string; frequency: Frequency };
  timezone: string;
};

type Mentor = {
  archetype: string;
  style: string;
  name: string;
  avatar: string;
};

type OnboardingSnapshot = {
  role: string;
  preferredTone: string;
  coachAvatar: string;
  mentor: Mentor;
  goals: Goal[];
  answers: Answer[];
  schedule: Availability;
  planner: {
    goals: Goal[];
    availability: Availability;
    notifications: { remindersEnabled: boolean };
    integrations: { calendarSync: boolean; taskManagementSync: boolean };
  };
};

type FormState = {
  role: string;
  preferredTone: string;
  mentorStyle: string;
  timezone: string;
  workStart: string;
  workEnd: string;
  dndStart: string;
  dndEnd: string;
  checkInTime: string;
  checkInFrequency: Frequency;
  remindersEnabled: boolean;
  calendarSync: boolean;
  taskManagementSync: boolean;
};

const defaultSmartField = (): SmartCriteriaField => ({ checked: false, note: '' });

const defaultSmartCriteria = (): SmartCriteria => ({
  specific: defaultSmartField(),
  measurable: defaultSmartField(),
  achievable: defaultSmartField(),
  relevant: defaultSmartField(),
  timeBound: defaultSmartField(),
});

const defaultAvailability = (): Availability => ({
  workHours: { start: '09:00', end: '17:00' },
  dndHours: { start: '22:00', end: '08:00' },
  checkIn: { preferredTime: '09:00', frequency: 'daily' },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});

const asObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

const asString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

const asBoolean = (value: unknown, fallback = false): boolean => {
  return typeof value === 'boolean' ? value : fallback;
};

const asStringArray = (value: unknown): string[] => {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
};

const toFrequency = (value: unknown): Frequency => {
  if (value === 'daily' || value === 'weekly' || value === 'biweekly') {
    return value;
  }
  return 'daily';
};

const normalizeSmartCriteriaField = (value: unknown): SmartCriteriaField => {
  const field = asObject(value);
  return {
    checked: asBoolean(field.checked, false),
    note: asString(field.note, ''),
  };
};

const normalizeGoal = (value: unknown, index: number): Goal => {
  const goal = asObject(value);
  const smartCriteria = asObject(goal.smartCriteria);
  return {
    id: asString(goal.id, `goal-${index + 1}`),
    title: asString(goal.title, `Goal ${index + 1}`),
    description: asString(goal.description, ''),
    category: asString(goal.category, 'General'),
    priority: asString(goal.priority, 'Medium'),
    milestones: asStringArray(goal.milestones),
    endDate: asString(goal.endDate, ''),
    estimatedEffortHours: typeof goal.estimatedEffortHours === 'number' ? goal.estimatedEffortHours : 0,
    whyItMatters: asString(goal.whyItMatters, ''),
    smartCriteria: {
      specific: normalizeSmartCriteriaField(smartCriteria.specific),
      measurable: normalizeSmartCriteriaField(smartCriteria.measurable),
      achievable: normalizeSmartCriteriaField(smartCriteria.achievable),
      relevant: normalizeSmartCriteriaField(smartCriteria.relevant),
      timeBound: normalizeSmartCriteriaField(smartCriteria.timeBound),
    },
  };
};

const normalizeSnapshot = (value: unknown, fallbackName: string): OnboardingSnapshot => {
  const source = asObject(value);
  const planner = asObject(source.planner);
  const schedule = asObject(source.schedule);
  const availability = asObject(planner.availability);
  const selectedAvailability = Object.keys(availability).length > 0 ? availability : schedule;

  const workHours = asObject(selectedAvailability.workHours);
  const dndHours = asObject(selectedAvailability.dndHours);
  const checkIn = asObject(selectedAvailability.checkIn);

  const goals = Array.isArray(source.goals)
    ? source.goals.map((goal, index) => normalizeGoal(goal, index))
    : [];

  const mentor = asObject(source.mentor);
  const notifications = asObject(planner.notifications);
  const integrations = asObject(planner.integrations);

  const normalizedAvailability: Availability = {
    workHours: {
      start: asString(workHours.start, '09:00'),
      end: asString(workHours.end, '17:00'),
    },
    dndHours: {
      start: asString(dndHours.start, '22:00'),
      end: asString(dndHours.end, '08:00'),
    },
    checkIn: {
      preferredTime: asString(checkIn.preferredTime, '09:00'),
      frequency: toFrequency(checkIn.frequency),
    },
    timezone: asString(selectedAvailability.timezone, defaultAvailability().timezone),
  };

  const answers = Array.isArray(source.answers)
    ? source.answers
        .map((answer, index) => {
          const answerObj = asObject(answer);
          return {
            id: asString(answerObj.id, `answer-${index + 1}`),
            answer: asString(answerObj.answer, ''),
            description: asString(answerObj.description, ''),
          };
        })
        .filter((answer) => answer.answer.length > 0)
    : [];

  return {
    role: asString(source.role, 'Professional'),
    preferredTone: asString(source.preferredTone, 'Friendly'),
    coachAvatar: asString(source.coachAvatar, '/avatars/default.svg'),
    mentor: {
      archetype: asString(mentor.archetype, 'Guide'),
      style: asString(mentor.style, 'Friendly'),
      name: asString(mentor.name, fallbackName),
      avatar: asString(mentor.avatar, asString(source.coachAvatar, '/avatars/default.svg')),
    },
    goals: goals.map((goal) => ({
      ...goal,
      smartCriteria: goal.smartCriteria ?? defaultSmartCriteria(),
    })),
    answers,
    schedule: normalizedAvailability,
    planner: {
      goals,
      availability: normalizedAvailability,
      notifications: {
        remindersEnabled: asBoolean(notifications.remindersEnabled, true),
      },
      integrations: {
        calendarSync: asBoolean(integrations.calendarSync, false),
        taskManagementSync: asBoolean(integrations.taskManagementSync, false),
      },
    },
  };
};

const toFormState = (snapshot: OnboardingSnapshot): FormState => ({
  role: snapshot.role,
  preferredTone: snapshot.preferredTone,
  mentorStyle: snapshot.mentor.style,
  timezone: snapshot.schedule.timezone,
  workStart: snapshot.schedule.workHours.start,
  workEnd: snapshot.schedule.workHours.end,
  dndStart: snapshot.schedule.dndHours.start,
  dndEnd: snapshot.schedule.dndHours.end,
  checkInTime: snapshot.schedule.checkIn.preferredTime,
  checkInFrequency: snapshot.schedule.checkIn.frequency,
  remindersEnabled: snapshot.planner.notifications.remindersEnabled,
  calendarSync: snapshot.planner.integrations.calendarSync,
  taskManagementSync: snapshot.planner.integrations.taskManagementSync,
});

const ProfilePage = () => {
  const { user, setOnboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redoing, setRedoing] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in again to view profile settings.',
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/getOnboardingData', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Unable to load onboarding profile');
      }

      const data = await response.json();
      const normalized = normalizeSnapshot(data, user?.name || 'Your Alter Ego');
      setSnapshot(normalized);
      setFormState(toFormState(normalized));
    } catch (error) {
      toast({
        title: 'Could not load profile',
        description: error instanceof Error ? error.message : 'Try refreshing this page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast, user?.name]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!snapshot || !formState) {
      return;
    }

    const role = formState.role.trim();
    if (!role) {
      toast({
        title: 'Role required',
        description: 'Please set your role before saving.',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const availability: Availability = {
      workHours: { start: formState.workStart, end: formState.workEnd },
      dndHours: { start: formState.dndStart, end: formState.dndEnd },
      checkIn: {
        preferredTime: formState.checkInTime,
        frequency: formState.checkInFrequency,
      },
      timezone: formState.timezone,
    };

    const mentor: Mentor = {
      archetype: snapshot.mentor.archetype,
      style: formState.mentorStyle,
      name: snapshot.mentor.name || user?.name || 'Your Alter Ego',
      avatar: snapshot.mentor.avatar || snapshot.coachAvatar || '/avatars/default.svg',
    };

    const payload: OnboardingSnapshot = {
      role,
      preferredTone: formState.preferredTone,
      coachAvatar: snapshot.coachAvatar || mentor.avatar,
      mentor,
      goals: snapshot.goals.map((goal) => ({
        ...goal,
        smartCriteria: goal.smartCriteria || defaultSmartCriteria(),
      })),
      answers: snapshot.answers,
      schedule: availability,
      planner: {
        goals: snapshot.goals,
        availability,
        notifications: {
          remindersEnabled: formState.remindersEnabled,
        },
        integrations: {
          calendarSync: formState.calendarSync,
          taskManagementSync: formState.taskManagementSync,
        },
      },
    };

    setSaving(true);
    try {
      const response = await fetch('/api/onboarding/updateOnboardingData', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      setSnapshot(payload);
      setFormState(toFormState(payload));
      toast({
        title: 'Profile updated',
        description: 'Your onboarding preferences were saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unable to save profile updates.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRedoOnboarding = async () => {
    if (!window.confirm('Redo onboarding will open the onboarding flow again. Continue?')) {
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setRedoing(true);
    try {
      const response = await fetch('/api/onboarding/redo', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to start onboarding redo');
      }

      setOnboardingCompleted(false);
      toast({
        title: 'Onboarding reset',
        description: 'You can now walk through onboarding again.',
      });
      navigate('/onboarding?redo=true', { replace: true });
    } catch (error) {
      toast({
        title: 'Redo unavailable',
        description: error instanceof Error ? error.message : 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setRedoing(false);
    }
  };

  if (loading || !formState || !snapshot) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-sky-100 via-cyan-50 to-emerald-100 px-6 py-8 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Profile Control Center
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{user?.name || 'Your Profile'}</h1>
            <p className="mt-2 text-sm text-slate-700 sm:text-base">
              Fine-tune your onboarding context so your coach and planner stay aligned with your current routine.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Target className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{snapshot.goals.length}</p>
            <p className="text-sm text-slate-600">Active goals in your onboarding plan</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Clock3 className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{formState.checkInFrequency}</p>
            <p className="text-sm text-slate-600">Check-in rhythm</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <UserRound className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{snapshot.mentor.archetype}</p>
            <p className="text-sm text-slate-600">Mentor archetype</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="truncate text-lg font-semibold text-slate-900">{formState.timezone}</p>
            <p className="text-sm text-slate-600">Current planning timezone</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Update Onboarding Details</h2>
              <p className="text-sm text-slate-600">Adjust role, tone, routine windows, and planner sync preferences.</p>
            </div>
            <button
              type="button"
              onClick={handleRedoOnboarding}
              disabled={redoing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              {redoing ? 'Preparing...' : 'Redo Onboarding'}
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Role</span>
                <input
                  value={formState.role}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, role: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                  placeholder="Professional"
                  required
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Preferred Tone</span>
                <input
                  value={formState.preferredTone}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, preferredTone: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                  placeholder="Encouraging"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Mentor Style</span>
                <input
                  value={formState.mentorStyle}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, mentorStyle: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                  placeholder="Friendly"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Work Start</span>
                <input
                  type="time"
                  value={formState.workStart}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, workStart: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Work End</span>
                <input
                  type="time"
                  value={formState.workEnd}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, workEnd: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Timezone</span>
                <input
                  value={formState.timezone}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, timezone: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                  placeholder="America/New_York"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">DND Start</span>
                <input
                  type="time"
                  value={formState.dndStart}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, dndStart: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">DND End</span>
                <input
                  type="time"
                  value={formState.dndEnd}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, dndEnd: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Check-in Time</span>
                <input
                  type="time"
                  value={formState.checkInTime}
                  onChange={(event) => setFormState((prev) => prev ? { ...prev, checkInTime: event.target.value } : prev)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Check-in Frequency</span>
                <select
                  value={formState.checkInFrequency}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? {
                            ...prev,
                            checkInFrequency: toFrequency(event.target.value),
                          }
                        : prev
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-sky-300 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formState.remindersEnabled}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, remindersEnabled: event.target.checked } : prev
                    )
                  }
                />
                Reminders enabled
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formState.calendarSync}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, calendarSync: event.target.checked } : prev
                    )
                  }
                />
                Calendar sync
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formState.taskManagementSync}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, taskManagementSync: event.target.checked } : prev
                    )
                  }
                />
                Task sync
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Updating onboarding details also refreshes your AI coach context.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Profile Updates'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
