# # """
# # Enhanced Voice-Enabled RAG Application

# # This application provides a voice interface to your personal knowledge base:
# # - Speak questions naturally
# # - Get AI-powered responses based on your personal data
# # - Responses are spoken back to you
# # - Includes wake word detection and sleep mode

# # Usage:
# #     python voice_rag_enhanced.py
# # """

# # import speech_recognition as sr
# # import os
# # import sys
# # import time
# # from datetime import datetime
# # import tempfile
# # import openai
# # from rag_engine import RAGEngine
# # import pvporcupine
# # import pyaudio
# # import struct
# # from gtts import gTTS  # For TTS fallback
# # import subprocess  # For system playback

# # # Force system backend on macOS for reliability (afplay)
# # if sys.platform == 'darwin':
# #     AUDIO_BACKEND = 'system'
# # else:
# #     AUDIO_BACKEND = None
# #     try:
# #         from playsound import playsound
# #         AUDIO_BACKEND = 'playsound'
# #     except ImportError:
# #         try:
# #             import pygame
# #             pygame.mixer.pre_init(44100, -16, 2, 8192)  # Large buffer
# #             pygame.mixer.init()
# #             AUDIO_BACKEND = 'pygame'
# #         except ImportError:
# #             AUDIO_BACKEND = 'system'

# # class VoiceRAGAssistant:
# #     def __init__(self):
# #         """Initialize the Voice RAG Assistant"""
# #         print("🚀 Initializing Voice RAG Assistant...")
        
# #         # Initialize RAG engine
# #         try:
# #             self.rag_engine = RAGEngine()
# #             self.client = self.rag_engine.client  # Reuse OpenAI client for Whisper and TTS
# #             print("✅ RAG Engine loaded successfully")
# #         except Exception as e:
# #             print(f"❌ Failed to initialize RAG Engine: {e}")
# #             sys.exit(1)
        
# #         # Initialize speech recognition
# #         self.recognizer = sr.Recognizer()
# #         self.microphone = sr.Microphone()
        
# #         # Adjust for ambient noise
# #         print("🎤 Calibrating microphone for ambient noise...")
# #         with self.microphone as source:
# #             self.recognizer.adjust_for_ambient_noise(source, duration=2)
# #         print("✅ Microphone calibrated")
        
# #         # Assistant state
# #         self.is_active = True
# #         self.conversation_count = 0
# #         self.history = []  # Conversation history for context
        
# #         # Wake words for Porcupine (use built-in or custom .ppn paths)
# #         self.wake_keywords = ['porcupine']  # Built-in; or ['hey assistant'] with custom .ppn
        
# #         # Porcupine for continuous hotword detection
# #         self.porcupine = None
# #         self.pa = None
# #         self.audio_stream = None
# #         self._init_porcupine()
        
# #         # Sleep/exit words (processed after transcription)
# #         self.sleep_words = ['go to sleep', 'stop listening', 'sleep mode', 'pause']
# #         self.exit_words = ['quit', 'exit', 'goodbye', 'stop application']
        
# #     def _init_porcupine(self):
# #         """Initialize Porcupine for hotword detection"""
# #         try:
# #             # Replace with your Picovoice AccessKey
# #             access_key = os.getenv('PICOVOICE_ACCESS_KEY', 'S8xc37/W+gX7GKA1ZkF1GMpRBWV67kRB5FpeLwzEGV7Y2f+m+dbrAg==')
# #             self.porcupine = pvporcupine.create(
# #                 access_key=access_key,
# #                 keywords=self.wake_keywords  # Or keyword_paths=['path/to/custom.ppn']
# #             )
# #             self.pa = pyaudio.PyAudio()
# #             self.audio_stream = self.pa.open(
# #                 rate=self.porcupine.sample_rate,
# #                 channels=1,
# #                 format=pyaudio.paInt16,
# #                 input=True,
# #                 frames_per_buffer=self.porcupine.frame_length
# #             )
# #             print("✅ Porcupine hotword detection initialized for continuous listening")
# #         except Exception as e:
# #             print(f"⚠️ Failed to initialize Porcupine: {e}. Falling back to timeout-based listening.")
# #             self.porcupine = None
    
