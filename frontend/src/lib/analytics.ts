export const analytics = {
    track: (event: string, metadata?: object) => {
      if (import.meta.env.DEV) {
        console.log('[Analytics]', event, metadata);
      }
      // Add actual analytics implementation (e.g., Segment, Mixpanel)
    }
  };