# #!/usr/bin/env python3
# """
# Enhanced Voice-Enabled RAG Application

# This application provides a voice interface to your personal knowledge base:
# - Speak questions naturally
# - Get AI-powered responses based on your personal data
# - Responses are spoken back to you
# - Includes wake word detection and sleep mode

# Usage:
#     python voice_rag_enhanced.py
# """

# import speech_recognition as sr
# from gtts import gTTS
# import os
# import sys
# import time
# from datetime import datetime
# import threading
# import tempfile
# from rag_engine import RAGEngine

# # Handle different audio playback options
# try:
#     from playsound import playsound
#     AUDIO_BACKEND = 'playsound'
# except ImportError:
#     try:
#         import pygame
#         pygame.mixer.init()
#         AUDIO_BACKEND = 'pygame'
#     except ImportError:
#         try:
#             import subprocess
#             AUDIO_BACKEND = 'system'
#         except ImportError:
#             AUDIO_BACKEND = None

# class VoiceRAGAssistant:
#     def __init__(self):
#         """Initialize the Voice RAG Assistant"""
#         print("🚀 Initializing Voice RAG Assistant...")
        
#         # Initialize RAG engine
#         try:
#             self.rag_engine = RAGEngine()
#             print("✅ RAG Engine loaded successfully")
#         except Exception as e:
#             print(f"❌ Failed to initialize RAG Engine: {e}")
#             sys.exit(1)
        
#         # Initialize speech recognition
#         self.recognizer = sr.Recognizer()
#         self.microphone = sr.Microphone()
        
#         # Adjust for ambient noise
#         print("🎤 Calibrating microphone for ambient noise...")
#         with self.microphone as source:
#             self.recognizer.adjust_for_ambient_noise(source, duration=2)
#         print("✅ Microphone calibrated")
        
#         # Assistant state
#         self.is_active = True
#         self.conversation_count = 0
        
#         # Wake words
#         self.wake_words = ['hey assistant', 'hello assistant', 'wake up', 'start listening']
#         self.sleep_words = ['go to sleep', 'stop listening', 'sleep mode', 'pause']
#         self.exit_words = ['quit', 'exit', 'goodbye', 'stop application']
        
#     def listen_for_speech(self, timeout=5, phrase_time_limit=10):
#         """Listen for speech input with timeout"""
#         try:
#             with self.microphone as source:
#                 print("🎤 Listening...")
#                 audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            
#             # Recognize speech
#             try:
#                 text = self.recognizer.recognize_google(audio)
#                 print(f"🗣️ You said: '{text}'")
#                 return text.lower().strip()
#             except sr.UnknownValueError:
#                 print("😕 Could not understand the audio")
#                 return None
#             except sr.RequestError as e:
#                 print(f"⚠️ Speech recognition service error: {e}")
#                 return None
                
#         except sr.WaitTimeoutError:
#             return None  # Timeout, but not an error
#         except Exception as e:
#             print(f"❌ Microphone error: {e}")
#             return None
    
#     def speak_text(self, text, cleanup=True):
#         """Convert text to speech and play it"""
#         if not text or not text.strip():
#             return
            
#         try:
#             # Create TTS
#             tts = gTTS(text=text, lang='en', slow=False)
            
#             # Create temporary file
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
#                 audio_file = tmp_file.name
#                 tts.save(audio_file)
            
#             print("🔊 Speaking response...")
            
#             # Play audio based on available backend
#             if AUDIO_BACKEND == 'playsound':
#                 playsound(audio_file)
#             elif AUDIO_BACKEND == 'pygame':
#                 pygame.mixer.music.load(audio_file)
#                 pygame.mixer.music.play()
#                 while pygame.mixer.music.get_busy():
#                     time.sleep(0.1)
#             elif AUDIO_BACKEND == 'system':
#                 if sys.platform == 'darwin':  # macOS
#                     subprocess.run(['afplay', audio_file])
#                 elif sys.platform == 'linux':  # Linux
#                     subprocess.run(['mpg123', audio_file])
#                 elif sys.platform == 'win32':  # Windows
#                     os.system(f'start {audio_file}')
#             else:
#                 print("⚠️ No audio backend available. Text-only mode.")
#                 return
            