# #     def listen_for_speech(self, timeout=10, phrase_time_limit=15):
# #         """Listen for speech input with timeout"""
# #         try:
# #             with self.microphone as source:
# #                 print("🎤 Listening for query...")
# #                 audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            
# #             # Save audio to temp file for Whisper
# #             with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
# #                 wav_path = tmp_file.name
# #                 with open(wav_path, 'wb') as f:
# #                     f.write(audio.get_wav_data())
            
# #             # Transcribe using OpenAI Whisper API
# #             try:
# #                 with open(wav_path, 'rb') as audio_file:
# #                     transcript = self.client.audio.transcriptions.create(
# #                         model="whisper-1",
# #                         file=audio_file,
# #                         language="en"  # Force English transcription
# #                     )
# #                 text = transcript.text
# #                 print(f"🗣️ You said: '{text}'")
# #                 os.remove(wav_path)
# #                 return text.lower().strip()
# #             except Exception as e:
# #                 print(f"⚠️ Whisper transcription error: {e}")
# #                 os.remove(wav_path)
# #                 return None
                
# #         except sr.WaitTimeoutError:
# #             return None
# #         except Exception as e:
# #             print(f"❌ Microphone error: {e}")
# #             return None
    
# #     def speak_text(self, text, cleanup=True):
# #         """Convert text to speech using OpenAI TTS and play it"""
# #         if not text or not text.strip():
# #             return
            
# #         try:
# #             # Create TTS with OpenAI (fix deprecation and save binary)
# #             response = self.client.audio.speech.create(
# #                 model="tts-1",  # Or "tts-1-hd" for higher quality
# #                 voice="shimmer",  # Advanced voices: alloy, echo, fable, onyx, nova, shimmer
# #                 input=text
# #             )
            
# #             # Create temporary file and write content
# #             with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
# #                 audio_file = tmp_file.name
# #                 with open(audio_file, "wb") as f:
# #                     f.write(response.content)  # Write binary content
            
# #             print("🔊 Speaking response...")
            
# #             # Play audio with error handling
# #             played = False
# #             try:
# #                 if AUDIO_BACKEND == 'playsound':
# #                     playsound(audio_file)
# #                     played = True
# #                 elif AUDIO_BACKEND == 'pygame':
# #                     pygame.mixer.music.load(audio_file)
# #                     pygame.mixer.music.play()
# #                     while pygame.mixer.music.get_busy():
# #                         time.sleep(0.1)
# #                     played = True
# #                 elif AUDIO_BACKEND == 'system':
# #                     if sys.platform == 'darwin':
# #                         subprocess.run(['afplay', audio_file], check=True)
# #                     elif sys.platform == 'linux':
# #                         subprocess.run(['mpg123', audio_file], check=True)
# #                     elif sys.platform == 'win32':
# #                         os.system(f'start {audio_file}')
# #                     played = True
# #             except Exception as play_error:
# #                 print(f"⚠️ Playback error: {play_error}. Trying system fallback...")
            
# #             # Ultimate fallback if not played
# #             if not played and sys.platform == 'darwin':
# #                 try:
# #                     subprocess.run(['afplay', audio_file], check=True)
# #                 except:
# #                     print("All playbacks failed.")
            
# #             # Cleanup
# #             if cleanup and os.path.exists(audio_file):
# #                 os.remove(audio_file)
                
