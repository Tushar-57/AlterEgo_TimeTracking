import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Calendar_updated/components/ui/dialog';
import { Button } from '../Calendar_updated/components/ui/button';

export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>
          Use these shortcuts to navigate and control the TimeTracker efficiently.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        {[
          { label: 'Start/Pause Timer', key: 'Space' },
          { label: 'Stop and Save Timer', key: 'S' },
          { label: 'Reset Timer', key: 'R' },
          { label: 'Switch to Stopwatch', key: '1' },
          { label: 'Switch to Countdown', key: '2' },
          { label: 'Switch to Pomodoro', key: '3' },
        ].map((shortcut, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-sm font-medium">{shortcut.label}</span>
            <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded-lg">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);