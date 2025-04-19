import { useRef, useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useAudio } from '../hooks/useAudio';
import { useVisualizer } from '../context/VisualizerContext';

const AudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioData, error } = useAudio({ fftSize: 256 });
  
  // Initialize the canvas with our custom hook
  const { dots } = useCanvas(canvasRef, audioData);
  
  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Audio error:', error);
    }
  }, [error]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-0"
      aria-label="Audio visualization canvas"
      style={{ 
        background: 'black',
        opacity: 1,
      }}
      data-central-target="true" // Add this marker to help identify the canvas for central effects
    />
  );
};

export default AudioVisualizer;