# #         except Exception as e:
# #             print(f"⚠️ OpenAI TTS error: {e}. Falling back to gTTS.")
# #             # Fallback to original gTTS
# #             try:
# #                 tts = gTTS(text=text, lang='en', slow=False)
# #                 with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
# #                     audio_file = tmp_file.name
# #                     tts.save(audio_file)
# #                 # Play with same handling as above
# #                 played = False
# #                 try:
# #                     if AUDIO_BACKEND == 'playsound':
# #                         playsound(audio_file)
# #                         played = True
# #                     # ... (repeat play logic)
# #                 except:
# #                     print("Fallback playback error.")
# #                 if not played and sys.platform == 'darwin':
# #                     subprocess.run(['afplay', audio_file], check=True)
# #                 if cleanup and os.path.exists(audio_file):
# #                     os.remove(audio_file)
# #             except:
# #                 print("📝 Double fallback: Response displayed in text only")
    
# #     def format_response_for_speech(self, response_text):
# #         """Format the RAG response for more natural speech"""
# #         response_text = response_text.strip()
        
# #         # Extract everything after 'Final Answer:' if present
# #         if 'final answer:' in response_text.lower():
# #             final_part = response_text.lower().split('final answer:')[-1].strip()
# #             # Clean up any remaining formatting
# #             final_part = final_part.replace('**', '').replace('*', '').replace('#', '').replace('\\n', ' ').strip()
# #             return final_part if final_part else "I found some information, but let's try rephrasing your question."
        
# #         # If no 'Final Answer', clean the entire response
# #         cleaned = response_text.replace('**', '').replace('*', '').replace('#', '').replace('\\n', ' ').strip()
# #         # Limit length
# #         if len(cleaned) > 600:
# #             sentences = cleaned.split('. ')
# #             cleaned = '. '.join(sentences[-5:])  # Last 5 sentences
# #         return cleaned if cleaned else "I found some information, but let's try rephrasing your question."
    
# #     def process_query(self, query):
# #         """Process user query through RAG engine"""
# #         try:
# #             print("🔍 Searching your knowledge base...")
# #             result = self.rag_engine.query(query, history=self.history)
            
# #             response = result['response']
# #             contexts = result.get('contexts', [])
            
# #             print(f"📚 Found {len(contexts)} relevant sources")
# #             print(f"🤖 Raw Response: {response}")
            
# #             # Format for speech
# #             speech_response = self.format_response_for_speech(response)
# #             print(f"🗣️ Formatted Speech: {speech_response}")
            
# #             return speech_response
            
# #         except Exception as e:
# #             print(f"❌ Error processing query: {e}")
# #             return "I encountered an error while searching your knowledge base. Please try again."
    
# #     def handle_command(self, text):
# #         """Handle special commands and return True if should continue"""
# #         text = text.lower().strip()
        
# #         # Exit commands
# #         if any(word in text for word in self.exit_words):
# #             goodbye_msg = "Goodbye! Thanks for using your personal RAG assistant."
# #             print(f"👋 {goodbye_msg}")
# #             self.speak_text(goodbye_msg)
# #             return False
        
# #         # Sleep commands
# #         if any(word in text for word in self.sleep_words):
# #             if self.is_active:
# #                 self.is_active = False
# #                 sleep_msg = "Going to sleep mode. Say a wake word to activate me."
# #                 print(f"😴 {sleep_msg}")
# #                 self.speak_text(sleep_msg)
# #             return True
        
# #         # Process as regular query
# #         response = self.process_query(text)
# #         self.speak_text(response)
# #         self.history.append({"role": "user", "content": text})
# #         self.history.append({"role": "assistant", "content": response})
# #         self.conversation_count += 1
        
# #         # Multi-turn prompt
# #         self.speak_text("Anything else I can help with?")
        
# #         return True
    
# #     def run(self):
# #         """Main application loop with continuous hotword listening"""
# #         welcome_msg = """Welcome to your Personal Voice RAG Assistant! 
# #         I can answer questions about your personal knowledge base using voice commands.
        
# #         Commands:
# #         - Ask any question naturally
# #         - Say 'go to sleep' to pause listening
# #         - Say a wake word like 'porcupine' to wake up
# #         - Say 'quit' or 'goodbye' to exit
        
# #         I'm ready to help!"""
        
# #         print("🎙️ " + "="*60)
# #         print(welcome_msg)
# #         print("="*60)
        
