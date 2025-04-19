import { useEffect, useState } from 'react';
import { useVisualizer } from '../context/VisualizerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { X } from 'lucide-react';

const SettingsModal = () => {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen, 
    intensityLevel, 
    setIntensityLevel,
    dotDensity, 
    setDotDensity,
    accentColor, 
    setAccentColor
  } = useVisualizer();
  
  // Local state to track changes
  const [localIntensity, setLocalIntensity] = useState(intensityLevel);
  const [localDensity, setLocalDensity] = useState(dotDensity);
  const [localColor, setLocalColor] = useState(accentColor);
  const [autoSleep, setAutoSleep] = useState(true);
  
  // Sync local state with context when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setLocalIntensity(intensityLevel);
      setLocalDensity(dotDensity);
      setLocalColor(accentColor);
    }
  }, [isSettingsOpen, intensityLevel, dotDensity, accentColor]);
  
  const handleClose = () => {
    setIsSettingsOpen(false);
  };
  
  const handleSave = () => {
    setIntensityLevel(localIntensity);
    setDotDensity(localDensity);
    setAccentColor(localColor);
    setIsSettingsOpen(false);
  };
  
  const handleReset = () => {
    setLocalIntensity(50);
    setLocalDensity(70);
    setLocalColor('#6D28D9');
    setAutoSleep(true);
  };
  
  const colorOptions = [
    { name: 'purple', value: '#6D28D9' },
    { name: 'blue', value: '#2563EB' },
    { name: 'green', value: '#059669' },
    { name: 'red', value: '#DC2626' },
    { name: 'yellow', value: '#D97706' }
  ];
  
  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="bg-gray-900 border border-gray-800 text-white max-w-md">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-xl font-medium">Settings</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-gray-800">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="block text-sm opacity-70 mb-2">Visualization Intensity</Label>
            <Slider 
              min={1} 
              max={100} 
              step={1}
              value={[localIntensity]} 
              onValueChange={(value) => setLocalIntensity(value[0])}
              className="w-full h-2 bg-gray-700"
            />
          </div>
          
          <div>
            <Label className="block text-sm opacity-70 mb-2">Dot Density</Label>
            <Slider 
              min={1} 
              max={100} 
              step={1}
              value={[localDensity]} 
              onValueChange={(value) => setLocalDensity(value[0])}
              className="w-full h-2 bg-gray-700"
            />
          </div>
          
          <div>
            <Label className="block text-sm opacity-70 mb-2">Accent Color</Label>
            <div className="flex space-x-2 mt-1">
              {colorOptions.map((color) => (
                <button 
                  key={color.name} 
                  className={`w-8 h-8 rounded-full border-2 transition-all ${localColor === color.value ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setLocalColor(color.value)}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-2 flex items-center space-x-2">
            <Checkbox 
              id="autoSleep" 
              checked={autoSleep} 
              onCheckedChange={(checked) => setAutoSleep(checked as boolean)} 
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="autoSleep" className="text-sm opacity-70">
              Enable microphone auto-sleep
            </Label>
          </div>
        </div>
        
        <DialogFooter className="border-t border-gray-800 pt-4">
          <Button variant="ghost" onClick={handleReset} className="text-sm opacity-70 hover:opacity-100">Reset</Button>
          <Button onClick={handleSave} className="ml-2 bg-primary">Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
