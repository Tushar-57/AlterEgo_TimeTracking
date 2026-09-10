import { useCallback, useEffect, useState } from 'react';

/**
 * Stops an accidental dismissal from throwing away a half-filled form.
 *
 * The caller decides what "dirty" means — normally by comparing a serialized
 * snapshot of the live fields against the values the dialog opened with, so an
 * edit that is typed and then undone back to the original does not count as
 * unsaved work. `requestClose` closes a clean form straight away (an untouched
 * dialog should still be dismissable with a stray click) and otherwise raises
 * the discard prompt that the caller renders.
 */
export function useUnsavedChangesGuard({
  isOpen,
  isDirty,
  onClose,
}: {
  isOpen: boolean;
  isDirty: boolean;
  onClose: () => void;
}) {
  const [isDiscardPromptOpen, setIsDiscardPromptOpen] = useState(false);

  // A reopened dialog must never inherit the previous session's prompt.
  useEffect(() => {
    if (!isOpen) {
      setIsDiscardPromptOpen(false);
    }
  }, [isOpen]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setIsDiscardPromptOpen(true);
      return;
    }

    onClose();
  }, [isDirty, onClose]);

  const discardAndClose = useCallback(() => {
    setIsDiscardPromptOpen(false);
    onClose();
  }, [onClose]);

  const keepEditing = useCallback(() => {
    setIsDiscardPromptOpen(false);
  }, []);

  return { isDiscardPromptOpen, requestClose, discardAndClose, keepEditing };
}

export default useUnsavedChangesGuard;