# #         self.speak_text("Hello! I'm your personal voice RAG assistant. I'm ready to answer questions about your knowledge base!")
        
# #         consecutive_failures = 0
# #         max_consecutive_failures = 5
        
# #         try:
# #             while True:
# #                 if self.porcupine:
# #                     # Continuous hotword listening with throttle and error handling
# #                     try:
# #                         pcm = self.audio_stream.read(self.porcupine.frame_length)
# #                         pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
# #                         keyword_index = self.porcupine.process(pcm)
# #                         if keyword_index >= 0:
# #                             print(f"Wake word '{self.wake_keywords[keyword_index]}' detected!")
# #                             self.is_active = True  # Wake if asleep
# #                     except OSError as e:
# #                         if "overflow" in str(e).lower():
# #                             print("⚠️ Audio input overflow - skipping frame.")
# #                             time.sleep(0.1)  # Brief pause on overflow
# #                         else:
# #                             raise
# #                     time.sleep(0.001)  # Throttle loop to prevent overflow
# #                 else:
# #                     # Fallback to old timeout listen
# #                     time.sleep(1)  # Poll less aggressively
                
# #                 if self.is_active:
# #                     text = self.listen_for_speech(timeout=10, phrase_time_limit=15)
# #                     if text:
# #                         consecutive_failures = 0
# #                         should_continue = self.handle_command(text)
# #                         if not should_continue:
# #                             break
# #                         print("\n" + "-"*50 + "\n")
# #                     else:
# #                         consecutive_failures += 1
# #                         if consecutive_failures >= max_consecutive_failures:
# #                             print("⚠️ Multiple listening failures. Checking microphone...")
# #                             self.speak_text("Having trouble hearing you. Please check your microphone.")
# #                             consecutive_failures = 0
                    
# #         except KeyboardInterrupt:
# #             print("\n\n👋 Application interrupted. Goodbye!")
# #             self.speak_text("Goodbye!")
# #         except Exception as e:
# #             print(f"❌ Application error: {e}")
# #             self.speak_text("I encountered an error. Goodbye!")
# #         finally:
# #             # Cleanup Porcupine
# #             if self.porcupine:
# #                 self.porcupine.delete()
# #             if self.audio_stream:
# #                 self.audio_stream.close()
# #             if self.pa:
# #                 self.pa.terminate()
        
# #         print(f"\n📊 Session complete. Processed {self.conversation_count} queries.")

# # def main():
# #     """Main function"""
# #     if AUDIO_BACKEND is None:
# #         print("❌ No audio backend available. Please install playsound or ensure system audio tools are available.")
# #         print("💡 Try: pip install playsound")
# #         sys.exit(1)
    
# #     print(f"🔊 Using audio backend: {AUDIO_BACKEND}")
    
# #     assistant = VoiceRAGAssistant()
# #     assistant.run()

# # if __name__ == "__main__":
# #     main()
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
# import os
# import sys
# import time
# from datetime import datetime
# import tempfile
# import openai
# from rag_engine import RAGEngine
# import pvporcupine
# import pyaudio
# import struct
# from gtts import gTTS  # For TTS fallback
# import subprocess  # For system playback
# import threading  # For concurrent listening during speech

# # Force system backend on macOS for reliability (afplay)
# if sys.platform == 'darwin':
#     AUDIO_BACKEND = 'system'
# else:
#     AUDIO_BACKEND = None
#     try:
#         from playsound import playsound
#         AUDIO_BACKEND = 'playsound'
#     except ImportError:
#         AUDIO_BACKEND = 'system'

# class VoiceRAGAssistant:
#     def __init__(self):
#         """Initialize the Voice RAG Assistant"""
#         print("🚀 Initializing Voice RAG Assistant...")
        
#         # Initialize RAG engine
#         try:
#             self.rag_engine = RAGEngine()
#             self.client = self.rag_engine.client  # Reuse OpenAI client for Whisper and TTS
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
#         self.history = []  # Conversation history for context
#         self.speaking_process = None  # For interrupting speech
#         self.interrupt_event = threading.Event()  # For signaling interrupt
#         self.last_spoken_text = None
#         self.suppress_listening = False
#         self.post_speak_pause = 3.0
        
