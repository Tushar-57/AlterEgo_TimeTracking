import { useCallback, useEffect, useRef } from 'react';
import { toast } from './use-toast';
import { getStoredAuthToken } from '../utils/auth';

/**
 * The three daily beats, delivered while this app is open.
 *
 * Morning, halfway and evening, anchored to the work hours the person set up
 * rather than to one wall-clock time the product picked. The agentic service
 * decides when each is due and writes it down; this asks what has not been
 * shown yet and shows it — as an operating-system notification when the
 * window is in the background, and as a toast when it is not.
 *
 * The same hook exists in the agentic frontend. It is duplicated rather than
 * shared because the two repositories have different toast libraries and
 * different auth, and this is small enough that a package to hold it would
 * cost more than the copy does.
 */
export interface Nudge {
  beat: 'morning' | 'midday' | 'evening' | string;
  local_date: string;
  title: string;
  body: string;
  weight: 'light' | 'honest' | 'heavy' | string;
  path: string;
  created_at: string;
}

const POLL_MS = 60_000;

export function browserNotificationState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

const authHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

interface UseNudgesOptions {
  onOpen?: (nudge: Nudge) => void;
  enabled?: boolean;
}

export function useNudges({ onOpen, enabled = true }: UseNudgesOptions = {}) {
  const shownRef = useRef<Set<string>>(new Set());
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  const markSeen = useCallback(async (nudge: Nudge) => {
    try {
      await fetch('/agentic-api/api/nudges/seen', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ beat: nudge.beat, local_date: nudge.local_date, channel: 'web' }),
      });
    } catch {
      // A beat shown but not recorded is offered once more. Repeating beats
      // losing it.
    }
  }, []);

  const present = useCallback(
    (nudge: Nudge) => {
      const key = `${nudge.beat}:${nudge.local_date}`;
      if (shownRef.current.has(key)) return;
      shownRef.current.add(key);

      const open = () => openRef.current?.(nudge);

      if (document.hidden && browserNotificationState() === 'granted') {
        try {
          const notification = new Notification(nudge.title, { body: nudge.body, tag: key });
          notification.onclick = () => {
            window.focus();
            open();
            notification.close();
          };
          void markSeen(nudge);
          return;
        } catch {
          // Fall through to the in-app toast.
        }
      }

      toast({ title: nudge.title, description: nudge.body });
      void markSeen(nudge);
    },
    [markSeen],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled || !navigator.onLine || !getStoredAuthToken()) return;
      try {
        const response = await fetch('/agentic-api/api/nudges/pending', {
          headers: authHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (cancelled || !Array.isArray(payload)) return;
        // Oldest first, so a backlog arrives in the order the day happened.
        [...(payload as Nudge[])].reverse().forEach(present);
      } catch {
        // Offline, or the agentic service is asleep. The next tick retries.
      }
    };

    void poll();
    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, present]);
}
