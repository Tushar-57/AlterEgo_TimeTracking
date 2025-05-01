import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Calendar_updated/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Calendar_updated/components/ui/tabs';
import { Slider } from '../Calendar_updated/components/ui/slider';
import { Switch } from '../Calendar_updated/components/ui/switch';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import { Volume2, X } from 'lucide-react';
import { UserPreferences } from './types';
import { motion } from 'framer-motion';

const defaultPreferences: UserPreferences = {
  timerMode: 'stopwatch',
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  soundEnabled: true,
  notificationsEnabled: true,
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  countdownPresets: [300, 600, 900, 1500, 2700, 3600],
  progressStyle: 'linear',
};

export const SettingsDialog = ({
  open,
  onOpenChange,
  preferences,
  setPreferences,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
}) => {
  const [errors, setErrors] = useState<{ preset: string }>({ preset: '' });

  const handleSoundTest = () => {
    // Implement sound test logic
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#F7F7F7] dark:bg-[#2D3748] border-[#D8BFD8]/30 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[#2D3748] dark:text-[#E6E6FA] font-serif text-xl">Settings</DialogTitle>
          <DialogDescription className="text-[#6B7280] dark:text-[#B0C4DE] font-serif">
            Customize your timer preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-3 bg-[#FFFFFF] dark:bg-[#3C4A5E] rounded-xl border border-[#D8BFD8]/30">
            <TabsTrigger
              value="general"
              className="text-[#6B7280] dark:text-[#B0C4DE] font-serif data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA]"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="pomodoro"
              className="text-[#6B7280] dark:text-[#B0C4DE] font-serif data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA]"
            >
              Pomodoro
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-[#6B7280] dark:text-[#B0C4DE] font-serif data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA]"
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 pt-6">
            <motion.div
              className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#3C4A5E] rounded-xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <h3 className="font-serif font-medium text-[#2D3748] dark:text-[#E6E6FA]">Dark Mode</h3>
                <p className="text-sm text-[#6B7280] dark:text-[#B0C4DE] font-serif">Switch between light and dark themes</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, darkMode: checked })
                  }
                  className="data-[state=checked]:bg-[#D8BFD8]"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="font-serif font-medium mb-3 text-[#2D3748] dark:text-[#E6E6FA]">Countdown Presets (minutes)</h3>
              <div className="flex flex-wrap gap-3">
                {preferences.countdownPresets.map((seconds, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      type="number"
                      min="1"
                      max="180"
                      value={seconds / 60}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value < 1 || value > 180) {
                          setErrors((prev) => ({
                            ...prev,
                            preset: 'Value must be between 1 and 180 minutes',
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            preset: '',
                          }));
                          const newPresets = [...preferences.countdownPresets];
                          newPresets[index] = value * 60;
                          setPreferences({ ...preferences, countdownPresets: newPresets });
                        }
                      }}
                      className="w-16 text-center bg-[#FFFFFF] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#2D3748] dark:text-[#E6E6FA] rounded-xl"
                    />
                    {errors.preset && (
                      <p className="text-[#D8BFD8] text-sm">{errors.preset}</p>
                    )}
                    {index > 2 && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-[#B0C4DE] hover:bg-[#D8BFD8]/20"
                          onClick={() => {
                            const newPresets = preferences.countdownPresets.filter(
                              (_, i) => i !== index
                            );
                            setPreferences({ ...preferences, countdownPresets: newPresets });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-6 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="font-serif font-medium mb-3 text-[#2D3748] dark:text-[#E6E6FA]">Work Session</h3>
              <div className="flex items-center gap-4">
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[preferences.pomodoroSettings.workDuration]}
                  onValueChange={(value) =>
                    setPreferences({
                      ...preferences,
                      pomodoroSettings: {
                        ...preferences.pomodoroSettings,
                        workDuration: value[0],
                      },
                    })
                  }
                  className="data-[thumb]:bg-[#D8BFD8]"
                />
                <span className="w-16 text-[#6B7280] dark:text-[#B0C4DE] font-serif">{preferences.pomodoroSettings.workDuration} min</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="font-serif font-medium mb-3 text-[#2D3748] dark:text-[#E6E6FA]">Short Break</h3>
              <div className="flex items-center gap-4">
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  value={[preferences.pomodoroSettings.shortBreakDuration]}
                  onValueChange={(value) =>
                    setPreferences({
                      ...preferences,
                      pomodoroSettings: {
                        ...preferences.pomodoroSettings,
                        shortBreakDuration: value[0],
                      },
                    })
                  }
                  className="data-[thumb]:bg-[#D8BFD8]"
                />
                <span className="w-16 text-[#6B7280] dark:text-[#B0C4DE] font-serif">{preferences.pomodoroSettings.shortBreakDuration} min</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="font-serif font-medium mb-3 text-[#2D3748] dark:text-[#E6E6FA]">Long Break</h3>
              <div className="flex items-center gap-4">
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[preferences.pomodoroSettings.longBreakDuration]}
                  onValueChange={(value) =>
                    setPreferences({
                      ...preferences,
                      pomodoroSettings: {
                        ...preferences.pomodoroSettings,
                        longBreakDuration: value[0],
                      },
                    })
                  }
                  className="data-[thumb]:bg-[#D8BFD8]"
                />
                <span className="w-16 text-[#6B7280] dark:text-[#B0C4DE] font-serif">{preferences.pomodoroSettings.longBreakDuration} min</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h3 className="font-serif font-medium mb-3 text-[#2D3748] dark:text-[#E6E6FA]">Sessions Until Long Break</h3>
              <div className="flex items-center gap-4">
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[preferences.pomodoroSettings.sessionsUntilLongBreak]}
                  onValueChange={(value) =>
                    setPreferences({
                      ...preferences,
                      pomodoroSettings: {
                        ...preferences.pomodoroSettings,
                        sessionsUntilLongBreak: value[0],
                      },
                    })
                  }
                  className="data-[thumb]:bg-[#D8BFD8]"
                />
                <span className="w-16 text-[#6B7280] dark:text-[#B0C4DE] font-serif">{preferences.pomodoroSettings.sessionsUntilLongBreak}</span>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 pt-6">
            <motion.div
              className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#3C4A5E] rounded-xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <h3 className="font-serif font-medium text-[#2D3748] dark:text-[#E6E6FA]">Sound Effects</h3>
                <p className="text-sm text-[#6B7280] dark:text-[#B0C4DE] font-serif">Play sounds for timer events</p>
              </div>
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSoundTest}
                    className="text-[#B0C4DE] hover:bg-[#D8BFD8]/20"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Switch
                    checked={preferences.soundEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, soundEnabled: checked })
                    }
                    className="data-[state=checked]:bg-[#D8BFD8]"
                  />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#3C4A5E] rounded-xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div>
                <h3 className="font-serif font-medium text-[#2D3748] dark:text-[#E6E6FA]">Browser Notifications</h3>
                <p className="text-sm text-[#6B7280] dark:text-[#B0C4DE] font-serif">Enable notifications for timer events</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Switch
                  checked={preferences.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notificationsEnabled: checked })
                  }
                  className="data-[state=checked]:bg-[#D8BFD8]"
                />
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={() => setPreferences(defaultPreferences)}
              className="border-[#D8BFD8]/50 text-[#B0C4DE] hover:bg-[#D8BFD8]/20 rounded-xl"
            >
              Reset to Defaults
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80 rounded-xl"
            >
              Save Changes
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};