import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Calendar_updated/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Calendar_updated/components/ui/tabs';
import { Slider } from '../Calendar_updated/components/ui/slider';
import { Switch } from '../Calendar_updated/components/ui/switch';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import { Volume2, X } from 'lucide-react';
import { UserPreferences } from './types';

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
  progressStyle: 'linear'
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
      <DialogContent className="sm:max-w-lg bg-[#FAF9F6] dark:bg-[#2D2D2D] border-[#F8C8DC]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Settings</DialogTitle>
          <DialogDescription className="text-[#A3BFFA]">Customize your timer preferences</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-3 bg-[#F5F5F4] dark:bg-[#3A3A3A]">
            <TabsTrigger value="general" className="text-[#A3BFFA] data-[state=active]:bg-[#A8D5BA]/20">General</TabsTrigger>
            <TabsTrigger value="pomodoro" className="text-[#A3BFFA] data-[state=active]:bg-[#A8D5BA]/20">Pomodoro</TabsTrigger>
            <TabsTrigger value="notifications" className="text-[#A3BFFA] data-[state=active]:bg-[#A8D5BA]/20">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Dark Mode</h3>
                <p className="text-sm text-[#A3BFFA]">Switch between light and dark themes</p>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, darkMode: checked })
                }
                className="data-[state=checked]:bg-[#A8D5BA]"
              />
            </div>

            <div>
              <h3 className="font-medium mb-2 text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Countdown Presets (minutes)</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.countdownPresets.map((seconds, index) => (
                  <div key={index} className="flex items-center">
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
                      className="w-16 text-center bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50"
                    />
                    {errors.preset && (
                      <p className="text-[#FF6B6B] text-sm">{errors.preset}</p>
                    )}
                    {index > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-[#A3BFFA] hover:bg-[#F8C8DC]/20"
                        onClick={() => {
                          const newPresets = preferences.countdownPresets.filter(
                            (_, i) => i !== index
                          );
                          setPreferences({ ...preferences, countdownPresets: newPresets });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4 pt-4">
            <div>
              <h3 className="font-medium mb-2 text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Work Session</h3>
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
                  className="data-[thumb]:bg-[#A8D5BA]"
                />
                <span className="w-16 text-[#A3BFFA]">{preferences.pomodoroSettings.workDuration} min</span>
              </div>
            </div>
            {/* Similar sliders for Short Break, Long Break, and Sessions can be added here */}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#1A202C] dark:text-[#E2E8F0] font-poppins">Sound Effects</h3>
                <p className="text-sm text-[#A3BFFA]">Play sounds for timer events</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSoundTest}
                  className="text-[#A3BFFA] hover:bg-[#F8C8DC]/20"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Switch
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, soundEnabled: checked })
                  }
                  className="data-[state=checked]:bg-[#A8D5BA]"
                />
              </div>
            </div>
            {/* Browser Notifications Toggle can be added here */}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setPreferences(defaultPreferences)}
            className="border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#A8D5BA] text-white hover:bg-[#A8D5BA]/80"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};