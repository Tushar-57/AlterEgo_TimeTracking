const TIMETRACKER_LOCAL_ORIGIN_PATTERNS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const AGENTIC_LOCAL_ORIGIN_PATTERNS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const TIMETRACKER_API_ORIGIN = (import.meta.env.VITE_TIMETRACKER_API_ORIGIN as string | undefined)?.trim();
const AGENTIC_API_ORIGIN = (import.meta.env.VITE_AGENTIC_API_ORIGIN as string | undefined)?.trim();
const AGENTIC_PREFIX = (import.meta.env.VITE_AGENTIC_API_PREFIX as string) || '/agentic-api';

const AUTH_SESSION_KEY = 'auth_session';
// No marker/fallback allowed
const AUTH_SESSION_MARKER = '__NO_SESSION__';

let fetchRewriteInstalled = false;

function joinOriginPath(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function stripPrefix(path: string, prefix: string): string {
  if (!path.startsWith(prefix)) {
    return path;
  }

  const stripped = path.slice(prefix.length);
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

function replaceOrigin(url: string, origins: string[], replacement: string): string {
  for (const origin of origins) {
    if (url.startsWith(origin)) {
      return `${replacement}${url.slice(origin.length)}`;
    }
  }

  return url;
}

function normalizeRuntimeUrl(url: string): string {
  if (typeof window === 'undefined') {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

function rewriteUrl(url: string): string {
  const normalizedUrl = normalizeRuntimeUrl(url);

  if (TIMETRACKER_API_ORIGIN && normalizedUrl.startsWith('/api')) {
    return joinOriginPath(TIMETRACKER_API_ORIGIN, normalizedUrl);
  }

  if (AGENTIC_API_ORIGIN && normalizedUrl.startsWith(AGENTIC_PREFIX)) {
    return joinOriginPath(AGENTIC_API_ORIGIN, stripPrefix(normalizedUrl, AGENTIC_PREFIX));
  }

  const toSameOrigin = replaceOrigin(normalizedUrl, TIMETRACKER_LOCAL_ORIGIN_PATTERNS, '');
  if (toSameOrigin !== normalizedUrl) {
    if (TIMETRACKER_API_ORIGIN) {
      return joinOriginPath(TIMETRACKER_API_ORIGIN, toSameOrigin);
    }

    return toSameOrigin;
  }

  const toAgenticPath = replaceOrigin(normalizedUrl, AGENTIC_LOCAL_ORIGIN_PATTERNS, AGENTIC_PREFIX);
  if (toAgenticPath !== normalizedUrl) {
    if (AGENTIC_API_ORIGIN) {
      return joinOriginPath(AGENTIC_API_ORIGIN, stripPrefix(toAgenticPath, AGENTIC_PREFIX));
    }

    return toAgenticPath;
  }

  return normalizedUrl;
}

function isTimeTrackerApiUrl(url: string): boolean {
  if (typeof window === 'undefined') {
    return url.startsWith('/api');
  }

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith('/api');
  } catch {
    return url.startsWith('/api');
  }
}

function buildRequestInit(
  rewrittenUrl: string,
  init?: RequestInit,
  fallbackHeaders?: HeadersInit,
): RequestInit {
  const requiresCookieAuth = isTimeTrackerApiUrl(rewrittenUrl);
  const headers = new Headers(init?.headers ?? fallbackHeaders ?? undefined);

  if (requiresCookieAuth) {
    // Only attach Authorization if a real JWT is present
    const sessionToken = resolveSessionAuthToken();
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    } else {
      headers.delete('Authorization');
    }
  }

  return {
    ...init,
    headers,
    credentials: requiresCookieAuth ? 'include' : init?.credentials,
  };
}

function resolveSessionAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const normalized = raw.trim();
    // Only accept a real JWT (three segments, non-empty)
    if (!normalized || normalized.split('.').length !== 3) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function installApiRouting(): void {
  if (fetchRewriteInstalled || typeof window === 'undefined') {
    return;
  }

  fetchRewriteInstalled = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      const rewritten = rewriteUrl(input);
      return nativeFetch(rewritten, buildRequestInit(rewritten, init));
    }

    if (input instanceof URL) {
      const rewritten = rewriteUrl(input.toString());
      return nativeFetch(rewritten, buildRequestInit(rewritten, init));
    }

    if (input instanceof Request) {
      const rewritten = rewriteUrl(input.url);
      const nextInit = buildRequestInit(rewritten, init, input.headers);

      if (rewritten === input.url) {
        return nativeFetch(input, nextInit);
      }

      const rewrittenRequest = new Request(rewritten, input);
      return nativeFetch(rewrittenRequest, nextInit);
    }

    return nativeFetch(input, init);
  };
}
