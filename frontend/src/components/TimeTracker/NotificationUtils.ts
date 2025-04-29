import { UserPreferences } from "./types";

export const showNotification = (message: string, preferences: UserPreferences) => {
    if (!preferences.notificationsEnabled) return;
    
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
  
    if (Notification.permission === 'granted') {
      new Notification('TimeTracker', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('TimeTracker', { body: message });
        }
      });
    }
  };