import { Button } from '../Calendar_updated/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Settings, HelpCircle, Clock } from 'lucide-react';
import { UserPreferences } from './types';

export const TimerHeader = ({
  preferences,
  setPreferences,
  user,
  setShowSettingsDialog,
  setShowKeyboardShortcutsDialog,
}: {
  preferences: UserPreferences;
  setPreferences: (fn: (prev: UserPreferences) => UserPreferences) => void;
  user: any;
  setShowSettingsDialog: (show: boolean) => void;
  setShowKeyboardShortcutsDialog: (show: boolean) => void;
}) => (
  <header className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 shadow-lg py-4 px-6 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Clock className="text-cyan-400" size={28} />
        </motion.div>
        <h1 className="text-2xl font-bold text-white font-orbitron">Timer</h1>
      </div>
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"
                onClick={() => setPreferences((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
              >
                {preferences.darkMode ? (
                  <motion.div initial={{ rotate: -30 }} animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div initial={{ rotate: 30 }} animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  </motion.div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-cyan-400 border-cyan-500/50">Toggle dark mode</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="h-5 w-5 text-cyan-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-cyan-400 border-cyan-500/50">Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"
                onClick={() => setShowKeyboardShortcutsDialog(true)}
              >
                <HelpCircle className="h-5 w-5 text-cyan-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-cyan-400 border-cyan-500/50">Keyboard shortcuts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {user && (
          <motion.div
            className="flex items-center transition-transform hover:scale-110"
            whileHover={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.7)' }}
          >
            <div className="bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              {user.name ? user.name[0] : user.email[0]}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  </header>
);