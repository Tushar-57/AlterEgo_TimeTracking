import { useEffect, useRef, useState } from 'react';
import { useVisualizer } from '../context/VisualizerContext';

interface Dot {
  x: number;
  y: number;
  z: number;            // Added for 3D effect
  radius: number;
  baseRadius: number;
  color: string;
  opacity: number;
  angle: number;
  distance: number;
  speed: number;
  phase: number;
  speedZ: number;       // Speed of z-movement
  warpFactor: number;   // How much this dot gets affected by warp
  sphereX: number;      // Position on the sphere surface (x coordinate)
  sphereY: number;      // Position on the sphere surface (y coordinate)
  sphereZ: number;      // Position on the sphere surface (z coordinate)
  glowColor: string;    // Glow color for special effects
}

export const useCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, audioData: Uint8Array) => {
  const { isListening, intensityLevel, dotDensity, accentColor, visualMode } = useVisualizer();
  const [dots, setDots] = useState<Dot[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);
  const warpEffectRef = useRef(0);
  
  // Create dots based on canvas size and density
  const createDots = (canvas: HTMLCanvasElement) => {
    if (!canvas) return;
    
    const newDots: Dot[] = [];
    // Reduce dot density as requested
    const totalDots = Math.floor((canvas.width * canvas.height) / (10000 / dotDensity));
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDepth = 2000; // Max Z depth
    
    // Define sphere radius as a percentage of the smaller canvas dimension
    const sphereRadius = Math.min(canvas.width, canvas.height) * 0.35;
    
    // Use turquoise accent color for the dots as seen in the reference image
    const accentColors = [
      '#00FFFF', // Cyan/Turquoise (primary accent color from image)
      '#00CED1', // Dark Turquoise
      '#40E0D0', // Turquoise
      '#48D1CC', // Medium Turquoise
      '#AFEEEE'  // Light Turquoise
    ];
    
    // Create a spherical distribution of dots
    for (let i = 0; i < totalDots; i++) {
      // Create perfect spherical 3D distribution
      const phi = Math.random() * Math.PI * 2; // Horizontal angle (0 to 2π)
      const theta = Math.random() * Math.PI; // Vertical angle (0 to π)
      
      // Calculate 3D coordinates on sphere
      const sphereX = Math.cos(phi) * Math.sin(theta);
      const sphereY = Math.sin(phi) * Math.sin(theta);
      const sphereZ = Math.cos(theta);
      
      // Distribute dots on sphere surface or slightly inside/outside for depth
      const radiusVariation = Math.random() * 0.1 - 0.05; // -5% to +5% variation
      const sphereDistanceFactor = 1 + radiusVariation;
      
      // Calculate actual position
      const x = centerX + sphereX * sphereRadius * sphereDistanceFactor;
      const y = centerY + sphereY * sphereRadius * sphereDistanceFactor;
      const z = sphereZ * sphereRadius * sphereDistanceFactor;
      
      // Calculate distance from center for sizing and effects
      const distanceFromCenter = Math.sqrt(
        Math.pow(sphereX, 2) + Math.pow(sphereY, 2) + Math.pow(sphereZ, 2)
      );
      
      // Make the dots larger to match the reference image
      // Dots should be uniform in size for the polka dot pattern
      const radius = Math.max(6, 12); // Larger, more consistent dots
      
      // Determine if dot should be turquoise accent color (like in reference image)
      const isTurquoise = Math.random() < 0.12; // 12% of dots are turquoise
      // Since the central dot is prominent in the image
      const isCentralDot = distanceFromCenter < 0.1; // Central area dots
      
      // Assign color - turquoise for accents or center, white for most dots
      const dotColor = isCentralDot ? '#00FFFF' : 
                       isTurquoise ? accentColors[Math.floor(Math.random() * accentColors.length)] : 
                       '#FFFFFF';
                       
      // Glow color matches dot color for consistency
      const glowColor = dotColor;
      
      // Create the dot with sphere properties
      newDots.push({
        x,
        y,
        z,
        radius,
        baseRadius: radius,
        color: dotColor, // Use the new color assignment
        opacity: Math.random() * 0.5 + 0.5,
        angle: phi,
        distance: distanceFromCenter * sphereRadius,
        speed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        speedZ: 0.1 + Math.random() * 0.3,
        warpFactor: Math.random() * 0.8 + 0.4,
        sphereX,
        sphereY, 
        sphereZ,
        glowColor
      });
    }
    
    setDots(newDots);
  };
  
  // Animation function
  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDepth = 2000;
    
    // Update time for animation
    timeRef.current += 0.016; // ~60fps
    const time = timeRef.current;
    
    // If listening, gradually increase warp effect, otherwise decrease it
    const warpTarget = isListening ? 1.0 : 0.0;
    // Faster transition to warp mode for more immediate response
    warpEffectRef.current += (warpTarget - warpEffectRef.current) * (isListening ? 0.15 : 0.05);
    
    // Get average audio power for global effects
    let avgAudioPower = 0;
    if (isListening && audioData.length > 0) {
      for (let i = 0; i < audioData.length; i++) {
        avgAudioPower += audioData[i] / 255;
      }
      avgAudioPower /= audioData.length;
    } else {
      // Ensure minimal movement even without audio
      avgAudioPower = 0.1;
    }
    
    // Scale warp effect based on intensity setting and audio power
    // Increase the base power for more dramatic effect
    const baseWarpPower = warpEffectRef.current * (intensityLevel / 50) * 4;
    const audioPoweredWarp = baseWarpPower * (1 + avgAudioPower * 1.5);
    
    // Sort dots by z-coordinate for proper overlay (painter's algorithm)
    const sortedDots = [...dots].sort((a, b) => b.z - a.z);
    
    // Update and draw each dot
    sortedDots.forEach((dot, i) => {
      // Update z position for flying through space effect
      let z = dot.z;
      
      // When listening, create warp effect
      if (warpEffectRef.current > 0) {
        // Move dots along z-axis when warping
        z -= dot.speedZ * audioPoweredWarp * 20 * dot.warpFactor;
        
        // Reset dots that go too far
        if (z < -maxDepth) {
          z = maxDepth;
        }
      }
      
      // Calculate perspective factor
      const perspectiveFactor = maxDepth / (maxDepth + z);
      
      // Base pulsing animation 
      let pulseAmount = Math.sin(time * dot.speed + dot.phase) * 0.2 + 0.8;
      
      // If listening, influence dots based on audio data
      if (isListening && audioData.length > 0) {
        // Map dot's distance from center to audio data array
        const audioIndex = Math.min(Math.floor(Math.abs(z / maxDepth) * audioData.length), audioData.length - 1);
        
        // Get audio power at this frequency (normalize to 0-1)
        const audioPower = audioData[audioIndex] / 255;
        
        // Special effects for accent dots and bigger dots
        const isCentral = dot.baseRadius > 3;
        const isTurquoise = dot.color === '#00FFFF' || dot.color.startsWith('#00C') || dot.color.startsWith('#40E');
        const amplificationFactor = isTurquoise ? 2.5 : (isCentral ? 2 : 1);
        
        // Scale the effect based on intensity setting
        const intensity = intensityLevel / 50;
        
        // Combine idle pulsing with audio response
        pulseAmount = pulseAmount * 0.3 + (audioPower * amplificationFactor * intensity * 0.8) + 0.6;
        
        // Add warp distortion to position based on audio
        const warpStrength = audioPoweredWarp * dot.warpFactor;
        
        // Warp the dot's position toward center for warp tunnel effect
        const distFromCenter = Math.sqrt(
          Math.pow(dot.x - centerX, 2) + 
          Math.pow(dot.y - centerY, 2)
        );
        
        // Normalized direction to center
        const dirX = distFromCenter > 0 ? (centerX - dot.x) / distFromCenter : 0;
        const dirY = distFromCenter > 0 ? (centerY - dot.y) / distFromCenter : 0;
        
        // Calculate warp displacement - much stronger effect for dramatic warp
        // Increase the factor from 30 to 80 for more visible distortion
        const warpDisplacement = warpStrength * (distFromCenter / (canvas.width * 0.5)) * 80;
        
        // Add spiral motion to the warp for more dramatic effect
        const spiralAngle = time * 0.2 + (distFromCenter / canvas.width) * Math.PI * 4;
        const spiralStrength = warpStrength * 10 * Math.min(1, distFromCenter / (canvas.width * 0.3));
        
        // Calculate spiral offset
        const spiralX = Math.cos(spiralAngle) * spiralStrength;
        const spiralY = Math.sin(spiralAngle) * spiralStrength;
        
        // Apply warp to position with spiral motion
        const warpedX = dot.x + dirX * warpDisplacement * perspectiveFactor + spiralX;
        const warpedY = dot.y + dirY * warpDisplacement * perspectiveFactor + spiralY;
        
        // Apply the radius pulse and perspective
        const radius = dot.baseRadius * pulseAmount * perspectiveFactor;
        
        // Adjust opacity based on z-position and audio
        const depthOpacity = Math.min(1, Math.max(0.2, 1 - Math.abs(z / maxDepth)));
        const audioBoost = isTurquoise ? audioPower * 0.5 : 0;
        const finalOpacity = dot.opacity * pulseAmount * depthOpacity * (1 + audioBoost);
        
        // Draw the warped dot
        ctx.beginPath();
        ctx.arc(warpedX, warpedY, radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = finalOpacity;
        ctx.fill();
      } else {
        // Sphere mode in non-listening state
        // Rotate the entire sphere slowly
        const rotationSpeed = 0.1;
        const rotationX = time * rotationSpeed * 0.2;
        const rotationY = time * rotationSpeed * 0.1;
        
        // Rotate the sphere coordinates
        const rotatedX = 
          dot.sphereX * Math.cos(rotationY) - dot.sphereZ * Math.sin(rotationY);
        const rotatedZ = 
          dot.sphereX * Math.sin(rotationY) + dot.sphereZ * Math.cos(rotationY);
        const rotatedY = 
          dot.sphereY * Math.cos(rotationX) + rotatedZ * Math.sin(rotationX);
        const rotatedZ2 = 
          -dot.sphereY * Math.sin(rotationX) + rotatedZ * Math.cos(rotationX);
        
        // Calculate sphere radius and center position
        const sphereRadius = Math.min(canvas.width, canvas.height) * 0.35;
        
        // Calculate 2D position
        const x = centerX + rotatedX * sphereRadius;
        const y = centerY + rotatedY * sphereRadius;
        
        // Adjust size based on z-position (dots in front are larger)
        const sizeFactor = Math.max(0.5, 1 + rotatedZ2 * 0.5);
        const radius = dot.baseRadius * sizeFactor * pulseAmount;
        
        // Adjust opacity based on z-position and add subtle pulsing
        const frontFactor = (rotatedZ2 + 1) / 2; // 0 to 1, with 1 being front
        const opacityBase = frontFactor * 0.7 + 0.3; // Higher opacity for dots in front
        const pulseFactor = Math.sin(time * 0.5 + dot.phase) * 0.1 + 0.9;
        
        // Use different colors based on position (like in the reference image)
        // Add glow effect for dots that are visible
        if (frontFactor > 0.75) {
          // Draw glow effect for front-facing dots
          const glowRadius = radius * 1.5;
          const gradient = ctx.createRadialGradient(
            x, y, radius * 0.5,
            x, y, glowRadius
          );
          
          gradient.addColorStop(0, dot.glowColor);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.globalAlpha = opacityBase * 0.4 * pulseFactor;
          ctx.fill();
        }
        
        // Draw the actual dot
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = opacityBase * pulseFactor;
        ctx.fill();
      }
      
      // Update dot with new z position
      if (dot.z !== z) {
        dot.z = z;
      }
    });
    
    // Draw center interactive ball that responds to voice input
    // Make the ball 50% smaller as requested
    const centerBallSize = Math.min(canvas.width, canvas.height) * 0.025; // Reduced to 50% of original size (from 5% to 2.5%)
    const centerBallPulse = isListening ? 1 + avgAudioPower * 2 : 1; // Pulse size based on audio
    const finalCenterBallSize = centerBallSize * centerBallPulse;
    
    // Create a radial gradient for the center ball
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, finalCenterBallSize
    );
    
    // Colors depend on audio levels when listening
    if (isListening) {
      // Bright core when active - use turquoise color for the center dot like in reference image
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      centerGradient.addColorStop(0.3, '#00FFFF'); // Bright turquoise like the reference image
      centerGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.5)');
      centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Pulse animation based on audio level
      const pulseSize = centerBallSize * (1.2 + avgAudioPower * 0.8);
      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, finalCenterBallSize * 0.8,
        centerX, centerY, pulseSize * 2
      );
      
      outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.4)'); // Turquoise glow
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Draw the outer glow pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 2, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.globalAlpha = 0.7;
      ctx.fill();
    } else {
      // Subtle gradient when idle
      centerGradient.addColorStop(0, 'rgba(180, 180, 180, 0.8)');
      centerGradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.4)');
      centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Subtle pulsing
      const idlePulse = Math.sin(time * 0.5) * 0.1 + 1;
      const idlePulseSize = centerBallSize * 1.5 * idlePulse;
      
      // Draw a subtle pulse ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, idlePulseSize, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.globalAlpha = 0.5;
      ctx.stroke();
    }
    
    // Draw the center ball
    ctx.beginPath();
    ctx.arc(centerX, centerY, finalCenterBallSize, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.globalAlpha = 1;
    ctx.fill();
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  // Setup the canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get context and store in ref
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createDots(canvas);
    };
    
    // Resize handler
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Start animation
    timeRef.current = Date.now() / 1000;
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Recreate dots when density changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      createDots(canvas);
    }
  }, [dotDensity]);
  
  // Update dot colors when accent color changes
  // But preserve specific turquoise colors that match our reference image
  useEffect(() => {
    setDots(prev => prev.map(dot => {
      // Keep turquoise colors for the polka dot pattern
      const isTurquoise = dot.color === '#00FFFF' || 
                         dot.color.startsWith('#00C') || 
                         dot.color.startsWith('#40E');
                         
      return {
        ...dot,
        // Maintain turquoise colors regardless of accent color changes
        color: isTurquoise ? dot.color : 
               (dot.color !== '#FFFFFF' ? accentColor : '#FFFFFF'),
        glowColor: isTurquoise ? dot.glowColor : 
                  (dot.glowColor !== '#FFFFFF' ? accentColor : '#FFFFFF')
      };
    }));
  }, [accentColor]);
  
  return {
    dots
  };
};
