export const analytics = {
    track: (event: string, metadata?: object) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Analytics]', event, metadata);
      }
      // Add actual analytics implementation (e.g., Segment, Mixpanel)
    }
  };