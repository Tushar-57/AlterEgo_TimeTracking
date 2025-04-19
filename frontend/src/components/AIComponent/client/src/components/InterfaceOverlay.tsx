import { useVisualizer } from '../context/VisualizerContext';
import { useAudio } from '../hooks/useAudio';
import { Button } from '../components/ui/button';
import { Settings, Info, Mic } from 'lucide-react';
import { useEffect, useState } from 'react';

const InterfaceOverlay = () => {
  const { 
    isListening, 
    isSettingsOpen, 
    setIsSettingsOpen,
    audioInitialized,
    transcriptText,
    setTranscriptText,
    visualMode,
    setVisualMode
  } = useVisualizer();
  
  const { toggleListening, error } = useAudio();
  const [showWarpText, setShowWarpText] = useState(false);
  
  // Simulated utterances for demonstration purposes
  const placeholderUtterances = [
    "Scanning neural pathways...",
    "Analyzing audio patterns...",
    "Processing voice input...",
    "Neural connection established",
    "Voice pattern recognized",
    "Command processing complete",
  ];
  
  const handleMicClick = () => {
    toggleListening();
    
    // Show "Warp Initiated" text when activating mic
    if (!isListening) {
      setShowWarpText(true);
      setTimeout(() => setShowWarpText(false), 2000);
      
      // Set a random transcript message when activated
      const randomPhrase = placeholderUtterances[Math.floor(Math.random() * placeholderUtterances.length)];
      setTranscriptText(randomPhrase);
    } else {
      setTranscriptText('Voice interface deactivated');
    }
  };
  
  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  // Show system boot text on initial load
  useEffect(() => {
    setShowWarpText(true);
    setTimeout(() => setShowWarpText(false), 3000);
    setTranscriptText('Quantum neural interface online. Awaiting voice input.');
  }, []);

  return (
    <div className="relative z-10 h-full w-full flex flex-col items-center justify-between font-['Space_Grotesk',sans-serif] bg-background text-foreground">
      {/* Status Bar */}
      <div className="w-full px-4 py-2 flex justify-between items-center">
        <div className="text-xs opacity-60">
          {error ? 'System Error' : 'System Ready'}
        </div>
        <div className="flex space-x-2 items-center">
          <div className={`h-2 w-2 rounded-full bg-primary ${isListening ? 'animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'animate-pulse'}`} />
          <span className="text-xs opacity-60">
            {isListening ? 'Listening' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Central Content Area with Warp Text Overlay */}
      <div className="flex-grow flex items-center justify-center w-full relative">
        {showWarpText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-lg text-primary animate-fade-in">
              <h2 className="text-2xl md:text-4xl font-semibold mb-2 animate-pulse">
                {isListening ? 'WARP INITIATED' : 'SYSTEM ONLINE'}
              </h2>
              <p className="text-sm md:text-base text-white opacity-80">
                {isListening ? 'Hyperspace tunnel activated' : 'Neural audio interface initialized'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Panel (30% height at bottom) */}
      <div className="w-full bg-black bg-opacity-30 backdrop-blur-sm border-t border-primary border-opacity-30">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${isListening ? 'bg-primary animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary opacity-70">AI NEURAL INTERFACE</span>
            </div>
            <div className="text-xs opacity-50">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <div className="h-16 overflow-y-auto text-sm">
            <p className="text-white opacity-80 font-light leading-relaxed">
              {transcriptText || 'Awaiting input...'}
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full p-4 flex flex-col items-center space-y-4 mb-4">
        <div className="text-center mb-2">
          <p className="text-lg font-light opacity-80">
            {error ? 'Microphone access denied' : 
             isListening ? 'Voice input active' : 
             'Tap to activate voice input'}
          </p>
          <p className="text-xs opacity-50 mt-1">
            {error ? 'Please allow microphone access to use the visualizer' : 
             isListening ? 'Speak to see the visualization respond' : 
             'Visualizer in standby mode'}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="p-3 rounded-full bg-black bg-opacity-50 border border-white border-opacity-20 hover:bg-opacity-70 transition-all"
            onClick={openSettings}
          >
            <Settings className="h-5 w-5 opacity-70" />
          </Button>
          
          <Button 
            className={`p-6 rounded-full ${isListening ? 'scale-110 shadow-xl' : ''} bg-gradient-to-r from-primary to-secondary shadow-lg transform transition-all`}
            onClick={handleMicClick}
          >
            <Mic className="h-8 w-8" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="p-3 rounded-full bg-black bg-opacity-50 border border-white border-opacity-20 hover:bg-opacity-70 transition-all"
          >
            <Info className="h-5 w-5 opacity-70" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterfaceOverlay;
