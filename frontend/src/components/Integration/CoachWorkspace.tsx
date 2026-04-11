import { ArrowUpRight, Eye, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type CoachTargetView = 'chat' | 'knowledge' | 'analytics';

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
    const response = await fetch('/api/auth/agentic-bridge-token', {
      method: 'GET',
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

const AGENTIC_BACKFILL_MARKER = 'alterego-agentic-backfill-date';
const AGENTIC_ONBOARDING_SYNC_MARKER = 'alterego-agentic-onboarding-sync-ts';
const AGENTIC_TIME_ENTRY_BACKFILL_MARKER = 'alterego-agentic-time-backfill-ts';
const AGENTIC_ONBOARDING_SYNC_INTERVAL_MS = 2 * 60 * 1000;
const AGENTIC_TIME_ENTRY_BACKFILL_INTERVAL_MS = 30 * 60 * 1000;

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shouldRunFullBackfill = (): boolean => {
  try {
    const today = toLocalDateKey(new Date());
    const lastBackfillDate = window.localStorage.getItem(AGENTIC_BACKFILL_MARKER);
    if (lastBackfillDate === today) {
      return false;
    }

    window.localStorage.setItem(AGENTIC_BACKFILL_MARKER, today);
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
      ? '/api/timers/sync/agentic/backfill?limit=250'
      : null;

    const syncTasks: Array<Promise<Response>> = [
      fetch('/api/onboarding/getOnboardingData', {
        method: 'GET',
        credentials: 'include',
      }),
    ];

    if (onboardingSyncEnabled) {
      syncTasks.push(
        fetch('/api/onboarding/syncAgenticSnapshot', {
          method: 'POST',
          credentials: 'include',
        }),
      );
    }

    if (backfillEndpoint) {
      syncTasks.push(
        fetch(backfillEndpoint, {
          method: 'POST',
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

    void Promise.allSettled([preSyncPromise, ensureBridgeToken()])
      .then((results) => {
        const tokenResult = results[1];
        const token = tokenResult.status === 'fulfilled' ? tokenResult.value : null;
        navigateToCoach(token);
      })
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
    : targetView === 'knowledge'
      ? 'Knowledge Base'
      : 'Coach';

  return (
    <div ref={containerRef} className="flex min-h-screen w-full flex-col bg-gradient-to-b from-slate-50 via-white to-blue-50/40 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">AI Coach Workspace</h1>
          <p className="text-sm text-gray-600">
            Launch Agentic {viewLabel} as an AlterEgo extension with return navigation and background context sync.
          </p>
          {autoLaunch && (
            <p className="text-xs text-gray-500">
              Redirecting you to Agentic {viewLabel}...
            </p>
          )}
        </div>

        {coachSrc ? (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openCoach(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open Coach Full Window
              </button>

              <button
                type="button"
                onClick={() => openCoach(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowEmbeddedPreview((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Eye className="h-3.5 w-3.5" />
              {showEmbeddedPreview ? 'Hide Embedded Preview' : 'Show Embedded Preview'}
            </button>

            {showEmbeddedPreview && coachEmbedSrc && (
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <iframe title="AI Coach Preview" src={coachEmbedSrc} className="h-[70vh] w-full border-0" />
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Coach endpoint resolves to this same route. Configure VITE_AGENTIC_COACH_URL (preferred) and keep
            VITE_ALLOWED_COACH_HOSTS updated so this launcher can open the dedicated Coach application safely.
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachWorkspace;