#         # Wake words for Porcupine (use built-in or custom .ppn paths)
#         self.wake_keywords = ['porcupine']  # Built-in; or ['hey assistant'] with custom .ppn
        
#         # Porcupine for continuous hotword detection
#         self.porcupine = None
#         self.pa = None
#         self.audio_stream = None
#         self._init_porcupine()
        
#         # Sleep/exit words (processed after transcription)
#         self.sleep_words = ['go to sleep', 'stop listening', 'sleep mode', 'pause']
#         self.exit_words = ['quit', 'exit', 'goodbye', 'stop application']
#         self.interrupt_phrase = 'listen assistant'  # Phrase to stop speaking and listen
        
#     def _init_porcupine(self):
#         """Initialize Porcupine for hotword detection"""
#         try:
#             # Replace with your Picovoice AccessKey
#             access_key = os.getenv('PICOVOICE_ACCESS_KEY', 'S8xc37/W+gX7GKA1ZkF1GMpRBWV67kRB5FpeLwzEGV7Y2f+m+dbrAg==')
#             self.porcupine = pvporcupine.create(
#                 access_key=access_key,
#                 keywords=self.wake_keywords  # Or keyword_paths=['path/to/custom.ppn']
#             )
#             self.pa = pyaudio.PyAudio()
#             self.audio_stream = self.pa.open(
#                 rate=self.porcupine.sample_rate,
#                 channels=1,
#                 format=pyaudio.paInt16,
#                 input=True,
#                 exception_on_overflow=False,
#                 frames_per_buffer=self.porcupine.frame_length
#             )
#             print("✅ Porcupine hotword detection initialized for continuous listening")
#         except Exception as e:
#             print(f"⚠️ Failed to initialize Porcupine: {e}. Falling back to timeout-based listening.")
#             self.porcupine = None
    
#     def listen_for_speech(self, timeout=10, phrase_time_limit=15):
#         """Listen for speech input with timeout"""
#         try:
#             with self.microphone as source:
#                 print("🎤 Listening for query...")
#                 audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            
#             # Save audio to temp file for Whisper
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
#                 wav_path = tmp_file.name
#                 with open(wav_path, 'wb') as f:
#                     f.write(audio.get_wav_data())
            
#             # Transcribe using OpenAI Whisper API
#             try:
#                 with open(wav_path, 'rb') as audio_file:
#                     transcript = self.client.audio.transcriptions.create(
#                         model="whisper-1",
#                         file=audio_file,
#                         language="en"  # Force English transcription
#                     )
#                 text = transcript.text
#                 print(f"🗣️ You said: '{text}'")
#                 os.remove(wav_path)
#                 return text.lower().strip()
#             except Exception as e:
#                 print(f"⚠️ Whisper transcription error: {e}")
#                 os.remove(wav_path)
#                 return None
                
#         except sr.WaitTimeoutError:
#             return None
#         except Exception as e:
#             print(f"❌ Microphone error: {e}")
#             return None
    
#     def speak_text(self, text, cleanup=True):
#         """Convert text to speech using OpenAI TTS and play it interruptibly"""
#         if not text or not text.strip():
#             return
#         self.suppress_listening = True
#         try:
#             # Create TTS with OpenAI
#             response = self.client.audio.speech.create(
#                 model="tts-1",  # Or "tts-1-hd" for higher quality
#                 voice="echo",  # Advanced voices: alloy, echo, fable, onyx, nova, shimmer
#                 input=text
#             )
            
#             # Create temporary file
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
#                 audio_file = tmp_file.name
#                 with open(audio_file, "wb") as f:
#                     f.write(response.content)  # Write binary content
            
#             print("🔊 Speaking response...")
            
