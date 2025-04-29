export class AudioManager {
    private static instance: AudioManager;
    private sounds: Record<string, HTMLAudioElement> = {};
  
    private constructor() {
      this.loadSounds();
    }
  
    public static getInstance(): AudioManager {
      if (!AudioManager.instance) {
        AudioManager.instance = new AudioManager();
      }
      return AudioManager.instance;
    }
  
    private loadSounds() {
      this.sounds = {
        complete: new Audio('https://soundbible.com/mp3/service-bell_daniel_simion.mp3'),
        tick: new Audio('https://soundbible.com/mp3/clock-ticking-2.mp3'),
        break: new Audio('https://soundbible.com/mp3/digital-quick-tone.mp3'),
        work: new Audio('https://soundbible.com/mp3/analog-watch-alarm.mp3')
      };
    }
  
    play(sound: 'complete' | 'tick' | 'break' | 'work') {
      if (this.sounds[sound]) {
        this.sounds[sound].play().catch(e => console.error('Error playing sound:', e));
      }
    }
  }