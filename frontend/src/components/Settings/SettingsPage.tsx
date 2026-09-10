import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Database,
  MessageSquare,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';

import { PageHeader } from '../ui/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { getStoredAuthToken } from '../../utils/auth';
import { useToast } from '../ui/toast';

const CHAT_DOCKED_KEY = 'alterego_chat_docked';

/** localStorage keys the app uses purely as caches / sync throttles. */
const LOCAL_CACHE_KEYS = [
  'cached_projects',
  'cached_tags',
  'alterego-app-sync-ts',
  'alterego-agentic-backfill-ts',
  'alterego-agentic-onboarding-sync-ts',
  'alterego-agentic-time-backfill-ts',
  'alterego-agentic-backfill-version',
];

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

const Section = ({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof SettingsIcon;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const SettingsPage = () => {
  const { mode, setMode } = useTheme();
  const { toast } = useToast();
  const [chatDocked, setChatDocked] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    try {
      setChatDocked(window.localStorage.getItem(CHAT_DOCKED_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const updateChatDocked = useCallback((next: boolean) => {
    setChatDocked(next);
    try {
      window.localStorage.setItem(CHAT_DOCKED_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const handleResync = useCallback(async () => {
    const token = getStoredAuthToken();
    if (!token) {
      toast({ title: 'Not signed in', description: 'Sign in again to re-sync.', variant: 'destructive' });
      return;
    }

    setSyncing(true);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const results = await Promise.allSettled([
        fetch('/api/onboarding/syncAgenticSnapshot', { method: 'POST', headers, credentials: 'include' }),
        fetch('/api/timers/sync/agentic/backfill?limit=100', { method: 'POST', headers, credentials: 'include' }),
      ]);

      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      if (failed.length === results.length) {
        toast({
          title: 'Re-sync failed',
          description: 'Could not reach the sync service. Try again in a moment.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Re-sync started',
          description: 'Your setup and recent entries were sent over.',
        });
      }
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  const handleClearCache = useCallback(() => {
    try {
      LOCAL_CACHE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      toast({
        title: 'Local cache cleared',
        description: 'Cached projects, tags, and sync timers were reset. Reload to refetch.',
      });
    } catch {
      toast({ title: 'Could not clear cache', description: 'Browser storage is unavailable.', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <PageHeader
          title="Settings"
          icon={SettingsIcon}
          description="How it looks, how it behaves, and what syncs to the other half."
        />

        <Section
          title="Appearance"
          description="Applies across the whole app, on this device."
          icon={Sun}
        >
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const isActive = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setMode(option.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                  {isActive && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            &ldquo;System&rdquo; follows your operating system&apos;s light/dark setting.
          </p>
        </Section>

        <Section
          title="Chat"
          description="How the assistant opens when you tap Coach."
          icon={MessageSquare}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateChatDocked(false)}
              aria-pressed={!chatDocked}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                !chatDocked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Full screen
              <span className="mt-0.5 block text-xs font-normal opacity-80">Focused conversation</span>
            </button>
            <button
              type="button"
              onClick={() => updateChatDocked(true)}
              aria-pressed={chatDocked}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                chatDocked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Docked
              <span className="mt-0.5 block text-xs font-normal opacity-80">Keep working alongside it</span>
            </button>
          </div>
        </Section>

        <Section
          title="Data and sync"
          description="Your tracked time and onboarding profile feed the Coach's knowledge base."
          icon={Database}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleResync()}
              disabled={syncing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? 'Re-syncing…' : 'Re-sync now'}
            </button>
            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Clear local cache
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Only affects this browser. Nothing is deleted from your account.
          </p>
        </Section>

        <Section
          title="Elsewhere"
          description="Settings that live closer to the thing they configure."
          icon={SettingsIcon}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { to: '/profile', label: 'Profile & routine', hint: 'Role, tone, work hours, check-ins' },
              { to: '/projects', label: 'Projects', hint: 'Colours and client grouping' },
              { to: '/tags', label: 'Tags', hint: 'Your entry taxonomy' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-lg border border-border bg-muted px-3 py-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SettingsPage;
