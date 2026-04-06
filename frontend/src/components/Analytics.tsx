import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Clock,
  Calendar,
  Users,
  ArrowUp,
  ArrowDown,
  BarChart2,
  PieChart,
  Activity,
  Sparkles,
  TrendingUp,
  Target,
} from 'lucide-react';

type TimeRange = 'week' | 'month' | 'quarter';

type StatMetric = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
};

const METRICS: StatMetric[] = [
  {
    icon: Clock,
    label: 'Tracked Hours',
    value: '164.2h',
    change: '12%',
    changeType: 'positive',
  },
  {
    icon: Calendar,
    label: 'Productive Days',
    value: '18 / 22',
    change: '8%',
    changeType: 'positive',
  },
  {
    icon: Users,
    label: 'Active Projects',
    value: '7',
    change: '2',
    changeType: 'negative',
  },
  {
    icon: Activity,
    label: 'Efficiency',
    value: '87%',
    change: '5%',
    changeType: 'positive',
  },
];

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
};

const StatCard = ({ icon: Icon, label, value, change, changeType }: StatMetric) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-slate-700 dark:bg-slate-900/75">
    <div className="mb-4 flex items-start justify-between gap-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </div>
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          changeType === 'positive'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
        }`}
      >
        {changeType === 'positive' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        {change}
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  </article>
);

const PlaceholderBars = ({ tone }: { tone: 'blue' | 'amber' }) => {
  const bars = useMemo(() => [56, 72, 48, 80, 64, 76, 58], []);
  const barTone =
    tone === 'blue'
      ? 'from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400'
      : 'from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400';

  return (
    <div className="flex h-56 items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      {bars.map((height, index) => (
        <div key={index} className="flex-1">
          <div
            className={`w-full rounded-md bg-gradient-to-t ${barTone} opacity-85`}
            style={{ height: `${height}%` }}
          />
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [range, setRange] = useState<TimeRange>('month');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-amber-50 pb-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-6 sm:pt-7">
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white/95 via-cyan-50/90 to-amber-50/90 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.7)] sm:p-7 dark:border-slate-700 dark:from-slate-900/95 dark:via-cyan-950/25 dark:to-amber-950/25">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-800 dark:bg-slate-900/70 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Performance Intelligence
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                Analytics Dashboard
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                Track momentum, focus quality, and workload balance with visuals that stay legible in both themes.
              </p>
            </div>

            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/85 p-1 dark:border-slate-700 dark:bg-slate-900/70">
              {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((item) => {
                const active = range === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRange(item)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      active
                        ? 'bg-gradient-to-r from-teal-700 via-cyan-600 to-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {TIME_RANGE_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6 dark:border-slate-700 dark:bg-slate-900/75">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hours by Project</h3>
              </div>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                {TIME_RANGE_LABELS[range]}
              </span>
            </div>
            <PlaceholderBars tone="blue" />
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6 dark:border-slate-700 dark:bg-slate-900/75">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Time Distribution</h3>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                {TIME_RANGE_LABELS[range]}
              </span>
            </div>

            <div className="grid h-56 grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">42%</div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Deep Work</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">33%</div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Meetings</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">18%</div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Support</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <div className="text-3xl font-semibold text-slate-900 dark:text-slate-100">7%</div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Admin</p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900/75">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Focus Signals</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Quality indicators to improve planning decisions.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              <TrendingUp className="h-3.5 w-3.5" />
              +9% week-over-week
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/65">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Focus Streak</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">6 days</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/65">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Distraction Rate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">14%</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/65">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Goal Progress</p>
              <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                73%
                <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;