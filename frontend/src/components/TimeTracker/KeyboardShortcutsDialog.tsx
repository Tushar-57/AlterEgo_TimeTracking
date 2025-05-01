import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Calendar_updated/components/ui/dialog';
import { Button } from '../Calendar_updated/components/ui/button';
import { motion } from 'framer-motion';

export const KeyboardShortcutsDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md bg-[#F7F7F7] dark:bg-[#2D3748] border-[#D8BFD8]/30 rounded-2xl shadow-lg">
      <DialogHeader>
        <DialogTitle className="text-[#2D3748] dark:text-[#E6E6FA] font-serif text-xl">Keyboard Shortcuts</DialogTitle>
        <DialogDescription className="text-[#6B7280] dark:text-[#B0C4DE] font-serif">
          Use these shortcuts to navigate and control the TimeTracker efficiently.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-6">
        {[
          { label: 'Start/Pause Timer', key: 'Space' },
          { label: 'Stop and Save Timer', key: 'S' },
          { label: 'Reset Timer', key: 'R' },
          { label: 'Switch to Stopwatch', key: '1' },
          { label: 'Switch to Countdown', key: '2' },
          { label: 'Switch to Pomodoro', key: '3' },
        ].map((shortcut, index) => (
          <motion.div
            key={index}
            className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#3C4A5E] rounded-xl p-3 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <span className="text-sm font-serif text-[#2D3748] dark:text-[#E6E6FA]">{shortcut.label}</span>
            <kbd className="px-3 py-1 text-xs font-semibold bg-[#E6E6FA] dark:bg-[#4B5EAA] rounded-lg text-[#2D3748] dark:text-[#E6E6FA]">
              {shortcut.key}
            </kbd>
          </motion.div>
        ))}
      </div>

      <DialogFooter>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80 rounded-xl"
          >
            Close
          </Button>
        </motion.div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);