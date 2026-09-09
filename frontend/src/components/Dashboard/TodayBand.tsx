import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Target, Flame, AlertTriangle, ArrowRight } from 'lucide-react';
import { getStoredAuthToken } from '../../utils/auth';

/**
 * What the dashboard says before the calendar starts.
 *
 * The dashboard was a bare week grid. Opening the app put you at midnight on a
 * column of empty hours — twelve of them before the first entry of the day —
 * and answered none of the questions someone opens a tracker to ask: what am I
 * doing, did I do what I said I would, and is my time going where I said it
 * mattered.
 *
 * A calendar is a record. This is the answer.
 */

type Task = {
  id?: string | number;
  title?: string;
  type?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  currentStreak?: number;
  completedDates?: string[];
};

type Goal = { title?: string; priority?: string };

type Entry = {
  startTime?: string;
  duration?: number;
  linkedGoal?: string | null;
  description?: string;
  projectId?: number | null;
};

const dateKey = (value: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

/** The user's own ordering. Anything unrecognised sorts last rather than first. */
const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityRank = (value?: string) =>
  PRIORITY_RANK[String(value || '').toLowerCase()] ?? 9;

const formatHours = (minutes: number) => {
  if (minutes <= 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

export const TodayBand = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const token = getStoredAuthToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const get = async (url: string) => {
      try {
        const response = await fetch(url, { headers, credentials: 'include' });
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      }
    };

    const [board, profile, timer] = await Promise.all([
      get('/api/task-board/state'),
      get('/api/onboarding/getOnboardingData'),
      get('/api/timer/entries'),
    ]);

    setTasks(Array.isArray(board?.tasks) ? board.tasks : []);
    setGoals(Array.isArray(profile?.goals) ? profile.goals : []);
    setEntries(Array.isArray(timer?.data) ? timer.data : Array.isArray(timer) ? timer : []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = dateKey(new Date());

  const habits = useMemo(
    () => tasks.filter((task) => String(task.type || '').toLowerCase() === 'habit'),
    [tasks],
  );

  const habitsDone = useMemo(
    () =>
      habits.filter(
        (habit) =>
          (habit.completedDates || []).includes(today) ||
          String(habit.status || '').toLowerCase() === 'completed',
      ),
    [habits, today],
  );

  const habitsLeft = habits.filter((habit) => !habitsDone.includes(habit));

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          String(task.type || '').toLowerCase() !== 'habit' &&
          String(task.status || '').toLowerCase() !== 'completed',
      ),
    [tasks],
  );

  const overdue = openTasks.filter((task) => task.deadline && task.deadline < today);
  const dueToday = openTasks.filter((task) => task.deadline === today);

  /**
   * Hours against each stated goal this week, ordered by the priority the user
   * gave it — not by the hours. A critical goal with nothing against it is the
   * most useful thing this screen can say, and sorting by size would bury it.
   */
  const goalProgress = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const minutes = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.linkedGoal || !entry.startTime) continue;
      if (new Date(entry.startTime) < weekAgo) continue;
      const key = String(entry.linkedGoal);
      minutes.set(key, (minutes.get(key) || 0) + Math.round((entry.duration || 0) / 60));
    }

    return goals
      .map((goal) => ({
        title: String(goal.title || '').trim(),
        priority: String(goal.priority || '').trim(),
        minutes: minutes.get(String(goal.title || '').trim()) || 0,
      }))
      .filter((goal) => goal.title)
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  }, [goals, entries]);

  const neglected = goalProgress.filter(
    (goal) => goal.minutes === 0 && priorityRank(goal.priority) <= 1,
  );

  const trackedToday = useMemo(
    () =>
      entries
        .filter((entry) => entry.startTime && dateKey(new Date(entry.startTime)) === today)
        .reduce((total, entry) => total + Math.round((entry.duration || 0) / 60), 0),
    [entries, today],
  );

  if (!loaded) {
    return <div className="h-32 animate-pulse rounded-2xl border border-border bg-card/60" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Today */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today
        </h2>
        <p className="mt-2 text-3xl font-semibold text-foreground">
          {trackedToday > 0 ? formatHours(trackedToday) : 'Nothing yet'}
        </p>
        <p className="text-sm text-muted-foreground">
          {trackedToday > 0 ? 'tracked so far' : 'no timer has run today'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/timer')}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {trackedToday > 0 ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {trackedToday > 0 ? 'Open timer' : 'Start tracking'}
        </button>
      </section>

      {/* Commitments */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What you said you&rsquo;d do
        </h2>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-foreground">
            {habitsDone.length}/{habits.length || 0}
          </span>
          <span className="text-sm text-muted-foreground">habits done</span>
        </div>

        {habitsLeft.length > 0 && (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Left: {habitsLeft.map((habit) => habit.title).filter(Boolean).join(', ')}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {overdue.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overdue.length} overdue
            </span>
          )}
          {dueToday.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 font-medium text-warning">
              {dueToday.length} due today
            </span>
          )}
          {overdue.length === 0 && dueToday.length === 0 && (
            <span className="text-muted-foreground">Nothing due today.</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open tasks <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* Goals against reality */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This week, against what matters
        </h2>

        {goalProgress.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No goals set yet. Add one and time logged against it shows up here.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {goalProgress.slice(0, 4).map((goal) => (
              <li key={goal.title} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Target
                    className={
                      goal.minutes === 0
                        ? 'h-3.5 w-3.5 shrink-0 text-muted-foreground'
                        : 'h-3.5 w-3.5 shrink-0 text-success'
                    }
                  />
                  <span className="truncate text-foreground">{goal.title}</span>
                  {goal.priority && (
                    <span className="shrink-0 text-xs text-muted-foreground">{goal.priority}</span>
                  )}
                </span>
                <span
                  className={
                    goal.minutes === 0
                      ? 'shrink-0 font-medium text-muted-foreground'
                      : 'shrink-0 font-medium text-foreground'
                  }
                >
                  {formatHours(goal.minutes)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* The finding worth interrupting someone for. */}
        {neglected.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-2 text-sm text-warning">
            <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {neglected.length === 1
                ? `${neglected[0].title} is ${neglected[0].priority.toLowerCase()} priority and had no time this week.`
                : `${neglected.length} of your highest-priority goals had no time this week.`}
            </span>
          </p>
        )}
      </section>
    </div>
  );
};

export default TodayBand;
