/**
 * The chat. One of them, now.
 *
 * This file used to be a second assistant: a thousand lines that took a
 * sentence, guessed an intent from it, and called a timer or project endpoint
 * — with no idea what the person had tracked, what they were working toward,
 * or anything they had ever said. Meanwhile the coach embedded elsewhere in
 * this same app knew all of that and could not touch the tracking. So the
 * product asked people to know which of its two chats to talk to, and to say
 * things twice.
 *
 * There is one chat now and it is the engine's, because that is the half worth
 * keeping: it answers from real entries, refuses instead of inventing, shows
 * the facts behind an answer, and asks before it writes anything. What it
 * could not do — start a timer, record a session — it now does by calling this
 * app's own API as the person asking, so the entry lands in the same place a
 * button here would have put it.
 *
 * What is left here is the surface: full screen, the person's session handed
 * across, and a way out.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { useChat } from './ChatContext';
import {
  buildCoachLaunchUrl,
  requestAgenticBridgeToken,
  resolveCoachSrc,
} from '../../lib/coachEmbed';

/** Re-handed before the short-lived bridge token expires. */
const REFRESH_MARGIN_SECONDS = 30;

const FullScreenChat: React.FC = () => {
  const { isChatOpen, toggleChat } = useChat();
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    const bridge = await requestAgenticBridgeToken();
    if (!bridge) {
      // Without a token the chat would load and then not know who is asking,
      // which reads as "it has forgotten everything about me".
      setFailed(true);
      return;
    }

    setSrc(buildCoachLaunchUrl(resolveCoachSrc(), true, bridge.token, 'chat'));

    // The token is short-lived, and a conversation is not. Renew it while the
    // chat is open rather than letting a long conversation lose its footing
    // halfway through.
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
    }
    const after = Math.max(30, bridge.expiresInSeconds - REFRESH_MARGIN_SECONDS);
    refreshTimer.current = window.setTimeout(() => void load(), after * 1000);
  }, []);

  useEffect(() => {
    if (!isChatOpen) {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      return;
    }

    void load();

    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [isChatOpen, load]);

  // Escape closes it, the way every full-screen thing should.
  useEffect(() => {
    if (!isChatOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleChat();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isChatOpen, toggleChat]);

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="text-sm font-semibold text-foreground">Your alter ego</p>
        <button
          type="button"
          onClick={toggleChat}
          aria-label="Close"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {failed ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <p className="text-sm text-foreground">Couldn’t open the chat.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing you have tracked is affected.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      ) : src ? (
        <iframe
          key={src}
          title="Your alter ego"
          src={src}
          className="flex-1 border-0"
          allow="clipboard-write"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
    </div>
  );
};

export default FullScreenChat;