#             # Cleanup
#             if cleanup and os.path.exists(audio_file):
#                 os.remove(audio_file)
                
#         except Exception as e:
#             print(f"⚠️ Text-to-speech error: {e}")
#             print("📝 Fallback: Response displayed in text only")
    
#     def format_response_for_speech(self, response_text):
#         """Format the RAG response for more natural speech"""
#         # Remove Chain-of-Thought formatting for speech
#         lines = response_text.split('\\n')
#         speech_parts = []
        
#         skip_phrases = [
#             'what is the user asking',
#             'what relevant information',
#             'how can i best use',
#             'what would be the most helpful',
#             'let me think',
#             'step by step',
#             'final answer:'
#         ]
        
#         for line in lines:
#             line = line.strip()
#             if not line:
#                 continue
                
#             # Skip meta-reasoning
#             if any(phrase in line.lower() for phrase in skip_phrases):
#                 continue
            
#             # Remove numbered steps
#             if line.startswith(('1.', '2.', '3.', '4.')):
#                 continue
            
#             # Clean formatting
#             line = line.replace('**', '').replace('*', '')
            
#             # Look for the actual answer content
#             if 'final answer' in line.lower():
#                 # Extract everything after "final answer:"
#                 parts = line.lower().split('final answer:')
#                 if len(parts) > 1:
#                     speech_parts.append(parts[1].strip())
#                 continue
            
#             # Add substantial content
#             if len(line) > 20:  # Only add substantial lines
#                 speech_parts.append(line)
        
#         # Join and limit length for speech
#         result = ' '.join(speech_parts)
        
#         # If still too long, get the most important part
#         if len(result) > 400:
#             sentences = result.split('. ')
#             if len(sentences) > 2:
#                 # Take the last few sentences which usually contain the main answer
#                 result = '. '.join(sentences[-3:])
        
#         return result if result.strip() else "I found some information, but I'm having trouble summarizing it clearly."
    
#     def process_query(self, query):
#         """Process user query through RAG engine"""
#         try:
#             print("🔍 Searching your knowledge base...")
#             result = self.rag_engine.query(query)
            
#             response = result['response']
#             contexts = result.get('contexts', [])
            
#             print(f"📚 Found {len(contexts)} relevant sources")
#             print(f"🤖 Response: {response}")
            
#             # Format for speech
#             speech_response = self.format_response_for_speech(response)
            
#             return speech_response
            
#         except Exception as e:
#             print(f"❌ Error processing query: {e}")
#             return "I encountered an error while searching your knowledge base. Please try again."
    
#     def handle_command(self, text):
#         """Handle special commands and return True if should continue"""
#         text = text.lower().strip()
        
#         # Exit commands
#         if any(word in text for word in self.exit_words):
#             goodbye_msg = "Goodbye! Thanks for using your personal RAG assistant."
#             print(f"👋 {goodbye_msg}")
#             self.speak_text(goodbye_msg)
#             return False
        
#         # Sleep commands
#         if any(word in text for word in self.sleep_words):
#             if self.is_active:
#                 self.is_active = False
#                 sleep_msg = "Going to sleep mode. Say 'hey assistant' to wake me up."
#                 print(f"😴 {sleep_msg}")
#                 self.speak_text(sleep_msg)
#             return True
        
#         # Wake commands
#         if any(word in text for word in self.wake_words):
#             if not self.is_active:
#                 self.is_active = True
#                 wake_msg = "I'm awake! How can I help you?"
#                 print(f"👋 {wake_msg}")
#                 self.speak_text(wake_msg)
#             return True
        
#         # If in sleep mode and not a wake command, ignore
#         if not self.is_active:
#             return True
        
#         # Process as regular query
#         response = self.process_query(text)
#         self.speak_text(response)
#         self.conversation_count += 1
        
#         return True
    
