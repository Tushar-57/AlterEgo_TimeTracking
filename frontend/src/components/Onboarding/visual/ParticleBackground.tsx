import React, { useCallback } from 'react';
import { useEffect, useState } from 'react';
import { loadFull } from "tsparticles";
import type { Container, Engine } from "tsparticles-engine";

const ParticleBackground: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
    setLoaded(true);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    if (container) {
      console.log("Particles container loaded");
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      <div
        id="tsparticles"
        className="absolute inset-0"
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.2,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
        init={particlesInit}
        loaded={particlesLoaded}
      />
    </div>
  );
};

export default ParticleBackground;