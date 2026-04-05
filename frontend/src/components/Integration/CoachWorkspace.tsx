import { ArrowUpRight, Eye, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

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

const withEmbedMode = (url: string): string => {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('embed', '1');
    return parsed.toString();
  } catch {
    return url;
  }
};

const primeCoachKnowledge = async (): Promise<void> => {
  try {
    await fetch('/api/onboarding/getOnboardingData', {
      method: 'GET',
      credentials: 'include',
    });
  } catch {
    // Best-effort pre-sync only; Coach launch should continue regardless.
  }
};

const CoachWorkspace = () => {
  const [showEmbeddedPreview, setShowEmbeddedPreview] = useState(false);

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
    return withEmbedMode(coachSrc);
  }, [coachSrc]);

  const openCoach = async (newTab: boolean) => {
    if (!coachSrc) {
      return;
    }

    await primeCoachKnowledge();

    if (newTab) {
      window.open(coachSrc, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(coachSrc);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-slate-50 via-white to-blue-50/40 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">AI Coach Workspace</h1>
          <p className="text-sm text-gray-600">
            Switched to a cleaner launch flow. Open Coach in a full window for the best UX and no nested menu duplication.
          </p>
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