#     def run(self):
#         """Main application loop"""
#         welcome_msg = """Welcome to your Personal Voice RAG Assistant! 
#         I can answer questions about your personal knowledge base using voice commands.
        
#         Commands:
#         - Ask any question naturally
#         - Say 'go to sleep' to pause listening
#         - Say 'hey assistant' to wake up
#         - Say 'quit' or 'goodbye' to exit
        
#         I'm ready to help!"""
        
#         print("🎙️ " + "="*60)
#         print(welcome_msg)
#         print("="*60)
        
#         self.speak_text("Hello! I'm your personal voice RAG assistant. I'm ready to answer questions about your knowledge base!")
        
#         consecutive_failures = 0
#         max_consecutive_failures = 5
        
#         try:
#             while True:
#                 # Listen for input
#                 if self.is_active:
#                     text = self.listen_for_speech(timeout=10, phrase_time_limit=15)
#                 else:
#                     # In sleep mode, listen with shorter timeout for wake words
#                     text = self.listen_for_speech(timeout=3, phrase_time_limit=8)
                
#                 if text:
#                     consecutive_failures = 0
                    
#                     # Handle the command/query
#                     should_continue = self.handle_command(text)
#                     if not should_continue:
#                         break
                        
#                     print("\\n" + "-"*50 + "\\n")
                    
#                 else:
#                     consecutive_failures += 1
#                     if consecutive_failures >= max_consecutive_failures:
#                         print("⚠️ Multiple listening failures. Checking microphone...")
#                         self.speak_text("Having trouble hearing you. Please check your microphone.")
#                         consecutive_failures = 0
                
#         except KeyboardInterrupt:
#             print("\\n\\n👋 Application interrupted. Goodbye!")
#             self.speak_text("Goodbye!")
#         except Exception as e:
#             print(f"❌ Application error: {e}")
#             self.speak_text("I encountered an error. Goodbye!")
        
#         print(f"\\n📊 Session complete. Processed {self.conversation_count} queries.")

# def main():
#     """Main function"""
#     if AUDIO_BACKEND is None:
#         print("❌ No audio backend available. Please install playsound, pygame, or ensure system audio tools are available.")
#         print("💡 Try: pip install playsound pygame")
#         sys.exit(1)
    
#     print(f"🔊 Using audio backend: {AUDIO_BACKEND}")
    
#     assistant = VoiceRAGAssistant()
#     assistant.run()

# if __name__ == "__main__":
#     main()

#!/usr/bin/env python3
"""
Enhanced Voice-Enabled RAG Application

This application provides a voice interface to your personal knowledge base:
- Speak questions naturally
- Get AI-powered responses based on your personal data
- Responses are spoken back to you
- Includes wake word detection and sleep mode

Usage:
    python voice_rag_enhanced.py
"""

import speech_recognition as sr
from gtts import gTTS
import os
import sys
import time
from datetime import datetime
import threading
import tempfile
import openai
from rag_engine import RAGEngine

# Handle different audio playback options
try:
    from playsound import playsound
    AUDIO_BACKEND = 'playsound'
except ImportError:
    try:
        import pygame
        pygame.mixer.init()
        AUDIO_BACKEND = 'pygame'
    except ImportError:
        try:
            import subprocess
            AUDIO_BACKEND = 'system'
        except ImportError:
            AUDIO_BACKEND = None

