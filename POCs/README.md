# Voice Assistant (POC) 🎙️

A lightweight voice-activated assistant with wake/sleep capabilities, built with Python for demonstration purposes.

## Features ✨
- **Voice Interaction**  
  Natural language commands via microphone input
- **Wake/Sleep Mode**  
  `"stop"/"sleep"` to pause | `"start"/"wake"` to resume
- **Core Functionalities**  
  - Time/date queries ⏰
  - Joke telling 😄
  - Conversation starters 👋
  - Graceful exit 🚪
- **Multi-OS Support**  
  Works on Windows/macOS/Linux

## Installation ⚙️
```bash
# Clone repository
git clone https://github.com/yourusername/voice-assistant-poc.git
cd voice-assistant-poc

# Create virtual environment (recommended)
conda create -n tts_env python=3.10
conda activate tts_env

# Install dependencies
pip install SpeechRecognition gTTS sounddevice soundfile
pip install PyObjC  # Recommended for macOS audio performance

python Realtime_Text-To-Speech_Impl.py
```
## Available Commands 🔍

| Command Pattern           | Response                              |
|---------------------------|---------------------------------------|
| "Hello"/"Hi"              | Greeting response                     |
| "What's the time"         | Current time                          |
| "What's today's date"     | Current date                          |
| "Tell me a joke"          | Random science joke                   |
| "Stop"/"Go to sleep"      | Deactivates assistant                 |
| "Start"/"Wake up"         | Reactivates assistant                 |
| "Exit"/"Goodbye"          | Terminates program                    |

## Technical Specs 💻

**Core Technologies**  
Python 3.8+, SpeechRecognition, gTTS, sounddevice  

**Audio Processing**  
Real-time microphone input with noise cancellation  

**STT Engine**  
Google Speech-to-Text API (web-based)  

**Compatibility**  
Tested on macOS Ventura

## Known Issues ⚠️

- Requires stable internet connection for STT  
- Background noise may affect recognition accuracy  
- Limited to 8-second command phrases  (Can be increased)


## License 📄  
MIT License - Free for educational and personal use  