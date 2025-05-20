import React, { useEffect, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const ParticleBackground: React.FC = () => {
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    });
  }, []);

  const particlesConfig = useMemo(
    () => ({
      particles: {
        number: {
          value: 30,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: ['#a8d8ea', '#b4e7ce', '#e0f7fa'], // Pastel colors
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.4,
          random: true,
        },
        size: {
          value: { min: 1, max: 4 },
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: 'none' as const,
          random: true,
          outModes: {
            default: 'out' as const,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'repulse',
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      background: {
        color: 'transparent',
      },
      fullScreen: {
        enable: true,
        zIndex: -1,
      },
    }),
    []
  );

  return <Particles id="tsparticles" options={particlesConfig} />;
};

export default React.memo(ParticleBackground);