class VoiceRAGAssistant:
    def __init__(self):
        """Initialize the Voice RAG Assistant"""
        print("🚀 Initializing Voice RAG Assistant...")
        
        # Initialize RAG engine
        try:
            self.rag_engine = RAGEngine()
            self.client = self.rag_engine.client  # Reuse OpenAI client for Whisper
            print("✅ RAG Engine loaded successfully")
        except Exception as e:
            print(f"❌ Failed to initialize RAG Engine: {e}")
            sys.exit(1)
        
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Adjust for ambient noise
        print("🎤 Calibrating microphone for ambient noise...")
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=2)
        print("✅ Microphone calibrated")
        
        # Assistant state
        self.is_active = True
        self.conversation_count = 0
        self.history = []  # Conversation history for context
        
        # Wake words
        self.wake_words = ['hey assistant', 'hello assistant', 'wake up', 'start listening']
        self.sleep_words = ['go to sleep', 'stop listening', 'sleep mode', 'pause']
        self.exit_words = ['quit', 'exit', 'goodbye', 'stop application']
        
    def listen_for_speech(self, timeout=5, phrase_time_limit=10):
        """Listen for speech input with timeout"""
        try:
            with self.microphone as source:
                print("🎤 Listening...")
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            
            # Save audio to temp file for Whisper
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                wav_path = tmp_file.name
                with open(wav_path, 'wb') as f:
                    f.write(audio.get_wav_data())
            
            # Transcribe using OpenAI Whisper API
            try:
                with open(wav_path, 'rb') as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                text = transcript.text
                print(f"🗣️ You said: '{text}'")
                os.remove(wav_path)
                return text.lower().strip()
            except Exception as e:
                print(f"⚠️ Whisper transcription error: {e}")
                os.remove(wav_path)
                return None
                
        except sr.WaitTimeoutError:
            return None  # Timeout, but not an error
        except Exception as e:
            print(f"❌ Microphone error: {e}")
            return None
    
    def speak_text(self, text, cleanup=True):
        """Convert text to speech and play it"""
        if not text or not text.strip():
            return
            
        try:
            # Create TTS
            tts = gTTS(text=text, lang='en', slow=False)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                audio_file = tmp_file.name
                tts.save(audio_file)
            
            print("🔊 Speaking response...")
            
            # Play audio based on available backend
            if AUDIO_BACKEND == 'playsound':
                playsound(audio_file)
            elif AUDIO_BACKEND == 'pygame':
                pygame.mixer.music.load(audio_file)
                pygame.mixer.music.play()
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
            elif AUDIO_BACKEND == 'system':
                if sys.platform == 'darwin':  # macOS
                    subprocess.run(['afplay', audio_file])
                elif sys.platform == 'linux':  # Linux
                    subprocess.run(['mpg123', audio_file])
                elif sys.platform == 'win32':  # Windows
                    os.system(f'start {audio_file}')
            else:
                print("⚠️ No audio backend available. Text-only mode.")
                return
            
            # Cleanup
            if cleanup and os.path.exists(audio_file):
                os.remove(audio_file)
                
        except Exception as e:
            print(f"⚠️ Text-to-speech error: {e}")
            print("📝 Fallback: Response displayed in text only")
    
    def format_response_for_speech(self, response_text):
        """Format the RAG response for more natural speech"""
        # Remove Chain-of-Thought formatting for speech
        lines = response_text.split('\\n')
        speech_parts = []
        
        skip_phrases = [
            'what is the user asking',
            'what relevant information',
            'how can i best use',
            'what would be the most helpful',
            'let me think',
            'step by step',
            'final answer:'
        ]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Skip meta-reasoning
            if any(phrase in line.lower() for phrase in skip_phrases):
                continue
            
            # Remove numbered steps
            if line.startswith(('1.', '2.', '3.', '4.')):
                continue
            
            # Clean formatting
            line = line.replace('**', '').replace('*', '')
            
            # Look for the actual answer content
            if 'final answer' in line.lower():
                # Extract everything after "final answer:"
                parts = line.lower().split('final answer:')
                if len(parts) > 1:
                    speech_parts.append(parts[1].strip())
                continue
            
            # Add substantial content
            if len(line) > 20:  # Only add substantial lines
                speech_parts.append(line)
        
        # Join and limit length for speech
        result = ' '.join(speech_parts)
        
        # If still too long, get the most important part
        if len(result) > 400:
            sentences = result.split('. ')
            if len(sentences) > 2:
                # Take the last few sentences which usually contain the main answer
                result = '. '.join(sentences[-3:])
        
        return result if result.strip() else "I found some information, but I'm having trouble summarizing it clearly."
    
    def process_query(self, query):
        """Process user query through RAG engine"""
        try:
            print("🔍 Searching your knowledge base...")
            result = self.rag_engine.query(query, history=self.history)
            
            response = result['response']
            contexts = result.get('contexts', [])
            
            print(f"📚 Found {len(contexts)} relevant sources")
            print(f"🤖 Response: {response}")
            
            # Format for speech
            speech_response = self.format_response_for_speech(response)
            
            return speech_response
            
        except Exception as e:
            print(f"❌ Error processing query: {e}")
            return "I encountered an error while searching your knowledge base. Please try again."
    
    def handle_command(self, text):
        """Handle special commands and return True if should continue"""
        text = text.lower().strip()
        
        # Exit commands
        if any(word in text for word in self.exit_words):
            goodbye_msg = "Goodbye! Thanks for using your personal RAG assistant."
            print(f"👋 {goodbye_msg}")
            self.speak_text(goodbye_msg)
            return False
        
        # Sleep commands
        if any(word in text for word in self.sleep_words):
            if self.is_active:
                self.is_active = False
                sleep_msg = "Going to sleep mode. Say 'hey assistant' to wake me up."
                print(f"😴 {sleep_msg}")
                self.speak_text(sleep_msg)
            return True
        
        # Wake commands
        if any(word in text for word in self.wake_words):
            if not self.is_active:
                self.is_active = True
                wake_msg = "I'm awake! How can I help you?"
                print(f"👋 {wake_msg}")
                self.speak_text(wake_msg)
            return True
        
        # If in sleep mode and not a wake command, ignore
        if not self.is_active:
            return True
        
        # Process as regular query
        response = self.process_query(text)
        self.speak_text(response)
        self.history.append({"role": "user", "content": text})
        self.history.append({"role": "assistant", "content": response})
        self.conversation_count += 1
        
        # Multi-turn prompt
        self.speak_text("Anything else I can help with?")
        
        return True
    
    def run(self):
        """Main application loop"""
        welcome_msg = """Welcome to your Personal Voice RAG Assistant! 
        I can answer questions about your personal knowledge base using voice commands.
        
        Commands:
        - Ask any question naturally
        - Say 'go to sleep' to pause listening
        - Say 'hey assistant' to wake up
        - Say 'quit' or 'goodbye' to exit
        
        I'm ready to help!"""
        
        print("🎙️ " + "="*60)
        print(welcome_msg)
        print("="*60)
        
        self.speak_text("Hello! I'm your personal voice RAG assistant. I'm ready to answer questions about your knowledge base!")
        
        consecutive_failures = 0
        max_consecutive_failures = 5
        
        try:
            while True:
                # Listen for input
                if self.is_active:
                    text = self.listen_for_speech(timeout=10, phrase_time_limit=15)
                else:
                    # In sleep mode, listen with shorter timeout for wake words
                    text = self.listen_for_speech(timeout=3, phrase_time_limit=8)
                
                if text:
                    consecutive_failures = 0
                    
                    # Handle the command/query
                    should_continue = self.handle_command(text)
                    if not should_continue:
                        break
                        
                    print("\n" + "-"*50 + "\n")
                    
                else:
                    consecutive_failures += 1
                    if consecutive_failures >= max_consecutive_failures:
                        print("⚠️ Multiple listening failures. Checking microphone...")
                        self.speak_text("Having trouble hearing you. Please check your microphone.")
                        consecutive_failures = 0
                
        except KeyboardInterrupt:
            print("\n\n👋 Application interrupted. Goodbye!")
            self.speak_text("Goodbye!")
        except Exception as e:
            print(f"❌ Application error: {e}")
            self.speak_text("I encountered an error. Goodbye!")
        
        print(f"\n📊 Session complete. Processed {self.conversation_count} queries.")

def main():
    """Main function"""
    if AUDIO_BACKEND is None:
        print("❌ No audio backend available. Please install playsound, pygame, or ensure system audio tools are available.")
        print("💡 Try: pip install playsound pygame")
        sys.exit(1)
    
    print(f"🔊 Using audio backend: {AUDIO_BACKEND}")
    
    assistant = VoiceRAGAssistant()
    assistant.run()

if __name__ == "__main__":
    main()