#             # Play in a separate process for interruptibility (e.g., afplay on mac)
#             self.last_spoken_text = text.lower()
#             if sys.platform == 'darwin':
#                 self.speaking_process = subprocess.Popen(['afplay', audio_file])
#             elif sys.platform == 'linux':
#                 self.speaking_process = subprocess.Popen(['mpg123', audio_file])
#             elif sys.platform == 'win32':
#                 self.speaking_process = subprocess.Popen(f'start {audio_file}', shell=True)
#             else:
#                 print("⚠️ Unsupported platform for interruptible playback.")
#                 return
            
#             # Start concurrent listening for interrupt in a thread
#             interrupt_thread = threading.Thread(target=self._listen_for_interrupt_during_speech)
#             interrupt_thread.start()
            
#             # Wait for playback to finish or interrupt
#             self.speaking_process.wait()
            
#             # Cleanup
#             if cleanup and os.path.exists(audio_file):
#                 os.remove(audio_file)
                
#         except Exception as e:
#             print(f"⚠️ OpenAI TTS error: {e}. Falling back to gTTS.")
#             # Fallback to original gTTS
#             try:
#                 tts = gTTS(text=text, lang='en', slow=False)
#                 with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
#                     audio_file = tmp_file.name
#                     tts.save(audio_file)
#                 # Play with subprocess for interrupt
#                 if sys.platform == 'darwin':
#                     self.speaking_process = subprocess.Popen(['afplay', audio_file])
#                     self.speaking_process.wait()
#                 # ... similar for other platforms
#                 if cleanup and os.path.exists(audio_file):
#                     os.remove(audio_file)
#             except:
#                 print("📝 Double fallback: Response displayed in text only")
    
#     def _listen_for_interrupt_during_speech(self):
#         """Concurrent listening for interrupt phrase during speech"""
#         try:
#             text = self.listen_for_speech(timeout=5, phrase_time_limit=5)  # Short listen
#             if text and self.interrupt_phrase in text:
#                 print("Interrupt detected! Stopping speech.")
#                 if self.speaking_process:
#                     self.speaking_process.terminate()  # Stop playback
#                 self.interrupt_event.set()  # Signal interrupt
#         except:
#             pass  # Ignore errors during concurrent listen
    
#     def format_response_for_speech(self, response_text):
#         """Format the RAG response for more natural speech"""
#         response_text = response_text.strip()
        
#         # Extract everything after 'Final Answer:' if present
#         if 'final answer:' in response_text.lower():
#             final_part = response_text.lower().split('final answer:')[-1].strip()
#             # Clean up any remaining formatting
#             final_part = final_part.replace('**', '').replace('*', '').replace('#', '').replace('\\n', ' ').strip()
#             return final_part if final_part else "I found some information, but let's try rephrasing your question."
        
#         # If no 'Final Answer', clean the entire response
#         cleaned = response_text.replace('**', '').replace('*', '').replace('#', '').replace('\\n', ' ').strip()
#         # Limit length
#         if len(cleaned) > 600:
#             sentences = cleaned.split('. ')
#             cleaned = '. '.join(sentences[-5:])  # Last 5 sentences
#         return cleaned if cleaned else "I found some information, but let's try rephrasing your question."
    
#     def process_query(self, query):
#         """Process user query through RAG engine"""
#         try:
#             print("🔍 Searching your knowledge base...")
#             result = self.rag_engine.query(query, history=self.history)
            
#             response = result['response']
#             contexts = result.get('contexts', [])
            
#             print(f"📚 Found {len(contexts)} relevant sources")
#             print(f"🤖 Raw Response: {response}")
            
#             # Format for speech
#             speech_response = self.format_response_for_speech(response)
#             print(f"🗣️ Formatted Speech: {speech_response}")
            
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
#                 sleep_msg = "Going to sleep mode. Say a wake word to activate me."
#                 print(f"😴 {sleep_msg}")
#                 self.speak_text(sleep_msg)
#             return True
        
#         # Process as regular query
#         response = self.process_query(text)
#         self.speak_text(response)
#         self.history.append({"role": "user", "content": text})
#         self.history.append({"role": "assistant", "content": response})
#         self.conversation_count += 1
        
