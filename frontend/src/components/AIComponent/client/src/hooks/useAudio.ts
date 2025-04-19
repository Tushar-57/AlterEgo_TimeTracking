import { useState, useEffect, useRef } from 'react';
import { useVisualizer } from '../context/VisualizerContext';

interface UseAudioOptions {
  fftSize?: number;
}

export const useAudio = (options: UseAudioOptions = {}) => {
  const { fftSize = 256 } = options;
  
  const { 
    isListening, 
    setIsListening,
    audioInitialized,
    setAudioInitialized
  } = useVisualizer();
  
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(fftSize / 2));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(fftSize / 2));
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and analyzer
  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = fftSize;

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (audioContextRef.current && analyserRef.current) {
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        microphoneRef.current.connect(analyserRef.current);
        setAudioInitialized(true);
      }
      
      return true;
    } catch (err) {
      console.error('Error initializing audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      return false;
    }
  };

  // Toggle listening state
  const toggleListening = async () => {
    if (!audioInitialized) {
      const initialized = await initAudio();
      if (!initialized) return;
    }
    
    setIsListening(!isListening);
  };

  // Clean up resources
  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Update audio data
  const updateAudioData = () => {
    if (!analyserRef.current || !isListening) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    setAudioData(new Uint8Array(dataArrayRef.current));
    
    animationFrameRef.current = requestAnimationFrame(updateAudioData);
  };

  // Start/stop audio processing when listening state changes
  useEffect(() => {
    if (isListening && analyserRef.current) {
      updateAudioData();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      // Reset audio data when not listening
      setAudioData(new Uint8Array(dataArrayRef.current.length).fill(0));
    }
  }, [isListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  return {
    audioData,
    error,
    toggleListening,
    isInitialized: audioInitialized,
  };
};
