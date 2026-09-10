import { ArrowUpRight, CalendarClock, Eye, ExternalLink, LineChart, Sparkles, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStoredAuthToken } from '../../utils/auth';
import { PageHeader } from '../ui/PageHeader';

const BUILTIN_COACH_URL_CANDIDATES = [
  'https://agenticlyf.vercel.app/coach/',
  'https://agenticlyf-tushar-sharmas-projects-b09f4a9f.vercel.app/coach/',
  'https://agenticlyf-git-main-tushar-sharmas-projects-b09f4a9f.vercel.app/coach/',
];

const BUILTIN_ALLOWED_COACH_HOSTS = BUILTIN_COACH_URL_CANDIDATES.map((url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}).filter((host) => host.length > 0);

const ENV_ALLOWED_COACH_HOSTS = ((import.meta.env.VITE_ALLOWED_COACH_HOSTS as string | undefined) || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter((host) => host.length > 0);

const ALLOWED_EXTERNAL_COACH_HOSTS = Array.from(
  new Set([...BUILTIN_ALLOWED_COACH_HOSTS, ...ENV_ALLOWED_COACH_HOSTS]),
);

const normalizePath = (path: string): string => {
  const normalized = path.replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/';
};

const resolveCoachSrc = (): string => {
  const explicitCoachUrl = (import.meta.env.VITE_AGENTIC_COACH_URL as string | undefined)?.trim();
  const agenticApiOrigin = (import.meta.env.VITE_AGENTIC_API_ORIGIN as string | undefined)?.trim();

  const toTrustedUrl = (rawUrl: string): string | null => {
    try {
      const parsed = new URL(rawUrl, window.location.origin);
      const sameOrigin = parsed.origin === window.location.origin;
      const allowlistedExternalHost = ALLOWED_EXTERNAL_COACH_HOSTS.includes(parsed.hostname.toLowerCase());

      if (sameOrigin || allowlistedExternalHost) {
        return parsed.toString();
      }

      return null;
    } catch {
      return null;
    }
  };

  if (explicitCoachUrl) {
    const trustedExplicitUrl = toTrustedUrl(explicitCoachUrl);
    if (trustedExplicitUrl) {
      return trustedExplicitUrl;
    }
  }

  if (agenticApiOrigin) {
    const trustedAgenticOriginUrl = toTrustedUrl(`${agenticApiOrigin.replace(/\/+$/, '')}/coach/`);
    if (trustedAgenticOriginUrl) {
      return trustedAgenticOriginUrl;
    }
  }

  for (const fallbackUrl of BUILTIN_COACH_URL_CANDIDATES) {
    const trustedUrl = toTrustedUrl(fallbackUrl);
    if (trustedUrl) {
      return trustedUrl;
    }
  }

  return '/coach/';
};

type CoachTargetView = 'chat' | 'knowledge' | 'analytics' | 'notifications';

const buildCoachLaunchUrl = (
  url: string,
  embedMode: boolean,
  bridgeToken?: string | null,
  targetView: CoachTargetView = 'chat',
  returnPath = '/coach/launcher'
): string => {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('from', 'alterego');
    parsed.searchParams.set('view', targetView);
    parsed.searchParams.set('return_url', `${window.location.origin}${returnPath}`);

    if (bridgeToken) {
      parsed.searchParams.set('bridge_token', bridgeToken);
    }

    if (embedMode) {
      parsed.searchParams.set('embed', '1');
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

type BridgeTokenResponse = {
  token: string;
  expiresInSeconds: number;
};

const requestAgenticBridgeToken = async (): Promise<BridgeTokenResponse | null> => {
  try {
    const token = getStoredAuthToken();
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const response = await fetch('/api/auth/agentic-bridge-token', {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<BridgeTokenResponse>;
    if (!payload.token) {
      return null;
    }

    return {
      token: payload.token,
      expiresInSeconds: Math.max(30, payload.expiresInSeconds ?? 180),
    };
  } catch {
    return null;
  }
};

const AGENTIC_BACKFILL_MARKER = 'alterego-agentic-backfill-ts';
const AGENTIC_ONBOARDING_SYNC_MARKER = 'alterego-agentic-onboarding-sync-ts';
const AGENTIC_TIME_ENTRY_BACKFILL_MARKER = 'alterego-agentic-time-backfill-ts';
const AGENTIC_BACKFILL_VERSION_MARKER = 'alterego-agentic-backfill-version';
const AGENTIC_ONBOARDING_SYNC_INTERVAL_MS = 2 * 60 * 1000;
const AGENTIC_TIME_ENTRY_BACKFILL_INTERVAL_MS = 12 * 60 * 60 * 1000;
const AGENTIC_INITIAL_BACKFILL_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const BACKFILL_VERSION = 'v2-jwt-fix'; // Increment to force fresh backfill after auth fixes

const shouldRunFullBackfill = (): boolean => {
  try {
    const now = Date.now();

    // Check if backfill version changed (forces fresh backfill after auth fixes)
    const lastVersion = window.localStorage.getItem(AGENTIC_BACKFILL_VERSION_MARKER);
    if (lastVersion !== BACKFILL_VERSION) {
      window.localStorage.setItem(AGENTIC_BACKFILL_VERSION_MARKER, BACKFILL_VERSION);
      window.localStorage.setItem(AGENTIC_BACKFILL_MARKER, String(now));
      return true;
    }

    const raw = window.localStorage.getItem(AGENTIC_BACKFILL_MARKER);
    const lastRun = raw ? Number.parseInt(raw, 10) : 0;
    if (Number.isFinite(lastRun) && lastRun > 0 && now - lastRun < AGENTIC_INITIAL_BACKFILL_INTERVAL_MS) {
      return false;
    }

    window.localStorage.setItem(AGENTIC_BACKFILL_MARKER, String(now));
    return true;
  } catch {
    return true;
  }
};

const shouldRunIntervalSync = (markerKey: string, intervalMs: number): boolean => {
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(markerKey);
    const lastRun = raw ? Number.parseInt(raw, 10) : 0;
    if (Number.isFinite(lastRun) && lastRun > 0 && now - lastRun < intervalMs) {
      return false;
    }

    window.localStorage.setItem(markerKey, String(now));
    return true;
  } catch {
    return true;
  }
};

const primeCoachKnowledge = async (): Promise<void> => {
  try {
    const onboardingSyncEnabled = shouldRunIntervalSync(
      AGENTIC_ONBOARDING_SYNC_MARKER,
      AGENTIC_ONBOARDING_SYNC_INTERVAL_MS,
    );

    const shouldRunBackfill = shouldRunFullBackfill()
      || shouldRunIntervalSync(AGENTIC_TIME_ENTRY_BACKFILL_MARKER, AGENTIC_TIME_ENTRY_BACKFILL_INTERVAL_MS);
    const backfillEndpoint = shouldRunBackfill
      ? '/api/timers/sync/agentic/backfill?limit=100'
      : null;

    const token = getStoredAuthToken();
    const authHeaders: HeadersInit = token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };

    const syncTasks: Array<Promise<Response>> = [];

    if (onboardingSyncEnabled) {
      syncTasks.push(
        fetch('/api/onboarding/syncAgenticSnapshot', {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
        }),
      );
    }

    if (backfillEndpoint) {
      syncTasks.push(
        fetch(backfillEndpoint, {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
        }),
      );
    }

    await Promise.allSettled(syncTasks);
  } catch {
    // Best-effort pre-sync only; Coach launch should continue regardless.
  }
};

type CoachWorkspaceProps = {
  autoLaunch?: boolean;
  targetView?: CoachTargetView;
  returnPath?: string;
};

const CoachWorkspace = ({
  autoLaunch = false,
  targetView = 'chat',
  returnPath,
}: CoachWorkspaceProps) => {
  const [showEmbeddedPreview, setShowEmbeddedPreview] = useState(false);
  const [bridgeToken, setBridgeToken] = useState<string | null>(null);
  const [bridgeTokenExpiresAt, setBridgeTokenExpiresAt] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoLaunchedRef = useRef(false);
  const resolvedReturnPath = returnPath ?? (autoLaunch ? '/dashboard' : '/coach/launcher');

  const ensureBridgeToken = useCallback(async (): Promise<string | null> => {
    if (bridgeToken && Date.now() < bridgeTokenExpiresAt - 15000) {
      return bridgeToken;
    }

    const tokenResponse = await requestAgenticBridgeToken();
    if (!tokenResponse) {
      return null;
    }

    setBridgeToken(tokenResponse.token);
    setBridgeTokenExpiresAt(Date.now() + tokenResponse.expiresInSeconds * 1000);
    return tokenResponse.token;
  }, [bridgeToken, bridgeTokenExpiresAt]);

  useEffect(() => {
    // Reset both window and scrollable parent containers to avoid opening mid-scroll.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const node = containerRef.current;
    if (!node) {
      return;
    }

    let parent: HTMLElement | null = node.parentElement;
    while (parent) {
      parent.scrollTop = 0;
      parent = parent.parentElement;
    }
  }, []);

  useEffect(() => {
    void ensureBridgeToken();
  }, [ensureBridgeToken]);

  const coachSrc = useMemo(() => {
    const resolved = resolveCoachSrc();

    try {
      const url = new URL(resolved, window.location.origin);
      const sameOrigin = url.origin === window.location.origin;
      const samePath = normalizePath(url.pathname) === normalizePath(window.location.pathname);

      if (sameOrigin && samePath) {
        return null;
      }
    } catch {
      return resolved;
    }

    return resolved;
  }, []);

  const coachEmbedSrc = useMemo(() => {
    if (!coachSrc) {
      return null;
    }
    return buildCoachLaunchUrl(coachSrc, true, bridgeToken, targetView, resolvedReturnPath);
  }, [bridgeToken, coachSrc, resolvedReturnPath, targetView]);

  const openCoach = useCallback((newTab: boolean) => {
    if (!coachSrc) {
      return;
    }

    // Warm up sync and give requests a short head start before navigating away.
    const preSyncPromise = primeCoachKnowledge();

    const popup = newTab ? window.open('about:blank', '_blank', 'noopener,noreferrer') : null;

    const navigateToCoach = (token: string | null) => {
      const launchUrl = buildCoachLaunchUrl(coachSrc, false, token, targetView, resolvedReturnPath);

      if (newTab) {
        if (popup) {
          popup.location.replace(launchUrl);
          return;
        }

        const openedWindow = window.open(launchUrl, '_blank', 'noopener,noreferrer');
        if (!openedWindow) {
          window.location.assign(launchUrl);
        }
        return;
      }

      window.location.assign(launchUrl);
    };

    void preSyncPromise.catch(() => undefined);

    void ensureBridgeToken()
      .then((token) => navigateToCoach(token))
      .catch(() => navigateToCoach(null));
  }, [coachSrc, ensureBridgeToken, resolvedReturnPath, targetView]);

  useEffect(() => {
    if (!autoLaunch || !coachSrc || hasAutoLaunchedRef.current) {
      return;
    }

    hasAutoLaunchedRef.current = true;
    openCoach(false);
  }, [autoLaunch, coachSrc, openCoach]);

  const viewLabel = targetView === 'analytics'
    ? 'Analytics'
    : targetView === 'notifications'
      ? 'AI Notifications'
    : targetView === 'knowledge'
      ? 'Memory'
      : 'Coach';

  const capabilities = [
    {
      icon: CalendarClock,
      title: 'Repairs your schedule',
      body: 'When a block runs over, it reshuffles the rest of your day and proposes new focus times.',
    },
    {
      icon: Wand2,
      title: 'Nudges your focus',
      body: 'Watches your Pomodoro rhythm and idle time, and steps in with a calming or motivating prompt.',
    },
    {
      icon: LineChart,
      title: 'Recaps your week',
      body: 'Turns your tracked time into a plain-language read on where the hours went and what changed.',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <PageHeader
          title={`Meet your Coach${viewLabel === 'Coach' ? '' : ` · ${viewLabel}`}`}
          icon={Sparkles}
          description={
            autoLaunch
              ? `Opening the ${viewLabel} view of your Coach…`
              : 'The other half of Alter Ego. It reads everything you track and works with you on it. Opens in its own view, and brings you back here when you are done.'
          }
        />

        {coachSrc ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {capabilities.map((cap) => (
                <div key={cap.title} className="rounded-xl border border-border bg-card p-4">
                  <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-surface text-primary">
                    <cap.icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{cap.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{cap.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openCoach(false)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open Alter Ego
              </button>
              <button
                type="button"
                onClick={() => openCoach(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Open in a new tab
              </button>
            </div>

            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                <Eye className="h-3.5 w-3.5" />
                Advanced — preview it inline
              </summary>
              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => setShowEmbeddedPreview((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {showEmbeddedPreview ? 'Hide preview' : 'Show embedded preview'}
                </button>
                {showEmbeddedPreview && coachEmbedSrc && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <iframe title="Preview" src={coachEmbedSrc} className="h-[70vh] w-full border-0" />
                  </div>
                )}
              </div>
            </details>
          </>
        ) : (
          <div className="rounded-xl border border-warning bg-surface p-4 text-sm text-surface-foreground">
            The Coach endpoint resolves back to this route. Set <code className="font-mono text-xs">VITE_AGENTIC_COACH_URL</code>{' '}
            (preferred) and keep <code className="font-mono text-xs">VITE_ALLOWED_COACH_HOSTS</code> current so this
            launcher can open the dedicated Coach app safely.
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachWorkspace;