#         # Multi-turn prompt
#         self.speak_text("Anything else I can help with?")
        
#         return True
    
#     def run(self):
#         """Main application loop with continuous hotword listening"""
#         welcome_msg = """Welcome to your Personal Voice RAG Assistant! 
#         I can answer questions about your personal knowledge base using voice commands.
        
#         Commands:
#         - Ask any question naturally
#         - Say 'go to sleep' to pause listening
#         - Say a wake word like 'porcupine' to wake up
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
#                 if self.porcupine:
#                     # Continuous hotword listening
#                     # pcm = self.audio_stream.read(self.porcupine.frame_length)
#                     try:
#                         pcm = self.audio_stream.read(
#                                 self.porcupine.frame_length,
#                                 exception_on_overflow=False
#                             )
#                     except OSError as e:
#                         print("⚠️ Audio input overflow, skipping frame.")
#                         time.sleep(0.01)
#                         continue
#                     pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
#                     keyword_index = self.porcupine.process(pcm)
#                     if keyword_index >= 0:
#                         print(f"Wake word '{self.wake_keywords[keyword_index]}' detected!")
#                         self.is_active = True  # Wake if asleep
#                 else:
#                     # Fallback to old timeout listen
#                     time.sleep(1)  # Poll less aggressively
                
#                 if self.is_active:
#                     text = self.listen_for_speech(timeout=10, phrase_time_limit=15)
#                     if self.is_active and not self.suppress_listening:
#                         text = self.listen_for_speech(timeout=10, phrase_time_limit=15)
#                     if text and self.last_spoken_text and self.last_spoken_text in text:
#                         print("⚠️ Heard our own TTS—ignoring and listening again.")
#                         continue
#                     if text:
#                         consecutive_failures = 0
#                         should_continue = self.handle_command(text)
#                         if not should_continue:
#                             break
#                         print("\n" + "-"*50 + "\n")
#                     else:
#                         consecutive_failures += 1
#                         if consecutive_failures >= max_consecutive_failures:
#                             print("⚠️ Multiple listening failures. Checking microphone...")
#                             self.speak_text("Having trouble hearing you. Please check your microphone.")
#                             consecutive_failures = 0
                
#         except KeyboardInterrupt:
#             print("\n\n👋 Application interrupted. Goodbye!")
#             self.speak_text("Goodbye!")
#         except Exception as e:
#             print(f"❌ Application error: {e}")
#             self.speak_text("I encountered an error. Goodbye!")
#         finally:
#             # Cleanup Porcupine
#             if self.porcupine:
#                 self.porcupine.delete()
#             if self.audio_stream:
#                 self.audio_stream.close()
#             if self.pa:
#                 self.pa.terminate()
#             time.sleep(self.post_speak_pause)
#             self.suppress_listening = False
        
#         print(f"\n📊 Session complete. Processed {self.conversation_count} queries.")

# def main():
#     """Main function"""
#     if AUDIO_BACKEND is None:
#         print("❌ No audio backend available. Please install playsound or ensure system audio tools are available.")
#         print("💡 Try: pip install playsound")
#         sys.exit(1)
    
#     print(f"🔊 Using audio backend: {AUDIO_BACKEND}")
    
#     assistant = VoiceRAGAssistant()
#     assistant.run()

# if __name__ == "__main__":
#     main()
import speech_recognition as sr
import os
import sys
import time
import tempfile
import openai
from rag_engine import RAGEngine
import subprocess
from gtts import gTTS  # Whisper TTS fallback
import logging
from colorama import init, Fore, Style

