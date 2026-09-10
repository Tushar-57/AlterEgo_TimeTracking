/**
 * One chat, reachable from either half of the product.
 *
 * AlterEgo used to carry its own assistant — a command parser that could start
 * a timer and create a project, and knew nothing about the person — alongside
 * an embedded coach that knew everything about them and could not touch their
 * tracking. Two chats, in one app, each missing the other half, and the person
 * had to know which one to ask.
 *
 * There is one now, and it is the engine's: grounded in real entries, refusing
 * rather than inventing, proposing before it writes. What it could not do — put
 * the clock on something, record a finished session — it now does by calling
 * AlterEgo's own API as the person who asked (see the runners module in the
 * agentic backend).
 *
 * This module is the handoff: where that chat lives, and how it is told who is
 * asking. It was inlined in CoachWorkspace; both surfaces share it now, because
 * two copies of an allowlist is how one of them ends up wrong.
 */

import { getStoredAuthToken } from '../utils/auth';


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

export { BUILTIN_COACH_URL_CANDIDATES, ALLOWED_EXTERNAL_COACH_HOSTS };
export { resolveCoachSrc, buildCoachLaunchUrl, requestAgenticBridgeToken, normalizePath };
export type { CoachTargetView, BridgeTokenResponse };
