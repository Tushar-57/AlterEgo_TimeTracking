import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Settings, Volume2 } from "lucide-react";

// Define types for our data structures
interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
  offset: number;
}

interface ConversationItem {
  type: string;
  text: string;
}

export default function EnhancedVoiceCommandPopup() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedFont, setSelectedFont] = useState("font-sans");
  const [showFontSelector, setShowFontSelector] = useState(false);
  
  // Animation related states - add proper type definition
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Available fonts
  const fonts = [
    { name: "Sans", value: "font-sans" },
    { name: "Serif", value: "font-serif" },
    { name: "Mono", value: "font-mono" },
    { name: "Cursive", value: "font-['Segoe_Script','Brush_Script_MT',cursive]" },
    { name: "Fantasy", value: "font-['Papyrus','Fantasy']" }
  ];

  // Initialize particles
  useEffect(() => {
    const particleCount = 200;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle());
    }
    
    setParticles(newParticles);
  }, []);
  
  // Create a single particle
  const createParticle = (): Particle => {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const radius = 150 + Math.random() * 50;
    
    return {
      x: Math.sin(angle1) * Math.cos(angle2) * radius,
      y: Math.sin(angle1) * Math.sin(angle2) * radius,
      z: Math.cos(angle1) * radius,
      size: 1 + Math.random() * 3,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      speed: 0.2 + Math.random() * 0.8,
      offset: Math.random() * Math.PI * 2,
    };
  };
  
  // Mock speech recognition with audio level simulation
  const startListening = () => {
    setIsListening(true);
    
    // Simulate microphone audio levels
    const audioLevelInterval = setInterval(() => {
      // Random fluctuation between 0.2 and 1.0 when speaking
      setAudioLevel(0.2 + Math.random() * 0.8);
    }, 100);
    
    // Simulate voice processing
    setTimeout(() => {
      const mockQuery = "What's on my calendar for tomorrow?";
      setTranscript(mockQuery);
      
      // Simulate response after brief delay
      setTimeout(() => {
        const mockResponse = "You have a design review at 10:00 AM, a team lunch at noon, and a project planning session at 3:00 PM.";
        setResponse(mockResponse);
        setConversationHistory(prev => [...prev, 
          { type: 'user', text: mockQuery },
          { type: 'assistant', text: mockResponse }
        ]);
        setIsListening(false);
        clearInterval(audioLevelInterval);
        setAudioLevel(0);
        setTranscript("");
      }, 2000);
    }, 1500);
    
    return () => clearInterval(audioLevelInterval);
  };
  
  const stopListening = () => {
    setIsListening(false);
    setAudioLevel(0);
  };
  
  // Animation rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let rotation = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      rotation += 0.005;
      
      // Apply audio level to animation
      const intensityFactor = 1 + (audioLevel * 5);
      const pulseFactor = 1 + Math.sin(Date.now() * 0.003) * 0.2 * audioLevel;
      
      // Draw connecting lines first for depth
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Only connect nearby particles to reduce visual clutter
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance < 50) {
            const opacity = 1 - distance / 50;
            ctx.beginPath();
            ctx.moveTo(centerX + p1.x, centerY + p1.y);
            ctx.lineTo(centerX + p2.x, centerY + p2.y);
            ctx.strokeStyle = `rgba(180, 180, 255, ${opacity * 0.3})`;
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      ctx.globalAlpha = 1;
      particles.forEach((p, i) => {
        // Update position with rotation and audio-reactive movement
        const time = Date.now() * 0.001;
        const wobble = Math.sin(time * p.speed + p.offset) * 10 * intensityFactor;
        
        // Create a spherical orbit with some randomness
        const angle1 = (time * p.speed * 0.1) + (i * 0.01);
        const angle2 = (time * p.speed * 0.2) + (i * 0.02);
        
        const radius = (150 + wobble) * pulseFactor;
        
        p.x = Math.sin(angle1) * Math.cos(angle2) * radius;
        p.y = Math.sin(angle1) * Math.sin(angle2) * radius;
        p.z = Math.cos(angle1) * radius;
        
        // Calculate size based on z position for perspective
        const perspective = 600;
        const scale = perspective / (perspective + p.z);
        const size = p.size * scale * intensityFactor;
        
        // Calculate x, y position with perspective
        const x = centerX + p.x * scale;
        const y = centerY + p.y * scale;
        
        // Draw the particle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, audioLevel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 text-white w-5/6 h-5/6 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Volume2 className="text-blue-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Voice Assistant
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowFontSelector(!showFontSelector)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Change Font"
            >
              <Settings size={20} />
            </button>
            
            <button className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Font Selector Dropdown */}
        {showFontSelector && (
          <div className="absolute right-8 top-16 bg-gray-800 rounded-md shadow-lg p-3 z-10">
            <h4 className="text-sm text-gray-400 mb-2">Select Font</h4>
            <div className="flex flex-col space-y-1">
              {fonts.map((font) => (
                <button
                  key={font.value}
                  className={`px-3 py-1 text-left rounded hover:bg-gray-700 ${
                    selectedFont === font.value ? 'bg-blue-900' : ''
                  } ${font.value}`}
                  onClick={() => setSelectedFont(font.value)}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Content - Visualization (70%) */}
        <div className="flex-grow relative">
          {/* Canvas for particle visualization */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Mic Button and Transcript */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Current Transcript */}
            {transcript && (
              <div className={`mb-8 text-center text-xl text-blue-300 max-w-lg px-4 py-2 bg-gray-800 bg-opacity-70 rounded-lg ${selectedFont}`}>
                "{transcript}"
              </div>
            )}
            
            {/* Mic Button */}
            <button 
              onClick={isListening ? stopListening : startListening}
              className={`rounded-full p-6 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-all shadow-lg`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            
            {/* Audio Level Indicator */}
            {isListening && (
              <div className="mt-6 w-60 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Transcription Area (30%) */}
        <div className="h-64 border-t border-gray-700 p-4 overflow-y-auto">
          <div className={`space-y-4 ${selectedFont}`}>
            {conversationHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Start speaking to see your conversation history here
              </div>
            ) : (
              conversationHistory.map((item, index) => (
                <div key={index} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-lg px-4 py-3 rounded-lg ${
                      item.type === 'user' 
                        ? 'bg-blue-900 text-blue-100' 
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}