# Initialize color logging
init(autoreset=True)
logger = logging.getLogger("VoiceRAG")
handler = logging.StreamHandler()
formatter = logging.Formatter(f"%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

# Audio backend
AUDIO_BACKEND = 'system'

class VoiceRAGAssistant:
    def __init__(self):
        logger.info(Fore.CYAN + "🚀 Initializing Voice RAG Assistant...")
        # Initialize RAG
        try:
            self.rag_engine = RAGEngine()
            self.client = self.rag_engine.client
            logger.info(Fore.GREEN + "✅ RAG Engine loaded successfully")
        except Exception as e:
            logger.error(Fore.RED + f"❌ Failed to initialize RAG Engine: {e}")
            sys.exit(1)
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone(sample_rate=16000, chunk_size=1024)
        # Ambient noise adjustment
        logger.info(Fore.CYAN + "🎤 Calibrating microphone for ambient noise...")
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=2)
        logger.info(Fore.GREEN + "✅ Microphone calibrated")
        # State
        self.suppress_listening = False

    def listen(self, timeout=10, phrase_time_limit=15):
        if self.suppress_listening:
            return None
        with self.microphone as source:
            logger.info(Fore.CYAN + "🎤 Listening for query...")
            try:
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            except sr.WaitTimeoutError:
                return None
        # Save and transcribe
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            tmp.write(audio.get_wav_data())
            path = tmp.name
        try:
            with open(path, 'rb') as f:
                transcript = self.client.audio.transcriptions.create(
                    model='whisper-1', file=f, language='en')
            text = transcript.text.strip().lower()
            logger.info(Fore.YELLOW + f"🗣️ You said: '{text}'")
        except Exception as e:
            logger.warning(Fore.MAGENTA + f"⚠️ Transcription error: {e}")
            text = None
        finally:
            os.remove(path)
        return text

    def speak(self, text):
        if not text:
            return
        # disable listening
        self.suppress_listening = True
        path = None
        try:
            # Try OpenAI TTS
            resp = self.client.audio.speech.create(model='tts-1', voice='echo', input=text)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
                tmp.write(resp.content)
                path = tmp.name
            logger.info(Fore.CYAN + "🔊 Speaking response with OpenAI TTS...")
        except Exception as e:
            logger.warning(Fore.MAGENTA + f"⚠️ OpenAI TTS error: {e}. Falling back to gTTS.")
            tts = gTTS(text=text, lang='en', slow=False)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
                tts.save(tmp.name)
                path = tmp.name
            logger.info(Fore.CYAN + "🔊 Speaking response with gTTS fallback...")
        # Play audio
        if path:
            try:
                if sys.platform == 'darwin':
                    proc = subprocess.Popen(['afplay', path])
                else:
                    proc = subprocess.Popen(['mpg123', path])
                proc.wait()
            except Exception as e:
                logger.error(Fore.RED + f"⚠️ Playback error: {e}")
            finally:
                if os.path.exists(path):
                    os.remove(path)
        # small pause to avoid self-hear
        time.sleep(1)
        self.suppress_listening = False

    def process(self, query):
        # Show prompt details
        logger.debug(Fore.BLUE + f"📝 Prompt: {query}")
        logger.info(Fore.CYAN + "🔍 Searching knowledge base...")
        try:
            result = self.rag_engine.query(query)
            resp = result.get('response', "Sorry, I couldn't find an answer.")
            logger.info(Fore.GREEN + "✅ Query processed successfully")
        except Exception as e:
            logger.error(Fore.RED + f"❌ Query error: {e}")
            resp = "Sorry, I couldn't process that."
        return resp

    def run(self):
        logger.info(Fore.CYAN + "Voice RAG Assistant is running. Say 'quit' to exit.")
        while True:
            text = self.listen()
            if not text:
                continue
            # offer modifier prompt
            modifier = input(Fore.BLUE + "📝 Modify prompt? (e.g., 'make shorter') or press Enter: ")
            if modifier.strip():
                text = f"{text} {modifier.strip()}"
                logger.debug(Fore.BLUE + f"📝 Modified Prompt: {text}")
            if any(cmd in text for cmd in ['quit', 'exit', 'goodbye']):
                self.speak("Goodbye!")
                break
            response = self.process(text)
            self.speak(response)

if __name__ == '__main__':
    VoiceRAGAssistant().run()
