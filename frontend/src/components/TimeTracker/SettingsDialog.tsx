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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your timer preferences</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4 pt-4">
            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, darkMode: checked })
                }
              />
            </div>

            {/* Countdown Presets */}
            <div>
              <h3 className="font-medium mb-2">Countdown Presets (minutes)</h3>
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
                          setErrors((prev: { preset: string }) => ({
                            ...prev,
                            preset: 'Value must be between 1 and 180 minutes',
                          }));
                        } else {
                          setErrors((prev: { preset: string }) => ({
                            ...prev,
                            preset: '',
                          }));
                          const newPresets = [...preferences.countdownPresets];
                          newPresets[index] = value * 60;
                          setPreferences({ ...preferences, countdownPresets: newPresets });
                        }
                      }}
                      className="w-16 text-center"
                    />
                    {errors.preset && (
                      <p className="text-red-500 text-sm">{errors.preset}</p>
                    )}
                    {index > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
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

          {/* Pomodoro Settings Tab */}
          <TabsContent value="pomodoro" className="space-y-4 pt-4">
            {/* Work Duration Slider */}
            <div>
              <h3 className="font-medium mb-2">Work Session</h3>
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
                />
                <span className="w-16">{preferences.pomodoroSettings.workDuration} min</span>
              </div>
            </div>

            {/* Similar sliders for Short Break, Long Break, and Sessions */}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 pt-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Sound Effects</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sounds for timer events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleSoundTest}>
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Switch
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, soundEnabled: checked })
                  }
                />
              </div>
            </div>

            {/* Browser Notifications Toggle */}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setPreferences(defaultPreferences)}
          >
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};