import { Keyboard, Settings, Timer as TimerIcon } from 'lucide-react';

import { PageHeader } from '../ui/page-header';

/**
 * Timer page header. Deliberately does NOT repeat the theme toggle or the user
 * avatar — the app shell (sidebar on desktop, top bar on mobile) already owns
 * both, and three theme toggles on one mobile screen was the most confusing
 * thing on this page. Only page-scoped actions live here.
 */
export const TimerHeader = ({
  setShowSettingsDialog,
  setShowKeyboardShortcutsDialog,
}: {
  setShowSettingsDialog: (show: boolean) => void;
  setShowKeyboardShortcutsDialog: (show: boolean) => void;
}) => (
  <PageHeader
    eyebrow="Overview"
    title="Timer"
    icon={TimerIcon}
    subtitle="Start tracking in one tap. Everything you log feeds your calendar and your Coach."
    className="mb-6"
    actions={
      <>
        <button
          type="button"
          onClick={() => setShowKeyboardShortcutsDialog(true)}
          aria-label="Keyboard shortcuts"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Keyboard className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowSettingsDialog(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Timer settings
        </button>
      </>
    }
  />
);
