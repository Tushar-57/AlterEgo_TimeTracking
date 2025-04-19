import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VisualizerContextType {
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  intensityLevel: number;
  setIntensityLevel: (value: number) => void;
  dotDensity: number;
  setDotDensity: (value: number) => void;
  accentColor: string;
  setAccentColor: (value: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (value: boolean) => void;
  audioInitialized: boolean;
  setAudioInitialized: (value: boolean) => void;
  transcriptText: string;
  setTranscriptText: (value: string) => void;
  visualMode: 'tunnel' | 'sphere' | 'wave';
  setVisualMode: (value: 'tunnel' | 'sphere' | 'wave') => void;
}

const defaultContext: VisualizerContextType = {
  isListening: false,
  setIsListening: () => {},
  intensityLevel: 50,
  setIntensityLevel: () => {},
  dotDensity: 70,
  setDotDensity: () => {},
  accentColor: '#6D28D9',
  setAccentColor: () => {},
  isSettingsOpen: false,
  setIsSettingsOpen: () => {},
  audioInitialized: false,
  setAudioInitialized: () => {},
  transcriptText: '',
  setTranscriptText: () => {},
  visualMode: 'sphere',
  setVisualMode: () => {},
};

const VisualizerContext = createContext<VisualizerContextType>(defaultContext);

export const useVisualizer = () => useContext(VisualizerContext);

export const VisualizerProvider = ({ children }: { children: ReactNode }) => {
  const [isListening, setIsListening] = useState(false);
  const [intensityLevel, setIntensityLevel] = useState(50);
  const [dotDensity, setDotDensity] = useState(70);
  const [accentColor, setAccentColor] = useState('#6D28D9');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [visualMode, setVisualMode] = useState<'tunnel' | 'sphere' | 'wave'>('sphere');

  // Close listening if user navigates away from page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        setIsListening(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isListening]);

  const value = {
    isListening,
    setIsListening,
    intensityLevel,
    setIntensityLevel,
    dotDensity,
    setDotDensity,
    accentColor,
    setAccentColor,
    isSettingsOpen,
    setIsSettingsOpen,
    audioInitialized,
    setAudioInitialized,
    transcriptText,
    setTranscriptText,
    visualMode,
    setVisualMode,
  };

  return (
    <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
};
